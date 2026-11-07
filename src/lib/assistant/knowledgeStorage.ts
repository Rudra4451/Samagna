/**
 * src/lib/assistant/knowledgeStorage.ts
 * 
 * Maitriyam v0: Offline Knowledge Base Storage & Transactional Swapper.
 * 
 * Invariants:
 * 1. Transactional swap: writes new version into a staging buffer/records,
 *    flips the pointer in `maitriyamMeta`, then cleans old rows. Never clears first.
 * 2. Safe failure recovery: If write is aborted, old version stays active.
 * 3. Handles multi-tab upgrade & quota errors safely.
 */

import { getDatabase } from '@/lib/db';
import { KnowledgeEntry } from './matcher';
import rawEnFaq from './knowledge/faq.en.json';
import rawOrFaq from './knowledge/faq.or.json';

export const STATIC_FAQS: KnowledgeEntry[] = [
  ...(rawEnFaq as KnowledgeEntry[]),
  ...(rawOrFaq as KnowledgeEntry[]),
];

export const CURRENT_KB_VERSION = '1.0';

/**
 * Loads knowledge base for given locale.
 * Fallback to static in-memory seed if Dexie has not yet synced.
 */
export async function getKnowledgeBase(locale: string = 'en'): Promise<KnowledgeEntry[]> {
  if (typeof window === 'undefined') {
    return STATIC_FAQS.filter((f) => f.locale === locale);
  }

  try {
    const db = getDatabase();
    const rows = await db.maitriyamKb.where('locale').equals(locale).toArray();
    if (rows && rows.length > 0) {
      return rows.map((r) => JSON.parse(r.entryJson) as KnowledgeEntry);
    }
  } catch (err) {
    console.warn('[Maitriyam] Failed reading Dexie KB, falling back to static:', err);
  }

  return STATIC_FAQS.filter((f) => f.locale === locale);
}

/**
 * Transactional swap: writes new entries, flips version pointer, then purges obsolete rows.
 */
export async function syncKnowledgeBaseTransactional(
  newEntries: KnowledgeEntry[],
  newVersion: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const db = getDatabase();

  try {
    await db.transaction('rw', [db.maitriyamKb, db.maitriyamMeta], async () => {
      // 1. Stage new records using composite/temporary IDs or direct puts
      for (const entry of newEntries) {
        await db.maitriyamKb.put({
          id: `${entry.id}@${newVersion}`,
          intent: entry.intent,
          locale: entry.locale,
          entryJson: JSON.stringify(entry),
          version: newVersion,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Flip active version pointer atomically
      await db.maitriyamMeta.put({
        key: 'active_kb_version',
        value: newVersion,
        updatedAt: new Date().toISOString(),
      });

      // 3. Purge older versions
      const allRows = await db.maitriyamKb.toArray();
      const oldRowIds = allRows
        .filter((r) => r.version !== newVersion)
        .map((r) => r.id);

      if (oldRowIds.length > 0) {
        await db.maitriyamKb.bulkDelete(oldRowIds);
      }
    });

    return true;
  } catch (err) {
    console.error('[Maitriyam] Transactional KB swap failed (kept prior version):', err);
    return false;
  }
}

/**
 * Local diagnostics module (read-only, no network).
 * Inspects outbox and local sync state without server calls.
 */
export async function getLocalSyncDiagnostics(userId?: string) {
  if (typeof window === 'undefined') {
    return {
      unsentCount: 0,
      oldestUnsyncedMinutes: 0,
      lastErrorClass: 'NONE',
      sessionExpired: false,
      queuedQuestions: 0,
    };
  }

  try {
    const db = getDatabase();
    const pendingItems = await db.pendingSync.toArray();
    const queuedSync = await db.syncQueue.where('state').equals('queued').toArray();

    let queuedQuestions = 0;
    if (userId) {
      queuedQuestions = await db.maitriyamOutbox
        .where('userId')
        .equals(userId)
        .and((q) => q.state === 'QUEUED')
        .count();
    }

    const totalUnsent = pendingItems.length + queuedSync.length;

    let oldestMinutes = 0;
    if (queuedSync.length > 0) {
      const dates = queuedSync
        .map((s) => new Date(s.createdAt).getTime())
        .filter((d) => !isNaN(d));
      if (dates.length > 0) {
        const oldestMs = Math.min(...dates);
        oldestMinutes = Math.max(0, Math.floor((Date.now() - oldestMs) / (60 * 1000)));
      }
    }

    return {
      unsentCount: totalUnsent,
      oldestUnsyncedMinutes: oldestMinutes,
      lastErrorClass: totalUnsent > 0 ? 'NETWORK_OR_PENDING_AUTH' : 'NONE',
      sessionExpired: false,
      queuedQuestions,
    };
  } catch (err) {
    return {
      unsentCount: 0,
      oldestUnsyncedMinutes: 0,
      lastErrorClass: 'STORAGE_ERROR',
      sessionExpired: false,
      queuedQuestions: 0,
    };
  }
}
