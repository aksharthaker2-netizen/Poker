// src/validators/roomValidators.js
const { z } = require('zod');

const listRoomsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});

// Mirrors the clamping roomManager.createRoom already enforces
// server-side for socket-created rooms. Not currently wired to a route
// (room creation is socket-only) — kept here ready for if a REST
// room-creation endpoint is ever added.
const roomSettingsSchema = z.object({
  maxPlayers: z.coerce.number().int().min(2).max(10).optional(),
  bigBlind: z.coerce.number().int().min(2).optional(),
  startingChips: z.coerce.number().int().min(1).optional()
});

module.exports = { listRoomsQuerySchema, roomSettingsSchema };