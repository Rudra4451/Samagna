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
import { SyncState, getDatabase, InventorySaleRecord } from '../../lib/db';
import { generateULID } from '../../lib/ulid';
import { cn } from '../../lib/utils';
import { resolveSupervisorAssignment } from '../../lib/server/config';
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
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Download,
  Share2,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Check,
} from 'lucide-react';
import { useHotkeys } from '../../lib/useHotkeys';
import { KeyboardShortcutsDrawer } from '../../components/manager/KeyboardShortcutsDrawer';
import {
  ManagerFilterBar,
  ManagerFiltersState,
  ColumnConfig,
  TableDensity,
  DEFAULT_MANAGER_FILTERS,
} from '../../components/manager/ManagerFilterBar';
import { BulkActionBar } from '../../components/manager/BulkActionBar';
import { RowActionMenu } from '../../components/manager/RowActionMenu';
import { InlineEditableCell } from '../../components/manager/InlineEditableCell';
import { ProductGuidanceCard } from '../../components/guidance/ProductGuidanceCard';
import {
  getProductGuidance,
  evaluateDepotCompatibility,
  RECORDED_DEPOTS,
  CAPABILITY_DEFINITIONS,
  ProductHandlingProfile,
} from '../../lib/productGuidance';

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

type InventorySection = 'reweigh' | 'shrinkage' | 'quarantine' | 'ledger';

interface MoistureStandardItem {
  id: string;
  produceName: string;
  scientificName: string;
  produceOdia: string;
  optimalRange: string;
  maxLimit: string;
  shrinkageBaseline: string;
  storageBay: string;
  protectionNote: string;
}

interface GateInspectionLogItem {
  id: string;
  batchCode: string;
  produceName: string;
  moistureReading: number;
  dispatchedKg: number;
  arrivalKg: number;
  observedLossKg: number;
  lossPercent: number;
  allowedShrinkageKg: number;
  unexplainedVarianceKg: number;
  complianceStatus: string;
  statusVariant: StatusVariant;
}

interface QuarantineBatchItem {
  id: string;
  batchCode: string;
  produceName: string;
  collectorName: string;
  village: string;
  collectionKg: number;
  receivedKg: number;
  storageLocation: string;
  qualityGrade: 'A' | 'B' | 'C';
  quarantineReason: string;
  recordedAt: string;
  statusVariant: StatusVariant;
  caseId?: string;
}

interface StockMovementItem {
  id: string;
  movementRef: string;
  timestamp: string;
  movementType: string;
  typeVariant: StatusVariant;
  batchOrSaleRef: string;
  deltaKg: number;
  balanceAfterKg: number;
  operator: string;
}

const MOISTURE_STANDARDS: MoistureStandardItem[] = [
  {
    id: 'mst-1',
    produceName: 'Dried Mahua Flowers',
    scientificName: 'Madhuca longifolia',
    produceOdia: 'ମହୁଲ ଫୁଲ',
    optimalRange: '8.0% – 10.0%',
    maxLimit: '12.0%',
    shrinkageBaseline: '2.0% allowable transit drying',
    storageBay: 'Bay 01 (Ventilated Dry Stack)',
    protectionNote: 'Primary collector MSP payout 100% protected at collection weighment',
  },
  {
    id: 'mst-2',
    produceName: 'Sal Seeds',
    scientificName: 'Shorea robusta',
    produceOdia: 'ଶାଳ ମଞ୍ଜି',
    optimalRange: '10.0% – 12.0%',
    maxLimit: '14.0%',
    shrinkageBaseline: '1.5% allowable transit loss',
    storageBay: 'Bay 02 (Palletized Jute Sacks)',
    protectionNote: 'State floor MSP guaranteed against natural transit loss',
  },
  {
    id: 'mst-3',
    produceName: 'Chironji Seeds',
    scientificName: 'Buchanania lanzan',
    produceOdia: 'ଚାରୋଳି',
    optimalRange: '6.0% – 8.0%',
    maxLimit: '9.0%',
    shrinkageBaseline: '1.0% allowable transit loss',
    storageBay: 'Bay 03 (Hermetic Food-Grade Bin)',
    protectionNote: 'High-value tribal kernel safeguard',
  },
  {
    id: 'mst-4',
    produceName: 'Harida / Haritaki',
    scientificName: 'Terminalia chebula',
    produceOdia: 'ହରିଡ଼ା',
    optimalRange: '9.0% – 11.0%',
    maxLimit: '13.0%',
    shrinkageBaseline: '2.0% allowable transit drying',
    storageBay: 'Bay 04 (Dry Timber Racks)',
    protectionNote: 'Standard seasonal moisture tolerance applied',
  },
];

const GATE_MOISTURE_INSPECTIONS: GateInspectionLogItem[] = [
  {
    id: 'gmi-1',
    batchCode: '#BS-402',
    produceName: 'Dried Mahua Flowers',
    moistureReading: 8.8,
    dispatchedKg: 100.0,
    arrivalKg: 95.0,
    observedLossKg: 5.0,
    lossPercent: 5.0,
    allowedShrinkageKg: 2.0,
    unexplainedVarianceKg: -3.0,
    complianceStatus: 'Exceeds 2.0% Tolerance · Supervisor Endorsement Required',
    statusVariant: 'warning',
  },
  {
    id: 'gmi-2',
    batchCode: '#BS-400',
    produceName: 'Dried Mahua Flowers',
    moistureReading: 8.4,
    dispatchedKg: 35.0,
    arrivalKg: 34.5,
    observedLossKg: 0.5,
    lossPercent: 1.4,
    allowedShrinkageKg: 0.7,
    unexplainedVarianceKg: 0.0,
    complianceStatus: 'Compliant · Natural Transit Drying',
    statusVariant: 'success',
  },
  {
    id: 'gmi-3',
    batchCode: '#BS-398',
    produceName: 'Dried Mahua Flowers',
    moistureReading: 8.2,
    dispatchedKg: 25.0,
    arrivalKg: 24.6,
    observedLossKg: 0.4,
    lossPercent: 1.6,
    allowedShrinkageKg: 0.5,
    unexplainedVarianceKg: 0.0,
    complianceStatus: 'Compliant · Natural Transit Drying',
    statusVariant: 'success',
  },
  {
    id: 'gmi-4',
    batchCode: '#BS-394',
    produceName: 'Dried Mahua Flowers',
    moistureReading: 13.8,
    dispatchedKg: 80.0,
    arrivalKg: 74.0,
    observedLossKg: 6.0,
    lossPercent: 7.5,
    allowedShrinkageKg: 1.6,
    unexplainedVarianceKg: -4.4,
    complianceStatus: 'Excess Moisture & Weight Loss Discrepancy',
    statusVariant: 'danger',
  },
];

const QUARANTINED_BATCHES_ROSTER: QuarantineBatchItem[] = [
  {
    id: 'q-row-1',
    batchCode: '#BS-396',
    produceName: 'Dried Mahua Flowers',
    collectorName: 'Dulari Hansdah',
    village: 'Badagaon, Karanjia',
    collectionKg: 60.0,
    receivedKg: 56.0,
    storageLocation: 'Quarantine Bay Q1',
    qualityGrade: 'C',
    quarantineReason: 'High moisture reading (14.1%) with localized fungal contamination detected on sack base. Withheld from saleable inventory pending laboratory inspection.',
    recordedAt: '13 Mar 2025 · 11:10 AM',
    statusVariant: 'danger',
    caseId: 'DISC-396',
  },
  {
    id: 'q-row-2',
    batchCode: '#BS-394',
    produceName: 'Dried Mahua Flowers',
    collectorName: 'Salge Tudu',
    village: 'Sundargarh',
    collectionKg: 80.0,
    receivedKg: 74.0,
    storageLocation: 'Quarantine Bay Q2',
    qualityGrade: 'B',
    quarantineReason: 'Major transit weight discrepancy (-6.0 kg / 7.5% loss vs 2% limit) exceeding allowable shrinkage. Discrepancy investigation opened.',
    recordedAt: '12 Mar 2025 · 04:00 PM',
    statusVariant: 'danger',
    caseId: 'DISC-394',
  },
];

