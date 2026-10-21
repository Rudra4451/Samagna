'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, DemoRole } from '../../store/useAppStore';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useFontScale } from '../../lib/useFontScale';
import { useOffline } from '../../lib/useOffline';
import { SyncDrawer } from '../sync/SyncDrawer';
import { ConflictDrawer } from '../sync/ConflictDrawer';
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
  const {
    isOffline: offlineState,
    isSyncing: syncingState,
    queue,
    queuedCount,
    conflictCount,
    lastSyncedFormatted,
    queueSizeKb,
    wifiOnly,
    setWifiOnly,
    syncAll,
    retryItem,
    deleteItem,
    activeConflict,
    setActiveConflict,
    resolveConflictKeepLocal,
    resolveConflictKeepServer,
    resolveConflictMerge,
    isRecordBlocked,
  } = useOffline();

  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isConflictDrawerOpen, setIsConflictDrawerOpen] = useState(false);

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

        {/* Center: Always-Visible, Always-Tappable Offline Pill (Rule 9) */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsSyncDrawerOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border transition-colors shadow-none select-none",
              offlineState
                ? "border-warning/60 bg-warning/10 hover:border-warning"
                : "border-rule bg-surface hover:bg-bg-sunken hover:border-ink-subtle"
            )}
            aria-label="Open global sync ledger drawer"
            title="Click to view global sync queue and conflict status"
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                offlineState ? "bg-warning" : "bg-success"
              )}
            />
            <span className="font-mono text-[11px] font-bold text-ink">
              {offlineState ? (language === 'OR' ? 'ଅଫଲାଇନ୍' : 'Offline') : (language === 'OR' ? 'ଅନଲାଇନ୍' : 'Online')}
            </span>

            <span className="text-ink-subtle font-mono text-[11px]">·</span>

            <span className={cn(
              "font-mono text-[11px] font-semibold tabular-nums",
              queuedCount > 0 ? "text-warning" : "text-ink-muted"
            )}>
              {queuedCount} {language === 'OR' ? 'ବାକି' : 'queued'}
            </span>

            {conflictCount > 0 && (
              <span className="text-[10px] font-mono px-1 rounded-[2px] bg-danger text-white font-bold animate-pulse">
                {conflictCount} conflict
              </span>
            )}

            <span className="text-ink-subtle font-mono text-[11px] hidden sm:inline">·</span>

            <span className="font-mono text-[10px] text-ink-subtle hidden sm:inline tabular-nums">
              {lastSyncedFormatted}
            </span>
          </button>
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
        offlineState ? "bg-warning/10 text-warning border-warning/40 font-semibold" : "bg-bg-sunken text-ink-muted"
      )}>
        <span className={cn(
          "text-[12px] uppercase tracking-[0.06em] font-medium font-mono truncate",
          language === 'OR' && "font-odia tracking-normal text-[13px]"
        )}>
          {offlineState
            ? (language === 'OR'
                ? `ଏହି ଫୋନରେ ସାଇତା ହୋଇଛି। ନେଟୱର୍କ ଫେରିଲେ ପଠାଯିବ (${queuedCount || 1} ଟି ବାକି ଅଛି)`
                : `Saved on this phone. Will send when network returns (${queuedCount || 1} pending).`)
            : (language === 'OR'
                ? 'ପ୍ରୋଟୋଟାଇପ୍ — ଦର, ପେମେଣ୍ଟ ଏବଂ ପରିଚୟ ଯାଞ୍ଚ କେବଳ ପରୀକ୍ଷାମୂଳକ।'
                : 'Prototype — rates, payments, and identity checks are simulated.')}
        </span>
      </div>

      {/* Global Sync Drawer (Rule 4, 8, 9) */}
      <SyncDrawer
        open={isSyncDrawerOpen}
        onOpenChange={setIsSyncDrawerOpen}
        queue={queue}
        isSyncing={syncingState}
        isOffline={offlineState}
        lastSyncedFormatted={lastSyncedFormatted}
        queueSizeKb={queueSizeKb}
        wifiOnly={wifiOnly}
        onToggleWifiOnly={setWifiOnly}
        onSyncAll={syncAll}
        onRetryItem={retryItem}
        onDeleteItem={deleteItem}
        onOpenConflict={(item) => {
          setActiveConflict(item);
          setIsConflictDrawerOpen(true);
        }}
        isRecordBlocked={isRecordBlocked}
      />

      {/* Global Conflict Drawer (Rule 5) */}
      <ConflictDrawer
        conflict={activeConflict}
        open={isConflictDrawerOpen || !!activeConflict}
        onOpenChange={(open) => {
          setIsConflictDrawerOpen(open);
          if (!open) setActiveConflict(null);
        }}
        onKeepLocal={resolveConflictKeepLocal}
        onKeepServer={resolveConflictKeepServer}
        onMerge={resolveConflictMerge}
      />
    </header>
  );
};
