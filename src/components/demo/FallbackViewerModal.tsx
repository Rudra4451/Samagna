'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface FallbackViewerModalProps {
  onClose: () => void;
}

const FALLBACK_STEPS = [
  {
    step: 1,
    id: 'step1_collector_pickup',
    title: 'Act 1 · Mobile Collector Pickup (Sunita Soren · 100 kg Mahua)',
    file: '/demo/fallback/1.png',
  },
  {
    step: 2,
    id: 'step2_collection_receipt',
    title: 'Act 1 · Bilingual Collection Receipt (#BS-402 · ₹4,200.00)',
    file: '/demo/fallback/2.png',
  },
  {
    step: 3,
    id: 'step3_bag_tag_qr',
    title: 'Act 1 · A6 Sack Stencil Tag & Deterministic QR (#BS-402)',
    file: '/demo/fallback/3.png',
  },
  {
    step: 4,
    id: 'step4_warehouse_reweigh',
    title: 'Act 2 · Baripada Depôt Intake Re-Weigh (95.0 kg Net)',
    file: '/demo/fallback/4.png',
  },
  {
    step: 5,
    id: 'step5_discrepancy_quarantine',
    title: 'Act 2 · Shrinkage Engine Excess Deficit Card (-3.5 kg Held)',
    file: '/demo/fallback/5.png',
  },
  {
    step: 6,
    id: 'step6_audit_timeline',
    title: 'Act 3 · Monotonic Custody Hash & Non-Punitive Audit Log',
    file: '/demo/fallback/6.png',
  },
];

export function FallbackViewerModal({ onClose }: FallbackViewerModalProps) {
  const pathname = usePathname();

  // Pick initial step based on current route
  const getInitialStep = () => {
    if (pathname.includes('/collection/receipt')) return 2;
    if (pathname.includes('/collection/tag')) return 3;
    if (pathname.includes('/inventory') && pathname.includes('tab=audit')) return 6;
    if (pathname.includes('/inventory')) return 4;
    return 1;
  };

  const [activeStepIndex, setActiveStepIndex] = useState(getInitialStep() - 1);
  const activeStep = FALLBACK_STEPS[activeStepIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Offline Fallback Presentation Slide"
      className="fixed inset-0 z-50 bg-ink/80 flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-4xl bg-surface border border-rule flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-rule px-4 py-2.5 bg-bg-sunken">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-ink text-surface px-1.5 py-0.5 rounded-[2px]">
              Offline Fallback Slide {activeStep.step}/6
            </span>
            <span className="text-[13px] font-medium text-ink truncate">
              {activeStep.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/demo/fallback-slides"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-ink-muted hover:text-ink flex items-center gap-1 border border-rule px-2 py-1 bg-surface rounded-[2px]"
            >
              <FileText size={12} strokeWidth={1.5} />
              <span>Full Slide View</span>
            </a>
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-[2px] border border-rule bg-surface flex items-center justify-center text-ink hover:bg-bg-sunken"
              aria-label="Close Fallback"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Slide Display Area */}
        <div className="flex-1 overflow-auto bg-bg p-4 flex items-center justify-center">
          <div className="relative border border-rule bg-surface p-2 max-w-full max-h-full">
            {/* Fallback image */}
            <img
              src={activeStep.file}
              alt={activeStep.title}
              className="w-full h-auto max-h-[68vh] object-contain block border border-rule"
            />
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-rule px-4 py-3 bg-surface">
          <div className="flex items-center gap-1">
            {FALLBACK_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`h-7 px-2.5 text-[11px] font-mono rounded-[2px] border transition-colors ${
                  idx === activeStepIndex
                    ? 'border-accent bg-accent text-surface font-bold'
                    : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink'
                }`}
              >
                Step {s.step}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
              className="h-8 px-3 rounded-[2px] border border-rule bg-bg-sunken text-[12px] font-mono flex items-center gap-1 disabled:opacity-40 hover:border-ink"
            >
              <ChevronLeft size={14} /> Prev Step
            </button>
            <button
              disabled={activeStepIndex === FALLBACK_STEPS.length - 1}
              onClick={() => setActiveStepIndex((prev) => Math.min(FALLBACK_STEPS.length - 1, prev + 1))}
              className="h-8 px-3 rounded-[2px] border border-rule bg-bg-sunken text-[12px] font-mono flex items-center gap-1 disabled:opacity-40 hover:border-ink"
            >
              Next Step <ChevronRight size={14} />
            </button>
            <button
              onClick={onClose}
              className="h-8 px-3 rounded-[2px] border border-accent bg-accent text-accent-ink text-[12px] font-medium hover:bg-accent/90"
            >
              Resume Live UI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
