// src/components/ui/ProgressBar.jsx

/**
 * Reusable animated progress bar.
 * Used for XP, achievements, AI score, etc.
 */
export default function ProgressBar({
  value = 0,        // 0–100
  max = 100,
  colour = '#D4AF37',
  height = 6,       // px
  shimmer = false,
  label,
  showPercent = false,
  className = '',
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs text-text-faint">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className="progress-track w-full"
        style={{ height: `${height}px` }}
      >
        <div
          className={`progress-fill ${shimmer ? 'shimmer-gold' : ''}`}
          style={{
            width: `${pct}%`,
            background: shimmer
              ? undefined
              : `linear-gradient(90deg, ${colour}80, ${colour})`,
          }}
        />
      </div>
    </div>
  );
}
