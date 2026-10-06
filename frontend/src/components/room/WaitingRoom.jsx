// src/components/room/WaitingRoom.jsx
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Play, LogOut, X, Bot, UserPlus, Users, Shield } from 'lucide-react';
import SeatList from './SeatList';
import BotSettings from './BotSettings';
import InviteFriendPanel from './InviteFriendPanel';

const ACTIVITY_MESSAGES = [
  { id: 'init', text: 'Room created. Waiting for players…', type: 'system', time: new Date() },
];

export default function WaitingRoom({
  room,
  isHost,
  myUserId,
  onAddBot,
  onStartGame,
  onLeaveRoom,
  onKickPlayer,
  onRemoveBot,
  onCloseRoom,
  onChangeSeat,
}) {
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState(ACTIVITY_MESSAGES);
  const activityRef = useRef(null);

  const seatedCount = room.seats.filter(Boolean).length;
  const humanCount  = room.seats.filter((s) => s && !s.isBot).length;
  const botCount    = room.seats.filter((s) => s && s.isBot).length;
  const emptySeatCount = room.seats.length - seatedCount;
  const canStart = seatedCount >= 2;

  // Auto-scroll activity feed
  useEffect(() => {
    if (activityRef.current) {
      activityRef.current.scrollTop = activityRef.current.scrollHeight;
    }
  }, [activity]);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.code || room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleStart = async () => {
    setStarting(true);
    try { await onStartGame(); }
    finally { setStarting(false); }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try { await onLeaveRoom(); }
    finally { setLeaving(false); }
  };

  const handleCloseRoom = async () => {
    if (!confirmingClose) {
      setConfirmingClose(true);
      setTimeout(() => setConfirmingClose(false), 3000);
      return;
    }
    setClosing(true);
    try { await onCloseRoom(); }
    finally { setClosing(false); }
  };

  const displayCode = (room.code || room.id || '').slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-5 page-enter">
      {/* ── Room code card ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(15,21,19,0.85)', border: '1px solid rgba(212,175,55,0.2)', backdropFilter: 'blur(12px)' }}
      >
        <p className="text-xs uppercase tracking-widest text-text-faint mb-2">Room Code</p>
        <div className="flex items-center justify-between gap-4">
          <motion.p
            className="font-mono text-4xl font-bold tracking-[0.3em] text-gold select-all"
            style={{ textShadow: '0 0 30px rgba(212,175,55,0.3)' }}
          >
            {displayCode}
          </motion.p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyCode}
            className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition"
            style={{
              background: copied ? 'rgba(46,158,107,0.1)' : 'transparent',
              border: `1px solid ${copied ? 'rgba(46,158,107,0.4)' : '#22302B'}`,
              color: copied ? '#2E9E6B' : '#8B9A94',
            }}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                  <Check size={14} /> Copied!
                </motion.span>
              ) : (
                <motion.span key="copy" className="flex items-center gap-1.5">
                  <Copy size={14} /> Copy
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Player count summary */}
        <div className="flex gap-4 mt-3">
          {[
            { icon: <Users size={12} />, label: 'Total',  value: `${seatedCount} / ${room.seats.length}` },
            { icon: <Shield size={12} />, label: 'Humans', value: humanCount },
            { icon: <Bot size={12} />,    label: 'Bots',   value: botCount },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="text-text-faint">{s.icon}</span>
              <span>{s.label}:</span>
              <span className="font-mono font-semibold text-text">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Seat grid ────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Players</h2>
          <span className="font-mono text-xs text-text-faint">
            {seatedCount} / {room.seats.length} seated
          </span>
        </div>
        <SeatList
          seats={room.seats}
          hostId={room.hostId}
          isHost={isHost}
          myUserId={myUserId}
          onKickPlayer={onKickPlayer}
          onRemoveBot={onRemoveBot}
          onChangeSeat={onChangeSeat}
        />
      </div>

      {/* ── Bot settings (host only) ──────────────────────────── */}
      {isHost && (
        <BotSettings emptySeatCount={emptySeatCount} onAddBot={onAddBot} disabled={starting} />
      )}

      {/* ── Invite friends ────────────────────────────────────── */}
      <InviteFriendPanel roomId={room.id} />

      {/* ── Live activity feed ────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(11,15,16,0.7)', border: '1px solid #22302B' }}
      >
        <div className="border-b border-border/40 px-4 py-2.5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-faint">Live Activity</span>
        </div>
        <div
          ref={activityRef}
          className="max-h-28 overflow-y-auto px-4 py-3 flex flex-col gap-1.5"
        >
          {activity.map((msg) => (
            <div key={msg.id} className="flex items-center gap-2 text-xs text-text-muted">
              <span className="text-text-faint shrink-0">
                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>{msg.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Host controls ─────────────────────────────────────── */}
      {isHost ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          disabled={!canStart || starting}
          className="flex items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: '#D4AF37', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
        >
          {starting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
              Starting game…
            </>
          ) : canStart ? (
            <>
              <Play size={18} fill="#0B1A10" />
              Start Game
            </>
          ) : (
            'Need at least 2 players — add a bot or invite friends'
          )}
        </motion.button>
      ) : (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border py-4">
          <div className="flex gap-1">
            {[0, 0.2, 0.4].map((d) => (
              <motion.span
                key={d}
                className="h-2 w-2 rounded-full bg-gold"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: d, repeat: Infinity }}
              />
            ))}
          </div>
          <span className="text-sm text-text-muted">Waiting for host to start the game…</span>
        </div>
      )}

      {/* ── Footer actions ────────────────────────────────────── */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleLeave}
          disabled={leaving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm text-text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-50"
        >
          <LogOut size={14} />
          {leaving ? 'Leaving…' : 'Leave Room'}
        </motion.button>

        {isHost && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCloseRoom}
            disabled={closing}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm transition disabled:opacity-50 ${
              confirmingClose
                ? 'border-danger bg-danger/10 text-danger'
                : 'border-border text-text-faint hover:border-danger hover:text-danger'
            }`}
          >
            <X size={14} />
            {closing ? 'Closing…' : confirmingClose ? 'Confirm close?' : 'Close Room'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
