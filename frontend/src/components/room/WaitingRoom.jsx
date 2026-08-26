// src/components/room/WaitingRoom.jsx
import { useState } from 'react';
import SeatList from './SeatList';
import BotSettings from './BotSettings';

export default function WaitingRoom({
  room,
  isHost,
  myUserId,
  onAddBot,
  onStartGame,
  onLeaveRoom,
  onKickPlayer,
  onRemoveBot,
  onCloseRoom
}) {
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [copied, setCopied] = useState(false);

  const seatedCount = room.seats.filter(Boolean).length;
  const emptySeatCount = room.seats.length - seatedCount;
  const canStart = seatedCount >= 2; // matches roomManager's 2-player minimum

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
      // Auto-reset the confirmation state after a few seconds rather than
      // relying on onBlur (which can race with the second click landing
      // in some browsers — focus can shift before the click registers).
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
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between rounded-lg border border-[#22302B] bg-[#0F1513] p-4">
        <div>
          <p className="text-xs text-[#8B9A94]">Room code</p>
          <p className="font-mono text-2xl tracking-[0.3em] text-[#D4AF37]">{room.id}</p>
        </div>
        <button
          onClick={handleCopyCode}
          className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#EDEAE3] transition hover:border-[#D4AF37]"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm text-[#8B9A94]">
          {seatedCount} / {room.seats.length} players seated
        </p>
        <SeatList
          seats={room.seats}
          hostId={room.hostId}
          isHost={isHost}
          myUserId={myUserId}
          onKickPlayer={onKickPlayer}
          onRemoveBot={onRemoveBot}
        />
      </div>

      {isHost && (
        <BotSettings emptySeatCount={emptySeatCount} onAddBot={onAddBot} disabled={starting} />
      )}

      {isHost ? (
        <button
          onClick={handleStart}
          disabled={!canStart || starting}
          className="rounded bg-[#D4AF37] px-4 py-3 font-medium text-[#0B0F10] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting
            ? 'Starting…'
            : canStart
              ? 'Start game'
              : 'Need at least 2 players (add a bot or wait for friends)'}
        </button>
      ) : (
        <p className="text-center text-sm text-[#8B9A94]">Waiting for the host to start the game…</p>
      )}

      <button
        onClick={handleLeave}
        disabled={leaving}
        className="rounded border border-[#22302B] px-4 py-2 text-sm text-[#8B9A94] transition hover:border-[#B23A2E] hover:text-[#B23A2E] disabled:opacity-50"
      >
        {leaving ? 'Leaving…' : 'Leave room'}
      </button>

      {isHost && (
        <button
          onClick={handleCloseRoom}
          disabled={closing}
          className={`rounded border px-4 py-2 text-sm transition disabled:opacity-50 ${
            confirmingClose
              ? 'border-[#B23A2E] bg-[#B23A2E]/10 text-[#B23A2E]'
              : 'border-[#22302B] text-[#5A6B64] hover:border-[#B23A2E] hover:text-[#B23A2E]'
          }`}
        >
          {closing ? 'Closing…' : confirmingClose ? 'Click again to confirm close' : 'Close room'}
        </button>
      )}
    </div>
  );
}