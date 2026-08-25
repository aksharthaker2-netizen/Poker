// src/managers/roomManager.js
const GameEngine = require('../gameEngine/gameEngine');
const seatManager = require('./seatManager');
const persistenceService = require('../services/persistenceService');
const { generateRoomCode } = require('../utils/roomCodeGenerator');
const { DISCONNECT_GRACE_MS } = require('../utils/constants');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  /**
   * Creates a new multiplayer table with a fixed number of physical seats.
   *
   * FIX: now async — it also creates the backing DB `Room` row (see
   * persistenceService.createRoomRecord) so that later Game/Hand writes
   * have a real `Room.id` to satisfy the Game.roomId foreign key. The
   * in-memory `room.id` stays the human-facing 6-char join code; the
   * real DB uuid is cached as `room.dbId`.
   */
  async createRoom(hostId, settings = {}) {
    const maxPlayers = Math.min(10, Math.max(2, Number(settings.maxPlayers) || 6));
    const bigBlind = Math.max(2, Number(settings.bigBlind) || 20);
    const startingChips = Number(settings.startingChips) || 1000;

    let roomId;
    do {
      roomId = generateRoomCode();
    } while (this.rooms.has(roomId));

    const newRoom = {
      id: roomId,
      dbId: null, // set below once the DB write resolves
      hostId,
      settings: { ...settings, maxPlayers, bigBlind, startingChips },
      seats: seatManager.initializeSeats(maxPlayers),
      game: null,
      status: 'WAITING',
      // Map<userId, disconnectedAtMs> — a Map (not Set) so we can tell
      // WHEN someone disconnected, needed for grace-period pruning below.
      disconnectedPlayerIds: new Map(),
      _createdAtMs: Date.now() // used by jobs/cleanupStaleRooms.js to prune abandoned rooms
    };

    this.rooms.set(roomId, newRoom);

    // Persistence is best-effort and must never block room creation — if
    // it fails, the room still works entirely in-memory, it just won't
    // have hand history/stats written for it (persistenceService no-ops
    // safely when dbId is null).
    newRoom.dbId = await persistenceService.createRoomRecord({
      code: roomId,
      hostId,
      settings: newRoom.settings
    });

    return newRoom;
  }

  /**
   * Adds a player (or bot) to a specific room, assigning them a physical seat.
   */
  joinRoom(roomId, player, requestedSeat = null) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');

    // Prevent duplicate joins
    const currentPlayers = seatManager.getActivePlayers(room);
    if (currentPlayers.some(p => p.id === player.id)) {
      throw new Error('Player is already in this room.');
    }

    const playerObj = {
      id: player.id,
      username: player.username,
      chips: player.chips || 1000,
      status: 'WAITING',
      isBot: player.isBot || false
    };

    // This assigns the player to the array and throws if the table is full
    seatManager.takeSeat(room, playerObj, requestedSeat);

    // A reconnecting human who rejoins the same room should no longer be
    // treated as disconnected.
    room.disconnectedPlayerIds.delete(player.id);

    return room;
  }

  /**
   * Handles a player leaving, clearing their physical seat without shifting others.
   */
  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Clear the specific array index
    seatManager.leaveSeat(room, playerId);
    room.disconnectedPlayerIds.delete(playerId);

    const remainingPlayers = seatManager.getActivePlayers(room);

    // If the room is now empty, destroy it to prevent memory leaks
    if (remainingPlayers.length === 0) {
      if (room.game) persistenceService.markGameEnded(room); // fire-and-forget, never blocks cleanup
      this.rooms.delete(roomId);
      return { destroyed: true };
    }

    // FIX: a room with only bots left (every human has quit/disconnected
    // permanently) has no one who can authenticate as host, so ADD_BOT and
    // START_GAME would become permanently unusable. Tear it down instead
    // of leaving an orphaned bot-only table running.
    const hasRemainingHuman = remainingPlayers.some(p => !p.isBot);
    if (!hasRemainingHuman) {
      if (room.game) persistenceService.markGameEnded(room);
      this.rooms.delete(roomId);
      return { destroyed: true };
    }

    // If the host left, reassign host privileges to the next HUMAN in
    // table order (never to a bot — a bot has no real session to act as host).
    if (room.hostId === playerId) {
      const nextHuman = remainingPlayers.find(p => !p.isBot);
      room.hostId = nextHuman.id;
    }

    return { destroyed: false, room };
  }

  /**
   * Marks a seated human as disconnected without removing their seat, so
   * the game loop can auto-fold them on their turn instead of stalling.
   * Records the timestamp so pruneDisconnectedPlayers can enforce a
   * reconnect grace period.
   */
  markDisconnected(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) room.disconnectedPlayerIds.set(userId, Date.now());
  }

  /**
   * Clears a player's disconnected flag (e.g. on reconnect).
   */
  markReconnected(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) room.disconnectedPlayerIds.delete(userId);
  }

  /**
   * Permanently removes anyone who's been disconnected past the grace
   * period — frees their seat, reassigns host if needed, destroys the
   * room if nobody human is left.
   *
   * CRITICAL SAFETY CONSTRAINT: this must ONLY ever be called when no
   * hand is actively in progress for this room (i.e. `room.status ===
   * 'WAITING'`, or the brief between-hands window in
   * gameFlowManager.scheduleNextHand right before startHand() runs).
   * Removing a player from `room.game.players` mid-hand would break
   * showdown payouts — GameEngine.evaluateShowdown looks up
   * `this.players.find(p => p.id === winnerId)` to credit chips, and if
   * that player was already spliced out, their winnings silently
   * vanish (the `if (playerObj)` guard there swallows it instead of
   * crashing, which makes the bug even easier to miss). Callers are
   * responsible for only invoking this in a safe window.
   */
  pruneDisconnectedPlayers(room, graceMs = DISCONNECT_GRACE_MS) {
    const now = Date.now();
    const prunedIds = [];

    for (const [userId, disconnectedAt] of room.disconnectedPlayerIds.entries()) {
      if (now - disconnectedAt < graceMs) continue; // still within grace period

      seatManager.leaveSeat(room, userId);
      room.disconnectedPlayerIds.delete(userId);
      prunedIds.push(userId);

      if (room.game) {
        room.game.players = room.game.players.filter((p) => p.id !== userId);
        room.game.turnManager.removePlayer(userId); // safe no-op if not currently tracked
      }
    }

    if (prunedIds.length === 0) return { prunedIds, destroyed: false };

    const remainingPlayers = seatManager.getActivePlayers(room);

    if (remainingPlayers.length === 0) {
      if (room.game) persistenceService.markGameEnded(room);
      this.rooms.delete(room.id);
      return { prunedIds, destroyed: true };
    }

    const hasRemainingHuman = remainingPlayers.some((p) => !p.isBot);
    if (!hasRemainingHuman) {
      if (room.game) persistenceService.markGameEnded(room);
      this.rooms.delete(room.id);
      return { prunedIds, destroyed: true };
    }

    if (prunedIds.includes(room.hostId)) {
      const nextHuman = remainingPlayers.find((p) => !p.isBot);
      room.hostId = nextHuman.id;
    }

    return { prunedIds, destroyed: false };
  }

  /**
   * Instantiates the GameEngine using the strict table-order of the seats.
   *
   * FIX: now async — also syncs the DB Room.status to 'ACTIVE' so
   * roomController.getMyRooms (REST) isn't permanently stuck showing
   * 'WAITING' for every room that has actually started playing.
   */
  async startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');

    // Extract an ordered array of just the human/bot objects (skipping nulls)
    const activePlayers = seatManager.getActivePlayers(room);

    if (activePlayers.length < 2) throw new Error('At least 2 players are required to start.');
    if (room.status === 'PLAYING') throw new Error('Game is already in progress.');

    // Pass the perfectly ordered players array to the GameEngine
    room.game = new GameEngine(roomId, activePlayers, room.settings.bigBlind);
    room.status = 'PLAYING';

    const initialGameState = room.game.startHand();

    // Best-effort, non-blocking — the game has already started in-memory
    // regardless of whether this DB write succeeds.
    persistenceService.updateRoomStatus(room, 'ACTIVE');

    return { room, initialGameState };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
}

module.exports = new RoomManager();