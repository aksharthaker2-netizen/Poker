// src/components/lobby/CreateRoomForm.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Coins, Armchair, Plus } from 'lucide-react';

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
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl p-6 transition-all hover:border-gold/30"
      style={{ background: 'rgba(15,21,19,0.85)', border: '1px solid #22302B', backdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
          >
            <Plus size={16} className="text-gold" />
          </div>
          <h2 className="font-display text-lg font-semibold text-text">Create Table</h2>
        </div>
        <p className="text-xs text-text-faint pl-[40px]">You'll be the host — invite friends or add bots after.</p>
      </div>

      {/* Players */}
      <label className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-faint">
          <Users size={12} />
          <span>Max Players (2–10)</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={2}
            max={10}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="flex-1 accent-gold"
          />
          <span className="font-mono text-sm font-semibold text-gold w-4 text-center">{maxPlayers}</span>
        </div>
      </label>

      {/* Big Blind */}
      <label className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-faint">
          <Coins size={12} />
          <span>Big Blind</span>
        </div>
        <div className="flex gap-2">
          {[10, 20, 50, 100].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setBigBlind(v)}
              className="flex-1 rounded-lg border py-2 text-xs font-semibold transition"
              style={{
                background: bigBlind === v ? 'rgba(212,175,55,0.15)' : 'transparent',
                border: `1px solid ${bigBlind === v ? 'rgba(212,175,55,0.4)' : '#22302B'}`,
                color: bigBlind === v ? '#D4AF37' : '#8B9A94',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </label>

      {/* Seat selector */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-faint">
          <Armchair size={12} />
          <span>Your Seat</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: maxPlayers }, (_, i) => i).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedSeat(i)}
              className="h-9 w-9 rounded-lg border text-xs font-semibold transition"
              style={{
                background: i === clampedSeat ? 'rgba(212,175,55,0.15)' : 'rgba(15,21,19,0.6)',
                border: `1px solid ${i === clampedSeat ? 'rgba(212,175,55,0.5)' : '#22302B'}`,
                color: i === clampedSeat ? '#D4AF37' : '#5A6B64',
                boxShadow: i === clampedSeat ? '0 0 10px rgba(212,175,55,0.2)' : 'none',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Starting chips note */}
      <p className="text-xs text-text-faint">
        Starting chips: <span className="font-mono text-gold">1,000</span> per player
      </p>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading || !username}
        className="mt-1 rounded-xl py-3 text-sm font-bold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: '#D4AF37', boxShadow: '0 4px 16px rgba(212,175,55,0.2)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            Creating…
          </span>
        ) : 'Create Room'}
      </motion.button>
    </motion.form>
  );
}
