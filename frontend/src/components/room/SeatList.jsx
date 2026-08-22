// src/components/room/SeatList.jsx

export default function SeatList({ seats, hostId }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {seats.map((seat, index) => (
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
          {seat && <span className="font-mono text-xs text-[#8B9A94]">{seat.chips}</span>}
        </li>
      ))}
    </ul>
  );
}