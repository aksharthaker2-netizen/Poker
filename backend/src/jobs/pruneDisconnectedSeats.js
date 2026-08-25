// src/jobs/pruneDisconnectedSeats.js
const roomManager = require('../managers/roomManager');
const { DISCONNECT_GRACE_MS } = require('../utils/constants');

const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Frees the seats of players who disconnected from a WAITING (lobby)
 * room and never came back. This is separate from the pruning that
 * happens inline in gameFlowManager.scheduleNextHand — that path only
 * runs for PLAYING rooms, between hands. A room that's still in its
 * lobby (nobody ever clicked Start) has no "between hands" checkpoint to
 * hook into, so it needs its own periodic sweep. Safe to prune WAITING
 * rooms at any time — see roomManager.pruneDisconnectedPlayers' doc
 * comment for why the same is NOT true of PLAYING rooms.
 */
function startPruneDisconnectedSeatsJob(io) {
  setInterval(() => {
    for (const room of roomManager.rooms.values()) {
      if (room.status !== 'WAITING') continue;
      if (room.disconnectedPlayerIds.size === 0) continue;

      const { prunedIds, destroyed } = roomManager.pruneDisconnectedPlayers(room, DISCONNECT_GRACE_MS);
      if (prunedIds.length > 0 && !destroyed) {
        console.log(`[Cleanup] Freed ${prunedIds.length} disconnected seat(s) in room ${room.id}`);
        io.to(room.id).emit('ROOM_UPDATED', { room });
      }
    }
  }, CHECK_INTERVAL_MS);
}

module.exports = { startPruneDisconnectedSeatsJob };