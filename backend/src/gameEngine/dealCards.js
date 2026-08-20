// src/gameEngine/dealCards.js

/**
 * Deals starting hands to the specified number of players.
 * 
 * @param {Array} shuffledDeck - The randomized deck
 * @param {Number} numPlayers - The amount of players at the table
 * @returns {Object} { playersHands: [...], remainingDeck: [...] }
 */
function dealPreFlop(shuffledDeck, numPlayers) {
  const playersHands = Array.from({ length: numPlayers }, () => []);
  const deck = [...shuffledDeck];

  // In real Texas Hold'em, cards are dealt one at a time to each player
  for (let cardCount = 0; cardCount < 2; cardCount++) {
    for (let player = 0; player < numPlayers; player++) {
      // pop() removes and returns the top card from the deck array
      playersHands[player].push(deck.pop()); 
    }
  }

  return {
    playersHands,
    remainingDeck: deck
  };
}

/**
 * Deals community cards (Flop = 3, Turn = 1, River = 1)
 * 
 * @param {Array} deck - The current remaining deck
 * @param {Number} numCards - 3 for Flop, 1 for Turn/River
 * @returns {Object} { dealtCards: [...], remainingDeck: [...] }
 */
function dealCommunityCards(deck, numCards) {
  const currentDeck = [...deck];
  
  // Burn a card (standard poker rule to prevent cheating)
  currentDeck.pop(); 
  
  const dealtCards = [];
  for (let i = 0; i < numCards; i++) {
    dealtCards.push(currentDeck.pop());
  }

  return {
    dealtCards,
    remainingDeck: currentDeck
  };
}

module.exports = { dealPreFlop, dealCommunityCards };