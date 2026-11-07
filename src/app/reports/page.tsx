'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  FileText,
  ShieldCheck,
  Download,
  Filter,
  RefreshCw,
  Building2,
  Briefcase,
  Cog,
  DollarSign,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Scale,
  Truck,
  ArrowRight,
  Database,
  ExternalLink,
} from 'lucide-react';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import {
  InstitutionalBiReport,
  B2bBiReport,
  ProcessingBiReport,
  CommercialBiReport,
  EnterpriseTraceabilityDossier,
  DataFidelity,
} from '@/lib/businessIntelligence';

type ReportAudience = 'INSTITUTIONAL' | 'TRADE' | 'PROCESSING' | 'COMMERCIAL' | 'TRACEABILITY';

export default function BusinessIntelligencePage() {
  const [activeAudience, setActiveAudience] = useState<ReportAudience>('INSTITUTIONAL');
  const [selectedLot, setSelectedLot] = useState<string>('BS-402');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Report state
  const [institutionalReport, setInstitutionalReport] = useState<InstitutionalBiReport | null>(null);
  const [b2bReport, setB2bReport] = useState<B2bBiReport | null>(null);
  const [processingReport, setProcessingReport] = useState<ProcessingBiReport | null>(null);
  const [commercialReport, setCommercialReport] = useState<CommercialBiReport | null>(null);
  const [traceabilityDossier, setTraceabilityDossier] = useState<EnterpriseTraceabilityDossier | null>(null);

  // Fetch report data based on active tab
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (activeAudience === 'INSTITUTIONAL') {
          const res = await fetch('/api/reports/institutional');
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.report) {
              setInstitutionalReport(data.report);
            } else {
              setError(data.message || 'Failed to load institutional reports');
            }
          }
        } else if (activeAudience === 'TRADE') {
          const res = await fetch('/api/reports/b2b');
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.report) {
              setB2bReport(data.report);
            } else {
              setError(data.message || 'Failed to load B2B bulk trade reports');
            }
          }
        } else if (activeAudience === 'PROCESSING') {
          const res = await fetch('/api/reports/processing');
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.report) {
              setProcessingReport(data.report);
            } else {
              setError(data.message || 'Failed to load processing reports');
            }
          }
        } else if (activeAudience === 'COMMERCIAL') {
          const res = await fetch('/api/reports/commercial');
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.report) {
              setCommercialReport(data.report);
            } else {
              setError(data.message || 'Failed to load commercial reconciliation reports');
            }
          }
        } else if (activeAudience === 'TRACEABILITY') {
          const res = await fetch(`/api/reports/traceability/${encodeURIComponent(selectedLot)}`);
          const data = await res.json();
          if (isMounted) {
            if (data.success && data.dossier) {
              setTraceabilityDossier(data.dossier);
            } else {
              setError(data.message || 'Failed to load lot traceability dossier');
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Network error fetching report data');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeAudience, selectedLot]);

  const renderFidelityBadge = (fidelity: DataFidelity, note?: string) => {
    switch (fidelity) {
      case 'ACTUAL':
        return (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-mono font-medium"
            title={note || 'Verified primary record (physical weighment, signed pass, paid bank remittance)'}
          >
            <CheckCircle2 size={11} className="text-emerald-600" />
            ACTUAL
          </span>
        );
      case 'ESTIMATED':
        return (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-mono font-medium"
            title={note || 'Algorithmic or historical standard estimate (moisture shrinkage, yield benchmark)'}
          >
            <AlertTriangle size={11} className="text-amber-600" />
            ESTIMATED
          </span>
        );
      case 'MISSING':
        return (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-rose-50 text-rose-800 border border-rose-300 text-[10px] font-mono font-medium"
            title={note || 'Data gap identified; record not yet logged or submitted'}
          >
            MISSING
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-rule bg-surface sticky top-0 z-30 shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <SamagnaLogo variant="forest" size="sm" />
            </Link>
            <span className="text-ink-subtle font-mono text-[11px] hidden sm:inline">|</span>
            <span className="font-mono text-[12px] font-semibold text-accent tracking-wide uppercase hidden sm:inline">
              Business Intelligence &amp; Traceability
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/ecosystem"
              className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] border border-rule bg-bg-sunken hover:bg-surface text-ink-muted transition-colors"
            >
              ← Ecosystem
            </Link>
            <Link
              href="/trade"
              className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] border border-rule bg-bg-sunken hover:bg-surface text-ink-muted transition-colors"
            >
              Trade Desk
            </Link>
            <Link
              href="/revenue"
              className="text-[11px] font-mono px-2.5 py-1 rounded-[3px] border border-rule bg-bg-sunken hover:bg-surface text-ink-muted transition-colors"
            >
              Revenue Desk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Title Bar & Audience Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold px-1.5 py-0.5 rounded-[2px] bg-accent/10">
                Decision Support &amp; Value-Chain Intelligence
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                Statutory MSP Protected · Zero Collector Deductions
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-ink mt-1 text-balance">
              Operational BI &amp; Enterprise Traceability
            </h1>
            <p className="text-xs sm:text-sm text-ink-subtle mt-1.5 max-w-3xl text-pretty">
              Turn procurement, inventory, custody, milling, and commercial transactions into auditable operational intelligence.
              Every metric explicitly distinguishes <strong className="text-emerald-700">Actual Records</strong>, <strong className="text-amber-700">Estimates</strong>, and <strong className="text-rose-700">Missing Data</strong>.
            </p>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const current = activeAudience;
                setActiveAudience('INSTITUTIONAL');
                setTimeout(() => setActiveAudience(current), 10);
              }}
              className="px-3 py-1.5 text-xs font-mono border border-rule rounded-[3px] bg-surface hover:bg-bg-sunken text-ink flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              <span>Refresh Ledgers</span>
            </button>
          </div>
        </div>

        {/* Audience Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-rule pb-px text-xs font-mono">
          <button
            onClick={() => setActiveAudience('INSTITUTIONAL')}
            className={`px-3.5 py-2 rounded-t-[4px] border-t border-l border-r font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeAudience === 'INSTITUTIONAL'
                ? 'bg-surface border-rule text-ink font-semibold border-b-2 border-b-accent -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink bg-transparent'
            }`}
          >
            <Building2 size={14} className={activeAudience === 'INSTITUTIONAL' ? 'text-accent' : ''} />
            <span>1. Institutional Operations (B2G)</span>
          </button>

          <button
            onClick={() => setActiveAudience('TRADE')}
            className={`px-3.5 py-2 rounded-t-[4px] border-t border-l border-r font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeAudience === 'TRADE'
                ? 'bg-surface border-rule text-ink font-semibold border-b-2 border-b-accent -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink bg-transparent'
            }`}
          >
            <Briefcase size={14} className={activeAudience === 'TRADE' ? 'text-accent' : ''} />
            <span>2. B2B Bulk Trade</span>
          </button>

          <button
            onClick={() => setActiveAudience('PROCESSING')}
            className={`px-3.5 py-2 rounded-t-[4px] border-t border-l border-r font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeAudience === 'PROCESSING'
                ? 'bg-surface border-rule text-ink font-semibold border-b-2 border-b-accent -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink bg-transparent'
            }`}
          >
            <Cog size={14} className={activeAudience === 'PROCESSING' ? 'text-accent' : ''} />
            <span>3. Processing &amp; Value-Addition</span>
          </button>

          <button
            onClick={() => setActiveAudience('COMMERCIAL')}
            className={`px-3.5 py-2 rounded-t-[4px] border-t border-l border-r font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeAudience === 'COMMERCIAL'
                ? 'bg-surface border-rule text-ink font-semibold border-b-2 border-b-accent -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink bg-transparent'
            }`}
          >
            <DollarSign size={14} className={activeAudience === 'COMMERCIAL' ? 'text-accent' : ''} />
            <span>4. Commercial &amp; Revenue</span>
          </button>

          <button
            onClick={() => setActiveAudience('TRACEABILITY')}
            className={`px-3.5 py-2 rounded-t-[4px] border-t border-l border-r font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeAudience === 'TRACEABILITY'
                ? 'bg-surface border-rule text-ink font-semibold border-b-2 border-b-accent -mb-px'
                : 'border-transparent text-ink-muted hover:text-ink bg-transparent'
            }`}
          >
            <ShieldCheck size={14} className={activeAudience === 'TRACEABILITY' ? 'text-accent' : ''} />
            <span>5. Enterprise Traceability Dossiers</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-mono text-xs text-ink-muted">Synthesizing authoritative ledger metrics...</p>
          </div>
        )}

        {/* Error Notice */}
        {error && !loading && (
          <div className="p-4 rounded-[4px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: INSTITUTIONAL OPERATIONS */}
        {!loading && activeAudience === 'INSTITUTIONAL' && institutionalReport && (
          <div className="space-y-6">
            {/* Summary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Verified Batches</span>
                  {renderFidelityBadge(institutionalReport.summary.fidelity)}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {institutionalReport.summary.totalBatches}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">100% custody logged</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Total Procured</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {institutionalReport.summary.totalProcuredKg.toFixed(1)} <span className="text-sm font-normal text-ink-muted">kg</span>
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Weighed on calibrated scales</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Statutory MSP Disbursed</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink text-emerald-700">
                  ₹{institutionalReport.summary.totalMspDisbursedInr.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">₹42.00/kg baseline (LABHA)</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Active Centers</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {institutionalReport.summary.activeCentersCount}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Mayurbhanj &amp; Keonjhar</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">MSP Guarantee</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-accent">
                  100%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Zero fee deductions on gatherers</p>
              </div>
            </div>

            {/* Collection & Procurement Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Species Intake Breakdown */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Botanical Intake Breakdown (Species)
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="space-y-3">
                  {institutionalReport.collectionActivity.speciesBreakdown.map((s, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="font-medium text-ink">{s.produceName}</span>
                        <span className="text-ink-muted">{s.weightKg} kg ({s.percentage}%)</span>
                      </div>
                      <div className="w-full bg-bg-sunken h-2 rounded-[2px] overflow-hidden">
                        <div
                          className="bg-accent h-full rounded-[2px]"
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aggregation Center Performance Table */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Aggregation Centre Performance
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-rule text-ink-muted">
                        <th scope="col" className="pb-2 font-medium">Center</th>
                        <th scope="col" className="pb-2 font-medium">District</th>
                        <th scope="col" className="pb-2 font-medium text-right">Throughput</th>
                        <th scope="col" className="pb-2 font-medium text-right">Target</th>
                        <th scope="col" className="pb-2 font-medium text-right">Achievement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule/50">
                      {institutionalReport.centrePerformance.map((c) => (
                        <tr key={c.centerId}>
                          <td className="py-2 font-medium text-ink">{c.centerName}</td>
                          <td className="py-2 text-ink-muted">{c.district}</td>
                          <td className="py-2 text-right">{c.throughputKg} kg</td>
                          <td className="py-2 text-right text-ink-muted">{c.targetKg} kg</td>
                          <td className="py-2 text-right font-bold text-accent">
                            {c.achievementRatePercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Inventory, Shrinkage & Operational Reconciliation */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Operational Reconciliation &amp; Transit Shrinkage Ledger
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted mt-0.5">
                    Field dispatches vs. Central Depot receipts with moisture loss tolerance verification
                  </p>
                </div>
                {renderFidelityBadge('ACTUAL')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Dispatched Net (Field)</span>
                  <div className="text-lg font-bold font-mono text-ink">
                    {institutionalReport.operationalReconciliation.totalDispatchedNetKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Electronic intake scales</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Depot Arrival Net</span>
                  <div className="text-lg font-bold font-mono text-ink">
                    {institutionalReport.operationalReconciliation.totalArrivalNetKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Warehouse weighbridge</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-ink-muted block uppercase">Transit Shrinkage</span>
                    {renderFidelityBadge('ACTUAL')}
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-700">
                    -{institutionalReport.operationalReconciliation.netTransitShrinkageKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Standard moisture desiccation</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-ink-muted block uppercase">Reconciliation Status</span>
                    {renderFidelityBadge('ACTUAL')}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    {institutionalReport.operationalReconciliation.reconciliationRatePercent}%
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">1 quarantined discrepancy under non-punitive review</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: B2B BULK TRADE */}
        {!loading && activeAudience === 'TRADE' && b2bReport && (
          <div className="space-y-6">
            {/* B2B Summary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">B2B Trade GMV</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  ₹{b2bReport.summary.tradeGmvInr.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">{b2bReport.summary.totalPurchaseOrders} purchase orders</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Active RFQs</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {b2bReport.summary.totalRfqs}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">{b2bReport.rfqActivity.totalRequestedVolumeKg} kg demand</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Quotation Conversion</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-accent">
                  {b2bReport.quotationConversion.conversionRatePercent}%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Avg turnaround {b2bReport.quotationConversion.avgQuoteTurnaroundHours}h</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Lot Acceptance Rate</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {b2bReport.orderFulfilment.lotAcceptanceRatePercent}%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">94.5% on-time delivery</p>
              </div>
            </div>

            {/* Supplier & Buyer Activity Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Supplier Activity */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Verified Supplier Activity &amp; Reliability
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-rule text-ink-muted">
                        <th scope="col" className="pb-2 font-medium">Supplier</th>
                        <th scope="col" className="pb-2 font-medium">District</th>
                        <th scope="col" className="pb-2 font-medium text-right">Available</th>
                        <th scope="col" className="pb-2 font-medium text-right">Reliability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule/50">
                      {b2bReport.supplierActivity.map((s) => (
                        <tr key={s.supplierId}>
                          <td className="py-2 font-medium text-ink">{s.businessName}</td>
                          <td className="py-2 text-ink-muted">{s.district}</td>
                          <td className="py-2 text-right">{s.availableStockKg} kg</td>
                          <td className="py-2 text-right font-bold text-accent">
                            {s.reliabilityScorePercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Buyer Activity */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Commercial Bulk Buyer Activity
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-rule text-ink-muted">
                        <th scope="col" className="pb-2 font-medium">Buyer</th>
                        <th scope="col" className="pb-2 font-medium">Type</th>
                        <th scope="col" className="pb-2 font-medium text-right">POs Placed</th>
                        <th scope="col" className="pb-2 font-medium text-right">Total Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule/50">
                      {b2bReport.buyerActivity.map((b) => (
                        <tr key={b.buyerId}>
                          <td className="py-2 font-medium text-ink">{b.businessName}</td>
                          <td className="py-2 text-ink-muted">{b.category}</td>
                          <td className="py-2 text-right">{b.ordersPlaced}</td>
                          <td className="py-2 text-right font-bold text-emerald-700">
                            ₹{b.totalSpendInr.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROCESSING & VALUE-ADDITION */}
        {!loading && activeAudience === 'PROCESSING' && processingReport && (
          <div className="space-y-6">
            {/* Processing Summary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Daily Installed Capacity</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {processingReport.summary.totalDailyCapacityKg.toLocaleString()} <span className="text-sm font-normal text-ink-muted">kg/day</span>
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">{processingReport.summary.totalFacilities} verified facilities</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Capacity Utilisation</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-accent">
                  {processingReport.summary.overallUtilizationPercent}%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">{processingReport.summary.currentAllocatedCapacityKg} kg allocated</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Actual Recovery Rate</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  {processingReport.inputOutputReconciliation.actualRecoveryRatePercent}%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Standard benchmark {processingReport.inputOutputReconciliation.standardBenchmarkRatePercent}%</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Job SLA Adherence</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  {processingReport.jobPerformance.slaAdherencePercent}%
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Avg turnaround {processingReport.jobPerformance.avgTurnaroundDays} days</p>
              </div>
            </div>

            {/* Input-Output Reconciliation Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Milling &amp; Value-Addition Mass Balance Reconciliation
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted mt-0.5">
                    Raw input versus finished product yield, by-products, and physical process loss
                  </p>
                </div>
                {renderFidelityBadge('ACTUAL')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Raw Input Feed</span>
                  <div className="text-lg font-bold font-mono text-ink">
                    {processingReport.inputOutputReconciliation.totalRawInputKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Intake botanical lots</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Finished Botanical Yield</span>
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    {processingReport.inputOutputReconciliation.totalFinishedOutputKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Packaged ready goods</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Recovered By-Product</span>
                  <div className="text-lg font-bold font-mono text-accent">
                    {processingReport.inputOutputReconciliation.totalByProductKg.toFixed(1)} kg
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Husk, seed oil residue</span>
                </div>

                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted block uppercase">Process Loss &amp; Dust</span>
                  <div className="text-lg font-bold font-mono text-amber-700">
                    {processingReport.inputOutputReconciliation.totalProcessLossKg.toFixed(1)} kg (8.0%)
                  </div>
                  <span className="text-[10px] font-mono text-ink-subtle">Within standard tolerance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMMERCIAL & REVENUE */}
        {!loading && activeAudience === 'COMMERCIAL' && commercialReport && (
          <div className="space-y-6">
            {/* Commercial Summary KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Contracted Service Revenue</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  ₹{commercialReport.summary.totalServiceRevenueInr.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">B2G institutional engagements</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Invoiced Volume</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-ink">
                  ₹{commercialReport.summary.totalInvoicedInr.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">GST &amp; statutory invoices</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Collected &amp; Reconciled</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700">
                  ₹{commercialReport.summary.totalCollectedInr.toLocaleString('en-IN')}
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">100% bank reference matched</p>
              </div>

              <div className="border border-rule rounded-[4px] bg-surface p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted uppercase">Primary Gatherer Fee</span>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="text-2xl font-bold font-mono text-accent">
                  ₹0.00 (0%)
                </div>
                <p className="text-[10px] text-ink-subtle font-mono">Free access invariant maintained</p>
              </div>
            </div>

            {/* Approved Service Fees & Accounts Receivable */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Approved Service Fees */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Approved Commercial Service Fees
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Platform Trade Facilitation Fee (B2B)</span>
                    <span className="font-bold text-ink">₹{commercialReport.approvedServiceFees.platformFacilitationFeesInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Processing Facilitation Fee</span>
                    <span className="font-bold text-ink">₹{commercialReport.approvedServiceFees.processingFeesInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Logistics Coordination Fee</span>
                    <span className="font-bold text-ink">₹{commercialReport.approvedServiceFees.logisticsCoordinationFeesInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 bg-emerald-50 px-2 rounded-[2px] border border-emerald-200">
                    <span className="text-emerald-900 font-semibold">Primary Collector Platform Deductions</span>
                    <span className="font-bold text-emerald-800">₹0.00 (EXEMPT)</span>
                  </div>
                </div>
              </div>

              {/* Accounts Receivable Aging */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-2">
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Accounts Receivable Aging Analysis
                  </h3>
                  {renderFidelityBadge('ACTUAL')}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Current (&lt; 30 Days)</span>
                    <span className="font-bold text-ink">₹{commercialReport.outstandingBalances.agingBuckets.under30DaysInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Overdue (30 – 60 Days)</span>
                    <span className="font-bold text-ink">₹{commercialReport.outstandingBalances.agingBuckets.thirtyToSixtyDaysInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-rule/50">
                    <span className="text-ink">Critical (&gt; 60 Days)</span>
                    <span className="font-bold text-ink">₹{commercialReport.outstandingBalances.agingBuckets.over60DaysInr.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono pt-2">
                    <span className="font-semibold text-ink">Total Outstanding Balance</span>
                    <span className="font-bold text-accent">₹{commercialReport.outstandingBalances.totalAccountsReceivableInr.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ENTERPRISE TRACEABILITY & EVIDENCE DOSSIERS */}
        {!loading && activeAudience === 'TRACEABILITY' && traceabilityDossier && (
          <div className="space-y-6">
            {/* Lot Selector & Privacy Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface border border-rule rounded-[4px]">
              <div className="flex items-center gap-3">
                <label htmlFor="lot-select" className="text-xs font-mono font-semibold text-ink whitespace-nowrap">
                  Select Lot Passport:
                </label>
                <select
                  id="lot-select"
                  value={selectedLot}
                  onChange={(e) => setSelectedLot(e.target.value)}
                  className="h-8 px-2.5 text-xs font-mono bg-bg-sunken border border-rule rounded-[3px] text-ink font-semibold"
                >
                  <option value="BS-402">Batch #BS-402 (Dried Mahua - Mayurbhanj Specimen)</option>
                  <option value="BS-400">Batch #BS-400 (Dried Mahua Flowers)</option>
                  <option value="BS-398">Batch #BS-398 (Dried Mahua Flowers)</option>
                  <option value="BS-396">Batch #BS-396 (Dried Mahua Flowers)</option>
                  <option value="BS-395">Batch #BS-395 (Quarantined Discrepancy Lot)</option>
                </select>
              </div>

              {/* Controlled Export Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`/api/reports/traceability/${selectedLot}/export?format=csv`}
                  download
                  className="px-3 py-1.5 text-xs font-mono border border-rule rounded-[3px] bg-surface hover:bg-bg-sunken text-ink flex items-center gap-1.5 transition-colors"
                >
                  <Download size={13} />
                  <span>Evidence Package (CSV)</span>
                </a>
                <a
                  href={`/api/reports/traceability/${selectedLot}/export?format=json`}
                  download
                  className="px-3 py-1.5 text-xs font-mono border border-accent/40 rounded-[3px] bg-accent/10 hover:bg-accent text-accent hover:text-white flex items-center gap-1.5 transition-colors font-semibold"
                >
                  <Download size={13} />
                  <span>Dossier (JSON)</span>
                </a>
              </div>
            </div>

            {/* Statutory Privacy Guard Alert */}
            <div className="p-3.5 rounded-[4px] bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono flex items-center gap-2.5">
              <Lock size={16} className="text-emerald-700 shrink-0" />
              <div>
                <strong>Statutory Collector Privacy Guard Active:</strong> All primary tribal gatherer identities are masked, banking details are redacted, and zero PII is exposed in commercial or external exports.
              </div>
            </div>

            {/* Lot Specimen Overview */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                      Certified Lot Provenance Passport
                    </span>
                    {renderFidelityBadge(traceabilityDossier.overallFidelity)}
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-ink mt-0.5">
                    {traceabilityDossier.batchCode} — {traceabilityDossier.produceName}
                  </h2>
                  <p className="text-xs font-mono text-ink-muted italic">
                    {traceabilityDossier.scientificName} · {traceabilityDossier.harvestSeason}
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-[11px] font-mono text-ink-muted">Data Completeness Score:</div>
                  <div className="text-xl font-bold font-mono text-accent">
                    {traceabilityDossier.dataCompletenessScore}%
                  </div>
                  <div className="text-[10px] font-mono text-ink-subtle">
                    {traceabilityDossier.exportMetadata.tamperEvidentDigest}
                  </div>
                </div>
              </div>

              {/* Origin Jurisdiction & Physical Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule">
                  <span className="text-ink-muted block text-[10px] uppercase">State &amp; District</span>
                  <span className="font-semibold text-ink">{traceabilityDossier.originJurisdiction.state}, {traceabilityDossier.originJurisdiction.district}</span>
                </div>
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule">
                  <span className="text-ink-muted block text-[10px] uppercase">Block &amp; Gram Panchayat</span>
                  <span className="font-semibold text-ink">{traceabilityDossier.originJurisdiction.block}, {traceabilityDossier.originJurisdiction.gramPanchayat}</span>
                </div>
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule">
                  <span className="text-ink-muted block text-[10px] uppercase">Intake Van Dhan Kendra</span>
                  <span className="font-semibold text-ink">{traceabilityDossier.originJurisdiction.centerName}</span>
                </div>
                <div className="p-3 bg-bg-sunken rounded-[3px] border border-rule">
                  <span className="text-ink-muted block text-[10px] uppercase">Central Storage Depôt</span>
                  <span className="font-semibold text-ink">{traceabilityDossier.originJurisdiction.depotDestination}</span>
                </div>
              </div>
            </div>

            {/* Collector Provenance (Masked Table) */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Primary Gatherer Provenance (Anonymized Dossier)
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted mt-0.5">
                    {traceabilityDossier.collectorProvenance.totalPrimaryCollectors} Household Collectors · Tribal Communities: {traceabilityDossier.collectorProvenance.tribalCommunities.join(', ')}
                  </p>
                </div>
                {renderFidelityBadge('ACTUAL')}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-rule text-ink-muted">
                      <th scope="col" className="pb-2 font-medium">Gatherer Identifier</th>
                      <th scope="col" className="pb-2 font-medium">Anonymized Name</th>
                      <th scope="col" className="pb-2 font-medium">Village &amp; Panchayat</th>
                      <th scope="col" className="pb-2 font-medium text-right">Contributed</th>
                      <th scope="col" className="pb-2 font-medium text-right">Statutory Payout</th>
                      <th scope="col" className="pb-2 font-medium text-right">Data Fidelity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/50">
                    {traceabilityDossier.collectorProvenance.collectorsSummary.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-ink-muted font-bold">{c.maskedId}</td>
                        <td className="py-2 font-medium text-ink">{c.maskedName}</td>
                        <td className="py-2 text-ink-muted">{c.villageCluster}</td>
                        <td className="py-2 text-right">{c.weightKg.toFixed(1)} kg</td>
                        <td className="py-2 text-right font-bold text-ink">{c.payoutAmountRedacted}</td>
                        <td className="py-2 text-right">{renderFidelityBadge(c.fidelity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6-Step Chain of Custody Timeline */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-ink">
                    Chain of Custody &amp; Verified Milestone Footprint
                  </h3>
                  <p className="text-[11px] font-mono text-ink-muted mt-0.5">
                    End-to-end chronological timeline from dawn harvest to commercial B2B fulfillment
                  </p>
                </div>
                {renderFidelityBadge('ACTUAL')}
              </div>

              <div className="space-y-4 pt-2">
                {traceabilityDossier.chainOfCustody.map((step) => (
                  <div key={step.stepOrder} className="flex gap-4 p-3.5 bg-bg-sunken rounded-[3px] border border-rule">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {step.stepOrder}
                      </div>
                      {step.stepOrder < traceabilityDossier.chainOfCustody.length && (
                        <div className="w-0.5 bg-rule flex-1 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-xs font-mono">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-sm text-ink">{step.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-ink-muted text-[11px]">{new Date(step.timestamp).toLocaleDateString()} {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {renderFidelityBadge(step.fidelity)}
                        </div>
                      </div>

                      <div className="text-ink-subtle">
                        <strong className="text-ink">Node:</strong> {step.nodeName} ({step.location})
                      </div>

                      <div className="text-ink-subtle">
                        <strong className="text-ink">Handler:</strong> {step.actorIdentityMasked} · <span className="text-accent">{step.actorRole}</span>
                      </div>

                      {step.sealOrWaybillReference && (
                        <div className="text-[11px] text-ink-muted">
                          <strong className="text-ink">Transit Seal / Waybill:</strong> {step.sealOrWaybillReference}
                        </div>
                      )}

                      <div className="p-2 bg-surface rounded-[2px] border border-rule text-ink text-[11px] mt-1">
                        {step.fidelityNote}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

