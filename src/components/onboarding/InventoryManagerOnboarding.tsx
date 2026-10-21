'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { Scale, Keyboard, ArrowRight } from 'lucide-react';

interface InventoryManagerOnboardingProps {
  onVerifyBatch: () => void;
  onSkip: () => void;
}

export const InventoryManagerOnboarding: React.FC<InventoryManagerOnboardingProps> = ({
  onVerifyBatch,
  onSkip,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Inventory Manager Welcome"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[480px] border border-rule bg-surface p-6 rounded-[4px] shadow-none space-y-5">
        {/* Top Header Row with Skip Button */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-accent inline-block shrink-0" aria-hidden="true" />
            <span className="font-heading text-[16px] font-bold tracking-tight text-ink">
              Central Granary Intake
            </span>
          </div>

          <button
            onClick={onSkip}
            aria-label="Skip onboarding"
            className="px-2.5 py-1 text-[12px] font-mono uppercase tracking-[0.06em] text-ink-muted hover:text-ink border border-rule hover:border-ink-subtle bg-surface rounded-[2px] transition-colors focus:outline-2 focus:outline-accent"
          >
            Skip
          </button>
        </div>

        {/* Content: "One batch is waiting for verification: #BS-402. Confirm arrival weight to move it to saleable stock." */}
        <div className="space-y-2">
          <h2 className="font-heading text-[22px] font-bold text-ink leading-tight">
            One batch is waiting for verification: <span className="tabular-nums text-accent">#BS-402</span>. Confirm arrival weight to move it to saleable stock.
          </h2>
          <p className="text-[13px] text-ink-muted">
            100.0 kg Mahua Flowers · Dispatched from Karanjia Depot
          </p>
        </div>

        {/* Single Rectangular Button: "Verify #BS-402" */}
        <div className="pt-1">
          <Button
            variant="primary"
            onClick={onVerifyBatch}
            className="w-full h-[46px] text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            <Scale size={17} strokeWidth={1.5} />
            <span>Verify #BS-402</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </Button>
        </div>

        {/* Footer Hint: "The ? key shows keyboard shortcuts." in 12px */}
        <div className="pt-2 border-t border-rule flex items-center justify-between text-[12px] text-ink-subtle font-mono">
          <div className="flex items-center gap-1.5">
            <Keyboard size={14} strokeWidth={1.5} className="text-ink-muted" />
            <span>The ? key shows keyboard shortcuts.</span>
          </div>
          <span>BanaSetu</span>
        </div>
      </div>
    </div>
  );
};
