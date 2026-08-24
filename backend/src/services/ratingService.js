// src/services/ratingService.js

const MIN_DELTA = -20;
const MAX_DELTA = 20;
const CHIPS_PER_RATING_POINT = 20;

/**
 * Small, bounded rating nudge tied to a single hand's net chip result.
 * Deliberately simple — not a rigorous poker rating system (that would
 * need something like all-in-adjusted EV tracking across a whole
 * session) — just enough to make the leaderboard move in response to
 * real outcomes without wild single-hand swings.
 *
 * Extracted out of persistenceService.js so the actual formula lives in
 * one obvious place if you want to tune it later (e.g. weighting by
 * stakes, or a proper Elo-style calc once "who beat whom" is trackable).
 */
function calculateHandRatingDelta(netChipChange) {
  const raw = Math.round(netChipChange / CHIPS_PER_RATING_POINT);
  return Math.max(MIN_DELTA, Math.min(MAX_DELTA, raw));
}

module.exports = { calculateHandRatingDelta };