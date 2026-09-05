// src/controllers/friendController.js
const userRepository = require('../repositories/userRepository');
const friendRepository = require('../repositories/friendRepository');
const presenceManager = require('../managers/presenceManager');

async function searchUsers(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [] });

    const users = await userRepository.searchByUsername(q, req.userId);
    return res.json({ users });
  } catch (error) {
    console.error('[Friends] searchUsers error:', error.message);
    return res.status(500).json({ error: 'Search failed' });
  }
}

async function sendRequest(req, res) {
  try {
    const { targetUserId } = req.body;
    if (targetUserId === req.userId) {
      return res.status(400).json({ error: "You can't add yourself" });
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const existing = await friendRepository.findRelationship(req.userId, targetUserId);

    if (existing) {
      if (existing.status === 'ACCEPTED') return res.status(409).json({ error: 'Already friends' });
      if (existing.status === 'PENDING') return res.status(409).json({ error: 'Request already pending' });
      if (existing.status === 'BLOCKED') return res.status(403).json({ error: 'Cannot send request' });

      const updated = await friendRepository.reopen(existing.id, req.userId, targetUserId);
      return res.status(201).json({ friendship: updated });
    }

    const friendship = await friendRepository.create(req.userId, targetUserId);
    return res.status(201).json({ friendship });
  } catch (error) {
    console.error('[Friends] sendRequest error:', error.message);
    return res.status(500).json({ error: 'Failed to send friend request' });
  }
}

async function respondToRequest(req, res, newStatus) {
  const friendship = await friendRepository.findById(req.params.friendshipId);

  if (!friendship) return res.status(404).json({ error: 'Request not found' });
  if (friendship.addresseeId !== req.userId) {
    return res.status(403).json({ error: 'Only the recipient can respond to this request' });
  }
  if (friendship.status !== 'PENDING') {
    return res.status(409).json({ error: 'Request is no longer pending' });
  }

  const updated = await friendRepository.updateStatus(req.params.friendshipId, newStatus);
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
    const friendship = await friendRepository.findById(req.params.friendshipId);

    if (!friendship) return res.status(404).json({ error: 'Friendship not found' });
    if (friendship.requesterId !== req.userId && friendship.addresseeId !== req.userId) {
      return res.status(403).json({ error: 'Not your friendship to remove' });
    }

    await friendRepository.remove(req.params.friendshipId);
    return res.json({ success: true });
  } catch (error) {
    console.error('[Friends] removeFriend error:', error.message);
    return res.status(500).json({ error: 'Failed to remove friend' });
  }
}

async function listFriends(req, res) {
  try {
    const friendships = await friendRepository.listAccepted(req.userId);

    // getSocketId is now async (Redis-backed presenceManager) — was a
    // synchronous in-memory Map lookup before, so this needed to move
    // from a plain .map() to Promise.all(...map(async ...)).
    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friend = f.requesterId === req.userId ? f.addressee : f.requester;
        const socketId = await presenceManager.getSocketId(friend.id);
        return {
          friendshipId: f.id,
          ...friend,
          online: Boolean(socketId)
        };
      })
    );

    return res.json({ friends });
  } catch (error) {
    console.error('[Friends] listFriends error:', error.message);
    return res.status(500).json({ error: 'Failed to load friends' });
  }
}

async function listPendingRequests(req, res) {
  try {
    const requests = await friendRepository.listPendingForUser(req.userId);
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