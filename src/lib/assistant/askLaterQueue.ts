/**
 * src/lib/assistant/askLaterQueue.ts
 * 
 * Maitriyam v0: Field Ask-Later Queue (Section 6.5).
 * 
 * Invariants:
 * 1. Dedicated Dexie store `maitriyamOutbox` in v5/v6.
 * 2. Capped at 20 items per device.
 * 3. User prompts are masked before persisting locally.
 * 4. Keyed strictly by userId; purges when a different user logs in.
 * 5. Replays to /api/assistant/chat with unique Idempotency-Key.
 */

import { getDatabase } from '@/lib/db';
import { maskAllPii } from '@/lib/server/mask';

export interface QueuedQuestion {
  id: string;
  userId: string;
  role: string;
  surface: string;
  question: string;
  locale: string;
  idempotencyKey: string;
  state: 'QUEUED' | 'REPLAYED';
  createdAt: string;
  responseAnswer?: string;
  replayedAt?: string;
}

const MAX_QUEUE_SIZE = 20;

/**
 * Enqueues an unanswerable question locally when offline.
 */
export async function enqueueQuestion(params: {
  userId: string;
  role: string;
  surface: string;
  rawQuestion: string;
  locale: string;
}): Promise<QueuedQuestion | null> {
  if (typeof window === 'undefined') return null;

  try {
    const db = getDatabase();
    const count = await db.maitriyamOutbox.where('userId').equals(params.userId).count();

    if (count >= MAX_QUEUE_SIZE) {
      console.warn('[Maitriyam] Ask-later queue limit reached (20 items max).');
      return null;
    }

    const masked = maskAllPii(params.rawQuestion);
    const item: QueuedQuestion = {
      id: `ask-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: params.userId,
      role: params.role,
      surface: params.surface,
      question: masked,
      locale: params.locale,
      idempotencyKey: `idem-ask-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      state: 'QUEUED',
      createdAt: new Date().toISOString(),
    };

    await db.maitriyamOutbox.put(item);
    return item;
  } catch (err) {
    console.error('[Maitriyam] Failed enqueueing ask-later question:', err);
    return null;
  }
}

/**
 * Purges queue if a different user logs into this device.
 */
export async function purgeOnUserSwitch(currentUserId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = getDatabase();
    const all = await db.maitriyamOutbox.toArray();
    const foreignIds = all
      .filter((item) => item.userId !== currentUserId)
      .map((item) => item.id);

    if (foreignIds.length > 0) {
      await db.maitriyamOutbox.bulkDelete(foreignIds);
      console.log(`[Maitriyam] Purged ${foreignIds.length} queued questions from prior user.`);
    }
  } catch (err) {
    console.error('[Maitriyam] Failed purging foreign user queue:', err);
  }
}

/**
 * Replays all queued items to assistant server when connectivity is restored.
 */
export async function replayPendingQuestions(userId: string): Promise<number> {
  if (typeof window === 'undefined' || !navigator.onLine) return 0;

  const db = getDatabase();
  const pending = await db.maitriyamOutbox
    .where('userId')
    .equals(userId)
    .and((item) => item.state === 'QUEUED')
    .toArray();

  let replayedCount = 0;

  for (const item of pending) {
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': item.idempotencyKey,
        },
        body: JSON.stringify({
          message: item.question,
          locale: item.locale,
          surface: item.surface,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await db.maitriyamOutbox.update(item.id, {
          state: 'REPLAYED',
          responseAnswer: data.answer,
          replayedAt: new Date().toISOString(),
        });
        replayedCount++;
      }
    } catch {
      // Replay will retry on next online event
      break;
    }
  }

  return replayedCount;
}
