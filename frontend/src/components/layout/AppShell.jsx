// src/components/layout/AppShell.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { authApi, clearSession } from '../../services/api';
import { disconnectSocket } from '../../services/socket';

const NAV_LINKS = [
  { to: '/', label: 'Play', end: true },
  { to: '/friends', label: 'Friends' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/games', label: 'History' },
  { to: '/rooms', label: 'Rooms' }
];

/**
 * Persistent chrome for every authenticated page EXCEPT Game.jsx (the
 * poker table) — the table view stays full-bleed/immersive on purpose,
 * with just its own minimal Leave-table button, rather than competing
 * with a nav bar while cards are on the felt.
 */
export default function AppShell({ children }) {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // best-effort — proceed with local logout regardless
    }
    disconnectSocket();
    clearSession();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-ink text-text">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-text transition hover:text-gold"
          >
            <span className="text-gold">♠</span> PokerAI
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-gold/10 text-gold'
                      : 'text-text-muted hover:bg-panel2 hover:text-text'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `hidden rounded-md px-3 py-1.5 text-sm font-medium transition sm:block ${
                  isActive ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-panel2 hover:text-text'
                }`
              }
            >
              {username || 'Profile'}
            </NavLink>
            <button
              onClick={handleLogout}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-text-muted transition hover:border-danger hover:text-danger"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Mobile nav row — the six links wrap under the header bar on
            narrow screens instead of squeezing into the top row. */}
        <nav className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isActive ? 'bg-gold/10 text-gold' : 'text-text-muted hover:bg-panel2 hover:text-text'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
