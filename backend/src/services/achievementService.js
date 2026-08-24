// src/services/achievementService.js
const prisma = require('../config/db');
const { ACHIEVEMENT_KEYS } = require('../utils/constants');

async function unlock(userId, key) {
  try {
    const achievement = await prisma.achievement.findUnique({ where: { key } });
    if (!achievement) return; // not seeded (run `npx prisma db seed`) — no-op rather than crash

    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      create: { userId, achievementId: achievement.id },
      update: {}
    });
  } catch (error) {
    console.error(`[Achievements] Failed to unlock ${key} for ${userId}:`, error.message);
  }
}

async function checkHandAchievements({ userId, won, stats, botCount }) {
  if (won && stats.handsWon === 1) {
    await unlock(userId, ACHIEVEMENT_KEYS.FIRST_WIN);
  }
  if (stats.currentStreak >= 5) {
    await unlock(userId, ACHIEVEMENT_KEYS.WIN_STREAK_5);
  }
  if (stats.handsPlayed >= 100) {
    await unlock(userId, ACHIEVEMENT_KEYS.HANDS_100);
  }
  if (won && botCount >= 5) {
    await unlock(userId, ACHIEVEMENT_KEYS.BEAT_5_BOTS);
  }
  if (won && botCount >= 9) {
    await unlock(userId, ACHIEVEMENT_KEYS.BEAT_9_BOTS);
  }
}

module.exports = { unlock, checkHandAchievements };