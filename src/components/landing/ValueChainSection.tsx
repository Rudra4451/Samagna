import React from 'react';
import { Scale, QrCode, Warehouse, ShoppingCart, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ForestHarvestIllustration } from '@/components/illustrations/ForestHarvestIllustration';
import { TransitWaybillIllustration } from '@/components/illustrations/TransitWaybillIllustration';
import { WarehouseDepotIllustration } from '@/components/illustrations/WarehouseDepotIllustration';
import { TradeFulfillmentIllustration } from '@/components/illustrations/TradeFulfillmentIllustration';

interface Step {
  number: string;
  title: string;
  titleOdia: string;
  subtitle: string;
  description: string;
  metric: string;
  metricLabel: string;
  illustration: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Forest Harvest & Intake',
    titleOdia: 'ବନଜାତ ସଂଗ୍ରହ ଓ ଦାଖଲ',
    subtitle: 'Similipal Buffer Tracts · Village Level',
    description:
      'Tribal primary collectors bring hand-gathered produce to local Van Dhan collection centers. Gross weight minus bag tare generates certified net weight and immediate simulated DBT credit.',
    metric: '100% DBT',
    metricLabel: 'Zero cash tare deduction',
    illustration: <ForestHarvestIllustration size={220} className="w-full h-auto max-h-[160px]" />,
  },
  {
    number: '02',
    title: 'Bag Tag & Transit Waybill',
    titleOdia: 'ବସ୍ତା ଟ୍ୟାଗ୍ ଓ ଚାଲାଣ',
    subtitle: 'Karanjia Center · GPS Waybill #WB-8841',
    description:
      'Each standard 50kg jute gunny sack receives an official tamper-evident A6 bag tag with a high-density QR code. Vehicle driver signs cryptographic handover before transit dispatch.',
    metric: 'QR Tagged',
    metricLabel: 'Cryptographic bag identity',
    illustration: <TransitWaybillIllustration size={220} className="w-full h-auto max-h-[160px]" />,
  },
  {
    number: '03',
    title: 'Depot Reweigh & Triage',
    titleOdia: 'ଗୋଦାମ ପୁନଃ-ଓଜନ ଓ ଯାଞ୍ଚ',
    subtitle: 'Baripada Central Depôt · Reweigh Verification',
    description:
      'Upon warehouse arrival, individual bags are scanned and reweighed. Botanical shrinkage models mathematically isolate natural water evaporation from transit loss, shielding primary gatherers.',
    metric: '1.5% Loss OK',
    metricLabel: 'Botanical moisture tolerance',
    illustration: <WarehouseDepotIllustration size={220} className="w-full h-auto max-h-[160px]" />,
  },
  {
    number: '04',
    title: 'B2B Trade & Audit Dossier',
    titleOdia: 'ପାଇକାରୀ କ୍ରୟ ଓ ଅଡିଟ୍ ରିପୋର୍ଟ',
    subtitle: 'State e-Marketplace · Commercial Buyers',
    description:
      'Enterprise buyers inspect the tamper-evident digital passport of certified bulk lots, place wholesale RFQ bids, and download court-admissible PDF provenance dossiers for ESG compliance.',
    metric: '₹2,100 Settled',
    metricLabel: 'Verified collector payout',
    illustration: <TradeFulfillmentIllustration size={220} className="w-full h-auto max-h-[160px]" />,
  },
];

export const ValueChainSection: React.FC = () => {
  return (
    <section id="value-chain" className="scroll-mt-header py-16 sm:py-24 bg-cream/30 border-y border-soft-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-mono font-bold uppercase tracking-wider text-forest mb-3">
            <span>THE VALUE-CHAIN ENGINE</span>
          </div>
          <h2 className="font-serif type-h1 font-normal text-ink tracking-tight text-balance">
            How minor forest produce journeys from Similipal to enterprise markets.
          </h2>
          <p className="mt-4 type-body-lead text-ink-muted font-sans text-balance">
            Every bag of wild harvest moves through four auditable custody stages, preserving statutory gatherer
            entitlements while giving enterprise buyers cryptographic lot provenance.
          </p>
        </div>

        {/* Stepper Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="flex flex-col justify-between rounded-[10px] border border-soft-border bg-white p-5 sm:p-6 shadow-card hover:shadow-elevated transition-all duration-200 relative group"
            >
              <div>
                {/* Step Top Bar: Step Number + Connector */}
                <div className="flex items-center justify-between pb-3 border-b border-soft-border/70 mb-4">
                  <span className="font-mono text-2xl font-bold text-terracotta tracking-tight">
                    {step.number}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sand/60 text-[11px] font-mono text-ink-muted font-medium">
                    <span>Stage {idx + 1} of 4</span>
                  </div>
                </div>

                {/* Illustration Frame */}
                <div className="mb-4 rounded-[6px] bg-warm-white p-2 border border-soft-border/60 flex items-center justify-center overflow-hidden">
                  {step.illustration}
                </div>

                {/* Step Titles */}
                <div>
                  <h3 className="font-serif type-h3 font-semibold text-ink group-hover:text-forest transition-colors">
                    {step.title}
                  </h3>
                  <div className="font-odia text-xs text-ink-muted mt-0.5" lang="or">
                    {step.titleOdia}
                  </div>
                  <div className="text-[11px] font-mono text-forest mt-1.5 font-medium">
                    {step.subtitle}
                  </div>
                </div>

                {/* Description */}
                <p className="mt-3 type-body text-ink-muted leading-relaxed font-sans text-[13px]">
                  {step.description}
                </p>
              </div>

              {/* Step Footer Metric */}
              <div className="mt-6 pt-3 border-t border-soft-border/70 flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold text-forest">{step.metric}</div>
                  <div className="text-[11px] text-ink-muted">{step.metricLabel}</div>
                </div>
                <div className="w-7 h-7 rounded-full bg-cream/60 flex items-center justify-center text-forest">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
