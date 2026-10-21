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
          ink: 'var(--accent-ink)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        sidebar: {
          bg: 'var(--sidebar-bg)',
          ink: 'var(--sidebar-ink)',
        },
      },
      fontFamily: {
        heading: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        body: ['var(--font-ibm-plex-sans)', '"IBM Plex Sans"', '"Noto Sans Oriya"', 'sans-serif'],
        odia: ['"Noto Sans Oriya"', 'sans-serif'],
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
        lg: '4px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
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
