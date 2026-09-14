import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      // ============================================================================
      // RESPONSIVE BREAKPOINTS - MOBILE FIRST
      // ============================================================================
      screens: {
        'xs': '320px',    // Mobile small
        'sm': '640px',    // Mobile large
        'md': '768px',    // Tablet
        'lg': '1024px',   // Desktop
        'xl': '1280px',   // Large desktop
        '2xl': '1536px',  // Extra large desktop
      },

      // ============================================================================
      // SPACING - RESPONSIVE SCALE
      // ============================================================================
      fontFamily: {
        heading: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },

      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // ============================================================================
      // COLORS - DARK MODE THEME
      // ============================================================================
      colors: {
        // Viorp "Aurora Night" brand palette
        'deep-aurora': '#0A0F1E',
        'charcoal': '#121827',
        'aurora-mint': '#6FFFD4',
        'solar-gold': '#FFC857',
        'dark-grey': '#1F2937',
        'off-white': '#F0FFFB',
        'aurora-error': '#FF2E88',
        'dark': {
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a',
        },
        'primary': {
          '50': '#eff6ff',

          '100': '#dbeafe',
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a',
        },
      },

      // ============================================================================
      // FONT SIZES - RESPONSIVE TYPOGRAPHY
      // ============================================================================
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },

      // ============================================================================
      // CONTAINER - RESPONSIVE MAX WIDTH
      // ============================================================================
      container: {
        center: true,
        padding: {
          'DEFAULT': '1rem',
          'xs': '0.5rem',
          'sm': '1rem',
          'md': '1.5rem',
          'lg': '2rem',
          'xl': '2rem',
          '2xl': '2rem',
        },
        screens: {
          'xs': '100%',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px',
        },
      },

      // ============================================================================
      // TRANSITIONS - SMOOTH ANIMATIONS
      // ============================================================================
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      // ============================================================================
      // SHADOWS - DEPTH LAYERS
      // ============================================================================
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 8px rgba(111, 255, 212, 0.4)',
        'glow-lg': '0 0 16px rgba(111, 255, 212, 0.4)',
        'card': '0 4px 20px rgba(10, 15, 30, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config
