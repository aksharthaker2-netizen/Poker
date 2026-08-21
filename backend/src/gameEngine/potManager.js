// src/gameEngine/potManager.js

class PotManager {
  /**
   * @param {Array} players - Array of references to the GameEngine's player objects
   */
  constructor(players) {
    this.playerMap = new Map();
    this.currentRoundBets = {};
    this.activePlayers = new Set();
    
    players.forEach(p => {
      // Store the literal object reference for a single source of truth
      this.playerMap.set(p.id, p); 
      this.currentRoundBets[p.id] = 0;
      this.activePlayers.add(p.id);
    });

    this.pots = [{ amount: 0, eligiblePlayers: Array.from(this.activePlayers) }];
  }

  /**
   * Validates and processes a player's bet or call.
   */
  processBet(playerId, amount) {
    if (!this.activePlayers.has(playerId)) {
      throw new Error(`Player ${playerId} is not active in this hand.`);
    }

    const player = this.playerMap.get(playerId);
    if (amount > player.chips) {
      throw new Error(`Player ${playerId} cannot bet more than their chip stack.`);
    }

    // Directly modifies the single source of truth (GameEngine's player array)
    player.chips -= amount;
    this.currentRoundBets[playerId] += amount;
    
    return {
      success: true,
      remainingChips: player.chips,
      totalBetThisRound: this.currentRoundBets[playerId]
    };
  }

  /**
   * Processes a player folding, removing them from future pot eligibility.
   */
  processFold(playerId) {
    this.activePlayers.delete(playerId);
    this.pots.forEach(pot => {
      pot.eligiblePlayers = pot.eligiblePlayers.filter(id => id !== playerId);
    });
  }

  /**
   * Sweeps all bets from the current round into the pot(s).
   * Calculates side pots if players went all-in.
   */
  sweepBetsToPot() {
    const bets = Object.entries(this.currentRoundBets)
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => a[1] - b[1]);

    let processedAmount = 0;

    for (const [playerId, betAmount] of bets) {
      const contribution = betAmount - processedAmount;
      if (contribution <= 0) continue;

      let currentPot = this.pots[this.pots.length - 1];
      
      const contributors = Object.keys(this.currentRoundBets).filter(
        id => this.currentRoundBets[id] >= betAmount
      );

      currentPot.amount += contribution * contributors.length;

      // Access the single source of truth to check for all-in status
      const player = this.playerMap.get(playerId);
      if (player.chips === 0 && this.activePlayers.has(playerId)) {
        const nextEligible = contributors.filter(id => id !== playerId && this.activePlayers.has(id));
        this.pots.push({ amount: 0, eligiblePlayers: nextEligible });
      }

      processedAmount = betAmount;
    }

    Object.keys(this.currentRoundBets).forEach(id => {
      this.currentRoundBets[id] = 0;
    });

    return this.pots;
  }

  /**
   * Returns the total amount of chips across all pots.
   */
  getTotalPotSize() {
    return this.pots.reduce((total, pot) => total + pot.amount, 0);
  }
}

module.exports = PotManager;