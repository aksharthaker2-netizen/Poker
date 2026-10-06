// src/components/table/PokerTable.jsx
import { motion } from 'framer-motion';
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import ActionButtons from './ActionButtons';

/**
 * Positions up to 10 seats evenly around an oval using trigonometry.
 * Radius is slightly smaller for more seats to avoid overlap.
 */
function getSeatPosition(index, total) {
  const radiusX = total <= 4 ? 40 : total <= 6 ? 42 : 44;
  const radiusY = total <= 4 ? 35 : total <= 6 ? 36 : 37;
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // start at top
  const x = 50 + radiusX * Math.cos(angle);
  const y = 50 + radiusY * Math.sin(angle);
  return { left: `${x}%`, top: `${y}%` };
}

export default function PokerTable({
  room,
  gameState,
  communityCards,
  potSize,
  players,
  nextPlayerId,
  actionInfo,
  myUserId,
  myHoleCards,
  revealedHands,
  showdownResults,
  onAction,
  onHintReceived,
  actionError,
}) {
  const seatEntries = room.seats.map((seatMeta, index) => {
    if (!seatMeta) return { index, seatMeta: null, seatPlayer: null };
    const seatPlayer = players.find((p) => p.id === seatMeta.id) || {
      id: seatMeta.id,
      chips: seatMeta.chips,
      status: seatMeta.status,
    };
    return { index, seatMeta, seatPlayer };
  });

  const me = seatEntries.find((s) => s.seatMeta?.id === myUserId);

  const winnerIds = new Set(
    showdownResults?.flatMap((pot) => pot.winners?.map((w) => w.playerId) ?? []) ?? []
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full justify-between">
      {/* ── Poker Table Surface ──────────────────────────────────── */}
      <div
        className="relative w-full flex-1 min-h-0"
        style={{ maxWidth: 820, aspectRatio: '16/9.5', maxHeight: '65vh' }}
      >
        {/* Table outer — wood rail */}
        <div
          className="absolute inset-0 rounded-[46%] table-wood-rail"
        />

        {/* Rail inner edge highlight */}
        <div
          className="absolute inset-[6px] rounded-[44%]"
          style={{
            background: 'linear-gradient(145deg, #7A4A28 0%, #5C3318 60%, #3A2010 100%)',
          }}
        />

        {/* Felt surface */}
        <div
          className="absolute inset-[14px] rounded-[42%] overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 120% 100% at 50% 15%, #1A6E4A 0%, #0f4c39 45%, #082019 100%)',
            boxShadow: 'inset 0 0 90px rgba(0,0,0,0.55), inset 0 0 40px rgba(0,0,0,0.25)',
          }}
        >
          {/* Felt texture */}
          <div
            className="absolute inset-0 rounded-[42%] opacity-[0.07]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px)',
            }}
          />
          {/* Inner gold ring */}
          <div
            className="absolute inset-4 rounded-[40%] pointer-events-none"
            style={{ border: '1px solid rgba(212,175,55,0.1)' }}
          />
          {/* Second inner ring */}
          <div
            className="absolute inset-8 rounded-[38%] pointer-events-none"
            style={{ border: '1px solid rgba(212,175,55,0.05)' }}
          />
        </div>

        {/* Community cards — centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <CommunityCards
            cards={communityCards}
            potSize={potSize}
            gameState={gameState}
          />
        </div>

        {/* Player seats around the table */}
        {seatEntries.map(({ index, seatMeta, seatPlayer }) => {
          const pos      = getSeatPosition(index, room.seats.length);
          const isMe     = seatMeta?.id === myUserId;
          const isActive = seatMeta && seatMeta.id === nextPlayerId;
          const isWinner = seatMeta && winnerIds.has(seatMeta.id);

          return (
            <div
              key={index}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={pos}
            >
              <PlayerSeat
                seatPlayer={seatPlayer}
                seatMeta={seatMeta}
                isMe={isMe}
                myHoleCards={myHoleCards}
                revealedCards={revealedHands?.[seatMeta?.id]}
                isActive={isActive}
                isWinner={isWinner && gameState === 'SHOWDOWN'}
              />
            </div>
          );
        })}
      </div>

      {/* ── Action error ─────────────────────────────────────────── */}
      {actionError && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-2.5 text-sm w-full max-w-lg text-center"
          style={{
            background: 'rgba(178,58,46,0.1)',
            border: '1px solid rgba(178,58,46,0.35)',
            color: '#C0453A',
          }}
        >
          {actionError}
        </motion.p>
      )}

      {/* ── Action panel ─────────────────────────────────────────── */}
      <div className="w-full max-w-2xl shrink-0">
        <ActionButtons
          actionInfo={actionInfo}
          myUserId={myUserId}
          myChips={me?.seatPlayer?.chips ?? 0}
          roomId={room.id}
          onAction={onAction}
          onHintReceived={onHintReceived}
          disabled={gameState === 'SHOWDOWN' || gameState === 'WAITING'}
        />
      </div>
    </div>
  );
}
