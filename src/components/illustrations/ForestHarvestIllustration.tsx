import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export const ForestHarvestIllustration: React.FC<IllustrationProps> = ({
  className = 'w-full h-auto',
  size,
}) => {
  return (
    <svg
      width={size || 320}
      height={size ? (typeof size === 'number' ? size * 0.75 : 'auto') : 240}
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Village Gatherer Forest Harvest and Weighment"
    >
      {/* Background Soft Sky / Cream Wash */}
      <rect width="320" height="240" rx="8" fill="#FFFAF2" />
      
      {/* Distant Hills / Sal Forest Canopy Silhouettes */}
      <path
        d="M0 160C45 140 90 152 140 135C190 118 240 138 320 120V240H0V160Z"
        fill="#F5E6CC"
        fillOpacity="0.7"
      />
      <path
        d="M0 175C60 158 120 168 180 152C230 140 280 155 320 145V240H0V175Z"
        fill="#E9DDC9"
        fillOpacity="0.8"
      />

      {/* Sal Tree Leaves (Stylized Canopy) */}
      <circle cx="50" cy="70" r="38" fill="#2D4F1E" fillOpacity="0.9" />
      <circle cx="85" cy="55" r="32" fill="#25351F" />
      <circle cx="115" cy="75" r="28" fill="#2D4F1E" fillOpacity="0.85" />
      {/* Trunk */}
      <path d="M78 88L74 190H88L84 88H78Z" fill="#544E45" />

      {/* Mahua Flower Blossom Motifs falling softly */}
      <circle cx="110" cy="115" r="4.5" fill="#E27D60" />
      <circle cx="125" cy="130" r="3.5" fill="#E27D60" />
      <circle cx="95" cy="140" r="4" fill="#E27D60" />
      <circle cx="140" cy="120" r="3" fill="#E27D60" />

      {/* Village Collection Platform Surface */}
      <rect x="30" y="190" width="260" height="36" rx="4" fill="#E9DDC9" stroke="#D7D2C8" strokeWidth="1.5" />
      <line x1="40" y1="202" x2="280" y2="202" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="4 3" />

      {/* Calibrated Electronic Scale Base */}
      <rect x="180" y="170" width="84" height="22" rx="3" fill="#25351F" stroke="#2D4F1E" strokeWidth="1.5" />
      {/* Digital Scale LED Readout */}
      <rect x="220" y="175" width="38" height="12" rx="2" fill="#1F1A14" />
      <text x="224" y="184" fill="#E27D60" fontFamily="monospace" fontSize="8" fontWeight="bold">
        40.0kg
      </text>

      {/* Traditional Woven Bamboo Basket / Gunny Sack */}
      <path
        d="M192 170L197 125C198 122 201 120 205 120H239C243 120 246 122 247 125L252 170H192Z"
        fill="#F5E6CC"
        stroke="#D7D2C8"
        strokeWidth="1.5"
      />
      {/* Natural Produce Texture Inside Basket */}
      <path
        d="M198 128C206 122 216 125 222 123C228 121 238 124 246 128"
        stroke="#E27D60"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="212" cy="132" r="3" fill="#E27D60" />
      <circle cx="224" cy="130" r="3.5" fill="#E27D60" />
      <circle cx="236" cy="133" r="3" fill="#E27D60" />

      {/* Primary Collector Persona (Abstracted Dignified Silhouette) */}
      <circle cx="150" cy="120" r="12" fill="#2D4F1E" />
      {/* Traditional Saree Drape / Shoulder cloth in Terracotta */}
      <path
        d="M136 142C136 134 142 132 150 132C158 132 164 134 164 142L168 190H132L136 142Z"
        fill="#E27D60"
      />
      <path
        d="M136 142L154 165L164 142"
        stroke="#FFFAF2"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Direct-to-Bank / MSP Verified Badge */}
      <g transform="translate(42, 28)">
        <rect width="94" height="24" rx="4" fill="#2D4F1E" />
        <circle cx="14" cy="12" r="5" fill="#E27D60" />
        <path d="M12 12L13.5 13.5L16 10.5" stroke="#FFFAF2" strokeWidth="1.25" strokeLinecap="round" />
        <text x="25" y="15" fill="#FFFAF2" fontFamily="sans-serif" fontSize="8" fontWeight="600" letterSpacing="0.04em">
          100% MSP DBT
        </text>
      </g>
    </svg>
  );
};

