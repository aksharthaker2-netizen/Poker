// src/pages/Room.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import WaitingRoom from '../components/room/WaitingRoom';
import { useRoom } from '../hooks/useRoom';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { room, isHost, error, joinRoom, addBot, startGame } = useRoom(userId);

  // If the store doesn't already hold this room (e.g. page refresh, or
  // arriving via a shared link), rejoin it explicitly.
  useEffect(() => {
    if (!room || room.id !== roomId) {
      joinRoom(roomId, username).catch(() => {
        /* surfaced via error state below */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // GAME_STARTED (handled inside useRoom) flips room.status to PLAYING —
  // move everyone into the actual table view when that happens.
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      navigate(`/game/${roomId}`);
    }
  }, [room?.status, roomId, navigate]);

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#8B9A94]">
        You need to be logged in to play.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0F10] text-[#EDEAE3]">
        <p className="text-[#B23A2E]">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="rounded border border-[#22302B] px-4 py-2 text-sm hover:border-[#D4AF37]"
        >
          Back to lobby
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F10] text-[#8B9A94]">
        Joining room…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-16">
      <WaitingRoom
        room={room}
        isHost={isHost}
        onAddBot={() => addBot(roomId)}
        onStartGame={() => startGame(roomId)}
      />
    </div>
  );
}