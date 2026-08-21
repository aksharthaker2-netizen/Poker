// src/managers/presenceManager.js

class PresenceManager {
  constructor() {
    // Maps userId -> { socketId, status, roomId }
    this.users = new Map();
    // Maps socketId -> userId (for lightning-fast disconnect handling)
    this.sockets = new Map();
  }

  /**
   * Registers a user as ONLINE when they open the app.
   */
  connectUser(userId, socketId) {
    this.users.set(userId, { socketId, status: 'ONLINE', roomId: null });
    this.sockets.set(socketId, userId);
  }

  /**
   * Cleans up memory when a user closes their browser or loses connection.
   * @returns {String|null} The userId that just disconnected, or null.
   */
  disconnectUser(socketId) {
    const userId = this.sockets.get(socketId);
    if (userId) {
      this.users.delete(userId);
      this.sockets.delete(socketId);
    }
    return userId;
  }

  /**
   * Updates a user's status when they join a table.
   */
  setInGame(userId, roomId) {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'IN_GAME';
      user.roomId = roomId;
    }
  }

  /**
   * Updates a user's status when they leave a table.
   */
  setOnline(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'ONLINE';
      user.roomId = null;
    }
  }

  /**
   * Retrieves the current socket connection for a specific user.
   */
  getSocketId(userId) {
    const user = this.users.get(userId);
    return user ? user.socketId : null;
  }

  /**
   * FIX: safe accessor for a user's full presence record, so callers
   * (e.g. socket/index.js's disconnect handler) don't need to reach into
   * `presenceManager.users` directly — that couples them to the internal
   * Map implementation and makes it easy to accidentally mutate it.
   */
  getUser(userId) {
    return this.users.get(userId) || null;
  }
}

module.exports = new PresenceManager();