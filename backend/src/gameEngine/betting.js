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
   *
   * IMPORTANT: sbAmount/bbAmount must be passed in explicitly (not derived
   * here from this.bigBlind), because GameEngine may have capped either
   * blind for a short-stacked player who can't cover the full amount.
   * bettingManager's tracked contribution MUST match what potManager
   * actually deducted from the player's chips, or the two will desync.
   *
   * @param {Array} activePlayers - Active player IDs this hand
   * @param {String} smallBlindId - Small blind player's ID
   * @param {Number} sbAmount - Actual chips posted by SB (capped if short-stacked)
   * @param {String} bigBlindId - Big blind player's ID
   * @param {Number} bbAmount - Actual chips posted by BB (capped if short-stacked)
   */
  startPreFlop(activePlayers, smallBlindId, sbAmount, bigBlindId, bbAmount) {
    this.startNewStreet(activePlayers);

    // The amount players must match to call is always the FULL big blind,
    // even if the BB themself is all-in for less (their own short-stack
    // status is handled via allInPlayers elsewhere, not by lowering highestBet).
    this.highestBet = this.bigBlind;
    this.minRaise = this.bigBlind;

    this.playerBetsThisRound[smallBlindId] = sbAmount;
    this.playerBetsThisRound[bigBlindId] = bbAmount;
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

    // STRICT RULE: If you already acted as the last full aggressor, you
    // cannot re-raise when only facing an incomplete (short-stack) all-in —
    // an incomplete raise does not reopen betting for players already at
    // the current bet level.
    const isFacingIncompleteRaise = amountToCall > 0 && amountToCall < this.minRaise;
    const isActionReopened = !(playerId === this.lastAggressor && isFacingIncompleteRaise);

    if (playerChips >= minRequiredForRaise && isActionReopened) {
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
   *
   * @param {String} playerId - The ID of the acting player
   * @param {String} action - The action taken (e.g., CALL, RAISE)
   * @param {Number} additionalChips - For RAISE, this is the incremental chips added *on top*
   *                                   of their current contribution this round, NOT the total bet.
   * @param {Number} playerChips - The player's total remaining chip stack
   */
  processAction(playerId, action, additionalChips, playerChips) {
    const { amountToCall, minRaiseAmount, legalActions } = this.getLegalActions(playerId, playerChips);

    if (!legalActions.includes(action)) {
      throw new Error(`Invalid action: ${action} is not permitted right now.`);
    }

    let chipsCommitted = 0;
    const currentContribution = this.playerBetsThisRound[playerId] || 0;

    switch (action) {
      case ACTIONS.FOLD:
      case ACTIONS.CHECK:
        chipsCommitted = 0;
        break;

      case ACTIONS.CALL:
        chipsCommitted = amountToCall;
        break;

      case ACTIONS.RAISE:
        if (additionalChips < minRaiseAmount && additionalChips !== playerChips) {
          throw new Error(`Raise amount must be at least ${minRaiseAmount}`);
        }
        chipsCommitted = additionalChips;

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

          // STRICT RULE: Only a FULL raise (>= current minRaise) reopens
          // action for players who already matched the previous bet level.
          // A short all-in still raises the amount to call, but does not
          // grant re-raising rights back to the prior aggressor.
          if (allInRaiseSize >= this.minRaise) {
            this.minRaise = allInRaiseSize;
            this.lastAggressor = playerId;
          }

          this.highestBet = totalWithAllIn;
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