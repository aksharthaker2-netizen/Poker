// src/managers/roomManager.js
const crypto = require('crypto');
const GameEngine = require('../gameEngine/gameEngine');

class RoomManager {
  constructor() {
    // In-memory store for active rooms.
    // If you ever scale to multiple server instances, this Map would be replaced by Redis.
    this.rooms = new Map();
  }

  /**
   * Generates a secure, readable 6-character uppercase alphanumeric code.
   */
  generateRoomCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  /**
   * Creates a new multiplayer table.
   */
  createRoom(hostId, settings = { maxPlayers: 6, bigBlind: 20 }) {
    let roomId;
    // Ensure absolute uniqueness
    do {
      roomId = this.generateRoomCode();
    } while (this.rooms.has(roomId));

    const newRoom = {
      id: roomId,
      hostId,
      players: [], // Array of { id, username, chips, status }
      settings,
      game: null,  // Will hold the GameEngine instance
      status: 'WAITING'
    };

    this.rooms.set(roomId, newRoom);
    return newRoom;
  }

  /**
   * Adds a player to a specific room.
   */
  joinRoom(roomId, player) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');
    if (room.players.length >= room.settings.maxPlayers) throw new Error('Room is full.');
    if (room.players.some(p => p.id === player.id)) throw new Error('Player is already in this room.');

    room.players.push({
      id: player.id,
      username: player.username,
      chips: player.chips || 1000, // Default starting stack if none provided
      status: 'WAITING' 
    });

    return room;
  }

  /**
   * Handles a player leaving or disconnecting.
   */
  leaveRoom(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Remove the player from the room array
    room.players = room.players.filter(p => p.id !== playerId);

    // If the room is now empty, destroy it to prevent memory leaks
    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return { destroyed: true };
    } 
    
    // If the host left, dynamically reassign host privileges to the next person
    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    return { destroyed: false, room };
  }

  /**
   * Instantiates the GameEngine and begins the actual Texas Hold'em logic.
   */
  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error('Room not found.');
    if (room.players.length < 2) throw new Error('At least 2 players are required to start.');
    if (room.status === 'PLAYING') throw new Error('Game is already in progress.');
    
    // Pass the actual player array reference to the GameEngine
    room.game = new GameEngine(roomId, room.players, room.settings.bigBlind);
    room.status = 'PLAYING';
    
    const initialGameState = room.game.startHand();
    return { room, initialGameState };
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }
}

// Export a singleton instance so the entire Express/Socket server shares the same memory
module.exports = new RoomManager();