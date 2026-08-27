// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';
import { authApi, clearSession } from '../services/api';
import { disconnectSocket } from '../services/socket';

function NavLink({ to, children, navigate }) {
  return (
    <button
      onClick={() => navigate(to)}
      className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#8B9A94] transition hover:border-[#D4AF37] hover:text-[#D4AF37]"
    >
      {children}
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { createRoom, joinRoom, error } = useRoom(userId);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState(null);
  // Passed via navigate('/', { state: { notice } }) when Room.jsx/Game.jsx
  // bounce someone here after a ROOM_CLOSED or KICKED_FROM_ROOM event.
  const [notice, setNotice] = useState(location.state?.notice || null);

  useEffect(() => {
    if (!socket) return;
    const onInvite = (payload) => setInvite(payload);
    socket.on('RECEIVE_GAME_INVITE', onInvite);
    return () => socket.off('RECEIVE_GAME_INVITE', onInvite);
  }, [socket]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — proceed with local logout regardless
    }
    disconnectSocket();
    clearSession();
    navigate('/login');
  };

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
    <div className="min-h-screen bg-[#0B0F10] px-4 py-16 text-[#EDEAE3]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="mb-1 text-3xl font-semibold">PokerAI</h1>
            <p className="text-sm text-[#8B9A94]">Playing as {username}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NavLink to="/friends" navigate={navigate}>
              Friends
            </NavLink>
            <NavLink to="/leaderboard" navigate={navigate}>
              Leaderboard
            </NavLink>
            <NavLink to="/achievements" navigate={navigate}>
              Achievements
            </NavLink>
            <NavLink to="/games" navigate={navigate}>
              Game history
            </NavLink>
            <NavLink to="/rooms" navigate={navigate}>
              My rooms
            </NavLink>
            <NavLink to="/profile" navigate={navigate}>
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#8B9A94] transition hover:border-[#B23A2E] hover:text-[#B23A2E]"
            >
              Log out
            </button>
          </div>
        </div>

        {invite && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-3">
            <p className="text-sm text-[#EDEAE3]">
              <span className="font-medium text-[#D4AF37]">{invite.senderName}</span> invited you to
              a game
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/room/${invite.roomId}`)}
                className="rounded bg-[#D4AF37] px-3 py-1.5 text-sm font-medium text-[#0B0F10] hover:brightness-110"
              >
                Join
              </button>
              <button
                onClick={() => setInvite(null)}
                className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#8B9A94] hover:border-[#B23A2E]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {notice && (
          <p className="mb-4 flex items-center justify-between rounded border border-[#22302B] bg-[#12181B] px-3 py-2 text-sm text-[#8B9A94]">
            {notice}
            <button onClick={() => setNotice(null)} className="text-[#5A6B64] hover:text-[#EDEAE3]">
              ✕
            </button>
          </p>
        )}

        {error && (
          <p className="mb-4 rounded border border-[#B23A2E]/40 bg-[#B23A2E]/10 px-3 py-2 text-sm text-[#B23A2E]">
            {error}
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <CreateRoomForm username={username} onCreate={handleCreate} loading={loading} />
          <JoinRoomForm username={username} onJoin={handleJoin} loading={loading} />
        </div>
      </div>
    </div>
  );
}