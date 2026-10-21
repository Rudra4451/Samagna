'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { DiscrepancyCardArtifact } from '../../components/artifacts/DiscrepancyCardArtifact';
import { AuditTimelineArtifact, AuditTimelineEvent } from '../../components/artifacts/AuditTimelineArtifact';
import { InventoryManagerOnboarding } from '../../components/onboarding/InventoryManagerOnboarding';
import { useRoleOnboarding } from '../../lib/useOnboarding';
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
import { SyncStatusBadge } from '../../components/ui/SyncStatusBadge';
import { SyncState } from '../../lib/db';
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
import { useHotkeys } from '../../lib/useHotkeys';
import { KeyboardShortcutsDrawer } from '../../components/manager/KeyboardShortcutsDrawer';
import {
  ManagerFilterBar,
  ManagerFiltersState,
  ColumnConfig,
  TableDensity,
} from '../../components/manager/ManagerFilterBar';
import { BulkActionBar } from '../../components/manager/BulkActionBar';
import { RowActionMenu } from '../../components/manager/RowActionMenu';
import { InlineEditableCell } from '../../components/manager/InlineEditableCell';

interface BatchRow {
  code: string;
  product: string;
  collector: string;
  village: string;
  collectionKg: number;
  receivedKg: number | null;
  deltaKg: number | null;
  qualityGrade: 'A' | 'B' | 'C';
  storageLocation: string;
  status: 'Pending Verification' | 'Available' | 'Quarantined';
  statusVariant: StatusVariant;
  syncState?: SyncState;
  updatedAt: string;
  updatedDateIso: string;
  hasInlineEdit?: boolean;
}

const DEFAULT_INVENTORY_COLUMNS: ColumnConfig[] = [
  { id: 'code', label: 'Batch Code', visible: true },
  { id: 'product', label: 'Product', visible: true },
  { id: 'collector', label: 'Collector', visible: true },
  { id: 'village', label: 'Village', visible: true },
  { id: 'collectionKg', label: 'Collection kg', visible: true },
  { id: 'receivedKg', label: 'Received kg', visible: true },
  { id: 'deltaKg', label: 'Δ Variance', visible: true },
  { id: 'quality', label: 'Quality', visible: true },
  { id: 'storageLocation', label: 'Storage Bay', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'sync', label: 'Sync State', visible: true },
  { id: 'updated', label: 'Updated', visible: true },
  { id: 'action', label: 'Actions', visible: true },
];

const INVENTORY_STATUSES = [
  { value: 'Pending Verification', label: 'Pending Verification' },
  { value: 'Available', label: 'Available' },
  { value: 'Quarantined', label: 'Quarantined' },
];

const INVENTORY_VILLAGES = ['Badagaon, Karanjia', 'Kadamdiha, Karanjia', 'Sundargarh'];

