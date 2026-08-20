// src/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/db');
const redisClient = require('./config/redis');
const socketConfig = require('./config/socket');

const server = http.createServer(app);

// Initialize Socket.io using your new config
const io = socketConfig.init(server);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await prisma.$disconnect();
  if (redisClient.isOpen) await redisClient.quit();
  server.close(() => {
    console.log('[Server] HTTP and Socket server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Boot sequence
const startServer = async () => {
  try {
    // 1. Connect to PostgreSQL
    await prisma.$connect();
    console.log('[DB] Successfully connected to Neon PostgreSQL');

    // 2. Connect to Redis
    //await redisClient.connect();

    // 3. Start Server
    server.listen(env.PORT, () => {
      console.log(`[Server] PokerAI running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error(`[Server] Boot failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();