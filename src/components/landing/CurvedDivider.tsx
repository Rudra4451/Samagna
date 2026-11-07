import React from 'react';

interface CurvedDividerProps {
  topColor?: string;
  bottomColor?: string;
  flipX?: boolean;
  flipY?: boolean;
  className?: string;
}

export const CurvedDivider: React.FC<CurvedDividerProps> = ({
  topColor = 'var(--canopy-deepest)',
  bottomColor = 'var(--canvas-warm)',
  flipX = false,
  flipY = false,
  className = '',
}) => {
  return (
    <div
      className={`w-full overflow-hidden leading-none select-none ${className}`}
      style={{ backgroundColor: topColor }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`w-full h-10 sm:h-16 md:h-20 block ${flipX ? '-scale-x-100' : ''} ${
          flipY ? '-scale-y-100' : ''
        }`}
      >
        <path
          d="M0,0 C320,65 580,80 720,80 C860,80 1120,65 1440,0 L1440,80 L0,80 Z"
          fill={bottomColor}
        />
      </svg>
    </div>
  );
};
