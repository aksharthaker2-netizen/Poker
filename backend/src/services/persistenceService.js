// src/services/persistenceService.js
const prisma = require('../config/db');

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
 * Writes a completed hand's summary (board, pot, winner) and bumps
 * PlayerStats for every human who played it.
 *
 * NOTE: this does NOT log individual fold/call/raise actions
 * (HandAction rows) — the schema's HandAction.seatId is a hard FK to a
 * persisted RoomSeat row, and seats currently only exist in-memory
 * (seatManager). Wiring that up (either persisting RoomSeat rows on
 * every join/leave, or loosening that FK to a plain string like
 * Hand.winnerSeatId already is) is a deliberate follow-up — needed for
 * the hand-by-hand AI coach feature, not for basic gameplay/stats.
 */
async function persistCompletedHand(room, showdownResult) {
  const dbGameId = await ensureGameRecord(room);
  if (!dbGameId) return;

  try {
    const handNumber = ++room.game._handCounter;

    const totalPot = (showdownResult.results || []).reduce((sum, pot) => sum + pot.amount, 0);
    const topPot = showdownResult.results?.[0];
    const winner = topPot?.winners?.[0];

    await prisma.hand.create({
      data: {
        gameId: dbGameId,
        handNumber,
        stage: 'SHOWDOWN',
        board: room.game.communityCards.map((c) => `${c.rank}${c.suit[0]}`),
        potSize: totalPot,
        winnerSeatId: winner?.playerId || null,
        winningHand: winner?.handData?.name || null,
        endedAt: new Date()
      }
    });

    // Bump lightweight stats for every human who played this hand.
    // (Bots have no User row, so skip anything without a real userId.)
    const humanSeats = room.seats.filter((s) => s && !s.isBot);
    const winnerIds = new Set((showdownResult.results || []).flatMap((p) => p.winners.map((w) => w.playerId)));

    await Promise.all(
      humanSeats.map(async (seat) => {
        const won = winnerIds.has(seat.id);
        const payout = won
          ? showdownResult.results.find((p) => p.winners.some((w) => w.playerId === seat.id))?.payout || 0
          : 0;

        await prisma.playerStats.upsert({
          where: { userId: seat.id },
          create: {
            userId: seat.id,
            handsPlayed: 1,
            handsWon: won ? 1 : 0,
            totalChipsWon: payout
          },
          update: {
            handsPlayed: { increment: 1 },
            handsWon: won ? { increment: 1 } : undefined,
            totalChipsWon: won ? { increment: payout } : undefined
          }
        });
      })
    );
  } catch (error) {
    console.error('[Persistence] Failed to save hand:', error.message);
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

module.exports = { createRoomRecord, persistCompletedHand, markGameEnded };