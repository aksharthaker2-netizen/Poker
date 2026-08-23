// src/components/room/BotSettings.jsx
import { useState } from 'react';

export default function BotSettings({ emptySeatCount, onAddBot, disabled }) {
  const [adding, setAdding] = useState(false);

  const handleAddBot = async () => {
    setAdding(true);
    try {
      await onAddBot();
    } finally {
      setAdding(false);
    }
  };

  if (emptySeatCount === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-[#22302B] bg-[#0F1513] p-4">
      <div>
        <p className="text-sm font-medium text-[#EDEAE3]">Fill empty seats with bots</p>
        <p className="text-xs text-[#8B9A94]">
          {emptySeatCount} seat{emptySeatCount === 1 ? '' : 's'} open — bots are optional, only the
          host can add them.
        </p>
      </div>
      <button
        onClick={handleAddBot}
        disabled={disabled || adding}
        className="rounded border border-[#D4AF37] px-3 py-1.5 text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#0B0F10] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {adding ? 'Adding…' : '+ Add bot'}
      </button>
    </div>
  );
}