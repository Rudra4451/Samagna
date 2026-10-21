'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { ShortCodeLookup } from '../../components/ui/ShortCodeLookup';
import { getDatabase, PendingSyncItem } from '../../lib/db';
import { DEMO_PRODUCT, DEMO_COLLECTORS, DEMO_FACILITATOR } from '../../demo/seed';
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
import { NumberInput } from '../../components/ui/Input';
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
import { useOffline } from '../../lib/useOffline';
import { SyncState } from '../../lib/db';
import { cn } from '../../lib/utils';
import {
  Scale,
  RefreshCw,
  Camera,
  Printer,
  ChevronRight,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  SlidersHorizontal,
  Info,
  Trash2,
  Check,
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

interface QueueItem {
  code: string;
  collector: string;
  village: string;
  product: string;
  estQty: number;
  qualityGrade: 'A' | 'B' | 'C';
  requestedAt: string;
  requestedDateIso: string;
  status: 'Pending' | 'Scheduled' | 'Collected' | 'In Review' | 'Quarantined';
  statusVariant: StatusVariant;
  syncState?: SyncState;
  hasInlineEdit?: boolean;
}

const DEFAULT_COLLECTION_COLUMNS: ColumnConfig[] = [
  { id: 'code', label: 'Batch Code', visible: true },
  { id: 'collector', label: 'Collector', visible: true },
  { id: 'village', label: 'Village', visible: true },
  { id: 'product', label: 'Product', visible: true },
  { id: 'estQty', label: 'Est. Weight', visible: true },
  { id: 'quality', label: 'Quality', visible: true },
  { id: 'requested', label: 'Requested', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'sync', label: 'Sync State', visible: true },
  { id: 'action', label: 'Actions', visible: true },
];

const COLLECTION_STATUSES = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Collected', label: 'Collected' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Quarantined', label: 'Quarantined' },
];

const COLLECTION_VILLAGES = ['Badagaon, Karanjia', 'Kadamdiha, Karanjia', 'Sundargarh'];

