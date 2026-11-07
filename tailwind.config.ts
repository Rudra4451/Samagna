import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          sunken: 'var(--bg-sunken)',
          cream: 'var(--bg-cream)',
        },
        surface: 'var(--surface)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
          subtle: 'var(--ink-subtle)',
        },
        rule: 'var(--rule)',
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          tint: 'var(--accent-tint)',
          ink: 'var(--accent-ink)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        sidebar: {
          bg: 'var(--sidebar-bg)',
          ink: 'var(--sidebar-ink)',
          rule: 'var(--sidebar-rule)',
        },
        // --- Samagna Phase 1 Primary Palette ---
        forest: {
          DEFAULT: '#2D4F1E',
          hover: '#25351F',
          ink: '#FFFFFF',
          deep: '#25351F',
        },
        cream: {
          DEFAULT: '#F5E6CC',
          sunken: '#E9DDC9',
        },
        terracotta: {
          DEFAULT: '#E27D60',
          hover: '#D66D50',
          deep: '#B84E34',
          tint: '#FCF1ED',
        },
        charcoal: {
          DEFAULT: '#4A4A4A',
          deep: '#1F1A14',
          soft: '#544E45',
        },
        // --- Supporting Palette ---
        sand: '#E9DDC9',
        'warm-white': '#FFFAF2',
        'soft-border': '#D7D2C8',
        leaf: {
          DEFAULT: '#2D4F1E',
          hover: '#25351F',
          tint: '#F4F8F0',
          ink: '#2D4F1E',
        },
        paper: '#FFFFFF',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'Fraunces', 'serif'],
        sans: ['var(--font-sans)', 'Manrope', 'sans-serif'],
        heading: ['var(--font-heading)', 'var(--font-display)', 'serif'],
        body: ['var(--font-sans)', 'Manrope', 'sans-serif'],
        odia: ['var(--font-odia)', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
        fraunces: ['Fraunces', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
        oswald: ['Oswald', 'var(--font-heading)', 'sans-serif'],
        inter: ['Inter', 'var(--font-sans)', 'sans-serif'],
      },
      fontSize: {
        'scale-12': ['12px', { lineHeight: '1.45' }],
        'scale-13': ['13px', { lineHeight: '1.45' }],
        'scale-14': ['14px', { lineHeight: '1.45' }],
        'scale-16': ['16px', { lineHeight: '1.45' }],
        'scale-18': ['18px', { lineHeight: '1.45' }],
        'scale-22': ['22px', { lineHeight: '1.2' }],
        'scale-28': ['28px', { lineHeight: '1.2' }],
        'scale-36': ['36px', { lineHeight: '1.2' }],
        'section-label': ['11px', { lineHeight: '1.4', letterSpacing: '0.06em' }],
        'badge': ['11px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        subtle: '0 1px 3px 0 rgba(45, 79, 30, 0.05)',
        card: '0 2px 6px -1px rgba(45, 79, 30, 0.06), 0 1px 4px -1px rgba(45, 79, 30, 0.04)',
        modal: '1px 1px 0px 0px var(--rule)',
      },
      width: {
        sidebar: '240px',
        drawer: '480px',
      },
      maxWidth: {
        ledger: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
