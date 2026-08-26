// src/services/persistenceService.js
const roomRepository = require('../repositories/roomRepository');
const gameRepository = require('../repositories/gameRepository');
const userRepository = require('../repositories/userRepository');
const ratingService = require('./ratingService');
const achievementService = require('./achievementService');

/**
 * Creates the DB Room row backing an in-memory room. Returns its real
 * UUID (`Room.id`), which is DIFFERENT from the human-friendly 6-char
 * join code (`Room.code`, also `room.id` in the in-memory roomManager
 * object and the socket.io room name / URL param).
 */
async function createRoomRecord({ code, hostId, settings }) {
  try {
    const dbRoom = await roomRepository.create({
      code,
      hostId,
      maxPlayers: settings.maxPlayers,
      bigBlind: settings.bigBlind,
      smallBlind: Math.floor(settings.bigBlind / 2),
      startingChips: settings.startingChips || 1000
    });
    return dbRoom.id;
  } catch (error) {
    console.error('[Persistence] Failed to create Room record:', error.message);
    return null;
  }
}

/**
 * Lazily creates a Game row the first time a room's GameEngine starts its
 * first hand, and caches the id on the in-memory engine instance so
 * subsequent hands in the same session reuse it.
 */
async function ensureGameRecord(room) {
  if (!room.dbId) return null; // Room record failed to persist — skip entirely
  if (room.game._dbGameId) return room.game._dbGameId;

  try {
    const dbGame = await gameRepository.create(room.dbId);
    room.game._dbGameId = dbGame.id;
    room.game._handCounter = 0;
    return dbGame.id;
  } catch (error) {
    console.error('[Persistence] Failed to create Game record:', error.message);
    return null;
  }
}

/**
 * Lazily creates the Hand row for the CURRENT hand, on its first action —
 * not at showdown. `game._dbHandId` is reset to null in
 * GameEngine.startHand() (new hand, no row yet) and again after
 * persistCompletedHand() finalizes it (so the NEXT hand creates a fresh
 * row).
 */
async function ensureHandRecord(room) {
  const dbGameId = await ensureGameRecord(room);
  if (!dbGameId) return null;
  if (room.game._dbHandId) return room.game._dbHandId;

  try {
    const handNumber = ++room.game._handCounter;
    const dbHand = await gameRepository.createHand({ gameId: dbGameId, handNumber });
    room.game._dbHandId = dbHand.id;
    return dbHand.id;
  } catch (error) {
    console.error('[Persistence] Failed to create Hand record:', error.message);
    return null;
  }
}

/**
 * Persists a single fold/check/call/bet/raise/all-in as a HandAction row.
 * Called once per GameEngine.handlePlayerAction() call — human or bot.
 */
async function persistHandAction(room, lastAction) {
  const dbHandId = await ensureHandRecord(room);
  if (!dbHandId) return;

  try {
    const seat = room.seats.find((s) => s && s.id === lastAction.playerId);
    const isHuman = seat && !seat.isBot;

    await gameRepository.createHandAction({
      handId: dbHandId,
      seatId: lastAction.playerId,
      userId: isHuman ? lastAction.playerId : null,
      action: lastAction.action,
      amount: lastAction.amount,
      stage: lastAction.stage,
      sequenceInHand: lastAction.sequenceInHand
    });
  } catch (error) {
    console.error('[Persistence] Failed to save hand action:', error.message);
  }
}

/**
 * Finalizes the CURRENT hand's row (board/pot/winner), bumps PlayerStats
 * (net win/loss, streaks), nudges rating, and checks achievements — for
 * every human who played it. Then clears `_dbHandId` so the next hand's
 * first action creates a fresh Hand row.
 */
