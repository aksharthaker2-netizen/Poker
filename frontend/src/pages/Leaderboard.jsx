// src/pages/Leaderboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import Avatar from '../components/ui/Avatar';
import { SkeletonRow } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

const PERIODS = [
  { key: 'GLOBAL', label: 'All Time'  },
  { key: 'MONTHLY', label: 'Monthly'   },
  { key: 'WEEKLY',  label: 'Weekly'    },
];

function PodiumCard({ player, position }) {
  const isFirst = position === 1;
  const { colour, medal, heightClass } = {
    1: { colour: '#D4AF37', medal: '🥇', heightClass: 'pt-0'   },
    2: { colour: '#A8B2B0', medal: '🥈', heightClass: 'pt-8'   },
    3: { colour: '#C97F3A', medal: '🥉', heightClass: 'pt-12'  },
  }[position] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
      className={`flex flex-col items-center gap-2 ${heightClass}`}
    >
      <span className="text-3xl">{medal}</span>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-bold"
        style={{
          background: `rgba(${position === 1 ? '212,175,55' : position === 2 ? '168,178,176' : '201,127,58'},0.12)`,
          border: `2px solid ${colour}40`,
          color: colour,
          boxShadow: isFirst ? `0 0 20px ${colour}30` : 'none',
        }}
      >
        {player?.username?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="text-center">
        <p
          className={`font-semibold text-text ${isFirst ? 'text-base' : 'text-sm'} truncate max-w-[90px]`}
          style={{ color: isFirst ? colour : undefined }}
        >
          {player?.username || '—'}
        </p>
        <p className="font-mono text-xs text-text-faint">{player?.score ?? '—'}</p>
      </div>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [period, setPeriod] = useState('GLOBAL');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const myUserId = localStorage.getItem('userId');

  const loadLeaderboard = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await leaderboardApi.getGlobal(p);
      setEntries(data.entries ?? []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeaderboard(period); }, [loadLeaderboard, period]);

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  return (
    <div className="page-enter mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Leaderboard</h1>
        <p className="mt-1 text-sm text-text-muted">The best players on PokerAI</p>
      </div>

      {/* Period tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
      >
        {PERIODS.map((p) => {
          const isActive = p.key === period;
          return (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
              style={{ color: isActive ? '#0B1A10' : '#8B9A94' }}
            >
              {isActive && (
                <motion.div
                  layoutId="lb-tab"
                  className="absolute inset-0 rounded-lg bg-gold"
                  style={{ boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{p.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Podium */}
      {!loading && top3.length >= 3 && (
        <div
          className="rounded-2xl px-8 py-10"
          style={{
            background: 'linear-gradient(160deg, rgba(212,175,55,0.06) 0%, rgba(15,21,19,0.8) 100%)',
            border: '1px solid rgba(212,175,55,0.15)',
          }}
        >
          <div className="flex items-end justify-center gap-8">
            <PodiumCard player={top3[1]} position={2} />
            <PodiumCard player={top3[0]} position={1} />
            <PodiumCard player={top3[2]} position={3} />
          </div>
        </div>
      )}

      {/* Full table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
      >
        {/* Table header */}
        <div
          className="hidden sm:grid grid-cols-[40px,auto,1fr,80px,80px,80px] gap-4 border-b border-border/50 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-text-faint"
        >
          <span>#</span>
          <span>Player</span>
          <span />
          <span className="text-right">Rating</span>
          <span className="text-right">Wins</span>
          <span className="text-right">Win %</span>
        </div>

        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState icon="🏆" title="No rankings yet" description="Be the first to play a game." className="border-none" />
        ) : (
          <ul>
            {entries.map((entry, i) => {
              const isMe = entry.userId === myUserId;
              const rank = i + 1;
              return (
                <motion.li
                  key={entry.userId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="leaderboard-row flex items-center gap-4 px-5 py-3.5 sm:grid sm:grid-cols-[40px,auto,1fr,80px,80px,80px]"
                  style={isMe ? { background: 'rgba(212,175,55,0.06)' } : {}}
                >
                  {/* Rank */}
                  <span
                    className="font-mono text-sm font-bold text-center shrink-0"
                    style={{
                      color: rank === 1 ? '#D4AF37' : rank === 2 ? '#A8B2B0' : rank === 3 ? '#C97F3A' : '#4A5C54',
                      textShadow: rank <= 3 ? `0 0 10px currentColor` : 'none',
                    }}
                  >
                    {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
                  </span>

                  {/* Avatar */}
                  <Avatar username={entry.username} size="sm" />

                  {/* Name + you badge */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-text truncate">{entry.username}</span>
                    {isMe && (
                      <span className="chip shrink-0" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: 9 }}>
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <span className="text-right font-mono text-sm font-semibold text-gold">{entry.score ?? '—'}</span>

                  {/* Wins */}
                  <span className="text-right font-mono text-sm text-text-muted">{entry.wins ?? '—'}</span>

                  {/* Win % */}
                  <span className="text-right font-mono text-sm text-text-muted">
                    {entry.winRate != null ? `${Math.round(entry.winRate)}%` : '—'}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}