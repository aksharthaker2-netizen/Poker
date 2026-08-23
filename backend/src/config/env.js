// src/config/env.js
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Neon pooled connection string)'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required (Neon direct connection string)'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  FRONTEND_URL: z.string().optional(),
  ML_API_URL: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(result.error.flatten().fieldErrors);
  // Fail fast and loud at boot rather than limping along and hitting a
  // confusing crash mid-request the first time a missing var is touched.
  process.exit(1);
}

module.exports = result.data;