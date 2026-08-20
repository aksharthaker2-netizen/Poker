// src/config/socket.js
const { Server } = require('socket.io');
const env = require('./env');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: env.CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      }
    });
    return io;
  },
  
  getIO: () => {
    if (!io) {
      throw new Error('[Socket] Socket.io is not initialized! Call init() first.');
    }
    return io;
  }
};