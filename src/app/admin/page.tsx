'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/shell/AppShell';
import { ODISHA_MFP_CATALOGUE, MfpProduct } from '@/lib/products';
import { TransitRouteMap } from '@/components/map/TransitRouteMap';
import { ProductIcon } from '@/components/ui/ProductIcons';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  Users,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Download,
  Plus,
  Check,
  AlertTriangle,
  Activity,
  History,
  Lock,
  LogIn,
  ArrowLeft,
  RefreshCw,
  FileText,
  Share2,
} from 'lucide-react';
import { downloadPdfBlob, sharePdf } from '@/lib/pdfClient';

type AdminTab = 'rates' | 'users' | 'conflicts' | 'audit' | 'exports' | 'health';

interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  district: string;
  jurisdiction: string;
  status: 'ACTIVE' | 'INVITED';
}

const DEFAULT_USERS: AdminUser[] = [
  {
    id: 'USR-01',
    username: 'patnaik.dpo',
    fullName: 'R. K. Patnaik',
    role: 'SUPERVISOR_ADMIN',
    district: 'Mayurbhanj',
    jurisdiction: 'District Procurement Office, Baripada',
    status: 'ACTIVE',
  },
  {
    id: 'USR-02',
    username: 'sdas.baripada',
    fullName: 'Siba Prasad Das',
    role: 'WAREHOUSE_MANAGER',
    district: 'Mayurbhanj',
    jurisdiction: 'Baripada Central Depôt (Bay 1-4)',
    status: 'ACTIVE',
  },
  {
    id: 'USR-03',
    username: 'manager.mohanty',
    fullName: 'Alok Mohanty',
    role: 'COLLECTION_MANAGER',
    district: 'Mayurbhanj',
    jurisdiction: 'Karanjia Block Aggregation Center (KRN-01)',
    status: 'ACTIVE',
  },
  {
    id: 'USR-04',
    username: 'sumitra.marndi',
    fullName: 'Sumitra Marndi',
    role: 'SHG_FACILITATOR',
    district: 'Mayurbhanj',
    jurisdiction: 'Badagaon Village Mahila Mandal',
    status: 'ACTIVE',
  },
  {
    id: 'USR-05',
    username: 'sunita.soren',
    fullName: 'Sunita Soren',
    role: 'COLLECTOR',
    district: 'Mayurbhanj',
    jurisdiction: 'Badagaon Tribal Gathering Track',
    status: 'ACTIVE',
  },
];

