// src/config/redis.js
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * General-purpose client for ordinary GET/SET/DEL commands — used by
 * presenceManager, and anywhere else that needs state shared across
 * multiple backend instances (which a plain in-memory Map, like
 * roomManager.rooms still uses, can never provide).
 */
const redisClient = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000)
});

redisClient.on('error', (err) => console.error('[Redis] Client error:', err.message));
redisClient.on('connect', () => console.log('[Redis] Connected'));

/**
 * Socket.IO's Redis adapter needs TWO dedicated connections — a
 * publisher and a subscriber. A connection in subscribe mode can't also
 * run ordinary commands, so these must be separate from redisClient
 * above, not shared with it. See socket/index.js for where these get
 * wired into io.adapter() — that's what actually lets GAME_STATE_UPDATED
 * etc. reach a socket connected to a DIFFERENT backend instance than the
 * one that emitted it, which is the entire reason to run Redis here.
 */
function createAdapterClients() {
  const pubClient = new Redis(REDIS_URL);
  const subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('[Redis] Adapter pub client error:', err.message));
  subClient.on('error', (err) => console.error('[Redis] Adapter sub client error:', err.message));

  return { pubClient, subClient };
}

module.exports = { redisClient, createAdapterClients };