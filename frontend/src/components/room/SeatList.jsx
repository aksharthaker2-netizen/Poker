// src/components/room/SeatList.jsx
import { useState } from 'react';

/**
 * @param {Boolean} isHost - render Kick/Remove buttons per seat when true
 * @param {String} myUserId - never show a remove button on your own seat
 * @param {Function} onKickPlayer - (seatUserId) => Promise
 * @param {Function} onRemoveBot - (seatUserId) => Promise
 */
export default function SeatList({ seats, hostId, isHost, myUserId, onKickPlayer, onRemoveBot }) {
  const [busySeatId, setBusySeatId] = useState(null);

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

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {seats.map((seat, index) => {
        const canRemove = isHost && seat && seat.id !== myUserId;
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
                  <span className="truncate">{seat.username}</span>
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