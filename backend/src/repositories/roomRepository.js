// src/repositories/roomRepository.js
const prisma = require('../config/db');

function create({ code, hostId, maxPlayers, bigBlind, smallBlind, startingChips }) {
  return prisma.room.create({
    data: { code, hostId, maxPlayers, bigBlind, smallBlind, startingChips, status: 'WAITING' }
  });
}

function updateStatus(roomDbId, status) {
  return prisma.room.update({
    where: { id: roomDbId },
    data: {
      status,
      ...(status === 'ACTIVE' ? { startedAt: new Date() } : {}),
      ...(status === 'ENDED' ? { endedAt: new Date() } : {})
    }
  });
}

function findManyByHost(hostId, limit = 20) {
  return prisma.room.findMany({
    where: { hostId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { _count: { select: { games: true } } }
  });
}

module.exports = { create, updateStatus, findManyByHost };