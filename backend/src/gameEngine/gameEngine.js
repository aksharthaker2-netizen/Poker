// src/gameEngine/gameEngine.js
const { createDeck } = require('./deck');
const { shuffleDeck } = require('./shuffle');
const { dealPreFlop, dealCommunityCards } = require('./dealCards');
const { evaluateBestHand } = require('./handEvaluator');
const PotManager = require('./potManager');

const GAME_STATES = {
  WAITING: 'WAITING',
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN'
};

class GameEngine {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players; // Array of player objects: { id, chips, status }
    this.state = GAME_STATES.WAITING;
    
    this.deck = [];
    this.communityCards = [];
    this.playerHands = {}; // Maps playerId -> [card1, card2]
    
    this.potManager = new PotManager(players);
  }

  /**
   * Initializes a new hand, shuffles the deck, and deals hole cards.
   */
  startHand() {
    if (this.players.length < 2) throw new Error('Not enough players to start.');
    
    this.deck = shuffleDeck(createDeck());
    this.communityCards = [];
    this.state = GAME_STATES.PRE_FLOP;

    // Deal hole cards
    const { playersHands, remainingDeck } = dealPreFlop(this.deck, this.players.length);
    this.deck = remainingDeck;

    this.players.forEach((player, index) => {
      this.playerHands[player.id] = playersHands[index];
    });

    return { state: this.state, playerHands: this.playerHands };
  }

  /**
   * Advances the game to the next street (Flop, Turn, River, or Showdown).
   */
  nextStreet() {
    // Sweep any remaining bets from the previous round into the main/side pots
    this.potManager.sweepBetsToPot();

    if (this.state === GAME_STATES.PRE_FLOP) {
      this.state = GAME_STATES.FLOP;
      const { dealtCards, remainingDeck } = dealCommunityCards(this.deck, 3);
      this.communityCards.push(...dealtCards);
      this.deck = remainingDeck;
    } 
    else if (this.state === GAME_STATES.FLOP) {
      this.state = GAME_STATES.TURN;
      const { dealtCards, remainingDeck } = dealCommunityCards(this.deck, 1);
      this.communityCards.push(...dealtCards);
      this.deck = remainingDeck;
    } 
    else if (this.state === GAME_STATES.TURN) {
      this.state = GAME_STATES.RIVER;
      const { dealtCards, remainingDeck } = dealCommunityCards(this.deck, 1);
      this.communityCards.push(...dealtCards);
      this.deck = remainingDeck;
    } 
    else if (this.state === GAME_STATES.RIVER) {
      this.state = GAME_STATES.SHOWDOWN;
      return this.evaluateShowdown();
    }

    return { state: this.state, communityCards: this.communityCards };
  }

  /**
   * Calculates the winner(s) and distributes the pots.
   */
  evaluateShowdown() {
    const pots = this.potManager.sweepBetsToPot();
    const results = [];

    // Evaluate each pot independently (main pot + any side pots)
    pots.forEach((pot, potIndex) => {
      if (pot.amount === 0) return;

      let bestRank = -1;
      let winners = [];

      pot.eligiblePlayers.forEach(playerId => {
        const holeCards = this.playerHands[playerId];
        const handData = evaluateBestHand(holeCards, this.communityCards);
        
        // This is a simplified comparison; actual tie-breaking uses the score array
        if (handData.rank > bestRank) {
          bestRank = handData.rank;
          winners = [{ playerId, handData }];
        } else if (handData.rank === bestRank) {
          winners.push({ playerId, handData });
        }
      });

      // Split pot if there are multiple winners
      const payout = Math.floor(pot.amount / winners.length);
      results.push({ potIndex, amount: pot.amount, winners, payout });
    });

    this.state = GAME_STATES.WAITING;
    return results;
  }
}

module.exports = GameEngine;