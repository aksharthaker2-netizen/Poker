// src/components/game/AICoachPanel.jsx
// Right-side AI intelligence panel shown during the game.
// Data props accept real backend data; falls back to null/placeholder display.
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Zap, Target, Activity } from 'lucide-react';

/* ── Sub-components ─────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, label, accent = '#D4AF37' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
      >
        <Icon size={12} style={{ color: accent }} />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#5A6B64' }}>
        {label}
      </span>
    </div>
  );
}

function WinProbabilityRing({ value = null }) {
  const pct = value ?? 0;
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  const colour =
    pct >= 70 ? '#2E9E6B' :
    pct >= 40 ? '#D4AF37' :
    '#B23A2E';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          {/* Track */}
          <circle cx={44} cy={44} r={radius} fill="none" stroke="rgba(34,48,43,0.7)" strokeWidth={7} />
          {/* Fill */}
          <motion.circle
            cx={44} cy={44} r={radius}
            fill="none"
            stroke={colour}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: value != null ? offset : circ }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', filter: `drop-shadow(0 0 6px ${colour}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-lg font-bold" style={{ color: value != null ? colour : '#3A4D46' }}>
            {value != null ? `${Math.round(pct)}%` : '—'}
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#4A5C54' }}>win</span>
        </div>
      </div>
      {value == null && (
        <p className="text-[10px] text-center" style={{ color: '#4A5C54' }}>
          Waiting for hand…
        </p>
      )}
    </div>
  );
}

function ActionBar({ label, pct, colour }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color: '#8B9A94' }}>{label}</span>
        <span className="font-mono text-xs font-semibold" style={{ color: pct != null ? colour : '#3A4D46' }}>
          {pct != null ? `${Math.round(pct)}%` : '—'}
        </span>
      </div>
      <div className="ai-probability-bar">
        <motion.div
          className="ai-probability-fill"
          initial={{ width: 0 }}
          animate={{ width: pct != null ? `${pct}%` : 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: colour }}
        />
      </div>
    </div>
  );
}

