// src/repositories/friendRepository.js
const prisma = require('../config/db');

function findRelationship(userAId, userBId) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId }
      ]
    }
  });
}

function create(requesterId, addresseeId) {
  return prisma.friendship.create({ data: { requesterId, addresseeId, status: 'PENDING' } });
}

function reopen(friendshipId, requesterId, addresseeId) {
  return prisma.friendship.update({
    where: { id: friendshipId },
    data: { requesterId, addresseeId, status: 'PENDING' }
  });
}

function findById(friendshipId) {
  return prisma.friendship.findUnique({ where: { id: friendshipId } });
}

function updateStatus(friendshipId, status) {
  return prisma.friendship.update({ where: { id: friendshipId }, data: { status } });
}

function remove(friendshipId) {
  return prisma.friendship.delete({ where: { id: friendshipId } });
}

function listAccepted(userId) {
  return prisma.friendship.findMany({
    where: { status: 'ACCEPTED', OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true, rating: true } },
      addressee: { select: { id: true, username: true, avatarUrl: true, rating: true } }
    }
  });
}

function listPendingForUser(userId) {
  return prisma.friendship.findMany({
    where: { addresseeId: userId, status: 'PENDING' },
    include: { requester: { select: { id: true, username: true, avatarUrl: true } } }
  });
}

module.exports = {
  findRelationship,
  create,
  reopen,
  findById,
  updateStatus,
  remove,
  listAccepted,
  listPendingForUser
};