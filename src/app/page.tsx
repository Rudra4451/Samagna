'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';

interface ProduceItem {
  id: string;
  nameEnglish: string;
  nameOdia: string;
  scientificName: string;
  harvestSeason: string;
  packaging: string;
  moistureLimit: string;
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
    harvestSeason: 'March to May',
    packaging: '50kg Jute Gunny Bag',
    moistureLimit: '12.0% max',
    benchmarkRatePerKg: 42,
    imagePath: '/products/mahua.jpg',
    description: 'Gathered by primary collectors at dawn across Karanjia forest fringes. Sun-dried on bamboo mats to preserve sugar content.',
  },
  {
    id: 'sal-seeds',
    nameEnglish: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    harvestSeason: 'May to July',
    packaging: '50kg Jute Gunny Bag',
    moistureLimit: '10.0% max',
    benchmarkRatePerKg: 20,
    imagePath: '/products/sal-seeds.jpg',
    description: 'Fallen fruit collected inside Similipal buffer zone. Wing husks removed by hand before weighment at the primary center.',
  },
  {
    id: 'char-seeds',
    nameEnglish: 'Chironji / Char Seeds',
    nameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    harvestSeason: 'April to June',
    packaging: '25kg High-Density Poly Bag',
    moistureLimit: '8.0% max',
    benchmarkRatePerKg: 120,
    imagePath: '/products/char-seeds.jpg',
    description: 'High-value forest nut gathered from dry deciduous tracts. Requires strict moisture control to avoid mould discoloration.',
  },
  {
    id: 'harida',
    nameEnglish: 'Harida / Chebulic Myrobalan',
    nameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    harvestSeason: 'November to February',
    packaging: '50kg Jute Gunny Bag',
    moistureLimit: '12.0% max',
    benchmarkRatePerKg: 25,
    imagePath: '/products/harida.jpg',
    description: 'Mature fruit collected from forest floor. Valued for traditional medicine and tanning, graded by kernel diameter.',
  },
  {
    id: 'wild-honey',
    nameEnglish: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ମହୁ',
    scientificName: 'Apis dorsata comb nectar',
    harvestSeason: 'April to June',
    packaging: 'Food-grade 20L Jerry Can',
    moistureLimit: '18.5% max',
    benchmarkRatePerKg: 225,
    imagePath: '/products/wild-honey.jpg',
    description: 'Sustainably harvested cliff honey filtered through coarse linen. Sealed immediately to maintain enzymatic integrity.',
  },
  {
    id: 'tamarind',
    nameEnglish: 'Seeded Tamarind',
    nameOdia: 'ତେନ୍ତୁଳି (ମଞ୍ଜି ସହିତ)',
    scientificName: 'Tamarindus indica',
    harvestSeason: 'January to April',
    packaging: '50kg Jute Gunny Bag',
    moistureLimit: '15.0% max',
    benchmarkRatePerKg: 36,
    imagePath: '/products/tamarind-seeded.jpg',
    description: 'De-shelled mature pods cured under sunlight. Pounded into firm blocks for long-term cooperative cold storage.',
  },
];

