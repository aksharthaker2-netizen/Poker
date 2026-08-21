// src/middleware/socketAuthMiddleware.js
const jwt = require('jsonwebtoken');

/**
 * Runs once per socket connection (io.use), BEFORE any event handlers.
 * Verifies the JWT and attaches the trusted identity to socket.data.
 *
 * From this point on, every handler MUST read the acting user's identity
 * from socket.data.userId — NEVER from a client-supplied payload field
 * (payload.userId, payload.user.id, etc). Payload fields are just strings
 * a malicious client can set to anyone's ID.
 */
function socketAuthMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    socket.data.userId = payload.sub || payload.userId;
    socket.data.username = payload.username;

    if (!socket.data.userId) {
      return next(new Error('Token missing user identity'));
    }

    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
}

module.exports = socketAuthMiddleware;