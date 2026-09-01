// src/server.js
require('dotenv').config();

const http = require('http');
const env = require('./config/env'); // validates env vars — must run before anything else touches process.env
const app = require('./app');
const { initializeSocket } = require('./socket');
const { startCleanupJob } = require('./jobs/cleanupStaleRooms');
const { startLeaderboardJob } = require('./jobs/recalculateLeaderboard');
const { startPruneDisconnectedSeatsJob } = require('./jobs/pruneDisconnectedSeats');
const mlService = require('./services/mlService');

const httpServer = http.createServer(app);

const io = initializeSocket(httpServer);
startCleanupJob();
startLeaderboardJob();
startPruneDisconnectedSeatsJob(io); // needs `io` to broadcast ROOM_UPDATED after freeing a seat

httpServer.listen(env.PORT, async () => {
  console.log(`[Server] PokerAI backend listening on port ${env.PORT} (${env.NODE_ENV})`);

  // Fails loudly at boot rather than silently — every bot would otherwise
  // just fold for the rest of the session with no obvious explanation.
  const mlHealthy = await mlService.checkHealth();
  if (mlHealthy) {
    console.log(`[Server] ML service reachable at ${process.env.ML_API_URL || 'http://localhost:8000'}`);
  } else {
    console.warn(
      `[Server] ⚠ ML service NOT reachable at ${process.env.ML_API_URL || 'http://localhost:8000'} — bots will fold every hand until it's up.`
    );
  }
});

// Don't let one bad unhandled rejection silently corrupt state — log it
// loudly. In production, consider a process manager that restarts the
// process on this rather than continuing in a possibly-inconsistent state.
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});