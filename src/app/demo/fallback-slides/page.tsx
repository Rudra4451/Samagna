'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

const SLIDES = [
  {
    step: 1,
    act: 'ACT 1 · 0:30–1:30',
    title: 'Mobile Collector Pickup · Sunita Soren',
    village: 'Badagaon Village, Karanjia Block, Mayurbhanj Belt',
    badge: 'QUEUED TO SYNC',
    badgeColor: 'text-warning bg-warning/10 border-warning',
    details: [
      { label: 'Collector Name', value: 'Sunita Soren (ସୁନୀତା ସୋରେନ)' },
      { label: 'Tribal Identity Token', value: 'OR-MAY-KRN-0842 (Aadhaar Seeded)' },
      { label: 'Harvest Dropped', value: '100.0 kg Dried Mahua Flowers (Grade A)' },
      { label: 'TDCCOL MSP Rate', value: '₹42.00 / kg (Verified State Rate Card)' },
      { label: 'Gross Payout', value: '₹4,200.00 (Queued for Direct Benefit Transfer)' },
      { label: 'Sync State', value: 'Durable Local Dexie Queue (Durable Offline)' },
    ],
    highlight: 'One-handed reachability: 48px mono-line product icon, 36px Fraunces tabular numerals, voice quantity mic.',
  },
  {
    step: 2,
    act: 'ACT 1 · 1:00–1:30',
    title: 'Bilingual Collection Receipt · Batch #BS-402',
    village: 'Karanjia Primary MFP Procurement Point #04',
    badge: 'PAID (SIMULATED)',
    badgeColor: 'text-success bg-success/10 border-success',
    details: [
      { label: 'Batch Reference', value: '#BS-402' },
      { label: 'Net Weight', value: '100.00 kg' },
      { label: 'Rate Source', value: 'TDCCOL / LABHA Yojana MSP Circular Ref: TDC/MFP/2024-R4' },
      { label: 'Total Amount', value: '₹4,200.00' },
      { label: 'Bank Account', value: 'Canara Bank (Karanjia Branch) •••4812' },
      { label: 'Bilingual Guarantee', value: 'English record paired with Odia translation (Noto Sans Oriya)' },
    ],
    highlight: 'Non-accusatory legal safeguard: "Prototype — not a legal document. Payment simulated under LABHA guarantee."',
  },
  {
    step: 3,
    act: 'ACT 1 · 1:15–1:30',
    title: 'A6 Sack Stencil Tag & Deterministic QR',
    village: 'Baripada Transit Route Dispatch',
    badge: 'DISPATCH CLEARANCE',
    badgeColor: 'text-ink bg-bg-sunken border-ink',
    details: [
      { label: 'Short Stencil Code', value: 'BS-402 (Fraunces 32px Tabular)' },
      { label: 'Bag Count & Tare', value: '2 Sacks Double-Stitched · Tare 1.5 kg' },
      { label: 'Security Seal ID', value: 'OD-MBJ-KRN-402 (Tamper-evident wire)' },
      { label: 'Vehicle Number', value: 'OD-11-AB-1234 (Driver: B. Nayak)' },
      { label: 'Transit Waybill', value: 'WB-OD-24-099 (Tarpaulin Cover Confirmed)' },
      { label: 'QR Payload', value: 'Cryptographic Hash + Offline Field Record Data' },
    ],
    highlight: 'Physical-to-digital link: Bag stencil matches physical sack stencil for warehouse intake verification.',
  },
  {
    step: 4,
    act: 'ACT 2 · 1:30–2:00',
    title: 'Baripada Central Depôt Intake Re-Weigh',
    village: 'Baripada Central Depôt #02 (Terminal: BRP-D02-09)',
    badge: 'PENDING VERIFICATION',
    badgeColor: 'text-warning bg-warning/10 border-warning',
    details: [
      { label: 'Arrival Platform Scale', value: 'Electronic Platform Scale #02 (Calibrated Oct 2024)' },
      { label: 'Arrival Gross Weight', value: '96.50 kg' },
      { label: 'Tare Weight', value: '1.50 kg' },
      { label: 'Arrival Net Weight', value: '95.00 kg' },
      { label: 'Gross Transit Loss', value: '-5.00 kg vs Village Dispatch (100.00 kg)' },
      { label: 'Receiver', value: 'S. Das (Warehouse Inventory Manager ID: IM-04)' },
    ],
    highlight: 'Pre-filled and instant: Arrival re-weigh renders in <300ms with zero typing required on stage.',
  },
  {
    step: 5,
    act: 'ACT 2 · 2:00–2:30',
    title: 'Shrinkage Excess Deficit & Quarantine Vault',
    village: 'Automated Discrepancy Engine Execution',
    badge: 'QUARANTINED DISCREPANCY',
    badgeColor: 'text-danger bg-danger/10 border-danger',
    details: [
      { label: 'Natural Shrinkage Limit', value: '1.5% (-1.50 kg natural transit desiccation)' },
      { label: 'Observed Transit Deficit', value: '-5.00 kg total loss' },
      { label: 'Unexplained Excess Variance', value: '-3.50 kg (Exceeds Allowable Limit)' },
      { label: 'Integrity Action', value: 'Batch locked from saleable stock; moved to Quarantine Bay 2' },
      { label: 'Supervisor Case', value: '#DISC-402 assigned to DPO Mayurbhanj' },
      { label: 'Tribal Payout Impact', value: 'ZERO: Tribal gatherer payout protected under LABHA guarantee' },
    ],
    highlight: 'Non-punitive integrity: Deficit is investigated as moisture equilibrium issue under standard non-accusatory protocol.',
  },
  {
    step: 6,
    act: 'ACT 3 · 2:30–3:00',
    title: 'Monotonic Custody Hash & Precedent Resolution',
    village: 'State Procurement Cloud Ledger',
    badge: 'AUDIT VERIFIED',
    badgeColor: 'text-info bg-info/10 border-info',
    details: [
      { label: 'Audit Chain Version', value: 'BanaSetu Monotonic Custody Hash v3.2' },
      { label: 'Cryptographic Proof', value: 'SHA-256:7a9f4c01d...8841 (Tamper-evident block)' },
      { label: 'Historical Precedent', value: 'Case #BS-395: Natural shrinkage reconciled by DPO A.K. Patnaik' },
      { label: 'Saleable Inventory', value: '60.0 kg verified stock available (#BS-400)' },
      { label: 'Tribal Safeguard Protocol', value: 'Reconciliation protects collective gatherer confidence' },
      { label: 'Evaluator Colophon', value: 'ISO/IEC 25010 conformant · Zero slop · Strict 1px rules' },
    ],
    highlight: 'End-to-end integrity: From forest floor aggregation to state warehouse audit verification.',
  },
];

