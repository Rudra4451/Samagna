'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { ShortCodeLookup } from '../../components/ui/ShortCodeLookup';
import {
  DEMO_INVENTORY_MANAGER,
  DEMO_BATCH_BS402,
  DEMO_PRODUCT,
} from '../../demo/seed';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { StatusBadge, StatusVariant } from '../../components/ui/StatusBadge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NumberInput, Select, Textarea } from '../../components/ui/Input';
import { PhotoPlate } from '../../components/ui/PhotoPlate';
import { Toast, ToastContainer, ToastVariant } from '../../components/ui/Toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '../../components/ui/Drawer';
import { useAction } from '../../lib/useAction';
import { LastFetchedBadge } from '../../components/ui/LastFetchedBadge';
import { cn } from '../../lib/utils';
import {
  Warehouse,
  Scale,
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
  Package,
  Layers,
  History,
  Lock,
} from 'lucide-react';

interface BatchRow {
  code: string;
  product: string;
  collector: string;
  collectionKg: number;
  receivedKg: number | null;
  deltaKg: number | null;
  status: 'Pending Verification' | 'Available' | 'Quarantined';
  statusVariant: StatusVariant;
  updatedAt: string;
}

interface AuditTimelineItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  delta: string;
  deltaVariant?: 'success' | 'warning' | 'danger' | 'neutral';
}

