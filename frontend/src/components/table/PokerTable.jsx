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
  const x = 50 + 42 * Math.cos(angle); // % of container width
  const y = 50 + 38 * Math.sin(angle); // % of container height
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
      <div className="relative aspect-[16/10] w-full max-w-3xl rounded-[50%] border-4 border-[#0B0F10] bg-gradient-to-b from-[#0F4C39] to-[#0B3327] shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CommunityCards cards={communityCards} potSize={potSize} />
        </div>

        {seatEntries.map(({ index, seatMeta, seatPlayer }) => {
          const pos = getSeatPosition(index, room.seats.length);
          const isMe = seatMeta?.id === myUserId;
          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={pos}
            >
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
        <p className="rounded border border-[#B23A2E]/40 bg-[#B23A2E]/10 px-3 py-1.5 text-sm text-[#B23A2E]">
          {actionError}
        </p>
      )}

      <ActionButtons
        actionInfo={actionInfo}
        myUserId={myUserId}
        myChips={me?.seatPlayer?.chips ?? 0}
        onAction={onAction}
        disabled={gameState === 'SHOWDOWN' || gameState === 'WAITING'}
      />
    </div>
  );
}