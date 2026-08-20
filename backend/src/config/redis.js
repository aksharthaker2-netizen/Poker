// src/config/redis.js
const { createClient } = require('redis');
const env = require('./env');

const redisClient = createClient({
  url: env.REDIS_URL
});

redisClient.on('error', (err) => console.error('[Redis] Client Error:', err));
redisClient.on('connect', () => console.log('[Redis] Successfully connected to Redis'));
redisClient.on('reconnecting', () => console.warn('[Redis] Reconnecting...'));

// We don't connect automatically here; we will call connect() in server.js
module.exports = redisClient;