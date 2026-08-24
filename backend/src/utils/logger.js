// src/utils/logger.js

/**
 * Minimal structured logger — timestamp + level + scope prefix on every
 * line. NOTE: existing console.log/console.error calls scattered across
 * the codebase are NOT retrofitted to use this (that'd be a large,
 * low-value diff touching nearly every file for a cosmetic change). Use
 * this in new code going forward; migrate old call sites incrementally
 * if/when you touch them anyway.
 */
function line(level, scope, message) {
  return `[${new Date().toISOString()}] [${level}]${scope ? ` [${scope}]` : ''} ${message}`;
}

module.exports = {
  info: (scope, message, meta) => (meta !== undefined ? console.log(line('INFO', scope, message), meta) : console.log(line('INFO', scope, message))),
  warn: (scope, message, meta) => (meta !== undefined ? console.warn(line('WARN', scope, message), meta) : console.warn(line('WARN', scope, message))),
  error: (scope, message, meta) => (meta !== undefined ? console.error(line('ERROR', scope, message), meta) : console.error(line('ERROR', scope, message)))
};