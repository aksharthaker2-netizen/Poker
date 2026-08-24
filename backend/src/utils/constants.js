// src/utils/constants.js

const ACTIONS = Object.freeze({
  FOLD: 'FOLD',
  CHECK: 'CHECK',
  CALL: 'CALL',
  RAISE: 'RAISE',
  ALL_IN: 'ALL_IN'
});

const HAND_STAGES = Object.freeze({
  PRE_FLOP: 'PRE_FLOP',
  FLOP: 'FLOP',
  TURN: 'TURN',
  RIVER: 'RIVER',
  SHOWDOWN: 'SHOWDOWN'
});

const ROOM_LIMITS = Object.freeze({ MIN_PLAYERS: 2, MAX_PLAYERS: 10 });

const ACHIEVEMENT_KEYS = Object.freeze({
  FIRST_WIN: 'FIRST_WIN',
  WIN_STREAK_5: 'WIN_STREAK_5',
  HANDS_100: 'HANDS_100',
  BEAT_5_BOTS: 'BEAT_5_BOTS',
  BEAT_9_BOTS: 'BEAT_9_BOTS'
});

// NOTE: gameEngine/betting.js defines its own local ACTIONS constant and
// deliberately isn't refactored to import this — the engine is stable and
// independently tested; forcing a cross-module dependency there for a
// cosmetic dedupe isn't worth the risk. New code (controllers, services)
// should use this file instead of redefining these strings.

module.exports = { ACTIONS, HAND_STAGES, ROOM_LIMITS, ACHIEVEMENT_KEYS };