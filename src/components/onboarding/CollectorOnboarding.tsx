'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import { ArrowRight, ChevronRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CollectorOnboardingProps {
  onComplete: () => void;
}

export const CollectorOnboarding: React.FC<CollectorOnboardingProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // Swipe gesture handling for mobile touch screens
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (diff > 50 && currentSlide < 2) {
      // Swiped left -> Next
      setCurrentSlide((prev) => prev + 1);
    } else if (diff < -50 && currentSlide > 0) {
      // Swiped right -> Prev
      setCurrentSlide((prev) => prev - 1);
    }
    touchStartXRef.current = null;
  };

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Collector Welcome Onboarding"
      className="fixed inset-0 z-50 bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header: Brand Mark + Progress Bar + Skip Button (Always Available) */}
      <div className="w-full max-w-[440px] mx-auto flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-[2px] bg-accent inline-block shrink-0" aria-hidden="true" />
          <span className="font-heading text-[16px] font-bold tracking-tight text-ink">
            BanaSetu
          </span>
          <span className="font-odia text-[13px] text-ink-muted">· ବନସେତୁ</span>
        </div>

        {/* Rectangular "Skip" Button Always Top-Right */}
        <button
          onClick={onComplete}
          aria-label="Skip onboarding"
          className="px-2.5 py-1 text-[12px] font-mono uppercase tracking-[0.06em] text-ink-muted hover:text-ink border border-rule hover:border-ink-subtle bg-surface rounded-[2px] transition-colors focus:outline-2 focus:outline-accent"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Carousel Container */}
      <div className="w-full max-w-[440px] mx-auto my-auto py-4 flex flex-col items-center">
        {/* Progress Dots / Bars */}
        <div className="flex items-center gap-1.5 mb-6" aria-label={`Step ${currentSlide + 1} of 3`}>
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                'h-1.5 rounded-[1px]',
                idx === currentSlide
                  ? 'w-8 bg-ink'
                  : 'w-3 bg-rule hover:bg-ink-subtle'
              )}
            />
          ))}
        </div>

        {/* Slide 1: The price before you sell */}
        {currentSlide === 0 && (
          <div className="w-full space-y-4">
            {/* Headers: Exactly one line English + one line Odia */}
            <div className="text-center space-y-1">
              <h1 className="font-heading text-[22px] sm:text-[24px] font-bold text-ink leading-tight">
                The price before you sell.
              </h1>
              <p className="font-odia text-[16px] text-ink-muted leading-[1.5]">
                ବିକ୍ରୟ କରିବା ପୂର୍ବରୁ ସଠିକ୍ ଦର ଜାଣନ୍ତୁ।
              </p>
            </div>

            {/* Visual: Single card showing "₹42/kg" with source line */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 text-center space-y-2 shadow-none">
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-muted font-bold block">
                Dried Mahua Flowers · ସରକାରୀ ଦର
              </span>
              <div className="font-heading text-[48px] font-bold tabular-nums text-accent leading-none">
                ₹42<span className="font-sans text-[20px] font-normal text-ink-muted ml-1">/kg</span>
              </div>
              <div className="pt-2 border-t border-rule text-[12px] font-mono text-ink-subtle">
                TRIFED MSP 2024-25 · LABHA Scheme Floor Rate
              </div>
            </div>
          </div>
        )}

        {/* Slide 2: Your weight, your receipt */}
        {currentSlide === 1 && (
          <div className="w-full space-y-4">
            {/* Headers: Exactly one line English + one line Odia */}
            <div className="text-center space-y-1">
              <h1 className="font-heading text-[22px] sm:text-[24px] font-bold text-ink leading-tight">
                Your weight, your receipt.
              </h1>
              <p className="font-odia text-[16px] text-ink-muted leading-[1.5]">
                ଆପଣଙ୍କ ଓଜନ, ଆପଣଙ୍କ ରସିଦ।
              </p>
            </div>

            {/* Visual: Receipt peek, showing weight number large */}
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-3 shadow-none">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted font-bold">
                  Collection Receipt #BS-402
                </span>
                <span className="font-mono text-[11px] text-ink-subtle">
                  14 Mar 2025
                </span>
              </div>

              <div className="flex items-baseline justify-between py-1">
                <span className="text-[12px] font-mono text-ink-muted">Net Certified Weight:</span>
                <div className="font-heading text-[36px] font-bold tabular-nums text-ink leading-none">
                  100.0 <span className="font-sans text-[16px] font-normal text-ink-muted">kg</span>
                </div>
              </div>

              <div className="border-t border-rule pt-2 flex items-center justify-between text-[12px]">
                <span className="font-mono text-ink-muted">Entitlement Total:</span>
                <span className="font-heading text-[20px] font-bold tabular-nums text-accent">
                  ₹4,200.00
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Slide 3: Saved even without network */}
        {currentSlide === 2 && (
          <div className="w-full space-y-4">
            {/* Headers: Exactly one line English + one line Odia */}
            <div className="text-center space-y-1">
              <h1 className="font-heading text-[22px] sm:text-[24px] font-bold text-ink leading-tight">
                Saved even without network.
              </h1>
              <p className="font-odia text-[16px] text-ink-muted leading-[1.5]">
                ନେଟୱାର୍କ ନଥିଲେ ମଧ୍ୟ ସୁରକ୍ଷିତ ଭାବେ ସାଇତି ରହିବ।
              </p>
            </div>

            {/* Visual: Phone / card container with a "queued" badge */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-3 text-center shadow-none">
              <div className="flex items-center justify-center gap-2">
                <SyncStatusBadge state="queued" />
              </div>

              <div className="font-heading text-[20px] font-semibold text-ink pt-1">
                Offline Local Storage
              </div>

              <div className="border-t border-rule pt-2 text-[12px] font-mono text-ink-subtle">
                Saved directly to device storage · syncs automatically when network returns
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="w-full max-w-[440px] mx-auto pt-3 border-t border-rule">
        <Button
          variant="primary"
          onClick={handleNext}
          className="w-full h-[52px] text-[15px] font-semibold flex items-center justify-center gap-2"
        >
          {currentSlide < 2 ? (
            <>
              <span>Next</span>
              <span className="font-odia text-[14px]">/ ଆଗକୁ</span>
              <ArrowRight size={18} strokeWidth={1.5} />
            </>
          ) : (
            <>
              <span>Enter BanaSetu</span>
              <span className="font-odia text-[14px]">/ ଆରମ୍ଭ କରନ୍ତୁ</span>
              <Check size={18} strokeWidth={2} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
