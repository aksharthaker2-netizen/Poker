// src/controllers/achievementController.js
const prisma = require('../config/db');

async function listAll(req, res) {
  try {
    const achievements = await prisma.achievement.findMany({ orderBy: { title: 'asc' } });
    return res.json({ achievements });
  } catch (error) {
    console.error('[Achievements] listAll error:', error.message);
    return res.status(500).json({ error: 'Failed to load achievements' });
  }
}

async function listMine(req, res) {
  try {
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId: req.userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' }
    });
    return res.json({ achievements: unlocked });
  } catch (error) {
    console.error('[Achievements] listMine error:', error.message);
    return res.status(500).json({ error: 'Failed to load your achievements' });
  }
}

module.exports = { listAll, listMine };