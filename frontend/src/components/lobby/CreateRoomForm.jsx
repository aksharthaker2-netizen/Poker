// src/components/lobby/CreateRoomForm.jsx
import { useState } from 'react';

export default function CreateRoomForm({ username, onCreate, loading }) {
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [bigBlind, setBigBlind] = useState(20);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ maxPlayers, bigBlind, startingChips: 1000 });
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