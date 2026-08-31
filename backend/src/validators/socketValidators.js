// src/validators/socketValidators.js
const { z } = require('zod');

const roomIdSchema = z.string().min(1).max(10);
const usernameSchema = z.string().min(1).max(24);
// Room supports up to 10 seats (indices 0-9) — mirrors ROOM_LIMITS.MAX_PLAYERS.
const seatIndexSchema = z.number().int().min(0).max(9);

const roomSettingsSchema = z
  .object({
    maxPlayers: z.coerce.number().int().min(2).max(10).optional(),
    bigBlind: z.coerce.number().int().min(2).optional(),
    startingChips: z.coerce.number().int().min(1).optional()
  })
  .optional();

const createRoomSchema = z.object({
  username: usernameSchema,
  settings: roomSettingsSchema,
  requestedSeat: seatIndexSchema.nullable().optional()
});

const joinRoomSchema = z.object({
  roomId: roomIdSchema,
  username: usernameSchema,
  requestedSeat: seatIndexSchema.nullable().optional()
});

const roomIdOnlySchema = z.object({ roomId: roomIdSchema });

const addBotSchema = z.object({
  roomId: roomIdSchema,
  requestedSeat: seatIndexSchema.nullable().optional()
});

const kickPlayerSchema = z.object({
  roomId: roomIdSchema,
  targetUserId: z.string().uuid()
});

const removeBotSchema = z.object({
  roomId: roomIdSchema,
  botId: z.string().min(1) // bot ids are "bot_XXXXXXXX" (botManager.createBotProfile), not a uuid
});

const changeSeatSchema = z.object({
  roomId: roomIdSchema,
  requestedSeat: seatIndexSchema
});

const playerActionSchema = z.object({
  roomId: roomIdSchema,
  action: z.enum(['FOLD', 'CHECK', 'CALL', 'RAISE', 'ALL_IN']),
  additionalChips: z.coerce.number().int().min(0).optional().default(0)
});

const sendGameInviteSchema = z.object({
  senderName: z.string().min(1).max(40),
  targetUserId: z.string().uuid(),
  roomId: roomIdSchema
});

module.exports = {
  createRoomSchema,
  joinRoomSchema,
  roomIdOnlySchema,
  addBotSchema,
  kickPlayerSchema,
  removeBotSchema,
  changeSeatSchema,
  playerActionSchema,
  sendGameInviteSchema
};