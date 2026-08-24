// src/controllers/leaderboardController.js
const userRepository = require('../repositories/userRepository');

/**
 * GLOBAL is always a live query (no staleness). WEEKLY/MONTHLY read from
 * the LeaderboardEntry snapshots jobs/recalculateLeaderboard.js maintains
 * hourly — see that file for the caveat on what "weekly/monthly" measures.
 */
async function getGlobal(req, res) {
  try {
    const period = (req.query.period || 'GLOBAL').toUpperCase();
    const limit = Math.min(100, Number(req.query.limit) || 50);

    if (period === 'GLOBAL') {
      const topUsers = await userRepository.findTopByRating(limit);
      const leaderboard = topUsers.map((u, index) => ({ rank: index + 1, ...u }));
      return res.json({ period, leaderboard });
    }

    const entries = await userRepository.findLeaderboardSnapshot(period, limit);
    const leaderboard = entries.map((e) => ({
      rank: e.rank,
      id: e.userId,
      username: e.user.username,
      avatarUrl: e.user.avatarUrl,
      rating: e.rating
    }));

    return res.json({ period, leaderboard });
  } catch (error) {
    console.error('[Leaderboard] getGlobal error:', error.message);
    return res.status(500).json({ error: 'Failed to load leaderboard' });
  }
}

module.exports = { getGlobal };