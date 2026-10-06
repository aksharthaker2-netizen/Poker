// src/components/ui/Tabs.jsx
import { motion } from 'framer-motion';

/**
 * Animated tab switcher using Framer Motion layoutId for the indicator.
 */
export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div
      className={`flex gap-1 rounded-xl p-1 ${className}`}
      style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
    >
      {tabs.map((tab) => {
        const isActive = (tab.key ?? tab) === active;
        const label = tab.label ?? tab;
        const key = tab.key ?? tab;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200"
            style={{ color: isActive ? '#0B1A10' : '#8B9A94' }}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background: '#D4AF37', boxShadow: '0 2px 12px rgba(212,175,55,0.3)' }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {tab.icon && <span>{tab.icon}</span>}
              {label}
              {tab.badge != null && (
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{
                    background: isActive ? 'rgba(11,26,16,0.3)' : 'rgba(212,175,55,0.15)',
                    color: isActive ? '#0B1A10' : '#D4AF37',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
