// src/pages/GameHistory.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, ChevronDown, ChevronUp, Users, Coins, Clock } from 'lucide-react';
import { gamesApi } from '../services/api';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

const FILTERS = [
  { key: 'ALL',   label: 'All'   },
  { key: 'WINS',  label: 'Wins'  },
  { key: 'LOSS',  label: 'Losses'},
];

function GameCard({ game, expanded, onToggle, onReview }) {
  const isWin   = game.result === 'WIN' || game.result === 'win';
  const chipsNet = (game.finalChips ?? 0) - (game.startingChips ?? 0);

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-border transition hover:border-gold/20"
      style={{ background: 'rgba(15,21,19,0.8)' }}
    >
      {/* Main row */}
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        onClick={onToggle}
      >
        {/* Result indicator */}
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: isWin ? '#2E9E6B' : '#B23A2E',
            boxShadow: `0 0 8px ${isWin ? 'rgba(46,158,107,0.5)' : 'rgba(178,58,46,0.5)'}`,
          }}
        />

        {/* Room code */}
        <span className="font-mono text-sm font-semibold text-text shrink-0">
          {game.roomCode || game.roomId?.slice(-6)?.toUpperCase() || '—'}
        </span>

        {/* Result badge */}
        <span
          className="chip shrink-0 hidden sm:flex"
          style={{
            background: isWin ? 'rgba(46,158,107,0.12)' : 'rgba(178,58,46,0.12)',
            border: `1px solid ${isWin ? 'rgba(46,158,107,0.3)' : 'rgba(178,58,46,0.3)'}`,
            color: isWin ? '#2E9E6B' : '#B23A2E',
          }}
        >
          {isWin ? 'Win' : 'Loss'}
        </span>

        {/* Players */}
        <div className="flex items-center gap-1 text-xs text-text-faint">
          <Users size={11} />
          <span>{game.playerCount ?? '—'}</span>
        </div>

        <span className="ml-auto text-xs text-text-faint">
          {game.playedAt ? new Date(game.playedAt).toLocaleDateString() : '—'}
        </span>

        {/* Chips net */}
        <span
          className="font-mono text-sm font-semibold w-16 text-right shrink-0"
          style={{ color: chipsNet >= 0 ? '#2E9E6B' : '#B23A2E' }}
        >
          {chipsNet >= 0 ? '+' : ''}{chipsNet.toLocaleString()}
        </span>

        {/* Chevron */}
        <span className="text-text-faint ml-1 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded detail drawer */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="overflow-hidden border-t border-border/50"
          >
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Game stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Starting Chips', value: (game.startingChips ?? 0).toLocaleString() },
                  { label: 'Final Chips',    value: (game.finalChips ?? 0).toLocaleString(), colour: chipsNet >= 0 ? '#2E9E6B' : '#B23A2E' },
                  { label: 'Net Change',     value: `${chipsNet >= 0 ? '+' : ''}${chipsNet.toLocaleString()}`, colour: chipsNet >= 0 ? '#2E9E6B' : '#B23A2E' },
                  { label: 'Hands Played',   value: game.handsPlayed ?? '—' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl px-3 py-3" style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}>
                    <p className="text-[10px] uppercase tracking-widest text-text-faint mb-1">{s.label}</p>
                    <p className="font-mono text-sm font-semibold" style={{ color: s.colour || '#D4AF37' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onReview(game.id)}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm text-text-muted transition hover:border-gold/40 hover:text-gold"
                >
                  <Eye size={14} />
                  View AI Review
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GameHistory() {
  const navigate = useNavigate();
  const [games, setGames]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('ALL');
  const [expandedId, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await gamesApi.listMine();
      setGames(data.games ?? []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = games.filter((g) => {
    if (filter === 'WINS') return g.result === 'WIN' || g.result === 'win';
    if (filter === 'LOSS') return g.result === 'LOSS' || g.result === 'loss';
    return true;
  });

  const wins   = games.filter((g) => g.result === 'WIN' || g.result === 'win').length;
  const losses = games.length - wins;
  const winRate = games.length > 0 ? ((wins / games.length) * 100).toFixed(0) : '—';

  return (
    <div className="page-enter mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Game History</h1>
        <p className="mt-1 text-sm text-text-muted">{games.length} games played</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: games.length, colour: '#8B9A94' },
          { label: 'Wins',  value: wins, colour: '#2E9E6B' },
          { label: 'Win Rate', value: winRate === '—' ? '—' : `${winRate}%`, colour: '#D4AF37' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-1.5 rounded-2xl py-4"
            style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
          >
            <span className="font-mono text-xl font-semibold" style={{ color: s.colour }}>{s.value}</span>
            <span className="text-[10px] uppercase tracking-widest text-text-faint">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
      >
        {FILTERS.map((f) => {
          const isActive = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
              style={{ color: isActive ? '#0B1A10' : '#8B9A94' }}
            >
              {isActive && (
                <motion.div
                  layoutId="gh-tab"
                  className="absolute inset-0 rounded-lg bg-gold"
                  style={{ boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{f.label}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Game list */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🃏"
          title={filter === 'ALL' ? "No games played yet" : `No ${filter.toLowerCase()} found`}
          description="Start playing to build your game history."
          action={filter !== 'ALL' ? { label: 'Show all games', onClick: () => setFilter('ALL') } : undefined}
        />
      ) : (
        <motion.div className="flex flex-col gap-3">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              expanded={expandedId === game.id}
              onToggle={() => setExpanded((v) => v === game.id ? null : game.id)}
              onReview={(id) => navigate(`/game/${id}/review`)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}