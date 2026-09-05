// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const COLORS = {
  bg: '#0A0D0C',
  panel: '#111614',
  panelBorder: '#233029',
  gold: '#D4AF37',
  goldSoft: 'rgba(212, 175, 55, 0.35)',
  text: '#EDEAE3',
  muted: '#8B9A94',
  faint: '#57665F',
  danger: '#C0453A',
  dangerBg: 'rgba(192, 69, 58, 0.1)',
  inputBg: '#0A0D0C'
};

// Inline styles carry all the layout/branding weight so this page renders
// correctly even if the Tailwind pipeline is misconfigured or stale —
// only hover/focus polish is left to Tailwind's `className` utilities,
// which degrade harmlessly if they don't resolve.
const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `radial-gradient(ellipse at 50% -10%, #0F4C39 0%, ${COLORS.bg} 55%)`,
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    background: COLORS.panel,
    border: `1px solid ${COLORS.panelBorder}`,
    borderRadius: '14px',
    padding: '36px 32px 28px',
    boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02)`,
    boxSizing: 'border-box'
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  brandMark: {
    color: COLORS.gold,
    fontSize: '22px',
    lineHeight: 1
  },
  brandName: {
    color: COLORS.text,
    fontSize: '20px',
    fontWeight: 700,
    letterSpacing: '0.02em'
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: '13px',
    textAlign: 'center',
    margin: '4px 0 28px'
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
  label: {
    color: COLORS.muted,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
  },
  input: {
    background: COLORS.inputBg,
    border: `1px solid ${COLORS.panelBorder}`,
    borderRadius: '8px',
    padding: '11px 14px',
    color: COLORS.text,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  },
  errorBox: {
    background: COLORS.dangerBg,
    border: `1px solid ${COLORS.danger}55`,
    borderRadius: '8px',
    padding: '10px 12px',
    color: COLORS.danger,
    fontSize: '13px',
    marginBottom: '16px'
  },
  submitButton: {
    width: '100%',
    background: COLORS.gold,
    color: '#161200',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.01em',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'filter 0.15s ease, transform 0.1s ease'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '22px 0 14px',
    color: COLORS.faint,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em'
  },
  dividerLine: { flex: 1, height: '1px', background: COLORS.panelBorder },
  switchLink: {
    display: 'block',
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: COLORS.muted,
    fontSize: '13px',
    textAlign: 'center',
    cursor: 'pointer',
    padding: '4px'
  }
};

function storeSession(data) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('username', data.user.username);
}

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    ...styles.input,
    borderColor: focusedField === field ? COLORS.gold : COLORS.panelBorder,
    boxShadow: focusedField === field ? `0 0 0 3px ${COLORS.goldSoft}` : 'none'
  });

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brandRow}>
          <span style={styles.brandMark}>♠</span>
          <span style={styles.brandName}>PokerAI</span>
        </div>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'Welcome back — log in to play' : 'Create your account to start playing'}
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={handleChange('username')}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('username')}
                placeholder="your_table_name"
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={handleChange('email')}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('email')}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange('password')}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle('password')}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitButton, opacity: loading ? 0.6 : 1 }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.filter = 'brightness(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span>or</span>
          <span style={styles.dividerLine} />
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={styles.switchLink}
          onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.muted)}
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
