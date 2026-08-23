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
  // NOTE: using hands, not games — handsPlayed/handsWon are what
  // persistenceService.js actually updates today; gamesPlayed/gamesWon
  // exist on the schema but nothing increments them yet (a "game" here
  // spans many hands and doesn't have a clean win/loss condition without
  // more design — e.g. "left with more chips than you started" — so it's
  // left for later rather than faked).
  const winRate =
    stats.handsPlayed > 0 ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0;
  const achievements = profile.userAchievements || [];

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

        <div className="rounded-lg border border-[#22302B] bg-[#0F1513] p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#8B9A94]">
            Achievements ({achievements.length})
          </h2>
          {achievements.length === 0 ? (
            <p className="text-sm text-[#5A6B64]">None yet — play some hands to unlock these.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {achievements.map((a) => (
                <li
                  key={a.achievement.key}
                  className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-3 py-2"
                >
                  <p className="text-sm font-medium text-[#D4AF37]">{a.achievement.title}</p>
                  <p className="text-xs text-[#8B9A94]">{a.achievement.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}