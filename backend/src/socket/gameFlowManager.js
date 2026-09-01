// src/socket/gameFlowManager.js
const roomManager = require('../managers/roomManager');
const botManager = require('../managers/botManager');
const persistenceService = require('../services/persistenceService');
const { DISCONNECT_GRACE_MS } = require('../utils/constants');

/**
 * Privately deals each seated human their own two hole cards.
 *
 * CRITICAL: never broadcast game.playerHands to the whole room — that
 * leaks every opponent's cards to every client. Each human gets ONLY
 * their own cards, over their personal `user:<id>` channel (joined in
 * socket/index.js on connection).
 */
function dealPrivateHands(io, room) {
  const game = room.game;
  room.seats.forEach(seat => {
    if (!seat || seat.isBot) return; // bots don't need a socket emit
    const holeCards = game.playerHands[seat.id];
    if (!holeCards) return;
    io.to(`user:${seat.id}`).emit('YOUR_HAND', { holeCards });
  });
}

/**
 * Builds the PUBLIC broadcast payload for a game-state update.
 * Never includes game.playerHands except the deliberate showdown reveal.
 */
function buildPublicPayload(room, actionResult) {
  const game = room.game;

  // FIX: read highestBet from bettingManager directly rather than trusting
  // actionResult.highestBet. GameEngine.nextStreet() (unlike
  // handlePlayerAction()) never included highestBet in its return value,
  // so after every Flop/Turn/River transition this field was `undefined`
  // until the next action. bettingManager.highestBet is always current
  // regardless of which engine method just ran.
  const highestBet = game.bettingManager.highestBet;

  const payload = {
    state: actionResult.state,
    nextPlayerId: actionResult.nextPlayerId,
    potSize: actionResult.potSize,
    highestBet,
    communityCards: game.communityCards,
    players: game.players, // chips/status only — no hole cards live here
    actionInfo: null
  };

  // FIX: previously the frontend had to guess Check-vs-Call and raise
  // minimums from `highestBet` alone, which is only an approximation once
  // a player has already contributed something this round. Compute the
  // EXACT legal-actions set for whoever's turn it is next — the same
  // computation botManager already relies on for bots — and hand it to
  // the client. The server still re-validates every action regardless,
  // this just lets the UI be precise instead of best-effort.
  const isBettingPhase = actionResult.state !== 'SHOWDOWN' && actionResult.state !== 'WAITING';
  if (isBettingPhase && actionResult.nextPlayerId) {
    const nextPlayer = game.players.find(p => p.id === actionResult.nextPlayerId);
    if (nextPlayer) {
      const { amountToCall, minRaiseAmount, legalActions } = game.bettingManager.getLegalActions(
        actionResult.nextPlayerId,
        nextPlayer.chips
      );
      payload.actionInfo = {
        playerId: actionResult.nextPlayerId,
        amountToCall,
        minRaiseAmount,
        legalActions
      };
    }
  }

  if (actionResult.state === 'SHOWDOWN') {
    payload.results = actionResult.results;
    payload.finalBalances = actionResult.finalBalances;
    payload.revealedHands = game.playerHands; // intentional reveal at showdown
  }

  return payload;
}

/**
 * Broadcasts the latest state, then recursively drives the turn forward
 * through any BOT or DISCONNECTED human seated next, until a connected
 * human actually needs to act (or the hand ends).
 *
 * THIS IS THE SINGLE ENTRY POINT for "what happens after an action" —
 * both the initial game-start trigger (roomSocket) and every subsequent
 * human action (gameSocket) must call this exact function, or a chain of
 * several consecutive bot/disconnected turns will silently stall.
 */
