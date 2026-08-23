// src/controllers/userController.js
const prisma = require('../config/db');

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        rating: true,
        chipsBalance: true,
        createdAt: true,
        stats: true,
        userAchievements: {
          select: {
            unlockedAt: true,
            achievement: { select: { key: true, title: true, description: true, iconUrl: true } }
          },
          orderBy: { unlockedAt: 'desc' }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('[User] getProfile error:', error.message);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
}

async function getStats(req, res) {
  try {
    const { userId } = req.params;
    const stats = await prisma.playerStats.findUnique({ where: { userId } });

    if (!stats) return res.status(404).json({ error: 'Stats not found' });
    return res.json(stats);
  } catch (error) {
    console.error('[User] getStats error:', error.message);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}

module.exports = { getProfile, getStats };