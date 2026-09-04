// src/gameEngine/gameEngine.js
const { createDeck } = require('./deck');
const { shuffleDeck } = require('./shuffle');
const { dealPreFlop, dealCommunityCards } = require('./dealCards');
const { evaluateBestHand } = require('./handEvaluator');
const PotManager = require('./potManager');
const TurnManager = require('./turnManager');
const { BettingManager, ACTIONS } = require('./betting');

const GAME_STATES = {
  WAITING: 'WAITING',
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN'
};

class GameEngine {
  constructor(roomId, players, bigBlind = 20) {
    this.roomId = roomId;
    this.players = players; // Array of player objects: { id, chips, status }
    this.bigBlind = bigBlind;
    this.state = GAME_STATES.WAITING;

    this.deck = [];
    this.communityCards = [];
    this.playerHands = {};

    const activePlayerIds = this.players.map(p => p.id);
    this.turnManager = new TurnManager(activePlayerIds);
    this.bettingManager = new BettingManager(this.bigBlind);
    this.potManager = new PotManager(this.players);
  }

  /**
   * Initializes a new hand: removes busted players, deals cards, posts blinds.
   */
  startHand() {
    // 1. Determine who busted since the last hand (0 chips remaining)
    const previousIds = this.players.map(p => p.id);
    this.players = this.players.filter(p => p.chips > 0);
    const currentIds = this.players.map(p => p.id);
    const bustedIds = previousIds.filter(id => !currentIds.includes(id));

    // 2. FIX: Sync TurnManager so it never selects a busted player as
    //    dealer/blind/current-actor. TurnManager keeps its own internal
    //    player array, so it must be told explicitly when someone leaves.
    bustedIds.forEach(id => this.turnManager.removePlayer(id));

    if (this.players.length < 2) throw new Error('Not enough players to start.');

    // Reset per-hand persistence bookkeeping. `_dbHandId` is set/cleared
    // by persistenceService.js as hands are created/finalized in the DB;
    // `actionSequence`/`lastAction` are read by gameFlowManager.js after
    // every handlePlayerAction() call to log a HandAction row without
    // every socket handler needing to duplicate that logic.
    this._dbHandId = null;
    this.actionSequence = 0;
    this.lastAction = null;
    // Full-hand action log (every fold/check/call/bet/raise/all-in, in
    // order) — used to build the ML service's `action_history` field
    // (see mlContextBuilder.js). Distinct from `lastAction`, which only
    // ever holds the SINGLE most recent action for persistence logging.
    this.actionLog = [];

    // Snapshot each player's chip count BEFORE blinds are posted, so
    // persistenceService can compute true net win/loss per hand later
    // (final chips minus this snapshot) — needed for rating adjustments
    // and totalChipsLost tracking, neither of which existed before.
    this.chipsAtHandStart = new Map(this.players.map(p => [p.id, p.chips]));

    this.deck = shuffleDeck(createDeck());
    this.communityCards = [];
    this.state = GAME_STATES.PRE_FLOP;

    // Reset Managers for the new hand
    this.potManager = new PotManager(this.players);
    const activePlayerIds = this.players.map(p => p.id);

    // Setup Turns and Blinds
    const turnSetup = this.turnManager.setupNewHand();

    // Cap blinds for short-stacked players so they post all-in for less
    // instead of throwing when they can't cover the full blind.
    const sbPlayer = this.players.find(p => p.id === turnSetup.smallBlindId);
    const bbPlayer = this.players.find(p => p.id === turnSetup.bigBlindId);

    const sbAmount = Math.min(Math.floor(this.bigBlind / 2), sbPlayer.chips);
    const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);

    this.bettingManager.startPreFlop(
      activePlayerIds,
      turnSetup.smallBlindId,
      sbAmount,
      turnSetup.bigBlindId,
      bbAmount
    );

    this.potManager.processBet(turnSetup.smallBlindId, sbAmount);
    this.potManager.processBet(turnSetup.bigBlindId, bbAmount);

    // Deal hole cards
    const { playersHands, remainingDeck } = dealPreFlop(this.deck, this.players.length);
    this.deck = remainingDeck;

    this.players.forEach((player, index) => {
      this.playerHands[player.id] = playersHands[index];
    });

