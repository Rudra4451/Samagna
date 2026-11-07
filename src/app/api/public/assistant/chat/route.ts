import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { maskAllPii } from '@/lib/server/mask';
import { STATIC_FAQS } from '@/lib/assistant/knowledgeStorage';
import {
  toolGetVerifyRecord,
  toolGetRateCard,
  toolGetQualityStandards,
  toolGetStoreSummary,
} from '@/lib/assistant/tools';
import { ODISHA_MFP_CATALOGUE } from '@/lib/products';

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

  // 2. IP Rate Limiting (Strict 30 requests per minute on public endpoint)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'public-guest';
  const rate = checkRateLimit(ip, 'maitriyam-public-chat', { windowMs: 60_000, maxRequests: 30 });
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
  const lowerQuery = message.toLowerCase();

  let answer = '';
  const citations: string[] = [];
  const toolCalls: any[] = [];
  const cards: any[] = [];

  // Public slot extraction: Verify Code
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
      (p.slug === 'wild-honey' && (lowerQuery.includes('honey') || lowerQuery.includes('ମହୁ'))) ||
      (p.slug === 'chironji' && (lowerQuery.includes('char') || lowerQuery.includes('ଚାରୋଳି')))
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

  if (codeMatch) {
    const code = codeMatch[0];
    const verifyRes = await toolGetVerifyRecord({ code });
    toolCalls.push({ tool: 'getVerifyRecord', input: { code } });
    citations.push(verifyRes.sourceRef);

    if (verifyRes.data.found) {
      answer = `Verified batch ${code} contains ${verifyRes.data.produceName} collected in ${verifyRes.data.district} District (${verifyRes.data.centerName}). Status: ${verifyRes.data.status}. Primary gatherer personal data is protected under statutory privacy guidelines.`;
      cards.push({
        type: 'batch',
        title: `Verified Batch #${verifyRes.data.code}`,
        subtitle: `${verifyRes.data.produceName} ${verifyRes.data.produceOdia ? `(${verifyRes.data.produceOdia})` : ''}`,
        items: [
          { label: 'Status', value: verifyRes.data.status, highlight: true },
          { label: 'Provenance', value: `${verifyRes.data.district} (${verifyRes.data.block})` },
          { label: 'Centre', value: verifyRes.data.centerName },
        ],
        badge: { label: verifyRes.data.status, variant: 'success' },
        link: { href: `/verify/${verifyRes.data.code}`, label: 'Open Provenance Certificate →' },
      });
    } else {
      answer = `Batch ${code} was not found in the verified public registry. Check the code printed on the physical sack tag.`;
    }
  } else if (isRateQuery && matchedProduct) {
    // Specific produce rate query
    const toolRes = await toolGetRateCard({ produceCode: matchedProduct.slug });
    toolCalls.push({ tool: 'getRateCard', input: { produce: matchedProduct.slug } });
    citations.push(toolRes.sourceRef);
    answer = `Approved Minimum Support Price for ${toolRes.data.produceName} is ₹${toolRes.data.ratePerKg}/kg (${toolRes.data.isIllustrative ? 'Illustrative Benchmark' : 'Statutory MSP'} Schedule ${toolRes.data.version}). Gatherers receive 100% of this benchmark under LABHA scheme.`;
    cards.push({
      type: 'rate',
      title: toolRes.data.produceName,
      subtitle: matchedProduct.nameOdia,
      items: [
        { label: 'Approved Rate', value: `₹${toolRes.data.ratePerKg} / kg`, highlight: true },
        { label: 'Standard Bag', value: matchedProduct.standardPackaging },
        { label: 'Tare Weight', value: `${matchedProduct.typicalTareKgPerBag} kg/bag` },
        { label: 'Shrinkage Limit', value: `${toolRes.data.shrinkageTolerancePercent}%` },
      ],
      badge: {
        label: toolRes.data.isIllustrative ? 'Benchmark' : 'Statutory MSP',
        variant: 'info',
      },
      link: { href: '/collector', label: 'View Full Rate Schedule →' },
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
    const toolRes = await toolGetQualityStandards({ produceCode: matchedProduct.slug });
    toolCalls.push({ tool: 'getQualityStandards', input: { produce: matchedProduct.slug } });
    citations.push(toolRes.sourceRef);
    answer = `Certified standards for ${toolRes.data.produceName}: Maximum allowable moisture is ${toolRes.data.maxMoisturePercent}%, allowable transit shrinkage is ${toolRes.data.allowableShrinkagePercent}%, and standard packaging is ${toolRes.data.standardPackaging}.`;
    cards.push({
      type: 'quality',
      title: `Quality Standards: ${toolRes.data.produceName}`,
      subtitle: toolRes.data.produceOdia,
      items: [
        { label: 'Max Moisture', value: `${toolRes.data.maxMoisturePercent}%`, highlight: true },
        { label: 'Transit Shrinkage', value: `${toolRes.data.allowableShrinkagePercent}%` },
        { label: 'Packaging', value: toolRes.data.standardPackaging },
        { label: 'Tare Deduction', value: `${toolRes.data.typicalTareKg} kg/bag` },
      ],
      badge: { label: 'Certified Quality', variant: 'neutral' },
      link: { href: '/inventory', label: 'View Depot Guidelines →' },
    });
  } else {
    // Curated FAQ match
    const match = matchKnowledgeBase(maskedQuery, STATIC_FAQS, 'PUBLIC', surface, locale);
    if (match.entry) {
      answer = match.entry.answer;
      citations.push(match.entry.sourceRef);

      if (match.entry.intent === 'b2b_wholesale') {
        cards.push({
          type: 'action',
          title: 'Samagna B2B Trade Portal',
          subtitle: 'Institutional wholesale procurement & RFQ',
          items: [
            { label: 'Catalog', value: 'Live Certified Lots' },
            { label: 'Orders', value: 'Bulk Contract / RFQ' },
          ],
          badge: { label: 'B2B Wholesale', variant: 'info' },
          link: { href: '/trade', label: 'Browse Wholesale Lots →' },
        });
      } else if (match.entry.intent === 'store_retail') {
        cards.push({
          type: 'action',
          title: 'Samagna Retail Store',
          subtitle: 'Packaged organic forest products',
          items: [
            { label: 'Produce', value: 'Wild Honey & Organic MFP' },
            { label: 'Dispatch', value: 'Direct Consumer Delivery' },
          ],
          badge: { label: 'Retail Store', variant: 'success' },
          link: { href: '/store', label: 'Shop Forest Produce →' },
        });
      } else if (match.entry.intent === 'qr_verification') {
        cards.push({
          type: 'action',
          title: 'Public Batch Verification',
          subtitle: 'Scan QR code or enter lot identifier',
          items: [
            { label: 'Provenance', value: 'Certified Tribal Gathering' },
            { label: 'Data Policy', value: 'Statutory PII Masking' },
          ],
          badge: { label: 'Verification', variant: 'neutral' },
          link: { href: '/verify', label: 'Verify Batch Code →' },
        });
      }
    } else {
      answer = "I am an automated guidance assistant for Samagna. I can explain batch QR verification, system mission, current rates, and non-affiliation status. For other inquiries, please refer to our /about page.";
      citations.push('/about');
    }
  }

  // Static pilot-status disclaimer guaranteed in public answers
  return NextResponse.json({
    answer: maskAllPii(answer),
    citations,
    toolCalls,
    cards,
    degraded: false,
    pilotNotice: 'Samagna is an independent demonstration platform; all payments and royalty metrics are simulated.',
    indexVersion: '1.0',
    conversationId: `public-${Date.now()}`,
  });
}
