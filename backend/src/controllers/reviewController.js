// src/controllers/reviewController.js
const gameRepository = require('../repositories/gameRepository');
const reviewService = require('../services/reviewService');

/**
 * Returns the review for a game, generating the BASIC (non-AI) version
 * on demand the first time it's requested if one doesn't exist yet — see
 * reviewService.generateBasicReview for exactly what that computes (real
 * fold/call/raise counts, hands won, chips won — zero ML dependency).
 * The full AI-enriched version (decisionScore/aiRecommended/
 * aiExplanation per action) still depends on reviewService.enrichWithAI,
 * which is a stub pending a contract with the ML side.
 */
async function getReview(req, res) {
  try {
    const { gameId } = req.params;

    let review = await gameRepository.findReview(gameId, req.userId);
    if (!review) {
      review = await reviewService.generateBasicReview(gameId, req.userId).catch(() => null);
    }

    if (!review) return res.status(404).json({ error: 'No review available for this game yet' });
    return res.json({ review });
  } catch (error) {
    console.error('[Review] getReview error:', error.message);
    return res.status(500).json({ error: 'Failed to load review' });
  }
}

/**
 * Returns a hand's actions with whatever AI annotations exist. Those
 * fields are simply null until reviewService.enrichWithAI is wired up —
 * the frontend should treat null as "not yet analyzed", not an error.
 */
async function getHandActions(req, res) {
  try {
    const { handId } = req.params;

    const hand = await gameRepository.findHandWithActions(handId);
    if (!hand) return res.status(404).json({ error: 'Hand not found' });

    const played = hand.actions.some((a) => a.userId === req.userId);
    if (!played) return res.status(403).json({ error: 'Not your hand' });

    return res.json({ hand });
  } catch (error) {
    console.error('[Review] getHandActions error:', error.message);
    return res.status(500).json({ error: 'Failed to load hand' });
  }
}

module.exports = { getReview, getHandActions };