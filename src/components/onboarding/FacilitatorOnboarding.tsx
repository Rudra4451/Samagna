'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { Users, FileText, ArrowDown, ArrowRight } from 'lucide-react';

interface FacilitatorOnboardingProps {
  onRecordGroupPickup: () => void;
  onSkip: () => void;
}

export const FacilitatorOnboarding: React.FC<FacilitatorOnboardingProps> = ({
  onRecordGroupPickup,
  onSkip,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Facilitator Welcome"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[520px] border border-rule bg-surface p-6 rounded-[4px] shadow-none space-y-5">
        {/* Top Header Row with Skip Button */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-accent inline-block shrink-0" aria-hidden="true" />
            <span className="font-heading text-[16px] font-bold tracking-tight text-ink">
              SHG Facilitator Terminal
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

        {/* Content: "Collect requests on behalf of collectors. Each collector still gets their own receipt." */}
        <div className="space-y-2">
          <h2 className="font-heading text-[22px] font-bold text-ink leading-tight">
            Collect requests on behalf of collectors. Each collector still gets their own receipt.
          </h2>
          <p className="text-[13px] text-ink-muted">
            Van Dhan Vikas Kendra Self-Help Group Coordination
          </p>
        </div>

        {/* Small Diagram: Three small bordered boxes with arrows explaining 1 aggregated request -> 3 individual receipts */}
        <div className="border border-rule rounded-[4px] p-4 bg-bg-sunken/40 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold text-center">
            Logistical Aggregation Engine
          </div>

          {/* Top Box: Aggregated Request */}
          <div className="border border-rule rounded-[2px] p-2.5 bg-surface text-center shadow-none max-w-[280px] mx-auto">
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-semibold">
              Step 1 · Single Pickup Request
            </span>
            <span className="text-[13px] font-bold text-ink">
              1 Aggregated Group Pickup (170 kg)
            </span>
          </div>

          {/* Connecting Arrows */}
          <div className="flex justify-around px-8 text-ink-subtle" aria-hidden="true">
            <ArrowDown size={16} strokeWidth={1.5} />
            <ArrowDown size={16} strokeWidth={1.5} />
            <ArrowDown size={16} strokeWidth={1.5} />
          </div>

          {/* Bottom Three Boxes: Individual Receipts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-rule rounded-[2px] p-2 bg-surface text-center shadow-none">
              <span className="text-[10px] font-mono text-ink-subtle block">Receipt #1</span>
              <span className="text-[11px] font-bold text-ink block truncate">Raimati S.</span>
              <span className="text-[10px] font-mono text-accent">100 kg · ₹4,200</span>
            </div>

            <div className="border border-rule rounded-[2px] p-2 bg-surface text-center shadow-none">
              <span className="text-[10px] font-mono text-ink-subtle block">Receipt #2</span>
              <span className="text-[11px] font-bold text-ink block truncate">Sunita M.</span>
              <span className="text-[10px] font-mono text-accent">50 kg · ₹1,400</span>
            </div>

            <div className="border border-rule rounded-[2px] p-2 bg-surface text-center shadow-none">
              <span className="text-[10px] font-mono text-ink-subtle block">Receipt #3</span>
              <span className="text-[11px] font-bold text-ink block truncate">Gita M.</span>
              <span className="text-[10px] font-mono text-accent">20 kg · ₹3,600</span>
            </div>
          </div>

          <div className="text-center text-[11px] font-mono text-ink-subtle pt-1">
            One bulk transport trip → Direct benefit transfer to individual bank accounts
          </div>
        </div>

        {/* One Button: "Record a pickup for a group" */}
        <div className="pt-1">
          <Button
            variant="primary"
            onClick={onRecordGroupPickup}
            className="w-full h-[46px] text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            <Users size={17} strokeWidth={1.5} />
            <span>Record a pickup for a group</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </Button>
        </div>

        <div className="border-t border-rule pt-2 flex items-center justify-between text-[11px] text-ink-subtle font-mono">
          <span>BanaSetu SHG Mode</span>
          <span>Field Spec</span>
        </div>
      </div>
    </div>
  );
};
