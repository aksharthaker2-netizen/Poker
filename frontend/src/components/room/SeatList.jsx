// src/components/room/SeatList.jsx
import { useState } from 'react';

/**
 * @param {Boolean} isHost - render Kick/Remove buttons per seat when true
 * @param {String} myUserId - never show a remove button on your own seat;
 *   empty seats become clickable "sit here" buttons for whoever's already
 *   seated somewhere in this room (this IS the seat-selection UI — you
 *   can't meaningfully pick a seat before joining, since you don't know
 *   the room's occupancy yet, so this lets you move once you're in).
 * @param {Function} onKickPlayer - (seatUserId) => Promise
 * @param {Function} onRemoveBot - (seatUserId) => Promise
 * @param {Function} onChangeSeat - (seatIndex) => Promise
 */
export default function SeatList({
  seats,
  hostId,
  isHost,
  myUserId,
  onKickPlayer,
  onRemoveBot,
  onChangeSeat
}) {
  const [busySeatId, setBusySeatId] = useState(null);
  const [movingTo, setMovingTo] = useState(null);

  const amSeated = seats.some((s) => s && s.id === myUserId);

  const handleRemove = async (seat) => {
    setBusySeatId(seat.id);
    try {
      if (seat.isBot) {
        await onRemoveBot(seat.id);
      } else {
        await onKickPlayer(seat.id);
      }
    } finally {
      setBusySeatId(null);
    }
  };

  const handleSit = async (index) => {
    setMovingTo(index);
    try {
      await onChangeSeat(index);
    } finally {
      setMovingTo(null);
    }
  };

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {seats.map((seat, index) => {
        const canRemove = isHost && seat && seat.id !== myUserId;
        const canSit = !seat && amSeated && Boolean(onChangeSeat);

        if (canSit) {
          return (
            <li key={index}>
              <button
                onClick={() => handleSit(index)}
                disabled={movingTo !== null}
                className="flex w-full items-center gap-2 rounded border border-dashed border-border px-3 py-2.5 text-sm text-faint transition hover:border-gold hover:text-gold hover:bg-panel2 rounded-xl disabled:opacity-50"
              >
                <span className="text-xs">#{index + 1}</span>
                {movingTo === index ? 'Moving…' : 'Sit here'}
              </button>
            </li>
          );
        }

        return (
          <li
            key={index}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
              seat
                ? 'border-border bg-panel text-text'
                : 'border-dashed border-border/60 text-faint'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-xs text-faint">#{index + 1}</span>
              {seat ? (
                <>
                  {seat.isBot && <span title="AI bot">🤖</span>}
                  <span className="truncate">
                    {seat.username}
                    {seat.id === myUserId ? ' (you)' : ''}
                  </span>
                  {seat.id === hostId && (
                    <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                      HOST
                    </span>
                  )}
                </>
              ) : (
                'Empty seat'
              )}
            </span>

            <span className="flex items-center gap-2">
              {seat && <span className="font-mono text-xs text-text-muted">{seat.chips}</span>}
              {canRemove && (
                <button
                  onClick={() => handleRemove(seat)}
                  disabled={busySeatId === seat.id}
                  title={seat.isBot ? 'Remove bot' : 'Kick player'}
                  className="rounded-md border border-border px-1.5 py-0.5 text-xs text-text-muted transition hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  {busySeatId === seat.id ? '…' : '✕'}
                </button>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
