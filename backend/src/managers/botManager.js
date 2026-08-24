// src/managers/botManager.js
const crypto = require('crypto');
const mlService = require('../services/mlService');

class BotManager {
  /**
   * Generates a virtual player profile. 4 random bytes (8 hex chars) —
   * widened from 2 bytes to keep cross-room ID collisions negligible.
   */
  createBotProfile() {
    const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
    return {
      id: `bot_${hash}`,
      username: `PokerAI_${hash}`,
      chips: 1000,
      isBot: true
    };
  }

  /**
   * Executes the bot's turn and triggers the broadcast callback.
   * The actual HTTP call to the ML service now lives in mlService.js
   * (requestBotDecision) — this method just builds the payload, adds a
   * human-feeling think-time delay, and applies whatever decision comes
   * back to the engine.
   */
  async playBotTurn(room, botId, broadcastCallback) {
    if (!room || !room.game) return;

    const game = room.game;
    const botObj = game.players.find((p) => p.id === botId);
    if (!botObj) return; // bot may have been removed (busted) between scheduling and execution

    const mlPayload = {
      botId,
      hand: game.playerHands[botId],
      communityCards: game.communityCards,
      potSize: game.potManager.getTotalPotSize(),
      highestBet: game.bettingManager.highestBet,
      botChipsRemaining: botObj.chips,
      legalActions: game.bettingManager.getLegalActions(botId, botObj.chips).legalActions
    };

    // Artificial delay so bots don't instantly snap-act.
    const thinkTime = Math.floor(Math.random() * 1500) + 1000;
    await new Promise((resolve) => setTimeout(resolve, thinkTime));

    const decision = await mlService.requestBotDecision(mlPayload);

    try {
      const actionResult = game.handlePlayerAction(botId, decision.action, decision.additionalChips || 0);
      console.log(`[BotManager] ${botObj.username} executes ${decision.action}`);

      if (typeof broadcastCallback === 'function') {
        await broadcastCallback(actionResult);
      }
    } catch (error) {
      console.error('[BotManager] Bot attempted illegal move:', error.message);
      const foldResult = game.handlePlayerAction(botId, 'FOLD', 0);
      if (typeof broadcastCallback === 'function') await broadcastCallback(foldResult);
    }
  }
}

module.exports = new BotManager();