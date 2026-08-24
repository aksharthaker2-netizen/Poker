// src/middleware/validateRequest.js

/**
 * Wraps a zod schema as Express middleware. `source` picks which part of
 * the request to validate — 'body' (default), 'query', or 'params'.
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors
      });
    }

    req[source] = result.data;
    next();
  };
}

module.exports = validateRequest;