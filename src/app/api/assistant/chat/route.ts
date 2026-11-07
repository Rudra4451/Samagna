import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { processAssistantMessage } from '@/lib/assistant/assistantEngine';

export const dynamic = 'force-dynamic';

const ChatInputSchema = z.object({
  message: z.string().min(1).max(500),
  locale: z.enum(['en', 'or']).default('en'),
  surface: z.string().default('collector'),
  conversationId: z.string().optional(),
  clientSchemaVersion: z.number().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Kill-switch check
  if (process.env.MAITRIYAM_ENABLED === 'false') {
    return NextResponse.json(
      { error: 'ASSISTANT_DISABLED', message: 'Maitriyam Assistant is currently disabled.' },
      { status: 503 }
    );
  }

  // 2. Authentication & Session Scoping (with graceful guest fallback)
  const session = await getSession(req);
  const effectiveRole = session?.role || 'PUBLIC';
  const effectiveUserId =
    session?.userId || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-guest';

  // 3. Idempotency Key validation (relaxed fallback to auto-generate if missing for seamless client tolerance)
  const idempotencyKey =
    req.headers.get('idempotency-key') ||
    req.headers.get('Idempotency-Key') ||
    `idem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 4. Rate Limiting (per user/session)
  const rate = checkRateLimit(effectiveUserId, 'maitriyam-chat', { windowMs: 60_000, maxRequests: 45 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS', message: 'Assistant rate limit reached. Please wait before retrying.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
    );
  }

  // 5. Parse and sanitize input
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Malformed JSON payload.' }, { status: 400 });
  }

  const parsed = ChatInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 422 });
  }

  const { message, locale, surface, conversationId } = parsed.data;

  // 6. Execute Unified Assistant Intelligence Engine
  const result = await processAssistantMessage({
    message,
    locale,
    surface,
    role: effectiveRole,
    userId: effectiveUserId,
    conversationId: conversationId || `conv-${effectiveUserId}-${Date.now()}`,
  });

  return NextResponse.json(result);
}
