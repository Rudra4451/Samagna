'use client';

import React, { useState, useEffect } from 'react';
import {
  Organisation,
  InstitutionalServiceContract,
  InstitutionalInvoice,
  RevenueSummary,
} from '@/lib/institutional';
import {
  Building2,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Settings,
  Scale,
  DollarSign,
  UserCheck,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface InstitutionalAdminViewProps {
  currentUser: {
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
    isDemo?: boolean;
  };
}

export const InstitutionalAdminView: React.FC<InstitutionalAdminViewProps> = ({ currentUser }) => {
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [contract, setContract] = useState<InstitutionalServiceContract | null>(null);
  const [revenue, setRevenue] = useState<{ summary: RevenueSummary; invoices: InstitutionalInvoice[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'contract' | 'revenue' | 'config'>('profile');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [editShrinkage, setEditShrinkage] = useState(1.5);
  const [editRateAuthority, setEditRateAuthority] = useState('');
  const [editQuarantineDays, setEditQuarantineDays] = useState(3);
  const [configToast, setConfigToast] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [orgRes, ctrRes, revRes] = await Promise.all([
          fetch('/api/institutional/organisations'),
          fetch('/api/institutional/contracts'),
          fetch('/api/institutional/revenue'),
        ]);

        if (isMounted) {
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            setOrganisation(orgData.organisation);
            if (orgData.organisation?.operationalConfig) {
              setEditShrinkage(orgData.organisation.operationalConfig.allowableShrinkagePercent);
              setEditRateAuthority(orgData.organisation.operationalConfig.rateAuthorityReference);
              setEditQuarantineDays(orgData.organisation.operationalConfig.quarantineThresholdDays);
            }
          }
          if (ctrRes.ok) {
            const ctrData = await ctrRes.json();
            setContract(ctrData.contract);
          }
          if (revRes.ok) {
            const revData = await revRes.json();
            setRevenue({ summary: revData.revenueSummary, invoices: revData.invoices });
          }
        }
      } catch (err) {
        console.error('Failed to load institutional data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/institutional/organisations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationalConfig: {
            allowableShrinkagePercent: Number(editShrinkage),
            rateAuthorityReference: editRateAuthority,
            quarantineThresholdDays: Number(editQuarantineDays),
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrganisation(data.organisation);
        setIsEditingConfig(false);
        setConfigToast('Operational configuration updated successfully.');
      } else {
        setConfigToast(`Error: ${data.message || 'Update failed'}`);
      }
    } catch (e: any) {
      setConfigToast(`Error: ${e.message}`);
    }
    setTimeout(() => setConfigToast(null), 4000);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-mono text-ink-muted">
        Loading verified institutional organisation records...
      </div>
    );
  }

  if (!organisation) {
    return (
      <div className="p-8 text-center text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded">
        No institutional organisation records available for your jurisdictional scope.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {configToast && (
        <div
          role="status"
          className="p-3 bg-forest text-cream text-xs font-mono rounded flex items-center justify-between shadow"
        >
          <span>{configToast}</span>
          <button onClick={() => setConfigToast(null)} className="text-cream/70 hover:text-cream text-sm">
            ×
          </button>
        </div>
      )}

      {/* Top Banner: Verified Institutional Entity */}
      <div className="bg-cream border border-forest/20 rounded-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-forest text-cream">
                <ShieldCheck className="w-3.5 h-3.5 text-leaf" />
                {organisation.verificationStatus.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] font-mono text-ink-muted bg-paper px-2 py-0.5 border border-forest/15 rounded">
                Ref: {organisation.statutoryOrderRef}
              </span>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Pilot Deployment
              </span>
            </div>
            <h2 className="text-xl font-serif text-forest font-bold tracking-tight">
              {organisation.legalName}
            </h2>
            <p className="text-xs text-ink-muted">
              {organisation.displayName} · Code: <code className="font-mono text-forest">{organisation.code}</code> ·
              Reg No: <span className="font-mono">{organisation.registrationNumber}</span>
            </p>
          </div>

          <div className="text-right border-t md:border-t-0 pt-3 md:pt-0 border-forest/10 space-y-1">
            <div className="text-[11px] font-mono text-ink-muted">State Nodal Officer</div>
            <div className="text-xs font-semibold text-forest">{organisation.contact.nodalOfficer}</div>
            <div className="text-[11px] text-ink-muted">{organisation.contact.designation}</div>
          </div>
        </div>

        {/* Verification notes disclaimer */}
        <div className="mt-4 pt-3 border-t border-forest/10 text-[11px] font-sans text-forest/80 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
          <span>
            <strong>Statutory Provenance Notice:</strong> {organisation.verificationNotes} <em>Do not claim commercial partnership without documented executive authorization.</em>
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-forest/15 pb-2 text-xs font-mono overflow-x-auto scrollbar-none" role="tablist">
        <button
          role="tab"
          aria-selected={activeSubTab === 'profile'}
          onClick={() => setActiveSubTab('profile')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeSubTab === 'profile' ? 'bg-forest text-cream font-semibold' : 'text-ink-muted hover:text-forest'
          }`}
        >
          1. Organisation Profile & Jurisdiction
        </button>
        <button
          role="tab"
          aria-selected={activeSubTab === 'contract'}
          onClick={() => setActiveSubTab('contract')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeSubTab === 'contract' ? 'bg-forest text-cream font-semibold' : 'text-ink-muted hover:text-forest'
          }`}
        >
          2. Institutional Service Agreement (SLA)
        </button>
        <button
          role="tab"
          aria-selected={activeSubTab === 'revenue'}
          onClick={() => setActiveSubTab('revenue')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeSubTab === 'revenue' ? 'bg-forest text-cream font-semibold' : 'text-ink-muted hover:text-forest'
          }`}
        >
          3. Fixed-Fee Revenue & Reconciliation
        </button>
        <button
          role="tab"
          aria-selected={activeSubTab === 'config'}
          onClick={() => setActiveSubTab('config')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeSubTab === 'config' ? 'bg-forest text-cream font-semibold' : 'text-ink-muted hover:text-forest'
          }`}
        >
          4. Operational Configuration
        </button>
      </div>

      {/* SUB-TAB 1: Organisation Profile & Jurisdiction */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cream/60 border border-forest/15 rounded p-5 space-y-4">
            <h3 className="text-sm font-serif font-bold text-forest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-leaf" /> Service Area & Jurisdiction
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-forest/10">
                <span className="text-ink-muted">State:</span>
                <span className="font-semibold text-forest">{organisation.serviceArea.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-forest/10">
                <span className="text-ink-muted">Districts:</span>
                <span className="text-forest">{organisation.serviceArea.districts.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-forest/10">
                <span className="text-ink-muted">Covered Blocks:</span>
                <span className="text-forest">{organisation.serviceArea.blocks.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-forest/10">
                <span className="text-ink-muted">Aggregation Centers:</span>
                <span className="text-forest">{organisation.serviceArea.centerIds.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Central Depôts:</span>
                <span className="font-semibold text-forest">{organisation.serviceArea.depotIds.join(', ')}</span>
              </div>
            </div>
          </div>

          <div className="bg-cream/60 border border-forest/15 rounded p-5 space-y-4">
            <h3 className="text-sm font-serif font-bold text-forest flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-leaf" /> Administrative Governance
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-forest/10 font-mono">
                <span className="text-ink-muted">Primary Email:</span>
                <span className="text-forest">{organisation.contact.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-forest/10 font-mono">
                <span className="text-ink-muted">Official Phone:</span>
                <span className="text-forest">{organisation.contact.phone}</span>
              </div>
              <div className="py-1 border-b border-forest/10">
                <span className="text-ink-muted text-[11px] block">Administrative Office:</span>
                <span className="text-forest text-[11px]">{organisation.contact.officeAddress}</span>
              </div>
              <div className="pt-2">
                <span className="text-ink-muted text-[11px] block font-mono">Granted Permissions:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {organisation.permissions.map((p) => (
                    <span key={p} className="text-[10px] font-mono px-2 py-0.5 bg-forest/10 text-forest rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Institutional Service Agreement */}
      {activeSubTab === 'contract' && contract && (
        <div className="space-y-6">
          <div className="bg-cream/70 border border-forest/20 rounded p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-forest/70 font-semibold">
                  Engagement Reference
                </span>
                <h3 className="text-base font-serif font-bold text-forest">{contract.contractRef}</h3>
                <p className="text-xs text-ink-muted">Proposal Ref: {contract.proposalRef}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-ink-muted block text-[10px]">STATUS</span>
                  <span className="px-2 py-0.5 bg-leaf/20 text-forest font-semibold rounded">{contract.status}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[10px]">EXPIRY COUNTDOWN</span>
                  <span className="font-bold text-forest">{contract.renewalTracking.daysUntilExpiry} days</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-forest/80 pt-2 border-t border-forest/10">{contract.scopeOfWork}</p>

            {/* Fee summary banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-forest/10 text-center font-mono text-xs">
              <div className="bg-paper p-2.5 rounded border border-forest/10">
                <div className="text-[10px] text-ink-muted">ANNUAL LICENSE</div>
                <div className="text-sm font-bold text-forest">₹{contract.fixedAgreedFee.annualPlatformLicense.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-paper p-2.5 rounded border border-forest/10">
                <div className="text-[10px] text-ink-muted">SCALE ONBOARDING</div>
                <div className="text-sm font-bold text-forest">₹{contract.fixedAgreedFee.setupOnboardingFee.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-paper p-2.5 rounded border border-forest/10">
                <div className="text-[10px] text-ink-muted">SLA MAINTENANCE</div>
                <div className="text-sm font-bold text-forest">₹{contract.fixedAgreedFee.annualSlaMaintenanceFee.toLocaleString('en-IN')}</div>
              </div>
              <div className="bg-forest text-cream p-2.5 rounded">
                <div className="text-[10px] text-cream/70">TOTAL VALUE</div>
                <div className="text-sm font-bold text-cream">₹{contract.fixedAgreedFee.totalContractValue.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Deliverables Table */}
          <div className="border border-forest/15 rounded overflow-hidden">
            <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
                Contract Deliverables & Milestone Acceptance
              </h4>
              <span className="text-[11px] font-mono text-ink-muted">
                {contract.deliverables.filter((d) => d.status === 'COMPLETED').length} / {contract.deliverables.length} Completed
              </span>
            </div>
            <div className="divide-y divide-forest/10 text-xs">
              {contract.deliverables.map((deliv) => (
                <div key={deliv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-forest font-semibold">{deliv.code}</span>
                      <h5 className="font-semibold text-ink">{deliv.title}</h5>
                    </div>
                    <p className="text-ink-muted text-[11px]">{deliv.description}</p>
                    <div className="text-[10px] font-mono text-forest/70">
                      Criteria: {deliv.acceptanceCriteria}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1 font-mono text-[11px]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-semibold ${
                        deliv.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : deliv.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {deliv.status}
                    </span>
                    <div className="text-[10px] text-ink-muted">
                      Due: {new Date(deliv.milestoneDate).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-ink-muted italic border-l-2 border-forest/30 pl-3">
            <strong>Legal Notice:</strong> {contract.legalDisclaimer}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Fixed-Fee Revenue & Reconciliation */}
      {activeSubTab === 'revenue' && revenue && (
        <div className="space-y-6">
          {/* Revenue Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="bg-cream/60 border border-forest/20 p-4 rounded text-center">
              <span className="text-[10px] uppercase text-ink-muted block">Agreed Service Fee</span>
              <span className="text-lg font-bold text-forest">₹{revenue.summary.totalAgreedServiceAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-cream/60 border border-forest/20 p-4 rounded text-center">
              <span className="text-[10px] uppercase text-ink-muted block">Total Invoiced</span>
              <span className="text-lg font-bold text-forest">₹{revenue.summary.totalInvoiced.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded text-center">
              <span className="text-[10px] uppercase text-emerald-700 block">Reconciled Payments</span>
              <span className="text-lg font-bold text-emerald-900">₹{revenue.summary.totalReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-amber-50 border border-amber-300 p-4 rounded text-center">
              <span className="text-[10px] uppercase text-amber-700 block">Outstanding Balance</span>
              <span className="text-lg font-bold text-amber-900">₹{revenue.summary.totalOutstandingBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Invoices List */}
          <div className="border border-forest/15 rounded overflow-hidden">
            <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
              <h4 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
                Government Invoices & Treasury Reconciliations
              </h4>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                {revenue.summary.reconciliationStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="divide-y divide-forest/10 text-xs">
              {revenue.invoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-forest">{inv.invoiceNumber}</span>
                        <span className="text-ink font-semibold">{inv.billingPeriod}</span>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')} · Amount: ₹{inv.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                      <span className="text-[11px] text-forest font-bold">
                        Paid: ₹{inv.paidAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Payment References Details */}
                  {inv.payments && inv.payments.length > 0 ? (
                    <div className="bg-paper p-3 rounded border border-forest/10 space-y-1 text-[11px] font-mono">
                      <div className="text-[10px] text-ink-muted uppercase">Verified Treasury / Bank UTR References:</div>
                      {inv.payments.map((p) => (
                        <div key={p.id} className="flex justify-between items-center text-forest">
                          <span>
                            {p.paymentMethod}: {p.treasuryChallanNo || p.bankUtr || p.pfmsRef}
                          </span>
                          <span>₹{p.paidAmount.toLocaleString('en-IN')} (Reconciled by {p.verifiedByAdmin})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-ink-muted italic">
                      No payment references submitted. Awaiting administrative disbursement.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Operational Configuration */}
      {activeSubTab === 'config' && (
        <div className="bg-cream/60 border border-forest/20 rounded p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-bold text-forest">Operational Tolerances & State Rules</h3>
              <p className="text-xs text-ink-muted">District-level parameters governed by State Procurement Guidelines.</p>
            </div>
            {!isEditingConfig && currentUser.role === 'SUPERVISOR_ADMIN' && (
              <Button size="sm" variant="secondary" onClick={() => setIsEditingConfig(true)}>
                Edit Calibration
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            <div className="space-y-1">
              <label className="text-ink-muted block text-[10px] uppercase">Allowable Transit Shrinkage</label>
              {isEditingConfig ? (
                <input
                  type="number"
                  step="0.1"
                  value={editShrinkage}
                  onChange={(e) => setEditShrinkage(Number(e.target.value))}
                  className="w-full p-2 border border-forest/30 rounded font-mono text-forest bg-paper"
                />
              ) : (
                <div className="text-base font-bold text-forest">
                  {organisation.operationalConfig.allowableShrinkagePercent}%
                </div>
              )}
              <span className="text-[10px] text-ink-muted block">Enforced gate-arrival variance limit</span>
            </div>

            <div className="space-y-1">
              <label className="text-ink-muted block text-[10px] uppercase">Quarantine Threshold</label>
              {isEditingConfig ? (
                <input
                  type="number"
                  value={editQuarantineDays}
                  onChange={(e) => setEditQuarantineDays(Number(e.target.value))}
                  className="w-full p-2 border border-forest/30 rounded font-mono text-forest bg-paper"
                />
              ) : (
                <div className="text-base font-bold text-forest">
                  {organisation.operationalConfig.quarantineThresholdDays} Days
                </div>
              )}
              <span className="text-[10px] text-ink-muted block">Maximum days before mandatory supervisor review</span>
            </div>

            <div className="space-y-1">
              <label className="text-ink-muted block text-[10px] uppercase">Rate Authority Baseline</label>
              {isEditingConfig ? (
                <input
                  type="text"
                  value={editRateAuthority}
                  onChange={(e) => setEditRateAuthority(e.target.value)}
                  className="w-full p-2 border border-forest/30 rounded font-mono text-forest bg-paper"
                />
              ) : (
                <div className="text-xs font-bold text-forest">
                  {organisation.operationalConfig.rateAuthorityReference}
                </div>
              )}
              <span className="text-[10px] text-ink-muted block">Statutory rate schedule reference</span>
            </div>
          </div>

          {isEditingConfig && (
            <div className="flex gap-2 pt-4 border-t border-forest/10 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsEditingConfig(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveConfig}>
                Save Operational Changes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