export default function InventoryManagerPage() {
  const { isOffline } = useAppStore();

  // Role onboarding state (Rule 1 & 5)
  const { isOnboarded, isLoaded, complete } = useRoleOnboarding('inventory');

  const handleVerifyBatchFromOnboarding = () => {
    complete();
    setSelectedBatchCode('#BS-402');
    setShowDiscardPrompt(false);
    setIsDrawerOpen(true);
  };

  // Stat Tiles State (Expected is forecast only and never changes stock)
  const [expectedStock] = useState<number>(500.0);
  const [pendingStock, setPendingStock] = useState<number>(100.0);
  const [availableStock, setAvailableStock] = useState<number>(0.0);
  const [quarantinedStock, setQuarantinedStock] = useState<number>(0.0);

  // Batches Table State with enhanced metadata
  const [batches, setBatches] = useState<BatchRow[]>([
    {
      code: '#BS-402',
      product: 'Dried Mahua Flowers',
      collector: 'Raimati Soren',
      village: 'Badagaon, Karanjia',
      collectionKg: 100.0,
      receivedKg: null,
      deltaKg: null,
      qualityGrade: 'A',
      storageLocation: 'Rack B (Dry Stack)',
      status: 'Pending Verification',
      statusVariant: 'warning',
      syncState: 'queued',
      updatedAt: '14 Mar · 11:20 AM',
      updatedDateIso: '2025-03-14',
    },
    {
      code: '#BS-400',
      product: 'Dried Mahua Flowers',
      collector: 'Gura Marndi',
      village: 'Badagaon, Karanjia',
      collectionKg: 35.0,
      receivedKg: 34.5,
      deltaKg: -0.5,
      qualityGrade: 'A',
      storageLocation: 'Rack B (Dry Stack)',
      status: 'Available',
      statusVariant: 'success',
      syncState: 'synced',
      updatedAt: '14 Mar · 10:15 AM',
      updatedDateIso: '2025-03-14',
    },
    {
      code: '#BS-398',
      product: 'Dried Mahua Flowers',
      collector: 'Sombari Murmu',
      village: 'Kadamdiha, Karanjia',
      collectionKg: 25.0,
      receivedKg: 24.6,
      deltaKg: -0.4,
      qualityGrade: 'A',
      storageLocation: 'Rack A (Floor Pallet)',
      status: 'Available',
      statusVariant: 'success',
      syncState: 'synced',
      updatedAt: '13 Mar · 03:45 PM',
      updatedDateIso: '2025-03-13',
    },
    {
      code: '#BS-396',
      product: 'Dried Mahua Flowers',
      collector: 'Dulari Hansdah',
      village: 'Badagaon, Karanjia',
      collectionKg: 60.0,
      receivedKg: 56.0,
      deltaKg: -4.0,
      qualityGrade: 'C',
      storageLocation: 'Quarantine Bay Q1',
      status: 'Quarantined',
      statusVariant: 'danger',
      syncState: 'conflict',
      updatedAt: '13 Mar · 11:10 AM',
      updatedDateIso: '2025-03-13',
    },
    {
      code: '#BS-395',
      product: 'Dried Mahua Flowers',
      collector: 'Biren Majhi',
      village: 'Kadamdiha, Karanjia',
      collectionKg: 45.0,
      receivedKg: 44.7,
      deltaKg: -0.3,
      qualityGrade: 'A',
      storageLocation: 'Rack B (Dry Stack)',
      status: 'Available',
      statusVariant: 'success',
      syncState: 'synced',
      updatedAt: '13 Mar · 09:30 AM',
      updatedDateIso: '2025-03-13',
    },
    {
      code: '#BS-394',
      product: 'Dried Mahua Flowers',
      collector: 'Salge Tudu',
      village: 'Sundargarh',
      collectionKg: 80.0,
      receivedKg: 74.0,
      deltaKg: -6.0,
      qualityGrade: 'B',
      storageLocation: 'Quarantine Bay Q2',
      status: 'Quarantined',
      statusVariant: 'danger',
      syncState: 'conflict',
      updatedAt: '12 Mar · 04:00 PM',
      updatedDateIso: '2025-03-12',
    },
  ]);

  // Persisted Filters (Rule 3)
  const [filters, setFilters] = useState<ManagerFiltersState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('banasetu_filter_inventory');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      savedView: 'all',
      search: '',
      statuses: [],
      village: '',
      dateFrom: '',
      dateTo: '',
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('banasetu_filter_inventory', JSON.stringify(filters));
    }
  }, [filters]);

  // Persisted Table Density (Rule 4)
  const [density, setDensity] = useState<TableDensity>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('banasetu_table_density');
      if (saved === 'comfortable' || saved === 'compact') return saved;
    }
    return 'comfortable';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('banasetu_table_density', density);
    }
  }, [density]);

  // Persisted Column Visibility (Rule 7)
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('banasetu_cols_inventory');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_INVENTORY_COLUMNS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('banasetu_cols_inventory', JSON.stringify(columns));
    }
  }, [columns]);

  // Bulk Selection state (Rule 6)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('#BS-402');

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
  const [auditTimeline, setAuditTimeline] = useState<AuditTimelineEvent[]>([
    {
      id: 'aud-1',
      dayHeader: '14 March 2025',
      time: '11:20 AM',
      actor: 'Driver B. Soren (#VH-04)',
      action: 'Batch delivered at Central Warehouse bay 3. Seal #OD-ST-8840 intact.',
      delta: 'Arrival logged',
      deltaVariant: 'neutral',
    },
    {
      id: 'aud-2',
      dayHeader: '14 March 2025',
      time: '09:30 AM',
      actor: 'Facilitator Birsa Munda (#BS-FAC-01)',
      action: 'Batch collected from Raimati Soren at Karanjia Point. Net weight 100.0 kg.',
      delta: '+100.0 kg',
      deltaVariant: 'success',
    },
    {
      id: 'aud-3',
      dayHeader: '13 March 2025',
      time: '04:15 PM',
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

  // Filtered batches (Rules 2 & 3)
  const filteredBatches = batches.filter((b) => {
    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const match =
        b.code.toLowerCase().includes(q) ||
        b.collector.toLowerCase().includes(q) ||
        b.village.toLowerCase().includes(q) ||
        b.product.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(b.status)) return false;
    }

    // Village filter
    if (filters.village) {
      if (b.village !== filters.village) return false;
    }

    // Date range
    if (filters.dateFrom) {
      if (b.updatedDateIso < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      if (b.updatedDateIso > filters.dateTo) return false;
    }

    return true;
  });

  // Hotkeys Hook (Rule 1: Keyboard-first)
  const { selectedIndex, isShortcutsOpen, setIsShortcutsOpen } = useHotkeys({
    rowCount: filteredBatches.length,
    searchInputRef,
    activeFilterCount:
      (filters.search ? 1 : 0) +
      filters.statuses.length +
      (filters.village ? 1 : 0) +
      (filters.dateFrom || filters.dateTo ? 1 : 0),
    onClearFilters: () => {
      setFilters({
        savedView: 'all',
        search: '',
        statuses: [],
        village: '',
        dateFrom: '',
        dateTo: '',
      });
    },
    onEscape: () => {
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        setConfirmingApproval(false);
        return true;
      }
      return false;
    },
    onOpenRow: (idx) => {
      if (idx >= 0 && idx < filteredBatches.length) {
        setSelectedBatchCode(filteredBatches[idx].code);
        setIsDrawerOpen(true);
      }
    },
  });

  // Bulk Selection & Action Handlers (Rule 6)
  const toggleSelectAll = () => {
    if (selectedCodes.length === filteredBatches.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(filteredBatches.map((b) => b.code));
    }
  };

  const toggleSelectRow = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Discrepancy count among selected rows: status === 'Quarantined' or delta < -1.5
  const selectedDiscrepancies = filteredBatches.filter(
    (b) =>
      selectedCodes.includes(b.code) &&
      (b.status === 'Quarantined' || (b.deltaKg !== null && b.deltaKg < -1.5))
  ).length;

  const handleBulkApprove = () => {
    if (selectedDiscrepancies > 0) return;
    setBatches((prev) =>
      prev.map((b) =>
        selectedCodes.includes(b.code)
          ? {
              ...b,
              status: 'Available',
              statusVariant: 'success',
              receivedKg: b.receivedKg ?? b.collectionKg,
              deltaKg: b.deltaKg ?? 0,
            }
          : b
      )
    );
    setAvailableStock((prev) => prev + selectedCodes.length * 50);
    setPendingStock((prev) => Math.max(0, prev - selectedCodes.length * 50));
    setActiveToast({
      id: `bulk-approve-${Date.now()}`,
      variant: 'success',
      title: `${selectedCodes.length} inventory batches verified & released to saleable stock`,
    });
    setSelectedCodes([]);
  };

  const handleBulkHold = () => {
    setBatches((prev) =>
      prev.map((b) =>
        selectedCodes.includes(b.code)
          ? { ...b, status: 'Quarantined', statusVariant: 'danger' }
          : b
      )
    );
    setQuarantinedStock((prev) => prev + selectedCodes.length * 50);
    setPendingStock((prev) => Math.max(0, prev - selectedCodes.length * 50));
    setActiveToast({
      id: `bulk-hold-${Date.now()}`,
      variant: 'danger',
      title: `${selectedCodes.length} batches quarantined pending quality re-inspection`,
    });
    setSelectedCodes([]);
  };

  // Inline correction handlers (Rule 8: collection weight, received weight, quality, and storage location)
  const handleInlineCollectionKgCommit = (code: string, val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num) || num <= 0) return;
    setBatches((prev) =>
      prev.map((b) =>
        b.code === code
          ? {
              ...b,
              collectionKg: num,
              deltaKg: b.receivedKg !== null ? Number((b.receivedKg - num).toFixed(2)) : null,
              hasInlineEdit: true,
            }
          : b
      )
    );
    setAuditTimeline((prev) => [
      {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'Inventory Manager',
        action: `Inline correction: adjusted ${code} collection weight to ${num.toFixed(1)} kg.`,
        delta: `Δ adjusted`,
        deltaVariant: 'neutral',
        isLive: true,
      },
      ...prev,
    ]);
  };

  const handleInlineReceivedKgCommit = (code: string, val: number | string) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num) || num <= 0) return;
    setBatches((prev) =>
      prev.map((b) =>
        b.code === code
          ? {
              ...b,
              receivedKg: num,
              deltaKg: Number((num - b.collectionKg).toFixed(2)),
              hasInlineEdit: true,
            }
          : b
      )
    );
    setAuditTimeline((prev) => [
      {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'Inventory Manager',
        action: `Inline correction: verified arrival weight for ${code} set to ${num.toFixed(1)} kg.`,
        delta: `Weight verified`,
        deltaVariant: 'neutral',
        isLive: true,
      },
      ...prev,
    ]);
  };

  const handleInlineQualityCommit = (code: string, grade: string | number) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.code === code ? { ...b, qualityGrade: grade as any, hasInlineEdit: true } : b
      )
    );
    setAuditTimeline((prev) => [
      {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'Inventory Manager',
        action: `Inline correction: quality grade of ${code} updated to Grade ${grade}.`,
        delta: `Grade ${grade}`,
        deltaVariant: 'neutral',
        isLive: true,
      },
      ...prev,
    ]);
  };

  const handleInlineLocationCommit = (code: string, loc: string | number) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.code === code ? { ...b, storageLocation: String(loc), hasInlineEdit: true } : b
      )
    );
    setAuditTimeline((prev) => [
      {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'Inventory Manager',
        action: `Storage location for ${code} assigned to ${loc}.`,
        delta: `Rack assigned`,
        deltaVariant: 'neutral',
        isLive: true,
      },
      ...prev,
    ]);
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

      const quarantineAudit: AuditTimelineEvent = {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'S. Das (Warehouse IM-04)',
        action: `Held in ${storageLocation} pending drying review. Reason: Excess shrinkage (-3.5 kg excess)`,
        delta: `-${(collectionKg - arrivalWeight).toFixed(1)} kg`,
        deltaVariant: 'danger',
        isLive: true,
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

      const approvalAudit: AuditTimelineEvent = {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: 'S. Das (IM-04) & Supervisor Endorsement',
        action: `Approved to saleable stock in ${storageLocation} with flag note`,
        delta: `+${arrivalWeight.toFixed(1)} kg`,
        deltaVariant: 'success',
        isLive: true,
      };
      setAuditTimeline((prev) => [...prev, approvalAudit]);
      setIsDrawerOpen(false);
      setShowDiscardPrompt(false);
      setConfirmingApproval(false);
    },
  });

  return (
    <AppShell>
      {/* Inventory Manager First-Run Onboarding Modal (Rule 5) */}
      {!isOnboarded && isLoaded && (
        <InventoryManagerOnboarding
          onVerifyBatch={handleVerifyBatchFromOnboarding}
          onSkip={complete}
        />
      )}

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
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted block select-none">
                Available (saleable)
              </span>
              {availableStock > 0 && <VerifiedBadge />}
            </div>
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

        {/* Rule 2 & 3: Global Search, Saved Views, Filters & Density */}
        <div className="border border-rule rounded-[4px] bg-surface p-3.5 shadow-none">
          <ManagerFilterBar
            roleKey="inventory"
            availableStatuses={INVENTORY_STATUSES}
            availableVillages={INVENTORY_VILLAGES}
            columns={columns}
            onColumnsChange={setColumns}
            density={density}
            onDensityChange={setDensity}
            filters={filters}
            onFiltersChange={setFilters}
            searchInputRef={searchInputRef}
            totalCount={batches.length}
            filteredCount={filteredBatches.length}
            lastRefreshed={lastFetched}
            onRefresh={() => refreshBatchesAction.execute()}
          />
        </div>

        {/* ========================================================
            "BATCHES" TABLE (Sticky Header, Sticky First Column, Density, Inline Edit)
           ======================================================== */}
        <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table className="w-full border-collapse">
              <TableHeader>
                <TableRow className="sticky top-0 bg-surface z-20 border-b border-rule shadow-[0_1px_0_0_var(--rule)]">
                  {/* Leading Checkbox Column */}
                  <TableHead className="w-10 px-2 text-center sticky left-0 bg-surface z-20">
                    <input
                      type="checkbox"
                      checked={
                        filteredBatches.length > 0 &&
                        selectedCodes.length === filteredBatches.length
                      }
                      onChange={toggleSelectAll}
                      aria-label="Select all rows"
                      className="rounded-[2px] border-rule text-accent accent-accent cursor-pointer"
                    />
                  </TableHead>

                  {/* Sticky Batch Code Column */}
                  {columns.find((c) => c.id === 'code')?.visible && (
                    <TableHead className="w-28 sticky left-10 bg-surface z-20 font-mono">
                      Batch Code
                    </TableHead>
                  )}

                  {columns.find((c) => c.id === 'product')?.visible && (
                    <TableHead>Product</TableHead>
                  )}

                  {columns.find((c) => c.id === 'collector')?.visible && (
                    <TableHead>Collector</TableHead>
                  )}

                  {columns.find((c) => c.id === 'village')?.visible && (
                    <TableHead>Village</TableHead>
                  )}

                  {columns.find((c) => c.id === 'collectionKg')?.visible && (
                    <TableHead numeric>Collection kg</TableHead>
                  )}

                  {columns.find((c) => c.id === 'receivedKg')?.visible && (
                    <TableHead numeric>Received kg</TableHead>
                  )}

                  {columns.find((c) => c.id === 'deltaKg')?.visible && (
                    <TableHead numeric>Δ (Variance)</TableHead>
                  )}

                  {columns.find((c) => c.id === 'quality')?.visible && (
                    <TableHead className="text-center">Quality</TableHead>
                  )}

                  {columns.find((c) => c.id === 'storageLocation')?.visible && (
                    <TableHead>Storage Bay</TableHead>
                  )}

                  {columns.find((c) => c.id === 'status')?.visible && (
                    <TableHead>Status</TableHead>
                  )}

                  {columns.find((c) => c.id === 'sync')?.visible && (
                    <TableHead>Sync State</TableHead>
                  )}

                  {columns.find((c) => c.id === 'updated')?.visible && (
                    <TableHead>Updated</TableHead>
                  )}

                  {columns.find((c) => c.id === 'action')?.visible && (
                    <TableHead className="text-right w-16">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="py-8 text-center text-ink-muted">
                      <p className="text-[13px] font-mono">No matching inventory batches found.</p>
                      <button
                        onClick={() =>
                          setFilters({
                            savedView: 'all',
                            search: '',
                            statuses: [],
                            village: '',
                            dateFrom: '',
                            dateTo: '',
                          })
                        }
                        className="mt-2 text-[12px] text-accent underline font-semibold"
                      >
                        Reset active filters
                      </button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((b, idx) => {
                    const isSelectedRow = idx === selectedIndex;
                    const isChecked = selectedCodes.includes(b.code);
                    const rowHeightClass =
                      density === 'compact'
                        ? 'h-[32px] text-[12px]'
                        : 'h-[44px] text-[13px]';

                    return (
                      <TableRow
                        key={b.code}
                        onClick={() => {
                          setSelectedBatchCode(b.code);
                          setIsDrawerOpen(true);
                        }}
                        className={cn(
                          'cursor-pointer select-none transition-colors border-b border-rule',
                          rowHeightClass,
                          isSelectedRow
                            ? 'bg-accent/10 border-l-2 border-l-accent font-semibold'
                            : 'hover:bg-bg-sunken/40'
                        )}
                      >
                        {/* Leading Checkbox */}
                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 text-center sticky left-0 bg-surface z-10"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectRow(b.code)}
                            aria-label={`Select ${b.code}`}
                            className="rounded-[2px] border-rule text-accent accent-accent cursor-pointer"
                          />
                        </TableCell>

                        {/* Sticky Batch Code */}
                        {columns.find((c) => c.id === 'code')?.visible && (
                          <TableCell className="font-mono font-bold text-ink tabular-nums sticky left-10 bg-surface z-10">
                            {b.code}
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'product')?.visible && (
                          <TableCell className="font-medium text-ink truncate max-w-[140px]">
                            {b.product}
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'collector')?.visible && (
                          <TableCell className="text-ink-muted truncate max-w-[130px]">
                            {b.collector}
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'village')?.visible && (
                          <TableCell className="text-ink-muted truncate max-w-[120px]">
                            {b.village}
                          </TableCell>
                        )}

                        {/* Inline collection weight edit (Rule 8) */}
                        {columns.find((c) => c.id === 'collectionKg')?.visible && (
                          <TableCell numeric className="font-semibold text-ink">
                            <InlineEditableCell
                              value={b.collectionKg}
                              type="number"
                              unit="kg"
                              hasEditIndicator={b.hasInlineEdit}
                              onCommit={(val) => handleInlineCollectionKgCommit(b.code, val)}
                            />
                          </TableCell>
                        )}

                        {/* Inline received weight edit (Rule 8) */}
                        {columns.find((c) => c.id === 'receivedKg')?.visible && (
                          <TableCell numeric className="font-mono text-[13px] text-ink">
                            {b.receivedKg !== null ? (
                              <InlineEditableCell
                                value={b.receivedKg}
                                type="number"
                                unit="kg"
                                hasEditIndicator={b.hasInlineEdit}
                                onCommit={(val) => handleInlineReceivedKgCommit(b.code, val)}
                              />
                            ) : (
                              <span className="text-ink-subtle font-mono">—</span>
                            )}
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'deltaKg')?.visible && (
                          <TableCell numeric>
                            {b.deltaKg !== null ? (
                              <span
                                className={cn(
                                  'font-mono tabular-nums font-medium',
                                  b.deltaKg < -1.5
                                    ? 'text-danger font-bold'
                                    : b.deltaKg < 0
                                    ? 'text-warning'
                                    : 'text-success'
                                )}
                              >
                                {b.deltaKg > 0 ? `+${b.deltaKg.toFixed(1)}` : `${b.deltaKg.toFixed(1)}`} kg
                              </span>
                            ) : (
                              <span className="text-ink-subtle font-mono">—</span>
                            )}
                          </TableCell>
                        )}

                        {/* Inline quality edit (Rule 8) */}
                        {columns.find((c) => c.id === 'quality')?.visible && (
                          <TableCell className="text-center font-mono">
                            <InlineEditableCell
                              value={b.qualityGrade}
                              type="grade"
                              options={['A', 'B', 'C']}
                              hasEditIndicator={b.hasInlineEdit}
                              onCommit={(val) => handleInlineQualityCommit(b.code, val)}
                            />
                          </TableCell>
                        )}

                        {/* Inline storage location edit (Rule 8) */}
                        {columns.find((c) => c.id === 'storageLocation')?.visible && (
                          <TableCell className="font-mono text-[11px] text-ink-muted truncate max-w-[140px]">
                            <InlineEditableCell
                              value={b.storageLocation}
                              type="text"
                              hasEditIndicator={b.hasInlineEdit}
                              onCommit={(val) => handleInlineLocationCommit(b.code, val)}
                            />
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'status')?.visible && (
                          <TableCell>
                            {b.status === 'Available' ? (
                              <VerifiedBadge size="sm" />
                            ) : (
                              <StatusBadge variant={b.statusVariant}>
                                {b.status}
                              </StatusBadge>
                            )}
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'sync')?.visible && (
                          <TableCell>
                            <SyncStatusBadge state={b.syncState || 'synced'} />
                          </TableCell>
                        )}

                        {columns.find((c) => c.id === 'updated')?.visible && (
                          <TableCell className="font-mono text-[11px] text-ink-subtle whitespace-nowrap">
                            {b.updatedAt}
                          </TableCell>
                        )}

                        {/* Row Action Menu (3 actions per Rule 9) */}
                        {columns.find((c) => c.id === 'action')?.visible && (
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <RowActionMenu
                              ariaLabel={`Actions for ${b.code}`}
                              actions={[
                                {
                                  label: 'Verify arrival',
                                  onClick: () => {
                                    setSelectedBatchCode(b.code);
                                    setIsDrawerOpen(true);
                                  },
                                },
                                {
                                  label: 'Quarantine batch',
                                  variant: 'danger',
                                  onClick: () => {
                                    setBatches((prev) =>
                                      prev.map((item) =>
                                        item.code === b.code
                                          ? { ...item, status: 'Quarantined', statusVariant: 'danger' }
                                          : item
                                      )
                                    );
                                    setActiveToast({
                                      id: `quarantine-${b.code}`,
                                      variant: 'warning',
                                      title: `Batch ${b.code} moved to Quarantine Bay`,
                                    });
                                  },
                                },
                                {
                                  label: 'Print storage tag',
                                  onClick: () =>
                                    window.open(`/collection/tag/${b.code.replace('#', '')}`, '_blank'),
                                },
                              ]}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination & Footer Shortcuts Hint (Rule 1 & Rule 11) */}
        <div className="flex flex-col sm:flex-row items-center justify-between border border-rule rounded-[4px] bg-surface px-3.5 py-2 text-[12px] shadow-none gap-2">
          <span className="font-mono text-ink-muted text-[11px]">
            Showing {filteredBatches.length} of {batches.length} batches · {density} mode
          </span>

          {/* 3 Most common shortcuts hint row per Rule 1 */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-subtle select-none">
            <span>
              <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">j/k</kbd> Move
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">Enter</kbd> Open
            </span>
            <span>·</span>
            <span>
              <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">/</kbd> Search
            </span>
            <span>·</span>
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="text-ink hover:text-accent underline font-semibold"
            >
              <kbd className="px-1 border border-rule bg-bg-sunken text-ink font-semibold">?</kbd> All
            </button>
          </div>
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
              <div className="flex items-center gap-1.5">
                {batches.find((b) => b.code === selectedBatchCode)?.status === 'Available' ? (
                  <VerifiedBadge />
                ) : (
                  <StatusBadge variant="warning">In Review</StatusBadge>
                )}
                <SyncStatusBadge state="queued" />
              </div>
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

                {/* 3. Discrepancy Card Artifact */}
                <DiscrepancyCardArtifact
                  collectionKg={collectionKg}
                  receivedKg={arrivalWeight}
                  productName="Mahua · dried"
                  configuredTolerancePercent={1.5}
                  supervisorNote={supervisorNote}
                  onSupervisorNoteChange={setSupervisorNote}
                  showSupervisorTextarea={true}
                />

                {/* Live Delta Line */}
                <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken text-center text-[12px] font-mono font-medium text-ink select-none">
                  Expected unchanged · Available +{arrivalWeight.toFixed(1)} kg
                </div>
              </>
            ) : (
              /* Monotonic Audit Timeline Tab */
              <div className="space-y-3">
                <AuditTimelineArtifact
                  events={auditTimeline}
                  batchCode={selectedBatchCode}
                />
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

      {/* Bulk Action Bar (Rule 6) */}
      <BulkActionBar
        selectedCount={selectedCodes.length}
        discrepancyCount={selectedDiscrepancies}
        onApproveAll={handleBulkApprove}
        onHoldAll={handleBulkHold}
        onClear={() => setSelectedCodes([])}
      />

      {/* Keyboard Shortcuts Drawer (Rule 1) */}
      <KeyboardShortcutsDrawer
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />

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
