// src/components/table/PlayerSeat.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from './CommunityCards';
import { Bot, WifiOff, Crown } from 'lucide-react';

function CardBack({ size = 'sm' }) {
  const dims =
    size === 'xs' ? 'h-10 w-7' :
    size === 'sm' ? 'h-14 w-10' :
    'h-[4.5rem] w-12 sm:h-20 sm:w-14';
  return (
    <div className={`card-back ${dims} rounded-lg relative overflow-hidden`}>
      <div className="card-back-pattern" />
    </div>
  );
}

function SeatAvatar({ username, isBot, isMe }) {
  const initial = (username || '?').charAt(0).toUpperCase();
  return (
    <div
      className="h-8 w-8 flex shrink-0 items-center justify-center rounded-full font-bold text-sm"
      style={{
        background: isBot
          ? 'rgba(46,158,107,0.18)'
          : isMe
          ? 'rgba(212,175,55,0.18)'
          : 'rgba(212,175,55,0.1)',
        border: `1.5px solid ${isBot ? 'rgba(46,158,107,0.45)' : isMe ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.25)'}`,
        color: isBot ? '#2E9E6B' : '#D4AF37',
        boxShadow: isMe ? '0 0 10px rgba(212,175,55,0.2)' : 'none',
      }}
    >
      {isBot ? <Bot size={13} /> : initial}
    </div>
  );
}

function BotThinkingDots() {
  return (
    <div className="flex flex-col items-center gap-1 py-0.5">
      <div className="flex gap-1">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.span
            key={delay}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: '#2E9E6B' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 0.9, delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-[9px] font-medium" style={{ color: '#2E9E6B' }}>thinking</span>
    </div>
  );
}

/**
 * Individual player seat around the poker table.
 * Supports: active/winner/folded/all-in/disconnected/bot-thinking states.
 */
export default function PlayerSeat({
  seatPlayer,
  seatMeta,
  isMe,
  myHoleCards,
  revealedCards,
  isActive,
  isWinner,
}) {
  /* Empty seat */
  if (!seatPlayer) {
    return (
      <div
        className="h-[5.5rem] w-24 rounded-xl border-2 border-dashed sm:w-28 flex items-center justify-center"
        style={{ borderColor: 'rgba(34,48,43,0.4)', background: 'rgba(11,15,16,0.3)' }}
      >
        <span className="text-[10px]" style={{ color: '#3A4D46' }}>Empty</span>
      </div>
    );
  }

  const folded       = seatPlayer.status === 'FOLDED';
  const allIn        = seatPlayer.status === 'ALL_IN';
  const disconnected = seatPlayer.status === 'DISCONNECTED';
  const isBot        = seatMeta?.isBot;
  const cardsToShow  = revealedCards || (isMe ? myHoleCards : null);

  /* Border/ring colour based on state */
  const borderColour = isWinner
    ? 'rgba(240,203,92,0.7)'
    : isActive
    ? 'rgba(212,175,55,0.7)'
    : allIn
    ? 'rgba(201,127,58,0.5)'
    : isMe
    ? 'rgba(212,175,55,0.3)'
    : 'rgba(34,48,43,0.7)';

  const bgColour = isWinner
    ? 'rgba(20,35,20,0.97)'
    : isActive
    ? 'rgba(20,35,28,0.95)'
    : isMe
    ? 'rgba(18,26,22,0.9)'
    : 'rgba(13,18,16,0.9)';

  return (
    <motion.div
      animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
      transition={isActive ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={`flex w-24 flex-col items-center gap-1.5 rounded-xl p-2.5 transition-all duration-300 sm:w-28 ${
        folded ? 'seat-folded' : ''
      } ${allIn && !folded ? 'seat-allin' : ''} ${isWinner ? 'seat-winner' : ''} ${isActive && !isWinner ? 'seat-active' : ''}`}
      style={{
        background: bgColour,
        border: `1px solid ${borderColour}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Cards */}
      <div className="flex gap-1">
        {isBot && isActive && !cardsToShow ? (
          <>
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}>
              <CardBack size="xs" />
            </motion.div>
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}>
              <CardBack size="xs" />
            </motion.div>
          </>
        ) : cardsToShow ? (
          cardsToShow.map((c, i) => <Card key={i} card={c} size="xs" dealDelay={i * 60} />)
        ) : (
          <>
            <CardBack size="xs" />
            <CardBack size="xs" />
          </>
        )}
      </div>

      {/* Player info row */}
      <div className="flex w-full items-center gap-1.5">
        <SeatAvatar username={seatMeta?.username} isBot={isBot} isMe={isMe} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold leading-tight" style={{ color: '#EDEAE3' }}>
            {seatMeta?.username || seatPlayer.id?.slice(0, 6)}
          </p>
          {isMe && (
            <p className="text-[9px] font-medium" style={{ color: '#5A6B64' }}>You</p>
          )}
        </div>
        {disconnected && <WifiOff size={9} className="shrink-0" style={{ color: '#B23A2E' }} />}
      </div>

      {/* Chip count */}
      <div className="flex w-full items-center justify-center gap-1">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: '#D4AF37', boxShadow: '0 0 5px rgba(212,175,55,0.55)' }}
        />
        <span className="font-mono text-[11px] font-semibold" style={{ color: '#8B9A94' }}>
          {seatPlayer.chips?.toLocaleString() ?? 0}
        </span>
      </div>

      {/* Status badges */}
      <AnimatePresence>
        {isBot && isActive && !folded && (
          <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BotThinkingDots />
          </motion.div>
        )}
        {folded && (
          <motion.span
            key="folded"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(178,58,46,0.15)', color: '#C0453A', border: '1px solid rgba(178,58,46,0.3)' }}
          >
            Folded
          </motion.span>
        )}
        {allIn && !folded && (
          <motion.span
            key="allin"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)' }}
          >
            All-in
          </motion.span>
        )}
        {isWinner && (
          <motion.div
            key="winner"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1"
          >
            <Crown size={10} style={{ color: '#F0CB5C' }} />
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color: '#F0CB5C' }}
            >
              Winner
            </span>
          </motion.div>
        )}
        {!folded && seatPlayer.chips === 0 && !allIn && !isWinner && (
          <motion.span
            key="busted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[9px] font-bold uppercase tracking-wider"
            style={{ color: '#B23A2E' }}
          >
            Busted
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
