// src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import { useRoom } from '../hooks/useRoom';
import { authApi, clearSession } from '../services/api';
import { disconnectSocket } from '../services/socket';

export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { createRoom, joinRoom, error } = useRoom(userId);
  const [loading, setLoading] = useState(false);

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


  const handleCreate = async (settings) => {
    setLoading(true);
    try {
      const room = await createRoom(username, settings);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-semibold">PokerAI</h1>
            <p className="text-sm text-[#8B9A94]">Playing as {username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm text-[#8B9A94] transition hover:border-[#B23A2E] hover:text-[#B23A2E]"
          >
            Log out
          </button>
        </div>

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