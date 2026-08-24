// src/validators/gameValidators.js
const { z } = require('zod');

const gameIdParamSchema = z.object({
  gameId: z.string().uuid('Invalid game id')
});

const handIdParamSchema = z.object({
  handId: z.string().uuid('Invalid hand id')
});

const listGamesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});

module.exports = { gameIdParamSchema, handIdParamSchema, listGamesQuerySchema };