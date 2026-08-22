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
      className="flex flex-col gap-4 rounded-lg border border-[#22302B] bg-[#0F1513] p-6"
    >
      <h2 className="text-lg font-semibold text-[#EDEAE3]">Join a table</h2>

      <label className="flex flex-col gap-1 text-sm text-[#8B9A94]">
        Room code
        <input
          type="text"
          maxLength={6}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="A7K9P2"
          className="rounded border border-[#22302B] bg-[#0B0F10] px-3 py-2 font-mono tracking-widest text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
        />
      </label>

      <button
        type="submit"
        disabled={loading || !username || !roomCode.trim()}
        className="mt-2 rounded border border-[#D4AF37] px-4 py-2 font-medium text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Joining…' : 'Join room'}
      </button>
    </form>
  );
}