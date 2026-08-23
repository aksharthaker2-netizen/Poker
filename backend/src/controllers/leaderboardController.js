// src/controllers/leaderboardController.js
const prisma = require('../config/db');

/**
 * NOTE: this returns a live rating-ordered listing, which covers the
 * GLOBAL leaderboard correctly. WEEKLY/MONTHLY leaderboards (per the
 * original design) need periodic LeaderboardEntry snapshots written by a
 * scheduled job (jobs/recalculateLeaderboard.js) — not implemented yet.
 * For now, every period returns the same live-rating view; swap this to
 * query LeaderboardEntry once that job exists.
 */
async function getGlobal(req, res) {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 50);

    const topUsers = await prisma.user.findMany({
      where: { isBanned: false },
      orderBy: { rating: 'desc' },
      take: limit,
      select: { id: true, username: true, rating: true, avatarUrl: true }
    });

    const leaderboard = topUsers.map((u, index) => ({ rank: index + 1, ...u }));
    return res.json({ period: req.query.period || 'GLOBAL', leaderboard });
  } catch (error) {
    console.error('[Leaderboard] getGlobal error:', error.message);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
}

module.exports = { getGlobal };