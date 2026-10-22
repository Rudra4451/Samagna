'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, SyncRecord, SyncState, SyncEntityType } from './db';
import { generateULID } from './ulid';
import { useAppStore } from '../store/useAppStore';

const ENTITY_DEPENDENCY_ORDER: SyncEntityType[] = [
  'pickup_request',
  'collection',
  'dispatch',
  'storage_receipt',
];

export interface UseOfflineReturn {
  // Network and Sync Engine State
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  lastSyncedFormatted: string;
  wifiOnly: boolean;
  setWifiOnly: (val: boolean) => void;

  // Queue State
  queue: SyncRecord[];
  queuedCount: number;
  conflictCount: number;
  queueSizeKb: number;

  // Conflict state
  activeConflict: SyncRecord | null;
  setActiveConflict: (record: SyncRecord | null) => void;

  // Actions
  enqueueAction: (params: {
    entity: SyncEntityType;
    batch_code: string;
    action: 'create' | 'update' | 'verify' | 'quarantine';
    actor: { id: string; name: string; role: string };
    payload: any;
    dependsOn?: string;
    hasPhotos?: boolean;
    approxSizeBytes?: number;
  }) => Promise<SyncRecord>;

  syncAll: () => Promise<{ success: number; failed: number; conflicts: number }>;
  retryItem: (local_id: string) => Promise<boolean>;
  deleteItem: (local_id: string) => Promise<void>;

  // Conflict Resolution
  resolveConflictKeepLocal: (local_id: string) => Promise<void>;
  resolveConflictKeepServer: (local_id: string) => Promise<void>;
  resolveConflictMerge: (
    local_id: string,
    mergedPayload: any,
    supervisorNote: string
  ) => Promise<void>;

  // Demo helper
  forceMockConflict: () => Promise<SyncRecord>;

  // Dependency checker
  isRecordBlocked: (record: SyncRecord) => { blocked: boolean; reason?: string };
}

