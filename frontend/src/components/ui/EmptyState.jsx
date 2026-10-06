// src/components/ui/EmptyState.jsx

/**
 * Standardized empty state component.
 * Used throughout the app for empty lists, no data, etc.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,       // { label, onClick } optional CTA button
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl py-16 text-center px-8 ${className}`}
      style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
    >
      {icon && (
        <span className="text-5xl opacity-25 select-none">{icon}</span>
      )}
      {title && (
        <p className="font-medium text-text-muted">{title}</p>
      )}
      {description && (
        <p className="max-w-xs text-sm text-text-faint">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
