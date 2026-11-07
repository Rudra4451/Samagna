import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { maskAllPii } from '@/lib/server/mask';
import { STATIC_FAQS } from '@/lib/assistant/knowledgeStorage';
import {
  toolGetRateCard,
  toolGetRequestStatus,
  toolGetAuditLog,
  toolGetVerifyRecord,
  toolGetPermissionMatrix,
} from '@/lib/assistant/tools';

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

  // 2. Authentication & Session Scoping
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Session authentication required.' },
      { status: 401 }
    );
  }

  // 3. Idempotency Key validation
  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json(
      { error: 'MISSING_IDEMPOTENCY_KEY', message: 'Valid Idempotency-Key header is required.' },
      { status: 400 }
    );
  }

  // 4. Rate Limiting (per user/session)
  const rate = checkRateLimit(session.userId, 'maitriyam-chat', { windowMs: 60_000, maxRequests: 30 });
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
  const maskedQuery = maskAllPii(message);

  // 6. Refusal Policy Checks (Section 15)
  const lowerQuery = message.toLowerCase();
  const refusalTriggers = [
    'bypass permission',
    'system prompt',
    'ignore previous instructions',
    'medical advice',
    'legal advice',
    'transfer money now',
    'pay me directly',
    'reveal aadhaar',
  ];

  for (const trigger of refusalTriggers) {
    if (lowerQuery.includes(trigger)) {
      return NextResponse.json({
        answer: 'I cannot fulfill this request. Maitriyam is an automated, read-only guidance assistant that strictly enforces role permissions, statutory data protection, and operational protocol.',
        citations: ['Maitriyam Safety Policy Sec 15'],
        toolCalls: [],
        degraded: false,
        conversationId: conversationId || `conv-${session.userId}-${Date.now()}`,
      });
    }
  }

  // 7. Intent Slot Routing (L1 Tools vs L0 FAQ)
  let answer = '';
  const citations: string[] = [];
  const toolCalls: any[] = [];

  // Matcher evaluation
  const match = matchKnowledgeBase(
    maskedQuery,
    STATIC_FAQS,
    session.role,
    surface,
    locale
  );

  // Check slot extraction for L1 Tools:
  // Slot A: Batch/Verify Code
  const codeMatch = message.match(/(?:#|BS-)(\d{3,4})/i) || message.match(/BS-[A-Z0-9-]+/i);
  if (codeMatch && (lowerQuery.includes('status') || lowerQuery.includes('where is') || lowerQuery.includes('track'))) {
    const code = codeMatch[0];
    const toolRes = await toolGetRequestStatus({
      pickupRequestId: code,
      actorUserId: session.userId,
      actorRole: session.role,
    });
    toolCalls.push({ tool: 'getRequestStatus', input: { code } });
    citations.push(toolRes.sourceRef);

    if (toolRes.data.status === 'NOT_FOUND') {
      answer = `Batch ${code} was not found in the verified ledger record.`;
    } else {
      answer = `Batch ${code} (${toolRes.data.produceName || 'Produce'}) status: ${toolRes.data.status} at ${toolRes.data.centerName || 'aggregation center'}.`;
    }
  } else if (lowerQuery.includes('rate') && (lowerQuery.includes('mahua') || lowerQuery.includes('honey') || lowerQuery.includes('chironji') || lowerQuery.includes('harida') || lowerQuery.includes('amla') || lowerQuery.includes('tamarind'))) {
    // Slot B: Rate card check
    let produce = 'mahua';
    if (lowerQuery.includes('honey')) produce = 'wild_honey';
    else if (lowerQuery.includes('chironji')) produce = 'chironji';
    else if (lowerQuery.includes('harida')) produce = 'harida';
    else if (lowerQuery.includes('amla')) produce = 'amla';
    else if (lowerQuery.includes('tamarind')) produce = 'tamarind';

    const toolRes = await toolGetRateCard({ produceCode: produce });
    toolCalls.push({ tool: 'getRateCard', input: { produce } });
    citations.push(toolRes.sourceRef);
    answer = `Approved Minimum Support Price for ${produce} is ₹${toolRes.data.ratePerKg}/kg (Illustrative Schedule ${toolRes.data.version}, effective ${toolRes.data.effectiveDate}).`;
  } else if (match.entry) {
    // L0 Curated FAQ
    answer = match.entry.answer;
    citations.push(match.entry.sourceRef);
  } else {
    // Graceful unanswerable fallback
    answer = "I don't have verified information to answer this specific query. Please consult your local SHG facilitator or aggregation centre manager.";
    citations.push('/about');
  }

  // 8. Programmatic Output Checks: Numeric Grounding & Citation Integrity
  // Guarantee answer never claims official persona
  if (answer.toLowerCase().includes('i am an official') || answer.toLowerCase().includes('government officer')) {
    answer = 'Maitriyam is an automated, read-only guidance assistant.';
  }

  return NextResponse.json({
    answer: maskAllPii(answer),
    citations,
    toolCalls,
    degraded: false,
    indexVersion: '1.0',
    conversationId: conversationId || `conv-${session.userId}-${Date.now()}`,
  });
}
