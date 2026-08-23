// src/services/persistenceService.js
const prisma = require('../config/db');
const achievementService = require('./achievementService');

/**
 * Creates the DB Room row backing an in-memory room. Returns its real
 * UUID (`Room.id`), which is DIFFERENT from the human-friendly 6-char
 * join code (`Room.code`, also `room.id` in the in-memory roomManager
 * object and the socket.io room name / URL param). Keep these straight:
 *   - in-memory `room.id`   -> socket.io room name, URL, DB `Room.code`
 *   - `room.dbId` (this fn) -> DB `Room.id`, used as the FK for Game.roomId
 */
async function createRoomRecord({ code, hostId, settings }) {
  try {
    const dbRoom = await prisma.room.create({
      data: {
        code,
        hostId,
        maxPlayers: settings.maxPlayers,
        bigBlind: settings.bigBlind,
        smallBlind: Math.floor(settings.bigBlind / 2),
        startingChips: settings.startingChips || 1000,
        status: 'WAITING'
      }
    });
    return dbRoom.id;
  } catch (error) {
    // Persistence must never block gameplay — a room still works entirely
    // in-memory even if this write fails (e.g. DB hiccup). Downstream
    // hand/stat writes for this room will just no-op (see guards below).
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
    const dbGame = await prisma.game.create({
      data: { roomId: room.dbId, status: 'IN_PROGRESS' }
    });
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
 * not at showdown. HandAction rows need a real handId to attach to as
 * actions happen throughout the hand, well before it resolves.
 * `game._dbHandId` is reset to null in GameEngine.startHand() (new hand,
 * no row yet) and again after persistCompletedHand() finalizes it (so the
 * NEXT hand creates a fresh row).
 */
async function ensureHandRecord(room) {
  const dbGameId = await ensureGameRecord(room);
  if (!dbGameId) return null;
  if (room.game._dbHandId) return room.game._dbHandId;

  try {
    const handNumber = ++room.game._handCounter;
    const dbHand = await prisma.hand.create({
      data: { gameId: dbGameId, handNumber, stage: 'PRE_FLOP' }
    });
    room.game._dbHandId = dbHand.id;
    return dbHand.id;
  } catch (error) {
    console.error('[Persistence] Failed to create Hand record:', error.message);
    return null;
  }
}

/**
 * Persists a single fold/check/call/bet/raise/all-in as a HandAction row.
 * Called once per GameEngine.handlePlayerAction() call — for every
 * player, human or bot (bots just get userId: null; see HandAction.seatId's
 * schema comment for why that doesn't need a RoomSeat FK).
 */
async function persistHandAction(room, lastAction) {
  const dbHandId = await ensureHandRecord(room);
  if (!dbHandId) return;

  try {
    const seat = room.seats.find((s) => s && s.id === lastAction.playerId);
    const isHuman = seat && !seat.isBot;

    await prisma.handAction.create({
      data: {
        handId: dbHandId,
        seatId: lastAction.playerId,
        userId: isHuman ? lastAction.playerId : null,
        action: lastAction.action,
        amount: lastAction.amount,
        stage: lastAction.stage,
        sequenceInHand: lastAction.sequenceInHand
      }
    });
  } catch (error) {
    console.error('[Persistence] Failed to save hand action:', error.message);
  }
}

/**
 * Finalizes the CURRENT hand's row (board/pot/winner) and bumps
 * PlayerStats for every human who played it. Then clears `_dbHandId` so
 * the next hand's first action creates a fresh Hand row.
 */
async function persistCompletedHand(room, showdownResult) {
  const dbHandId = room.game._dbHandId;
  if (!dbHandId) return; // no actions were ever logged for this hand — nothing to finalize

  try {
    const totalPot = (showdownResult.results || []).reduce((sum, pot) => sum + pot.amount, 0);
    const topPot = showdownResult.results?.[0];
    const winner = topPot?.winners?.[0];

    await prisma.hand.update({
      where: { id: dbHandId },
      data: {
        stage: 'SHOWDOWN',
        board: room.game.communityCards.map((c) => `${c.rank}${c.suit[0]}`),
        potSize: totalPot,
        winnerSeatId: winner?.playerId || null,
        winningHand: winner?.handData?.name || null,
        endedAt: new Date()
      }
    });

    // Bump stats for every human who played this hand — net win/loss,
    // streaks, a small bounded rating nudge, and achievement checks.
    const humanSeats = room.seats.filter((s) => s && !s.isBot);
    const winnerIds = new Set((showdownResult.results || []).flatMap((p) => p.winners.map((w) => w.playerId)));
    const botCount = room.seats.filter((s) => s && s.isBot).length;

    await Promise.all(
      humanSeats.map(async (seat) => {
        const won = winnerIds.has(seat.id);

        // True net change for the hand: final chip count minus what they
        // had before blinds were posted. This is what actually happened
        // to their stack — more accurate than just "payout if they won",
        // since it also captures what a losing player put into the pot.
        const chipsBefore = room.game.chipsAtHandStart?.get(seat.id) ?? seat.chips;
        const chipsAfter = room.game.players.find((p) => p.id === seat.id)?.chips ?? seat.chips;
        const netChange = chipsAfter - chipsBefore;

        // Streaks need the PREVIOUS value to compute correctly (increment
        // vs. reset-to-1), so read-then-write instead of an atomic
        // increment for just this field.
        const existing = await prisma.playerStats.findUnique({ where: { userId: seat.id } });
        const prevStreak = existing?.currentStreak ?? 0;
        const newStreak = won ? (prevStreak >= 0 ? prevStreak + 1 : 1) : (prevStreak <= 0 ? prevStreak - 1 : -1);
        const newBestStreak = Math.max(existing?.bestStreak ?? 0, newStreak);

        const updatedStats = await prisma.playerStats.upsert({
          where: { userId: seat.id },
          create: {
            userId: seat.id,
            handsPlayed: 1,
            handsWon: won ? 1 : 0,
            totalChipsWon: netChange > 0 ? netChange : 0,
            totalChipsLost: netChange < 0 ? -netChange : 0,
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, 0)
          },
          update: {
            handsPlayed: { increment: 1 },
            handsWon: won ? { increment: 1 } : undefined,
            totalChipsWon: netChange > 0 ? { increment: netChange } : undefined,
            totalChipsLost: netChange < 0 ? { increment: -netChange } : undefined,
            currentStreak: newStreak,
            bestStreak: newBestStreak
          }
        });

        // Small, bounded rating nudge tied to real chip results. This is
        // deliberately simple (not a rigorous poker rating system, which
        // would need something like all-in-adjusted EV) — just enough to
        // make the leaderboard move in response to actual outcomes.
        const ratingDelta = Math.max(-20, Math.min(20, Math.round(netChange / 20)));
        if (ratingDelta !== 0) {
          await prisma.user.update({
            where: { id: seat.id },
            data: { rating: { increment: ratingDelta } }
          });
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
    // have the next hand's actions silently attach to a stale/broken one.
    room.game._dbHandId = null;
  }
}

async function markGameEnded(room) {
  if (!room.game?._dbGameId) return;
  try {
    await prisma.game.update({
      where: { id: room.game._dbGameId },
      data: { status: 'COMPLETED', endedAt: new Date() }
    });
  } catch (error) {
    console.error('[Persistence] Failed to close Game record:', error.message);
  }
}

module.exports = {
  createRoomRecord,
  persistHandAction,
  persistCompletedHand,
  markGameEnded
};