export default function FallbackSlidesPage() {
  return (
    <div className="min-h-screen bg-bg text-ink p-6 print:p-0">
      {/* Top Navigation & Print Controls */}
      <div className="max-w-5xl mx-auto flex items-center justify-between border-b border-rule pb-4 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/demo?demo=1"
            className="h-8 px-2.5 rounded-[2px] border border-rule bg-surface text-[12px] font-mono flex items-center gap-1.5 hover:border-ink"
          >
            <ArrowLeft size={14} /> Back to /demo
          </Link>
          <span className="font-heading font-semibold text-[18px]">
            BanaSetu Stage Fallback Slide Deck (6 Steps)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="h-8 px-3 rounded-[2px] border border-accent bg-accent text-accent-ink text-[12px] font-medium flex items-center gap-1.5 hover:bg-accent/90"
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Slide Stack */}
      <div className="max-w-5xl mx-auto space-y-8 print:space-y-0">
        {SLIDES.map((slide) => (
          <div
            key={slide.step}
            className="bg-surface border border-rule p-8 print:p-8 print:border-none print:h-screen print:page-break-after-always flex flex-col justify-between"
          >
            {/* Slide Header */}
            <div>
              <div className="flex items-center justify-between border-b border-rule pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold bg-ink text-surface px-2 py-0.5 rounded-[2px]">
                    SLIDE {slide.step} / 6
                  </span>
                  <span className="font-mono text-[12px] font-bold text-accent">
                    {slide.act}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-[2px] border ${slide.badgeColor}`}
                >
                  {slide.badge}
                </span>
              </div>

              <h2 className="font-heading text-[26px] font-bold text-ink mb-1">
                {slide.title}
              </h2>
              <p className="text-[13px] text-ink-muted mb-6">
                {slide.village}
              </p>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-rule bg-bg-sunken/30 p-5 rounded-[2px] mb-6">
                {slide.details.map((d, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                      {d.label}
                    </div>
                    <div className="text-[14px] font-medium text-ink font-mono">
                      {d.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Footer */}
            <div className="border-t border-rule pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-ink-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent shrink-0" />
                <span className="italic">{slide.highlight}</span>
              </div>
              <div className="font-mono text-[11px] text-ink-subtle">
                BanaSetu · TDCCOL Odisha Tribal MFP Ledger
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
