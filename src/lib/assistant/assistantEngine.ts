/**
 * src/lib/assistant/assistantEngine.ts
 * 
 * Central Intelligence & Guidance Engine for Maitriyam
 * Upholds:
 * 1. Statutory LABHA scheme 100% MSP DBT guarantee
 * 2. Instant recognition of all 17 Minor Forest Produce products
 * 3. 1-Click Demo Login guides and persona accounts
 * 4. Batch QR verification and public traceability
 * 5. Full bilingual English & Odia support
 * 6. Non-affiliation and read-only guidance boundaries
 */

import { matchKnowledgeBase } from '@/lib/assistant/matcher';
import { maskAllPii } from '@/lib/server/mask';
import { STATIC_FAQS } from '@/lib/assistant/knowledgeStorage';
import {
  toolGetRateCard,
  toolGetRequestStatus,
  toolGetQualityStandards,
} from '@/lib/assistant/tools';
import { ODISHA_MFP_CATALOGUE, MfpProduct } from '@/lib/products';

export interface AssistantCard {
  type: 'rate' | 'batch' | 'quality' | 'action' | 'info';
  title: string;
  subtitle?: string;
  items?: { label: string; value: string; highlight?: boolean }[];
  badge?: { label: string; variant?: 'success' | 'warning' | 'info' | 'neutral' };
  link?: { href: string; label: string };
}

export interface AssistantResponse {
  answer: string;
  citations: string[];
  toolCalls: any[];
  cards: AssistantCard[];
  degraded: boolean;
  pilotNotice?: string;
  conversationId: string;
}

/**
 * Fuzzy product resolver for all 17 Minor Forest Produce items
 */
