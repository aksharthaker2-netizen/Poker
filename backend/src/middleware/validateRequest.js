// src/middleware/validateRequest.js

/**
 * Wraps a zod schema as Express middleware. Every REST body should go
 * through one of these before it reaches a controller — controllers
 * should never have to defensively check for missing/malformed fields
 * themselves.
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors
      });
    }

    // Use the parsed/coerced data, not the raw body — zod can strip
    // unknown fields and normalize types depending on the schema.
    req.body = result.data;
    next();
  };
}

module.exports = validateRequest;