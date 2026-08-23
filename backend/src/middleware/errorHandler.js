// src/middleware/errorHandler.js

/**
 * Safety net for anything a controller didn't already catch and respond
 * to itself (e.g. an unexpected throw inside an async handler that wasn't
 * wrapped in try/catch). Must be registered LAST, after all routes.
 */
function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err);

  const status = err.status || 500;
  const message =
    status === 500 ? 'Internal server error' : err.message || 'Something went wrong';

  res.status(status).json({ error: message });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

module.exports = { errorHandler, notFoundHandler };