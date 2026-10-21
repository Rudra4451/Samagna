import Dexie, { Table } from 'dexie';
import { BatchRecord, AuditEvent, DiscrepancyCase } from './types';
import {
  INITIAL_BATCH_BS400,
  INITIAL_BATCH_BS402,
  INITIAL_DISCREPANCY_CASE_BS395,
  INITIAL_DISCREPANCY_CASE,
  INITIAL_AUDIT_TRAIL,
  INITIAL_LEDGER_COUNTERS,
} from './seed';

export interface AppSetting {
  key: string;
  value: any;
}

export interface PendingSyncItem {
  id: string; // e.g. "BS-402"
  code: string; // "#BS-402"
  collector: string;
  product: string;
  quantityKg: number;
  amount: number;
  timestamp: string;
  data: any;
}

export type SyncState = 'draft' | 'queued' | 'syncing' | 'synced' | 'conflict' | 'failed';

export type SyncEntityType = 'pickup_request' | 'collection' | 'dispatch' | 'storage_receipt';

export interface SyncRecord {
  local_id: string; // Client-generated ULID
  server_id?: string;
  batch_code: string; // e.g. "#BS-402"
  entity: SyncEntityType;
  action: 'create' | 'update' | 'verify' | 'quarantine';
  actor: {
    id: string;
    name: string;
    role: string;
  };
  payload: any;
  server_payload?: any; // Populated when conflict occurs
  state: SyncState;
  createdAt: number; // Timestamp ms
  updatedAt: number; // Timestamp ms
  retryCount: number;
  lastAttemptAt?: number;
  error?: string;
  dependsOn?: string; // local_id of prerequisite record
  approxSizeBytes: number;
  hasPhotos?: boolean;
}

export class BanaSetuDatabase extends Dexie {
  batches!: Table<BatchRecord, string>;
  auditEvents!: Table<AuditEvent, string>;
  discrepancyCases!: Table<DiscrepancyCase, string>;
  appSettings!: Table<AppSetting, string>;
  pendingSync!: Table<PendingSyncItem, string>;
  syncQueue!: Table<SyncRecord, string>;

  constructor() {
    super('BanaSetuLedgerDB');
    this.version(3).stores({
      batches: 'id, status, pickupRequestId, updatedAt',
      auditEvents: 'id, timestamp, actorId, actionType',
      discrepancyCases: 'id, batchId, status',
      appSettings: 'key',
      pendingSync: 'id, code, timestamp',
      syncQueue: 'local_id, batch_code, entity, state, createdAt, dependsOn',
    });
  }
}

// Client-only singleton accessor
let dbInstance: BanaSetuDatabase | null = null;

export function getDatabase(): BanaSetuDatabase {
  if (typeof window === 'undefined') {
    throw new Error('Database can only be accessed on client side');
  }
  if (!dbInstance) {
    dbInstance = new BanaSetuDatabase();
  }
  return dbInstance;
}

export const db = {
  get batches() { return getDatabase().batches; },
  get auditEvents() { return getDatabase().auditEvents; },
  get discrepancyCases() { return getDatabase().discrepancyCases; },
  get appSettings() { return getDatabase().appSettings; },
  get pendingSync() { return getDatabase().pendingSync; },
  get syncQueue() { return getDatabase().syncQueue; },
};

export async function seedInitialData(forceReset: boolean = false): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = getDatabase();

  const count = await db.batches.count();
  if (count === 0 || forceReset) {
    await db.transaction('rw', [db.batches, db.auditEvents, db.discrepancyCases, db.appSettings, db.pendingSync, db.syncQueue], async () => {
      await db.batches.clear();
      await db.auditEvents.clear();
      await db.discrepancyCases.clear();
      await db.appSettings.clear();
      await db.pendingSync.clear();
      await db.syncQueue.clear();

      // Rule 1: Seed Batch #BS-400 (verified stock, 60kg, ₹42/kg) & #BS-402 (pending_verification, 100kg, arrival not yet entered)
      await db.batches.put(INITIAL_BATCH_BS400);
      await db.batches.put(INITIAL_BATCH_BS402);

      await db.auditEvents.bulkPut(INITIAL_AUDIT_TRAIL);

      // Rule 1: Historical discrepancy case #BS-395 ("resolved by supervisor")
      await db.discrepancyCases.put(INITIAL_DISCREPANCY_CASE_BS395);

      // Rule 1: One queued offline record (a pickup request from Budhu)
      await db.pendingSync.put({
        id: 'REQ-BUDHU-001',
        code: '#BS-403',
        collector: 'Budhu Marndi',
        product: 'Dried Mahua Flowers',
        quantityKg: 35.0,
        amount: 1470.0,
        timestamp: 'Today · 09:40 AM',
        data: { tare: 1.5, gross: 36.5, grade: 'A' },
      });

      await db.syncQueue.put({
        local_id: 'sync-budhu-001',
        batch_code: '#BS-403',
        entity: 'pickup_request',
        action: 'create',
        actor: {
          id: 'COL-002',
          name: 'Budhu Marndi',
          role: 'Tribal Collector',
        },
        payload: {
          collector: 'Budhu Marndi',
          tribalId: 'OR-MAY-KRN-1109',
          village: 'Badagaon, Karanjia',
          product: 'Dried Mahua Flowers',
          quantityKg: 35.0,
          ratePerKg: 42.0,
          amount: 1470.0,
        },
        state: 'queued',
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 3600000,
        retryCount: 0,
        approxSizeBytes: 520,
      });

      await db.appSettings.put({ key: 'isOffline', value: false });
      await db.appSettings.put({ key: 'activeRole', value: 'COLLECTOR_SHG' });
      await db.appSettings.put({
        key: 'counters',
        value: {
          expectedSeasonalForecastKg: 500,
          inTransitPendingVerificationKg: 100, // #BS-402
          verifiedSaleableStockKg: 60, // #BS-400
          quarantinedDiscrepancyKg: 0,
        },
      });
      await db.appSettings.put({ key: 'queuedSyncCount', value: 1 });
    });
  }
}
