import React from 'react';

interface SamagnaLogoProps {
  variant?: 'light' | 'dark' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export function SamagnaLogo({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}: SamagnaLogoProps) {
  // Sizing tokens
  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 44,
    xl: 60,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Stylized Leaf-S Emblem from Infographic */}
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Samagna Logo"
      >
        {/* Soft rounded container background */}
        <rect
          width="100"
          height="100"
          rx="18"
          fill={isDark ? '#B24E2E' : '#B24E2E'}
        />

        {/* Lower supporting leaf base (Warm Terracotta Shade) */}
        <path
          d="M20 74C32 82 58 84 76 68C66 76 46 76 34 71C26 67 22 62 20 74Z"
          fill="#8E351A"
        />

        {/* Sprouting leaf base */}
        <path
          d="M32 68C42 58 64 60 74 72C60 76 44 74 32 68Z"
          fill="#F2EBDD"
        />

        {/* Outer stylized S curve */}
        <path
          d="M62 20C44 18 30 28 32 44C34 56 46 60 56 64C68 68 76 72 74 82C72 90 62 94 48 92C34 90 26 82 24 76C24 76 32 82 46 82C58 82 66 76 66 70C66 62 54 58 44 54C32 50 22 44 24 30C26 16 42 10 60 12C68 13 74 16 78 20L62 20Z"
          fill="#C05638"
        />

        {/* Inner white leaf silhouette forming the S-core */}
        <path
          d="M48 24C38 32 38 46 50 52C60 56 68 62 66 72C64 80 54 84 44 82C40 81 36 78 34 74C38 72 44 72 48 74C56 78 62 76 62 70C62 64 54 60 46 56C36 50 30 42 32 32C34 24 40 18 48 16V24Z"
          fill="#FFFFFF"
        />

        {/* Central leaf bud with vein */}
        <path
          d="M52 38C58 42 60 48 54 54C48 48 48 42 52 38Z"
          fill="#8E351A"
        />
        <line
          x1="52"
          y1="38"
          x2="53"
          y2="54"
          stroke="#FAF6EE"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Typography */}
      {variant !== 'icon' && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span
              className={`font-heading font-bold tracking-tight ${textSizes[size]} ${
                isDark ? 'text-sidebar-ink' : 'text-ink'
              }`}
            >
              Samagna
            </span>
            <span
              className={`text-[12px] font-odia font-semibold ${
                isDark ? 'text-accent-tint' : 'text-accent'
              }`}
            >
              ସମଗ୍ନ
            </span>
          </div>

          {showTagline && (
            <span
              className={`text-[9px] font-mono tracking-widest uppercase mt-0.5 ${
                isDark ? 'text-sidebar-ink/60' : 'text-ink-muted'
              }`}
            >
              FOREST · PEOPLE · PROSPERITY
            </span>
          )}
        </div>
      )}
    </div>
  );
}
