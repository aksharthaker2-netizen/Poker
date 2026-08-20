// src/gameEngine/betting.js

const ACTIONS = {
  FOLD: 'FOLD',
  CHECK: 'CHECK',
  CALL: 'CALL',
  RAISE: 'RAISE',
  ALL_IN: 'ALL_IN'
};

class BettingManager {
  /**
   * @param {Number} bigBlind - The base big blind amount for the room
   */
  constructor(bigBlind) {
    this.bigBlind = bigBlind;
    this.highestBet = 0;
    this.minRaise = bigBlind;
    this.lastAggressor = null;
    
    // Tracks the total amount each player has put in during the CURRENT street
    this.playerBetsThisRound = {}; 
  }

  /**
   * Resets the betting state for a new street (Flop, Turn, River).
   * @param {Array} activePlayers - Array of active player IDs
   */
  startNewStreet(activePlayers) {
    this.highestBet = 0;
    this.minRaise = this.bigBlind;
    this.lastAggressor = null;
    
    activePlayers.forEach(playerId => {
      this.playerBetsThisRound[playerId] = 0;
    });
  }

  /**
   * Special setup strictly for the Pre-Flop round.
   */
  startPreFlop(activePlayers, smallBlindId, bigBlindId) {
    this.startNewStreet(activePlayers);
    
    this.highestBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    
    this.playerBetsThisRound[smallBlindId] = this.bigBlind / 2;
    this.playerBetsThisRound[bigBlindId] = this.bigBlind;
    this.lastAggressor = bigBlindId;
  }

  /**
   * Calculates what actions a player is legally allowed to take.
   */
  getLegalActions(playerId, playerChips) {
    const currentContribution = this.playerBetsThisRound[playerId] || 0;
    const amountToCall = this.highestBet - currentContribution;
    
    const legalActions = [ACTIONS.FOLD, ACTIONS.ALL_IN];

    // Can they check? (Only if they have already matched the highest bet)
    if (amountToCall === 0) {
      legalActions.push(ACTIONS.CHECK);
    } 
    // Can they call? (If they have enough chips to match, but not an all-in)
    else if (playerChips > amountToCall) {
      legalActions.push(ACTIONS.CALL);
    }

    // Can they raise? (Must have enough chips for the call + minimum raise)
    const minRequiredForRaise = amountToCall + this.minRaise;
    if (playerChips >= minRequiredForRaise) {
      legalActions.push(ACTIONS.RAISE);
    }

    return {
      amountToCall,
      minRaiseAmount: minRequiredForRaise,
      legalActions
    };
  }

  /**
   * Validates and processes a player's chosen action.
   */
  processAction(playerId, action, amount, playerChips) {
    const { amountToCall, minRaiseAmount, legalActions } = this.getLegalActions(playerId, playerChips);

    if (!legalActions.includes(action)) {
      throw new Error(`Invalid action: ${action} is not permitted right now.`);
    }

    let chipsCommitted = 0;
    const currentContribution = this.playerBetsThisRound[playerId] || 0;

    switch (action) {
      case ACTIONS.FOLD:
        chipsCommitted = 0;
        break;

      case ACTIONS.CHECK:
        chipsCommitted = 0;
        break;

      case ACTIONS.CALL:
        chipsCommitted = amountToCall;
        break;

      case ACTIONS.RAISE:
        if (amount < minRaiseAmount && amount !== playerChips) {
          throw new Error(`Raise amount must be at least ${minRaiseAmount}`);
        }
        chipsCommitted = amount;
        
        // The new minimum raise becomes the difference between this raise and the previous highest bet
        const raiseSize = (currentContribution + chipsCommitted) - this.highestBet;
        if (raiseSize > this.minRaise) {
          this.minRaise = raiseSize;
        }
        
        this.highestBet = currentContribution + chipsCommitted;
        this.lastAggressor = playerId;
        break;

      case ACTIONS.ALL_IN:
        chipsCommitted = playerChips;
        const totalWithAllIn = currentContribution + chipsCommitted;
        
        if (totalWithAllIn > this.highestBet) {
          const allInRaiseSize = totalWithAllIn - this.highestBet;
          if (allInRaiseSize > this.minRaise) {
            this.minRaise = allInRaiseSize;
          }
          this.highestBet = totalWithAllIn;
          this.lastAggressor = playerId;
        }
        break;
    }

    this.playerBetsThisRound[playerId] = currentContribution + chipsCommitted;
    
    return chipsCommitted;
  }

  /**
   * Checks if the betting round is officially over.
   * (Everyone has either folded, gone all-in, or matched the highest bet)
   */
  isRoundComplete(activePlayers, allInPlayers) {
    // If only one active player is left (everyone else folded), the round/hand is over
    if (activePlayers.length === 1) return true;

    // Filter out players who are all-in; they don't need to act anymore
    const playersPendingAction = activePlayers.filter(id => !allInPlayers.has(id));

    // If everyone left is all-in, or there's only 1 player not all-in (and they've matched), it's complete
    if (playersPendingAction.length <= 1 && this.highestBet > 0) {
       // We just need to ensure the 1 remaining player isn't facing a raise they haven't called
       if (playersPendingAction.length === 1) {
           return this.playerBetsThisRound[playersPendingAction[0]] === this.highestBet;
       }
       return true;
    }

    // Check if every player who needs to act has matched the highest bet
    return playersPendingAction.every(id => {
      const contribution = this.playerBetsThisRound[id] || 0;
      return contribution === this.highestBet;
    });
  }
}

module.exports = { BettingManager, ACTIONS };