import { NextResponse } from 'next/server';
import { checkDatabaseConnection, isDatabaseConfigured } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbHealth = await checkDatabaseConnection();

  return NextResponse.json({
    status: 'ONLINE',
    system: 'BanaSetu Ledger Core API',
    jurisdiction: 'Mayurbhanj District, Odisha (TDCCOL / LABHA Scheme Architecture)',
    phase: 'F1 - Server Schema & Persistence Foundation',
    database: {
      configured: isDatabaseConfigured(),
      connected: dbHealth.connected,
      message: dbHealth.message,
      latencyMs: dbHealth.latencyMs ?? null,
    },
    clientPersistence: {
      primaryOfflineStore: 'Dexie IndexedDB (BanaSetuLedgerDB v3)',
      syncMode: 'Offline-First Client Replica with ULID Idempotency',
    },
    timestamp: new Date().toISOString(),
  });
}