const PHYSICAL_STOCK_MOVEMENTS: StockMovementItem[] = [
  {
    id: 'smv-1',
    movementRef: 'MOV-2025-084',
    timestamp: '14 Mar 2025 · 11:20 AM',
    movementType: 'Inward Transit Handover',
    typeVariant: 'warning',
    batchOrSaleRef: 'Lot #BS-402',
    deltaKg: 95.0,
    balanceAfterKg: 0.0,
    operator: 'Driver B. Soren (#VH-04) → S. Das (IM-04)',
  },
  {
    id: 'smv-2',
    movementRef: 'MOV-2025-081',
    timestamp: '14 Mar 2025 · 10:15 AM',
    movementType: 'Verified Saleable Receipt',
    typeVariant: 'success',
    batchOrSaleRef: 'Lot #BS-400',
    deltaKg: 34.5,
    balanceAfterKg: 34.5,
    operator: 'S. Das (Warehouse IM)',
  },
  {
    id: 'smv-3',
    movementRef: 'MOV-2025-079',
    timestamp: '13 Mar 2025 · 03:45 PM',
    movementType: 'Verified Saleable Receipt',
    typeVariant: 'success',
    batchOrSaleRef: 'Lot #BS-398',
    deltaKg: 24.6,
    balanceAfterKg: 59.1,
    operator: 'S. Das (Warehouse IM)',
  },
  {
    id: 'smv-4',
    movementRef: 'MOV-2025-075',
    timestamp: '13 Mar 2025 · 11:10 AM',
    movementType: 'Quarantine Isolation',
    typeVariant: 'danger',
    batchOrSaleRef: 'Lot #BS-396',
    deltaKg: 56.0,
    balanceAfterKg: 59.1,
    operator: 'S. Das (Warehouse IM)',
  },
  {
    id: 'smv-5',
    movementRef: 'MOV-2025-071',
    timestamp: '13 Mar 2025 · 09:30 AM',
    movementType: 'Verified Saleable Receipt',
    typeVariant: 'success',
    batchOrSaleRef: 'Lot #BS-395',
    deltaKg: 44.7,
    balanceAfterKg: 103.8,
    operator: 'S. Das (Warehouse IM)',
  },
];

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

  // Outward Sales Persistent Ledger State (Batch 2 / F10)
  const [sales, setSales] = useState<InventorySaleRecord[]>([]);

  // Stat Tiles State (Expected is forecast only and never changes stock)
  const [expectedStock] = useState<number>(500.0);
  const [pendingStock, setPendingStock] = useState<number>(100.0);
  const [availableStock, setAvailableStock] = useState<number>(0.0);
  const [quarantinedStock, setQuarantinedStock] = useState<number>(0.0);

  // Outward Sale State (F10 Invariant: Sales cannot exceed stock, inventory cannot become negative)
  const [isSaleDrawerOpen, setIsSaleDrawerOpen] = useState(false);
  const [saleQuantityKg, setSaleQuantityKg] = useState<number>(0);
  const [saleBuyerName, setSaleBuyerName] = useState<string>('TDCCOL Central Processing Plant, Baripada');
  const [saleError, setSaleError] = useState<string | null>(null);

  const handleExecuteSale = async () => {
    if (saleQuantityKg <= 0) {
      setSaleError('Sale quantity must be greater than 0 kg');
      return;
    }
    if (saleQuantityKg > availableStock) {
      setSaleError(
        `Sale quantity (${saleQuantityKg} kg) exceeds available saleable stock (${availableStock.toFixed(1)} kg). Inventory cannot become negative.`
      );
      return;
    }

    const deducted = Number(saleQuantityKg.toFixed(1));
    const saleId = generateULID();
    const saleRef = `SALE-BRP-${Date.now().toString().slice(-6)}`;
    const idempotencyKey = generateULID();
    const depotCode = authenticatedUser?.centerId || 'BRP-01';

    const saleRecord: InventorySaleRecord = {
      id: saleId,
      saleReference: saleRef,
      produceName: 'Dried Mahua Flowers',
      quantityKg: deducted,
      buyerName: saleBuyerName.trim(),
      destination: 'TDCCOL Processing Facility, Baripada',
      salePricePerKg: 42.0,
      totalAmount: Number((deducted * 42.0).toFixed(2)),
      depotId: depotCode,
      actor: {
        id: authenticatedUser?.userId || 'USR-02',
        name: authenticatedUser?.fullName || 'S. Das',
        role: authenticatedUser?.role || 'WAREHOUSE_MANAGER',
      },
      notes: `Outward sale dispatched to ${saleBuyerName.trim()}`,
      idempotencyKey,
      createdAt: Date.now(),
      syncState: 'queued',
    };

    // 1. Durably persist to local Dexie inventorySales and syncQueue FIRST
    try {
      const database = getDatabase();
      await database.inventorySales.put(saleRecord);
      await database.syncQueue.put({
        local_id: saleId,
        batch_code: saleRef,
        entity: 'dispatch',
        action: 'create',
        actor: saleRecord.actor,
        payload: {
          ...saleRecord,
        },
        state: 'queued',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        retryCount: 0,
        approxSizeBytes: 1024,
      });
    } catch (dbErr) {
      console.warn('Could not persist sale to Dexie:', dbErr);
    }

    // 2. Optimistically update local sales state
    setSales((prev) => [saleRecord, ...prev]);

    // 3. Add to local audit timeline
    setAuditTimeline((prev) => [
      ...prev,
      {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: `${authenticatedUser?.fullName || 'S. Das'} (Warehouse IM)`,
        action: `Outward sale dispatched: ${deducted} kg allocated to ${saleBuyerName.trim()}. Reference: ${saleRef}`,
        delta: `-${deducted} kg`,
        deltaVariant: 'neutral',
        isLive: true,
      },
    ]);

    setIsSaleDrawerOpen(false);
    setSaleQuantityKg(0);
    setSaleError(null);

    // Initial feedback
    setActiveToast({
      id: `toast-sale-${Date.now()}`,
      title: `Outward sale recorded · -${deducted} kg · Saved in device ledger`,
      variant: 'success',
    });

    // 4. If online, attempt server synchronization
    if (!isOffline) {
      try {
        const res = await fetch('/api/inventory/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: saleId,
            saleReference: saleRef,
            produceName: saleRecord.produceName,
            quantityKg: saleRecord.quantityKg,
            buyerName: saleRecord.buyerName,
            destination: saleRecord.destination,
            salePricePerKg: saleRecord.salePricePerKg,
            totalAmount: saleRecord.totalAmount,
            depotId: saleRecord.depotId,
            notes: saleRecord.notes,
            idempotencyKey,
          }),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.success) {
          const serverId = data.data?.id || saleId;
          try {
            const database = getDatabase();
            await database.inventorySales.update(saleId, {
              syncState: 'synced',
              serverSaleId: serverId,
            });
            await database.syncQueue.delete(saleId);
          } catch {}

          setSales((prev) =>
            prev.map((s) => (s.id === saleId ? { ...s, syncState: 'synced', serverSaleId: serverId } : s))
          );

          setActiveToast({
            id: `toast-sale-sync-${Date.now()}`,
            title: `Outward sale synchronized · -${deducted} kg · Server acknowledged`,
            variant: 'success',
          });
        } else if (res.status === 503) {
          // Database unconfigured: cleanly held in local Dexie queue
          setActiveToast({
            id: `toast-sale-offline-${Date.now()}`,
            title: `Saved locally (Pending server sync) · -${deducted} kg`,
            description: 'PostgreSQL database is unconfigured. Sale record safely held in local device ledger.',
            variant: 'warning',
          });
        } else if (res.status === 422 || res.status === 403 || res.status === 409) {
          // Permanent failure from server
          try {
            const database = getDatabase();
            await database.inventorySales.update(saleId, {
              syncState: 'failed',
              error: data?.message || 'Server rejected sale',
            });
          } catch {}

          setSales((prev) =>
            prev.map((s) => (s.id === saleId ? { ...s, syncState: 'failed', error: data?.message } : s))
          );

          setActiveToast({
            id: `toast-sale-err-${Date.now()}`,
            title: `Server synchronization rejected: ${data?.message || 'Validation error'}`,
            variant: 'danger',
          });
        }
      } catch {
        // Network error: sale remains durably queued in Dexie
      }
    }
  };

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

  // Synchronize dynamic stock calculations from persistent ledger (F10 Invariant)
  useEffect(() => {
    const verifiedSaleableBatches = batches.filter((b) => b.status === 'Available');
    const incomingSaleableKg = verifiedSaleableBatches.reduce(
      (acc, b) => acc + (b.receivedKg ?? b.collectionKg ?? 0),
      0
    );
    const totalSoldKg = sales.reduce((acc, s) => acc + s.quantityKg, 0);
    const currentAvailable = Math.max(0, Number((incomingSaleableKg - totalSoldKg).toFixed(1)));
    setAvailableStock(currentAvailable);

    const quarantinedKg = batches
      .filter((b) => b.status === 'Quarantined')
      .reduce((acc, b) => acc + (b.receivedKg ?? b.collectionKg ?? 0), 0);
    setQuarantinedStock(Number(quarantinedKg.toFixed(1)));

    const pendingKg = batches
      .filter((b) => b.status === 'Pending Verification')
      .reduce((acc, b) => acc + (b.collectionKg ?? 0), 0);
    setPendingStock(Number(pendingKg.toFixed(1)));
  }, [batches, sales]);

  // Deterministic initial state for SSR & initial client render (hydration-safe)
  const [filters, setFilters] = useState<ManagerFiltersState>(DEFAULT_MANAGER_FILTERS);
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_INVENTORY_COLUMNS);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  // Restore persisted state after mounting (Rule 3, 4, 7)
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('banasetu_filter_inventory');
      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }
    } catch (e) {}

    try {
      const savedDensity = localStorage.getItem('banasetu_table_density');
      if (savedDensity === 'comfortable' || savedDensity === 'compact') {
        setDensity(savedDensity);
      }
    } catch (e) {}

    try {
      const savedCols = localStorage.getItem('banasetu_cols_inventory');
      if (savedCols) {
        setColumns(JSON.parse(savedCols));
      }
    } catch (e) {}

    setFiltersHydrated(true);
  }, []);

  // Persist state updates only after initial hydration
  useEffect(() => {
    if (!filtersHydrated) return;
    try {
      localStorage.setItem('banasetu_filter_inventory', JSON.stringify(filters));
    } catch (e) {}
  }, [filters, filtersHydrated]);

  useEffect(() => {
    if (!filtersHydrated) return;
    try {
      localStorage.setItem('banasetu_table_density', density);
    } catch (e) {}
  }, [density, filtersHydrated]);

  useEffect(() => {
    if (!filtersHydrated) return;
    try {
      localStorage.setItem('banasetu_cols_inventory', JSON.stringify(columns));
    } catch (e) {}
  }, [columns, filtersHydrated]);

  // Bulk Selection state (Rule 6)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('#BS-402');

  // Active Navigation Section (Depot Operations: reweigh | shrinkage | quarantine | ledger)
  const [activeSection, setActiveSection] = useState<InventorySection>('reweigh');

  // Synchronize activeSection with window.location.hash and browser back/forward
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (hash === '#shrinkage' || hash === '#moisture') {
        setActiveSection('shrinkage');
      } else if (hash === '#quarantine') {
        setActiveSection('quarantine');
      } else if (hash === '#ledger' || hash === '#stock') {
        setActiveSection('ledger');
      } else {
        setActiveSection('reweigh');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const navigateToSection = (sec: InventorySection) => {
    setActiveSection(sec);
    if (typeof window !== 'undefined') {
      const targetHash = sec === 'reweigh' ? '' : `#${sec}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash || window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Drawer verification state for #BS-402
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'verification' | 'audit'>('verification');
  const [arrivalWeight, setArrivalWeight] = useState<number>(95.0);
  const [arrivalWeightError, setArrivalWeightError] = useState<string | null>(null);
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

  // Active authenticated user session
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    userId: string;
    fullName: string;
    role: string;
    centerId?: string;
    district?: string;
  } | null>(null);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setAuthenticatedUser(data.user);
          }
        }
      } catch {
        // Fallback gracefully if offline
      }
    }
    loadAuth();
  }, []);

  const [serverSyncStatus, setServerSyncStatus] = useState<
    'ONLINE_SYNCED' | 'OFFLINE_LOCAL' | 'SERVER_UNAVAILABLE'
  >('OFFLINE_LOCAL');

  // Synchronize batches with Server & Dexie safely
  const loadBatches = async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDatabase();
      const dexieSales = await db.inventorySales.toArray();
      if (dexieSales.length > 0) {
        setSales(dexieSales);
      }

      // Track local batches with pending changes (must NOT be overwritten)
      const pendingSyncSet = new Set<string>();
      try {
        const queuedItems = await db.syncQueue.toArray();
        for (const q of queuedItems) {
          if (q.state === 'queued' || q.state === 'draft') {
            pendingSyncSet.add(q.batch_code.replace('#', ''));
          }
        }
      } catch {}

      const existingDexieBatches = await db.batches.toArray();
      for (const b of existingDexieBatches) {
        if (b.status === 'SAVED_OFFLINE_PENDING_SYNC') {
          pendingSyncSet.add(b.id.replace('#', ''));
        }
      }

      // Retrieve authorized server records when online
      if (!isOffline) {
        try {
          const res = await fetch('/api/batches');
          if (res.ok) {
            const data = await res.json();
            if (data.serverAvailable && Array.isArray(data.batches)) {
              setServerSyncStatus('ONLINE_SYNCED');

              for (const sBatch of data.batches) {
                const sId = sBatch.id.replace('#', '');
                if (pendingSyncSet.has(sId)) {
                  // Do not overwrite local-only queued / pending records
                  continue;
                }

                // Authoritative server version takes precedence over stale local synchronized data
                await db.batches.put({
                  id: sId,
                  produceName: sBatch.produceName,
                  produceOdia: sBatch.produceOdia,
                  scientificName: sBatch.scientificName || '',
                  district: sBatch.district,
                  block: sBatch.block,
                  gramPanchayat: sBatch.gramPanchayat,
                  centerName: sBatch.centerName,
                  shgName: sBatch.shgName,
                  facilitatorName: sBatch.facilitatorName,
                  referenceRatePerKg: sBatch.referenceRatePerKg,
                  rateSource: sBatch.rateSource,
                  ratePublishedDate: sBatch.ratePublishedDate,
                  seasonalReadinessStatus: sBatch.seasonalReadinessStatus,
                  pickupRequestId: sBatch.pickupRequestId,
                  collectors: sBatch.collectors || [],
                  status: sBatch.status,
                  step1: sBatch.step1 || null,
                  step2: sBatch.step2 || null,
                  createdAt: typeof sBatch.createdAt === 'string' ? sBatch.createdAt : new Date(sBatch.createdAt).toISOString(),
                  updatedAt: typeof sBatch.updatedAt === 'string' ? sBatch.updatedAt : new Date(sBatch.updatedAt).toISOString(),
                });
              }
            } else {
              setServerSyncStatus('SERVER_UNAVAILABLE');
            }
          } else if (res.status === 503) {
            setServerSyncStatus('SERVER_UNAVAILABLE');
          } else {
            setServerSyncStatus('OFFLINE_LOCAL');
          }
        } catch {
          setServerSyncStatus('OFFLINE_LOCAL');
        }
      } else {
        setServerSyncStatus('OFFLINE_LOCAL');
      }

      // Read consolidated batches from Dexie
      const dexieBatches = await db.batches.toArray();
      if (dexieBatches.length > 0) {
        setBatches((prev) => {
          const codeMap = new Map(prev.map((b) => [b.code, b]));
          for (const dbBatch of dexieBatches) {
            const formattedCode = `#${dbBatch.id.replace('#', '')}`;
            const net1 = dbBatch.step1?.netAcceptedKg || 100.0;
            const net2 = dbBatch.step2?.arrivalNetWeightKg ?? null;
            const status: 'Pending Verification' | 'Available' | 'Quarantined' =
              dbBatch.status === 'VERIFIED_SALEABLE'
                ? 'Available'
                : dbBatch.status === 'QUARANTINED_DISCREPANCY'
                ? 'Quarantined'
                : 'Pending Verification';
            const statusVariant: StatusVariant =
              status === 'Available' ? 'success' : status === 'Quarantined' ? 'danger' : 'warning';

            const isPending = pendingSyncSet.has(dbBatch.id.replace('#', '')) || dbBatch.status === 'SAVED_OFFLINE_PENDING_SYNC';

            codeMap.set(formattedCode, {
              code: formattedCode,
              product: dbBatch.produceName,
              collector: dbBatch.collectors?.[0]?.name || 'Primary Collector',
              village: dbBatch.collectors?.[0]?.village || 'Badagaon, Karanjia',
              collectionKg: net1,
              receivedKg: net2,
              deltaKg: net2 !== null ? Number((net2 - net1).toFixed(2)) : null,
              qualityGrade: (dbBatch.step1?.grade?.includes('A') ? 'A' : dbBatch.step1?.grade?.includes('B') ? 'B' : 'C') as any,
              storageLocation: dbBatch.step2?.storageZone || 'Rack B (Dry Stack)',
              status,
              statusVariant,
              syncState: isPending ? 'queued' : 'synced',
              updatedAt: 'Today · Synchronized',
              updatedDateIso: new Date().toISOString().split('T')[0],
            });
          }
          return Array.from(codeMap.values());
        });
      }
    } catch (e) {
      console.warn('Could not read Dexie/Server batches:', e);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [isOffline]);


  // Helper to open drawer for any batch with its exact weights and parameters
  const openBatchDrawer = (code: string) => {
    const target = batches.find((b) => b.code === code);
    setSelectedBatchCode(code);
    if (target) {
      setArrivalWeight(target.receivedKg ?? target.collectionKg);
      setStorageLocation(target.storageLocation || 'Rack B (Dry Stack)');
      setQualityGrade(target.qualityGrade || 'A');
    }
    setShowDiscardPrompt(false);
    setIsDrawerOpen(true);
  };

  // Dynamic shrinkage computations: Configured tolerance 1.5%
  const currentBatch = batches.find((b) => b.code === selectedBatchCode) || batches[0];
  const collectionKg = currentBatch ? currentBatch.collectionKg : 100.0;
  const tolerancePercent = 1.5;
  const acceptableLossKg = Number(((collectionKg * tolerancePercent) / 100).toFixed(2));
  const actualLossKg = Number((collectionKg - arrivalWeight).toFixed(2));
  const excessLossKg = Number((actualLossKg - acceptableLossKg).toFixed(2));
  const isWithinTolerance = excessLossKg <= 0;

  // Can approve if within tolerance OR supervisor note is added
  const canApprove = isWithinTolerance || supervisorNote.trim().length > 10;

  // Safe Drawer close check
  const handleAttemptCloseDrawer = () => {
    const defaultWeight = currentBatch?.receivedKg ?? currentBatch?.collectionKg ?? 95.0;
    const hasUnsavedChanges =
      arrivalWeight !== defaultWeight ||
      storageLocation !== (currentBatch?.storageLocation || 'Rack B (Dry Stack)') ||
      qualityGrade !== (currentBatch?.qualityGrade || 'A');
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
    onExecute: async () => {
      setLastFetched(new Date());
      await loadBatches();
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
    onExecute: async ({ idempotencyKey }) => {
      if (arrivalWeight <= 0 || arrivalWeight > 1000 || isNaN(arrivalWeight)) {
        setArrivalWeightError('Arrival weight must be a number between 1 and 1000.');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'danger',
          title: 'Arrival weight must be a number between 1 and 1000.',
          description: 'Please correct arrival weight before proceeding.',
        });
        throw new Error('Arrival weight must be a number between 1 and 1000.');
      }
      setArrivalWeightError(null);

      const cleanCode = selectedBatchCode.replace('#', '');
      const batchLoss = Number((collectionKg - arrivalWeight).toFixed(1));
      const arrivalGross = Number((arrivalWeight + 1.5).toFixed(2));
      const arrivalTare = 1.5;
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

      let serverVerified = false;
      let responseJson: any = null;

      if (!isOffline) {
        try {
          const res = await fetch('/api/inventory/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: cleanCode,
              arrivalGrossWeightKg: arrivalGross,
              arrivalTareWeightKg: arrivalTare,
              arrivalNetWeightKg: arrivalWeight,
              storageZone: storageLocation,
              notes: supervisorNote || undefined,
              idempotencyKey,
            }),
          });
          responseJson = await res.json().catch(() => null);
          if (res.ok && responseJson?.success && responseJson?.serverVerified) {
            serverVerified = true;
          } else if (res.status === 401 || res.status === 403) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: `Authorization Denied (${res.status})`,
              description: responseJson?.message || 'Authenticated warehouse manager session required.',
            });
            return;
          } else if (res.status === 422) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: 'Validation Failed (422)',
              description: responseJson?.message || 'Reweighment inputs failed schema validation.',
            });
            return;
          } else if (res.status === 409) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: 'Step 1 Incomplete (409)',
              description: responseJson?.message || 'Batch must complete Step 1 Field Verification before warehouse arrival.',
            });
            return;
          }
        } catch {
          // Network failure -> fallback to local safe persistence
        }
      }

      // Persist to Dexie
      try {
        const db = getDatabase();
        const batchStatus = serverVerified ? 'QUARANTINED_DISCREPANCY' : 'SAVED_OFFLINE_PENDING_SYNC';

        await db.batches.update(cleanCode, {
          status: batchStatus,
          step2: {
            arrivalGrossWeightKg: arrivalGross,
            arrivalTareWeightKg: arrivalTare,
            arrivalNetWeightKg: arrivalWeight,
            storageZone: storageLocation,
            shrinkagePercentAllowed: tolerancePercent,
            shrinkageKgAllowed: acceptableLossKg,
            unexplainedVarianceKg: -excessLossKg,
            discrepancyTriggered: true,
            supervisorCaseId: `DISC-${cleanCode}`,
            verifiedBy: serverVerified
              ? (responseJson?.verifiedBy || authenticatedUser?.fullName || 'S. Das')
              : `${authenticatedUser?.fullName || 'S. Das'} (Local)`,
            verifiedByRole: authenticatedUser?.role || 'Warehouse Inventory Manager',
            verifiedAt: responseJson?.verifiedAt || nowStr,
            notes: supervisorNote || `Excess shrinkage: ${excessLossKg} kg over ${tolerancePercent}% tolerance. Stock quarantined.`,
          },
          updatedAt: nowStr,
        });

        await db.discrepancyCases.put({
          id: `DISC-${cleanCode}`,
          batchId: cleanCode,
          dispatchedNetKg: collectionKg,
          arrivalNetKg: arrivalWeight,
          shrinkageAllowedKg: acceptableLossKg,
          unexplainedVarianceKg: -excessLossKg,
          status: 'OPEN_QUARANTINED',
          currentActionTaken: `Quarantine tag placed on lot; ${excessLossKg} kg held under supervisor review.`,
          assignedSupervisor:
            responseJson?.assignedSupervisor ||
            resolveSupervisorAssignment(currentBatch?.village?.split(',')?.[1]?.trim() || 'Mayurbhanj'),
          createdAt: nowStr,
          notes: supervisorNote || `Produce in transit to Baripada. Unexplained deficit of ${excessLossKg} kg exceeds ${tolerancePercent}% tolerance.`,
        });

        if (!serverVerified) {
          await db.syncQueue.put({
            local_id: idempotencyKey || `SYNC-WH-${cleanCode}`,
            batch_code: selectedBatchCode,
            entity: 'storage_receipt',
            action: 'quarantine',
            actor: {
              id: authenticatedUser?.userId || 'IM-04',
              name: authenticatedUser?.fullName || 'S. Das',
              role: authenticatedUser?.role || 'Warehouse Inventory Manager',
            },
            payload: {
              batchId: cleanCode,
              arrivalGrossWeightKg: arrivalGross,
              arrivalTareWeightKg: arrivalTare,
              arrivalNetWeightKg: arrivalWeight,
              storageZone: storageLocation,
              notes: supervisorNote,
              idempotencyKey,
            },
            state: 'queued',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            retryCount: 0,
            approxSizeBytes: 2048,
          });
        }

        await db.auditEvents.put({
          id: `AUD-${serverVerified ? 'WH' : 'LOCAL'}-${Date.now()}`,
          timestamp: nowStr,
          actorId: authenticatedUser?.userId || 'IM-04',
          actorName: authenticatedUser?.fullName || 'S. Das',
          actorRole: authenticatedUser?.role || 'Warehouse Inventory Manager',
          actionType: 'DISCREPANCY_QUARANTINED',
          title: `Batch ${selectedBatchCode} Quarantined: ${excessLossKg} kg Excess Shrinkage ${serverVerified ? '' : '(Local)'}`,
          description: `Held in ${storageLocation} pending supervisor review. Arrival: ${arrivalWeight} kg vs Expected: ${collectionKg} kg. ${serverVerified ? 'Authoritative server verification.' : 'Saved locally; pending server sync.'}`,
          details: {
            batchCode: selectedBatchCode,
            collectionKg,
            arrivalWeight,
            excessLossKg,
            storageLocation,
            serverVerified,
          },
        });
      } catch (err) {
        console.warn('Dexie update error in quarantineAction:', err);
      }

      setBatches((prev) =>
        prev.map((b) =>
          b.code === selectedBatchCode
            ? {
                ...b,
                receivedKg: arrivalWeight,
                deltaKg: Number((arrivalWeight - collectionKg).toFixed(1)),
                status: 'Quarantined',
                statusVariant: 'danger',
                syncState: serverVerified ? 'synced' : 'queued',
                updatedAt: 'Just now',
              }
            : b
        )
      );

      setPendingStock((prev) => Math.max(0, prev - collectionKg));
      setQuarantinedStock((prev) => prev + arrivalWeight);

      const quarantineAudit: AuditTimelineEvent = {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: `${authenticatedUser?.fullName || 'S. Das'} (Warehouse IM)`,
        action: `Held in ${storageLocation} pending drying review. Reason: Excess shrinkage (-${batchLoss} kg excess). ${serverVerified ? 'Server verified' : 'Saved locally (pending sync)'}`,
        delta: `-${batchLoss} kg`,
        deltaVariant: 'danger',
        isLive: true,
      };
      setAuditTimeline((prev) => [...prev, quarantineAudit]);
      setIsDrawerOpen(false);
      setShowDiscardPrompt(false);

      if (!serverVerified) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: `Saved locally (Pending server sync) · ${selectedBatchCode}`,
          description: 'PostgreSQL database is unconfigured. Quarantine status stored safely in local IndexedDB.',
        });
      } else {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: `Batch ${selectedBatchCode} Quarantined with Reject Reason`,
          description: 'Stock held in segregation bay. Authoritative server verification confirmed.',
        });
      }
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
    onExecute: async ({ idempotencyKey }) => {
      if (arrivalWeight <= 0 || arrivalWeight > 1000 || isNaN(arrivalWeight)) {
        setArrivalWeightError('Arrival weight must be a number between 1 and 1000.');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'danger',
          title: 'Arrival weight must be a number between 1 and 1000.',
          description: 'Please correct arrival weight before proceeding.',
        });
        throw new Error('Arrival weight must be a number between 1 and 1000.');
      }
      setArrivalWeightError(null);

      const cleanCode = selectedBatchCode.replace('#', '');
      const arrivalGross = Number((arrivalWeight + 1.5).toFixed(2));
      const arrivalTare = 1.5;
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

      let serverVerified = false;
      let responseJson: any = null;

      if (!isOffline) {
        try {
          const res = await fetch('/api/inventory/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: cleanCode,
              arrivalGrossWeightKg: arrivalGross,
              arrivalTareWeightKg: arrivalTare,
              arrivalNetWeightKg: arrivalWeight,
              storageZone: storageLocation,
              notes: supervisorNote || undefined,
              idempotencyKey,
            }),
          });
          responseJson = await res.json().catch(() => null);
          if (res.ok && responseJson?.success && responseJson?.serverVerified) {
            serverVerified = true;
          } else if (res.status === 401 || res.status === 403) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: `Authorization Denied (${res.status})`,
              description: responseJson?.message || 'Authenticated warehouse manager session required.',
            });
            return;
          } else if (res.status === 422) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: 'Validation Failed (422)',
              description: responseJson?.message || 'Reweighment inputs failed schema validation.',
            });
            return;
          } else if (res.status === 409) {
            setActiveToast({
              id: `toast-${Date.now()}`,
              variant: 'danger',
              title: 'Step 1 Incomplete (409)',
              description: responseJson?.message || 'Batch must complete Step 1 Field Verification before warehouse arrival.',
            });
            return;
          }
        } catch {
          // Network failure -> fallback to local safe persistence
        }
      }

      // Persist to Dexie
      try {
        const db = getDatabase();
        const batchStatus = serverVerified ? 'VERIFIED_SALEABLE' : 'SAVED_OFFLINE_PENDING_SYNC';

        await db.batches.update(cleanCode, {
          status: batchStatus,
          step2: {
            arrivalGrossWeightKg: arrivalGross,
            arrivalTareWeightKg: arrivalTare,
            arrivalNetWeightKg: arrivalWeight,
            storageZone: storageLocation,
            shrinkagePercentAllowed: tolerancePercent,
            shrinkageKgAllowed: acceptableLossKg,
            unexplainedVarianceKg: -excessLossKg,
            discrepancyTriggered: !isWithinTolerance,
            verifiedBy: serverVerified
              ? (responseJson?.verifiedBy || authenticatedUser?.fullName || 'S. Das')
              : `${authenticatedUser?.fullName || 'S. Das'} (Local)`,
            verifiedByRole: authenticatedUser?.role || 'Warehouse Inventory Manager',
            verifiedAt: responseJson?.verifiedAt || nowStr,
            notes: supervisorNote || `Conforms to acceptable tolerance. Released to saleable stock in ${storageLocation}.`,
          },
          updatedAt: nowStr,
        });

        if (!serverVerified) {
          await db.syncQueue.put({
            local_id: idempotencyKey || `SYNC-WH-${cleanCode}`,
            batch_code: selectedBatchCode,
            entity: 'storage_receipt',
            action: 'verify',
            actor: {
              id: authenticatedUser?.userId || 'IM-04',
              name: authenticatedUser?.fullName || 'S. Das',
              role: authenticatedUser?.role || 'Warehouse Inventory Manager',
            },
            payload: {
              batchId: cleanCode,
              arrivalGrossWeightKg: arrivalGross,
              arrivalTareWeightKg: arrivalTare,
              arrivalNetWeightKg: arrivalWeight,
              storageZone: storageLocation,
              notes: supervisorNote,
              idempotencyKey,
            },
            state: 'queued',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            retryCount: 0,
            approxSizeBytes: 2048,
          });
        }

        await db.auditEvents.put({
          id: `AUD-${serverVerified ? 'WH' : 'LOCAL'}-${Date.now()}`,
          timestamp: nowStr,
          actorId: authenticatedUser?.userId || 'IM-04',
          actorName: authenticatedUser?.fullName || 'S. Das',
          actorRole: authenticatedUser?.role || 'Warehouse Inventory Manager',
          actionType: 'WAREHOUSE_REWEIGH_COMPLETED',
          title: `Batch ${selectedBatchCode} Approved: ${arrivalWeight} kg Net Released ${serverVerified ? '' : '(Local)'}`,
          description: `Approved to saleable stock in ${storageLocation}. ${serverVerified ? 'Authoritative server verification.' : 'Saved locally; pending server sync.'}`,
          details: {
            batchCode: selectedBatchCode,
            collectionKg,
            arrivalWeight,
            storageLocation,
            supervisorNote,
            serverVerified,
          },
        });
      } catch (err) {
        console.warn('Dexie update error in approveAction:', err);
      }

      setBatches((prev) =>
        prev.map((b) =>
          b.code === selectedBatchCode
            ? {
                ...b,
                receivedKg: arrivalWeight,
                deltaKg: Number((arrivalWeight - collectionKg).toFixed(1)),
                status: 'Available',
                statusVariant: 'success',
                syncState: serverVerified ? 'synced' : 'queued',
                updatedAt: 'Just now',
              }
            : b
        )
      );

      setPendingStock((prev) => Math.max(0, prev - collectionKg));
      setAvailableStock((prev) => prev + arrivalWeight);

      const approvalAudit: AuditTimelineEvent = {
        id: `aud-${Date.now()}`,
        dayHeader: '14 March 2025',
        time: 'Just now',
        actor: `${authenticatedUser?.fullName || 'S. Das'} (IM) & Supervisor Endorsement`,
        action: `Approved to saleable stock in ${storageLocation}. ${serverVerified ? 'Server verified' : 'Saved locally (pending sync)'}`,
        delta: `+${arrivalWeight.toFixed(1)} kg`,
        deltaVariant: 'success',
        isLive: true,
      };
      setAuditTimeline((prev) => [...prev, approvalAudit]);
      setIsDrawerOpen(false);
      setShowDiscardPrompt(false);
      setConfirmingApproval(false);

      if (!serverVerified) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: `Saved locally (Pending server sync) · ${selectedBatchCode}`,
          description: 'PostgreSQL database is unconfigured. Approved status stored safely in local IndexedDB.',
        });
      } else {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'success',
          title: `Batch ${selectedBatchCode} Approved to Saleable`,
          description: `Expected unchanged · Available +${arrivalWeight} kg. Authoritative server verification confirmed.`,
        });
      }
    },
  });

  // 5. Sync Offline Warehouse Queue Action
  const syncNowAction = useAction({
    name: 'sync-warehouse-queue',
    showToast: (t) => setActiveToast(t),
    onExecute: async () => {
      if (isOffline) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: 'Offline mode active',
          description: 'Network disconnected. Warehouse records remain safely stored in local IndexedDB.',
        });
        return;
      }

      try {
        const res = await fetch('/api/health');
        const health = await res.json().catch(() => null);

        if (!health?.database?.connected) {
          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'warning',
            title: 'Server database unconfigured · Sync postponed',
            description: 'PostgreSQL database is unconfigured. All offline warehouse records remain safely retained in local device ledger.',
          });
          return;
        }

        const db = getDatabase();
        const pending = await db.syncQueue
          .where('entity')
          .equals('storage_receipt')
          .toArray();

        let syncedCount = 0;
        for (const item of pending) {
          try {
            const verifyRes = await fetch('/api/inventory/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            });
            const vData = await verifyRes.json().catch(() => null);
            if (verifyRes.ok && vData?.success && vData?.serverVerified) {
              await db.syncQueue.delete(item.local_id);
              await db.batches.update(item.payload.batchId, {
                status: vData.status,
              });
              syncedCount++;
            }
          } catch {
            // Strictly retain pending records on failure
          }
        }

        const remaining = await db.syncQueue
          .where('entity')
          .equals('storage_receipt')
          .toArray();

        if (syncedCount > 0) {
          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'success',
            title: `${syncedCount} warehouse record(s) synchronized with server`,
            description:
              remaining.length === 0
                ? 'Warehouse sync buffer is now clear.'
                : `${remaining.length} record(s) remain safely pending.`,
          });
        } else {
          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'warning',
            title: 'Sync incomplete · Records retained',
            description: `${remaining.length} record(s) retained locally in device ledger.`,
          });
        }
      } catch (e) {
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: 'Sync attempt failed · Records retained',
          description: 'Could not connect to server. Pending records safely preserved.',
        });
      }
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted mt-1 select-none flex items-center gap-2 flex-wrap">
              <span>Today · 14 Mar 2025 · Baripada Central Depôt #02</span>
              {authenticatedUser && (
                <span className="border border-rule rounded px-1.5 py-0.5 bg-bg-sunken text-ink font-mono text-[10px]">
                  Session: {authenticatedUser.role} ({authenticatedUser.fullName})
                </span>
              )}
              {serverSyncStatus === 'ONLINE_SYNCED' ? (
                <StatusBadge variant="success" className="text-[10px]">
                  ✓ Cloud Registry: Synchronized
                </StatusBadge>
              ) : serverSyncStatus === 'SERVER_UNAVAILABLE' ? (
                <StatusBadge variant="neutral" className="text-[10px]">
                  ⚡ Offline / Local Ledger Mode (Server Unconfigured)
                </StatusBadge>
              ) : (
                <StatusBadge variant="warning" className="text-[10px]">
                  ⚡ Offline Device Mode
                </StatusBadge>
              )}
            </div>
          </div>
          {/* Primary Action Placement: Top-right aligned with page title row */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <Button
              variant="secondary"
              onClick={() => syncNowAction.execute()}
              disabled={syncNowAction.isDisabled}
              className="shadow-none"
            >
              Sync offline queue
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (activeSection !== 'reweigh') {
                  navigateToSection('reweigh');
                }
                setShowDiscardPrompt(false);
                setIsDrawerOpen(true);
              }}
              className="shadow-none"
            >
              Verify batch
            </Button>
          </div>
        </div>

        {/* Depot Operations Section Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Depot Operations Navigation"
          className="flex items-center gap-2 border-b border-rule pb-2 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            id="tab-reweigh"
            aria-selected={activeSection === 'reweigh'}
            aria-controls="reweigh"
            onClick={() => navigateToSection('reweigh')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'reweigh'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <Warehouse size={15} strokeWidth={1.5} />
            <span>Depôt Re-Weigh</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'reweigh' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              Lot #BS-402
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-shrinkage"
            aria-selected={activeSection === 'shrinkage'}
            aria-controls="shrinkage"
            onClick={() => navigateToSection('shrinkage')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'shrinkage'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <FileSpreadsheet size={15} strokeWidth={1.5} />
            <span>Moisture Protocols</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'shrinkage' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              2% limit
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-quarantine"
            aria-selected={activeSection === 'quarantine'}
            aria-controls="quarantine"
            onClick={() => navigateToSection('quarantine')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'quarantine'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <ShieldAlert size={15} strokeWidth={1.5} />
            <span>Quarantine Review</span>
            <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'quarantine' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              2 batches
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-ledger"
            aria-selected={activeSection === 'ledger'}
            aria-controls="ledger"
            onClick={() => navigateToSection('ledger')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'ledger'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <FileText size={15} strokeWidth={1.5} />
            <span>Stock Ledgers</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'ledger' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              {availableStock.toFixed(0)} kg
            </span>
          </button>
        </div>

        {/* ========================================================
            SECTION 1: Depôt Re-Weigh Workflow & Batches Table
           ======================================================== */}
        {activeSection === 'reweigh' && (
        <div id="reweigh" className="space-y-6">
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
          <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none flex flex-col justify-between">
            <div>
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
              {sales.length > 0 && (
                <span className="text-[10px] font-mono text-ink-muted mt-1 block select-none">
                  {sales.reduce((acc, s) => acc + s.quantityKg, 0).toFixed(1)} kg dispatched ({sales.length} sale{sales.length > 1 ? 's' : ''})
                </span>
              )}
            </div>
            {availableStock > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSaleQuantityKg(Math.min(availableStock, 50));
                  setSaleError(null);
                  setIsSaleDrawerOpen(true);
                }}
                className="mt-2 text-[11px] font-mono text-accent hover:underline text-left select-none"
              >
                Dispatch Outward Sale →
              </button>
            )}
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
                    <label htmlFor="select-all-inventory-rows" className="sr-only">
                      Select all rows
                    </label>
                    <input
                      id="select-all-inventory-rows"
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
                          <label htmlFor={`select-inventory-row-${b.code}`} className="sr-only">
                            Select batch {b.code}
                          </label>
                          <input
                            id={`select-inventory-row-${b.code}`}
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
          <SectionLabel className="mb-2">Invariants & Safeguards</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[13px]">
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
            <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/30">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted block mb-0.5">
                Invariant IV (Tribal Safeguard)
              </span>
              <span className="font-medium text-ink">
                Gatherer payout 100% protected against transit loss
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

        {/* ========================================================
            SECTION 2: Moisture Protocols (Shrinkage Benchmarks)
           ======================================================== */}
        {activeSection === 'shrinkage' && (
          <div id="shrinkage" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Moisture Protocols &amp; Transit Shrinkage Benchmarks
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ଆର୍ଦ୍ରତା ନିୟମାବଳୀ ଓ ପ୍ରାମାଣିକ ଯାଞ୍ଚ</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Standardized moisture specifications, transit drying tolerances, and calibrated electronic sensor guidelines for MFP intake at Baripada Central Depôt.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                  <StatusBadge variant="info" className="text-[11px] font-mono">
                    TDCCOL / TRIFED Standard
                  </StatusBadge>
                  <StatusBadge variant="success" className="text-[11px] font-mono">
                    Tribal Payout 100% Protected
                  </StatusBadge>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Allowable Transit Shrinkage
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums">
                    2.0%
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Mahua standard hot-weather transit limit
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Calibrated Safe Moisture
                  </span>
                  <div className="font-heading text-[22px] font-bold text-success tabular-nums font-mono">
                    &lt; 10.0%
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Grade A standard (&gt;12% triggers quarantine)
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Gate Inspected Batches
                  </span>
                  <div className="font-heading text-[22px] font-bold text-accent tabular-nums font-mono">
                    {GATE_MOISTURE_INSPECTIONS.length} Batches
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Electronic moisture meter verified
                  </span>
                </div>
              </div>
            </div>

            {/* Table 1: Product Moisture Standards & Storage Guidelines */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <SectionLabel>Product Moisture Guidance</SectionLabel>
                  <h3 className="font-heading text-[16px] font-semibold text-ink">
                    Approved MFP Moisture Tolerances &amp; Storage Zones
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  Official Odia Tribal Welfare Baseline
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Produce &amp; Botanical</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Optimal Moisture Range</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Max Limit (Quarantine)</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Shrinkage Baseline</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Storage Bay</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Tribal Safeguard</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOISTURE_STANDARDS.map((s) => (
                      <TableRow key={s.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="text-[13px] font-medium text-ink whitespace-nowrap">
                          <div>{s.produceName}</div>
                          <div className="text-[11px] font-mono text-ink-muted italic">{s.scientificName} · {s.produceOdia}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-bold text-ink whitespace-nowrap">
                          {s.optimalRange}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-bold text-danger whitespace-nowrap">
                          {s.maxLimit}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-muted whitespace-nowrap">
                          {s.shrinkageBaseline}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink whitespace-nowrap">
                          <span className="bg-bg-sunken px-2 py-0.5 border border-rule rounded-[2px]">{s.storageBay}</span>
                        </TableCell>
                        <TableCell className="text-[11px] text-ink-muted max-w-[260px]">
                          {s.protectionNote}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Table 2: Gate Arrival Moisture & Shrinkage Inspection Log */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <SectionLabel>Gate Arrival Testing</SectionLabel>
                  <h3 className="font-heading text-[16px] font-semibold text-ink">
                    Calibrated Moisture Sensor &amp; Transit Shrinkage Log
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  Baripada Central Gate #02
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Batch Code</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Sensor Moisture</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Dispatched kg</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Arrival kg</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Observed Loss</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Allowed (2%)</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Variance</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Compliance Status</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {GATE_MOISTURE_INSPECTIONS.map((g) => (
                      <TableRow key={g.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="font-mono text-[13px] font-bold text-accent whitespace-nowrap">
                          {g.batchCode}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-ink whitespace-nowrap">
                          {g.moistureReading.toFixed(1)}%
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-muted text-right whitespace-nowrap">
                          {g.dispatchedKg.toFixed(1)} kg
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-medium text-ink text-right whitespace-nowrap">
                          {g.arrivalKg.toFixed(1)} kg
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-bold text-danger text-right whitespace-nowrap">
                          -{g.observedLossKg.toFixed(1)} kg ({g.lossPercent.toFixed(1)}%)
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-subtle text-right whitespace-nowrap">
                          {g.allowedShrinkageKg.toFixed(1)} kg
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-bold text-right whitespace-nowrap">
                          <span className={g.unexplainedVarianceKg < 0 ? 'text-danger' : 'text-success'}>
                            {g.unexplainedVarianceKg < 0 ? `${g.unexplainedVarianceKg.toFixed(1)} kg` : '0.0 kg'}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge variant={g.statusVariant} className="text-[10px] font-mono">
                            {g.complianceStatus}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBatchCode(g.batchCode);
                              setIsDrawerOpen(true);
                            }}
                            className="text-[11px] font-mono text-accent hover:underline font-semibold focus:outline-2 focus:outline-accent"
                          >
                            Re-Weigh →
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tribal Protection & Safeguard Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-4 shadow-none">
              <div className="flex items-center gap-2 mb-2">
                <SectionLabel>Statutory Safeguard</SectionLabel>
                <StatusBadge variant="success">LABHA &amp; TRIFED Mandate</StatusBadge>
              </div>
              <p className="text-[13px] text-ink leading-relaxed">
                <strong>Gatherer Payout Invariant:</strong> Transit weight loss and moisture evaporation during hot-weather transit between village collection centers and Baripada Central Depôt shall strictly never reduce the direct benefit transfer (DBT) disbursed to primary tribal gatherers. Gatherer payments are 100% determined at primary center weighment.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            SECTION 3: Quarantine Review & Discrepancy Clearance
           ======================================================== */}
        {activeSection === 'quarantine' && (
          <div id="quarantine" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Quarantine Review &amp; Discrepancy Clearance
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ପୃଥକୀକରଣ ଓ ତ୍ରୁଟି ସମାଧାନ</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Isolated non-saleable stock awaiting supervisor discrepancy resolution, laboratory quality verification, or disposal authorization. Quarantined stock cannot be dispatched for sale.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                  <StatusBadge variant="danger" className="text-[11px] font-mono">
                    Non-Saleable Stock Isolated
                  </StatusBadge>
                  <StatusBadge variant="warning" className="text-[11px] font-mono">
                    Supervisor Clearance Required
                  </StatusBadge>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Quarantined Physical Stock
                  </span>
                  <div className="font-heading text-[22px] font-bold text-danger tabular-nums font-mono">
                    {quarantinedStock.toFixed(1)} kg
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Segregated in Quarantine Bays Q1 &amp; Q2
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Quarantined Batches
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums font-mono">
                    {QUARANTINED_BATCHES_ROSTER.length} Batches
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    #BS-396 (Grade C) &amp; #BS-394 (Variance)
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Open Discrepancy Investigation
                  </span>
                  <div className="font-heading text-[22px] font-bold text-accent tabular-nums font-mono">
                    Case DISC-402
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Transit shrinkage audit under review
                  </span>
                </div>
              </div>
            </div>

            {/* Quarantined Batches Roster Table */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <SectionLabel>Isolated Quarantine Inventory</SectionLabel>
                  <h3 className="font-heading text-[16px] font-semibold text-ink">
                    Batches Withheld From Saleable Stock
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  Requires SUPERVISOR_ADMIN Role To Endorse
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Batch Code</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Produce</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Collector &amp; Village</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Weight (Arrival)</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Storage Bay</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Grade</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Quarantine Reason</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-center">Documentation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {QUARANTINED_BATCHES_ROSTER.map((q) => (
                      <TableRow key={q.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="font-mono text-[13px] font-bold text-danger whitespace-nowrap">
                          {q.batchCode}
                        </TableCell>
                        <TableCell className="text-[13px] font-medium text-ink whitespace-nowrap">
                          {q.produceName}
                        </TableCell>
                        <TableCell className="text-[12px] text-ink whitespace-nowrap">
                          <div className="font-medium">{q.collectorName}</div>
                          <div className="text-[11px] text-ink-muted font-mono">{q.village}</div>
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-ink text-right whitespace-nowrap">
                          {q.receivedKg.toFixed(1)} kg
                          <span className="text-[10px] font-mono text-ink-muted block font-normal">Col: {q.collectionKg.toFixed(1)} kg</span>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] whitespace-nowrap">
                          <span className="bg-danger/10 text-danger border border-danger/30 px-1.5 py-0.5 rounded-[2px] font-semibold">
                            {q.storageLocation}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge variant="danger" className="text-[10px] font-mono">
                            Grade {q.qualityGrade}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-[12px] text-ink-muted max-w-[340px]">
                          {q.quarantineReason}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/collection/tag/${q.batchCode.replace('#', '')}`}
                              className="text-[11px] font-mono text-accent hover:underline font-semibold focus:outline-2 focus:outline-accent"
                            >
                              Tag PDF
                            </Link>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBatchCode(q.batchCode);
                                setIsDrawerOpen(true);
                              }}
                              className="text-[11px] font-mono text-ink-muted hover:text-ink hover:underline focus:outline-2 focus:outline-accent"
                            >
                              Review
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Active Discrepancy Case Investigation Panel */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div className="flex items-center gap-2">
                  <SectionLabel>Active Discrepancy Case</SectionLabel>
                  <StatusBadge variant="warning">Case #DISC-402</StatusBadge>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  Assigned Supervisor: S. Mohapatra (Baripada Zone)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Subject Batch
                  </span>
                  <div className="font-heading text-[18px] font-bold text-accent font-mono">
                    #BS-402 (Dried Mahua Flowers)
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Karanjia Collection Point #01
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Transit Discrepancy
                  </span>
                  <div className="font-heading text-[18px] font-bold text-danger font-mono">
                    -5.0 kg Observed (5.0%)
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    2.0 kg allowed · 3.0 kg unexplained variance
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Investigation Action
                  </span>
                  <div className="text-[13px] font-medium text-ink mt-1">
                    Supervisor Endorsement Required
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Reason: High ambient transit drying
                  </span>
                </div>
              </div>

              <div className="p-3 bg-bg-sunken/60 border border-rule rounded-[2px] text-[12px] text-ink leading-relaxed">
                <strong>Mandatory Invariant:</strong> Quarantined batches remain physically and digitally locked. They are strictly excluded from saleable stock tallies and cannot be allocated to outward dispatch until formally approved with an authoritative supervisor signature.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SECTION 4: Stock Ledgers & Outward Sales
           ======================================================== */}
        {activeSection === 'ledger' && (
          <div id="ledger" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Stock Movement &amp; Outward Sales Ledger
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ମହଜୁଦ ଓ ବିକ୍ରୟ ଖାତା</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Authoritative, double-entry inventory ledger of physical received stock, inward transfers, outward sales dispatches, and available saleable balances at Baripada Central Depôt #02.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                  <StatusBadge variant="success" className="text-[11px] font-mono">
                    Real-Time Ledger Balance
                  </StatusBadge>
                  <StatusBadge variant="info" className="text-[11px] font-mono">
                    Double-Entry Audited
                  </StatusBadge>
                  {availableStock > 0 && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSaleQuantityKg(Math.min(availableStock, 50));
                        setSaleError(null);
                        setIsSaleDrawerOpen(true);
                      }}
                      className="shadow-none"
                    >
                      Dispatch Outward Sale
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Available Saleable Stock
                  </span>
                  <div className="font-heading text-[22px] font-bold text-success tabular-nums font-mono">
                    {availableStock.toFixed(1)} kg
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Verified physical inventory
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Total Outward Dispatched
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums font-mono">
                    {sales.reduce((acc, s) => acc + s.quantityKg, 0).toFixed(1)} kg
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    {sales.length} outward sale transaction{sales.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Quarantined Restricted
                  </span>
                  <div className="font-heading text-[22px] font-bold text-danger tabular-nums font-mono">
                    {quarantinedStock.toFixed(1)} kg
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Withheld non-saleable stock
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Forecast Incoming
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink-muted tabular-nums font-mono">
                    {expectedStock.toFixed(1)} kg
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Forecast only · not physical stock
                  </span>
                </div>
              </div>
            </div>

            {/* Table 1: Outward Sales Dispatches */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <SectionLabel>Outward Sales &amp; Procurement Dispatches</SectionLabel>
                  <h3 className="font-heading text-[16px] font-semibold text-ink">
                    Processed Dispatches to State &amp; Institutional Buyers
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  TDCCOL State Depôt Network
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Sale Reference</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Produce</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Buyer / Processing Plant</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Quantity Dispatched</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">MSP Rate</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Total Realized</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Sync State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length > 0 ? (
                      sales.map((s) => (
                        <TableRow key={s.id} className="hover:bg-bg-sunken/30">
                          <TableCell className="font-mono text-[13px] font-bold text-accent whitespace-nowrap">
                            {s.saleReference}
                          </TableCell>
                          <TableCell className="text-[13px] font-medium text-ink whitespace-nowrap">
                            {s.produceName}
                          </TableCell>
                          <TableCell className="text-[12px] text-ink whitespace-nowrap">
                            {s.buyerName}
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-ink text-right whitespace-nowrap">
                            {s.quantityKg.toFixed(1)} kg
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-ink-muted text-right whitespace-nowrap">
                            ₹{(s.salePricePerKg ?? 42.0).toFixed(2)}/kg
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-success text-right whitespace-nowrap">
                            ₹{(s.totalAmount ?? s.quantityKg * 42.0).toFixed(2)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge variant={s.syncState === 'synced' ? 'success' : 'warning'} className="text-[10px] font-mono">
                              {s.syncState === 'synced' ? '✓ Synced' : '⚡ Local Queued'}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        <TableRow className="hover:bg-bg-sunken/30">
                          <TableCell className="font-mono text-[13px] font-bold text-accent whitespace-nowrap">
                            SALE-BRP-0012
                          </TableCell>
                          <TableCell className="text-[13px] font-medium text-ink whitespace-nowrap">
                            Dried Mahua Flowers
                          </TableCell>
                          <TableCell className="text-[12px] text-ink whitespace-nowrap">
                            TDCCOL Central Processing Plant, Baripada
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-ink text-right whitespace-nowrap">
                            100.0 kg
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-ink-muted text-right whitespace-nowrap">
                            ₹42.00/kg
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-success text-right whitespace-nowrap">
                            ₹4,200.00
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge variant="success" className="text-[10px] font-mono">
                              ✓ Dispatched · Verified
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                        <TableRow className="hover:bg-bg-sunken/30">
                          <TableCell className="font-mono text-[13px] font-bold text-accent whitespace-nowrap">
                            SALE-BRP-0009
                          </TableCell>
                          <TableCell className="text-[13px] font-medium text-ink whitespace-nowrap">
                            Dried Mahua Flowers
                          </TableCell>
                          <TableCell className="text-[12px] text-ink whitespace-nowrap">
                            Mayurbhanj Tribal MFP Federation
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-ink text-right whitespace-nowrap">
                            45.0 kg
                          </TableCell>
                          <TableCell className="font-mono text-[12px] text-ink-muted text-right whitespace-nowrap">
                            ₹42.00/kg
                          </TableCell>
                          <TableCell className="font-mono text-[13px] font-bold text-success text-right whitespace-nowrap">
                            ₹1,890.00
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusBadge variant="success" className="text-[10px] font-mono">
                              ✓ Dispatched · Verified
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Table 2: Physical Stock Movements Journal */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none space-y-3 p-4">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div>
                  <SectionLabel>Depôt Stock Movements Journal</SectionLabel>
                  <h3 className="font-heading text-[16px] font-semibold text-ink">
                    Chronological Double-Entry Stock Movement History
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-ink-muted">
                  Baripada Central Depôt #02
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Movement ID</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Date &amp; Time</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Transaction Type</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Lot / Batch Ref</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Quantity (Δ)</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Saleable Balance</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Operator</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PHYSICAL_STOCK_MOVEMENTS.map((m) => (
                      <TableRow key={m.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="font-mono text-[12px] font-medium text-ink whitespace-nowrap">
                          {m.movementRef}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-ink-muted whitespace-nowrap">
                          {m.timestamp}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge variant={m.typeVariant} className="text-[10px] font-mono">
                            {m.movementType}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-bold text-accent whitespace-nowrap">
                          {m.batchOrSaleRef}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-right whitespace-nowrap">
                          <span className={m.deltaKg > 0 ? 'text-success' : 'text-danger'}>
                            +{m.deltaKg.toFixed(1)} kg
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-ink text-right whitespace-nowrap">
                          {m.balanceAfterKg > 0 ? `${m.balanceAfterKg.toFixed(1)} kg` : '— (Pending)'}
                        </TableCell>
                        <TableCell className="text-[12px] text-ink-muted whitespace-nowrap">
                          {m.operator}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Embedded Stock Audit Timeline */}
            <div className="border border-rule rounded-[4px] bg-surface p-5">
              <AuditTimelineArtifact
                batchCode="#BS-402"
                events={auditTimeline}
              />
            </div>
          </div>
        )}
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
                <DrawerTitle>Storage verification · {selectedBatchCode}</DrawerTitle>
              </div>
              <div className="flex items-center gap-1.5">
                {batches.find((b) => b.code === selectedBatchCode)?.status === 'Available' ? (
                  <VerifiedBadge />
                ) : (
                  <StatusBadge variant="warning">In Review</StatusBadge>
                )}
                <SyncStatusBadge state={currentBatch?.syncState || 'queued'} />
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
                      <span className="font-medium text-ink truncate block">
                        {currentBatch?.collector || 'Raimati Soren'}
                      </span>
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
                      metadata={`Stencil ${selectedBatchCode} · Sack 1`}
                      caption="Original field gunny bag markings."
                    />
                    <PhotoPlate
                      label="Field scale readout"
                      metadata={`Bench Scale #04 · ${(collectionKg + 4.2).toFixed(2)} kg`}
                      caption={`Net certified ${collectionKg.toFixed(2)} kg.`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-rule text-[11px] font-mono">
                    <span className="text-ink-muted">Printable Field Docs:</span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/collection/tag/${selectedBatchCode.replace('#', '')}`}
                        target="_blank"
                        className="text-accent hover:underline font-medium"
                      >
                        A6 Tag ↗
                      </Link>
                      <span>·</span>
                      <Link
                        href={`/collection/receipt/${selectedBatchCode.replace('#', '')}`}
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

                {/* Product-Specific Storage & Environment Profile (Phase G3 / Product Guidance) */}
                <div className="space-y-1.5" data-testid="inventory-product-guidance">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink-muted">
                      Product-Specific Storage Profile & Handling Standards
                    </span>
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.2 rounded font-semibold">
                      PRE-RECEIPT INSPECTION
                    </span>
                  </div>
                  <ProductGuidanceCard
                    productIdentifier={currentBatch?.product || 'Dried Mahua Flowers'}
                    stage="STORAGE"
                    showChecklist={true}
                    interactiveChecklist={true}
                    compact={false}
                    measuredMoisturePercent={qualityGrade === 'A' ? 8.8 : qualityGrade === 'B' ? 12.4 : 16.0}
                    measuredTareKg={1.5}
                    observedStorageLocation={storageLocation}
                  />
                </div>

                {/* 2. Input Block: Arrival weight & Quality */}
                <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
                  <SectionLabel>Arrival Re-Weigh Calibration</SectionLabel>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label htmlFor="arrival-weight-input" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                        Arrival Weight (kg)
                      </label>
                      <NumberInput
                        id="arrival-weight-input"
                        value={arrivalWeight}
                        onChange={(e) => {
                          setArrivalWeight(Number(e.target.value));
                          if (arrivalWeightError) setArrivalWeightError(null);
                        }}
                        error={Boolean(arrivalWeightError)}
                        errorText={arrivalWeightError || undefined}
                        step={0.1}
                        unit="kg"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                          Storage Location
                        </label>
                        <span className="text-[10px] font-mono text-accent">
                          Rec: Rack B (Dry Stack)
                        </span>
                      </div>
                      <Select
                        id="storage-location-select"
                        value={storageLocation}
                        onChange={(e) => changeStorageLocationAction.execute(e.target.value)}
                        disabled={changeStorageLocationAction.isDisabled}
                      >
                        <option value="Rack A (Central Bay)">Rack A (Central Bay)</option>
                        <option value="Rack B (Dry Stack)">Rack B (Dry Stack) — Recommended</option>
                        <option value="Rack C (Quarantine Segregation)">Rack C (Quarantine Segregation)</option>
                      </Select>
                      <div className="text-[10.5px] font-mono text-ink-subtle pt-0.5">
                        {storageLocation.includes('Rack B') ? (
                          <span className="text-success font-medium">✓ Optimal: Aerated bay with raised dunnage pallets.</span>
                        ) : storageLocation.includes('Rack C') ? (
                          <span className="text-danger font-medium">⚠ Quarantine segregation: Restricted non-saleable bay.</span>
                        ) : (
                          <span className="text-ink-muted">Transit bay: Ensure wooden pallets are deployed.</span>
                        )}
                      </div>
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

      {/* Outward Sale Allocation Drawer (F10 Invariant: Sales cannot exceed stock) */}
      <Drawer open={isSaleDrawerOpen} onOpenChange={setIsSaleDrawerOpen}>
        <DrawerContent className="max-w-[480px]">
          <DrawerHeader>
            <DrawerTitle>Dispatch Outward Sale</DrawerTitle>
            <DrawerDescription>
              Allocate and deduct verified saleable inventory for authorized state procurement or TDCCOL processing.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="space-y-4">
            <div className="border border-rule rounded-[4px] p-3 bg-bg-sunken">
              <span className="text-[11px] uppercase tracking-wider text-ink-muted block font-mono">
                Current Saleable Stock
              </span>
              <div className="text-[20px] font-bold tabular-nums text-success font-heading">
                {availableStock.toFixed(1)} kg
              </div>
            </div>

            <div>
              <label htmlFor="sale-quantity-input" className="text-[12px] font-semibold text-ink block mb-1">
                Dispatch Quantity (kg)
              </label>
              <NumberInput
                id="sale-quantity-input"
                unit="kg"
                value={saleQuantityKg}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSaleQuantityKg(val);
                  if (val > availableStock) {
                    setSaleError(
                      `Cannot exceed available stock of ${availableStock.toFixed(1)} kg. Negative inventory is prohibited.`
                    );
                  } else {
                    setSaleError(null);
                  }
                }}
                min={0}
                max={availableStock}
                step={0.5}
                className="w-full"
              />
              {saleError && (
                <p className="text-[11px] font-mono text-danger mt-1">{saleError}</p>
              )}
            </div>

            <div>
              <label htmlFor="sale-buyer-input" className="text-[12px] font-semibold text-ink block mb-1">
                Buyer / Destination Entity
              </label>
              <input
                id="sale-buyer-input"
                type="text"
                value={saleBuyerName}
                onChange={(e) => setSaleBuyerName(e.target.value)}
                className="w-full h-9 px-3 text-[13px] border border-rule rounded-[4px] bg-surface"
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                onClick={() => setIsSaleDrawerOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteSale}
                disabled={saleQuantityKg <= 0 || saleQuantityKg > availableStock}
                className="flex-1"
              >
                Confirm Dispatch
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
