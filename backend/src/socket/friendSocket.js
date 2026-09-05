// src/socket/friendSocket.js
const presenceManager = require('../managers/presenceManager');
const friendRepository = require('../repositories/friendRepository');
const validateSocketPayload = require('../middleware/validateSocketPayload');
const { enforceRateLimit } = require('../utils/socketRateLimiter');
const { sendGameInviteSchema } = require('../validators/socketValidators');

module.exports = function registerFriendHandlers(io, socket) {
  // Trusted identity, verified once by socketAuthMiddleware at connection.
  const userId = socket.data.userId;

  // NOTE: presence registration + the personal `user:<id>` channel join now
  // happen once, centrally, in socket/index.js on 'connection' — there's no
  // need for the client to remember to emit a separate USER_ONLINE event,
  // and no risk of a client lying about which userId just came online.

  // SEND GAME INVITE
  socket.on('SEND_GAME_INVITE', async (payload, callback) => {
    try {
      // Stricter than most events — invites are the one thing here that
      // directly bothers another person, so spam potential matters more.
      enforceRateLimit(`${userId}:SEND_GAME_INVITE`, 10, 60_000);
      const { senderName, targetUserId, roomId } = validateSocketPayload(sendGameInviteSchema, payload);

      // FIX: this previously only checked the target was online — nothing
      // verified an actual ACCEPTED friendship existed. Since userId is
      // visible in ordinary socket traffic, anyone could spam invites at
      // any other user just by knowing their id. Require a real,
      // mutual, ACCEPTED relationship first.
      const relationship = await friendRepository.findRelationship(userId, targetUserId);
      if (!relationship || relationship.status !== 'ACCEPTED') {
        throw new Error('You can only invite accepted friends.');
      }

      const targetSocketId = await presenceManager.getSocketId(targetUserId);
      if (!targetSocketId) {
        throw new Error('Player is currently offline.');
      }

      io.to(targetSocketId).emit('RECEIVE_GAME_INVITE', {
        senderId: userId, // trusted identity — NOT payload.senderId
        senderName,
        roomId,
        timestamp: new Date().toISOString()
      });

      console.log(`[Social] Invite sent from ${userId} to user ${targetUserId}`);
      if (typeof callback === 'function') callback({ success: true });
    } catch (error) {
      console.error('[Social Error - Invite]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });

  // NOTE: disconnect handling (presence cleanup, room seat marking, and
  // force-folding if it's the disconnecting player's turn) is centralized
  // in socket/index.js. Keeping it in exactly one place avoids the two
  // disconnect handlers racing or running out of order — room cleanup
  // needs the presence record's roomId, which must be read BEFORE presence
  // is wiped.
};