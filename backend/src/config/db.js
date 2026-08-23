// src/config/db.js
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const env = require('./env');

// Function to initialize the pool, adapter, and client all at once
const createPrismaClient = () => {
  const pool = new Pool({ 
    connectionString: env.DATABASE_URL 
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use the global cache to prevent connection exhaustion during hot-reloads
const prisma = global.__prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;