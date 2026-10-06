// src/pages/AICoach.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, Target, Zap, Shield, Eye,
  ChevronRight, BookOpen, BarChart3, Lightbulb
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ui/ProgressBar';

const SKILL_AREAS = [
  { key: 'decisionMaking', label: 'Decision Making', icon: Brain,  colour: '#D4AF37', score: null, desc: 'Optimal action selection in each situation' },
  { key: 'aggression',     label: 'Aggression',      icon: Zap,    colour: '#C97F3A', score: null, desc: 'Proactive betting and raising tendencies' },
  { key: 'risk',           label: 'Risk Management', icon: Shield, colour: '#4A90E2', score: null, desc: 'Chip preservation and bankroll discipline' },
  { key: 'position',       label: 'Position Play',   icon: Target, colour: '#2E9E6B', score: null, desc: 'Advantage exploitation based on seat position' },
  { key: 'bluffing',       label: 'Bluffing',        icon: Eye,    colour: '#9B59B6', score: null, desc: 'Credible deception and bet sizing' },
];

const TIPS = [
  { icon: '🃏', title: 'Respect position',       desc: 'Playing in position gives you a huge informational advantage. Fold marginal hands out of position.' },
  { icon: '🎯', title: 'Value bet consistently', desc: 'When you have a strong hand, size your bets to extract maximum value from your opponents.' },
  { icon: '🧠', title: 'Think in ranges',        desc: "Don't put opponents on specific hands. Think about the full range of hands they could hold." },
  { icon: '💰', title: 'Manage your bankroll',   desc: 'Never risk more than 5% of your bankroll in a single session to survive variance.' },
  { icon: '📊', title: 'Track your sessions',    desc: 'Review your game history regularly to spot patterns and leaks in your game.' },
];

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3   },
  { key: 'skills',   label: 'Skills',   icon: Target      },
  { key: 'tips',     label: 'Tips',     icon: Lightbulb   },
];

export default function AICoach() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="page-enter mx-auto flex max-w-2xl flex-col gap-6">
      {/* ── Header card ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl px-6 py-7"
        style={{
          background: 'linear-gradient(160deg, rgba(212,175,55,0.08) 0%, rgba(13,18,16,0.95) 100%)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 10% 50%, rgba(212,175,55,0.07) 0%, transparent 60%)' }}
        />
        {/* Gold top line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}
        />

        <div className="relative flex items-center gap-5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              boxShadow: '0 0 24px rgba(212,175,55,0.15)',
            }}
          >
            <Brain size={26} style={{ color: '#D4AF37' }} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold" style={{ color: '#EDEAE3' }}>AI Coach</h1>
            <p className="mt-1 text-sm" style={{ color: '#8B9A94' }}>
              Personalized coaching powered by game analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Tab switcher ─────────────────────────────────────────── */}
      <div className="tab-bar">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-item flex items-center justify-center gap-1.5 ${isActive ? 'active' : ''}`}
            >
              {isActive && (
                <motion.div
                  layoutId="coach-tab-bg"
                  className="absolute inset-0 rounded-[9px]"
                  style={{ background: '#D4AF37', boxShadow: '0 2px 14px rgba(212,175,55,0.35)' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={13} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            {/* No data state */}
            <div
              className="flex flex-col items-center gap-4 rounded-2xl py-12 text-center"
              style={{ background: 'rgba(13,18,16,0.8)', border: '1px solid rgba(34,48,43,0.7)' }}
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                <Brain size={28} style={{ color: '#D4AF37', opacity: 0.5 }} />
              </div>
              <div>
                <p className="font-semibold mb-2" style={{ color: '#EDEAE3' }}>
                  Coaching starts after your first game
                </p>
                <p className="text-sm max-w-xs" style={{ color: '#5A6B64' }}>
                  Play a game and request a review to unlock personalized AI coaching recommendations.
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="btn-gold flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
              >
                Start Playing
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Quick links */}
            <button
              onClick={() => navigate('/games')}
              className="flex items-center justify-between rounded-2xl px-5 py-4 transition text-left"
              style={{ background: 'rgba(13,18,16,0.75)', border: '1px solid rgba(34,48,43,0.7)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(212,175,55,0.25)'; e.currentTarget.style.background='rgba(20,28,26,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(34,48,43,0.7)'; e.currentTarget.style.background='rgba(13,18,16,0.75)'; }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(46,158,107,0.1)', border: '1px solid rgba(46,158,107,0.25)' }}
                >
                  <TrendingUp size={16} style={{ color: '#2E9E6B' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#EDEAE3' }}>Game Reviews</p>
                  <p className="text-xs" style={{ color: '#5A6B64' }}>View your past game analyses</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: '#5A6B64' }} />
            </button>

            <button
              onClick={() => navigate('/achievements')}
              className="flex items-center justify-between rounded-2xl px-5 py-4 transition text-left"
              style={{ background: 'rgba(13,18,16,0.75)', border: '1px solid rgba(34,48,43,0.7)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(212,175,55,0.25)'; e.currentTarget.style.background='rgba(20,28,26,0.8)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(34,48,43,0.7)'; e.currentTarget.style.background='rgba(13,18,16,0.75)'; }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}
                >
                  <BookOpen size={16} style={{ color: '#D4AF37' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#EDEAE3' }}>Achievements</p>
                  <p className="text-xs" style={{ color: '#5A6B64' }}>Track your progress milestones</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: '#5A6B64' }} />
            </button>
          </motion.div>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-6"
            style={{ background: 'rgba(13,18,16,0.8)', border: '1px solid rgba(34,48,43,0.7)' }}
          >
            <p className="text-xs mb-6" style={{ color: '#5A6B64' }}>
              Skills are calculated from your game reviews. Play more to see your data.
            </p>
            <div className="flex flex-col gap-5">
              {SKILL_AREAS.map((skill) => {
                const Icon = skill.icon;
                return (
                  <motion.div
                    key={skill.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-md"
                          style={{ background: `${skill.colour}18`, border: `1px solid ${skill.colour}30` }}
                        >
                          <Icon size={12} style={{ color: skill.colour }} />
                        </div>
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#EDEAE3' }}>{skill.label}</span>
                          <p className="text-[10px]" style={{ color: '#4A5C54' }}>{skill.desc}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold" style={{ color: skill.score != null ? skill.colour : '#3A4D46' }}>
                        {skill.score != null ? `${skill.score}/100` : '—'}
                      </span>
                    </div>
                    <ProgressBar value={skill.score ?? 0} max={100} colour={skill.colour} height={5} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Tips */}
        {activeTab === 'tips' && (
          <motion.div
            key="tips"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-3"
          >
            {TIPS.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-4 rounded-2xl px-5 py-4"
                style={{ background: 'rgba(13,18,16,0.8)', border: '1px solid rgba(34,48,43,0.7)' }}
                whileHover={{ borderColor: 'rgba(212,175,55,0.2)', transition: { duration: 0.15 } }}
              >
                <span className="text-2xl shrink-0 mt-0.5">{tip.icon}</span>
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#EDEAE3' }}>{tip.title}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#8B9A94' }}>{tip.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
