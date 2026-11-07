import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export const TransitWaybillIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Secure Transport Transit Waybill and Seal"
    >
      {/* Background Soft Cream Wash */}
      <rect width="320" height="240" rx="8" fill="#FFFAF2" />

      {/* Road / Transit Horizon */}
      <path d="M0 195H320V240H0V195Z" fill="#E9DDC9" />
      <line x1="0" y1="218" x2="320" y2="218" stroke="#D7D2C8" strokeWidth="2" strokeDasharray="8 6" />

      {/* Transit Logistics Vehicle (Commercial Medium Truck) */}
      {/* Wheels */}
      <circle cx="85" cy="195" r="16" fill="#1F1A14" />
      <circle cx="85" cy="195" r="8" fill="#D7D2C8" />
      <circle cx="195" cy="195" r="16" fill="#1F1A14" />
      <circle cx="195" cy="195" r="8" fill="#D7D2C8" />
      <circle cx="230" cy="195" r="16" fill="#1F1A14" />
      <circle cx="230" cy="195" r="8" fill="#D7D2C8" />

      {/* Chassis */}
      <rect x="55" y="180" width="195" height="10" rx="2" fill="#25351F" />

      {/* Cabin */}
      <path
        d="M50 180V125C50 120 54 115 60 115H82C88 115 93 118 96 123L106 142V180H50Z"
        fill="#2D4F1E"
      />
      {/* Cabin Window */}
      <path d="M62 122H80L90 142H62V122Z" fill="#F5E6CC" fillOpacity="0.85" />
      {/* Headlight */}
      <rect x="47" y="160" width="5" height="12" rx="2" fill="#E27D60" />

      {/* Covered Cargo Bay (Tarpaulin Protected Sacks) */}
      <rect x="108" y="105" width="144" height="75" rx="4" fill="#25351F" stroke="#2D4F1E" strokeWidth="1.5" />
      {/* Protective Ropes / Tie-downs */}
      <line x1="108" y1="125" x2="252" y2="125" stroke="#F5E6CC" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="145" y1="105" x2="145" y2="180" stroke="#F5E6CC" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="185" y1="105" x2="185" y2="180" stroke="#F5E6CC" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="225" y1="105" x2="225" y2="180" stroke="#F5E6CC" strokeWidth="1" strokeOpacity="0.4" />

      {/* Electronic Transit Waybill Floating Document */}
      <g transform="translate(160, 25)">
        <rect width="130" height="92" rx="4" fill="#FFFFFF" stroke="#D7D2C8" strokeWidth="1.5" />
        
        {/* Document Header Band */}
        <path d="M0 4C0 1.79 1.79 0 4 0H126C128.21 0 130 1.79 130 4V22H0V4Z" fill="#2D4F1E" />
        <text x="10" y="15" fill="#FFFAF2" fontFamily="monospace" fontSize="8" fontWeight="bold">
          WAYBILL #WB-OD-24
        </text>

        {/* QR Seal Glyph */}
        <rect x="10" y="30" width="34" height="34" rx="2" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1" />
        <rect x="14" y="34" width="8" height="8" fill="#1F1A14" />
        <rect x="32" y="34" width="8" height="8" fill="#1F1A14" />
        <rect x="14" y="52" width="8" height="8" fill="#1F1A14" />
        <rect x="25" y="44" width="6" height="6" fill="#E27D60" />

        {/* Text Lines */}
        <line x1="52" y1="36" x2="118" y2="36" stroke="#1F1A14" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="46" x2="105" y2="46" stroke="#544E45" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="56" x2="95" y2="56" stroke="#544E45" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tamper-Evident Lock Seal Badge */}
        <g transform="translate(10, 70)">
          <rect width="110" height="16" rx="2" fill="#E27D60" fillOpacity="0.15" stroke="#E27D60" strokeWidth="1" />
          <circle cx="10" cy="8" r="3.5" fill="#E27D60" />
          <text x="18" y="11" fill="#B84E34" fontFamily="monospace" fontSize="7" fontWeight="bold">
            SEAL LOCKED: OD-ST-8840
          </text>
        </g>
      </g>
    </svg>
  );
};

