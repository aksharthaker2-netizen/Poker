// src/pages/Home.jsx (now rendered inside AppShell — see App.jsx)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { createRoom, joinRoom, error } = useRoom(userId);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState(null);
  const [notice, setNotice] = useState(location.state?.notice || null);

  useEffect(() => {
    if (!socket) return;
    const onInvite = (payload) => setInvite(payload);
    socket.on('RECEIVE_GAME_INVITE', onInvite);
    return () => socket.off('RECEIVE_GAME_INVITE', onInvite);
  }, [socket]);

  const handleCreate = async (settings, requestedSeat) => {
    setLoading(true);
    try {
      const room = await createRoom(username, settings, requestedSeat);
      navigate(`/room/${room.id}`);
    } catch {
      // error already surfaced via useRoom's error state
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (roomCode) => {
    setLoading(true);
    try {
      const room = await joinRoom(roomCode, username);
      navigate(`/room/${room.id}`);
    } catch {
      // error already surfaced via useRoom's error state
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-10 flex flex-col items-center gap-2 text-center">
        <span className="text-4xl text-gold">♠ ♥ ♣ ♦</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-text">
          Welcome back, <span className="text-gold">{username}</span>
        </h1>
        <p className="text-text-muted">Create a table, join a friend, or sit down with the bots.</p>
      </div>

      {invite && (
        <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-5 py-3.5 shadow-card">
          <p className="text-sm text-text">
            <span className="font-medium text-gold">{invite.senderName}</span> invited you to a game
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/room/${invite.roomId}`)}
              className="rounded-md bg-gold px-3.5 py-1.5 text-sm font-medium text-ink transition hover:brightness-110"
            >
              Join
            </button>
            <button
              onClick={() => setInvite(null)}
              className="rounded-md border border-border px-3.5 py-1.5 text-sm text-text-muted hover:border-danger"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p className="mx-auto mb-4 flex max-w-2xl items-center justify-between rounded-lg border border-border bg-panel2 px-4 py-2.5 text-sm text-text-muted">
          {notice}
          <button onClick={() => setNotice(null)} className="text-faint hover:text-text">
            ✕
          </button>
        </p>
      )}

      {error && (
        <p className="mx-auto mb-4 max-w-2xl rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        <CreateRoomForm username={username} onCreate={handleCreate} loading={loading} />
        <JoinRoomForm username={username} onJoin={handleJoin} loading={loading} />
      </div>
    </div>
  );
}
