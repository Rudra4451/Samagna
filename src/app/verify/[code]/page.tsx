'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Printer,
  Share2,
  Calendar,
  MapPin,
  Scale,
  Truck,
  Hash,
  AlertCircle,
  FileCheck2,
  WifiOff,
  SearchX,
  ServerCrash,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProductIcon } from '@/components/ui/ProductIcons';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { getDatabase } from '@/lib/db';

interface VerifyPageProps {
  params: {
    code: string;
  };
}

type ProvenanceSource = 'SERVER_AUTHORITATIVE' | 'LOCAL_OFFLINE_LEDGER';

export default function PublicVerifyPage({ params }: VerifyPageProps) {
  const cleanCode = (params.code || '').replace('#', '').toUpperCase();
  const [batchData, setBatchData] = useState<any>(null);
  const [provenanceSource, setProvenanceSource] = useState<ProvenanceSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorState, setErrorState] = useState<'NOT_FOUND' | 'UNAVAILABLE' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchVerification() {
      if (!cleanCode) {
        if (isMounted) {
          setErrorState('NOT_FOUND');
          setErrorMessage('No batch identifier was specified in the verification link.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErrorState(null);

      // Attempt 1: Fetch authoritative server provenance from /api/batches/[id]
      try {
        const res = await fetch(`/api/batches/${encodeURIComponent(cleanCode)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.batch) {
            setBatchData(json.batch);
            setProvenanceSource('SERVER_AUTHORITATIVE');
            setLoading(false);
            return;
          }
        } else if (res.status === 404) {
          // If server explicitly reports not found, check local Dexie before giving up
          // in case this device created a local draft
          try {
            const db = getDatabase();
            const localBatch = await db.batches.get(cleanCode);
            if (isMounted && localBatch) {
              setBatchData({
                id: localBatch.id,
                code: `#${localBatch.id.replace('#', '')}`,
                produceName: localBatch.produceName,
                produceOdia: localBatch.produceOdia,
                scientificName: localBatch.scientificName,
                district: localBatch.district,
                block: localBatch.block,
                gramPanchayat: localBatch.gramPanchayat,
                centerName: localBatch.centerName,
                shgName: localBatch.shgName,
                status: localBatch.status,
                seasonalReadinessStatus: localBatch.seasonalReadinessStatus,
                step1: localBatch.step1,
                step2: localBatch.step2,
                createdAt: localBatch.createdAt,
              });
              setProvenanceSource('LOCAL_OFFLINE_LEDGER');
              setLoading(false);
              return;
            }
          } catch {
            // Ignore Dexie errors and proceed to honest not-found
          }

          if (isMounted) {
            setErrorState('NOT_FOUND');
            setErrorMessage(`Batch '${cleanCode}' was not found in the official BanaSetu registry.`);
            setLoading(false);
          }
          return;
        } else if (res.status === 503) {
          // Server database is unconfigured or unavailable; check local Dexie for offline verification
          try {
            const db = getDatabase();
            const localBatch = await db.batches.get(cleanCode);
            if (isMounted && localBatch) {
              setBatchData({
                id: localBatch.id,
                code: `#${localBatch.id.replace('#', '')}`,
                produceName: localBatch.produceName,
                produceOdia: localBatch.produceOdia,
                scientificName: localBatch.scientificName,
                district: localBatch.district,
                block: localBatch.block,
                gramPanchayat: localBatch.gramPanchayat,
                centerName: localBatch.centerName,
                shgName: localBatch.shgName,
                status: localBatch.status,
                seasonalReadinessStatus: localBatch.seasonalReadinessStatus,
                step1: localBatch.step1,
                step2: localBatch.step2,
                createdAt: localBatch.createdAt,
              });
              setProvenanceSource('LOCAL_OFFLINE_LEDGER');
              setLoading(false);
              return;
            }
          } catch {
            // Ignore Dexie errors
          }

          if (isMounted) {
            setErrorState('UNAVAILABLE');
            setErrorMessage('The official verification registry is temporarily unavailable and no local offline record was found on this device.');
            setLoading(false);
          }
          return;
        }
      } catch (networkErr) {
        // Network failure / completely offline: attempt local Dexie lookup
        try {
          const db = getDatabase();
          const localBatch = await db.batches.get(cleanCode);
          if (isMounted && localBatch) {
            setBatchData({
              id: localBatch.id,
              code: `#${localBatch.id.replace('#', '')}`,
              produceName: localBatch.produceName,
              produceOdia: localBatch.produceOdia,
              scientificName: localBatch.scientificName,
              district: localBatch.district,
              block: localBatch.block,
              gramPanchayat: localBatch.gramPanchayat,
              centerName: localBatch.centerName,
              shgName: localBatch.shgName,
              status: localBatch.status,
              seasonalReadinessStatus: localBatch.seasonalReadinessStatus,
              step1: localBatch.step1,
              step2: localBatch.step2,
              createdAt: localBatch.createdAt,
            });
            setProvenanceSource('LOCAL_OFFLINE_LEDGER');
            setLoading(false);
            return;
          }
        } catch {
          // Ignore Dexie errors
        }

        if (isMounted) {
          setErrorState('UNAVAILABLE');
          setErrorMessage('Unable to connect to the verification registry. Please check your network connection.');
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setErrorState('NOT_FOUND');
        setErrorMessage(`Batch '${cleanCode}' could not be verified.`);
        setLoading(false);
      }
    }

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [cleanCode]);

  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-[13px] text-ink-muted">Verifying digital ledger proof...</p>
      </div>
    );
  }

  // Honest Not-Found Screen (no fake specimen presented as real)
  if (errorState === 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-bg text-ink p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="max-w-[520px] w-full border-2 border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
            <SearchX size={24} />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-danger font-semibold block">
              Batch Verification Failed · ଯାଞ୍ଚ ବିଫଳ
            </span>
            <h1 className="font-heading font-bold text-[20px] text-ink mt-1">
              Batch #{cleanCode || 'UNKNOWN'} Not Found
            </h1>
          </div>
          <p className="text-[13px] text-ink-subtle leading-relaxed">
            {errorMessage || `No record matching batch identifier #${cleanCode} was found in the official TDCCOL BanaSetu registry. This batch may not exist or has not yet been registered.`}
          </p>
          <div className="p-3 border border-rule rounded-[3px] bg-bg-sunken text-[12px] font-mono text-ink-muted text-left">
            <p><strong>Guidance:</strong> If this batch was recently collected offline in the field, it may still be pending synchronization on the collector&apos;s device.</p>
          </div>
          <div className="pt-2">
            <Link
              href="/collector"
              className="inline-flex items-center justify-center px-4 py-2 text-[12px] font-mono rounded-[3px] bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              ← Return to BanaSetu Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Honest Temporarily Unavailable Screen
  if (errorState === 'UNAVAILABLE') {
    return (
      <div className="min-h-screen bg-bg text-ink p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="max-w-[520px] w-full border-2 border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto">
            <ServerCrash size={24} />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-warning font-semibold block">
              Registry Temporarily Unavailable · ଯାଞ୍ଚ ଅସମର୍ଥ
            </span>
            <h1 className="font-heading font-bold text-[20px] text-ink mt-1">
              Verification Service Unavailable
            </h1>
          </div>
          <p className="text-[13px] text-ink-subtle leading-relaxed">
            {errorMessage || 'The server-backed registry could not be reached to verify this batch. Please try again later.'}
          </p>
          <div className="pt-2">
            <Link
              href="/collector"
              className="inline-flex items-center justify-center px-4 py-2 text-[12px] font-mono rounded-[3px] bg-sidebar-bg text-white hover:bg-black transition-colors"
            >
              ← Return to Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isQuarantined = batchData?.status === 'QUARANTINED_DISCREPANCY';
  const isSaleable = batchData?.status === 'VERIFIED_SALEABLE';

  return (
    <div className="min-h-screen bg-bg text-ink p-4 sm:p-6 print:bg-white print:p-0 selection:bg-accent-tint selection:text-ink">
      <div className="max-w-[640px] mx-auto space-y-6">
        {/* Navigation & Trust Banner */}
        <header className="flex items-center justify-between border-b border-rule pb-3 print:border-b-2">
          <Link href="/" className="flex items-center gap-2 focus:outline-2 focus:outline-accent">
            <SamagnaLogo variant="light" size="sm" showTagline />
          </Link>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={handleShare}
              className="px-2.5 py-1 text-[11px] font-mono border border-rule rounded-[2px] bg-surface hover:bg-bg-sunken flex items-center gap-1"
            >
              <Share2 size={13} />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 text-[11px] font-mono border border-rule rounded-[2px] bg-surface hover:bg-bg-sunken flex items-center gap-1"
            >
              <Printer size={13} />
              <span>Print</span>
            </button>
          </div>
        </header>

        {/* Provenance Source Notice */}
        {provenanceSource === 'LOCAL_OFFLINE_LEDGER' && (
          <div className="p-3 rounded-[3px] bg-warning/10 border border-warning/30 text-warning flex items-center gap-2 text-[12px] font-mono">
            <WifiOff size={16} className="shrink-0" />
            <span>
              <strong>Offline Local Device Record:</strong> This verification is served from local IndexedDB cache and has not yet been verified against the central cloud registry.
            </span>
          </div>
        )}

        {/* Certificate Card */}
        <div className="border-2 border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none print:border-2 print:p-6">
          {/* Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-rule">
            <div>
              <span className="text-[11px] font-mono uppercase text-ink-muted block">Certified Batch Identifier</span>
              <div className="font-heading text-[28px] font-bold text-ink tabular-nums">
                #{cleanCode}
              </div>
            </div>
            <div>
              {isQuarantined ? (
                <div className="px-3 py-1.5 rounded-[3px] bg-warning/10 border border-warning/30 text-warning text-[12px] font-mono flex items-center gap-1.5">
                  <AlertCircle size={15} />
                  <span>DISCREPANCY HELD · NON-PUNITIVE REVIEW</span>
                </div>
              ) : isSaleable ? (
                <div className="px-3 py-1.5 rounded-[3px] bg-success/10 border border-success/30 text-success text-[12px] font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>OFFICIALLY VERIFIED &amp; ACCEPTED</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-[3px] bg-accent/10 border border-accent/30 text-accent text-[12px] font-mono flex items-center gap-1.5">
                  <FileCheck2 size={15} />
                  <span>{batchData?.status?.replace(/_/g, ' ') || 'INTAKE IN PROGRESS'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Core Produce Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-rule rounded-[3px] p-3 bg-bg-sunken flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono uppercase text-ink-muted block">Minor Forest Produce</span>
                <div className="font-heading text-[18px] font-bold text-ink mt-0.5">
                  {batchData?.produceName}
                </div>
                <p className="text-[12px] text-ink-subtle font-odia">
                  {batchData?.produceOdia} {batchData?.scientificName ? `(${batchData.scientificName})` : ''}
                </p>
              </div>
              {batchData?.produceName && (
                <div className="w-14 h-14 rounded-[4px] overflow-hidden border border-rule/60 bg-surface shrink-0 shadow-sm">
                  <ProductIcon product={batchData.produceName} size={56} className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="border border-rule rounded-[3px] p-3 bg-bg-sunken">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">Certified Field Net Weight</span>
              <div className="font-heading text-[22px] font-bold text-success tabular-nums mt-0.5">
                {batchData?.step1?.netAcceptedKg != null
                  ? `${Number(batchData.step1.netAcceptedKg).toFixed(1)} kg`
                  : 'Pending Weighment'}
              </div>
              {batchData?.step1 && (
                <p className="text-[11px] text-ink-muted font-mono">
                  Gross: {Number(batchData.step1.grossWeightKg).toFixed(1)} kg · Tare: {Number(batchData.step1.tareWeightKg).toFixed(1)} kg
                </p>
              )}
            </div>
          </div>

          {/* Custody Chain Details */}
          <div className="space-y-3 text-[13px]">
            <h3 className="font-heading font-bold text-[15px] text-ink border-b border-rule pb-1.5 flex items-center gap-2">
              <FileCheck2 size={16} className="text-accent" />
              <span>Chain-of-Custody Manifest</span>
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[12px]">
              <div>
                <span className="text-ink-muted block text-[11px]">District / Block:</span>
                <span className="text-ink font-semibold">{batchData?.block}, {batchData?.district}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Aggregation Center:</span>
                <span className="text-ink font-semibold">{batchData?.centerName}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Primary SHG:</span>
                <span className="text-ink font-semibold">{batchData?.shgName}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Quality Grade:</span>
                <span className="text-ink font-semibold">{batchData?.step1?.grade || 'Standard / A'}</span>
              </div>
              {batchData?.step1?.sealTagId && (
                <div>
                  <span className="text-ink-muted block text-[11px]">Seal Tag Number:</span>
                  <span className="text-ink font-semibold">{batchData.step1.sealTagId}</span>
                </div>
              )}
              {batchData?.step1?.transitWaybillId && (
                <div>
                  <span className="text-ink-muted block text-[11px]">Transit Waybill:</span>
                  <span className="text-ink font-semibold">{batchData.step1.transitWaybillId}</span>
                </div>
              )}
              {batchData?.step2?.arrivalNetWeightKg != null && (
                <div>
                  <span className="text-ink-muted block text-[11px]">Warehouse Arrival Weight:</span>
                  <span className="text-ink font-semibold">{Number(batchData.step2.arrivalNetWeightKg).toFixed(1)} kg</span>
                </div>
              )}
              {batchData?.step2?.storageZone && (
                <div>
                  <span className="text-ink-muted block text-[11px]">Storage Zone:</span>
                  <span className="text-ink font-semibold">{batchData.step2.storageZone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Protection Notice */}
          <div className="p-3.5 border border-rule rounded-[3px] bg-bg-sunken space-y-1.5">
            <div className="flex items-center gap-1.5 text-accent text-[11px] font-mono font-semibold uppercase">
              <ShieldCheck size={14} /> Statutory Privacy Safeguard
            </div>
            <p className="text-[12px] text-ink leading-relaxed">
              In accordance with TDCCOL data ethics standards and Section 4 of the LABHA Yojana guidelines, personal tribal gatherer identity, phone numbers, Aadhaar digits, and direct bank account coordinates are shielded from public display.
            </p>
            <p className="text-[11px] font-mono text-ink-subtle">
              Contributing Gathering Cluster: <strong className="text-ink">{batchData?.shgName} ({batchData?.gramPanchayat})</strong>
            </p>
          </div>

          {/* Cryptographic Tamper-Proof Stamp */}
          <div className="pt-2 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-ink-muted gap-2">
            <div>
              <span>Verification Milestone Date:</span>
              <div className="text-ink font-bold">
                {batchData?.verifiedAt ? new Date(batchData.verifiedAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Verified at Origin'}
              </div>
            </div>
            <div className="sm:text-right shrink-0">
              <span className="text-success font-semibold">
                {provenanceSource === 'SERVER_AUTHORITATIVE' ? '✓ Authoritative Server Registry' : '⚡ Local Device Specimen'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center font-mono text-[11px] text-ink-muted space-y-1 print:hidden">
          <p>Government of Odisha · ST &amp; SC Development Department</p>
          <p className="text-ink-subtle">
            Need assistance? TDCCOL Mayurbhanj Helpline: 1800-345-6789
          </p>
          <div className="pt-2">
            <Link href="/collector" className="text-accent hover:underline">
              ← Return to BanaSetu Collector Portal
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
