import Dexie, { Table } from 'dexie';
import { BatchRecord, AuditEvent, DiscrepancyCase } from './types';
import {
  INITIAL_BATCH_BS402,
  INITIAL_AUDIT_TRAIL,
  INITIAL_DISCREPANCY_CASE,
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

export class BanaSetuDatabase extends Dexie {
  batches!: Table<BatchRecord, string>;
  auditEvents!: Table<AuditEvent, string>;
  discrepancyCases!: Table<DiscrepancyCase, string>;
  appSettings!: Table<AppSetting, string>;
  pendingSync!: Table<PendingSyncItem, string>;

  constructor() {
    super('BanaSetuLedgerDB');
    this.version(2).stores({
      batches: 'id, status, pickupRequestId, updatedAt',
      auditEvents: 'id, timestamp, actorId, actionType',
      discrepancyCases: 'id, batchId, status',
      appSettings: 'key',
      pendingSync: 'id, code, timestamp',
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

export async function seedInitialData(forceReset: boolean = false): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = getDatabase();

  const count = await db.batches.count();
  if (count === 0 || forceReset) {
    await db.transaction('rw', [db.batches, db.auditEvents, db.discrepancyCases, db.appSettings, db.pendingSync], async () => {
      await db.batches.clear();
      await db.auditEvents.clear();
      await db.discrepancyCases.clear();
      await db.appSettings.clear();
      await db.pendingSync.clear();

      await db.batches.put(INITIAL_BATCH_BS402);
      await db.auditEvents.bulkPut(INITIAL_AUDIT_TRAIL);
      await db.discrepancyCases.put(INITIAL_DISCREPANCY_CASE);

      // Seed 2 initial pending sync items
      await db.pendingSync.bulkPut([
        {
          id: 'BS-400',
          code: '#BS-400',
          collector: 'Gura Marndi',
          product: 'Dried Mahua Flowers',
          quantityKg: 35.0,
          amount: 1470.0,
          timestamp: '14 Mar 2025 · 09:40 AM',
          data: { tare: 1.5, gross: 36.5, grade: 'A' },
        },
        {
          id: 'BS-399',
          code: '#BS-399',
          collector: 'Sombari Murmu',
          product: 'Dried Mahua Flowers',
          quantityKg: 25.0,
          amount: 1050.0,
          timestamp: '14 Mar 2025 · 10:15 AM',
          data: { tare: 1.2, gross: 26.2, grade: 'A' },
        },
      ]);

      await db.appSettings.put({ key: 'isOffline', value: false });
      await db.appSettings.put({ key: 'activeRole', value: 'COLLECTOR_SHG' });
      await db.appSettings.put({ key: 'counters', value: INITIAL_LEDGER_COUNTERS });
      await db.appSettings.put({ key: 'queuedSyncCount', value: 2 });
    });
  }
}
