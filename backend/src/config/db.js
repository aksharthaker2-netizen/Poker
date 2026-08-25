// src/config/db.js
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

/**
 * Prisma 7 requires an explicit driver adapter for the RUNTIME client —
 * bare `new PrismaClient()` throws PrismaClientConstructorValidationError
 * now. This is completely separate from prisma.config.js, which only
 * configures the CLI (migrate/studio/seed) via DIRECT_URL — it has no
 * bearing on how the running app connects.
 *
 * Uses the POOLED connection string (DATABASE_URL, via Neon's PgBouncer
 * endpoint) — this is a long-lived app server issuing many concurrent
 * queries, so it should go through the pooler like any normal runtime
 * connection. DIRECT_URL is reserved for migrations only.
 */
const pool =
  global.__pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon's own connection docs set this explicitly even though the
    // connection string already carries `sslmode=require` — some
    // environments have had pg silently fail SSL negotiation relying on
    // the query param alone. Belt-and-suspenders, matches Neon's own
    // official example.
    ssl: { require: true }
  });
const adapter = new PrismaPg(pool);
const prisma = global.__prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool = pool;
  global.__prisma = prisma;
}

module.exports = prisma;