// src/pages/RoomHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsApi } from '../services/api';

const STATUS_COLOR = {
  WAITING: 'text-[#8B9A94]',
  ACTIVE: 'text-[#4CAF50]',
  ENDED: 'text-[#5A6B64]',
  CANCELLED: 'text-[#B23A2E]'
};

export default function RoomHistory() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    roomsApi
      .listMine()
      .then(({ data }) => setRooms(data.rooms))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load rooms'));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F10] px-4 py-10 text-[#EDEAE3]">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Rooms you've hosted</h1>
          <button
            onClick={() => navigate('/')}
            className="rounded border border-[#22302B] px-3 py-1.5 text-sm hover:border-[#D4AF37]"
          >
            Back to lobby
          </button>
        </div>

        {error && <p className="text-sm text-[#B23A2E]">{error}</p>}

        {rooms.length === 0 && !error && (
          <p className="text-sm text-[#5A6B64]">You haven't hosted any rooms yet.</p>
        )}

        <ul className="flex flex-col overflow-hidden rounded-lg border border-[#22302B]">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="flex items-center justify-between border-b border-[#22302B] bg-[#0F1513] px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-mono text-[#D4AF37]">{room.code}</p>
                <p className="text-xs text-[#8B9A94]">
                  {room.maxPlayers}-max · BB {room.bigBlind} ·{' '}
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${STATUS_COLOR[room.status] || 'text-[#8B9A94]'}`}>
                  {room.status}
                </p>
                <p className="text-xs text-[#5A6B64]">
                  {room._count.games} game{room._count.games === 1 ? '' : 's'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
