'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { DEMO_COLLECTORS, DEMO_PRODUCT, DEMO_FACILITATOR } from '../../demo/seed';
import { StatusBadge, StatusVariant } from '../../components/ui/StatusBadge';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { EmptyState } from '../../components/ui/EmptyState';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { useTranslation } from '../../i18n/useTranslation';
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
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  HelpCircle,
} from 'lucide-react';

interface PickupRequest {
  id: string;
  productName: string;
  productNameOdia: string;
  quantityKg: number;
  statusCode: string;
  status: 'Pending' | 'Scheduled' | 'Collected' | 'Paid';
  statusVariant: StatusVariant;
  scheduledDate: string;
  center: string;
  notes: string;
}

interface ReceiptRecord {
  id: string;
  batchCode: string;
  date: string;
  productName: string;
  productNameOdia: string;
  netWeightKg: number;
  ratePerKg: number;
  totalAmount: number;
  dbtRef: string;
  bankAccount: string;
}

export default function CollectorMobilePage() {
  const { isOffline } = useAppStore();
  const { t, isOr } = useTranslation();
  const collector = DEMO_COLLECTORS[0]; // Raimati Soren
  const collectorFirstName = isOr ? collector.nameOdia.split(' ')[0] : collector.name.split(' ')[0];

  // Requests state
  const [requests, setRequests] = useState<PickupRequest[]>([
    {
      id: 'REQ-402',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: 40,
      statusCode: '#BS-402',
      status: 'Collected',
      statusVariant: 'info',
      scheduledDate: '18 Apr 2024, 09:15 AM',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'Dispatched to Baripada central depôt under seal tag #OD-ST-8840.',
    },
    {
      id: 'REQ-401',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: 25,
      statusCode: '#BS-401',
      status: 'Scheduled',
      statusVariant: 'warning',
      scheduledDate: '20 Apr 2024, 10:30 AM',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'Van pickup vehicle scheduled for Kadamdiha village cluster.',
    },
    {
      id: 'REQ-398',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: 35,
      statusCode: '#BS-398',
      status: 'Paid',
      statusVariant: 'success',
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
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      netWeightKg: 35.0,
      ratePerKg: 42.0,
      totalAmount: 1470.0,
      dbtRef: 'DBT-OD-2024-8842',
      bankAccount: 'Canara Bank (•••4812)',
    },
    {
      id: 'REC-385',
      batchCode: '#BS-385',
      date: '04 Apr 2024',
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      netWeightKg: 50.0,
      ratePerKg: 42.0,
      totalAmount: 2100.0,
      dbtRef: 'DBT-OD-2024-7719',
      bankAccount: 'Canara Bank (•••4812)',
    },
  ]);

  // Sheet states
  const [isPickupSheetOpen, setIsPickupSheetOpen] = useState(false);
  const [stepperQuantity, setStepperQuantity] = useState(40);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptRecord | null>(null);
  const [isComplaintSheetOpen, setIsComplaintSheetOpen] = useState(false);

  // Toast state
  const [activeToast, setActiveToast] = useState<{ id: string; message: string } | null>(null);

  // Stepper handlers
  const handleIncrement = () => setStepperQuantity((prev) => Math.min(prev + 5, 250));
  const handleDecrement = () => setStepperQuantity((prev) => Math.max(prev - 5, 5));

  // Submit pickup request (3-step flow instant submit without spinners)
  const handleSubmitPickup = () => {
    const newCode = '#BS-403';
    const newReq: PickupRequest = {
      id: `REQ-${Date.now()}`,
      productName: 'Dried Mahua Flowers',
      productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      quantityKg: stepperQuantity,
      statusCode: newCode,
      status: 'Pending',
      statusVariant: 'warning',
      scheduledDate: 'Expected Today or Tomorrow',
      center: 'Badagaon Van Dhan Kendra',
      notes: 'New pickup request submitted via mobile ledger.',
    };

    setRequests((prev) => [newReq, ...prev]);
    setIsPickupSheetOpen(false);

    // Bottom toast notification (concrete microcopy)
    setActiveToast({
      id: `toast-${Date.now()}`,
      message: isOr
        ? `ଅନୁରୋଧ ପଠାଗଲା · ${newCode} · ମହୁଲ · ~${stepperQuantity} କେଜି`
        : `Request sent · ${newCode} · Mahua · ~${stepperQuantity} kg`,
    });

    setTimeout(() => {
      setActiveToast((curr) => (curr?.message.includes(newCode) ? null : curr));
    }, 4500);
  };

  return (
    <AppShell>
      <div className="space-y-4 text-[15px] leading-relaxed">
        {/* Section 1: Greeting Card */}
        <div className="rounded-[4px] border border-rule bg-surface p-5 shadow-none">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className={cn("font-heading text-[22px] font-semibold text-ink leading-tight", isOr && "font-odia")}>
                {t('collector.greeting', { name: collectorFirstName })}
              </h1>
              <p className={cn("text-[14px] text-ink-muted mt-1 leading-snug", isOr && "font-odia text-[16px] leading-[1.6]")}>
                {t('collector.region_season')}
              </p>
            </div>
            <StatusBadge variant="neutral" className="shrink-0 text-[10px]">
              {t('collector.forecast_only')}
            </StatusBadge>
          </div>
        </div>

        {/* Section 2: "Today's price" Card (Most visually prominent element) */}
        <div className="rounded-[4px] border-2 border-accent/60 bg-surface p-5 shadow-none relative overflow-hidden">
          {/* Subtle print ledger watermark label */}
          <div className="flex items-center justify-between mb-2">
            <span className={cn("text-[11px] font-bold uppercase tracking-[0.06em] text-accent select-none", isOr && "font-odia")}>
              {t('collector.verified_rate')}
            </span>
            <span className="text-[10px] font-mono uppercase text-ink-subtle bg-bg-sunken px-2 py-0.5 rounded-[2px] border border-rule">
              {t('collector.benchmark_badge')}
            </span>
          </div>

          {/* Big Number: ₹42 in Fraunces 36px/44px tabular */}
          <div className="flex items-baseline gap-2 my-1">
            <div className="font-heading text-[44px] font-bold tabular-nums text-accent leading-none">
              ₹42
            </div>
            <div className={cn("text-[15px] font-medium text-ink", isOr && "font-odia text-[16px] leading-[1.6]")}>
              {t('collector.rate_unit')}
            </div>
          </div>

          <div className="border-t border-rule pt-2.5 mt-2 text-[12px] text-ink-subtle font-mono leading-normal">
            {t('collector.rate_source')}
          </div>
        </div>

        {/* Section 3: Primary Action: Full-width 56px accent button */}
        <div className="space-y-1.5">
          <button
            onClick={() => setIsPickupSheetOpen(true)}
            className={cn(
              'h-[56px] w-full min-h-[44px] rounded-[4px] border border-accent bg-accent text-accent-ink',
              'text-[16px] font-medium flex items-center justify-center gap-2.5 shadow-none transition-colors select-none',
              'hover:bg-[#9E4326] active:bg-[#8D3A20] focus:outline-2 focus:outline-accent focus:outline-offset-0',
              isOr && 'font-odia text-[16px]'
            )}
          >
            <Truck size={18} strokeWidth={1.5} />
            <span>{t('collector.request_pickup_action')}</span>
          </button>
          <p className={cn("text-[12px] text-ink-subtle text-center", isOr && "font-odia text-[13px]")}>
            {t('collector.facilitator_note')}
          </p>
        </div>

        {/* Section 4: "My requests" List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
            <SectionLabel as="h2">{t('collector.my_requests')}</SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted tabular-nums">
              {requests.length} {t('collector.total_suffix')}
            </span>
          </div>
          {isOr && (
            <div className="font-odia text-[12px] text-ink-subtle mb-1">
              ମୋର ପିକଅପ୍ ଅନୁରୋଧ ତାଲିକା
            </div>
          )}

          {requests.length === 0 ? (
            <EmptyState
              title={t('collector.empty_requests_title')}
              description={t('collector.empty_requests_body')}
              actionLabel={t('collector.request_pickup_action')}
              onAction={() => setIsPickupSheetOpen(true)}
            />
          ) : (
            <div className="space-y-2">
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  className={cn(
                    'w-full min-h-[52px] rounded-[4px] border border-rule bg-surface p-3.5',
                    'flex items-center justify-between gap-3 text-left transition-colors shadow-none select-none',
                    'hover:bg-bg-sunken/40 hover:border-ink-subtle focus:outline-2 focus:outline-accent focus:outline-offset-0'
                  )}
                  aria-label={`View request details for ${req.statusCode}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("font-medium text-ink leading-tight", isOr && "font-odia text-[15px]")}>
                        {isOr ? req.productNameOdia : req.productName}
                      </span>
                      <span className="font-mono text-[12px] text-ink-subtle tabular-nums font-semibold">
                        {req.statusCode}
                      </span>
                    </div>
                    <div className="text-[13px] text-ink-muted mt-0.5">
                      {t('collector.quantity_label')}{' '}
                      <strong className="font-mono tabular-nums text-ink">{req.quantityKg} kg</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge variant={req.statusVariant}>
                      {req.status}
                    </StatusBadge>
                    <ChevronRight size={18} strokeWidth={1.5} className="text-ink-subtle shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: "Recent receipts" List */}
        <div className="space-y-2 pt-2">
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-ink">
                      {rec.batchCode}
                    </span>
                    <span className="text-[11px] font-mono text-ink-subtle">
                      {rec.date}
                    </span>
                  </div>
                  <div className="text-[13px] text-ink-muted mt-0.5">
                    <span className="font-mono tabular-nums font-medium text-ink">
                      {rec.netWeightKg.toFixed(2)} kg
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="font-mono tabular-nums font-semibold text-accent">
                      ₹{rec.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReceipt(rec)}
                  className="min-h-[44px] px-3 rounded-[4px] border border-rule bg-bg-sunken text-[13px] font-medium text-ink hover:border-ink-subtle inline-flex items-center gap-1.5 focus:outline-2 focus:outline-accent focus:outline-offset-0"
                >
                  <Receipt size={16} strokeWidth={1.5} className="text-ink-muted" />
                  <span className={cn(isOr && "font-odia")}>{t('collector.view_receipt')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Footer Help Row (Two large buttons, 48px height) */}
        <div className="pt-3 pb-6 space-y-2">
          <SectionLabel>{t('collector.need_assistance')}</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:18003456789"
              className={cn(
                'h-[48px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-medium',
                'flex items-center justify-center gap-2 shadow-none hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0'
              )}
            >
              <Phone size={18} strokeWidth={1.5} className="text-accent" />
              <span className={cn(isOr && "font-odia")}>{t('collector.call_helpline')}</span>
            </a>

            <button
              onClick={() => setIsComplaintSheetOpen(true)}
              className={cn(
                'h-[48px] min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-medium',
                'flex items-center justify-center gap-2 shadow-none hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent focus:outline-offset-0'
              )}
            >
              <AlertCircle size={18} strokeWidth={1.5} className="text-danger" />
              <span className={cn(isOr && "font-odia")}>{t('collector.file_complaint')}</span>
            </button>
          </div>
          <p className="text-[11px] text-ink-subtle text-center">
            Helpline 1800 345 6789 is simulated for prototype demonstration.
          </p>
        </div>
      </div>

      {/* ========================================================
          BOTTOM SHEET 1: Request Pickup (3-step flow, no modal)
         ======================================================== */}
      <BottomSheet open={isPickupSheetOpen} onOpenChange={setIsPickupSheetOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle className={cn(isOr && "font-odia")}>{t('sheet.pickup_title')}</BottomSheetTitle>
            <BottomSheetDescription className={cn(isOr && "font-odia")}>
              {t('sheet.pickup_desc')}
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            <div className="space-y-5">
              {/* Step 1: Product Selection (Preselected Mahua) */}
              <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-1">
                <span className={cn("text-[11px] font-bold uppercase tracking-[0.06em] text-accent", isOr && "font-odia")}>
                  {t('sheet.step1_label')}
                </span>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className={cn("font-semibold text-ink text-[15px]", isOr && "font-odia")}>
                      {isOr ? DEMO_PRODUCT.nameOdia : DEMO_PRODUCT.name}
                    </div>
                    <div className="text-[12px] text-ink-muted">
                      {t('sheet.rate_prefix')} ₹{DEMO_PRODUCT.ratePerKg.toFixed(2)} / kg
                    </div>
                  </div>
                  <StatusBadge variant="accent">{t('sheet.preselected')}</StatusBadge>
                </div>
              </div>

              {/* Step 2: Approximate Quantity Stepper (+/- 5 kg, big 32px numbers) */}
              <div className="border border-rule rounded-[4px] p-4 bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn("text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted", isOr && "font-odia")}>
                    {t('sheet.step2_label')}
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">{t('sheet.step_size')}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleDecrement}
                    disabled={stepperQuantity <= 5}
                    aria-label="Decrease quantity by 5 kg"
                    title="Decrease quantity by 5 kg"
                    className={cn(
                      'h-[52px] w-[52px] min-h-[44px] min-w-[44px] rounded-[4px] border border-rule bg-bg-sunken',
                      'flex items-center justify-center text-ink text-[20px] font-bold shadow-none transition-colors',
                      'hover:border-ink-subtle active:bg-rule disabled:opacity-40 focus:outline-2 focus:outline-accent focus:outline-offset-0'
                    )}
                  >
                    <Minus size={20} strokeWidth={2} />
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
                      <strong className="text-accent font-semibold">₹{(stepperQuantity * DEMO_PRODUCT.ratePerKg).toFixed(2)}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleIncrement}
                    disabled={stepperQuantity >= 250}
                    aria-label="Increase quantity by 5 kg"
                    title="Increase quantity by 5 kg"
                    className={cn(
                      'h-[52px] w-[52px] min-h-[44px] min-w-[44px] rounded-[4px] border border-rule bg-bg-sunken',
                      'flex items-center justify-center text-ink text-[20px] font-bold shadow-none transition-colors',
                      'hover:border-ink-subtle active:bg-rule disabled:opacity-40 focus:outline-2 focus:outline-accent focus:outline-offset-0'
                    )}
                  >
                    <Plus size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Step 3: Confirmation Summary */}
              <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 space-y-2 text-[13px]">
                <span className={cn("text-[11px] font-bold uppercase tracking-[0.06em] text-ink-muted block", isOr && "font-odia")}>
                  {t('sheet.step3_label')}
                </span>
                <div className="flex justify-between border-b border-rule pb-1.5">
                  <span className="text-ink-muted">{t('sheet.collection_center')}</span>
                  <span className="font-medium text-ink">Badagaon Van Dhan Kendra</span>
                </div>
                <div className="flex justify-between border-b border-rule pb-1.5">
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

          {/* Full-width 56px Submit Button */}
          <BottomSheetFooter>
            {isOffline && (
              <p className="text-[12px] text-ink-subtle text-center select-none">
                Will be saved locally and sync when online.
              </p>
            )}
            <button
              onClick={handleSubmitPickup}
              className={cn(
                'h-[56px] w-full min-h-[44px] rounded-[4px] border border-accent bg-accent text-accent-ink',
                'text-[16px] font-semibold flex items-center justify-center gap-2 shadow-none select-none transition-colors',
                'hover:bg-[#9E4326] active:bg-[#8D3A20] focus:outline-2 focus:outline-accent focus:outline-offset-0',
                isOr && 'font-odia text-[16px]'
              )}
            >
              <CheckCircle2 size={18} strokeWidth={1.5} />
              <span>{t('sheet.submit_pickup')}</span>
            </button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 2: Request Detail Sheet
         ======================================================== */}
      <BottomSheet open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Request Details</BottomSheetTitle>
            <BottomSheetDescription>
              Official Tracking Code: {selectedRequest?.statusCode}
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
                  <span className="font-mono tabular-nums font-bold text-ink">
                    {selectedRequest.quantityKg} kg
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
                <div className="p-3 border border-rule rounded-[2px] bg-bg-sunken/40 text-[12px] text-ink-muted">
                  <span className="font-semibold text-ink block mb-0.5">Verification Notes:</span>
                  {selectedRequest.notes}
                </div>
              </div>
            )}
          </BottomSheetBody>

          <BottomSheetFooter>
            <BottomSheetClose asChild>
              <button className="h-[48px] w-full min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-medium hover:bg-bg-sunken">
                Close details
              </button>
            </BottomSheetClose>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 3: Receipt Detail Sheet
         ======================================================== */}
      <BottomSheet open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Official Weighment Receipt</BottomSheetTitle>
            <BottomSheetDescription>
              Lot Batch: {selectedReceipt?.batchCode} • DBT Settled
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            {selectedReceipt && (
              <div className="space-y-3 text-[14px]">
                <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken/50 text-center">
                  <span className="text-[11px] font-mono uppercase text-ink-muted block">
                    Total Amount Disbursed
                  </span>
                  <span className="font-heading text-[28px] font-bold text-accent font-mono tabular-nums">
                    ₹{selectedReceipt.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-success font-medium block mt-0.5">
                    100% Direct Benefit Transfer (Simulated)
                  </span>
                </div>

                <div className="flex justify-between border-b border-rule py-1.5">
                  <span className="text-ink-muted">Accepted Net Weight:</span>
                  <span className="font-mono tabular-nums font-semibold text-ink">
                    {selectedReceipt.netWeightKg.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between border-b border-rule py-1.5">
                  <span className="text-ink-muted">Official Rate:</span>
                  <span className="font-mono tabular-nums text-ink">
                    ₹{selectedReceipt.ratePerKg.toFixed(2)} / kg
                  </span>
                </div>
                <div className="flex justify-between border-b border-rule py-1.5">
                  <span className="text-ink-muted">Credited To:</span>
                  <span className="font-mono text-ink text-[13px]">{selectedReceipt.bankAccount}</span>
                </div>
                <div className="flex justify-between border-b border-rule py-1.5">
                  <span className="text-ink-muted">DBT Txn Reference:</span>
                  <span className="font-mono text-[12px] text-ink-subtle">{selectedReceipt.dbtRef}</span>
                </div>
                <div className="flex justify-between py-1 text-[12px] text-ink-muted">
                  <span>Settlement Date:</span>
                  <span className="font-mono">{selectedReceipt.date}</span>
                </div>
              </div>
            )}
          </BottomSheetBody>

          <BottomSheetFooter>
            <BottomSheetClose asChild>
              <button className="h-[48px] w-full min-h-[44px] rounded-[4px] border border-rule bg-surface text-ink text-[14px] font-medium hover:bg-bg-sunken">
                Close receipt
              </button>
            </BottomSheetClose>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* ========================================================
          BOTTOM SHEET 4: File Complaint Sheet
         ======================================================== */}
      <BottomSheet open={isComplaintSheetOpen} onOpenChange={setIsComplaintSheetOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>File Procurement Complaint</BottomSheetTitle>
            <BottomSheetDescription>
              Direct to Mayurbhanj TDCCOL District Officer
            </BottomSheetDescription>
          </BottomSheetHeader>

          <BottomSheetBody>
            <div className="space-y-3 text-[14px]">
              <div className="p-3 border border-rule bg-bg-sunken/40 rounded-[2px] text-[13px] text-ink-muted">
                Tribal collectors are safeguarded against arbitrary scale tare deductions or delayed DBT.
              </div>

              <div className="space-y-1">
                <label htmlFor="complaint-type-select" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                  Complaint Type
                </label>
                <select
                  id="complaint-type-select"
                  className="h-[44px] w-full rounded-[4px] border border-rule bg-surface px-3 text-[14px] text-ink outline-none focus:outline-2 focus:outline-accent focus:outline-offset-0"
                >
                  <option>Tare Weight Discrepancy on Scale</option>
                  <option>Delayed Vehicle Pickup</option>
                  <option>Payment Transfer Clarification</option>
                  <option>Damaged Tarpaulin Packaging</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="complaint-explanation-text" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
                  Brief Explanation
                </label>
                <textarea
                  id="complaint-explanation-text"
                  rows={3}
                  placeholder="Explain issue observed at collection center..."
                  className="w-full rounded-[4px] border border-rule bg-surface p-3 text-[14px] text-ink outline-none focus:outline-2 focus:outline-accent focus:outline-offset-0"
                />
              </div>
            </div>
          </BottomSheetBody>

          <BottomSheetFooter>
            {isOffline && (
              <p className="text-[12px] text-ink-subtle text-center select-none">
                Will be saved locally and sync when online.
              </p>
            )}
            <button
              onClick={() => {
                setIsComplaintSheetOpen(false);
                setActiveToast({
                  id: `toast-${Date.now()}`,
                  message: 'Grievance ticket #GRV-0881 registered with TDCCOL',
                });
              }}
              className="h-[48px] w-full min-h-[44px] rounded-[4px] border border-accent bg-accent text-accent-ink text-[14px] font-semibold focus:outline-2 focus:outline-accent focus:outline-offset-0 transition-colors hover:bg-[#9E4326]"
            >
              Submit grievance
            </button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>

      {/* Toast Notification at bottom-left */}
      {activeToast && (
        <ToastContainer>
          <Toast
            variant="success"
            title={activeToast.message}
            description="Stored in local ledger with cloud synchronization handshake."
            onClose={() => setActiveToast(null)}
          />
        </ToastContainer>
      )}
    </AppShell>
  );
}
