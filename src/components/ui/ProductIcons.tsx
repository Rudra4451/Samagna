'use client';

import React, { useState } from 'react';

export interface ProductIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * 1. Mahua Flower Icon (Dried Mahua Flowers / Madhuca longifolia)
 * Distinctive 6-petal bloom with central receptacle and stamens
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
    aria-label="Dried Mahua Flower"
    {...props}
  >
    <circle cx="24" cy="24" r="5" />
    <circle cx="24" cy="24" r="1.5" fill="currentColor" />
    <path d="M21.5 19.2C19.8 14.5 20.5 8 24 7C27.5 8 28.2 14.5 26.5 19.2" />
    <path d="M27.8 20.8C32.4 17.5 38.6 15.6 40.5 18.8C42.4 22 37.8 26.5 32.8 25.8" />
    <path d="M27.2 27.2C30.2 31.5 33.8 37 31 39.5C28.2 42 24.5 36.8 24.2 31.8" />
    <path d="M20.8 27.2C17.8 31.5 14.2 37 17 39.5C19.8 42 23.5 36.8 23.8 31.8" />
    <path d="M20.2 20.8C15.6 17.5 9.4 15.6 7.5 18.8C5.6 22 10.2 26.5 15.2 25.8" />
    <path d="M24 14V11" />
    <path d="M33 21L36 20" />
    <path d="M30 31L32 34" />
    <path d="M18 31L16 34" />
    <path d="M15 21L12 20" />
  </svg>
);

/**
 * 2. Sal Seed Icon (Sal Tree Seeds / Shorea robusta)
 * Winged fruit with elongated calyx lobes
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
    aria-label="Sal Seed"
    {...props}
  >
    <path d="M20 34C20 31.5 21.8 29.5 24 29.5C26.2 29.5 28 31.5 28 34C28 37.5 26.2 40.5 24 40.5C21.8 40.5 20 37.5 20 34Z" />
    <path d="M24 34V39" />
    <path d="M24 29.5V7C24 7 21 12 22 22" />
    <path d="M24 7C24 7 27 12 26 22" />
    <path d="M21.5 30C16 27 10 20 9 12C12 12.5 17 18 21.5 26" />
    <path d="M12 15C14.5 19 17 22.5 20 25.5" />
    <path d="M26.5 30C32 27 38 20 39 12C36 12.5 31 18 26.5 26" />
    <path d="M36 15C33.5 19 31 22.5 28 25.5" />
  </svg>
);

/**
 * 3. Kendu Leaf Icon (Kendu Leaves / Diospyros melanoxylon)
 * Broad ovate leathery leaf with prominent lateral venation
 */
export const KenduLeafIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Kendu Leaf"
    {...props}
  >
    <path d="M24 6C15 12 12 24 16 34C18 38 22 41 24 42C26 41 30 38 32 34C36 24 33 12 24 6Z" />
    <path d="M24 6V42" />
    <path d="M24 14C20 16 16 20 15 24" />
    <path d="M24 22C20 25 18 29 17 33" />
    <path d="M24 14C28 16 32 20 33 24" />
    <path d="M24 22C28 25 30 29 31 33" />
  </svg>
);

/**
 * 4. Seeded Tamarind Pod Icon (Tamarindus indica)
 * Curved segmented pod with distinct seed bulges
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
    aria-label="Seeded Tamarind"
    {...props}
  >
    <path d="M10 10C12 12 14 14 15 16" />
    <path d="M13 8C14 11 13 13 12 15" />
    <path d="M15 16C17 14 21 13 24 15C27 17 28 21 31 22C34 23 38 22 40 25C42 28 41 33 38 36C35 39 30 40 26 39C21 38 18 33 16 30C14 27 12 21 15 16Z" />
    <path d="M22 17C21 21 21 26 23 30" />
    <path d="M30 23C29 27 29 32 31 36" />
    <path d="M26 24C27 25 28 27 28 29" />
  </svg>
);

/**
 * 5. De-seeded Tamarind Pulp Icon (Processed Tamarind Cake / Brick)
 */
