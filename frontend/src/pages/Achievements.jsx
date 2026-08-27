// src/pages/Achievements.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { achievementsApi } from '../services/api';

export default function Achievements() {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [mine, setMine] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([achievementsApi.listAll(), achievementsApi.listMine()])
      .then(([allRes, mineRes]) => {
        setAll(allRes.data.achievements);
        setMine(mineRes.data.achievements);
      })
      .catch((err) => setError(err.response?.data?.error || 'Failed to load achievements'));
  }, []);

  const unlockedKeys = new Set(mine.map((m) => m.achievement.key));
  const unlockedAtByKey = Object.fromEntries(mine.map((m) => [m.achievement.key, m.unlockedAt]));

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Achievements</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        <p className="text-sm text-[#8B9A94]">
          {mine.length} / {all.length} unlocked
        </p>

        {error && <p className="text-sm text-[#B23A2E]">{error}</p>}

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {all.map((a) => {
            const unlocked = unlockedKeys.has(a.key);
            return (
              <li
                key={a.key}
                className={`rounded-lg border p-4 transition ${
                  unlocked
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/5'
                    : 'border-[#22302B] bg-[#0F1513] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className={`font-medium ${unlocked ? 'text-[#D4AF37]' : 'text-[#8B9A94]'}`}>
                    {a.title}
                  </p>
                  <span className="text-lg">{unlocked ? '🏆' : '🔒'}</span>
                </div>
                <p className="mt-1 text-xs text-[#8B9A94]">{a.description}</p>
                {unlocked && (
                  <p className="mt-2 text-[10px] uppercase tracking-wide text-[#5A6B64]">
                    Unlocked {new Date(unlockedAtByKey[a.key]).toLocaleDateString()}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}