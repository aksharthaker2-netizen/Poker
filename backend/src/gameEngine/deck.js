// src/gameEngine/deck.js
const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      const value = i + 2; // '2'=2 ... 'A'=14
      deck.push({ suit, rank, value });
    }
  }
  return deck;
}

module.exports = { createDeck };