export default function InventoryManagerPage() {
  const { isOffline } = useAppStore();
  // Stat Tiles State (Expected is forecast only and never changes stock)
  const [expectedStock] = useState<number>(500.0);
  const [pendingStock, setPendingStock] = useState<number>(100.0);
  const [availableStock, setAvailableStock] = useState<number>(0.0);
  const [quarantinedStock, setQuarantinedStock] = useState<number>(0.0);

  // Batches Table State
  const [batches, setBatches] = useState<BatchRow[]>([
    {
      code: '#BS-402',
      product: 'Dried Mahua Flowers',
      collector: 'Raimati Soren',
      collectionKg: 100.0,
      receivedKg: null,
      deltaKg: null,
      status: 'Pending Verification',
      statusVariant: 'warning',
      updatedAt: '14 Mar · 11:20 AM',
    },
    {
      code: '#BS-400',
      product: 'Dried Mahua Flowers',
      collector: 'Gura Marndi',
      collectionKg: 35.0,
      receivedKg: 34.5,
      deltaKg: -0.5,
      status: 'Available',
      statusVariant: 'success',
      updatedAt: '14 Mar · 10:15 AM',
    },
    {
      code: '#BS-398',
      product: 'Dried Mahua Flowers',
      collector: 'Sombari Murmu',
      collectionKg: 25.0,
      receivedKg: 24.6,
      deltaKg: -0.4,
      status: 'Available',
      statusVariant: 'success',
      updatedAt: '13 Mar · 03:45 PM',
    },
    {
      code: '#BS-396',
      product: 'Dried Mahua Flowers',
      collector: 'Dulari Hansdah',
      collectionKg: 60.0,
      receivedKg: 56.0,
      deltaKg: -4.0,
      status: 'Quarantined',
      statusVariant: 'danger',
      updatedAt: '13 Mar · 11:10 AM',
    },
  ]);

  // Drawer verification state for #BS-402
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'verification' | 'audit'>('verification');
  const [arrivalWeight, setArrivalWeight] = useState<number>(95.0);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [storageLocation, setStorageLocation] = useState<string>('Rack B (Dry Stack)');
  const [supervisorNote, setSupervisorNote] = useState<string>(
    'Joint inspection conducted with driver B. Soren. Security seal #OD-ST-8840 confirmed intact. High ambient temperature along Karanjia route caused moisture evaporation. Lot quarantined for drying equilibrium verification.'
  );

  // Monotonic audit timeline state
  const [auditTimeline, setAuditTimeline] = useState<AuditTimelineItem[]>([
    {
      id: 'aud-1',
      timestamp: '14 Mar 2025 · 11:20 AM',
      actor: 'Driver B. Soren (#VH-04)',
      action: 'Batch delivered at Central Warehouse bay 3. Seal #OD-ST-8840 intact.',
      delta: 'Arrival logged',
      deltaVariant: 'neutral',
    },
    {
      id: 'aud-2',
      timestamp: '14 Mar 2025 · 09:30 AM',
      actor: 'Facilitator Birsa Munda (#BS-FAC-01)',
      action: 'Batch collected from Raimati Soren at Karanjia Point. Net weight 100.0 kg.',
      delta: '+100.0 kg Dispatched',
      deltaVariant: 'success',
    },
    {
      id: 'aud-3',
      timestamp: '13 Mar 2025 · 04:15 PM',
      actor: 'Collector Raimati Soren',
      action: 'Pickup request submitted via BanaSetu Mobile.',
      delta: 'Forecast registered',
      deltaVariant: 'neutral',
    },
  ]);

  // Toast State (with undo support)
  const [activeToast, setActiveToast] = useState<{
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string;
    onUndo?: () => void;
    undoLabel?: string;
  } | null>(null);

  // Stale data timestamp (INTERACTION.md Rule 7)
  const [lastFetched, setLastFetched] = useState<Date>(new Date());
  const [showDiscardPrompt, setShowDiscardPrompt] = useState(false);
  const [confirmingApproval, setConfirmingApproval] = useState(false);

  // Shrinkage computations: Configured tolerance 1.5%
  const collectionKg = 100.0;
  const tolerancePercent = 1.5;
  const acceptableLossKg = Number(((collectionKg * tolerancePercent) / 100).toFixed(2)); // 1.5 kg
  const actualLossKg = Number((collectionKg - arrivalWeight).toFixed(2)); // 5.0 kg
  const excessLossKg = Number((actualLossKg - acceptableLossKg).toFixed(2)); // 3.5 kg
  const isWithinTolerance = excessLossKg <= 0;

  // Can approve if within tolerance OR supervisor note is added
  const canApprove = isWithinTolerance || supervisorNote.trim().length > 10;

  // Safe Drawer close check
  const handleAttemptCloseDrawer = () => {
    const hasUnsavedChanges =
      arrivalWeight !== 95.0 ||
      storageLocation !== 'Rack B (Dry Stack)' ||
      qualityGrade !== 'A';
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      setIsDrawerOpen(false);
      setConfirmingApproval(false);
    }
  };

  // 1. Refresh Batches Action
  const refreshBatchesAction = useAction({
    name: 'refresh-inventory-batches',
    showToast: (t) => setActiveToast(t),
    receipt: {
      variant: 'info',
      title: 'Inventory batches refreshed',
      description: 'Central depôt arrivals and storage racks synchronized.',
    },
    onExecute: () => {
      setLastFetched(new Date());
    },
  });

  // 2. Change Storage Location Action (INTERACTION.md Rule 8 - Mandatory Undo Scenario 2)
  const changeStorageLocationAction = useAction({
    name: 'change-storage-location',
    undoable: true,
    undoLabel: 'Undo',
    undoDurationMs: 6000,
    showToast: (t) => setActiveToast(t),
    capturePreviousState: () => ({ location: storageLocation }),
    receipt: {
      variant: 'info',
      title: (newLoc) => `Storage location updated to ${newLoc}`,
      description: 'Assigned rack updated. Click Undo within 6s to revert.',
    },
    onExecute: async ({ args }) => {
      const newLoc = args[0] as string;
      setStorageLocation(newLoc);
      return newLoc;
    },
    onUndo: async ({ previousState }) => {
      if (previousState?.location) {
        setStorageLocation(previousState.location);
      }
    },
  });

  // 3. Quarantine / Reject Action (INTERACTION.md Rule 8 - Mandatory Undo Scenario 3)
  const quarantineAction = useAction({
    name: 'quarantine-batch',
    undoable: true,
    undoLabel: 'Undo',
    undoDurationMs: 6000,
    showToast: (t) => setActiveToast(t),
    capturePreviousState: () => ({
      batches: [...batches],
      pendingStock,
      quarantinedStock,
      timeline: [...auditTimeline],
    }),
    receipt: {
      variant: 'warning',
      title: 'Batch #BS-402 Quarantined with Reject Reason',
      description: 'Stock held in segregation bay. Click Undo within 6s to restore Pending Verification.',
    },
    onExecute: async () => {
      setBatches((prev) =>
        prev.map((b) =>
          b.code === '#BS-402'
            ? {
                ...b,
                receivedKg: arrivalWeight,
                deltaKg: Number((arrivalWeight - collectionKg).toFixed(1)),
                status: 'Quarantined',
                statusVariant: 'danger',
                updatedAt: '14 Mar · Just now',
              }
            : b
        )
      );

      setPendingStock(0.0);
      setQuarantinedStock((prev) => prev + arrivalWeight);

      const quarantineAudit: AuditTimelineItem = {
        id: `aud-${Date.now()}`,
        timestamp: '14 Mar 2025 · Just now',
        actor: 'S. Das (Warehouse IM-04)',
        action: `Held in ${storageLocation} pending drying review. Reason: Excess shrinkage (-3.5 kg excess)`,
        delta: `${arrivalWeight.toFixed(1)} kg Quarantined`,
        deltaVariant: 'danger',
      };
      setAuditTimeline((prev) => [...prev, quarantineAudit]);
      setIsDrawerOpen(false);
      setShowDiscardPrompt(false);
    },
    onUndo: async ({ previousState }) => {
      if (previousState) {
        setBatches(previousState.batches);
        setPendingStock(previousState.pendingStock);
        setQuarantinedStock(previousState.quarantinedStock);
        setAuditTimeline(previousState.timeline);
      }
    },
  });

  // 4. Approve to Saleable Action (INTERACTION.md Rule 3 - Semi-reversible inline confirmation)
  const approveAction = useAction({
    name: 'approve-to-saleable',
    showToast: (t) => setActiveToast(t),
    receipt: {
      variant: 'success',
      title: 'Batch #BS-402 Approved to Saleable',
      description: 'Expected unchanged · Available +95.0 kg. Discrepancy logged as non-punitive audit flag.',
    },
    onExecute: async () => {
      setBatches((prev) =>
        prev.map((b) =>
          b.code === '#BS-402'
            ? {
                ...b,
                receivedKg: arrivalWeight,
                deltaKg: Number((arrivalWeight - collectionKg).toFixed(1)),
                status: 'Available',
                statusVariant: 'success',
                updatedAt: '14 Mar · Just now',
              }
            : b
        )
      );

      setPendingStock(0.0);
      setAvailableStock((prev) => prev + arrivalWeight);

      const approvalAudit: AuditTimelineItem = {
        id: `aud-${Date.now()}`,
        timestamp: '14 Mar 2025 · Just now',
        actor: 'S. Das (IM-04) & Supervisor Endorsement',
        action: `Approved to saleable stock in ${storageLocation} with flag note`,
        delta: `+${arrivalWeight.toFixed(1)} kg Available`,
        deltaVariant: 'success',
      };
      setAuditTimeline((prev) => [...prev, approvalAudit]);
      setIsDrawerOpen(false);
      setShowDiscardPrompt(false);
      setConfirmingApproval(false);
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top of Content Header with Top-Right Primary Action (Rule 2) */}
        <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-[28px] font-semibold text-ink leading-tight">
              Inventory
            </h1>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted mt-1 select-none">
              Today · 14 Mar 2025 · Baripada Central Depôt #02
            </div>
          </div>
          {/* Primary Action Placement: Top-right aligned with page title row */}
          <Button
            variant="primary"
            onClick={() => {
              setShowDiscardPrompt(false);
              setIsDrawerOpen(true);
            }}
            className="self-start sm:self-auto shadow-none"
          >
            Verify batch
          </Button>
        </div>

        {/* ========================================================
            TOP STRIP: 4 Stat Tiles in a Single Row
           ======================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Tile 1: Expected (forecast) */}
          <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted block select-none">
              Forecast · not stock
            </span>
            <div className="font-heading text-[26px] font-bold tabular-nums text-ink-muted mt-1 leading-tight">
              {expectedStock > 0 ? expectedStock.toFixed(1) : '—'}
            </div>
            <span className="text-[12px] font-mono text-ink-subtle block mt-0.5">kg</span>
          </div>

          {/* Tile 2: Pending verification */}
          <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted block select-none">
              Pending verification
            </span>
            <div className="font-heading text-[26px] font-bold tabular-nums text-warning mt-1 leading-tight">
              {pendingStock.toFixed(1)}
            </div>
            <span className="text-[12px] font-mono text-ink-subtle block mt-0.5">kg</span>
          </div>

          {/* Tile 3: Available (saleable) */}
          <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted block select-none">
              Available (saleable)
            </span>
            <div className="font-heading text-[26px] font-bold tabular-nums text-success mt-1 leading-tight">
              {availableStock.toFixed(1)}
            </div>
            <span className="text-[12px] font-mono text-ink-subtle block mt-0.5">kg</span>
          </div>

          {/* Tile 4: Quarantined */}
          <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted block select-none">
              Quarantined
            </span>
            <div className="font-heading text-[26px] font-bold tabular-nums text-danger mt-1 leading-tight">
              {quarantinedStock.toFixed(1)}
            </div>
            <span className="text-[12px] font-mono text-ink-subtle block mt-0.5">kg</span>
          </div>
        </div>

        {/* ========================================================
            "BATCHES" TABLE
           ======================================================== */}
        <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
          <div className="px-4 py-3 border-b border-rule bg-bg-sunken/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <SectionLabel as="h2">Depôt Batches Ledger</SectionLabel>
                <LastFetchedBadge
                  timestamp={lastFetched}
                  onRefresh={() => refreshBatchesAction.execute()}
                />
              </div>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Custody verification records comparing collection gross with depôt arrival tare
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <ShortCodeLookup
                onSelectBatch={() => {
                  setShowDiscardPrompt(false);
                  setIsDrawerOpen(true);
                }}
              />
              <span className="text-[11px] font-mono text-ink-muted shrink-0 hidden sm:inline">
                {batches.length} TRACKED BATCHES
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead numeric>Collection kg</TableHead>
                <TableHead numeric>Received kg</TableHead>
                <TableHead numeric>Δ (Variance)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow
                  key={b.code}
                  onClick={() => setIsDrawerOpen(true)}
                  className="cursor-pointer hover:bg-bg-sunken/30 select-none"
                >
                  <TableCell className="font-mono text-[13px] font-bold text-ink tabular-nums">
                    {b.code}
                  </TableCell>
                  <TableCell className="font-medium text-ink">
                    {b.product}
                  </TableCell>
                  <TableCell className="text-ink-muted text-[13px]">
                    {b.collector}
                  </TableCell>
                  <TableCell numeric className="font-semibold text-ink">
                    {b.collectionKg.toFixed(1)} kg
                  </TableCell>
                  <TableCell numeric className="font-mono text-[13px] text-ink">
                    {b.receivedKg !== null ? `${b.receivedKg.toFixed(1)} kg` : '—'}
                  </TableCell>
                  <TableCell numeric>
                    {b.deltaKg !== null ? (
                      <span
                        className={cn(
                          'font-mono tabular-nums font-medium',
                          b.deltaKg < -1.5 ? 'text-danger' : b.deltaKg < 0 ? 'text-warning' : 'text-success'
                        )}
                      >
                        {b.deltaKg > 0 ? `+${b.deltaKg.toFixed(1)}` : `${b.deltaKg.toFixed(1)}`} kg
                      </span>
                    ) : (
                      <span className="text-ink-subtle font-mono">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={b.statusVariant}>
                      {b.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-ink-subtle">
                    {b.updatedAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
                      <span>Verify</span>
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ========================================================
            STATE INVARIANTS FOOTER CARD
           ======================================================== */}
        <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
          <SectionLabel className="mb-2">Invariants</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
            <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/30">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block mb-0.5">
                Invariant I
              </span>
              <span className="font-medium text-ink">
                Available = Verified saleable − Reserved
              </span>
            </div>
            <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/30">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block mb-0.5">
                Invariant II
              </span>
              <span className="font-medium text-ink">
                Forecast never increases saleable stock
              </span>
            </div>
            <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/30">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block mb-0.5">
                Invariant III
              </span>
              <span className="font-medium text-ink">
                Second verification never overwrites the first
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          DRAWER: "Storage verification · #BS-402" (480px width)
         ======================================================== */}
      <Drawer
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleAttemptCloseDrawer();
          } else {
            setIsDrawerOpen(true);
          }
        }}
      >
        <DrawerContent className="w-[480px] max-w-full">
          <DrawerHeader>
            <div className="flex items-center justify-between w-full pr-6">
              <div>
                <SectionLabel>Depôt Intake Terminal</SectionLabel>
                <DrawerTitle>Storage verification · #BS-402</DrawerTitle>
              </div>
              <StatusBadge variant="warning">In Review</StatusBadge>
            </div>
          </DrawerHeader>

          {/* Drawer View Switcher Tabs */}
          <div className="flex border-b border-rule bg-bg-sunken px-4 select-none shrink-0">
            <button
              onClick={() => setDrawerTab('verification')}
              className={cn(
                'h-[36px] px-3 text-[13px] font-medium transition-colors border-b-2 -mb-[1px]',
                drawerTab === 'verification'
                  ? 'border-accent text-ink font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              Verification Form
            </button>
            <button
              onClick={() => setDrawerTab('audit')}
              className={cn(
                'h-[36px] px-3 text-[13px] font-medium transition-colors border-b-2 -mb-[1px]',
                drawerTab === 'audit'
                  ? 'border-accent text-ink font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              )}
            >
              Audit Timeline ({auditTimeline.length})
            </button>
          </div>

          <DrawerBody className="p-4 space-y-5 text-[14px]">
            {drawerTab === 'verification' ? (
              <>
                {/* 1. Read-only Block: Collection record (Original preserved and not editable) */}
                <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-2.5 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold">
                      <Lock size={14} strokeWidth={1.5} className="text-ink-subtle" />
                      <span>Original Collection Record</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-subtle bg-surface px-1.5 py-0.5 border border-rule rounded-[2px]">
                      READ-ONLY
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[13px]">
                    <div className="border border-rule rounded-[2px] p-2 bg-surface">
                      <span className="text-[11px] text-ink-muted block">Dispatched Net</span>
                      <span className="font-heading text-[18px] font-bold tabular-nums text-ink">
                        {collectionKg.toFixed(2)} kg
                      </span>
                    </div>
                    <div className="border border-rule rounded-[2px] p-2 bg-surface">
                      <span className="text-[11px] text-ink-muted block">Collector</span>
                      <span className="font-medium text-ink truncate block">Raimati Soren</span>
                    </div>
                  </div>

                  <div className="text-[12px] text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Logged Timestamp:</span>
                      <span className="font-mono">14 Mar 2025 · 09:15 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Reference:</span>
                      <span className="font-mono font-medium text-ink">[SIMULATED] TXN-998</span>
                    </div>
                  </div>

                  {/* 2 PhotoPlate placeholders for original collection */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <PhotoPlate
                      label="Product (field stencil)"
                      metadata="Stencil #BS-402 · Sack 1"
                      caption="Original field gunny bag markings."
                    />
                    <PhotoPlate
                      label="Field scale readout"
                      metadata="Bench Scale #04 · 104.20 kg"
                      caption="Net certified 100.00 kg."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-rule text-[11px] font-mono">
                    <span className="text-ink-muted">Printable Field Docs:</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/collection/tag/BS-402"
                        target="_blank"
                        className="text-accent hover:underline font-medium"
                      >
                        A6 Tag ↗
                      </Link>
                      <span>·</span>
                      <Link
                        href="/collection/receipt/BS-402"
                        target="_blank"
                        className="text-accent hover:underline font-medium"
                      >
                        A5 Receipt ↗
                      </Link>
                    </div>
                  </div>

                  <p className="text-[12px] text-ink-subtle font-mono pt-0.5">
                    Original collection record is preserved and not editable.
                  </p>
                </div>

                {/* 2. Input Block: Arrival weight & Quality */}
                <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
                  <SectionLabel>Arrival Re-Weigh Calibration</SectionLabel>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                        Arrival Weight (kg)
                      </label>
                      <NumberInput
                        value={arrivalWeight}
                        onChange={(e) => setArrivalWeight(Number(e.target.value))}
                        step={0.1}
                        unit="kg"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                        Storage Location
                      </label>
                      <Select
                        id="storage-location-select"
                        value={storageLocation}
                        onChange={(e) => changeStorageLocationAction.execute(e.target.value)}
                        disabled={changeStorageLocationAction.isDisabled}
                      >
                        <option value="Rack A (Central Bay)">Rack A (Central Bay)</option>
                        <option value="Rack B (Dry Stack)">Rack B (Dry Stack)</option>
                        <option value="Rack C (Quarantine Segregation)">Rack C (Quarantine Segregation)</option>
                      </Select>
                    </div>
                  </div>

                  {/* Quality grade segmented control */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                      Arrival Quality Grade
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['A', 'B', 'C'] as const).map((grade) => (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => setQualityGrade(grade)}
                          className={cn(
                            'h-[36px] rounded-[2px] border text-[13px] font-mono font-semibold transition-colors',
                            qualityGrade === grade
                              ? 'border-accent bg-accent text-accent-ink'
                              : 'border-rule bg-bg-sunken text-ink hover:border-ink-subtle'
                          )}
                        >
                          Grade {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2 PhotoPlate placeholders for arrival evidence */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <PhotoPlate
                      label="Depôt gross weigh-in seal"
                      metadata="Platform Scale #ES-8812"
                      caption="Arrival platform tare check."
                    />
                    <PhotoPlate
                      label="Platform electronic readout"
                      metadata="96.50 kg gross minus 1.50 tare"
                      caption="Recorded arrival: 95.00 kg."
                    />
                  </div>
                </div>

                {/* 3. Shrinkage Panel */}
                <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-2.5">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Shrinkage Evaluation Engine</SectionLabel>
                    <StatusBadge variant={isWithinTolerance ? 'success' : 'warning'}>
                      {isWithinTolerance ? 'Natural shrinkage' : 'Discrepancy — review required'}
                    </StatusBadge>
                  </div>

                  <p className="text-[12px] text-ink-muted leading-snug">
                    Configured shrinkage tolerance: 1.5% (Mahua · dried) · Source: locally validated · Placeholder value
                  </p>

                  {/* Mathematical computation readout */}
                  <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/40 font-mono text-[13px] text-ink space-y-1 tabular-nums">
                    <div className="flex justify-between">
                      <span>Acceptable loss ({tolerancePercent}% of 100 kg):</span>
                      <span className="font-semibold">{acceptableLossKg.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Actual loss (100 kg − {arrivalWeight} kg):</span>
                      <span className="font-semibold text-warning">{actualLossKg.toFixed(1)} kg</span>
                    </div>
                    <div className="flex justify-between border-t border-rule pt-1 font-bold">
                      <span className={excessLossKg > 0 ? 'text-danger' : 'text-success'}>
                        {excessLossKg > 0 ? 'Excess Loss (Flag):' : 'Conforming Margin:'}
                      </span>
                      <span className={excessLossKg > 0 ? 'text-danger' : 'text-success'}>
                        {excessLossKg > 0 ? `+${excessLossKg.toFixed(1)} kg` : `${Math.abs(excessLossKg).toFixed(1)} kg within`}
                      </span>
                    </div>
                  </div>

                  {/* Guidance Note based on tolerance */}
                  {isWithinTolerance ? (
                    <div className="p-2 border border-success/30 bg-success/5 rounded-[2px] text-[12px] text-success">
                      Will be recorded, not hidden.
                    </div>
                  ) : (
                    <div className="p-2.5 border border-warning/40 bg-warning/5 rounded-[2px] text-[12px] text-ink-muted space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-warning">
                        <AlertTriangle size={15} strokeWidth={1.5} />
                        Discrepancy flag logged
                      </div>
                      <p>
                        Do not accuse. This is a flag, not a finding. Explain physical or meteorological factors.
                      </p>
                    </div>
                  )}

                  {/* Rectangular "Add supervisor note" Textarea */}
                  <div className="space-y-1 pt-1">
                    <label htmlFor="supervisor-note-input" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                      Supervisor Note (Required for excess variance approval)
                    </label>
                    <Textarea
                      id="supervisor-note-input"
                      rows={3}
                      value={supervisorNote}
                      onChange={(e) => setSupervisorNote(e.target.value)}
                      error={!isWithinTolerance && !supervisorNote.trim()}
                      errorText={!isWithinTolerance && !supervisorNote.trim() ? "Supervisor note required to clear excess shrinkage flag" : undefined}
                      placeholder="Enter supervisor observation regarding bag seals, drying time, or moisture..."
                    />
                  </div>
                </div>

                {/* Live Delta Line */}
                <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken text-center text-[12px] font-mono font-medium text-ink select-none">
                  Expected unchanged · Available +{arrivalWeight.toFixed(1)} kg
                </div>
              </>
            ) : (
              /* Monotonic Audit Timeline Tab */
              <div className="space-y-3">
                <SectionLabel>Monotonic Audit Log (#BS-402)</SectionLabel>
                <div className="border-l border-rule relative pl-4 ml-2 space-y-5 py-2">
                  {auditTimeline.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* 6px Dot on the 1px rule (no shadows, no icons) */}
                      <span className="absolute -left-[19.5px] top-1.5 w-[7px] h-[7px] rounded-full bg-ink border border-surface" />
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <div>
                          <div className="text-[12px] font-mono text-ink-subtle tabular-nums">
                            {item.timestamp}
                          </div>
                          <div className="font-semibold text-[13px] text-ink mt-0.5">
                            {item.action}
                          </div>
                          <div className="text-[12px] text-ink-muted">
                            Actor: {item.actor}
                          </div>
                        </div>
                        <div
                          className={cn(
                            'font-mono tabular-nums text-[12px] font-bold shrink-0',
                            item.deltaVariant === 'success' && 'text-success',
                            item.deltaVariant === 'danger' && 'text-danger',
                            item.deltaVariant === 'warning' && 'text-warning',
                            item.deltaVariant === 'neutral' && 'text-ink-muted'
                          )}
                        >
                          {item.delta}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DrawerBody>

          {/* Drawer Footer Actions */}
          <DrawerFooter className="flex-col gap-2.5 bg-bg-sunken border-t border-rule p-4">
            {showDiscardPrompt && (
              <div className="w-full p-2.5 border border-warning/60 bg-warning/5 rounded-[2px] text-[12px] flex items-center justify-between gap-2">
                <span className="text-warning font-semibold">Unsaved verification changes — discard?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setArrivalWeight(95.0);
                      setStorageLocation('Rack B (Dry Stack)');
                      setQualityGrade('A');
                      setShowDiscardPrompt(false);
                      setIsDrawerOpen(false);
                      setConfirmingApproval(false);
                    }}
                    className="px-2 py-0.5 rounded-[2px] bg-danger text-white text-[11px] font-semibold hover:bg-danger/90"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiscardPrompt(false)}
                    className="px-2 py-0.5 rounded-[2px] border border-rule bg-surface text-ink text-[11px] hover:bg-bg-sunken"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
            )}
            {isOffline && (
              <p className="text-[12px] text-ink-subtle text-center select-none w-full">
                Will be saved locally and sync when online.
              </p>
            )}
            <div className="flex items-center justify-between w-full gap-3">
              <Button
                variant="secondary"
                onClick={() => quarantineAction.execute()}
                disabled={quarantineAction.isDisabled}
                className="flex-1 shadow-none"
              >
                Hold / quarantine
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!confirmingApproval) {
                    setConfirmingApproval(true);
                  } else {
                    approveAction.execute();
                  }
                }}
                disabled={!canApprove || approveAction.isDisabled}
                className="flex-1 shadow-none"
              >
                {confirmingApproval ? 'Confirm 95.0 kg promotion?' : 'Approve to saleable'}
              </Button>
            </div>
            {!canApprove && (
              <span className="text-[11px] font-mono text-danger text-center block">
                Supervisor note required to clear excess shrinkage flag
              </span>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Floating Bottom Toast Notification */}
      {activeToast && (
        <ToastContainer>
          <Toast
            variant={activeToast.variant}
            title={activeToast.title}
            description={activeToast.description}
            onUndo={activeToast.onUndo}
            undoLabel={activeToast.undoLabel}
            onClose={() => setActiveToast(null)}
          />
        </ToastContainer>
      )}
    </AppShell>
  );
}
