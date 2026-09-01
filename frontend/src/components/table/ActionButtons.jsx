// src/components/table/ActionButtons.jsx
import { useState, useEffect } from 'react';
import { emitWithAck } from '../../services/socket';

/**
 * Driven entirely by `actionInfo` — the exact legal-actions set the server
 * computes via bettingManager.getLegalActions() for whoever's turn it is
 * (the same computation botManager relies on for bots). No more guessing
 * Check-vs-Call from highestBet alone. The server still re-validates every
 * action regardless; this just makes the UI precise instead of best-effort.
 *
 * @param {Object|null} actionInfo - { playerId, amountToCall, minRaiseAmount, legalActions }
 * @param {Number} myChips
 * @param {String} roomId - needed for the GET_HINT socket call
 * @param {Function} onAction - (action, additionalChips) => Promise
 * @param {Boolean} disabled
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

  // Keep the raise input's floor in sync as the minimum changes turn to turn.
  useEffect(() => {
    setRaiseAmount((prev) => Math.max(prev, minRaiseAmount || 0));
  }, [minRaiseAmount]);

  // A hint from a previous turn shouldn't linger once it's someone else's turn.
  useEffect(() => {
    setHint(null);
    setHintError(null);
  }, [actionInfo?.playerId]);

  if (!isMyTurn) {
    return <p className="py-3 text-center text-sm text-[#5A6B64]">Waiting for other players…</p>;
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
    <div className="flex flex-col items-center gap-2 py-3">
      {hint && (
        <div className="max-w-md rounded border border-[#D4AF37]/40 bg-[#D4AF37]/5 px-3 py-2 text-center text-xs text-[#EDEAE3]">
          <span className="font-medium text-[#D4AF37]">
            Suggested: {hint.suggestedAction}
            {hint.suggestedRaiseAmount != null ? ` ${hint.suggestedRaiseAmount}` : ''}
          </span>
          {hint.reason && <p className="mt-1 text-[#8B9A94]">{hint.reason}</p>}
        </div>
      )}
      {hintError && <p className="text-xs text-[#B23A2E]">{hintError}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => handleAction('FOLD')}
          disabled={disabled || submitting}
          className="rounded border border-[#B23A2E] px-4 py-2 text-sm font-medium text-[#B23A2E] transition hover:bg-[#B23A2E] hover:text-[#EDEAE3] disabled:opacity-50"
        >
          Fold
        </button>

        {canCheck && (
          <button
            onClick={() => handleAction('CHECK')}
            disabled={disabled || submitting}
            className="rounded border border-[#22302B] px-4 py-2 text-sm font-medium text-[#EDEAE3] transition hover:border-[#D4AF37] disabled:opacity-50"
          >
            Check
          </button>
        )}

        {canCall && (
          <button
            onClick={() => handleAction('CALL')}
            disabled={disabled || submitting}
            className="rounded border border-[#22302B] px-4 py-2 text-sm font-medium text-[#EDEAE3] transition hover:border-[#D4AF37] disabled:opacity-50"
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
              className="w-24 rounded border border-[#22302B] bg-[#0B0F10] px-2 py-2 text-sm text-[#EDEAE3] outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={() => handleAction('RAISE', raiseAmount)}
              disabled={disabled || submitting || raiseAmount < minRaiseAmount || raiseAmount > myChips}
              className="rounded bg-[#D4AF37] px-4 py-2 text-sm font-medium text-[#0B0F10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Raise
            </button>
          </div>
        )}

        {canAllIn && (
          <button
            onClick={() => handleAction('ALL_IN', myChips)}
            disabled={disabled || submitting}
            className="rounded border border-[#22302B] px-4 py-2 text-sm font-medium text-[#8B9A94] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-50"
          >
            All-in
          </button>
        )}

        <button
          onClick={handleGetHint}
          disabled={hintLoading}
          title="Ask the AI what it would do here"
          className="rounded border border-[#22302B] px-3 py-2 text-sm text-[#5A6B64] transition hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-50"
        >
          {hintLoading ? '…' : '💡 Hint'}
        </button>
      </div>
    </div>
  );
}