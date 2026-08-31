// src/middleware/validateSocketPayload.js

/**
 * Validates a socket event payload against a zod schema. Throws with a
 * clean message on failure, matching the exception-based error handling
 * every socket handler in this app already uses (try/catch ->
 * callback({success:false, error: error.message})) — so adopting this is
 * a one-line addition per handler, not a restructure.
 *
 * Returns the PARSED payload — callers should destructure from the
 * return value, not the original payload, so unknown fields are
 * stripped and any defaults/coercions (e.g. numeric strings -> numbers)
 * are applied consistently.
 */
function validateSocketPayload(schema, payload) {
  const result = schema.safeParse(payload || {});
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue?.path?.join('.') || 'payload';
    throw new Error(`Invalid ${field}: ${firstIssue?.message || 'validation failed'}`);
  }
  return result.data;
}

module.exports = validateSocketPayload;