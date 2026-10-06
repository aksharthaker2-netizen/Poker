// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Hash, Bot, Users, Trophy, TrendingUp,
  Coins, Zap, Star, Target, ChevronRight, Eye
} from 'lucide-react';
import CreateRoomForm from '../components/lobby/CreateRoomForm';
import JoinRoomForm from '../components/lobby/JoinRoomForm';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';
import Avatar from '../components/ui/Avatar';

/* ── Mock data for UI preview (replace with backend data) ─────────────────── */
const MOCK_FRIENDS = [
  { id: '1', username: 'Rahul',  online: true,  rating: 1520 },
  { id: '2', username: 'Alex',   online: true,  rating: 1380 },
  { id: '3', username: 'Priya',  online: false, rating: 1290 },
  { id: '4', username: 'Sam',    online: true,  rating: 1640 },
];

const MOCK_RECENT_GAMES = [
  { id: 'g1', code: 'A7K9P2', result: 'win',  chips: +420,  players: 6, date: '2h ago',   rating: '+12' },
  { id: 'g2', code: 'B3M2Q1', result: 'loss', chips: -180,  players: 4, date: '5h ago',   rating: '-6'  },
  { id: 'g3', code: 'R8X5L0', result: 'win',  chips: +850,  players: 8, date: 'Yesterday', rating: '+18' },
  { id: 'g4', code: 'T2N7K4', result: 'loss', chips: -320,  players: 5, date: '2d ago',   rating: '-8'  },
];

const MOCK_TOP_PLAYERS = [
  { rank: 1, username: 'ChipMaster99', rating: 2340, wins: 184 },
  { rank: 2, username: 'Ace_Divy',     rating: 2180, wins: 157 },
  { rank: 3, username: 'PokerKing',    rating: 2040, wins: 142 },
  { rank: 4, username: 'BluffQueen',   rating: 1960, wins: 128 },
  { rank: 5, username: 'AllInAnna',    rating: 1880, wins: 115 },
];

const MOCK_ACHIEVEMENTS = [
  { id: 'a1', icon: '🏆', title: 'First Victory', desc: 'Won first hand', rarity: 'Common' },
  { id: 'a2', icon: '🃏', title: 'First Hand',    desc: 'Played first hand', rarity: 'Common' },
];

