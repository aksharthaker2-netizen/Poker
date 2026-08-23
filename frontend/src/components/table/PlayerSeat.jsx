// src/components/table/PlayerSeat.jsx
import { Card } from './CommunityCards';

function CardBack() {
  return (
    <div className="h-14 w-10 rounded border border-[#0B0F10] bg-gradient-to-br from-[#2C4A3D] to-[#123024]" />
  );
}

/**
 * @param {Object} seatPlayer - {id, chips, status} from the public
 *   GAME_STATE_UPDATED.players array (seat.status may include, e.g., FOLDED)
 * @param {String} seatMeta - {username, isBot} from the room's seat list
 *   (public players[] doesn't carry username/isBot — merge it in from room)
 * @param {Boolean} isMe - render myHoleCards instead of card backs
 * @param {Array|null} myHoleCards - only populated for the local player
 * @param {Array|null} revealedCards - populated only at SHOWDOWN for this seat
 * @param {Boolean} isActive - highlight ring for whose turn it is
 */
export default function PlayerSeat({
  seatPlayer,
  seatMeta,
  isMe,
  myHoleCards,
  revealedCards,
  isActive
}) {
  if (!seatPlayer) {
    return <div className="h-24 w-28 rounded-lg border border-dashed border-[#22302B]" />;
  }

  const folded = seatPlayer.status === 'FOLDED';
  const cardsToShow = revealedCards || (isMe ? myHoleCards : null);

  return (
    <div
      className={`flex w-28 flex-col items-center gap-1 rounded-lg border p-2 transition ${
        isActive
          ? 'border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.35)]'
          : 'border-[#22302B]'
      } ${folded ? 'opacity-40' : ''} bg-[#0F1513]`}
    >
      <div className="flex gap-1">
        {cardsToShow ? (
          cardsToShow.map((c, i) => <Card key={i} card={c} />)
        ) : (
          <>
            <CardBack />
            <CardBack />
          </>
        )}
      </div>
      <p className="max-w-full truncate text-xs font-medium text-[#EDEAE3]">
        {seatMeta?.isBot ? '🤖 ' : ''}
        {seatMeta?.username || seatPlayer.id}
        {isMe ? ' (you)' : ''}
      </p>
      <p className="font-mono text-xs text-[#8B9A94]">{seatPlayer.chips} chips</p>
      {folded && <p className="text-[10px] uppercase tracking-wide text-[#B23A2E]">Folded</p>}
    </div>
  );
}