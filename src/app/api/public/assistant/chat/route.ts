import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { processAssistantMessage } from '@/lib/assistant/assistantEngine';

export const dynamic = 'force-dynamic';

const PublicChatSchema = z.object({
  message: z.string().min(1).max(500),
  locale: z.enum(['en', 'or']).default('en'),
  surface: z.string().default('public'),
});

export async function POST(req: NextRequest) {
  // 1. Kill switch
  if (process.env.MAITRIYAM_ENABLED === 'false') {
    return NextResponse.json(
      { error: 'ASSISTANT_DISABLED', message: 'Maitriyam Assistant is currently disabled.' },
      { status: 503 }
    );
  }

  // 2. IP Rate Limiting (Strict 45 requests per minute on public endpoint)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-guest';
  const rate = checkRateLimit(ip, 'maitriyam-public-chat', { windowMs: 60_000, maxRequests: 45 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS', message: 'Public assistant rate limit reached. Please wait before retrying.' },
      { status: 429, headers: { 'Retry-After': String(rate.resetInSeconds) } }
    );
  }

  // 3. Parse input
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON', message: 'Malformed JSON payload.' }, { status: 400 });
  }

  const parsed = PublicChatSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.issues }, { status: 422 });
  }

  const { message, locale, surface } = parsed.data;

  // 4. Process Unified Intelligence
  const result = await processAssistantMessage({
    message,
    locale,
    surface,
    role: 'PUBLIC',
    userId: ip,
    conversationId: `public-${Date.now()}`,
  });

  return NextResponse.json(result);
}
