// src/components/table/CommunityCards.jsx

const SUIT_SYMBOL = { Hearts: '♥', Diamonds: '♦', Clubs: '♣', Spades: '♠' };
const RED_SUITS = new Set(['Hearts', 'Diamonds']);

function Card({ card }) {
  if (!card) {
    return <div className="h-20 w-14 rounded-md border-2 border-dashed border-[#2C4A3D]" />;
  }
  const isRed = RED_SUITS.has(card.suit);
  return (
    <div className="flex h-20 w-14 flex-col items-center justify-center rounded-md border border-[#D8D3C4] bg-[#F5F1E8] shadow-md">
      <span className={`text-lg font-bold ${isRed ? 'text-[#B23A2E]' : 'text-[#1A1A1A]'}`}>
        {card.rank}
      </span>
      <span className={`text-lg leading-none ${isRed ? 'text-[#B23A2E]' : 'text-[#1A1A1A]'}`}>
        {SUIT_SYMBOL[card.suit]}
      </span>
    </div>
  );
}

export default function CommunityCards({ cards, potSize }) {
  const slots = [...cards, ...Array(5 - cards.length).fill(null)];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-2">
        {slots.map((card, i) => (
          <Card key={i} card={card} />
        ))}
      </div>
      <p className="font-mono text-sm text-[#D4AF37]">
        Pot: <span className="text-base font-semibold">{potSize}</span>
      </p>
    </div>
  );
}

export { Card };