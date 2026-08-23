// src/managers/roomManager.js
const crypto = require('crypto');
const GameEngine = require('../gameEngine/gameEngine');
const seatManager = require('./seatManager');
const persistenceService = require('../services/persistenceService');

class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  /**
   * Generates a secure, readable 6-character uppercase alphanumeric code.
   */
  generateRoomCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
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
      roomId = this.generateRoomCode();
    } while (this.rooms.has(roomId));

    const newRoom = {
      id: roomId,
      dbId: null, // set below once the DB write resolves
      hostId,
      settings: { ...settings, maxPlayers, bigBlind, startingChips },
      seats: seatManager.initializeSeats(maxPlayers),
      game: null,
      status: 'WAITING',
      disconnectedPlayerIds: new Set()
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
   */
  markDisconnected(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) room.disconnectedPlayerIds.add(userId);
  }

  /**
   * Clears a player's disconnected flag (e.g. on reconnect).
   */
  markReconnected(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (room) room.disconnectedPlayerIds.delete(userId);
  }

  /**
   * Instantiates the GameEngine using the strict table-order of the seats.
   */
  startGame(roomId) {
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
    return { room, initialGameState };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
}

module.exports = new RoomManager();