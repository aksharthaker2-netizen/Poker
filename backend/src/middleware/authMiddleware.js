// src/middleware/authMiddleware.js
const tokenService = require('../services/tokenService');

/**
 * Protects REST routes (profile, stats, leaderboard, etc). This is the
 * REST counterpart to socketAuthMiddleware.js — same token, same secret,
 * just checked at a different transport layer.
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payload = tokenService.verifyAccessToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;