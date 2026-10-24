'use client';

import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { ProductIcon } from '../ui/ProductIcons';
import { cn } from '../../lib/utils';

export interface CollectionReceiptData {
  code: string;
  collectorName: string;
  collectorNameOdia: string;
  tribalId: string;
  village: string;
  villageOdia: string;
  center: string;
  productName: string;
  productNameOdia: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  ratePerKg: number;
  rateSource: string;
  totalAmount: number;
  dateStr: string;
  dateOdia: string;
  paymentStatus: string;
  paymentRef: string;
  managerName: string;
  managerId: string;
  syncState?: 'draft' | 'queued' | 'syncing' | 'synced' | 'conflict' | 'failed';
}

interface CollectionReceiptArtifactProps {
  data: CollectionReceiptData;
  className?: string;
  id?: string;
}

export const CollectionReceiptArtifact: React.FC<CollectionReceiptArtifactProps> = ({
  data,
  className,
  id,
}) => {
  return (
    <article
      id={id}
      aria-label={`Official Collection Receipt ${data.code}`}
      className={cn(
        'a5-receipt-card w-full max-w-[148mm] min-h-[210mm] border border-rule bg-surface p-6 sm:p-7 text-ink flex flex-col justify-between shadow-none select-none relative',
        className
      )}
    >
      <div className="space-y-4">
        {/* Top Identification Header: No logos bigger than 20px */}
        <header className="border-b border-rule pb-3 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[2px] bg-accent inline-block shrink-0" aria-hidden="true" />
              <span className="font-heading text-[16px] font-bold tracking-tight text-ink">
                BanaSetu
              </span>
              <span className="text-[10px] font-mono uppercase text-ink-subtle">
                · TDCCOL Odisha
              </span>
            </div>
            <div className="text-[12px] font-medium text-ink leading-tight">
              Collection receipt
            </div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">
              ସଂଗ୍ରହ ରସିଦ
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-semibold">
              Batch Code
            </span>
            {/* Hierarchy 1: Batch code in Fraunces 28px tabular */}
            <div className="font-heading text-[28px] font-bold tabular-nums text-accent leading-none mt-0.5">
              {data.code}
            </div>
            <div className="mt-1 flex justify-end">
              <SyncStatusBadge state={data.syncState || 'synced'} />
            </div>
          </div>
        </header>

        {/* Collector & Procurement Context */}
        <section aria-label="Collector information" className="grid grid-cols-2 gap-3 text-[13px] border-b border-rule pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Primary Collector
            </span>
            <div className="font-semibold text-ink leading-snug">{data.collectorName}</div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">{data.collectorNameOdia}</div>
            <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
              Tribal ID: {data.tribalId}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Village & Center
            </span>
            <div className="font-medium text-ink leading-snug">{data.village}</div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">{data.villageOdia}</div>
            <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
              Center: {data.center}
            </div>
          </div>
        </section>

        {/* Product Information */}
        <section aria-label="Produce species" className="border-b border-rule pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Produce Commodity
            </span>
            <div className="font-semibold text-ink text-[15px]">{data.productName}</div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">{data.productNameOdia}</div>
          </div>
          <div className="w-12 h-12 rounded-[4px] overflow-hidden border border-rule/60 bg-bg-sunken flex-shrink-0 shadow-sm">
            <ProductIcon product={data.productName} size={48} className="w-full h-full object-cover" />
          </div>
        </section>

        {/* Hierarchy 2: Certified Net Weight in Fraunces 36px */}
        <section aria-label="Weighment summary" className="border-b border-rule pb-3.5 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold">
              Accepted Net Weight / ନିଟ୍ ଓଜନ
            </span>
            <span className="text-[11px] font-mono text-ink-subtle">
              Tare: {data.tareWeightKg.toFixed(2)} kg · Gross: {data.grossWeightKg.toFixed(2)} kg
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="font-heading text-[36px] font-bold tabular-nums text-ink leading-none">
              {data.netWeightKg.toFixed(2)}
              <span className="font-sans text-[16px] font-normal text-ink-muted ml-1.5">kg</span>
            </div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">
              {data.netWeightKg.toFixed(2)} କିଲୋଗ୍ରାମ
            </div>
          </div>
        </section>

        {/* Hierarchy 3 & 4: Rate with source line & Amount in Fraunces 36px */}
        <section aria-label="Valuation & rate" className="border-b border-rule pb-3.5 space-y-2">
          <div className="flex justify-between items-start gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-bold">
                Notified Rate
              </span>
              <div className="font-mono text-[16px] font-bold text-ink tabular-nums">
                ₹{data.ratePerKg.toFixed(2)} / kg
              </div>
              <div className="text-[11px] font-mono text-ink-subtle">
                Source: {data.rateSource}
              </div>
              <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">
                ଦର: ପ୍ରତି କେଜି ₹{data.ratePerKg.toFixed(0)} (ସରକାରୀ ସହାୟକ ମୂଲ୍ୟ)
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-bold">
                Total Entitlement / ମୋଟ ପ୍ରାପ୍ୟ
              </span>
              {/* Hierarchy 4: Amount in Fraunces 36px */}
              <div className="font-heading text-[36px] font-bold tabular-nums text-accent leading-none">
                ₹{data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">
                ଟଙ୍କା: {data.totalAmount.toFixed(0)} ଟଙ୍କା
              </div>
            </div>
          </div>
        </section>

        {/* Hierarchy 5 & 6: Date and Payment Status Badge */}
        <section aria-label="Settlement channel" className="border-b border-rule pb-3 flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Weighment Timestamp
            </span>
            <div className="font-mono text-[12px] text-ink">{data.dateStr}</div>
            <div className="font-odia text-[15px] leading-[1.5] text-ink-muted">{data.dateOdia}</div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Disbursement Channel
            </span>
            <StatusBadge variant="neutral">
              {data.paymentStatus} · {data.paymentRef}
            </StatusBadge>
          </div>
        </section>

        {/* "What this receipt means" Line (12px ink-subtle) */}
        <section aria-label="Receipt meaning plain language" className="p-2.5 border border-rule bg-bg/40 rounded-[2px] space-y-1">
          <p className="text-[12px] text-ink-subtle leading-relaxed">
            <strong>What this receipt means:</strong> You were weighed, your rate is from {data.rateSource}, you will be paid {data.paymentStatus}.
          </p>
          <p className="font-odia text-[15px] leading-[1.5] text-ink-muted">
            <strong>ଏହି ରସିଦର ଅର୍ଥ:</strong> ଆପଣଙ୍କ ଓଜନ କରାଯାଇଛି, ଦର {data.rateSource} ରୁ ଆସିଛି, ଆପଣଙ୍କୁ {data.paymentStatus} ମାଧ୍ୟମରେ ପ୍ରଦାନ କରାଯିବ।
          </p>
        </section>

        {/* Hand-Signature Line for Collection Manager + Collector Thumbprint */}
        <section aria-label="Signatures" className="pt-2">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-4">
              <div className="border-b border-ink/40 w-4/5 pb-1">
                <span className="font-mono text-[11px] text-ink-subtle block">
                  {data.managerName} ({data.managerId})
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-ink block">
                  Collection Manager Signature
                </span>
                <span className="font-odia text-[15px] leading-[1.5] text-ink-muted block">
                  ସଂଗ୍ରହ ପରିଚାଳକ ସ୍ୱାକ୍ଷର
                </span>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div className="inline-block border border-ink/40 w-24 h-14 bg-bg-sunken/40 rounded-[2px] p-1 text-center">
                <span className="text-[9px] font-mono text-ink-subtle block mt-3">
                  [ THUMBPRINT ]
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-ink block">
                  Collector Thumbprint / ଟିପଚିହ୍ନ
                </span>
                <span className="text-[10px] font-mono text-ink-subtle block">
                  {data.collectorName}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer: 11px Prototype Notice */}
      <footer className="border-t border-rule pt-2 mt-4 flex items-center justify-between text-[11px] font-mono text-ink-muted select-none">
        <span>Prototype — not a legal document. Payment simulated.</span>
        <span className="text-[9px] text-ink-subtle">A5 RECEIPT SPEC</span>
      </footer>
    </article>
  );
};
