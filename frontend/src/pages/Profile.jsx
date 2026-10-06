// src/pages/Profile.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, Edit3, History, DoorOpen, Medal, Trophy,
  Target, TrendingUp, Zap, Coins, Star, Shield
} from 'lucide-react';
import { authApi, clearSession } from '../services/api';
import { disconnectSocket } from '../services/socket';
import Tabs from '../components/ui/Tabs';
import ProgressBar from '../components/ui/ProgressBar';
import Avatar from '../components/ui/Avatar';

const PROFILE_TABS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'performance',  label: 'Performance' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'history',      label: 'History' },
];

const RARITY_COL = { Legendary: '#D4AF37', Epic: '#9B59B6', Rare: '#4A90E2', Uncommon: '#2E9E6B', Common: '#8B9A94' };

export default function Profile() {
  const navigate  = useNavigate();
  const username  = localStorage.getItem('username') || 'Player';
  const userId    = localStorage.getItem('userId') || '';
  const [tab, setTab]         = useState('overview');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await authApi.logout(); } catch { /* best-effort */ }
    disconnectSocket();
    clearSession();
    navigate('/login');
  };

  const STATS = [
    { icon: <Target size={16} />,      label: 'Games',       value: '—',    colour: '#8B9A94' },
    { icon: <Trophy size={16} />,      label: 'Wins',        value: '—',    colour: '#D4AF37' },
    { icon: <TrendingUp size={16} />,  label: 'Win Rate',    value: '—',    colour: '#2E9E6B' },
    { icon: <Coins size={16} />,       label: 'Best Win',    value: '—',    colour: '#D4AF37' },
    { icon: <Zap size={16} />,         label: 'Best Streak', value: '—',    colour: '#C97F3A' },
    { icon: <Coins size={16} />,       label: 'Total Chips', value: '—',    colour: '#D4AF37' },
    { icon: <Shield size={16} />,      label: 'Avg Score',   value: '—',    colour: '#4A90E2' },
    { icon: <Star size={16} />,        label: 'Rating',      value: '—',    colour: '#D4AF37' },
  ];

  return (
    <div className="page-enter mx-auto flex max-w-2xl flex-col gap-6">
      {/* ── Profile header ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(15,76,57,0.3) 0%, rgba(15,21,19,0.9) 100%)',
          border: '1px solid rgba(34,48,43,0.8)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Atmospheric background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(212,175,55,0.06) 0%, transparent 60%)' }}
        />

        <div className="relative px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl font-display text-4xl font-bold text-gold"
              style={{
                background: 'rgba(212,175,55,0.12)',
                border: '2px solid rgba(212,175,55,0.35)',
                boxShadow: '0 0 30px rgba(212,175,55,0.15)',
              }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            {/* Online indicator */}
            <div
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-panel bg-success"
              style={{ boxShadow: '0 0 8px rgba(46,158,107,0.6)' }}
            />
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="font-display text-3xl font-semibold text-text">{username}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="chip" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                  Lv. —
                </span>
                <span className="chip" style={{ background: 'rgba(46,158,107,0.12)', border: '1px solid rgba(46,158,107,0.2)', color: '#2E9E6B' }}>
                  ● Online
                </span>
              </div>
            </div>
            <p className="text-sm text-text-muted mb-3">Rating: <span className="font-mono font-semibold text-gold">—</span></p>

            {/* XP progress */}
            <div className="max-w-xs mx-auto sm:mx-0">
              <div className="flex justify-between text-xs text-text-faint mb-1.5">
                <span>Level — XP</span>
                <span className="font-mono">— / —</span>
              </div>
              <ProgressBar value={0} max={100} colour="#D4AF37" height={5} />
            </div>
          </div>

          {/* Edit button */}
          <button className="flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm text-text-muted transition hover:border-gold/40 hover:text-text shrink-0">
            <Edit3 size={14} />
            Edit
          </button>
        </div>
      </motion.div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs tabs={PROFILE_TABS} active={tab} onChange={setTab} />

      {/* ── Tab content ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5"
        >
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1.5 rounded-2xl px-4 py-4 transition hover:scale-[1.02]"
                style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
              >
                <span style={{ color: s.colour }}>{s.icon}</span>
                <span className="font-mono text-xl font-semibold" style={{ color: s.colour }}>{s.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-text-faint">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Account info */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15,21,19,0.75)', border: '1px solid #22302B' }}
          >
            <div className="border-b border-border/50 px-5 py-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Account</h2>
            </div>
            <div className="px-5">
              {[
                { label: 'Username', value: username },
                { label: 'User ID',  value: <span className="font-mono text-text-faint text-xs">{userId.slice(0, 16)}…</span> },
                { label: 'Member since', value: '—' },
                { label: 'Email',    value: '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between border-b border-border/40 py-3.5 last:border-b-0">
                  <span className="text-sm text-text-muted">{row.label}</span>
                  <span className="text-sm font-medium text-text">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(15,21,19,0.75)', border: '1px solid #22302B' }}
          >
            <div className="border-b border-border/50 px-5 py-3.5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Quick Links</h2>
            </div>
            <div className="flex flex-col p-2">
              {[
                { label: 'Game History', icon: History,  path: '/games' },
                { label: 'Room History', icon: DoorOpen, path: '/rooms' },
                { label: 'Achievements', icon: Medal,    path: '/achievements' },
                { label: 'Leaderboard', icon: Trophy,   path: '/leaderboard' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-muted transition hover:bg-panel2 hover:text-text"
                  >
                    <Icon size={16} className="text-text-faint" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="text-text-faint">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'performance' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-5"
        >
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 gap-3"
            style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
          >
            <TrendingUp size={40} className="text-text-faint opacity-30" />
            <p className="font-medium text-text-muted">Performance charts coming soon</p>
            <p className="text-sm text-text-faint">Play more games to see your stats.</p>
          </div>
        </motion.div>
      )}

      {tab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/achievements')}
            className="w-full rounded-2xl border border-border py-4 text-sm text-text-muted transition hover:border-gold/40 hover:text-gold flex items-center justify-center gap-2"
          >
            <Medal size={16} />
            View all achievements
          </button>
        </motion.div>
      )}

      {tab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/games')}
            className="w-full rounded-2xl border border-border py-4 text-sm text-text-muted transition hover:border-gold/40 hover:text-gold flex items-center justify-center gap-2"
          >
            <History size={16} />
            View game history
          </button>
        </motion.div>
      )}

      {/* ── Session / Logout ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(178,58,46,0.05)', border: '1px solid rgba(178,58,46,0.2)' }}
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-danger/70">Session</h2>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 py-3 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? 'Logging out…' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}