export const DeseededTamarindIcon: React.FC<ProductIconProps> = ({
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
    aria-label="De-seeded Tamarind"
    {...props}
  >
    <path d="M12 16L36 12L38 32L14 36Z" />
    <path d="M14 22L36 18" />
    <path d="M14 28L37 24" />
    <path d="M24 14V34" />
    <circle cx="28" cy="26" r="2" />
    <circle cx="20" cy="22" r="1.5" />
  </svg>
);

/**
 * 6. Harida Fruit Icon (Terminalia chebula / Myrobalan)
 * Ribbed ellipsoid drupe with longitudinal ridges
 */
export const HaridaFruitIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Harida Fruit"
    {...props}
  >
    <path d="M24 8C18 12 16 20 16 28C16 34 19 39 24 41C29 39 32 34 32 28C32 20 30 12 24 8Z" />
    <path d="M24 8V41" />
    <path d="M20 12C18 18 18 26 21 34" />
    <path d="M28 12C30 18 30 26 27 34" />
    <path d="M24 8V5" />
  </svg>
);

/**
 * 7. Bahada Fruit Icon (Terminalia bellirica / Baheda)
 * Subglobose velutinous drupe with rounded apex
 */
export const BahadaFruitIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Bahada Fruit"
    {...props}
  >
    <circle cx="24" cy="26" r="14" />
    <path d="M24 12V7" />
    <path d="M21 7H27" />
    <path d="M16 22C19 21 21 23 24 23C27 23 29 21 32 22" />
    <path d="M14 28C18 31 22 31 24 31C26 31 30 31 34 28" />
  </svg>
);

/**
 * 8. Amla Fruit Icon (Phyllanthus emblica / Indian Gooseberry)
 * Globular fruit with 6 vertical faint striations
 */
export const AmlaFruitIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Amla Fruit"
    {...props}
  >
    <circle cx="24" cy="25" r="15" />
    <path d="M24 10C21 15 20 20 20 25C20 30 21 35 24 40" />
    <path d="M24 10C27 15 28 20 28 25C28 30 27 35 24 40" />
    <path d="M24 10V6" />
    <circle cx="24" cy="25" r="1.5" />
  </svg>
);

/**
 * 9. Karanja Seed Icon (Millettia pinnata / Pongamia pinnata)
 * Flattened elliptical seed pod
 */
export const KaranjaSeedIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Karanja Seed"
    {...props}
  >
    <path d="M12 28C10 22 14 14 24 12C34 10 38 18 36 24C34 30 28 36 20 36C14 36 13 32 12 28Z" />
    <path d="M17 18C22 17 30 18 32 23" />
    <path d="M20 26C24 25 28 26 30 29" />
  </svg>
);

/**
 * 10. Kusum Seed Icon (Schleichera oleosa)
 * Ovoid crustaceous seed with pointed beak
 */
export const KusumSeedIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Kusum Seed"
    {...props}
  >
    <path d="M24 8L28 15C32 20 34 26 32 32C30 38 26 41 24 41C22 41 18 38 16 32C14 26 16 20 20 15L24 8Z" />
    <circle cx="24" cy="27" r="4" />
    <path d="M24 14V21" />
  </svg>
);

/**
 * 11. Neem Seed Icon (Azadirachta indica)
 * Elongated smooth drupe seed
 */
export const NeemSeedIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Neem Seed"
    {...props}
  >
    <path d="M24 8C19 14 17 22 19 30C21 38 24 40 24 40C24 40 27 38 29 30C31 22 29 14 24 8Z" />
    <path d="M24 8V40" />
    <path d="M21 20C22 24 22 28 21 32" />
  </svg>
);

/**
 * 12. Char Seed / Chironji Icon (Buchanania lanzan)
 * Small lentil-like round seed nut
 */
export const CharSeedIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Char Seed Chironji"
    {...props}
  >
    <circle cx="20" cy="26" r="9" />
    <circle cx="31" cy="22" r="7" />
    <path d="M17 22C19 20 22 20 24 22" />
    <path d="M28 19C29 18 32 18 33 20" />
  </svg>
);

