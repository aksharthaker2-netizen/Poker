// src/pages/RoomHistory.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DoorOpen, Users, Bot, Calendar, Hash, ArrowRight } from 'lucide-react';
import { roomsApi } from '../services/api';
import { SkeletonList } from '../components/ui/SkeletonLoader';
import EmptyState from '../components/ui/EmptyState';

export default function RoomHistory() {
  const navigate = useNavigate();
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await roomsApi.listMine();
      setRooms(data.rooms ?? []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load room history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hostedCount = rooms.filter((r) => r.wasHost).length;
  const totalGames  = rooms.reduce((acc, r) => acc + (r.gameCount ?? 0), 0);

  return (
    <div className="page-enter mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Room History</h1>
        <p className="mt-1 text-sm text-text-muted">{rooms.length} rooms visited</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rooms',    value: rooms.length, colour: '#8B9A94', icon: <DoorOpen size={16} /> },
          { label: 'Hosted',   value: hostedCount,  colour: '#D4AF37', icon: <Users size={16} /> },
          { label: 'Games',    value: totalGames,   colour: '#2E9E6B', icon: <Hash size={16} /> },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-2 rounded-2xl py-4"
            style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
          >
            <span style={{ color: s.colour }}>{s.icon}</span>
            <span className="font-mono text-xl font-semibold" style={{ color: s.colour }}>{s.value}</span>
            <span className="text-[10px] uppercase tracking-widest text-text-faint">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Rooms list */}
      {loading ? (
        <SkeletonList count={5} />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon="🚪"
          title="No room history"
          description="Rooms you create or join will appear here."
          action={{ label: 'Create a room', onClick: () => navigate('/') }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {rooms.map((room, i) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 2 }}
              className="rounded-2xl border border-border transition hover:border-gold/25"
              style={{ background: 'rgba(15,21,19,0.8)' }}
            >
              <div className="flex items-center gap-5 px-5 py-4">
                {/* Room code */}
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                  <DoorOpen size={18} className="text-gold" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-base font-bold tracking-wider text-text">
                      {(room.code || room.id || '').slice(0, 8).toUpperCase()}
                    </span>
                    {room.wasHost && (
                      <span
                        className="chip"
                        style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: 9 }}
                      >
                        HOSTED
                      </span>
                    )}
                    {room.status && (
                      <span
                        className="chip"
                        style={{
                          background: room.status === 'ACTIVE' ? 'rgba(46,158,107,0.12)' : 'rgba(74,92,84,0.15)',
                          border: `1px solid ${room.status === 'ACTIVE' ? 'rgba(46,158,107,0.25)' : '#22302B'}`,
                          color: room.status === 'ACTIVE' ? '#2E9E6B' : '#4A5C54',
                          fontSize: 9,
                        }}
                      >
                        {room.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-faint flex-wrap">
                    {room.playerCount != null && (
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {room.playerCount} players
                      </span>
                    )}
                    {room.botCount != null && room.botCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Bot size={11} /> {room.botCount} bots
                      </span>
                    )}
                    {room.gameCount != null && (
                      <span className="flex items-center gap-1">
                        <Hash size={11} /> {room.gameCount} games
                      </span>
                    )}
                    {room.closedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(room.closedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* View button */}
                <button
                  onClick={() => navigate(`/game/${room.lastGameId || room.id}/review`)}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-text-muted transition hover:border-gold/40 hover:text-gold"
                >
                  <span className="hidden sm:block">Review</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}