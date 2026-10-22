'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  DEMO_PRODUCT,
  DEMO_COLLECTORS,
  DEMO_FACILITATOR,
} from '../../../../demo/seed';
import { getDatabase } from '../../../../lib/db';
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
  const [dbBatch, setDbBatch] = useState<any>(null);

  useEffect(() => {
    async function loadBatch() {
      if (typeof window === 'undefined') return;
      try {
        const cleanCode = code.replace('#', '');
        const db = getDatabase();
        const found = await db.batches.get(cleanCode);
        if (found) {
          setDbBatch(found);
        }
      } catch (err) {
        console.warn('Could not load batch from Dexie:', err);
      }
    }
    loadBatch();
  }, [code]);

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

  const cleanCode = code.replace('#', '');
  const collector =
    dbBatch?.collectors?.[0] ||
    (cleanCode === 'BS-400'
      ? DEMO_COLLECTORS[1]
      : cleanCode === 'BS-398'
      ? DEMO_COLLECTORS[2]
      : DEMO_COLLECTORS[0]);

  const grossWeightKg = dbBatch?.step1?.grossWeightKg ?? (cleanCode === 'BS-400' ? 61.2 : cleanCode === 'BS-398' ? 26.2 : 104.2);
  const tareWeightKg = dbBatch?.step1?.tareWeightKg ?? (cleanCode === 'BS-400' ? 1.2 : cleanCode === 'BS-398' ? 1.2 : 4.2);
  const netWeightKg = dbBatch?.step1?.netAcceptedKg ?? dbBatch?.step2?.arrivalNetWeightKg ?? (cleanCode === 'BS-400' ? 60.0 : cleanCode === 'BS-398' ? 25.0 : 100.0);
  const ratePerKg = dbBatch?.referenceRatePerKg ?? DEMO_PRODUCT.ratePerKg;
  const totalAmount = Number((netWeightKg * ratePerKg).toFixed(2));

  const receiptData: CollectionReceiptData = {
    code,
    collectorName: collector.name,
    collectorNameOdia: collector.nameOdia,
    tribalId: collector.tribalId,
    village: collector.village,
    villageOdia: collector.villageOdia,
    center: dbBatch?.centerName || DEMO_FACILITATOR.center,
    productName: dbBatch?.produceName || DEMO_PRODUCT.name,
    productNameOdia: dbBatch?.produceOdia || DEMO_PRODUCT.nameOdia,
    grossWeightKg,
    tareWeightKg,
    netWeightKg,
    ratePerKg,
    rateSource: dbBatch?.rateSource || `${DEMO_PRODUCT.rateSource} · LABHA Scheme Notified Floor`,
    totalAmount,
    dateStr: dbBatch?.step1?.verifiedAt || '14 Mar 2025 · 09:15 AM IST',
    dateOdia: '୧୪ ମାର୍ଚ୍ଚ ୨୦୨୫ · ସକାଳ ୦୯:୧୫',
    paymentStatus: dbBatch?.status === 'VERIFIED_SALEABLE' ? 'Direct Benefit Transfer (DBT) Credited' : 'Direct Benefit Transfer (DBT) Pending Depôt Sync',
    paymentRef: collector.dbtRef || 'TXN-998-SIMULATED',
    managerName: dbBatch?.facilitatorName || DEMO_FACILITATOR.name,
    managerId: DEMO_FACILITATOR.id,
    syncState: dbBatch?.status === 'SAVED_OFFLINE_PENDING_SYNC' ? 'queued' : 'synced',
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
