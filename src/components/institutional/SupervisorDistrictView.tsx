'use client';

import React, { useState, useEffect } from 'react';
import { OperationalReport } from '@/lib/institutional';
import {
  Scale,
  Warehouse,
  ShieldAlert,
  Users,
  Layers,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Info,
} from 'lucide-react';

interface SupervisorDistrictViewProps {
  currentUser: {
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
  };
}

export const SupervisorDistrictView: React.FC<SupervisorDistrictViewProps> = ({ currentUser }) => {
  const [report, setReport] = useState<OperationalReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/institutional/reports')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setReport(data.report);
        }
      })
      .catch((err) => console.error('Failed to load operational report:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-mono text-ink-muted">
        Aggregating district operational records from custody ledgers...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center text-sm text-red-700 bg-red-50 border border-red-200 rounded">
        Failed to aggregate operational records.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scope Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-forest/15 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-forest font-semibold">
            Operational Intelligence & Custody Audit
          </span>
          <h2 className="text-xl font-serif text-forest font-bold">
            {report.scopeDistrict} District Operations Report
          </h2>
          <p className="text-xs text-ink-muted">
            Generated at {new Date(report.generatedAt).toLocaleString('en-IN')} IST
          </p>
        </div>
        <div className="text-xs font-mono text-ink-muted bg-paper px-3 py-1.5 border border-forest/15 rounded flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL & Dexie Synchronized</span>
        </div>
      </div>

      {/* Top 4 KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-cream/70 border border-forest/20 p-4 rounded text-center">
          <span className="text-[10px] uppercase text-ink-muted block">Gross Field Intake</span>
          <span className="text-xl font-bold text-forest">{report.collectionVolumes.totalIntakeKg.toFixed(1)} kg</span>
          <span className="text-[10px] text-ink-muted block mt-1">Sacks: {report.collectionVolumes.totalSackCount}</span>
        </div>
        <div className="bg-cream/70 border border-forest/20 p-4 rounded text-center">
          <span className="text-[10px] uppercase text-ink-muted block">Net Accepted (Depôt)</span>
          <span className="text-xl font-bold text-forest">{report.collectionVolumes.netAcceptedKg.toFixed(1)} kg</span>
          <span className="text-[10px] text-emerald-800 block mt-1">Batches: {report.collectionVolumes.totalBatches}</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded text-center">
          <span className="text-[10px] uppercase text-emerald-700 block">Total Gatherer Payout</span>
          <span className="text-xl font-bold text-emerald-900">
            ₹{report.settlementReferences.totalDisbursedInr.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-700 block mt-1">100% Non-Deduction MSP</span>
        </div>
        <div className="bg-paper border border-forest/20 p-4 rounded text-center">
          <span className="text-[10px] uppercase text-ink-muted block">Depôt Occupancy</span>
          <span className="text-xl font-bold text-forest">
            {report.inventoryPosition.depotUtilisationPercent !== null
              ? `${report.inventoryPosition.depotUtilisationPercent}%`
              : '—'}
          </span>
          <span className="text-[10px] text-ink-muted block mt-1">
            Verified Saleable: {report.inventoryPosition.verifiedSaleableKg} kg
          </span>
        </div>
      </div>

      {/* Product-Wise Procurement Table (Distinguishing null from zero!) */}
      <div className="border border-forest/15 rounded overflow-hidden">
        <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-leaf" />
            <h3 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
              Product-Wise Minor Forest Produce Procurement (17 Species)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            Distinguishes unrecorded species from zero recordings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-cream/60 border-b border-forest/10 font-mono text-[10px] uppercase text-ink-muted">
              <tr>
                <th scope="col" className="py-2.5 px-4">Commodity</th>
                <th scope="col" className="py-2.5 px-4">Odia Script</th>
                <th scope="col" className="py-2.5 px-4 text-right">Procured Volume</th>
                <th scope="col" className="py-2.5 px-4 text-right">Avg Rate / kg</th>
                <th scope="col" className="py-2.5 px-4 text-right">Gross MSP Payout</th>
                <th scope="col" className="py-2.5 px-4 text-center">Batches</th>
                <th scope="col" className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/10 font-mono">
              {report.productWiseProcurement.map((p) => (
                <tr key={p.produceId} className={p.hasData ? 'bg-cream/20 font-semibold' : 'text-ink-muted'}>
                  <td className="py-2 px-4 font-sans text-forest">{p.produceName}</td>
                  <td className="py-2 px-4 text-ink-muted font-sans">{p.produceOdia}</td>
                  <td className="py-2 px-4 text-right">
                    {p.volumeKg !== null ? (
                      <span className="text-forest font-bold">{p.volumeKg.toFixed(1)} kg</span>
                    ) : (
                      <span className="text-ink-muted/50">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    {p.averageRatePerKg !== null ? `₹${p.averageRatePerKg.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2 px-4 text-right">
                    {p.grossPayoutInr !== null ? (
                      <span className="text-emerald-800">₹{p.grossPayoutInr.toLocaleString('en-IN')}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 px-4 text-center">{p.batchCount > 0 ? p.batchCount : '0'}</td>
                  <td className="py-2 px-4 text-center">
                    {p.hasData ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                        ACTIVE INTAKE
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-muted/60">NO RECORDS</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aggregation Center Breakdown */}
      <div className="border border-forest/15 rounded overflow-hidden">
        <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-leaf" />
            <h3 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
              Nodal Aggregation Center Activity & Transit Dispatches
            </h3>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">Mayurbhanj Cluster Hierarchy</span>
        </div>

        <div className="divide-y divide-forest/10 text-xs">
          {report.collectionCentreActivity.map((c) => (
            <div key={c.centerCode} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 bg-forest text-cream rounded font-bold">
                    {c.centerCode}
                  </span>
                  <h4 className="font-semibold text-forest">{c.centerName}</h4>
                  <span className="text-[11px] text-ink-muted">({c.block} Block)</span>
                </div>
                <div className="text-[11px] font-mono text-ink-muted">
                  Active Collectors: {c.activeCollectorsCount !== null ? c.activeCollectorsCount : '—'} · Active
                  Facilitators: {c.activeFacilitatorsCount !== null ? c.activeFacilitatorsCount : '—'}
                </div>
              </div>

              <div className="text-right font-mono text-xs space-y-1 shrink-0">
                <div>
                  <span className="text-ink-muted text-[10px]">INTAKE: </span>
                  <span className="font-bold text-forest">
                    {c.intakeKg !== null ? `${c.intakeKg.toFixed(1)} kg` : 'No Records Available'}
                  </span>
                </div>
                <div className="text-[10px] text-ink-muted">
                  Dispatched: {c.dispatchedKg !== null ? `${c.dispatchedKg.toFixed(1)} kg` : '—'} (Batches: {c.batchCount})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Discrepancy & Shrinkage Compliance */}
      <div className="bg-paper border border-forest/15 rounded p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-forest flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" /> Transit Shrinkage & Loss Governance
          </h3>
          <span className="text-xs font-mono text-ink-muted">
            Allowable Limit: {report.operationalPerformance.allowableShrinkagePercent}%
          </span>
        </div>
        <p className="text-xs text-ink-muted">
          Batches exceeding allowable transit variance are quarantined immediately and require joint supervisor sign-off before release to central warehouse bays.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-mono pt-2">
          <div className="bg-cream/40 p-2.5 rounded border border-forest/10">
            <span className="text-[10px] text-ink-muted block">OPEN QUARANTINES</span>
            <span className="text-base font-bold text-forest">
              {report.quarantineAndExceptions.openQuarantinedCases}
            </span>
          </div>
          <div className="bg-cream/40 p-2.5 rounded border border-forest/10">
            <span className="text-[10px] text-ink-muted block">RESOLVED CASES</span>
            <span className="text-base font-bold text-forest">
              {report.quarantineAndExceptions.resolvedCases}
            </span>
          </div>
          <div className="bg-cream/40 p-2.5 rounded border border-forest/10">
            <span className="text-[10px] text-ink-muted block">AVG TRANSIT TIME</span>
            <span className="text-base font-bold text-forest">
              {report.operationalPerformance.transitVerificationAvgHours !== null
                ? `${report.operationalPerformance.transitVerificationAvgHours} hrs`
                : '—'}
            </span>
          </div>
          <div className="bg-cream/40 p-2.5 rounded border border-forest/10">
            <span className="text-[10px] text-ink-muted block">DBT AUDIT SUCCESS</span>
            <span className="text-base font-bold text-emerald-800">
              {report.operationalPerformance.dbtSuccessRatePercent !== null
                ? `${report.operationalPerformance.dbtSuccessRatePercent}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
