// src/components/layout/UserWidget.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star, Zap, TrendingUp } from 'lucide-react';
import Avatar from '../ui/Avatar';

/**
 * Persistent user widget shown at the bottom of the sidebar.
 * Shows avatar, username, online status, and key stats.
 */
export default function UserWidget({ collapsed }) {
  const username = localStorage.getItem('username') || 'Player';

  return (
    <div
      className="shrink-0 border-t p-3"
      style={{ borderColor: '#1D2B26', background: 'rgba(9,13,11,0.7)' }}
    >
      <AnimatePresence initial={false} mode="wait">
        {collapsed ? (
          /* Collapsed: just avatar */
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center"
          >
            <Avatar username={username} size="md" online={true} />
          </motion.div>
        ) : (
          /* Expanded: full widget */
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(15,21,19,0.65)', border: '1px solid rgba(34,48,43,0.6)' }}
          >
            {/* Identity row */}
            <div className="flex items-center gap-2.5 mb-3">
              <Avatar username={username} size="md" online={true} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#EDEAE3' }}>{username}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="dot-online h-1.5 w-1.5 rounded-full inline-block" />
                  <span className="text-[10px] font-medium" style={{ color: '#2E9E6B' }}>Online</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { icon: <Coins size={9} />,       label: 'Bankroll', value: '—', colour: '#D4AF37' },
                { icon: <Star size={9} />,         label: 'Rating',   value: '—', colour: '#D4AF37' },
                { icon: <Zap size={9} />,          label: 'Level',    value: '—', colour: '#C97F3A' },
                { icon: <TrendingUp size={9} />,   label: 'Streak',   value: '—', colour: '#2E9E6B' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg px-2 py-1.5 flex flex-col gap-0.5"
                  style={{ background: 'rgba(11,15,16,0.6)', border: '1px solid rgba(29,43,38,0.5)' }}
                >
                  <div className="flex items-center gap-1" style={{ color: '#4A5C54' }}>
                    {s.icon}
                    <span className="text-[9px] uppercase tracking-wider">{s.label}</span>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: s.colour }}>{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
