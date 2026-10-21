'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '../../store/useAppStore';
import { useFontScale } from '../../lib/useFontScale';
import { useOffline } from '../../lib/useOffline';
import { cn } from '../../lib/utils';
import { SlidersHorizontal, WifiOff, Wifi, Languages, Type, Camera, RefreshCw, AlertTriangle } from 'lucide-react';

interface DemoStatePanelProps {
  onTriggerZeroTyping?: () => void;
}

function DemoStateContent({ onTriggerZeroTyping }: DemoStatePanelProps) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';

  const { isOffline, setOffline, language, setLanguage } = useAppStore();
  const { fontScale, setFontScale } = useFontScale();
  const { forceMockConflict } = useOffline();
  const [isOpen, setIsOpen] = useState(true);

  if (!isDemo) {
    return null;
  }

  return (
    <aside
      aria-label="Demo state inspector panel"
      className="fixed bottom-20 left-4 z-50 max-w-xs rounded-[4px] border border-ink bg-surface p-3 text-[12px] shadow-none select-none"
    >
      <div className="flex items-center justify-between border-b border-rule pb-1.5 mb-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink">
          <SlidersHorizontal size={14} strokeWidth={1.5} className="text-accent" />
          <span>DEMO STATE (?demo=1)</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[10px] font-mono text-ink-subtle hover:text-ink px-1 border border-rule rounded-[2px]"
        >
          {isOpen ? 'Minimize' : 'Expand'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            {/* Toggle Offline */}
            <button
              onClick={() => setOffline(!isOffline)}
              className={cn(
                'h-[30px] px-2 rounded-[2px] border text-[11px] font-mono flex items-center justify-center gap-1 transition-colors',
                isOffline
                  ? 'border-warning bg-warning/15 text-warning font-bold'
                  : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink'
              )}
            >
              {isOffline ? <WifiOff size={13} strokeWidth={1.5} /> : <Wifi size={13} strokeWidth={1.5} />}
              <span>{isOffline ? 'Offline: ON' : 'Force Offline'}</span>
            </button>

            {/* Force Odia */}
            <button
              onClick={() => setLanguage(language === 'OR' ? 'EN' : 'OR')}
              className={cn(
                'h-[30px] px-2 rounded-[2px] border text-[11px] font-mono flex items-center justify-center gap-1 transition-colors',
                language === 'OR'
                  ? 'border-accent bg-accent/15 text-accent font-bold'
                  : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink'
              )}
            >
              <Languages size={13} strokeWidth={1.5} />
              <span>{language === 'OR' ? 'Odia: ACTIVE' : 'Force Odia'}</span>
            </button>

            {/* Force 20px font */}
            <button
              onClick={() => setFontScale(fontScale === 20 ? 16 : 20)}
              className={cn(
                'h-[30px] px-2 rounded-[2px] border text-[11px] font-mono flex items-center justify-center gap-1 transition-colors',
                fontScale === 20
                  ? 'border-ink bg-ink text-surface font-bold'
                  : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink'
              )}
            >
              <Type size={13} strokeWidth={1.5} />
              <span>{fontScale === 20 ? 'Font: 20px' : 'Force 20px'}</span>
            </button>

            {/* Force Zero-Typing path */}
            <button
              onClick={onTriggerZeroTyping}
              className="h-[30px] px-2 rounded-[2px] border border-rule bg-bg-sunken text-ink-muted hover:text-ink hover:border-ink-subtle text-[11px] font-mono flex items-center justify-center gap-1 transition-colors"
            >
              <Camera size={13} strokeWidth={1.5} />
              <span>Zero-Typing</span>
            </button>
          </div>

          {/* Force Conflict Trigger (Offline Deliverable) */}
          <button
            onClick={() => forceMockConflict()}
            className="w-full h-[32px] px-2 rounded-[2px] border border-danger/70 bg-danger/10 text-danger text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-colors hover:bg-danger/20"
          >
            <AlertTriangle size={13} strokeWidth={1.5} />
            <span>Force Conflict (#BS-402)</span>
          </button>

          <div className="flex items-center justify-between pt-1 border-t border-rule text-[10px] font-mono text-ink-subtle">
            <span>Flip live states for judge review</span>
            <button
              onClick={() => {
                setOffline(false);
                setLanguage('EN');
                setFontScale(16);
              }}
              className="text-accent underline hover:opacity-80"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

export function DemoStatePanel(props: DemoStatePanelProps) {
  return (
    <Suspense fallback={null}>
      <DemoStateContent {...props} />
    </Suspense>
  );
}
