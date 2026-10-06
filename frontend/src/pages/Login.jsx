// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Spade } from 'lucide-react';
import { authApi } from '../services/api';

function storeSession(data) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('username', data.user.username);
}

const PARTICLES = [
  { suit: '♠', top: '8%',  left: '5%',  size: 64, delay: 0,    dur: 6 },
  { suit: '♥', top: '15%', right: '8%', size: 80, delay: 1.2,  dur: 7, red: true },
  { suit: '♣', bottom: '20%', left: '7%', size: 56, delay: 0.6, dur: 8 },
  { suit: '♦', bottom: '12%', right: '5%', size: 72, delay: 1.8, dur: 5.5, red: true },
  { suit: '♠', top: '40%', left: '2%', size: 40, delay: 2, dur: 9 },
  { suit: '♥', top: '55%', right: '3%', size: 48, delay: 0.3, dur: 6.5, red: true },
];

function InputField({ label, type, value, onChange, placeholder, name, icon: Icon, minLength }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-widest transition-colors duration-150"
        style={{ color: focused ? '#D4AF37' : '#8B9A94' }}
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: focused ? '#D4AF37' : '#4A5C54' }}>
            <Icon size={15} />
          </span>
        )}
        <input
          id={name}
          type={isPassword && showPw ? 'text' : type}
          required
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl py-3 text-sm text-text outline-none transition-all"
          style={{
            background: 'rgba(11,15,16,0.9)',
            border: `1px solid ${focused ? '#D4AF37' : '#22302B'}`,
            boxShadow: focused ? '0 0 0 3px rgba(212,175,55,0.15)' : 'none',
            paddingLeft: Icon ? '40px' : '14px',
            paddingRight: isPassword ? '42px' : '14px',
          }}
          autoComplete={isPassword ? 'current-password' : name}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint transition hover:text-text-muted"
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } =
        mode === 'login'
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.register(form);
      storeSession(data);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong';
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex overflow-hidden"
      style={{ background: '#0B0F10' }}
    >
      {/* ── Left panel (desktop only) ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col items-center justify-center relative overflow-hidden px-16"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(15,76,57,0.5) 0%, #0B0F10 65%)',
        }}
      >
        {/* Background suit particles */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="pointer-events-none select-none absolute"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              top: p.top,
              left: p.left,
              right: p.right,
              bottom: p.bottom,
              fontSize: p.size,
              color: p.red ? 'rgba(192,69,58,0.07)' : 'rgba(212,175,55,0.06)',
            }}
          >
            {p.suit}
          </motion.span>
        ))}

        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(15,76,57,0.25) 0%, transparent 65%)',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', boxShadow: '0 0 30px rgba(212,175,55,0.15)' }}
            >
              <Spade size={28} className="text-gold" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-display text-5xl font-semibold text-text mb-4 leading-tight"
          >
            PokerAI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-text-muted mb-6"
          >
            Play. Compete. <span className="text-gold">Learn.</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-text-faint leading-relaxed"
          >
            Real-time multiplayer Texas Hold'em with AI coaching.
            Compete globally, review every hand, and improve your game.
          </motion.p>

          {/* Floating suits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center gap-6 mt-10 text-3xl"
          >
            {['♠','♥','♣','♦'].map((s, i) => (
              <motion.span
                key={i}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ color: i % 2 === 1 ? 'rgba(192,69,58,0.7)' : 'rgba(212,175,55,0.7)' }}
              >
                {s}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right panel — Login/Register card ─────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 lg:bg-transparent"
        style={{ background: 'radial-gradient(ellipse at 50% -5%, rgba(15,76,57,0.4) 0%, transparent 55%)' }}
      >
        <motion.div
          animate={shake ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative rounded-2xl"
            style={{
              background: 'rgba(15,21,19,0.92)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(34,48,43,0.9)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)',
              padding: '40px 36px 32px',
            }}
          >
            {/* Gold top accent */}
            <div
              className="absolute inset-x-8 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)' }}
            />

            {/* Mobile brand */}
            <div className="lg:hidden mb-6 flex items-center justify-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
              >
                <Spade size={18} className="text-gold" />
              </div>
              <span className="font-display text-xl font-semibold text-text">PokerAI</span>
            </div>

            {/* Mode header */}
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-text">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {mode === 'login' ? 'Log in to play' : 'Start your poker journey'}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 overflow-hidden rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(178,58,46,0.12)', border: '1px solid rgba(178,58,46,0.35)', color: '#C0453A' }}
                >
                  <span className="mt-px shrink-0">⚠</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {mode === 'register' && (
                  <motion.div
                    key="username"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <InputField
                      label="Username"
                      type="text"
                      name="username"
                      icon={User}
                      value={form.username}
                      onChange={handleChange('username')}
                      placeholder="your_handle"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Email"
                type="email"
                name="email"
                icon={Mail}
                value={form.email}
                onChange={handleChange('email')}
                placeholder="you@example.com"
              />

              <InputField
                label="Password"
                type="password"
                name="password"
                icon={Lock}
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                minLength={8}
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all"
                style={{
                  background: loading ? 'rgba(212,175,55,0.5)' : '#D4AF37',
                  color: '#0B1A10',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(212,175,55,0.25)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/40 border-t-ink" />
                    Please wait…
                  </span>
                ) : mode === 'login' ? 'Log In' : 'Create Account'}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3" style={{ color: '#4A5C54' }}>
              <span className="flex-1 h-px" style={{ background: '#22302B' }} />
              <span className="text-xs uppercase tracking-widest">or</span>
              <span className="flex-1 h-px" style={{ background: '#22302B' }} />
            </div>

            {/* Mode switch */}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="w-full rounded-xl py-2.5 text-sm transition-all hover:text-text"
              style={{ color: '#8B9A94' }}
            >
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <span className="font-semibold text-gold">
                {mode === 'login' ? 'Register' : 'Log in'}
              </span>
            </button>

            {mode === 'login' && (
              <button
                type="button"
                className="mt-1 w-full text-center text-xs text-text-faint hover:text-text-muted transition"
              >
                Forgot password?
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
