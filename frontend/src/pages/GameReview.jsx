// src/pages/GameReview.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowLeft, Brain, Target, Zap, Shield, Eye } from 'lucide-react';
import { reviewsApi } from '../services/api';
import ProgressBar from '../components/ui/ProgressBar';
import { SkeletonList } from '../components/ui/SkeletonLoader';

const SCORE_CATEGORIES = [
  { key: 'decisionMaking', label: 'Decision Making', icon: <Brain size={14} />,  colour: '#D4AF37' },
  { key: 'aggression',     label: 'Aggression',      icon: <Zap size={14} />,    colour: '#C97F3A' },
  { key: 'risk',           label: 'Risk Management', icon: <Shield size={14} />, colour: '#4A90E2' },
  { key: 'position',       label: 'Position Play',   icon: <Target size={14} />, colour: '#2E9E6B' },
  { key: 'bluffing',       label: 'Bluffing',        icon: <Eye size={14} />,    colour: '#9B59B6' },
];

function HandCard({ hand }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border border-border overflow-hidden transition hover:border-gold/20"
      style={{ background: 'rgba(15,21,19,0.75)' }}
    >
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: hand.isGoodDecision ? '#2E9E6B' : '#B23A2E',
            boxShadow: `0 0 8px ${hand.isGoodDecision ? 'rgba(46,158,107,0.5)' : 'rgba(178,58,46,0.5)'}`,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text">Hand #{hand.handNumber}</p>
          <p className="text-xs text-text-faint mt-0.5">{hand.action} · {hand.street}</p>
        </div>
        <span
          className="font-mono text-sm font-semibold shrink-0"
          style={{ color: hand.chipsWon > 0 ? '#2E9E6B' : hand.chipsWon < 0 ? '#B23A2E' : '#8B9A94' }}
        >
          {hand.chipsWon > 0 ? '+' : ''}{hand.chipsWon ?? 0}
        </span>
        {open ? <ChevronUp size={16} className="text-text-faint shrink-0" /> : <ChevronDown size={16} className="text-text-faint shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/40 overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              {hand.analysis && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1.5">AI Analysis</p>
                  <p className="text-text leading-relaxed">{hand.analysis}</p>
                </div>
              )}
              {hand.suggestedAction && (
                <p className="text-sm text-text-muted">
                  <span className="text-text-faint">Better play: </span>
                  <span className="font-medium text-text">{hand.suggestedAction}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GameReview() {
  const { gameId } = useParams();
  const navigate   = useNavigate();
  const [review, setReview] = useState(null);
  const [hands, setHands]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    try {
      const [reviewRes] = await Promise.all([
        reviewsApi.getForGame(gameId),
      ]);
      setReview(reviewRes.data.review);
      setHands(reviewRes.data.hands ?? []);
    } catch (err) {
      setError(err.response?.data?.error || 'Review not available yet');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => { load(); }, [load]);

  const overallScore = review?.overallScore ?? null;

  return (
    <div className="page-enter mx-auto flex max-w-2xl flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-text-faint transition hover:text-text w-fit"
      >
        <ArrowLeft size={16} />
        Back to history
      </button>

      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Game Review</h1>
        <p className="mt-1 text-sm text-text-muted">AI-powered analysis of your performance</p>
      </div>

      {error && (
        <div
          className="flex flex-col items-center gap-3 rounded-2xl py-16 text-center"
          style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
        >
          <Brain size={40} className="text-text-faint opacity-30" />
          <p className="font-medium text-text-muted">Review not available</p>
          <p className="text-sm text-text-faint">{error}</p>
        </div>
      )}

      {loading ? (
        <SkeletonList count={4} />
      ) : review && (
        <>
          {/* Overall score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-6 rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(15,21,19,0.9) 100%)',
              border: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '2px solid rgba(212,175,55,0.35)',
                boxShadow: '0 0 30px rgba(212,175,55,0.15)',
              }}
            >
              <span className="font-mono text-2xl font-bold text-gold">
                {overallScore ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-text-faint mb-1">Overall Score</p>
              <p className="font-display text-2xl font-semibold text-text">{
                overallScore >= 80 ? 'Excellent' :
                overallScore >= 65 ? 'Good'      :
                overallScore >= 50 ? 'Average'   :
                                     'Needs Work'
              }</p>
              {review.summary && <p className="mt-1 text-sm text-text-muted">{review.summary}</p>}
            </div>
          </motion.div>

          {/* Performance breakdown */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
          >
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-text-muted">Performance Breakdown</h2>
            <div className="flex flex-col gap-4">
              {SCORE_CATEGORIES.map((cat) => {
                const score = review.scores?.[cat.key] ?? 0;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.colour }}>{cat.icon}</span>
                        <span className="text-sm text-text">{cat.label}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold" style={{ color: cat.colour }}>{score}/100</span>
                    </div>
                    <ProgressBar value={score} max={100} colour={cat.colour} height={5} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths and improvements */}
          {(review.strengths?.length > 0 || review.improvements?.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {review.strengths?.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(46,158,107,0.06)', border: '1px solid rgba(46,158,107,0.2)' }}
                >
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-success">Strengths</h2>
                  <ul className="flex flex-col gap-2">
                    {review.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text">
                        <span className="text-success mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.improvements?.length > 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(178,58,46,0.06)', border: '1px solid rgba(178,58,46,0.2)' }}
                >
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-danger">To Improve</h2>
                  <ul className="flex flex-col gap-2">
                    {review.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text">
                        <span className="text-danger mt-0.5">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Key moments */}
          {hands.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Key Moments</h2>
              <div className="flex flex-col gap-3">
                {hands.map((hand) => <HandCard key={hand.id} hand={hand} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
