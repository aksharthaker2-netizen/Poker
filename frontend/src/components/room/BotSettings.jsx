// src/components/room/BotSettings.jsx
import { useState } from 'react';

// Current tiers accepted by the ML service (see ml-service-api-guide.pdf) —
// 800/1200 are legacy values it still accepts but auto-maps internally to
// 672/1140, so they're left out here to avoid an odd duplicate-looking list.
const DIFFICULTY_TIERS = [
  { label: 'Full strength', value: null },
  { label: 'Hard (1600)', value: 1600 },
  { label: 'Medium (1140)', value: 1140 },
  { label: 'Easy (672)', value: 672 },
  { label: 'Beginner (400)', value: 400 }
];

export default function BotSettings({ emptySeatCount, onAddBot, disabled }) {
  const [adding, setAdding] = useState(false);
  const [rating, setRating] = useState(null);

  const handleAddBot = async () => {
    setAdding(true);
    try {
      await onAddBot(rating);
    } finally {
      setAdding(false);
    }
  };

  if (emptySeatCount === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#22302B] bg-[#0F1513] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-[#EDEAE3]">Fill empty seats with bots</p>
        <p className="text-xs text-[#8B9A94]">
          {emptySeatCount} seat{emptySeatCount === 1 ? '' : 's'} open — bots are optional, only the
          host can add them.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={rating ?? ''}
          onChange={(e) => setRating(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-[#22302B] bg-[#0B0F10] px-2 py-1.5 text-sm text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
        >
          {DIFFICULTY_TIERS.map((tier) => (
            <option key={tier.label} value={tier.value ?? ''}>
              {tier.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleAddBot}
          disabled={disabled || adding}
          className="rounded border border-[#D4AF37] px-3 py-1.5 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? 'Adding…' : '+ Add bot'}
        </button>
      </div>
    </div>
  );
}
