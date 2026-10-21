'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/shell/AppShell';
import { Button } from '../../../components/ui/Button';
import { CollectionReceiptArtifact, CollectionReceiptData } from '../../../components/artifacts/CollectionReceiptArtifact';
import { SackTagArtifact, SackTagData } from '../../../components/artifacts/SackTagArtifact';
import { AuditTimelineArtifact, AuditTimelineEvent } from '../../../components/artifacts/AuditTimelineArtifact';
import { DiscrepancyCardArtifact } from '../../../components/artifacts/DiscrepancyCardArtifact';
import { VerifiedBadge } from '../../../components/ui/VerifiedBadge';
import { Printer, ExternalLink, ArrowRight, FileText, Tag, Clock, ShieldCheck, Scale } from 'lucide-react';

const SAMPLE_BATCHES: Record<string, { receipt: CollectionReceiptData; tag: SackTagData; timeline: AuditTimelineEvent[]; collectionKg: number; receivedKg: number }> = {
  '#BS-402': {
    receipt: {
      code: '#BS-402',
      collectorName: 'Raimati Soren',
      collectorNameOdia: 'ରାଇମତୀ ସୋରେନ',
      tribalId: 'OD-MAY-7721',
      village: 'Badampahar, Similipal',
      villageOdia: 'ବାଦାମପାହାଡ଼, ଶିମିଳିପାଳ',
      center: 'Similipal North Facilitation Depot',
      productName: 'Mahua Flowers (Dry)',
      productNameOdia: 'ମହୁଲ ଫୁଲ (ଶୁଖିଲା)',
      grossWeightKg: 104.2,
      tareWeightKg: 4.2,
      netWeightKg: 100.0,
      ratePerKg: 42.0,
      rateSource: 'TRIFED MSP 2024-25',
      totalAmount: 4200.0,
      dateStr: '14 Mar 2025 · 09:15 AM IST',
      dateOdia: '୧୪ ମାର୍ଚ୍ଚ ୨୦୨୫ · ସକାଳ ୦୯:୧୫',
      paymentStatus: 'Direct Benefit Transfer (DBT)',
      paymentRef: 'TXN-998-SIMULATED',
      managerName: 'Gopal Soren',
      managerId: 'CM-MAY-04',
      syncState: 'queued',
    },
    tag: {
      code: '#BS-402',
      productName: 'Mahua Flowers (Dry)',
      collectorFirstName: 'Raimati',
      village: 'Badampahar',
      dateStr: '14 Mar 2025 · 09:15 AM',
      netWeightKg: 100.0,
      helplinePhone: '1800-XXX-XXXX',
    },
    collectionKg: 100.0,
    receivedKg: 95.0,
    timeline: [
      {
        id: '1',
        dayHeader: '14 March 2025',
        time: '09:15 AM',
        actor: 'Gopal Soren (Collector Lead CM-04)',
        action: 'Collected 100.0 kg Mahua from Raimati Soren at Badampahar weighing hub',
        delta: '+100.0 kg',
        deltaVariant: 'success',
      },
      {
        id: '2',
        dayHeader: '14 March 2025',
        time: '09:22 AM',
        actor: 'Tamper-Evident Seal Daemon',
        action: 'Sack Tag #BS-402 printed and tethered with RFID bar seal',
        delta: 'Tagged',
        deltaVariant: 'neutral',
      },
      {
        id: '3',
        dayHeader: '14 March 2025',
        time: '11:45 AM',
        actor: 'Storage Depot Guard',
        action: 'Arrival scan recorded at Baripada Central Granary Bay 4',
        delta: 'Transit check',
        deltaVariant: 'neutral',
      },
      {
        id: '4',
        dayHeader: '14 March 2025',
        time: '02:10 PM',
        actor: 'S. Das (Warehouse Supervisor IM-04)',
        action: 'Electronic scales recorded 95.0 kg arrival weight. Natural shrinkage calculation logged.',
        delta: '-5.0 kg',
        deltaVariant: 'danger',
        isLive: true,
      },
    ],
  },
  '#BS-400': {
    receipt: {
      code: '#BS-400',
      collectorName: 'Sunita Majhi',
      collectorNameOdia: 'ସୁନୀତା ମାଝୀ',
      tribalId: 'OD-MAY-4019',
      village: 'Kaptipada',
      villageOdia: 'କପ୍ତିପଦା',
      center: 'Similipal South Procurement Point',
      productName: 'Sal Seeds (Grade A)',
      productNameOdia: 'ଶାଳ ମଞ୍ଜି (ଗ୍ରେଡ୍ ଏ)',
      grossWeightKg: 52.1,
      tareWeightKg: 2.1,
      netWeightKg: 50.0,
      ratePerKg: 30.0,
      rateSource: 'TRIFED MSP 2024-25',
      totalAmount: 1500.0,
      dateStr: '14 Mar 2025 · 08:30 AM IST',
      dateOdia: '୧୪ ମାର୍ଚ୍ଚ ୨୦୨୫ · ସକାଳ ୦୮:୩୦',
      paymentStatus: 'Direct Benefit Transfer (DBT)',
      paymentRef: 'TXN-992-SIMULATED',
      managerName: 'Gopal Soren',
      managerId: 'CM-MAY-04',
      syncState: 'synced',
    },
    tag: {
      code: '#BS-400',
      productName: 'Sal Seeds (Grade A)',
      collectorFirstName: 'Sunita',
      village: 'Kaptipada',
      dateStr: '14 Mar 2025 · 08:30 AM',
      netWeightKg: 50.0,
      helplinePhone: '1800-XXX-XXXX',
    },
    collectionKg: 50.0,
    receivedKg: 49.6,
    timeline: [
      {
        id: '1',
        dayHeader: '14 March 2025',
        time: '08:30 AM',
        actor: 'Gopal Soren (Collector Lead CM-04)',
        action: 'Collected 50.0 kg Sal Seeds from Sunita Majhi at Kaptipada depot',
        delta: '+50.0 kg',
        deltaVariant: 'success',
      },
      {
        id: '2',
        dayHeader: '14 March 2025',
        time: '12:00 PM',
        actor: 'S. Das (Warehouse Supervisor IM-04)',
        action: 'Verified arrival weight 49.6 kg. Within 1.5% natural shrinkage limit.',
        delta: '-0.4 kg',
        deltaVariant: 'neutral',
      },
      {
        id: '3',
        dayHeader: '14 March 2025',
        time: '12:05 PM',
        actor: 'S. Das (Warehouse Supervisor IM-04)',
        action: 'Adjudicated as Available (Saleable Stock). Marked Verified.',
        delta: '+49.6 kg saleable',
        deltaVariant: 'success',
      },
    ],
  },
  '#BS-398': {
    receipt: {
      code: '#BS-398',
      collectorName: 'Gita Murmu',
      collectorNameOdia: 'ଗୀତା ମୁର୍ମୁ',
      tribalId: 'OD-MAY-8812',
      village: 'Udala',
      villageOdia: 'ଉଦଳା',
      center: 'Similipal Central Depot',
      productName: 'Wild Forest Honey (Raw)',
      productNameOdia: 'ଜଙ୍ଗଲି ମହୁ (କଞ୍ଚା)',
      grossWeightKg: 20.8,
      tareWeightKg: 0.8,
      netWeightKg: 20.0,
      ratePerKg: 180.0,
      rateSource: 'TRIFED MSP 2024-25',
      totalAmount: 3600.0,
      dateStr: '13 Mar 2025 · 04:40 PM IST',
      dateOdia: '୧୩ ମାର୍ଚ୍ଚ ୨୦୨୫ · ଅପରାହ୍ନ ୦୪:୪୦',
      paymentStatus: 'Direct Benefit Transfer (DBT)',
      paymentRef: 'TXN-980-SIMULATED',
      managerName: 'Gopal Soren',
      managerId: 'CM-MAY-04',
      syncState: 'synced',
    },
    tag: {
      code: '#BS-398',
      productName: 'Wild Forest Honey (Raw)',
      collectorFirstName: 'Gita',
      village: 'Udala',
      dateStr: '13 Mar 2025 · 04:40 PM',
      netWeightKg: 20.0,
      helplinePhone: '1800-XXX-XXXX',
    },
    collectionKg: 20.0,
    receivedKg: 20.0,
    timeline: [
      {
        id: '1',
        dayHeader: '13 March 2025',
        time: '04:40 PM',
        actor: 'Gopal Soren (Collector Lead CM-04)',
        action: 'Collected 20.0 kg Wild Honey from Gita Murmu',
        delta: '+20.0 kg',
        deltaVariant: 'success',
      },
      {
        id: '2',
        dayHeader: '14 March 2025',
        time: '10:00 AM',
        actor: 'S. Das (Warehouse Supervisor IM-04)',
        action: 'Zero variance sealed intake verified at storage. Marked Verified.',
        delta: '0.0 kg',
        deltaVariant: 'success',
      },
    ],
  },
};

