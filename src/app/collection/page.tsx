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
import { CollectionManagerOnboarding } from '../../components/onboarding/CollectionManagerOnboarding';
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
  Users,
  Truck,
  History,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Download,
  Share2,
} from 'lucide-react';
import { useHotkeys } from '../../lib/useHotkeys';
import { KeyboardShortcutsDrawer } from '../../components/manager/KeyboardShortcutsDrawer';
import {
  AuditTimelineArtifact,
  AuditTimelineEvent,
} from '../../components/artifacts/AuditTimelineArtifact';
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
  evaluateDispatchMatch,
  RECORDED_VEHICLES,
  RECORDED_DEPOTS,
  VehicleCapabilityRecord,
  DepotCapabilityRecord,
  CAPABILITY_DEFINITIONS,
  CapabilityMatchStatus,
} from '../../lib/productGuidance';

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

type CollectionSection = 'aggregation' | 'collectors' | 'dispatches' | 'audit';

interface TribalCollectorItem {
  id: string;
  tribalId: string;
  name: string;
  nameOdia: string;
  gender: 'F' | 'M';
  age: number;
  village: string;
  produce: string;
  weightKg: number;
  ratePerKg: number;
  grossPayout: number;
  bankName: string;
  accountMasked: string;
  dbtRef: string;
  paymentStatus: 'PAID_SIMULATED' | 'READY_FOR_DISBURSEMENT';
  statusVariant: StatusVariant;
  collectedDate: string;
  receiptCode: string;
  shgGroup: string;
}

interface TransitDispatchItem {
  id: string;
  batchCode: string;
  waybillId: string;
  sealTagId: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  netWeightKg: number;
  sackCount: number;
  packaging: string;
  moisturePercent: number;
  tarpaulinConfirmed: boolean;
  originCenter: string;
  destinationDepot: string;
  timestamp: string;
  status: string;
  statusVariant: StatusVariant;
  statusDetail: string;
  receiptUrl: string;
  tagUrl: string;
}

const COLLECTION_TRIBAL_COLLECTORS: TribalCollectorItem[] = [
  {
    id: 'COL-001',
    tribalId: 'OR-MAY-KRN-0842',
    name: 'Sunita Soren',
    nameOdia: 'ସୁନୀତା ସୋରେନ',
    gender: 'F',
    age: 36,
    village: 'Badagaon, Karanjia',
    produce: 'Dried Mahua Flowers',
    weightKg: 40.0,
    ratePerKg: 42.0,
    grossPayout: 1680.0,
    bankName: 'Canara Bank (Karanjia Branch)',
    accountMasked: '••••4812',
    dbtRef: 'DBT-OD-2024-8841',
    paymentStatus: 'PAID_SIMULATED',
    statusVariant: 'success',
    collectedDate: '14 Mar 2025 · 09:15 AM',
    receiptCode: '#BS-402',
    shgGroup: 'Maa Tarini SHG',
  },
  {
    id: 'COL-002',
    tribalId: 'OR-MAY-KRN-1109',
    name: 'Budhu Marndi',
    nameOdia: 'ବୁଧୁ ମାରାଣ୍ଡି',
    gender: 'M',
    age: 44,
    village: 'Badagaon, Karanjia',
    produce: 'Dried Mahua Flowers',
    weightKg: 35.0,
    ratePerKg: 42.0,
    grossPayout: 1470.0,
    bankName: 'Odisha Gramya Bank (Karanjia)',
    accountMasked: '••••9103',
    dbtRef: 'DBT-OD-2024-8842',
    paymentStatus: 'PAID_SIMULATED',
    statusVariant: 'success',
    collectedDate: '14 Mar 2025 · 09:40 AM',
    receiptCode: '#BS-402',
    shgGroup: 'Maa Tarini SHG',
  },
  {
    id: 'COL-003',
    tribalId: 'OR-MAY-KRN-0623',
    name: 'Kamla Majhi',
    nameOdia: 'କମଳା ମାଝି',
    gender: 'F',
    age: 31,
    village: 'Kadamdiha, Karanjia',
    produce: 'Dried Mahua Flowers',
    weightKg: 25.0,
    ratePerKg: 42.0,
    grossPayout: 1050.0,
    bankName: 'State Bank of India (Karanjia)',
    accountMasked: '••••2271',
    dbtRef: 'DBT-OD-2024-8843',
    paymentStatus: 'PAID_SIMULATED',
    statusVariant: 'success',
    collectedDate: '14 Mar 2025 · 10:05 AM',
    receiptCode: '#BS-402',
    shgGroup: 'Maa Tarini SHG',
  },
];

const COLLECTION_DISPATCHES: TransitDispatchItem[] = [
  {
    id: 'disp-1',
    batchCode: '#BS-402',
    waybillId: 'WB-OD-24-099',
    sealTagId: 'OD-ST-8840',
    vehicleNumber: 'OR-11-F-4412',
    driverName: 'B. Soren',
    driverPhone: '94371-88421',
    netWeightKg: 100.0,
    sackCount: 3,
    packaging: 'High-density double-stitched jute sacks',
    moisturePercent: 8.8,
    tarpaulinConfirmed: true,
    originCenter: 'Karanjia Primary MFP Point #01',
    destinationDepot: 'Baripada Central Depôt #02',
    timestamp: '14 Mar 2025 · 11:20 AM',
    status: 'In Transit',
    statusVariant: 'warning',
    statusDetail: 'En route to Baripada (Expected 02:30 PM)',
    receiptUrl: '/collection/receipt/BS-402',
    tagUrl: '/collection/tag/BS-402',
  },
  {
    id: 'disp-2',
    batchCode: '#BS-400',
    waybillId: 'WB-OD-24-097',
    sealTagId: 'OD-MBJ-KRN-400',
    vehicleNumber: 'OD-11-AB-1234',
    driverName: 'B. Nayak',
    driverPhone: '94371-55210',
    netWeightKg: 60.0,
    sackCount: 1,
    packaging: 'Standard jute sack',
    moisturePercent: 8.4,
    tarpaulinConfirmed: true,
    originCenter: 'Karanjia Primary MFP Point #01',
    destinationDepot: 'Baripada Central Depôt #02',
    timestamp: '13 Mar 2025 · 03:30 PM',
    status: 'Delivered · Verified Saleable',
    statusVariant: 'success',
    statusDetail: 'Arrival verified by S. Das (IM-04)',
    receiptUrl: '/collection/receipt/BS-400',
    tagUrl: '/collection/tag/BS-400',
  },
  {
    id: 'disp-3',
    batchCode: '#BS-398',
    waybillId: 'WB-OD-24-095',
    sealTagId: 'OD-MBJ-KRN-398',
    vehicleNumber: 'OD-11-AB-1234',
    driverName: 'B. Nayak',
    driverPhone: '94371-55210',
    netWeightKg: 25.0,
    sackCount: 1,
    packaging: 'Standard jute sack',
    moisturePercent: 8.2,
    tarpaulinConfirmed: true,
    originCenter: 'Karanjia Primary MFP Point #01',
    destinationDepot: 'Baripada Central Depôt #02',
    timestamp: '12 Mar 2025 · 04:15 PM',
    status: 'Delivered · Verified Saleable',
    statusVariant: 'success',
    statusDetail: 'Arrival verified by S. Das (IM-04)',
    receiptUrl: '/collection/receipt/BS-398',
    tagUrl: '/collection/tag/BS-398',
  },
];

