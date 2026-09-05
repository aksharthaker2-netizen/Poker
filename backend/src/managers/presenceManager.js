// src/managers/presenceManager.js
const { redisClient } = require('../config/redis');

// Safety-net TTL: if a backend process crashes without running its
// disconnect handler, a stale "online" record would otherwise sit in
// Redis forever. Refreshed on every write, so any actively-connected
// user's record never actually expires in practice.
const PRESENCE_TTL_SECONDS = 24 * 60 * 60;

const userKey = (userId) => `presence:user:${userId}`;
const socketKey = (socketId) => `presence:socket:${socketId}`;

/**
 * Redis-backed presence tracking — previously an in-memory Map, which
 * only worked correctly with exactly one backend process running. Now
 * that Socket.IO itself is Redis-adapter-backed (see socket/index.js)
 * and multiple instances can be running, presence needs to be visible
 * across ALL of them: a friend invite routed by presenceManager.getSocketId
 * has to find the right socket regardless of which instance that socket
 * happens to be connected to.
 *
 * Every method is now async — see the call sites in socket/index.js,
 * roomSocket.js, friendSocket.js, and friendController.js, all updated
 * to await these.
 */
class PresenceManager {
  async connectUser(userId, socketId) {
    const value = JSON.stringify({ socketId, status: 'ONLINE', roomId: null });
    await redisClient.set(userKey(userId), value, 'EX', PRESENCE_TTL_SECONDS);
    await redisClient.set(socketKey(socketId), userId, 'EX', PRESENCE_TTL_SECONDS);
  }

  /**
   * @returns {String|null} the userId that just disconnected, or null.
   */
  async disconnectUser(socketId) {
    const userId = await redisClient.get(socketKey(socketId));
    if (userId) {
      await redisClient.del(userKey(userId));
      await redisClient.del(socketKey(socketId));
    }
    return userId;
  }

  async setInGame(userId, roomId) {
    const user = await this.getUser(userId);
    if (!user) return;
    user.status = 'IN_GAME';
    user.roomId = roomId;
    await redisClient.set(userKey(userId), JSON.stringify(user), 'EX', PRESENCE_TTL_SECONDS);
  }

  async setOnline(userId) {
    const user = await this.getUser(userId);
    if (!user) return;
    user.status = 'ONLINE';
    user.roomId = null;
    await redisClient.set(userKey(userId), JSON.stringify(user), 'EX', PRESENCE_TTL_SECONDS);
  }

  async getSocketId(userId) {
    const user = await this.getUser(userId);
    return user ? user.socketId : null;
  }

  async getUser(userId) {
    const raw = await redisClient.get(userKey(userId));
    return raw ? JSON.parse(raw) : null;
  }
}

module.exports = new PresenceManager();