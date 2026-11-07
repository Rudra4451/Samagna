'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CommercialRevenueConfig,
  getStoredCommercialConfig,
  saveStoredCommercialConfig,
  getStoredMarketplaceOrders,
  MarketplaceOrder,
} from '@/lib/marketplace';
import {
  Percent,
  Building2,
  ShoppingBag,
  Download,
  CheckCircle2,
  Settings,
  Calendar,
  Warehouse,
  QrCode,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const MarketplaceCommissionSection: React.FC = () => {
  const [config, setConfig] = useState<CommercialRevenueConfig>(getStoredCommercialConfig());
  const [b2bRate, setB2bRate] = useState<number>(config.b2bCommissionPercent);
  const [b2cRate, setB2cRate] = useState<number>(config.b2cCommissionPercent);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getStoredMarketplaceOrders());
  }, []);

  // Financial Computations
  const b2bOrders = orders.filter((o) => o.buyerType === 'B2B');
  const b2cOrders = orders.filter((o) => o.buyerType === 'B2C');

  const totalB2bSalesKg = b2bOrders.reduce((acc, o) => acc + o.totalItemsKg, 0);
  const totalB2bSalesValue = b2bOrders.reduce((acc, o) => acc + o.totalGrossAmount, 0);
  const totalB2bCommission = b2bOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);

  const totalB2cSalesKg = b2cOrders.reduce((acc, o) => acc + o.totalItemsKg, 0);
  const totalB2cSalesValue = b2cOrders.reduce((acc, o) => acc + o.totalGrossAmount, 0);
  const totalB2cCommission = b2cOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);

  const totalMarketplaceRevenue = totalB2bCommission + totalB2cCommission;
  const completedOrders = orders.filter((o) => o.fulfillmentStatus === 'DELIVERED' || o.fulfillmentStatus === 'DISPATCHED' || o.fulfillmentStatus === 'APPROVED');
  const pendingOrders = orders.filter((o) => o.fulfillmentStatus === 'PENDING');

  const completedCommissions = completedOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);
  const pendingCommissions = pendingOrders.reduce((acc, o) => acc + o.totalCommissionAmount, 0);

  // Monthly Performance Breakdown (Projected + Recorded)
  const monthlyCommissions = [
    { month: 'Apr 2024', b2bSales: 45000, b2bComm: (45000 * b2bRate) / 100, b2cSales: 12000, b2cComm: (12000 * b2cRate) / 100 },
    { month: 'May 2024', b2bSales: 68000, b2bComm: (68000 * b2bRate) / 100, b2cSales: 15400, b2cComm: (15400 * b2cRate) / 100 },
    { month: 'Jun 2024', b2bSales: 32000, b2bComm: (32000 * b2bRate) / 100, b2cSales: 9800, b2cComm: (9800 * b2cRate) / 100 },
    { month: 'Jul 2024', b2bSales: 21000, b2bComm: (21000 * b2bRate) / 100, b2cSales: 6500, b2cComm: (6500 * b2cRate) / 100 },
    { month: 'Aug 2024', b2bSales: 18000, b2bComm: (18000 * b2bRate) / 100, b2cSales: 7200, b2cComm: (7200 * b2cRate) / 100 },
    { month: 'Sep 2024', b2bSales: 14000, b2bComm: (14000 * b2bRate) / 100, b2cSales: 8900, b2cComm: (8900 * b2cRate) / 100 },
    { month: 'Oct 2024', b2bSales: 16500, b2bComm: (16500 * b2bRate) / 100, b2cSales: 11200, b2cComm: (11200 * b2cRate) / 100 },
    { month: 'Nov 2024', b2bSales: 29000, b2bComm: (29000 * b2bRate) / 100, b2cSales: 14500, b2cComm: (14500 * b2cRate) / 100 },
    { month: 'Dec 2024', b2bSales: 34000, b2bComm: (34000 * b2bRate) / 100, b2cSales: 16800, b2cComm: (16800 * b2cRate) / 100 },
    { month: 'Jan 2025', b2bSales: 24000, b2bComm: (24000 * b2bRate) / 100, b2cSales: 13500, b2cComm: (13500 * b2cRate) / 100 },
    { month: 'Feb 2025', b2bSales: 28000, b2bComm: (28000 * b2bRate) / 100, b2cSales: 14200, b2cComm: (14200 * b2cRate) / 100 },
    { month: 'Mar 2025', b2bSales: totalB2bSalesValue > 0 ? totalB2bSalesValue : 31000, b2bComm: totalB2bCommission > 0 ? totalB2bCommission : (31000 * b2bRate) / 100, b2cSales: totalB2cSalesValue > 0 ? totalB2cSalesValue : 15800, b2cComm: totalB2cCommission > 0 ? totalB2cCommission : (15800 * b2cRate) / 100 },
  ];

  const handleSaveCommissionRates = () => {
    const updated: CommercialRevenueConfig = {
      ...config,
      b2bCommissionPercent: b2bRate,
      b2cCommissionPercent: b2cRate,
    };
    setConfig(updated);
    saveStoredCommercialConfig(updated);
    setToastMsg(`Commission parameters updated: B2B Wholesale @ ${b2bRate}%, B2C Retail @ ${b2cRate}%.`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportCsv = () => {
    const headers = ['Order Number', 'Invoice Number', 'Buyer Category', 'Customer / Entity', 'Primary Batch', 'Produce Volume (kg)', 'Gross Merchandise Value (INR)', 'Commission Rate (%)', 'SAMAGNA Commission Revenue (INR)', 'Collector Settlement (INR)', 'Status'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.invoiceNumber,
      o.buyerType,
      `"${o.buyer.companyName || o.buyer.name}"`,
      o.primaryBatchCode,
      o.totalItemsKg,
      o.totalGrossAmount.toFixed(2),
      o.effectiveCommissionRate,
      o.totalCommissionAmount.toFixed(2),
      o.totalSellerSettlement.toFixed(2),
      o.fulfillmentStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SAMAGNA-Marketplace-Commission-Report-${Date.now()}.csv`);
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
            <Percent size={18} className="text-accent" />
            <h3 className="font-heading font-bold text-[18px] text-ink">
              Marketplace Commercial Commission Management
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted font-mono mt-0.5">
            Transparent commission revenues earned from B2B wholesale consignments and B2C consumer orders.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-3 py-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink text-[12px] font-mono font-medium flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export Commission Ledger (CSV)</span>
        </button>
      </div>

      {/* Policy Guarantee Banner */}
      <div className="p-4 rounded-[4px] border border-accent/30 bg-accent/5 text-[12px] space-y-1">
        <div className="flex items-center gap-2 text-accent font-mono font-bold">
          <CheckCircle2 size={16} />
          <span>ZERO DEDUCTION COLLECTOR GUARANTEE</span>
        </div>
        <p className="text-ink leading-relaxed">
          Platform commissions are charged transparently to commercial buyers or integrated into wholesale trade margins. In accordance with state statutory mandates, forest gatherers receive 100% of their DBT Minimum Support Price entitlement with zero deductions.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total B2B Sales */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span className="uppercase font-semibold">Total B2B Bulk Sales</span>
            <Building2 size={14} className="text-indigo-600" />
          </div>
          <div className="text-[22px] font-mono font-bold text-ink">
            ₹{totalB2bSalesValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-ink-subtle block">
            {totalB2bSalesKg} kg bulk volume · {b2bOrders.length} orders
          </span>
        </div>

        {/* Total B2C Sales */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
            <span className="uppercase font-semibold">Total B2C Consumer Sales</span>
            <ShoppingBag size={14} className="text-emerald-600" />
          </div>
          <div className="text-[22px] font-mono font-bold text-ink">
            ₹{totalB2cSalesValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] font-mono text-ink-subtle block">
            {totalB2cSalesKg} kg retail volume · {b2cOrders.length} orders
          </span>
        </div>

        {/* Commission Revenue Breakdown */}
        <div className="p-4 rounded-[3px] border border-rule bg-surface space-y-1">
          <span className="text-[11px] font-mono uppercase text-ink-muted block font-semibold">
            B2B & B2C Commission Fees
          </span>
          <div className="text-[16px] font-mono font-bold text-ink flex items-baseline justify-between">
            <span>B2B: ₹{totalB2bCommission.toFixed(2)}</span>
            <span className="text-ink-muted font-normal text-[11px]">({b2bRate}%)</span>
          </div>
          <div className="text-[16px] font-mono font-bold text-ink flex items-baseline justify-between">
            <span>B2C: ₹{totalB2cCommission.toFixed(2)}</span>
            <span className="text-ink-muted font-normal text-[11px]">({b2cRate}%)</span>
          </div>
        </div>

        {/* Total Marketplace Revenue */}
        <div className="p-4 rounded-[3px] border border-accent/40 bg-accent/5 space-y-1">
          <span className="text-[11px] font-mono uppercase text-accent font-bold block">
            Total Marketplace Revenue
          </span>
          <div className="text-[24px] font-mono font-bold text-accent">
            ₹{totalMarketplaceRevenue.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-ink-subtle flex items-center justify-between">
            <span>Completed: ₹{completedCommissions.toFixed(2)}</span>
            <span>Pending: ₹{pendingCommissions.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Commission Rate Configurator Box */}
      <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <h4 className="font-heading font-bold text-[15px] text-ink flex items-center gap-2">
            <Settings size={16} className="text-accent" />
            <span>Administrator Commission Rates Configuration</span>
          </h4>
          <span className="text-[11px] font-mono text-ink-muted">
            Applied transparently across marketplace checkout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink flex items-center justify-between">
              <span>B2B Wholesale Commission Rate (%)</span>
              <span className="text-accent font-mono font-bold">{b2bRate}%</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="15.0"
              value={b2bRate}
              onChange={(e) => setB2bRate(Number(e.target.value))}
              className="w-full h-9 px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink"
            />
            <span className="text-[10px] text-ink-muted font-mono block">
              Charged on bulk orders (pharmaceutical, ayurvedic & wholesale consignments). Default: 3.5%
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-ink flex items-center justify-between">
              <span>B2C Consumer Retail Commission Rate (%)</span>
              <span className="text-accent font-mono font-bold">{b2cRate}%</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="20.0"
              value={b2cRate}
              onChange={(e) => setB2cRate(Number(e.target.value))}
              className="w-full h-9 px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink"
            />
            <span className="text-[10px] text-ink-muted font-mono block">
              Integrated into consumer packaged unit prices (honey, dried nuts, herbal slices). Default: 6.0%
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveCommissionRates}
            className="h-9 px-4 text-[12px] font-semibold"
          >
            Update & Apply Commission Rates
          </Button>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
        <div className="p-4 border-b border-rule bg-bg-sunken flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-accent" />
            <h4 className="font-heading font-bold text-[14px] text-ink">
              Marketplace Commercial Transactions & Commission Audit
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            {orders.length} Recorded Commercial Allocations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3">Order #</th>
                <th scope="col" className="p-3">Buyer & Category</th>
                <th scope="col" className="p-3">Primary Lot</th>
                <th scope="col" className="p-3 text-right">Volume</th>
                <th scope="col" className="p-3 text-right">Gross GMV</th>
                <th scope="col" className="p-3 text-right">Commission Rate</th>
                <th scope="col" className="p-3 text-right font-bold text-accent">SAMAGNA Fee</th>
                <th scope="col" className="p-3 text-right">Seller Disbursed</th>
                <th scope="col" className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-bg-sunken/40">
                  <td className="p-3 font-bold text-ink">
                    <Link href={`/store/orders/${o.orderNumber}`} className="hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-ink">
                      {o.buyer.companyName || o.buyer.name}
                    </div>
                    <span
                      className={cn(
                        'text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-[2px] border font-bold inline-block',
                        o.buyerType === 'B2B'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}
                    >
                      {o.buyerType}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/verify/${o.primaryBatchCode}`}
                      className="text-accent hover:underline flex items-center gap-0.5"
                    >
                      <QrCode size={11} />
                      <span>#{o.primaryBatchCode}</span>
                    </Link>
                  </td>
                  <td className="p-3 text-right">{o.totalItemsKg} kg</td>
                  <td className="p-3 text-right font-bold text-ink">
                    ₹{o.totalGrossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-ink-muted">{o.effectiveCommissionRate}%</td>
                  <td className="p-3 text-right font-bold text-accent">
                    ₹{o.totalCommissionAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-ink-subtle">
                    ₹{o.totalSellerSettlement.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/store/orders/${o.orderNumber}`}
                      className="text-accent hover:underline text-[11px] font-sans font-semibold"
                    >
                      Invoice →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Commission Performance Schedule */}
      <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
        <div className="p-4 border-b border-rule bg-bg-sunken flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <h4 className="font-heading font-bold text-[14px] text-ink">
              Monthly Commercial Sales & Commission Schedule (FY 2024-25)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            12-Month Performance Log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-surface font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3">Month</th>
                <th scope="col" className="p-3 text-right">B2B Wholesale GMV</th>
                <th scope="col" className="p-3 text-right text-indigo-700">B2B Fee ({b2bRate}%)</th>
                <th scope="col" className="p-3 text-right">B2C Retail GMV</th>
                <th scope="col" className="p-3 text-right text-emerald-700">B2C Fee ({b2cRate}%)</th>
                <th scope="col" className="p-3 text-right font-bold">Total Marketplace Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-mono">
              {monthlyCommissions.map((row) => {
                const totalComm = row.b2bComm + row.b2cComm;
                return (
                  <tr key={row.month} className="hover:bg-bg-sunken/40">
                    <td className="p-3 font-semibold text-ink">{row.month}</td>
                    <td className="p-3 text-right">₹{row.b2bSales.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-indigo-700">₹{row.b2bComm.toFixed(2)}</td>
                    <td className="p-3 text-right">₹{row.b2cSales.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-emerald-700">₹{row.b2cComm.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-accent">₹{totalComm.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

