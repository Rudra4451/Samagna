import React from 'react';

interface ProductIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Mahua Flower Icon (48x48 mono-line, stroke 1.5)
 * Distinctive 6-petal rounded bloom of Madhuca longifolia with central stamens
 */
export const MahuaFlowerIcon: React.FC<ProductIconProps> = ({
  size = 48,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Mahua Flower icon"
    {...props}
  >
    {/* Central Receptacle */}
    <circle cx="24" cy="24" r="5" />
    <circle cx="24" cy="24" r="1.5" fill="currentColor" />

    {/* Top Petal */}
    <path d="M21.5 19.2C19.8 14.5 20.5 8 24 7C27.5 8 28.2 14.5 26.5 19.2" />

    {/* Top Right Petal */}
    <path d="M27.8 20.8C32.4 17.5 38.6 15.6 40.5 18.8C42.4 22 37.8 26.5 32.8 25.8" />

    {/* Bottom Right Petal */}
    <path d="M27.2 27.2C30.2 31.5 33.8 37 31 39.5C28.2 42 24.5 36.8 24.2 31.8" />

    {/* Bottom Left Petal */}
    <path d="M20.8 27.2C17.8 31.5 14.2 37 17 39.5C19.8 42 23.5 36.8 23.8 31.8" />

    {/* Top Left Petal */}
    <path d="M20.2 20.8C15.6 17.5 9.4 15.6 7.5 18.8C5.6 22 10.2 26.5 15.2 25.8" />

    {/* Subtle Stamen Accents */}
    <path d="M24 14V11" />
    <path d="M33 21L36 20" />
    <path d="M30 31L32 34" />
    <path d="M18 31L16 34" />
    <path d="M15 21L12 20" />
  </svg>
);

/**
 * Sal Seed Icon (48x48 mono-line, stroke 1.5)
 * Characteristic winged fruit of Shorea robusta (sal tree) with wing-like calyx lobes
 */
export const SalSeedIcon: React.FC<ProductIconProps> = ({
  size = 48,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Sal Seed icon"
    {...props}
  >
    {/* Oval Base Seed Nut */}
    <path d="M20 34C20 31.5 21.8 29.5 24 29.5C26.2 29.5 28 31.5 28 34C28 37.5 26.2 40.5 24 40.5C21.8 40.5 20 37.5 20 34Z" />
    <path d="M24 34V39" />

    {/* Center Wing (Tallest) */}
    <path d="M24 29.5V7C24 7 21 12 22 22" />
    <path d="M24 7C24 7 27 12 26 22" />

    {/* Left Wing */}
    <path d="M21.5 30C16 27 10 20 9 12C12 12.5 17 18 21.5 26" />
    <path d="M12 15C14.5 19 17 22.5 20 25.5" />

    {/* Right Wing */}
    <path d="M26.5 30C32 27 38 20 39 12C36 12.5 31 18 26.5 26" />
    <path d="M36 15C33.5 19 31 22.5 28 25.5" />
  </svg>
);

/**
 * Tamarind Pod Icon (48x48 mono-line, stroke 1.5)
 * Curved segmented pod with seed bulges and stalk
 */
export const TamarindIcon: React.FC<ProductIconProps> = ({
  size = 48,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Tamarind icon"
    {...props}
  >
    {/* Stalk */}
    <path d="M10 10C12 12 14 14 15 16" />
    <path d="M13 8C14 11 13 13 12 15" />

    {/* Curved Segmented Pod Body */}
    <path d="M15 16C17 14 21 13 24 15C27 17 28 21 31 22C34 23 38 22 40 25C42 28 41 33 38 36C35 39 30 40 26 39C21 38 18 33 16 30C14 27 12 21 15 16Z" />

    {/* Inner Segment Curves */}
    <path d="M22 17C21 21 21 26 23 30" />
    <path d="M30 23C29 27 29 32 31 36" />
    <path d="M26 24C27 25 28 27 28 29" />
  </svg>
);

/**
 * Wild Honey Icon (48x48 mono-line, stroke 1.5)
 * Natural honeycomb cell pattern with a pure amber honey drop
 */
export const HoneyIcon: React.FC<ProductIconProps> = ({
  size = 48,
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-label="Wild Honey icon"
    {...props}
  >
    {/* Top Honeycomb Hexagon */}
    <path d="M24 7L30 10.5V17.5L24 21L18 17.5V10.5L24 7Z" />

    {/* Left Honeycomb Hexagon */}
    <path d="M14 18L20 21.5V28.5L14 32L8 28.5V21.5L14 18Z" />

    {/* Right Honeycomb Hexagon */}
    <path d="M34 18L40 21.5V28.5L34 32L28 28.5V21.5L34 18Z" />

    {/* Central Honey Droplet */}
    <path d="M24 24C24 24 29 31 29 34.5C29 37.5 26.8 40 24 40C21.2 40 19 37.5 19 34.5C19 31 24 24 24 24Z" />
    <path d="M22 34C22 33 22.5 31.5 24 30" />
  </svg>
);

/**
 * Universal Product Icon Selector
 */
export interface ProductVisualProps extends ProductIconProps {
  product: 'mahua' | 'sal' | 'tamarind' | 'honey' | string;
}

export const ProductIcon: React.FC<ProductVisualProps> = ({
  product,
  size = 48,
  className = '',
  ...props
}) => {
  const normalized = product.toLowerCase();

  if (normalized.includes('mahua')) {
    return <MahuaFlowerIcon size={size} className={className} {...props} />;
  }
  if (normalized.includes('sal')) {
    return <SalSeedIcon size={size} className={className} {...props} />;
  }
  if (normalized.includes('tamarind')) {
    return <TamarindIcon size={size} className={className} {...props} />;
  }
  if (normalized.includes('honey')) {
    return <HoneyIcon size={size} className={className} {...props} />;
  }

  // Default to Mahua flower as representative MFP
  return <MahuaFlowerIcon size={size} className={className} {...props} />;
};
