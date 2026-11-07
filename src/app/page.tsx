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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Samagna Home">
            <SamagnaLogo variant="forest" size="md" showTagline />
          </Link>

          {/* Desktop Nav Anchors */}
          <nav className="hidden md:flex items-center space-x-7 text-[13px] font-sans font-medium text-[#4A4A4A]">
            <a href="#operations" className="hover:text-[#2D4F1E] transition-colors">
              Operations (B2G)
            </a>
            <a href="#trade" className="hover:text-[#2D4F1E] transition-colors">
              Trade &amp; Store
            </a>
            <a href="#how-it-works" className="hover:text-[#2D4F1E] transition-colors">
              Value Chain
            </a>
            <a href="#traceability" className="hover:text-[#2D4F1E] transition-colors">
              Traceability
            </a>
            <a href="#about" className="hover:text-[#2D4F1E] transition-colors">
              Governance
            </a>
          </nav>

          {/* Action Triggers */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/verify"
              className="px-3.5 py-1.5 text-xs font-mono font-medium text-[#1F1A14] border border-[#D7D2C8] rounded-[4px] bg-surface hover:bg-[#F5E6CC]/40 transition-colors"
            >
              Verify Batch
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 text-xs font-sans font-semibold text-white bg-[#2D4F1E] rounded-[4px] hover:bg-[#25351F] transition-colors flex items-center gap-1.5"
            >
              <Lock size={13} className="text-[#E27D60]" />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#1F1A14] hover:bg-[#F5E6CC]/40 rounded-[4px] border border-[#D7D2C8]"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-[#D7D2C8] bg-[#FFFAF2] px-4 py-4 space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-[#4A4A4A]">
              <a
                href="#operations"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#2D4F1E]"
              >
                Operations (B2G)
              </a>
              <a
                href="#trade"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#2D4F1E]"
              >
                Trade &amp; Store
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#2D4F1E]"
              >
                Value Chain
              </a>
              <a
                href="#traceability"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#2D4F1E]"
              >
                Batch Verification
              </a>
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#2D4F1E]"
              >
                Governance
              </a>
            </nav>

            <div className="pt-2 border-t border-[#D7D2C8] flex flex-col gap-2">
              <Link
                href="/verify"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-mono font-medium text-[#1F1A14] border border-[#D7D2C8] rounded-[4px] bg-white"
              >
                Verify Batch
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold text-white bg-[#2D4F1E] rounded-[4px] flex items-center justify-center gap-1.5"
              >
                <Lock size={13} className="text-[#E27D60]" />
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. HERO: EDITORIAL ART-DIRECTED POSITIONING */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-[#D7D2C8] bg-gradient-to-b from-[#FFFAF2] via-[#F5E6CC]/30 to-[#FFFAF2] relative overflow-hidden">
          {/* Subtle Organic Background Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-[#E27D60]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[3px] bg-white border border-[#D7D2C8] text-[11px] font-mono uppercase tracking-[0.14em] text-[#2D4F1E] mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#E27D60] animate-pulse" aria-hidden="true" />
              <span>FOREST PRODUCE. CONNECTED.</span>
            </div>

            {/* Headline in Fraunces Variable Serif */}
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal text-[#1F1A14] tracking-tight leading-[1.08]">
              From the forest canopy <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#2D4F1E]">to enterprise trade.</span>
            </h1>

            {/* Supporting Copy (Clear, concise, professional) */}
            <p className="mt-6 text-base sm:text-lg text-[#4A4A4A] max-w-2xl mx-auto leading-relaxed font-sans">
              Verified minor forest produce procurement, transparent custodial tracking, and institutional B2B trade connecting tribal gatherers across Odisha directly to enterprise buyers.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <a
                href="#operations"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#2D4F1E] text-white text-xs font-mono font-semibold rounded-[4px] hover:bg-[#25351F] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Building2 size={15} className="text-[#E27D60]" />
                <span>Explore Operations</span>
              </a>
              <Link
                href="/trade"
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-[#1F1A14] border border-[#D7D2C8] text-xs font-mono font-semibold rounded-[4px] hover:bg-[#F5E6CC]/40 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Briefcase size={15} className="text-[#2D4F1E]" />
                <span>Explore Marketplace</span>
              </Link>
            </div>

            {/* Statutory Guarantee Badge */}
            <div className="mt-8 inline-flex items-center gap-2 text-[11px] font-mono text-[#544E45]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E5C2D]" />
              <span>Statutory Protection: 100% Minimum Support Price (MSP) DBT to Primary Gatherers</span>
            </div>
          </div>
        </section>

        {/* 3. TWO CLEAR PATHWAYS (CORE CONVERSION SECTION) */}
        <section className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E27D60] font-bold">
                PURPOSE-BUILT WORKSPACES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2">
                Two Dedicated Platform Pathways
              </h2>
              <p className="text-sm text-[#4A4A4A] mt-2 font-sans">
                Tailored interfaces designed specifically for government operational governance and commercial trade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pathway 1: Operations */}
              <div
                id="operations"
                className="p-8 sm:p-10 rounded-[6px] border border-[#25351F] bg-[#25351F] text-[#FFFAF2] flex flex-col justify-between relative overflow-hidden shadow-card"
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-white/10 text-[#F5E6CC] text-[11px] font-mono uppercase tracking-wider mb-5 border border-white/10">
                    <Building2 size={13} className="text-[#E27D60]" />
                    <span>EXPERIENCE A · OPERATIONS (B2G)</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight">
                    For Institutions & Field Teams
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#F5E6CC]/80 leading-relaxed font-sans">
                    Digital weighment intake, moisture grading, depôt shrinkage accounting, and B2G service deliverables under TDCCOL.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Calibrated gross-minus-tare scales with voice guidance and Odia audio slips.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Depôt arrival reweighing with statutory 1.5% natural moisture loss benchmarks.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>State government service proposals, deliverable tracking, and fixed-fee invoicing.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#FFFAF2]/90">
                      <CheckCircle2 size={16} className="text-[#E27D60] shrink-0 mt-0.5" />
                      <span>Discrepancy quarantine triage safeguarding primary collector entitlements.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <span className="text-[11px] font-mono text-[#F5E6CC]/60">
                    Roles: Collector · Facilitator · Depôt Custodian
                  </span>
                  <Link
                    href="/login?redirect=/collection"
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#F5E6CC] text-[#25351F] hover:bg-white text-xs font-mono font-bold rounded-[4px] transition-colors text-center"
                  >
                    <span>Sign In to Operations →</span>
                  </Link>
                </div>
              </div>

              {/* Pathway 2: Trade & Store */}
              <div
                id="trade"
                className="p-8 sm:p-10 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] text-[#1F1A14] flex flex-col justify-between relative overflow-hidden shadow-card"
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-[#E27D60]/10 text-[#B84E34] text-[11px] font-mono uppercase tracking-wider mb-5 border border-[#E27D60]/20 font-bold">
                    <Briefcase size={13} className="text-[#E27D60]" />
                    <span>EXPERIENCE B · TRADE &amp; STORE</span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-[#1F1A14] tracking-tight">
                    For Businesses & Wholesale Buyers
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                    Source certified botanical lots, submit formal RFQs, coordinate regional processing plants, and purchase packaged forest goods.
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14]">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Direct wholesale procurement of lab-tested minor forest produce with provenance.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14]">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Structured RFQs, competitive supplier bidding, and commercial purchase orders.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14]">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Processing network matching for primary deseeding, milling, and oil extraction.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-[#1F1A14]">
                      <CheckCircle2 size={16} className="text-[#2D4F1E] shrink-0 mt-0.5" />
                      <span>Curated forest consumer store for purity-certified honey, herbs, and resins.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#D7D2C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <span className="text-[11px] font-mono text-[#544E45]">
                    Channels: B2B Trade · Processing · Forest Store
                  </span>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Link
                      href="/trade"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-[#2D4F1E] text-white hover:bg-[#25351F] text-xs font-mono font-bold rounded-[4px] transition-colors text-center"
                    >
                      <span>Explore Trade →</span>
                    </Link>
                    <Link
                      href="/store"
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white text-[#1F1A14] border border-[#D7D2C8] hover:bg-[#F5E6CC]/40 text-xs font-mono font-bold rounded-[4px] transition-colors text-center"
                    >
                      <span>Forest Store</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW SAMAGNA WORKS: 4-STEP CONCISE FLOW (WITH CUSTOM SVG ILLUSTRATIONS) */}
        <section id="how-it-works" className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-[#F5E6CC]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E27D60] font-bold">
                AUDITABLE VALUE CHAIN
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1F1A14] mt-2">
                How Produce Moves Through Samagna
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#4A4A4A] font-sans">
                A verified sequence from primary gatherer intake to warehouse custody and enterprise delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-5 bg-white rounded-[6px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="rounded-[4px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2]">
                    <ForestHarvestIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E]">STAGE 01</span>
                    <span className="text-[11px]">Primary Intake</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Source & Weigh
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Collectors deliver wild produce at village hubs. Calibrated digital scales log gross weight, tare deduction, moisture, and audio receipts in Odia.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D7D2C8]/50 text-[11px] font-mono text-[#2D4F1E] font-semibold">
                  100% MSP DBT Disbursed
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-white rounded-[6px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="rounded-[4px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2]">
                    <TransitWaybillIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E]">STAGE 02</span>
                    <span className="text-[11px]">Custody Dispatch</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Tag & Dispatch
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Consolidated 50kg bags receive weatherproof stencils and tamper-evident zip seals before dispatch with digital transit waybills.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D7D2C8]/50 text-[11px] font-mono text-[#2D4F1E] font-semibold">
                  QR Digital Seal Sealed
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-white rounded-[6px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="rounded-[4px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2]">
                    <WarehouseDepotIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E]">STAGE 03</span>
                    <span className="text-[11px]">Depôt Triage</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Depôt Reweigh
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Arrival at Baripada Central Depôt validates transit evaporation against the 1.5% natural shrinkage benchmark. Unreconciled losses trigger quarantine.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D7D2C8]/50 text-[11px] font-mono text-[#2D4F1E] font-semibold">
                  1.5% Shrinkage Standard
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-5 bg-white rounded-[6px] border border-[#D7D2C8] space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="rounded-[4px] overflow-hidden border border-[#D7D2C8]/60 bg-[#FFFAF2]">
                    <TradeFulfillmentIllustration size={260} className="w-full h-auto" />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#544E45]">
                    <span className="font-bold text-[#2D4F1E]">STAGE 04</span>
                    <span className="text-[11px]">Commercial</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                    Trade & Fulfill
                  </h3>
                  <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans">
                    Verified lots are published for wholesale B2B tendering, processing facility matching, and direct consumer forest store orders.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D7D2C8]/50 text-[11px] font-mono text-[#2D4F1E] font-semibold">
                  Enterprise PO Issued
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. PLATFORM CAPABILITIES BY SUITE */}
        <section className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E27D60] font-bold">
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
                    className="text-xs font-mono font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1"
                  >
                    <span>Operations Login</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    href="/collection"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Scale size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Desk</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Collection Center Hub</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Scale intake, gross-minus-tare slips, bag tagging, waybills.
                    </div>
                  </Link>

                  <Link
                    href="/inventory"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Layers size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Ledger</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Warehouse Bays</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Depôt reweigh, moisture shrinkage, storage bays, quarantine triage.
                    </div>
                  </Link>

                  <Link
                    href="/institutional"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Building2 size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">B2G</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Institutional Contracts</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Department agreements, SLA deliverables, scheduled invoicing.
                    </div>
                  </Link>

                  <Link
                    href="/reports"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Audit</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">BI & Audit Dossiers</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
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
                    className="text-xs font-mono font-semibold text-[#2D4F1E] hover:underline flex items-center gap-1"
                  >
                    <span>Wholesale Trade</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    href="/trade"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">B2B</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Wholesale B2B Trade</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Certified lot discovery, RFQs, competitive bids, purchase orders.
                    </div>
                  </Link>

                  <Link
                    href="/processing"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Factory size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Milling</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Processing Network</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Deseeding plants, oil milling facilities, yield reconciliation.
                    </div>
                  </Link>

                  <Link
                    href="/logistics"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Truck size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Transit</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Logistics & Freight</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
                      Carrier coordination, dispatch manifests, proof-of-delivery.
                    </div>
                  </Link>

                  <Link
                    href="/store"
                    className="p-4 rounded-[4px] border border-[#D7D2C8] bg-[#FFFAF2] hover:border-[#2D4F1E] transition-colors block group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Store size={18} className="text-[#2D4F1E]" />
                      <span className="text-[10px] font-mono text-[#544E45]">Retail</span>
                    </div>
                    <div className="text-sm font-bold text-[#1F1A14] group-hover:text-[#2D4F1E]">Samagna Forest Store</div>
                    <div className="text-xs text-[#544E45] mt-1 leading-relaxed">
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
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E27D60] font-bold">
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
                  className="bg-white rounded-[6px] border border-[#D7D2C8] overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#2D4F1E] transition-all"
                >
                  <div>
                    {/* Authentic Photo */}
                    <div className="relative h-48 w-full bg-[#F5E6CC]/40 overflow-hidden">
                      <Image
                        src={item.imagePath}
                        alt={item.nameEnglish}
                        fill
                        className="object-cover object-center transition-transform hover:scale-105 duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-[#25351F]/90 backdrop-blur-xs text-[#FFFAF2] font-mono text-[10px] px-2 py-0.5 rounded-[3px]">
                        ₹{item.benchmarkRatePerKg}/kg MSP
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-odia text-[#E27D60] font-medium">
                          {item.nameOdia}
                        </span>
                        <span className="text-[10px] font-mono text-[#544E45]">
                          {item.harvestSeason}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-semibold text-[#1F1A14]">
                        {item.nameEnglish}
                      </h3>
                      <p className="text-[11px] font-mono italic text-[#544E45]">
                        {item.scientificName}
                      </p>

                      <p className="text-xs text-[#4A4A4A] leading-relaxed font-sans pt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-3 border-t border-[#D7D2C8]/60 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#544E45]">{item.packaging}</span>
                      <Link
                        href="/trade"
                        className="text-[#2D4F1E] hover:underline font-bold flex items-center gap-1"
                      >
                        <span>Trade RFQ</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. TRACEABILITY & SPECIMEN VERIFICATION (WITH BATCH JOURNEY DIAGRAM) */}
        <section id="traceability" className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Traceability Concept & Form */}
              <div className="lg:col-span-5 space-y-5">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#E27D60] font-bold">
                    PUBLIC PROVENANCE & TRANSPARENCY
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
                  <label htmlFor="stencil-search-input" className="block text-xs font-mono font-semibold text-[#1F1A14]">
                    Enter Batch Code or Stencil Tag:
                  </label>
                  <div className="relative">
                    <input
                      id="stencil-search-input"
                      type="text"
                      value={batchCodeInput}
                      onChange={(e) => setBatchCodeInput(e.target.value)}
                      placeholder="e.g. BS-402 or BS-400"
                      className="w-full h-11 px-3.5 pl-9 text-xs font-mono border border-[#D7D2C8] rounded-[4px] bg-[#FFFAF2] text-[#1F1A14] focus:outline-none focus:border-[#2D4F1E]"
                    />
                    <Search size={15} className="absolute left-3 top-3.5 text-[#544E45]" />
                  </div>

                  {searchError && (
                    <div className="text-xs text-red-600 flex items-center gap-1 font-mono">
                      <AlertCircle size={13} />
                      <span>{searchError}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 text-[11px] font-mono">
                    <span className="text-[#544E45]">Try specimen:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickCode('BS-402')}
                      className="px-2 py-0.5 rounded-[3px] border border-[#D7D2C8] bg-white hover:bg-[#F5E6CC] text-[#2D4F1E] font-bold"
                    >
                      #BS-402
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCode('BS-400')}
                      className="px-2 py-0.5 rounded-[3px] border border-[#D7D2C8] bg-white hover:bg-[#F5E6CC] text-[#2D4F1E] font-bold"
                    >
                      #BS-400
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 bg-[#2D4F1E] text-white text-xs font-mono font-bold rounded-[4px] hover:bg-[#25351F] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Verify a Batch →</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Specimen Card (#BS-402) */}
              <div className="lg:col-span-7">
                <div className="p-6 sm:p-7 rounded-[6px] border border-[#D7D2C8] bg-[#FFFAF2] space-y-4 shadow-card">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D7D2C8]">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-[#544E45]">Specimen Batch Passport</div>
                      <div className="font-serif text-2xl font-bold text-[#1F1A14]">BATCH #BS-402</div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-[3px] bg-[#2E5C2D]/15 text-[#2E5C2D] text-xs font-mono font-bold border border-[#2E5C2D]/30">
                      <BadgeCheck size={14} />
                      <span>VERIFIED SALEABLE</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Produce</div>
                      <div className="text-[#1F1A14] font-bold mt-0.5">Dried Mahua Flowers</div>
                    </div>
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Origin</div>
                      <div className="text-[#1F1A14] font-bold mt-0.5">Karanjia, Mayurbhanj</div>
                    </div>
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Gatherers</div>
                      <div className="text-[#1F1A14] font-bold mt-0.5">4 Tribal Members</div>
                    </div>
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Field Intake</div>
                      <div className="text-[#1F1A14] font-bold mt-0.5">100.00 kg Net</div>
                    </div>
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Depôt Arrival</div>
                      <div className="text-[#1F1A14] font-bold mt-0.5">98.50 kg Net</div>
                    </div>
                    <div className="p-3 bg-white rounded-[4px] border border-[#D7D2C8]/60">
                      <div className="text-[#544E45] text-[10px] uppercase">Shrinkage</div>
                      <div className="text-[#2E5C2D] font-bold mt-0.5">1.50 kg (1.50%)</div>
                    </div>
                  </div>

                  <div className="pt-2 text-right">
                    <Link
                      href="/verify/BS-402"
                      className="text-xs font-mono font-bold text-[#2D4F1E] hover:underline inline-flex items-center gap-1"
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
        <section id="about" className="py-16 sm:py-24 border-b border-[#D7D2C8] bg-[#F5E6CC]/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Institutional Card */}
              <div className="p-8 sm:p-10 rounded-[6px] border border-[#D7D2C8] bg-white space-y-4 shadow-card">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#E27D60] font-bold">
                  PUBLIC SECTOR & GOVERNMENT
                </span>
                <h3 className="font-serif text-2xl font-normal text-[#1F1A14]">
                  Institutional Partnerships
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                  Deployed under the ST & SC Development Department, Government of Odisha, and TDCCOL. Primary
                  collectors access the platform free of charge under the statutory Odisha LABHA scheme with zero deductions.
                </p>
                <div className="pt-2">
                  <Link
                    href="/institutional"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D4F1E] text-white text-xs font-mono font-bold rounded-[4px] hover:bg-[#25351F] transition-colors"
                  >
                    <span>Discuss Institutional Partnership →</span>
                  </Link>
                </div>
              </div>

              {/* Commercial Card */}
              <div className="p-8 sm:p-10 rounded-[6px] border border-[#D7D2C8] bg-white space-y-4 shadow-card">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#E27D60] font-bold">
                  COMMERCIAL BUYERS & PROCESSORS
                </span>
                <h3 className="font-serif text-2xl font-normal text-[#1F1A14]">
                  Commercial Sourcing Desk
                </h3>
                <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed font-sans">
                  Ayurvedic manufacturers, pharmaceutical companies, and bulk buyers can source laboratory-screened forest
                  lots with documented custody, transparent pricing, and structured RFQs.
                </p>
                <div className="pt-2">
                  <Link
                    href="/trade"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D4F1E] text-white text-xs font-mono font-bold rounded-[4px] hover:bg-[#25351F] transition-colors"
                  >
                    <span>Explore Trade Opportunities →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. MINIMAL SITEMAP FOOTER */}
      <footer className="bg-[#25351F] text-[#F5E6CC] text-xs font-mono py-14 border-t border-[#D7D2C8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-10 border-b border-white/10">
            <div>
              <SamagnaLogo variant="dark" size="md" showTagline />
              <p className="mt-2 text-xs text-[#F5E6CC]/70 font-sans">
                Minor Forest Produce Custody, Traceability & Trade Infrastructure · Mayurbhanj District, Odisha
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-xs font-medium text-[#F5E6CC]">
              <a href="#operations" className="hover:text-white transition-colors">
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
                Sign In
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] text-[#F5E6CC]/60">
            <div>
              Tribal Development Co-operative Corporation of Odisha (TDCCOL) · LABHA Scheme
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E27D60]" />
              <span>Forest · Value · Prosperity · ସମଗ୍ନ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
