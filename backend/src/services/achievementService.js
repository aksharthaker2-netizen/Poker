// src/services/achievementService.js
const prisma = require('../config/db');

const ACHIEVEMENTS = {
  FIRST_WIN: 'FIRST_WIN',
  WIN_STREAK_5: 'WIN_STREAK_5',
  HANDS_100: 'HANDS_100',
  BEAT_5_BOTS: 'BEAT_5_BOTS',
  BEAT_9_BOTS: 'BEAT_9_BOTS'
};

async function unlock(userId, key) {
  try {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return; // not seeded (run `npx prisma db seed`) — no-op rather than crash

    // Unique constraint on [userId, achievementId] means this is safe to
    // call every time the condition is met, not just the first time —
    // upsert's `update: {}` is a harmless no-op if already unlocked.
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id },
      update: {}
    });
  } catch (error) {
    console.error(`[Achievements] Failed to unlock ${key} for ${userId}:`, error.message);
  }
}

/**
 * Called once per human seat right after their PlayerStats row is
 * updated for a completed hand.
 *
 * @param {String} userId
 * @param {Boolean} won - did this seat win a pot this hand
 * @param {Object} stats - the FRESH PlayerStats row (post-increment), so
 *   thresholds compare against up-to-date totals rather than stale ones
 * @param {Number} botCount - how many bot seats were at the table this hand
 */
async function checkHandAchievements({ userId, won, stats, botCount }) {
  if (won && stats.handsWon === 1) {
    await unlock(userId, ACHIEVEMENTS.FIRST_WIN);
  }
  if (stats.currentStreak >= 5) {
    await unlock(userId, ACHIEVEMENTS.WIN_STREAK_5);
  }
  if (stats.handsPlayed >= 100) {
    await unlock(userId, ACHIEVEMENTS.HANDS_100);
  }
  if (won && botCount >= 5) {
    await unlock(userId, ACHIEVEMENTS.BEAT_5_BOTS);
  }
  if (won && botCount >= 9) {
    await unlock(userId, ACHIEVEMENTS.BEAT_9_BOTS);
  }
}

module.exports = { ACHIEVEMENTS, unlock, checkHandAchievements };