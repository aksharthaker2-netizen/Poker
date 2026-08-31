// src/utils/socketRateLimiter.js

// key -> { count, windowStart }
const buckets = new Map();

/**
 * Simple fixed-window rate limiter for socket event handlers. Socket.io
 * has no built-in per-event rate limiting the way Express has
 * express-rate-limit, and a malicious/buggy client can otherwise spam
 * any event (PLAYER_ACTION out of turn, repeated CREATE_ROOM, etc.) with
 * no throttling at all. Not as precise as a sliding window or token
 * bucket, but sufficient to stop abuse without adding a dependency.
 */
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/**
 * Throws if the caller has exceeded the limit — matches the
 * exception-based error handling every socket handler already uses.
 * @param {String} key - typically `${userId}:${eventName}`
 */
function enforceRateLimit(key, maxRequests, windowMs) {
  if (!checkRateLimit(key, maxRequests, windowMs)) {
    throw new Error('Too many requests — please slow down.');
  }
}

// Periodic cleanup so `buckets` doesn't grow unbounded with entries for
// users who disconnected long ago.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.windowStart > 10 * 60 * 1000) {
        buckets.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

module.exports = { checkRateLimit, enforceRateLimit };