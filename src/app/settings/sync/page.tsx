'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/shell/AppShell';
import { useOffline } from '../../../lib/useOffline';
import { SyncStatusBadge } from '../../../components/ui/SyncStatusBadge';
import { ConflictDrawer } from '../../../components/sync/ConflictDrawer';
import { Button } from '../../../components/ui/Button';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { cn } from '../../../lib/utils';
import {
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';

export default function SettingsSyncPage() {
  const {
    isOffline,
    isSyncing,
    lastSyncedFormatted,
    queue,
    queuedCount,
    conflictCount,
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
    forceMockConflict,
    isRecordBlocked,
  } = useOffline();

  const [isConflictDrawerOpen, setIsConflictDrawerOpen] = useState(false);

  const handleOpenConflict = (item: any) => {
    setActiveConflict(item);
    setIsConflictDrawerOpen(true);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-[26px] font-semibold text-ink">
                Global Sync Settings & Queue
              </h1>
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-[2px] border font-bold uppercase',
                  isOffline
                    ? 'border-warning bg-warning/10 text-warning'
                    : 'border-success bg-success/10 text-success'
                )}
              >
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>
            <p className="text-[12px] text-ink-muted mt-0.5 font-mono">
              Single global queue across Collector, Collection Manager, and Inventory Manager
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => forceMockConflict()}
              className="text-[12px] font-mono"
            >
              Simulate Conflict (#BS-402)
            </Button>

            <Button
              variant="primary"
              disabled={isSyncing || queuedCount === 0}
              onClick={() => syncAll()}
              className="text-[13px] font-semibold"
            >
              <RefreshCw size={14} className={cn('mr-1.5', isSyncing && 'animate-spin')} />
              <span>{isSyncing ? 'Syncing...' : 'Retry all'}</span>
            </Button>
          </div>
        </div>

        {/* Battery & Data Awareness Settings Card (Rule 8) */}
        <div className="border border-rule rounded-[4px] p-4 bg-surface grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-muted font-bold block">
              Queued Data Footprint
            </span>
            <div className="font-heading text-[24px] font-bold text-ink tabular-nums">
              About {queueSizeKb} KB
            </div>
            <p className="text-[11px] text-ink-subtle font-mono">
              Estimated uncompressed payload on local device
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-muted font-bold block">
              Last Network Handshake
            </span>
            <div className="font-mono text-[18px] font-semibold text-ink">
              {lastSyncedFormatted}
            </div>
            <p className="text-[11px] text-ink-subtle font-mono">
              Exponential backoff ceiling: 60s
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-ink-muted font-bold block">
              Wi-Fi Only Photo Mode
            </span>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWifiOnly(!wifiOnly)}
                className={cn(
                  'h-[30px] px-3 rounded-[3px] border text-[12px] font-mono font-bold transition-colors',
                  wifiOnly
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-rule bg-bg-sunken text-ink-muted hover:border-ink-subtle'
                )}
              >
                {wifiOnly ? 'ENABLED (Wi-Fi Only)' : 'DISABLED (Any Network)'}
              </button>
            </div>
            <p className="text-[11px] text-ink-subtle font-mono">
              Defers heavy photo uploads when on cellular data
            </p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-rule bg-bg-sunken/40 flex items-center justify-between">
            <SectionLabel as="h2">Durable Sync Queue</SectionLabel>
            <span className="text-[11px] font-mono text-ink-muted tabular-nums">
              {queuedCount} Queued · {conflictCount} Conflicts · {queue.length} Total
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-[14px]">
              No pending ledger records in local database.
            </div>
          ) : (
            <div className="divide-y divide-rule">
              {queue.map((item) => {
                const blockCheck = isRecordBlocked(item);
                return (
                  <div key={item.local_id} className="p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[14px] font-bold text-ink">
                          {item.batch_code}
                        </span>
                        <span className="text-[11px] font-mono text-ink-subtle bg-bg-sunken px-1.5 py-0.5 rounded-[2px] border border-rule">
                          ULID: {item.local_id}
                        </span>
                        <span className="text-[11px] font-mono uppercase text-ink-muted font-bold">
                          {item.entity}
                        </span>
                      </div>

                      <div className="text-[12px] text-ink-muted flex items-center gap-1.5">
                        <User size={13} className="text-ink-subtle" />
                        <span className="font-semibold text-ink">{item.actor.name}</span>
                        <span>({item.actor.role})</span>
                        <span>·</span>
                        <span className="font-mono uppercase text-[11px]">Action: {item.action}</span>
                      </div>

                      {blockCheck.blocked && (
                        <div className="text-[11px] font-mono text-warning font-semibold">
                          ⚠ {blockCheck.reason}
                        </div>
                      )}

                      {item.error && !blockCheck.blocked && (
                        <div className="text-[11px] font-mono text-danger">
                          {item.error}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <SyncStatusBadge state={item.state} />

                      <div className="flex items-center gap-2">
                        {item.state === 'conflict' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenConflict(item)}
                            className="text-[11px] h-[28px]"
                          >
                            Resolve Conflict
                          </Button>
                        )}

                        {(item.state === 'failed' || item.state === 'queued') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={blockCheck.blocked || isSyncing}
                            onClick={() => retryItem(item.local_id)}
                            className="text-[11px] h-[28px] font-mono"
                          >
                            Retry
                          </Button>
                        )}

                        <button
                          onClick={() => deleteItem(item.local_id)}
                          className="h-[28px] w-[28px] rounded-[2px] border border-rule bg-surface text-ink-subtle hover:text-danger hover:border-danger/40 flex items-center justify-center transition-colors"
                          title="Purge queued action"
                          aria-label="Purge queued record"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conflict Drawer */}
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
      </div>
    </AppShell>
  );
}
