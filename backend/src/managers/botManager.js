// src/managers/botManager.js
const crypto = require('crypto');
const mlService = require('../services/mlService');
const { buildDecisionContext } = require('../services/mlContextBuilder');

class BotManager {
  /**
   * Generates a virtual player profile. 4 random bytes (8 hex chars) —
   * widened from 2 bytes to keep cross-room ID collisions negligible.
   *
   * @param {Number|null} botRating - optional difficulty tier passed
   *   through to /decide on every one of this bot's turns (400/672/1140/
   *   1600, or null for full-strength — see ml-service-api-guide.pdf)
   */
  createBotProfile(botRating = null) {
    const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
    return {
      id: `bot_${hash}`,
      username: `PokerAI_${hash}`,
      chips: 1000,
      isBot: true,
      botRating: botRating ?? null
    };
  }

  /**
   * Executes the bot's turn. Builds the decision context via
   * mlContextBuilder, calls the real /decide endpoint through mlService,
   * and applies whatever decision comes back to the engine.
   */
  async playBotTurn(room, botId, broadcastCallback) {
    if (!room || !room.game) return;

    const game = room.game;
    const botObj = game.players.find((p) => p.id === botId);
    if (!botObj) return; // bot may have been removed (busted) between scheduling and execution

    // Artificial delay so bots don't instantly snap-act.
    const thinkTime = Math.floor(Math.random() * 1500) + 1000;
    await new Promise((resolve) => setTimeout(resolve, thinkTime));

    let decision;
    try {
      const context = buildDecisionContext(room, botId);
      const seatMeta = room.seats.find((s) => s && s.id === botId);
      decision = await mlService.requestBotDecision(
        context,
        room.settings.bigBlind,
        seatMeta?.botRating,
        botObj.chips
      );
    } catch (error) {
      // Context-building itself failing (not the HTTP call — that has its
      // own fallback inside mlService) — still must never freeze the table.
      console.error('[BotManager] Failed to build decision context, folding:', error.message);
      decision = { action: 'FOLD', additionalChips: 0 };
    }

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