function InviteToast({ invite, onJoin, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto mb-6 flex max-w-lg items-center justify-between gap-4 rounded-2xl px-5 py-4"
      style={{
        background: 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.3)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(212,175,55,0.1)'
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.15)' }}
        >
          🃏
        </div>
        <div>
          <p className="text-sm font-medium text-text">
            <span className="text-gold">{invite.senderName}</span> invited you to a game
          </p>
          <p className="text-xs text-text-faint">Room #{invite.roomId?.slice(-6)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onJoin}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-110"
          style={{ background: '#D4AF37' }}
        >
          Join
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted transition hover:border-danger hover:text-danger"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const userId   = localStorage.getItem('userId');
  const username = localStorage.getItem('username') || '';

  const { createRoom, joinRoom, error } = useRoom(userId);
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState(null);
  const [notice, setNotice] = useState(location.state?.notice || null);
  const [activeSection, setActiveSection] = useState('create'); // 'create' | 'join'

  useEffect(() => {
    if (!socket) return;
    const onInvite = (payload) => setInvite(payload);
    socket.on('RECEIVE_GAME_INVITE', onInvite);
    return () => socket.off('RECEIVE_GAME_INVITE', onInvite);
  }, [socket]);

  const handleCreate = async (settings, requestedSeat) => {
    setLoading(true);
    try {
      const room = await createRoom(username, settings, requestedSeat);
      navigate(`/room/${room.id}`);
    } catch { /* error surfaced via useRoom */ }
    finally { setLoading(false); }
  };

  const handleJoin = async (roomCode) => {
    setLoading(true);
    try {
      const room = await joinRoom(roomCode, username);
      navigate(`/room/${room.id}`);
    } catch { /* error surfaced via useRoom */ }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 max-w-5xl"
    >
      {/* ── Toast notifications ───────────────────────────────── */}
      {invite && (
        <InviteToast
          invite={invite}
          onJoin={() => navigate(`/room/${invite.roomId}`)}
          onDismiss={() => setInvite(null)}
        />
      )}
      {notice && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm text-text-muted"
          style={{ background: 'rgba(20,28,26,0.8)', border: '1px solid #22302B' }}
        >
          <span className="flex items-center gap-2"><span>ℹ️</span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-text-faint hover:text-text">✕</button>
        </motion.div>
      )}
      {error && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(178,58,46,0.1)', border: '1px solid rgba(178,58,46,0.3)', color: '#C0453A' }}
        >
          <span>⚠</span> {error}
        </motion.div>
      )}

      {/* ── Hero Section ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-text-faint mb-1">Welcome back,</p>
          <h1 className="font-display text-4xl font-semibold text-text sm:text-5xl">
            <span className="text-gold-gradient">{username}</span>
          </h1>
          <p className="mt-2 text-base text-text-muted">Ready for your next hand?</p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            { icon: <Coins size={14} />,       label: 'Bankroll',  value: '—',   colour: '#D4AF37' },
            { icon: <Star size={14} />,         label: 'Rating',    value: '—',   colour: '#D4AF37' },
            { icon: <TrendingUp size={14} />,   label: 'Win Rate',  value: '—',   colour: '#2E9E6B' },
            { icon: <Target size={14} />,        label: 'Games',     value: '—',   colour: '#8B9A94' },
            { icon: <Zap size={14} />,          label: 'Level',     value: '—',   colour: '#D4AF37' },
            { icon: <Trophy size={14} />,        label: 'Streak',    value: '—',   colour: '#C97F3A' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              whileHover={{ scale: 1.03, y: -1 }}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center"
              style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
            >
              <span style={{ color: s.colour }}>{s.icon}</span>
              <span className="font-mono text-sm font-semibold" style={{ color: s.colour }}>{s.value}</span>
              <span className="text-[9px] uppercase tracking-widest text-text-faint">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Play CTAs ───────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-3">Quick Play</h2>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'create', label: 'Create Room', icon: <Plus size={14} /> },
            { key: 'join',   label: 'Join Room',   icon: <Hash size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                background: activeSection === tab.key ? 'rgba(212,175,55,0.12)' : 'transparent',
                border: `1px solid ${activeSection === tab.key ? 'rgba(212,175,55,0.4)' : '#22302B'}`,
                color: activeSection === tab.key ? '#D4AF37' : '#8B9A94',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => handleCreate({ maxPlayers: 2, bigBlind: 20, startingChips: 1000 }, 0)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-border text-text-muted transition hover:border-success/40 hover:text-success"
          >
            <Bot size={14} />
            Play vs AI
          </button>
        </div>

        {/* Form area */}
        <div className="grid gap-4 sm:grid-cols-2">
          {activeSection === 'create' ? (
            <CreateRoomForm username={username} onCreate={handleCreate} loading={loading} />
          ) : (
            <JoinRoomForm username={username} onJoin={handleJoin} loading={loading} />
          )}

          {/* Info card */}
          <div
            className="flex flex-col gap-4 rounded-2xl p-6"
            style={{ background: 'rgba(15,21,19,0.6)', border: '1px solid #22302B' }}
          >
            <h3 className="text-sm font-semibold text-text">How to play</h3>
            <div className="flex flex-col gap-3">
              {[
                { icon: '1', text: 'Create a private room or join with a code' },
                { icon: '2', text: 'Invite friends or add AI bots (2–10 players)' },
                { icon: '3', text: 'Play Texas Hold\'em in real-time' },
                { icon: '4', text: 'Get AI coaching after each game' },
              ].map((step) => (
                <div key={step.icon} className="flex items-start gap-3">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-ink"
                    style={{ background: '#D4AF37' }}
                  >
                    {step.icon}
                  </div>
                  <p className="text-sm text-text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Friends Online ────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-faint">
            Friends Online
            <span className="ml-2 font-mono text-success">{MOCK_FRIENDS.filter(f => f.online).length}</span>
          </h2>
          <button
            onClick={() => navigate('/friends')}
            className="flex items-center gap-1 text-xs text-text-faint hover:text-gold transition"
          >
            All friends <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          {MOCK_FRIENDS.map((friend) => (
            <motion.div
              key={friend.id}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 transition"
              style={{ background: 'rgba(15,21,19,0.75)' }}
            >
              <Avatar username={friend.username} size="sm" online={friend.online} />
              <div>
                <p className="text-xs font-medium text-text">{friend.username}</p>
                <p className="text-[10px]" style={{ color: friend.online ? '#2E9E6B' : '#4A5C54' }}>
                  {friend.online ? '● Online' : '○ Offline'}
                </p>
              </div>
              {friend.online && (
                <button
                  className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold text-text-muted transition hover:border-gold/50 hover:text-gold ml-1"
                >
                  Invite
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Games ──────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-faint">Recent Games</h2>
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1 text-xs text-text-faint hover:text-gold transition"
          >
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_RECENT_GAMES.map((game) => (
            <motion.div
              key={game.id}
              whileHover={{ x: 2 }}
              className="flex items-center gap-4 rounded-xl border border-border px-4 py-3 transition hover:border-gold/30"
              style={{ background: 'rgba(15,21,19,0.75)' }}
            >
              {/* Result indicator */}
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: game.result === 'win' ? '#2E9E6B' : '#B23A2E', boxShadow: `0 0 8px ${game.result === 'win' ? 'rgba(46,158,107,0.5)' : 'rgba(178,58,46,0.5)'}` }}
              />
              {/* Room code */}
              <span className="font-mono text-sm font-semibold text-text">{game.code}</span>
              {/* Players */}
              <div className="flex items-center gap-1 text-xs text-text-faint">
                <Users size={11} />
                <span>{game.players}</span>
              </div>
              {/* Date */}
              <span className="text-xs text-text-faint ml-auto">{game.date}</span>
              {/* Chips */}
              <span
                className="font-mono text-sm font-semibold w-16 text-right"
                style={{ color: game.chips > 0 ? '#2E9E6B' : '#B23A2E' }}
              >
                {game.chips > 0 ? '+' : ''}{game.chips}
              </span>
              {/* Rating */}
              <span
                className="font-mono text-xs w-10 text-right hidden sm:block"
                style={{ color: game.rating.startsWith('+') ? '#2E9E6B' : '#B23A2E' }}
              >
                {game.rating}
              </span>
              {/* Review button */}
              <button className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text-faint transition hover:border-gold/40 hover:text-gold">
                <Eye size={11} />
                <span className="hidden sm:block">Review</span>
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Bottom grid: Leaderboard + Achievements ───────────── */}
      <motion.div variants={itemVariants} className="grid gap-5 lg:grid-cols-2">
        {/* Leaderboard preview */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
        >
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Top Players</h2>
            <button
              onClick={() => navigate('/leaderboard')}
              className="flex items-center gap-1 text-xs text-text-faint hover:text-gold transition"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div>
            {MOCK_TOP_PLAYERS.map((p, i) => (
              <div
                key={p.rank}
                className="flex items-center gap-3 border-b border-border/30 px-5 py-3 last:border-b-0 transition hover:bg-panel2"
              >
                <span
                  className="w-5 font-mono text-sm font-bold text-center"
                  style={{
                    color: i === 0 ? '#D4AF37' : i === 1 ? '#A8B2B0' : i === 2 ? '#C97F3A' : '#4A5C54',
                  }}
                >
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${p.rank}`}
                </span>
                <Avatar username={p.username} size="xs" />
                <span className="flex-1 text-sm font-medium text-text truncate">{p.username}</span>
                <span className="font-mono text-xs text-text-muted">{p.rating}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements preview */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(15,21,19,0.8)', border: '1px solid #22302B' }}
        >
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Achievements</h2>
            <button
              onClick={() => navigate('/achievements')}
              className="flex items-center gap-1 text-xs text-text-faint hover:text-gold transition"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {MOCK_ACHIEVEMENTS.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }}
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-text">{a.title}</p>
                  <p className="text-xs text-text-faint">{a.desc}</p>
                </div>
                <span
                  className="chip ml-auto"
                  style={{ background: 'rgba(46,158,107,0.12)', border: '1px solid rgba(46,158,107,0.25)', color: '#2E9E6B', fontSize: 10 }}
                >
                  ✓ Unlocked
                </span>
              </div>
            ))}
            <div
              className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center"
              style={{ background: 'rgba(15,21,19,0.4)', border: '1px dashed #22302B' }}
            >
              <span className="text-2xl opacity-30">🔒</span>
              <p className="text-xs text-text-faint">More achievements await — keep playing!</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
