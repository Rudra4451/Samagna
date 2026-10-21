'use client';

import React from 'react';
import Link from 'next/link';
import { SyncRecord } from '../../lib/db';
import { SyncStatusBadge } from '../ui/SyncStatusBadge';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '../ui/Drawer';
import { Button } from '../ui/Button';
import { SectionLabel } from '../ui/SectionLabel';
import { cn } from '../../lib/utils';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  Layers,
  Clock,
  User,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react';

export interface SyncDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: SyncRecord[];
  isSyncing: boolean;
  isOffline: boolean;
  lastSyncedFormatted: string;
  queueSizeKb: number;
  wifiOnly: boolean;
  onToggleWifiOnly: (val: boolean) => void;
  onSyncAll: () => Promise<any>;
  onRetryItem: (local_id: string) => Promise<boolean>;
  onDeleteItem: (local_id: string) => Promise<void>;
  onOpenConflict: (record: SyncRecord) => void;
  isRecordBlocked: (record: SyncRecord) => { blocked: boolean; reason?: string };
}

export const SyncDrawer: React.FC<SyncDrawerProps> = ({
  open,
  onOpenChange,
  queue,
  isSyncing,
  isOffline,
  lastSyncedFormatted,
  queueSizeKb,
  wifiOnly,
  onToggleWifiOnly,
  onSyncAll,
  onRetryItem,
  onDeleteItem,
  onOpenConflict,
  isRecordBlocked,
}) => {
  const pendingCount = queue.filter((r) => r.state !== 'synced').length;
  const conflictCount = queue.filter((r) => r.state === 'conflict').length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader className="border-b border-rule bg-bg-sunken px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-accent" />
                <DrawerTitle className="text-[18px] font-heading font-semibold text-ink">
                  Global Sync Ledger
                </DrawerTitle>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-[2px] border font-bold uppercase',
                    isOffline
                      ? 'border-warning/70 bg-warning/10 text-warning'
                      : 'border-success/70 bg-success/10 text-success'
                  )}
                >
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              <DrawerDescription className="text-[12px] font-mono text-ink-muted">
                Durable IndexedDB Queue · Last sync: {lastSyncedFormatted}
              </DrawerDescription>
            </div>
            <DrawerClose className="text-ink-subtle hover:text-ink text-[12px] font-mono">
              [Close]
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-6 space-y-5 text-[14px]">
          {/* Battery- and Data-Awareness Strip (Rule 8) */}
          <div className="border border-rule rounded-[4px] p-3.5 bg-bg-sunken/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
            <div className="space-y-0.5">
              <div className="font-mono text-[13px] font-semibold text-ink">
                About {queueSizeKb} KB queued
              </div>
              <div className="text-ink-subtle text-[11px] font-mono">
                {queue.length} total local records · FIFO execution in dependency order
              </div>
            </div>

            {/* Small rectangular toggle for Wi-Fi only (default off) */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="wifi-only-toggle" className="text-[12px] font-medium text-ink select-none cursor-pointer">
                Wi-Fi only
              </label>
              <button
                id="wifi-only-toggle"
                role="switch"
                aria-checked={wifiOnly}
                onClick={() => onToggleWifiOnly(!wifiOnly)}
                className={cn(
                  'h-[26px] px-2.5 rounded-[3px] border text-[11px] font-mono font-bold transition-colors select-none',
                  wifiOnly
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-rule bg-surface text-ink-muted hover:border-ink-subtle'
                )}
              >
                {wifiOnly ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Conflict Alert Banner if conflicts exist */}
          {conflictCount > 0 && (
            <div className="border border-danger bg-danger/5 rounded-[4px] p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-danger text-[13px] font-semibold">
                <AlertTriangle size={16} />
                <span>{conflictCount} sync conflict(s) require human review</span>
              </div>
              <span className="text-[11px] font-mono text-danger">Needs Review</span>
            </div>
          )}

          {/* Queue List Rows */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between border-b border-rule pb-1.5">
              <SectionLabel as="h3">Queued Actions Across Roles</SectionLabel>
              <span className="text-[11px] font-mono text-ink-muted tabular-nums">
                {pendingCount} Pending · {queue.length - pendingCount} Synced
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="border border-rule rounded-[4px] p-6 text-center text-ink-muted text-[13px] bg-surface">
                Sync queue is empty. All local ledger mutations are synchronized.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {queue.map((item) => {
                  const blockInfo = isRecordBlocked(item);
                  const isBlocked = blockInfo.blocked;

                  return (
                    <div
                      key={item.local_id}
                      className={cn(
                        'border rounded-[4px] p-3.5 bg-surface text-[13px] transition-colors',
                        item.state === 'conflict'
                          ? 'border-danger/60 bg-danger/5'
                          : item.state === 'failed'
                          ? 'border-danger/40'
                          : 'border-rule'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {/* Batch Code + ULID Local ID (Rule 6) */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[14px] font-bold text-ink">
                              {item.batch_code}
                            </span>
                            <span className="text-[11px] font-mono text-ink-subtle bg-bg-sunken px-1.5 py-0.5 rounded-[2px] border border-rule">
                              ULID: {item.local_id.slice(0, 10)}…
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                              {item.entity}
                            </span>
                          </div>

                          {/* Actor & Action */}
                          <div className="text-[12px] text-ink-muted mt-1 flex items-center gap-1.5 flex-wrap">
                            <User size={13} className="text-ink-subtle" />
                            <span className="font-medium text-ink">{item.actor.name}</span>
                            <span className="text-ink-subtle">({item.actor.role})</span>
                            <span className="text-ink-subtle">·</span>
                            <span className="font-mono uppercase text-[11px] text-ink-subtle">
                              Action: {item.action}
                            </span>
                          </div>

                          {/* Blocked by earlier record warning (Rule 7) */}
                          {isBlocked && (
                            <div className="text-[11px] font-mono text-warning font-semibold mt-1">
                              ⚠ {blockInfo.reason}
                            </div>
                          )}

                          {/* Error message if failed */}
                          {item.error && !isBlocked && (
                            <div className="text-[11px] font-mono text-danger mt-1">
                              {item.error}
                            </div>
                          )}
                        </div>

                        {/* Status Badge + Row Action */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <SyncStatusBadge state={item.state} />

                          <div className="flex items-center gap-1.5">
                            {item.state === 'conflict' && (
                              <button
                                onClick={() => onOpenConflict(item)}
                                className="h-[28px] px-2 rounded-[2px] border border-danger bg-danger text-white text-[11px] font-semibold hover:bg-danger/90 transition-colors"
                              >
                                Resolve Conflict
                              </button>
                            )}

                            {(item.state === 'failed' || item.state === 'queued') && (
                              <button
                                onClick={() => onRetryItem(item.local_id)}
                                disabled={isBlocked || isSyncing}
                                className="h-[28px] px-2 rounded-[2px] border border-rule bg-bg-sunken text-ink text-[11px] font-mono hover:border-ink-subtle disabled:opacity-40 transition-colors"
                              >
                                Retry
                              </button>
                            )}

                            <button
                              onClick={() => onDeleteItem(item.local_id)}
                              className="h-[28px] w-[28px] rounded-[2px] border border-rule bg-surface text-ink-subtle hover:text-danger hover:border-danger/40 flex items-center justify-center transition-colors"
                              title="Purge queued action"
                              aria-label="Purge queued record"
                            >
                              <Trash2 size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerBody>

        {/* Drawer Footer with Bulk "Retry all" rectangular button (Rule 4) */}
        <DrawerFooter className="flex items-center justify-between gap-3 bg-bg-sunken border-t border-rule p-4">
          <Link
            href="/settings/sync"
            className="text-[12px] font-mono text-ink-muted hover:text-ink underline flex items-center gap-1"
          >
            <span>Open /settings/sync</span>
            <ExternalLink size={12} />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              disabled={isSyncing || pendingCount === 0}
              onClick={() => onSyncAll()}
              className="text-[13px] font-semibold"
            >
              <RefreshCw
                size={14}
                className={cn('mr-1.5', isSyncing && 'animate-spin')}
              />
              <span>{isSyncing ? 'Syncing...' : 'Retry all'}</span>
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
