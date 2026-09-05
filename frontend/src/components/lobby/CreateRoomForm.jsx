// src/components/lobby/CreateRoomForm.jsx
import { useState } from 'react';

export default function CreateRoomForm({ username, onCreate, loading }) {
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [bigBlind, setBigBlind] = useState(20);
  const [selectedSeat, setSelectedSeat] = useState(0);

  const clampedSeat = Math.min(selectedSeat, maxPlayers - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({ maxPlayers, bigBlind, startingChips: 1000 }, clampedSeat);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="group flex flex-col gap-4 rounded-xl border border-border bg-panel p-6 shadow-panel transition hover:border-gold/30"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-text">Create a table</h2>
        <p className="text-xs text-text-muted">You'll be the host — invite friends or add bots after.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Players (2–10)
        <input
          type="number"
          min={2}
          max={10}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="rounded-lg border border-border bg-ink px-3 py-2.5 text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Big blind
        <input
          type="number"
          min={2}
          step={2}
          value={bigBlind}
          onChange={(e) => setBigBlind(Number(e.target.value))}
          className="rounded-lg border border-border bg-ink px-3 py-2.5 text-text outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm text-text-muted">
        Your seat
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: maxPlayers }, (_, i) => i).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedSeat(i)}
              className={`h-9 w-9 rounded-lg border text-xs font-medium transition ${
                i === clampedSeat
                  ? 'border-gold bg-gold/15 text-gold shadow-glow'
                  : 'border-border text-text-muted hover:border-gold/50 hover:text-text'
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
        className="mt-1 rounded-lg bg-gold py-2.5 font-medium text-ink transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create room'}
      </button>
    </form>
  );
}
