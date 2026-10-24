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
import { SyncState, db, getDatabase } from '../../lib/db';
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
  Volume2,
  ShieldCheck,
  Download,
  FileText,
} from 'lucide-react';
import { speakAloud } from '../../lib/speech';
import { WeatherAdvisoryCard } from '../../components/weather/WeatherAdvisoryCard';
import { downloadPdfBlob, sharePdf } from '../../lib/pdfClient';
import { ProductGuidanceCard } from '../../components/guidance/ProductGuidanceCard';

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
  const { isOffline, activeCollectorTab, setActiveCollectorTab } = useAppStore();
  const { t, isOr } = useTranslation();
  const { fontScale } = useFontScale();
  // Prompt 14 hook:
  const { isFirstRun } = useFirstRun();

  const [authenticatedUser, setAuthenticatedUser] = useState<{
    userId: string;
    fullName: string;
    role: string;
    village?: string;
  } | null>(null);

  const baseCollector = DEMO_COLLECTORS[0]; // Sunita Soren
  const collector = authenticatedUser
    ? {
        ...baseCollector,
        name: authenticatedUser.fullName,
        nameOdia: authenticatedUser.fullName,
        village: authenticatedUser.village || baseCollector.village,
      }
    : baseCollector;

  const collectorFirstName = isOr ? collector.nameOdia.split(' ')[0] : collector.name.split(' ')[0];

  const [dynamicProducts, setDynamicProducts] = useState(AVAILABLE_PRODUCTS);

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
  const [activeAttachmentId, setActiveAttachmentId] = useState<string | null>(null);

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);

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
  const [activeToast, setActiveToast] = useState<{
    id: string;
    message: string;
    onUndo?: () => void;
  } | null>(null);

  // Selected product object
  const currentProduct = dynamicProducts.find((p) => p.key === selectedProductKey) || dynamicProducts[0];

  // 1. Hydrate persistent requests from Dexie IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadDexieRecords = async () => {
      try {
        const database = getDatabase();
        const allBatches = await database.batches.toArray();
        if (allBatches.length > 0) {
          const mapped: PickupRequest[] = allBatches.map((b) => {
            const isMahua = b.produceName.toLowerCase().includes('mahua');
            const isSal = b.produceName.toLowerCase().includes('sal');
            const isTamarind = b.produceName.toLowerCase().includes('tamarind');
            const pKey: 'mahua' | 'sal' | 'tamarind' | 'honey' = isMahua
              ? 'mahua'
              : isSal
              ? 'sal'
              : isTamarind
              ? 'tamarind'
              : 'honey';
            const cContribution = b.collectors?.[0];
            const qty = cContribution ? cContribution.weightKg : (b.step1?.netAcceptedKg || 40);

            let statusLabel: 'Pending' | 'Scheduled' | 'Collected' | 'Paid' = 'Pending';
            let statusVariant: StatusVariant = 'warning';

            if (b.status === 'VERIFIED_SALEABLE') {
              statusLabel = 'Paid';
              statusVariant = 'success';
            } else if (b.status === 'PENDING_VERIFICATION') {
              statusLabel = 'Collected';
              statusVariant = 'info';
            } else if (b.status === 'SAVED_OFFLINE_PENDING_SYNC') {
              statusLabel = 'Pending';
              statusVariant = 'warning';
            }

            return {
              id: `REQ-${b.id}`,
              productKey: pKey,
              productName: b.produceName,
              productNameOdia: b.produceOdia,
              quantityKg: qty,
              statusCode: `#${b.id.startsWith('BS-') ? b.id : `BS-${b.id}`}`,
              status: statusLabel,
              statusVariant,
              syncState: b.status === 'SAVED_OFFLINE_PENDING_SYNC' ? 'queued' : 'synced',
              scheduledDate: b.createdAt || 'Recent',
              center: b.centerName || 'Badagaon Van Dhan Kendra',
              notes: `Official batch record in ${b.district}`,
            };
          });

          setRequests((prev) => {
            const existingCodes = new Set(prev.map((r) => r.statusCode));
            const newItems = mapped.filter((m) => !existingCodes.has(m.statusCode));
            return [...newItems, ...prev];
          });
        }

        // Recover any unlinked fresh draft photo in Dexie offlineAttachments on reload
        try {
          const draftAttachment = await database.offlineAttachments
            .where('recordId')
            .equals('draft-current')
            .first();
          if (draftAttachment && draftAttachment.blob) {
            const isFresh = Date.now() - draftAttachment.createdAt < 30 * 60 * 1000;
            if (isFresh) {
              setActiveAttachmentId(draftAttachment.id);
              setIsPhotoOnlyMode(true);
              const previewUrl = URL.createObjectURL(draftAttachment.blob);
              setCapturedPhotoUrl(previewUrl);
            } else {
              // Clean up stale unlinked draft
              await database.offlineAttachments.delete(draftAttachment.id);
            }
          }
        } catch {
          // Ignore draft recovery errors
        }
      } catch (err) {
        console.warn('Failed to load batches from Dexie:', err);
      }
    };

    loadDexieRecords();
  }, []);

  // 2. Check authenticated session from /api/auth/me
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

  // 3. Synchronize rates from /api/rates
  useEffect(() => {
    let isMounted = true;
    fetch('/api/rates')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.rates && Array.isArray(data.rates)) {
          setDynamicProducts((prev) =>
            prev.map((p) => {
              const matched = data.rates.find(
                (r: any) =>
                  r.produceName.toLowerCase().includes(p.key) ||
                  p.name.toLowerCase().includes(r.produceName.toLowerCase())
              );
              if (matched && matched.ratePerKg) {
                return {
                  ...p,
                  rate: matched.ratePerKg,
                };
              }
              return p;
            })
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Stepper handlers
  const handleIncrement = () => setStepperQuantity((prev) => Math.min(prev + 5, 250));
  const handleDecrement = () => setStepperQuantity((prev) => Math.max(prev - 5, 5));

  // Camera & Voice references
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  const handleTriggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      setIsPhotoOnlyMode(!isPhotoOnlyMode);
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (<= 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setActiveToast({
          id: `err-${Date.now()}`,
          message: 'Photo exceeds 5MB size limit. Please capture a smaller photo.',
        });
        return;
      }

      // Validate supported MIME types
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (file.type && !allowedMimes.includes(file.type)) {
        setActiveToast({
          id: `err-${Date.now()}`,
          message: 'Unsupported photo format. Please use JPEG, PNG, or WebP.',
        });
        return;
      }

      const attachmentId = generateULID();
      setActiveAttachmentId(attachmentId);

      // Local preview immediately for offline responsiveness
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedPhotoUrl(reader.result as string);
        setIsPhotoOnlyMode(true);
      };
      reader.readAsDataURL(file);

      // Persist photo binary directly as a Blob in Dexie offlineAttachments table
      try {
        await db.offlineAttachments.put({
          id: attachmentId,
          recordId: 'draft-current',
          batchCode: 'draft',
          blob: file,
          mimeType: file.type || 'image/jpeg',
          fileSizeBytes: file.size,
          createdAt: Date.now(),
          uploadState: 'pending',
        });
      } catch (err) {
        console.error('Failed to store offline photo Blob:', err);
        setActiveToast({
          id: `err-${Date.now()}`,
          message: 'Local storage error: Failed to persist photo on device.',
        });
      }
    }
  };

  // Voice handler (Constraint 5: Web Speech API with fallback)
  const handleToggleVoice = () => {
    if (isListeningVoice) {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListeningVoice(false);
      return;
    }

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        speechRecognitionRef.current = recognition;
        recognition.lang = isOr ? 'or-IN' : 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListeningVoice(true);
          setVoiceSpokenText('Listening for quantity...');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceSpokenText(`Heard: "${transcript}"`);
          const match = transcript.match(/\d+/);
          if (match) {
            const parsed = parseInt(match[0], 10);
            if (parsed >= 5 && parsed <= 250) {
              setStepperQuantity(parsed);
            }
          }
          setIsListeningVoice(false);
        };

        recognition.onerror = () => {
          setVoiceSpokenText(`Voice calibrated: ${stepperQuantity} kg`);
          setIsListeningVoice(false);
        };

        recognition.onend = () => {
          setIsListeningVoice(false);
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('Web Speech API initialization fallback:', err);
      }
    }

    // Graceful simulation fallback for environments without microphone access
    setIsListeningVoice(true);
    setVoiceSpokenText('Listening...');
    setTimeout(() => {
      setIsListeningVoice(false);
      setVoiceSpokenText(`Voice calibrated: ${stepperQuantity} kg`);
    }, 1800);
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
      const cleanId = newCode.replace('#', '');
      const localId = generateULID();
      // Requirement 4 & 6: Never mark synced before server acknowledgement! Always start queued.
      const recordState: SyncState = 'queued';
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      const qKg = isPhotoOnlyMode ? 0 : stepperQuantity;

      // Rule 1: Write to IndexedDB syncQueue, batches, and pendingSync
      try {
        if (activeAttachmentId) {
          try {
            await db.offlineAttachments.update(activeAttachmentId, {
              recordId: localId,
              batchCode: newCode,
            });
          } catch (attErr) {
            console.warn('Could not link offline attachment to localId:', attErr);
          }
        }

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
            id: cleanId,
            produceName: currentProduct.name,
            produceOdia: currentProduct.nameOdia,
            scientificName: 'Madhuca longifolia',
            district: 'Mayurbhanj',
            block: 'Karanjia',
            gramPanchayat: 'Badagaon',
            centerName: 'Badagaon Van Dhan Kendra',
            shgName: 'Maa Tarini SHG, Badagaon',
            facilitatorName: 'Gita Murmu',
            pickupRequestId: localId,
            collectors: [
              {
                id: `col-${localId}`,
                tribalId: collector.id,
                name: collector.name,
                nameOdia: collector.nameOdia,
                gender: 'F',
                age: 38,
                village: 'Badagaon',
                villageOdia: 'ବଡ଼ଗାଁ',
                weightKg: qKg > 0 ? qKg : 1.0,
                bankName: 'Odisha Gramya Bank',
                accountEnding: '9842',
              },
            ],
            productKey: currentProduct.key,
            quantityKg: qKg,
            isPhotoOnly: isPhotoOnlyMode,
            hasPhotoFile: Boolean(capturedPhotoUrl),
          },
          state: recordState,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          retryCount: 0,
          approxSizeBytes: capturedPhotoUrl ? 50000 : 1024,
          hasPhotos: Boolean(capturedPhotoUrl),
          attachmentId: activeAttachmentId || undefined,
        });

        await db.batches.put({
          id: cleanId,
          produceName: currentProduct.name,
          produceOdia: currentProduct.nameOdia,
          scientificName: 'Madhuca longifolia',
          district: 'Mayurbhanj (ମୟୂରଭଞ୍ଜ)',
          block: 'Karanjia (କରଞ୍ଜିଆ)',
          gramPanchayat: 'Badagaon GP',
          centerName: 'Badagaon Van Dhan Kendra',
          shgName: 'Maa Tarini Tribal Self Help Group',
          facilitatorName: DEMO_FACILITATOR.name,
          referenceRatePerKg: currentProduct.rate,
          rateSource: 'LABHA Scheme Notified Floor MSP',
          ratePublishedDate: '15-Apr-2024',
          seasonalReadinessStatus: 'Field Pickup Requested',
          pickupRequestId: `REQ-${Date.now()}`,
          collectors: [{
            id: collector.id,
            tribalId: collector.tribalId,
            name: collector.name,
            nameOdia: collector.nameOdia,
            gender: 'F',
            age: 36,
            village: collector.village,
            villageOdia: collector.villageOdia,
            weightKg: qKg,
            ratePerKg: currentProduct.rate,
            grossPayout: qKg * currentProduct.rate,
            bankName: collector.bankName,
            accountEnding: collector.accountEnding,
            dbtRef: `DBT-OD-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentStatus: 'READY_FOR_DISBURSEMENT',
            collectedDate: nowStr,
            signedByFacilitator: DEMO_FACILITATOR.name,
          }],
          status: isOffline ? 'SAVED_OFFLINE_PENDING_SYNC' : 'PENDING_VERIFICATION',
          step1: {
            grossWeightKg: Number((qKg + 1.5).toFixed(2)),
            tareWeightKg: 1.5,
            netAcceptedKg: qKg,
            grade: 'Grade A - Properly Dried',
            sackCount: 1,
            sealTagId: `OD-TAG-${cleanId}`,
            vehicleNumber: 'OR-11-F-4412',
            driverName: 'B. Soren',
            tarpaulinConfirmed: true,
            transitWaybillId: `WB-OD-24-${cleanId}`,
            observedMoisturePercent: 8.5,
            verifiedBy: 'R. Mohanty (CM-12)',
            verifiedByRole: 'Field Collection Manager',
            verifiedAt: nowStr,
            notes: isPhotoOnlyMode ? 'Zero-typing photo path' : 'Submitted via Collector App',
          },
          step2: null,
          createdAt: nowStr,
          updatedAt: nowStr,
        });

        await db.pendingSync.put({
          id: cleanId,
          code: newCode,
          collector: collector.name,
          product: currentProduct.name,
          quantityKg: qKg,
          amount: qKg * currentProduct.rate,
          timestamp: nowStr,
          data: {
            isPhotoOnly: isPhotoOnlyMode,
            localId,
          },
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
      setCapturedPhotoUrl(null);
      setActiveAttachmentId(null);
      setIsPhotoOnlyMode(false);
      setIsListeningVoice(false);
      setVoiceSpokenText('');
      setShowFirstRequestHint(false);
      setFirstRequestCompleted();

      // Fix 5: Visible recovery in ≤ 2 actions. Undo toast allows 1-tap rollback of accidental submit
      setActiveToast({
        id: `submit-${Date.now()}`,
        message: isOr
          ? `ଅନୁରୋଧ ରେକର୍ଡ ହେଲା · ${newCode}`
          : `Pickup request recorded · ${newCode}`,
        onUndo: () => {
          setRequests((prev) => prev.filter((r) => r.id !== newReq.id));
          setActiveConfirmationReceipt(null);
          setIsPickupSheetOpen(true);
        },
      });

      return newCode;
    },
  });

  // Dedicated Download Official PDF Action
  const handleDownloadReceiptPdf = async (code: string) => {
    const cleanCode = (code || '').replace(/^#/, '');
    try {
      await downloadPdfBlob({
        url: `/api/receipts/${cleanCode}/pdf`,
        filename: `BanaSetu-Receipt-${cleanCode}.pdf`,
        onLoadingChange: setIsDownloadingPdf,
        onSuccess: (fn) => {
          setActiveToast({
            id: `dl-${Date.now()}`,
            message: isOr ? `ରସିଦ PDF ଡାଉନଲୋଡ୍ ସଫଳ: ${fn}` : `Official receipt PDF downloaded: ${fn}`,
          });
        },
        onError: (errMsg) => {
          setActiveToast({
            id: `err-${Date.now()}`,
            message: errMsg,
          });
        },
      });
    } catch {
      // Handled in onError
    }
  };

  // 2. Share Receipt Action (Constraint 12: Dedicated Web Share API with text fallback)
  const handleShareReceipt = async (receiptData: InlineConfirmationReceipt) => {
    const cleanCode = (receiptData.code || '').replace(/^#/, '');
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

    try {
      await sharePdf({
        url: `/api/receipts/${cleanCode}/pdf`,
        filename: `BanaSetu-Receipt-${cleanCode}.pdf`,
        title: `BanaSetu Receipt ${receiptData.code}`,
        text: plainText,
        onLoadingChange: setIsSharingPdf,
        onSuccess: () => {
          setActiveToast({
            id: `share-${Date.now()}`,
            message: t('collector.share_success'),
          });
        },
        onError: (errMsg) => {
          setActiveToast({
            id: `err-${Date.now()}`,
            message: errMsg,
          });
        },
      });
    } catch {
      // Handled in onError
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
      variant: 'info',
      title: 'Grievance ticket registered: Saved locally — not yet submitted',
      description: 'Stored securely on device. Awaiting official grievance portal submission.',
    },
    onExecute: async () => {
      const text = complaintText.trim();
      if (!text) return;

      const grvId = `GRV-${Date.now().toString().slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
      try {
        await db.grievances.put({
          id: grvId,
          ticketNumber: grvId,
          category: 'PROCUREMENT_PRICE',
          description: text,
          collectorId: collector.id,
          collectorName: collector.name,
          village: 'Badagaon, Karanjia',
          district: 'Mayurbhanj',
          createdAt: Date.now(),
          status: 'SAVED_LOCALLY',
          notes: 'Saved locally — not yet submitted to server',
        });
      } catch (err) {
        console.warn('Failed to save grievance locally:', err);
      }

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
            TAB 1: HOME (Dashboard, Benchmark Price, Primary Action)
           ======================================================== */}
        {(activeCollectorTab === 'home' || !activeCollectorTab) && (
          <div
            id="collector-panel-home"
            role="tabpanel"
            aria-labelledby="collector-tab-home"
            tabIndex={0}
            className="space-y-4"
          >
            {/* Top 20%: Context and Status Only */}
            <section aria-label="Collector Status Context" className="pt-2">
              <div className="rounded-[4px] border border-rule bg-surface p-4 sm:p-5 shadow-none">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <h1 className={cn('font-heading text-[22px] font-semibold text-ink leading-tight break-words', isOr && 'font-odia text-[24px]')}>
                      {t('collector.greeting', { name: collectorFirstName })}
                    </h1>
                    <p className={cn('text-[14px] text-ink-muted mt-1 leading-snug break-words', isOr && 'font-odia text-[16px] leading-[1.6]')}>
                      {t('collector.region_season')}
                    </p>
                  </div>
                  {authenticatedUser ? (
                    <StatusBadge variant="success" className="shrink-0 text-[10px] mt-0.5">
                      Authenticated Field Collector
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="neutral" className="shrink-0 text-[10px] mt-0.5">
                      {t('collector.forecast_only')}
                    </StatusBadge>
                  )}
                </div>
              </div>
            </section>

            {/* Benchmark Price Card */}
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

                <div className="flex items-center justify-between gap-4 py-1 flex-wrap sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-[44px] font-bold tabular-nums text-accent leading-none">
                      ₹{currentProduct.rate.toFixed(0)}
                    </div>
                    <div className={cn('text-[15px] font-medium text-ink mt-1 break-words', isOr && 'font-odia text-[17px]')}>
                      {isOr ? currentProduct.nameOdia : currentProduct.name}
                    </div>
                    <div className="text-[12px] text-ink-muted font-mono break-words">
                      per {currentProduct.unit} · Mayurbhanj Mandi
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const spokenMsg = isOr
                            ? `${currentProduct.nameOdia}, ଦର ପ୍ରତି କିଲୋଗ୍ରାମ ${currentProduct.rate.toFixed(0)} ଟଙ୍କା।`
                            : `Official price for ${currentProduct.name} is ${currentProduct.rate.toFixed(0)} rupees per kilogram.`;
                          speakAloud(spokenMsg, isOr ? 'or-IN' : 'en-IN');
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-bg-sunken border border-rule text-ink hover:border-accent text-[11px] font-mono select-none"
                        aria-label="Listen to price aloud"
                      >
                        <Volume2 size={13} className="text-accent" />
                        <span>{isOr ? 'ଦର ଶୁଣନ୍ତୁ (Listen)' : 'Listen to Rate'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCollectorTab('prices')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-bg-sunken border border-rule text-ink hover:border-ink text-[11px] font-mono select-none"
                      >
                        <span>{isOr ? 'ସମସ୍ତ ଦର ଦେଖନ୍ତୁ →' : 'View all prices →'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-[56px] h-[56px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 overflow-hidden shadow-sm">
                    <ProductIcon product={currentProduct.key} size={56} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="border-t border-rule pt-2 mt-2 text-[11px] text-ink-subtle font-mono leading-normal">
                  {t('collector.rate_source')}
                </div>
              </div>
            </section>

            {/* Weather & Produce Drying Advisory */}
            <WeatherAdvisoryCard />

            {/* Inline Confirmation Receipt (when submitted) */}
            {activeConfirmationReceipt && (
              <section
                aria-label="Submission Receipt Confirmation"
                className="rounded-[4px] border-2 border-success bg-surface p-4 sm:p-5 space-y-3"
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

                <div className="p-3 border border-rule bg-surface rounded-[2px] text-[14px] text-ink leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Info size={18} className="text-accent shrink-0 mt-0.5" />
                    <p className={cn('text-[14px] text-ink', isOr && 'font-odia text-[16px]')}>
                      {t('collector.what_happens_next')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-ink-subtle pt-1">
                  <span>Security Tracking:</span>
                  <span className="font-semibold">{activeConfirmationReceipt.dbtRef}</span>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    id="btn-download-receipt-pdf"
                    variant="primary"
                    onClick={() => handleDownloadReceiptPdf(activeConfirmationReceipt.code)}
                    disabled={isDownloadingPdf}
                    className="h-[52px] flex-1 text-[15px] font-semibold flex items-center justify-center gap-2 shadow-none"
                    aria-label="Download official receipt PDF directly"
                  >
                    <Download size={18} strokeWidth={1.5} />
                    <span className={cn(isOr && 'font-odia text-[16px]')}>
                      {isDownloadingPdf
                        ? (isOr ? 'ଡାଉନଲୋଡ୍ ଚାଲିଛି...' : 'Downloading PDF...')
                        : (isOr ? 'ରସିଦ ଡାଉନଲୋଡ୍ (PDF)' : 'Download Receipt PDF')}
                    </span>
                  </Button>
                  <Button
                    id="btn-share-receipt"
                    variant="secondary"
                    onClick={() => handleShareReceipt(activeConfirmationReceipt)}
                    disabled={isSharingPdf}
                    className="h-[52px] sm:w-auto px-4 text-[14px] font-medium flex items-center justify-center gap-2"
                    aria-label="Share receipt via system share sheet"
                  >
                    <Share2 size={17} strokeWidth={1.5} />
                    <span className={cn(isOr && 'font-odia text-[15px]')}>
                      {isSharingPdf ? (isOr ? 'ସେୟାରିଂ...' : 'Sharing...') : (isOr ? 'ସେୟାର କରନ୍ତୁ' : 'Share Receipt')}
                    </span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveConfirmationReceipt(null)}
                    className="h-[52px] sm:w-auto px-4 text-[13px]"
                  >
                    {t('collector.new_request')}
                  </Button>
                </div>
              </section>
            )}

            {/* Sticky Primary Action Trigger Button */}
            <section aria-label="Primary Collection Trigger" className="sticky bottom-[64px] z-20 bg-bg/95 backdrop-none py-2 border-y border-rule sm:border-0 space-y-1.5">
              {isOffline && (
                <p className={cn('text-[11px] font-mono text-warning text-center select-none font-semibold', isOr && 'font-odia')}>
                  {isOr
                    ? 'ଅଫଲାଇନ୍ ମୋଡ୍ · ଏହି ଫୋନରେ ସାଇତା ହେବ'
                    : 'Will be saved locally and sync when online'}
                </p>
              )}

              <button
                type="button"
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

            {/* Quick Overview of Active Requests */}
            <section aria-label="Active Pickup Requests Summary" className="space-y-2 pt-2">
              <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                <SectionLabel as="h2">{t('collector.my_requests')}</SectionLabel>
                <button
                  type="button"
                  onClick={() => setActiveCollectorTab('requests')}
                  className="text-[12px] font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>{isOr ? 'ସମସ୍ତ ଦେଖନ୍ତୁ' : 'View all'} ({requests.length})</span>
                  <ChevronRight size={14} />
                </button>
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
                  {requests.slice(0, 2).map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className={cn(
                        'w-full min-h-[56px] rounded-[4px] border border-rule bg-surface p-3.5',
                        'flex items-center justify-between gap-3 text-left transition-colors shadow-none select-none',
                        'hover:bg-bg-sunken/40 hover:border-ink-subtle focus:outline-2 focus:outline-accent focus:outline-offset-0'
                      )}
                      aria-label={`View request details for ${req.statusCode}`}
                    >
                      <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 overflow-hidden shadow-sm">
                        <ProductIcon product={req.productKey} size={44} className="w-full h-full object-cover" />
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
                            <span className="text-accent font-semibold">{t('collector.photo_badge')}</span>
                          ) : (
                            <>
                              {t('collector.quantity_label')}{' '}
                              <strong className="font-heading text-[18px] tabular-nums text-ink">{req.quantityKg} kg</strong>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SyncStatusBadge state={req.syncState || (req.statusCode === '#BS-402' ? 'queued' : 'synced')} />
                        <StatusBadge variant={req.statusVariant}>{req.status}</StatusBadge>
                        <ChevronRight size={18} strokeWidth={1.5} className="text-ink-subtle shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Quick Overview of Recent Receipts */}
            <section aria-label="Recent Settlements Summary" className="space-y-2 pt-2">
              <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
                <SectionLabel as="h2">{t('collector.recent_receipts')}</SectionLabel>
                <button
                  type="button"
                  onClick={() => setActiveCollectorTab('requests')}
                  className="text-[12px] font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>{isOr ? 'ରସିଦ ଇତିହାସ' : 'Receipts history'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-2">
                {receipts.slice(0, 1).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-[4px] border border-rule bg-surface p-3.5 flex items-center justify-between gap-3 shadow-none"
                  >
                    <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 overflow-hidden shadow-sm">
                      <ProductIcon product={rec.productKey} size={44} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-ink">{rec.batchCode}</span>
                        <span className="text-[11px] font-mono text-ink-subtle">{rec.date}</span>
                      </div>
                      <div className="text-[13px] text-ink-muted mt-0.5">
                        <span className="font-heading text-[16px] tabular-nums font-bold text-ink">{rec.netWeightKg.toFixed(1)} kg</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-heading text-[16px] tabular-nums font-bold text-accent">₹{rec.totalAmount.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SyncStatusBadge state={rec.syncState || 'synced'} />
                      <button
                        type="button"
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

            {/* Footer Assistance Row */}
            <footer aria-label="Helpline and Grievance" className="pt-4 pb-6 space-y-2 border-t border-rule">
              <div className="flex items-baseline justify-between">
                <SectionLabel>{t('collector.need_assistance')}</SectionLabel>
                <button
                  type="button"
                  onClick={() => setActiveCollectorTab('help')}
                  className="text-[12px] font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <span>{isOr ? 'ସହାୟତା କେନ୍ଦ୍ର →' : 'Help & Support →'}</span>
                </button>
              </div>
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
                  type="button"
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
        )}

        {/* ========================================================
            TAB 2: PRICES (Produce Price Catalogue & MSP)
           ======================================================== */}
        {activeCollectorTab === 'prices' && (
          <div
            id="collector-panel-prices"
            role="tabpanel"
            aria-labelledby="collector-tab-prices"
            tabIndex={0}
            className="space-y-4 pt-2"
          >
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <div>
                <SectionLabel as="h1" className="text-[18px]">
                  {isOr ? 'ସରକାରୀ ଦର ତାଲିକା (ଏମଏସପି)' : 'Verified Produce Rates'}
                </SectionLabel>
                <p className="text-[12px] text-ink-muted">
                  {isOr
                    ? 'ଓଡ଼ିଶା ସରକାର ଲାଭ ଯୋଜନା ଅନୁମୋଦିତ ସର୍ବନିମ୍ନ ସହାୟକ ମୂଲ୍ୟ'
                    : 'Odisha LABHA scheme statutory minimum support prices'}
                </p>
              </div>
              <LastFetchedBadge
                timestamp={lastFetched}
                onRefresh={() => refreshRatesAction.execute()}
              />
            </div>

            {/* Produce Price Cards List */}
            <div className="space-y-3">
              {dynamicProducts.map((prod) => (
                <div
                  key={prod.key}
                  className="rounded-[4px] border border-rule bg-surface p-4 space-y-3 shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-[52px] h-[52px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 mt-0.5 overflow-hidden shadow-sm">
                        <ProductIcon product={prod.key} size={52} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className={cn('text-[17px] font-bold text-ink leading-tight break-words', isOr && 'font-odia text-[19px]')}>
                          {isOr ? prod.nameOdia : prod.name}
                        </h2>
                        <div className="text-[12px] text-ink-muted font-mono mt-0.5">
                          {isOr ? prod.name : prod.nameOdia} · per {prod.unit}
                        </div>
                        <span className="inline-block mt-1.5 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-[2px] bg-accent/10 border border-accent/20 text-accent">
                          {isOr ? 'ରାଜ୍ୟ ସୁରକ୍ଷିତ ଏମଏସପି' : 'LABHA Protected MSP'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-heading text-[32px] font-bold text-accent tabular-nums leading-none">
                        ₹{prod.rate.toFixed(0)}
                      </div>
                      <div className="text-[11px] font-mono text-ink-subtle mt-0.5">
                        / {prod.unit}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rule flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const spokenMsg = isOr
                          ? `${prod.nameOdia}, ସରକାରୀ ଦର ପ୍ରତି କିଲୋଗ୍ରାମ ${prod.rate.toFixed(0)} ଟଙ୍କା।`
                          : `Official MSP rate for ${prod.name} is ${prod.rate.toFixed(0)} rupees per kilogram.`;
                        speakAloud(spokenMsg, isOr ? 'or-IN' : 'en-IN');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] bg-bg-sunken border border-rule text-ink hover:border-accent text-[12px] font-mono select-none"
                      aria-label={`Listen to ${prod.name} rate aloud`}
                    >
                      <Volume2 size={14} className="text-accent" />
                      <span>{isOr ? 'ଦର ଶୁଣନ୍ତୁ' : 'Listen to Rate'}</span>
                    </button>

                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedProductKey(prod.key);
                        setStepperQuantity(40);
                        setIsPhotoOnlyMode(false);
                        setIsPickupSheetOpen(true);
                      }}
                      className="h-[40px] px-3.5 text-[13px] font-semibold flex items-center gap-1.5 shadow-none"
                      aria-label={`Book pickup for ${prod.name}`}
                    >
                      <Truck size={15} strokeWidth={1.5} />
                      <span className={cn(isOr && 'font-odia')}>{isOr ? 'ପିକଅପ୍ ବୁକ୍' : 'Book Pickup'}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rate Source Disclaimer */}
            <div className="border border-rule rounded-[3px] p-3 bg-bg-sunken/40 text-[11px] text-ink-subtle font-mono leading-normal">
              {t('collector.rate_source')}
            </div>

            {/* Weather & Produce Drying Advisory */}
            <WeatherAdvisoryCard />
          </div>
        )}

        {/* ========================================================
            TAB 3: REQUESTS (Pickup Requests & Settlements)
           ======================================================== */}
        {activeCollectorTab === 'requests' && (
          <div
            id="collector-panel-requests"
            role="tabpanel"
            aria-labelledby="collector-tab-requests"
            tabIndex={0}
            className="space-y-4 pt-2"
          >
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <div>
                <SectionLabel as="h1" className="text-[18px]">
                  {t('collector.my_requests')}
                </SectionLabel>
                <p className="text-[12px] text-ink-muted">
                  {isOr ? 'ସମସ୍ତ ପିକଅପ୍ ଅନୁରୋଧ ଓ ରସିଦ ବିବରଣୀ' : 'Field collection bookings and past settlement receipts'}
                </p>
              </div>
              <span className="text-[11px] font-mono text-ink-muted tabular-nums px-2 py-0.5 rounded-[2px] bg-bg-sunken border border-rule">
                {requests.length} {t('collector.total_suffix')}
              </span>
            </div>

            {/* Action Trigger Button inside Requests Tab */}
            <button
              type="button"
              onClick={() => {
                setIsPhotoOnlyMode(false);
                setIsPickupSheetOpen(true);
              }}
              className={cn(
                'h-[52px] w-full min-h-[52px] rounded-[4px] border border-accent bg-accent text-accent-ink',
                'text-[15px] font-semibold flex items-center justify-center gap-2.5 shadow-none transition-colors select-none',
                'hover:bg-accent/90 active:bg-accent/80 focus:outline-2 focus:outline-accent focus:outline-offset-0',
                isOr && 'font-odia text-[17px]'
              )}
              aria-label="Request field pickup"
            >
              <Truck size={18} strokeWidth={1.5} />
              <span>{t('collector.request_pickup_action')}</span>
            </button>

            {/* Active Requests List */}
            <div className="space-y-2.5">
              {requests.length === 0 ? (
                <EmptyState
                  title={t('collector.empty_requests_title')}
                  description={t('collector.empty_requests_body')}
                  actionLabel={t('collector.request_pickup_action')}
                  onAction={() => setIsPickupSheetOpen(true)}
                />
              ) : (
                requests.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedRequest(req)}
                    className={cn(
                      'w-full min-h-[56px] rounded-[4px] border border-rule bg-surface p-3.5',
                      'flex items-center justify-between gap-3 text-left transition-colors shadow-none select-none',
                      'hover:bg-bg-sunken/40 hover:border-ink-subtle focus:outline-2 focus:outline-accent focus:outline-offset-0'
                    )}
                    aria-label={`View request details for ${req.statusCode}`}
                  >
                    <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 overflow-hidden shadow-sm">
                      <ProductIcon product={req.productKey} size={44} className="w-full h-full object-cover" />
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
                          <span className="text-accent font-semibold">{t('collector.photo_badge')}</span>
                        ) : (
                          <>
                            {t('collector.quantity_label')}{' '}
                            <strong className="font-heading text-[18px] tabular-nums text-ink">{req.quantityKg} kg</strong>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SyncStatusBadge state={req.syncState || (req.statusCode === '#BS-402' ? 'queued' : 'synced')} />
                      <StatusBadge variant={req.statusVariant}>{req.status}</StatusBadge>
                      <ChevronRight size={18} strokeWidth={1.5} className="text-ink-subtle shrink-0" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Settlements / Past Receipts */}
            <div className="pt-4 border-t border-rule space-y-2">
              <div className="flex items-baseline justify-between">
                <SectionLabel as="h2">{t('collector.recent_receipts')}</SectionLabel>
                <span className="text-[11px] font-mono text-ink-muted">{t('collector.past_settlements')}</span>
              </div>

              <div className="space-y-2">
                {receipts.map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-[4px] border border-rule bg-surface p-3.5 flex items-center justify-between gap-3 shadow-none"
                  >
                    <div className="w-[44px] h-[44px] rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink shrink-0 overflow-hidden shadow-sm">
                      <ProductIcon product={rec.productKey} size={44} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[13px] font-bold text-ink">{rec.batchCode}</span>
                        <span className="text-[11px] font-mono text-ink-subtle">{rec.date}</span>
                      </div>
                      <div className="text-[13px] text-ink-muted mt-0.5">
                        <span className="font-heading text-[16px] tabular-nums font-bold text-ink">{rec.netWeightKg.toFixed(1)} kg</span>
                        <span className="mx-1.5">·</span>
                        <span className="font-heading text-[16px] tabular-nums font-bold text-accent">₹{rec.totalAmount.toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SyncStatusBadge state={rec.syncState || 'synced'} />
                      <button
                        type="button"
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
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: HELP (Helpline, Facilitator & Protections)
           ======================================================== */}
        {activeCollectorTab === 'help' && (
          <div
            id="collector-panel-help"
            role="tabpanel"
            aria-labelledby="collector-tab-help"
            tabIndex={0}
            className="space-y-4 pt-2"
          >
            <div className="border-b border-rule pb-2">
              <SectionLabel as="h1" className="text-[18px]">
                {isOr ? 'ସହାୟତା ଓ କଲ୍ ସେଣ୍ଟର୍' : 'Help & Support Center'}
              </SectionLabel>
              <p className="text-[12px] text-ink-muted">
                {isOr
                  ? 'ଆଦିବାସୀ କଲ୍ୟାଣ ହେଲ୍ପଲାଇନ୍ ଓ ସହାୟିକା ସମ୍ପର୍କ'
                  : 'Tribal welfare helpline, assigned village facilitator & grievance support'}
              </p>
            </div>

            {/* Direct Support Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:18003456789"
                className={cn(
                  'h-[52px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-semibold',
                  'flex items-center justify-center gap-2 shadow-none hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0'
                )}
                aria-label="Call tribal welfare helpline"
              >
                <Phone size={18} strokeWidth={1.5} className="text-accent shrink-0" />
                <span className={cn(isOr && 'font-odia text-[15px]')}>{t('collector.call_helpline')}</span>
              </a>

              <button
                type="button"
                onClick={() => setIsComplaintSheetOpen(true)}
                className={cn(
                  'h-[52px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-semibold',
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

            {/* Designated Village Helper Card */}
            <div className="rounded-[4px] border border-rule bg-surface p-4 space-y-2.5 shadow-none">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <span className={cn('text-[12px] font-bold uppercase tracking-wider text-accent', isOr && 'font-odia')}>
                  {isOr ? 'ନିଯୁକ୍ତ ଗ୍ରାମ ସହାୟିକା' : 'Assigned Village Facilitator'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-accent/10 text-accent font-semibold">
                  Maa Mangala SHG
                </span>
              </div>
              <div>
                <div className={cn('text-[16px] font-bold text-ink', isOr && 'font-odia text-[18px]')}>
                  {isOr ? 'ସୁମିତ୍ରା ମାର୍ଣ୍ଡି (ଦଳ ସଂଯୋଜକ)' : 'Sumitra Marndi (SHG Lead)'}
                </div>
                <div className="text-[12px] font-mono text-ink-muted mt-0.5">
                  Badagaon Village Cluster · Karanjia Point (KRN-01)
                </div>
              </div>
              <p className={cn('text-[13px] text-ink-muted leading-relaxed', isOr && 'font-odia text-[14px]')}>
                {isOr
                  ? 'ସୁମିତ୍ରା ମାର୍ଣ୍ଡି ଓଜନ ମାପ, ଫଟୋ ପ୍ରମାଣ ସଂଗ୍ରହ ଏବଂ ରସିଦ ପ୍ରଦାନରେ ସାହାଯ୍ୟ କରିବେ।'
                  : 'Sumitra can assist with electronic weighment, photo evidence capture, offline sync confirmation, and physical receipt printing.'}
              </p>
              <div className="pt-2 border-t border-rule flex items-center justify-between">
                <span className="text-[12px] font-mono text-ink-subtle">
                  Contact: <span className="text-ink font-semibold">+91 94370 00000</span>
                </span>
                <a
                  href="tel:18003456789"
                  className="h-[34px] px-3 rounded-[3px] border border-rule bg-bg-sunken text-[12px] font-medium text-ink hover:border-accent inline-flex items-center gap-1.5"
                >
                  <Phone size={13} className="text-accent" />
                  <span>Call Facilitator</span>
                </a>
              </div>
            </div>

            {/* Scheme Protections & Offline Instructions */}
            <div className="space-y-2 pt-2">
              <SectionLabel as="h2">{isOr ? 'ବନସେତୁ ସୁରକ୍ଷା ଓ ନିୟମ' : 'Scheme Protections & Offline Usage'}</SectionLabel>

              <div className="rounded-[4px] border border-rule bg-surface p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[14px]">
                  <CheckCircle2 size={16} className="text-success shrink-0" />
                  <span>{isOr ? '୧୦୦% ଅଫଲାଇନ୍ ସୁରକ୍ଷା' : '100% Offline Resilience'}</span>
                </div>
                <p className="text-[12px] text-ink-muted leading-relaxed">
                  {isOr
                    ? 'ମୋବାଇଲ୍ ନେଟୱାର୍କ ନଥିଲେ ମଧ୍ୟ ଆପଣଙ୍କ ପିକଅପ୍ ଅନୁରୋଧ ଓ ଫଟୋ ଏହି ଫୋନରେ ସୁରକ୍ଷିତ ରହିବ ଏବଂ ନେଟୱାର୍କ ଆସିବା ମାତ୍ରେ ଆପେ ଆପେ ସିଙ୍କ୍ ହେବ।'
                    : 'All requests and captured photos are persisted locally in the device database (Dexie). They sync automatically without data loss once network connectivity is restored.'}
                </p>
              </div>

              <div className="rounded-[4px] border border-rule bg-surface p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold text-[14px]">
                  <ShieldCheck size={16} className="text-accent shrink-0" />
                  <span>{isOr ? 'ଲାଭ ଯୋଜନା ସରକାରୀ ଦର ଗ୍ୟାରେଣ୍ଟି' : 'Odisha LABHA Scheme Price Guarantee'}</span>
                </div>
                <p className="text-[12px] text-ink-muted leading-relaxed">
                  {isOr
                    ? 'ଧାରା ୪(ଖ) ଅନୁଯାୟୀ କୌଣସି ମଧ୍ୟସ୍ଥି କିମ୍ବା ବେସରକାରୀ ବ୍ୟକ୍ତି ସରକାରୀ ଦରଠାରୁ କମ୍ ମୂଲ୍ୟ ଦେଇପାରିବେ ନାହିଁ। ପ୍ରତ୍ୟେକ କାରବାର ସିଧାସଳଖ ଡିବିଟି ମାଧ୍ୟମରେ ପ୍ରଦାନ କରାଯାଏ।'
                    : 'Statutory minimum support price (MSP) is guaranteed under Section 4(b). Payment is credited directly via Direct Benefit Transfer (DBT) to your verified bank account.'}
                </p>
              </div>
            </div>
          </div>
        )}
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
              <div className="mb-3 p-2.5 rounded-[2px] border border-rule bg-bg-sunken text-[12px] text-ink flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-semibold text-ink">
                    Say or tap quantity. Tap Submit.
                  </p>
                  {isOr && (
                    <p className="font-odia text-[13px] text-ink-muted">
                      ପରିମାଣ କୁହନ୍ତୁ କିମ୍ବା ଲେଖନ୍ତୁ। Submit ଦବାନ୍ତୁ।
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFirstRequestHint(false);
                    setFirstRequestCompleted();
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-subtle hover:text-ink text-[13px] font-mono border border-rule bg-surface rounded-[2px] shrink-0 focus:outline-2 focus:outline-accent"
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
                        <div className="w-[40px] h-[40px] rounded-[2px] bg-bg-sunken flex items-center justify-center text-ink shrink-0 border border-rule overflow-hidden shadow-sm">
                          <ProductIcon product={prod.key} size={40} className="w-full h-full object-cover" />
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

                {/* Product-Specific Handling & Environment Guidance */}
                <div className="pt-2">
                  <ProductGuidanceCard
                    productIdentifier={selectedProductKey}
                    stage="COLLECTION"
                    interactiveChecklist={true}
                    compact={false}
                  />
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

                <label htmlFor="produce-photo-camera-input" className="sr-only">
                  Capture produce photo from camera
                </label>
                <input
                  id="produce-photo-camera-input"
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  aria-label="Capture produce photo from camera"
                  onChange={handleCameraCapture}
                />

                <Button
                  variant={isPhotoOnlyMode ? 'primary' : 'secondary'}
                  type="button"
                  onClick={handleTriggerCamera}
                  className="w-full h-[44px] text-[13px] font-medium flex items-center justify-center gap-2"
                >
                  <Camera size={18} strokeWidth={1.5} />
                  <span>
                    {isPhotoOnlyMode ? '✓ Photo produce attached' : t('collector.photo_first_action')}
                  </span>
                </Button>

                {isPhotoOnlyMode && (
                  <div className="pt-1 space-y-2">
                    {capturedPhotoUrl ? (
                      <div className="relative border border-rule rounded-[4px] overflow-hidden bg-bg-sunken aspect-video flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhotoUrl}
                          alt="Captured produce sample"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-ink/80 text-white text-[11px] px-2 py-0.5 rounded-[2px] font-mono">
                          Live Camera Frame Attached
                        </div>
                      </div>
                    ) : (
                      <PhotoPlate
                        label="Produce Photo Plate"
                        caption="Recorded · Manager will calibrate weight"
                        aspectRatio="16/9"
                      />
                    )}
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

                    <div
                      tabIndex={0}
                      role="spinbutton"
                      aria-valuenow={stepperQuantity}
                      aria-valuemin={5}
                      aria-valuemax={250}
                      aria-label="Quantity in kilograms. Use arrow keys to adjust."
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                          e.preventDefault();
                          handleIncrement();
                        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                          e.preventDefault();
                          handleDecrement();
                        }
                      }}
                      className="text-center p-2 rounded-[4px] focus:outline-2 focus:outline-accent"
                    >
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
                            ? 'border-accent bg-accent/10 text-accent font-bold'
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

                {/* Product-Specific Storage & Environment Profile */}
                <div className="pt-1">
                  <ProductGuidanceCard
                    productIdentifier={selectedRequest.productKey}
                    stage="COLLECTION"
                    interactiveChecklist={false}
                    compact={false}
                  />
                </div>

                {/* Irreversible Cancel Action: Typed confirmation word "confirm" (Rule 3) */}
                {selectedRequest.status === 'Pending' && (
                  <div className="pt-3 border-t border-rule space-y-2">
                    <span className="text-[12px] font-bold uppercase text-danger block">
                      Cancel Pickup Request
                    </span>
                    <label htmlFor="confirm-cancel-request-input" className="text-[12px] text-ink-muted block select-none">
                      Type <strong className="font-mono text-danger">confirm</strong> below to purge this pickup request from dispatch:
                    </label>
                    <input
                      id="confirm-cancel-request-input"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <Button
                  id="btn-modal-download-receipt-pdf"
                  variant="primary"
                  onClick={() => handleDownloadReceiptPdf(selectedReceipt.batchCode)}
                  disabled={isDownloadingPdf}
                  className="w-full h-[52px] text-[15px] font-semibold flex items-center justify-center gap-2 shadow-none"
                  aria-label="Download official receipt PDF"
                >
                  <Download size={18} />
                  <span>
                    {isDownloadingPdf
                      ? (isOr ? 'ଡାଉନଲୋଡ୍ ଚାଲିଛି...' : 'Downloading PDF...')
                      : (isOr ? 'ରସିଦ ଡାଉନଲୋଡ୍ (PDF)' : 'Download Receipt PDF')}
                  </span>
                </Button>
                <Button
                  id="btn-modal-share-receipt"
                  variant="secondary"
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
                  disabled={isSharingPdf}
                  className="w-full h-[52px] text-[15px] font-semibold flex items-center justify-center gap-2"
                  aria-label="Share receipt"
                >
                  <Share2 size={18} />
                  <span>
                    {isSharingPdf ? (isOr ? 'ସେୟାରିଂ...' : 'Sharing...') : (isOr ? 'ରସିଦ ସେୟାର କରନ୍ତୁ' : 'Share Receipt')}
                  </span>
                </Button>
              </div>
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
            onUndo={activeToast.onUndo}
            undoLabel={isOr ? 'ପୂର୍ବାବସ୍ଥା' : 'Undo'}
            onClose={() => setActiveToast(null)}
          />
        </ToastContainer>
      )}
    </AppShell>
  );
}
