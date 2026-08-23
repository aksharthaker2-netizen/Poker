// src/controllers/roomController.js
const prisma = require('../config/db');

/**
 * NOTE: this is a READ-ONLY history view over the `rooms` table.
 * Room *creation/joining/live seat state* stays entirely socket-driven
 * (roomSocket.js + the in-memory roomManager) — that's still the source
 * of truth while a room is active, since seats aren't persisted (see
 * HandAction.seatId's schema comment).
 *
 * Known gap: `Room.status` in the DB is only ever set to WAITING at
 * creation time (persistenceService.createRoomRecord) and never updated
 * when a game actually starts/ends — so this table's `status` column is
 * NOT reliable for "is this room live right now". Flagging honestly
 * rather than having this endpoint quietly lie; fixing it means having
 * roomManager.startGame()/markGameEnded() also update Room.status in the
 * DB, which is a small follow-up, not done here.
 */
async function getMyRooms(req, res) {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20);

    const rooms = await prisma.room.findMany({
      where: { hostId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { _count: { select: { games: true } } }
    });

    return res.json({ rooms });
  } catch (error) {
    console.error('[Room] getMyRooms error:', error.message);
    return res.status(500).json({ error: 'Failed to load rooms' });
  }
}

module.exports = { getMyRooms };