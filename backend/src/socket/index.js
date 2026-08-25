// src/socket/index.js
const { Server } = require('socket.io');
const socketAuthMiddleware = require('../middleware/socketAuthMiddleware');
const registerRoomHandlers = require('./roomSocket');
const registerGameHandlers = require('./gameSocket');
const registerFriendHandlers = require('./friendSocket');
const presenceManager = require('../managers/presenceManager');
const { handlePlayerLeaving } = require('./gameFlowManager');

let io;

function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] ${userId} connected (${socket.id})`);

    presenceManager.connectUser(userId, socket.id);
    socket.join(`user:${userId}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerFriendHandlers(io, socket);

    // SINGLE centralized disconnect handler. Order matters: we read the
    // user's roomId from presence BEFORE wiping their presence record.
    //
    // FIX: this read was previously dead code — nothing ever called
    // presenceManager.setInGame(), so `presenceRecord.roomId` was ALWAYS
    // null and this handler's cleanup path never actually ran on a real
    // disconnect. roomSocket.js now calls setInGame() when a player joins
    // a room, so this actually fires now.
    socket.on('disconnect', async () => {
      console.log(`[Socket] ${userId} disconnected (${socket.id})`);

      const presenceRecord = presenceManager.getUser(userId);
      const roomId = presenceRecord ? presenceRecord.roomId : null;

      presenceManager.disconnectUser(socket.id);

      if (!roomId) return;

      // Delegates to the SAME logic an explicit "Leave Room" click uses —
      // see gameFlowManager.handlePlayerLeaving for the full policy
      // (immediate removal if no hand is in progress, grace-period +
      // auto-fold if one is).
      await handlePlayerLeaving(io, roomId, userId);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

module.exports = { initializeSocket, getIo };