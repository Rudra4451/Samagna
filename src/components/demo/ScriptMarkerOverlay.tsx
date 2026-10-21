'use client';

import React, { Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { resetDemoState, DEMO_ACTS } from '../../demo/seedData';

function ScriptMarkerOverlayContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isDemo = searchParams.get('demo') === '1';
  const hasScript = searchParams.get('script') === '1';

  if (!isDemo || !hasScript) {
    return null;
  }

  // Derive current script line from path
  const getCurrentAct = () => {
    if (pathname.includes('/collection/receipt') || pathname.includes('/collection/tag')) {
      return {
        act: 1,
        marker: 'Act 1 · Village Pickup & Payout · 1:00–1:30',
        cue: 'Presenter: "Receipt printed in Odia, immutable bag stencil tag applied for transit."',
      };
    }
    if (pathname.includes('/collector') || pathname.includes('/collection')) {
      return {
        act: 1,
        marker: 'Act 1 · Village pickup · 0:30–1:30',
        cue: 'Presenter: "Sunita Soren drops 100 kg Mahua. Offline queue handles connection drop."',
      };
    }
    if (pathname.includes('/inventory')) {
      return {
        act: 2,
        marker: 'Act 2 · Warehouse discrepancy · 1:30–2:30',
        cue: 'Presenter: "Arrival re-weigh at 95 kg triggers 3.5 kg excess shrinkage in <300ms."',
      };
    }
    if (pathname.includes('/demo/handoff')) {
      return {
        act: 3,
        marker: 'Act 3 · Safeguards & Evaluator Handoff · 2:30–3:00',
        cue: 'Presenter: "Non-punitive quarantine protects tribal payment under LABHA guarantee."',
      };
    }
    return {
      act: 0,
      marker: 'Act 0 · Institutional fit · 0:00–0:30',
      cue: 'Presenter: "Minor Forest Produce dual ledger for 1.4M tribal forest gatherers."',
    };
  };

  const current = getCurrentAct();

  const handleJumpAct = async (actNumber: number) => {
    const actDef = DEMO_ACTS.find((a) => a.act === actNumber);
    if (actDef) {
      await resetDemoState(actNumber);
      router.push(`${actDef.targetRoute}&script=1`);
    }
  };

  return (
    <div
      role="banner"
      aria-label="Presenter Script Teleprompter Bar"
      className="fixed top-0 inset-x-0 z-40 h-[32px] bg-ink text-surface border-b border-ink px-3 flex items-center justify-between text-[11px] font-mono select-none"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="bg-accent text-accent-ink px-1.5 py-0.2 rounded-[2px] font-bold shrink-0">
          STAGE SCRIPT
        </span>
        <span className="font-semibold text-sidebar-ink truncate">
          {current.marker}
        </span>
        <span className="hidden md:inline text-ink-subtle truncate">
          — {current.cue}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[10px] text-ink-subtle mr-1 hidden sm:inline">Jump:</span>
        <button
          onClick={() => handleJumpAct(1)}
          className="h-[22px] px-1.5 rounded-[2px] border border-rule/30 bg-surface/10 hover:bg-surface/20 text-surface text-[10px]"
        >
          Act 1 (0:30)
        </button>
        <button
          onClick={() => handleJumpAct(2)}
          className="h-[22px] px-1.5 rounded-[2px] border border-rule/30 bg-surface/10 hover:bg-surface/20 text-surface text-[10px]"
        >
          Act 2 (1:30)
        </button>
        <button
          onClick={() => handleJumpAct(3)}
          className="h-[22px] px-1.5 rounded-[2px] border border-rule/30 bg-surface/10 hover:bg-surface/20 text-surface text-[10px]"
        >
          Act 3 (2:30)
        </button>
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('script');
            router.push(url.pathname + url.search);
          }}
          className="h-[22px] px-1.5 ml-1 rounded-[2px] border border-rule/30 bg-surface/10 hover:bg-surface/20 text-ink-subtle text-[10px]"
          title="Hide Script Bar"
        >
          Hide
        </button>
      </div>
    </div>
  );
}

export function ScriptMarkerOverlay() {
  return (
    <Suspense fallback={null}>
      <ScriptMarkerOverlayContent />
    </Suspense>
  );
}
