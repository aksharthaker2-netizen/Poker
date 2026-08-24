// src/repositories/userRepository.js
const prisma = require('../config/db');

function findById(userId) {
  return prisma.user.findUnique({ where: { id: userId } });
}

function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

function findByUsernameOrEmail(username, email) {
  return prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
}

function create({ username, email, passwordHash }) {
  return prisma.user.create({ data: { username, email, passwordHash } });
}

function createStatsRow(userId) {
  return prisma.playerStats.create({ data: { userId } });
}

function getProfileById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
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
}

function searchByUsername(query, excludeUserId, limit = 20) {
  return prisma.user.findMany({
    where: {
      username: { contains: query, mode: 'insensitive' },
      id: { not: excludeUserId },
      isBanned: false
    },
    select: { id: true, username: true, avatarUrl: true, rating: true },
    take: limit
  });
}

function findTopByRating(limit = 50) {
  return prisma.user.findMany({
    where: { isBanned: false },
    orderBy: { rating: 'desc' },
    take: limit,
    select: { id: true, username: true, rating: true, avatarUrl: true }
  });
}

function updateLastSeen(userId) {
  return prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
}

function incrementRating(userId, delta) {
  return prisma.user.update({ where: { id: userId }, data: { rating: { increment: delta } } });
}

function findStats(userId) {
  return prisma.playerStats.findUnique({ where: { userId } });
}

function upsertStats(userId, createData, updateData) {
  return prisma.playerStats.upsert({ where: { userId }, create: createData, update: updateData });
}

function findLeaderboardSnapshot(period, limit = 50) {
  return prisma.leaderboardEntry.findMany({
    where: { period },
    orderBy: { rank: 'asc' },
    take: limit,
    include: { user: { select: { username: true, avatarUrl: true } } }
  });
}

async function replaceLeaderboardSnapshot(period, entries) {
  await prisma.leaderboardEntry.deleteMany({ where: { period } });
  if (entries.length > 0) {
    await prisma.leaderboardEntry.createMany({ data: entries });
  }
}

function findActiveSince(since, limit = 100) {
  return prisma.user.findMany({
    where: { isBanned: false, updatedAt: { gte: since } },
    orderBy: { rating: 'desc' },
    take: limit,
    select: { id: true, rating: true }
  });
}

module.exports = {
  findById,
  findByEmail,
  findByUsernameOrEmail,
  create,
  createStatsRow,
  getProfileById,
  searchByUsername,
  findTopByRating,
  updateLastSeen,
  incrementRating,
  findStats,
  upsertStats,
  findLeaderboardSnapshot,
  replaceLeaderboardSnapshot,
  findActiveSince
};