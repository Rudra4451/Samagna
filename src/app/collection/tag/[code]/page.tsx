'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import {
  DEMO_PRODUCT,
  DEMO_COLLECTORS,
} from '../../../../demo/seed';
import { getDatabase } from '../../../../lib/db';
import { Button } from '../../../../components/ui/Button';
import { SackTagArtifact, SackTagData } from '../../../../components/artifacts/SackTagArtifact';
import { ArrowLeft, Printer, Download, FileText, Tag as TagIcon, Share2 } from 'lucide-react';
import { downloadPdfBlob, sharePdf } from '../../../../lib/pdfClient';

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<string | null>(null);
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

  // Dedicated Download Tag PDF Handler
  const handleDownloadTagPdf = async (type: 'collection' | 'product') => {
    setIsDownloadingPdf(type);
    try {
      const isColl = type === 'collection';
      await downloadPdfBlob({
        url: `/api/tags/${cleanCode}/pdf?type=${type}`,
        filename: `BanaSetu-${isColl ? 'BatchTag' : 'ProductTag'}-${cleanCode}.pdf`,
        onLoadingChange: (loading) => !loading && setIsDownloadingPdf(null),
        onSuccess: (fn) => setToastMessage(`Tag PDF downloaded: ${fn}`),
        onError: (err) => setToastMessage(err),
      });
    } catch {
      // Handled in onError
    }
  };

  // Dedicated Share Tag PDF Handler
  const handleShareTagPdf = async () => {
    try {
      await sharePdf({
        url: `/api/tags/${cleanCode}/pdf?type=collection`,
        filename: `BanaSetu-BatchTag-${cleanCode}.pdf`,
        title: `BanaSetu Tag ${cleanCode}`,
        text: `Authoritative BanaSetu A6 Sack Tag for Batch #${cleanCode} (${tagData.productName}, ${tagData.netWeightKg} kg)`,
        onLoadingChange: setIsSharingPdf,
        onSuccess: () => setToastMessage('Tag shared successfully'),
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

  const collectorFirstName = (collector.name || 'Primary Collector').split(' ')[0];
  const netWeightKg = dbBatch?.step1?.netAcceptedKg ?? dbBatch?.step2?.arrivalNetWeightKg ?? (cleanCode === 'BS-400' ? 60.0 : cleanCode === 'BS-398' ? 25.0 : 100.0);

  const tagData: SackTagData = {
    code,
    productName: dbBatch?.produceName || DEMO_PRODUCT.name,
    collectorFirstName, // First name + village only (no full identity per spec)
    village: collector.village,
    dateStr: dbBatch?.step1?.verifiedAt || '14 Mar 2025 · 09:15 AM',
    netWeightKg,
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Direct Download Collection Tag */}
          <Button
            id="btn-download-collection-tag-pdf"
            variant="secondary"
            size="sm"
            onClick={() => handleDownloadTagPdf('collection')}
            disabled={isDownloadingPdf === 'collection'}
            title="Download authoritative A6 Batch Sack Tag PDF directly"
          >
            <Download size={14} strokeWidth={1.5} />
            <span>{isDownloadingPdf === 'collection' ? 'Downloading Tag...' : 'Download A6 Tag'}</span>
          </Button>

          {/* Direct Download Product Spec Tag */}
          <Button
            id="btn-download-product-spec-pdf"
            variant="secondary"
            size="sm"
            onClick={() => handleDownloadTagPdf('product')}
            disabled={isDownloadingPdf === 'product'}
            title="Download authoritative A6 Product Lot Spec Tag PDF directly"
          >
            <Download size={14} strokeWidth={1.5} />
            <span>{isDownloadingPdf === 'product' ? 'Downloading Spec...' : 'Download Spec PDF'}</span>
          </Button>

          {/* Dedicated Share Tag Action */}
          <Button
            id="btn-share-tag-pdf"
            variant="secondary"
            size="sm"
            onClick={handleShareTagPdf}
            disabled={isSharingPdf}
            title="Share authoritative A6 Tag PDF via system share sheet"
          >
            <Share2 size={14} strokeWidth={1.5} />
            <span>{isSharingPdf ? 'Sharing...' : 'Share Tag'}</span>
          </Button>

          {/* Direct links preserving existing test assertions */}
          <a
            href={`/api/tags/${cleanCode}/pdf?type=collection`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-rule bg-surface text-[12px] font-medium text-ink hover:bg-bg-sunken hover:border-ink-subtle select-none"
            title="Open authoritative A6 Batch Sack Tag PDF in browser"
          >
            <FileText size={14} strokeWidth={1.5} />
            <span>A6 Tag PDF</span>
          </a>

          <a
            href={`/api/tags/${cleanCode}/pdf?type=product`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-rule bg-surface text-[12px] font-medium text-ink hover:bg-bg-sunken hover:border-ink-subtle select-none"
            title="Open authoritative A6 Product Lot Spec Tag PDF in browser"
          >
            <TagIcon size={14} strokeWidth={1.5} />
            <span>Product Spec PDF</span>
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
        <div className="no-print w-full max-w-[105mm] mb-4 p-2.5 rounded-[4px] border border-rule bg-surface text-[13px] text-ink flex items-center justify-between">
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[11px] font-mono text-ink-muted hover:text-ink underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* A6 Printable Tag Sheet */}
      <div ref={tagRef} className="w-full flex justify-center">
        <SackTagArtifact data={tagData} />
      </div>
    </div>
  );
}
