// src/controllers/reviewController.js
const prisma = require('../config/db');

/**
 * Returns the AI Coach summary for a game, IF one has been generated.
 * Reading is not ML-dependent — this table is just Postgres. Writing to
 * it (the actual analysis) is NOT implemented yet: that needs
 * reviewService.js to call your friend's ML service with the game's full
 * hand history and get back overallScore/strengths/weaknesses/etc, which
 * depends on an endpoint contract that doesn't exist yet. Until that's
 * wired up, this will simply 404 for every game — expected, not a bug.
 */
async function getReview(req, res) {
  try {
    const { gameId } = req.params;

    const review = await prisma.gameReview.findUnique({
      where: { gameId_userId: { gameId, userId: req.userId } }
    });

    if (!review) {
      return res.status(404).json({ error: 'No review available for this game yet' });
    }
    return res.json({ review });
  } catch (error) {
    console.error('[Review] getReview error:', error.message);
    return res.status(500).json({ error: 'Failed to load review' });
  }
}

/**
 * Returns a hand's actions with whatever AI annotations exist
 * (decisionScore / aiRecommended / aiExplanation on each HandAction row).
 * Those three fields are simply null until reviewService.js is wired up —
 * the frontend should treat null as "not yet analyzed", not an error.
 */
async function getHandActions(req, res) {
  try {
    const { handId } = req.params;

    const hand = await prisma.hand.findUnique({
      where: { id: handId },
      include: { actions: { orderBy: { sequenceInHand: 'asc' } } }
    });

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