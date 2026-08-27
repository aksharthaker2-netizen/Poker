// src/components/lobby/CreateRoomForm.jsx
import { useState } from 'react';

export default function CreateRoomForm({ username, onCreate, loading }) {
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [bigBlind, setBigBlind] = useState(20);
  const [selectedSeat, setSelectedSeat] = useState(0);

  // Re-clamp the selected seat if the player count shrinks below it.
  const clampedSeat = Math.min(selectedSeat, maxPlayers - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ maxPlayers, bigBlind, startingChips: 1000 }, clampedSeat);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-[#22302B] bg-[#0F1513] p-6"
    >
      <h2 className="text-lg font-semibold text-[#EDEAE3]">Create a table</h2>

      <label className="flex flex-col gap-1 text-sm text-[#8B9A94]">
        Players (2–10)
        <input
          type="number"
          min={2}
          max={10}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="rounded border border-[#22302B] bg-[#0B0F10] px-3 py-2 text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#8B9A94]">
        Big blind
        <input
          type="number"
          min={2}
          step={2}
          value={bigBlind}
          onChange={(e) => setBigBlind(Number(e.target.value))}
          className="rounded border border-[#22302B] bg-[#0B0F10] px-3 py-2 text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-[#8B9A94]">
        Your seat
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: maxPlayers }, (_, i) => i).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedSeat(i)}
              className={`h-8 w-8 rounded border text-xs transition ${
                i === clampedSeat
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'border-[#22302B] text-[#8B9A94] hover:border-[#D4AF37]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !username}
        className="mt-2 rounded bg-[#D4AF37] px-4 py-2 font-medium text-[#0B0F10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create room'}
      </button>
    </form>
  );
}