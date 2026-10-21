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
import { CollectionReceiptArtifact, CollectionReceiptData } from '../../../../components/artifacts/CollectionReceiptArtifact';
import { ArrowLeft, Printer, Download } from 'lucide-react';

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

  const receiptData: CollectionReceiptData = {
    code,
    collectorName: collector.name,
    collectorNameOdia: collector.nameOdia,
    tribalId: collector.tribalId,
    village: collector.village,
    villageOdia: collector.villageOdia,
    center: DEMO_FACILITATOR.center,
    productName: DEMO_PRODUCT.name,
    productNameOdia: DEMO_PRODUCT.nameOdia,
    grossWeightKg: 104.2,
    tareWeightKg: 4.2,
    netWeightKg: 100.0,
    ratePerKg: DEMO_PRODUCT.ratePerKg,
    rateSource: `${DEMO_PRODUCT.rateSource} · LABHA Scheme Notified Floor`,
    totalAmount: 100.0 * DEMO_PRODUCT.ratePerKg,
    dateStr: '14 Mar 2025 · 09:15 AM IST',
    dateOdia: '୧୪ ମାର୍ଚ୍ଚ ୨୦୨୫ · ସକାଳ ୦୯:୧୫',
    paymentStatus: 'Direct Benefit Transfer (DBT)',
    paymentRef: 'TXN-998-SIMULATED',
    managerName: DEMO_FACILITATOR.name,
    managerId: DEMO_FACILITATOR.id,
    syncState: code === '#BS-402' ? 'queued' : 'synced',
  };

  return (
    <div className="min-h-screen bg-bg text-ink py-6 px-4 flex flex-col items-center">
      {/* Print CSS: A5 portrait with 12mm margins, no shell chrome, white body background */}
      <style jsx global>{`
        @media print {
          @page {
            size: 148mm 210mm;
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
          .a5-receipt-card {
            width: 124mm !important;
            min-height: 186mm !important;
            max-width: 124mm !important;
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
      <div className="no-print w-full max-w-[148mm] mb-5 flex items-center justify-between gap-2 border-b border-rule pb-3">
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

      {/* A5 Printable Receipt Artifact */}
      <div ref={receiptRef} className="w-full flex justify-center">
        <CollectionReceiptArtifact data={receiptData} />
      </div>
    </div>
  );
}
