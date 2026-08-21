// src/socket/gameFlowManager.js
const roomManager = require('../managers/roomManager');
const botManager = require('../managers/botManager');

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
  const payload = {
    state: actionResult.state,
    nextPlayerId: actionResult.nextPlayerId,
    potSize: actionResult.potSize,
    highestBet: actionResult.highestBet,
    communityCards: game.communityCards,
    players: game.players // chips/status only — no hole cards live here
  };

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
  forceFoldIfCurrentActor
};