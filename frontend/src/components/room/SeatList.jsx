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
                className="flex w-full items-center gap-2 rounded border border-dashed border-[#22302B] px-3 py-2 text-sm text-[#5A6B64] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-50"
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
            className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
              seat
                ? 'border-[#2C3B34] bg-[#12181B] text-[#EDEAE3]'
                : 'border-dashed border-[#22302B] text-[#5A6B64]'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-xs text-[#5A6B64]">#{index + 1}</span>
              {seat ? (
                <>
                  {seat.isBot && <span title="AI bot">🤖</span>}
                  <span className="truncate">
                    {seat.username}
                    {seat.id === myUserId ? ' (you)' : ''}
                  </span>
                  {seat.id === hostId && (
                    <span className="rounded bg-[#D4AF37]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                      HOST
                    </span>
                  )}
                </>
              ) : (
                'Empty seat'
              )}
            </span>

            <span className="flex items-center gap-2">
              {seat && <span className="font-mono text-xs text-[#8B9A94]">{seat.chips}</span>}
              {canRemove && (
                <button
                  onClick={() => handleRemove(seat)}
                  disabled={busySeatId === seat.id}
                  title={seat.isBot ? 'Remove bot' : 'Kick player'}
                  className="rounded border border-[#22302B] px-1.5 py-0.5 text-xs text-[#8B9A94] transition hover:border-[#B23A2E] hover:text-[#B23A2E] disabled:opacity-50"
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