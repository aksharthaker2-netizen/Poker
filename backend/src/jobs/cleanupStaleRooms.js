// src/jobs/cleanupStaleRooms.js
const roomManager = require('../managers/roomManager');
const persistenceService = require('../services/persistenceService');

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours untouched
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // check every 15 minutes

/**
 * roomManager.rooms is an in-memory Map with no other expiry mechanism —
 * a room whose host creates it and never returns (or a game that ends
 * with everyone just closing the tab without triggering leaveRoom for
 * some reason) would otherwise sit there forever. Only prunes WAITING
 * rooms that never started; PLAYING rooms are already actively
 * supervised by the disconnect-handling / auto-fold logic in
 * gameFlowManager.js, so they're left alone here.
 */
function startCleanupJob() {
  setInterval(() => {
    const now = Date.now();
    let pruned = 0;

    for (const [roomId, room] of roomManager.rooms.entries()) {
      const age = now - (room._createdAtMs || now);
      if (room.status === 'WAITING' && age > STALE_THRESHOLD_MS) {
        if (room.game) persistenceService.markGameEnded(room); // fire-and-forget, shouldn't normally apply to WAITING rooms
        roomManager.rooms.delete(roomId);
        pruned += 1;
      }
    }

    if (pruned > 0) {
      console.log(`[Cleanup] Pruned ${pruned} stale room(s)`);
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startCleanupJob };