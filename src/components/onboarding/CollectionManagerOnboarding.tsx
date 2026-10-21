'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { Inbox, WifiOff, Keyboard, ArrowRight } from 'lucide-react';

interface CollectionManagerOnboardingProps {
  onOpenQueue: () => void;
  onOpenOfflineQueue: () => void;
  onSkip: () => void;
}

export const CollectionManagerOnboarding: React.FC<CollectionManagerOnboardingProps> = ({
  onOpenQueue,
  onOpenOfflineQueue,
  onSkip,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collection Manager Welcome"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4 select-none"
    >
      <div className="w-full max-w-[480px] border border-rule bg-surface p-6 rounded-[4px] shadow-none space-y-5">
        {/* Top Header Row with Skip Button */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-[2px] bg-accent inline-block shrink-0" aria-hidden="true" />
            <span className="font-heading text-[16px] font-bold tracking-tight text-ink">
              Collection Desk
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

        {/* Content: "Welcome. Today you have 2 pickup requests and 1 batch arriving." */}
        <div className="space-y-2">
          <h2 className="font-heading text-[22px] font-bold text-ink leading-tight">
            Welcome. Today you have 2 pickup requests and 1 batch arriving.
          </h2>
          <p className="text-[13px] text-ink-muted">
            Mayurbhanj Circle · Similipal North Weighment Hub
          </p>
        </div>

        {/* Two Rectangular Buttons: "Open queue" and "Open offline queue" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            variant="primary"
            onClick={onOpenQueue}
            className="h-[44px] text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            <Inbox size={16} strokeWidth={1.5} />
            <span>Open queue</span>
          </Button>

          <Button
            variant="secondary"
            onClick={onOpenOfflineQueue}
            className="h-[44px] text-[13px] font-semibold flex items-center justify-center gap-2"
          >
            <WifiOff size={16} strokeWidth={1.5} />
            <span>Open offline queue</span>
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
