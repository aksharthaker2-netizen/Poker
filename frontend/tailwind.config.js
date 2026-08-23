// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt: { DEFAULT: '#0F4C39', dark: '#0B3327' },
        ink: '#0B0F10',
        panel: '#0F1513',
        border: '#22302B',
        gold: '#D4AF37',
        danger: '#B23A2E',
        card: '#F5F1E8',
        text: { DEFAULT: '#EDEAE3', muted: '#8B9A94', faint: '#5A6B64' }
      }
    }
  },
  plugins: []
};