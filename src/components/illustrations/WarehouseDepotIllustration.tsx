import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export const WarehouseDepotIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Central Depôt Staging Bays and Reweigh Platform"
    >
      {/* Background Soft Wash */}
      <rect width="320" height="240" rx="8" fill="#FFFAF2" />

      {/* Warehouse Architecture Truss Structure */}
      <path d="M20 50L160 20L300 50" stroke="#D7D2C8" strokeWidth="2" strokeLinecap="round" />
      <line x1="160" y1="20" x2="160" y2="185" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="80" y1="36" x2="80" y2="185" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="240" y1="36" x2="240" y2="185" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="4 4" />

      {/* Concrete Depôt Floor */}
      <rect x="15" y="185" width="290" height="45" rx="4" fill="#E9DDC9" stroke="#D7D2C8" strokeWidth="1.5" />
      <line x1="25" y1="200" x2="295" y2="200" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="6 4" />

      {/* Staged Pallet 1: Stacked Minor Forest Produce Sacks */}
      <rect x="35" y="172" width="60" height="12" rx="2" fill="#544E45" />
      {/* Jute Sacks with Stencil Markings */}
      <rect x="38" y="142" width="54" height="28" rx="4" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1.25" />
      <rect x="42" y="112" width="48" height="28" rx="4" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1.25" />
      <text x="46" y="158" fill="#2D4F1E" fontFamily="monospace" fontSize="7" fontWeight="bold">
        #BS-400
      </text>
      <text x="48" y="128" fill="#2D4F1E" fontFamily="monospace" fontSize="7" fontWeight="bold">
        #BS-402
      </text>

      {/* Heavy-Duty Reweigh Platform Scale */}
      <rect x="120" y="176" width="90" height="8" rx="2" fill="#25351F" />
      <rect x="135" y="146" width="60" height="28" rx="4" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1.5" />
      {/* Scale Digital Pillar Readout */}
      <rect x="202" y="115" width="6" height="62" fill="#25351F" />
      <rect x="194" y="95" width="28" height="22" rx="3" fill="#2D4F1E" stroke="#F5E6CC" strokeWidth="1" />
      <rect x="198" y="100" width="20" height="12" rx="1.5" fill="#1F1A14" />
      <text x="200" y="108" fill="#E27D60" fontFamily="monospace" fontSize="6.5" fontWeight="bold">
        98.5k
      </text>

      {/* Quality Assay Moisture Meter Card */}
      <g transform="translate(225, 60)">
        <rect width="80" height="95" rx="4" fill="#FFFFFF" stroke="#D7D2C8" strokeWidth="1.5" />
        <path d="M0 4C0 1.79 1.79 0 4 0H76C78.21 0 80 1.79 80 4V20H0V4Z" fill="#2D4F1E" />
        <text x="8" y="14" fill="#FFFAF2" fontFamily="sans-serif" fontSize="7.5" fontWeight="bold">
          QUALITY ASSAY
        </text>

        {/* Moisture Reading Gauge */}
        <circle cx="40" cy="46" r="18" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1" />
        <path d="M40 46L49 38" stroke="#E27D60" strokeWidth="2" strokeLinecap="round" />
        <circle cx="40" cy="46" r="3" fill="#2D4F1E" />
        <text x="28" y="74" fill="#1F1A14" fontFamily="monospace" fontSize="9" fontWeight="bold">
          8.4% H₂O
        </text>

        {/* Verified Grade Stamp */}
        <rect x="12" y="80" width="56" height="10" rx="2" fill="#2E5C2D" fillOpacity="0.15" />
        <text x="18" y="88" fill="#2E5C2D" fontFamily="monospace" fontSize="6.5" fontWeight="bold">
          GRADE 1 VERIFIED
        </text>
      </g>
    </svg>
  );
};

