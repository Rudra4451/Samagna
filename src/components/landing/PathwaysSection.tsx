import React from 'react';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  ArrowRight,
  Scale,
  Volume2,
  QrCode,
  Truck,
  FileCheck2,
  Store,
  Layers,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const PathwaysSection: React.FC = () => {
  return (
    <section id="operations" className="scroll-mt-header py-16 sm:py-24 bg-warm-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-mono font-bold uppercase tracking-wider text-forest mb-3">
            <span>TWO PLATFORM PATHWAYS</span>
          </div>
          <h2 className="font-serif type-h1 font-normal text-ink tracking-tight text-balance">
            Engineered for institutional governance and enterprise commercial scale.
          </h2>
          <p className="mt-4 type-body-lead text-ink-muted font-sans text-balance">
            Whether managing primary forest intake across Mayurbhanj or contracting bulk wholesale lots, Samagna
            provides dedicated workflows tailored to each stakeholder.
          </p>
        </div>

        {/* Dual Pathway Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* Card 1: Institutional Operations (B2G) */}
          <div className="flex flex-col justify-between rounded-[12px] border border-soft-border bg-white p-6 sm:p-8 lg:p-10 shadow-card hover:shadow-elevated transition-all duration-200 group">
            <div className="space-y-6">
              {/* Card Header Badge */}
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-[8px] bg-forest/10 border border-forest/20 flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-colors">
                  <Building2 size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cream text-forest border border-soft-border">
                  B2G · FIELD OPERATIONS
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif type-h2 font-semibold text-ink">Institutional Field Operations</h3>
                  <span className="font-odia text-xs text-ink-muted" lang="or">
                    କ୍ଷେତ୍ର ପରିଚାଳନା
                  </span>
                </div>
                <p className="mt-2.5 type-body text-ink-muted leading-relaxed font-sans">
                  Offline-first digital scale weighment, instant DBT generation, tamper-evident bag QR tagging, and
                  moisture loss triage for 26 blocks across Mayurbhanj.
                </p>
              </div>

              {/* Capability Checklist */}
              <div className="space-y-3 pt-2 border-t border-soft-border/60">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Zero-Typing Scale Weighment:</strong> Digital gross minus tare math with audio readouts in
                    Odia for tribal gatherers.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Dual-Database Offline Resilience:</strong> Full operation in deep jungle tracts with
                    automatic IndexedDB sync upon connectivity.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Non-Accusatory Shrinkage Triage:</strong> Separates natural transit moisture evaporation
                    from transit loss without retroactive gatherer deductions.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-forest/10 text-forest flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>District Administrative Consoles:</strong> Real-time oversight for VPC managers, depot
                    custodians, and District Planning Officers (DPO).
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-6 border-t border-soft-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Link
                href="/collection"
                className="touch-target px-6 py-3.5 bg-forest text-white font-sans font-semibold text-sm rounded-[6px] hover:bg-forest-hover transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Open VPC Field Workspace</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/collector"
                className="touch-target px-4 py-2.5 text-xs font-mono font-bold text-forest hover:text-ink transition-colors flex items-center justify-center gap-1"
              >
                <span>Gatherer Voice Desk →</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Commercial Marketplace (B2B) */}
          <div
            id="trade"
            className="scroll-mt-header flex flex-col justify-between rounded-[12px] border border-soft-border bg-white p-6 sm:p-8 lg:p-10 shadow-card hover:shadow-elevated transition-all duration-200 group"
          >
            <div className="space-y-6">
              {/* Card Header Badge */}
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-[8px] bg-terracotta/10 border border-terracotta/20 flex items-center justify-center text-terracotta group-hover:bg-terracotta group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-terracotta-tint text-terracotta-deep border border-terracotta/30">
                  B2B · WHOLESALE MARKETPLACE
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif type-h2 font-semibold text-ink">Enterprise Commercial Trade</h3>
                  <span className="font-odia text-xs text-ink-muted" lang="or">
                    ପାଇକାରୀ ବାଣିଜ୍ୟ
                  </span>
                </div>
                <p className="mt-2.5 type-body text-ink-muted leading-relaxed font-sans">
                  Direct sourcing of certified Minor Forest Produce lots for pharmaceuticals, FMCG processors, and bulk
                  distributors with verifiable botanical provenance.
                </p>
              </div>

              {/* Capability Checklist */}
              <div className="space-y-3 pt-2 border-t border-soft-border/60">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Cryptographic Audit Dossiers:</strong> Full downloadable PDF dossiers recording origin
                    village, moisture history, and lab assay parameters.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Wholesale RFQ Bidding &amp; Escrow:</strong> Transparent multi-lot tendering, automated
                    purchase orders, and escrow reconciliation.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Bulk Logistics &amp; Waybill Tracking:</strong> Container-level dispatch with GPS tracking
                    from Baripada Central Depot to processing facilities.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-sans text-ink">
                    <strong>Consumer Forest Storefront:</strong> Direct packaged retail products (raw wild honey,
                    chebulic myrobalan) via `/store`.
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-6 border-t border-soft-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <Link
                href="/trade"
                className="touch-target px-6 py-3.5 bg-forest text-white font-sans font-semibold text-sm rounded-[6px] hover:bg-forest-hover transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Explore B2B Wholesale Lots</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/store"
                className="touch-target px-4 py-2.5 text-xs font-mono font-bold text-terracotta-deep hover:text-ink transition-colors flex items-center justify-center gap-1"
              >
                <span>Open Retail Forest Store →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
