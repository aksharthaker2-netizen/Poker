// src/components/ui/Avatar.jsx

const SIZE_MAP = {
  xs:  { outer: 'h-6 w-6',   text: 'text-[10px]', dot: 'h-2 w-2',   ring: 'ring-[1.5px]' },
  sm:  { outer: 'h-8 w-8',   text: 'text-xs',     dot: 'h-2.5 w-2.5', ring: 'ring-2' },
  md:  { outer: 'h-10 w-10', text: 'text-sm',     dot: 'h-3 w-3',   ring: 'ring-2' },
  lg:  { outer: 'h-12 w-12', text: 'text-base',   dot: 'h-3.5 w-3.5', ring: 'ring-2' },
  xl:  { outer: 'h-16 w-16', text: 'text-xl',     dot: 'h-4 w-4',   ring: 'ring-[3px]' },
  '2xl': { outer: 'h-20 w-20', text: 'text-2xl',  dot: 'h-5 w-5',   ring: 'ring-[3px]' },
};

/**
 * Reusable Avatar with online status dot, bot indicator, size variants.
 */
export default function Avatar({
  username,
  size = 'md',
  online,
  isBot = false,
  className = '',
}) {
  const s = SIZE_MAP[size] || SIZE_MAP.md;
  const initial = (username || '?').charAt(0).toUpperCase();

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`${s.outer} ${s.text} flex items-center justify-center rounded-full font-bold text-gold`}
        style={{
          background: isBot ? 'rgba(46,158,107,0.15)' : 'rgba(212,175,55,0.15)',
          border: `1px solid ${isBot ? 'rgba(46,158,107,0.3)' : 'rgba(212,175,55,0.25)'}`,
        }}
      >
        {isBot ? '🤖' : initial}
      </span>

      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${s.dot} rounded-full ${s.ring} ring-[#0B0F10]`}
          style={{
            background: online ? '#2E9E6B' : '#4A5C54',
            boxShadow: online ? '0 0 6px rgba(46,158,107,0.7)' : 'none',
            animation: online ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
          }}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}
