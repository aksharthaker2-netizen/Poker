// src/components/room/WaitingRoom.jsx
import { useState } from 'react';
import SeatList from './SeatList';
import BotSettings from './BotSettings';
import InviteFriendPanel from './InviteFriendPanel';

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
  onChangeSeat
}) {
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [copied, setCopied] = useState(false);

  const seatedCount = room.seats.filter(Boolean).length;
  const emptySeatCount = room.seats.length - seatedCount;
  const canStart = seatedCount >= 2;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStartGame();
    } finally {
      setStarting(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await onLeaveRoom();
    } finally {
      setLeaving(false);
    }
  };

  const handleCloseRoom = async () => {
    if (!confirmingClose) {
      setConfirmingClose(true);
      setTimeout(() => setConfirmingClose(false), 3000);
      return;
    }
    setClosing(true);
    try {
      await onCloseRoom();
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-xl animate-fade-up flex-col gap-6">
      <div className="flex items-center justify-between rounded-xl border border-gold/25 bg-panel p-5 shadow-panel">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">Room code</p>
          <p className="font-mono text-3xl font-semibold tracking-[0.3em] text-gold">{room.id}</p>
        </div>
        <button
          onClick={handleCopyCode}
          className="rounded-lg border border-border px-3.5 py-2 text-sm text-text transition hover:border-gold"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text">{seatedCount}</span> / {room.seats.length} players
            seated
          </p>
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

      {isHost && (
        <BotSettings emptySeatCount={emptySeatCount} onAddBot={onAddBot} disabled={starting} />
      )}

      <InviteFriendPanel roomId={room.id} />

      {isHost ? (
        <button
          onClick={handleStart}
          disabled={!canStart || starting}
          className="rounded-lg bg-gold py-3 font-semibold text-ink transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting
            ? 'Starting…'
            : canStart
              ? 'Start game'
              : 'Need at least 2 players (add a bot or wait for friends)'}
        </button>
      ) : (
        <p className="flex items-center justify-center gap-2 text-center text-sm text-text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
          Waiting for the host to start the game…
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-text-muted transition hover:border-danger hover:text-danger disabled:opacity-50"
        >
          {leaving ? 'Leaving…' : 'Leave room'}
        </button>

        {isHost && (
          <button
            onClick={handleCloseRoom}
            disabled={closing}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm transition disabled:opacity-50 ${
              confirmingClose
                ? 'border-danger bg-danger/10 text-danger'
                : 'border-border text-faint hover:border-danger hover:text-danger'
            }`}
          >
            {closing ? 'Closing…' : confirmingClose ? 'Confirm close?' : 'Close room'}
          </button>
        )}
      </div>
    </div>
  );
}