async function persistCompletedHand(room, showdownResult) {
  const dbHandId = room.game._dbHandId;
  if (!dbHandId) return; // no actions were ever logged for this hand — nothing to finalize

  try {
    const totalPot = (showdownResult.results || []).reduce((sum, pot) => sum + pot.amount, 0);
    const topPot = showdownResult.results?.[0];
    const winner = topPot?.winners?.[0];

    await gameRepository.finalizeHand(dbHandId, {
      stage: 'SHOWDOWN',
      board: room.game.communityCards.map((c) => `${c.rank}${c.suit[0]}`),
      potSize: totalPot,
      winnerSeatId: winner?.playerId || null,
      winningHand: winner?.handData?.name || null
    });

    const humanSeats = room.seats.filter((s) => s && !s.isBot);
    const winnerIds = new Set(
      (showdownResult.results || []).flatMap((p) => p.winners.map((w) => w.playerId))
    );
    const botCount = room.seats.filter((s) => s && s.isBot).length;

    await Promise.all(
      humanSeats.map(async (seat) => {
        const won = winnerIds.has(seat.id);

        // True net change for the hand: final chip count minus what they
        // had before blinds were posted.
        const chipsBefore = room.game.chipsAtHandStart?.get(seat.id) ?? seat.chips;
        const chipsAfter = room.game.players.find((p) => p.id === seat.id)?.chips ?? seat.chips;
        const netChange = chipsAfter - chipsBefore;

        // Streaks need the previous value to compute correctly, so
        // read-then-write instead of an atomic increment for this field.
        const existing = await userRepository.findStats(seat.id);
        const prevStreak = existing?.currentStreak ?? 0;
        const newStreak = won
          ? (prevStreak >= 0 ? prevStreak + 1 : 1)
          : (prevStreak <= 0 ? prevStreak - 1 : -1);
        const newBestStreak = Math.max(existing?.bestStreak ?? 0, newStreak);

        const updatedStats = await userRepository.upsertStats(
          seat.id,
          {
            userId: seat.id,
            handsPlayed: 1,
            handsWon: won ? 1 : 0,
            totalChipsWon: netChange > 0 ? netChange : 0,
            totalChipsLost: netChange < 0 ? -netChange : 0,
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, 0)
          },
          {
            handsPlayed: { increment: 1 },
            handsWon: won ? { increment: 1 } : undefined,
            totalChipsWon: netChange > 0 ? { increment: netChange } : undefined,
            totalChipsLost: netChange < 0 ? { increment: -netChange } : undefined,
            currentStreak: newStreak,
            bestStreak: newBestStreak
          }
        );

        const ratingDelta = ratingService.calculateHandRatingDelta(netChange);
        if (ratingDelta !== 0) {
          await userRepository.incrementRating(seat.id, ratingDelta);
        }

        await achievementService.checkHandAchievements({
          userId: seat.id,
          won,
          stats: updatedStats,
          botCount
        });
      })
    );
  } catch (error) {
    console.error('[Persistence] Failed to finalize hand:', error.message);
  } finally {
    // Always clear, even on failure — better to lose one hand's row than
    // have the next hand's actions silently attach to a stale one.
    room.game._dbHandId = null;
  }
}

async function markGameEnded(room) {
  // Room status transitions to ENDED regardless of whether a DB Game
  // record exists for it, so this is independent of the guard below.
  await updateRoomStatus(room, 'ENDED');

  if (!room.game?._dbGameId) return;
  try {
    await gameRepository.updateStatus(room.game._dbGameId, 'COMPLETED');
  } catch (error) {
    console.error('[Persistence] Failed to close Game record:', error.message);
  }
}

/**
 * Used by gameFlowManager.closeRoom when the host force-closes a room
 * WHILE a hand is actively in progress. Distinct from markGameEnded
 * (COMPLETED) — ABORTED marks this as an emergency stop in history/stats,
 * not a normal ending. Deliberately does NOT attempt to settle/redistribute
 * whatever chips were already committed to the live pot — that's a rare
 * admin action, not a real game outcome, and building correct chop/refund
 * logic for an arbitrary mid-hand abort is out of scope for now.
 */
async function markGameAborted(room) {
  await updateRoomStatus(room, 'ENDED');

  if (!room.game?._dbGameId) return;
  try {
    await gameRepository.updateStatus(room.game._dbGameId, 'ABORTED');
  } catch (error) {
    console.error('[Persistence] Failed to abort Game record:', error.message);
  }
}

/**
 * Syncs the DB Room row's status to match the in-memory room's
 * lifecycle. NOTE: in-memory `room.status` uses 'WAITING' | 'PLAYING'
 * (roomManager's own vocabulary) which does NOT match the Prisma
 * RoomStatus enum — callers pass the already-translated DB enum value in
 * explicitly rather than this function guessing a mapping.
 */
async function updateRoomStatus(room, dbStatus) {
  if (!room.dbId) return;
  try {
    await roomRepository.updateStatus(room.dbId, dbStatus);
  } catch (error) {
    console.error('[Persistence] Failed to update Room status:', error.message);
  }
}

module.exports = {
  createRoomRecord,
  persistHandAction,
  persistCompletedHand,
  markGameEnded,
  markGameAborted,
  updateRoomStatus
};