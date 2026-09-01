// src/utils/cardFormat.js

const SUIT_LETTER = { Hearts: 'h', Diamonds: 'd', Clubs: 'c', Spades: 's' };
const RANK_LETTER = { '10': 'T' }; // 2-9, J, Q, K, A already match the ML service's expected format as-is

/**
 * Converts our internal card object {suit:'Hearts', rank:'10', value:10}
 * into the ML service's "Ah" / "Td" short-code format (see
 * ml-service-api-guide.pdf — rank + suit letter, ranks 2-9/T/J/Q/K/A,
 * suits h/d/c/s).
 */
function toMlCard(card) {
  const rank = RANK_LETTER[card.rank] || card.rank;
  const suit = SUIT_LETTER[card.suit];
  return `${rank}${suit}`;
}

function toMlCards(cards) {
  return (cards || []).map(toMlCard);
}

module.exports = { toMlCard, toMlCards };