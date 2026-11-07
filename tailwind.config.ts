import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
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
        // --- Samagna Premium Foundation Palette ---
        canopy: {
          DEFAULT: 'var(--canopy-deep)',
          deep: 'var(--canopy-deepest)',
          light: 'var(--canopy-light)',
        },
        forest: {
          DEFAULT: 'var(--forest-primary)',
          hover: 'var(--forest-hover)',
          ink: '#FFFFFF',
          deep: 'var(--canopy-deep)',
          surface: 'var(--forest-surface)',
        },
        cream: {
          DEFAULT: 'var(--parchment)',
          canvas: 'var(--canvas-warm)',
          sunken: 'var(--sand-sunken)',
          light: '#FFFDF9',
        },
        terracotta: {
          DEFAULT: 'var(--terracotta-primary)',
          hover: 'var(--terracotta-hover)',
          deep: 'var(--terracotta-deep)',
          tint: 'var(--terracotta-tint)',
        },
        charcoal: {
          DEFAULT: 'var(--ink-muted)',
          deep: 'var(--ink-primary)',
          soft: 'var(--ink-subtle)',
        },
        // --- Supporting Palette ---
        sand: 'var(--sand-sunken)',
        'warm-white': 'var(--canvas-warm)',
        'soft-border': 'var(--border-soft)',
        leaf: {
          DEFAULT: 'var(--forest-primary)',
          hover: 'var(--forest-hover)',
          tint: '#F4F8F0',
          ink: 'var(--forest-primary)',
        },
        paper: '#FFFFFF',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Fraunces', 'Georgia', 'serif'],
        display: ['var(--font-serif)', 'Fraunces', 'serif'],
        sans: ['var(--font-sans)', 'Manrope', 'sans-serif'],
        heading: ['var(--font-serif)', 'var(--font-sans)', 'serif'],
        body: ['var(--font-sans)', 'Manrope', 'sans-serif'],
        odia: ['var(--font-odia)', 'Noto Sans Oriya', 'Nirmala UI', 'Kalinga', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
        fraunces: ['Fraunces', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
        oswald: ['Fraunces', 'serif'],
        inter: ['Manrope', 'sans-serif'],
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
        'section-label': ['12px', { lineHeight: '1.4', letterSpacing: '0.06em' }],
        'badge': ['12px', { lineHeight: '1.3', letterSpacing: '0.04em' }],
        'display-hero': ['clamp(2.125rem, 1.45rem + 3.1vw, 4.25rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'h1': ['clamp(1.75rem, 1.35rem + 1.8vw, 2.75rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h2': ['clamp(1.35rem, 1.15rem + 1.1vw, 2.0rem)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'h3': ['clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)', { lineHeight: '1.35' }],
        'body-lead': ['clamp(1.0rem, 0.95rem + 0.3vw, 1.1875rem)', { lineHeight: '1.6' }],
        'body-base': ['clamp(0.875rem, 0.85rem + 0.15vw, 1.0rem)', { lineHeight: '1.6' }],
      },
      minHeight: {
        touch: '44px',
        dvh: '100dvh',
        svh: '100svh',
      },
      minWidth: {
        touch: '44px',
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
