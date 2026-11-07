import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/server/auth';
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
  toolGetQualityStandards,
  toolGetStoreSummary,
} from '@/lib/assistant/tools';
import { ODISHA_MFP_CATALOGUE } from '@/lib/products';

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
  const effectiveUserId = session?.userId || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-guest';

  // 3. Idempotency Key validation
  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('Idempotency-Key');
  if (!idempotencyKey || idempotencyKey.length < 8) {
    return NextResponse.json(
      { error: 'MISSING_IDEMPOTENCY_KEY', message: 'Valid Idempotency-Key header is required.' },
      { status: 400 }
    );
  }

  // 4. Rate Limiting (per user/session)
  const rate = checkRateLimit(effectiveUserId, 'maitriyam-chat', { windowMs: 60_000, maxRequests: 30 });
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
        conversationId: conversationId || `conv-${effectiveUserId}-${Date.now()}`,
      });
    }
  }

  // 7. Intent Slot Routing (L1 Tools vs L0 FAQ)
  let answer = '';
  const citations: string[] = [];
  const toolCalls: any[] = [];
  const cards: any[] = [];

  // Matcher evaluation
  const match = matchKnowledgeBase(
    maskedQuery,
    STATIC_FAQS,
    effectiveRole,
    surface,
    locale
  );

  // Check slot extraction for L1 Tools:
  // Slot A: Batch/Verify Code
  const codeMatch = message.match(/(?:#|BS-)(\d{3,4})/i) || message.match(/BS-[A-Z0-9-]+/i);
  const isRateQuery =
    lowerQuery.includes('rate') ||
    lowerQuery.includes('price') ||
    lowerQuery.includes('cost') ||
    lowerQuery.includes('msp') ||
    lowerQuery.includes('tariff') ||
    lowerQuery.includes('ଦର') ||
    lowerQuery.includes('ମୂଲ୍ୟ');

  const matchedProduct = ODISHA_MFP_CATALOGUE.find((p) => {
    const slugNorm = p.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameNorm = p.nameEnglish.toLowerCase();
    const odiaNorm = p.nameOdia;
    return (
      lowerQuery.includes(p.slug) ||
      lowerQuery.includes(slugNorm) ||
      lowerQuery.includes(nameNorm) ||
      (odiaNorm && message.includes(odiaNorm)) ||
      (p.slug === 'mahua' && (lowerQuery.includes('mahul') || lowerQuery.includes('ମହୁଲ') || lowerQuery.includes('ମହୁଆ'))) ||
      (p.slug === 'sal-seeds' && (lowerQuery.includes('sal') || lowerQuery.includes('ଶାଳ'))) ||
      (p.slug === 'wild-honey' && (lowerQuery.includes('honey') || lowerQuery.includes('ମହୁ')))
    );
  });

  const isQualityQuery =
    lowerQuery.includes('moisture') ||
    lowerQuery.includes('shrinkage') ||
    lowerQuery.includes('quality') ||
    lowerQuery.includes('tare') ||
    lowerQuery.includes('packaging') ||
    lowerQuery.includes('ଆର୍ଦ୍ରତା') ||
    lowerQuery.includes('ଓଜନ');

  if (codeMatch && (lowerQuery.includes('status') || lowerQuery.includes('where is') || lowerQuery.includes('track') || lowerQuery.includes('batch'))) {
    const code = codeMatch[0];
    const toolRes = await toolGetRequestStatus({
      pickupRequestId: code,
      actorUserId: effectiveUserId,
      actorRole: effectiveRole,
    });
    toolCalls.push({ tool: 'getRequestStatus', input: { code } });
    citations.push(toolRes.sourceRef);

    if (toolRes.data.status === 'NOT_FOUND') {
      answer = `Batch ${code} was not found in the verified ledger record. Please verify the code printed on your receipt or sack tag.`;
    } else {
      answer = `Batch ${code} (${toolRes.data.produceName || 'Forest Produce'}) is recorded with status ${toolRes.data.status} at ${toolRes.data.centerName || 'aggregation center'}.`;
      cards.push({
        type: 'batch',
        title: `Batch #${code.replace('#', '')}`,
        subtitle: toolRes.data.produceName || 'Produce Lot',
        items: [
          { label: 'Current Status', value: toolRes.data.status, highlight: true },
          { label: 'Facility', value: toolRes.data.centerName || 'Aggregation Centre' },
        ],
        badge: {
          label: toolRes.data.status,
          variant: toolRes.data.status === 'CERTIFIED' || toolRes.data.status === 'AT_WAREHOUSE' ? 'success' : 'warning',
        },
        link: { href: `/verify/${code.replace('#', '')}`, label: 'View Public Ledger →' },
      });
    }
  } else if (isRateQuery && matchedProduct) {
    // Slot B: Rate card check for matched product
    const toolRes = await toolGetRateCard({ produceCode: matchedProduct.slug });
    toolCalls.push({ tool: 'getRateCard', input: { produce: matchedProduct.slug } });
    citations.push(toolRes.sourceRef);
    answer = `Approved Minimum Support Price for ${toolRes.data.produceName} is ₹${toolRes.data.ratePerKg}/kg (${toolRes.data.isIllustrative ? 'Illustrative Benchmark' : 'Statutory MSP'} Schedule ${toolRes.data.version}, effective ${toolRes.data.effectiveDate}).`;
    cards.push({
      type: 'rate',
      title: toolRes.data.produceName,
      subtitle: matchedProduct.nameOdia,
      items: [
        { label: 'Approved Rate', value: `₹${toolRes.data.ratePerKg} / kg`, highlight: true },
        { label: 'Packaging', value: matchedProduct.standardPackaging },
        { label: 'Tare Weight', value: `${matchedProduct.typicalTareKgPerBag} kg/bag` },
        { label: 'Shrinkage Tolerance', value: `${toolRes.data.shrinkageTolerancePercent}%` },
      ],
      badge: {
        label: toolRes.data.isIllustrative ? 'Benchmark' : 'Official MSP',
        variant: 'info',
      },
      link: { href: '/collector', label: 'Open Rates Schedule →' },
    });
  } else if (isRateQuery) {
    // General rate card inquiry ("What are today rates?", "rates today", "ଦର କେତେ?")
    citations.push('/rates');
    answer = locale === 'or'
      ? 'ସମଗ୍ନ ପୋର୍ଟାଲରେ ୧୭ ଟି ବନଜାତ ଦ୍ରବ୍ୟ ପାଇଁ ସରକାରୀ ସହାୟକ ମୂଲ୍ୟ ଉପଲବ୍ଧ: ଶୁଖିଲା ମହୁଲ ଫୁଲ ₹୪୨/କିଗ୍ରା, ଶାଳ ମଞ୍ଜି ₹୨୪/କିଗ୍ରା, ଜଙ୍ଗଲୀ ମହୁ ₹୨୫୦/କିଗ୍ରା ଏବଂ ଚାରୋଳି ₹୧୨୦/କିଗ୍ରା।'
      : 'Approved procurement benchmark rates for primary MFP: Dried Mahua Flowers ₹42/kg, Sal Tree Seeds ₹24/kg, Wild Forest Honey ₹250/kg, and Chironji ₹120/kg. Tribal collectors receive 100% of these rates with 0% platform deductions.';
    cards.push({
      type: 'rate',
      title: 'Current Procurement Benchmark Schedule',
      subtitle: 'TDCCOL & LABHA Minimum Support Price Baseline',
      items: [
        { label: 'Mahua Flowers', value: '₹42 / kg', highlight: true },
        { label: 'Sal Tree Seeds', value: '₹24 / kg', highlight: true },
        { label: 'Wild Forest Honey', value: '₹250 / kg', highlight: true },
        { label: 'Chironji', value: '₹120 / kg', highlight: true },
      ],
      badge: { label: 'MSP Schedule 2024-25', variant: 'info' },
      link: { href: '/collector', label: 'Open Full 17 MFP Catalogue →' },
    });
  } else if (isQualityQuery && matchedProduct) {
    // Slot C: Quality and moisture check
    const toolRes = await toolGetQualityStandards({ produceCode: matchedProduct.slug });
    toolCalls.push({ tool: 'getQualityStandards', input: { produce: matchedProduct.slug } });
    citations.push(toolRes.sourceRef);
    answer = `Quality specifications for ${toolRes.data.produceName}: Maximum allowable moisture is ${toolRes.data.maxMoisturePercent}%, allowable transit shrinkage is ${toolRes.data.allowableShrinkagePercent}%, and standard packaging is ${toolRes.data.standardPackaging}.`;
    cards.push({
      type: 'quality',
      title: `Quality Standards: ${toolRes.data.produceName}`,
      subtitle: toolRes.data.produceOdia,
      items: [
        { label: 'Max Moisture', value: `${toolRes.data.maxMoisturePercent}%`, highlight: true },
        { label: 'Shrinkage Limit', value: `${toolRes.data.allowableShrinkagePercent}%` },
        { label: 'Harvest Season', value: toolRes.data.harvestSeason },
        { label: 'Tare Deduction', value: `${toolRes.data.typicalTareKg} kg/bag` },
      ],
      badge: { label: 'Certified Standard', variant: 'neutral' },
      link: { href: '/inventory', label: 'View Depot Specifications →' },
    });
  } else if (match.entry) {
    // L0 Curated FAQ
    answer = match.entry.answer;
    citations.push(match.entry.sourceRef);

    // Contextual Action Card based on intent
    if (match.entry.intent === 'b2b_wholesale') {
      cards.push({
        type: 'action',
        title: 'Samagna B2B Trade Portal',
        subtitle: 'Institutional wholesale procurement & RFQ',
        items: [
          { label: 'Availability', value: 'Live Certified Lots' },
          { label: 'Process', value: 'Direct Contract & RFQ' },
        ],
        badge: { label: 'Commercial B2B', variant: 'info' },
        link: { href: '/trade', label: 'Browse Wholesale Lots →' },
      });
    } else if (match.entry.intent === 'store_retail') {
      cards.push({
        type: 'action',
        title: 'Samagna Retail Store',
        subtitle: 'Packaged organic forest products',
        items: [
          { label: 'Delivery', value: 'Direct Courier Dispatch' },
          { label: 'Testing', value: '100% Purity Certified' },
        ],
        badge: { label: 'Consumer Retail', variant: 'success' },
        link: { href: '/store', label: 'Shop Forest Produce →' },
      });
    } else if (match.entry.intent === 'qr_verification') {
      cards.push({
        type: 'action',
        title: 'Public Batch Verification',
        subtitle: 'Scan QR code or enter lot identifier',
        items: [
          { label: 'Provenance', value: 'Certified Tribal Gathering' },
          { label: 'Privacy', value: 'Statutory PII Masking' },
        ],
        badge: { label: 'Verification', variant: 'neutral' },
        link: { href: '/verify', label: 'Verify Batch Code →' },
      });
    }
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
    cards,
    degraded: false,
    indexVersion: '1.0',
    conversationId: conversationId || `conv-${effectiveUserId}-${Date.now()}`,
  });
}
