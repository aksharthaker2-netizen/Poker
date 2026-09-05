// src/components/table/PokerTable.jsx
import PlayerSeat from './PlayerSeat';
import CommunityCards from './CommunityCards';
import ActionButtons from './ActionButtons';

/**
 * Positions up to 10 seats evenly around an oval using basic trig — no
 * extra layout library needed for a fixed max seat count.
 */
function getSeatPosition(index, total) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // start at top
  const x = 50 + 43 * Math.cos(angle); // % of container width
  const y = 50 + 40 * Math.sin(angle); // % of container height
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
  onAction,
  actionError
}) {
  const seatEntries = room.seats.map((seatMeta, index) => {
    if (!seatMeta) return { index, seatMeta: null, seatPlayer: null };
    const seatPlayer = players.find((p) => p.id === seatMeta.id) || {
      id: seatMeta.id,
      chips: seatMeta.chips,
      status: seatMeta.status
    };
    return { index, seatMeta, seatPlayer };
  });

  const me = seatEntries.find((s) => s.seatMeta?.id === myUserId);

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative aspect-[16/9.5] w-full max-w-4xl rounded-[46%] border-[10px] border-[#3a2416] shadow-panel"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 15%, #146348 0%, #0f4c39 45%, #082019 100%)'
        }}
      >
        {/* Rail highlight — a thin inner ring that catches light, the kind
            of detail that reads as "real table" instead of "green div." */}
        <div className="pointer-events-none absolute inset-2 rounded-[44%] shadow-felt" />
        <div className="pointer-events-none absolute inset-2 rounded-[44%] ring-1 ring-gold/10" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CommunityCards cards={communityCards} potSize={potSize} />
        </div>

        {seatEntries.map(({ index, seatMeta, seatPlayer }) => {
          const pos = getSeatPosition(index, room.seats.length);
          const isMe = seatMeta?.id === myUserId;
          return (
            <div key={index} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
              <PlayerSeat
                seatPlayer={seatPlayer}
                seatMeta={seatMeta}
                isMe={isMe}
                myHoleCards={myHoleCards}
                revealedCards={revealedHands?.[seatMeta?.id]}
                isActive={seatMeta && seatMeta.id === nextPlayerId}
              />
            </div>
          );
        })}
      </div>

      {actionError && (
        <p className="animate-fade-up rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {actionError}
        </p>
      )}

      <ActionButtons
        actionInfo={actionInfo}
        myUserId={myUserId}
        myChips={me?.seatPlayer?.chips ?? 0}
        roomId={room.id}
        onAction={onAction}
        disabled={gameState === 'SHOWDOWN' || gameState === 'WAITING'}
      />
    </div>
  );
}
