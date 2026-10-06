// src/components/layout/Topbar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';

const PAGE_TITLES = {
  '/':             'Dashboard',
  '/coach':        'AI Coach',
  '/friends':      'Friends',
  '/leaderboard':  'Leaderboard',
  '/achievements': 'Achievements',
  '/games':        'Game History',
  '/rooms':        'Room History',
  '/profile':      'Profile',
};

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'friend',      text: 'Rahul sent you a friend request',  time: '2m ago',  read: false },
  { id: 2, type: 'achievement', text: 'Achievement unlocked: First Win!', time: '1h ago',  read: false },
  { id: 3, type: 'game',        text: 'Your game review is ready',        time: '3h ago',  read: true  },
];

export default function Topbar({ onMobileMenuToggle, mobileMenuOpen }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const username  = localStorage.getItem('username') || 'Player';
  const [notifOpen, setNotifOpen] = useState(false);
  const [connected] = useState(true);

  const title  = PAGE_TITLES[location.pathname] || 'PokerAI';
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-4 px-4 md:px-6"
      style={{
        background: 'rgba(11,15,16,0.94)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(29,43,38,0.7)',
        height: 56,
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="rounded-lg p-1.5 transition md:hidden"
        style={{ color: '#5A6B64' }}
        onMouseEnter={(e) => { e.currentTarget.style.color='#EDEAE3'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color='#5A6B64'; }}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm font-semibold truncate" style={{ color: '#EDEAE3' }}>{title}</h1>
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          style={{
            background: connected ? 'rgba(46,158,107,0.08)' : 'rgba(178,58,46,0.08)',
            border: `1px solid ${connected ? 'rgba(46,158,107,0.2)' : 'rgba(178,58,46,0.2)'}`,
            color: connected ? '#2E9E6B' : '#B23A2E',
          }}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 transition"
            style={{ color: '#5A6B64' }}
            onMouseEnter={(e) => { e.currentTarget.style.background='rgba(20,30,27,0.8)'; e.currentTarget.style.color='#EDEAE3'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#5A6B64'; }}
          >
            <Bell size={17} />
            {unread > 0 && (
              <span
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.7)' }}
              />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(13,18,16,0.99)',
                  border: '1px solid rgba(29,43,38,0.9)',
                  boxShadow: '0 20px 56px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(24px)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(29,43,38,0.7)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#EDEAE3' }}>Notifications</span>
                  {unread > 0 && (
                    <span
                      className="chip"
                      style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}
                    >
                      {unread} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 transition"
                      style={{
                        background: n.read ? 'transparent' : 'rgba(212,175,55,0.03)',
                        borderBottom: '1px solid rgba(29,43,38,0.4)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background='rgba(20,28,26,0.5)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background=n.read?'transparent':'rgba(212,175,55,0.03)'; }}
                    >
                      <div
                        className="h-2 w-2 mt-1.5 shrink-0 rounded-full"
                        style={{ background: n.read ? '#22302B' : '#D4AF37' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-snug" style={{ color: '#EDEAE3' }}>{n.text}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4A5C54' }}>{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(29,43,38,0.5)' }}>
                  <button className="text-xs transition" style={{ color: '#D4AF37' }}>
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile avatar */}
        <button
          onClick={() => navigate('/profile')}
          className="rounded-full transition"
          style={{ outline: 'none' }}
          onFocus={(e) => { e.currentTarget.style.boxShadow='0 0 0 2px rgba(212,175,55,0.4)'; }}
          onBlur={(e)  => { e.currentTarget.style.boxShadow='none'; }}
        >
          <Avatar username={username} size="sm" online={true} />
        </button>
      </div>
    </header>
  );
}
