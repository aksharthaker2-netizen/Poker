// src/controllers/gameController.js
const prisma = require('../config/db');

/**
 * A user's "games" = distinct Game rows where they have at least one
 * logged HandAction. There's no direct Game<->User join table (seats
 * aren't persisted — see the schema comment on HandAction.seatId), so
 * this reaches through hands.actions to find games they actually played.
 */
async function getMyGames(req, res) {
  try {
    const limit = Math.min(50, Number(req.query.limit) || 20);

    const games = await prisma.game.findMany({
      where: {
        hands: { some: { actions: { some: { userId: req.userId } } } }
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        room: { select: { code: true, bigBlind: true } },
        _count: { select: { hands: true } }
      }
    });

    return res.json({ games });
  } catch (error) {
    console.error('[Game] getMyGames error:', error.message);
    return res.status(500).json({ error: 'Failed to load game history' });
  }
}

async function getGameDetail(req, res) {
  try {
    const { gameId } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        room: { select: { code: true, bigBlind: true, hostId: true } },
        hands: {
          orderBy: { handNumber: 'asc' },
          include: { actions: { orderBy: { sequenceInHand: 'asc' } } }
        }
      }
    });

    if (!game) return res.status(404).json({ error: 'Game not found' });

    // Only let someone view a game they actually played in — prevents
    // browsing other players' hand histories by guessing/incrementing ids.
    const played = game.hands.some((h) => h.actions.some((a) => a.userId === req.userId));
    if (!played) return res.status(403).json({ error: 'Not your game' });

    return res.json({ game });
  } catch (error) {
    console.error('[Game] getGameDetail error:', error.message);
    return res.status(500).json({ error: 'Failed to load game' });
  }
}

module.exports = { getMyGames, getGameDetail };