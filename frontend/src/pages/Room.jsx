// src/pages/Room.jsx — Waiting Room (lobby before a game starts)
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import WaitingRoom from '../components/room/WaitingRoom';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const {
    room,
    isHost,
    error,
    closedReason,
    addBot,
    startGame,
    leaveRoom,
    kickPlayer,
    removeBot,
    closeRoom,
    changeSeat,
    clearRoom,
  } = useRoom(userId);

  // Redirect to game page as soon as the game starts
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      navigate(`/game/${roomId}`, { replace: true });
    }
  }, [room?.status, roomId, navigate]);

  // Redirect home if the room was closed or we got kicked
  useEffect(() => {
    if (closedReason) {
      clearRoom();
      navigate('/', { state: { notice: closedReason } });
    }
  }, [closedReason, clearRoom, navigate]);

  /* ── Loading state ───────────────────────────────────────── */
  if (!room) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        {/* Chip spinner */}
        <div
          className="flex h-16 w-16 animate-spin items-center justify-center rounded-full text-3xl"
          style={{ border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
        >
        </div>
        <p className="text-sm text-text-muted">Loading room…</p>
      </div>
    );
  }

  const seatedCount = room.seats.filter(Boolean).length;

  return (
    <div className="page-enter mx-auto max-w-xl">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🃏</span>
          <h1 className="font-display text-2xl font-semibold text-text">Waiting Room</h1>
        </div>
        <p className="text-sm text-text-muted">
          {seatedCount} of {room.seats.length} seats filled
          {isHost ? ' — you are the host' : ''}
        </p>
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div
          className="mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm animate-slide-down"
          style={{ background: 'rgba(178,58,46,0.1)', border: '1px solid rgba(178,58,46,0.3)', color: '#C0453A' }}
        >
          <span>⚠</span> {error}
        </div>
      )}

      {/* ── WaitingRoom component (seats, bots, invite) ──────── */}
      <WaitingRoom
        room={room}
        isHost={isHost}
        myUserId={userId}
        onAddBot={(requestedSeat, botRating) => addBot(roomId, requestedSeat, botRating)}
        onStartGame={() => startGame(roomId)}
        onLeaveRoom={() => leaveRoom(roomId).then(() => navigate('/'))}
        onKickPlayer={(targetUserId) => kickPlayer(roomId, targetUserId)}
        onRemoveBot={(botId) => removeBot(roomId, botId)}
        onCloseRoom={() => closeRoom(roomId).then(() => navigate('/'))}
        onChangeSeat={(seat) => changeSeat(roomId, seat)}
      />
    </div>
  );
}