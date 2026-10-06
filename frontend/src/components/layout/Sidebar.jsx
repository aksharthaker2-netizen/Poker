// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Gamepad2, Users, Trophy, Medal,
  History, DoorOpen, User, Bot, ChevronLeft, ChevronRight, Spade
} from 'lucide-react';
import UserWidget from './UserWidget';

const NAV_SECTIONS = [
  {
    label: 'Play',
    links: [
      { to: '/',      label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/coach', label: 'AI Coach',  icon: Bot },
    ],
  },
  {
    label: 'Social',
    links: [
      { to: '/friends',      label: 'Friends',      icon: Users  },
      { to: '/leaderboard',  label: 'Leaderboard',  icon: Trophy },
      { to: '/achievements', label: 'Achievements', icon: Medal  },
    ],
  },
  {
    label: 'History',
    links: [
      { to: '/games', label: 'Game History', icon: History  },
      { to: '/rooms', label: 'Room History', icon: DoorOpen },
    ],
  },
  {
    label: 'Account',
    links: [
      { to: '/profile', label: 'Profile', icon: User },
    ],
  },
];

function NavItem({ link, collapsed }) {
  const Icon = link.icon;
  return (
    <NavLink
      to={link.to}
      end={link.end}
      title={collapsed ? link.label : undefined}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            className="shrink-0"
            style={{ color: isActive ? '#D4AF37' : 'inherit' }}
          />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                {link.label}
              </motion.span>
            )}
          </AnimatePresence>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 380, damping: 35 }}
      className="fixed left-0 top-0 z-30 flex h-screen flex-col overflow-hidden"
      style={{
        background: '#0D1210',
        borderRight: '1px solid #1D2B26',
        minWidth: collapsed ? 64 : 240,
        boxShadow: '2px 0 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* ── Logo row ────────────────────────────────────────────── */}
      <div
        className={`flex items-center border-b px-4 py-4 ${collapsed ? 'justify-center' : 'justify-between'}`}
        style={{ borderColor: '#1D2B26', minHeight: 60 }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)' }}
          >
            <Spade size={15} style={{ color: '#D4AF37' }} />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap font-display text-lg font-semibold"
                style={{ color: '#EDEAE3' }}
              >
                PokerAI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 transition"
            style={{ color: '#4A5C54' }}
            onMouseEnter={(e) => { e.currentTarget.style.background='rgba(20,30,27,0.9)'; e.currentTarget.style.color='#8B9A94'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#4A5C54'; }}
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* ── Collapsed toggle ────────────────────────────────────── */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-lg transition"
          style={{ color: '#4A5C54' }}
          onMouseEnter={(e) => { e.currentTarget.style.background='rgba(20,30,27,0.9)'; e.currentTarget.style.color='#8B9A94'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#4A5C54'; }}
          title="Expand sidebar"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {/* ── Nav sections ────────────────────────────────────────── */}
      <nav className={`flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-3 ${collapsed ? 'px-2 pt-2' : 'px-3 pt-1'}`}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {/* Section label — only show when expanded */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key={`header-${section.label}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="section-header"
                >
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-col gap-0.5">
              {section.links.map((link) => (
                <NavItem key={link.to} link={link} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User widget ─────────────────────────────────────────── */}
      <UserWidget collapsed={collapsed} />
    </motion.aside>
  );
}