export function useOffline(): UseOfflineReturn {
  const { isOffline, setOffline } = useAppStore();
  const [queue, setQueue] = useState<SyncRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [wifiOnly, setWifiOnlyState] = useState<boolean>(false);
  const [activeConflict, setActiveConflict] = useState<SyncRecord | null>(null);

  // Sync state reference to prevent concurrent overlapping sync loops
  const syncInProgressRef = useRef(false);

  // Load initial queue from Dexie
  const refreshQueueFromDB = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDatabase();
      const records = await db.syncQueue.toArray();
      // Sort: dependency order first, then FIFO by createdAt
      records.sort((a, b) => {
        const orderA = ENTITY_DEPENDENCY_ORDER.indexOf(a.entity);
        const orderB = ENTITY_DEPENDENCY_ORDER.indexOf(b.entity);
        if (orderA !== orderB) return orderA - orderB;
        return a.createdAt - b.createdAt;
      });
      setQueue(records);
    } catch (err) {
      console.warn('Failed to read syncQueue from Dexie:', err);
    }
  }, []);

  // Initialize DB listener / polling
  useEffect(() => {
    refreshQueueFromDB();
    const interval = setInterval(refreshQueueFromDB, 2500);
    return () => clearInterval(interval);
  }, [refreshQueueFromDB]);

  // Load wifiOnly from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('banasetu_wifi_only');
      if (saved !== null) {
        setWifiOnlyState(saved === 'true');
      }
    } catch {
      // Ignore
    }
  }, []);

  const setWifiOnly = useCallback((val: boolean) => {
    setWifiOnlyState(val);
    try {
      localStorage.setItem('banasetu_wifi_only', String(val));
    } catch {
      // Ignore
    }
  }, []);

  // Compute dependency blockage
  const isRecordBlocked = useCallback(
    (record: SyncRecord) => {
      if (!record.dependsOn) {
        return { blocked: false };
      }
      const parent = queue.find((r) => r.local_id === record.dependsOn);
      if (!parent) {
        return { blocked: true, reason: 'Parent record missing' };
      }
      if (parent.state !== 'synced') {
        return {
          blocked: true,
          reason: `Blocked by earlier record (${parent.entity} · ${parent.batch_code})`,
        };
      }
      return { blocked: false };
    },
    [queue]
  );

  // Enqueue a durable action into Dexie
  const enqueueAction = useCallback(
    async (params: {
      entity: SyncEntityType;
      batch_code: string;
      action: 'create' | 'update' | 'verify' | 'quarantine';
      actor: { id: string; name: string; role: string };
      payload: any;
      dependsOn?: string;
      hasPhotos?: boolean;
      approxSizeBytes?: number;
    }): Promise<SyncRecord> => {
      const local_id = generateULID();
      const now = Date.now();

      const newRecord: SyncRecord = {
        local_id,
        batch_code: params.batch_code,
        entity: params.entity,
        action: params.action,
        actor: params.actor,
        payload: params.payload,
        state: 'queued',
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
        dependsOn: params.dependsOn,
        hasPhotos: params.hasPhotos ?? false,
        approxSizeBytes: params.approxSizeBytes ?? (params.hasPhotos ? 45000 : 3200),
      };

      try {
        const db = getDatabase();
        await db.syncQueue.put(newRecord);
        await refreshQueueFromDB();
      } catch (err) {
        console.error('Dexie enqueue error:', err);
      }

      return newRecord;
    },
    [refreshQueueFromDB]
  );

  // Sync an individual record with mock server API
  const syncSingleRecord = async (
    record: SyncRecord
  ): Promise<{ success: boolean; conflict?: boolean; serverPayload?: any; error?: string }> => {
    // If wifi-only is ON and record has heavy photos, defer on mobile data simulation
    if (wifiOnly && record.hasPhotos) {
      return {
        success: false,
        error: 'Deferred: Wi-Fi only mode active for photo uploads',
      };
    }

    // Exponential backoff check: Math.min(1000 * 2^retryCount, 60000)
    if (record.lastAttemptAt) {
      const backoffMs = Math.min(1000 * Math.pow(2, record.retryCount), 60000);
      const elapsed = Date.now() - record.lastAttemptAt;
      if (elapsed < backoffMs && record.state === 'failed') {
        return {
          success: false,
          error: `Backoff active: retrying in ${Math.ceil((backoffMs - elapsed) / 1000)}s`,
        };
      }
    }

    // Check dependency block
    const blockCheck = isRecordBlocked(record);
    if (blockCheck.blocked) {
      return {
        success: false,
        error: blockCheck.reason,
      };
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Simulated Conflict Check for Demo
    if (record.server_payload && record.state === 'conflict') {
      return { success: false, conflict: true, serverPayload: record.server_payload };
    }

    // Normal success simulation
    return { success: true };
  };

  // Bulk sync all queued records
  const syncAll = useCallback(async () => {
    if (syncInProgressRef.current) return { success: 0, failed: 0, conflicts: 0 };
    syncInProgressRef.current = true;
    setIsSyncing(true);

    let successCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    try {
      const db = getDatabase();
      const records = await db.syncQueue.toArray();

      // Sort in dependency order
      records.sort((a, b) => {
        const orderA = ENTITY_DEPENDENCY_ORDER.indexOf(a.entity);
        const orderB = ENTITY_DEPENDENCY_ORDER.indexOf(b.entity);
        if (orderA !== orderB) return orderA - orderB;
        return a.createdAt - b.createdAt;
      });

      for (const rec of records) {
        if (rec.state === 'synced') continue;

        // Mark as syncing in Dexie
        await db.syncQueue.update(rec.local_id, {
          state: 'syncing',
          lastAttemptAt: Date.now(),
        });
        await refreshQueueFromDB();

        const result = await syncSingleRecord(rec);

        if (result.success) {
          await db.syncQueue.update(rec.local_id, {
            state: 'synced',
            updatedAt: Date.now(),
            error: undefined,
          });
          successCount++;
        } else if (result.conflict) {
          await db.syncQueue.update(rec.local_id, {
            state: 'conflict',
            server_payload: result.serverPayload,
            updatedAt: Date.now(),
          });
          conflictCount++;
          // Immediately set active conflict for the user
          setActiveConflict({
            ...rec,
            state: 'conflict',
            server_payload: result.serverPayload,
          });
        } else {
          await db.syncQueue.update(rec.local_id, {
            state: 'failed',
            retryCount: rec.retryCount + 1,
            error: result.error || 'Network error during sync handshake',
            updatedAt: Date.now(),
          });
          failedCount++;
        }
      }

      setLastSyncedAt(new Date());
      await refreshQueueFromDB();
    } catch (err) {
      console.error('syncAll execution error:', err);
    } finally {
      setIsSyncing(false);
      syncInProgressRef.current = false;
    }

    return { success: successCount, failed: failedCount, conflicts: conflictCount };
  }, [refreshQueueFromDB, wifiOnly, isRecordBlocked]);

  // Individual item retry
  const retryItem = useCallback(
    async (local_id: string): Promise<boolean> => {
      try {
        const db = getDatabase();
        const rec = await db.syncQueue.get(local_id);
        if (!rec) return false;

        await db.syncQueue.update(local_id, {
          state: 'syncing',
          lastAttemptAt: Date.now(),
        });
        await refreshQueueFromDB();

        const result = await syncSingleRecord(rec);

        if (result.success) {
          await db.syncQueue.update(local_id, {
            state: 'synced',
            updatedAt: Date.now(),
            error: undefined,
          });
          await refreshQueueFromDB();
          return true;
        } else if (result.conflict) {
          await db.syncQueue.update(local_id, {
            state: 'conflict',
            server_payload: result.serverPayload,
            updatedAt: Date.now(),
          });
          setActiveConflict({ ...rec, state: 'conflict', server_payload: result.serverPayload });
          await refreshQueueFromDB();
          return false;
        } else {
          await db.syncQueue.update(local_id, {
            state: 'failed',
            retryCount: rec.retryCount + 1,
            error: result.error || 'Sync retry failed',
            updatedAt: Date.now(),
          });
          await refreshQueueFromDB();
          return false;
        }
      } catch {
        return false;
      }
    },
    [refreshQueueFromDB]
  );

  // Delete item from queue
  const deleteItem = useCallback(
    async (local_id: string) => {
      try {
        const db = getDatabase();
        await db.syncQueue.delete(local_id);
        await refreshQueueFromDB();
      } catch (err) {
        console.error('Failed to delete sync queue item:', err);
      }
    },
    [refreshQueueFromDB]
  );

  // Conflict Resolution: Keep Local
  const resolveConflictKeepLocal = useCallback(
    async (local_id: string) => {
      try {
        const db = getDatabase();
        const rec = await db.syncQueue.get(local_id);
        const batchCode = rec?.batch_code || '#BS-402';
        const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

        await db.syncQueue.update(local_id, {
          state: 'synced',
          server_payload: undefined,
          updatedAt: Date.now(),
          error: undefined,
        });

        await db.auditEvents.put({
          id: `AUD-RES-${Date.now()}`,
          timestamp: nowStr,
          actorId: 'SUP-01',
          actorName: 'A. K. Patnaik',
          actorRole: 'District Procurement Officer',
          actionType: 'STOCK_SEPARATION_UPDATED',
          title: `Conflict Resolved for ${batchCode} (Keep Local)`,
          description: `Supervisor verified and retained local field record for ${batchCode}.`,
          details: {
            localId: local_id,
            batchCode,
            resolution: 'KEEP_LOCAL',
          },
        });

        setActiveConflict(null);
        await refreshQueueFromDB();
      } catch (err) {
        console.error('Error resolving conflict (keep local):', err);
      }
    },
    [refreshQueueFromDB]
  );

  // Conflict Resolution: Keep Server
  const resolveConflictKeepServer = useCallback(
    async (local_id: string) => {
      try {
        const db = getDatabase();
        const rec = await db.syncQueue.get(local_id);
        const batchCode = rec?.batch_code || '#BS-402';
        const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

        if (rec && rec.server_payload) {
          await db.syncQueue.update(local_id, {
            payload: rec.server_payload,
            server_payload: undefined,
            state: 'synced',
            updatedAt: Date.now(),
            error: undefined,
          });

          await db.auditEvents.put({
            id: `AUD-RES-${Date.now()}`,
            timestamp: nowStr,
            actorId: 'SUP-01',
            actorName: 'A. K. Patnaik',
            actorRole: 'District Procurement Officer',
            actionType: 'STOCK_SEPARATION_UPDATED',
            title: `Conflict Resolved for ${batchCode} (Keep Server)`,
            description: `Supervisor reconciled by accepting central server authority record for ${batchCode}.`,
            details: {
              localId: local_id,
              batchCode,
              resolution: 'KEEP_SERVER',
            },
          });
        }
        setActiveConflict(null);
        await refreshQueueFromDB();
      } catch (err) {
        console.error('Error resolving conflict (keep server):', err);
      }
    },
    [refreshQueueFromDB]
  );

  // Conflict Resolution: Merge with Supervisor Note
  const resolveConflictMerge = useCallback(
    async (local_id: string, mergedPayload: any, supervisorNote: string) => {
      try {
        const db = getDatabase();
        const rec = await db.syncQueue.get(local_id);
        const batchCode = rec?.batch_code || '#BS-402';
        const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

        await db.syncQueue.update(local_id, {
          payload: {
            ...mergedPayload,
            supervisorNote,
            conflictResolvedAt: Date.now(),
          },
          server_payload: undefined,
          state: 'synced',
          updatedAt: Date.now(),
          error: undefined,
        });

        await db.auditEvents.put({
          id: `AUD-RES-${Date.now()}`,
          timestamp: nowStr,
          actorId: 'SUP-01',
          actorName: 'A. K. Patnaik',
          actorRole: 'District Procurement Officer',
          actionType: 'STOCK_SEPARATION_UPDATED',
          title: `Conflict Resolved for ${batchCode} (Merged)`,
          description: supervisorNote || `Reconciliation note recorded: joint review between field manager and supervisor.`,
          details: {
            localId: local_id,
            batchCode,
            resolution: 'MERGE',
            note: supervisorNote,
          },
        });

        setActiveConflict(null);
        await refreshQueueFromDB();
      } catch (err) {
        console.error('Error resolving conflict (merge):', err);
      }
    },
    [refreshQueueFromDB]
  );

  // Demo Control: Force a realistic conflict on #BS-402
  const forceMockConflict = useCallback(async () => {
    const local_id = generateULID();
    const now = Date.now();

    const conflictRecord: SyncRecord = {
      local_id,
      batch_code: '#BS-402',
      entity: 'collection',
      action: 'update',
      actor: {
        id: 'COL-MGR-02',
        name: 'R. Mohanty',
        role: 'Collection Manager',
      },
      payload: {
        batchCode: '#BS-402',
        product: 'Dried Mahua Flowers',
        grossWeight: 104.2,
        tareWeight: 4.2,
        netWeight: 100.0,
        qualityGrade: 'A',
        storageLocation: 'Rack B (Dry Stack)',
        paymentRef: 'TXN-998-SIMULATED',
        updatedAt: '14 Mar 2025 · 10:30 AM (Device Local)',
      },
      server_payload: {
        batchCode: '#BS-402',
        product: 'Dried Mahua Flowers',
        grossWeight: 96.0,
        tareWeight: 4.0,
        netWeight: 92.0,
        qualityGrade: 'B',
        storageLocation: 'Quarantine Bay C',
        paymentRef: 'TXN-998-SIMULATED',
        updatedAt: '14 Mar 2025 · 10:45 AM (Central Server Intake)',
        conflictReason: 'Warehouse weigh-in discrepancy: Server received 92.0 kg vs Field Scale 100.0 kg',
      },
      state: 'conflict',
      createdAt: now,
      updatedAt: now,
      retryCount: 1,
      approxSizeBytes: 4200,
    };

    try {
      const db = getDatabase();
      await db.syncQueue.put(conflictRecord);
      await refreshQueueFromDB();
      setActiveConflict(conflictRecord);
    } catch (err) {
      console.error('Failed to create mock conflict:', err);
    }

    return conflictRecord;
  }, [refreshQueueFromDB]);

  // Derived counts
  const queuedCount = queue.filter((r) => r.state === 'queued' || r.state === 'syncing').length;
  const conflictCount = queue.filter((r) => r.state === 'conflict').length;
  const queueSizeBytes = queue.reduce((acc, r) => acc + (r.approxSizeBytes || 3000), 0);
  const queueSizeKb = Math.max(1, Math.round(queueSizeBytes / 1024));

  const lastSyncedFormatted = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
    : 'Never';

  return {
    isOffline,
    isSyncing,
    lastSyncedAt,
    lastSyncedFormatted,
    wifiOnly,
    setWifiOnly,
    queue,
    queuedCount,
    conflictCount,
    queueSizeKb,
    activeConflict,
    setActiveConflict,
    enqueueAction,
    syncAll,
    retryItem,
    deleteItem,
    resolveConflictKeepLocal,
    resolveConflictKeepServer,
    resolveConflictMerge,
    forceMockConflict,
    isRecordBlocked,
  };
}
