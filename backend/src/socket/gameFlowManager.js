// src/socket/gameFlowManager.js
const roomManager = require('../managers/roomManager');
const botManager = require('../managers/botManager');
const persistenceService = require('../services/persistenceService');

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

module.exports = {
  dealPrivateHands,
  buildPublicPayload,
  broadcastAndCheckBot,
  forceFoldIfCurrentActor,
  scheduleNextHand
};