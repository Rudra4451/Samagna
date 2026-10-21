'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  DEMO_PRODUCT,
  DEMO_COLLECTORS,
  DEMO_FACILITATOR,
} from '../../../../demo/seed';
import { Button } from '../../../../components/ui/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { SectionLabel } from '../../../../components/ui/SectionLabel';
import { ArrowLeft, Printer, Download, ShieldCheck } from 'lucide-react';

interface ReceiptPageProps {
  params: {
    code: string;
  };
}

export default function CollectionReceiptPage({ params }: ReceiptPageProps) {
  const rawCode = decodeURIComponent(params.code || 'BS-402');
  const code = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle Download PNG via html-to-image
  const handleDownloadPng = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 3,
        backgroundColor: '#FFFFFF',
      });
      const link = document.createElement('a');
      link.download = `BanaSetu-Receipt-${code.replace('#', '')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const collector = DEMO_COLLECTORS[0]; // Raimati Soren

  return (
    <div className="min-h-screen bg-bg text-ink py-6 px-4 flex flex-col items-center">
      {/* Print-specific style for A5 portrait with 3mm bleed */}
      <style jsx global>{`
        @media print {
          @page {
            size: 148mm 210mm;
            margin: 3mm;
          }
          body {
            background: #ffffff !important;
            color: #1f1a14 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header,
          nav,
          aside,
          footer,
          .no-print {
            display: none !important;
          }
          .a5-receipt-container {
            width: 142mm !important;
            min-height: 204mm !important;
            margin: 0 auto !important;
            padding: 5mm !important;
            border: 1px solid #1f1a14 !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* On-screen Utility Toolbar (hidden in print) */}
      <div className="no-print w-full max-w-[560px] mb-5 flex items-center justify-between gap-2 border-b border-rule pb-3">
        <Link
          href="/collection"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink select-none"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to Collection</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPng}
            disabled={isDownloading}
          >
            <Download size={16} strokeWidth={1.5} />
            <span>{isDownloading ? 'Exporting...' : 'Download PNG'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer size={16} strokeWidth={1.5} />
            <span>Print Receipt</span>
          </Button>
        </div>
      </div>

      {/* A5 Printable Receipt Sheet (148mm × 210mm portrait) */}
      <div
        ref={receiptRef}
        className="a5-receipt-container w-[148mm] min-h-[210mm] border border-rule bg-surface p-6 text-ink flex flex-col justify-between shadow-none select-none relative"
      >
        <div className="space-y-4">
          {/* Header Block: Heading & Batch Code */}
          <div className="border-b border-rule pb-3 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-[22px] font-bold text-ink leading-tight">
                Collection receipt · ସଂଗ୍ରହ ରସିଦ
              </h1>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Tribal Development Co-operative Corporation of Odisha (TDCCOL)
              </p>
              <p className="font-odia text-[11px] text-ink-subtle">
                ଓଡ଼ିଶା ଆଦିବାସୀ ଉନ୍ନୟନ ସମବାୟ ନିଗମ
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-semibold">
                Batch Code
              </span>
              <span className="font-heading text-[20px] font-bold tabular-nums text-accent">
                {code}
              </span>
            </div>
          </div>

          {/* Collector & Procurement Context */}
          <div className="grid grid-cols-2 gap-3 text-[13px] border-b border-rule pb-3.5">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                Primary Collector / ଆଦିବାସୀ ସଂଗ୍ରାହକ
              </span>
              <div className="font-semibold text-ink">{collector.name}</div>
              <div className="font-odia text-[12px] text-ink-muted">{collector.nameOdia}</div>
              <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
                Tribal ID: {collector.tribalId}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                Village & GP / ଗ୍ରାମ ଓ ପଞ୍ଚାୟତ
              </span>
              <div className="font-medium text-ink">{collector.village}</div>
              <div className="font-odia text-[12px] text-ink-muted">{collector.villageOdia}</div>
              <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
                Center: {DEMO_FACILITATOR.center}
              </div>
            </div>
          </div>

          {/* Product & Date */}
          <div className="grid grid-cols-2 gap-3 text-[13px] border-b border-rule pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                Produce / ବନଜାତ ଦ୍ରବ୍ୟ
              </span>
              <div className="font-semibold text-ink">{DEMO_PRODUCT.name}</div>
              <div className="font-odia text-[12px] text-ink-muted">{DEMO_PRODUCT.nameOdia}</div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-ink-muted block">
                Weighment Date / ଓଜନ ତାରିଖ
              </span>
              <div className="font-mono text-[13px] text-ink">14 Mar 2025 · 09:15 AM IST</div>
              <div className="font-odia text-[11px] text-ink-subtle">୧୪ ମାର୍ଚ୍ଚ ୨୦୨୫</div>
            </div>
          </div>

          {/* Weight Breakdown in a 1px Bordered Table */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-semibold">
              Certified Weight Breakdown / ପ୍ରମାଣିତ ଓଜନ ତାଲିକା
            </span>
            <div className="border border-rule rounded-[2px] overflow-hidden">
              <table className="w-full text-[13px] border-collapse bg-surface">
                <thead>
                  <tr className="bg-bg-sunken border-b border-rule text-[11px] uppercase tracking-[0.06em] text-ink-muted font-mono">
                    <th className="p-2 text-left">Weigh Step</th>
                    <th className="p-2 text-left font-odia">ଓଜନ ପର୍ଯ୍ୟାୟ</th>
                    <th className="p-2 text-right">Value (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono tabular-nums">
                  <tr>
                    <td className="p-2">Electronic Gross Weight</td>
                    <td className="p-2 font-odia font-normal text-ink-muted">ମୋଟ ଓଜନ</td>
                    <td className="p-2 text-right font-medium">104.20 kg</td>
                  </tr>
                  <tr>
                    <td className="p-2">Packaging Tare Deduction</td>
                    <td className="p-2 font-odia font-normal text-ink-muted">ବସ୍ତା ଓଜନ ବାବଦ</td>
                    <td className="p-2 text-right text-ink-muted">4.20 kg</td>
                  </tr>
                  <tr className="bg-bg-sunken/40 font-bold">
                    <td className="p-2 text-ink">Net Accepted Weight</td>
                    <td className="p-2 font-odia text-ink">ନିଟ୍ ଗ୍ରହଣଯୋଗ୍ୟ ଓଜନ</td>
                    <td className="p-2 text-right text-accent text-[15px]">100.00 kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing & Entitlement Amount */}
          <div className="border border-rule rounded-[2px] p-3.5 bg-bg-sunken/30 space-y-2">
            <div className="flex justify-between items-baseline border-b border-rule pb-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-muted block">
                  Notified Minimum Support Price / ସରକାରୀ ଦର
                </span>
                <span className="font-mono text-[14px] font-semibold text-ink">
                  ₹{DEMO_PRODUCT.ratePerKg.toFixed(2)} / kg
                </span>
                <span className="text-[11px] text-ink-subtle block font-mono">
                  Source: {DEMO_PRODUCT.rateSource} · LABHA Scheme
                </span>
                <span className="font-odia text-[11px] text-ink-subtle block">
                  ପ୍ରତି କେଜି ₹୪୨ · ଲାଭ ଯୋଜନା ନିୟମ
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-ink-muted block">
                  Gross Entitlement / ସର୍ବମୋଟ ପ୍ରାପ୍ୟ
                </span>
                <span className="font-heading text-[26px] font-bold tabular-nums text-accent">
                  ₹4,200.00
                </span>
              </div>
            </div>

            {/* Payment Status Badge */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-ink-muted">
                Settlement Channel: Direct Benefit Transfer
              </span>
              <StatusBadge variant="neutral">
                Simulated · TXN-998-SIMULATED
              </StatusBadge>
            </div>
          </div>

          {/* Hand-Signature Line */}
          <div className="pt-4 border-t border-rule">
            <div className="grid grid-cols-2 gap-6 items-end">
              <div className="space-y-6">
                <div className="border-b border-ink/40 w-4/5 pb-1">
                  <span className="font-mono text-[11px] text-ink-subtle block">
                    Facilitator: {DEMO_FACILITATOR.name}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-ink block">
                    Facilitator Signature / ସହାୟିକା ସ୍ୱାକ୍ଷର
                  </span>
                  <span className="text-[10px] font-mono text-ink-subtle">
                    ID: {DEMO_FACILITATOR.id}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div className="inline-block border border-ink/40 w-24 h-16 bg-bg-sunken/40 rounded-[2px] p-1 text-center">
                  <span className="text-[9px] font-mono text-ink-subtle block mt-4">
                    [ THUMBPRINT ]
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-ink block">
                    Collector Thumbprint / ସଂଗ୍ରାହକ ଟିପଚିହ୍ନ
                  </span>
                  <span className="text-[10px] font-mono text-ink-subtle">
                    {collector.name} ({collector.tribalId})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Prototype Disclaimer */}
        <div className="border-t border-rule pt-2.5 mt-auto flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted font-mono select-none">
          <span>Prototype — not a legal receipt</span>
          <span className="text-[9px] text-ink-subtle">A5 COLLECTOR RECEIPT SPEC</span>
        </div>
      </div>
    </div>
  );
}