async function broadcastAndCheckBot(io, roomId, actionResult) {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.game) return;

  io.to(roomId).emit('GAME_STATE_UPDATED', buildPublicPayload(room, actionResult));

  // Persist the action that just happened, if any. `game.lastAction` is
  // set by GameEngine.handlePlayerAction() right before it returns, and
  // is null for the synthetic "hand just started" call (nothing to log
  // yet) — so this only fires for real fold/check/call/bet/raise/all-in
  // actions, exactly once each, human or bot.
  if (room.game.lastAction) {
    const actionToLog = room.game.lastAction;
    room.game.lastAction = null; // consume — prevents double-logging if this function is ever re-entered
    persistenceService.persistHandAction(room, actionToLog); // fire-and-forget, never blocks the broadcast
  }

  if (actionResult.state === 'SHOWDOWN') {
    // Fire-and-forget: persistence must never delay the broadcast or
    // block the next hand from starting. Failures are logged inside
    // persistenceService and never thrown back up to here.
    persistenceService.persistCompletedHand(room, actionResult);
    scheduleNextHand(io, roomId);
  }

  if (actionResult.state === 'WAITING' || actionResult.state === 'SHOWDOWN') {
    return;
  }

  const nextPlayerId = actionResult.nextPlayerId;
  if (!nextPlayerId) return;

  const nextPlayer = room.game.players.find(p => p.id === nextPlayerId);
  if (!nextPlayer) return;

  const isDisconnectedHuman =
    !nextPlayer.isBot &&
    room.disconnectedPlayerIds &&
    room.disconnectedPlayerIds.has(nextPlayerId);

  if (nextPlayer.isBot) {
    console.log(`[Bot] Turn: ${nextPlayer.username || nextPlayerId}`);
    await botManager.playBotTurn(room, nextPlayerId, async (botActionResult) => {
      await broadcastAndCheckBot(io, roomId, botActionResult);
    });
  } else if (isDisconnectedHuman) {
    console.log(`[Disconnect] Auto-folding disconnected player ${nextPlayerId}`);
    try {
      const foldResult = room.game.handlePlayerAction(nextPlayerId, 'FOLD', 0);
      await broadcastAndCheckBot(io, roomId, foldResult);
    } catch (error) {
      console.error('[Disconnect] Auto-fold failed:', error.message);
    }
  }
  // else: a connected human is up next — wait for their PLAYER_ACTION event.
}

/**
 * How long to pause after a showdown before automatically dealing the
 * next hand — long enough for players to see the results, short enough
 * to keep the table moving without anyone having to click anything.
 */
const NEXT_HAND_DELAY_MS = 6000;

/**
 * Auto-continues the table after a showdown. Without this, nothing ever
 * calls GameEngine.startHand() again after the very first hand — the
 * table would sit at WAITING forever. If fewer than 2 players still have
 * chips, the game ends and the room drops back to its lobby/waiting state
 * instead.
 */
function scheduleNextHand(io, roomId) {
  setTimeout(async () => {
    const room = roomManager.getRoom(roomId);
    if (!room || !room.game || room.status !== 'PLAYING') return;

    // Safe pruning window: no hand is active here (the previous one just
    // finished, the next hasn't started). Anyone who's been disconnected
    // past the grace period gets their seat freed now — see
    // roomManager.pruneDisconnectedPlayers' doc comment for why this can
    // ONLY happen in a window like this, never mid-hand.
    const { destroyed } = roomManager.pruneDisconnectedPlayers(room);
    if (destroyed) return; // room (and everyone in it) is gone

    const playersWithChips = room.game.players.filter((p) => p.chips > 0);
    if (playersWithChips.length < 2) {
      persistenceService.markGameEnded(room); // fire-and-forget
      room.status = 'WAITING';
      io.to(roomId).emit('GAME_ENDED', { reason: 'Not enough players with chips remaining' });
      io.to(roomId).emit('ROOM_UPDATED', { room });
      return;
    }

    try {
      const initialState = room.game.startHand();
      resetHandAnalysisTracking(room);
      dealPrivateHands(io, room);
      await broadcastAndCheckBot(io, roomId, {
        state: initialState.state,
        nextPlayerId: initialState.turnData.currentActorId,
        potSize: initialState.potSize
      });
    } catch (error) {
      console.error('[GameFlow] Failed to start next hand:', error.message);
    }
  }, NEXT_HAND_DELAY_MS);
}

/**
 * Resets the per-hand bookkeeping used to feed the AI Poker Coach's
 * /analyze call (see mlContextBuilder.js and reviewService.analyzeAndAnnotate).
 * Called every time a NEW hand starts — both here and in roomSocket.js's
 * START_GAME handler, since those are the only two places startHand() is
 * ever called.
 *
 * `humanDecisionPoints`: Map<userId, Array<mlContext + player_action>> —
 *   populated in gameSocket.js's PLAYER_ACTION handler, BEFORE the action
 *   mutates state (captures what the player actually saw when deciding).
 * `humanHandActionIds`: Map<userId, Array<HandAction db id>> — populated
 *   in persistenceService.persistHandAction, in the SAME order as the
 *   above (both only ever grow by exactly one entry per real human
 *   action, so index N in one array always corresponds to index N in the
 *   other for a given user). This is how /analyze's response
 *   (`decision_point` index) gets mapped back to a real HandAction row.
 */
