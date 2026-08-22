// src/pages/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import { useRoom } from '../hooks/useRoom';

/**
 * NOTE: backend's socketAuthMiddleware requires a valid JWT before the
 * socket connection is even accepted — so this page assumes login already
 * happened and `accessToken` / `userId` / `username` are in localStorage.
 * There's no Login page in this batch yet (authController.js is still a
 * stub) — wire that up next and redirect here on success.
 */
export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { createRoom, joinRoom, error } = useRoom(userId);
  const [loading, setLoading] = useState(false);

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#EDEAE3]">
        <p className="text-sm text-[#8B9A94]">
          You need to be logged in to play. (Login page not built yet in this batch.)
        </p>
      </div>
    );
  }

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
        <h1 className="mb-1 text-3xl font-semibold">PokerAI</h1>
        <p className="mb-8 text-sm text-[#8B9A94]">Playing as {username}</p>

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