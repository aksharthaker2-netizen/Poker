// src/utils/pokerPosition.js

/**
 * Approximates a poker position label for the ML service's contract,
 * which only accepts five buckets: 'button' | 'blinds' | 'early' |
 * 'middle' | 'late'. This is a simplification of real position
 * nomenclature (no distinct UTG/UTG+1/HJ/CO labels) — good enough for
 * what the model actually consumes.
 */
function computePosition(dealerIndex, playerIndex, numPlayers) {
  if (numPlayers <= 1) return 'button';

  const distanceFromDealer = (playerIndex - dealerIndex + numPlayers) % numPlayers;

  if (distanceFromDealer === 0) return 'button';
  if (numPlayers <= 3) return 'blinds'; // heads-up/3-handed: everyone else is effectively a blind seat
  if (distanceFromDealer === 1 || distanceFromDealer === 2) return 'blinds';

  const seatsAfterBlinds = numPlayers - 3; // seats that aren't button or a blind
  const orderFromUtg = distanceFromDealer - 2; // 1 = UTG, increasing toward the button
  const third = Math.max(1, Math.ceil(seatsAfterBlinds / 3));

  if (orderFromUtg <= third) return 'early';
  if (orderFromUtg <= third * 2) return 'middle';
  return 'late';
}

module.exports = { computePosition };