export default function PrintDesignShowcasePage() {
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('#BS-402');
  const [activeTab, setActiveTab] = useState<'all' | 'receipt' | 'tag' | 'timeline' | 'discrepancy'>('all');
  const [supervisorNote, setSupervisorNote] = useState<string>(
    'Transit delay across Similipal mountain ghat recorded due to road clearing. Moisture loss consistent with high ambient temp.'
  );

  const currentSample = SAMPLE_BATCHES[selectedBatchCode] || SAMPLE_BATCHES['#BS-402'];

  return (
    <AppShell>
      {/* Print CSS override for clean print preview */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 12mm;
          }
          body {
            background: #ffffff !important;
            color: #1f1a14 !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header & Context */}
        <div className="border-b border-rule pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-muted font-bold">
                Design System · Designed Physical Artifacts
              </span>
              <VerifiedBadge />
            </div>
            <h1 className="font-heading text-[28px] font-bold text-ink leading-tight mt-1">
              Field Documents & Physical Artifacts
            </h1>
            <p className="text-[13px] text-ink-muted mt-1 max-w-2xl">
              Treated as designed artifacts, not generated text. Built to ISO physical dimensions (A5 Collection Receipt, A6 Sack Tag) with 12mm print margins, 1px rules, bilingual typography, and clean hierarchy.
            </p>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/collection/receipt/${selectedBatchCode.replace('#', '')}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-rule bg-surface text-ink text-[13px] font-medium hover:bg-bg-sunken hover:border-ink-subtle transition-colors"
            >
              <FileText size={15} strokeWidth={1.5} />
              <span>Open Dedicated A5 Receipt</span>
              <ExternalLink size={13} className="text-ink-subtle" />
            </Link>

            <Link
              href={`/collection/tag/${selectedBatchCode.replace('#', '')}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border border-rule bg-surface text-ink text-[13px] font-medium hover:bg-bg-sunken hover:border-ink-subtle transition-colors"
            >
              <Tag size={15} strokeWidth={1.5} />
              <span>Open Dedicated A6 Tag</span>
              <ExternalLink size={13} className="text-ink-subtle" />
            </Link>

            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
              className="no-print"
            >
              <Printer size={16} strokeWidth={1.5} />
              <span>Print Preview</span>
            </Button>
          </div>
        </div>

        {/* Batch Selector & Filter Tabs */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-rule rounded-[2px] p-2 bg-surface">
          {/* Batch Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-ink-muted font-bold pl-2">
              Select Batch:
            </span>
            <div className="flex items-center gap-1.5">
              {Object.keys(SAMPLE_BATCHES).map((code) => (
                <button
                  key={code}
                  onClick={() => setSelectedBatchCode(code)}
                  className={`px-2.5 py-1 text-[12px] font-mono rounded-[2px] border transition-colors ${
                    selectedBatchCode === code
                      ? 'bg-ink text-surface border-ink font-bold'
                      : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* View Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'all', label: 'All 4 Artifacts' },
                { id: 'receipt', label: '1. A5 Receipt' },
                { id: 'tag', label: '2. A6 Sack Tag' },
                { id: 'timeline', label: '3. Audit Timeline' },
                { id: 'discrepancy', label: '4. Discrepancy Card' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-[12px] font-medium rounded-[2px] border transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-bg-sunken text-ink border-ink-subtle font-semibold'
                    : 'bg-surface text-ink-muted border-transparent hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1 & 2: Physical Print Artifacts Side-by-Side (A5 & A6) */}
        {(activeTab === 'all' || activeTab === 'receipt' || activeTab === 'tag') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block">
                  Scale Field Documents
                </span>
                <h2 className="font-heading text-[20px] font-bold text-ink">
                  A5 Collection Receipt & A6 Sack Tag
                </h2>
              </div>
              <span className="text-[12px] font-mono text-ink-subtle">
                12mm Print Margins · Pure CSS Vector Rendering · 0% Color Bands
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: A5 Collection Receipt (148mm × 210mm) */}
              {(activeTab === 'all' || activeTab === 'receipt') && (
                <div className={activeTab === 'receipt' ? 'lg:col-span-12 flex justify-center' : 'lg:col-span-7 flex flex-col items-center'}>
                  <div className="w-full max-w-[148mm] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted px-1">
                      <span>A5 Specification (148mm × 210mm)</span>
                      <span>Fraunces 28px/36px · Odia Noto Sans 15px</span>
                    </div>

                    {/* The A5 Receipt Artifact */}
                    <div className="w-full shadow-none border border-rule rounded-[2px] overflow-hidden bg-bg/20 p-2 sm:p-4 flex justify-center">
                      <CollectionReceiptArtifact data={currentSample.receipt} />
                    </div>
                  </div>
                </div>
              )}

              {/* Right Column: A6 Sack Tag (105mm × 148mm) */}
              {(activeTab === 'all' || activeTab === 'tag') && (
                <div className={activeTab === 'tag' ? 'lg:col-span-12 flex justify-center' : 'lg:col-span-5 flex flex-col items-center'}>
                  <div className="w-full max-w-[105mm] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted px-1">
                      <span>A6 Specification (105mm × 148mm)</span>
                      <span>Fraunces 32px · 96px QR</span>
                    </div>

                    {/* The A6 Sack Tag Artifact */}
                    <div className="w-full shadow-none border border-rule rounded-[2px] overflow-hidden bg-bg/20 p-2 sm:p-4 flex justify-center">
                      <SackTagArtifact data={currentSample.tag} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3 & 4: In-App Operational Artifacts (Audit Timeline & Discrepancy Card) */}
        {(activeTab === 'all' || activeTab === 'timeline' || activeTab === 'discrepancy') && (
          <div className="space-y-4 pt-6 border-t border-rule">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block">
                  In-App Custodial Artifacts
                </span>
                <h2 className="font-heading text-[20px] font-bold text-ink">
                  Audit Timeline & Discrepancy Card
                </h2>
              </div>
              <span className="text-[12px] font-mono text-ink-subtle">
                Non-Punitive Language · Scannable in 5 Seconds
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Audit Timeline Artifact */}
              {(activeTab === 'all' || activeTab === 'timeline') && (
                <div className={activeTab === 'timeline' ? 'lg:col-span-2' : ''}>
                  <div className="border border-rule rounded-[4px] p-5 bg-surface space-y-4">
                    <div className="flex items-center justify-between border-b border-rule pb-2">
                      <div className="flex items-center gap-2">
                        <Clock size={16} strokeWidth={1.5} className="text-ink-muted" />
                        <h3 className="font-semibold text-ink text-[15px]">
                          Audit Timeline Artifact
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-ink-subtle">
                        Vertical 1px rule · 6px dots · Tabular deltas
                      </span>
                    </div>

                    <AuditTimelineArtifact
                      events={currentSample.timeline}
                      batchCode={selectedBatchCode}
                    />
                  </div>
                </div>
              )}

              {/* Discrepancy Card Artifact */}
              {(activeTab === 'all' || activeTab === 'discrepancy') && (
                <div className={activeTab === 'discrepancy' ? 'lg:col-span-2' : ''}>
                  <div className="border border-rule rounded-[4px] p-5 bg-surface space-y-4">
                    <div className="flex items-center justify-between border-b border-rule pb-2">
                      <div className="flex items-center gap-2">
                        <Scale size={16} strokeWidth={1.5} className="text-ink-muted" />
                        <h3 className="font-semibold text-ink text-[15px]">
                          Discrepancy Card Artifact
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-ink-subtle">
                        3 Columns · Tolerance panel · Flag not finding
                      </span>
                    </div>

                    <DiscrepancyCardArtifact
                      collectionKg={currentSample.collectionKg}
                      receivedKg={currentSample.receivedKg}
                      productName={currentSample.receipt.productName}
                      configuredTolerancePercent={1.5}
                      supervisorNote={supervisorNote}
                      onSupervisorNoteChange={setSupervisorNote}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: The "Verified" Badge Specifications */}
        <div className="border border-rule rounded-[4px] p-5 bg-surface space-y-3">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} strokeWidth={1.5} className="text-success" />
              <h3 className="font-semibold text-ink text-[15px]">
                5. The "Verified" Badge Specification
              </h3>
            </div>
            <VerifiedBadge />
          </div>
          <p className="text-[13px] text-ink-muted leading-relaxed">
            One badge style used everywhere stock becomes saleable: <strong>1px success border, 8% success tint, success text, 11px uppercase "Verified"</strong>. It appears on the batch row, drawer header, and stock tile simultaneously when approval happens. Do not use checkmarks alone — the word matters.
          </p>
          <div className="flex items-center gap-4 pt-1 text-[12px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">Drawer Header:</span>
              <VerifiedBadge />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">Table Row:</span>
              <VerifiedBadge size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-ink-muted">Stock Tile:</span>
              <VerifiedBadge />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
