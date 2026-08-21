// src/managers/botManager.js
const crypto = require('crypto');

const ML_REQUEST_TIMEOUT_MS = 4000; // hard cap so a hung ML service can't freeze the table

class BotManager {
  constructor() {
    // This URL will point to your partner's FastAPI Docker container
    this.mlEndpoint = process.env.ML_API_URL || 'http://localhost:8000/api/act';
  }

  /**
   * Generates a virtual player profile.
   *
   * FIX: widened from 2 random bytes (4 hex chars, 65,536 possibilities)
   * to 4 bytes (8 hex chars) to make cross-room ID collisions negligible.
   */
  createBotProfile() {
    const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
    return {
      id: `bot_${hash}`,
      username: `PokerAI_${hash}`,
      chips: 1000,
      isBot: true // Flag to distinguish from WebSocket users
    };
  }

  /**
   * Packages the exact table state into a payload for the ML model,
   * requests a decision, and parses the response.
   *
   * FIX: added a hard timeout via AbortController. Without this, a slow
   * or hung (not just down) ML service would leave `fetch` waiting
   * indefinitely, freezing that bot's turn — and therefore the whole
   * table — with no error and no fallback.
   */
  async requestMLDecision(gameState) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(this.mlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with status: ${response.status}`);
      }

      const decision = await response.json();
      // Expected format from FastAPI: { action: "CALL", additionalChips: 0 }
      return decision;
    } catch (error) {
      const reason = error.name === 'AbortError' ? 'timed out' : error.message;
      console.error(`[BotManager] ML API unreachable (${reason}). Forcing fold.`);
      // Fallback: if the Python service crashes or is too slow, the bot
      // auto-folds so the game doesn't freeze.
      return { action: 'FOLD', additionalChips: 0 };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Executes the bot's turn and triggers the broadcast callback.
   *
   * @param {Object} room - The current room state from RoomManager
   * @param {String} botId - The ID of the bot whose turn it is
   * @param {Function} broadcastCallback - Async function to blast the
   *   updated state to WebSockets AND continue the turn loop. MUST be
   *   awaited here, or a rejected promise inside the recursive chain
   *   becomes an unhandled rejection instead of a caught error.
   */
  async playBotTurn(room, botId, broadcastCallback) {
    if (!room || !room.game) return;

    const game = room.game;
    const botObj = game.players.find(p => p.id === botId);
    if (!botObj) return; // bot may have been removed (busted) between scheduling and execution

    // 1. Build the data payload for your partner's FastAPI model
    const mlPayload = {
      botId: botId,
      hand: game.playerHands[botId],
      communityCards: game.communityCards,
      potSize: game.potManager.getTotalPotSize(),
      highestBet: game.bettingManager.highestBet,
      botChipsRemaining: botObj.chips,
      legalActions: game.bettingManager.getLegalActions(botId, botObj.chips).legalActions
    };

    // 2. Add an artificial delay (1 to 2.5 seconds) so bots don't instantly
    //    snap-act, which gives human players a chance to process the table state.
    const thinkTime = Math.floor(Math.random() * 1500) + 1000;
    await new Promise(resolve => setTimeout(resolve, thinkTime));

    // 3. Get the mathematical decision
    const decision = await this.requestMLDecision(mlPayload);

    try {
      // 4. Inject the AI's action directly into the GameEngine
      const actionResult = game.handlePlayerAction(botId, decision.action, decision.additionalChips || 0);

      console.log(`[BotManager] ${botObj.username} executes ${decision.action}`);

      // 5. Await the callback so the turn-loop chain and any errors in it
      //    propagate correctly instead of running as a detached promise.
      if (typeof broadcastCallback === 'function') {
        await broadcastCallback(actionResult);
      }
    } catch (error) {
      console.error('[BotManager] Bot attempted illegal move:', error.message);
      // Safe fallback if the ML model hallucinates an invalid action
      const foldResult = game.handlePlayerAction(botId, 'FOLD', 0);
      if (typeof broadcastCallback === 'function') await broadcastCallback(foldResult);
    }
  }
}

module.exports = new BotManager();