/**
 * 13. Hill Broom Grass Icon (Thysanolaena latifolia)
 * Bundle of reed culms tied at base with feathery panicle
 */
export const HillBroomIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Hill Broom Grass"
    {...props}
  >
    <path d="M20 42L22 28L14 10" />
    <path d="M24 42L24 28L24 7" />
    <path d="M28 42L26 28L34 10" />
    <path d="M18 16L24 12L30 16" />
    <path d="M16 22L24 18L32 22" />
    <rect x="20" y="32" width="8" height="4" rx="1" />
  </svg>
);

/**
 * 14. Wild Honey Icon (Apis dorsata / Forest Rock Bee Honey)
 * Hexagonal honeycomb geometry with drop
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
    aria-label="Wild Honey"
    {...props}
  >
    <path d="M24 7L30 10.5V17.5L24 21L18 17.5V10.5L24 7Z" />
    <path d="M14 18L20 21.5V28.5L14 32L8 28.5V21.5L14 18Z" />
    <path d="M34 18L40 21.5V28.5L34 32L28 28.5V21.5L34 18Z" />
    <path d="M24 24C24 24 29 31 29 34.5C29 37.5 26.8 40 24 40C21.2 40 19 37.5 19 34.5C19 31 24 24 24 24Z" />
    <path d="M22 34C22 33 22.5 31.5 24 30" />
  </svg>
);

/**
 * 15. Natural Lac Resin Icon (Kerria lacca)
 * Twig encrusted with crystalline lac resin nodules
 */
export const LacIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Natural Lac Resin"
    {...props}
  >
    <path d="M8 40L40 8" />
    <circle cx="20" cy="28" r="4" />
    <circle cx="28" cy="20" r="5" />
    <circle cx="34" cy="14" r="3" />
    <circle cx="15" cy="33" r="3" />
  </svg>
);

/**
 * 16. Shikakai Pod Icon (Senegalia rugata / Acacia concinna)
 * Wrinkled constricted saponin pod
 */
export const ShikakaiIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Shikakai Pods"
    {...props}
  >
    <path d="M12 36C14 34 14 30 16 28C18 26 20 26 22 22C24 18 24 14 28 12C32 10 36 12 38 14C40 18 36 22 34 26C32 30 30 32 26 36C22 40 18 40 14 38C12 37 11 36 12 36Z" />
    <path d="M18 28C19 29 20 31 20 33" />
    <path d="M26 22C27 23 28 25 28 27" />
    <path d="M32 16C33 17 34 19 34 21" />
  </svg>
);

/**
 * 17. Dhataki Flower Icon (Woodfordia fruticosa / Fire-flame bush)
 * Tubular curved scarlet calyx with protruding stamens
 */
