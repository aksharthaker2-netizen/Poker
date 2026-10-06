// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt:   { DEFAULT: '#0F4C39', dark: '#0B3327', light: '#1a6b52', deep: '#082019' },
        ink:    '#0B0F10',
        panel:  '#0F1513',
        panel2: '#141C1A',
        panel3: '#1A2420',
        border: '#22302B',
        gold:   { DEFAULT: '#D4AF37', light: '#F0CB5C', dark: '#A88B28', subtle: 'rgba(212,175,55,0.12)' },
        danger: '#B23A2E',
        success:'#2E9E6B',
        warning:'#E8943A',
        card:   '#F5F1E8',
        faint:  '#4A5C54',
        text: {
          DEFAULT: '#EDEAE3',
          muted:   '#8B9A94',
          faint:   '#5A6B64'
        },
        // Sidebar tokens
        sidebar: {
          bg:      '#0D1210',
          border:  '#1D2B26',
          hover:   '#141E1B',
          active:  '#1A2B26',
        }
      },
      width: {
        sidebar:  '240px',
        'sidebar-collapsed': '64px',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        panel:    '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03)',
        card:     '0 2px 12px rgba(0,0,0,0.4)',
        gold:     '0 0 24px rgba(212,175,55,0.25), 0 0 6px rgba(212,175,55,0.15)',
        'gold-sm':'0 0 10px rgba(212,175,55,0.2)',
        glow:     '0 0 40px rgba(15,76,57,0.4)',
        inner:    'inset 0 1px 0 rgba(255,255,255,0.04)',
        sidebar:  '2px 0 24px rgba(0,0,0,0.4)',
        felt:     'inset 0 0 60px rgba(0,0,0,0.4)',
        'seat-active': '0 0 0 2px #D4AF37, 0 0 20px rgba(212,175,55,0.3)',
        'seat-ring': '0 0 0 2px rgba(212,175,55,0.5)',
      },
      backgroundImage: {
        'felt-radial':    'radial-gradient(ellipse at 50% 0%, #0F4C39 0%, #0B0F10 60%)',
        'felt-table':     'radial-gradient(120% 100% at 50% 15%, #146348 0%, #0f4c39 45%, #082019 100%)',
        'gold-shimmer':   'linear-gradient(90deg, #D4AF37 0%, #F0CB5C 45%, #D4AF37 100%)',
        'card-gradient':  'linear-gradient(135deg, #1a2420 0%, #0F1513 100%)',
        'panel-gradient': 'linear-gradient(180deg, #141C1A 0%, #0F1513 100%)',
        'hero-gradient':  'radial-gradient(ellipse at 50% -5%, rgba(15,76,57,0.5) 0%, #0B0F10 60%)',
        'sidebar-gradient': 'linear-gradient(180deg, #0D1210 0%, #0B0F10 100%)',
        'card-back':      'linear-gradient(135deg, #0F4C39 0%, #082019 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-left': {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'shimmer': {
          '0%':   { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' }
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(212,175,55,0.3)' },
          '50%':       { boxShadow: '0 0 18px rgba(212,175,55,0.6)' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 2px #D4AF37, 0 0 12px rgba(212,175,55,0.3)' },
          '50%':       { boxShadow: '0 0 0 2px #F0CB5C, 0 0 24px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.2)' }
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.6', transform: 'scale(0.85)' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':       { transform: 'translateX(-6px)' },
          '40%':       { transform: 'translateX(6px)' },
          '60%':       { transform: 'translateX(-4px)' },
          '80%':       { transform: 'translateX(4px)' }
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' }
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'deal-in': {
          '0%':   { opacity: '0', transform: 'translateY(-24px) rotate(-8deg) scale(0.85)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg) scale(1)' }
        },
        'celebrate': {
          '0%':   { transform: 'scale(1)' },
          '25%':  { transform: 'scale(1.15) rotate(-3deg)' },
          '50%':  { transform: 'scale(1.1) rotate(3deg)' },
          '75%':  { transform: 'scale(1.05) rotate(-1deg)' },
          '100%': { transform: 'scale(1) rotate(0)' }
        },
        'timer-fill': {
          '0%':   { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '100' }
        },
        'count-up': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-up':    'fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fade-in 0.3s ease both',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-up':   'slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'slide-left': 'slide-left 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':    'shimmer 2.5s linear infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.8s ease-in-out infinite',
        'pulse-dot':  'pulse-dot 1.5s ease-in-out infinite',
        'shake':      'shake 0.4s ease both',
        'spin-slow':  'spin-slow 3s linear infinite',
        'float':      'float 3s ease-in-out infinite',
        'scale-in':   'scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'deal-in':    'deal-in 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'celebrate':  'celebrate 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'count-up':   'count-up 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)'
      },
      borderRadius: {
        'table': '46%',
      }
    }
  },
  plugins: []
};