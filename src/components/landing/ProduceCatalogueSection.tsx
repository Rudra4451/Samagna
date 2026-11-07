'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Scale, Check } from 'lucide-react';

interface BotanicalProduce {
  id: string;
  nameEnglish: string;
  nameOdia: string;
  scientificName: string;
  category: 'oilseed' | 'medicinal' | 'honey' | 'tamarind';
  harvestSeason: string;
  packaging: string;
  benchmarkRatePerKg: number;
  imagePath: string;
  description: string;
  qualitySpecs: string;
}

const PRODUCE_LIST: BotanicalProduce[] = [
  {
    id: 'mahua',
    nameEnglish: 'Dried Mahua Flowers',
    nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    category: 'medicinal',
    harvestSeason: 'March – May',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 42,
    imagePath: '/products/mahua.jpg',
    description: 'Dawn-collected fallen wild flowers sun-dried on clean organic mats to preserve natural sugar and fragrance.',
    qualitySpecs: 'Moisture < 12% · Non-fermented',
  },
  {
    id: 'sal-seeds',
    nameEnglish: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    category: 'oilseed',
    harvestSeason: 'May – July',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 20,
    imagePath: '/products/sal-seeds.jpg',
    description: 'Forest-floor collected seeds from Similipal buffer tracts. Wing husks manually removed before certified weighment.',
    qualitySpecs: 'Oil content > 18% · De-winged',
  },
  {
    id: 'char-seeds',
    nameEnglish: 'Chironji / Char Seeds',
    nameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    category: 'oilseed',
    harvestSeason: 'April – June',
    packaging: '25kg Poly Bag',
    benchmarkRatePerKg: 120,
    imagePath: '/products/char-seeds.jpg',
    description: 'High-value wild kernel gathered from deciduous hillsides. Hand-depulped and sun-cured to protect delicate oil integrity.',
    qualitySpecs: 'Intact kernels · No thermal treatment',
  },
  {
    id: 'wild-honey',
    nameEnglish: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ମହୁ',
    scientificName: 'Apis dorsata comb nectar',
    category: 'honey',
    harvestSeason: 'April – June',
    packaging: 'Food-grade 20L Jerry Can',
    benchmarkRatePerKg: 225,
    imagePath: '/products/wild-honey.jpg',
    description: 'Raw cliff honey gathered using nocturnal smoke repellents. Coarse filtered through organic cotton without heat.',
    qualitySpecs: 'Unpasteurized · Raw active enzymes',
  },
  {
    id: 'harida',
    nameEnglish: 'Harida / Chebulic Myrobalan',
    nameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    category: 'medicinal',
    harvestSeason: 'November – February',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 25,
    imagePath: '/products/harida.jpg',
    description: 'Traditional Ayurvedic botanical gathered mature from forest floor. Graded by pericarp density and kernel dryness.',
    qualitySpecs: 'Graded by density · Sun-cured',
  },
  {
    id: 'tamarind',
    nameEnglish: 'Seeded Wild Tamarind',
    nameOdia: 'ତେନ୍ତୁଳି (ମଞ୍ଜି ସହିତ)',
    scientificName: 'Tamarindus indica',
    category: 'tamarind',
    harvestSeason: 'January – April',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 36,
    imagePath: '/products/tamarind-seeded.jpg',
    description: 'De-shelled wild tamarind consolidated in solid sun-cured cakes. Acidic purity tested before warehouse aggregation.',
    qualitySpecs: 'Tartaric acid > 10% · Salt-free',
  },
];

type CategoryFilter = 'all' | 'oilseed' | 'medicinal' | 'honey' | 'tamarind';

export const ProduceCatalogueSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredProduce =
    activeCategory === 'all'
      ? PRODUCE_LIST
      : PRODUCE_LIST.filter((p) => p.category === activeCategory);

  return (
    <section id="catalogue" className="scroll-mt-header py-16 sm:py-24 bg-warm-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-mono font-bold uppercase tracking-wider text-forest mb-3">
              <span>STATUTORY LABHA BENCHMARK RATE CARD</span>
            </div>
            <h2 className="font-serif type-h1 font-normal text-ink tracking-tight text-balance">
              17 Verified Minor Forest Produce Botanicals
            </h2>
            <p className="mt-3 type-body text-ink-muted font-sans text-balance">
              All produce is procured under the Odisha Government LABHA scheme at guaranteed statutory floor rates with
              zero scale deductions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/trade"
              className="touch-target px-5 py-2.5 bg-forest text-white text-xs font-sans font-semibold rounded-[6px] hover:bg-forest-hover transition-all flex items-center gap-2 shadow-2xs"
            >
              <span>Wholesale Tender Lots</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter botanicals by category"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar"
        >
          {[
            { id: 'all', label: 'All Botanicals (17)' },
            { id: 'oilseed', label: 'Oilseeds & Kernels' },
            { id: 'medicinal', label: 'Medicinal Flowers & Fruit' },
            { id: 'honey', label: 'Raw Cliff Honey' },
            { id: 'tamarind', label: 'Wild Tamarind' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeCategory === tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as CategoryFilter)}
              className={`touch-target px-4 py-2 rounded-[6px] text-xs font-sans font-medium transition-all whitespace-nowrap border ${
                activeCategory === tab.id
                  ? 'bg-forest text-white border-forest shadow-xs'
                  : 'bg-white text-ink border-soft-border hover:bg-cream/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Produce Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProduce.map((produce) => (
            <div
              key={produce.id}
              className="flex flex-col justify-between rounded-[10px] border border-soft-border bg-white overflow-hidden shadow-card hover:shadow-elevated transition-all duration-200 group"
            >
              <div>
                {/* Photo Aspect Ratio Container */}
                <div className="relative aspect-[4/3] w-full bg-cream/40 overflow-hidden border-b border-soft-border">
                  <Image
                    src={produce.imagePath}
                    alt={produce.nameEnglish}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-canopy/90 backdrop-blur-xs text-warm-white px-2.5 py-1 rounded-[4px] font-mono font-bold text-[11px] tracking-wide">
                    Similipal Biosphere
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 text-forest px-2.5 py-1 rounded-[4px] font-sans font-semibold text-xs border border-soft-border shadow-2xs">
                    {produce.harvestSeason}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-odia text-terracotta-deep font-bold" lang="or">
                      {produce.nameOdia}
                    </span>
                    <span className="text-ink-muted italic font-medium">{produce.scientificName}</span>
                  </div>

                  <h3 className="font-serif type-h3 font-semibold text-ink group-hover:text-forest transition-colors">
                    {produce.nameEnglish}
                  </h3>

                  <p className="type-body text-ink-muted text-[13px] leading-relaxed font-sans line-clamp-2">
                    {produce.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-ink-muted border-t border-soft-border/60">
                    <span>{produce.packaging}</span>
                    <span className="text-forest font-semibold">{produce.qualitySpecs}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Rate & Order Trigger */}
              <div className="p-5 sm:p-6 pt-0 border-t border-soft-border/60 mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">Statutory Floor</div>
                  <div className="font-mono text-xl font-bold text-ink">
                    ₹{produce.benchmarkRatePerKg.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-ink-muted">/ kg</span>
                  </div>
                </div>
                <Link
                  href={`/trade`}
                  className="touch-target px-4 py-2 bg-cream text-forest hover:bg-forest hover:text-white border border-soft-border transition-colors rounded-[6px] font-sans font-semibold text-xs flex items-center gap-1.5"
                >
                  <span>RFQ Bidding</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
