// src/controllers/roomController.js
const roomRepository = require('../repositories/roomRepository');

/**
 * READ-ONLY history view over the `rooms` table. Room
 * creation/joining/live seat state stays entirely socket-driven — this
 * is just "which rooms have I hosted, and are they active right now"
 * (Room.status is now kept in sync by persistenceService.updateRoomStatus,
 * called from roomManager.startGame() and markGameEnded()).
 */
async function getMyRooms(req, res) {
  try {
    const rooms = await roomRepository.findManyByHost(req.userId, req.query.limit);
    return res.json({ rooms });
  } catch (error) {
    console.error('[Room] getMyRooms error:', error.message);
    return res.status(500).json({ error: 'Failed to load rooms' });
  }
}

module.exports = { getMyRooms };