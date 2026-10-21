'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, DemoRole } from '../../store/useAppStore';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useFontScale } from '../../lib/useFontScale';
import { Wifi, WifiOff, RefreshCw, X, ChevronDown, Type } from 'lucide-react';

export const TopBar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isOffline,
    toggleOffline,
    pendingRecords,
    isSyncing,
    syncNow,
    activeRole,
    setActiveRole,
    language,
    setLanguage,
  } = useAppStore();

  const { fontScale, cycleFontScale } = useFontScale();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync role state from route
  useEffect(() => {
    if (pathname.startsWith('/collector') && activeRole !== 'collector') {
      setActiveRole('collector');
    } else if (pathname.startsWith('/collection') && activeRole !== 'collection_manager') {
      setActiveRole('collection_manager');
    } else if (pathname.startsWith('/inventory') && activeRole !== 'inventory_manager') {
      setActiveRole('inventory_manager');
    }
  }, [pathname, activeRole, setActiveRole]);

  // Handle outside click for popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as DemoRole;
    setActiveRole(newRole);
    if (newRole === 'collector') {
      router.push('/collector');
    } else if (newRole === 'collection_manager') {
      router.push('/collection');
    } else if (newRole === 'inventory_manager') {
      router.push('/inventory');
    }
  };

  const isCollectorView = pathname.startsWith('/collector');

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col border-b border-rule bg-surface select-none shadow-none">
      {/* Top Bar Row */}
      <div className="flex h-[48px] items-center justify-between px-4 sm:px-6 gap-2">
        {/* Left: Role Switcher */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted whitespace-nowrap hidden sm:inline">
              {language === 'OR' ? 'ଡେମୋ ଭୂମିକା:' : 'Demo role:'}
            </span>
            <div className="relative">
              <select
                value={activeRole}
                onChange={handleRoleChange}
                aria-label="Demo role switcher"
                className={cn(
                  'h-[28px] appearance-none rounded-[4px] border border-rule bg-surface pl-2 pr-6 text-[12px] font-medium text-ink transition-colors',
                  'hover:border-ink-subtle focus:outline-2 focus:outline-accent focus:outline-offset-0 cursor-pointer shadow-none',
                  language === 'OR' && 'font-odia text-[13px]'
                )}
              >
                <option value="collector">
                  {language === 'OR' ? 'ରାଇମତୀ ସୋରେନ (ଆଦିବାସୀ ସଂଗ୍ରାହକ)' : 'Raimati Soren (Tribal Collector)'}
                </option>
                <option value="collection_manager">
                  {language === 'OR' ? 'ଆର. ମହାନ୍ତି (ସଂଗ୍ରହ ପରିଚାଳକ)' : 'R. Mohanty (Collection Manager)'}
                </option>
                <option value="inventory_manager">
                  {language === 'OR' ? 'ଏସ. ଦାସ (ଗୋଦାମ ପରିଚାଳକ)' : 'S. Das (Inventory Manager)'}
                </option>
              </select>
              <ChevronDown
                size={16}
                strokeWidth={1.5}
                className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-muted"
              />
            </div>
          </div>
          <span className="text-[9px] font-mono text-ink-subtle leading-none mt-0.5 tracking-tight">
            {language === 'OR' ? 'କେବଳ ପ୍ରଦର୍ଶନ ପାଇଁ — ଲଗ୍ଇନ୍ ବ୍ୟବସ୍ଥା ନାହିଁ।' : 'Demo only — auth is not implemented.'}
          </span>
        </div>

        {/* Center: Offline Status Pill & Popover */}
        <div className="relative flex items-center justify-center" ref={popoverRef}>
          {!isOffline ? (
            <StatusBadge variant="success" className="cursor-default">
              {language === 'OR' ? 'ଅନଲାଇନ୍' : 'Online'}
            </StatusBadge>
          ) : (
            <button
              onClick={() => setIsPopoverOpen(!isPopoverOpen)}
              className="inline-flex items-center gap-1 focus:outline-2 focus:outline-accent focus:outline-offset-0 rounded-[4px]"
              aria-label="View offline pending sync queue"
            >
              <StatusBadge variant="warning" className="cursor-pointer hover:border-warning/80">
                {language === 'OR'
                  ? `ଅଫଲାଇନ୍ · ${pendingRecords.length || 1} ରେକର୍ଡ ସିଙ୍କ ବାକି`
                  : `Offline · ${pendingRecords.length || 1} record pending sync`}
              </StatusBadge>
            </button>
          )}

          {/* Offline Sync Popover */}
          {isPopoverOpen && isOffline && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 rounded-[4px] border border-rule bg-surface p-3.5 z-50 shadow-none text-left">
              <div className="flex items-center justify-between border-b border-rule pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 text-warning font-semibold text-[12px] uppercase tracking-[0.04em]">
                  <WifiOff size={16} strokeWidth={1.5} />
                  Offline Sync Queue
                </div>
                <button
                  onClick={() => setIsPopoverOpen(false)}
                  className="text-ink-subtle hover:text-ink p-0.5 rounded-[2px]"
                  aria-label="Close offline popover"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="border border-rule rounded-[2px] p-2 bg-bg-sunken/50 text-[12px]">
                  <div className="font-semibold text-ink">Batch #BS-402 (100.00 kg)</div>
                  <div className="text-ink-muted text-[11px] leading-snug mt-0.5">
                    Field weigh verification recorded offline at Badagaon VK.
                  </div>
                  <div className="text-[10px] font-mono tabular-nums text-ink-subtle mt-1">
                    QUEUED: 2024-04-18 11:20 AM IST
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-ink-subtle">1 PENDING TRANSACTION</span>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={isSyncing}
                  onClick={() => {
                    syncNow();
                    setIsPopoverOpen(false);
                  }}
                >
                  <RefreshCw
                    size={16}
                    strokeWidth={1.5}
                  />
                  {isSyncing ? 'Syncing...' : 'Sync now'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Language Toggle & Mobile Offline Toggle */}
        <div className="flex items-center gap-2">
          {/* In collector view, allow quick demo offline toggle in top bar */}
          {isCollectorView && (
            <button
              onClick={toggleOffline}
              title={isOffline ? 'Switch to Online mode' : 'Simulate Offline mode'}
              className={cn(
                'h-[28px] px-2 rounded-[4px] border text-[11px] font-mono font-medium flex items-center gap-1 transition-colors select-none',
                isOffline
                  ? 'border-warning bg-warning/10 text-warning'
                  : 'border-rule bg-surface text-ink-muted hover:border-ink-subtle'
              )}
            >
              {isOffline ? <WifiOff size={16} strokeWidth={1.5} /> : <Wifi size={16} strokeWidth={1.5} />}
              <span className="hidden sm:inline">{isOffline ? 'Sim Offline' : 'Sim Online'}</span>
            </button>
          )}

          {/* Font Scale Cycle Button "A+" (INTERACTION & ACCESSIBILITY) */}
          <button
            onClick={cycleFontScale}
            title={`Cycle base font size: 16px → 18px → 20px (Current: ${fontScale}px)`}
            aria-label={`Cycle font size, current ${fontScale} pixels`}
            className={cn(
              'h-[32px] px-2 rounded-[4px] border border-rule bg-bg-sunken text-[12px] font-mono font-bold text-ink transition-colors select-none flex items-center gap-1',
              'hover:border-ink-subtle hover:bg-surface active:bg-bg-sunken focus:outline-2 focus:outline-accent focus:outline-offset-0'
            )}
          >
            <span>A+</span>
            <span className="text-[10px] font-normal text-ink-subtle">({fontScale})</span>
          </button>

          {/* Language Toggle: EN / ଓଡ଼ିଆ as two 32px rectangular buttons */}
          <div className="flex items-center border border-rule rounded-[4px] overflow-hidden bg-bg-sunken">
            <button
              onClick={() => setLanguage('EN')}
              className={cn(
                'h-[32px] px-2.5 text-[12px] font-medium transition-colors border-r border-rule',
                language === 'EN'
                  ? 'bg-surface text-ink font-semibold'
                  : 'bg-transparent text-ink-muted hover:text-ink'
              )}
              aria-label="Switch language to English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('OR')}
              className={cn(
                'h-[32px] px-2.5 text-[12px] font-medium transition-colors font-odia',
                language === 'OR'
                  ? 'bg-surface text-ink font-semibold'
                  : 'bg-transparent text-ink-muted hover:text-ink'
              )}
              aria-label="Switch language to Odia"
            >
              ଓଡ଼ିଆ
            </button>
          </div>
        </div>
      </div>

      {/* Persistent 32px Banner (Offline Signal / Prototype Disclaimer) */}
      <div className={cn(
        "h-[32px] w-full border-t border-rule flex items-center justify-center px-4 text-center transition-colors",
        isOffline ? "bg-warning/10 text-warning border-warning/40 font-semibold" : "bg-bg-sunken text-ink-muted"
      )}>
        <span className={cn(
          "text-[12px] uppercase tracking-[0.06em] font-medium font-mono truncate",
          language === 'OR' && "font-odia tracking-normal text-[13px]"
        )}>
          {isOffline
            ? (language === 'OR'
                ? `ଏହି ଫୋନରେ ସାଇତା ହୋଇଛି। ନେଟୱର୍କ ଫେରିଲେ ପଠାଯିବ (${pendingRecords.length || 1} ଟି ବାକି ଅଛି)`
                : `Saved on this phone. Will send when network returns (${pendingRecords.length || 1} pending).`)
            : (language === 'OR'
                ? 'ପ୍ରୋଟୋଟାଇପ୍ — ଦର, ପେମେଣ୍ଟ ଏବଂ ପରିଚୟ ଯାଞ୍ଚ କେବଳ ପରୀକ୍ଷାମୂଳକ।'
                : 'Prototype — rates, payments, and identity checks are simulated.')}
        </span>
      </div>
    </header>
  );
};
