// src/gameEngine/handEvaluator.js

const HAND_RANKS = {
  ROYAL_FLUSH: 10,
  STRAIGHT_FLUSH: 9,
  FOUR_OF_A_KIND: 8,
  FULL_HOUSE: 7,
  FLUSH: 6,
  STRAIGHT: 5,
  THREE_OF_A_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH_CARD: 1
};

/**
 * Generates all 5-card combinations from a pool of 7 cards using backtracking.
 * (7 choose 5 = 21 possible combinations)
 */
function getCombinations(cards, comboSize = 5) {
  const results = [];
  
  function backtrack(start, currentCombo) {
    if (currentCombo.length === comboSize) {
      results.push([...currentCombo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      currentCombo.push(cards[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }
  
  backtrack(0, []);
  return results;
}

/**
 * Evaluates a single 5-card hand and returns its rank and tie-breaker score.
 */
function evaluateFiveCards(fiveCards) {
  // Sort cards by value descending (e.g., 14 down to 2)
  const sorted = [...fiveCards].sort((a, b) => b.value - a.value);
  
  const isFlush = sorted.every(card => card.suit === sorted[0].suit);
  
  // Check for straight
  let isStraight = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].value - 1 !== sorted[i + 1].value) {
      isStraight = false;
      break;
    }
  }
  
  // Special case: Low Ace Straight (A, 2, 3, 4, 5) -> values 14, 5, 4, 3, 2
  if (!isStraight && sorted[0].value === 14 && sorted[1].value === 5 && sorted[4].value === 2) {
    isStraight = true;
    // Move the Ace to the end to treat it as a '1' for tie-breaking
    const ace = sorted.shift();
    sorted.push(ace);
  }

  // Frequency Map for values (e.g., { '10': 2, '14': 2, '5': 1 })
  const counts = {};
  sorted.forEach(card => {
    counts[card.value] = (counts[card.value] || 0) + 1;
  });

  const frequencies = Object.values(counts).sort((a, b) => b - a);
  const tieBreakerValues = sorted.map(c => c.value);

  // 1. Royal & Straight Flush
  if (isFlush && isStraight) {
    if (sorted[0].value === 14 && sorted[1].value === 13) {
      return { rank: HAND_RANKS.ROYAL_FLUSH, name: 'Royal Flush', score: tieBreakerValues };
    }
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, name: 'Straight Flush', score: tieBreakerValues };
  }

  // 2. Four of a Kind
  if (frequencies[0] === 4) {
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, name: 'Four of a Kind', score: tieBreakerValues };
  }

  // 3. Full House
  if (frequencies[0] === 3 && frequencies[1] === 2) {
    return { rank: HAND_RANKS.FULL_HOUSE, name: 'Full House', score: tieBreakerValues };
  }

  // 4. Flush
  if (isFlush) return { rank: HAND_RANKS.FLUSH, name: 'Flush', score: tieBreakerValues };

  // 5. Straight
  if (isStraight) return { rank: HAND_RANKS.STRAIGHT, name: 'Straight', score: tieBreakerValues };

  // 6. Three of a Kind
  if (frequencies[0] === 3) {
    return { rank: HAND_RANKS.THREE_OF_A_KIND, name: 'Three of a Kind', score: tieBreakerValues };
  }

  // 7. Two Pair
  if (frequencies[0] === 2 && frequencies[1] === 2) {
    return { rank: HAND_RANKS.TWO_PAIR, name: 'Two Pair', score: tieBreakerValues };
  }

  // 8. One Pair
  if (frequencies[0] === 2) {
    return { rank: HAND_RANKS.ONE_PAIR, name: 'One Pair', score: tieBreakerValues };
  }

  // 9. High Card
  return { rank: HAND_RANKS.HIGH_CARD, name: 'High Card', score: tieBreakerValues };
}

/**
 * Main exposed function: Takes 2 hole cards and 5 community cards.
 * Returns the best possible 5-card hand.
 */
function evaluateBestHand(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  const allCombos = getCombinations(allCards, 5);
  
  let bestHand = null;

  for (const combo of allCombos) {
    const evaluated = evaluateFiveCards(combo);
    
    if (!bestHand) {
      bestHand = { cards: combo, ...evaluated };
      continue;
    }

    // Compare ranks
    if (evaluated.rank > bestHand.rank) {
      bestHand = { cards: combo, ...evaluated };
    } 
    // If ranks are identical, compare high cards down the line
    else if (evaluated.rank === bestHand.rank) {
      for (let i = 0; i < evaluated.score.length; i++) {
        if (evaluated.score[i] > bestHand.score[i]) {
          bestHand = { cards: combo, ...evaluated };
          break;
        } else if (evaluated.score[i] < bestHand.score[i]) {
          break; // The existing bestHand is better
        }
      }
    }
  }

  return bestHand;
}

module.exports = { evaluateBestHand };