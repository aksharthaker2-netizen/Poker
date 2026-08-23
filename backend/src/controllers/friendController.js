// src/controllers/friendController.js
const prisma = require('../config/db');
const presenceManager = require('../managers/presenceManager');

async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: 'insensitive' },
        id: { not: req.userId },
        isBanned: false
      },
      select: { id: true, username: true, avatarUrl: true, rating: true },
      take: 20
    });

    return res.json({ users });
  } catch (error) {
    console.error('[Friends] searchUsers error:', error.message);
    return res.status(500).json({ error: 'Search failed' });
  }
}

async function sendRequest(req, res) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: "You can't add yourself" });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // A friendship row can exist in either direction — check both.
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.userId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: req.userId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') return res.status(409).json({ error: 'Already friends' });
      if (existing.status === 'PENDING') return res.status(409).json({ error: 'Request already pending' });
      if (existing.status === 'BLOCKED') return res.status(403).json({ error: 'Cannot send request' });

      // Previously DECLINED — allow a fresh request by reusing the row.
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: { requesterId: req.userId, addresseeId: targetUserId, status: 'PENDING' }
      });
      return res.status(201).json({ friendship: updated });
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.userId, addresseeId: targetUserId, status: 'PENDING' }
    });

    return res.status(201).json({ friendship });
  } catch (error) {
    console.error('[Friends] sendRequest error:', error.message);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
}

async function respondToRequest(req, res, newStatus) {
  const { friendshipId } = req.params;
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

  if (!friendship) return res.status(404).json({ error: 'Request not found' });
  if (friendship.addresseeId !== req.userId) {
    return res.status(403).json({ error: 'Only the recipient can respond to this request' });
  }
  if (friendship.status !== 'PENDING') {
    return res.status(409).json({ error: 'Request is no longer pending' });
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: newStatus }
  });

  return res.json({ friendship: updated });
}

async function acceptRequest(req, res) {
  try {
    return await respondToRequest(req, res, 'ACCEPTED');
  } catch (error) {
    console.error('[Friends] acceptRequest error:', error.message);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
}

async function declineRequest(req, res) {
  try {
    return await respondToRequest(req, res, 'DECLINED');
  } catch (error) {
    console.error('[Friends] declineRequest error:', error.message);
    return res.status(500).json({ error: 'Failed to decline request' });
  }
}

async function removeFriend(req, res) {
  try {
    const { friendshipId } = req.params;
    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });
    if (friendship.requesterId !== req.userId && friendship.addresseeId !== req.userId) {
      return res.status(403).json({ error: 'Not your friendship to remove' });
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    return res.json({ success: true });
  } catch (error) {
    console.error('[Friends] removeFriend error:', error.message);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
}

async function listFriends(req, res) {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: req.userId }, { addresseeId: req.userId }]
      },
      include: {
        requester: { select: { id: true, username: true, avatarUrl: true, rating: true } },
        addressee: { select: { id: true, username: true, avatarUrl: true, rating: true } }
      }
    });

    // presenceManager is an in-process singleton shared with the socket
    // layer — safe to read directly here since REST and Socket.io run in
    // the same Node process.
    const friends = friendships.map((f) => {
      const friend = f.requesterId === req.userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        ...friend,
        online: Boolean(presenceManager.getSocketId(friend.id))
      };
    });

    return res.json({ friends });
  } catch (error) {
    console.error('[Friends] listFriends error:', error.message);
    return res.status(500).json({ error: 'Failed to load friends' });
  }
}

async function listPendingRequests(req, res) {
  try {
    const requests = await prisma.friendship.findMany({
      where: { addresseeId: req.userId, status: 'PENDING' },
      include: { requester: { select: { id: true, username: true, avatarUrl: true } } }
    });

    return res.json({ requests });
  } catch (error) {
    console.error('[Friends] listPendingRequests error:', error.message);
    return res.status(500).json({ error: 'Failed to load requests' });
  }
}

module.exports = {
  searchUsers,
  sendRequest,
  acceptRequest,
  declineRequest,
  removeFriend,
  listFriends,
  listPendingRequests
};