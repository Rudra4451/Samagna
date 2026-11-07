import React from 'react';

interface SamagnaLogoProps {
  variant?: 'light' | 'dark' | 'icon' | 'forest';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
}

export function SamagnaLogo({
  variant = 'forest',
  size = 'md',
  showTagline = false,
  className = '',
}: SamagnaLogoProps) {
  // Sizing tokens
  const iconSizes = {
    sm: 26,
    md: 34,
    lg: 46,
    xl: 62,
  };

  const textSizes = {
    sm: 'text-[17px]',
    md: 'text-[21px]',
    lg: 'text-[28px]',
    xl: 'text-[36px]',
  };

  const isDark = variant === 'dark';
  const isLight = variant === 'light';
  const isForest = variant === 'forest';

  // Palette: Forest Green #2D4F1E, Deep Forest #25351F, Terracotta #E27D60, Warm Cream #F5E6CC, Warm White #FFFAF2
  const containerFill = isDark ? '#25351F' : isLight ? '#FFFAF2' : '#2D4F1E';
  const containerBorder = isLight ? '#D7D2C8' : 'rgba(245, 230, 204, 0.2)';
  const leafBaseFill = '#E27D60'; // Terracotta
  const sproutingLeafFill = isLight ? '#E9DDC9' : '#F5E6CC'; // Warm Cream
  const sCurveFill = isLight ? '#2D4F1E' : '#F5E6CC';
  const coreLeafFill = isLight ? '#FFFAF2' : '#FFFFFF';
  const centralBudFill = '#E27D60'; // Terracotta bud

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Stylized Botanical Leaf-S Emblem */}
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-[1.03]"
        aria-label="Samagna Logo"
      >
        {/* Soft rounded container background */}
        <rect
          width="100"
          height="100"
          rx="22"
          fill={containerFill}
          stroke={containerBorder}
          strokeWidth="2"
        />

        {/* Lower supporting leaf base (Terracotta Earth) */}
        <path
          d="M20 74C32 82 58 84 76 68C66 76 46 76 34 71C26 67 22 62 20 74Z"
          fill={leafBaseFill}
        />

        {/* Sprouting leaf base (Warm Cream) */}
        <path
          d="M32 68C42 58 64 60 74 72C60 76 44 74 32 68Z"
          fill={sproutingLeafFill}
        />

        {/* Outer stylized S curve */}
        <path
          d="M62 20C44 18 30 28 32 44C34 56 46 60 56 64C68 68 76 72 74 82C72 90 62 94 48 92C34 90 26 82 24 76C24 76 32 82 46 82C58 82 66 76 66 70C66 62 54 58 44 54C32 50 22 44 24 30C26 16 42 10 60 12C68 13 74 16 78 20L62 20Z"
          fill={sCurveFill}
        />

        {/* Inner leaf silhouette forming the S-core */}
        <path
          d="M48 24C38 32 38 46 50 52C60 56 68 62 66 72C64 80 54 84 44 82C40 81 36 78 34 74C38 72 44 72 48 74C56 78 62 76 62 70C62 64 54 60 46 56C36 50 30 42 32 32C34 24 40 18 48 16V24Z"
          fill={coreLeafFill}
        />

        {/* Central leaf bud (Terracotta with fine vein) */}
        <path
          d="M52 38C58 42 60 48 54 54C48 48 48 42 52 38Z"
          fill={centralBudFill}
        />
        <line
          x1="52"
          y1="38"
          x2="53"
          y2="54"
          stroke={sproutingLeafFill}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Typography */}
      {variant !== 'icon' && (
        <div className="flex flex-col select-none">
          <div className="flex items-baseline gap-1.5 leading-none">
            <span
              className={`font-serif tracking-tight font-semibold ${textSizes[size]} ${
                isDark
                  ? 'text-[#F5E6CC]'
                  : isLight
                  ? 'text-[#2D4F1E]'
                  : 'text-[#2D4F1E]'
              }`}
            >
              Samagna
            </span>
            <span
              className={`text-[12px] font-odia font-medium ${
                isDark ? 'text-[#E27D60]' : 'text-[#E27D60]'
              }`}
            >
              ସମଗ୍ନ
            </span>
          </div>

          {showTagline && (
            <span
              className={`text-[9px] font-mono tracking-[0.14em] uppercase mt-0.5 ${
                isDark ? 'text-[#F5E6CC]/70' : 'text-[#544E45]'
              }`}
            >
              FOREST · VALUE · PROSPERITY
            </span>
          )}
        </div>
      )}
    </div>
  );
}