export default function AdminConsolePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<
    'LOADING' | 'AUTHORIZED' | 'UNAUTHENTICATED' | 'UNAUTHORIZED'
  >('LOADING');
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
    isDemo?: boolean;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('rates');
  const [products, setProducts] = useState<MfpProduct[]>(ODISHA_MFP_CATALOGUE);
  const [users, setUsers] = useState<AdminUser[]>(DEFAULT_USERS);
  const [editingProduct, setEditingProduct] = useState<MfpProduct | null>(null);
  const [editRate, setEditRate] = useState<number>(0);
  const [editShrinkage, setEditShrinkage] = useState<number>(1.5);
  const [editNotes, setEditNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [adminPdfToast, setAdminPdfToast] = useState<string | null>(null);

  // Central Sync Conflicts State (Phase D / F7)
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<any | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Client-Side Session Verification & Multi-Tier RBAC Guard
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (res.status === 401) {
          if (isMounted) {
            setAuthStatus('UNAUTHENTICATED');
            router.replace('/login?redirect=/admin');
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data) return;
        if (!data.authenticated || !data.user) {
          setAuthStatus('UNAUTHENTICATED');
          router.replace('/login?redirect=/admin');
          return;
        }
        if (data.user.role !== 'SUPERVISOR_ADMIN') {
          setAuthStatus('UNAUTHORIZED');
          router.replace('/unauthorized');
          return;
        }
        setCurrentUser(data.user);
        setAuthStatus('AUTHORIZED');
      })
      .catch(() => {
        if (isMounted) {
          setAuthStatus('UNAUTHENTICATED');
          router.replace('/login?redirect=/admin');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (authStatus !== 'AUTHORIZED') return;
    fetch('/api/admin/conflicts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.conflicts)) {
          setConflicts(data.conflicts);
        }
      })
      .catch(() => {});
  }, [activeTab, authStatus]);

  const handleResolveConflict = async (resolution: 'KEEP_LOCAL' | 'KEEP_SERVER' | 'MERGE') => {
    if (!selectedConflict) return;
    if (currentUser?.isDemo) {
      setToastMessage('Simulation Mode: Dual-write conflict arbitration cannot commit server updates in demo preview.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (resolution === 'MERGE' && (!resolutionNote || resolutionNote.trim().length < 5)) {
      setToastMessage('A supervisor note (min 5 chars) is mandatory when merging records.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setIsResolving(true);
    try {
      const res = await fetch('/api/admin/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId: selectedConflict.id,
          resolution,
          resolutionNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Conflict ${selectedConflict.batchCode} arbitrated via ${resolution}.`);
        setConflicts((prev) => prev.filter((c) => c.id !== selectedConflict.id));
        setSelectedConflict(null);
        setResolutionNote('');
      } else {
        setToastMessage(data.message || 'Conflict resolution failed.');
      }
    } catch {
      setToastMessage('Network error communicating with central conflict service.');
    } finally {
      setIsResolving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Safe file export handler with fail-closed 503 feedback
  const handleExport = async (entity: 'rates' | 'batches' | 'audit', format: 'csv' | 'json') => {
    const key = `${entity}-${format}`;
    setIsExporting(key);
    try {
      const res = await fetch(`/api/admin/export?entity=${entity}&format=${format}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        if (res.status === 503) {
          setToastMessage(
            errorJson?.message ||
              'Server PostgreSQL database is unconfigured. Real batch records require an active database connection.'
          );
        } else if (res.status === 403) {
          setToastMessage(
            errorJson?.message ||
              'Administrative export blocked: Insufficient permissions or simulated demo account.'
          );
        } else if (res.status === 401) {
          setToastMessage('Authentication required. Please sign in to export records.');
        } else {
          setToastMessage(errorJson?.message || `Export failed with HTTP status ${res.status}`);
        }
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'csv' ? 'csv' : 'json';
      a.download = `banasetu_${entity}_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToastMessage(`Export downloaded successfully (${entity.toUpperCase()} · ${format.toUpperCase()}).`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(`Export failed: ${err?.message || 'Network error'}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsExporting(null);
    }
  };

  // Dedicated Download Audit PDF Handler
  const handleDownloadAuditPdf = async (batchId: string = 'BS-402') => {
    const cleanId = batchId.replace(/^#/, '');
    try {
      await downloadPdfBlob({
        url: `/api/audit/${cleanId}/pdf`,
        filename: `BanaSetu-AuditDossier-${cleanId}.pdf`,
        onLoadingChange: setIsDownloadingPdf,
        onSuccess: (fn) => setAdminPdfToast(`Audit dossier downloaded: ${fn}`),
        onError: (err) => setAdminPdfToast(err),
      });
    } catch {
      // Handled in onError
    }
  };

  // Dedicated Share Audit PDF Handler
  const handleShareAuditPdf = async (batchId: string = 'BS-402') => {
    const cleanId = batchId.replace(/^#/, '');
    try {
      await sharePdf({
        url: `/api/audit/${cleanId}/pdf`,
        filename: `BanaSetu-AuditDossier-${cleanId}.pdf`,
        title: `BanaSetu Audit Dossier ${batchId}`,
        text: `Official Chain-of-Custody Audit Dossier for Batch ${batchId}`,
        onLoadingChange: setIsSharingPdf,
        onSuccess: () => setAdminPdfToast('Audit dossier shared successfully'),
        onError: (err) => setAdminPdfToast(err),
      });
    } catch {
      // Handled in onError
    }
  };

  // New user invitation form state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('COLLECTION_MANAGER');
  const [newJurisdiction, setNewJurisdiction] = useState('');

  const handleSaveRate = () => {
    if (!editingProduct) return;
    if (currentUser?.isDemo) {
      setToastMessage('Simulation Mode: Benchmark rate calibrations are local simulation only.');
      setTimeout(() => setToastMessage(null), 4000);
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              currentBenchmarkRatePerKg: editRate,
              allowableShrinkagePercent: editShrinkage,
              rateSource: `TDCCOL Admin Adjustment (${new Date().toLocaleDateString('en-GB')}) · Provenance: ${editNotes || 'Regular Review'}`,
            }
          : p
      )
    );
    setToastMessage(`Rate for ${editingProduct.nameEnglish} updated to ₹${editRate}/kg`);
    setEditingProduct(null);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newName) return;
    if (currentUser?.isDemo) {
      setToastMessage('Simulation Mode: Staff invitation is local simulation in demo mode.');
      setTimeout(() => setToastMessage(null), 4000);
    }
    const created: AdminUser = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: newUsername.toLowerCase().trim(),
      fullName: newName.trim(),
      role: newRole,
      district: currentUser?.district || 'Mayurbhanj',
      jurisdiction: newJurisdiction.trim() || `${currentUser?.district || 'Mayurbhanj'} District Jurisdiction`,
      status: 'INVITED',
    };
    setUsers((prev) => [...prev, created]);
    setIsInviteOpen(false);
    setNewUsername('');
    setNewName('');
    setNewJurisdiction('');
    setToastMessage(`Invitation generated for ${created.fullName} (${created.role})`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (authStatus === 'LOADING') {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-6 text-ink">
        <div className="max-w-[420px] w-full border border-rule rounded-[4px] bg-surface p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center mx-auto animate-pulse">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
              Security Verification
            </span>
            <h2 className="text-[20px] font-heading font-bold text-ink">
              Verifying Supervisor Clearance
            </h2>
            <p className="text-[12px] text-ink-muted font-mono">
              TDCCOL Administrative Governance Portal · Mayurbhanj District
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authStatus === 'UNAUTHORIZED') {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-6 text-ink">
        <div className="max-w-[440px] w-full border border-rule rounded-[4px] bg-surface p-8 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-danger font-semibold">
              HTTP 403 · Access Denied
            </span>
            <h2 className="text-[20px] font-heading font-bold text-ink">
              Restricted Clearance Level
            </h2>
            <p className="text-[13px] text-ink-muted">
              Your current session role lacks the administrative authority required to access this supervisor portal.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/login" className="w-full">
              <Button variant="primary" className="w-full h-[40px] flex items-center justify-center gap-2 text-[13px]">
                <LogIn size={15} />
                <span>Sign In with Supervisor Account</span>
              </Button>
            </Link>
            <Link href="/collector" className="w-full">
              <Button variant="secondary" className="w-full h-[40px] flex items-center justify-center gap-2 text-[13px]">
                <ArrowLeft size={15} />
                <span>Return to Collector Workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-ledger mx-auto pb-12 pt-4">
        {/* Evaluator Demo Session Banner */}
        {currentUser?.isDemo && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-[3px] text-warning text-[12px] font-mono flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">EVALUATOR DEMO SESSION ACTIVE:</span>
              <span>
                {' '}Logged in with simulated demo credentials ({currentUser.username} · {currentUser.fullName}). Server database mutations, rate adjustments, and real database exports are blocked for demonstration sessions in compliance with security policy.
              </span>
            </div>
          </div>
        )}

        {/* Header Title */}
        <div className="border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
              TDCCOL Administrative Governance Portal
            </span>
            {currentUser && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
                {currentUser.fullName} ({currentUser.role})
              </span>
            )}
          </div>
          <h1 className="font-heading font-bold text-[24px] text-ink mt-0.5">
            Administration & Governance
          </h1>
          <p className="text-[12px] text-ink-muted font-mono">
            {currentUser?.district || 'Mayurbhanj'} District Procurement Desk · 17 MFP Species Standards & Multi-Tenant Access
          </p>
        </div>

        {/* Navigation Tab Bar */}
        <div className="flex items-center gap-1 border-b border-rule overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('rates')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rates'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Settings size={15} />
            <span>17 MFP Rates Registry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Users size={15} />
            <span>Staff Roster & Roles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conflicts')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'conflicts'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Layers size={15} />
            <span>Sync Conflicts ({conflicts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <History size={15} />
            <span>Cryptographic Audit Trail</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exports')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'exports'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>CSV / JSON Data Exports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 text-[13px] font-medium border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'health'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Activity size={15} />
            <span>Topology & Telemetry</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {toastMessage && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-[3px] text-success text-[13px] font-mono flex items-center gap-2">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TAB 1: RATES REGISTRY */}
        {activeTab === 'rates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Minor Forest Produce Procurement Rate Card
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  All 17 Odisha Gazette Schedule MFP species · Provenance-backed pricing
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted bg-bg-sunken px-2.5 py-1 rounded-[2px] border border-rule">
                <span>Total Items: 17</span>
                <span>·</span>
                <span>Jurisdiction: Mayurbhanj TDCCOL</span>
              </div>
            </div>

            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-rule bg-bg-sunken text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    <th scope="col" className="p-3 w-10">Icon</th>
                    <th scope="col" className="p-3">Product Name / Odia</th>
                    <th scope="col" className="p-3">Scientific Species</th>
                    <th scope="col" className="p-3">Harvest Season</th>
                    <th scope="col" className="p-3 text-right">Rate (₹/kg)</th>
                    <th scope="col" className="p-3 text-right">Shrinkage %</th>
                    <th scope="col" className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-bg-sunken/40">
                      <td className="p-3 text-ink">
                        <div className="w-8 h-8 rounded-[3px] border border-rule/80 overflow-hidden bg-bg-sunken flex items-center justify-center shadow-sm">
                          <ProductIcon product={p.slug} size={32} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-ink font-sans">{p.nameEnglish}</div>
                        <div className="text-[11px] text-ink-muted font-odia">{p.nameOdia}</div>
                      </td>
                      <td className="p-3 italic text-ink-subtle">{p.scientificName}</td>
                      <td className="p-3 text-ink-muted">{p.primaryHarvestSeason}</td>
                      <td className="p-3 text-right font-bold text-success tabular-nums font-heading text-[15px]">
                        ₹{p.currentBenchmarkRatePerKg.toFixed(2)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-ink-muted">
                        {p.allowableShrinkagePercent}%
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setEditRate(p.currentBenchmarkRatePerKg);
                            setEditShrinkage(p.allowableShrinkagePercent);
                            setEditNotes('');
                          }}
                          className="px-2.5 py-1 text-[11px] font-mono border border-rule rounded-[2px] bg-surface hover:bg-bg-sunken text-ink"
                        >
                          Calibrate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF ROSTER & ROLES */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rule pb-3">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Staff Access Directory & Multi-Tenant Binding
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  Invitation-only provisioning with center/village boundary isolation
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setIsInviteOpen(true)}
                className="h-[36px] text-[12px] flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Invite Staff Member</span>
              </Button>
            </div>

            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-rule bg-bg-sunken text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                    <th scope="col" className="p-3">Username</th>
                    <th scope="col" className="p-3">Full Legal Name</th>
                    <th scope="col" className="p-3">Assigned Role</th>
                    <th scope="col" className="p-3">Jurisdiction Desk / Center</th>
                    <th scope="col" className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule font-mono">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-bg-sunken/40">
                      <td className="p-3 font-semibold text-ink">{u.username}</td>
                      <td className="p-3 font-sans text-ink">{u.fullName}</td>
                      <td className="p-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-ink-muted text-[12px]">{u.jurisdiction}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-[2px] font-mono ${
                            u.status === 'ACTIVE'
                              ? 'bg-success/10 text-success border border-success/30'
                              : 'bg-warning/10 text-warning border border-warning/30'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONFLICTS */}
        {activeTab === 'conflicts' && (
          <div className="space-y-6">
            <div className="border-b border-rule pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Central Dual-Write Sync Conflict Review
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  PostgreSQL persistent outbox arbitration queue · Verified 3-way resolution ledger
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded border border-rule bg-bg-sunken text-ink-muted">
                {conflicts.filter((c: any) => c.status === 'OPEN').length} Open Conflicts
              </span>
            </div>

            {selectedConflict ? (
              <div className="border-2 border-accent/40 rounded-[4px] bg-surface p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
                      Arbitration Case #{selectedConflict.id.slice(-6)}
                    </span>
                    <h4 className="font-heading font-bold text-[16px] text-ink">
                      Batch {selectedConflict.batchCode} ({selectedConflict.entityType})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedConflict(null)}
                    className="text-[12px] font-mono text-ink-muted hover:text-ink px-2 py-1 border border-rule rounded"
                  >
                    Cancel
                  </button>
                </div>

                <div className="p-3 rounded bg-warning/10 border-l-2 border-warning text-[12px] text-ink">
                  <span className="font-semibold">Conflict Reason:</span> {selectedConflict.conflictReason}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-rule rounded bg-bg-sunken space-y-2">
                    <span className="text-[11px] font-mono text-ink-muted uppercase font-semibold">Field Client Record (Local)</span>
                    <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-ink">
                      {typeof selectedConflict.clientPayload === 'string'
                        ? selectedConflict.clientPayload
                        : JSON.stringify(selectedConflict.clientPayload, null, 2)}
                    </pre>
                  </div>

                  <div className="p-4 border border-rule rounded bg-bg-sunken space-y-2">
                    <span className="text-[11px] font-mono text-ink-muted uppercase font-semibold">Central Authority Record (Server)</span>
                    <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-ink">
                      {typeof selectedConflict.serverPayload === 'string'
                        ? selectedConflict.serverPayload
                        : JSON.stringify(selectedConflict.serverPayload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label htmlFor="conflict-supervisor-note" className="text-[12px] font-medium text-ink">
                    Supervisor Arbitration Rationale / Note (Required for Merge):
                  </label>
                  <textarea
                    id="conflict-supervisor-note"
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Document joint inspection reason, scale serial number, or supervisor verification..."
                    className="w-full text-[13px] border border-rule rounded p-2 bg-surface text-ink focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleResolveConflict('KEEP_LOCAL')}
                    disabled={isResolving}
                    className="text-[12px]"
                  >
                    Keep Field Local
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleResolveConflict('KEEP_SERVER')}
                    disabled={isResolving}
                    className="text-[12px]"
                  >
                    Accept Central Server
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleResolveConflict('MERGE')}
                    disabled={isResolving}
                    className="text-[12px]"
                  >
                    Merge with Supervisor Note
                  </Button>
                </div>
              </div>
            ) : conflicts.length === 0 ? (
              <div className="border border-rule rounded-[4px] bg-surface p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                  <Check size={20} />
                </div>
                <h4 className="font-heading font-bold text-[18px] text-ink">
                  All Outbox Queues Fully Synchronized
                </h4>
                <p className="text-[13px] text-ink-muted max-w-md mx-auto">
                  Zero active dual-write conflicts awaiting administrative arbitration. When offline divergence occurs between field aggregation and depot arrival, records appear here with side-by-side payload inspection.
                </p>
              </div>
            ) : (
              <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-bg-sunken border-b border-rule font-mono text-[11px] text-ink-muted uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Batch Code</th>
                      <th scope="col" className="px-4 py-2.5">Entity</th>
                      <th scope="col" className="px-4 py-2.5">Conflict Reason</th>
                      <th scope="col" className="px-4 py-2.5">Submitted By</th>
                      <th scope="col" className="px-4 py-2.5">Status</th>
                      <th scope="col" className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule font-mono">
                    {conflicts.map((c: any) => (
                      <tr key={c.id} className="hover:bg-bg-sunken/40">
                        <td className="px-4 py-3 font-semibold text-ink">{c.batchCode}</td>
                        <td className="px-4 py-3 text-ink-muted">{c.entityType}</td>
                        <td className="px-4 py-3 text-ink max-w-xs truncate">{c.conflictReason}</td>
                        <td className="px-4 py-3 text-ink-muted">{c.actorName || c.actorId}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] border border-warning/30 bg-warning/10 text-warning font-semibold">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedConflict(c)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            Review & Arbitrate
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CRYPTOGRAPHIC AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="border-b border-rule pb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Tamper-Evident Chronological Ledger Explorer
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  SHA-256 chained transaction blocks · Non-repudiation audit trail
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  id="btn-admin-download-audit-pdf"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownloadAuditPdf('BS-402')}
                  disabled={isDownloadingPdf}
                  title="Download official A4 Chain-of-Custody Audit Dossier PDF directly"
                >
                  <Download size={14} strokeWidth={1.5} />
                  <span>{isDownloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
                </Button>
                <Button
                  id="btn-admin-share-audit-pdf"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleShareAuditPdf('BS-402')}
                  disabled={isSharingPdf}
                  title="Share official A4 Audit Dossier PDF via system share sheet"
                >
                  <Share2 size={14} strokeWidth={1.5} />
                  <span>Share</span>
                </Button>
                <a
                  href="/api/audit/BS-402/pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-rule bg-surface text-[12px] font-medium text-ink hover:bg-bg-sunken hover:border-ink-subtle select-none"
                  title="Open official A4 Chain-of-Custody Audit Dossier PDF in browser"
                >
                  <FileText size={14} strokeWidth={1.5} />
                  <span>Audit Dossier PDF</span>
                </a>
              </div>
            </div>

            {adminPdfToast && (
              <div className="p-2.5 rounded-[4px] border border-rule bg-surface text-[13px] text-ink flex items-center justify-between">
                <span>{adminPdfToast}</span>
                <button
                  onClick={() => setAdminPdfToast(null)}
                  className="text-[11px] font-mono text-ink-muted hover:text-ink underline ml-3"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="border border-rule rounded-[4px] bg-surface p-4">
              <div className="font-mono text-[12px] text-ink-subtle space-y-2">
                <div className="p-2 border border-rule rounded bg-bg-sunken">
                  <span className="text-accent font-semibold">BLOCK #OD-MAY-8841:</span> Verified Field Weighment #BS-402 · 100.0 kg gross / 100.0 kg net · Checksum: <code className="text-ink">7a9f4c01de2b8841</code>
                </div>
                <div className="p-2 border border-rule rounded bg-bg-sunken">
                  <span className="text-accent font-semibold">BLOCK #OD-MAY-8842:</span> Vehicle Dispatch #WB-OD-24-099 · Seal #OD-ST-8840 · Tarpaulin Verified · Checksum: <code className="text-ink">e14c77ba91848842</code>
                </div>
                <div className="p-2 border border-rule rounded bg-bg-sunken">
                  <span className="text-accent font-semibold">BLOCK #OD-MAY-8843:</span> Warehouse Arrival Weighment · 95.0 kg arrival · Shrinkage Quarantine #DISC-402 · Checksum: <code className="text-ink">2b99a811cf098843</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CSV & JSON DATA EXPORTS */}
        {activeTab === 'exports' && (
          <div className="space-y-4">
            <div className="border-b border-rule pb-3">
              <h3 className="font-heading font-bold text-[18px] text-ink">
                Administrative Compliance Exports
              </h3>
              <p className="text-[12px] text-ink-muted font-mono">
                Download structured records for TDCCOL, Ministry of Tribal Affairs & LABHA Scheme Audits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: 17 MFP Rates Registry */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[15px] text-ink font-heading">
                      17 MFP Rates Registry
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-sunken border border-rule text-ink-muted">
                      Official Gazette
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-muted leading-relaxed">
                    Official catalogue of all 17 Odisha forest produce species with scientific taxonomy, packaging standards, and allowable shrinkage thresholds.
                  </p>
                </div>
                <div className="flex gap-2 pt-2 border-t border-rule">
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('rates', 'csv')}
                    disabled={isExporting === 'rates-csv'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'rates-csv' ? 'Exporting...' : 'CSV'}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('rates', 'json')}
                    disabled={isExporting === 'rates-json'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'rates-json' ? 'Exporting...' : 'JSON'}</span>
                  </Button>
                </div>
              </div>

              {/* Card 2: Master Batch Custody Ledger */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[15px] text-ink font-heading">
                      Master Batch Custody
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-sunken border border-rule text-ink-muted">
                      {currentUser?.district || 'Mayurbhanj'} Desk
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-muted leading-relaxed">
                    Authoritative procurement records with field intake weights, transit waybills, arrival weighments, and discrepancy classifications.
                  </p>
                  <div className="p-2 bg-bg-sunken border border-rule rounded text-[11px] font-mono text-ink-subtle">
                    Real PostgreSQL batches only (fails closed with 503 when unconfigured).
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-rule">
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('batches', 'csv')}
                    disabled={isExporting === 'batches-csv'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'batches-csv' ? 'Exporting...' : 'CSV'}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('batches', 'json')}
                    disabled={isExporting === 'batches-json'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'batches-json' ? 'Exporting...' : 'JSON'}</span>
                  </Button>
                </div>
              </div>

              {/* Card 3: Cryptographic Audit Trail */}
              <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[15px] text-ink font-heading">
                      Cryptographic Audit Trail
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-sunken border border-rule text-ink-muted">
                      SHA-256 Chain
                    </span>
                  </div>
                  <p className="text-[12px] text-ink-muted leading-relaxed">
                    Immutable chronological audit log capturing weighments, vehicle seals, custodian handoffs, and transit reroutes for government oversight.
                  </p>
                  <div className="p-2 bg-bg-sunken border border-rule rounded text-[11px] font-mono text-ink-subtle">
                    Append-only non-repudiation log for administrative compliance.
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-rule">
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('audit', 'csv')}
                    disabled={isExporting === 'audit-csv'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'audit-csv' ? 'Exporting...' : 'CSV'}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport('audit', 'json')}
                    disabled={isExporting === 'audit-json'}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} />
                    <span>{isExporting === 'audit-json' ? 'Exporting...' : 'JSON'}</span>
                  </Button>
                  <Button
                    id="btn-export-download-audit-pdf"
                    variant="secondary"
                    onClick={() => handleDownloadAuditPdf('BS-402')}
                    disabled={isDownloadingPdf}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                    title="Download official A4 Audit Dossier PDF directly"
                  >
                    <Download size={14} />
                    <span>{isDownloadingPdf ? 'Downloading...' : 'PDF'}</span>
                  </Button>
                  <Button
                    id="btn-export-share-audit-pdf"
                    variant="secondary"
                    onClick={() => handleShareAuditPdf('BS-402')}
                    disabled={isSharingPdf}
                    className="flex-1 text-[12px] flex items-center justify-center gap-1.5"
                    title="Share official A4 Audit Dossier PDF"
                  >
                    <Share2 size={14} />
                    <span>Share</span>
                  </Button>
                  <a
                    href="/api/audit/BS-402/pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sr-only"
                  >
                    PDF Link
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: TOPOLOGY & TELEMETRY */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="border-b border-rule pb-3">
              <h3 className="font-heading font-bold text-[18px] text-ink">
                Geographical Transit Topology & System Monitoring
              </h3>
              <p className="text-[12px] text-ink-muted font-mono">
                Mayurbhanj district transit routes & central server synchronization telemetry
              </p>
            </div>
            <TransitRouteMap />
          </div>
        )}

        {/* Rate Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-rule rounded-[4px] max-w-[460px] w-full p-6 space-y-4 shadow-none">
              <div className="border-b border-rule pb-3">
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Calibrate Benchmark Rate
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  {editingProduct.nameEnglish} ({editingProduct.scientificName})
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="edit-benchmark-rate" className="text-[12px] font-semibold text-ink block mb-1">
                    Benchmark Procurement Rate (₹/kg)
                  </label>
                  <input
                    id="edit-benchmark-rate"
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(parseFloat(e.target.value) || 0)}
                    step={0.5}
                    min={1}
                    className="w-full h-9 px-3 text-[14px] font-mono border border-rule rounded-[3px] bg-surface"
                  />
                </div>

                <div>
                  <label htmlFor="edit-shrinkage-tolerance" className="text-[12px] font-semibold text-ink block mb-1">
                    Natural Transit Shrinkage Tolerance (%)
                  </label>
                  <input
                    id="edit-shrinkage-tolerance"
                    type="number"
                    value={editShrinkage}
                    onChange={(e) => setEditShrinkage(parseFloat(e.target.value) || 0)}
                    step={0.1}
                    min={0}
                    max={10}
                    className="w-full h-9 px-3 text-[14px] font-mono border border-rule rounded-[3px] bg-surface"
                  />
                </div>

                <div>
                  <label htmlFor="edit-provenance-note" className="text-[12px] font-semibold text-ink block mb-1">
                    Administrative Provenance Note
                  </label>
                  <input
                    id="edit-provenance-note"
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. TDCCOL District Procurement Committee Resolution #402"
                    className="w-full h-9 px-3 text-[13px] border border-rule rounded-[3px] bg-surface"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-rule">
                <Button variant="secondary" onClick={() => setEditingProduct(null)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveRate} className="flex-1">
                  Save Calibration
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* User Invite Modal */}
        {isInviteOpen && (
          <div className="fixed inset-0 bg-ink/40 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleInviteUser} className="bg-surface border border-rule rounded-[4px] max-w-[460px] w-full p-6 space-y-4 shadow-none">
              <div className="border-b border-rule pb-3">
                <h3 className="font-heading font-bold text-[18px] text-ink">
                  Invite New Staff Personnel
                </h3>
                <p className="text-[12px] text-ink-muted font-mono">
                  Authorized TDCCOL Procurement Staff
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="invite-username" className="text-[12px] font-semibold text-ink block mb-1">
                    System Username
                  </label>
                  <input
                    id="invite-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    placeholder="e.g. jashipur.lead"
                    className="w-full h-9 px-3 text-[14px] font-mono border border-rule rounded-[3px] bg-surface"
                  />
                </div>

                <div>
                  <label htmlFor="invite-fullname" className="text-[12px] font-semibold text-ink block mb-1">
                    Full Legal Name
                  </label>
                  <input
                    id="invite-fullname"
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Chandra Majhi"
                    className="w-full h-9 px-3 text-[13px] border border-rule rounded-[3px] bg-surface"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="text-[12px] font-semibold text-ink block mb-1">
                    Operational Role
                  </label>
                  <select
                    id="invite-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-9 px-3 text-[13px] border border-rule rounded-[3px] bg-surface font-mono"
                  >
                    <option value="COLLECTION_MANAGER">COLLECTION_MANAGER (Aggregation Center)</option>
                    <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER (Depôt Reweighment)</option>
                    <option value="SHG_FACILITATOR">SHG_FACILITATOR (Village Mobilization)</option>
                    <option value="SUPERVISOR_ADMIN">SUPERVISOR_ADMIN (District Oversight)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-jurisdiction" className="text-[12px] font-semibold text-ink block mb-1">
                    Assigned Center / Village
                  </label>
                  <input
                    id="invite-jurisdiction"
                    type="text"
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    placeholder="e.g. Jashipur Collection Center (JAS-02)"
                    className="w-full h-9 px-3 text-[13px] border border-rule rounded-[3px] bg-surface"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-rule">
                <Button variant="secondary" onClick={() => setIsInviteOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Generate Invitation
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
