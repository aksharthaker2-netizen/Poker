// src/gameEngine/shuffle.js

/**
 * Performs a Fisher-Yates shuffle on a deck of cards.
 * This runs in O(n) time and ensures a perfectly random distribution.
 * 
 * @param {Array} deck - The un-shuffled deck array
 * @returns {Array} A new array containing the shuffled deck
 */
function shuffleDeck(deck) {
  // Create a shallow copy so we don't mutate the original array
  const shuffled = [...deck]; 
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap the elements
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

module.exports = { shuffleDeck };