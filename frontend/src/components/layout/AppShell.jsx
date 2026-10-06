// src/components/layout/AppShell.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi, clearSession } from '../../services/api';
import { disconnectSocket } from '../../services/socket';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Topbar from './Topbar';

/**
 * Persistent chrome for every authenticated page EXCEPT Game.jsx.
 *
 * Desktop: collapsible left sidebar (240px expanded / 64px collapsed) + main content
 * Mobile:  full-width content + bottom tab bar (sidebar hidden)
 *
 * The poker table (Game.jsx) stays full-bleed/immersive — it bypasses AppShell entirely
 * and uses its own .game-layout grid.
 */
export default function AppShell({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* best-effort */ }
    disconnectSocket();
    clearSession();
    navigate('/login');
  };

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="flex min-h-screen" style={{ background: '#0B0F10', color: '#EDEAE3' }}>
      {/* ── Desktop Sidebar ──────────────────────────────────────── */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      </div>

      {/* ── Mobile Sidebar Drawer (overlay) ──────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed left-0 top-0 z-50 h-full md:hidden"
            >
              <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content area ─────────────────────────────────────── */}
      <motion.div
        animate={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? sidebarW : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        className="flex min-h-screen flex-1 flex-col"
        style={{ minWidth: 0 }}
      >
        {/* Topbar */}
        <Topbar
          onMobileMenuToggle={() => setMobileMenuOpen((v) => !v)}
          mobileMenuOpen={mobileMenuOpen}
        />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-8 mx-auto w-full" style={{ maxWidth: 1200 }}>
          {children}
        </main>
      </motion.div>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      <MobileNav />
    </div>
  );
}