function HintPanel({ hint }) {
  if (!hint) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3"
      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#D4AF37' }}>
        Recommendation
      </p>
      <p className="text-sm font-semibold" style={{ color: '#EDEAE3' }}>
        {hint.suggestedAction}
        {hint.suggestedRaiseAmount != null ? ` · ${hint.suggestedRaiseAmount.toLocaleString()}` : ''}
      </p>
      {hint.reason && (
        <p className="text-xs leading-relaxed mt-1.5" style={{ color: '#8B9A94' }}>{hint.reason}</p>
      )}
      {hint.winProbability != null && (
        <div className="mt-2 flex items-center gap-1.5">
          <TrendingUp size={10} style={{ color: '#2E9E6B' }} />
          <span className="text-[10px]" style={{ color: '#2E9E6B' }}>
            Win chance: {Math.round(hint.winProbability * 100)}%
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ── History log ────────────────────────────────────────────────────────── */
function HistoryItem({ action, chips, street, isGood }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: isGood ? '#2E9E6B' : '#B23A2E' }}
      />
      <span className="text-xs flex-1" style={{ color: '#8B9A94' }}>
        <span className="font-semibold" style={{ color: '#EDEAE3' }}>{action}</span>
        {street && <span style={{ color: '#5A6B64' }}> · {street}</span>}
      </span>
      {chips != null && (
        <span
          className="font-mono text-xs font-semibold"
          style={{ color: chips >= 0 ? '#2E9E6B' : '#B23A2E' }}
        >
          {chips >= 0 ? '+' : ''}{chips}
        </span>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function AICoachPanel({
  hint = null,
  gameState = null,
  potSize = 0,
  street = null,
  actionHistory = [],
  isMyTurn = false,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  // Derive action probabilities from hint if available
  const raisePct = hint?.raiseProbability != null ? hint.raiseProbability * 100 : null;
  const callPct  = hint?.callProbability  != null ? hint.callProbability  * 100 : null;
  const foldPct  = hint?.foldProbability  != null ? hint.foldProbability  * 100 : null;
  const winPct   = hint?.winProbability   != null ? hint.winProbability   * 100 : null;

  return (
    <div className="ai-coach-panel flex flex-col h-full">
      {/* ── Panel header ──────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 border-b shrink-0"
        style={{ borderColor: 'rgba(34,48,43,0.6)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
          style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
        >
          <Brain size={15} className="text-gold" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#EDEAE3' }}>AI Coach</p>
          <p className="text-[10px]" style={{ color: '#5A6B64' }}>PokerAI Intelligence</p>
        </div>
        {isMyTurn && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-0.5"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#D4AF37' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#D4AF37' }}>
              Your Turn
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">

        {/* Win probability */}
        <div className="ai-coach-section">
          <SectionHeader icon={Activity} label="Win Probability" accent="#2E9E6B" />
          <div className="flex justify-center">
            <WinProbabilityRing value={winPct} />
          </div>
        </div>

        {/* Action probabilities */}
        <div className="ai-coach-section">
          <SectionHeader icon={Target} label="Recommended Action" accent="#D4AF37" />
          <div className="flex flex-col gap-3">
            <ActionBar label="Raise"  pct={raisePct} colour="#D4AF37" />
            <ActionBar label="Call"   pct={callPct}  colour="#2E9E6B" />
            <ActionBar label="Fold"   pct={foldPct}  colour="#B23A2E" />
          </div>
        </div>

        {/* Hint / Strategy */}
        <div className="ai-coach-section">
          <SectionHeader icon={Lightbulb} label="Strategy" accent="#D4AF37" />
          <AnimatePresence mode="wait">
            {hint ? (
              <HintPanel key="hint" hint={hint} />
            ) : (
              <motion.div
                key="no-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(20,28,26,0.5)', border: '1px solid rgba(34,48,43,0.5)' }}
              >
                <Lightbulb size={20} className="mx-auto mb-2" style={{ color: '#3A4D46' }} />
                <p className="text-xs" style={{ color: '#4A5C54' }}>
                  {isMyTurn
                    ? 'Click the 💡 hint button in the action bar for AI advice'
                    : 'Hints appear when it\'s your turn'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game info */}
        <div className="ai-coach-section">
          <SectionHeader icon={Zap} label="Game State" accent="#C97F3A" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Street', value: street || gameState || '—' },
              { label: 'Pot',    value: potSize ? potSize.toLocaleString() : '0' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl px-3 py-2"
                style={{ background: 'rgba(20,28,26,0.6)', border: '1px solid rgba(34,48,43,0.5)' }}
              >
                <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: '#4A5C54' }}>{s.label}</p>
                <p className="font-mono text-xs font-bold" style={{ color: '#EDEAE3' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hand history */}
        {actionHistory.length > 0 && (
          <div className="ai-coach-section">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full items-center justify-between"
            >
              <SectionHeader icon={TrendingUp} label={`Hand History (${actionHistory.length})`} accent="#4A90E2" />
              {historyOpen ? <ChevronUp size={14} style={{ color: '#5A6B64' }} /> : <ChevronDown size={14} style={{ color: '#5A6B64' }} />}
            </button>
            <AnimatePresence>
              {historyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(34,48,43,0.3)' }}>
                    {actionHistory.slice(-8).map((item, i) => (
                      <HistoryItem
                        key={i}
                        action={item.action}
                        chips={item.chips}
                        street={item.street}
                        isGood={item.isGood}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Empty history placeholder */}
        {actionHistory.length === 0 && (
          <div className="ai-coach-section">
            <SectionHeader icon={TrendingUp} label="Hand History" accent="#4A90E2" />
            <p className="text-[11px] text-center py-2" style={{ color: '#4A5C54' }}>No hands played yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
