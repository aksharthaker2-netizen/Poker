// src/services/mlContextBuilder.js
const { toMlCards } = require('../utils/cardFormat');
const { computePosition } = require('../utils/pokerPosition');

/**
 * Builds the exact payload shape the ML service's /decide, /hint, and
 * /analyze endpoints expect (see ml-service-api-guide.pdf), for whichever
 * player (`actorId`) is about to act. Shared by botManager (bot turns),
 * gameSocket's GET_HINT handler (human hint requests), and PLAYER_ACTION
 * (capturing decision points for post-hand /analyze) — one place that
 * knows how to translate our engine's internal state into their contract.
 *
 * Returns RAW (actual) chip values — the BB=10 normalization workaround
 * (see mlService.js) happens at the HTTP-call boundary, not here, so this
 * function only has to know "what's true about the game."
 */
function buildDecisionContext(room, actorId) {
  const game = room.game;
  if (!game) throw new Error('No active game');

  const actor = game.players.find((p) => p.id === actorId);
  if (!actor) throw new Error('Player is not active in this hand');

  const holeCards = game.playerHands[actorId] || [];
  const { amountToCall, minRaiseAmount } = game.bettingManager.getLegalActions(actorId, actor.chips);

  // Seat labels: the ML contract requires the ACTING player's own stack
  // to be keyed literally "bot_seat" (guide limitation #2), regardless of
  // whether it's actually a bot (/decide) or a human requesting a hint
  // (/hint) — it's just the fixed key name the service expects for "the
  // seat we're deciding for." Everyone else gets a generic seat_N label,
  // consistent between stack_sizes and action_history for this request.
  const seatLabels = new Map();
  let seatCounter = 1;
  const stackSizes = {};

  game.players.forEach((p) => {
    const label = p.id === actorId ? 'bot_seat' : `seat_${seatCounter++}`;
    seatLabels.set(p.id, label);
    stackSizes[label] = p.chips;
  });

  const dealerIndex = game.turnManager.dealerIndex;
  const actorIndex = game.players.findIndex((p) => p.id === actorId);
  const position = computePosition(dealerIndex, actorIndex, game.players.length);

  const bettingRoundMap = { PRE_FLOP: 'preflop', FLOP: 'flop', TURN: 'turn', RIVER: 'river' };
  const bettingRound = bettingRoundMap[game.state] || 'preflop';

  // Only THIS street's actions — raise counts and "who's acted" reset
  // each street in NLHE, matching what the guide says the service scans
  // for ("how many real raises have happened"). Includes the actor's OWN
  // past actions this street too, per the guide, labeled "bot_seat" like
  // everything else about this seat.
  const actionHistory = (game.actionLog || [])
    .filter((entry) => entry.stage === game.state)
    .map((entry) => `${seatLabels.get(entry.playerId) || 'seat_x'}:${entry.action.toLowerCase()}:${entry.amount}`);

  return {
    hole_cards: toMlCards(holeCards),
    community_cards: toMlCards(game.communityCards),
    pot_size: game.potManager.getTotalPotSize(),
    to_call: amountToCall,
    min_raise: minRaiseAmount,
    stack_sizes: stackSizes,
    position,
    num_active_players: game.players.length,
    betting_round: bettingRound,
    action_history: actionHistory
  };
}

module.exports = { buildDecisionContext };