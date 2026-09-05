// src/components/table/ActionButtons.jsx
import { useState, useEffect } from 'react';
import { emitWithAck } from '../../services/socket';

/**
 * Driven entirely by `actionInfo` — the exact legal-actions set the server
 * computes via bettingManager.getLegalActions() for whoever's turn it is
 * (the same computation botManager relies on for bots). No more guessing
 * Check-vs-Call from highestBet alone. The server still re-validates every
 * action regardless; this just makes the UI precise instead of best-effort.
 */
export default function ActionButtons({ actionInfo, myUserId, myChips, roomId, onAction, disabled }) {
  const isMyTurn = actionInfo?.playerId === myUserId;
  const legalActions = actionInfo?.legalActions ?? [];
  const amountToCall = actionInfo?.amountToCall ?? 0;
  const minRaiseAmount = actionInfo?.minRaiseAmount ?? 0;

  const [raiseAmount, setRaiseAmount] = useState(minRaiseAmount || 20);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);

  useEffect(() => {
    setRaiseAmount((prev) => Math.max(prev, minRaiseAmount || 0));
  }, [minRaiseAmount]);

  useEffect(() => {
    setHint(null);
    setHintError(null);
  }, [actionInfo?.playerId]);

  if (!isMyTurn) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-faint">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint" />
        </span>
        Waiting for other players
      </div>
    );
  }

  const canCheck = legalActions.includes('CHECK');
  const canCall = legalActions.includes('CALL');
  const canRaise = legalActions.includes('RAISE');
  const canAllIn = legalActions.includes('ALL_IN');

  const handleAction = async (action, additionalChips = 0) => {
    setSubmitting(true);
    try {
      await onAction(action, additionalChips);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await emitWithAck('GET_HINT', { roomId });
      setHint(res.hint);
    } catch (err) {
      setHintError(err.message);
    } finally {
      setHintLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5 py-3">
      {hint && (
        <div className="max-w-md animate-fade-up rounded-lg border border-gold/40 bg-gold/5 px-4 py-2.5 text-center text-xs text-text shadow-card">
          <span className="font-medium text-gold">
            💡 Suggested: {hint.suggestedAction}
            {hint.suggestedRaiseAmount != null ? ` ${hint.suggestedRaiseAmount}` : ''}
          </span>
          {hint.reason && <p className="mt-1 text-text-muted">{hint.reason}</p>}
        </div>
      )}
      {hintError && <p className="text-xs text-danger">{hintError}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleAction('FOLD')}
          disabled={disabled || submitting}
          className="rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger transition hover:bg-danger hover:text-text active:scale-95 disabled:opacity-50"
        >
          Fold
        </button>

        {canCheck && (
          <button
            onClick={() => handleAction('CHECK')}
            disabled={disabled || submitting}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text transition hover:border-gold active:scale-95 disabled:opacity-50"
          >
            Check
          </button>
        )}

        {canCall && (
          <button
            onClick={() => handleAction('CALL')}
            disabled={disabled || submitting}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text transition hover:border-gold active:scale-95 disabled:opacity-50"
          >
            Call {amountToCall}
          </button>
        )}

        {canRaise && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={minRaiseAmount}
              max={myChips}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="w-24 rounded-lg border border-border bg-ink px-2.5 py-2.5 text-sm text-text outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            />
            <button
              onClick={() => handleAction('RAISE', raiseAmount)}
              disabled={disabled || submitting || raiseAmount < minRaiseAmount || raiseAmount > myChips}
              className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Raise
            </button>
          </div>
        )}

        {canAllIn && (
          <button
            onClick={() => handleAction('ALL_IN', myChips)}
            disabled={disabled || submitting}
            className="shimmer-gold animate-shimmer rounded-lg bg-clip-text px-4 py-2.5 text-sm font-semibold text-transparent ring-1 ring-inset ring-gold/50 transition hover:ring-gold active:scale-95 disabled:opacity-50"
          >
            All-in
          </button>
        )}

        <button
          onClick={handleGetHint}
          disabled={hintLoading}
          title="Ask the AI what it would do here"
          className="rounded-lg border border-border px-3.5 py-2.5 text-sm text-faint transition hover:border-gold hover:text-gold disabled:opacity-50"
        >
          {hintLoading ? '…' : '💡 Hint'}
        </button>
      </div>
    </div>
  );
}
