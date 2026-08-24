// src/services/reviewService.js
const gameRepository = require('../repositories/gameRepository');
const mlService = require('./mlService');

/**
 * Generates a GameReview from data we already have — NO ML REQUIRED.
 * Computes real counts (folds/calls/raises, hands played/won, chips won)
 * directly from persisted HandAction rows, plus a couple of simple
 * rule-based observations on those numbers.
 *
 * This is deliberately NOT the full "AI Poker Coach" experience from the
 * original design — that needs per-decision scoring from the ML side
 * (see enrichWithAI below). This is a solid, honest, immediately-useful
 * summary that works today with zero dependency on your friend's work.
 */
async function generateBasicReview(gameId, userId) {
  const game = await gameRepository.findByIdWithHands(gameId);
  if (!game) throw new Error('Game not found');

  const myActions = game.hands.flatMap((h) => h.actions.filter((a) => a.userId === userId));
  if (myActions.length === 0) throw new Error('User did not play in this game');

  const handsPlayed = new Set(myActions.map((a) => a.handId)).size;
  const handsWon = game.hands.filter((h) => h.winnerSeatId === userId).length;

  const foldCount = myActions.filter((a) => a.action === 'FOLD').length;
  const callCount = myActions.filter((a) => a.action === 'CALL').length;
  const raiseCount = myActions.filter((a) => a.action === 'RAISE' || a.action === 'BET').length;

  const chipsWon = game.hands
    .filter((h) => h.winnerSeatId === userId)
    .reduce((sum, h) => sum + (h.potSize || 0), 0);

  // Simple, honest heuristics on real numbers — not AI, just thresholds.
  const strengths = [];
  const weaknesses = [];
  const totalActions = foldCount + callCount + raiseCount;
  const foldRate = totalActions > 0 ? foldCount / totalActions : 0;
  const raiseRate = totalActions > 0 ? raiseCount / totalActions : 0;

  if (raiseRate > 0.3) strengths.push('Plays aggressively — raises often instead of just calling');
  if (foldRate < 0.4) strengths.push('Stays in hands rather than folding early');
  if (foldRate > 0.7) weaknesses.push('Folds very frequently — may be playing too tight');
  if (raiseRate < 0.1 && totalActions > 5) weaknesses.push('Rarely raises — mostly calling along');

  const overallScore = Math.min(
    100,
    Math.max(0, Math.round(50 + (handsWon / Math.max(handsPlayed, 1)) * 50 - foldRate * 10))
  );

  return gameRepository.upsertReview(gameId, userId, {
    overallScore,
    chipsWon,
    handsPlayed,
    handsWon,
    foldCount,
    callCount,
    raiseCount,
    strengths,
    weaknesses,
    recommendation: weaknesses[0] || 'Keep playing to build a bigger sample of hands.'
  });
}

/**
 * NOT IMPLEMENTED — the actual "AI Poker Coach" enrichment (per-action
 * decisionScore/aiRecommended/aiExplanation on HandAction rows) depends
 * on mlService.requestHandReview(), which is a stub pending a contract
 * with the ML side. Calling this today is a safe no-op that returns null.
 */
async function enrichWithAI(gameId, userId) {
  const aiResult = await mlService.requestHandReview({ gameId, userId });
  if (!aiResult) return null; // expected until the ML endpoint exists

  // TODO once the contract exists: write decisionScore/aiRecommended/
  // aiExplanation back onto the relevant HandAction rows, and merge any
  // AI-generated strengths/weaknesses into the GameReview from above.
  return aiResult;
}

module.exports = { generateBasicReview, enrichWithAI };