// src/socket/gameSocket.js
const roomManager = require('../managers/roomManager');
const { broadcastAndCheckBot } = require('./gameFlowManager');
const mlService = require('../services/mlService');
const { buildDecisionContext } = require('../services/mlContextBuilder');
const validateSocketPayload = require('../middleware/validateSocketPayload');
const { enforceRateLimit } = require('../utils/socketRateLimiter');
const { playerActionSchema, roomIdOnlySchema } = require('../validators/socketValidators');

module.exports = function registerGameHandlers(io, socket) {
  // Trusted identity, verified once by socketAuthMiddleware at connection.
  // NEVER read the acting player's id from payload.userId — a client could
  // send any id and act (fold/raise/etc) on another player's behalf.
  const userId = socket.data.userId;

  socket.on('PLAYER_ACTION', async (payload, callback) => {
    try {
      // Turn-based play naturally limits legitimate action frequency, but
      // a malicious client can still spam PLAYER_ACTION out of turn —
      // each gets rejected by the engine, but still costs a validation
      // pass + log line per event with zero throttling. 20/5s is well
      // above any human's real click rate but stops a spam loop cold.
      enforceRateLimit(`${userId}:PLAYER_ACTION`, 20, 5_000);

      // FIX: this used to destructure the raw payload directly — a
      // malformed additionalChips (a string, NaN, an object) would reach
      // straight into bettingManager's arithmetic. The engine's own
      // legalActions check catches most bad ACTIONs, but not malformed
      // numeric fields specifically. Validated + coerced here instead.
      const { roomId, action, additionalChips } = validateSocketPayload(playerActionSchema, payload);

      const room = roomManager.getRoom(roomId);
      if (!room) throw new Error('Room not found.');
      if (room.status !== 'PLAYING' || !room.game) throw new Error('Game is not currently active.');

      // Capture the FULL decision context BEFORE the action mutates state
      // — this feeds the AI Poker Coach's /analyze call after the hand
      // ends (see reviewService.analyzeAndAnnotate). Only for humans, and
      // only ever a display/coaching concern — must never block or alter
      // real gameplay if it fails for any reason.
      try {
        const context = buildDecisionContext(room, userId);
        const list = room.humanDecisionPoints?.get(userId) || [];
        list.push({ ...context, player_action: mlService.mapOurActionToMl(action) });
        room.humanDecisionPoints?.set(userId, list);
      } catch (contextError) {
        console.error('[Game] Failed to capture decision context:', contextError.message);
      }

      // 1. Pass the human's action into the master orchestrator
      const actionResult = room.game.handlePlayerAction(userId, action, additionalChips);
      console.log(`[Game] Room ${roomId} | Player ${userId} | Action: ${action}`);

      // 2. Immediately acknowledge success to the frontend button click
      if (typeof callback === 'function') {
        callback({ success: true });
      }

      // 3. Blast the human's move and kick off the shared bot/disconnect loop
      await broadcastAndCheckBot(io, roomId, actionResult);
    } catch (error) {
      console.error('[Game Error - Action]', error.message);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  // GET A HINT — /hint, only for the player whose turn it currently is.
  // Returns the suggestion privately via the callback, not broadcast.
  socket.on('GET_HINT', async (payload, callback) => {
    try {
      enforceRateLimit(`${userId}:GET_HINT`, 10, 60_000);
      const { roomId } = validateSocketPayload(roomIdOnlySchema, payload);

      const room = roomManager.getRoom(roomId);
      if (!room) throw new Error('Room not found.');
      if (room.status !== 'PLAYING' || !room.game) throw new Error('Game is not currently active.');

      const tm = room.game.turnManager;
      const currentActorId = tm.players[tm.currentPlayerIndex];
      if (currentActorId !== userId) throw new Error('You can only request a hint on your own turn.');

      const context = buildDecisionContext(room, userId);
      const hint = await mlService.requestHint(context, room.settings.bigBlind);

      if (!hint) throw new Error('Hint is unavailable right now.');

      if (typeof callback === 'function') callback({ success: true, hint });
    } catch (error) {
      console.error('[Game Error - Hint]', error.message);
      if (typeof callback === 'function') callback({ success: false, error: error.message });
    }
  });
};