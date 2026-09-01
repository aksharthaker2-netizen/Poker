// src/services/mlService.js

const ML_REQUEST_TIMEOUT_MS = 5000;
const ML_BASE_URL = process.env.ML_API_URL || 'http://localhost:8000';

// See ml-service-api-guide.pdf, "Known limitations" #1: the service
// hardcodes an assumed big blind of 10 internally (small blind 5) with no
// request parameter to override it. Our rooms support configurable
// blinds, so every chip amount is scaled into this reference frame
// before sending, and scaled back on the way out. This is a bridge — the
// guide explicitly invites flagging mismatches so they can make it a
// real parameter; worth raising with your friend once this is confirmed
// working, since scaling is an approximation (rounding at each
// conversion), not as clean as the service natively supporting real blinds.
const REFERENCE_BIG_BLIND = 10;

// Accepted tiers per the guide: 400/672/1140/1600 current, 800/1200 legacy
// (auto-mapped their side). null/undefined = omit for full-strength.
const VALID_BOT_RATINGS = new Set([400, 672, 1140, 1600, 800, 1200]);

function mapOurActionToMl(action) {
  if (action === 'CHECK') return 'call'; // the ML contract has no distinct "check" verb — a check IS a call for 0
  if (action === 'ALL_IN') return 'raise'; // nor a distinct all-in verb
  return action.toLowerCase();
}

function mapMlActionToOurs(mlAction) {
  const upper = (mlAction || '').toUpperCase();
  if (upper === 'FOLD' || upper === 'CALL' || upper === 'RAISE') return upper;
  // Unrecognized response — the guide warns malformed input isn't
  // validated on their end; on ours, an unrecognized action must never
  // reach the engine. Fail safe rather than crash the hand.
  console.error(`[MLService] Unrecognized action in response: "${mlAction}" — defaulting to FOLD`);
  return 'FOLD';
}

/**
 * Scales a chip amount into/out of the ML service's assumed BB=10
 * reference frame. direction: 'in' to send TO the service, 'out' to
 * convert a response value back to real chips.
 */
function scaleChips(amount, actualBigBlind, direction) {
  if (!actualBigBlind || actualBigBlind <= 0) return Math.round(amount);
  const factor =
    direction === 'in' ? REFERENCE_BIG_BLIND / actualBigBlind : actualBigBlind / REFERENCE_BIG_BLIND;
  return Math.round(amount * factor);
}

function scaleContextForRequest(context, actualBigBlind) {
  const scaledStacks = {};
  for (const [seat, chips] of Object.entries(context.stack_sizes)) {
    scaledStacks[seat] = scaleChips(chips, actualBigBlind, 'in');
  }

  return {
    ...context,
    pot_size: scaleChips(context.pot_size, actualBigBlind, 'in'),
    to_call: scaleChips(context.to_call, actualBigBlind, 'in'),
    min_raise: scaleChips(context.min_raise, actualBigBlind, 'in'),
    stack_sizes: scaledStacks,
    action_history: context.action_history.map((entry) => {
      const [seat, action, amount] = entry.split(':');
      return `${seat}:${action}:${scaleChips(Number(amount), actualBigBlind, 'in')}`;
    })
  };
}

async function callMlService(path, body, method = 'POST') {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${ML_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`ML service ${path} responded with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * /decide — a bot's own turn to act. Falls back to FOLD on any failure
 * (timeout, malformed response, service down) so a bot never freezes the
 * table.
 *
 * @param {Object} context - from mlContextBuilder.buildDecisionContext
 * @param {Number} actualBigBlind - the room's real big blind, for scaling
 * @param {Number|null} botRating - optional difficulty tier
 * @param {Number} botChips - the bot's actual (unscaled) chip count, to clamp the response against
 */
async function requestBotDecision(context, actualBigBlind, botRating, botChips) {
  try {
    const scaled = scaleContextForRequest(context, actualBigBlind);
    const body = VALID_BOT_RATINGS.has(botRating) ? { ...scaled, bot_rating: botRating } : scaled;

    const result = await callMlService('/decide', body);
    const action = mapMlActionToOurs(result.action);
    let additionalChips = 0;

    if (action === 'RAISE') {
      const rawAmount = scaleChips(result.raise_amount || 0, actualBigBlind, 'out');
      // Defensive clamp — the guide explicitly warns malformed/out-of-range
      // responses aren't validated on their end ("may cause a server error
      // rather than a clean error response"). Never trust an external
      // service's numeric output blindly against our own betting engine —
      // an unclamped value here could desync chip accounting.
      additionalChips = Math.max(0, Math.min(rawAmount, botChips));
    }

    return { action, additionalChips };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    console.error(`[MLService] /decide failed (${reason}). Falling back to FOLD.`);
    return { action: 'FOLD', additionalChips: 0 };
  }
}

/**
 * /hint — suggest a move to a human. Returns null on failure rather than
 * a fake fallback suggestion (a wrong "helpful hint" is worse than none).
 */
async function requestHint(context, actualBigBlind) {
  try {
    const scaled = scaleContextForRequest(context, actualBigBlind);
    const result = await callMlService('/hint', scaled);

    return {
      suggestedAction: mapMlActionToOurs(result.suggested_action),
      suggestedRaiseAmount:
        result.suggested_raise_amount != null
          ? scaleChips(result.suggested_raise_amount, actualBigBlind, 'out')
          : null,
      reason: result.reason || null
    };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    console.error(`[MLService] /hint failed (${reason}).`);
    return null;
  }
}

/**
 * /analyze — post-hand coaching over a batch of decision points.
 * Returns null on failure — reviewService treats that as "no AI
 * annotation this time," not an error to surface to the player.
 */
async function requestHandAnalysis(decisionPoints, actualBigBlind) {
  try {
    const scaledPoints = decisionPoints.map((point) => ({
      ...scaleContextForRequest(point, actualBigBlind),
      player_action: point.player_action
    }));

    return await callMlService('/analyze', { hand_history: scaledPoints });
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timed out' : error.message;
    console.error(`[MLService] /analyze failed (${reason}).`);
    return null;
  }
}

/**
 * GET /health — used once at server boot to log a clear warning if the
 * ML service isn't reachable, rather than discovering it silently via
 * every bot folding for the rest of the session.
 */
async function checkHealth() {
  try {
    const result = await callMlService('/health', null, 'GET');
    return result?.status === 'ok';
  } catch {
    return false;
  }
}

module.exports = {
  requestBotDecision,
  requestHint,
  requestHandAnalysis,
  checkHealth,
  mapOurActionToMl
};