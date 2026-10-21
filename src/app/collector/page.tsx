'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_COLLECTORS, DEMO_PRODUCT, DEMO_FACILITATOR } from '../../demo/seed';
import { StatusBadge, StatusVariant } from '../../components/ui/StatusBadge';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { EmptyState } from '../../components/ui/EmptyState';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/ui/Button';
import { useAction } from '../../lib/useAction';
import { LastFetchedBadge } from '../../components/ui/LastFetchedBadge';
import { useFontScale } from '../../lib/useFontScale';
import { useFirstRun } from '../../lib/useFirstRun';
import { CollectorOnboarding } from '../../components/onboarding/CollectorOnboarding';
import { useRoleOnboarding, getFirstRequestStatus, setFirstRequestCompleted } from '../../lib/useOnboarding';
import { DemoStatePanel } from '../../components/demo/DemoStatePanel';
import {
  ProductIcon,
  MahuaFlowerIcon,
  SalSeedIcon,
  TamarindIcon,
  HoneyIcon,
} from '../../components/ui/ProductIcons';
import { SyncStatusBadge } from '../../components/ui/SyncStatusBadge';
import { SyncState, db } from '../../lib/db';
import { generateULID } from '../../lib/ulid';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetBody,
  BottomSheetFooter,
  BottomSheetClose,
} from '../../components/ui/BottomSheet';
import { PhotoPlate } from '../../components/ui/PhotoPlate';
import { cn } from '../../lib/utils';
import {
  Truck,
  Plus,
  Minus,
  ChevronRight,
  Phone,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Mic,
  Camera,
  Share2,
  Printer,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface PickupRequest {
  id: string;
  productKey: 'mahua' | 'sal' | 'tamarind' | 'honey';
  productName: string;
  productNameOdia: string;
  quantityKg: number;
  isPhotoOnly?: boolean;
  statusCode: string;
  status: 'Pending' | 'Scheduled' | 'Collected' | 'Paid';
  statusVariant: StatusVariant;
  syncState?: SyncState;
  localId?: string;
  scheduledDate: string;
  center: string;
  notes: string;
}

interface ReceiptRecord {
  id: string;
  batchCode: string;
  date: string;
  productKey: 'mahua' | 'sal' | 'tamarind' | 'honey';
  productName: string;
  productNameOdia: string;
  netWeightKg: number;
  ratePerKg: number;
  totalAmount: number;
  dbtRef: string;
  bankAccount: string;
  syncState?: SyncState;
}

interface InlineConfirmationReceipt {
  code: string;
  productKey: 'mahua' | 'sal' | 'tamarind' | 'honey';
  productName: string;
  productNameOdia: string;
  quantityKg: number;
  isPhotoOnly: boolean;
  ratePerKg: number;
  totalAmount: number;
  date: string;
  dbtRef: string;
  syncState?: SyncState;
  localId?: string;
}

const AVAILABLE_PRODUCTS = [
  {
    key: 'mahua' as const,
    name: 'Dried Mahua Flowers',
    nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    rate: 42.0,
    unit: 'kg',
  },
  {
    key: 'sal' as const,
    name: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    rate: 28.0,
    unit: 'kg',
  },
  {
    key: 'tamarind' as const,
    name: 'Seeded Tamarind',
    nameOdia: 'ମଞ୍ଜି ଥିବା ତେନ୍ତୁଳି',
    rate: 36.0,
    unit: 'kg',
  },
  {
    key: 'honey' as const,
    name: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ପ୍ରାକୃତିକ ମହୁ',
    rate: 225.0,
    unit: 'kg',
  },
];

export default function CollectorMobilePage() {
  const { isOffline } = useAppStore();
  const { t, isOr } = useTranslation();
  const { fontScale } = useFontScale();
  // Prompt 14 hook:
  const { isFirstRun } = useFirstRun();

  const collector = DEMO_COLLECTORS[0]; // Raimati Soren
  const collectorFirstName = isOr ? collector.nameOdia.split(' ')[0] : collector.name.split(' ')[0];

  // Requests state
  const [requests, setRequests] = useState<PickupRequest[]>([
    {
      id: 'REQ-402',
      productKey: 'mahua',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: 40,
      statusCode: '#BS-402',
      status: 'Collected',
      statusVariant: 'info',
      syncState: 'queued',
      localId: '01HRX9Z4K00000000000000001',
      scheduledDate: '18 Apr 2024, 09:15 AM',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'Dispatched to Baripada central depôt under seal tag #OD-ST-8840.',
    },
    {
      id: 'REQ-401',
      productKey: 'sal',
      productName: 'Sal Tree Seeds',
      productNameOdia: 'ଶାଳ ମଞ୍ଜି',
      quantityKg: 25,
      statusCode: '#BS-401',
      status: 'Scheduled',
      statusVariant: 'warning',
      syncState: 'synced',
      localId: '01HRX9Z4K00000000000000002',
      scheduledDate: '20 Apr 2024, 10:30 AM',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'Van pickup vehicle scheduled for Kadamdiha village cluster.',
    },
    {
      id: 'REQ-398',
      productKey: 'mahua',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: 35,
      statusCode: '#BS-398',
      status: 'Paid',
      statusVariant: 'success',
      syncState: 'synced',
      localId: '01HRX9Z4K00000000000000003',
      scheduledDate: '12 Apr 2024, 11:00 AM',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'DBT credit confirmed to Canara Bank •••4812.',
    },
  ]);

  // Receipts state
  const [receipts] = useState<ReceiptRecord[]>([
    {
      id: 'REC-398',
      batchCode: '#BS-398',
      date: '12 Apr 2024',
      productKey: 'mahua',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      netWeightKg: 35.0,
      ratePerKg: 42.0,
      totalAmount: 1470.0,
      dbtRef: 'DBT-OD-2024-8842',
      bankAccount: 'Canara Bank (•••4812)',
      syncState: 'synced',
    },
    {
      id: 'REC-385',
      batchCode: '#BS-385',
      date: '04 Apr 2024',
      productKey: 'mahua',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      netWeightKg: 50.0,
      ratePerKg: 42.0,
      totalAmount: 2100.0,
      dbtRef: 'DBT-OD-2024-7719',
      bankAccount: 'Canara Bank (•••4812)',
      syncState: 'synced',
    },
  ]);

  // Sheet states
  const [isPickupSheetOpen, setIsPickupSheetOpen] = useState(false);
  const [selectedProductKey, setSelectedProductKey] = useState<'mahua' | 'sal' | 'tamarind' | 'honey'>('mahua');
  const [stepperQuantity, setStepperQuantity] = useState(40);
  const [isPhotoOnlyMode, setIsPhotoOnlyMode] = useState(false);

  // Voice quantity simulation state (Constraint 5)
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceSpokenText, setVoiceSpokenText] = useState('');

  // Inline Confirmation Receipt (Constraint 8: Confirmation is the receipt, not a dialog)
  const [activeConfirmationReceipt, setActiveConfirmationReceipt] = useState<InlineConfirmationReceipt | null>(null);

  // Detail sheets
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [isComplaintSheetOpen, setIsComplaintSheetOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [typedConfirmWord, setTypedConfirmWord] = useState('');
  const [lastFetched, setLastFetched] = useState<Date>(new Date());

  // Role onboarding state (Rule 1 & 2)
  const { isOnboarded, isLoaded, complete } = useRoleOnboarding('collector');
  const [showFirstRequestHint, setShowFirstRequestHint] = useState<boolean>(false);

  // First request hint timer (Rule 3: disappears after first submit or after 15s)
  useEffect(() => {
    if (isPickupSheetOpen && !getFirstRequestStatus()) {
      setShowFirstRequestHint(true);
      const timer = setTimeout(() => {
        setShowFirstRequestHint(false);
        setFirstRequestCompleted();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isPickupSheetOpen]);

  const handleCollectorOnboardingComplete = () => {
    complete();
    setTimeout(() => {
      document.getElementById('current-price-card')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Toast state
  const [activeToast, setActiveToast] = useState<{ id: string; message: string } | null>(null);

  // Selected product object
  const currentProduct = AVAILABLE_PRODUCTS.find((p) => p.key === selectedProductKey) || AVAILABLE_PRODUCTS[0];

  // Stepper handlers
  const handleIncrement = () => setStepperQuantity((prev) => Math.min(prev + 5, 250));
  const handleDecrement = () => setStepperQuantity((prev) => Math.max(prev - 5, 5));

  // Voice handler (Constraint 5)
  const handleToggleVoice = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      setVoiceSpokenText(`I said: ${stepperQuantity} kg`);
    } else {
      setIsListeningVoice(true);
      setVoiceSpokenText('');
      // Simulate speech detection after 1.8s
      setTimeout(() => {
        setIsListeningVoice(false);
        setVoiceSpokenText(`I said: ${stepperQuantity} kg`);
      }, 1800);
    }
  };

  // 1. Submit pickup request action (Click budget ≤ 4, Idempotent, No confirmation dialog)
  const submitPickupAction = useAction({
    name: 'submit-pickup-request',
    showToast: (t) => setActiveToast({ id: t.id, message: t.title }),
    receipt: {
      variant: 'success',
      title: (code) =>
        isOr
          ? `ଅନୁରୋଧ ପଠାଗଲା · ${code}`
          : `Pickup request recorded · ${code}`,
      description: 'Stored in local ledger with cloud synchronization handshake.',
    },
    onExecute: async ({ idempotencyKey }) => {
      const newCode = `#BS-${Math.floor(404 + Math.random() * 50)}`;
      const localId = generateULID();
      const recordState: SyncState = isOffline ? 'queued' : 'synced';

      // Rule 1: Write to IndexedDB syncQueue first
      try {
        await db.syncQueue.put({
          local_id: localId,
          batch_code: newCode,
          entity: 'pickup_request',
          action: 'create',
          actor: {
            id: collector.id,
            name: collector.name,
            role: 'collector',
          },
          payload: {
            productKey: currentProduct.key,
            productName: currentProduct.name,
            quantityKg: isPhotoOnlyMode ? 0 : stepperQuantity,
            collectorId: collector.id,
            collectorName: collector.name,
            center: 'Badagaon Van Dhan Kendra',
            isPhotoOnly: isPhotoOnlyMode,
          },
          state: recordState,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          retryCount: 0,
          approxSizeBytes: 1024,
        });
      } catch (err) {
        console.warn('Failed to persist pickup request to sync queue:', err);
      }

      const newReq: PickupRequest = {
        id: `REQ-${Date.now()}`,
        productKey: currentProduct.key,
        productName: currentProduct.name,
        productNameOdia: currentProduct.nameOdia,
        quantityKg: isPhotoOnlyMode ? 0 : stepperQuantity,
        isPhotoOnly: isPhotoOnlyMode,
        statusCode: newCode,
        status: 'Pending',
        statusVariant: 'warning',
        syncState: recordState,
        localId,
        scheduledDate: 'Expected Today or Tomorrow',
        center: 'Badagaon Van Dhan Kendra',
        notes: isPhotoOnlyMode
          ? `Zero-typing photo path. Produce photo registered for field weighment. Idempotency: ${idempotencyKey}`
          : `Field pickup request submitted via mobile ledger. Idempotency: ${idempotencyKey}`,
      };

      setRequests((prev) => [newReq, ...prev]);

      // Constraint 8 & 9: Confirmation IS the receipt inline on screen
      setActiveConfirmationReceipt({
        code: newCode,
        productKey: currentProduct.key,
        productName: currentProduct.name,
        productNameOdia: currentProduct.nameOdia,
        quantityKg: isPhotoOnlyMode ? 0 : stepperQuantity,
        isPhotoOnly: isPhotoOnlyMode,
        ratePerKg: currentProduct.rate,
        totalAmount: isPhotoOnlyMode ? 0 : stepperQuantity * currentProduct.rate,
        date: '14 Mar 2025 · Today',
        dbtRef: 'TXN-998-SIMULATED',
        syncState: recordState,
        localId,
      });

      // Close the entry sheet; receipt is rendered inline immediately
      setIsPickupSheetOpen(false);
      setIsPhotoOnlyMode(false);
      setIsListeningVoice(false);
      setVoiceSpokenText('');
      setShowFirstRequestHint(false);
      setFirstRequestCompleted();

      return newCode;
    },
  });

  // 2. Share Receipt Action (Constraint 12: Web Share API or Print fallback)
  const handleShareReceipt = async (receiptData: InlineConfirmationReceipt) => {
    const plainText = [
      `==============================`,
      `BANASATU OFFICIAL RECEIPT · ${receiptData.code}`,
      `==============================`,
      `Product: ${receiptData.productName}`,
      `Weight: ${receiptData.isPhotoOnly ? 'Zero-typing (Manager will weigh)' : `${receiptData.quantityKg} kg`}`,
      `Official Rate: ₹${receiptData.ratePerKg.toFixed(2)} / kg`,
      `Entitlement: ${receiptData.isPhotoOnly ? 'Calculated upon weighment' : `₹${receiptData.totalAmount.toFixed(2)}`}`,
      `Date: ${receiptData.date}`,
      `Center: Badagaon Van Dhan Kendra`,
      `Payment Ref: ${receiptData.dbtRef}`,
      `Notice: A collection manager will visit your village. You will get a receipt when weighed.`,
      `[Prototype — rates and payments simulated]`,
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `BanaSetu Receipt ${receiptData.code}`,
          text: plainText,
        });
        setActiveToast({
          id: `share-${Date.now()}`,
          message: t('collector.share_success'),
        });
        return;
      } catch (err) {
        // Fallback to window.print() if user cancelled or unsupported
      }
    }

    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // 3. Cancel Request Action (Irreversible typed confirmation word per INTERACTION.md Rule 3)
  const cancelRequestAction = useAction({
    name: 'cancel-pickup-request',
    showToast: (t) => setActiveToast({ id: t.id, message: t.title }),
    receipt: {
      variant: 'info',
      title: 'Pickup request permanently cancelled',
      description: 'Record purged from active collection dispatch queue.',
    },
    onExecute: async ({ args }) => {
      const reqId = args[0] as string;
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
      setSelectedRequest(null);
      setTypedConfirmWord('');
    },
  });

  // 4. Submit Complaint Action
  const submitComplaintAction = useAction({
    name: 'submit-complaint',
    showToast: (t) => setActiveToast({ id: t.id, message: t.title }),
    receipt: {
      variant: 'success',
      title: 'Grievance ticket #GRV-0881 registered with TDCCOL',
      description: 'Forwarded to Mayurbhanj District Tribal Welfare Officer.',
    },
    onExecute: async () => {
      setIsComplaintSheetOpen(false);
      setComplaintText('');
    },
  });

  // 5. Refresh Rates Action
  const refreshRatesAction = useAction({
    name: 'refresh-rates',
    showToast: (t) => setActiveToast({ id: t.id, message: t.title }),
    receipt: {
      variant: 'info',
      title: 'Market rates verified',
      description: 'MSP 2024 notifications synchronized.',
    },
    onExecute: async () => {
      setLastFetched(new Date());
    },
  });

  return (
    <AppShell>
      {/* 3-Slide Visual Swipeable Collector Onboarding (Rule 2) */}
      {!isOnboarded && isLoaded && (
        <CollectorOnboarding onComplete={handleCollectorOnboardingComplete} />
      )}

      {/* Dev-only ?demo=1 live state switcher */}
      <DemoStatePanel
        onTriggerZeroTyping={() => {
          setIsPickupSheetOpen(true);
          setIsPhotoOnlyMode(true);
        }}
      />

      <div
        className={cn(
          'space-y-4 text-[15px] leading-relaxed pb-8',
          isOr && 'font-odia text-[17px] leading-[1.6]'
        )}
      >
        {/* ========================================================
            TOP 20%: Context and Status Only (Constraint 1 & 2)
            Nothing important within 16px of top edge
           ======================================================== */}
        <section aria-label="Collector Status Context" className="pt-2">
          {/* Greeting Card */}
          <div className="rounded-[4px] border border-rule bg-surface p-4 sm:p-5 shadow-none">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className={cn('font-heading text-[22px] font-semibold text-ink leading-tight', isOr && 'font-odia text-[24px]')}>
                  {t('collector.greeting', { name: collectorFirstName })}
                </h1>
                <p className={cn('text-[14px] text-ink-muted mt-1 leading-snug', isOr && 'font-odia text-[16px] leading-[1.6]')}>
                  {t('collector.region_season')}
                </p>
              </div>
              <StatusBadge variant="neutral" className="shrink-0 text-[10px]">
                {t('collector.forecast_only')}
              </StatusBadge>
            </div>
          </div>
        </section>

        {/* ========================================================
            NUMBERS OVER WORDS: Prominent Price & Product Recognition
            (Constraint 3 & 4)
           ======================================================== */}
        <section id="current-price-card" aria-label="Official Rate Benchmark" className="space-y-2">
          <div className="rounded-[4px] border-2 border-accent/70 bg-surface p-4 sm:p-5 shadow-none relative">
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-accent select-none', isOr && 'font-odia text-[12px]')}>
                {t('collector.verified_rate')}
              </span>
              <LastFetchedBadge
                timestamp={lastFetched}
                onRefresh={() => refreshRatesAction.execute()}
              />
            </div>

            {/* Product recognition 48x48 icon & Big Fraunces 36px/44px Number */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="min-w-0">
                <div className="font-heading text-[44px] font-bold tabular-nums text-accent leading-none">
                  ₹{currentProduct.rate.toFixed(0)}
                </div>
                <div className={cn('text-[15px] font-medium text-ink mt-1 truncate', isOr && 'font-odia text-[17px]')}>
                  {isOr ? currentProduct.nameOdia : currentProduct.name}
                </div>
                <div className="text-[12px] text-ink-muted font-mono">
                  per {currentProduct.unit} · Mayurbhanj Mandi
                </div>
              </div>

              {/* 48x48 mono-line product icon with stroke 1.5 (Constraint 4) */}
              <div className="w-[56px] h-[56px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0">
                <ProductIcon product={currentProduct.key} size={44} />
              </div>
            </div>

            <div className="border-t border-rule pt-2 mt-2 text-[11px] text-ink-subtle font-mono leading-normal">
              {t('collector.rate_source')}
            </div>
          </div>
        </section>

        {/* ========================================================
            INLINE RECEIPT CONFIRMATION (Constraint 8, 9, 12)
            When collector submits: The receipt IS the confirmation
           ======================================================== */}
        {activeConfirmationReceipt && (
          <section
            aria-label="Submission Receipt Confirmation"
            className="rounded-[4px] border-2 border-success bg-surface p-4 sm:p-5 space-y-3 animate-in fade-in duration-300"
          >
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-success shrink-0" />
                <span className={cn('text-[12px] font-bold uppercase tracking-[0.06em] text-success', isOr && 'font-odia text-[13px]')}>
                  {t('collector.receipt_confirmation_title')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SyncStatusBadge state={activeConfirmationReceipt.syncState || (isOffline ? 'queued' : 'synced')} />
                <span className="font-mono text-[11px] text-ink-subtle">
                  {activeConfirmationReceipt.date}
                </span>
              </div>
            </div>

            {/* Batch code and client ULID */}
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[12px] uppercase text-ink-muted font-mono font-semibold block">
                  Official Batch Code:
                </span>
                {activeConfirmationReceipt.localId && (
                  <span className="text-[10px] font-mono text-ink-subtle block">
                    ULID: {activeConfirmationReceipt.localId}
                  </span>
                )}
              </div>
              <span className="font-heading text-[32px] font-bold text-ink tabular-nums">
                {activeConfirmationReceipt.code}
              </span>
            </div>

            {/* Numbers Over Words: Weight & Entitlement */}
            <div className="border border-rule rounded-[4px] p-3 bg-bg-sunken/40 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-ink-muted uppercase block font-semibold">
                  Estimated Weight:
                </span>
                {activeConfirmationReceipt.isPhotoOnly ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Camera size={16} className="text-accent" />
                    <span className="text-[13px] font-semibold text-accent">Photo only</span>
                  </div>
                ) : (
                  <div className="font-heading text-[28px] font-bold text-ink tabular-nums leading-tight">
                    {activeConfirmationReceipt.quantityKg}
                    <span className="text-[14px] font-sans font-normal text-ink-muted ml-1">kg</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] text-ink-muted uppercase block font-semibold">
                  Estimated Value:
                </span>
                {activeConfirmationReceipt.isPhotoOnly ? (
                  <span className="text-[13px] text-ink-muted block mt-1">Upon weighment</span>
                ) : (
                  <div className="font-heading text-[28px] font-bold text-accent tabular-nums leading-tight">
                    ₹{activeConfirmationReceipt.totalAmount.toFixed(0)}
                  </div>
                )}
              </div>
            </div>

            {/* What happens next (Constraint 9) */}
            <div className="p-3 border border-rule bg-surface rounded-[2px] text-[14px] text-ink leading-relaxed">
              <div className="flex items-start gap-2">
                <Info size={18} className="text-accent shrink-0 mt-0.5" />
                <p className={cn('text-[14px] text-ink', isOr && 'font-odia text-[16px] leading-[1.6]')}>
                  {t('collector.what_happens_next')}
                </p>
              </div>
            </div>

            {/* Official mock payment reference */}
            <div className="flex justify-between items-center text-[11px] font-mono text-ink-subtle pt-1">
              <span>Security Tracking:</span>
              <span className="font-semibold">{activeConfirmationReceipt.dbtRef}</span>
            </div>

            {/* Primary Action on Receipt: "Print / Share receipt" (Constraint 8 & 12) */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                onClick={() => handleShareReceipt(activeConfirmationReceipt)}
                className="h-[52px] w-full text-[15px] font-medium flex items-center justify-center gap-2 shadow-none"
              >
                <Share2 size={18} strokeWidth={1.5} />
                <span className={cn(isOr && 'font-odia text-[16px]')}>{t('collector.print_share_receipt')}</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => setActiveConfirmationReceipt(null)}
                className="h-[44px] sm:w-auto px-4 text-[13px]"
              >
                {t('collector.new_request')}
              </Button>
            </div>
          </section>
        )}

        {/* ========================================================
            BOTTOM 40% THUMB ZONE: Primary Action Button (Constraint 1)
            Sticky at bottom-[64px], 56px tall, above tab bar
           ======================================================== */}
        <section aria-label="Primary Collection Trigger" className="sticky bottom-[64px] z-20 bg-bg/95 backdrop-none py-2 border-y border-rule sm:border-0 space-y-1.5">
          {/* Offline signals: Small ink-subtle caption above submit button (Constraint 13) */}
          {isOffline && (
            <p className={cn('text-[11px] font-mono text-warning text-center select-none font-semibold', isOr && 'font-odia')}>
              {isOr
                ? 'ଅଫଲାଇନ୍ ମୋଡ୍ · ଏହି ଫୋନରେ ସାଇତା ହେବ'
                : 'Will be saved locally and sync when online'}
            </p>
          )}

          <button
            onClick={() => {
              setIsPhotoOnlyMode(false);
              setIsPickupSheetOpen(true);
            }}
            className={cn(
              'h-[56px] w-full min-h-[56px] rounded-[4px] border border-accent bg-accent text-accent-ink',
              'text-[16px] font-semibold flex items-center justify-center gap-2.5 shadow-none transition-colors select-none',
              'hover:bg-accent/90 active:bg-accent/80 focus:outline-2 focus:outline-accent focus:outline-offset-0',
              isOr && 'font-odia text-[18px]'
            )}
            aria-label="Request field pickup"
          >
            <Truck size={20} strokeWidth={1.5} />
            <span>{t('collector.request_pickup_action')}</span>
          </button>
          <p className={cn('text-[12px] text-ink-subtle text-center', isOr && 'font-odia text-[13px]')}>
            {t('collector.facilitator_note')}
          </p>
        </section>

        {/* ========================================================
            MY REQUESTS LIST: Clean, high-legibility cards
           ======================================================== */}
        <section aria-label="Active Pickup Requests" className="space-y-2 pt-2">
          <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
            <SectionLabel as="h2">{t('collector.my_requests')}</SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted tabular-nums">
              {requests.length} {t('collector.total_suffix')}
            </span>
          </div>

          {requests.length === 0 ? (
            <EmptyState
              title={t('collector.empty_requests_title')}
              description={t('collector.empty_requests_body')}
              actionLabel={t('collector.request_pickup_action')}
              onAction={() => setIsPickupSheetOpen(true)}
            />
          ) : (
            <div className="space-y-2.5">
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    'w-full min-h-[56px] rounded-[4px] border border-rule bg-surface p-3.5',
                    'flex items-center justify-between gap-3 text-left transition-colors shadow-none select-none',
                    'hover:bg-bg-sunken/40 hover:border-ink-subtle focus:outline-2 focus:outline-accent focus:outline-offset-0'
                  )}
                  aria-label={`View request details for ${req.statusCode}`}
                >
                  {/* Mono-line icon for product */}
                  <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0">
                    <ProductIcon product={req.productKey} size={32} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-semibold text-ink leading-tight', isOr && 'font-odia text-[16px]')}>
                        {isOr ? req.productNameOdia : req.productName}
                      </span>
                      <span className="font-mono text-[12px] text-ink-subtle tabular-nums font-semibold">
                        {req.statusCode}
                      </span>
                    </div>
                    <div className="text-[13px] text-ink-muted mt-0.5">
                      {req.isPhotoOnly ? (
                        <span className="text-accent font-semibold">
                          {t('collector.photo_badge')}
                        </span>
                      ) : (
                        <>
                          {t('collector.quantity_label')}{' '}
                          <strong className="font-heading text-[18px] tabular-nums text-ink">
                            {req.quantityKg} kg
                          </strong>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SyncStatusBadge state={req.syncState || (req.statusCode === '#BS-402' ? 'queued' : 'synced')} />
                    <StatusBadge variant={req.statusVariant}>
                      {req.status}
                    </StatusBadge>
                    <ChevronRight size={18} strokeWidth={1.5} className="text-ink-subtle shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================
            RECENT RECEIPTS LIST
           ======================================================== */}
        <section aria-label="Recent Settlements" className="space-y-2 pt-2">
          <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
            <SectionLabel as="h2">{t('collector.recent_receipts')}</SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted">{t('collector.past_settlements')}</span>
          </div>

          <div className="space-y-2">
            {receipts.map((rec) => (
              <div
                key={rec.id}
                className="rounded-[4px] border border-rule bg-surface p-3.5 flex items-center justify-between gap-3 shadow-none"
              >
                <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0">
                  <ProductIcon product={rec.productKey} size={32} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-ink">
                      {rec.batchCode}
                    </span>
                    <span className="text-[11px] font-mono text-ink-subtle">
                      {rec.date}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink-muted mt-0.5">
                    <span className="font-heading text-[16px] tabular-nums font-bold text-ink">
                      {rec.netWeightKg.toFixed(1)} kg
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="font-heading text-[16px] tabular-nums font-bold text-accent">
                      ₹{rec.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <SyncStatusBadge state={rec.syncState || 'synced'} />
                  <button
                    onClick={() => setSelectedReceipt(rec)}
                    className="min-h-[44px] px-3 rounded-[4px] border border-rule bg-bg-sunken text-[13px] font-medium text-ink hover:border-ink-subtle inline-flex items-center gap-1.5 focus:outline-2 focus:outline-accent focus:outline-offset-0 shrink-0"
                  >
                    <Receipt size={16} strokeWidth={1.5} className="text-ink-muted" />
                    <span className={cn(isOr && 'font-odia')}>{t('collector.view_receipt')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            CONSTRAINT 14: Permanent Footer Help Row
            Two 48px buttons: "Call helpline" (tel: link) and "File complaint"
            Never hidden behind a menu.
           ======================================================== */}
        <footer aria-label="Helpline and Grievance" className="pt-4 pb-6 space-y-2 border-t border-rule">
          <SectionLabel>{t('collector.need_assistance')}</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:18003456789"
              className={cn(
                'h-[48px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-semibold',
                'flex items-center justify-center gap-2 shadow-none hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0'
              )}
              aria-label="Call tribal welfare helpline"
            >
              <Phone size={18} strokeWidth={1.5} className="text-accent shrink-0" />
              <span className={cn(isOr && 'font-odia text-[15px]')}>{t('collector.call_helpline')}</span>
            </a>

            <button
              onClick={() => setIsComplaintSheetOpen(true)}
              className={cn(
                'h-[48px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-semibold',
                'flex items-center justify-center gap-2 shadow-none hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0'
              )}
              aria-label="Open grievance filing sheet"
            >
              <AlertCircle size={18} strokeWidth={1.5} className="text-danger shrink-0" />
              <span className={cn(isOr && 'font-odia text-[15px]')}>{t('collector.file_complaint')}</span>
            </button>
          </div>
          <p className="text-[11px] font-mono text-ink-subtle text-center">
            {t('collector.helpline_number')}
          </p>
        </footer>
      </div>

      {/* ========================================================
          BOTTOM SHEET 1: Request Field Pickup
          Includes:
          - Product recognition with mono-line icons
          - Voice-first quantity with 44px mic button (Constraint 5)
          - Numeric default keyboard inputMode="numeric" (Constraint 6)
          - Photo-first zero-typing path (Constraint 7)
          - Bottom 40% thumb zone reachability (Constraint 1 & 2)
         ======================================================== */}
      <BottomSheet open={isPickupSheetOpen} onOpenChange={setIsPickupSheetOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className={cn(isOr && 'font-odia')}>
              {t('sheet.pickup_title')}
            </BottomSheetTitle>
            <BottomSheetDescription className={cn(isOr && 'font-odia')}>
              {t('sheet.pickup_desc')}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            {/* Rule 3: Small inline hint at the top of first request sheet */}
            {showFirstRequestHint && (
              <div className="mb-3 p-2.5 rounded-[2px] border border-rule bg-bg-sunken text-[12px] text-ink flex items-center justify-between gap-2 animate-in fade-in duration-150">
                <div className="space-y-0.5">
                  <p className="font-semibold text-ink">
                    Type the quantity or tap the mic. Tap Submit when done.
                  </p>
                  {isOr && (
                    <p className="font-odia text-[13px] text-ink-muted">
                      ପରିମାଣ ଲେଖନ୍ତୁ କିମ୍ବା ମାଇକ୍ ବଟନ୍ ଦବାନ୍ତୁ। ଶେଷରେ Submit ଦବାନ୍ତୁ।
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstRequestHint(false);
                    setFirstRequestCompleted();
                  }}
                  className="text-ink-subtle hover:text-ink text-[12px] font-mono px-1.5 py-0.5 border border-rule bg-surface rounded-[2px] shrink-0"
                  aria-label="Dismiss inline hint"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Product Selection Carousel/Grid with 48x48 Mono-line Icons (Constraint 4) */}
              <div className="space-y-2">
                <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-accent block', isOr && 'font-odia')}>
                  {t('sheet.step1_label')}
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PRODUCTS.map((prod) => {
                    const isSelected = selectedProductKey === prod.key;
                    return (
                      <button
                        key={prod.key}
                        type="button"
                        onClick={() => setSelectedProductKey(prod.key)}
                        className={cn(
                          'p-2.5 rounded-[4px] border text-left flex items-center gap-2.5 transition-colors',
                          isSelected
                            ? 'border-accent bg-accent/5'
                            : 'border-rule bg-surface hover:bg-bg-sunken'
                        )}
                      >
                        <div className="w-[40px] h-[40px] rounded-[2px] bg-bg-sunken flex items-center justify-center text-ink shrink-0 border border-rule">
                          <ProductIcon product={prod.key} size={32} />
                        </div>
                        <div className="min-w-0">
                          <div className={cn('text-[13px] font-bold text-ink truncate leading-tight', isOr && 'font-odia text-[14px]')}>
                            {isOr ? prod.nameOdia : prod.name}
                          </div>
                          <div className="text-[11px] font-mono text-accent font-semibold">
                            ₹{prod.rate} / {prod.unit}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Zero-Typing Option (Constraint 7: Photo-first path) */}
              <div className="border border-rule rounded-[4px] p-3 bg-bg-sunken/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted', isOr && 'font-odia')}>
                    {t('collector.photo_first_action')}
                  </span>
                  <StatusBadge variant="accent">ZERO-TYPING</StatusBadge>
                </div>

                <Button
                  variant={isPhotoOnlyMode ? 'primary' : 'secondary'}
                  type="button"
                  onClick={() => setIsPhotoOnlyMode(!isPhotoOnlyMode)}
                  className="w-full h-[44px] text-[13px] font-medium flex items-center justify-center gap-2"
                >
                  <Camera size={18} strokeWidth={1.5} />
                  <span>
                    {isPhotoOnlyMode ? '✓ Photo produce attached' : t('collector.photo_first_action')}
                  </span>
                </Button>

                {isPhotoOnlyMode && (
                  <div className="pt-1">
                    <PhotoPlate
                      label="Produce Photo Plate"
                      caption="Recorded · Manager will calibrate weight"
                      aspectRatio="16/9"
                    />
                    <p className="text-[11px] text-ink-subtle mt-1 font-mono">
                      {t('collector.photo_first_desc')}
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2: Approximate Quantity (Only if not photo-only) */}
              {!isPhotoOnlyMode && (
                <div className="border border-rule rounded-[4px] p-4 bg-surface space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted', isOr && 'font-odia')}>
                      {t('sheet.step2_label')}
                    </span>
                    <span className="text-[11px] font-mono text-ink-subtle">{t('sheet.step_size')}</span>
                  </div>

                  {/* Quantity Stepper: Large Fraunces 36px numbers (Constraint 3) */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={stepperQuantity <= 5}
                      aria-label="Decrease quantity by 5 kg"
                      className="h-[52px] w-[52px] min-h-[44px] min-w-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink text-[22px] font-bold hover:border-ink-subtle disabled:opacity-40"
                    >
                      <Minus size={22} strokeWidth={2} />
                    </button>

                    <div className="text-center">
                      <div className="font-heading text-[36px] font-bold tabular-nums text-ink leading-none">
                        {stepperQuantity}
                        <span className="text-[18px] font-normal text-ink-muted ml-1.5 font-sans">
                          kg
                        </span>
                      </div>
                      <div className="text-[12px] font-mono text-ink-muted mt-1 tabular-nums">
                        {t('sheet.entitlement_prefix')}{' '}
                        <strong className="text-accent font-semibold">
                          ₹{(stepperQuantity * currentProduct.rate).toFixed(0)}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={stepperQuantity >= 250}
                      aria-label="Increase quantity by 5 kg"
                      className="h-[52px] w-[52px] min-h-[44px] min-w-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink text-[22px] font-bold hover:border-ink-subtle disabled:opacity-40"
                    >
                      <Plus size={22} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Constraint 5: Voice-First 44px Mic Button & Simulated Voice Input */}
                  <div className="pt-2 border-t border-rule space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleVoice}
                        className={cn(
                          'h-[44px] min-h-[44px] px-3.5 rounded-[4px] border flex items-center justify-center gap-2 text-[13px] font-medium transition-colors w-full',
                          isListeningVoice
                            ? 'border-accent bg-accent/10 text-accent font-bold animate-pulse'
                            : 'border-rule bg-bg-sunken text-ink hover:border-ink-subtle'
                        )}
                        aria-label="Speak quantity using voice"
                      >
                        <Mic size={18} strokeWidth={1.5} className={isListeningVoice ? 'text-accent' : 'text-ink-muted'} />
                        <span className={cn(isOr && 'font-odia')}>
                          {isListeningVoice ? t('collector.voice_listening') : t('collector.voice_say_qty')}
                        </span>
                      </button>
                    </div>

                    {/* Pre-filled simulated speech textfield */}
                    {voiceSpokenText && (
                      <div className="border border-rule rounded-[2px] p-2.5 bg-bg-sunken/40 space-y-1">
                        <label htmlFor="voice-spoken-input" className="text-[11px] font-mono text-ink-muted block">
                          Spoken Transcript (Simulated):
                        </label>
                        <input
                          id="voice-spoken-input"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={voiceSpokenText}
                          onChange={(e) => setVoiceSpokenText(e.target.value)}
                          className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface text-[13px] font-mono text-ink"
                        />
                        <span className="text-[10px] font-mono text-ink-subtle block">
                          {t('collector.voice_simulated')} · Prototype feature
                        </span>
                      </div>
                    )}

                    {/* Numeric default keyboard manual override (Constraint 6) */}
                    <div className="flex items-center justify-between text-[12px] pt-1">
                      <label htmlFor="manual-qty-input" className="text-ink-muted font-mono">
                        Or enter exact kg:
                      </label>
                      <input
                        id="manual-qty-input"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="5"
                        max="500"
                        value={stepperQuantity}
                        onChange={(e) => setStepperQuantity(Number(e.target.value) || 5)}
                        className="w-24 h-[34px] px-2 text-right rounded-[2px] border border-rule bg-surface font-mono font-bold text-ink"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Facilitator & Center Handshake */}
              <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-1.5 text-[13px]">
                <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted block', isOr && 'font-odia')}>
                  {t('sheet.step3_label')}
                </span>
                <div className="flex justify-between border-b border-rule pb-1">
                  <span className="text-ink-muted">{t('sheet.collection_center')}</span>
                  <span className="font-medium text-ink">Badagaon Van Dhan Kendra</span>
                </div>
                <div className="flex justify-between border-b border-rule pb-1">
                  <span className="text-ink-muted">{t('sheet.facilitator_assigned')}</span>
                  <span className="font-medium text-ink">
                    {isOr ? DEMO_FACILITATOR.nameOdia : DEMO_FACILITATOR.name}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-ink-muted">{t('sheet.labha_protection')}</span>
                  <span className="font-semibold text-success">{t('sheet.labha_status')}</span>
                </div>
              </div>
            </div>
          </BottomSheetBody>

          {/* Full-width 56px Submit Button in bottom thumb zone (Constraint 1) */}
          <BottomSheetFooter>
            {isOffline && (
              <p className="text-[12px] text-ink-subtle text-center select-none font-mono">
                Will be saved locally and sync when online.
              </p>
            )}
            <button
              onClick={() => submitPickupAction.execute()}
              disabled={submitPickupAction.isDisabled}
              className={cn(
                'h-[56px] w-full min-h-[56px] rounded-[4px] border border-accent bg-accent text-accent-ink',
                'text-[16px] font-semibold flex items-center justify-center gap-2 shadow-none select-none transition-colors disabled:opacity-40',
                'hover:bg-accent/90 active:bg-accent/80 focus:outline-2 focus:outline-accent focus:outline-offset-0',
                isOr && 'font-odia text-[18px]'
              )}
            >
              <CheckCircle2 size={20} strokeWidth={1.5} />
              <span>
                {isPhotoOnlyMode ? 'Submit photo request' : t('sheet.submit_pickup')}
              </span>
            </button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 2: Request Detail Sheet (Read-only + Cancel)
         ======================================================== */}
      <BottomSheet open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <BottomSheetTitle>Request Details</BottomSheetTitle>
              <SyncStatusBadge state={selectedRequest?.syncState || (selectedRequest?.statusCode === '#BS-402' ? 'queued' : 'synced')} />
            </div>
            <BottomSheetDescription>
              Official Tracking Code: {selectedRequest?.statusCode} {selectedRequest?.localId ? `· ULID: ${selectedRequest.localId}` : ''}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            {selectedRequest && (
              <div className="space-y-3 text-[14px]">
                <div className="flex justify-between border-b border-rule py-2">
                  <span className="text-ink-muted">Produce:</span>
                  <span className="font-semibold text-ink">{selectedRequest.productName}</span>
                </div>
                <div className="flex justify-between border-b border-rule py-2">
                  <span className="text-ink-muted">Estimated Weight:</span>
                  <span className="font-heading text-[20px] tabular-nums font-bold text-ink">
                    {selectedRequest.isPhotoOnly ? 'Photo only' : `${selectedRequest.quantityKg} kg`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-rule py-2">
                  <span className="text-ink-muted">Current Status:</span>
                  <StatusBadge variant={selectedRequest.statusVariant}>
                    {selectedRequest.status}
                  </StatusBadge>
                </div>
                <div className="flex justify-between border-b border-rule py-2">
                  <span className="text-ink-muted">Scheduled / Logged:</span>
                  <span className="font-mono text-ink text-[13px]">{selectedRequest.scheduledDate}</span>
                </div>
                <div className="flex justify-between border-b border-rule py-2">
                  <span className="text-ink-muted">Collection Depot:</span>
                  <span className="text-ink">{selectedRequest.center}</span>
                </div>

                <div className="p-3 border border-rule bg-bg-sunken/40 rounded-[2px] text-[12px] space-y-1">
                  <span className="font-mono text-ink-muted uppercase font-bold block">
                    Verification Notes:
                  </span>
                  <p className="text-ink leading-relaxed">{selectedRequest.notes}</p>
                </div>

                {/* Irreversible Cancel Action: Typed confirmation word "confirm" (Rule 3) */}
                {selectedRequest.status === 'Pending' && (
                  <div className="pt-3 border-t border-rule space-y-2">
                    <span className="text-[12px] font-bold uppercase text-danger block">
                      Cancel Pickup Request
                    </span>
                    <p className="text-[12px] text-ink-muted">
                      Type <strong className="font-mono text-danger">confirm</strong> below to purge this pickup request from dispatch:
                    </p>
                    <input
                      type="text"
                      value={typedConfirmWord}
                      onChange={(e) => setTypedConfirmWord(e.target.value.toLowerCase())}
                      placeholder='Type "confirm"'
                      className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface font-mono text-[13px] text-ink"
                    />
                    <Button
                      variant="danger"
                      disabled={typedConfirmWord !== 'confirm' || cancelRequestAction.isDisabled}
                      onClick={() => cancelRequestAction.execute(selectedRequest.id)}
                      className="w-full h-[40px] text-[13px] font-semibold"
                    >
                      Permanently Cancel Request
                    </Button>
                  </div>
                )}
              </div>
            )}
          </BottomSheetBody>

          <BottomSheetFooter>
            <Button
              variant="secondary"
              onClick={() => setSelectedRequest(null)}
              className="w-full h-[48px]"
            >
              Close details
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 3: Receipt Detail Sheet (Click budget ≤ 2)
         ======================================================== */}
      <BottomSheet open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className={cn(isOr && 'font-odia')}>
              {t('receipt.title')}
            </BottomSheetTitle>
            <BottomSheetDescription>
              Certified Electronic Scale Tare Calibration · Batch {selectedReceipt?.batchCode}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            {selectedReceipt && (
              <div className="space-y-4 text-[14px]">
                {/* Big Number: Total Payout */}
                <div className="border border-rule rounded-[4px] p-4 bg-bg-sunken text-center space-y-1">
                  <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted block', isOr && 'font-odia')}>
                    {t('receipt.disbursed_label')}
                  </span>
                  <div className="font-heading text-[40px] font-bold tabular-nums text-accent leading-none">
                    ₹{selectedReceipt.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-mono text-success pt-1">
                    {t('receipt.dbt_badge')}
                  </div>
                </div>

                <div className="space-y-2 border-t border-rule pt-2">
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">{t('receipt.net_weight')}</span>
                    <span className="font-heading text-[18px] tabular-nums font-bold text-ink">
                      {selectedReceipt.netWeightKg.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">{t('receipt.official_rate')}</span>
                    <span className="font-mono tabular-nums text-ink">
                      ₹{selectedReceipt.ratePerKg.toFixed(2)} / kg
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">{t('receipt.credited_to')}</span>
                    <span className="font-mono text-ink text-[13px]">{selectedReceipt.bankAccount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">{t('receipt.txn_ref')}</span>
                    <span className="font-mono text-ink text-[12px]">{selectedReceipt.dbtRef}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-ink-muted">{t('receipt.settlement_date')}</span>
                    <span className="font-mono text-ink">{selectedReceipt.date}</span>
                  </div>
                </div>
              </div>
            )}
          </BottomSheetBody>

          <BottomSheetFooter className="flex-col gap-2">
            {selectedReceipt && (
              <Button
                variant="primary"
                onClick={() =>
                  handleShareReceipt({
                    code: selectedReceipt.batchCode,
                    productKey: selectedReceipt.productKey,
                    productName: selectedReceipt.productName,
                    productNameOdia: selectedReceipt.productNameOdia,
                    quantityKg: selectedReceipt.netWeightKg,
                    isPhotoOnly: false,
                    ratePerKg: selectedReceipt.ratePerKg,
                    totalAmount: selectedReceipt.totalAmount,
                    date: selectedReceipt.date,
                    dbtRef: selectedReceipt.dbtRef,
                  })
                }
                className="w-full h-[52px] text-[15px] font-semibold flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                <span>{t('collector.print_share_receipt')}</span>
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setSelectedReceipt(null)}
              className="w-full h-[44px]"
            >
              {t('receipt.close')}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 4: Complaint Filing Form
         ======================================================== */}
      <BottomSheet open={isComplaintSheetOpen} onOpenChange={setIsComplaintSheetOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className={cn(isOr && 'font-odia')}>
              {t('complaint.title')}
            </BottomSheetTitle>
            <BottomSheetDescription className={cn(isOr && 'font-odia')}>
              {t('complaint.desc')}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            <div className="space-y-4 text-[14px]">
              <div className="p-3 border border-rule bg-bg-sunken rounded-[2px] text-[12px] text-ink-muted leading-relaxed">
                {t('complaint.info')}
              </div>

              <div className="space-y-1">
                <label htmlFor="complaint-type-select" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                  {t('complaint.type_label')}
                </label>
                <select
                  id="complaint-type-select"
                  className="w-full h-[40px] px-2.5 rounded-[4px] border border-rule bg-surface text-[14px] text-ink"
                >
                  <option>{t('complaint.opt_tare')}</option>
                  <option>{t('complaint.opt_delay')}</option>
                  <option>{t('complaint.opt_payment')}</option>
                  <option>{t('complaint.opt_packaging')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="complaint-textarea" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                  {t('complaint.explanation_label')}
                </label>
                <textarea
                  id="complaint-textarea"
                  rows={3}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder={t('complaint.explanation_placeholder')}
                  className="w-full p-2.5 rounded-[4px] border border-rule bg-surface text-[14px] text-ink"
                />
              </div>
            </div>
          </BottomSheetBody>

          <BottomSheetFooter>
            <Button
              variant="primary"
              disabled={submitComplaintAction.isDisabled}
              onClick={() => submitComplaintAction.execute()}
              className="w-full h-[52px] text-[15px] font-semibold"
            >
              {t('complaint.submit')}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* Floating Bottom Toast Notification */}
      {activeToast && (
        <ToastContainer>
          <Toast
            variant="success"
            title={activeToast.message}
            onClose={() => setActiveToast(null)}
          />
        </ToastContainer>
      )}
    </AppShell>
  );
}
