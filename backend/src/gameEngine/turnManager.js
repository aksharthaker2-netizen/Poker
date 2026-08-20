// src/gameEngine/turnManager.js

class TurnManager {
  /**
   * @param {Array} activePlayerIds - Array of active player IDs (e.g., ['user1', 'user2', 'user3'])
   */
  constructor(activePlayerIds) {
    if (activePlayerIds.length < 2) {
      throw new Error("A minimum of 2 players is required.");
    }
    this.players = activePlayerIds;
    this.dealerIndex = 0; // The button starts at the first player
    this.currentPlayerIndex = -1;
  }

  /**
   * Advances the dealer button for a new hand and determines the blinds.
   * @returns {Object} Indices for Dealer, Small Blind, and Big Blind
   */
  setupNewHand() {
    const numPlayers = this.players.length;
    
    // Move the button to the next player
    this.dealerIndex = (this.dealerIndex + 1) % numPlayers;

    let smallBlindIndex, bigBlindIndex, firstActorIndex;

    // Head-to-head (Heads-up) rules are slightly different
    if (numPlayers === 2) {
      smallBlindIndex = this.dealerIndex;
      bigBlindIndex = (this.dealerIndex + 1) % 2;
      firstActorIndex = smallBlindIndex; // SB acts first pre-flop
    } else {
      smallBlindIndex = (this.dealerIndex + 1) % numPlayers;
      bigBlindIndex = (this.dealerIndex + 2) % numPlayers;
      firstActorIndex = (this.dealerIndex + 3) % numPlayers; // "Under the Gun" acts first pre-flop
    }

    this.currentPlayerIndex = firstActorIndex;

    return {
      dealerId: this.players[this.dealerIndex],
      smallBlindId: this.players[smallBlindIndex],
      bigBlindId: this.players[bigBlindIndex],
      currentActorId: this.players[this.currentPlayerIndex]
    };
  }

  /**
   * Resets the turn to the first active player for Post-Flop betting rounds.
   * (Action always starts with the first active player left of the dealer)
   */
  resetTurnForNextStreet(activePlayerIdsThisRound) {
    const numPlayers = this.players.length;
    let nextActorIndex = (this.dealerIndex + 1) % numPlayers;

    // Find the first player left of the dealer who hasn't folded
    while (!activePlayerIdsThisRound.includes(this.players[nextActorIndex])) {
      nextActorIndex = (nextActorIndex + 1) % numPlayers;
    }

    this.currentPlayerIndex = nextActorIndex;
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Advances the action to the next active player during a betting round.
   */
  moveToNextPlayer(activePlayerIdsThisRound) {
    const numPlayers = this.players.length;
    let nextIndex = (this.currentPlayerIndex + 1) % numPlayers;

    // Skip players who have folded or are all-in
    while (!activePlayerIdsThisRound.includes(this.players[nextIndex])) {
      nextIndex = (nextIndex + 1) % numPlayers;
      
      // Safety break to prevent infinite loops if something goes wrong
      if (nextIndex === this.currentPlayerIndex) break; 
    }

    this.currentPlayerIndex = nextIndex;
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Handles when a player leaves the table entirely.
   */
  removePlayer(playerId) {
    const index = this.players.indexOf(playerId);
    if (index > -1) {
      this.players.splice(index, 1);
      // Adjust indices if necessary so we don't skip a player's turn
      if (this.dealerIndex >= this.players.length) this.dealerIndex = 0;
      if (this.currentPlayerIndex >= this.players.length) this.currentPlayerIndex = 0;
    }
  }
}

module.exports = TurnManager;