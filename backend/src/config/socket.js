// src/config/socket.js
const { Server } = require('socket.io');
const env = require('./env');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (env.NODE_ENV !== 'production') {
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
              return callback(null, true);
            }
          }
          if (origin === env.FRONTEND_URL) return callback(null, true);
          callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        methods: ['GET', 'POST'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type'],
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