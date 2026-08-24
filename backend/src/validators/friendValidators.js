// src/validators/friendValidators.js
const { z } = require('zod');

const sendRequestSchema = z.object({
  targetUserId: z.string().uuid('targetUserId must be a valid user id')
});

const searchQuerySchema = z.object({
  q: z.string().max(50).optional().default('')
});

module.exports = { sendRequestSchema, searchQuerySchema };