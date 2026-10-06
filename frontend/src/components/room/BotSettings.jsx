// src/components/room/BotSettings.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronDown } from 'lucide-react';

// Current tiers accepted by the ML service (see ml-service-api-guide.pdf) —
// 800/1200 are legacy values it still accepts but auto-maps internally to
// 672/1140, so they're left out here to avoid an odd duplicate-looking list.
const DIFFICULTY_TIERS = [
  { label: 'Full strength', value: null },
  { label: 'Hard (1600)',   value: 1600 },
  { label: 'Medium (1140)', value: 1140 },
  { label: 'Easy (672)',    value: 672  },
  { label: 'Beginner (400)',value: 400  },
];

export default function BotSettings({ emptySeatCount, onAddBot, disabled }) {
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(null);

  const handleAddBot = async () => {
    setAdding(true);
    try { await onAddBot(rating); }
    finally { setAdding(false); }
  };

  if (emptySeatCount === 0) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ background: 'rgba(46,158,107,0.06)', border: '1px solid rgba(46,158,107,0.2)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'rgba(46,158,107,0.12)', border: '1px solid rgba(46,158,107,0.25)' }}
        >
          <Bot size={16} className="text-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-text">Add AI bots</p>
          <p className="text-xs text-text-faint">
            {emptySeatCount} seat{emptySeatCount === 1 ? '' : 's'} open
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={rating ?? ''}
            onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
            className="appearance-none rounded-xl border border-border bg-ink py-2 pl-3 pr-8 text-sm text-text outline-none transition focus:border-gold"
          >
            {DIFFICULTY_TIERS.map((tier) => (
              <option key={tier.label} value={tier.value ?? ''}>{tier.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-faint" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddBot}
          disabled={disabled || adding}
          className="flex items-center gap-2 rounded-xl border border-success/50 px-3.5 py-2 text-sm font-semibold text-success transition hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Bot size={14} />
          {adding ? 'Adding…' : 'Add Bot'}
        </motion.button>
      </div>
    </div>
  );
}