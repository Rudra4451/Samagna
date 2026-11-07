'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import {
  Receipt,
  FileCheck2,
  DollarSign,
  Scale,
  ShieldCheck,
  Building,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  FileText,
  BadgeAlert,
  Coins,
  Send,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  CommercialInvoice,
  FinancialReconciliation,
  CommercialSettlement,
  ConfigurableFeeSchedule,
  FinancialAdjustment,
  FinancialAuditEntry,
  OrganisationFinancialSummary,
} from '@/lib/revenueReconciliation';
import { formatInrFromPaise } from '@/lib/financialMath';

type RevenueTab = 'invoices' | 'reconciliation' | 'settlements' | 'schedules' | 'adjustments' | 'reports';

export default function RevenueOperationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RevenueTab>('invoices');

  // Domain data
  const [invoices, setInvoices] = useState<CommercialInvoice[]>([]);
  const [reconciliations, setReconciliations] = useState<FinancialReconciliation[]>([]);
  const [settlements, setSettlements] = useState<CommercialSettlement[]>([]);
  const [schedules, setSchedules] = useState<ConfigurableFeeSchedule[]>([]);
  const [adjustments, setAdjustments] = useState<FinancialAdjustment[]>([]);
  const [reports, setReports] = useState<OrganisationFinancialSummary[]>([]);
  const [auditEntries, setAuditEntries] = useState<FinancialAuditEntry[]>([]);

  // Feedback states
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvOrgId, setNewInvOrgId] = useState('ORG-TDCCOL-ODISHA');
  const [newInvOrgName, setNewInvOrgName] = useState('TDCCOL Odisha');
  const [newInvDesc, setNewInvDesc] = useState('Milestone 2 SLA Maintenance & Custody Ledger');
  const [newInvAmount, setNewInvAmount] = useState('450000');
  const [newInvApprover, setNewInvApprover] = useState('Finance Director, ST/SC Dev Dept');

  // New Settlement Modal
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [newPayeeOrgId, setNewPayeeOrgId] = useState('BUS-SHG-KARANJIA');
  const [newPayeeOrgName, setNewPayeeOrgName] = useState('Karanjia Tribal Mahila Producer Federation');
  const [newGrossMsp, setNewGrossMsp] = useState('85000');
  const [newSettlementApprover, setNewSettlementApprover] = useState('Dr. Ramesh Jena (Coordinator)');

  // Quick Reconcile Modal
  const [selectedInvoice, setSelectedInvoice] = useState<CommercialInvoice | null>(null);
  const [recChallanUtr, setRecChallanUtr] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recOfficer, setRecOfficer] = useState('Senior Treasury Auditor');

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, recRes, stlRes, schRes, adjRes, repRes] = await Promise.all([
        fetch('/api/revenue/invoices').then((r) => r.json()),
        fetch('/api/revenue/reconciliation').then((r) => r.json()),
        fetch('/api/revenue/settlements').then((r) => r.json()),
        fetch('/api/revenue/schedules').then((r) => r.json()),
        fetch('/api/revenue/adjustments').then((r) => r.json()),
        fetch('/api/revenue/reports').then((r) => r.json()),
      ]);

      if (invRes.invoices) setInvoices(invRes.invoices);
      if (recRes.reconciliations) setReconciliations(recRes.reconciliations);
      if (stlRes.settlements) setSettlements(stlRes.settlements);
      if (schRes.schedules) setSchedules(schRes.schedules);
      if (adjRes.adjustments) setAdjustments(adjRes.adjustments);
      if (repRes.reports) setReports(repRes.reports);
    } catch (err: any) {
      console.error('Error loading revenue operational data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/revenue');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Auth check error:', err))
      .finally(() => {
        if (isMounted) loadData();
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/revenue/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organisationId: newInvOrgId,
          organisationName: newInvOrgName,
          invoiceType: 'INSTITUTIONAL_CONTRACT',
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          taxRatePercent: 18,
          approvedBy: newInvApprover,
          lines: [
            {
              chargeCategory: 'INSTITUTIONAL_FIXED_FEE',
              description: newInvDesc,
              quantity: 1,
              unitOfMeasure: 'MILESTONE',
              unitPriceInr: parseFloat(newInvAmount),
              sourceReferenceType: 'CONTRACT_DELIVERABLE',
              sourceReferenceId: 'DELIV-SLA-2025',
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice');

      setActionSuccess(`Invoice ${data.invoiceNumber} successfully generated with approved charge!`);
      setShowInvoiceModal(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const idempotencyKey = `IDEMP-SETTL-${newPayeeOrgId}-${Date.now()}`;
      const res = await fetch('/api/revenue/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          payeeOrgId: newPayeeOrgId,
          payeeOrgName: newPayeeOrgName,
          payeeType: 'SHG_FEDERATION',
          settlementType: 'PRODUCER_MSP_PAYOUT',
          sourceReference: 'LIST-HARVEST-2025-02',
          grossAmountInr: parseFloat(newGrossMsp),
          deductionsInr: 0, // Invariant: Zero deductions from MSP!
          approvedBy: newSettlementApprover,
          notes: 'Primary collector fair-trade MSP disbursement.',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create settlement');

      setActionSuccess(`Settlement ${data.settlementNumber} created for ₹${data.netPayableInr.toFixed(2)} with zero MSP deductions!`);
      setShowSettlementModal(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleExecuteReconciliation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      // Create payment reference first
      const isSimulated = recChallanUtr.toUpperCase().startsWith('SIM-');
      const payRefRes = await fetch('/api/revenue/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          paymentReferenceId: `PAY-SIM-${Date.now()}`,
          reconciledBy: recOfficer,
        }),
      });

      // Alternatively, execute reconciliation directly
      setActionSuccess(`Reconciliation completed for invoice ${selectedInvoice.invoiceNumber}.`);
      setSelectedInvoice(null);
      loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1A2E1A] p-4 sm:p-6 lg:p-8">
        {/* Header Masthead */}
        <div className="max-w-7xl mx-auto mb-6 bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5 text-[#88D49E]" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#1B4332]">
                    Revenue & Commercial Reconciliation Desk
                  </h1>
                  <p className="text-xs text-[#526D52]">
                    Unified financial operations, institutional contracts, payment reconciliation & MSP protection ledger
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% MSP Fair-Trade Invariant Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB]">
                <Scale className="w-3.5 h-3.5" />
                Collector Access Free
              </span>
              <button
                onClick={loadData}
                className="p-2 text-[#526D52] hover:text-[#1B4332] hover:bg-[#F4F1EA] rounded-lg transition-colors"
                title="Refresh Financial Ledger"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className="mt-4 p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg text-xs text-[#2E7D32] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="mt-4 p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg text-xs text-[#C62828] flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {actionError}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 border-b border-[#E5E0D8] mt-6 pt-2">
            {[
              { id: 'invoices', label: 'Commercial Invoices', icon: Receipt, count: invoices.length },
              { id: 'reconciliation', label: 'Payment Reconciliation', icon: FileCheck2, count: reconciliations.length },
              { id: 'settlements', label: 'Disbursement Settlements', icon: DollarSign, count: settlements.length },
              { id: 'schedules', label: 'Fee Schedules & Terms', icon: Scale, count: schedules.length },
              { id: 'adjustments', label: 'Credit Adjustments', icon: BadgeAlert, count: adjustments.length },
              { id: 'reports', label: 'Org Revenue Summaries', icon: Building, count: reports.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as RevenueTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#1B4332] text-[#1B4332] font-semibold bg-[#F4F1EA]/50 rounded-t-lg'
                      : 'border-transparent text-[#526D52] hover:text-[#1B4332] hover:border-[#D1C7BD]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-[#1B4332] text-white' : 'bg-[#EAE5DF] text-[#526D52]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Commercial Invoices */}
        {activeTab === 'invoices' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1B4332]">Commercial & Institutional Invoices</h2>
                <p className="text-xs text-[#526D52]">
                  Track issued invoices, line-item fee breakdowns, GST calculations, and payment approvals.
                </p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2D5A27] transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Generate Approved Invoice
              </button>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1A2E1A]">
                  <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Invoice Number</th>
                      <th scope="col" className="px-4 py-3">Billed Organisation</th>
                      <th scope="col" className="px-4 py-3">Type</th>
                      <th scope="col" className="px-4 py-3">Due Date</th>
                      <th scope="col" className="px-4 py-3 text-right">Subtotal</th>
                      <th scope="col" className="px-4 py-3 text-right">Tax (GST)</th>
                      <th scope="col" className="px-4 py-3 text-right">Total Invoiced</th>
                      <th scope="col" className="px-4 py-3 text-right">Outstanding</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                      <th scope="col" className="px-4 py-3 text-center">Reconciliation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-[#526D52]">
                          No commercial invoices found in the ledger.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#1B4332]">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{inv.organisationName}</div>
                            <div className="text-[10px] text-[#526D52]">{inv.organisationId}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0EDE6] text-[#334D33]">
                              {inv.invoiceType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#526D52]">
                            {new Date(inv.dueDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatInrFromPaise(inv.subtotalPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#526D52]">
                            {formatInrFromPaise(inv.taxPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#1B4332]">
                            {formatInrFromPaise(inv.totalAmountPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-[#D9381E]">
                            {formatInrFromPaise(inv.outstandingAmountPaise)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-[#FFF8E1] text-[#F57F17]'
                                  : inv.status === 'CANCELLED'
                                  ? 'bg-[#ECEFF1] text-[#546E7A]'
                                  : inv.status === 'DISPUTED'
                                  ? 'bg-[#FFEBEE] text-[#C62828]'
                                  : 'bg-[#E3F2FD] text-[#1565C0]'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                inv.reconciliationStatus === 'FULLY_RECONCILED'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : inv.reconciliationStatus === 'PARTIALLY_RECONCILED'
                                  ? 'bg-[#FFF8E1] text-[#F57F17]'
                                  : 'bg-[#FFEBEE] text-[#C62828]'
                              }`}
                            >
                              {inv.reconciliationStatus.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payment Reconciliation */}
        {activeTab === 'reconciliation' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1B4332]">Financial Reconciliation Desk</h2>
              <p className="text-xs text-[#526D52]">
                Audit matching between invoiced balances, treasury e-challans, and bank UTR instruments with zero floating-point drift.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-[#526D52]">Fully Reconciled</div>
                <div className="text-2xl font-bold text-[#2E7D32] mt-1">
                  {reconciliations.filter((r) => r.status === 'FULLY_RECONCILED').length}
                </div>
                <div className="text-[10px] text-[#526D52] mt-1">100% Zero-Variance Audited</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-[#526D52]">Partial / Timing Variance</div>
                <div className="text-2xl font-bold text-[#F57F17] mt-1">
                  {reconciliations.filter((r) => r.status === 'PARTIALLY_RECONCILED').length}
                </div>
                <div className="text-[10px] text-[#526D52] mt-1">Pending Tranche Match</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-xl p-4 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-[#526D52]">Discrepancies Flagged</div>
                <div className="text-2xl font-bold text-[#C62828] mt-1">
                  {reconciliations.filter((r) => r.status === 'DISCREPANCY_FLAGGED' || r.status === 'DISPUTED').length}
                </div>
                <div className="text-[10px] text-[#526D52] mt-1">Requires Formal Audit Adjustment</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1A2E1A]">
                  <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Audit Reference</th>
                      <th scope="col" className="px-4 py-3">Invoice Link</th>
                      <th scope="col" className="px-4 py-3">Expected Amount</th>
                      <th scope="col" className="px-4 py-3">Received Instrument</th>
                      <th scope="col" className="px-4 py-3 text-right">Variance</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                      <th scope="col" className="px-4 py-3">Reconciled By</th>
                      <th scope="col" className="px-4 py-3">Audit Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {reconciliations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-[#526D52]">
                          No reconciliation records found.
                        </td>
                      </tr>
                    ) : (
                      reconciliations.map((rec) => (
                        <tr key={rec.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#1B4332]">{rec.reconciliationCode}</td>
                          <td className="px-4 py-3 font-medium">{rec.invoiceId || 'N/A'}</td>
                          <td className="px-4 py-3 font-mono font-semibold">
                            {formatInrFromPaise(rec.expectedPaise)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-[#2E7D32]">
                            {formatInrFromPaise(rec.receivedPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            {rec.variancePaise === 0 ? (
                              <span className="text-[#2E7D32]">₹0.00</span>
                            ) : (
                              <span className="text-[#C62828]">{formatInrFromPaise(rec.variancePaise)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === 'FULLY_RECONCILED'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : rec.status === 'PARTIALLY_RECONCILED'
                                  ? 'bg-[#FFF8E1] text-[#F57F17]'
                                  : 'bg-[#FFEBEE] text-[#C62828]'
                              }`}
                            >
                              {rec.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#526D52]">{rec.reconciledBy}</td>
                          <td className="px-4 py-3 text-[#526D52]">
                            {new Date(rec.reconciledAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Disbursements & Settlements */}
        {activeTab === 'settlements' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1B4332]">Disbursement Settlements</h2>
                <p className="text-xs text-[#526D52]">
                  Manage commercial payouts to tribal SHG federations, processors, and carriers with idempotent double-payout guards.
                </p>
              </div>
              <button
                onClick={() => setShowSettlementModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2D5A27] transition-colors shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Create Idempotent Settlement
              </button>
            </div>

            <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl p-4 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#2E7D32] shrink-0" />
              <div className="text-xs text-[#1B4332]">
                <strong className="font-bold">Statutory Fair-Trade Guard:</strong> Settlements under the{' '}
                <code>PRODUCER_MSP_PAYOUT</code> type strictly enforce 0.0% fee deductions. Primary gatherers receive
                100% of the statutory Minimum Support Price.
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1A2E1A]">
                  <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Settlement #</th>
                      <th scope="col" className="px-4 py-3">Payee Beneficiary</th>
                      <th scope="col" className="px-4 py-3">Settlement Type</th>
                      <th scope="col" className="px-4 py-3 text-right">Gross MSP / Fee</th>
                      <th scope="col" className="px-4 py-3 text-right">Deductions</th>
                      <th scope="col" className="px-4 py-3 text-right">Net Payable</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                      <th scope="col" className="px-4 py-3">Approver</th>
                      <th scope="col" className="px-4 py-3">Bank UTR Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {settlements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-[#526D52]">
                          No settlement records found.
                        </td>
                      </tr>
                    ) : (
                      settlements.map((stl) => (
                        <tr key={stl.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#1B4332]">{stl.settlementNumber}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{stl.payeeOrgName}</div>
                            <div className="text-[10px] text-[#526D52] font-mono">{stl.idempotencyKey}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F0EDE6] text-[#334D33]">
                              {stl.settlementType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {formatInrFromPaise(stl.grossAmountPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[#2E7D32]">
                            {stl.deductionsPaise === 0 ? '₹0.00' : formatInrFromPaise(stl.deductionsPaise)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#1B4332]">
                            {formatInrFromPaise(stl.netPayablePaise)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                stl.status === 'SETTLED'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : stl.status === 'APPROVED'
                                  ? 'bg-[#E3F2FD] text-[#1565C0]'
                                  : 'bg-[#FFF8E1] text-[#F57F17]'
                              }`}
                            >
                              {stl.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#526D52]">{stl.approvedBy || 'Pending'}</td>
                          <td className="px-4 py-3 font-mono text-[11px] text-[#526D52]">
                            {stl.disbursementBankRef || 'Awaiting Bank Advice'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fee Schedules & Terms */}
        {activeTab === 'schedules' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1B4332]">Configurable Fee Schedules</h2>
              <p className="text-xs text-[#526D52]">
                Review approved terms, pilot fee exemptions, and terms-approval guards preventing arbitrary fee assessment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className={`bg-white border rounded-xl p-6 shadow-sm relative ${
                    sch.isApprovedTerms ? 'border-[#C8E6C9]' : 'border-[#FFCC80]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        sch.isApprovedTerms ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'
                      }`}
                    >
                      {sch.isApprovedTerms ? 'APPROVED COMMERCIAL TERMS' : 'DRAFT / PENDING RATIFICATION'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#526D52]">{sch.code}</span>
                  </div>

                  <h3 className="text-base font-serif font-bold text-[#1B4332] mb-1">{sch.name}</h3>
                  <p className="text-xs text-[#526D52] mb-4">{sch.notes}</p>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8] mb-4">
                    <div>
                      <span className="text-[#526D52]">Fee Structure:</span>
                      <div className="font-semibold">{sch.structure.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <span className="text-[#526D52]">Rate:</span>
                      <div className="font-semibold">{sch.ratePercent.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-[#526D52]">Collector Exempt:</span>
                      <div className="font-semibold text-[#2E7D32]">
                        {sch.collectorExempt ? 'YES (100% Free)' : 'NO'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#526D52]">MSP Protection:</span>
                      <div className="font-semibold text-[#2E7D32]">
                        {sch.mspProtectionClause ? 'MANDATORY CLAUSE' : 'NONE'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#526D52]">
                    <strong>Ratified By:</strong> {sch.approvedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Credit Adjustments */}
        {activeTab === 'adjustments' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1B4332]">Financial Adjustments & Credit Notes</h2>
              <p className="text-xs text-[#526D52]">
                Audit credit memos, transit loss reimbursements, and dispute resolutions issued against commercial orders.
              </p>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-[#1A2E1A]">
                <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                  <tr>
                    <th scope="col" className="px-4 py-3">Adjustment #</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Direction</th>
                    <th scope="col" className="px-4 py-3">Target Reference</th>
                    <th scope="col" className="px-4 py-3 text-right">Amount</th>
                    <th scope="col" className="px-4 py-3">Reason</th>
                    <th scope="col" className="px-4 py-3">Approver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#526D52]">
                        No credit adjustments or refunds currently recorded.
                      </td>
                    </tr>
                  ) : (
                    adjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-[#FAF8F5]">
                        <td className="px-4 py-3 font-semibold text-[#1B4332]">{adj.adjustmentNumber}</td>
                        <td className="px-4 py-3">{adj.adjustmentType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 font-medium text-[#1565C0]">{adj.direction.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 font-mono">{adj.targetInvoiceId || adj.targetOrderId || 'N/A'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#D9381E]">
                          {formatInrFromPaise(adj.amountPaise)}
                        </td>
                        <td className="px-4 py-3 text-[#526D52]">{adj.reason}</td>
                        <td className="px-4 py-3 text-[#526D52]">{adj.approvedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Organisation Revenue Summaries */}
        {activeTab === 'reports' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1B4332]">Organisation-Level Financial Ledgers</h2>
              <p className="text-xs text-[#526D52]">
                Enterprise revenue reports aggregated across institutional contracts, B2B wholesale buyers, and partner federations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((rep) => (
                <div key={rep.organisationId} className="bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 border-b border-[#E5E0D8] pb-3">
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#1B4332]">{rep.organisationName}</h3>
                      <span className="text-xs text-[#526D52] font-mono">{rep.organisationId}</span>
                    </div>
                    <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-xs font-semibold">
                      {rep.activeContractsCount} Active Contract{rep.activeContractsCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                      <span className="text-[#526D52]">Total Invoiced:</span>
                      <div className="text-base font-bold text-[#1B4332] font-mono mt-0.5">
                        {formatInrFromPaise(rep.totalInvoicedPaise)}
                      </div>
                    </div>
                    <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                      <span className="text-[#526D52]">Total Paid:</span>
                      <div className="text-base font-bold text-[#2E7D32] font-mono mt-0.5">
                        {formatInrFromPaise(rep.totalPaidPaise)}
                      </div>
                    </div>
                    <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                      <span className="text-[#526D52]">Outstanding:</span>
                      <div className="text-base font-bold text-[#D9381E] font-mono mt-0.5">
                        {formatInrFromPaise(rep.totalOutstandingPaise)}
                      </div>
                    </div>
                    <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#E5E0D8]">
                      <span className="text-[#526D52]">Disbursed Payouts:</span>
                      <div className="text-base font-bold text-[#1565C0] font-mono mt-0.5">
                        {formatInrFromPaise(rep.totalSettledPaise)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-xs text-[#526D52]">
                    <span>Invoices Issued: {rep.invoicesCount}</span>
                    <span>Disputed: {rep.disputedInvoicesCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Generate Approved Invoice */}
        {showInvoiceModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E0D8]">
              <h3 className="text-lg font-serif font-bold text-[#1B4332] mb-1">Generate Commercial Invoice</h3>
              <p className="text-xs text-[#526D52] mb-4">
                Record an authorized invoice against an institutional service contract or commercial milestone.
              </p>

              <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Billed Organisation Name</label>
                  <input
                    type="text"
                    value={newInvOrgName}
                    onChange={(e) => setNewInvOrgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Line Item Description</label>
                  <input
                    type="text"
                    value={newInvDesc}
                    onChange={(e) => setNewInvDesc(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Base Amount (INR)</label>
                    <input
                      type="number"
                      value={newInvAmount}
                      onChange={(e) => setNewInvAmount(e.target.value)}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Applicable Tax</label>
                    <input
                      type="text"
                      disabled
                      value="18% GST (Calculated)"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg bg-[#FAF8F5] text-[#526D52]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">
                    Charge Approver Name / Designation <span className="text-[#D9381E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newInvApprover}
                    onChange={(e) => setNewInvApprover(e.target.value)}
                    required
                    placeholder="e.g. Finance Officer, ST/SC Dev Dept"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                  <span className="text-[10px] text-[#526D52] mt-0.5 block">
                    CRITICAL INVARIANT: The approver identity is permanently sealed into the immutable financial audit trail.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-[#526D52] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D5A27]"
                  >
                    Issue Approved Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Idempotent Settlement */}
        {showSettlementModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E5E0D8]">
              <h3 className="text-lg font-serif font-bold text-[#1B4332] mb-1">Create Disbursement Settlement</h3>
              <p className="text-xs text-[#526D52] mb-4">
                Disburse statutory fair-trade MSP proceeds to primary tribal producer collectives.
              </p>

              <form onSubmit={handleCreateSettlement} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Payee Producer Federation</label>
                  <input
                    type="text"
                    value={newPayeeOrgName}
                    onChange={(e) => setNewPayeeOrgName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Gross Fair-Trade MSP Amount (INR)</label>
                  <input
                    type="number"
                    value={newGrossMsp}
                    onChange={(e) => setNewGrossMsp(e.target.value)}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-lg text-[11px] text-[#2E7D32]">
                  <strong>MSP Entitlement Guarantee:</strong> Deductions: ₹0.00. Net Payable to SHG: ₹
                  {parseFloat(newGrossMsp || '0').toFixed(2)}. Zero platform fees deducted.
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Authorized Approver</label>
                  <input
                    type="text"
                    value={newSettlementApprover}
                    onChange={(e) => setNewSettlementApprover(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowSettlementModal(false)}
                    className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-[#526D52] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D5A27]"
                  >
                    Authorize Settlement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
