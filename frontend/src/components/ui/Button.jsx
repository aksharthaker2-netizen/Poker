// src/components/ui/Button.jsx
import { motion } from 'framer-motion';

/**
 * Reusable Button component with Framer Motion tap feedback.
 * Variants: primary (gold), secondary (outline), ghost, danger, success
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) {
  const base = `
    inline-flex items-center justify-center gap-2 font-semibold rounded-xl
    transition-all duration-150 cursor-pointer select-none
    disabled:cursor-not-allowed disabled:opacity-50
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50
    ${fullWidth ? 'w-full' : ''}
  `;

  const sizes = {
    sm:  'h-8 px-3.5 text-xs',
    md:  'h-10 px-4 text-sm',
    lg:  'h-11 px-5 text-sm',
    xl:  'h-12 px-6 text-base',
  };

  const variants = {
    primary: 'bg-gold text-ink hover:brightness-110 shadow-sm hover:shadow-gold-sm active:scale-[0.98]',
    secondary: 'border border-border text-text-muted hover:border-gold/50 hover:text-text hover:bg-panel2',
    ghost: 'text-text-muted hover:text-text hover:bg-panel2',
    danger: 'border border-border text-text-muted hover:border-danger hover:text-danger hover:bg-danger/5',
    success: 'bg-success text-white hover:brightness-110',
  };

  return (
    <motion.button
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          <span>Loading…</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
