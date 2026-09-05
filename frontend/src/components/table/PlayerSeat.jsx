// src/components/table/PlayerSeat.jsx
import { Card } from './CommunityCards';

function CardBack() {
  return (
    <div className="h-14 w-10 rounded-lg border border-black/40 bg-gradient-to-br from-felt to-felt-deep shadow-card">
      <div className="m-1 h-[calc(100%-8px)] rounded-md border border-gold/15 bg-[radial-gradient(circle,rgba(212,175,55,0.08)_1px,transparent_1px)] bg-[length:6px_6px]" />
    </div>
  );
}

function Avatar({ username, isBot }) {
  const initial = (username || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        isBot ? 'bg-felt text-gold' : 'bg-gold/20 text-gold'
      }`}
    >
      {isBot ? '🤖' : initial}
    </div>
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
export default function PlayerSeat({ seatPlayer, seatMeta, isMe, myHoleCards, revealedCards, isActive }) {
  if (!seatPlayer) {
    return <div className="h-[5.5rem] w-24 rounded-xl border border-dashed border-border/60 sm:w-28" />;
  }

  const folded = seatPlayer.status === 'FOLDED';
  const bustedOut = seatPlayer.chips === 0;
  const cardsToShow = revealedCards || (isMe ? myHoleCards : null);

  return (
    <div
      className={`flex w-24 flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all duration-300 sm:w-28 ${
        isActive
          ? 'scale-105 animate-pulse-glow border-gold bg-panel2'
          : 'border-border bg-panel'
      } ${folded ? 'opacity-40 grayscale' : ''}`}
    >
      <div className="flex gap-1">
        {cardsToShow ? (
          cardsToShow.map((c, i) => <Card key={i} card={c} size="sm" />)
        ) : (
          <>
            <CardBack />
            <CardBack />
          </>
        )}
      </div>

      <div className="flex w-full items-center gap-1.5">
        <Avatar username={seatMeta?.username} isBot={seatMeta?.isBot} />
        <p className="truncate text-xs font-medium text-text">
          {seatMeta?.username || seatPlayer.id}
          {isMe && <span className="text-faint"> (you)</span>}
        </p>
      </div>

      <div className="flex w-full items-center justify-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full bg-gold shadow-[0_1px_2px_rgba(0,0,0,0.4)]" />
        <p className="font-mono text-xs font-medium text-text-muted">{seatPlayer.chips}</p>
      </div>

      {folded && <p className="text-[10px] font-medium uppercase tracking-wide text-danger">Folded</p>}
      {!folded && bustedOut && (
        <p className="text-[10px] font-medium uppercase tracking-wide text-danger">Busted</p>
      )}
    </div>
  );
}