export default function CollectionManagerPage() {
  const { isOffline, pendingRecords, setOffline } = useAppStore();

  // 6 Seed rows across statuses with enhanced metadata
  const [queueItems, setQueueItems] = useState<QueueItem[]>([
    {
      code: '#BS-402',
      collector: 'Raimati Soren',
      village: 'Badagaon, Karanjia',
      product: 'Dried Mahua Flowers',
      estQty: 100.0,
      qualityGrade: 'A',
      requestedAt: '14 Mar · 09:15 AM',
      requestedDateIso: '2025-03-14',
      status: 'Pending',
      statusVariant: 'warning',
      syncState: 'queued',
    },
    {
      code: '#BS-401',
      collector: 'Gura Marndi',
      village: 'Badagaon, Karanjia',
      product: 'Dried Mahua Flowers',
      estQty: 35.0,
      qualityGrade: 'A',
      requestedAt: '14 Mar · 09:40 AM',
      requestedDateIso: '2025-03-14',
      status: 'Scheduled',
      statusVariant: 'neutral',
      syncState: 'draft',
    },
    {
      code: '#BS-400',
      collector: 'Sombari Murmu',
      village: 'Kadamdiha, Karanjia',
      product: 'Dried Mahua Flowers',
      estQty: 25.0,
      qualityGrade: 'A',
      requestedAt: '14 Mar · 10:05 AM',
      requestedDateIso: '2025-03-14',
      status: 'Collected',
      statusVariant: 'info',
      syncState: 'synced',
    },
    {
      code: '#BS-399',
      collector: 'Dulari Hansdah',
      village: 'Badagaon, Karanjia',
      product: 'Dried Mahua Flowers',
      estQty: 60.0,
      qualityGrade: 'B',
      requestedAt: '13 Mar · 04:30 PM',
      requestedDateIso: '2025-03-13',
      status: 'In Review',
      statusVariant: 'warning',
      syncState: 'synced',
    },
    {
      code: '#BS-398',
      collector: 'Biren Majhi',
      village: 'Kadamdiha, Karanjia',
      product: 'Dried Mahua Flowers',
      estQty: 45.0,
      qualityGrade: 'A',
      requestedAt: '13 Mar · 02:15 PM',
      requestedDateIso: '2025-03-13',
      status: 'Collected',
      statusVariant: 'success',
      syncState: 'synced',
    },
    {
      code: '#BS-397',
      collector: 'Salge Tudu',
      village: 'Sundargarh',
      product: 'Dried Mahua Flowers',
      estQty: 80.0,
      qualityGrade: 'C',
      requestedAt: '12 Mar · 11:20 AM',
      requestedDateIso: '2025-03-12',
      status: 'Quarantined',
      statusVariant: 'danger',
      syncState: 'conflict',
    },
  ]);

  // Persisted Filters (Rule 3)
  const [filters, setFilters] = useState<ManagerFiltersState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('banasetu_filter_collection');
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
      localStorage.setItem('banasetu_filter_collection', JSON.stringify(filters));
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
        const saved = localStorage.getItem('banasetu_cols_collection');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_COLLECTION_COLUMNS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('banasetu_cols_collection', JSON.stringify(columns));
    }
  }, [columns]);

  // Bulk Selection state (Rule 6)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Offline queue state
  const [offlineQueue, setOfflineQueue] = useState<PendingSyncItem[]>([
    {
      id: 'BS-400',
      code: '#BS-400',
      collector: 'Gura Marndi',
      product: 'Dried Mahua Flowers',
      quantityKg: 35.0,
      amount: 1470.0,
      timestamp: '14 Mar 2025 · 09:40 AM',
      data: { tare: 1.5, gross: 36.5, grade: 'A' },
    },
    {
      id: 'BS-399',
      code: '#BS-399',
      collector: 'Sombari Murmu',
      product: 'Dried Mahua Flowers',
      quantityKg: 25.0,
      amount: 1050.0,
      timestamp: '14 Mar 2025 · 10:15 AM',
      data: { tare: 1.2, gross: 26.2, grade: 'A' },
    },
  ]);

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedQueueCode, setSelectedQueueCode] = useState('#BS-402');
  const [individualReceiptToggle, setIndividualReceiptToggle] = useState(true);
  const [grossWeight, setGrossWeight] = useState(104.2);
  const [tareWeight, setTareWeight] = useState(4.2);
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [acceptedQty, setAcceptedQty] = useState(100.0);
  const [rejectedQty, setRejectedQty] = useState(0.0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [weightError, setWeightError] = useState<string | null>(null);

  // Toast state
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

  // Computed net weight: tabular and read-only
  const computedNet = Number((grossWeight - tareWeight).toFixed(2));
  const ratePerKg = DEMO_PRODUCT.ratePerKg; // ₹42
  const computedTotal = (acceptedQty * ratePerKg).toLocaleString('en-IN');

  // Generate deterministic QR code on mount
  useEffect(() => {
    async function genQR() {
      try {
        const url = await QRCode.toDataURL('BANASETU-BS-402-MAYURBHANJ-TDCCOL', {
          width: 80,
          margin: 1,
          color: {
            dark: '#1F1A14',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
    genQR();
  }, []);

  // Sync from IndexedDB (Dexie)
  useEffect(() => {
    async function loadDexie() {
      if (typeof window === 'undefined') return;
      try {
        const db = getDatabase();
        const records = await db.pendingSync.toArray();
        if (records.length > 0) {
          setOfflineQueue(records);
        }
      } catch (e) {
        console.warn('Dexie pendingSync read error:', e);
      }
    }
    loadDexie();
  }, []);

  // Open drawer for a specific queue item
  const handleOpenRecordDrawer = (code: string) => {
    setSelectedQueueCode(code);
    setShowDiscardPrompt(false);
    setIsDrawerOpen(true);
  };

  const handleAttemptCloseDrawer = () => {
    const hasUnsavedChanges = grossWeight !== 104.2 || tareWeight !== 4.2 || qualityGrade !== 'A';
    if (hasUnsavedChanges) {
      setShowDiscardPrompt(true);
    } else {
      setIsDrawerOpen(false);
    }
  };

  // Filtered items (Rules 2 & 3)
  const filteredItems = queueItems.filter((item) => {
    // Search query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const match =
        item.code.toLowerCase().includes(q) ||
        item.collector.toLowerCase().includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (filters.statuses.length > 0) {
      if (!filters.statuses.includes(item.status)) return false;
    }

    // Village filter
    if (filters.village) {
      if (item.village !== filters.village) return false;
    }

    // Date range
    if (filters.dateFrom) {
      if (item.requestedDateIso < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      if (item.requestedDateIso > filters.dateTo) return false;
    }

    return true;
  });

  // Hotkeys Hook (Rule 1: Keyboard-first)
  const { selectedIndex, isShortcutsOpen, setIsShortcutsOpen } = useHotkeys({
    rowCount: filteredItems.length,
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
        return true;
      }
      return false;
    },
    onOpenRow: (idx) => {
      if (idx >= 0 && idx < filteredItems.length) {
        handleOpenRecordDrawer(filteredItems[idx].code);
      }
    },
    onSync: () => {
      syncNowAction.execute();
    },
  });

  // Bulk Selection & Action Handlers (Rule 6)
  const toggleSelectAll = () => {
    if (selectedCodes.length === filteredItems.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(filteredItems.map((i) => i.code));
    }
  };

  const toggleSelectRow = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Discrepancy count among selected rows
  const selectedDiscrepancies = filteredItems.filter(
    (i) => selectedCodes.includes(i.code) && (i.status === 'In Review' || i.status === 'Quarantined')
  ).length;

  const handleBulkApprove = () => {
    if (selectedDiscrepancies > 0) return;
    setQueueItems((prev) =>
      prev.map((item) =>
        selectedCodes.includes(item.code)
          ? { ...item, status: 'Collected', statusVariant: 'success', syncState: 'queued' }
          : item
      )
    );
    setActiveToast({
      id: `bulk-approve-${Date.now()}`,
      variant: 'success',
      title: `${selectedCodes.length} collection lots approved and queued for dispatch`,
    });
    setSelectedCodes([]);
  };

  const handleBulkHold = () => {
    setQueueItems((prev) =>
      prev.map((item) =>
        selectedCodes.includes(item.code)
          ? { ...item, status: 'In Review', statusVariant: 'warning' }
          : item
      )
    );
    setActiveToast({
      id: `bulk-hold-${Date.now()}`,
      variant: 'warning',
      title: `${selectedCodes.length} collection lots placed on hold for inspection`,
    });
    setSelectedCodes([]);
  };

  // Inline correction handlers (Rule 8)
  const handleInlineWeightCommit = (code: string, newWeight: number | string) => {
    const num = typeof newWeight === 'number' ? newWeight : parseFloat(String(newWeight));
    if (isNaN(num) || num <= 0) return;
    setQueueItems((prev) =>
      prev.map((item) =>
        item.code === code ? { ...item, estQty: num, hasInlineEdit: true } : item
      )
    );
    setActiveToast({
      id: `inline-wt-${Date.now()}`,
      variant: 'info',
      title: `Corrected ${code} weight to ${num.toFixed(1)} kg`,
      description: 'Audit entry logged for collection manager override.',
    });
  };

  const handleInlineQualityCommit = (code: string, newQuality: string | number) => {
    setQueueItems((prev) =>
      prev.map((item) =>
        item.code === code
          ? { ...item, qualityGrade: newQuality as any, hasInlineEdit: true }
          : item
      )
    );
    setActiveToast({
      id: `inline-ql-${Date.now()}`,
      variant: 'info',
      title: `Updated ${code} quality grade to Grade ${newQuality}`,
      description: 'Audit entry logged for collection manager override.',
    });
  };

  // 1. Refresh Queue Action
  const refreshQueueAction = useAction({
    name: 'refresh-pickup-queue',
    showToast: (t) => setActiveToast(t),
    receipt: {
      variant: 'info',
      title: 'Pickup queue refreshed',
      description: 'Synchronized with local field cache.',
    },
    onExecute: () => {
      setLastFetched(new Date());
    },
  });

  // 2. Sync Now Action (Semi-reversible with inline confirmation)
  const syncNowAction = useAction({
    name: 'sync-offline-queue',
    showToast: (t) => setActiveToast(t),
    receipt: {
      variant: 'success',
      title: 'Cloud handshake confirmed',
      description: 'Queued collection records promoted to central ledger with audit hash.',
    },
    onExecute: async () => {
      if (isOffline) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: 'Still offline — will retry',
          description: 'Network disconnected. Records remain safely stored in local IndexedDB.',
        });
        return;
      }

      try {
        const db = getDatabase();
        await db.pendingSync.clear();
        setOfflineQueue([]);
      } catch (e) {
        setOfflineQueue([]);
      }
    },
  });

  // 3. Remove Offline Item Action (INTERACTION.md Rule 8 - Mandatory Undo Scenario 1)
  const removeOfflineItemAction = useAction({
    name: 'remove-offline-item',
    undoable: true,
    undoLabel: 'Undo',
    undoDurationMs: 6000,
    showToast: (t) => setActiveToast(t),
    capturePreviousState: () => ({ queue: [...offlineQueue] }),
    receipt: {
      variant: 'info',
      title: (code) => `Item ${code} removed from offline queue`,
      description: 'Record removed from local sync buffer. Click Undo within 6s to restore.',
    },
    onExecute: async ({ args }) => {
      const idToRemove = args[0] as string;
      const targetItem = offlineQueue.find((i) => i.id === idToRemove);
      const code = targetItem?.code || idToRemove;
      setOfflineQueue((prev) => prev.filter((i) => i.id !== idToRemove));
      try {
        const db = getDatabase();
        await db.pendingSync.delete(idToRemove);
      } catch (e) {
        console.warn('Dexie delete error:', e);
      }
      return code;
    },
    onUndo: async ({ previousState }) => {
      if (previousState?.queue) {
        setOfflineQueue(previousState.queue);
        try {
          const db = getDatabase();
          for (const item of previousState.queue) {
            await db.pendingSync.put(item);
          }
        } catch (e) {
          console.warn('Dexie restore error:', e);
        }
      }
    },
  });

  // 4. Confirm Collection Action (Enforces idempotency & receipt-of-action)
  const confirmCollectionAction = useAction({
    name: 'confirm-collection',
    showToast: (t) => setActiveToast(t),
    onExecute: async ({ idempotencyKey, args }) => {
      const forceOffline = args[0] === true;
      if (grossWeight <= tareWeight) {
        setWeightError('Tare weight cannot equal or exceed gross weight.');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'danger',
          title: 'Tare weight exceeds gross weight · Check scale calibration',
          description: '',
        });
        throw new Error('Tare weight exceeds gross weight');
      }
      setWeightError(null);

      const shouldSaveOffline = forceOffline || isOffline;
      const newRecord: PendingSyncItem = {
        id: `BS-${Math.floor(403 + Math.random() * 50)}`,
        code: selectedQueueCode,
        collector: 'Raimati Soren',
        product: DEMO_PRODUCT.name,
        quantityKg: acceptedQty,
        amount: acceptedQty * ratePerKg,
        timestamp: '14 Mar 2025 · Just now',
        data: {
          gross: grossWeight,
          tare: tareWeight,
          net: computedNet,
          grade: qualityGrade,
          individualReceipt: individualReceiptToggle,
          idempotencyKey,
        },
      };

      if (shouldSaveOffline) {
        try {
          const db = getDatabase();
          await db.pendingSync.put(newRecord);
          await db.syncQueue.put({
            local_id: `ULID-${Date.now()}`,
            batch_code: selectedQueueCode,
            entity: 'collection',
            action: 'create',
            actor: { id: 'COL-MGR-02', name: 'R. Mohanty', role: 'Collection Manager' },
            payload: newRecord,
            state: 'queued',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            retryCount: 0,
            approxSizeBytes: 3500,
          });
        } catch (err) {
          console.warn('Dexie save offline error:', err);
        }

        setOfflineQueue((prev) => [newRecord, ...prev]);
        setQueueItems((prev) =>
          prev.map((item) =>
            item.code === selectedQueueCode
              ? { ...item, status: 'Collected', statusVariant: 'info', syncState: 'queued' }
              : item
          )
        );
        setIsDrawerOpen(false);
        setShowDiscardPrompt(false);

        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: `Saved offline · ${selectedQueueCode}`,
          description: 'Network offline. Record queued in device IndexedDB pending sync.',
        });
      } else {
        setQueueItems((prev) =>
          prev.map((item) =>
            item.code === selectedQueueCode
              ? { ...item, status: 'Collected', statusVariant: 'info' }
              : item
          )
        );

        setIsDrawerOpen(false);
        setShowDiscardPrompt(false);

        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'success',
          title: `Collection confirmed · ${selectedQueueCode}`,
          description: `Batch verified (${acceptedQty} kg net). Promoted to pending_verification.`,
        });
      }
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top of Content Header with Top-Right Primary Action (Rule 2) */}
        <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-[28px] font-semibold text-ink leading-tight">
              Collection
            </h1>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted mt-1 select-none">
              Today · 14 Mar 2025 · Mayurbhanj
            </div>
          </div>
          {/* Primary Action Placement: Top-right aligned with page title row */}
          <Button
            variant="primary"
            onClick={() => handleOpenRecordDrawer('#BS-402')}
            className="self-start sm:self-auto shadow-none"
          >
            Record collection
          </Button>
        </div>

        {/* 2-Column Split: 2/3 Left, 1/3 Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ========================================================
              LEFT COLUMN (2/3): Pickup queue Table & Pagination
             ======================================================== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Rule 2 & 3: Global Search, Saved Views, Filters & Density */}
            <div className="border border-rule rounded-[4px] bg-surface p-3.5 shadow-none">
              <ManagerFilterBar
                roleKey="collection"
                availableStatuses={COLLECTION_STATUSES}
                availableVillages={COLLECTION_VILLAGES}
                columns={columns}
                onColumnsChange={setColumns}
                density={density}
                onDensityChange={setDensity}
                filters={filters}
                onFiltersChange={setFilters}
                searchInputRef={searchInputRef}
                totalCount={queueItems.length}
                filteredCount={filteredItems.length}
                lastRefreshed={lastFetched}
                onRefresh={() => refreshQueueAction.execute()}
              />
            </div>

            {/* Table Container with Sticky Header & First Column (Rules 4, 5, 8, 9, 10) */}
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
                            filteredItems.length > 0 &&
                            selectedCodes.length === filteredItems.length
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

                      {columns.find((c) => c.id === 'collector')?.visible && (
                        <TableHead>Collector</TableHead>
                      )}

                      {columns.find((c) => c.id === 'village')?.visible && (
                        <TableHead>Village</TableHead>
                      )}

                      {columns.find((c) => c.id === 'product')?.visible && (
                        <TableHead>Product</TableHead>
                      )}

                      {columns.find((c) => c.id === 'estQty')?.visible && (
                        <TableHead numeric>Est. Qty</TableHead>
                      )}

                      {columns.find((c) => c.id === 'quality')?.visible && (
                        <TableHead className="text-center">Quality</TableHead>
                      )}

                      {columns.find((c) => c.id === 'requested')?.visible && (
                        <TableHead>Requested</TableHead>
                      )}

                      {columns.find((c) => c.id === 'status')?.visible && (
                        <TableHead>Status</TableHead>
                      )}

                      {columns.find((c) => c.id === 'sync')?.visible && (
                        <TableHead>Sync State</TableHead>
                      )}

                      {columns.find((c) => c.id === 'action')?.visible && (
                        <TableHead className="text-right w-16">Action</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="py-8 text-center text-ink-muted">
                          <p className="text-[13px] font-mono">No matching collection batches found.</p>
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
                      filteredItems.map((row, idx) => {
                        const isSelectedRow = idx === selectedIndex;
                        const isChecked = selectedCodes.includes(row.code);
                        const rowHeightClass =
                          density === 'compact'
                            ? 'h-[32px] text-[12px]'
                            : 'h-[44px] text-[13px]';

                        return (
                          <TableRow
                            key={row.code}
                            onClick={() => handleOpenRecordDrawer(row.code)}
                            className={cn(
                              'cursor-pointer select-none transition-colors border-b border-rule',
                              rowHeightClass,
                              isSelectedRow
                                ? 'bg-accent/10 border-l-2 border-l-accent font-semibold'
                                : 'hover:bg-bg-sunken/40'
                            )}
                          >
                            {/* Checkbox column */}
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 text-center sticky left-0 bg-surface z-10"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectRow(row.code)}
                                aria-label={`Select ${row.code}`}
                                className="rounded-[2px] border-rule text-accent accent-accent cursor-pointer"
                              />
                            </TableCell>

                            {/* Sticky Batch Code Column */}
                            {columns.find((c) => c.id === 'code')?.visible && (
                              <TableCell className="font-mono font-bold text-ink tabular-nums sticky left-10 bg-surface z-10">
                                {row.code}
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'collector')?.visible && (
                              <TableCell className="font-medium text-ink truncate max-w-[140px]">
                                {row.collector}
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'village')?.visible && (
                              <TableCell className="text-ink-muted truncate max-w-[130px]">
                                {row.village}
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'product')?.visible && (
                              <TableCell className="text-ink-muted truncate max-w-[140px]">
                                {row.product}
                              </TableCell>
                            )}

                            {/* Inline correction for Weight (Rule 8) */}
                            {columns.find((c) => c.id === 'estQty')?.visible && (
                              <TableCell numeric className="font-semibold text-ink">
                                <InlineEditableCell
                                  value={row.estQty}
                                  type="number"
                                  unit="kg"
                                  hasEditIndicator={row.hasInlineEdit}
                                  onCommit={(val) => handleInlineWeightCommit(row.code, val)}
                                />
                              </TableCell>
                            )}

                            {/* Inline correction for Quality (Rule 8) */}
                            {columns.find((c) => c.id === 'quality')?.visible && (
                              <TableCell className="text-center font-mono">
                                <InlineEditableCell
                                  value={row.qualityGrade}
                                  type="grade"
                                  options={['A', 'B', 'C']}
                                  hasEditIndicator={row.hasInlineEdit}
                                  onCommit={(val) => handleInlineQualityCommit(row.code, val)}
                                />
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'requested')?.visible && (
                              <TableCell className="font-mono text-ink-subtle text-[11px] whitespace-nowrap">
                                {row.requestedAt}
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'status')?.visible && (
                              <TableCell>
                                <StatusBadge variant={row.statusVariant}>
                                  {row.status}
                                </StatusBadge>
                              </TableCell>
                            )}

                            {columns.find((c) => c.id === 'sync')?.visible && (
                              <TableCell>
                                <SyncStatusBadge state={row.syncState || 'synced'} />
                              </TableCell>
                            )}

                            {/* Row Action Menu (3 actions per Rule 9) */}
                            {columns.find((c) => c.id === 'action')?.visible && (
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <RowActionMenu
                                  ariaLabel={`Actions for ${row.code}`}
                                  actions={[
                                    {
                                      label: 'Record weighment',
                                      onClick: () => handleOpenRecordDrawer(row.code),
                                    },
                                    {
                                      label: 'Print batch tag',
                                      onClick: () =>
                                        window.open(`/collection/tag/${row.code.replace('#', '')}`, '_blank'),
                                    },
                                    {
                                      label: 'View A5 receipt',
                                      onClick: () =>
                                        window.open(
                                          `/collection/receipt/${row.code.replace('#', '')}`,
                                          '_blank'
                                        ),
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
                Showing {filteredItems.length} of {queueItems.length} records · {density} mode
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
          </div>

          {/* ========================================================
              RIGHT COLUMN (1/3): Season readiness & Offline queue
             ======================================================== */}
          <div className="space-y-4">
            {/* Card 1: Season readiness */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Season readiness</SectionLabel>
                  <StatusBadge variant="warning">Nearly ready</StatusBadge>
                </div>
                <CardTitle className="text-[17px]">Mahua · Sundargarh</CardTitle>
                <CardDescription>Similipal Buffer & Forest Fringe Zone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-[13px]">
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2 border-b border-rule pb-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-accent shrink-0 mt-1.5" />
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-ink-muted block">
                        12 Mar 2025
                      </span>
                      <span className="text-ink leading-snug">
                        Tree canopy flowering observed at 65% density across Similipal buffer forest fringe.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 border-b border-rule pb-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-accent shrink-0 mt-1.5" />
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-ink-muted block">
                        10 Mar 2025
                      </span>
                      <span className="text-ink leading-snug">
                        Night temperatures averaged 19.2°C; ground drying conditions verified optimal.
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-none bg-accent shrink-0 mt-1.5" />
                    <div>
                      <span className="font-mono text-[11px] font-semibold text-ink-muted block">
                        08 Mar 2025
                      </span>
                      <span className="text-ink leading-snug">
                        Forest protection committees completed fireline clearing around village collection points.
                      </span>
                    </div>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="bg-bg-sunken/40 text-[12px] text-ink-subtle">
                Forecasts are estimates. Verify locally before scheduling.
              </CardFooter>
            </Card>

            {/* Card 2: Offline queue */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Offline queue</SectionLabel>
                  <StatusBadge variant={offlineQueue.length > 0 ? 'warning' : 'success'}>
                    {offlineQueue.length} pending sync
                  </StatusBadge>
                </div>
                <CardTitle className="text-[17px]">Local Device Storage</CardTitle>
                <CardDescription>IndexedDB Cached Submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-[13px]">
                {offlineQueue.length === 0 ? (
                  <div className="py-4 text-center text-ink-muted text-[13px]">
                    All field records synchronized with Baripada cloud server.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {offlineQueue.map((item) => (
                      <div
                        key={item.id}
                        className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/40 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono text-[13px] font-bold text-ink">
                            {item.code}
                          </div>
                          <div className="text-[11px] font-mono text-ink-subtle">
                            {item.timestamp}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-mono tabular-nums text-[13px] font-medium text-ink">
                              {item.quantityKg.toFixed(1)} kg
                            </span>
                            <span className="text-[10px] font-mono text-warning block">
                              AWAITING SYNC
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOfflineItemAction.execute(item.id)}
                            disabled={removeOfflineItemAction.isDisabled}
                            title="Remove from offline queue (undoable)"
                            className="p-1 rounded-[2px] text-ink-subtle hover:text-danger hover:bg-bg-sunken transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between bg-bg-sunken/30">
                <span className="text-[11px] font-mono text-ink-subtle">
                  STATUS: {isOffline ? 'OFFLINE SIMULATED' : 'ONLINE LINK'}
                </span>
                <button
                  type="button"
                  onClick={() => syncNowAction.execute()}
                  disabled={syncNowAction.isDisabled}
                  className="h-[36px] px-3.5 rounded-[4px] border border-rule bg-surface text-ink text-[13px] font-medium hover:border-ink-subtle hover:bg-bg-sunken flex items-center gap-1.5 focus:outline-2 focus:outline-accent disabled:opacity-40"
                >
                  <RefreshCw size={16} strokeWidth={1.5} />
                  <span>Sync now</span>
                </button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* ========================================================
          CORE SCREEN: Record Collection Drawer (480px width)
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
            <div className="flex items-center justify-between mb-1">
              <SectionLabel>Field Intake Handshake</SectionLabel>
              <SyncStatusBadge state={selectedQueueCode === '#BS-402' ? 'queued' : 'synced'} />
            </div>
            <DrawerTitle>Record collection · {selectedQueueCode}</DrawerTitle>
            <DrawerDescription>
              Direct weighment calibration for Van Dhan collection batch
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody className="p-4 space-y-5 text-[14px]">
            {/* Section: Collector */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-2.5">
              <SectionLabel>Collector Details</SectionLabel>
              <div className="flex justify-between border-b border-rule pb-1.5">
                <span className="text-ink-muted">Name:</span>
                <span className="font-medium text-ink">Raimati Soren (OR-MAY-KRN-0842)</span>
              </div>
              <div className="flex justify-between border-b border-rule pb-1.5">
                <span className="text-ink-muted">Village / GP:</span>
                <span className="text-ink">Badagaon, Karanjia GP</span>
              </div>

              {/* Individual receipt toggle (on by default) */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={individualReceiptToggle}
                    onChange={(e) => setIndividualReceiptToggle(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-[2px] border border-rule text-accent accent-accent cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-ink text-[13px] block">
                      Issue individual weighment receipt
                    </span>
                    <span className="text-[12px] text-ink-subtle block">
                      Recommended to prevent aggregation errors
                    </span>
                  </div>
                </label>
                <div className="mt-2 pt-2 border-t border-rule flex items-center justify-between">
                  <span className="text-[11px] font-mono text-ink-muted">A5 Collector Sheet:</span>
                  <Link
                    href={`/collection/receipt/${selectedQueueCode.replace('#', '')}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[12px] text-accent hover:underline font-medium"
                  >
                    <span>View / Print A5 Receipt</span>
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Section: Weight & Quality */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
              <SectionLabel>Weight & Quality Calibration</SectionLabel>

              {/* Three NumberInputs side-by-side: Gross, Tare, Net */}
              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                    Gross (kg)
                  </label>
                  <NumberInput
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(Number(e.target.value))}
                    step={0.1}
                    unit="kg"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="tare-weight-input" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                    Tare (kg)
                  </label>
                  <NumberInput
                    id="tare-weight-input"
                    value={tareWeight}
                    onChange={(e) => {
                      setTareWeight(Number(e.target.value));
                      if (weightError) setWeightError(null);
                    }}
                    error={Boolean(weightError)}
                    errorText={weightError || undefined}
                    step={0.1}
                    unit="kg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                    Net (kg)
                  </label>
                  {/* Net is computed, read-only, tabular, with a 1px underline only */}
                  <div className="h-[36px] flex items-center justify-end px-1 border-0 border-b border-rule bg-transparent">
                    <span className="font-heading text-[16px] font-bold tabular-nums text-accent leading-none">
                      {computedNet.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-ink-muted uppercase ml-1 font-mono font-medium">
                      kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Grade Segmented Control (A / B / C as 3 rectangular buttons) */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                  Quality Grade Standard
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

              {/* Accepted Qty and Rejected Qty Inputs */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                    Accepted Qty
                  </label>
                  <NumberInput
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(Number(e.target.value))}
                    unit="kg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                    Rejected Qty
                  </label>
                  <NumberInput
                    value={rejectedQty}
                    onChange={(e) => setRejectedQty(Number(e.target.value))}
                    unit="kg"
                  />
                </div>
              </div>

              {/* One-line calc readout: Accepted 100 kg × ₹42/kg = ₹4,200 */}
              <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/50 text-[13px] font-mono tabular-nums text-ink flex items-center justify-between">
                <span>Calc Readout (Simulated):</span>
                <span className="font-semibold text-accent">
                  Accepted {acceptedQty} kg × ₹{ratePerKg}/kg = ₹{computedTotal} (Simulated)
                </span>
              </div>
            </div>

            {/* Section: Evidence (Two PhotoPlate placeholders) */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Evidence Photo Plates</SectionLabel>
                <div className="flex items-center gap-1.5">
                  <button className="h-[28px] px-2 rounded-[2px] border border-rule text-[11px] font-medium bg-bg-sunken hover:border-ink-subtle">
                    Attach photo
                  </button>
                  <button className="h-[28px] px-2 rounded-[2px] border border-rule text-[11px] font-medium bg-bg-sunken hover:border-ink-subtle">
                    Retake
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PhotoPlate
                  label="Product (hatched placeholder)"
                  metadata="Grade A · Dried Mahua"
                  caption="Produce lot texture & cleanliness check."
                />
                <PhotoPlate
                  label="Scale reading (hatched placeholder)"
                  metadata="Platform ES-04 · 104.20 kg"
                  caption="Digital scale display with tare deduction."
                />
              </div>
            </div>

            {/* Section: Batch Tag (Short code, 80x80 QR, Print tag button) */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-2.5">
              <SectionLabel>Tamper-Evident Batch Tag</SectionLabel>
              <div className="flex items-center justify-between gap-3 border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-ink-muted uppercase block">
                    Lot Tracking Code
                  </span>
                  <div className="font-heading text-[24px] font-bold tabular-nums text-ink leading-none">
                    {selectedQueueCode}
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle block">
                    TDCCOL-MAY-402 · 3 Gunny Sacks
                  </span>
                </div>

                {/* QR placeholder 80x80 (qrcode canvas data) */}
                <div className="w-[80px] h-[80px] border border-rule bg-surface p-0.5 shrink-0 flex items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Batch QR Code #BS-402"
                      loading="lazy"
                      className="w-full h-full object-contain [image-rendering:pixelated]"
                    />
                  ) : (
                    <div className="w-full h-full bg-rule/50 flex items-center justify-center text-[9px] font-mono">
                      80×80 QR
                    </div>
                  )}
                </div>
              </div>

              <Link
                href={`/collection/tag/${selectedQueueCode.replace('#', '')}`}
                target="_blank"
                className="h-[36px] w-full rounded-[4px] border border-rule bg-surface text-ink text-[13px] font-medium hover:bg-bg-sunken flex items-center justify-center gap-1.5 focus:outline-2 focus:outline-accent select-none"
              >
                <Printer size={16} strokeWidth={1.5} />
                <span>Print A6 Batch Tag</span>
              </Link>
            </div>

            {/* Section: Payment (simulated) */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-2">
              <div className="flex items-center justify-between">
                <SectionLabel>Payment (simulated)</SectionLabel>
                <StatusBadge variant="neutral">Simulated</StatusBadge>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                  Reference Field
                </label>
                <input
                  type="text"
                  readOnly
                  defaultValue="TXN-998-SIMULATED"
                  className="h-[36px] w-full rounded-[4px] border border-rule bg-surface px-3 text-[13px] font-mono text-ink outline-none cursor-default"
                />
              </div>
              <p className="text-[12px] text-ink-subtle font-mono">
                No real payment is processed.
              </p>
            </div>
          </DrawerBody>

          {/* Drawer Footer: Secondary "Save offline" and Primary "Confirm collection" */}
          <DrawerFooter className="flex-col gap-2.5 bg-bg-sunken border-t border-rule p-4">
            {showDiscardPrompt && (
              <div className="w-full p-2.5 border border-warning/60 bg-warning/5 rounded-[2px] text-[12px] flex items-center justify-between gap-2">
                <span className="text-warning font-semibold">Unsaved collection changes — discard?</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGrossWeight(104.2);
                      setTareWeight(4.2);
                      setQualityGrade('A');
                      setShowDiscardPrompt(false);
                      setIsDrawerOpen(false);
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
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => confirmCollectionAction.execute(true)}
                disabled={confirmCollectionAction.isDisabled}
                className="flex-1 shadow-none"
              >
                Save offline
              </Button>
              <Button
                variant="primary"
                onClick={() => confirmCollectionAction.execute(false)}
                disabled={confirmCollectionAction.isDisabled}
                className="flex-1 shadow-none"
              >
                Confirm collection
              </Button>
            </div>
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