function resetHandAnalysisTracking(room) {
  room.humanDecisionPoints = new Map();
  room.humanHandActionIds = new Map();
}

/**
 * Called immediately on socket disconnect. If it happens to already be
 * the disconnected player's turn, fold them right away instead of
 * leaving the table stalled until someone notices.
 */
async function forceFoldIfCurrentActor(io, roomId, userId) {
  const room = roomManager.getRoom(roomId);
  if (!room || !room.game) return;

  const tm = room.game.turnManager;
  const currentActorId = tm.players[tm.currentPlayerIndex];
  if (currentActorId !== userId) return; // not their turn — the turn loop will catch it when it is

  try {
    const foldResult = room.game.handlePlayerAction(userId, 'FOLD', 0);
    await broadcastAndCheckBot(io, roomId, foldResult);
  } catch (error) {
    console.error('[Disconnect] Force-fold failed:', error.message);
  }
}

/**
 * SINGLE shared entry point for "an occupant is leaving this room" — used
 * by a real socket disconnect, an explicit LEAVE_ROOM click, AND
 * host-initiated KICK_PLAYER / REMOVE_BOT (this function doesn't care WHO
 * decided the occupant should leave — the caller is responsible for any
 * authorization check, e.g. "only the host may kick"). Behavior depends
 * on whether a game is in progress:
 *
 * - WAITING (no hand structure exists): safe to remove them immediately —
 *   delegates straight to roomManager.leaveRoom.
 * - PLAYING: can't safely rip them out of `game.players` mid-hand (see
 *   roomManager.pruneDisconnectedPlayers' doc comment). Instead: mark them
 *   disconnected so the existing per-turn auto-fold logic in
 *   broadcastAndCheckBot handles their current hand, immediately fold them
 *   if it's already their turn, and let scheduleNextHand's between-hands
 *   prune free their seat before the next hand deals. Works identically
 *   for bots (REMOVE_BOT) — bots aren't treated as "disconnected" for
 *   turn-taking purposes (see the isDisconnectedHuman check above, which
 *   explicitly excludes bots), so a bot marked here just keeps playing
 *   normally via botManager until the between-hands prune removes it.
 *
 * @param {Boolean} immediate - true for an explicit leave/kick/remove, so
 *   the occupant doesn't have to wait out the full reconnect grace period
 *   before their seat actually frees up between hands.
 */
async function handlePlayerLeaving(io, roomId, userId, { immediate = false } = {}) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  if (room.status === 'WAITING') {
    const result = roomManager.leaveRoom(roomId, userId);
    if (result?.destroyed) return;
    io.to(roomId).emit('ROOM_UPDATED', { room });
    return;
  }

  const timestamp = immediate ? Date.now() - DISCONNECT_GRACE_MS - 1 : Date.now();
  room.disconnectedPlayerIds.set(userId, timestamp);

  if (room.game) {
    await forceFoldIfCurrentActor(io, roomId, userId);
  }

  io.to(roomId).emit('ROOM_UPDATED', { room });
}

/**
 * Host-initiated "close room" — an emergency stop, not a normal ending.
 * Notifies everyone, marks the DB Game ABORTED if a hand was in progress
 * (see persistenceService.markGameAborted for why chips already in the
 * live pot are NOT settled/refunded), then deletes the room outright.
 */
async function closeRoom(io, roomId, reason = 'The host closed the room') {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  io.to(roomId).emit('ROOM_CLOSED', { reason });

  if (room.game) {
    if (room.status === 'PLAYING') {
      await persistenceService.markGameAborted(room);
    } else {
      await persistenceService.markGameEnded(room);
    }
  }

  roomManager.deleteRoom(roomId);
}

module.exports = {
  dealPrivateHands,
  buildPublicPayload,
  broadcastAndCheckBot,
  forceFoldIfCurrentActor,
  scheduleNextHand,
  handlePlayerLeaving,
  closeRoom,
  resetHandAnalysisTracking
};