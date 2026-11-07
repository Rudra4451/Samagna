'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Scale,
  Truck,
  ArrowRight,
  Search,
  Menu,
  X,
  Lock,
  Layers,
  Building2,
  Briefcase,
  Store,
  Factory,
  BarChart3,
  BadgeCheck,
  Package,
  AlertCircle,
  ExternalLink,
  Sparkles,
  FileText,
} from 'lucide-react';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { ForestHarvestIllustration } from '@/components/illustrations/ForestHarvestIllustration';
import { TransitWaybillIllustration } from '@/components/illustrations/TransitWaybillIllustration';
import { WarehouseDepotIllustration } from '@/components/illustrations/WarehouseDepotIllustration';
import { TradeFulfillmentIllustration } from '@/components/illustrations/TradeFulfillmentIllustration';
import { BatchJourneyDiagram } from '@/components/illustrations/BatchJourneyDiagram';

interface ProduceItem {
  id: string;
  nameEnglish: string;
  nameOdia: string;
  scientificName: string;
  harvestSeason: string;
  packaging: string;
  benchmarkRatePerKg: number;
  imagePath: string;
  description: string;
}

const FEATURED_PRODUCE: ProduceItem[] = [
  {
    id: 'mahua',
    nameEnglish: 'Dried Mahua Flowers',
    nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    harvestSeason: 'March – May',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 42,
    imagePath: '/products/mahua.jpg',
    description: 'Dawn-collected fallen wild flowers sun-dried on clean mats to maintain natural sugar content.',
  },
  {
    id: 'sal-seeds',
    nameEnglish: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    harvestSeason: 'May – July',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 20,
    imagePath: '/products/sal-seeds.jpg',
    description: 'Wild forest seeds gathered in Similipal buffer tracts. Wing husks removed before weighment.',
  },
  {
    id: 'char-seeds',
    nameEnglish: 'Chironji / Char Seeds',
    nameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    harvestSeason: 'April – June',
    packaging: '25kg Poly Bag',
    benchmarkRatePerKg: 120,
    imagePath: '/products/char-seeds.jpg',
    description: 'High-value botanical nut sorted and sealed to preserve kernel freshness and colour.',
  },
  {
    id: 'harida',
    nameEnglish: 'Harida / Chebulic Myrobalan',
    nameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    harvestSeason: 'November – February',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 25,
    imagePath: '/products/harida.jpg',
    description: 'Traditional pharmacopeia fruit gathered mature from forest floor and graded by flesh density.',
  },
  {
    id: 'wild-honey',
    nameEnglish: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ମହୁ',
    scientificName: 'Apis dorsata comb nectar',
    harvestSeason: 'April – June',
    packaging: 'Food-grade 20L Jerry Can',
    benchmarkRatePerKg: 225,
    imagePath: '/products/wild-honey.jpg',
    description: 'Raw cliff honey filtered through coarse cotton and sealed immediately without thermal processing.',
  },
  {
    id: 'tamarind',
    nameEnglish: 'Seeded Tamarind',
    nameOdia: 'ତେନ୍ତୁଳି (ମଞ୍ଜି ସହିତ)',
    scientificName: 'Tamarindus indica',
    harvestSeason: 'January – April',
    packaging: '50kg Jute Gunny Bag',
    benchmarkRatePerKg: 36,
    imagePath: '/products/tamarind-seeded.jpg',
    description: 'De-shelled mature wild tamarind cured under direct sunlight and consolidated in solid blocks.',
  },
];

