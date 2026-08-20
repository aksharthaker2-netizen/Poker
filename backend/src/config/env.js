// src/config/env.js
require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || '*',
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
};

// Strict validation for required variables
const requiredVariables = ['DATABASE_URL'];

for (const variable of requiredVariables) {
  if (!env[variable]) {
    console.error(`[Env] FATAL ERROR: ${variable} is not defined in .env`);
    process.exit(1);
  }
}

module.exports = env;