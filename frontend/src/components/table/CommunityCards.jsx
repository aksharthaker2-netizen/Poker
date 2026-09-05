// src/components/table/CommunityCards.jsx

const SUIT_SYMBOL = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const RED_SUITS = new Set(['Hearts', 'Diamonds']);

function Card({ card, size = 'md', dealDelay = 0 }) {
  const dims = size === 'sm' ? 'h-14 w-10 text-sm' : 'h-[4.5rem] w-12 sm:h-20 sm:w-14 text-base';

  if (!card) {
    return <div className={`${dims} rounded-lg border-2 border-dashed border-felt-dark/60`} />;
  }

  const isRed = RED_SUITS.has(card.suit);
  return (
    <div
      className={`flex ${dims} animate-deal-in flex-col items-center justify-center rounded-lg border border-black/10 bg-card shadow-card`}
      style={{ animationDelay: `${dealDelay}ms` }}
    >
      <span className={`font-semibold leading-none ${isRed ? 'text-danger' : 'text-[#1A1A1A]'}`}>
        {card.rank}
      </span>
      <span className={`leading-none ${isRed ? 'text-danger' : 'text-[#1A1A1A]'}`}>
        {SUIT_SYMBOL[card.suit]}
      </span>
    </div>
  );
}

export default function CommunityCards({ cards, potSize }) {
  const slots = [...cards, ...Array(5 - cards.length).fill(null)];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1.5 sm:gap-2">
        {slots.map((card, i) => (
          <Card key={i} card={card} dealDelay={i * 70} />
        ))}
      </div>

      <div className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-black/30 px-4 py-1.5 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-gold shadow-glow" />
        <span className="text-xs uppercase tracking-wide text-text-muted">Pot</span>
        <span className="font-mono text-sm font-semibold text-gold">{potSize}</span>
      </div>
    </div>
  );
}

export { Card };
