// src/components/ui/SkeletonLoader.jsx

/**
 * Shimmer skeleton loader.
 * Use for loading states on cards, rows, tables.
 */
function SkeletonBox({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'linear-gradient(90deg, #141C1A 25%, #1A2420 50%, #141C1A 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
    >
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-10 w-10 rounded-xl flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <SkeletonBox className="h-3.5 w-1/2" />
          <SkeletonBox className="h-2.5 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonBox key={i} className="h-2.5 w-full" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/50 last:border-b-0">
      <SkeletonBox className="h-8 w-8 rounded-full flex-shrink-0" />
      <SkeletonBox className="h-3 w-32" />
      <div className="flex-1" />
      <SkeletonBox className="h-3 w-16" />
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonBox;
