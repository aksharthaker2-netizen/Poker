// src/socket/index.js
const { Server } = require('socket.io');
const socketAuthMiddleware = require('../middleware/socketAuthMiddleware');
const registerRoomHandlers = require('./roomSocket');
const registerGameHandlers = require('./gameSocket');
const registerFriendHandlers = require('./friendSocket');
const presenceManager = require('../managers/presenceManager');
const roomManager = require('../managers/roomManager');
const { forceFoldIfCurrentActor } = require('./gameFlowManager');

let io;

/**
 * Initializes the Socket.io server and binds it to the Express HTTP server
 */
function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*', // set FRONTEND_URL explicitly in production
      methods: ['GET', 'POST']
    }
  });

  // Verifies the JWT once per connection and attaches socket.data.userId.
  // Every handler downstream trusts THIS, never a client-supplied payload field.
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] ${userId} connected (${socket.id})`);

    presenceManager.connectUser(userId, socket.id);

    // Personal channel used by gameFlowManager to privately deliver hole
    // cards (YOUR_HAND) and by friendSocket to deliver invites.
    socket.join(`user:${userId}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerFriendHandlers(io, socket);

    // SINGLE centralized disconnect handler. Order matters: we read the
    // user's roomId from presence BEFORE wiping their presence record.
    socket.on('disconnect', async () => {
      console.log(`[Socket] ${userId} disconnected (${socket.id})`);

      const presenceRecord = presenceManager.getUser(userId);
      const roomId = presenceRecord ? presenceRecord.roomId : null;

      presenceManager.disconnectUser(socket.id);

      if (!roomId) return;

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      roomManager.markDisconnected(roomId, userId);

      // If a game is in progress and it happens to be this player's turn
      // right now, fold them immediately instead of stalling the table
      // until someone notices. If it's not their turn yet, the shared
      // turn loop (gameFlowManager.broadcastAndCheckBot) will auto-fold
      // them the moment their turn comes up.
      if (room.status === 'PLAYING' && room.game) {
        await forceFoldIfCurrentActor(io, roomId, userId);
      }

      io.to(roomId).emit('ROOM_UPDATED', { room });
    });
  });

  return io;
}

/**
 * Allows other parts of the app to access the io instance if needed
 */
function getIo() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}

module.exports = { initializeSocket, getIo };