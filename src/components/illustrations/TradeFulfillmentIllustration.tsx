import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export const TradeFulfillmentIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Enterprise Trade Desk and Purchase Order Fulfillment"
    >
      {/* Background Soft Cream Wash */}
      <rect width="320" height="240" rx="8" fill="#FFFAF2" />

      {/* Modern Logistics Platform Base */}
      <rect x="20" y="190" width="280" height="38" rx="4" fill="#E9DDC9" stroke="#D7D2C8" strokeWidth="1.5" />
      <line x1="30" y1="205" x2="290" y2="205" stroke="#D7D2C8" strokeWidth="1" strokeDasharray="6 4" />

      {/* Export / Commercial Pallet with Shrink-Wrapped Natural Goods */}
      <rect x="40" y="174" width="80" height="14" rx="2" fill="#544E45" />
      <rect x="44" y="112" width="72" height="60" rx="4" fill="#F5E6CC" stroke="#D7D2C8" strokeWidth="1.5" />
      
      {/* Botanical Goods Texture Inside Pallet Box */}
      <line x1="44" y1="132" x2="116" y2="132" stroke="#D7D2C8" strokeWidth="1" />
      <line x1="44" y1="152" x2="116" y2="152" stroke="#D7D2C8" strokeWidth="1" />
      
      {/* Pallet Stencil Badge */}
      <rect x="52" y="120" width="56" height="8" rx="1.5" fill="#2D4F1E" fillOpacity="0.15" />
      <text x="56" y="126.5" fill="#2D4F1E" fontFamily="monospace" fontSize="6.5" fontWeight="bold">
        TDCCOL BATCH #402
      </text>

      {/* Purity Ribbon / Lab Verified Seal */}
      <circle cx="102" cy="112" r="14" fill="#E27D60" stroke="#FFFAF2" strokeWidth="2" />
      <circle cx="102" cy="112" r="9" fill="#2D4F1E" />
      <path d="M99 112L101 114L105 110" stroke="#FFFAF2" strokeWidth="1.5" strokeLinecap="round" />

      {/* Formal Purchase Order & Contract Card */}
      <g transform="translate(150, 45)">
        <rect width="138" height="135" rx="5" fill="#FFFFFF" stroke="#D7D2C8" strokeWidth="1.5" />
        
        {/* Card Header Band */}
        <path d="M0 5C0 2.24 2.24 0 5 0H133C135.76 0 138 2.24 138 5V26H0V5Z" fill="#2D4F1E" />
        <text x="12" y="17" fill="#FFFAF2" fontFamily="serif" fontSize="10" fontWeight="bold">
          PURCHASE ORDER #PO-2025
        </text>

        {/* Enterprise Buyer Info */}
        <text x="12" y="42" fill="#1F1A14" fontFamily="sans-serif" fontSize="8" fontWeight="bold">
          Buyer: Dabur India Ltd (Pharma)
        </text>
        <text x="12" y="54" fill="#544E45" fontFamily="sans-serif" fontSize="7.5">
          Consignment: 50.0 kg Dried Mahua
        </text>
        <text x="12" y="66" fill="#544E45" fontFamily="sans-serif" fontSize="7.5">
          Origin: Karanjia MFP Centre #01
        </text>

        {/* Value Chain MSP Guarantee Notice */}
        <rect x="10" y="76" width="118" height="20" rx="3" fill="#F5E6CC" stroke="#E9DDC9" strokeWidth="1" />
        <circle cx="20" cy="86" r="4" fill="#2D4F1E" />
        <text x="28" y="89" fill="#2D4F1E" fontFamily="monospace" fontSize="6.5" fontWeight="bold">
          100% MSP Flow Protected
        </text>

        {/* Digital Signature Stamped */}
        <line x1="12" y1="114" x2="65" y2="114" stroke="#1F1A14" strokeWidth="1" />
        <text x="12" y="122" fill="#544E45" fontFamily="sans-serif" fontSize="6.5">
          Authorized Custodian
        </text>

        {/* Sealed Stamp */}
        <rect x="75" y="104" width="52" height="20" rx="2" fill="#E27D60" fillOpacity="0.15" stroke="#E27D60" strokeWidth="1" />
        <text x="82" y="117" fill="#B84E34" fontFamily="monospace" fontSize="7.5" fontWeight="bold">
          APPROVED
        </text>
      </g>
    </svg>
  );
};

