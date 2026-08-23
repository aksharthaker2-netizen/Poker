// src/server.js
require('dotenv').config();

const http = require('http');
const env = require('./config/env'); // validates env vars — must run before anything else touches process.env
const app = require('./app');
const { initializeSocket } = require('./socket');
const { startCleanupJob } = require('./jobs/cleanupStaleRooms');
const { startLeaderboardJob } = require('./jobs/recalculateLeaderboard');

const httpServer = http.createServer(app);

initializeSocket(httpServer);
startCleanupJob();
startLeaderboardJob();

httpServer.listen(env.PORT, () => {
  console.log(`[Server] PokerAI backend listening on port ${env.PORT} (${env.NODE_ENV})`);
});

// Don't let one bad unhandled rejection silently corrupt state — log it
// loudly. In production, consider a process manager that restarts the
// process on this rather than continuing in a possibly-inconsistent state.
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});