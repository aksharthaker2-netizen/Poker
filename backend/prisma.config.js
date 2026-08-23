require('dotenv').config();
const { defineConfig, env } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  engine: 'classic', 
  datasource: {
    url: process.env.DIRECT_URL,
  },
  migrations: {
    // Tells Prisma how to execute your seed file
    seed: 'node prisma/seed.js', 
  }
});