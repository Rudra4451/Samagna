'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  DEMO_PRODUCT,
  DEMO_COLLECTORS,
} from '../../../../demo/seed';
import { Button } from '../../../../components/ui/Button';
import { SackTagArtifact, SackTagData } from '../../../../components/artifacts/SackTagArtifact';
import { ArrowLeft, Printer, Download } from 'lucide-react';

interface TagPageProps {
  params: {
    code: string;
  };
}

export default function CollectionTagPage({ params }: TagPageProps) {
  const rawCode = decodeURIComponent(params.code || 'BS-402');
  const code = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

  const tagRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
  const collectorFirstName = collector.name.split(' ')[0]; // Raimati

  const tagData: SackTagData = {
    code,
    productName: DEMO_PRODUCT.name,
    collectorFirstName, // First name + village only (no full identity)
    village: collector.village,
    dateStr: '14 Mar 2025 · 09:15 AM',
    netWeightKg: 100.0,
    helplinePhone: '1800-XXX-XXXX',
  };

  return (
    <div className="min-h-screen bg-bg text-ink py-6 px-4 flex flex-col items-center">
      {/* Print CSS: A6 portrait with 12mm margins, no shell chrome, white body background */}
      <style jsx global>{`
        @media print {
          @page {
            size: 105mm 148mm;
            margin: 12mm;
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
          .a6-tag-card {
            width: 81mm !important;
            min-height: 124mm !important;
            max-width: 81mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* On-screen Utility Toolbar (hidden in print) */}
      <div className="no-print w-full max-w-[105mm] mb-5 flex items-center justify-between gap-2 border-b border-rule pb-3">
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
            <span>Print Preview</span>
          </Button>
        </div>
      </div>

      {/* A6 Printable Tag Sheet */}
      <div ref={tagRef} className="w-full flex justify-center">
        <SackTagArtifact data={tagData} />
      </div>
    </div>
  );
}
