// src/components/lobby/JoinRoomForm.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, LogIn, ClipboardPaste } from 'lucide-react';

export default function JoinRoomForm({ username, onJoin, loading }) {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomCode.trim()) onJoin(roomCode.trim().toUpperCase());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRoomCode(text.trim().toUpperCase().slice(0, 8));
    } catch { /* ignore */ }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl p-6 transition-all hover:border-gold/30"
      style={{ background: 'rgba(15,21,19,0.85)', border: '1px solid #22302B', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(46,158,107,0.12)', border: '1px solid rgba(46,158,107,0.25)' }}
          >
            <Hash size={16} className="text-success" />
          </div>
          <h2 className="font-display text-lg font-semibold text-text">Join Room</h2>
        </div>
        <p className="text-xs text-text-faint pl-[40px]">Enter the 6-character room code from your host.</p>
      </div>

      {/* Room code input */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-faint">
          <Hash size={12} />
          <span>Room Code</span>
        </div>
        <div className="relative">
          <input
            type="text"
            maxLength={8}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="A7K9P2"
            className="w-full rounded-xl border border-border bg-ink py-3 pl-4 pr-12 font-mono text-xl font-bold tracking-[0.25em] text-gold outline-none transition placeholder:text-text-faint/40 focus:border-gold focus:shadow-gold-sm"
            style={{ letterSpacing: '0.2em' }}
          />
          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-faint transition hover:text-gold"
          >
            <ClipboardPaste size={16} />
          </button>
        </div>
      </div>

      {/* Spacer to align height with CreateRoomForm */}
      <div className="flex-1" />

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading || !username || roomCode.trim().length < 4}
        className="mt-auto rounded-xl border border-success/40 py-3 text-sm font-bold text-success transition hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-success/30 border-t-success" />
            Joining…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <LogIn size={15} />
            Join Room
          </span>
        )}
      </motion.button>
    </motion.form>
  );
}
