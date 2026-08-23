// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../services/api';

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#22302B] bg-[#0F1513] p-4 text-center">
      <p className="font-mono text-2xl text-[#D4AF37]">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-[#8B9A94]">{label}</p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    userApi
      .getProfile()
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load profile'));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#B23A2E]">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#8B9A94]">
        Loading profile…
      </div>
    );
  }

  const stats = profile.stats || {};
  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{profile.username}</h1>
            <p className="text-sm text-[#8B9A94]">{profile.email}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        <div className="rounded-lg border border-[#22302B] bg-[#0F1513] p-4">
          <p className="font-mono text-3xl text-[#D4AF37]">{profile.rating}</p>
          <p className="text-xs uppercase tracking-wide text-[#8B9A94]">Rating</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Hands played" value={stats.handsPlayed ?? 0} />
          <StatCard label="Hands won" value={stats.handsWon ?? 0} />
          <StatCard label="Win rate" value={`${winRate}%`} />
          <StatCard label="Chips won" value={stats.totalChipsWon ?? 0} />
        </div>

        {stats.currentStreak !== undefined && (
          <p className="text-center text-sm text-[#8B9A94]">
            Current streak:{' '}
            <span className={stats.currentStreak >= 0 ? 'text-[#4CAF50]' : 'text-[#B23A2E]'}>
              {stats.currentStreak >= 0 ? `+${stats.currentStreak}` : stats.currentStreak}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}