// src/components/lobby/JoinRoomForm.jsx
import { useState } from 'react';

export default function JoinRoomForm({ username, onJoin, loading }) {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    onJoin(roomCode.trim().toUpperCase());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6 shadow-panel transition hover:border-gold/30"
    >
      <div>
        <h2 className="font-display text-xl font-semibold text-text">Join a table</h2>
        <p className="text-xs text-text-muted">Got a code from a friend? Drop it in below.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-text-muted">
        Room code
        <input
          type="text"
          maxLength={6}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="A7K9P2"
          className="rounded-lg border border-border bg-ink px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-gold outline-none transition placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/20"
        />
      </label>

      <button
        type="submit"
        disabled={loading || !username || !roomCode.trim()}
        className="mt-1 rounded-lg border border-gold py-2.5 font-medium text-gold transition hover:bg-gold hover:text-ink active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Joining…' : 'Join room'}
      </button>
    </form>
  );
}
