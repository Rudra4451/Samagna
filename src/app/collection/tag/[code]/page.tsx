'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import {
  DEMO_PRODUCT,
  DEMO_COLLECTORS,
  DEMO_FACILITATOR,
  DEMO_BATCH_BS402,
} from '../../../../demo/seed';
import { Button } from '../../../../components/ui/Button';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { SyncStatusBadge } from '../../../../components/ui/SyncStatusBadge';
import { SectionLabel } from '../../../../components/ui/SectionLabel';
import { ArrowLeft, Printer, Download, Check } from 'lucide-react';

interface TagPageProps {
  params: {
    code: string;
  };
}

export default function CollectionTagPage({ params }: TagPageProps) {
  const rawCode = decodeURIComponent(params.code || 'BS-402');
  const code = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

  const tagRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate deterministic 96x96 QR
  useEffect(() => {
    async function makeQR() {
      try {
        const url = await QRCode.toDataURL(`BANASETU-TAG-${code}-TDCCOL-MAYURBHANJ`, {
          width: 96,
          margin: 1,
          color: {
            dark: '#1F1A14',
            light: '#FFFFFF',
          },
        });
        setQrUrl(url);
      } catch (err) {
        console.error('QR code generation failed:', err);
      }
    }
    makeQR();
  }, [code]);

  // Handle Download PNG via html-to-image
  const handleDownloadPng = async () => {
    if (!tagRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(tagRef.current, {
        pixelRatio: 3,
        backgroundColor: '#FFFFFF',
      });
      const link = document.createElement('a');
      link.download = `BanaSetu-Tag-${code.replace('#', '')}.png`;
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
      {/* Print-specific style for A6 portrait with 2mm bleed */}
      <style jsx global>{`
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 2mm;
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
          .a6-tag-container {
            width: 101mm !important;
            height: 144mm !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            border: 1px solid #1f1a14 !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* On-screen Utility Toolbar (hidden in print) */}
      <div className="no-print w-full max-w-[420px] mb-5 flex items-center justify-between gap-2 border-b border-rule pb-3">
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
            <span>Print Tag</span>
          </Button>
        </div>
      </div>

      {/* A6 Printable Tag Sheet (105mm × 148mm portrait) */}
      <div
        ref={tagRef}
        className="a6-tag-container w-[105mm] min-h-[148mm] border border-rule bg-surface p-5 text-ink flex flex-col justify-between shadow-none select-none relative"
      >
        <div>
          {/* Top Row: Short Code in Fraunces 28px + 96x96 QR Placeholder */}
          <div className="flex items-start justify-between gap-3 border-b border-rule pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-muted block font-bold">
                  Produce Batch Tag
                </span>
                <SyncStatusBadge state={code === '#BS-402' ? 'queued' : 'synced'} />
              </div>
              <div className="font-heading text-[28px] font-bold tabular-nums text-ink leading-tight">
                {code}
              </div>
              <span className="text-[11px] font-mono text-ink-subtle block">
                TDCCOL Mayurbhanj Circle
              </span>
            </div>

            {/* 96x96 QR Code Placeholder */}
            <div className="w-[96px] h-[96px] border border-rule bg-surface p-1 shrink-0 flex items-center justify-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR Tag for ${code}`}
                  loading="lazy"
                  className="w-full h-full object-contain [image-rendering:pixelated]"
                />
              ) : (
                <div className="w-full h-full bg-bg-sunken flex items-center justify-center text-[10px] font-mono text-ink-muted">
                  96×96 QR
                </div>
              )}
            </div>
          </div>

          {/* Details Table: Product, Collector, Village, Date, Net Weight, Quality */}
          <div className="py-3.5 space-y-2 text-[13px] leading-snug">
            <div className="flex justify-between border-b border-rule pb-1.5">
              <span className="text-ink-muted">Product:</span>
              <span className="font-semibold text-ink text-right">
                {DEMO_PRODUCT.name}
              </span>
            </div>

            <div className="flex justify-between border-b border-rule pb-1.5">
              <span className="text-ink-muted">Collector:</span>
              <span className="font-medium text-ink text-right">
                {collector.name} ({collector.tribalId})
              </span>
            </div>

            <div className="flex justify-between border-b border-rule pb-1.5">
              <span className="text-ink-muted">Village / GP:</span>
              <span className="text-ink text-right">
                {collector.village}
              </span>
            </div>

            <div className="flex justify-between border-b border-rule pb-1.5">
              <span className="text-ink-muted">Collection Date:</span>
              <span className="font-mono text-[12px] text-ink text-right">
                14 Mar 2025 · 09:15 AM IST
              </span>
            </div>

            <div className="flex justify-between border-b border-rule pb-1.5 items-baseline">
              <span className="text-ink-muted">Net Weight:</span>
              <span className="font-heading text-[18px] font-bold tabular-nums text-accent text-right">
                100.00 kg Net
              </span>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-ink-muted">Quality Grade:</span>
              <span className="font-mono font-bold text-ink uppercase text-[12px] bg-bg-sunken border border-rule px-2 py-0.5 rounded-[2px]">
                Grade A · Sun-Dried
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Rule and Small-Caps Colophon */}
        <div className="border-t border-rule pt-2.5 mt-auto flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted font-mono select-none">
          <span>BanaSetu · Prototype</span>
          <span className="text-[9px] text-ink-subtle">A6 FIELD TAG SPEC</span>
        </div>
      </div>
    </div>
  );
}
