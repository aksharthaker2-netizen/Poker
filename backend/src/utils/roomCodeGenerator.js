// src/utils/roomCodeGenerator.js
const crypto = require('crypto');

/**
 * Generates a 6-character uppercase alphanumeric join code. Extracted out
 * of roomManager.js so it's independently reusable/testable rather than
 * a private method on the manager.
 */
function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

module.exports = { generateRoomCode };