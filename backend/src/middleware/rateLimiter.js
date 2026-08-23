// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

/**
 * Factory so each route can set its own window/max — auth endpoints need
 * a much tighter limit than general API traffic since they're the
 * classic brute-force target.
 */
function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });
}

module.exports = rateLimiter;