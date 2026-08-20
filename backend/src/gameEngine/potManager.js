// src/gameEngine/potManager.js

class PotManager {
  constructor(players) {
    // players = [{ id: 'user_1', chips: 1000 }, { id: 'user_2', chips: 1000 }]
    this.playerChips = {};
    this.currentRoundBets = {};
    this.activePlayers = new Set();
    
    players.forEach(p => {
      this.playerChips[p.id] = p.chips;
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
    if (amount > this.playerChips[playerId]) {
      throw new Error(`Player ${playerId} cannot bet more than their chip stack.`);
    }

    this.playerChips[playerId] -= amount;
    this.currentRoundBets[playerId] += amount;
    
    return {
      success: true,
      remainingChips: this.playerChips[playerId],
      totalBetThisRound: this.currentRoundBets[playerId]
    };
  }

  /**
   * Processes a player folding, removing them from future pot eligibility.
   */
  processFold(playerId) {
    this.activePlayers.delete(playerId);
    // Update eligible players in all existing pots
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
      .sort((a, b) => a[1] - b[1]); // Sort by bet amount ascending

    let processedAmount = 0;

    for (const [playerId, betAmount] of bets) {
      const contribution = betAmount - processedAmount;
      if (contribution <= 0) continue;

      // Add chips to the current active pot
      let currentPot = this.pots[this.pots.length - 1];
      
      // Calculate how many active players can match this contribution
      const contributors = Object.keys(this.currentRoundBets).filter(
        id => this.currentRoundBets[id] >= betAmount
      );

      currentPot.amount += contribution * contributors.length;

      // If a player is all-in (has 0 chips left), we must cap this pot and start a new side pot
      if (this.playerChips[playerId] === 0 && this.activePlayers.has(playerId)) {
        const nextEligible = contributors.filter(id => id !== playerId && this.activePlayers.has(id));
        this.pots.push({ amount: 0, eligiblePlayers: nextEligible });
      }

      processedAmount = betAmount;
    }

    // Reset round bets for the next street (Flop, Turn, etc.)
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