// src/components/ui/StatCard.jsx
import { motion } from 'framer-motion';

/**
 * Reusable stat card with icon, value, label, optional trend indicator.
 * Used on Dashboard, Profile, Leaderboard, etc.
 */
export default function StatCard({
  icon,
  value,
  label,
  trend,           // '+12%' | '-5%' | null
  trendUp,         // boolean: green if true, red if false
  colour = '#D4AF37',
  mono = true,     // use monospace font for value
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: { card: 'px-3 py-2.5', value: 'text-base', label: 'text-[9px]', icon: 'text-lg' },
    md: { card: 'px-4 py-4',   value: 'text-xl',   label: 'text-[10px]', icon: 'text-2xl' },
    lg: { card: 'px-5 py-5',   value: 'text-2xl',  label: 'text-xs',    icon: 'text-3xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex flex-col items-center gap-1.5 rounded-2xl transition-all ${s.card} ${className}`}
      style={{
        background: 'rgba(15,21,19,0.8)',
        border: '1px solid #22302B',
        backdropFilter: 'blur(8px)',
      }}
    >
      {icon && <span className={`${s.icon} leading-none`}>{icon}</span>}
      <span
        className={`${mono ? 'font-mono' : 'font-display'} ${s.value} font-semibold leading-none`}
        style={{ color }}
      >
        {value ?? '—'}
      </span>
      <span className={`${s.label} uppercase tracking-widest text-text-faint`}>{label}</span>
      {trend && (
        <span
          className="text-[10px] font-medium"
          style={{ color: trendUp ? '#2E9E6B' : '#B23A2E' }}
        >
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </motion.div>
  );
}
