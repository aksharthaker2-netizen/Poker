// src/config/db.js
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const env = require('./env');

// 1. Initialize a native Postgres connection pool using your Neon URL
const pool = new Pool({ 
  connectionString: env.DATABASE_URL 
});

// 2. Wrap the pool in Prisma's adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;