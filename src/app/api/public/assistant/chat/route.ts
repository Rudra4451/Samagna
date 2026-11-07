import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { maskAllPii } from '@/lib/server/mask';
import { STATIC_FAQS } from '@/lib/assistant/knowledgeStorage';
import { toolGetVerifyRecord } from '@/lib/assistant/tools';

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

  // 2. IP Rate Limiting (Strict 20 requests per minute on public endpoint)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-guest';
  const rate = checkRateLimit(ip, 'maitriyam-public-chat', { windowMs: 60_000, maxRequests: 20 });
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
  const maskedQuery = maskAllPii(message);

  let answer = '';
  const citations: string[] = [];
  const toolCalls: any[] = [];

  // Public slot extraction: Verify Code
  const codeMatch = message.match(/(?:#|BS-)(\d{3,4})/i) || message.match(/BS-[A-Z0-9-]+/i);
  if (codeMatch) {
    const code = codeMatch[0];
    const verifyRes = await toolGetVerifyRecord({ code });
    toolCalls.push({ tool: 'getVerifyRecord', input: { code } });
    citations.push(verifyRes.sourceRef);

    if (verifyRes.data.found) {
      answer = `Verified batch ${code} contains ${verifyRes.data.produceName} collected in ${verifyRes.data.district} District (${verifyRes.data.centerName}). Status: ${verifyRes.data.status}. Primary gatherer personal data is protected under statutory privacy guidelines.`;
    } else {
      answer = `Batch ${code} was not found in the verified public registry. Check the code printed on the physical sack tag.`;
    }
  } else {
    // Curated FAQ match
    const match = matchKnowledgeBase(maskedQuery, STATIC_FAQS, 'PUBLIC', surface, locale);
    if (match.entry) {
      answer = match.entry.answer;
      citations.push(match.entry.sourceRef);
    } else {
      answer = "I am an automated guidance assistant for Samagna. I can explain batch QR verification, system mission, and non-affiliation status. For other inquiries, please refer to our /about page.";
      citations.push('/about');
    }
  }

  // Static pilot-status disclaimer guaranteed in public answers
  return NextResponse.json({
    answer: maskAllPii(answer),
    citations,
    toolCalls,
    degraded: false,
    pilotNotice: 'Samagna is an independent demonstration platform; all payments and royalty metrics are simulated.',
    indexVersion: '1.0',
    conversationId: `public-${Date.now()}`,
  });
}
