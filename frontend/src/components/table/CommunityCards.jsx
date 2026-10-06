// src/components/table/CommunityCards.jsx
import { motion, AnimatePresence } from 'framer-motion';

const SUIT_SYMBOL = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const RED_SUITS   = new Set(['Hearts', 'Diamonds']);

const STREET_LABELS = {
  PRE_FLOP: 'Pre-Flop',
  FLOP:     'Flop',
  TURN:     'Turn',
  RIVER:    'River',
  SHOWDOWN: 'Showdown',
  WAITING:  '',
};

export function Card({ card, size = 'md', dealDelay = 0 }) {
  const dims =
    size === 'sm'
      ? { card: 'h-14 w-10', rank: 'text-sm', suit: 'text-sm' }
      : size === 'xs'
      ? { card: 'h-10 w-7',  rank: 'text-xs', suit: 'text-xs' }
      : { card: 'h-[4.5rem] w-12 sm:h-20 sm:w-14', rank: 'text-base sm:text-lg', suit: 'text-base sm:text-lg' };

  if (!card) {
    return (
      <div
        className={`${dims.card} rounded-lg border-2 border-dashed`}
        style={{ borderColor: 'rgba(15,76,57,0.35)', background: 'rgba(15,76,57,0.05)' }}
      />
    );
  }

  const isRed = RED_SUITS.has(card.suit);
  return (
    <motion.div
      initial={{ opacity: 0, y: -22, rotate: -10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0,   rotate: 0,   scale: 1   }}
      transition={{ delay: dealDelay / 1000, type: 'spring', stiffness: 380, damping: 24 }}
      className={`playing-card ${dims.card}`}
    >
      {/* Top-left rank+suit */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className={`${dims.rank} font-black`} style={{ color: isRed ? '#C0453A' : '#1A1A1A' }}>
          {card.rank}
        </span>
        <span className={`${dims.suit} leading-none`} style={{ color: isRed ? '#C0453A' : '#1A1A1A', fontSize: '0.65em' }}>
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>
      {/* Centre suit */}
      <span
        className="text-lg sm:text-xl leading-none select-none"
        style={{ color: isRed ? '#C0453A' : '#1A1A1A' }}
      >
        {SUIT_SYMBOL[card.suit]}
      </span>
      {/* Bottom-right (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className={`${dims.rank} font-black`} style={{ color: isRed ? '#C0453A' : '#1A1A1A' }}>
          {card.rank}
        </span>
        <span className={`${dims.suit} leading-none`} style={{ color: isRed ? '#C0453A' : '#1A1A1A', fontSize: '0.65em' }}>
          {SUIT_SYMBOL[card.suit]}
        </span>
      </div>
    </motion.div>
  );
}

export default function CommunityCards({ cards, potSize, gameState }) {
  const slots      = [...(cards || []), ...Array(5 - (cards?.length || 0)).fill(null)];
  const streetLabel = STREET_LABELS[gameState] || '';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Street label */}
      <AnimatePresence mode="wait">
        {streetLabel && (
          <motion.span
            key={streetLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: '#4A5C54', letterSpacing: '0.2em' }}
          >
            {streetLabel}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Cards row */}
      <div className="flex gap-1.5 sm:gap-2">
        <AnimatePresence mode="popLayout">
          {slots.map((card, i) => (
            <Card
              key={card ? `${card.rank}-${card.suit}` : `empty-${i}`}
              card={card}
              dealDelay={i * 80}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pot display */}
      <motion.div
        layout
        className="pot-display flex items-center gap-2 px-4 py-1.5"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ background: '#D4AF37', boxShadow: '0 0 8px rgba(212,175,55,0.7)' }}
        />
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#8B9A94' }}>
          Pot
        </span>
        <span className="font-mono text-sm font-bold" style={{ color: '#D4AF37' }}>
          {potSize?.toLocaleString() ?? 0}
        </span>
      </motion.div>
    </div>
  );
}