export function findMatchingProduct(query: string): MfpProduct | undefined {
  const lq = query.toLowerCase();

  // 1. Specific product aliases (English, Odia, Latin) with safe word boundary
  if (lq.includes('tamarind') || lq.includes('tentuli') || lq.includes('ତେନ୍ତୁଳି')) {
    return lq.includes('deseed') || lq.includes('seedless') || lq.includes('ବିହୀନ')
      ? ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'tamarind-deseeded')
      : ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'tamarind-seeded');
  }
  if (lq.includes('mahua') || lq.includes('mahul') || lq.includes('madhuca') || lq.includes('ମହୁଲ') || lq.includes('ମହୁଆ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'mahua');
  }
  // Word boundary for 'sal' so it does not match 'wholesale'
  if (/\bsal\b/.test(lq) || lq.includes('sal-seed') || lq.includes('sal seed') || lq.includes('shorea') || lq.includes('ଶାଳ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'sal-seeds');
  }
  if (lq.includes('honey') || lq.includes('mahu') || lq.includes('cliff honey') || lq.includes('ମହୁ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'wild-honey');
  }
  if (lq.includes('kendu') || lq.includes('tendu') || lq.includes('diospyros') || lq.includes('କେନ୍ଦୁ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'kendu-leaves');
  }
  if (/\bchar\b/.test(lq) || lq.includes('chironji') || lq.includes('char seed') || lq.includes('buchanania') || lq.includes('ଚାର')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'char-seeds');
  }
  if (lq.includes('harida') || lq.includes('haritaki') || lq.includes('chebula') || lq.includes('ହରିଡ଼ା')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'harida');
  }
  if (lq.includes('bahada') || lq.includes('bibhitaki') || lq.includes('bellerica') || lq.includes('ବାହାଡ଼ା')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'bahada');
  }
  if (/\bamla\b/.test(lq) || lq.includes('anla') || lq.includes('emblica') || lq.includes('gooseberry') || lq.includes('ଅଁଳା')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'amla');
  }
  if (lq.includes('karanja') || lq.includes('pongamia') || lq.includes('କରଞ୍ଜ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'karanja-seeds');
  }
  if (lq.includes('kusum') || lq.includes('schleichera') || lq.includes('କୁସୁମ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'kusum-seeds');
  }
  if (/\bneem\b/.test(lq) || lq.includes('azadirachta') || lq.includes('ନିମ୍ବ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'neem-seeds');
  }
  if (lq.includes('broom') || lq.includes('jhadu') || lq.includes('thysanolaena') || lq.includes('ଝାଡ଼ୁ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'hill-broom');
  }
  if (/\blac\b/.test(lq) || lq.includes('sticklac') || lq.includes('kerria') || lq.includes('ଲାଖ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'lac');
  }
  if (lq.includes('shikakai') || lq.includes('senegalia') || lq.includes('ଶିକାକାଇ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'shikakai');
  }
  if (lq.includes('dhataki') || lq.includes('woodfordia') || lq.includes('dhata') || lq.includes('ଧାତକୀ')) {
    return ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'dhataki');
  }

  // 2. Substring & Slug fallback
  return ODISHA_MFP_CATALOGUE.find((p) => {
    const slugBase = p.slug.split('-')[0];
    return (
      lq.includes(p.slug) ||
      (slugBase.length >= 4 && lq.includes(slugBase)) ||
      p.nameEnglish
        .toLowerCase()
        .split(' ')
        .some((w) => w.length > 3 && lq.includes(w))
    );
  });
}

/**
 * Main Assistant Intent Evaluation Engine
 */
export async function processAssistantMessage(params: {
  message: string;
  locale?: 'en' | 'or';
  surface?: string;
  role?: string;
  userId?: string;
  conversationId?: string;
}): Promise<AssistantResponse> {
  const {
    message,
    locale = 'en',
    surface = 'public',
    role = 'PUBLIC',
    userId = 'guest',
    conversationId = `conv-${Date.now()}`,
  } = params;

  const maskedQuery = maskAllPii(message);
  const lowerQuery = message.toLowerCase().trim();

  // 1. Refusal Policy Checks (Section 15)
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
      return {
        answer:
          locale === 'or'
            ? 'ମୁଁ ଏହି ଅନୁରୋଧ ପୂରଣ କରିପାରିବି ନାହିଁ। ମୈତ୍ରିୟମ୍ ଏକ ସ୍ୱୟଂଚାଳିତ, ପଠନ-ମାତ୍ର ମାର୍ଗଦର୍ଶନ ସହାୟକ।'
            : 'I cannot fulfill this request. Maitriyam is an automated, read-only guidance assistant that strictly enforces role permissions, statutory data protection, and operational protocol.',
        citations: ['Maitriyam Safety Policy Sec 15'],
        toolCalls: [],
        cards: [],
        degraded: false,
        conversationId,
      };
    }
  }

  const citations: string[] = [];
  const toolCalls: any[] = [];
  const cards: AssistantCard[] = [];
  let answer = '';

  // --------------------------------------------------------------------------
  // INTENT 1: Specific Batch / Verify Code (#BS-402, BS-400, etc.)
  // --------------------------------------------------------------------------
  const codeMatch = message.match(/(?:#|BS-)(\d{3,4})/i) || message.match(/BS-[A-Z0-9-]+/i);
  if (codeMatch) {
    const code = codeMatch[0];
    const toolRes = await toolGetRequestStatus({
      pickupRequestId: code,
      actorUserId: userId,
      actorRole: role,
    });
    toolCalls.push({ tool: 'getRequestStatus', input: { code } });
    citations.push(toolRes.sourceRef);

    if (toolRes.data.status === 'NOT_FOUND') {
      answer =
        locale === 'or'
          ? `ବ୍ୟାଚ୍ ${code} ଲେଜରରେ ମିଳିଲା ନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ ରସିଦ କିମ୍ବା ବସ୍ତା ଟ୍ୟାଗ୍ ରେ ଥିବା କୋଡ୍ ଯାଞ୍ଚ କରନ୍ତୁ।`
          : `Batch ${code} was not found in the verified ledger record. Please verify the code printed on your receipt or sack tag.`;
    } else {
      answer =
        locale === 'or'
          ? `ବ୍ୟାଚ୍ ${code} (${toolRes.data.produceName || 'ବନଜାତ ଦ୍ରବ୍ୟ'}) କରଞ୍ଜିଆ ସଂଗ୍ରହ କେନ୍ଦ୍ରରୁ ବାରିପଦା ସେଣ୍ଟ୍ରାଲ ଡିପୋକୁ ଯାତ୍ରା ସଫଳତାର ସହ ରେକର୍ଡ ହୋଇଛି (ସ୍ଥିତି: ${toolRes.data.status})।`
          : `Batch ${code} (${toolRes.data.produceName || 'Forest Produce'}) is recorded with status ${toolRes.data.status} at ${toolRes.data.centerName || 'aggregation center'}.`;

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
          variant:
            toolRes.data.status === 'CERTIFIED' || toolRes.data.status === 'AT_WAREHOUSE'
              ? 'success'
              : 'warning',
        },
        link: { href: `/verify/${code.replace('#', '')}`, label: 'View Public Ledger →' },
      });
    }

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 2: Greetings & Chatbot Introduction
  // --------------------------------------------------------------------------
  const isGreeting =
    lowerQuery === 'hi' ||
    lowerQuery === 'hello' ||
    lowerQuery === 'hey' ||
    lowerQuery === 'namaste' ||
    lowerQuery === 'juhar' ||
    lowerQuery === 'help' ||
    lowerQuery === 'menu' ||
    lowerQuery.startsWith('who are you') ||
    lowerQuery.startsWith('what can you do') ||
    lowerQuery.includes('ଜୁହାର') ||
    lowerQuery.includes('ନମସ୍କାର');

  if (isGreeting) {
    citations.push('/about');
    answer =
      locale === 'or'
        ? 'ଜୁହାର! ମୁଁ ମୈତ୍ରିୟମ୍ (Maitriyam), ସମଗ୍ନ ପୋର୍ଟାଲର ଡିଜିଟାଲ୍ ସହାୟକ। ମୁଁ ଆପଣଙ୍କୁ ସରକାରୀ MSP ଦର, ୧-କ୍ଲିକ୍ ଡେମୋ ଲଗଇନ୍, ବ୍ୟାଚ୍ QR ଯାଞ୍ଚ ଏବଂ B2B ହୋଲସେଲ ବାବଦରେ ସାହାଯ୍ୟ କରିପାରିବି।'
        : 'Hello! I am Maitriyam, the automated guidance assistant for Samagna (BanaSetu). I can help you with: 1) Statutory MSP Rates for 17 Minor Forest Produce, 2) 1-Click Demo Logins & Test Accounts, 3) Batch QR Verification, and 4) B2B Wholesale Procurement. How can I assist you today?';

    cards.push({
      type: 'action',
      title: 'Quick Navigation Directory',
      subtitle: 'Select any service below to proceed immediately',
      items: [
        { label: 'MSP Benchmark Rates', value: '17 Verified Forest Produce' },
        { label: '1-Click Demo Login', value: 'Test Roles & Portals' },
        { label: 'Batch Traceability', value: 'Live Lot #BS-402' },
        { label: 'Wholesale B2B Trade', value: 'RFQs & Bulk Contracts' },
      ],
      badge: { label: 'Samagna Guide', variant: 'info' },
      link: { href: '/login', label: 'Explore 1-Click Demo Accounts →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 3: 1-Click Demo Logins, Accounts & Roles
  // --------------------------------------------------------------------------
  const isLoginQuery =
    lowerQuery.includes('login') ||
    lowerQuery.includes('sign in') ||
    lowerQuery.includes('demo') ||
    lowerQuery.includes('account') ||
    lowerQuery.includes('password') ||
    lowerQuery.includes('persona') ||
    lowerQuery.includes('evaluator') ||
    lowerQuery.includes('role') ||
    lowerQuery.includes('credential') ||
    lowerQuery.includes('ଲଗଇନ୍');

  if (isLoginQuery) {
    citations.push('/login');
    answer =
      locale === 'or'
        ? 'ସମଗ୍ନ ପୋର୍ଟାଲରେ ପରୀକ୍ଷଣ ପାଇଁ ୧-କ୍ଲିକ୍ ଡେମୋ ଲଗଇନ୍ ଉପଲବ୍ଧ। ସମସ୍ତ ଡେମୋ ଆକାଉଣ୍ଟର ପାସୱାର୍ଡ ହେଉଛି "Test@Pass123"। ଆପଣ ସଂଗ୍ରାହକ (Sunita Soren), ସଂଗ୍ରହ କେନ୍ଦ୍ର ମ୍ୟାନେଜର (Bikram Murmu), ଗୋଦାମ ମ୍ୟାନେଜର (Rajesh Mohanty) କିମ୍ବା ଆଡମିନ୍ ଭାବେ ସିଧାସଳଖ ପ୍ରବେଶ କରିପାରିବେ।'
        : 'You can test any role with 1-click on the Sign In page (/login). All demo evaluator personas use the common password "Test@Pass123":\n\n• Primary Collector: sunita.soren (Collector Desk)\n• Aggregation Manager: bikram.murmu (Weighment & Receipt)\n• Warehouse Manager: rajesh.mohanty (Depot & Shrinkage)\n• SHG Facilitator: dipti.besra (Similipal Range)\n• Supervisor Admin: admin.mayurbhanj (Governance Audit)\n• B2B Commercial Buyer: ayur.buyer (Wholesale RFQ)\n• Processing Partner: processor.similipal (Value-Add Desk)\n• Logistics Fleet: logistics.mayurbhanj (Waybill Custody)\n\nClick the card below to jump to the 1-Click Login Page.';

    cards.push({
      type: 'action',
      title: '1-Click Demo Sign In Portal',
      subtitle: 'Instant role switching for evaluators & auditors',
      items: [
        { label: 'Evaluation Password', value: 'Test@Pass123', highlight: true },
        { label: 'Available Roles', value: '10+ Purpose-Built Personas' },
        { label: 'Protection', value: '100% MSP Payout Invariant' },
      ],
      badge: { label: 'Instant Login', variant: 'success' },
      link: { href: '/login', label: 'Open 1-Click Demo Login Page →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 4: Batch Verification & Public Provenance
  // --------------------------------------------------------------------------
  const isVerifyQuery =
    lowerQuery.includes('verify') ||
    lowerQuery.includes('verification') ||
    lowerQuery.includes('qr') ||
    lowerQuery.includes('trace') ||
    lowerQuery.includes('passport') ||
    lowerQuery.includes('code') ||
    lowerQuery.includes('sack tag') ||
    lowerQuery.includes('ଯାଞ୍ଚ');

  if (isVerifyQuery) {
    citations.push('/verify');
    answer =
      locale === 'or'
        ? 'ଯେକୌଣସି ବନଜାତ ବ୍ୟାଚ୍ କୋଡ୍ (ଯଥା: BS-402) ଯାଞ୍ଚ କରି ଆପଣ ସଂଗ୍ରହ ସ୍ଥାନ, ଓଜନ, ଆର୍ଦ୍ରତା ପରୀକ୍ଷା ଏବଂ ସଂଗ୍ରାହକଙ୍କୁ ୧୦୦% MSP DBT ପଇଠର ପ୍ରମାଣପତ୍ର ଦେଖିପାରିବେ।'
        : 'Every certified produce lot has a public digital passport. Scan the QR code printed on the sack tag or enter any batch code (e.g. BS-402, BS-400, or BS-398) to inspect certified intake weight, moisture testing, custody transfers, and 100% MSP DBT payment proof.';

    cards.push({
      type: 'action',
      title: 'Batch Verification & Digital Passport',
      subtitle: 'Public ledger with privacy-protected collector data',
      items: [
        { label: 'Sample Lot', value: 'Batch #BS-402 (Mahua Flowers)' },
        { label: 'Inspection', value: 'Moisture, Reweigh & Custody' },
        { label: 'Statutory DBT', value: '₹2,100.00 Credited to Collector' },
      ],
      badge: { label: 'Public Provenance', variant: 'info' },
      link: { href: '/verify/BS-402', label: 'Inspect Sample Batch #BS-402 →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 5: Minor Forest Produce Product Specifics (Recognizes all 17 MFP)
  // --------------------------------------------------------------------------
  const matchedProduct = findMatchingProduct(message);

  if (matchedProduct) {
    const toolRes = await toolGetRateCard({ produceCode: matchedProduct.slug });
    toolCalls.push({ tool: 'getRateCard', input: { produce: matchedProduct.slug } });
    citations.push(toolRes.sourceRef);

    answer =
      locale === 'or'
        ? `${matchedProduct.nameOdia} (${matchedProduct.nameEnglish}) ର ସରକାରୀ ସହାୟକ ମୂଲ୍ୟ (MSP) ହେଉଛି ₹${toolRes.data.ratePerKg}/କିଲୋଗ୍ରାମ। ମାନକ ପ୍ୟାକେଜିଂ: ${matchedProduct.standardPackaging}, ବସ୍ତା ଓଜନ (Tare): ${matchedProduct.typicalTareKgPerBag} କିଗ୍ରା। ଆଦିବାସୀ ସଂଗ୍ରାହକମାନେ ୧୦୦% ପ୍ରାପ୍ୟ ସିଧାସଳଖ ପାଆନ୍ତି।`
        : `Statutory Minimum Support Price for ${matchedProduct.nameEnglish} (${matchedProduct.nameOdia}) is ₹${toolRes.data.ratePerKg}/kg under the Odisha LABHA scheme.\n• Scientific Name: ${matchedProduct.scientificName}\n• Harvest Season: ${matchedProduct.primaryHarvestSeason}\n• Standard Packaging: ${matchedProduct.standardPackaging}\n• Bag Tare Deduction: ${matchedProduct.typicalTareKgPerBag} kg/bag\n• Maximum Moisture Threshold: ${matchedProduct.baselineMoistureMaxPercent}%\n\nPrimary collectors receive 100% of this benchmark with zero platform commission.`;

    cards.push({
      type: 'rate',
      title: matchedProduct.nameEnglish,
      subtitle: `${matchedProduct.nameOdia} · ${matchedProduct.scientificName}`,
      items: [
        { label: 'Approved MSP Rate', value: `₹${toolRes.data.ratePerKg} / kg`, highlight: true },
        { label: 'Harvest Season', value: matchedProduct.primaryHarvestSeason },
        { label: 'Packaging & Tare', value: `${matchedProduct.standardPackaging} (${matchedProduct.typicalTareKgPerBag}kg tare)` },
        { label: 'Max Moisture', value: `${matchedProduct.baselineMoistureMaxPercent}% allowable` },
      ],
      badge: {
        label: toolRes.data.isIllustrative ? 'Benchmark Rate' : 'Official MSP',
        variant: 'info',
      },
      link: { href: '/collector', label: 'View All 17 MFP Rates →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 6: General Rate Schedule Inquiry
  // --------------------------------------------------------------------------
  const isGeneralRateQuery =
    lowerQuery.includes('rate') ||
    lowerQuery.includes('price') ||
    lowerQuery.includes('cost') ||
    lowerQuery.includes('msp') ||
    lowerQuery.includes('tariff') ||
    lowerQuery.includes('catalogue') ||
    lowerQuery.includes('product') ||
    lowerQuery.includes('ଦର') ||
    lowerQuery.includes('ମୂଲ୍ୟ');

  if (isGeneralRateQuery) {
    citations.push('/rates');
    answer =
      locale === 'or'
        ? 'ସମଗ୍ନ ପୋର୍ଟାଲରେ ୧୭ ଟି ବନଜାତ ଦ୍ରବ୍ୟ ପାଇଁ ସରକାରୀ ସହାୟକ ମୂଲ୍ୟ ଉପଲବ୍ଧ: ଶୁଖିଲା ମହୁଲ ଫୁଲ ₹୪୨/କିଗ୍ରା, ଶାଳ ମଞ୍ଜି ₹୨୮/କିଗ୍ରା, କେନ୍ଦୁ ପତ୍ର ₹୫୫/କିଗ୍ରା, ମଞ୍ଜି ଥିବା ତେନ୍ତୁଳି ₹୩୬/କିଗ୍ରା, ଡି-ସିଡେଡ୍ ତେନ୍ତୁଳି ₹୬୪/କିଗ୍ରା, ଜଙ୍ଗଲୀ ମହୁ ₹୨୨୫/କିଗ୍ରା ଏବଂ ଚାରୋଳି ₹୧୪୦/କିଗ୍ରା। ଆଦିବାସୀ ସଂଗ୍ରାହକମାନେ ୧୦୦% MSP ପାଆନ୍ତି।'
        : 'Approved statutory procurement benchmark rates for primary Minor Forest Produce:\n• Dried Mahua Flowers: ₹42/kg\n• Seeded Tamarind: ₹36/kg (Deseeded: ₹64/kg)\n• Sal Tree Seeds: ₹28/kg\n• Kendu Leaves: ₹55/kg\n• Wild Forest Honey: ₹225/kg\n• Chironji / Char Seeds: ₹140/kg\n• Harida Fruit: ₹25/kg (Bahada: ₹22/kg, Amla: ₹30/kg)\n• Natural Lac: ₹210/kg\n\nTribal collectors receive 100% of these benchmark prices with 0% platform deductions.';

    cards.push({
      type: 'rate',
      title: 'Current Procurement Benchmark Schedule',
      subtitle: 'TDCCOL & LABHA Minimum Support Price Baseline',
      items: [
        { label: 'Mahua Flowers', value: '₹42 / kg', highlight: true },
        { label: 'Seeded Tamarind', value: '₹36 / kg', highlight: true },
        { label: 'Wild Forest Honey', value: '₹225 / kg', highlight: true },
        { label: 'Chironji / Char', value: '₹140 / kg', highlight: true },
      ],
      badge: { label: 'MSP Schedule 2024-25', variant: 'info' },
      link: { href: '/collector', label: 'Open Full 17 MFP Catalogue →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 7: Quality, Moisture & Shrinkage Standards
  // --------------------------------------------------------------------------
  const isQualityQuery =
    lowerQuery.includes('moisture') ||
    lowerQuery.includes('shrinkage') ||
    lowerQuery.includes('quality') ||
    lowerQuery.includes('tare') ||
    lowerQuery.includes('packaging') ||
    lowerQuery.includes('standard') ||
    lowerQuery.includes('faq') ||
    lowerQuery.includes('ଆର୍ଦ୍ରତା') ||
    lowerQuery.includes('ଓଜନ');

  if (isQualityQuery) {
    citations.push('/inventory');
    answer =
      locale === 'or'
        ? 'ମାନକ ଗୁଣବତ୍ତା ନିୟମ: ଶୁଖିଲା ମହୁଲ ଫୁଲ ପାଇଁ ସର୍ବାଧିକ ଆର୍ଦ୍ରତା ୧୨%, ଶାଳ ମଞ୍ଜି ପାଇଁ ୧୦% ଏବଂ ଜଙ୍ଗଲୀ ତେନ୍ତୁଳି ପାଇଁ ୧୫% ଅନୁମୋଦିତ। ପରିବହନ ସମୟରେ ୧.୨% ରୁ ୧.୫% ସ୍ୱାଭାବିକ ଶ୍ରିଙ୍କେଜ୍ ସ୍ୱୀକୃତ।'
        : 'Minor Forest Produce Quality Standards:\n• Dried Mahua Flowers: Max 12% moisture, 1.5% allowable shrinkage\n• Sal Seeds: Max 10% moisture, 1.2% allowable shrinkage\n• Seeded Tamarind: Max 15% moisture, 1.5% allowable shrinkage\n• Wild Honey: Pure cliff honey filtered without thermal processing\n• Standard Jute Gunny Bag Tare: Deducted at 1.5 kg per 50kg bag';

    cards.push({
      type: 'quality',
      title: 'Certified Warehouse Quality Limits',
      subtitle: 'TDCCOL Moisture, Packaging & Evaporation Allowances',
      items: [
        { label: 'Mahua Moisture Max', value: '12.0%', highlight: true },
        { label: 'Sal Seed Moisture Max', value: '10.0%' },
        { label: 'Standard Jute Bag Tare', value: '1.5 kg / bag' },
        { label: 'Transit Shrinkage Limit', value: '1.5% allowable' },
      ],
      badge: { label: 'Quality Standards', variant: 'neutral' },
      link: { href: '/inventory', label: 'Inspect Depot Quality Matrix →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 8: B2B Wholesale Trade & Commercial Orders
  // --------------------------------------------------------------------------
  const isB2BQuery =
    lowerQuery.includes('b2b') ||
    lowerQuery.includes('wholesale') ||
    lowerQuery.includes('bulk') ||
    lowerQuery.includes('rfq') ||
    lowerQuery.includes('trade') ||
    lowerQuery.includes('commercial') ||
    lowerQuery.includes('buyer') ||
    lowerQuery.includes('procure') ||
    lowerQuery.includes('ବ୍ୟବସାୟ');

  if (isB2BQuery) {
    citations.push('/trade');
    answer =
      locale === 'or'
        ? 'ବ୍ୟବସାୟୀ, ଆୟୁର୍ବେଦିକ ଫାର୍ମା ଏବଂ ପ୍ରୋସେସର୍ ମାନେ ସମଗ୍ନ B2B ଟ୍ରେଡ୍ ପୋର୍ଟାଲ (/trade) ରେ ପ୍ରମାଣିତ ବ୍ୟାଚ୍ କ୍ରୟ କରିପାରିବେ ଏବଂ ଅନଲାଇନ୍ RFQ (Request for Quotation) ପଠାଇପାରିବେ।'
        : 'Ayurvedic manufacturers, pharmaceutical extractors, and wholesale buyers can procure laboratory-tested, traceable Minor Forest Produce on the Samagna B2B Trade Portal (/trade). Features include:\n• Structured RFQ submissions and direct price bids\n• Verified provenance certificates with moisture and origin data\n• Transparent logistics and scheduled warehouse dispatch';

    cards.push({
      type: 'action',
      title: 'B2B Trade & Wholesale Portal',
      subtitle: 'Institutional sourcing for processors & bulk buyers',
      items: [
        { label: 'Available Inventory', value: 'Similipal Certified Lots' },
        { label: 'Trade Mechanism', value: 'Digital RFQ & Purchase Orders' },
        { label: 'Compliance', value: '100% LABHA Verified Sourcing' },
      ],
      badge: { label: 'Commercial B2B', variant: 'info' },
      link: { href: '/trade', label: 'Explore B2B Wholesale Market →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 9: Consumer Retail Store
  // --------------------------------------------------------------------------
  const isStoreQuery =
    lowerQuery.includes('store') ||
    lowerQuery.includes('shop') ||
    lowerQuery.includes('retail') ||
    lowerQuery.includes('consumer') ||
    lowerQuery.includes('buy honey') ||
    lowerQuery.includes('cart') ||
    lowerQuery.includes('order') ||
    lowerQuery.includes('ଦୋକାନ');

  if (isStoreQuery) {
    citations.push('/store');
    answer =
      locale === 'or'
        ? 'ସମଗ୍ନ ରିଟେଲ୍ ଷ୍ଟୋର୍ (/store) ରେ ସାଧାରଣ ଉପଭୋକ୍ତାମାନେ ବିଶୁଦ୍ଧ ଜଙ୍ଗଲୀ ମହୁ, ଅଁଳା ଓ ଚାରୋଳି ଭଳି ପ୍ୟାକେଜ୍ଡ୍ ଅର୍ଗାନିକ୍ ଦ୍ରବ୍ୟ ସିଧାସଳଖ କ୍ରୟ କରିପାରିବେ।'
        : 'Consumers can purchase packaged, purity-tested forest produce directly on the Samagna Retail Storefront (/store). Offerings include raw cliff honey, cold-filtered forest products, and organic botanical goods delivered to your doorstep.';

    cards.push({
      type: 'action',
      title: 'Samagna Forest Retail Store',
      subtitle: 'Direct-to-consumer packaged organic produce',
      items: [
        { label: 'Signature Item', value: 'Wild Cliff Honey (500g Jar)' },
        { label: 'Purity', value: '100% Cold Filtered, Zero Preservatives' },
        { label: 'Delivery', value: 'Nationwide Courier Dispatch' },
      ],
      badge: { label: 'Retail Store', variant: 'success' },
      link: { href: '/store', label: 'Open Consumer Retail Store →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 10: Operations, Collection Centres & Warehouses
  // --------------------------------------------------------------------------
  const isOpsQuery =
    lowerQuery.includes('operation') ||
    lowerQuery.includes('collection center') ||
    lowerQuery.includes('centre') ||
    lowerQuery.includes('depot') ||
    lowerQuery.includes('warehouse') ||
    lowerQuery.includes('weighment') ||
    lowerQuery.includes('scale') ||
    lowerQuery.includes('କେନ୍ଦ୍ର');

  if (isOpsQuery) {
    citations.push('/collection');
    answer =
      locale === 'or'
        ? 'ସଂଗ୍ରହ ପରିଚାଳନା ଡେସ୍କ (/collection) ରେ କେନ୍ଦ୍ର ମ୍ୟାନେଜରମାନେ ଡିଜିଟାଲ ଓଜନ, ଫଟୋ ପ୍ରମାଣ, ତୁରନ୍ତ A5 ରସିଦ ଏବଂ ବାରକୋଡ୍ ଟ୍ୟାଗ୍ ପ୍ରସ୍ତୁତ କରନ୍ତି। ଗୋଦାମ ମ୍ୟାନେଜରମାନେ (/inventory) ରେ ଆଗମନ ଓଜନ ଓ ଶ୍ରିଙ୍କେଜ୍ ଯାଞ୍ଚ କରନ୍ତି।'
        : 'Operational workflows on Samagna:\n• Collection Centre Desk (/collection): Electronic weighment intake, tare deduction, evidence capture, instant A5 receipt generation, and durable sack tag printing.\n• Warehouse Depot Desk (/inventory): Depot arrival reweigh, shrinkage reconciliation, lot quarantine, and certified B2B lot creation.';

    cards.push({
      type: 'action',
      title: 'Operational Governance Suite',
      subtitle: 'Field collection & warehouse inventory desks',
      items: [
        { label: 'Weighment Desk', value: 'Electronic Scale & A5 Receipts' },
        { label: 'Depot Ledger', value: 'Shrinkage & Quarantine Controls' },
        { label: 'Audits', value: 'Supervisor Admin Ledgers' },
      ],
      badge: { label: 'Operations Suite', variant: 'info' },
      link: { href: '/login?redirect=/collection', label: 'Open Collection Desk →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 11: Contact & Support Information
  // --------------------------------------------------------------------------
  const isContactQuery =
    lowerQuery.includes('contact') ||
    lowerQuery.includes('support') ||
    lowerQuery.includes('phone') ||
    lowerQuery.includes('email') ||
    lowerQuery.includes('address') ||
    lowerQuery.includes('office') ||
    lowerQuery.includes('facilitator');

  if (isContactQuery) {
    citations.push('/about');
    answer =
      locale === 'or'
        ? 'ମୟୂରଭଞ୍ଜ ଜିଲ୍ଲା ସଂଯୋଗ ସୂଚନା:\n• ଡିଭିଜନାଲ୍ ଅଫିସ୍: ଜିଲ୍ଲାପାଳଙ୍କ କାର୍ଯ୍ୟାଳୟ ରୋଡ୍, ବାରିପଦା, ଓଡ଼ିଶା ୭୫୭୦୦୧\n• କେନ୍ଦ୍ରୀୟ ଡିପୋ: ବାରିପଦା ଫରେଷ୍ଟ ଡିଭିଜନ୍ ହବ୍\n• ସହାୟତା ଇମେଲ୍: support@samagna.gov.in\n• କ୍ଷେତ୍ର ସହାୟତା: ଆପଣଙ୍କ ନିକଟସ୍ଥ SHG ଫାସିଲିଟେଟର (Dipti Besra) ଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।'
        : 'Mayurbhanj District Support & Operations Desk:\n• Divisional Office: TDCCOL Division, Collectorate Road, Baripada, Odisha 757001\n• Central Logistics Depot: Baripada Forest Range Storage Hub\n• Support Email: support@samagna.gov.in (Demonstration Desk)\n• Field Support: Consult your assigned Self-Help Group (SHG) Facilitator at the local aggregation centre.';

    cards.push({
      type: 'info',
      title: 'Mayurbhanj Field Support Desk',
      subtitle: 'Official aggregation & operational coordination',
      items: [
        { label: 'Headquarters', value: 'Baripada, Mayurbhanj, Odisha' },
        { label: 'Lead Facilitator', value: 'Dipti Besra (Similipal Buffer)' },
        { label: 'Operations Email', value: 'support@samagna.gov.in' },
      ],
      badge: { label: 'Support Desk', variant: 'neutral' },
      link: { href: '/facilitator', label: 'Open Facilitator Directory →' },
    });

    return {
      answer: maskAllPii(answer),
      citations,
      toolCalls,
      cards,
      degraded: false,
      conversationId,
    };
  }

  // --------------------------------------------------------------------------
  // INTENT 12: Curated Static FAQ Matcher
  // --------------------------------------------------------------------------
  const match = matchKnowledgeBase(maskedQuery, STATIC_FAQS, role, surface, locale);

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
    // Intelligent fallback with interactive guidance
    citations.push('/about');
    answer =
      locale === 'or'
        ? 'ମୈତ୍ରିୟମ୍ ଏକ ସ୍ୱୟଂଚାଳିତ ମାର୍ଗଦର୍ଶନ ସହାୟକ। ଆପଣ ବନଜାତ ଦ୍ରବ୍ୟର ସରକାରୀ ଦର, ୧-କ୍ଲିକ୍ ଡେମୋ ଲଗଇନ୍, ବ୍ୟାଚ୍ QR ଯାଞ୍ଚ କିମ୍ବା B2B ହୋଲସେଲ ବିଷୟରେ ପଚାରିପାରିବେ। ତଳେ ଥିବା ଲିଙ୍କ୍ କ୍ଲିକ୍ କରି ଆଗକୁ ବଢ଼ନ୍ତୁ।'
        : 'I am Maitriyam, your automated guidance assistant for Samagna. You can ask me about:\n• Approved statutory MSP rates for any of the 17 Minor Forest Produce\n• 1-Click Demo Login credentials and test personas\n• Batch QR verification and harvest provenance\n• B2B wholesale procurement and retail store\n\nChoose an option below to explore:';

    cards.push({
      type: 'action',
      title: 'Explore Samagna Platform Services',
      subtitle: 'Instant access to key modules',
      items: [
        { label: 'MSP Rates Schedule', value: 'All 17 Minor Forest Produce' },
        { label: '1-Click Demo Login', value: 'Personas & Passwords' },
        { label: 'Verify Batch QR', value: 'Similipal Harvest Records' },
      ],
      badge: { label: 'Guidance', variant: 'info' },
      link: { href: '/login', label: 'Explore 1-Click Demo Personas →' },
    });
  }

  // Programmatic Output Checks: Never claim official persona
  if (
    answer.toLowerCase().includes('i am an official') ||
    answer.toLowerCase().includes('government officer')
  ) {
    answer = 'Maitriyam is an automated, read-only guidance assistant.';
  }

  return {
    answer: maskAllPii(answer),
    citations,
    toolCalls,
    cards,
    degraded: false,
    pilotNotice: 'Samagna is an independent demonstration platform; all payments and royalty metrics are simulated.',
    conversationId,
  };
}
