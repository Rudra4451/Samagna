'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  QrCode,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import { BatchJourneyDiagram } from '@/components/illustrations/BatchJourneyDiagram';

export const TraceabilitySection: React.FC = () => {
  const router = useRouter();
  const [batchInput, setBatchInput] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = batchInput.trim().replace(/^#/, '').toUpperCase();
    if (!clean) {
      setSearchError('Enter a valid batch code, such as BS-402, BS-400, or BS-398.');
      return;
    }
    setSearchError('');
    router.push(`/verify/${clean}`);
  };

  const handleQuickCode = (code: string) => {
    const clean = code.replace(/^#/, '').toUpperCase();
    setBatchInput(clean);
    router.push(`/verify/${clean}`);
  };

  return (
    <section id="traceability" className="scroll-mt-header py-16 sm:py-24 bg-warm-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-mono font-bold uppercase tracking-wider text-forest mb-3">
            <span>PUBLIC CUSTODY LEDGER</span>
          </div>
          <h2 className="font-serif type-h1 font-normal text-ink tracking-tight text-balance">
            Batch Traceability: Public Audit Dossier for Every Sack
          </h2>
          <p className="mt-4 type-body-lead text-ink-muted font-sans text-balance">
            Every 50kg bag is individually tagged with a tamper-evident QR code, recording digital scale readouts,
            evaporation calculations, and collector DBT transaction IDs on an immutable ledger.
          </p>

          {/* Interactive Batch Lookup Input */}
          <form onSubmit={handleVerifySubmit} className="mt-8 max-w-lg mx-auto">
            <div className="flex items-center rounded-[8px] border border-soft-border bg-white shadow-card p-1.5 focus-within:border-forest transition-colors">
              <div className="pl-3 pr-2 text-ink-muted">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={batchInput}
                onChange={(e) => {
                  setBatchInput(e.target.value);
                  setSearchError('');
                }}
                placeholder="Enter Batch Code (e.g. BS-402, BS-400)"
                className="w-full text-sm font-mono text-ink placeholder:text-ink-subtle bg-transparent outline-none py-2"
                aria-label="Batch Code to verify"
              />
              <button
                type="submit"
                className="touch-target px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-sans font-semibold rounded-[6px] transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Verify</span>
                <ArrowRight size={13} />
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-danger font-sans text-left mt-2 pl-2">{searchError}</p>
            )}

            {/* Quick Demo Codes */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-ink-muted flex-wrap">
              <span>Quick inspect:</span>
              {['#BS-402', '#BS-400', '#BS-398'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleQuickCode(code)}
                  className="touch-target px-2.5 py-1 rounded-[4px] border border-soft-border bg-cream/40 hover:bg-cream text-forest font-bold transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Live Batch #BS-402 Passport Showcase */}
        <div className="rounded-[12px] border border-soft-border bg-white overflow-hidden shadow-card text-left max-w-5xl mx-auto">
          {/* Header Chrome */}
          <div className="bg-canopy text-cream px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-sans border-b border-forest/60">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
              <span className="font-bold tracking-wide text-white">LIVE CUSTODY PASSPORT · BATCH #BS-402</span>
              <span className="text-white/40 hidden sm:inline">·</span>
              <span className="text-cream/80 hidden sm:inline font-medium">Odisha LABHA Scheme Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-white bg-emerald-700 px-3 py-1 rounded-[4px] font-sans font-semibold text-xs shadow-2xs">
                <CheckCircle2 size={13} className="text-cream" />
                <span>Verified Saleable</span>
              </span>
            </div>
          </div>

          {/* Grid Layout: Visual Photo & Botanical Data (Left) + Reweigh & Custody Audit (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-soft-border">
            {/* Left Column (5 cols): Botanical Photographic Plate */}
            <div className="md:col-span-5 p-5 sm:p-6 bg-warm-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="relative aspect-[4/3] w-full rounded-[8px] overflow-hidden border border-soft-border bg-cream/40 shadow-2xs">
                  <Image
                    src="/products/mahua.jpg"
                    alt="Dried Mahua Flowers batch sample"
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-canopy/90 backdrop-blur-xs text-warm-white px-2.5 py-1 rounded-[4px] font-sans font-semibold text-xs">
                    Wild Botanical Harvest
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 bg-white/95 text-forest px-2.5 py-1 rounded-[4px] font-sans text-xs font-bold border border-soft-border shadow-2xs">
                    Similipal Buffer Tracts
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-odia text-terracotta-deep font-bold" lang="or">
                      ଶୁଖିଲା ମହୁଲ ଫୁଲ
                    </span>
                    <span className="text-ink-muted italic font-medium">Madhuca longifolia</span>
                  </div>
                  <div className="font-serif text-xl font-semibold text-ink mt-1">Dried Mahua Flowers</div>
                  <p className="text-xs text-ink-muted mt-1.5 leading-relaxed font-sans">
                    Dawn-collected wild fallen flowers sun-dried on clean mats. Zero artificial moisture or chemicals.
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-soft-border/70 flex items-center justify-between text-xs font-mono">
                <span className="text-ink-muted">Statutory MSP Benchmark:</span>
                <span className="font-bold text-ink">₹42.00 / kg</span>
              </div>
            </div>

            {/* Right Column (7 cols): Digital Scale & Custody Audit Trail */}
            <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between bg-white">
              <div className="space-y-5">
                {/* Scale Measurement Grid */}
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2 font-bold">
                    1. Field Digital Scale Readings (Karanjia Center)
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-[6px] border border-soft-border bg-warm-white text-left">
                      <div className="text-[11px] font-mono uppercase text-ink-muted">Gross Intake</div>
                      <div className="font-mono text-lg font-bold text-ink mt-0.5">52.40 kg</div>
                      <div className="text-[11px] text-ink-muted font-mono">Tare: 2.40 kg</div>
                    </div>

                    <div className="p-3 rounded-[6px] border border-forest/30 bg-forest/5 text-left">
                      <div className="text-[11px] font-mono uppercase text-forest font-bold">Net Accepted</div>
                      <div className="font-mono text-lg font-bold text-forest mt-0.5">50.00 kg</div>
                      <div className="text-[11px] text-forest font-sans">100% Payout OK</div>
                    </div>

                    <div className="p-3 rounded-[6px] border border-soft-border bg-warm-white text-left">
                      <div className="text-[11px] font-mono uppercase text-ink-muted">Depôt Reweigh</div>
                      <div className="font-mono text-lg font-bold text-ink mt-0.5">49.25 kg</div>
                      <div className="text-[11px] text-ink-muted font-sans">1.5% Evap. OK</div>
                    </div>
                  </div>
                </div>

                {/* Routing & Payout Metadata */}
                <div className="p-3.5 rounded-[6px] border border-soft-border bg-cream/20 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Transit Route:</span>
                    <span className="text-ink font-semibold">Karanjia Center ➔ Baripada Central Depôt</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">GPS Transit Waybill:</span>
                    <span className="text-forest font-bold">#WB-8841 (Driver: Utkal Freight)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Primary Gatherer:</span>
                    <span className="text-ink font-semibold">Sunita Soren (ID: OR-MBJ-0842)</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-soft-border/60">
                    <span className="text-forest font-bold">DBT Payout Transferred:</span>
                    <span className="text-forest font-bold text-sm">₹2,100.00 Credited</span>
                  </div>
                </div>

                {/* Batch Journey Stepper Diagram */}
                <div className="pt-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-2 font-bold">
                    2. Cryptographic Custody Stepper
                  </div>
                  <div className="p-3 rounded-[6px] border border-soft-border bg-warm-white">
                    <BatchJourneyDiagram activeStep={1} />
                  </div>
                </div>
              </div>

              {/* View Detail Action */}
              <div className="pt-5 mt-5 border-t border-soft-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Link
                  href="/verify/BS-402"
                  className="touch-target px-5 py-2.5 bg-forest hover:bg-forest-hover text-white text-xs font-sans font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <FileText size={14} className="text-terracotta" />
                  <span>Inspect Complete PDF Audit Dossier</span>
                  <ArrowRight size={13} />
                </Link>

                <div className="flex items-center justify-center gap-2 text-xs font-mono text-ink-muted">
                  <ShieldCheck size={14} className="text-forest" />
                  <span>Court-Admissible Provenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