export const DhatakiFlowerIcon: React.FC<ProductIconProps> = ({
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
    aria-label="Dhataki Flower"
    {...props}
  >
    <path d="M14 36C18 30 22 24 28 18C32 14 38 12 40 14C42 16 38 22 34 26C28 32 22 36 16 40C14 41 12 40 12 38C12 37 13 36 14 36Z" />
    <path d="M38 14L43 9" />
    <path d="M40 16L44 14" />
    <path d="M36 12L39 7" />
    <circle cx="43" cy="9" r="1" fill="currentColor" />
    <circle cx="44" cy="14" r="1" fill="currentColor" />
  </svg>
);

/**
 * Map product slug or name to authentic photographic picture asset
 */
export function getProductImagePath(product: string): string {
  const norm = (product || '').toLowerCase();

  // 1. Compound species with variants
  if (norm.includes('deseeded') || norm.includes('de-seeded') || norm.includes('ମଞ୍ଜି ବିହୀନ')) {
    return '/products/tamarind-deseeded.jpg';
  }
  if (norm.includes('tamarind') || norm.includes('tentuli') || norm.includes('ତେନ୍ତୁଳି')) {
    return '/products/tamarind-seeded.jpg';
  }

  // 2. Bahada must be checked BEFORE Harida because Bahada's catalog name is
  // "Bahada Fruit (Belleric Myrobalan)", which would otherwise match generic "myrobalan".
  if (norm.includes('bahada') || norm.includes('bellirica') || norm.includes('belleric') || norm.includes('baheda') || norm.includes('ବାହାଡ଼ା')) {
    return '/products/bahada.jpg';
  }
  if (norm.includes('harida') || norm.includes('chebula') || norm.includes('chebulic') || norm.includes('ହରିଡ଼ା')) {
    return '/products/harida.jpg';
  }

  // 3. Other distinct Minor Forest Produce species
  if (norm.includes('mahua') || norm.includes('mahul') || norm.includes('madhuca') || norm.includes('ମହୁଲ')) {
    return '/products/mahua.jpg';
  }
  // Use boundary check so "wholesale" / "sale" does not false-positive match "sal"
  if (/\b(sal|shorea)\b/i.test(norm) || norm.includes('sal-seeds') || norm.includes('sal tree') || norm.includes('ଶାଳ')) {
    return '/products/sal-seeds.jpg';
  }
  if (norm.includes('kendu') || norm.includes('diospyros') || norm.includes('କେନ୍ଦୁ')) {
    return '/products/kendu-leaves.jpg';
  }
  if (norm.includes('amla') || norm.includes('emblica') || norm.includes('gooseberry') || norm.includes('ଅଁଳା')) {
    return '/products/amla.jpg';
  }
  if (norm.includes('karanja') || norm.includes('pinnata') || norm.includes('pongamia') || norm.includes('କରଞ୍ଜ')) {
    return '/products/karanja-seeds.jpg';
  }
  if (norm.includes('kusum') || norm.includes('schleichera') || norm.includes('କୁସୁମ')) {
    return '/products/kusum-seeds.jpg';
  }
  if (norm.includes('neem') || norm.includes('azadirachta') || norm.includes('ନିମ୍ବ')) {
    return '/products/neem-seeds.jpg';
  }
  // Use boundary check so "discharge" / "character" does not false-positive match "char"
  if (/\b(char|chironji)\b/i.test(norm) || norm.includes('char-seeds') || norm.includes('buchanania') || norm.includes('ଚାର')) {
    return '/products/char-seeds.jpg';
  }
  if (norm.includes('broom') || norm.includes('thysanolaena') || norm.includes('jhadu') || norm.includes('ଝାଡ଼ୁ')) {
    return '/products/hill-broom.jpg';
  }
  if (norm.includes('honey') || norm.includes('apis') || norm.includes('ଜଙ୍ଗଲୀ ମହୁ') || norm.includes('ମହୁ')) {
    return '/products/wild-honey.jpg';
  }
  // Use boundary check so "place" / "necklace" does not false-positive match "lac"
  if (/\b(lac|lakh)\b/i.test(norm) || norm.includes('sticklac') || norm.includes('kerria') || norm.includes('ଲାଖ')) {
    return '/products/lac.jpg';
  }
  if (norm.includes('shikakai') || norm.includes('concinna') || norm.includes('senegalia') || norm.includes('ଶିକାକାଇ')) {
    return '/products/shikakai.jpg';
  }
  if (norm.includes('dhataki') || norm.includes('woodfordia') || norm.includes('ଧାତକୀ')) {
    return '/products/dhataki.jpg';
  }

  return '/products/mahua.jpg';
}

/**
 * Botanical Vector Symbol Selector (for icons/badges)
 */
export const ProductSymbol: React.FC<{ product: string; size?: number; className?: string }> = ({
  product,
  size = 48,
  className = '',
}) => {
  const norm = (product || '').toLowerCase();

  if (norm.includes('deseeded') || norm.includes('de-seeded') || norm.includes('ମଞ୍ଜି ବିହୀନ')) {
    return <DeseededTamarindIcon size={size} className={className} />;
  }
  if (norm.includes('tamarind') || norm.includes('tentuli') || norm.includes('ତେନ୍ତୁଳି')) {
    return <TamarindIcon size={size} className={className} />;
  }

  // Bahada checked before Harida
  if (norm.includes('bahada') || norm.includes('bellirica') || norm.includes('belleric') || norm.includes('baheda') || norm.includes('ବାହାଡ଼ା')) {
    return <BahadaFruitIcon size={size} className={className} />;
  }
  if (norm.includes('harida') || norm.includes('chebula') || norm.includes('chebulic') || norm.includes('ହରିଡ଼ା')) {
    return <HaridaFruitIcon size={size} className={className} />;
  }

  if (norm.includes('mahua') || norm.includes('mahul') || norm.includes('madhuca') || norm.includes('ମହୁଲ')) {
    return <MahuaFlowerIcon size={size} className={className} />;
  }
  if (/\b(sal|shorea)\b/i.test(norm) || norm.includes('sal-seeds') || norm.includes('sal tree') || norm.includes('ଶାଳ')) {
    return <SalSeedIcon size={size} className={className} />;
  }
  if (norm.includes('kendu') || norm.includes('diospyros') || norm.includes('କେନ୍ଦୁ')) {
    return <KenduLeafIcon size={size} className={className} />;
  }
  if (norm.includes('amla') || norm.includes('emblica') || norm.includes('gooseberry') || norm.includes('ଅଁଳା')) {
    return <AmlaFruitIcon size={size} className={className} />;
  }
  if (norm.includes('karanja') || norm.includes('pinnata') || norm.includes('pongamia') || norm.includes('କରଞ୍ଜ')) {
    return <KaranjaSeedIcon size={size} className={className} />;
  }
  if (norm.includes('kusum') || norm.includes('schleichera') || norm.includes('କୁସୁମ')) {
    return <KusumSeedIcon size={size} className={className} />;
  }
  if (norm.includes('neem') || norm.includes('azadirachta') || norm.includes('ନିମ୍ବ')) {
    return <NeemSeedIcon size={size} className={className} />;
  }
  if (/\b(char|chironji)\b/i.test(norm) || norm.includes('char-seeds') || norm.includes('buchanania') || norm.includes('ଚାର')) {
    return <CharSeedIcon size={size} className={className} />;
  }
  if (norm.includes('broom') || norm.includes('thysanolaena') || norm.includes('jhadu') || norm.includes('ଝାଡ଼ୁ')) {
    return <HillBroomIcon size={size} className={className} />;
  }
  if (norm.includes('honey') || norm.includes('apis') || norm.includes('ଜଙ୍ଗଲୀ ମହୁ') || norm.includes('ମହୁ')) {
    return <HoneyIcon size={size} className={className} />;
  }
  if (/\b(lac|lakh)\b/i.test(norm) || norm.includes('sticklac') || norm.includes('kerria') || norm.includes('ଲାଖ')) {
    return <LacIcon size={size} className={className} />;
  }
  if (norm.includes('shikakai') || norm.includes('concinna') || norm.includes('senegalia') || norm.includes('ଶିକାକାଇ')) {
    return <ShikakaiIcon size={size} className={className} />;
  }
  if (norm.includes('dhataki') || norm.includes('woodfordia') || norm.includes('ଧାତକୀ')) {
    return <DhatakiFlowerIcon size={size} className={className} />;
  }

  // Default to Mahua flower as representative MFP
  return <MahuaFlowerIcon size={size} className={className} />;
};

/**
 * Universal Product Visual: Displays the original authentic photograph of the product by default,
 * with automated graceful fallback to botanical line symbol if image loading fails.
 */
export interface ProductVisualProps {
  product: string;
  size?: number;
  className?: string;
  variant?: 'photo' | 'symbol';
  alt?: string;
}

export const ProductIcon: React.FC<ProductVisualProps> = ({
  product,
  size = 48,
  className = '',
  variant = 'photo',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const imagePath = getProductImagePath(product);

  if (variant === 'photo' && !hasError) {
    return (
      <img
        src={imagePath}
        alt={alt || `${product} authentic product photo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`object-cover rounded-[3px] select-none inline-block shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
      />
    );
  }

  return <ProductSymbol product={product} size={size} className={className} />;
};

export const ProductImage = ProductIcon;
