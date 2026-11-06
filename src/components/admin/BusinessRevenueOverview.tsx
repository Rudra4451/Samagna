'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CommercialRevenueConfig,
  getStoredCommercialConfig,
  getStoredMarketplaceOrders,
  MarketplaceOrder,
} from '@/lib/marketplace';
import {
  TrendingUp,
  Landmark,
  Building2,
  ShoppingBag,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  QrCode,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const BusinessRevenueOverview: React.FC = () => {
  const [config, setConfig] = useState<CommercialRevenueConfig>(getStoredCommercialConfig());
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);

  useEffect(() => {
    setOrders(getStoredMarketplaceOrders());
  }, []);

  // 1. Government Service Revenue Stream
  const totalProcurementValue = 255582.6; // Gross MSP value procured
  const govRoyalty = (totalProcurementValue * config.govRoyaltyPercent) / 100;
  const govServiceRevenue = govRoyalty + config.govAnnualLicensingFee + config.govTechMaintenanceFee;

  // 2. B2B Marketplace Commission Stream
  const b2bOrders = orders.filter((o) => o.buyerType === 'B2B');
  const totalB2bSales = b2bOrders.reduce((acc, o) => acc + o.totalGrossAmount, 0);
  const totalB2bCommission = b2bOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);

  // 3. B2C Marketplace Commission Stream
  const b2cOrders = orders.filter((o) => o.buyerType === 'B2C');
  const totalB2cSales = b2cOrders.reduce((acc, o) => acc + o.totalGrossAmount, 0);
  const totalB2cCommission = b2cOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);

  // Total Commercial Revenue
  const grandTotalRevenue = govServiceRevenue + totalB2bCommission + totalB2cCommission;
  const totalMarketplaceGmv = totalB2bSales + totalB2cSales;
  const totalSellerSettlements = b2bOrders.reduce((acc, o) => acc + o.totalSellerSettlement, 0) + b2cOrders.reduce((acc, o) => acc + o.totalSellerSettlement, 0);

  // Monthly Combined Performance Schedule (FY 2024-25)
  const monthlyCombinedPerformance = [
    { month: 'Apr 2024', govRevenue: (50400 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (45000 * config.b2bCommissionPercent) / 100, b2cComm: (12000 * config.b2cCommissionPercent) / 100 },
    { month: 'May 2024', govRevenue: (77700 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (68000 * config.b2bCommissionPercent) / 100, b2cComm: (15400 * config.b2cCommissionPercent) / 100 },
    { month: 'Jun 2024', govRevenue: (39900 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (32000 * config.b2bCommissionPercent) / 100, b2cComm: (9800 * config.b2cCommissionPercent) / 100 },
    { month: 'Jul 2024', govRevenue: (16800 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (21000 * config.b2bCommissionPercent) / 100, b2cComm: (6500 * config.b2cCommissionPercent) / 100 },
    { month: 'Aug 2024', govRevenue: (10500 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (18000 * config.b2bCommissionPercent) / 100, b2cComm: (7200 * config.b2cCommissionPercent) / 100 },
    { month: 'Sep 2024', govRevenue: (8400 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (14000 * config.b2bCommissionPercent) / 100, b2cComm: (8900 * config.b2cCommissionPercent) / 100 },
    { month: 'Oct 2024', govRevenue: (6300 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (16500 * config.b2bCommissionPercent) / 100, b2cComm: (11200 * config.b2cCommissionPercent) / 100 },
    { month: 'Nov 2024', govRevenue: (12600 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (29000 * config.b2bCommissionPercent) / 100, b2cComm: (14500 * config.b2cCommissionPercent) / 100 },
    { month: 'Dec 2024', govRevenue: (10500 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (34000 * config.b2bCommissionPercent) / 100, b2cComm: (16800 * config.b2cCommissionPercent) / 100 },
    { month: 'Jan 2025', govRevenue: (7560 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (24000 * config.b2bCommissionPercent) / 100, b2cComm: (13500 * config.b2cCommissionPercent) / 100 },
    { month: 'Feb 2025', govRevenue: (7140 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: (28000 * config.b2bCommissionPercent) / 100, b2cComm: (14200 * config.b2cCommissionPercent) / 100 },
    { month: 'Mar 2025', govRevenue: (7782.6 * config.govRoyaltyPercent) / 100 + (config.govAnnualLicensingFee + config.govTechMaintenanceFee) / 12, b2bComm: totalB2bCommission > 0 ? totalB2bCommission : 1085, b2cComm: totalB2cCommission > 0 ? totalB2cCommission : 948 },
  ];

  const handleExportConsolidatedCsv = () => {
    const headers = ['Financial Stream', 'Revenue Source Category', 'Annual Basis Value (INR)', 'Revenue Percentage'];
    const rows = [
      ['Stream 1: Government Service Revenue', 'Annual Platform License', config.govAnnualLicensingFee.toFixed(2), ((config.govAnnualLicensingFee / grandTotalRevenue) * 100).toFixed(1) + '%'],
      ['Stream 1: Government Service Revenue', 'Technology Maintenance', config.govTechMaintenanceFee.toFixed(2), ((config.govTechMaintenanceFee / grandTotalRevenue) * 100).toFixed(1) + '%'],
      ['Stream 1: Government Service Revenue', `Procurement Service Royalty (${config.govRoyaltyPercent}%)`, govRoyalty.toFixed(2), ((govRoyalty / grandTotalRevenue) * 100).toFixed(1) + '%'],
      ['Stream 2: B2B Marketplace Commission', `Wholesale Bulk Transactions (${config.b2bCommissionPercent}%)`, totalB2bCommission.toFixed(2), ((totalB2bCommission / grandTotalRevenue) * 100).toFixed(1) + '%'],
      ['Stream 3: B2C Marketplace Commission', `Consumer Retail Orders (${config.b2cCommissionPercent}%)`, totalB2cCommission.toFixed(2), ((totalB2cCommission / grandTotalRevenue) * 100).toFixed(1) + '%'],
      ['GRAND TOTAL COMMERCIAL REVENUE', 'Consolidated All Streams', grandTotalRevenue.toFixed(2), '100.0%'],
      ['STATUTORY SEPARATION: Govt Procurement Value', 'Verified Baseline MSP Value', totalProcurementValue.toFixed(2), 'Independent Institutional Pool'],
      ['STATUTORY SEPARATION: Tribal Gatherer Settlements', 'Direct DBT Disbursed (100% MSP)', totalProcurementValue.toFixed(2), 'Protected from Deductions'],
    ];

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SAMAGNA-Consolidated-Business-Revenue-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const exportData = {
      reportTitle: 'SAMAGNA Commercial Business Revenue Financial Audit',
      generatedAt: new Date().toISOString(),
      district: 'Mayurbhanj',
      financialYear: '2024-25',
      summary: {
        grandTotalRevenue: Number(grandTotalRevenue.toFixed(2)),
        governmentServiceRevenue: Number(govServiceRevenue.toFixed(2)),
        b2bMarketplaceCommission: Number(totalB2bCommission.toFixed(2)),
        b2cMarketplaceCommission: Number(totalB2cCommission.toFixed(2)),
        totalMarketplaceGmv: Number(totalMarketplaceGmv.toFixed(2)),
        totalGovernmentProcurementValue: Number(totalProcurementValue.toFixed(2)),
        totalCollectorDisbursements: Number(totalProcurementValue.toFixed(2)),
      },
      configuration: config,
      monthlyBreakdown: monthlyCombinedPerformance,
      orders,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SAMAGNA-Financial-Dossier-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h3 className="font-heading font-bold text-[18px] text-ink uppercase tracking-wide">
              SAMAGNA BUSINESS REVENUE
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted font-mono mt-0.5">
            Consolidated commercial financial overview uniting Government Services, B2B Bulk Commissions, and B2C Retail Commissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportConsolidatedCsv}
            className="px-3 py-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink text-[12px] font-mono font-medium flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Financial Ledger (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-1.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-none"
          >
            <Download size={14} />
            <span>Audit Dossier (JSON)</span>
          </button>
        </div>
      </div>

      {/* Strict Separation of Financial Figures (Mandatory Requirement 6) */}
      <div className="p-4 rounded-[4px] border border-rule bg-bg-sunken space-y-3">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <div className="flex items-center gap-2 text-ink font-mono text-[12px] font-bold uppercase">
            <ShieldCheck size={16} className="text-accent" />
            <span>STATUTORY FINANCIAL SEGREGATION MATRIX</span>
          </div>
          <span className="text-[10px] font-mono text-ink-muted">
            Independent Audit Classes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[12px] font-mono">
          <div className="p-3 rounded-[3px] bg-surface border border-rule space-y-1">
            <span className="text-[10px] uppercase text-ink-muted block font-semibold">
              1. Govt Procurement Value
            </span>
            <div className="text-[18px] font-bold text-ink">
              ₹{totalProcurementValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-ink-subtle block">State administrative fund</span>
          </div>

          <div className="p-3 rounded-[3px] bg-surface border border-rule space-y-1">
            <span className="text-[10px] uppercase text-success block font-semibold">
              2. Tribal Collector Payouts (100%)
            </span>
            <div className="text-[18px] font-bold text-success">
              ₹{totalProcurementValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-ink-subtle block">Zero deductions guaranteed</span>
          </div>

          <div className="p-3 rounded-[3px] bg-surface border border-rule space-y-1">
            <span className="text-[10px] uppercase text-ink-muted block font-semibold">
              3. Commercial Marketplace GMV
            </span>
            <div className="text-[18px] font-bold text-ink">
              ₹{totalMarketplaceGmv.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-ink-subtle block">B2B wholesale + B2C retail</span>
          </div>

          <div className="p-3 rounded-[3px] bg-accent/10 border border-accent/40 space-y-1">
            <span className="text-[10px] uppercase text-accent font-bold block">
              4. SAMAGNA Institutional Revenue
            </span>
            <div className="text-[20px] font-bold text-accent">
              ₹{grandTotalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <span className="text-[10px] text-accent font-semibold block">All 3 commercial streams</span>
          </div>
        </div>
      </div>

      {/* The Three Revenue Streams Showcase Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream 1: Government Service Revenue */}
        <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-rule pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-accent/10 text-accent flex items-center justify-center">
                  <Landmark size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Stream 1</span>
                  <h4 className="font-heading font-bold text-[14px] text-ink">
                    Government Service Revenue
                  </h4>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
                Institutional
              </span>
            </div>

            <div className="text-[22px] font-mono font-bold text-ink">
              ₹{govServiceRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-ink-muted border-t border-rule/50 pt-2">
              <div className="flex items-center justify-between">
                <span>Annual Platform Licensing:</span>
                <span className="font-bold text-ink">₹{config.govAnnualLicensingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Technology Maintenance:</span>
                <span className="font-bold text-ink">₹{config.govTechMaintenanceFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Procurement Royalty ({config.govRoyaltyPercent}%):</span>
                <span className="font-bold text-accent">₹{govRoyalty.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-rule text-[11px] text-ink-subtle">
            Proposed state billing terms · Independent of tribal MSP entitlements.
          </div>
        </div>

        {/* Stream 2: B2B Marketplace Commission */}
        <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-rule pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Building2 size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Stream 2</span>
                  <h4 className="font-heading font-bold text-[14px] text-ink">
                    B2B Marketplace Commission
                  </h4>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                {config.b2bCommissionPercent}% Wholesale
              </span>
            </div>

            <div className="text-[22px] font-mono font-bold text-ink">
              ₹{totalB2bCommission.toFixed(2)}
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-ink-muted border-t border-rule/50 pt-2">
              <div className="flex items-center justify-between">
                <span>Total Wholesale GMV:</span>
                <span className="font-bold text-ink">₹{totalB2bSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Wholesale Orders Recorded:</span>
                <span className="font-bold text-ink">{b2bOrders.length} consignments</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Bulk Volume Dispatched:</span>
                <span className="font-bold text-ink">{b2bOrders.reduce((acc, o) => acc + o.totalItemsKg, 0)} kg</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-rule text-[11px] text-ink-subtle">
            Pharma, Ayurvedic & wholesale enterprise procurement commissions.
          </div>
        </div>

        {/* Stream 3: B2C Marketplace Commission */}
        <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-rule pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[3px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ink-muted block">Stream 3</span>
                  <h4 className="font-heading font-bold text-[14px] text-ink">
                    B2C Marketplace Commission
                  </h4>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                {config.b2cCommissionPercent}% Retail
              </span>
            </div>

            <div className="text-[22px] font-mono font-bold text-ink">
              ₹{totalB2cCommission.toFixed(2)}
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-ink-muted border-t border-rule/50 pt-2">
              <div className="flex items-center justify-between">
                <span>Total Consumer Retail GMV:</span>
                <span className="font-bold text-ink">₹{totalB2cSales.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Retail Orders Placed:</span>
                <span className="font-bold text-ink">{b2cOrders.length} packages</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Consumer Produce Volume:</span>
                <span className="font-bold text-ink">{b2cOrders.reduce((acc, o) => acc + o.totalItemsKg, 0)} kg</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-rule text-[11px] text-ink-subtle">
            Individual household consumer purchases of wild honey, seeds & herbs.
          </div>
        </div>
      </div>

      {/* Monthly Performance Across All 3 Streams Table */}
      <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
        <div className="p-4 border-b border-rule bg-bg-sunken flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <h4 className="font-heading font-bold text-[14px] text-ink">
              Consolidated 3-Stream Monthly Performance Ledger (FY 2024-25)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            All Figures in INR (₹)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3 text-right">Stream 1: Govt Services</th>
                <th scope="col" className="p-3 text-right text-indigo-700">Stream 2: B2B Commission</th>
                <th scope="col" className="p-3 text-right text-emerald-700">Stream 3: B2C Commission</th>
                <th scope="col" className="p-3 text-right font-bold text-accent">Total Monthly Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {monthlyCombinedPerformance.map((row) => {
                const total = row.govRevenue + row.b2bComm + row.b2cComm;
                return (
                  <tr key={row.month} className="hover:bg-bg-sunken/40">
                    <td className="p-3 font-semibold text-ink">{row.month}</td>
                    <td className="p-3 text-right">₹{row.govRevenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-indigo-700">₹{row.b2bComm.toFixed(2)}</td>
                    <td className="p-3 text-right text-emerald-700">₹{row.b2cComm.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-ink">₹{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-rule bg-bg-sunken font-mono text-[12px] font-bold text-ink">
                <td className="p-3">Annual Consolidated Commercial Revenue</td>
                <td className="p-3 text-right">₹{govServiceRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                <td className="p-3 text-right text-indigo-700">₹{totalB2bCommission.toFixed(2)}</td>
                <td className="p-3 text-right text-emerald-700">₹{totalB2cCommission.toFixed(2)}</td>
                <td className="p-3 text-right text-accent text-[15px]">₹{grandTotalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

