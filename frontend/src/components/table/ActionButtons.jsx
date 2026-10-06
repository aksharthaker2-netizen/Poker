// src/components/table/ActionButtons.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { emitWithAck } from '../../services/socket';
import { Lightbulb, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

const PRESET_LABELS = ['¼ Pot', '½ Pot', 'Pot', '2×'];

/**
 * Bottom action panel for the poker game.
 * Touch-friendly, with raise slider + presets, hint display, loading states.
 * Driven entirely by actionInfo from the server (getLegalActions).
 * onHintReceived: optional callback so parent (Game.jsx) can forward hint to AICoachPanel.
 */
export default function ActionButtons({
  actionInfo,
  myUserId,
  myChips,
  roomId,
  onAction,
  onHintReceived,
  disabled,
}) {
  const isMyTurn      = actionInfo?.playerId === myUserId;
  const legalActions  = actionInfo?.legalActions ?? [];
  const amountToCall  = actionInfo?.amountToCall ?? 0;
  const minRaiseAmount = actionInfo?.minRaiseAmount ?? 20;
  const potSize       = actionInfo?.potSize ?? 0;

  const [raiseAmount, setRaiseAmount] = useState(minRaiseAmount || 20);
  const [submitting,  setSubmitting]  = useState(null);
  const [hint,        setHint]        = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError,   setHintError]   = useState(null);
  const [showRaise,   setShowRaise]   = useState(false);

  useEffect(() => {
    setRaiseAmount(Math.max(raiseAmount, minRaiseAmount || 0));
    setShowRaise(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRaiseAmount, actionInfo?.playerId]);

  useEffect(() => {
    setHint(null);
    setHintError(null);
  }, [actionInfo?.playerId]);

  const canCheck = legalActions.includes('CHECK');
  const canCall  = legalActions.includes('CALL');
  const canRaise = legalActions.includes('RAISE');
  const canAllIn = legalActions.includes('ALL_IN');

  const handleAction = async (action, additionalChips = 0) => {
    setSubmitting(action);
    try {
      await onAction(action, additionalChips);
    } finally {
      setSubmitting(null);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await emitWithAck('GET_HINT', { roomId });
      setHint(res.hint);
      onHintReceived?.(res.hint); // forward to AICoachPanel
    } catch (err) {
      setHintError(err.message);
    } finally {
      setHintLoading(false);
    }
  };

  const getPresetRaise = (label) => {
    const pot = Math.max(potSize, 1);
    const presets = {
      '¼ Pot': Math.max(minRaiseAmount, Math.floor(pot / 4)),
      '½ Pot': Math.max(minRaiseAmount, Math.floor(pot / 2)),
      'Pot':   Math.max(minRaiseAmount, pot),
      '2×':   Math.max(minRaiseAmount, pot * 2),
    };
    return Math.min(presets[label] ?? minRaiseAmount, myChips);
  };

  /* ── Waiting state ──────────────────────────────────────────── */
  if (!isMyTurn) {
    return (
      <div
        className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl"
        style={{
          background: 'rgba(11,16,14,0.85)',
          border: '1px solid rgba(34,48,43,0.7)',
        }}
      >
        <div className="flex gap-1.5">
          {[0, 0.15, 0.3].map((d) => (
            <motion.span
              key={d}
              className="h-2 w-2 rounded-full"
              style={{ background: '#3A4D46' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, delay: d, repeat: Infinity }}
            />
          ))}
        </div>
        <span className="text-sm" style={{ color: '#5A6B64' }}>Waiting for other players…</span>
      </div>
    );
  }

  return (
    <div className="action-bar px-4 py-3.5 space-y-3">
      {/* ── Inline hint panel (compact, shown in action bar too) ── */}
      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb size={12} style={{ color: '#D4AF37' }} />
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: '#D4AF37' }}>
                  AI Suggestion
                </span>
              </div>
              <p className="font-semibold" style={{ color: '#EDEAE3' }}>
                {hint.suggestedAction}
                {hint.suggestedRaiseAmount != null ? ` · ${hint.suggestedRaiseAmount.toLocaleString()} chips` : ''}
              </p>
              {hint.reason && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: '#8B9A94' }}>{hint.reason}</p>
              )}
            </div>
          </motion.div>
        )}
        {hintError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-center"
            style={{ color: '#B23A2E' }}
          >
            {hintError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Raise panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showRaise && canRaise && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-xl p-3 space-y-3"
              style={{ background: 'rgba(13,18,16,0.95)', border: '1px solid rgba(34,48,43,0.8)' }}
            >
              {/* Presets */}
              <div className="flex gap-1.5">
                {PRESET_LABELS.map((label) => (
                  <button
                    key={label}
                    onClick={() => setRaiseAmount(getPresetRaise(label))}
                    className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition"
                    style={{
                      border: '1px solid rgba(34,48,43,0.8)',
                      background: 'transparent',
                      color: '#8B9A94',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(212,175,55,0.5)'; e.currentTarget.style.color='#D4AF37'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(34,48,43,0.8)'; e.currentTarget.style.color='#8B9A94'; }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min={minRaiseAmount}
                  max={myChips}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  className="w-full accent-gold"
                />
                <div className="flex justify-between text-xs" style={{ color: '#5A6B64' }}>
                  <span>Min: {minRaiseAmount}</span>
                  <span className="font-mono font-bold text-sm" style={{ color: '#D4AF37' }}>
                    {raiseAmount.toLocaleString()}
                  </span>
                  <span>All: {myChips.toLocaleString()}</span>
                </div>
              </div>

              {/* Stepper */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRaiseAmount((v) => Math.max(minRaiseAmount, v - Math.max(1, Math.floor((myChips - minRaiseAmount) / 20))))}
                  className="h-9 w-10 rounded-lg text-lg font-bold leading-none transition"
                  style={{ border: '1px solid rgba(34,48,43,0.8)', color: '#8B9A94', background: 'transparent' }}
                >−</button>
                <input
                  type="number"
                  min={minRaiseAmount}
                  max={myChips}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  className="flex-1 h-9 rounded-lg border px-3 text-center text-sm font-mono outline-none transition"
                  style={{ borderColor: 'rgba(34,48,43,0.8)', background: 'rgba(11,15,16,0.9)', color: '#EDEAE3' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(34,48,43,0.8)'; }}
                />
                <button
                  onClick={() => setRaiseAmount((v) => Math.min(myChips, v + Math.max(1, Math.floor((myChips - minRaiseAmount) / 20))))}
                  className="h-9 w-10 rounded-lg text-lg font-bold leading-none transition"
                  style={{ border: '1px solid rgba(34,48,43,0.8)', color: '#8B9A94', background: 'transparent' }}
                >+</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main action buttons ──────────────────────────────────── */}
      <div className="flex gap-2.5">
        {/* Fold */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleAction('FOLD')}
          disabled={disabled || submitting !== null}
          className="game-btn-fold flex-1 py-3.5 disabled:opacity-50"
          style={{ minHeight: 52 }}
        >
          {submitting === 'FOLD'
            ? <Loader2 size={16} className="animate-spin mx-auto" />
            : 'Fold'
          }
        </motion.button>

        {/* Check / Call */}
        {(canCheck || canCall) && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAction(canCheck ? 'CHECK' : 'CALL')}
            disabled={disabled || submitting !== null}
            className="game-btn-check flex-1 py-3.5 disabled:opacity-50"
            style={{ minHeight: 52 }}
          >
            {submitting === 'CHECK' || submitting === 'CALL'
              ? <Loader2 size={16} className="animate-spin mx-auto" />
              : canCheck
              ? 'Check'
              : <span>Call <span className="font-mono" style={{ color: '#D4AF37' }}>{amountToCall}</span></span>
            }
          </motion.button>
        )}

        {/* Raise */}
        {canRaise && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (showRaise) {
                handleAction('RAISE', raiseAmount);
              } else {
                setShowRaise(true);
              }
            }}
            disabled={disabled || submitting !== null || (showRaise && (raiseAmount < minRaiseAmount || raiseAmount > myChips))}
            className="game-btn-raise flex-1 py-3.5 disabled:opacity-50"
            style={{ minHeight: 52 }}
          >
            {submitting === 'RAISE'
              ? <Loader2 size={16} className="animate-spin mx-auto" style={{ color: '#0B1A10' }} />
              : showRaise
              ? <span>Raise <span className="font-mono">{raiseAmount.toLocaleString()}</span></span>
              : 'Raise ▸'
            }
          </motion.button>
        )}

        {/* All-in */}
        {canAllIn && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAction('ALL_IN', myChips)}
            disabled={disabled || submitting !== null}
            className="game-btn-allin flex-1 py-3.5 disabled:opacity-50"
            style={{ minHeight: 52 }}
          >
            {submitting === 'ALL_IN'
              ? <Loader2 size={16} className="animate-spin mx-auto" />
              : 'All-in'
            }
          </motion.button>
        )}

        {/* AI Hint button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleGetHint}
          disabled={hintLoading}
          title="Ask AI for a hint"
          className="game-btn-check w-14 py-3.5 disabled:opacity-50 relative"
          style={{ minHeight: 52, flexShrink: 0 }}
        >
          {hintLoading
            ? <Loader2 size={14} className="animate-spin mx-auto" />
            : <Lightbulb size={16} className="mx-auto" style={{ color: '#D4AF37' }} />
          }
        </motion.button>
      </div>

      {/* Cancel raise */}
      {showRaise && (
        <button
          onClick={() => setShowRaise(false)}
          className="w-full text-xs transition py-1"
          style={{ color: '#4A5C54' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#8B9A94'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#4A5C54'; }}
        >
          Cancel raise
        </button>
      )}
    </div>
  );
}
