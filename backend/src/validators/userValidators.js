// src/validators/userValidators.js
const { z } = require('zod');

const updateProfileSchema = z
  .object({
    displayName: z.string().max(40).nullable().optional(),
    bio: z.string().max(280).nullable().optional(),
    avatarUrl: z.string().url().nullable().optional()
  })
  // Reject an empty body outright rather than silently no-op updating.
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (displayName, bio, avatarUrl) is required'
  });

module.exports = { updateProfileSchema };