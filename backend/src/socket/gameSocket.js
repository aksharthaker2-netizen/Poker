// src/socket/gameSocket.js
const roomManager = require('../managers/roomManager');
const { broadcastAndCheckBot } = require('./gameFlowManager');

module.exports = function registerGameHandlers(io, socket) {
  // Trusted identity, verified once by socketAuthMiddleware at connection.
  // NEVER read the acting player's id from payload.userId — a client could
  // send any id and act (fold/raise/etc) on another player's behalf.
  const userId = socket.data.userId;

  socket.on('PLAYER_ACTION', async (payload, callback) => {
    try {
      const { roomId, action, additionalChips = 0 } = payload;

      const room = roomManager.getRoom(roomId);
      if (!room) throw new Error('Room not found.');
      if (room.status !== 'PLAYING' || !room.game) throw new Error('Game is not currently active.');

      // 1. Pass the human's action into the master orchestrator
      const actionResult = room.game.handlePlayerAction(userId, action, additionalChips);
      console.log(`[Game] Room ${roomId} | Player ${userId} | Action: ${action}`);

      // 2. Immediately acknowledge success to the frontend button click
      if (typeof callback === 'function') {
        callback({ success: true });
      }

      // 3. Blast the human's move and kick off the shared bot/disconnect loop
      await broadcastAndCheckBot(io, roomId, actionResult);
    } catch (error) {
      console.error('[Game Error - Action]', error.message);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });
};