const COLLECTION_AUDIT_EVENTS: AuditTimelineEvent[] = [
  {
    id: 'aud-col-1',
    dayHeader: '14 March 2025',
    time: '11:20 AM',
    actor: 'Driver B. Soren (#VH-04)',
    action: 'Dispatched Transit Waybill #WB-OD-24-099 with 3 jute sacks under tarpaulin cover to Baripada Depôt.',
    delta: '100.0 kg dispatched',
    deltaVariant: 'neutral',
  },
  {
    id: 'aud-col-2',
    dayHeader: '14 March 2025',
    time: '11:15 AM',
    actor: 'R. Mohanty (Field Manager CM-12)',
    action: 'Applied tamper-evident bag stencil tag #BS-402 and locked digital seal tag #OD-ST-8840.',
    delta: 'Seal secured',
    deltaVariant: 'success',
  },
  {
    id: 'aud-col-3',
    dayHeader: '14 March 2025',
    time: '10:07 AM',
    actor: 'Facilitator Champa Majhi (#SHG-FAC-09)',
    action: 'Intake calibration for Kamla Majhi: 25.0 kg Dried Mahua Flowers accepted. DBT ₹1,050.00 released.',
    delta: '+25.0 kg',
    deltaVariant: 'success',
  },
  {
    id: 'aud-col-4',
    dayHeader: '14 March 2025',
    time: '09:42 AM',
    actor: 'Facilitator Champa Majhi (#SHG-FAC-09)',
    action: 'Intake calibration for Budhu Marndi: 35.0 kg Dried Mahua Flowers accepted. DBT ₹1,470.00 released.',
    delta: '+35.0 kg',
    deltaVariant: 'success',
  },
  {
    id: 'aud-col-5',
    dayHeader: '14 March 2025',
    time: '09:22 AM',
    actor: 'Facilitator Champa Majhi (#SHG-FAC-09)',
    action: 'Intake calibration for Sunita Soren: 40.0 kg Dried Mahua Flowers accepted. DBT ₹1,680.00 released.',
    delta: '+40.0 kg',
    deltaVariant: 'success',
  },
  {
    id: 'aud-col-6',
    dayHeader: '14 March 2025',
    time: '09:15 AM',
    actor: 'R. Mohanty (Field Manager CM-12)',
    action: 'Aggregated Pickup Request #REQ-109 opened at Karanjia Center. Scale zero-point calibrated.',
    delta: 'Intake open',
    deltaVariant: 'neutral',
  },
];

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

  // Role onboarding state (Rule 1 & 4)
  const { isOnboarded, isLoaded, complete } = useRoleOnboarding('collection');

  const handleOpenQueue = () => {
    complete();
    document.getElementById('pickup-queue-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenOfflineQueue = () => {
    complete();
    document.getElementById('offline-queue-card')?.scrollIntoView({ behavior: 'smooth' });
  };

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

  // Deterministic initial state for SSR & initial client render (hydration-safe)
  const [filters, setFilters] = useState<ManagerFiltersState>(DEFAULT_MANAGER_FILTERS);
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLLECTION_COLUMNS);
  const [filtersHydrated, setFiltersHydrated] = useState(false);

  // Restore persisted state after mounting (Rule 3, 4, 7)
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('banasetu_filter_collection');
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
      const savedCols = localStorage.getItem('banasetu_cols_collection');
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
      localStorage.setItem('banasetu_filter_collection', JSON.stringify(filters));
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
      localStorage.setItem('banasetu_cols_collection', JSON.stringify(columns));
    } catch (e) {}
  }, [columns, filtersHydrated]);

  // Bulk Selection state (Rule 6)
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active Navigation Section (Field Operations: aggregation | collectors | dispatches | audit)
  const [activeSection, setActiveSection] = useState<CollectionSection>('aggregation');

  // Synchronize activeSection with window.location.hash and browser back/forward
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (hash === '#collectors') {
        setActiveSection('collectors');
      } else if (hash === '#dispatches') {
        setActiveSection('dispatches');
      } else if (hash === '#audit') {
        setActiveSection('audit');
      } else {
        setActiveSection('aggregation');
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

  const navigateToSection = (sec: CollectionSection) => {
    setActiveSection(sec);
    if (typeof window !== 'undefined') {
      const targetHash = sec === 'aggregation' ? '' : `#${sec}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash || window.location.pathname);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Dispatch preparation & capability matching state (Phase G3 / Product Guidance)
  const [dispatchSelectedProduce, setDispatchSelectedProduce] = useState<string>('mahua');
  const [dispatchSelectedVehicle, setDispatchSelectedVehicle] = useState<string>('OR-11-F-4412');
  const [dispatchSelectedDepot, setDispatchSelectedDepot] = useState<string>('LOC-BRP-01');
  const [dispatchSuccessNotice, setDispatchSuccessNotice] = useState<string | null>(null);

  const dispatchMatchEvaluation = evaluateDispatchMatch(
    dispatchSelectedProduce,
    dispatchSelectedVehicle,
    dispatchSelectedDepot
  );

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

  // Drawer Form State (Rule 7: 100, 0, 100 pre-filled, quality preselected)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedQueueCode, setSelectedQueueCode] = useState('#BS-402');
  const [individualReceiptToggle, setIndividualReceiptToggle] = useState(true);
  const [grossWeight, setGrossWeight] = useState(100.0);
  const [tareWeight, setTareWeight] = useState(0.0);
  const [sackCount, setSackCount] = useState<number>(1);
  const [sackTareRate, setSackTareRate] = useState<number>(1.5); // kg per sack (illustrative benchmark)
  const [qualityGrade, setQualityGrade] = useState<'A' | 'B' | 'C'>('A');
  const [acceptedQty, setAcceptedQty] = useState(100.0);
  const [rejectedQty, setRejectedQty] = useState(0.0);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [weightError, setWeightError] = useState<string | null>(null);
  const [grossError, setGrossError] = useState<string | null>(null);

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

  // Authenticated user session state (F4)
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    userId: string;
    fullName: string;
    role: string;
    centerId?: string;
  } | null>(null);

  // Check authenticated session
  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data.user) {
          setAuthenticatedUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const [serverSyncStatus, setServerSyncStatus] = useState<
    'ONLINE_SYNCED' | 'OFFLINE_LOCAL' | 'SERVER_UNAVAILABLE'
  >('OFFLINE_LOCAL');

  // Synchronize batches with Server & IndexedDB (Dexie) safely
  const loadData = async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDatabase();
      const records = await db.pendingSync.toArray();
      if (records.length > 0) {
        setOfflineQueue(records);
      }

      // Track local pending IDs that must NEVER be overwritten by server data
      const pendingSyncSet = new Set<string>();
      for (const p of records) {
        pendingSyncSet.add(p.id.replace('#', ''));
      }

      // Check syncQueue for queued or draft changes
      try {
        const queuedItems = await db.syncQueue.toArray();
        for (const q of queuedItems) {
          if (q.state === 'queued' || q.state === 'draft') {
            pendingSyncSet.add(q.batch_code.replace('#', ''));
          }
        }
      } catch {
        // syncQueue might not exist or be empty
      }

      // Check existing local batches with pending status
      const existingBatches = await db.batches.toArray();
      for (const b of existingBatches) {
        if (b.status === 'SAVED_OFFLINE_PENDING_SYNC') {
          pendingSyncSet.add(b.id.replace('#', ''));
        }
      }

      // Attempt to retrieve authorized server records when online
      if (!isOffline) {
        try {
          const res = await fetch('/api/batches');
          if (res.ok) {
            const data = await res.json();
            if (data.serverAvailable && Array.isArray(data.batches)) {
              setServerSyncStatus('ONLINE_SYNCED');

              // Merge server batches into Dexie safely:
              // Deduplicate by stable batch ID.
              // Server authoritative version takes precedence over stale local synchronized data.
              // Local pending changes are NEVER overwritten or silently discarded!
              for (const sBatch of data.batches) {
                const sId = sBatch.id.replace('#', '');
                if (pendingSyncSet.has(sId)) {
                  // Do not overwrite local-only queued / pending records
                  continue;
                }

                // Upsert authoritative server batch to local Dexie cache
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
      const consolidatedBatches = await db.batches.toArray();
      if (consolidatedBatches.length > 0) {
        const mappedQueue: QueueItem[] = consolidatedBatches.map((b) => {
          const cCont = b.collectors?.[0];
          let statusLabel: 'Pending' | 'Scheduled' | 'Collected' | 'In Review' | 'Quarantined' = 'Pending';
          let statusVariant: StatusVariant = 'warning';

          if (b.status === 'VERIFIED_SALEABLE') {
            statusLabel = 'Collected';
            statusVariant = 'success';
          } else if (b.status === 'PENDING_VERIFICATION') {
            statusLabel = 'Collected';
            statusVariant = 'info';
          } else if (b.status === 'QUARANTINED_DISCREPANCY') {
            statusLabel = 'Quarantined';
            statusVariant = 'danger';
          } else if (b.status === 'SAVED_OFFLINE_PENDING_SYNC') {
            statusLabel = 'Pending';
            statusVariant = 'warning';
          }

          const isPending = pendingSyncSet.has(b.id.replace('#', '')) || b.status === 'SAVED_OFFLINE_PENDING_SYNC';

          return {
            code: `#${b.id.replace('#', '')}`,
            collector: cCont?.name || 'Tribal Collector',
            village: cCont?.village || `${b.block}, ${b.district}`,
            product: b.produceName,
            estQty: cCont?.weightKg || b.step1?.netAcceptedKg || 40.0,
            qualityGrade: (b.step1?.grade?.includes('A') ? 'A' : b.step1?.grade?.includes('B') ? 'B' : 'A') as 'A' | 'B' | 'C',
            requestedAt: b.createdAt || 'Recent',
            requestedDateIso: new Date().toISOString().split('T')[0],
            status: statusLabel,
            statusVariant,
            syncState: isPending ? 'queued' : 'synced',
          };
        });

        setQueueItems((prev) => {
          const codeMap = new Map<string, QueueItem>();
          for (const item of prev) {
            codeMap.set(item.code, item);
          }
          for (const item of mappedQueue) {
            codeMap.set(item.code, item);
          }
          return Array.from(codeMap.values());
        });
      }
    } catch (e) {
      console.warn('Dexie/Server batch sync error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOffline]);


  // Open drawer for a specific queue item
  const handleOpenRecordDrawer = (code: string) => {
    setSelectedQueueCode(code);
    setShowDiscardPrompt(false);
    setIsDrawerOpen(true);
  };

  const handleAttemptCloseDrawer = () => {
    const hasUnsavedChanges = grossWeight !== 100.0 || tareWeight !== 0.0 || qualityGrade !== 'A';
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
      description: 'Synchronized with local field cache and server registry.',
    },
    onExecute: async () => {
      setLastFetched(new Date());
      await loadData();
    },
  });

  // 2. Sync Now Action (Safe offline sync; strictly preserves records on failure)
  const syncNowAction = useAction({
    name: 'sync-offline-queue',
    showToast: (t) => setActiveToast(t),
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
        const res = await fetch('/api/health');
        const health = await res.json().catch(() => null);

        if (!health?.database?.connected) {
          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'warning',
            title: 'Server database unconfigured · Sync postponed',
            description: 'PostgreSQL database is unconfigured. All offline records remain safely retained in local device ledger.',
          });
          return;
        }

        const db = getDatabase();
        const pending = await db.pendingSync.toArray();
        let syncedCount = 0;

        for (const item of pending) {
          try {
            const verifyRes = await fetch('/api/collection/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchId: item.id,
                grossWeightKg: item.data?.gross || 100,
                tareWeightKg: item.data?.tare || 1.5,
                netAcceptedKg: item.data?.net || (item.data?.gross || 100) - (item.data?.tare || 1.5),
                grade: item.data?.grade === 'B' ? 'Grade B - Moderate Moisture' : 'Grade A - Properly Dried',
                sackCount: item.data?.sackCount || 1,
                sealTagId: `OD-TAG-${item.id}`,
                vehicleNumber: 'OR-11-F-4412',
                driverName: 'B. Soren',
                tarpaulinConfirmed: true,
                transitWaybillId: `WB-OD-24-${item.id}`,
                observedMoisturePercent: 8.5,
                idempotencyKey: item.data?.idempotencyKey,
              }),
            });
            const vData = await verifyRes.json().catch(() => null);
            if (verifyRes.ok && vData?.success && vData?.serverVerified) {
              await db.pendingSync.delete(item.id);
              await db.batches.update(item.id, {
                status: 'PENDING_VERIFICATION',
              });
              syncedCount++;
            }
          } catch {
            // Retain on error
          }
        }

        const remaining = await db.pendingSync.toArray();
        setOfflineQueue(remaining);

        if (syncedCount > 0) {
          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'success',
            title: `${syncedCount} record(s) synchronized with server`,
            description:
              remaining.length === 0
                ? 'Local sync buffer is now clear.'
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
        console.warn('Sync attempt error:', e);
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: 'Sync failed · Records retained',
          description: 'Network or server error. All offline records remain preserved.',
        });
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
      if (grossWeight <= 0 || grossWeight > 1000 || isNaN(grossWeight)) {
        setGrossError('Gross weight must be a number between 1 and 1000.');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'danger',
          title: 'Gross weight must be a number between 1 and 1000.',
          description: 'Please correct gross scale reading before confirming.',
        });
        throw new Error('Gross weight must be a number between 1 and 1000.');
      }
      setGrossError(null);

      if (grossWeight <= tareWeight) {
        setWeightError('Tare weight must be lower than gross weight. Adjust tare deduction.');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'danger',
          title: 'Tare weight exceeds gross weight · Check scale calibration',
          description: 'Tare weight must be lower than gross weight. Adjust tare deduction.',
        });
        throw new Error('Tare weight exceeds gross weight');
      }
      setWeightError(null);

      const cleanId = selectedQueueCode.replace('#', '');
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      const actualSackCount = sackCount || 1;

      const newRecord: PendingSyncItem = {
        id: cleanId, // Deterministic ID prevents duplicate records on retry
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
          sackCount: actualSackCount,
          individualReceipt: individualReceiptToggle,
          idempotencyKey,
        },
      };

      // Helper function to safely persist locally as SAVED_OFFLINE_PENDING_SYNC
      const saveLocallyPendingSync = async (reasonNote: string) => {
        try {
          const db = getDatabase();
          // Idempotent upsert by cleanId
          await db.pendingSync.put(newRecord);
          await db.syncQueue.put({
            local_id: idempotencyKey || `SYNC-${cleanId}`,
            batch_code: selectedQueueCode,
            entity: 'collection',
            action: 'create',
            actor: {
              id: authenticatedUser?.userId || 'COL-MGR-02',
              name: authenticatedUser?.fullName || 'R. Mohanty',
              role: authenticatedUser?.role || 'Collection Manager',
            },
            payload: newRecord,
            state: 'queued',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            retryCount: 0,
            approxSizeBytes: 3500,
          });

          const existing = await db.batches.get(cleanId);
          if (existing) {
            await db.batches.update(cleanId, {
              status: 'SAVED_OFFLINE_PENDING_SYNC',
              step1: {
                ...existing.step1,
                grossWeightKg: grossWeight,
                tareWeightKg: tareWeight,
                netAcceptedKg: computedNet,
                grade:
                  qualityGrade === 'A'
                    ? 'Grade A - Properly Dried'
                    : qualityGrade === 'B'
                    ? 'Grade B - Moderate Moisture'
                    : 'Grade C - Substandard',
                sackCount: actualSackCount,
                verifiedBy: `${authenticatedUser?.fullName || 'R. Mohanty'} (Local)`,
                verifiedByRole: authenticatedUser?.role || 'Field Collection Manager',
                verifiedAt: nowStr,
                notes: reasonNote,
              },
              updatedAt: nowStr,
            });
          } else {
            await db.batches.put({
              id: cleanId,
              produceName: DEMO_PRODUCT.name,
              produceOdia: DEMO_PRODUCT.nameOdia,
              scientificName: 'Madhuca longifolia',
              district: 'Mayurbhanj (ମୟୂରଭଞ୍ଜ)',
              block: 'Karanjia (କରଞ୍ଜିଆ)',
              gramPanchayat: 'Badagaon GP',
              centerName: 'Karanjia Block Collection Point #01',
              shgName: 'Maa Tarini SHG',
              facilitatorName: 'Champa Majhi (SHG-FAC-09)',
              referenceRatePerKg: ratePerKg,
              rateSource: 'LABHA Scheme Floor MSP (Illustrative Test Baseline)',
              ratePublishedDate: '15-Apr-2024',
              seasonalReadinessStatus: 'Stored at Collection Center (Pending Sync)',
              pickupRequestId: `REQ-${cleanId}`,
              collectors: [
                {
                  id: 'COL-001',
                  tribalId: 'OR-MAY-KRN-0842',
                  name: 'Raimati Soren',
                  nameOdia: 'ରାଇମତୀ ସୋରେନ',
                  gender: 'F',
                  age: 34,
                  village: 'Badagaon, Karanjia',
                  villageOdia: 'ବଡ଼ଗାଁ, କରଞ୍ଜିଆ',
                  weightKg: computedNet,
                  ratePerKg,
                  grossPayout: computedNet * ratePerKg,
                  bankName: 'Canara Bank (Karanjia Branch)',
                  accountEnding: '•••4812',
                  dbtRef: `DBT-OD-${Math.floor(1000 + Math.random() * 9000)}`,
                  paymentStatus: 'READY_FOR_DISBURSEMENT',
                  collectedDate: nowStr,
                  signedByFacilitator: 'Champa Majhi',
                },
              ],
              status: 'SAVED_OFFLINE_PENDING_SYNC',
              step1: {
                grossWeightKg: grossWeight,
                tareWeightKg: tareWeight,
                netAcceptedKg: computedNet,
                grade:
                  qualityGrade === 'A'
                    ? 'Grade A - Properly Dried'
                    : qualityGrade === 'B'
                    ? 'Grade B - Moderate Moisture'
                    : 'Grade C - Substandard',
                sackCount: actualSackCount,
                sealTagId: `OD-TAG-${cleanId}`,
                vehicleNumber: 'OR-11-F-4412',
                driverName: 'B. Soren',
                tarpaulinConfirmed: true,
                transitWaybillId: `WB-OD-24-${cleanId}`,
                observedMoisturePercent: qualityGrade === 'A' ? 8.5 : qualityGrade === 'B' ? 12.0 : 16.0,
                verifiedBy: `${authenticatedUser?.fullName || 'R. Mohanty'} (Local)`,
                verifiedByRole: authenticatedUser?.role || 'Field Collection Manager',
                verifiedAt: nowStr,
                notes: reasonNote,
              },
              step2: null,
              createdAt: nowStr,
              updatedAt: nowStr,
            });
          }

          // Local audit event clearly marked as unauthoritative local entry
          await db.auditEvents.put({
            id: `AUD-LOCAL-${Date.now()}`,
            timestamp: nowStr,
            actorId: authenticatedUser?.userId || 'CM-12',
            actorName: authenticatedUser?.fullName || 'R. Mohanty',
            actorRole: authenticatedUser?.role || 'Field Collection Manager',
            actionType: 'OFFLINE_SAVED',
            title: `Field Weighment Saved Locally: ${computedNet} kg Net (${selectedQueueCode})`,
            description: `Gross: ${grossWeight} kg, Tare: ${tareWeight} kg. Saved locally; pending authoritative server verification.`,
            details: {
              batchCode: selectedQueueCode,
              grossWeightKg: grossWeight,
              tareWeightKg: tareWeight,
              netWeightKg: computedNet,
              qualityGrade,
              reason: reasonNote,
            },
          });
        } catch (err) {
          console.warn('Dexie save offline error:', err);
        }

        setOfflineQueue((prev) => [newRecord, ...prev.filter((i) => i.id !== cleanId)]);
        setQueueItems((prev) =>
          prev.map((item) =>
            item.code === selectedQueueCode
              ? { ...item, status: 'Pending', statusVariant: 'warning', syncState: 'queued' }
              : item
          )
        );
        setIsDrawerOpen(false);
        setShowDiscardPrompt(false);
      };

      const shouldSaveOffline = forceOffline || isOffline;

      if (shouldSaveOffline) {
        await saveLocallyPendingSync('Offline mode active');
        setActiveToast({
          id: `toast-${Date.now()}`,
          variant: 'warning',
          title: `Saved locally · ${selectedQueueCode}`,
          description: 'Network offline. Record queued in device IndexedDB pending sync.',
        });
      } else {
        // Online attempt: Call /api/collection/verify
        let serverVerified = false;
        let responseJson: any = null;

        try {
          const res = await fetch('/api/collection/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: cleanId,
              grossWeightKg: grossWeight,
              tareWeightKg: tareWeight,
              netAcceptedKg: computedNet,
              grade:
                qualityGrade === 'A'
                  ? 'Grade A - Properly Dried'
                  : qualityGrade === 'B'
                  ? 'Grade B - Moderate Moisture'
                  : 'Grade C - Substandard',
              sackCount: actualSackCount,
              sealTagId: `OD-TAG-${cleanId}`,
              vehicleNumber: 'OR-11-F-4412',
              driverName: 'B. Soren',
              tarpaulinConfirmed: true,
              transitWaybillId: `WB-OD-24-${cleanId}`,
              observedMoisturePercent: qualityGrade === 'A' ? 8.5 : qualityGrade === 'B' ? 12.0 : 16.0,
              idempotencyKey,
            }),
          });

          responseJson = await res.json().catch(() => null);

          if (res.ok && responseJson?.success && responseJson?.serverVerified) {
            serverVerified = true;
          }
        } catch (netErr) {
          // Network failure -> fallback to local safe persistence
        }

        if (serverVerified) {
          // Authoritative server response confirmed and persisted in PostgreSQL
          try {
            const db = getDatabase();
            const existing = await db.batches.get(cleanId);
            if (existing) {
              await db.batches.update(cleanId, {
                status: 'PENDING_VERIFICATION',
                step1: {
                  ...existing.step1,
                  grossWeightKg: grossWeight,
                  tareWeightKg: tareWeight,
                  netAcceptedKg: computedNet,
                  grade:
                    qualityGrade === 'A'
                      ? 'Grade A - Properly Dried'
                      : qualityGrade === 'B'
                      ? 'Grade B - Moderate Moisture'
                      : 'Grade C - Substandard',
                  sackCount: actualSackCount,
                  verifiedBy: responseJson?.verifiedBy || authenticatedUser?.fullName || 'R. Mohanty',
                  verifiedByRole: authenticatedUser?.role || 'Field Collection Manager',
                  verifiedAt: responseJson?.verifiedAt || nowStr,
                },
                updatedAt: nowStr,
              });
            }
            await db.pendingSync.delete(cleanId);
            await db.syncQueue.delete(idempotencyKey || `SYNC-${cleanId}`);
          } catch (e) {
            console.warn('Dexie update on server success:', e);
          }

          setQueueItems((prev) =>
            prev.map((item) =>
              item.code === selectedQueueCode
                ? { ...item, status: 'Collected', statusVariant: 'info', syncState: 'synced' }
                : item
            )
          );
          setIsDrawerOpen(false);
          setShowDiscardPrompt(false);

          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'success',
            title: `Server verification confirmed · ${selectedQueueCode}`,
            description: `Batch verified (${computedNet} kg net) and recorded in central server ledger.`,
          });
        } else {
          // Server returned 503 DATABASE_UNCONFIGURED, 401/403, or network failed:
          // CRITICAL SAFETY INVARIANT: Cannot be shown as a successful server verification!
          await saveLocallyPendingSync(
            responseJson?.error === 'DATABASE_UNCONFIGURED'
              ? 'PostgreSQL unconfigured; saved locally pending synchronization'
              : 'Server unverified; saved locally in offline ledger'
          );

          setActiveToast({
            id: `toast-${Date.now()}`,
            variant: 'warning',
            title: `Saved locally · Pending sync (${selectedQueueCode})`,
            description:
              responseJson?.error === 'DATABASE_UNCONFIGURED'
                ? 'Server database is unconfigured. Weighment saved locally in device ledger and queued for server synchronization.'
                : 'Server verification could not be confirmed. Record preserved locally and queued for retry.',
          });
        }
      }
    },
  });

  return (
    <AppShell>
      {/* Collection Manager First-Run Onboarding Modal (Rule 4) */}
      {!isOnboarded && isLoaded && (
        <CollectionManagerOnboarding
          onOpenQueue={handleOpenQueue}
          onOpenOfflineQueue={handleOpenOfflineQueue}
          onSkip={complete}
        />
      )}

      <div className="space-y-6">
        {/* Top of Content Header with Top-Right Primary Action (Rule 2) */}
        <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-[28px] font-semibold text-ink leading-tight">
              Collection
            </h1>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted mt-1 select-none flex items-center gap-2 flex-wrap">
              <span>Today · 14 Mar 2025 · Mayurbhanj</span>
              {authenticatedUser ? (
                <StatusBadge variant="success" className="text-[10px]">
                  {authenticatedUser.centerId || 'KRN-01'} · Manager: {authenticatedUser.fullName}
                </StatusBadge>
              ) : (
                <StatusBadge variant="neutral" className="text-[10px]">
                  Simulated Center (Demo)
                </StatusBadge>
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
          <Button
            variant="primary"
            onClick={() => {
              if (activeSection !== 'aggregation') {
                navigateToSection('aggregation');
              }
              handleOpenRecordDrawer('#BS-402');
            }}
            className="self-start sm:self-auto shadow-none"
          >
            Record collection
          </Button>
        </div>

        {/* Field Operations Section Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Field Operations Navigation"
          className="flex items-center gap-2 border-b border-rule pb-2 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            id="tab-aggregation"
            aria-selected={activeSection === 'aggregation'}
            aria-controls="aggregation"
            onClick={() => navigateToSection('aggregation')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'aggregation'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <Scale size={15} strokeWidth={1.5} />
            <span>Field Aggregation</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'aggregation' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              100 kg
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-collectors"
            aria-selected={activeSection === 'collectors'}
            aria-controls="collectors"
            onClick={() => navigateToSection('collectors')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'collectors'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <Users size={15} strokeWidth={1.5} />
            <span>Tribal Collectors</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'collectors' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              3
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-dispatches"
            aria-selected={activeSection === 'dispatches'}
            aria-controls="dispatches"
            onClick={() => navigateToSection('dispatches')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'dispatches'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <Truck size={15} strokeWidth={1.5} />
            <span>Transit Dispatches</span>
            <span
              className={cn(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-[2px]',
                activeSection === 'dispatches' ? 'bg-white/20 text-accent-ink' : 'bg-bg-sunken text-ink-muted'
              )}
            >
              3
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-audit"
            aria-selected={activeSection === 'audit'}
            aria-controls="audit"
            onClick={() => navigateToSection('audit')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-medium transition-colors select-none shrink-0 border focus:outline-2 focus:outline-accent',
              activeSection === 'audit'
                ? 'bg-accent text-accent-ink border-accent font-semibold'
                : 'bg-surface text-ink border-rule hover:bg-bg-sunken'
            )}
          >
            <History size={15} strokeWidth={1.5} />
            <span>Custody Audit Log</span>
          </button>
        </div>

        {/* ========================================================
            SECTION 1: Field Aggregation (Intake Queue & Drawer)
           ======================================================== */}
        {activeSection === 'aggregation' && (
        <div id="aggregation" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
            <div id="pickup-queue-table" className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table className="w-full border-collapse">
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-surface z-20 border-b border-rule shadow-[0_1px_0_0_var(--rule)]">
                      {/* Leading Checkbox Column */}
                      <TableHead className="w-10 px-2 text-center sticky left-0 bg-surface z-20">
                        <label htmlFor="select-all-collection-rows" className="sr-only">
                          Select all rows
                        </label>
                        <input
                          id="select-all-collection-rows"
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
                              <label htmlFor={`select-collection-row-${row.code}`} className="sr-only">
                                Select batch {row.code}
                              </label>
                              <input
                                id={`select-collection-row-${row.code}`}
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
            <div id="offline-queue-card">
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
        )}

        {/* ========================================================
            SECTION 2: Tribal Collectors Registry
           ======================================================== */}
        {activeSection === 'collectors' && (
          <div id="collectors" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Tribal Collectors Registry
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ଜନଜାତି ସଂଗ୍ରାହକ ତାଲିକା</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Verified primary tribal gatherers registered at Karanjia Center #01, Mayurbhanj District. All transactions disbursed directly into Aadhaar-seeded accounts.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <StatusBadge variant="success" className="text-[11px] font-mono">
                    3 Registered Gatherers
                  </StatusBadge>
                  <StatusBadge variant="info" className="text-[11px] font-mono">
                    100% Direct Benefit Transfer (DBT)
                  </StatusBadge>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Registered Collectors
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums">
                    3
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Karanjia Block, Mayurbhanj
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Aggregated Harvest
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums">
                    100.0 <span className="text-[13px] font-normal text-ink-muted">kg</span>
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Dried Mahua Flowers (Grade A)
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Total Disbursed Payout
                  </span>
                  <div className="font-heading text-[22px] font-bold text-success tabular-nums">
                    ₹4,200.00
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    At State MSP ₹42.00 / kg
                  </span>
                </div>
              </div>
            </div>

            {/* Collectors Table */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
              <div className="p-3.5 border-b border-rule bg-bg-sunken/30 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink">
                  Primary Gatherers Roster (3)
                </span>
                <span className="text-[11px] font-mono text-ink-subtle">
                  LABHA Scheme Direct Payout Guarantee
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Tribal Gatherer ID</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Gatherer Name</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Village / GP</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Produce</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Net Weight</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">MSP Rate</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Gross Payout</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">DBT Disbursal & Bank</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COLLECTION_TRIBAL_COLLECTORS.map((c) => (
                      <TableRow key={c.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="font-mono text-[12px] font-semibold text-accent whitespace-nowrap">
                          {c.tribalId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-semibold text-[13px] text-ink">{c.name}</div>
                          <div className="text-[11px] text-ink-muted">{c.nameOdia} · {c.gender === 'F' ? 'Female' : 'Male'}, {c.age}y</div>
                        </TableCell>
                        <TableCell className="text-[12px] text-ink whitespace-nowrap">
                          {c.village}
                        </TableCell>
                        <TableCell className="text-[12px] text-ink whitespace-nowrap font-medium">
                          {c.produce}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-ink text-right tabular-nums whitespace-nowrap">
                          {c.weightKg.toFixed(1)} kg
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-muted text-right tabular-nums whitespace-nowrap">
                          ₹{c.ratePerKg.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-success text-right tabular-nums whitespace-nowrap">
                          ₹{c.grossPayout.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-[11px] font-mono text-ink-muted whitespace-nowrap">
                          <div>{c.bankName} ({c.accountMasked})</div>
                          <div className="text-[10px] text-ink-subtle">{c.dbtRef}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge variant={c.statusVariant} className="text-[10px] font-mono">
                            PAID · DBT
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href="/collection/receipt/BS-402"
                              className="text-[11px] font-mono text-accent hover:underline inline-flex items-center gap-1 font-semibold focus:outline-2 focus:outline-accent"
                            >
                              <span>Receipt</span>
                              <ArrowRight size={11} />
                            </Link>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFilters({
                                  ...DEFAULT_MANAGER_FILTERS,
                                  search: c.name,
                                });
                                navigateToSection('aggregation');
                              }}
                              className="text-[11px] font-mono text-ink-muted hover:text-ink hover:underline focus:outline-2 focus:outline-accent"
                            >
                              Batches
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SECTION 3: Transit Dispatches & Custody Handover
           ======================================================== */}
        {activeSection === 'dispatches' && (
          <div id="dispatches" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Transit Dispatches & Custody Handover
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ପରିବହନ ଓ ହସ୍ତାନ୍ତର</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Authorized vehicle consignments dispatched from Karanjia Field Collection Center #01 to Baripada Central Depôt #02. Double-stitched jute sacks sealed under water-resistant tarpaulin covers.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <StatusBadge variant="warning" className="text-[11px] font-mono">
                    1 In Transit
                  </StatusBadge>
                  <StatusBadge variant="success" className="text-[11px] font-mono">
                    2 Delivered
                  </StatusBadge>
                </div>
              </div>

              {/* Dispatches Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Total Dispatched Batches
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums">
                    3 Lots
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    185.0 kg total net weight
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Destination Depôt
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink">
                    Baripada #02
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Terminal ID: BRP-D02-09
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Security Seal Integrity
                  </span>
                  <div className="font-heading text-[22px] font-bold text-success">
                    100% Intact
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Numbered tamper-evident tags
                  </span>
                </div>
              </div>
            </div>

            {/* Consignment Dispatch Preparation & Capability Matcher (Phase G3 / Product Guidance) */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4" data-testid="dispatch-capability-matcher">
              <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-accent" />
                    <h3 className="font-heading text-[16px] font-semibold text-ink leading-tight">
                      Prepare Consignment Dispatch & Capability Matching
                    </h3>
                    <span className="text-[11px] font-mono text-ink-muted">· ପ୍ରସ୍ତୁତି ଓ ସୁସଙ୍ଗତତା ଯାଞ୍ଚ</span>
                  </div>
                  <p className="text-[12px] text-ink-muted mt-0.5">
                    Compare product handling requirements with recorded vehicle capabilities and destination depot capabilities before issuing transit waybills.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 font-mono text-[11px]">
                  <span className="text-ink-muted">Overall Clearance:</span>
                  <StatusBadge
                    variant={
                      dispatchMatchEvaluation.overallStatus === 'SUITABLE'
                        ? 'success'
                        : dispatchMatchEvaluation.overallStatus === 'UNSUITABLE'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {dispatchMatchEvaluation.overallStatus === 'SUITABLE'
                      ? 'SUITABLE FOR DISPATCH'
                      : dispatchMatchEvaluation.overallStatus === 'UNSUITABLE'
                      ? 'UNSUITABLE — BLOCKED'
                      : 'UNKNOWN / INSPECTION REQ'}
                  </StatusBadge>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Select Produce Batch */}
                <div className="space-y-1">
                  <label htmlFor="dispatch-produce-select" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                    1. Produce Consignment
                  </label>
                  <select
                    id="dispatch-produce-select"
                    value={dispatchSelectedProduce}
                    onChange={(e) => {
                      setDispatchSelectedProduce(e.target.value);
                      setDispatchSuccessNotice(null);
                    }}
                    className="h-[36px] w-full rounded-[2px] border border-rule bg-surface px-2.5 text-[12px] font-mono text-ink focus:outline-2 focus:outline-accent"
                  >
                    <option value="mahua">#BS-402 · Dried Mahua Flowers (High Moisture Sens)</option>
                    <option value="sal-seeds">#BS-400 · Sal Tree Seeds (High Oil Sens)</option>
                    <option value="wild-honey">#LOT-HN-09 · Wild Forest Honey (Food-Grade Carboys)</option>
                    <option value="lac">#LOT-LC-12 · Natural Sticklac (Heat Sensitive &lt;35°C)</option>
                    <option value="char-seeds">#LOT-CH-03 · Char Seeds / Chironji (High Value)</option>
                    <option value="kendu-leaves">#LOT-KL-88 · Kendu Leaves (Combustible Kerries)</option>
                  </select>
                </div>

                {/* 2. Select Vehicle */}
                <div className="space-y-1">
                  <label htmlFor="dispatch-vehicle-select" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                    2. Assigned Transit Vehicle
                  </label>
                  <select
                    id="dispatch-vehicle-select"
                    value={dispatchSelectedVehicle}
                    onChange={(e) => {
                      setDispatchSelectedVehicle(e.target.value);
                      setDispatchSuccessNotice(null);
                    }}
                    className="h-[36px] w-full rounded-[2px] border border-rule bg-surface px-2.5 text-[12px] font-mono text-ink focus:outline-2 focus:outline-accent"
                  >
                    {RECORDED_VEHICLES.map((v) => (
                      <option key={v.vehicleNumber} value={v.vehicleNumber}>
                        {v.vehicleNumber} · {v.driverName} ({v.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Select Destination Depot */}
                <div className="space-y-1">
                  <label htmlFor="dispatch-depot-select" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                    3. Destination Depôt
                  </label>
                  <select
                    id="dispatch-depot-select"
                    value={dispatchSelectedDepot}
                    onChange={(e) => {
                      setDispatchSelectedDepot(e.target.value);
                      setDispatchSuccessNotice(null);
                    }}
                    className="h-[36px] w-full rounded-[2px] border border-rule bg-surface px-2.5 text-[12px] font-mono text-ink focus:outline-2 focus:outline-accent"
                  >
                    {RECORDED_DEPOTS.map((d) => (
                      <option key={d.depotId} value={d.depotId}>
                        {d.depotName} ({d.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Handling Guidance Card */}
              <ProductGuidanceCard
                productIdentifier={dispatchSelectedProduce}
                stage="DISPATCH"
                interactiveChecklist={false}
                compact={true}
              />

              {/* Side-by-side Capability Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                {/* Vehicle Compatibility Result */}
                <div
                  className={cn(
                    'border rounded-[3px] p-3 space-y-2 bg-surface',
                    dispatchMatchEvaluation.vehicleResult.status === 'SUITABLE'
                      ? 'border-success/40 bg-success/5'
                      : dispatchMatchEvaluation.vehicleResult.status === 'UNSUITABLE'
                      ? 'border-danger/40 bg-danger/5'
                      : 'border-warning/40 bg-warning/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase font-bold text-ink">
                      Vehicle Transit Compatibility
                    </span>
                    <StatusBadge
                      variant={
                        dispatchMatchEvaluation.vehicleResult.status === 'SUITABLE'
                          ? 'success'
                          : dispatchMatchEvaluation.vehicleResult.status === 'UNSUITABLE'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {dispatchMatchEvaluation.vehicleResult.status === 'SUITABLE'
                        ? 'SUITABLE'
                        : dispatchMatchEvaluation.vehicleResult.status === 'UNSUITABLE'
                        ? 'UNSUITABLE'
                        : 'UNKNOWN / REQUIRES INSPECTION'}
                    </StatusBadge>
                  </div>

                  <p className="text-ink text-[12px] leading-snug">
                    {dispatchMatchEvaluation.vehicleResult.summary}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">
                      Required Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dispatchMatchEvaluation.profile.requiredVehicleCapabilities.map((cap) => {
                        const isMatched = dispatchMatchEvaluation.vehicleResult.matchedCapabilities.includes(cap);
                        return (
                          <span
                            key={cap}
                            className={cn(
                              'px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono flex items-center gap-1',
                              isMatched
                                ? 'bg-success/15 text-success border border-success/30'
                                : 'bg-danger/15 text-danger border border-danger/30 font-bold'
                            )}
                          >
                            <span>{isMatched ? '✓' : '✗'}</span>
                            <span>{CAPABILITY_DEFINITIONS[cap]?.label || cap}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-ink-subtle pt-1 border-t border-rule/50">
                    {dispatchMatchEvaluation.vehicleResult.recommendation}
                  </div>
                </div>

                {/* Destination Depot Compatibility Result */}
                <div
                  className={cn(
                    'border rounded-[3px] p-3 space-y-2 bg-surface',
                    dispatchMatchEvaluation.depotResult.status === 'SUITABLE'
                      ? 'border-success/40 bg-success/5'
                      : dispatchMatchEvaluation.depotResult.status === 'UNSUITABLE'
                      ? 'border-danger/40 bg-danger/5'
                      : 'border-warning/40 bg-warning/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase font-bold text-ink">
                      Destination Depôt Storage Compatibility
                    </span>
                    <StatusBadge
                      variant={
                        dispatchMatchEvaluation.depotResult.status === 'SUITABLE'
                          ? 'success'
                          : dispatchMatchEvaluation.depotResult.status === 'UNSUITABLE'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {dispatchMatchEvaluation.depotResult.status === 'SUITABLE'
                        ? 'SUITABLE'
                        : dispatchMatchEvaluation.depotResult.status === 'UNSUITABLE'
                        ? 'UNSUITABLE'
                        : 'UNKNOWN / REQUIRES INSPECTION'}
                    </StatusBadge>
                  </div>

                  <p className="text-ink text-[12px] leading-snug">
                    {dispatchMatchEvaluation.depotResult.summary}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-ink-muted uppercase block">
                      Required Storage Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dispatchMatchEvaluation.profile.suitableStorageCapabilities.map((cap) => {
                        const isMatched = dispatchMatchEvaluation.depotResult.matchedCapabilities.includes(cap);
                        return (
                          <span
                            key={cap}
                            className={cn(
                              'px-1.5 py-0.5 rounded-[2px] text-[10px] font-mono flex items-center gap-1',
                              isMatched
                                ? 'bg-success/15 text-success border border-success/30'
                                : 'bg-danger/15 text-danger border border-danger/30 font-bold'
                            )}
                          >
                            <span>{isMatched ? '✓' : '✗'}</span>
                            <span>{CAPABILITY_DEFINITIONS[cap]?.label || cap}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-ink-subtle pt-1 border-t border-rule/50">
                    {dispatchMatchEvaluation.depotResult.recommendation}
                  </div>
                </div>
              </div>

              {/* Gatekeeper Decision Banner & Dispatch Action */}
              <div className="pt-2 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  {dispatchMatchEvaluation.overallStatus === 'SUITABLE' ? (
                    <div className="flex items-center gap-1.5 text-success font-medium text-[13px]">
                      <CheckCircle2 size={16} />
                      <span>Verified Dispatch Match: Safe to authorize consignment transit waybill.</span>
                    </div>
                  ) : dispatchMatchEvaluation.overallStatus === 'UNSUITABLE' ? (
                    <div className="flex items-center gap-1.5 text-danger font-medium text-[13px]">
                      <AlertTriangle size={16} />
                      <span>Incompatible Dispatch Match: Consignment authorization blocked.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-warning font-medium text-[13px]">
                      <Info size={16} />
                      <span>Physical Inspection Required: Vehicle or depot capabilities unverified.</span>
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-ink-subtle block">
                    {dispatchMatchEvaluation.blockReason || 'All required vehicle covers and depot dunnage bays are satisfied.'}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {dispatchMatchEvaluation.canDispatchSafely ? (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={() => {
                        setDispatchSuccessNotice(
                          `Consignment Waybill #WB-OD-25-042 generated! Lot queued for dispatch via ${dispatchSelectedVehicle} to ${dispatchSelectedDepot}.`
                        );
                      }}
                      className="h-[36px] text-[12px] font-semibold"
                    >
                      Authorize & Issue Waybill
                    </Button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="h-[36px] px-3 rounded-[2px] border border-rule bg-bg-sunken text-ink-muted text-[12px] font-mono cursor-not-allowed select-none opacity-60"
                      title={dispatchMatchEvaluation.blockReason}
                    >
                      {dispatchMatchEvaluation.overallStatus === 'UNSUITABLE'
                        ? 'Dispatch Blocked: Incompatible Match'
                        : 'Dispatch Blocked: Inspection Required'}
                    </button>
                  )}
                </div>
              </div>

              {dispatchSuccessNotice && (
                <div className="p-2.5 rounded-[2px] bg-success/10 border border-success/30 text-success text-[12px] font-mono flex items-center gap-2">
                  <span>✓</span>
                  <span>{dispatchSuccessNotice}</span>
                </div>
              )}
            </div>

            {/* Dispatches Roster */}
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
              <div className="p-3.5 border-b border-rule bg-bg-sunken/30 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink">
                  Consignment Waybills Roster (3)
                </span>
                <span className="text-[11px] font-mono text-ink-subtle">
                  Official TDCCOL Transit Ledger
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-bg-sunken/60">
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Batch Code</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Waybill ID</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Seal Tag ID</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Transport Vehicle & Driver</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-right">Net Weight / Sacks</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Tarpaulin & Moisture</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Dispatch Timestamp</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">Status</TableHead>
                      <TableHead className="font-mono text-[11px] uppercase tracking-wider text-ink-muted text-center">Documentation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COLLECTION_DISPATCHES.map((d) => (
                      <TableRow key={d.id} className="hover:bg-bg-sunken/30">
                        <TableCell className="font-mono text-[13px] font-bold text-accent whitespace-nowrap">
                          {d.batchCode}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] font-medium text-ink whitespace-nowrap">
                          {d.waybillId}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-muted whitespace-nowrap">
                          {d.sealTagId}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[12px]">
                          <div className="font-medium text-ink">{d.vehicleNumber}</div>
                          <div className="text-[11px] text-ink-muted font-mono">{d.driverName} ({d.driverPhone})</div>
                        </TableCell>
                        <TableCell className="font-mono text-[13px] font-bold text-ink text-right tabular-nums whitespace-nowrap">
                          <div>{d.netWeightKg.toFixed(1)} kg</div>
                          <div className="text-[10px] text-ink-muted font-normal">{d.sackCount} sack{d.sackCount > 1 ? 's' : ''}</div>
                        </TableCell>
                        <TableCell className="text-[12px] font-mono text-ink whitespace-nowrap">
                          <div className="flex items-center gap-1 text-success font-medium">
                            <span>✓</span> Tarpaulin dry
                          </div>
                          <div className="text-[10px] text-ink-subtle">{d.moisturePercent}% moisture</div>
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-ink-muted whitespace-nowrap">
                          {d.timestamp}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge variant={d.statusVariant} className="text-[10px] font-mono">
                            {d.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={d.tagUrl}
                              className="text-[11px] font-mono text-accent hover:underline font-semibold focus:outline-2 focus:outline-accent"
                            >
                              Tag PDF
                            </Link>
                            <span>·</span>
                            <Link
                              href={d.receiptUrl}
                              className="text-[11px] font-mono text-ink-muted hover:text-ink hover:underline focus:outline-2 focus:outline-accent"
                            >
                              Receipt
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SECTION 4: Custody Audit Log & Dossier
           ======================================================== */}
        {activeSection === 'audit' && (
          <div id="audit" className="space-y-6">
            {/* Header / Context Card */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[20px] font-semibold text-ink leading-tight">
                      Custody Audit Trail & Verification Log
                    </h2>
                    <span className="text-[12px] font-mono text-ink-muted">· ଅଡିଟ୍ ଓ ଯାଞ୍ଚ ଇତିହାସ</span>
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">
                    Monotonic, tamper-evident timeline of all intake weighments, supervisor calibrations, tamper-evident sack tagging, and vehicle custody dispatches.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <StatusBadge variant="success" className="text-[11px] font-mono">
                    6 Verified Audit Events
                  </StatusBadge>
                  <StatusBadge variant="info" className="text-[11px] font-mono">
                    LABHA Sec 14 Compliant
                  </StatusBadge>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Total Audit Milestones
                  </span>
                  <div className="font-heading text-[22px] font-bold text-ink tabular-nums">
                    6 Events
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Intake to Dispatch Handover
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Primary Batch Focus
                  </span>
                  <div className="font-heading text-[22px] font-bold text-accent font-mono">
                    #BS-402
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Karanjia Collection Point #01
                  </span>
                </div>
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40">
                  <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted block mb-1">
                    Official Audit Dossier
                  </span>
                  <div className="font-heading text-[16px] font-bold text-ink mt-1">
                    A4 PDF Certified
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Ready for state inspection
                  </span>
                </div>
              </div>
            </div>

            {/* Embedded Audit Timeline Artifact */}
            <div className="border border-rule rounded-[4px] bg-surface p-5">
              <AuditTimelineArtifact
                batchCode="#BS-402"
                events={COLLECTION_AUDIT_EVENTS}
              />
            </div>
          </div>
        )}
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

            {/* Product-Specific Handling & Quality Standards Profile */}
            <ProductGuidanceCard
              productIdentifier={queueItems.find((q) => q.code === selectedQueueCode)?.product || 'Dried Mahua Flowers'}
              stage="COLLECTION"
              compact={true}
              measuredMoisturePercent={qualityGrade === 'A' ? 8.8 : qualityGrade === 'B' ? 12.4 : 15.2}
              measuredTareKg={tareWeight}
            />

            {/* Section: Weight & Quality */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Weight & Quality Calibration</SectionLabel>
                <span className="text-[10px] font-mono text-ink-muted uppercase">
                  Illustrative Standards
                </span>
              </div>

              {/* Sack tare configuration row */}
              <div className="border border-rule/70 rounded-[2px] p-2 bg-bg-sunken/30 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <label htmlFor="sack-count-select" className="text-ink-muted font-medium select-none">
                    Sack Count:
                  </label>
                  <select
                    id="sack-count-select"
                    value={sackCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setSackCount(count);
                      setTareWeight(Number((count * sackTareRate).toFixed(2)));
                    }}
                    className="h-[28px] rounded-[2px] border border-rule bg-surface px-2 text-[12px] font-mono text-ink"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} Gunny Sack{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-subtle">
                  <span>Standard tare: {sackTareRate} kg/sack</span>
                  <button
                    type="button"
                    onClick={() => setTareWeight(Number((sackCount * sackTareRate).toFixed(2)))}
                    className="px-1.5 py-0.5 rounded-[2px] border border-rule bg-surface text-ink hover:text-accent hover:border-accent text-[11px]"
                  >
                    Apply standard tare ({Number((sackCount * sackTareRate).toFixed(2))} kg)
                  </button>
                </div>
              </div>

              {/* Three NumberInputs side-by-side: Gross, Tare, Net */}
              <div className="grid grid-cols-3 gap-2.5 items-end">
                <div className="space-y-1">
                  <label htmlFor="gross-weight-input" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                    Gross (kg)
                  </label>
                  <NumberInput
                    id="gross-weight-input"
                    value={grossWeight}
                    onChange={(e) => {
                      setGrossWeight(Number(e.target.value));
                      if (grossError) setGrossError(null);
                    }}
                    error={Boolean(grossError)}
                    errorText={grossError || undefined}
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

              <p className="text-[11px] text-ink-subtle font-mono">
                Tare deduction: Configurable (1.5 kg/sack illustrative baseline · Prototype calibration, not official government standard).
              </p>

              {/* Quality Grade Segmented Control (A / B / C as 3 rectangular buttons) */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase text-ink-muted block">
                    Quality Grade & Moisture Standard
                  </label>
                  <span className="text-[10px] text-ink-subtle font-mono">Illustrative Guideline</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { grade: 'A', label: 'Grade A (<10% moist)' },
                      { grade: 'B', label: 'Grade B (10-14% moist)' },
                      { grade: 'C', label: 'Grade C (>14% moist)' },
                    ] as const
                  ).map(({ grade, label }) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setQualityGrade(grade)}
                      className={cn(
                        'h-[38px] rounded-[2px] border text-[12px] font-mono font-semibold transition-colors flex flex-col items-center justify-center leading-tight',
                        qualityGrade === grade
                          ? 'border-accent bg-accent text-accent-ink'
                          : 'border-rule bg-bg-sunken text-ink hover:border-ink-subtle'
                      )}
                    >
                      <span>Grade {grade}</span>
                      <span className="text-[9px] font-normal opacity-85">
                        {grade === 'A' ? '<10% moist' : grade === 'B' ? '10-14% moist' : '>14% moist'}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-ink-subtle font-mono pt-0.5">
                  Quality grades and moisture thresholds are illustrative operational guidelines for testing and do not represent official government procurement gazettes.
                </p>
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
                  Accepted {acceptedQty} kg × ₹{ratePerKg}/kg (Illustrative baseline MSP) = ₹{computedTotal} (Simulated)
                </span>
              </div>
            </div>

            {/* Section: Evidence (Two PhotoPlate placeholders) */}
            <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Evidence Photo Plates</SectionLabel>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveToast({
                        id: `photo-${Date.now()}`,
                        title: 'Evidence Plate Captured',
                        description: 'Weighment & commodity batch photo plate attached to custody manifest.',
                        variant: 'info',
                      });
                    }}
                    className="h-[28px] px-2 rounded-[2px] border border-rule text-[11px] font-medium bg-bg-sunken hover:border-ink-subtle"
                  >
                    Attach photo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveToast({
                        id: `photo-retake-${Date.now()}`,
                        title: 'Camera Initialized',
                        description: 'Device optical sensor recalibrated for retake.',
                        variant: 'info',
                      });
                    }}
                    className="h-[28px] px-2 rounded-[2px] border border-rule text-[11px] font-medium bg-bg-sunken hover:border-ink-subtle"
                  >
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
                <label htmlFor="simulated-payment-ref" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                  Reference Field
                </label>
                <input
                  id="simulated-payment-ref"
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
                      setGrossWeight(100.0);
                      setTareWeight(0.0);
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