export default function PublicLandingPage() {
  const router = useRouter();
  const [selectedProduce, setSelectedProduce] = useState<ProduceItem>(FEATURED_PRODUCE[0]);
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = batchCodeInput.trim().replace(/^#/, '').toUpperCase();
    if (!clean) {
      setSearchError('Enter a valid batch code, such as BS-402 or BS-400.');
      return;
    }
    setSearchError('');
    router.push(`/verify/${clean}`);
  };

  const handleQuickCode = (code: string) => {
    const clean = code.replace(/^#/, '').toUpperCase();
    setBatchCodeInput(clean);
    router.push(`/verify/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[#FFFAF2] text-[#1F1A14] font-sans selection:bg-[#F5E6CC] selection:text-[#2D4F1E] antialiased">
      {/* 1. EDITORIAL HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#FFFAF2]/95 backdrop-blur-md border-b border-[#D7D2C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Samagna Home">
            <SamagnaLogo variant="forest" size="md" showTagline />
          </Link>

          {/* Desktop Nav Anchors */}
          <nav className="hidden md:flex items-center space-x-7 text-[13px] font-sans font-medium text-[#4A4A4A]">
            <a
              href="#operations"
              onClick={(e) => handleSmoothScroll(e, 'operations')}
              className="hover:text-[#2D4F1E] transition-colors"
            >
              Operations (B2G)
            </a>
            <a
              href="#trade"
              onClick={(e) => handleSmoothScroll(e, 'trade')}
              className="hover:text-[#2D4F1E] transition-colors"
            >
              Trade &amp; Store
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              className="hover:text-[#2D4F1E] transition-colors"
            >
              Value Chain
            </a>
            <a
              href="#traceability"
              onClick={(e) => handleSmoothScroll(e, 'traceability')}
              className="hover:text-[#2D4F1E] transition-colors"
            >
              Traceability
            </a>
            <a
              href="#about"
              onClick={(e) => handleSmoothScroll(e, 'about')}
              className="hover:text-[#2D4F1E] transition-colors"
            >
              Governance
            </a>
          </nav>

          {/* Action Triggers */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/verify"
              className="px-3.5 py-2 text-xs font-sans font-semibold text-[#1F1A14] border border-[#D7D2C8] rounded-[6px] bg-white hover:bg-[#F5E6CC]/40 transition-colors shadow-2xs"
            >
              Verify Batch
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-sans font-semibold text-white bg-[#2D4F1E] rounded-[6px] hover:bg-[#203a15] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Lock size={13} className="text-[#E27D60]" />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button (High-Contrast, Min 44x44px Touch Target) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden min-h-[44px] min-w-[44px] p-2.5 text-[#1F1A14] bg-white hover:bg-[#F5E6CC]/40 rounded-[6px] border border-[#D7D2C8] flex items-center justify-center transition-all active:scale-95 shadow-2xs"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu with Generous Touch Targets */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-[#D7D2C8] bg-[#FFFAF2] px-4 py-4 space-y-3.5 shadow-md animate-in fade-in duration-150">
            <nav className="flex flex-col space-y-1 text-sm font-sans font-medium text-[#1F1A14]">
              <a
                href="#operations"
                onClick={(e) => handleSmoothScroll(e, 'operations')}
                className="py-2.5 px-3 rounded-[4px] hover:bg-[#F5E6CC]/40 hover:text-[#2D4F1E] flex items-center justify-between"
              >
                <span>Operations (B2G)</span>
                <ArrowRight size={14} className="text-[#544E45]" />
              </a>
              <a
                href="#trade"
                onClick={(e) => handleSmoothScroll(e, 'trade')}
                className="py-2.5 px-3 rounded-[4px] hover:bg-[#F5E6CC]/40 hover:text-[#2D4F1E] flex items-center justify-between"
              >
                <span>Trade &amp; Store</span>
                <ArrowRight size={14} className="text-[#544E45]" />
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
                className="py-2.5 px-3 rounded-[4px] hover:bg-[#F5E6CC]/40 hover:text-[#2D4F1E] flex items-center justify-between"
              >
                <span>Value Chain Process</span>
                <ArrowRight size={14} className="text-[#544E45]" />
              </a>
              <a
                href="#traceability"
                onClick={(e) => handleSmoothScroll(e, 'traceability')}
                className="py-2.5 px-3 rounded-[4px] hover:bg-[#F5E6CC]/40 hover:text-[#2D4F1E] flex items-center justify-between"
              >
                <span>Batch Verification Dossier</span>
                <ArrowRight size={14} className="text-[#544E45]" />
              </a>
              <a
                href="#about"
                onClick={(e) => handleSmoothScroll(e, 'about')}
                className="py-2.5 px-3 rounded-[4px] hover:bg-[#F5E6CC]/40 hover:text-[#2D4F1E] flex items-center justify-between"
              >
                <span>Governance &amp; Statutory LABHA</span>
                <ArrowRight size={14} className="text-[#544E45]" />
              </a>
            </nav>

            <div className="pt-3 border-t border-[#D7D2C8] grid grid-cols-2 gap-2.5">
              <Link
                href="/verify"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-sans font-semibold text-[#1F1A14] border border-[#D7D2C8] rounded-[6px] bg-white hover:bg-[#F5E6CC]/40 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Search size={14} className="text-[#2D4F1E]" />
                <span>Verify Batch</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-sans font-semibold text-white bg-[#2D4F1E] hover:bg-[#203a15] rounded-[6px] flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Lock size={13} className="text-[#E27D60]" />
                <span>Sign In (12 Roles)</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. HERO: EDITORIAL ART-DIRECTED POSITIONING & VISUAL PRODUCT SHOWCASE */}
        <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-[#D7D2C8] bg-gradient-to-b from-[#FFFAF2] via-[#F5E6CC]/25 to-[#FFFAF2] relative overflow-hidden">
          {/* Subtle Organic Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-[#E27D60]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D7D2C8] text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#2D4F1E] mb-5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#E27D60] animate-pulse" aria-hidden="true" />
              <span>FOREST PRODUCE. CONNECTED.</span>
            </div>

            {/* Headline in Fraunces Variable Serif */}
            <h1 className="font-serif text-3xl xs:text-4xl sm:text-6xl md:text-7xl font-normal text-[#1F1A14] tracking-tight leading-[1.08] text-balance max-w-4xl mx-auto">
              From the forest <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#2D4F1E]">to the marketplace.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-5 text-sm sm:text-base md:text-lg text-[#4A4A4A] max-w-2xl mx-auto leading-relaxed font-sans text-balance">
              Manage forest-produce operations and connect businesses to sourcing opportunities through one platform.
            </p>

            {/* Primary Action Buttons (Clean Sans-Serif, 44px+ Accessible Touch Height, Modern Radii) */}
            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-xl mx-auto">
              <a
                href="#operations"
                onClick={(e) => handleSmoothScroll(e, 'operations')}
                className="whitespace-nowrap px-6 py-3.5 bg-[#2D4F1E] text-white text-sm font-sans font-semibold rounded-[6px] hover:bg-[#203a15] transition-all flex items-center justify-center gap-2.5 shadow-xs hover:shadow-sm active:scale-[0.98]"
              >
                <Building2 size={16} className="text-[#E27D60]" />
                <span>Explore Operations</span>
                <ArrowRight size={14} />
              </a>
              <Link
                href="/trade"
                className="whitespace-nowrap px-6 py-3.5 bg-white text-[#1F1A14] border border-[#D7D2C8] text-sm font-sans font-semibold rounded-[6px] hover:bg-[#F5E6CC]/40 transition-all flex items-center justify-center gap-2.5 shadow-xs hover:shadow-sm active:scale-[0.98]"
              >
                <Briefcase size={16} className="text-[#2D4F1E]" />
                <span>Explore Marketplace</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Statutory Guarantee Badge */}
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-sans font-medium text-[#544E45]">
              <span className="w-2 h-2 rounded-full bg-[#2E5C2D]" />
              <span>Statutory Protection: 100% Minimum Support Price (MSP) DBT to Primary Gatherers</span>
            </div>

            {/* Visual Hero Composition: Forest Produce Photography + Live Operational Interface Preview */}
            <div className="mt-10 sm:mt-14 rounded-[8px] border border-[#D7D2C8] bg-white overflow-hidden shadow-card text-left">
              {/* Header Chrome */}
              <div className="bg-[#25351F] text-[#F5E6CC] px-4 py-3 flex items-center justify-between text-xs font-sans border-b border-[#2D4F1E]">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E27D60]" />
                  <span className="font-bold tracking-wide text-white">SAMAGNA VALUE-CHAIN ENGINE</span>
                  <span className="text-white/40 hidden sm:inline">·</span>
                  <span className="text-[#F5E6CC]/80 hidden sm:inline font-medium">Odisha LABHA Scheme Corridor</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 text-white bg-[#2E5C2D] px-2.5 py-1 rounded-[4px] font-sans font-semibold shadow-2xs">
                    <CheckCircle2 size={12} className="text-[#F5E6CC]" />
                    <span>Real-Time Custody</span>
                  </span>
                </div>
              </div>

              {/* Grid: Authentic Produce Photo (Left) + Interactive Live Digital Passport & Scale Preview (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#D7D2C8]">
                {/* Left (5 cols): Authentic Produce Photographic Plate */}
                <div className="md:col-span-5 p-4 sm:p-6 bg-[#FFFAF2] flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="relative h-44 sm:h-52 w-full rounded-[6px] overflow-hidden border border-[#D7D2C8] bg-cream/40 shadow-2xs print:h-44 print:overflow-hidden">
                      <Image
                        src="/products/mahua.jpg"
                        alt="Wild Mahua Flowers gathered in Similipal Forest"
                        fill
                        className="object-cover object-center print:!static print:!h-44 print:!w-full"
                        sizes="(max-width: 768px) 100vw, 40vw"
                        priority
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#25351F]/90 backdrop-blur-xs text-[#FFFAF2] px-2.5 py-1 rounded-[3px] font-sans font-semibold text-[10px] tracking-wide">
                        Botanical Harvest
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 bg-white/95 text-[#2D4F1E] px-2.5 py-1 rounded-[3px] font-sans text-[10px] font-bold border border-[#D7D2C8] shadow-2xs">
                        Similipal Forest Tracts
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-sans">
                        <span className="font-odia text-[#E27D60] font-bold">ଶୁଖିଲା ମହୁଲ ଫୁଲ</span>
                        <span className="text-[#544E45] italic font-medium">Madhuca longifolia</span>
                      </div>
                      <div className="font-serif text-xl font-semibold text-[#1F1A14] mt-1">
                        Dried Mahua Flowers
                      </div>
                      <p className="text-xs text-[#4A4A4A] mt-1.5 leading-relaxed font-sans">
                        Dawn-collected wild fallen flowers sun-dried on organic mats. Zero chemical preservatives.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#D7D2C8]/70 flex items-center justify-between text-xs font-sans">
                    <span className="text-[#544E45]">Statutory MSP Benchmark:</span>
                    <span className="text-[#2D4F1E] font-bold text-sm font-mono">₹42.00 / kg</span>
                  </div>
                </div>

                {/* Right (7 cols): Live Operational & Market Interface Preview */}
                <div className="md:col-span-7 p-4 sm:p-6 bg-white flex flex-col justify-between space-y-4">
                  {/* Step Sequence Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#D7D2C8] text-xs font-sans">
                    <div className="flex items-center gap-2 font-bold text-[#1F1A14]">
                      <Scale size={15} className="text-[#2D4F1E]" />
                      <span>Digital Lot Passport: <span className="font-mono text-[#2D4F1E]">#BS-402</span></span>
                    </div>
                    <span className="px-2.5 py-1 rounded-[3px] bg-[#2E5C2D]/10 text-[#2E5C2D] font-bold text-[11px] uppercase border border-[#2E5C2D]/20">
                      Verified Saleable
                    </span>
                  </div>

                  {/* Operational Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-[4px] bg-[#FFFAF2] border border-[#D7D2C8]/70">
                      <div className="text-[10px] uppercase font-sans font-semibold text-[#544E45] tracking-wide">Gross Intake</div>
                      <div className="text-[#1F1A14] font-bold font-mono text-sm mt-0.5">52.40 kg</div>
                      <div className="text-[10px] font-sans text-[#544E45] mt-0.5">Tare: 2.40 kg</div>
                    </div>
                    <div className="p-3 rounded-[4px] bg-[#FFFAF2] border border-[#D7D2C8]/70">
                      <div className="text-[10px] uppercase font-sans font-semibold text-[#544E45] tracking-wide">Net Accepted</div>
                      <div className="text-[#2D4F1E] font-bold font-mono text-sm mt-0.5">50.00 kg</div>
                      <div className="text-[10px] font-sans text-[#2E5C2D] font-medium mt-0.5">100% Payout OK</div>
                    </div>
                    <div className="p-3 rounded-[4px] bg-[#FFFAF2] border border-[#D7D2C8]/70 col-span-2 sm:col-span-1">
                      <div className="text-[10px] uppercase font-sans font-semibold text-[#544E45] tracking-wide">Depôt Reweigh</div>
                      <div className="text-[#1F1A14] font-bold font-mono text-sm mt-0.5">49.25 kg</div>
                      <div className="text-[10px] font-sans text-[#2E5C2D] font-medium mt-0.5">1.5% Loss Allowable</div>
                    </div>
                  </div>

                  {/* Flow Connection Visual */}
                  <div className="p-3.5 rounded-[6px] bg-[#F5E6CC]/30 border border-[#D7D2C8] text-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans font-semibold text-[#2D4F1E]">
                      <span className="flex items-center gap-1.5">
                        <Truck size={14} className="text-[#E27D60]" />
                        <span>Karanjia Center → Baripada Central Depôt</span>
                      </span>
                      <span className="text-[#544E45] font-mono font-normal text-[11px]">Waybill #WB-8841</span>
                    </div>
                    <div className="w-full bg-[#D7D2C8] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#2D4F1E] h-full w-full rounded-full transition-all" />
                    </div>
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#544E45]">Primary Gatherer: <strong className="text-ink">Sunita Soren</strong> (OR-MBJ-0842)</span>
                      <span className="text-[#2E5C2D] font-bold font-mono">₹2,100.00 DBT Credited</span>
                    </div>
                  </div>

                  {/* Callout action row */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans">
                    <Link
                      href="/verify/BS-402"
                      className="text-[#2D4F1E] hover:underline font-bold flex items-center gap-1 text-xs"
                    >
                      <span>Inspect Live Audit Dossier →</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login?redirect=/collection"
                        className="px-3.5 py-1.5 bg-[#25351F] text-[#F5E6CC] hover:bg-black rounded-[4px] text-xs font-semibold transition-colors shadow-2xs"
                      >
                        Operations View
                      </Link>
                      <Link
                        href="/trade"
                        className="px-3.5 py-1.5 bg-white border border-[#D7D2C8] text-[#1F1A14] hover:bg-cream/40 rounded-[4px] text-xs font-semibold transition-colors shadow-2xs"
                      >
                        Trade View
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TWO CLEAR PATHWAYS (CORE CONVERSION SECTION) */}
        <section className="py-12 sm:py-20 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-[#E27D60]">
                PURPOSE-BUILT WORKSPACES
              </span>
              <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2 text-balance">
                Two Dedicated Platform Pathways
              </h2>
              <p className="text-xs sm:text-sm text-[#4A4A4A] mt-2 font-sans text-balance">
                Tailored interfaces designed specifically for government operational governance and commercial trade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Pathway 1: Operations */}
              <div
                id="operations"
                className="scroll-mt-24 sm:scroll-mt-28 p-5 sm:p-8 md:p-10 rounded-[8px] border border-[#25351F] bg-[#25351F] text-[#FFFAF2] flex flex-col justify-between relative overflow-hidden shadow-card"
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#F5E6CC] text-xs font-sans font-semibold uppercase tracking-wider mb-4 sm:mb-5 border border-white/10">
                    <Building2 size={14} className="text-[#E27D60]" />
                    <span>EXPERIENCE A · OPERATIONS (B2G)</span>
                  </div>
                  <h3 className="font-serif text-2xl xs:text-3xl font-normal text-white tracking-tight text-balance">
                    For Institutions &amp; Field Teams
                  </h3>
                  <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-[#F5E6CC]/80 leading-relaxed font-sans">
                    Government institutions, procurement agencies and operational teams managing digital intake and custody.
                  </p>

                  {/* Visual Capability Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-5 text-xs font-sans font-medium">
                    <div className="p-2.5 rounded-[4px] bg-white/10 border border-white/10 flex items-center gap-2">
                      <Scale size={15} className="text-[#E27D60] shrink-0" />
                      <span>Procurement &amp; Scales</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white/10 border border-white/10 flex items-center gap-2">
                      <Truck size={15} className="text-[#E27D60] shrink-0" />
                      <span>Collection &amp; Waybills</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white/10 border border-white/10 flex items-center gap-2">
                      <Layers size={15} className="text-[#E27D60] shrink-0" />
                      <span>Warehouse &amp; Depôt</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white/10 border border-white/10 flex items-center gap-2">
                      <ShieldCheck size={15} className="text-[#E27D60] shrink-0" />
                      <span>Chain-of-Custody</span>
                    </div>
                  </div>

                  {/* Visual Operational Flow Preview */}
                  <div className="mt-5 p-3 rounded-[6px] bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#F5E6CC] font-semibold flex items-center gap-1.5">
                        <Scale size={13} className="text-[#E27D60]" />
                        <span>Village Scale → Central Depôt Verification</span>
                      </span>
                      <span className="text-[#E27D60] font-mono text-[11px] font-bold">100% MSP DBT</span>
                    </div>
                    <div className="text-[11px] text-[#F5E6CC]/70 font-sans leading-relaxed">
                      Instant biometric-free weighing, gross-minus-tare Odia audio slip, and statutory moisture shrinkage tolerance.
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90 font-sans">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Calibrated gross-minus-tare scales with voice guidance and Odia audio slips.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90 font-sans">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Depôt arrival reweighing with statutory 1.5% natural moisture loss benchmarks.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90 font-sans">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>State government service proposals, deliverable tracking, and fixed-fee invoicing.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90 font-sans">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Discrepancy quarantine triage safeguarding primary collector entitlements.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 relative z-10">
                  <span className="text-xs font-sans text-[#F5E6CC]/70">
                    Roles: Collector · Facilitator · Depôt Custodian · DPO
                  </span>
                  <Link
                    href="/login?redirect=/collection"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#F5E6CC] text-[#25351F] hover:bg-white text-xs font-sans font-bold rounded-[6px] transition-colors text-center shadow-2xs"
                  >
                    <span>Explore Operations →</span>
                  </Link>
                </div>
              </div>

              {/* Pathway 2: Trade & Store */}
              <div
                id="trade"
                className="scroll-mt-24 sm:scroll-mt-28 p-5 sm:p-8 md:p-10 rounded-[8px] border border-[#D7D2C8] bg-[#FFFAF2] text-[#1F1A14] flex flex-col justify-between relative overflow-hidden shadow-card"
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E27D60]/10 text-[#B84E34] text-xs font-sans font-semibold uppercase tracking-wider mb-4 sm:mb-5 border border-[#E27D60]/20">
                    <Briefcase size={14} className="text-[#E27D60]" />
                    <span>EXPERIENCE B · TRADE &amp; STORE</span>
                  </div>
                  <h3 className="font-serif text-2xl xs:text-3xl font-normal text-[#1F1A14] tracking-tight text-balance">
                    For Businesses &amp; Wholesale Buyers
                  </h3>
                  <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                    Buyers, wholesalers, manufacturers, processors and authorised suppliers sourcing certified botanicals.
                  </p>

                  {/* Visual Capability Badges */}
                  <div className="grid grid-cols-2 gap-2 mt-5 text-xs font-sans font-medium">
                    <div className="p-2.5 rounded-[4px] bg-white border border-[#D7D2C8] flex items-center gap-2 shadow-2xs">
                      <Package size={15} className="text-[#2D4F1E] shrink-0" />
                      <span>Certified Lots</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white border border-[#D7D2C8] flex items-center gap-2 shadow-2xs">
                      <Building2 size={15} className="text-[#2D4F1E] shrink-0" />
                      <span>Verified Suppliers</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white border border-[#D7D2C8] flex items-center gap-2 shadow-2xs">
                      <FileText size={15} className="text-[#2D4F1E] shrink-0" />
                      <span>Bulk RFQs &amp; Orders</span>
                    </div>
                    <div className="p-2.5 rounded-[4px] bg-white border border-[#D7D2C8] flex items-center gap-2 shadow-2xs">
                      <Store size={15} className="text-[#2D4F1E] shrink-0" />
                      <span>Direct Forest Store</span>
                    </div>
                  </div>

                  {/* Visual Trade Flow Preview */}
                  <div className="mt-5 p-3 rounded-[6px] bg-white border border-[#D7D2C8] space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-[#1F1A14] font-semibold flex items-center gap-1.5">
                        <Briefcase size={13} className="text-[#2D4F1E]" />
                        <span>Live Lot Discovery → Structured RFQ → Fulfillment</span>
                      </span>
                      <span className="text-[#2D4F1E] font-mono text-[11px] font-bold">17 MFP Listed</span>
                    </div>
                    <div className="text-[11px] text-[#4A4A4A] font-sans leading-relaxed">
                      Audited provenance dossiers, competitive counter-offers, milling network matching, and door-to-door freight manifests.
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14] font-sans">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Direct wholesale procurement of lab-tested minor forest produce with provenance.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14] font-sans">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Structured RFQs, competitive supplier bidding, and commercial purchase orders.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14] font-sans">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Processing network matching for primary deseeding, milling, and oil extraction.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14] font-sans">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Curated forest consumer store for purity-certified honey, herbs, and resins.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 pt-5 border-t border-[#D7D2C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 relative z-10">
                  <span className="text-xs font-sans text-[#544E45]">
                    Channels: B2B Trade · Processing · Forest Store
                  </span>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Link
                      href="/trade"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2D4F1E] text-white hover:bg-[#203a15] text-xs font-sans font-bold rounded-[6px] transition-colors text-center shadow-2xs"
                    >
                      <span>Explore Marketplace →</span>
                    </Link>
                    <Link
                      href="/store"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-[#1F1A14] border border-[#D7D2C8] hover:bg-[#F5E6CC]/40 text-xs font-sans font-bold rounded-[6px] transition-colors text-center shadow-2xs"
                    >
                      <span>Forest Store</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW SAMAGNA WORKS: SOURCE -> MANAGE -> VERIFY -> CONNECT */}
        <section id="how-it-works" className="scroll-mt-24 sm:scroll-mt-28 py-12 sm:py-20 border-b border-[#D7D2C8] bg-[#F5E6CC]/25">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-[#E27D60]">
                AUDITABLE VALUE CHAIN
              </span>
              <h2 className="font-serif text-2xl xs:text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2 text-balance">
                How Samagna Works
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#4A4A4A] font-sans text-balance">
                Source → Manage → Verify → Connect: A verified sequence from primary gatherer intake to enterprise trade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {/* Step 1: Source */}
              <div className="p-5 bg-white rounded-[8px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between hover:border-[#2D4F1E]/60 transition-all">
                <div className="space-y-3">
                  <div className="rounded-[6px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2] shadow-2xs">
                    <ForestHarvestIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E] tracking-wide">01 · SOURCE</span>
                    <span className="text-[11px] font-medium bg-[#2D4F1E]/10 text-[#2D4F1E] px-2 py-0.5 rounded-[3px]">Primary Intake</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Source &amp; Weigh
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Collectors deliver wild harvest at village hubs. Calibrated digital scales log gross weight, tare deduction, and Odia audio receipts.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#D7D2C8]/50 text-xs font-sans text-[#2D4F1E] font-semibold flex items-center justify-between">
                  <span>Direct Payout</span>
                  <span className="font-mono text-[#2E5C2D] font-bold">100% MSP DBT</span>
                </div>
              </div>

              {/* Step 2: Manage */}
              <div className="p-5 bg-white rounded-[8px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between hover:border-[#2D4F1E]/60 transition-all">
                <div className="space-y-3">
                  <div className="rounded-[6px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2] shadow-2xs">
                    <TransitWaybillIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E] tracking-wide">02 · MANAGE</span>
                    <span className="text-[11px] font-medium bg-[#2D4F1E]/10 text-[#2D4F1E] px-2 py-0.5 rounded-[3px]">Custody Dispatch</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Tag &amp; Manage
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Consolidated 50kg bags receive weatherproof stencils and tamper-evident zip seals before dispatch with digital transit waybills.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#D7D2C8]/50 text-xs font-sans text-[#2D4F1E] font-semibold flex items-center justify-between">
                  <span>Bag Security</span>
                  <span className="text-[#2D4F1E] font-medium">QR Digital Seal</span>
                </div>
              </div>

              {/* Step 3: Verify */}
              <div className="p-5 bg-white rounded-[8px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between hover:border-[#2D4F1E]/60 transition-all">
                <div className="space-y-3">
                  <div className="rounded-[6px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2] shadow-2xs">
                    <WarehouseDepotIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E] tracking-wide">03 · VERIFY</span>
                    <span className="text-[11px] font-medium bg-[#2D4F1E]/10 text-[#2D4F1E] px-2 py-0.5 rounded-[3px]">Depôt Triage</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Verify &amp; Reweigh
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Arrival at Baripada Central Depôt validates transit evaporation against the 1.5% natural shrinkage benchmark. Unreconciled losses trigger quarantine.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#D7D2C8]/50 text-xs font-sans text-[#2D4F1E] font-semibold flex items-center justify-between">
                  <span>Moisture Tolerance</span>
                  <span className="font-mono text-[#2D4F1E] font-bold">1.5% Loss Max</span>
                </div>
              </div>

              {/* Step 4: Connect */}
              <div className="p-5 bg-white rounded-[8px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between hover:border-[#2D4F1E]/60 transition-all">
                <div className="space-y-3">
                  <div className="rounded-[6px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2] shadow-2xs">
                    <TradeFulfillmentIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-sans text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E] tracking-wide">04 · CONNECT</span>
                    <span className="text-[11px] font-medium bg-[#E27D60]/10 text-[#B84E34] px-2 py-0.5 rounded-[3px]">Commercial Trade</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Connect &amp; Trade
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Verified botanical lots match wholesale B2B tenders, regional milling facilities, and direct consumer forest store orders.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-[#D7D2C8]/50 text-xs font-sans text-[#2D4F1E] font-semibold flex items-center justify-between">
                  <span>Marketplace</span>
                  <span className="text-[#2D4F1E] font-medium">Enterprise PO</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. PLATFORM CAPABILITIES BY SUITE */}
        <section className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-[#E27D60]">
                PLATFORM MODULES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2">
                Capabilities by Operational Suite
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Suite A: Operations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D7D2C8]">
                  <div className="font-serif text-xl font-semibold text-[#2D4F1E]">
                    Operations Suite (Institutional B2G)
                  </div>
                  <Link
                    href="/login?redirect=/institutional"
                    className="text-xs font-sans font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1"
                  >
                    <span>Operations Login</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    href="/collection"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Scale size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Desk</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Collection Center Hub</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Scale intake, gross-minus-tare slips, bag tagging, waybills.
                    </div>
                  </Link>

                  <Link
                    href="/inventory"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Layers size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Ledger</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Warehouse Bays</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Depôt reweigh, moisture shrinkage, storage bays, quarantine triage.
                    </div>
                  </Link>

                  <Link
                    href="/institutional"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Building2 size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">B2G</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Institutional Contracts</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Department agreements, SLA deliverables, scheduled invoicing.
                    </div>
                  </Link>

                  <Link
                    href="/reports"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Audit</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">BI &amp; Audit Dossiers</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Chain-of-custody exports, statutory reports, CSV/PDF packages.
                    </div>
                  </Link>
                </div>
              </div>

              {/* Suite B: Marketplace */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#D7D2C8]">
                  <div className="font-serif text-xl font-semibold text-[#2D4F1E]">
                    Marketplace Suite (Commercial)
                  </div>
                  <Link
                    href="/trade"
                    className="text-xs font-sans font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1"
                  >
                    <span>Wholesale Trade</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    href="/trade"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">B2B</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Wholesale B2B Trade</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Certified lot discovery, RFQs, competitive bids, purchase orders.
                    </div>
                  </Link>

                  <Link
                    href="/processing"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Factory size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Milling</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Processing Network</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Deseeding plants, oil milling facilities, yield reconciliation.
                    </div>
                  </Link>

                  <Link
                    href="/logistics"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Truck size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Transit</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Logistics &amp; Freight</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Carrier coordination, dispatch manifests, proof-of-delivery.
                    </div>
                  </Link>

                  <Link
                    href="/store"
                    className="p-4 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-all block group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Store size={18} className="text-[#2D4F1E]" />
                      <span className="text-[11px] font-sans font-semibold text-[#544E45] px-1.5 py-0.5 rounded-[3px] bg-white border border-[#D7D2C8]">Retail</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Samagna Forest Store</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed font-sans">
                      Direct-to-consumer store with verified origin storytelling.
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. AUTHENTIC BOTANICAL PRODUCE PHOTOGRAPHY */}
        <section className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-[#F5E6CC]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-[#E27D60]">
                DOCUMENTED COMMODITIES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2">
                Wild Forest Produce Catalogue
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#4A4A4A] font-sans">
                Authentic minor forest produce documented across Mayurbhanj tribal collection centres under the LABHA scheme.
              </p>
            </div>

            {/* Produce Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_PRODUCE.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[8px] border border-[#D7D2C8] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#2D4F1E] transition-all"
                >
                  <div>
                    {/* Authentic Photo */}
                    <div className="relative h-48 w-full bg-[#F5E6CC]/40 overflow-hidden print:h-48 print:overflow-hidden">
                      <Image
                        src={item.imagePath}
                        alt={item.nameEnglish}
                        fill
                        className="object-cover object-center transition-transform hover:scale-105 duration-300 print:!static print:!h-48 print:!w-full"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-[#25351F]/90 backdrop-blur-xs text-[#FFFAF2] font-sans font-semibold text-[11px] px-2.5 py-1 rounded-[4px] shadow-2xs">
                        ₹{item.benchmarkRatePerKg}/kg MSP
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-odia text-[#E27D60] font-bold">
                          {item.nameOdia}
                        </span>
                        <span className="text-xs font-sans text-[#544E45] font-medium">
                          {item.harvestSeason}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                        {item.nameEnglish}
                      </h3>
                      <p className="text-xs font-serif italic text-[#544E45]">
                        {item.scientificName}
                      </p>

                      <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans pt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-[#D7D2C8]/60 flex items-center justify-between text-xs font-sans">
                      <span className="text-[#544E45]">{item.packaging}</span>
                      <Link
                        href="/trade"
                        className="text-[#2D4F1E] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>Trade RFQ</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. TRACEABILITY & SPECIMEN VERIFICATION (WITH BATCH JOURNEY DIAGRAM) */}
        <section id="traceability" className="scroll-mt-24 sm:scroll-mt-28 py-16 sm:py-24 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Traceability Concept & Form */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <span className="text-xs font-sans font-bold uppercase tracking-[0.14em] text-[#E27D60]">
                    PUBLIC PROVENANCE &amp; TRANSPARENCY
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2">
                    Every Bag Has an Immutable Record
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                  Physical bag stencils link directly to tamper-evident scale weighments and depôt receipts. Anyone can
                  verify the authentic tribal origin while personal gatherer identities remain strictly protected.
                </p>

                {/* Stencil Search Form */}
                <form onSubmit={handleVerifySubmit} className="space-y-3 pt-1">
                  <label htmlFor="stencil-search-input" className="block text-xs font-sans font-semibold text-[#1F1A14]">
                    Enter Batch Code or Stencil Tag:
                  </label>
                  <div className="relative">
                    <input
                      id="stencil-search-input"
                      type="text"
                      value={batchCodeInput}
                      onChange={(e) => setBatchCodeInput(e.target.value)}
                      placeholder="e.g. BS-402 or BS-400"
                      className="w-full h-11 px-3.5 pl-9 text-sm font-sans border border-[#D7D2C8] rounded-[6px] bg-[#FFFAF2] text-[#1F1A14] focus:outline-none focus:border-[#2D4F1E]"
                    />
                    <Search size={16} className="absolute left-3 top-3.5 text-[#544E45]" />
                  </div>

                  {searchError && (
                    <div className="text-xs text-red-600 flex items-center gap-1 font-sans">
                      <AlertCircle size={14} />
                      <span>{searchError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-xs font-sans">
                    <span className="text-[#544E45]">Try specimen:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickCode('BS-402')}
                      className="px-2.5 py-1 rounded-[4px] border border-[#D7D2C8] bg-white hover:bg-[#F5E6CC] text-[#2D4F1E] font-bold font-mono text-xs shadow-2xs"
                    >
                      #BS-402
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCode('BS-400')}
                      className="px-2.5 py-1 rounded-[4px] border border-[#D7D2C8] bg-white hover:bg-[#F5E6CC] text-[#2D4F1E] font-bold font-mono text-xs shadow-2xs"
                    >
                      #BS-400
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#2D4F1E] text-white text-xs font-sans font-bold rounded-[6px] hover:bg-[#203a15] transition-colors flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <span>Verify a Batch →</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Specimen Card (#BS-402) */}
              <div className="lg:col-span-7">
                <div className="p-4 sm:p-6 md:p-7 rounded-[8px] border border-[#D7D2C8] bg-[#FFFAF2] space-y-4 shadow-card">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D7D2C8]">
                    <div>
                      <div className="text-[11px] font-sans uppercase font-medium text-[#544E45]">Specimen Batch Passport</div>
                      <div className="font-serif text-xl sm:text-2xl font-bold text-[#1F1A14]">BATCH <span className="font-mono">#BS-402</span></div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-[4px] bg-[#2E5C2D]/15 text-[#2E5C2D] text-xs font-sans font-bold border border-[#2E5C2D]/30 shadow-2xs">
                      <BadgeCheck size={15} />
                      <span>VERIFIED SALEABLE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Produce</div>
                      <div className="text-[#1F1A14] font-bold font-sans mt-0.5">Dried Mahua Flowers</div>
                    </div>
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Origin</div>
                      <div className="text-[#1F1A14] font-bold font-sans mt-0.5">Karanjia, Mayurbhanj</div>
                    </div>
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Gatherers</div>
                      <div className="text-[#1F1A14] font-bold font-sans mt-0.5">4 Tribal Members</div>
                    </div>
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Field Intake</div>
                      <div className="text-[#1F1A14] font-bold font-mono mt-0.5">100.00 kg Net</div>
                    </div>
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Depôt Arrival</div>
                      <div className="text-[#1F1A14] font-bold font-mono mt-0.5">98.50 kg Net</div>
                    </div>
                    <div className="p-3 bg-white rounded-[6px] border border-[#D7D2C8]/60 shadow-2xs">
                      <div className="text-[#544E45] text-[10px] uppercase font-sans font-semibold">Shrinkage</div>
                      <div className="text-[#2E5C2D] font-bold font-mono mt-0.5">1.50 kg (1.50%)</div>
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <Link
                      href="/verify/BS-402"
                      className="text-xs font-sans font-bold text-[#2D4F1E] hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Full Dossier Record (#BS-402) →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Interactive Batch Journey Diagram Component */}
            <div className="pt-4">
              <BatchJourneyDiagram activeStep={1} />
            </div>
          </div>
        </section>

        {/* 8. INSTITUTIONAL & BUSINESS ENGAGEMENT */}
        <section id="about" className="scroll-mt-24 sm:scroll-mt-28 py-12 sm:py-20 border-b border-[#D7D2C8] bg-[#F5E6CC]/25">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Institutional Card */}
              <div className="p-5 sm:p-8 md:p-10 rounded-[8px] border border-[#D7D2C8] bg-white space-y-4 shadow-card">
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#E27D60]">
                  PUBLIC SECTOR &amp; GOVERNMENT
                </span>
                <h3 className="font-serif text-xl xs:text-2xl font-normal text-[#1F1A14]">
                  Institutional Operations &amp; Governance
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                  Deployed under the ST &amp; SC Development Department, Government of Odisha, and TDCCOL. Primary
                  collectors access the platform free of charge under the statutory Odisha LABHA scheme with zero deductions.
                </p>
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <Link
                    href="/login?redirect=/collection"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D4F1E] text-white text-xs font-sans font-bold rounded-[6px] hover:bg-[#203a15] transition-colors shadow-2xs"
                  >
                    <span>Explore Operations →</span>
                  </Link>
                  <Link
                    href="/institutional"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D7D2C8] text-[#1F1A14] text-xs font-sans font-bold rounded-[6px] hover:bg-[#F5E6CC]/40 transition-colors shadow-2xs"
                  >
                    <span>Contact Samagna</span>
                  </Link>
                </div>
              </div>

              {/* Commercial Card */}
              <div className="p-5 sm:p-8 md:p-10 rounded-[8px] border border-[#D7D2C8] bg-white space-y-4 shadow-card">
                <span className="text-xs font-sans font-bold uppercase tracking-wider text-[#E27D60]">
                  COMMERCIAL BUYERS &amp; PROCESSORS
                </span>
                <h3 className="font-serif text-xl xs:text-2xl font-normal text-[#1F1A14]">
                  Commercial Sourcing Desk
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                  Ayurvedic manufacturers, pharmaceutical companies, and bulk buyers can source laboratory-screened forest
                  lots with documented custody, transparent pricing, and structured RFQs.
                </p>
                <div className="pt-2 flex flex-wrap gap-2.5">
                  <Link
                    href="/trade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D4F1E] text-white text-xs font-sans font-bold rounded-[6px] hover:bg-[#203a15] transition-colors shadow-2xs"
                  >
                    <span>Explore Marketplace →</span>
                  </Link>
                  <Link
                    href="/trade"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#D7D2C8] text-[#1F1A14] text-xs font-sans font-bold rounded-[6px] hover:bg-[#F5E6CC]/40 transition-colors shadow-2xs"
                  >
                    <span>Business Enquiry</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. MINIMAL SITEMAP FOOTER */}
      <footer className="bg-[#25351F] text-[#F5E6CC] text-xs font-sans py-14 border-t border-[#D7D2C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/10">
            <div>
              <SamagnaLogo variant="dark" size="md" showTagline />
              <p className="mt-2 text-xs text-[#F5E6CC]/70 font-sans">
                Minor Forest Produce Custody, Traceability &amp; Trade Infrastructure · Mayurbhanj District, Odisha
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-xs font-medium text-[#F5E6CC]">
              <a
                href="#operations"
                onClick={(e) => handleSmoothScroll(e, 'operations')}
                className="hover:text-white transition-colors"
              >
                Operations
              </a>
              <Link href="/trade" className="hover:text-white transition-colors">
                Marketplace
              </Link>
              <Link href="/verify" className="hover:text-white transition-colors">
                Batch Verification
              </Link>
              <Link href="/store" className="hover:text-white transition-colors">
                Forest Store
              </Link>
              <Link href="/demo?demo=1" className="hover:text-white transition-colors">
                Demo Walkthrough
              </Link>
              <Link href="/login" className="hover:text-[#E27D60] font-bold transition-colors">
                Sign In (12 Roles)
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-[#F5E6CC]/70">
            <div>
              Tribal Development Co-operative Corporation of Odisha (TDCCOL) · LABHA Scheme
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E27D60]" />
              <span className="font-semibold text-white">Forest · Value · Prosperity · ସମଗ୍ନ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
