// src/socket/index.js
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const socketAuthMiddleware = require('../middleware/socketAuthMiddleware');
const registerRoomHandlers = require('./roomSocket');
const registerGameHandlers = require('./gameSocket');
const registerFriendHandlers = require('./friendSocket');
const presenceManager = require('../managers/presenceManager');
const { createAdapterClients } = require('../config/redis');
const { handlePlayerLeaving } = require('./gameFlowManager');

let io;

/**
 * ioredis clients auto-connect on creation (unlike node-redis v4, they
 * have no .connect() method to call) — this just waits until each is
 * actually ready before handing them to the Socket.IO adapter, rather
 * than assuming they're immediately usable.
 */
function waitForReady(client) {
  return new Promise((resolve, reject) => {
    if (client.status === 'ready') return resolve();
    client.once('ready', resolve);
    client.once('error', reject);
  });
}

async function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  // This is what actually makes horizontal scaling possible: without it,
  // io.to(roomId).emit(...) only reaches sockets connected to THIS
  // process. With it, Socket.IO publishes every broadcast through Redis,
  // so a socket connected to instance B still receives an event emitted
  // from instance A. Every io.to(...).emit(...) call already in the
  // codebase (gameFlowManager, roomSocket, etc.) needs zero changes to
  // benefit from this — the adapter swap is transparent to them.
  const { pubClient, subClient } = createAdapterClients();
  await Promise.all([waitForReady(pubClient), waitForReady(subClient)]);
  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] ${userId} connected (${socket.id})`);

    await presenceManager.connectUser(userId, socket.id);
    socket.join(`user:${userId}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerFriendHandlers(io, socket);

    // SINGLE centralized disconnect handler. Order matters: we read the
    // user's roomId from presence BEFORE wiping their presence record.
    socket.on('disconnect', async () => {
      console.log(`[Socket] ${userId} disconnected (${socket.id})`);

      const presenceRecord = await presenceManager.getUser(userId);
      const roomId = presenceRecord ? presenceRecord.roomId : null;

      await presenceManager.disconnectUser(socket.id);

      if (!roomId) return;

      // Delegates to the SAME logic an explicit "Leave Room" click uses —
      // see gameFlowManager.handlePlayerLeaving for the full policy
      // (immediate removal if no hand is in progress, grace-period +
      // auto-fold if one is).
      //
      // NOTE: this only works correctly if `roomId`'s live game state
      // (roomManager.rooms) is held by THIS SAME process — see this
      // file's own boundary note below on what Redis does and doesn't
      // cover yet.
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