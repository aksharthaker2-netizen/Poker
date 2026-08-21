// src/gameEngine/shuffle.js
const { randomInt } = require('crypto');

/**
 * Performs a Fisher-Yates shuffle on a deck of cards.
 * Uses Node's native crypto module for cryptographically secure randomization
 * to prevent PRNG state deduction attacks.
 * 
 * @param {Array} deck - The un-shuffled deck array
 * @returns {Array} A new array containing the shuffled deck
 */
function shuffleDeck(deck) {
  // Create a shallow copy so we don't mutate the original array
  const shuffled = [...deck]; 
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a cryptographically secure random index from 0 to i (inclusive)
    const j = randomInt(0, i + 1);
    
    // Swap the elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

module.exports = { shuffleDeck };