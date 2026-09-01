// src/repositories/gameRepository.js
const prisma = require('../config/db');

function create(roomDbId) {
  return prisma.game.create({ data: { roomId: roomDbId, status: 'IN_PROGRESS' } });
}

function updateStatus(gameDbId, status) {
  return prisma.game.update({
    where: { id: gameDbId },
    data: {
      status,
      ...(status === 'COMPLETED' || status === 'ABORTED' ? { endedAt: new Date() } : {})
    }
  });
}

function createHand({ gameId, handNumber }) {
  return prisma.hand.create({ data: { gameId, handNumber, stage: 'PRE_FLOP' } });
}

function finalizeHand(handId, data) {
  return prisma.hand.update({ where: { id: handId }, data: { ...data, endedAt: new Date() } });
}

function createHandAction(data) {
  return prisma.handAction.create({ data });
}

/**
 * Writes AI Poker Coach feedback (decisionScore/aiRecommended/
 * aiExplanation) onto a specific HandAction row — called by
 * reviewService.analyzeAndAnnotate after /analyze returns.
 */
function annotateHandAction(handActionId, data) {
  return prisma.handAction.update({ where: { id: handActionId }, data });
}

function findManyByUser(userId, limit = 20) {
  return prisma.game.findMany({
    where: { hands: { some: { actions: { some: { userId } } } } },
    orderBy: { startedAt: 'desc' },
    take: limit,
    include: {
      room: { select: { code: true, bigBlind: true } },
      _count: { select: { hands: true } }
    }
  });
}

function findByIdWithHands(gameId) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      room: { select: { code: true, bigBlind: true, hostId: true } },
      hands: {
        orderBy: { handNumber: 'asc' },
        include: { actions: { orderBy: { sequenceInHand: 'asc' } } }
      }
    }
  });
}

function findHandWithActions(handId) {
  return prisma.hand.findUnique({
    where: { id: handId },
    include: { actions: { orderBy: { sequenceInHand: 'asc' } } }
  });
}

function findReview(gameId, userId) {
  return prisma.gameReview.findUnique({ where: { gameId_userId: { gameId, userId } } });
}

function upsertReview(gameId, userId, data) {
  return prisma.gameReview.upsert({
    where: { gameId_userId: { gameId, userId } },
    create: { gameId, userId, ...data },
    update: data
  });
}

module.exports = {
  create,
  updateStatus,
  createHand,
  finalizeHand,
  createHandAction,
  annotateHandAction,
  findManyByUser,
  findByIdWithHands,
  findHandWithActions,
  findReview,
  upsertReview
};