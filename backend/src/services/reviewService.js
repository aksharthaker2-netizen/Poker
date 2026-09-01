// src/services/reviewService.js
const gameRepository = require('../repositories/gameRepository');
const mlService = require('./mlService');

/**
 * Real-time AI annotation, run automatically after EVERY hand (called
 * from persistenceService.persistCompletedHand, once per human seat).
 * Sends that hand's decision points — captured live in gameSocket.js's
 * PLAYER_ACTION handler as the human actually played, via
 * mlContextBuilder — to /analyze, and writes the returned feedback onto
 * the corresponding HandAction rows (decisionScore/aiRecommended/
 * aiExplanation — fields the schema has carried since day one
 * specifically for this).
 *
 * Deliberately does NOT touch GameReview — that's generateBasicReview's
 * job, on-demand, and it now reads these same annotations to enrich its
 * output (see below). Keeping the two separate means a GameReview can
 * always be regenerated fresh from whatever HandAction data exists,
 * rather than this function needing to know how to merge into a
 * long-lived aggregate record itself.
 */
async function analyzeAndAnnotate(room, userId) {
  const decisionPoints = room.humanDecisionPoints?.get(userId);
  const handActionIds = room.humanHandActionIds?.get(userId);

  if (!decisionPoints || decisionPoints.length === 0) return; // didn't act this hand (sat out / already busted)

  try {
    const result = await mlService.requestHandAnalysis(decisionPoints, room.settings.bigBlind);
    if (!result || !Array.isArray(result.mistakes)) return; // ML unavailable — mlService already logged why

    await Promise.all(
      result.mistakes.map(async (mistake) => {
        const handActionId = handActionIds?.[mistake.decision_point];
        if (!handActionId) return; // index out of range — defensive, shouldn't normally happen

        // The ML service doesn't return a direct per-decision score, only
        // estimated_ev_loss_bb for actual mistakes — this is a rough,
        // clearly-approximate 0-100 conversion. Non-mistake decisions are
        // left with decisionScore: null (not 100) — the frontend should
        // read null as "not flagged as a mistake," not "graded perfect,"
        // since /analyze doesn't confirm optimal plays, only flag bad ones.
        const decisionScore = Math.max(0, 100 - Math.round((mistake.estimated_ev_loss_bb || 0) * 4));

        await gameRepository.annotateHandAction(handActionId, {
          decisionScore,
          aiRecommended: (mistake.recommended_action || '').toUpperCase() || null,
          aiExplanation: mistake.situation_summary || null
        });
      })
    );
  } catch (error) {
    // AI annotation is an enrichment layer on top of core gameplay — must
    // never break the hand-completion flow it's called from.
    console.error(`[Review] AI analysis failed for user ${userId}:`, error.message);
  }
}

/**
 * Generates/refreshes a GameReview. Computes real counts (folds/calls/
 * raises, hands played/won, chips won) directly from persisted HandAction
 * rows — this part needs no ML at all. When AI annotations exist on
 * those rows (from analyzeAndAnnotate above), blends them in for a
 * meaningfully better score and real mistake-based weaknesses instead of
 * generic fold/raise-rate heuristics; falls back to the heuristic-only
 * version when no annotations exist (ML was down, or this game was
 * played before the AI coach was wired up).
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

  const totalActions = foldCount + callCount + raiseCount;
  const foldRate = totalActions > 0 ? foldCount / totalActions : 0;
  const raiseRate = totalActions > 0 ? raiseCount / totalActions : 0;

  const strengths = [];
  const weaknesses = [];
  if (raiseRate > 0.3) strengths.push('Plays aggressively — raises often instead of just calling');
  if (foldRate < 0.4) strengths.push('Stays in hands rather than folding early');
  if (foldRate > 0.7) weaknesses.push('Folds very frequently — may be playing too tight');
  if (raiseRate < 0.1 && totalActions > 5) weaknesses.push('Rarely raises — mostly calling along');

  const heuristicScore = Math.min(
    100,
    Math.max(0, Math.round(50 + (handsWon / Math.max(handsPlayed, 1)) * 50 - foldRate * 10))
  );

  // AI enrichment, when available.
  const annotatedActions = myActions.filter(
    (a) => a.decisionScore !== null && a.decisionScore !== undefined
  );

  let overallScore = heuristicScore;
  if (annotatedActions.length > 0) {
    overallScore = Math.round(
      annotatedActions.reduce((sum, a) => sum + a.decisionScore, 0) / annotatedActions.length
    );

    // Surface the AI's actual worst mistakes ahead of the generic
    // heuristic weaknesses computed above.
    const worstMistakes = [...annotatedActions]
      .sort((a, b) => a.decisionScore - b.decisionScore)
      .slice(0, 2)
      .filter((a) => a.decisionScore < 60 && a.aiExplanation);

    if (worstMistakes.length > 0) {
      weaknesses.unshift(...worstMistakes.map((a) => a.aiExplanation));
    }
  }

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

module.exports = { generateBasicReview, analyzeAndAnnotate };