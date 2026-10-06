// src/components/room/SeatList.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Bot, UserX, X } from 'lucide-react';

export default function SeatList({ seats, hostId, isHost, myUserId, onKickPlayer, onRemoveBot, onChangeSeat }) {
  const [busySeatId, setBusySeatId] = useState(null);
  const [movingTo, setMovingTo] = useState(null);

  const amSeated = seats.some((s) => s && s.id === myUserId);

  const handleRemove = async (seat) => {
    setBusySeatId(seat.id);
    try {
      if (seat.isBot) await onRemoveBot(seat.id);
      else await onKickPlayer(seat.id);
    } finally { setBusySeatId(null); }
  };

  const handleSit = async (index) => {
    setMovingTo(index);
    try { await onChangeSeat(index); }
    finally { setMovingTo(null); }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {seats.map((seat, index) => {
        const canRemove = isHost && seat && seat.id !== myUserId;
        const canSit = !seat && amSeated && Boolean(onChangeSeat);
        const isHost_ = seat?.id === hostId;
        const isMe = seat?.id === myUserId;

        if (canSit) {
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSit(index)}
              disabled={movingTo !== null}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-4 text-xs text-text-faint transition hover:border-gold/50 hover:text-gold disabled:opacity-50"
            >
              <span className="text-[10px] font-mono text-text-faint">#{index + 1}</span>
              {movingTo === index ? 'Moving…' : '+ Sit here'}
            </motion.button>
          );
        }

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.04 }}
            className="relative flex flex-col gap-2 rounded-xl border p-3 transition"
            style={{
              background: seat ? 'rgba(15,21,19,0.8)' : 'rgba(11,15,16,0.4)',
              border: `1px solid ${
                isMe ? 'rgba(212,175,55,0.4)' :
                seat?.isBot ? 'rgba(46,158,107,0.3)' :
                seat ? '#22302B' :
                'rgba(34,48,43,0.4)'
              }`,
            }}
          >
            {/* Seat number badge */}
            <span className="absolute top-2 left-2 text-[9px] font-mono font-semibold text-text-faint">
              #{index + 1}
            </span>

            {/* Remove button (host only) */}
            {canRemove && (
              <button
                onClick={() => handleRemove(seat)}
                disabled={busySeatId === seat.id}
                className="absolute top-2 right-2 rounded-md p-0.5 text-text-faint transition hover:text-danger disabled:opacity-50"
                title={seat.isBot ? 'Remove bot' : 'Kick player'}
              >
                <X size={12} />
              </button>
            )}

            {seat ? (
              <>
                {/* Avatar */}
                <div className="flex justify-center pt-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold relative"
                    style={{
                      background: seat.isBot ? 'rgba(46,158,107,0.15)' : 'rgba(212,175,55,0.12)',
                      border: `1px solid ${seat.isBot ? 'rgba(46,158,107,0.3)' : 'rgba(212,175,55,0.25)'}`,
                      color: seat.isBot ? '#2E9E6B' : '#D4AF37',
                    }}
                  >
                    {seat.isBot ? <Bot size={16} /> : (seat.username || '?').charAt(0).toUpperCase()}
                    {isHost_ && (
                      <Crown size={10} className="absolute -top-1 -right-1 text-gold" style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' }} />
                    )}
                  </div>
                </div>

                {/* Name */}
                <p className="text-center text-xs font-medium text-text truncate">
                  {seat.username}
                  {isMe && <span className="text-text-faint"> (you)</span>}
                </p>

                {/* Chips */}
                <p className="text-center font-mono text-[11px] text-text-muted">
                  {seat.chips?.toLocaleString()} chips
                </p>

                {/* Badges */}
                <div className="flex justify-center gap-1 flex-wrap">
                  {isHost_ && (
                    <span className="chip" style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontSize: 9 }}>
                      HOST
                    </span>
                  )}
                  {seat.isBot && (
                    <span className="chip" style={{ background: 'rgba(46,158,107,0.12)', border: '1px solid rgba(46,158,107,0.2)', color: '#2E9E6B', fontSize: 9 }}>
                      BOT
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-xs text-text-faint">
                <div className="h-9 w-9 rounded-full border border-dashed border-border/50 mb-2" />
                <span>Empty</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
