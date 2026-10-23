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
import { ArrowLeft, Printer, Download, FileText, Share2 } from 'lucide-react';
import { downloadPdfBlob, sharePdf } from '../../../../lib/pdfClient';

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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

  // Dedicated Download PDF Handler
  const handleDownloadPdf = async () => {
    try {
      await downloadPdfBlob({
        url: `/api/receipts/${cleanCode}/pdf`,
        filename: `BanaSetu-Receipt-${cleanCode}.pdf`,
        onLoadingChange: setIsDownloadingPdf,
        onSuccess: (fn) => setToastMessage(`Receipt PDF downloaded: ${fn}`),
        onError: (err) => setToastMessage(err),
      });
    } catch {
      // Handled in onError
    }
  };

  // Dedicated Share PDF Handler
  const handleSharePdf = async () => {
    try {
      await sharePdf({
        url: `/api/receipts/${cleanCode}/pdf`,
        filename: `BanaSetu-Receipt-${cleanCode}.pdf`,
        title: `BanaSetu Receipt ${cleanCode}`,
        text: `Official BanaSetu A5 Collection Receipt for Batch #${cleanCode} (${receiptData.productName}, ${receiptData.netWeightKg} kg)`,
        onLoadingChange: setIsSharingPdf,
        onSuccess: () => setToastMessage('Receipt shared successfully'),
        onError: (err) => setToastMessage(err),
      });
    } catch {
      // Handled in onError
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Download Action */}
          <Button
            id="btn-download-receipt-pdf"
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            title="Download official server-signed A5 Receipt PDF directly"
          >
            <Download size={14} strokeWidth={1.5} />
            <span>{isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
          </Button>

          {/* Dedicated Share Action */}
          <Button
            id="btn-share-receipt-pdf"
            variant="secondary"
            size="sm"
            onClick={handleSharePdf}
            disabled={isSharingPdf}
            title="Share official A5 Receipt PDF via system share sheet"
          >
            <Share2 size={14} strokeWidth={1.5} />
            <span>{isSharingPdf ? 'Sharing...' : 'Share'}</span>
          </Button>

          {/* Direct link preserving existing test inspection */}
          <a
            href={`/api/receipts/${cleanCode}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-rule bg-surface text-[12px] font-medium text-ink hover:bg-bg-sunken hover:border-ink-subtle select-none"
            title="Download official server-signed A5 Receipt PDF"
          >
            <FileText size={14} strokeWidth={1.5} />
            <span>Official A5 PDF</span>
          </a>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPng}
            disabled={isDownloading}
          >
            <Download size={14} strokeWidth={1.5} />
            <span>{isDownloading ? 'Exporting...' : 'PNG'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer size={14} strokeWidth={1.5} />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {toastMessage && (
        <div className="no-print w-full max-w-[148mm] mb-4 p-2.5 rounded-[4px] border border-rule bg-surface text-[13px] text-ink flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[11px] font-mono text-ink-muted hover:text-ink underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* A5 Printable Receipt Artifact */}
      <div ref={receiptRef} className="w-full flex justify-center">
        <CollectionReceiptArtifact data={receiptData} />
      </div>
    </div>
  );
}
