// src/services/mlService.js

const ML_REQUEST_TIMEOUT_MS = 4000;
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000/api/act';

/**
 * Requests a bot's action from your friend's FastAPI service. This is
 * the ALREADY-WORKING ML integration — previously this fetch logic lived
 * inline inside botManager.js; it's centralized here so every ML call in
 * the app shares one timeout/error policy, and so anything else that
 * needs the model later (see requestHandReview below) has one obvious
 * place to live.
 */
async function requestBotDecision(gameState) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameState),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML Service responded with status: ${response.status}`);
    }

    return await response.json(); // expected: { action, additionalChips }
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    console.error(`[MLService] Bot decision request failed (${reason}). Falling back to FOLD.`);
    return { action: 'FOLD', additionalChips: 0 };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * NOT IMPLEMENTED — this is the AI Poker Coach's actual analysis call,
 * and it's pending an agreed contract with the ML side (something like
 * POST /coach/analyze-hand -> { decisionScore, recommendedAction,
 * explanation } per action, or per-hand). reviewService.js calls this as
 * its single extension point for AI enrichment; until a real endpoint
 * exists, it returns null so callers can treat "no AI analysis yet" as a
 * normal, expected state rather than an error to handle.
 */
async function requestHandReview(/* handContext */) {
  return null;
}

module.exports = { requestBotDecision, requestHandReview };