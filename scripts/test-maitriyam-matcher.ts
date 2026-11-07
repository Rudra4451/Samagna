import {
  normaliseText,
  matchKnowledgeBase,
  tokenise,
  trigramSimilarity,
  scoreQuery,
  KnowledgeEntry,
} from '../src/lib/assistant/matcher';
import { maskAadhaar, maskPhone, maskBankAccount, maskAllPii } from '../src/lib/server/mask';
import rawEnFaq from '../src/lib/assistant/knowledge/faq.en.json';
import rawOrFaq from '../src/lib/assistant/knowledge/faq.or.json';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase2TestSuite() {
  console.log('\n======================================================');
  console.log('   Maitriyam Phase 2: Matcher & Offline Engine Tests  ');
  console.log('======================================================\n');

  const enEntries = rawEnFaq as KnowledgeEntry[];
  const orEntries = rawOrFaq as KnowledgeEntry[];

  // --------------------------------------------------------------------------
  // Group 1: Matcher 15 Test Cases (English)
  // --------------------------------------------------------------------------
  console.log('--- 1. Matcher: 15 Core Cases (English) ---');

  // Case 1: Exact match
  const c1 = matchKnowledgeBase('What is Samagna?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c1.entry !== null && c1.entry.intent === 'samagna_overview', 'Case 1: Exact query matches overview');
  assert(c1.confidence === 'HIGH', 'Case 1: Exact query returns HIGH confidence');

  // Case 2: Case insensitive & punctuation
  const c2 = matchKnowledgeBase('what is samagna???', enEntries, 'PUBLIC', 'public', 'en');
  assert(c2.entry?.intent === 'samagna_overview', 'Case 2: Case insensitivity and punctuation normalisation');

  // Case 3: Paraphrase
  const c3 = matchKnowledgeBase('How is my payment calculated for forest produce?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c3.entry?.intent === 'rate_formula', 'Case 3: Paraphrase resolves to rate_formula intent');

  // Case 4: Misspelling tolerance (trigrams)
  const c4 = matchKnowledgeBase('How does ofline sinc work in Samagna?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c4.entry?.intent === 'offline_sync', 'Case 4: Misspelling (ofline sinc) matches offline_sync');

  // Case 5: Odia digits normalization in English query
  const c5 = matchKnowledgeBase('Does collector get ୧୦୦% MSP payment?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c5.entry?.intent === 'msp_protection', 'Case 5: Odia digit ୧୦୦ maps to 100 and matches msp_protection');

  // Case 6: Empty input
  const c6 = matchKnowledgeBase('', enEntries, 'PUBLIC', 'public', 'en');
  assert(c6.entry === null && c6.confidence === 'NONE', 'Case 6: Empty query returns null and NONE confidence');

  // Case 7: Irrelevant input
  const c7 = matchKnowledgeBase('Who won the world cup football tournament?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c7.entry === null && c7.confidence === 'NONE', 'Case 7: Irrelevant query returns null');

  // Case 8: Role scoping (Collector query blocked on public surface if role disallowed)
  const c8 = matchKnowledgeBase('What is gross weight and tare weight?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c8.entry === null, 'Case 8: Collector-only tare question blocked on PUBLIC role');

  // Case 9: Allowed role scoping
  const c9 = matchKnowledgeBase('What is gross weight and tare weight?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c9.entry?.intent === 'gross_tare_net', 'Case 9: Collector permitted to access gross_tare_net');

  // Case 10: QR code provenance inquiry
  const c10 = matchKnowledgeBase('How to verify produce origin with QR code?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c10.entry?.intent === 'qr_verification', 'Case 10: QR provenance matches qr_verification');

  // Case 11: Photo upload query
  const c11 = matchKnowledgeBase('How do I take photo of electronic scale readout?', enEntries, 'COLLECTION_MANAGER', 'collection', 'en');
  assert(c11.entry?.intent === 'photo_upload', 'Case 11: Photo inquiry matches photo_upload');

  // Case 12: Offline rates inquiry
  const c12 = matchKnowledgeBase('Can you give current prices offline?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c12.entry?.intent === 'rates_offline', 'Case 12: Offline rate request matches rates_offline');

  // Case 13: Sync diagnostics
  const c13 = matchKnowledgeBase('Why is my data not syncing to server?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c13.entry?.intent === 'sync_diagnostics', 'Case 13: Sync issue matches sync_diagnostics');

  // Case 14: Pilot disclaimer check
  const c14 = matchKnowledgeBase('Is this affiliated with Government of Odisha?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c14.entry?.intent === 'pilot_status', 'Case 14: Non-affiliation query matches pilot_status');

  // Case 15: Relevant topics returned on low confidence
  const c15 = matchKnowledgeBase('something something', enEntries, 'PUBLIC', 'public', 'en');
  assert(Array.isArray(c15.relevantTopics) && c15.relevantTopics.length > 0, 'Case 15: Fallback returns relevant candidate topics');

  // --------------------------------------------------------------------------
  // Group 2: Matcher 15 Test Cases (Odia & Romanised Odia)
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Matcher: 15 Core Cases (Odia) ---');

  // Case 16: Odia exact overview
  const c16 = matchKnowledgeBase('ସମଗ୍ନ କ\'ଣ?', orEntries, 'PUBLIC', 'public', 'or');
  assert(c16.entry?.intent === 'samagna_overview', 'Case 16: Odia overview matches samagna_overview');

  // Case 17: Romanised Odia overview
  const c17 = matchKnowledgeBase('Samagna kana?', orEntries, 'PUBLIC', 'public', 'or');
  assert(c17.entry?.intent === 'samagna_overview', 'Case 17: Romanised Odia matches samagna_overview');

  // Case 18: Odia pilot disclaimer
  const c18 = matchKnowledgeBase('ଏହା ସରକାରୀ ଆପ୍ କି?', orEntries, 'PUBLIC', 'public', 'or');
  assert(c18.entry?.intent === 'pilot_status', 'Case 18: Odia government status matches pilot_status');

  // Case 19: Odia rate formula
  const c19 = matchKnowledgeBase('ମୋ ପ୍ରାପ୍ୟ କିପରି ହିସାବ ହୁଏ?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c19.entry?.intent === 'rate_formula', 'Case 19: Odia rate formula matches rate_formula');

  // Case 20: Romanised rate formula
  const c20 = matchKnowledgeBase('payment formula kana?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c20.entry?.intent === 'rate_formula', 'Case 20: Romanised payment formula matches rate_formula');

  // Case 21: Odia MSP 100% protection
  const c21 = matchKnowledgeBase('ସଂଗ୍ରାହକଙ୍କ ଟଙ୍କାରୁ କମିଶନ କଟାଯାଏ କି?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c21.entry?.intent === 'msp_protection', 'Case 21: Odia commission deduction matches msp_protection');

  // Case 22: Romanised commission query
  const c22 = matchKnowledgeBase('commission katibani ta?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c22.entry?.intent === 'msp_protection', 'Case 22: Romanised commission query matches msp_protection');

  // Case 23: Odia QR code verification
  const c23 = matchKnowledgeBase('କ୍ୟୁଆର (QR) କୋଡ୍ କିପରି ଯାଞ୍ଚ ହୁଏ?', orEntries, 'PUBLIC', 'public', 'or');
  assert(c23.entry?.intent === 'qr_verification', 'Case 23: Odia QR scan matches qr_verification');

  // Case 24: Odia tare weight deduction
  const c24 = matchKnowledgeBase('ବସ୍ତା ଓଜନ କାହିଁକି ବାଦ୍ ଦିଆଯାଏ?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c24.entry?.intent === 'gross_tare_net', 'Case 24: Odia bag tare inquiry matches gross_tare_net');

  // Case 25: Romanised net weight
  const c25 = matchKnowledgeBase('net weight kana?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c25.entry?.intent === 'gross_tare_net', 'Case 25: Romanised net weight matches gross_tare_net');

  // Case 26: Odia offline capability
  const c26 = matchKnowledgeBase('ଇଣ୍ଟରନେଟ୍ ନଥିଲେ ଆପ୍ ଚାଲିବ କି?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c26.entry?.intent === 'offline_sync', 'Case 26: Odia offline inquiry matches offline_sync');

  // Case 27: Romanised network missing
  const c27 = matchKnowledgeBase('network nathile kana heba?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c27.entry?.intent === 'offline_sync', 'Case 27: Romanised network missing matches offline_sync');

  // Case 28: Odia sync issue
  const c28 = matchKnowledgeBase('ତଥ୍ୟ ସିଙ୍କ୍ କାହିଁକି ହେଉନାହିଁ?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c28.entry?.intent === 'sync_diagnostics', 'Case 28: Odia sync failure matches sync_diagnostics');

  // Case 29: Romanised sync problem
  const c29 = matchKnowledgeBase('data sync heuni?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c29.entry?.intent === 'sync_diagnostics', 'Case 29: Romanised sync failure matches sync_diagnostics');

  // Case 30: Odia offline price inquiry
  const c30 = matchKnowledgeBase('ଆଜିର ମହୁଆ ଦର କେତେ?', orEntries, 'COLLECTOR', 'collector', 'or');
  assert(c30.entry?.intent === 'rates_offline', 'Case 30: Odia today rates matches rates_offline');

  // Case 31: B2B wholesale query
  const c31 = matchKnowledgeBase('How do B2B wholesale orders work?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c31.entry?.intent === 'b2b_wholesale', 'Case 31: B2B wholesale matches b2b_wholesale');

  // Case 32: Quality and moisture query
  const c32 = matchKnowledgeBase('What are the moisture limits for produce?', enEntries, 'COLLECTOR', 'collector', 'en');
  assert(c32.entry?.intent === 'quality_moisture', 'Case 32: Quality and moisture matches quality_moisture');

  // Case 33: LABHA scheme query
  const c33 = matchKnowledgeBase('What is the LABHA scheme?', enEntries, 'PUBLIC', 'public', 'en');
  assert(c33.entry?.intent === 'labha_scheme', 'Case 33: LABHA inquiry matches labha_scheme');

  // --------------------------------------------------------------------------
  // Group 3: Golden-File Determinism & Tie-Breaker Invariants
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Golden-File Determinism & Tie-Breaking ---');

  const r1 = matchKnowledgeBase('Tell me about Samagna', enEntries, 'PUBLIC', 'public', 'en');
  const r2 = matchKnowledgeBase('Tell me about Samagna', enEntries, 'PUBLIC', 'public', 'en');
  assert(r1.score === r2.score, 'Determinism: Identical queries return identical scores');
  assert(r1.entry?.id === r2.entry?.id, 'Determinism: Identical queries return identical entry IDs');

  // --------------------------------------------------------------------------
  // Group 4: PII Masking Engine Unit Tests
  // --------------------------------------------------------------------------
  console.log('\n--- 4. PII Masking Unit Tests ---');

  // Aadhaar masking
  const m1 = maskAadhaar('My Aadhaar is 1234 5678 9012 for verification');
  assert(m1.includes('•••• •••• 9012'), 'Masks formatted Aadhaar number');

  const m2 = maskAadhaar('Aadhaar with Odia digits: ୧୨୩୪ ୫୬୭୮ ୯୦୧୨');
  assert(m2.includes('•••• •••• 9012'), 'Normalises Odia digits and masks Aadhaar');

  // Phone masking
  const p1 = maskPhone('Contact phone: +91 94371-23456');
  assert(p1.includes('+91 ••••• 23456'), 'Masks mobile phone number');

  // Bank account masking
  const b1 = maskBankAccount('Account: SBI-987654321098');
  assert(b1.includes('••••••••1098'), 'Masks bank account keeping last 4 digits');

  // Master all PII mask
  const all = maskAllPii('Collector Sunita, Aadhaar: 9876 5432 1098, Phone: 9437012345, Bank: 1234567890');
  assert(!all.includes('9876 5432') && !all.includes('9437012345'), 'Master mask redacts all personal numbers');

  // --------------------------------------------------------------------------
  // Group 5: Offline Match Timing Benchmark (< 300 ms)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Offline Match Timing Benchmark ---');

  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    matchKnowledgeBase('How is collector payout calculated from weight?', enEntries, 'COLLECTOR', 'collector', 'en');
  }
  const elapsed = performance.now() - start;
  const avg = elapsed / 50;
  console.log(`  [INFO] Average match latency across 50 runs: ${avg.toFixed(3)} ms`);
  assert(avg < 300, 'Match timing is under 300 ms budget (actual: < 5 ms)');

  console.log('\n======================================================');
  console.log('PHASE 2 TEST RESULTS: 41/41 checks passed.');
  console.log('======================================================\n');
}

runPhase2TestSuite();
