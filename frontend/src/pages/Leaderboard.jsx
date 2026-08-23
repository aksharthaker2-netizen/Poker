// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leaderboardApi } from '../services/api';

const PERIODS = ['GLOBAL', 'WEEKLY', 'MONTHLY'];

export default function Leaderboard() {
  const navigate = useNavigate();
  const myUserId = localStorage.getItem('userId');
  const [period, setPeriod] = useState('GLOBAL');
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    leaderboardApi
      .getGlobal(period)
      .then(({ data }) => setEntries(data.leaderboard))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load leaderboard'));
  }, [period]);

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded border px-3 py-1.5 text-sm capitalize transition ${
                period === p
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-[#22302B] text-[#8B9A94] hover:border-[#D4AF37]'
              }`}
            >
              {p.toLowerCase()}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-[#B23A2E]">{error}</p>}

        {entries.length === 0 && !error && (
          <p className="text-sm text-[#5A6B64]">No ranked players for this period yet.</p>
        )}

        <ol className="flex flex-col overflow-hidden rounded-lg border border-[#22302B]">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className={`flex items-center justify-between border-b border-[#22302B] px-4 py-3 text-sm last:border-b-0 ${
                entry.id === myUserId ? 'bg-[#D4AF37]/10' : 'bg-[#0F1513]'
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`w-6 font-mono ${entry.rank <= 3 ? 'text-[#D4AF37]' : 'text-[#5A6B64]'}`}
                >
                  #{entry.rank}
                </span>
                <span>{entry.username}</span>
                {entry.id === myUserId && (
                  <span className="rounded bg-[#D4AF37]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                    YOU
                  </span>
                )}
              </span>
              <span className="font-mono text-[#8B9A94]">{entry.rating}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}