    return {
      state: this.state,
      playerHands: this.playerHands,
      turnData: turnSetup,
      potSize: this.potManager.getTotalPotSize()
    };
  }

  /**
   * The master orchestrator: validates turns, handles betting logic, and deducts chips.
   *
   * @param {String} playerId - The ID of the acting player
   * @param {String} action - The action taken (e.g., CALL, RAISE)
   * @param {Number} additionalChips - Incremental chips added for a RAISE
   */
  handlePlayerAction(playerId, action, additionalChips = 0) {
    if (this.state === GAME_STATES.WAITING || this.state === GAME_STATES.SHOWDOWN) {
      throw new Error('Game is not currently in a betting phase.');
    }

    const currentActorId = this.turnManager.players[this.turnManager.currentPlayerIndex];
    if (playerId !== currentActorId) {
      throw new Error(`Not your turn. Waiting for action from player: ${currentActorId}`);
    }

    // 1. Fetch chips from the Single Source of Truth
    const playerObj = this.players.find(p => p.id === playerId);
    const playerChips = playerObj.chips;

    // 2. Validate and process the math of the bet
    const stageAtAction = this.state; // capture the street BEFORE any nextStreet()/showdown call below moves it
    const chipsCommitted = this.bettingManager.processAction(playerId, action, additionalChips, playerChips);

    // Record what just happened for gameFlowManager.js to persist as a
    // HandAction row. Set here (right after validation succeeds) rather
    // than at the end of this method, so it's correct regardless of which
    // branch below runs next (next street / showdown / next turn).
    this.actionSequence += 1;
    this.lastAction = {
      playerId,
      action,
      amount: chipsCommitted,
      stage: stageAtAction,
      sequenceInHand: this.actionSequence
    };
    this.actionLog.push({ playerId, action, amount: chipsCommitted, stage: stageAtAction });

    // 3. Physically move the chips (PotManager alters playerObj.chips via reference)
    if (chipsCommitted > 0) {
      this.potManager.processBet(playerId, chipsCommitted);
    }

    // 4. Handle Folding
    if (action === ACTIONS.FOLD) {
      this.potManager.processFold(playerId);
    }

    // 5. Check Phase Status
    const activePlayerIds = Array.from(this.potManager.activePlayers);

    // Check all-in status using the master array
    const allInPlayers = new Set(
      activePlayerIds.filter(id => this.players.find(p => p.id === id).chips === 0)
    );

    if (activePlayerIds.length === 1) {
      this.state = GAME_STATES.SHOWDOWN;
      return this.evaluateShowdown();
    }

    if (this.bettingManager.isRoundComplete(activePlayerIds, allInPlayers)) {
      return this.nextStreet();
    }

    // Filter out all-in players so we don't land on them for a turn
    const playersWhoCanAct = activePlayerIds.filter(id => !allInPlayers.has(id));
    const nextPlayerId = this.turnManager.moveToNextPlayer(
      playersWhoCanAct.length > 0 ? playersWhoCanAct : activePlayerIds
    );

    return {
      state: this.state,
      nextPlayerId,
      potSize: this.potManager.getTotalPotSize(),
      highestBet: this.bettingManager.highestBet
    };
  }

  /**
   * Advances the game to the next street and resets betting states.
   */
  nextStreet() {
    this.potManager.sweepBetsToPot();

    const activePlayerIds = Array.from(this.potManager.activePlayers);

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

    // Reset betting for the new street
    this.bettingManager.startNewStreet(activePlayerIds);

    // Calculate all-ins and filter them out before resetting the turn order,
    // so action never opens on a player who has nothing left to decide.
    const allInPlayers = new Set(
      activePlayerIds.filter(id => this.players.find(p => p.id === id).chips === 0)
    );
    const playersWhoCanAct = activePlayerIds.filter(id => !allInPlayers.has(id));

    const nextPlayerId = this.turnManager.resetTurnForNextStreet(
      playersWhoCanAct.length > 0 ? playersWhoCanAct : activePlayerIds
    );

    return {
      state: this.state,
      communityCards: this.communityCards,
      nextPlayerId,
      potSize: this.potManager.getTotalPotSize()
    };
  }

  /**
   * Calculates the winner(s) and distributes the pots.
   */
  evaluateShowdown() {
    const pots = this.potManager.sweepBetsToPot();
    const results = [];

    pots.forEach((pot, potIndex) => {
      if (pot.amount === 0) return;

      let bestRank = -1;
      let winners = [];

      // If only one player is eligible (e.g., everyone else folded), they auto-win
      if (pot.eligiblePlayers.length === 1) {
        const winnerId = pot.eligiblePlayers[0];
        results.push({ potIndex, amount: pot.amount, winners: [{ playerId: winnerId, handData: null }], payout: pot.amount });

        const playerObj = this.players.find(p => p.id === winnerId);
        if (playerObj) playerObj.chips += pot.amount;
        return;
      }

      // Normal showdown logic
      pot.eligiblePlayers.forEach(playerId => {
        const holeCards = this.playerHands[playerId];
        const handData = evaluateBestHand(holeCards, this.communityCards);

        if (handData.rank > bestRank) {
          bestRank = handData.rank;
          winners = [{ playerId, handData }];
        } else if (handData.rank === bestRank) {
          winners.push({ playerId, handData });
        }
      });

      const payout = Math.floor(pot.amount / winners.length);
      results.push({ potIndex, amount: pot.amount, winners, payout });

      // Apply winnings back to the players array
      winners.forEach(winner => {
        const playerObj = this.players.find(p => p.id === winner.playerId);
        if (playerObj) playerObj.chips += payout;
      });
    });

    // FIX: this.state is intentionally WAITING here (internal engine
    // state — the hand is over, ready for the next startHand() call, and
    // other guards like handlePlayerAction's "no hand in progress" check
    // rely on it being WAITING/SHOWDOWN-equivalent). But the RETURNED
    // result must signal 'SHOWDOWN' distinctly — every caller downstream
    // (gameFlowManager.broadcastAndCheckBot, buildPublicPayload) checks
    // `actionResult.state === 'SHOWDOWN'` specifically to decide whether
    // to persist the hand, schedule the next one, and broadcast
    // results/revealedHands to the frontend. Returning `this.state`
    // directly here meant that check could NEVER fire — every hand
    // ending (fold-out or full river reveal) silently froze the table:
    // chips were credited correctly, but nothing ever told the frontend
    // who won or started the next hand.
    this.state = GAME_STATES.WAITING;
    return { state: GAME_STATES.SHOWDOWN, results, finalBalances: this.players };
  }
}

module.exports = GameEngine;