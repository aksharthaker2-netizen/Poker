// src/validators/authValidators.js
const { z } = require('zod');

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().email('Invalid email address'),
  // 72 chars is bcrypt's effective input limit — longer input is silently
  // truncated by bcrypt, which is a subtle footgun if not enforced here.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72)
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

module.exports = { registerSchema, loginSchema, refreshSchema };