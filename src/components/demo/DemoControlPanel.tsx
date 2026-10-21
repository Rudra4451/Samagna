'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '../../store/useAppStore';
import { useFontScale } from '../../lib/useFontScale';
import { useOffline } from '../../lib/useOffline';
import { resetDemoState } from '../../demo/seedData';
import { cn } from '../../lib/utils';
import { FallbackViewerModal } from './FallbackViewerModal';

export function DemoControlPanelContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isDemo = searchParams.get('demo') === '1';

  const { isOffline, setOffline, language, setLanguage } = useAppStore();
  const { fontScale, setFontScale } = useFontScale();
  const { forceMockConflict } = useOffline();

  const [isMinimized, setIsMinimized] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [conflictTriggered, setConflictTriggered] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Keyboard shortcut: 'f' to toggle fallback, 'r' to reset when in demo
  useEffect(() => {
    if (!isDemo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'F' && e.shiftKey) {
        setShowFallback((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemo]);

  if (!isDemo) {
    return null;
  }

  const handleReset = async () => {
    setResetting(true);
    await resetDemoState(1);
    setResetting(false);
    // Reload or refresh to apply fresh seeded state
    router.refresh();
  };

  const handleForceConflict = async () => {
    setConflictTriggered(true);
    await forceMockConflict();
    setTimeout(() => setConflictTriggered(false), 2500);
  };

  const handleJump = (route: string) => {
    const hasScript = searchParams.get('script') === '1' ? '&script=1' : '';
    router.push(`${route}?demo=1${hasScript}`);
  };

  return (
    <>
      <aside
        aria-label="Stage Demo Control Panel"
        className="fixed bottom-4 right-4 z-50 w-[240px] border border-ink bg-surface p-3 text-[12px] shadow-none select-none"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-rule pb-2 mb-2">
          <div className="flex flex-col">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink">
              Demo Panel (?demo=1)
            </span>
            <span className="font-mono text-[10px] text-ink-muted">
              Stage Control & Fallbacks
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-[22px] px-1.5 text-[10px] font-mono border border-rule rounded-[2px] bg-bg-sunken hover:border-ink text-ink transition-colors"
          >
            {isMinimized ? 'Expand' : 'Hide'}
          </button>
        </div>

        {!isMinimized && (
          <div className="space-y-2">
            {/* 1. Reset Demo Data Button */}
            <button
              onClick={handleReset}
              disabled={resetting}
              className="w-full h-[32px] px-2 rounded-[2px] border border-danger/80 bg-danger/10 hover:bg-danger/20 text-danger text-[11px] font-mono font-bold transition-colors disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Reset demo data'}
            </button>

            {/* 2. Force Offline Button */}
            <button
              onClick={() => setOffline(!isOffline)}
              className={cn(
                'w-full h-[32px] px-2 rounded-[2px] border text-[11px] font-mono font-bold transition-colors',
                isOffline
                  ? 'border-warning bg-warning/20 text-warning'
                  : 'border-rule bg-bg-sunken text-ink hover:border-ink-subtle'
              )}
            >
              {isOffline ? 'Offline: Forced ON' : 'Force offline'}
            </button>

            {/* 3. Force Sync Conflict Button */}
            <button
              onClick={handleForceConflict}
              className={cn(
                'w-full h-[32px] px-2 rounded-[2px] border text-[11px] font-mono font-bold transition-colors',
                conflictTriggered
                  ? 'border-danger bg-danger text-surface'
                  : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink hover:border-ink-subtle'
              )}
            >
              {conflictTriggered ? 'Conflict Queued!' : 'Force sync conflict'}
            </button>

            {/* 4. Jump To Targets */}
            <div className="pt-1 border-t border-rule">
              <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                Jump to Core Views:
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleJump('/collector')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                    pathname === '/collector'
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Collector
                </button>
                <button
                  onClick={() => handleJump('/collection')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                    pathname === '/collection'
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Collection
                </button>
                <button
                  onClick={() => handleJump('/inventory')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                    pathname === '/inventory'
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Inventory
                </button>
                <button
                  onClick={() => handleJump('/collection/tag/BS-402')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                    pathname.includes('/tag')
                      ? 'border-accent bg-accent/15 text-accent font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Bag Tag
                </button>
              </div>
              <button
                onClick={() => handleJump('/collection/receipt/BS-402')}
                className={cn(
                  'w-full h-[32px] mt-1 px-2 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                  pathname.includes('/receipt')
                    ? 'border-accent bg-accent/15 text-accent font-bold'
                    : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                )}
              >
                Collection Receipt
              </button>
            </div>

            {/* 5. Language Toggle (EN / OD) */}
            <div className="pt-1 border-t border-rule">
              <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                Language:
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setLanguage('EN')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono transition-colors',
                    language === 'EN'
                      ? 'border-ink bg-ink text-surface font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Language: EN
                </button>
                <button
                  onClick={() => setLanguage('OR')}
                  className={cn(
                    'h-[32px] px-2 rounded-[2px] border text-[11px] font-mono font-odia transition-colors',
                    language === 'OR'
                      ? 'border-accent bg-accent text-surface font-bold'
                      : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                  )}
                >
                  Language: OD
                </button>
              </div>
            </div>

            {/* 6. Font Scale: 16 / 18 / 20 */}
            <div className="pt-1 border-t border-rule">
              <div className="text-[10px] font-mono text-ink-muted uppercase tracking-wider mb-1">
                Font scale:
              </div>
              <div className="grid grid-cols-3 gap-1">
                {([16, 18, 20] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setFontScale(sz)}
                    className={cn(
                      'h-[32px] px-1 rounded-[2px] border text-[11px] font-mono transition-colors text-center',
                      fontScale === sz
                        ? 'border-ink bg-ink text-surface font-bold'
                        : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                    )}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Fallback Screenshot Toggle */}
            <div className="pt-1 border-t border-rule">
              <button
                onClick={() => setShowFallback(!showFallback)}
                className={cn(
                  'w-full h-[32px] px-2 rounded-[2px] border text-[11px] font-mono font-bold transition-colors',
                  showFallback
                    ? 'border-accent bg-accent text-surface'
                    : 'border-rule bg-bg-sunken text-ink hover:border-ink'
                )}
              >
                {showFallback ? 'Hide fallback' : 'Show fallback'}
              </button>
            </div>

            {/* Footer Invariant Note */}
            <div className="pt-1 border-t border-rule text-center">
              <span className="text-[10px] font-mono text-ink-subtle block">
                Simulated network · Deterministic sync
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Fallback Screenshot Overlay if active */}
      {showFallback && (
        <FallbackViewerModal onClose={() => setShowFallback(false)} />
      )}
    </>
  );
}

export function DemoControlPanel() {
  return (
    <Suspense fallback={null}>
      <DemoControlPanelContent />
    </Suspense>
  );
}
