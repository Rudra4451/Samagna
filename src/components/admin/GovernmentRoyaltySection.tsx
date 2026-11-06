'use client';

import React, { useState, useEffect } from 'react';
import {
  CommercialRevenueConfig,
  getStoredCommercialConfig,
  saveStoredCommercialConfig,
} from '@/lib/marketplace';
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  FileSpreadsheet,
  Settings,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const GovernmentRoyaltySection: React.FC = () => {
  const [config, setConfig] = useState<CommercialRevenueConfig>(getStoredCommercialConfig());
  const [royaltyRate, setRoyaltyRate] = useState<number>(config.govRoyaltyPercent);
  const [licensingFee, setLicensingFee] = useState<number>(config.govAnnualLicensingFee);
  const [maintenanceFee, setMaintenanceFee] = useState<number>(config.govTechMaintenanceFee);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Government Procurement Ledger Baseline
  // 6 verified batches + baseline tribal aggregation totaling 6,100 kg across Mayurbhanj
  const totalProcurementKg = 6100.0;
  const totalProcurementValue = 255582.6; // INR gross value procured at MSP

  // Calculated Service Royalty
  const calculatedRoyalty = (totalProcurementValue * royaltyRate) / 100;
  const totalInstitutionalRevenue = calculatedRoyalty + licensingFee + maintenanceFee;

  // Monthly historical and projected breakdown (FY 2024-25)
  const monthlyBreakdown = [
    { month: 'Apr 2024', procurementKg: 1200, procurementValue: 50400, royalty: (50400 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'May 2024', procurementKg: 1850, procurementValue: 77700, royalty: (77700 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Jun 2024', procurementKg: 950, procurementValue: 39900, royalty: (39900 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Jul 2024', procurementKg: 400, procurementValue: 16800, royalty: (16800 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Aug 2024', procurementKg: 250, procurementValue: 10500, royalty: (10500 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Sep 2024', procurementKg: 200, procurementValue: 8400, royalty: (8400 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Oct 2024', procurementKg: 150, procurementValue: 6300, royalty: (6300 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Nov 2024', procurementKg: 300, procurementValue: 12600, royalty: (12600 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Dec 2024', procurementKg: 250, procurementValue: 10500, royalty: (10500 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Jan 2025', procurementKg: 180, procurementValue: 7560, royalty: (7560 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Feb 2025', procurementKg: 170, procurementValue: 7140, royalty: (7140 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
    { month: 'Mar 2025', procurementKg: 200, procurementValue: 7782.6, royalty: (7782.6 * royaltyRate) / 100, licenseShare: licensingFee / 12, maintenanceShare: maintenanceFee / 12 },
  ];

  const handleSaveConfig = () => {
    const updated: CommercialRevenueConfig = {
      ...config,
      govRoyaltyPercent: royaltyRate,
      govAnnualLicensingFee: licensingFee,
      govTechMaintenanceFee: maintenanceFee,
    };
    setConfig(updated);
    saveStoredCommercialConfig(updated);
    setToastMsg('Institutional Government Royalty terms updated and saved.');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportCsv = () => {
    const headers = ['Month', 'Procurement Weight (kg)', 'Government Procurement Value (INR)', 'Calculated Royalty (INR)', 'Monthly Platform License (INR)', 'Monthly Tech Maintenance (INR)', 'Total SAMAGNA Institutional Revenue (INR)'];
    const rows = monthlyBreakdown.map((m) => {
      const total = m.royalty + m.licenseShare + m.maintenanceShare;
      return [
        m.month,
        m.procurementKg,
        m.procurementValue.toFixed(2),
        m.royalty.toFixed(2),
        m.licenseShare.toFixed(2),
        m.maintenanceShare.toFixed(2),
        total.toFixed(2),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SAMAGNA-Govt-Royalty-Report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-[3px] text-success text-[12px] font-mono flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-accent" />
            <h3 className="font-heading font-bold text-[18px] text-ink">
              Government Royalty & Institutional Service Revenue
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted font-mono mt-0.5">
            Commercial charging framework for providing and maintaining the state digital procurement ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink text-[12px] font-mono font-medium flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export Royalty Report (CSV)</span>
        </button>
      </div>

      {/* Statutory Non-Deduction Warning Banner (Mandatory Requirement 2) */}
      <div className="p-4 rounded-[4px] border border-warning/40 bg-warning/10 text-[12px] space-y-1.5">
        <div className="flex items-center gap-2 font-bold font-mono text-warning">
          <AlertTriangle size={16} />
          <span>COMMERCIAL ARRANGEMENT & STATUTORY NON-DEDUCTION DIRECTIVE</span>
        </div>
        <p className="text-ink leading-relaxed">
          These institutional revenue terms represent proposed commercial arrangements with the state government, subject to mutual administrative approval, annual budget appropriations, and bilateral contractual agreements.
        </p>
        <p className="text-ink font-bold leading-relaxed">
          INVARIANT: Service royalties and platform maintenance fees are payable strictly from institutional administrative allocations and must NEVER be deducted from tribal forest collectors’ Minimum Support Price (MSP) payments.
        </p>
      </div>

      {/* Metric Tiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Procurement Value */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <span className="text-[11px] font-mono uppercase text-ink-muted block font-semibold">
            Total Govt Procurement
          </span>
          <div className="text-[22px] font-mono font-bold text-ink">
            ₹{totalProcurementValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-ink-subtle block">
            {totalProcurementKg.toLocaleString()} kg verified across Mayurbhanj
          </span>
        </div>

        {/* Calculated Service Royalty */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <span className="text-[11px] font-mono uppercase text-accent block font-semibold">
            Calculated Service Royalty ({royaltyRate}%)
          </span>
          <div className="text-[22px] font-mono font-bold text-accent">
            ₹{calculatedRoyalty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] font-mono text-ink-subtle block">
            Transaction-based platform fee
          </span>
        </div>

        {/* Annual Licensing & Maintenance */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <span className="text-[11px] font-mono uppercase text-ink-muted block font-semibold">
            Annual Tech & Licensing
          </span>
          <div className="text-[22px] font-mono font-bold text-ink">
            ₹{(licensingFee + maintenanceFee).toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-mono text-ink-subtle block">
            ₹{(licensingFee / 100000).toFixed(1)}L License + ₹{(maintenanceFee / 100000).toFixed(1)}L Maintenance
          </span>
        </div>

        {/* Total Institutional Revenue */}
        <div className="p-4 rounded-[3px] border border-accent/40 bg-accent/5 space-y-1">
          <span className="text-[11px] font-mono uppercase text-accent font-bold block">
            Total Institutional Revenue
          </span>
          <div className="text-[24px] font-mono font-bold text-accent">
            ₹{totalInstitutionalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-success font-semibold block">
            Proposed Annual Govt Billings
          </span>
        </div>
      </div>

      {/* Configurator Box */}
      <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <h4 className="font-heading font-bold text-[15px] text-ink flex items-center gap-2">
            <Settings size={16} className="text-accent" />
            <span>Configure Government Commercial Terms</span>
          </h4>
          <span className="text-[11px] font-mono text-ink-muted">
            Configurable Administrative Parameters
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-semibold text-ink block mb-1">
              Procurement Service Royalty (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="10.0"
              value={royaltyRate}
              onChange={(e) => setRoyaltyRate(Number(e.target.value))}
              className="w-full h-9 px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink"
            />
            <span className="text-[10px] text-ink-muted font-mono mt-1 block">
              Default 2.5% of verified MSP value
            </span>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-ink block mb-1">
              Annual Platform Licensing Fee (₹ / year)
            </label>
            <input
              type="number"
              step="10000"
              min="0"
              value={licensingFee}
              onChange={(e) => setLicensingFee(Number(e.target.value))}
              className="w-full h-9 px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink"
            />
            <span className="text-[10px] text-ink-muted font-mono mt-1 block">
              Statewide cloud hosting & user licensing
            </span>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-ink block mb-1">
              Technology Maintenance Charges (₹ / year)
            </label>
            <input
              type="number"
              step="10000"
              min="0"
              value={maintenanceFee}
              onChange={(e) => setMaintenanceFee(Number(e.target.value))}
              className="w-full h-9 px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink"
            />
            <span className="text-[10px] text-ink-muted font-mono mt-1 block">
              Disaster recovery & Bluetooth scale firmware
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveConfig}
            className="h-9 px-4 text-[12px] font-semibold"
          >
            Save Commercial Parameters
          </Button>
        </div>
      </div>

      {/* Monthly and Yearly Revenue Reports Table */}
      <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
        <div className="p-4 border-b border-rule bg-bg-sunken flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <h4 className="font-heading font-bold text-[14px] text-ink">
              Monthly & Yearly Institutional Revenue Schedule (FY 2024-25)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            12-Month Historical & Projected Breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3 text-right">Procured (kg)</th>
                <th scope="col" className="p-3 text-right">Govt Procurement Value</th>
                <th scope="col" className="p-3 text-right">Royalty ({royaltyRate}%)</th>
                <th scope="col" className="p-3 text-right">License Allocation</th>
                <th scope="col" className="p-3 text-right">Maintenance Allocation</th>
                <th scope="col" className="p-3 text-right font-bold">Total SAMAGNA Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {monthlyBreakdown.map((row) => {
                const monthTotal = row.royalty + row.licenseShare + row.maintenanceShare;
                return (
                  <tr key={row.month} className="hover:bg-bg-sunken/40">
                    <td className="p-3 font-semibold text-ink">{row.month}</td>
                    <td className="p-3 text-right">{row.procurementKg.toLocaleString()} kg</td>
                    <td className="p-3 text-right">₹{row.procurementValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-accent">₹{row.royalty.toFixed(2)}</td>
                    <td className="p-3 text-right text-ink-muted">₹{row.licenseShare.toFixed(2)}</td>
                    <td className="p-3 text-right text-ink-muted">₹{row.maintenanceShare.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-ink">₹{monthTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule bg-bg-sunken font-mono text-[12px] font-bold text-ink">
                <td className="p-3">Annual Consolidated Total</td>
                <td className="p-3 text-right">{totalProcurementKg.toLocaleString()} kg</td>
                <td className="p-3 text-right">₹{totalProcurementValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td className="p-3 text-right text-accent">₹{calculatedRoyalty.toFixed(2)}</td>
                <td className="p-3 text-right">₹{licensingFee.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right">₹{maintenanceFee.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right text-accent text-[14px]">₹{totalInstitutionalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

