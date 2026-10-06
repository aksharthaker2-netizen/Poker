// src/pages/Achievements.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { achievementsApi } from '../services/api';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

const CATEGORIES = [
  { key: 'ALL',        label: 'All'       },
  { key: 'GAMES',      label: 'Games'     },
  { key: 'WINNING',    label: 'Winning'   },
  { key: 'SKILL',      label: 'Skill'     },
  { key: 'AI',         label: 'AI'        },
  { key: 'SOCIAL',     label: 'Social'    },
  { key: 'MILESTONES', label: 'Milestones'},
];

const RARITY_CONFIG = {
  LEGENDARY: { label: 'Legendary', bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)',  color: '#D4AF37', glow: 'rgba(212,175,55,0.15)' },
  EPIC:      { label: 'Epic',      bg: 'rgba(155,89,182,0.12)',  border: 'rgba(155,89,182,0.3)',  color: '#9B59B6', glow: 'rgba(155,89,182,0.12)' },
  RARE:      { label: 'Rare',      bg: 'rgba(74,144,226,0.12)',  border: 'rgba(74,144,226,0.25)', color: '#4A90E2', glow: 'rgba(74,144,226,0.1)'  },
  UNCOMMON:  { label: 'Uncommon',  bg: 'rgba(46,158,107,0.12)',  border: 'rgba(46,158,107,0.25)', color: '#2E9E6B', glow: 'rgba(46,158,107,0.1)'  },
  COMMON:    { label: 'Common',    bg: 'rgba(139,154,148,0.08)', border: '#22302B',               color: '#8B9A94', glow: 'transparent'           },
};

const CATEGORY_ICONS = {
  GAMES:      '🃏', WINNING: '🏆', SKILL: '🎯',
  AI:         '🤖', SOCIAL:  '👥', MILESTONES: '⭐',
};

function AchievementCard({ achievement, earned, delay = 0 }) {
  const rarity = RARITY_CONFIG[achievement.rarity || 'COMMON'];
  const isEarned = !!earned;
  const progress = earned?.progress ?? 0;
  const target   = achievement.targetValue ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 350, damping: 28 }}
      whileHover={isEarned ? { scale: 1.02, y: -2 } : {}}
      className={`relative flex flex-col gap-3 rounded-2xl p-5 transition-all ${!isEarned ? 'achievement-locked' : ''}`}
      style={{
        background: isEarned
          ? `linear-gradient(135deg, ${rarity.bg} 0%, rgba(15,21,19,0.9) 100%)`
          : 'rgba(15,21,19,0.6)',
        border: `1px solid ${isEarned ? rarity.border : '#22302B'}`,
        boxShadow: isEarned ? `0 4px 20px ${rarity.glow}` : 'none',
      }}
    >
      {/* Rarity badge */}
      <div className="absolute top-3 right-3">
        <span
          className="chip text-[9px]"
          style={{ background: rarity.bg, border: `1px solid ${rarity.border}`, color: rarity.color }}
        >
          {rarity.label}
        </span>
      </div>

      {/* Lock overlay for locked achievements */}
      {!isEarned && (
        <div className="absolute top-3 left-3">
          <Lock size={12} className="text-text-faint opacity-50" />
        </div>
      )}

      {/* Icon */}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${!isEarned ? 'opacity-30' : ''}`}
        style={{
          background: isEarned ? rarity.bg : 'rgba(15,21,19,0.4)',
          border: `1px solid ${isEarned ? rarity.border : '#22302B'}`,
          boxShadow: isEarned ? `0 0 15px ${rarity.glow}` : 'none',
        }}
      >
        {CATEGORY_ICONS[achievement.category] || '🏅'}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3
          className="font-semibold text-sm mb-1"
          style={{ color: isEarned ? rarity.color : '#5A6B64' }}
        >
          {achievement.name}
        </h3>
        <p className="text-xs text-text-faint leading-snug">{achievement.description}</p>
      </div>

      {/* Progress bar or earned date */}
      {isEarned ? (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-faint">
            {earned.earnedAt
              ? `Earned ${new Date(earned.earnedAt).toLocaleDateString()}`
              : 'Unlocked'}
          </span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-lg"
            title="Unlocked!"
          >
            ✨
          </motion.span>
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-[10px] text-text-faint mb-1.5">
            <span>Progress</span>
            <span className="font-mono">{Math.min(progress, target)}/{target}</span>
          </div>
          <ProgressBar
            value={progress}
            max={target}
            colour={rarity.color}
            height={4}
          />
        </div>
      )}
    </motion.div>
  );
}

export default function Achievements() {
  const [all, setAll]           = useState([]);
  const [earned, setEarned]     = useState({});
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    try {
      const [allRes, meRes] = await Promise.all([
        achievementsApi.listAll(),
        achievementsApi.listMine(),
      ]);
      setAll(allRes.data.achievements ?? []);
      const earnedMap = {};
      (meRes.data.achievements ?? []).forEach((a) => { earnedMap[a.achievementId] = a; });
      setEarned(earnedMap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = all.filter((a) => category === 'ALL' || a.category === category);
  const unlockedCount = Object.keys(earned).length;
  const totalCount    = all.length;
  const overallPct    = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className="page-enter mx-auto flex max-w-4xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Achievements</h1>
        <p className="mt-1 text-sm text-text-muted">
          {unlockedCount} / {totalCount} unlocked
        </p>
      </div>

      {/* Overall progress */}
      {totalCount > 0 && (
        <div
          className="rounded-2xl px-6 py-5"
          style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text">Overall Completion</span>
            <span className="font-mono text-sm font-bold text-gold">{Math.round(overallPct)}%</span>
          </div>
          <ProgressBar value={unlockedCount} max={totalCount} shimmer={true} height={8} />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const isActive = cat.key === category;
          const catCount = cat.key === 'ALL'
            ? all.length
            : all.filter((a) => a.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition"
              style={{
                background: isActive ? 'rgba(212,175,55,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(212,175,55,0.4)' : '#22302B'}`,
                color: isActive ? '#D4AF37' : '#8B9A94',
              }}
            >
              {cat.key !== 'ALL' && <span>{CATEGORY_ICONS[cat.key]}</span>}
              {cat.label}
              <span
                className="font-mono"
                style={{ color: isActive ? 'rgba(212,175,55,0.7)' : '#4A5C54' }}
              >
                {catCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="No achievements in this category"
          description="Keep playing to unlock achievements!"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((a, i) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                earned={earned[a.id]}
                delay={i * 0.04}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}