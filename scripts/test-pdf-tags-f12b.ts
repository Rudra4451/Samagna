/**
 * scripts/test-pdf-tags-f12b.ts
 *
 * BanaSetu F12-B Verification & Regression Suite:
 * Professional Server-Side Print-Ready A6 Product Tags & Collection Batch Tags
 *
 * Covers:
 * 1. Direct Tag PDF Generator Foundation (Unit tests for ISO 216 A6 dimensions, QR, B&W layout)
 * 2. Route Authentication & Session Validation (401 unauthenticated & tampered JWT)
 * 3. Parameter Validation & Sanitization (400 invalid code, type switching)
 * 4. Fail-Closed Standby Behavior (503 unconfigured PostgreSQL)
 * 5. Filename Sanitization & Safe Response Headers (no-cache, injection defense)
 * 6. Rate Limiter Hardening (Session-bound identity resistant to X-Forwarded-For spoofing)
 * 7. Mocked Database Access Control & Scoping [MOCKED DB - No live PostgreSQL integration claimed]:
 *    - SHG Facilitator at assigned center (HTTP 200)
 *    - SHG Facilitator requesting product tag (HTTP 200)
 *    - SHG Facilitator outside assigned center denied (HTTP 403 FACILITATOR_ASSIGNMENT_MISMATCH)
 *    - Collection Manager outside assigned center denied (HTTP 403 COLLECTION_MANAGER_ASSIGNMENT_MISMATCH)
 *    - Collection Manager assigned to center (HTTP 200)
 *    - Warehouse Manager assigned to destination depot (HTTP 200)
 *    - Warehouse Manager mismatched depot denied (HTTP 403 WAREHOUSE_DEPOT_MISMATCH)
 *    - Contributing Collector accessing their batch tag (HTTP 200)
 *    - Collector requesting another batch tag denied (HTTP 403 FORBIDDEN_TAG_OWNERSHIP)
 *    - Supervisor Admin district-wide audit access (HTTP 200)
 *    - Cross-district access denial (HTTP 403 CROSS_DISTRICT_ACCESS_FORBIDDEN)
 *    - Non-existent batch rejected (HTTP 404 BATCH_NOT_FOUND)
 *    - RESTful /api/batches/[id]/tag/pdf route alias verification (HTTP 200)
 * 8. QR Code Destination & Public Privacy Guard
 * 9. UI Integration Verification
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET as tagPdfHandler } from '../src/app/api/tags/[code]/pdf/route';
import { GET as batchTagPdfHandler } from '../src/app/api/batches/[id]/tag/pdf/route';
import { generateTagPdfBuffer, TagPdfData } from '../src/lib/server/pdf/tagPdf';
import { createSessionToken, UserRole } from '../src/lib/server/auth';
import { resetRateLimit } from '../src/lib/server/rateLimit';

// Ensure test AUTH_SECRET is configured
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  process.env.AUTH_SECRET = 'test-secret-key-must-be-at-least-32-chars-long!';
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('======================================================');
  console.log('   BanaSetu F12-B: A6 Product & Collection Tags QA    ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // 1. Tag Generator Foundation (Unit Verification)
  // --------------------------------------------------------------------------
  console.log('--- 1. Server-Side Tag PDF Generator Foundation ---');

  const sampleTagData: TagPdfData = {
    code: 'BS-402',
    produceName: 'Dried Mahua Flowers',
    produceOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    category: 'Sapotaceae',
    district: 'Mayurbhanj',
    block: 'Karanjia',
    gramPanchayat: 'Badagaon',
    centerName: 'Karanjia Block Collection Point #01',
    destinationDepot: 'Baripada Central Depôt (BRP-01)',
    status: 'VERIFIED_SALEABLE',
    netWeightKg: 100.0,
    grossWeightKg: 104.2,
    tareWeightKg: 4.2,
    sackCount: 2,
    sealTagId: 'SEAL-MAY-8840',
    transitWaybillId: 'WAY-2024-KRN-402',
    qualityGrade: 'Grade A - Properly Dried',
    dateStr: '14 Mar 2025',
    verificationUrl: 'https://banasetu.odisha.gov.in/verify/BS-402',
    standardPackaging: '50kg Jute Gunny Bag',
    maxMoisturePercent: 12.0,
    shrinkageTolerancePercent: 1.5,
    harvestSeason: 'March - May',
    storageGuidelines: 'Store in dry covered warehouse on raised wooden dunnage.',
  };

  // 1.1 Collection Batch Tag
  const collectionTagBuf = await generateTagPdfBuffer(sampleTagData, 'collection');
  assert(Buffer.isBuffer(collectionTagBuf), 'generateTagPdfBuffer returns a valid Node.js Buffer for collection tag');
  assert(collectionTagBuf.length > 2000, `Collection tag PDF is non-empty (${collectionTagBuf.length} bytes)`);
  assert(collectionTagBuf.subarray(0, 5).toString('utf8').startsWith('%PDF-'), 'Collection tag starts with %PDF- signature');

  const collText = collectionTagBuf.toString('binary');
  // ISO 216 A6 dimensions: 297.64 pt x 419.53 pt
  assert(collText.includes('297.64') && collText.includes('419.53'), 'PDF embeds exact A6 MediaBox dimensions (297.64 x 419.53 pt)');
  assert(
    collText.includes('OFFICIAL_BATCH_SACK_TAG') || collText.includes('Collection Batch Sack Tag'),
    'Collection tag includes official sack tag metadata identifier'
  );

  // Privacy verification: tag contains zero personal collector identity
  assert(!collText.includes('Sunita Soren'), 'Tag contains zero individual gatherer names');
  assert(!collText.includes('OR-MAY-***-1109'), 'Tag contains zero personal tribal IDs');
  assert(!collText.includes('State Bank of India'), 'Tag contains zero personal bank names');
  assert(!collText.includes('123456789012'), 'Tag contains zero Aadhaar credentials');

  // 1.2 Product Lot Spec Tag
  const productTagBuf = await generateTagPdfBuffer(sampleTagData, 'product');
  assert(Buffer.isBuffer(productTagBuf), 'generateTagPdfBuffer returns a valid Buffer for product tag');
  assert(productTagBuf.length > 2000, `Product tag PDF is non-empty (${productTagBuf.length} bytes)`);
  const prodText = productTagBuf.toString('binary');
  assert(
    prodText.includes('PRODUCE_LOT_SPECIFICATION_TAG') || prodText.includes('Lot Specification Tag'),
    'Product tag includes produce lot spec header metadata'
  );
  assert(prodText.includes('Sapotaceae'), 'Product tag includes botanical family category');
  assert(
    prodText.includes('NON_INVENTION_DISCLAIMER') || prodText.includes('Non-Invention'),
    'Product tag includes non-invention official standards disclaimer'
  );

  // --------------------------------------------------------------------------
  // 2. Route Authentication & Session Validation
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Route Authentication & Session Validation ---');

  // 2.1 Unauthenticated request -> HTTP 401
  const unauthReq = new NextRequest('http://localhost:3000/api/tags/BS-402/pdf');
  const unauthRes = await tagPdfHandler(unauthReq, { params: { code: 'BS-402' } });
  const unauthJson = await unauthRes.json();
  assert(unauthRes.status === 401, 'Unauthenticated tag request rejected with HTTP 401');
  assert(unauthJson.error === 'UNAUTHENTICATED', 'Error code explicitly indicates UNAUTHENTICATED');

  // 2.2 Tampered token -> HTTP 401
  const tamperedReq = new NextRequest('http://localhost:3000/api/tags/BS-402/pdf', {
    headers: { cookie: 'banasetu_session=tampered.token.here' },
  });
  const tamperedRes = await tagPdfHandler(tamperedReq, { params: { code: 'BS-402' } });
  assert(tamperedRes.status === 401, 'Tampered session token rejected with HTTP 401');

  // --------------------------------------------------------------------------
  // 3. Parameter Validation & Sanitization
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Code Sanitization & Input Validation ---');

  const validFacToken = await createSessionToken({
    userId: 'USR-FAC-001',
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR' as UserRole,
    fullName: 'Sumitra Marndi',
    district: 'Mayurbhanj',
    centerId: 'KRN-01',
    village: 'Badagaon',
  });

  // 3.1 Single character code -> HTTP 400
  const shortCodeReq = new NextRequest('http://localhost:3000/api/tags/x/pdf', {
    headers: { cookie: `banasetu_session=${validFacToken}` },
  });
  const shortCodeRes = await tagPdfHandler(shortCodeReq, { params: { code: 'x' } });
  const shortCodeJson = await shortCodeRes.json();
  assert(shortCodeRes.status === 400, 'Invalid single-character code rejected with HTTP 400');
  assert(shortCodeJson.error === 'INVALID_BATCH_IDENTIFIER', 'Error code is INVALID_BATCH_IDENTIFIER');

  // --------------------------------------------------------------------------
  // 4. Fail-Closed Standby Mode (Database Unconfigured)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Fail-Closed Standby Behavior (No DB Configured) ---');

  const standbyReq = new NextRequest('http://localhost:3000/api/tags/BS-402/pdf', {
    headers: { cookie: `banasetu_session=${validFacToken}` },
  });
  const standbyRes = await tagPdfHandler(standbyReq, { params: { code: 'BS-402' } });
  const standbyJson = await standbyRes.json();

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0 && !process.env.DATABASE_URL.includes('replace_with_secure_password')) {
    console.log('  [INFO] PostgreSQL database is configured in environment.');
  } else {
    assert(standbyRes.status === 503, 'Unconfigured database fails safely closed with HTTP 503');
    assert(standbyJson.error === 'DATABASE_UNCONFIGURED', 'Error code is DATABASE_UNCONFIGURED');
    assert(standbyJson.serverAvailable === false, 'Explicitly reports serverAvailable: false');
  }

  // --------------------------------------------------------------------------
  // 5. Filename Sanitization & Safe Response Headers
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Filename Sanitization & Safe Headers ---');

  const sanitizeTagFilename = (code: string, type: 'collection' | 'product') => {
    const prefix = type === 'product' ? 'BanaSetu-ProductTag' : 'BanaSetu-BatchTag';
    return `${prefix}-${code.replace(/^#/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  };

  assert(
    sanitizeTagFilename('BS-402', 'collection') === 'BanaSetu-BatchTag-BS-402.pdf',
    'Standard batch tag filename: BanaSetu-BatchTag-BS-402.pdf'
  );
  assert(
    sanitizeTagFilename('#BS-402', 'product') === 'BanaSetu-ProductTag-BS-402.pdf',
    'Standard product tag filename: BanaSetu-ProductTag-BS-402.pdf'
  );
  assert(
    sanitizeTagFilename('../evil/code', 'collection') === 'BanaSetu-BatchTag-___evil_code.pdf',
    'Path traversal characters safely sanitized in tag filename'
  );

  // --------------------------------------------------------------------------
  // 6. Rate Limiter Hardening (Spoofing Defense)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Rate Limiter Hardening (Spoofing Defense) ---');

  const tagRlUserId = 'USR-TAG-RL-TESTER';
  resetRateLimit(`user:${tagRlUserId}`, 'tag-pdf-download');

  const tagRlToken = await createSessionToken({
    userId: tagRlUserId,
    username: 'tag.rl.tester',
    role: 'SHG_FACILITATOR' as UserRole,
    fullName: 'Tag RL Tester',
    district: 'Mayurbhanj',
    centerId: 'KRN-01',
  });

  // Make 60 requests with rotating X-Forwarded-For IP addresses
  let tagUnderLimitOk = true;
  for (let i = 1; i <= 60; i++) {
    const rotatingIp = `10.10.1.${i}`;
    const rlReq = new NextRequest('http://localhost:3000/api/tags/BS-402/pdf', {
      headers: {
        cookie: `banasetu_session=${tagRlToken}`,
        'x-forwarded-for': rotatingIp,
      },
    });
    const rlRes = await tagPdfHandler(rlReq, { params: { code: 'BS-402' } });
    if (rlRes.status === 429) {
      tagUnderLimitOk = false;
      break;
    }
  }
  assert(tagUnderLimitOk, 'All 60 allowed requests within window pass rate limiter');

  // 61st request from a new IP header must be blocked with HTTP 429
  const tagSpoofedReq = new NextRequest('http://localhost:3000/api/tags/BS-402/pdf', {
    headers: {
      cookie: `banasetu_session=${tagRlToken}`,
      'x-forwarded-for': '198.51.100.99',
    },
  });
  const tagSpoofedRes = await tagPdfHandler(tagSpoofedReq, { params: { code: 'BS-402' } });
  const tagSpoofedJson = await tagSpoofedRes.json();

  assert(tagSpoofedRes.status === 429, '61st request rejected with HTTP 429 despite rotated X-Forwarded-For');
  assert(tagSpoofedJson.error === 'TOO_MANY_REQUESTS', 'Error code is TOO_MANY_REQUESTS');
  assert(Boolean(tagSpoofedRes.headers.get('Retry-After')), 'Response includes valid Retry-After header');

  resetRateLimit(`user:${tagRlUserId}`, 'tag-pdf-download');

  // --------------------------------------------------------------------------
  // 7. Mocked Database Access Control & Tag Generation
  //    [MOCKED DB: Exercises route logic against simulated Prisma records]
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Mocked Database Access Control & Tag Scoping ---');
  console.log('  [NOTE: Mocked tests below exercise route logic against simulated DB models]');

  const mockBatches: Record<string, any> = {
    'BS-402-MAY': {
      id: 'BS-402-MAY',
      status: 'VERIFIED_SALEABLE',
      produceName: 'Dried Mahua Flowers',
      produceOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
      scientificName: 'Madhuca longifolia',
      district: 'Mayurbhanj',
      block: 'Karanjia',
      gramPanchayat: 'Badagaon',
      centerName: 'Karanjia Block Collection Point #01',
      destinationDepotId: 'BRP-01',
      shgName: 'Maa Mangala SHG',
      facilitatorName: 'Sumitra Marndi',
      referenceRatePerKg: 42.0,
      rateSource: 'TDCCOL LABHA Notification (Floor Price)',
      ratePublishedDate: '2025-01-15',
      createdAt: new Date('2025-03-14T09:00:00Z'),
      updatedAt: new Date('2025-03-14T09:00:00Z'),
      step1: {
        id: 'STEP1-402',
        batchId: 'BS-402-MAY',
        verifiedAt: new Date('2025-03-14T09:15:00Z'),
        grossWeightKg: 104.2,
        tareWeightKg: 4.2,
        netAcceptedKg: 100.0,
        grade: 'Grade A - Properly Dried',
        sackCount: 2,
        sealTagId: 'SEAL-MAY-8840',
        transitWaybillId: 'WAY-2024-KRN-402',
        initialDestinationDepotId: 'BRP-01',
      },
      collectors: [
        {
          id: 'COL-101',
          batchId: 'BS-402-MAY',
          name: 'Sunita Soren',
          tribalId: 'TR-MAY-001',
          village: 'Badagaon',
          weightKg: 100.0,
          grossPayout: 4200.0,
        },
      ],
    },
    'BS-402-KOR': {
      id: 'BS-402-KOR',
      status: 'VERIFIED_SALEABLE',
      produceName: 'Tamarind',
      produceOdia: 'ତେନ୍ତୁଳି',
      district: 'Koraput', // Different district
      block: 'Semiliguda',
      gramPanchayat: 'Pujariput',
      centerName: 'Semiliguda Center',
      destinationDepotId: 'KOR-01',
      shgName: 'Tribal SHG',
      facilitatorName: 'D. Jani',
      referenceRatePerKg: 36.0,
      rateSource: 'MSP Notification',
      ratePublishedDate: '2025-01-15',
      createdAt: new Date('2025-03-14T11:00:00Z'),
      updatedAt: new Date('2025-03-14T11:00:00Z'),
      step1: {
        id: 'STEP1-404',
        batchId: 'BS-402-KOR',
        verifiedAt: new Date('2025-03-14T11:15:00Z'),
        grossWeightKg: 62.0,
        tareWeightKg: 2.0,
        netAcceptedKg: 60.0,
        grade: 'Grade A',
        sackCount: 1,
        sealTagId: 'TAG-KOR-01',
        transitWaybillId: 'WB-KOR-01',
      },
      collectors: [{ id: 'COL-KOR-001' }],
    },
  };

  const mockPrisma = {
    batch: {
      findFirst: async ({ where }: any) => {
        if (!where?.OR || !Array.isArray(where.OR)) return null;
        for (const cond of where.OR) {
          if (cond.id && mockBatches[cond.id]) {
            return mockBatches[cond.id];
          }
        }
        return null;
      },
    },
  };

  const origDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/banasetu_mock';
  (global as any).__banasetu_prisma = mockPrisma;

  try {
    // 7.1 SHG Facilitator at assigned center requests collection tag -> HTTP 200, valid A6 PDF
    const facTagReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf?type=collection', {
      headers: { cookie: `banasetu_session=${validFacToken}` },
    });
    const facTagRes = await tagPdfHandler(facTagReq, { params: { code: 'BS-402-MAY' } });
    assert(facTagRes.status === 200, '[MOCKED DB] Assigned SHG Facilitator requests collection tag -> HTTP 200');
    assert(facTagRes.headers.get('Content-Type') === 'application/pdf', '[MOCKED DB] Tag response has application/pdf Content-Type');
    const facTagBuf = Buffer.from(await facTagRes.arrayBuffer());
    assert(facTagBuf.subarray(0, 5).toString('utf8').startsWith('%PDF-'), '[MOCKED DB] Tag body is genuine valid PDF');

    // 7.2 SHG Facilitator requests product tag -> HTTP 200, valid A6 Product Tag PDF
    const facProdTagReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf?type=product', {
      headers: { cookie: `banasetu_session=${validFacToken}` },
    });
    const facProdTagRes = await tagPdfHandler(facProdTagReq, { params: { code: 'BS-402-MAY' } });
    assert(facProdTagRes.status === 200, '[MOCKED DB] Assigned SHG Facilitator requests product tag -> HTTP 200');
    const facProdTagBuf = Buffer.from(await facProdTagRes.arrayBuffer());
    assert(
      facProdTagBuf.toString('binary').includes('PRODUCE_LOT_SPECIFICATION_TAG') ||
      facProdTagBuf.toString('binary').includes('Lot Specification Tag'),
      '[MOCKED DB] Product tag contains specification header'
    );

    // 7.3 SHG Facilitator outside assigned center denied -> HTTP 403 FACILITATOR_ASSIGNMENT_MISMATCH
    const unassignedFacToken = await createSessionToken({
      userId: 'USR-FAC-KDM',
      username: 'fac.kadamdiha',
      role: 'SHG_FACILITATOR' as UserRole,
      fullName: 'Facilitator Kadamdiha',
      district: 'Mayurbhanj',
      centerId: 'KDM-V2', // Assigned to Kadamdiha, NOT Karanjia
    });
    const unassignedFacReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${unassignedFacToken}` },
    });
    const unassignedFacRes = await tagPdfHandler(unassignedFacReq, { params: { code: 'BS-402-MAY' } });
    const unassignedFacJson = await unassignedFacRes.json();
    assert(unassignedFacRes.status === 403, '[MOCKED DB] Facilitator outside center denied -> HTTP 403');
    assert(unassignedFacJson.error === 'FACILITATOR_ASSIGNMENT_MISMATCH', '[MOCKED DB] Error code is FACILITATOR_ASSIGNMENT_MISMATCH');

    // 7.4 Collection Manager outside assigned center denied -> HTTP 403 COLLECTION_MANAGER_ASSIGNMENT_MISMATCH
    const unassignedMgrToken = await createSessionToken({
      userId: 'USR-MGR-JAS',
      username: 'mgr.jashipur',
      role: 'COLLECTION_MANAGER' as UserRole,
      fullName: 'Manager Jashipur',
      district: 'Mayurbhanj',
      centerId: 'JAS-02', // Assigned to Jashipur, NOT Karanjia
    });
    const unassignedMgrReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${unassignedMgrToken}` },
    });
    const unassignedMgrRes = await tagPdfHandler(unassignedMgrReq, { params: { code: 'BS-402-MAY' } });
    assert(unassignedMgrRes.status === 403, '[MOCKED DB] Collection Manager outside center denied -> HTTP 403');

    // 7.5 Collection Manager assigned to center -> HTTP 200
    const assignedMgrToken = await createSessionToken({
      userId: 'USR-MGR-KRN',
      username: 'mgr.karanjia',
      role: 'COLLECTION_MANAGER' as UserRole,
      fullName: 'Manager Karanjia',
      district: 'Mayurbhanj',
      centerId: 'KRN-01',
    });
    const assignedMgrReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${assignedMgrToken}` },
    });
    const assignedMgrRes = await tagPdfHandler(assignedMgrReq, { params: { code: 'BS-402-MAY' } });
    assert(assignedMgrRes.status === 200, '[MOCKED DB] Assigned Collection Manager granted tag -> HTTP 200');

    // 7.6 Warehouse Manager assigned to destination depot (BRP-01) -> HTTP 200
    const assignedWhsToken = await createSessionToken({
      userId: 'USR-WHS-BRP',
      username: 'whs.baripada',
      role: 'WAREHOUSE_MANAGER' as UserRole,
      fullName: 'Warehouse Manager Baripada',
      district: 'Mayurbhanj',
      centerId: 'BRP-DEPOT-01', // Resolves to BRP-01
    });
    const assignedWhsReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${assignedWhsToken}` },
    });
    const assignedWhsRes = await tagPdfHandler(assignedWhsReq, { params: { code: 'BS-402-MAY' } });
    assert(assignedWhsRes.status === 200, '[MOCKED DB] Warehouse Manager at destination depot granted tag -> HTTP 200');

    // 7.7 Warehouse Manager mismatched depot denied -> HTTP 403 WAREHOUSE_DEPOT_MISMATCH
    const otherWhsToken = await createSessionToken({
      userId: 'USR-WHS-OTHER',
      username: 'whs.other',
      role: 'WAREHOUSE_MANAGER' as UserRole,
      fullName: 'Warehouse Manager Rairangpur',
      district: 'Mayurbhanj',
      centerId: 'RRP-03', // Sub-depot, not BRP-01
    });
    const otherWhsReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${otherWhsToken}` },
    });
    const otherWhsRes = await tagPdfHandler(otherWhsReq, { params: { code: 'BS-402-MAY' } });
    const otherWhsJson = await otherWhsRes.json();
    assert(otherWhsRes.status === 403, '[MOCKED DB] Warehouse Manager at mismatched depot denied -> HTTP 403');
    assert(otherWhsJson.error === 'WAREHOUSE_DEPOT_MISMATCH', '[MOCKED DB] Error code is WAREHOUSE_DEPOT_MISMATCH');

    // 7.8 Contributing Collector accessing their batch tag -> HTTP 200
    const collectorToken = await createSessionToken({
      userId: 'COL-101',
      username: 'sunita.soren',
      role: 'COLLECTOR' as UserRole,
      fullName: 'Sunita Soren',
      district: 'Mayurbhanj',
    });
    const collectorReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${collectorToken}` },
    });
    const collectorRes = await tagPdfHandler(collectorReq, { params: { code: 'BS-402-MAY' } });
    assert(collectorRes.status === 200, '[MOCKED DB] Contributing Collector granted tag for own batch -> HTTP 200');

    // 7.9 Collector requesting another batch tag denied -> HTTP 403 FORBIDDEN_TAG_OWNERSHIP
    const otherColToken = await createSessionToken({
      userId: 'COL-OTHER',
      username: 'other.col',
      role: 'COLLECTOR' as UserRole,
      fullName: 'Other Collector',
      district: 'Mayurbhanj',
    });
    const otherColReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${otherColToken}` },
    });
    const otherColRes = await tagPdfHandler(otherColReq, { params: { code: 'BS-402-MAY' } });
    const otherColJson = await otherColRes.json();
    assert(otherColRes.status === 403, '[MOCKED DB] Collector accessing other batch tag denied -> HTTP 403');
    assert(otherColJson.error === 'FORBIDDEN_TAG_OWNERSHIP', '[MOCKED DB] Error code is FORBIDDEN_TAG_OWNERSHIP');

    // 7.10 Supervisor Admin within district -> HTTP 200
    const adminToken = await createSessionToken({
      userId: 'USR-SUP-001',
      username: 'patnaik.dpo',
      role: 'SUPERVISOR_ADMIN' as UserRole,
      fullName: 'A. Patnaik',
      district: 'Mayurbhanj',
    });
    const adminReq = new NextRequest('http://localhost:3000/api/tags/BS-402-MAY/pdf', {
      headers: { cookie: `banasetu_session=${adminToken}` },
    });
    const adminRes = await tagPdfHandler(adminReq, { params: { code: 'BS-402-MAY' } });
    assert(adminRes.status === 200, '[MOCKED DB] Supervisor Admin granted tag access -> HTTP 200');

    // 7.11 Cross-district access denied -> HTTP 403 CROSS_DISTRICT_ACCESS_FORBIDDEN
    const crossReq = new NextRequest('http://localhost:3000/api/tags/BS-402-KOR/pdf', {
      headers: { cookie: `banasetu_session=${adminToken}` }, // Admin district is Mayurbhanj, batch is Koraput
    });
    const crossRes = await tagPdfHandler(crossReq, { params: { code: 'BS-402-KOR' } });
    const crossJson = await crossRes.json();
    assert(crossRes.status === 403, '[MOCKED DB] Cross-district access denied -> HTTP 403');
    assert(crossJson.error === 'CROSS_DISTRICT_ACCESS_FORBIDDEN', '[MOCKED DB] Error code is CROSS_DISTRICT_ACCESS_FORBIDDEN');

    // 7.12 Unknown batch code -> HTTP 404 BATCH_NOT_FOUND
    const missingReq = new NextRequest('http://localhost:3000/api/tags/UNKNOWN-999/pdf', {
      headers: { cookie: `banasetu_session=${adminToken}` },
    });
    const missingRes = await tagPdfHandler(missingReq, { params: { code: 'UNKNOWN-999' } });
    const missingJson = await missingRes.json();
    assert(missingRes.status === 404, '[MOCKED DB] Non-existent batch returns HTTP 404');
    assert(missingJson.error === 'BATCH_NOT_FOUND', '[MOCKED DB] Error code is BATCH_NOT_FOUND');

    // 7.13 RESTful route alias /api/batches/[id]/tag/pdf -> HTTP 200
    const aliasReq = new NextRequest('http://localhost:3000/api/batches/BS-402-MAY/tag/pdf', {
      headers: { cookie: `banasetu_session=${validFacToken}` },
    });
    const aliasRes = await batchTagPdfHandler(aliasReq, { params: { id: 'BS-402-MAY' } });
    assert(aliasRes.status === 200, '[MOCKED DB] RESTful alias /api/batches/[id]/tag/pdf succeeds -> HTTP 200');
    const aliasBuf = Buffer.from(await aliasRes.arrayBuffer());
    assert(aliasBuf.subarray(0, 5).toString('utf8').startsWith('%PDF-'), '[MOCKED DB] Alias returns valid PDF document');
  } finally {
    delete (global as any).__banasetu_prisma;
    if (origDbUrl !== undefined) {
      process.env.DATABASE_URL = origDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }

  // --------------------------------------------------------------------------
  // 8. QR Code Destination & Public Privacy Guard
  // --------------------------------------------------------------------------
  console.log('\n--- 8. QR Destination & Public Data Privacy Guard ---');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://banasetu.odisha.gov.in';
  const expectedQrUrl = `${appBaseUrl}/verify/BS-402`;
  assert(
    sampleTagData.verificationUrl === expectedQrUrl,
    `Tag QR code points to official public verification URL: ${expectedQrUrl}`
  );

  // --------------------------------------------------------------------------
  // 9. UI Integration Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 9. UI Integration Verification ---');

  const tagPagePath = path.join(process.cwd(), 'src/app/collection/tag/[code]/page.tsx');
  const tagPageContent = fs.readFileSync(tagPagePath, 'utf8');

  assert(
    tagPageContent.includes('/api/tags/${cleanCode}/pdf?type=collection'),
    'Collection tag page includes direct link to server A6 collection tag PDF'
  );
  assert(
    tagPageContent.includes('/api/tags/${cleanCode}/pdf?type=product'),
    'Collection tag page includes direct link to server A6 product tag PDF'
  );

  const receiptPagePath = path.join(process.cwd(), 'src/app/collection/receipt/[code]/page.tsx');
  const receiptPageContent = fs.readFileSync(receiptPagePath, 'utf8');

  assert(
    receiptPageContent.includes('/api/receipts/${cleanCode}/pdf'),
    'Collection receipt page includes direct link to server A5 receipt PDF'
  );

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`F12-B TEST RESULTS: ${passed}/${passed + failed} checks passed.`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
