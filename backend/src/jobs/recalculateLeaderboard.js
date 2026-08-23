// src/jobs/recalculateLeaderboard.js
const prisma = require('../config/db');

const SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000; // hourly is plenty fresh for weekly/monthly views

/**
 * NOTE on WEEKLY/MONTHLY: this filters by `updatedAt >= since`, which is
 * an approximation of "active in this period" (User.updatedAt bumps on
 * any profile write, including rating changes from persistCompletedHand).
 * It is NOT the same as "rating gained during this period specifically" —
 * a true period-scoped rating would need to snapshot each user's rating
 * at period start and diff against it. Good enough for a first version;
 * flagging honestly rather than pretending it's more precise than it is.
 */
async function snapshotPeriod(period, since) {
  const users = await prisma.user.findMany({
    where: { isBanned: false, ...(since ? { updatedAt: { gte: since } } : {}) },
    orderBy: { rating: 'desc' },
    take: 100,
    select: { id: true, rating: true }
  });

  await prisma.leaderboardEntry.deleteMany({ where: { period } });

  if (users.length > 0) {
    await prisma.leaderboardEntry.createMany({
      data: users.map((u, i) => ({ userId: u.id, period, rating: u.rating, rank: i + 1 }))
    });
  }
}

async function recalculateLeaderboards() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    await snapshotPeriod('WEEKLY', weekAgo);
    await snapshotPeriod('MONTHLY', monthAgo);
    // GLOBAL is intentionally NOT snapshotted here — leaderboardController
    // queries User.rating live for GLOBAL to avoid up-to-an-hour staleness
    // on the leaderboard players look at most often.

    console.log('[Leaderboard] Weekly/Monthly snapshots recalculated');
  } catch (error) {
    console.error('[Leaderboard] Recalculation failed:', error.message);
  }
}

function startLeaderboardJob() {
  recalculateLeaderboards(); // run once at boot so snapshots exist immediately
  setInterval(recalculateLeaderboards, SNAPSHOT_INTERVAL_MS);
}

module.exports = { startLeaderboardJob, recalculateLeaderboards };