export default function MarketingHomePage() {
  const router = useRouter();
  const [selectedProduce, setSelectedProduce] = useState<ProduceItem>(FEATURED_PRODUCE[0]);
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = batchCodeInput.trim().replace('#', '').toUpperCase();
    if (!clean) {
      setSearchError('Enter a valid batch code such as BS-402 or BS-400.');
      return;
    }
    setSearchError('');
    router.push(`/verify/${clean}`);
  };

  const handleQuickCode = (code: string) => {
    setBatchCodeInput(code);
    router.push(`/verify/${code}`);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1F1A14] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif] selection:bg-[#F2EBDD] selection:text-[#1F1A14]">
      {/* 1. Header Navigation */}
      <header className="border-b border-[#E4DBC9] bg-[#FAF6EE]/95 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 text-[#0F172A] no-underline focus:outline-none">
              <SamagnaLogo variant="light" size="sm" showTagline />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-wide text-[#5E5245]">
            <a href="#rates" className="hover:text-[#1F1A14] transition-colors">
              Rates & Produce
            </a>
            <a href="#custody" className="hover:text-[#1F1A14] transition-colors">
              Custody Chain
            </a>
            <a href="#verify" className="hover:text-[#1F1A14] transition-colors">
              Verify Batch
            </a>
            <a href="#portals" className="hover:text-[#1F1A14] transition-colors">
              Field Portals
            </a>
            <Link href="/demo" className="text-[#B24E2E] font-semibold hover:underline">
              Live Demo
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/verify"
              className="px-3 py-1.5 text-xs font-mono text-ink border border-rule rounded-[3px] bg-bg hover:bg-bg-sunken transition-colors"
            >
              Verify Code
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-mono font-semibold text-accent-ink bg-accent rounded-[3px] hover:bg-accent-hover transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. Hero Section: Direct Statement & Product as Main Visual */}
        <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-rule">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] bg-accent-tint border border-accent/20 text-xs font-mono text-accent mb-6">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <span className="font-semibold">Samagna · Forest · People · Prosperity</span>
              <span className="text-ink-muted hidden sm:inline">· Odisha LABHA Scheme</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-bold text-ink tracking-tight leading-[1.15] max-w-3xl mx-auto">
              Transparent. Traceable. Together.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
              Samagna records weighments at village collection points, enforces government minimum support
              rates, and tracks physical custody across transit into central cooperative depots.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/collector"
                className="px-5 py-2.5 bg-accent text-accent-ink text-xs font-mono font-semibold rounded-[3px] hover:bg-accent-hover transition-colors shadow-none"
              >
                Launch Collector Portal
              </Link>
              <a
                href="#verify"
                className="px-5 py-2.5 bg-surface text-ink border border-rule text-xs font-mono font-semibold rounded-[3px] hover:bg-bg-sunken transition-colors"
              >
                Inspect Sample Batch BS-402
              </a>
            </div>
          </div>

          {/* Product Specimen: Authentic Batch Custody Artifact */}
          <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
            <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-5 sm:p-7 shadow-sm">
              {/* Card Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4DBC9]">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#5E5245] block">
                    Physical Stencil Identifier
                  </span>
                  <span className="text-xl font-mono font-bold text-[#1F1A14] tracking-tight">
                    BATCH #BS-402
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#F2EBDD] text-xs font-mono font-semibold text-[#2E5C2D] border border-[#E4DBC9]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E5C2D]" />
                    Verified Custody
                  </span>
                  <Link
                    href="/verify/BS-402"
                    className="px-2.5 py-1 text-xs font-mono text-[#B24E2E] hover:underline"
                  >
                    View Ledger Record →
                  </Link>
                </div>
              </div>

              {/* Card Grid Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5 border-b border-[#E4DBC9]">
                <div>
                  <span className="text-xs font-mono text-[#5E5245] block">Produce Intake</span>
                  <span className="text-sm font-semibold text-[#1F1A14] block mt-0.5">
                    Dried Mahua Flowers (ମହୁଲ)
                  </span>
                  <span className="text-xs font-mono text-[#5E5245] block mt-1">
                    Season: March to May 2024
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#5E5245] block">Intake Weighment</span>
                  <span className="text-sm font-mono font-bold text-[#1F1A14] block mt-0.5">
                    348.50 kg (7 Gunny Bags)
                  </span>
                  <span className="text-xs font-mono text-[#5E5245] block mt-1">
                    Tare: 10.5 kg (1.5 kg/bag)
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#5E5245] block">Collector Payout</span>
                  <span className="text-sm font-mono font-bold text-[#B24E2E] block mt-0.5">
                    ₹14,637.00
                  </span>
                  <span className="text-xs font-mono text-[#5E5245] block mt-1">
                    Rate: ₹42.00/kg (Zero deductions)
                  </span>
                </div>
              </div>

              {/* Transit & Verification Footprint */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#5E5245]">
                <div className="space-y-0.5">
                  <div>
                    <strong className="text-[#1F1A14]">Route:</strong> Karanjia Collection Center → Baripada Central Depôt
                  </div>
                  <div>
                    <strong className="text-[#1F1A14]">Coordinates:</strong> 21.7582° N, 85.9722° E (GPS Verified)
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="block text-[11px] text-[#5E5245]">SHA-256 Digest:</span>
                  <span className="font-mono text-[10px] text-[#1F1A14]">
                    d9b4c02f7e...318a42
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#5E5245] text-center mt-3">
              Prototype Demonstration: Represents an active weighment recorded in Karanjia Block, Mayurbhanj.
            </p>
          </div>
        </section>

        {/* 3. Rates & Produce Section */}
        <section id="rates" className="py-16 sm:py-24 border-b border-[#E4DBC9]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-mono uppercase tracking-wider text-[#B24E2E] block mb-2">
                Fair Remuneration
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F1A14] tracking-tight">
                Official Minimum Support Rates
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#5E5245] leading-relaxed">
                Primary collectors receive direct cash receipts calculated against benchmark rates notified
                under the LABHA Scheme. Scale tare and allowable transit shrinkage are locked into the ledger.
              </p>
            </div>

            {/* Produce Tabs & Detail View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Produce Selector List */}
              <div className="lg:col-span-5 space-y-2">
                {FEATURED_PRODUCE.map((prod) => {
                  const isSelected = selectedProduce.id === prod.id;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setSelectedProduce(prod)}
                      className={`w-full text-left p-3.5 rounded-[3px] border transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'border-[#B24E2E] bg-[#FFFFFF] shadow-sm'
                          : 'border-[#E4DBC9] bg-[#FAF6EE] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#1F1A14]">
                          {prod.nameEnglish}
                        </div>
                        <div className="text-xs font-mono text-[#5E5245]">
                          {prod.nameOdia} · {prod.harvestSeason}
                        </div>
                      </div>
                      <div className="text-right pl-3">
                        <div className="text-sm font-mono font-bold text-[#B24E2E]">
                          ₹{prod.benchmarkRatePerKg}
                          <span className="text-[10px] font-normal text-[#5E5245]">/kg</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#5E5245] block">
                          LABHA Rate
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Produce Deep-Dive Card */}
              <div className="lg:col-span-7 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4DBC9]">
                  <div>
                    <span className="text-xs font-mono uppercase text-[#B24E2E] block">
                      {selectedProduce.scientificName}
                    </span>
                    <h3 className="text-2xl font-serif font-bold text-[#1F1A14] mt-0.5">
                      {selectedProduce.nameEnglish}
                    </h3>
                    <p className="text-sm text-[#5E5245] mt-1 font-odia">
                      {selectedProduce.nameOdia}
                    </p>
                  </div>

                  <div className="text-left sm:text-right bg-[#F2EBDD] p-3 rounded-[3px] border border-[#E4DBC9]">
                    <span className="text-[11px] font-mono text-[#5E5245] block">
                      Government Support Price
                    </span>
                    <span className="text-2xl font-mono font-bold text-[#B24E2E] block">
                      ₹{selectedProduce.benchmarkRatePerKg}.00
                      <span className="text-xs font-normal text-[#5E5245]"> / kg</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#5E5245] block mt-0.5">
                      50kg Bag Value: ₹{(selectedProduce.benchmarkRatePerKg * 50).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Real Produce Photo from public assets */}
                <div className="relative w-full h-56 sm:h-72 rounded-[3px] overflow-hidden border border-[#E4DBC9] bg-[#F2EBDD]">
                  <Image
                    src={selectedProduce.imagePath}
                    alt={selectedProduce.nameEnglish}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#1F2A22]/90 text-white text-[10px] font-mono px-2 py-0.5 rounded-[2px]">
                    Authentic Forest Produce Specimen · Mayurbhanj
                  </div>
                </div>

                <p className="text-sm text-[#1F1A14] leading-relaxed">
                  {selectedProduce.description}
                </p>

                {/* Specs Table */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E4DBC9] text-xs font-mono">
                  <div>
                    <span className="text-[#5E5245] block">Primary Packaging</span>
                    <span className="font-semibold text-[#1F1A14] block mt-0.5">
                      {selectedProduce.packaging}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5E5245] block">Moisture Baseline</span>
                    <span className="font-semibold text-[#1F1A14] block mt-0.5">
                      {selectedProduce.moistureLimit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#5E5245] block">Harvest Season</span>
                    <span className="font-semibold text-[#1F1A14] block mt-0.5">
                      {selectedProduce.harvestSeason}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/collector?produce=${selectedProduce.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#B24E2E] hover:underline"
                  >
                    Simulate Intake Weighment for {selectedProduce.nameEnglish} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Custody Architecture Section */}
        <section id="custody" className="py-16 sm:py-24 border-b border-[#E4DBC9]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono uppercase tracking-wider text-[#B24E2E] block mb-2">
                Chain of Custody
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F1A14] tracking-tight">
                Physical Traceability from Forest Floor to Central Depôt
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#5E5245] leading-relaxed">
                BanaSetu links digital weighments to physical gunny bags using stenciled batch codes and
                moisture readings taken at each custody handoff.
              </p>
            </div>

            {/* The 4 Physical Stages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Stage 1 */}
              <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 bg-[#F2EBDD] text-[#B24E2E] font-semibold rounded-[2px]">
                    STAGE 01
                  </span>
                  <span className="text-[#5E5245]">Forest Village Intake</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1F1A14]">
                  Weighment and Audio Receipt
                </h3>
                <p className="text-sm text-[#5E5245] leading-relaxed">
                  Collector brings dried produce to the village collection point. The manager inputs gross
                  weight; bag tare is subtracted automatically. An audible audio receipt confirms the kilograms
                  and rupee total in native Odia and Santhali dialects.
                </p>
                <div className="pt-2 text-xs font-mono text-[#1F1A14]">
                  <strong>Artifact:</strong> Paper thermal receipt with batch code & offline ULID hash.
                </div>
              </div>

              {/* Stage 2 */}
              <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 bg-[#F2EBDD] text-[#B24E2E] font-semibold rounded-[2px]">
                    STAGE 02
                  </span>
                  <span className="text-[#5E5245]">Bag Tagging</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1F1A14]">
                  Permanent Stencil and QR Affixing
                </h3>
                <p className="text-sm text-[#5E5245] leading-relaxed">
                  Every 50kg jute bag receives a weather-resistant stencil with the batch code (such as BS-402)
                  and a tamper-evident QR tag. Quality inspection photos of produce grain and moisture meter
                  readings are attached to the batch record.
                </p>
                <div className="pt-2 text-xs font-mono text-[#1F1A14]">
                  <strong>Artifact:</strong> High-contrast bag tag printable directly on standard A4 or 4x6 label.
                </div>
              </div>

              {/* Stage 3 */}
              <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 bg-[#F2EBDD] text-[#B24E2E] font-semibold rounded-[2px]">
                    STAGE 03
                  </span>
                  <span className="text-[#5E5245]">Transit Checkpoint</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1F1A14]">
                  Warehouse Reweigh and Shrinkage Validation
                </h3>
                <p className="text-sm text-[#5E5245] leading-relaxed">
                  At the central depot in Baripada, warehouse receivers scan the bag tag and reweigh the load.
                  Allowable moisture loss (typically 1.0% to 1.5%) is calculated against ambient weather data.
                  Unexplained losses trigger an immediate custody audit quarantine.
                </p>
                <div className="pt-2 text-xs font-mono text-[#1F1A14]">
                  <strong>Artifact:</strong> Reweigh log with discrepancy threshold analysis.
                </div>
              </div>

              {/* Stage 4 */}
              <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 bg-[#F2EBDD] text-[#B24E2E] font-semibold rounded-[2px]">
                    STAGE 04
                  </span>
                  <span className="text-[#5E5245]">Cooperative Oversight</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1F1A14]">
                  Public Verification and Audit Log
                </h3>
                <p className="text-sm text-[#5E5245] leading-relaxed">
                  Retail buyers, cooperative federations, and district officials can scan any bag code to inspect
                  the entire journey: collector name, collection date, moisture levels, transport truck numbers,
                  and digital signatures.
                </p>
                <div className="pt-2 text-xs font-mono text-[#1F1A14]">
                  <strong>Artifact:</strong> Complete chronological timeline certified by TDCCOL.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Live Batch Verification Form (Main Action) */}
        <section id="verify" className="py-16 sm:py-24 border-b border-[#E4DBC9] bg-[#FAF6EE]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] p-6 sm:p-10 shadow-sm space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#B24E2E] block mb-1">
                  Public Ledger Gateway
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1A14]">
                  Verify Batch Custody
                </h2>
                <p className="text-sm text-[#5E5245] mt-1">
                  Enter the batch identifier from your collection receipt or bag stencil tag.
                </p>
              </div>

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <label htmlFor="batch-code-input" className="block text-xs font-mono font-semibold text-[#1F1A14] mb-1.5">
                    Batch Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="batch-code-input"
                      type="text"
                      value={batchCodeInput}
                      onChange={(e) => {
                        setBatchCodeInput(e.target.value);
                        setSearchError('');
                      }}
                      placeholder="e.g. BS-402, BS-400"
                      className="flex-1 h-11 px-3 text-sm font-mono border border-[#E4DBC9] rounded-[3px] bg-[#FAF6EE] text-[#1F1A14] focus:outline-none focus:border-[#B24E2E]"
                    />
                    <button
                      type="submit"
                      className="px-5 h-11 bg-[#B24E2E] text-white text-xs font-mono font-semibold rounded-[3px] hover:bg-[#9C4126] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Verify Record</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </div>
                  {searchError && (
                    <p className="text-xs font-mono text-[#8E2F26] mt-1.5">
                      {searchError}
                    </p>
                  )}
                </div>
              </form>

              {/* Sample Batch Shortcuts */}
              <div className="pt-4 border-t border-[#E4DBC9]">
                <span className="text-xs font-mono text-[#5E5245] block mb-2">
                  Pre-seeded Prototype Batches:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCode('BS-402')}
                    className="px-2.5 py-1 text-xs font-mono border border-[#E4DBC9] rounded-[2px] bg-[#FAF6EE] hover:bg-[#F2EBDD] text-[#1F1A14] transition-colors"
                  >
                    BS-402 (Dried Mahua Flowers · Karanjia)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCode('BS-400')}
                    className="px-2.5 py-1 text-xs font-mono border border-[#E4DBC9] rounded-[2px] bg-[#FAF6EE] hover:bg-[#F2EBDD] text-[#1F1A14] transition-colors"
                  >
                    BS-400 (Dried Mahua Flowers · Verified Stock)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Field Portals & Personas Section */}
        <section id="portals" className="py-16 sm:py-24 border-b border-[#E4DBC9]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-mono uppercase tracking-wider text-[#B24E2E] block mb-2">
                Operational Roles
              </span>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F1A14] tracking-tight">
                Experience Field Workflows
              </h2>
              <p className="mt-3 text-sm sm:text-base text-[#5E5245] leading-relaxed">
                Test the actual interfaces used by tribal primary collectors, SHG leaders, collection managers,
                and district supervisors without creating an account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Persona 1 */}
              <Link
                href="/collector"
                className="p-5 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] hover:border-[#B24E2E] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#5E5245] mb-2">
                  <span>COLLECTOR</span>
                  <span className="text-[#B24E2E] group-hover:underline">Launch →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  Sunita Soren (Badagaon)
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  One-handed mobile intake interface. Audio weighment confirmation in Odia and Santhali, zero typing.
                </p>
              </Link>

              {/* Persona 2 */}
              <Link
                href="/facilitator"
                className="p-5 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] hover:border-[#B24E2E] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#5E5245] mb-2">
                  <span>SHG FACILITATOR</span>
                  <span className="text-[#B24E2E] group-hover:underline">Launch →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  Sumitra Marndi (SHG Lead)
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  Communal batch aggregation, member share calculation, and group receipt generation.
                </p>
              </Link>

              {/* Persona 3 */}
              <Link
                href="/collection"
                className="p-5 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] hover:border-[#B24E2E] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#5E5245] mb-2">
                  <span>COLLECTION MANAGER</span>
                  <span className="text-[#B24E2E] group-hover:underline">Launch →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  A. Mohanty (Karanjia Point)
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  High-speed tabular intake, bag tare management, moisture checks, and dispatch manifest creation.
                </p>
              </Link>

              {/* Persona 4 */}
              <Link
                href="/inventory"
                className="p-5 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] hover:border-[#B24E2E] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#5E5245] mb-2">
                  <span>WAREHOUSE MANAGER</span>
                  <span className="text-[#B24E2E] group-hover:underline">Launch →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  S. Das (Baripada Depôt)
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  Central depot transit intake, shrinkage validation, lot segregation, and cooperative buyer sales.
                </p>
              </Link>

              {/* Persona 5 */}
              <Link
                href="/admin"
                className="p-5 border border-[#E4DBC9] rounded-[4px] bg-[#FFFFFF] hover:border-[#B24E2E] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#5E5245] mb-2">
                  <span>DISTRICT DPO</span>
                  <span className="text-[#B24E2E] group-hover:underline">Launch →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  R. K. Patnaik (Mayurbhanj DPO)
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  Administrative district dashboard, custody conflict resolution drawer, and audit CSV exports.
                </p>
              </Link>

              {/* Persona 6: Demonstration Hub */}
              <Link
                href="/demo"
                className="p-5 border border-[#B24E2E] rounded-[4px] bg-[#FAF6EE] hover:bg-[#F2EBDD] transition-colors block text-left group no-underline"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#B24E2E] mb-2">
                  <span className="font-semibold">GUIDED TOUR</span>
                  <span className="group-hover:underline">Start Demo →</span>
                </div>
                <div className="text-base font-serif font-bold text-[#1F1A14]">
                  3-Minute Orchestrated Walkthrough
                </div>
                <p className="text-xs text-[#5E5245] mt-2 leading-relaxed">
                  Step-by-step evaluator tour covering intake, tagging, reweigh shrinkage, and audit verification.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer: Real Governance & Legal Links */}
      <footer className="bg-[#F5F5F0] text-[#475569] text-xs font-mono py-12 border-t border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[#E2E8F0]">
            <div>
              <SamagnaLogo variant="light" size="sm" showTagline />
              <p className="mt-2 text-[11px] text-[#475569]">
                Tribal Development Co-operative Corporation of Odisha (TDCCOL)
              </p>
              <p className="text-[10px] text-[#64748B]">
                LABHA Scheme Traceability Infrastructure · Mayurbhanj District
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs">
              <Link href="/terms" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/verify" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Verify Batch
              </Link>
              <Link href="/demo" className="text-ink-muted hover:text-ink transition-colors">
                Demonstration
              </Link>
              <Link href="/login" className="text-accent hover:underline font-semibold">
                Personnel Portal
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
            <div>
              Simulated prototype environment for field evaluation. All benchmark rates subject to official state notification.
            </div>
            <div>
              Mayurbhanj District · Government of Odisha
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
