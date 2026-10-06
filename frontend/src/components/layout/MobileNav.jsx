// src/components/layout/MobileNav.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, History, User, Medal, Bot } from 'lucide-react';

const MOBILE_LINKS = [
  { to: '/',             label: 'Home',    icon: LayoutDashboard, end: true },
  { to: '/friends',      label: 'Friends', icon: Users },
  { to: '/leaderboard',  label: 'Ranks',   icon: Trophy },
  { to: '/achievements', label: 'Awards',  icon: Medal },
  { to: '/games',        label: 'History', icon: History },
  { to: '/profile',      label: 'Profile', icon: User },
];

export default function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-stretch border-t border-border/60 md:hidden"
      style={{ background: 'rgba(11,15,16,0.97)', backdropFilter: 'blur(20px)', height: 60 }}
    >
      {MOBILE_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 pt-1 text-[10px] font-medium transition ${
                isActive ? 'text-gold' : 'text-text-faint hover:text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={`transition-transform ${isActive ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
