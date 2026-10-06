// src/components/ui/Badge.jsx

const VARIANT_STYLES = {
  win:        { bg: 'rgba(46,158,107,0.15)',  border: 'rgba(46,158,107,0.3)',  color: '#2E9E6B' },
  loss:       { bg: 'rgba(178,58,46,0.12)',   border: 'rgba(178,58,46,0.3)',   color: '#B23A2E' },
  gold:       { bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.25)', color: '#D4AF37' },
  online:     { bg: 'rgba(46,158,107,0.12)',  border: 'rgba(46,158,107,0.2)',  color: '#2E9E6B' },
  offline:    { bg: 'rgba(74,92,84,0.2)',     border: 'rgba(74,92,84,0.3)',    color: '#4A5C54' },
  info:       { bg: 'rgba(74,144,226,0.12)',  border: 'rgba(74,144,226,0.25)', color: '#4A90E2' },
  neutral:    { bg: 'rgba(34,48,43,0.6)',     border: '#22302B',               color: '#8B9A94' },
  legendary:  { bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.3)',  color: '#D4AF37' },
  epic:       { bg: 'rgba(155,89,182,0.12)',  border: 'rgba(155,89,182,0.3)',  color: '#9B59B6' },
  rare:       { bg: 'rgba(74,144,226,0.12)',  border: 'rgba(74,144,226,0.25)', color: '#4A90E2' },
  uncommon:   { bg: 'rgba(46,158,107,0.12)',  border: 'rgba(46,158,107,0.2)',  color: '#2E9E6B' },
  common:     { bg: 'rgba(139,154,148,0.12)', border: 'rgba(139,154,148,0.2)', color: '#8B9A94' },
  bot:        { bg: 'rgba(46,158,107,0.12)',  border: 'rgba(46,158,107,0.2)',  color: '#2E9E6B' },
  host:       { bg: 'rgba(212,175,55,0.12)',  border: 'rgba(212,175,55,0.25)', color: '#D4AF37' },
};

/**
 * Badge / chip component. Variants map to semantic colors.
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral;
  return (
    <span
      className={`chip ${className}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {children}
    </span>
  );
}
