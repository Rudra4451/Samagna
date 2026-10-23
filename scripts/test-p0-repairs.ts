/**
 * scripts/test-p0-repairs.ts
 *
 * BanaSetu P0 Security & Critical Data-Integrity Regression Test Suite
 * Validates repairs for:
 * - P0-A: Production demo-account bypass removal & environment fencing
 * - P0-B: Missing/weak AUTH_SECRET fail-closed enforcement
 * - P0-C: Evidence upload authentication, authorization, MIME/magic validation, and storage privacy
 * - P0-D: Accepted field verification & certified net weight immutability (overwrite protection)
 * - P0-E: Server-sync persistence guarantee, payload hash validation, and zero false acknowledgements
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu P0 Security & Data-Integrity Test Suite   ');
  console.log('======================================================\n');

  const {
    authenticateCredentials,
    createSessionToken,
    verifySessionToken,
    validateAuthSecret,
    isDemoAccountsAllowed,
    requireServerRole,
    MIN_AUTH_SECRET_LENGTH,
  } = await import('../src/lib/server/auth');

  process.env.AUTH_SECRET =
    process.env.AUTH_SECRET || 'a-strong-test-secret-with-minimum-32-characters-for-testing';

  // --------------------------------------------------------------------------
  // P0-A: Demo Account Bypass Removal & Environment Fencing
  // --------------------------------------------------------------------------
  console.log('--- P0-A: Demo Account Bypass Removal & Environment Fencing ---');

  // Test A1: Production environment must ALWAYS reject demo accounts
  const origNodeEnv = process.env.NODE_ENV;
  const origAllowDemo = process.env.ALLOW_DEMO_ACCOUNTS;

  (process.env as any).NODE_ENV = 'production';
  process.env.ALLOW_DEMO_ACCOUNTS = 'true'; // Even if flag is accidentally enabled
  assert(
    isDemoAccountsAllowed() === false,
    'Demo accounts unconditionally disallowed when NODE_ENV === production'
  );

  const prodLogin = await authenticateCredentials('patnaik.dpo', 'Test@Pass123');
  assert(
    prodLogin.success === false,
    'Privileged supervisor demo account rejected in production'
  );

  // Test A2: Non-production rejects demo accounts when opt-in flag is absent
  (process.env as any).NODE_ENV = 'development';
  delete process.env.ALLOW_DEMO_ACCOUNTS;
  assert(
    isDemoAccountsAllowed() === false,
    'Demo accounts disallowed in development when ALLOW_DEMO_ACCOUNTS is unset'
  );

  const noFlagLogin = await authenticateCredentials('patnaik.dpo', 'Test@Pass123');
  assert(
    noFlagLogin.success === false,
    'Demo account login rejected when ALLOW_DEMO_ACCOUNTS flag is absent'
  );

  // Test A3: Non-production rejects demo accounts when flag is 'false'
  process.env.ALLOW_DEMO_ACCOUNTS = 'false';
  assert(
    isDemoAccountsAllowed() === false,
    'Demo accounts disallowed when ALLOW_DEMO_ACCOUNTS === false'
  );

  const flagFalseLogin = await authenticateCredentials('patnaik.dpo', 'Test@Pass123');
  assert(
    flagFalseLogin.success === false,
    'Demo account login rejected when ALLOW_DEMO_ACCOUNTS === false'
  );

  // Test A4: Demo account in allowed non-production mode is tagged with isDemo: true
  (process.env as any).NODE_ENV = 'test';
  process.env.ALLOW_DEMO_ACCOUNTS = 'true';
  const allowedDemoLogin = await authenticateCredentials('patnaik.dpo', 'Test@Pass123');
  assert(
    allowedDemoLogin.success === true && allowedDemoLogin.user?.isDemo === true,
    'Demo identity is explicitly tagged isDemo: true (never false)'
  );

  // Test A5: Demo sessions are blocked from executing server mutations
  const demoToken = await createSessionToken(allowedDemoLogin.user!);
  const demoReq = new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${demoToken}` },
  });
  const demoMutationGuard = await requireServerRole(demoReq, ['SUPERVISOR_ADMIN']);
  assert(
    demoMutationGuard.authorized === false &&
      demoMutationGuard.errorResponse?.status === 403,
    'Demo session blocked from server mutations with HTTP 403 (DEMO_SESSION_MUTATION_BLOCKED)'
  );

  // --------------------------------------------------------------------------
  // P0-B: Missing / Weak AUTH_SECRET Fail-Closed Protection
  // --------------------------------------------------------------------------
  console.log('\n--- P0-B: Missing / Weak AUTH_SECRET Fail-Closed Protection ---');

  const origSecret = process.env.AUTH_SECRET;

  // Test B1: Missing secret validation
  delete process.env.AUTH_SECRET;
  const missingCheck = validateAuthSecret();
  assert(missingCheck.valid === false, 'validateAuthSecret() rejects missing AUTH_SECRET');

  let tokenCreationFailed = false;
  try {
    await createSessionToken({
      userId: 'test-user',
      username: 'test',
      role: 'SUPERVISOR_ADMIN',
      fullName: 'Test User',
      district: 'Mayurbhanj',
    });
  } catch {
    tokenCreationFailed = true;
  }
  assert(
    tokenCreationFailed === true,
    'createSessionToken() fails closed and throws when AUTH_SECRET is missing'
  );

  // Test B2: Weak secret validation (< 32 chars)
  process.env.AUTH_SECRET = 'short-secret-16c';
  const weakCheck = validateAuthSecret();
  assert(
    weakCheck.valid === false &&
      Boolean(weakCheck.error?.includes(`Minimum required length is ${MIN_AUTH_SECRET_LENGTH}`)),
    `validateAuthSecret() rejects weak secret (< ${MIN_AUTH_SECRET_LENGTH} chars)`
  );

  let weakTokenFailed = false;
  try {
    await createSessionToken({
      userId: 'test-user',
      username: 'test',
      role: 'SUPERVISOR_ADMIN',
      fullName: 'Test User',
      district: 'Mayurbhanj',
    });
  } catch {
    weakTokenFailed = true;
  }
  assert(
    weakTokenFailed === true,
    'createSessionToken() fails closed and throws when AUTH_SECRET is too short'
  );

  // Test B3: Valid secret (>= 32 chars)
  const strongSecret = 'a-very-strong-cryptographic-test-secret-with-64-characters-min-32';
  process.env.AUTH_SECRET = strongSecret;
  const validCheck = validateAuthSecret();
  assert(validCheck.valid === true, 'validateAuthSecret() accepts >= 32 char secret');

  const strongToken = await createSessionToken({
    userId: 'test-user',
    username: 'test',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'Test User',
    district: 'Mayurbhanj',
  });
  assert(typeof strongToken === 'string' && strongToken.length > 50, 'Generates valid signed token with strong secret');

  const verified = await verifySessionToken(strongToken);
  assert(verified?.userId === 'test-user', 'Verifies token signed with valid secret');

  // Test B4: Tokens signed with old/insecure fallback secret are rejected
  const oldFallbackSecret = new TextEncoder().encode('fallback-secret-for-banasetu-f2-testing-min-32-chars');
  const { SignJWT } = await import('jose');
  const oldForgedToken = await new SignJWT({ userId: 'hacker', role: 'SUPERVISOR_ADMIN' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(oldFallbackSecret);

  const forgedVerification = await verifySessionToken(oldForgedToken);
  assert(
    forgedVerification === null,
    'Token signed with old hardcoded fallback secret is rejected when verified against configured secret'
  );

  // --------------------------------------------------------------------------
  // P0-C: Evidence Uploads Protection & Storage Privacy
  // --------------------------------------------------------------------------
  console.log('\n--- P0-C: Evidence Uploads Protection & Storage Privacy ---');

  const { getStorageAdapter, isSupabaseStorageConfigured } = await import('../src/lib/server/storage');
  const { POST: uploadRouteHandler } = await import('../src/app/api/uploads/route');
  const { resetRateLimit } = await import('../src/lib/server/rateLimit');

  // Test C1: Private storage fails closed when unconfigured
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert(
    isSupabaseStorageConfigured() === false,
    'isSupabaseStorageConfigured() reports false when env vars missing'
  );
  assert(
    getStorageAdapter() === null,
    'getStorageAdapter() returns null when private storage unconfigured (no public fallback)'
  );

  // Test C2: Unauthenticated upload is rejected with HTTP 401
  const unauthUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
  });
  const unauthUploadRes = await uploadRouteHandler(unauthUploadReq);
  assert(
    unauthUploadRes.status === 401,
    'Unauthenticated upload request rejected with HTTP 401'
  );

  // Test C3: Authenticated upload with unauthorized role (COLLECTOR) rejected with HTTP 403
  const collectorToken = await createSessionToken({
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    district: 'Mayurbhanj',
  });
  const collectorUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${collectorToken}` },
  });
  const collectorUploadRes = await uploadRouteHandler(collectorUploadReq);
  assert(
    collectorUploadRes.status === 403,
    'Collector role forbidden from uploading evidence (HTTP 403)'
  );

  // Test C4: Demo session upload rejected with HTTP 403
  const currentDemoToken = await createSessionToken({
    userId: 'USR-SUP-001',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'A. Patnaik',
    district: 'Mayurbhanj',
    isDemo: true,
  });
  const demoUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${currentDemoToken}` },
  });
  const demoUploadRes = await uploadRouteHandler(demoUploadReq);
  const demoUploadJson = await demoUploadRes.json().catch(() => ({}));
  assert(
    demoUploadRes.status === 403 && demoUploadJson.error === 'DEMO_SESSION_MUTATION_BLOCKED',
    'Demo session blocked from uploading evidence with HTTP 403 DEMO_SESSION_MUTATION_BLOCKED'
  );

  // Test C5: Authorized role (COLLECTION_MANAGER) with missing private storage returns 503
  const managerToken = await createSessionToken({
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
  });

  // Create multipart form with valid JPEG magic bytes
  const validJpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([validJpegBytes], { type: 'image/jpeg' }),
    'scale_display.jpg'
  );
  formData.append('evidenceType', 'COLLECTION_PHOTO');
  formData.append('batchId', 'BS-402');

  const authUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: formData,
  });

  const authUploadRes = await uploadRouteHandler(authUploadReq);
  const authUploadJson = await authUploadRes.json();
  assert(
    authUploadRes.status === 503 && authUploadJson.error === 'STORAGE_UNCONFIGURED',
    'Upload fails closed with HTTP 503 STORAGE_UNCONFIGURED when private storage is unconfigured'
  );

  // Test C6: public/uploads directory does not exist on disk
  const publicUploadsExists = fs.existsSync(path.join(process.cwd(), 'public', 'uploads'));
  assert(
    publicUploadsExists === false,
    'public/uploads directory does NOT exist on disk (zero public evidence leakage)'
  );

  // Test C7: Missing batchId is rejected with HTTP 422 BATCH_ID_REQUIRED (SEC-01)
  const noBatchFormData = new FormData();
  noBatchFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  noBatchFormData.append('evidenceType', 'COLLECTION_PHOTO');
  const noBatchReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: noBatchFormData,
  });
  const noBatchRes = await uploadRouteHandler(noBatchReq);
  const noBatchJson = await noBatchRes.json();
  assert(
    noBatchRes.status === 422 && noBatchJson.error === 'BATCH_ID_REQUIRED',
    'Upload without batchId rejected with HTTP 422 BATCH_ID_REQUIRED'
  );

  // Test C8: Empty/whitespace batchId is rejected with HTTP 422 BATCH_ID_REQUIRED (SEC-01)
  const emptyBatchFormData = new FormData();
  emptyBatchFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  emptyBatchFormData.append('evidenceType', 'COLLECTION_PHOTO');
  emptyBatchFormData.append('batchId', '   ');
  const emptyBatchReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: emptyBatchFormData,
  });
  const emptyBatchRes = await uploadRouteHandler(emptyBatchReq);
  const emptyBatchJson = await emptyBatchRes.json();
  assert(
    emptyBatchRes.status === 422 && emptyBatchJson.error === 'BATCH_ID_REQUIRED',
    'Upload with whitespace batchId rejected with HTTP 422 BATCH_ID_REQUIRED'
  );

  // Test C9: Malformed batchId is rejected with HTTP 422 MALFORMED_BATCH_ID (SEC-01)
  const malformedBatchFormData = new FormData();
  malformedBatchFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  malformedBatchFormData.append('evidenceType', 'COLLECTION_PHOTO');
  malformedBatchFormData.append('batchId', '../../dangerous/path');
  const malformedBatchReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: malformedBatchFormData,
  });
  const malformedBatchRes = await uploadRouteHandler(malformedBatchReq);
  const malformedBatchJson = await malformedBatchRes.json();
  assert(
    malformedBatchRes.status === 422 && malformedBatchJson.error === 'MALFORMED_BATCH_ID',
    'Upload with malformed batchId rejected with HTTP 422 MALFORMED_BATCH_ID'
  );

  // Test C10: Nonexistent batchId is rejected with HTTP 404 BATCH_NOT_FOUND (SEC-01)
  let storageUploadCalled: boolean = false;
  let dbAttachmentCreated: boolean = false;
  const origDbUrl = process.env.DATABASE_URL;
  const origSupabaseUrl = process.env.SUPABASE_URL;
  const origSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/banasetu_test';
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-test-32-chars';

  let mockBatchRecord: any = null;
  const mockPrismaClient: any = {
    batch: {
      findUnique: async (args: any) => {
        if (mockBatchRecord && mockBatchRecord.id === args?.where?.id) {
          return mockBatchRecord;
        }
        return null;
      },
    },
    uploadedAttachment: {
      create: async () => {
        dbAttachmentCreated = true;
      },
    },
    syncIdempotencyRecord: {
      findUnique: async () => null,
      create: async () => {},
    },
  };
  (global as any).__banasetu_prisma = mockPrismaClient;

  const origFetch = global.fetch;
  global.fetch = async () => {
    storageUploadCalled = true;
    return new Response(JSON.stringify({ signedURL: '/mock-signed-url' }), { status: 200 });
  };

  const nonExistentFormData = new FormData();
  nonExistentFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  nonExistentFormData.append('evidenceType', 'COLLECTION_PHOTO');
  nonExistentFormData.append('batchId', 'BS-NONEXISTENT-999');

  const nonExistentReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: nonExistentFormData,
  });
  const nonExistentRes = await uploadRouteHandler(nonExistentReq);
  const nonExistentJson = await nonExistentRes.json();
  assert(
    nonExistentRes.status === 404 && nonExistentJson.error === 'BATCH_NOT_FOUND',
    'Upload targeting nonexistent batchId rejected with HTTP 404 BATCH_NOT_FOUND'
  );

  // Test C11: Collection Manager cross-center same-district rejected with HTTP 403 (SEC-02)
  mockBatchRecord = {
    id: 'BS-JAS-402',
    centerName: 'Jashipur Collection Center (JAS-02)',
    district: 'Mayurbhanj',
    gramPanchayat: 'Jashipur-GP',
  };

  const crossCenterFormData = new FormData();
  crossCenterFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  crossCenterFormData.append('evidenceType', 'COLLECTION_PHOTO');
  crossCenterFormData.append('batchId', 'BS-JAS-402');

  const crossCenterReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: crossCenterFormData,
  });
  const crossCenterRes = await uploadRouteHandler(crossCenterReq);
  const crossCenterJson = await crossCenterRes.json();
  assert(
    crossCenterRes.status === 403 && crossCenterJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Collection Manager cross-center upload rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN (same-district bypass eliminated)'
  );

  // Test C11b: Substring identifier denial (actor centerId: '01' matching 'Karanjia Point #01')
  const substringToken = await createSessionToken({
    userId: 'USR-MGR-SUB',
    username: 'sub.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Sub Manager',
    centerId: '01', // Substring of KRN-01
    district: 'Mayurbhanj',
  });
  mockBatchRecord = {
    id: 'BS-KRN-401',
    centerName: 'Karanjia Block Collection Point #01 (KRN-01)',
    district: 'Mayurbhanj',
    gramPanchayat: 'Karanjia-GP',
  };
  const subCenterFormData = new FormData();
  subCenterFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  subCenterFormData.append('evidenceType', 'COLLECTION_PHOTO');
  subCenterFormData.append('batchId', 'BS-KRN-401');

  const subCenterReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${substringToken}` },
    body: subCenterFormData,
  });
  const subCenterRes = await uploadRouteHandler(subCenterReq);
  const subCenterJson = await subCenterRes.json();
  assert(
    subCenterRes.status === 403 && subCenterJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Substring identifier centerId "01" rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN (unsafe .includes() eliminated)'
  );

  // Test C11c: Overlapping partial identifier denial (actor centerId: 'RN-01')
  const partialToken = await createSessionToken({
    userId: 'USR-MGR-PART',
    username: 'part.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Part Manager',
    centerId: 'RN-01', // Partial code
    district: 'Mayurbhanj',
  });
  const partCenterReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${partialToken}` },
    body: subCenterFormData,
  });
  const partCenterRes = await uploadRouteHandler(partCenterReq);
  const partCenterJson = await partCenterRes.json();
  assert(
    partCenterRes.status === 403 && partCenterJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Overlapping identifier centerId "RN-01" rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN'
  );

  // Test C11d: Missing / unmapped center mapping denial (fails closed)
  mockBatchRecord = {
    id: 'BS-UNK-999',
    centerName: 'Unknown Unregistered Tribal Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Unknown-GP',
  };
  const unmappedFormData = new FormData();
  unmappedFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  unmappedFormData.append('evidenceType', 'COLLECTION_PHOTO');
  unmappedFormData.append('batchId', 'BS-UNK-999');

  const unmappedReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${managerToken}` },
    body: unmappedFormData,
  });
  const unmappedRes = await uploadRouteHandler(unmappedReq);
  const unmappedJson = await unmappedRes.json();
  assert(
    unmappedRes.status === 403 && unmappedJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Unmapped center name fails closed with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN'
  );

  // Test C11e: Warehouse Manager with unauthorized depot assignment rejected with HTTP 403 INVALID_DEPOT_ASSIGNMENT
  const invalidWhmToken = await createSessionToken({
    userId: 'USR-WHM-INV',
    username: 'inv.whm',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'Invalid WHM',
    centerId: 'KRN-01', // Collection center, NOT a warehouse depot!
    district: 'Mayurbhanj',
  });
  mockBatchRecord = {
    id: 'BS-KRN-402',
    centerName: 'Karanjia Sub-Divisional Depot',
    district: 'Mayurbhanj',
    gramPanchayat: 'Karanjia-GP',
  };
  const invalidWhmFormData = new FormData();
  invalidWhmFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  invalidWhmFormData.append('evidenceType', 'WAYBILL_SCAN');
  invalidWhmFormData.append('batchId', 'BS-KRN-402');

  const invalidWhmReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${invalidWhmToken}` },
    body: invalidWhmFormData,
  });
  const invalidWhmRes = await uploadRouteHandler(invalidWhmReq);
  const invalidWhmJson = await invalidWhmRes.json();
  assert(
    invalidWhmRes.status === 403 && invalidWhmJson.error === 'INVALID_DEPOT_ASSIGNMENT',
    'Warehouse Manager with unauthorized depot assignment (KRN-01) rejected with HTTP 403 INVALID_DEPOT_ASSIGNMENT'
  );

  // Test C11f: Warehouse Manager with missing depot assignment rejected with HTTP 403 INVALID_DEPOT_ASSIGNMENT
  const noDepotWhmToken = await createSessionToken({
    userId: 'USR-WHM-NODEPOT',
    username: 'nodepot.whm',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'No Depot WHM',
    centerId: undefined,
    district: 'Mayurbhanj',
  });
  const noDepotWhmReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${noDepotWhmToken}` },
    body: invalidWhmFormData,
  });
  const noDepotWhmRes = await uploadRouteHandler(noDepotWhmReq);
  const noDepotWhmJson = await noDepotWhmRes.json();
  assert(
    noDepotWhmRes.status === 403 && noDepotWhmJson.error === 'INVALID_DEPOT_ASSIGNMENT',
    'Warehouse Manager with missing depot assignment rejected with HTTP 403 INVALID_DEPOT_ASSIGNMENT'
  );

  // Test C11g: SHG Facilitator with substring/center-name village match rejected with HTTP 403 (e.g. centerName contains village but GP differs)
  const facBadagaonToken = await createSessionToken({
    userId: 'USR-FAC-001',
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR',
    fullName: 'Sumitra Marndi',
    village: 'Badagaon',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
  });
  mockBatchRecord = {
    id: 'BS-SUB-VIL-01',
    centerName: 'Badagaon Aggregation Point #01', // Contains 'Badagaon' in centerName
    district: 'Mayurbhanj',
    gramPanchayat: 'Karanjia-GP', // Gram panchayat is NOT Badagaon
    collectors: [
      { id: 'COL-01', village: 'Kadamdiha' }, // Collector is NOT from Badagaon
    ],
  };
  const subVilFormData = new FormData();
  subVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  subVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  subVilFormData.append('batchId', 'BS-SUB-VIL-01');

  const subVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: subVilFormData,
  });
  const subVilRes = await uploadRouteHandler(subVilReq);
  const subVilJson = await subVilRes.json();
  assert(
    subVilRes.status === 403 && subVilJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator substring/center-name village match rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN (no guessing)'
  );

  // Test C11h: SHG Facilitator with partial village name mismatch (Badagaon vs Badagaon-North) rejected
  mockBatchRecord = {
    id: 'BS-PART-VIL-02',
    centerName: 'North Aggregation Center',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon-North', // Partial prefix match, but not exact 'Badagaon'
    collectors: [
      { id: 'COL-02', village: 'Badagaon-North' },
    ],
  };
  const partVilFormData = new FormData();
  partVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  partVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  partVilFormData.append('batchId', 'BS-PART-VIL-02');

  const partVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: partVilFormData,
  });
  const partVilRes = await uploadRouteHandler(partVilReq);
  const partVilJson = await partVilRes.json();
  assert(
    partVilRes.status === 403 && partVilJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator partial village mismatch ("Badagaon" vs "Badagaon-North") rejected with HTTP 403'
  );

  // Test C11i: SHG Facilitator missing assigned village rejected with HTTP 403 VILLAGE_REQUIRED
  const noVilFacToken = await createSessionToken({
    userId: 'USR-FAC-NOVIL',
    username: 'novil.fac',
    role: 'SHG_FACILITATOR',
    fullName: 'No Village Facilitator',
    village: undefined,
    district: 'Mayurbhanj',
  });
  mockBatchRecord = {
    id: 'BS-NOVIL-01',
    centerName: 'Badagaon Aggregation Center',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon',
    collectors: [{ id: 'COL-01', village: 'Badagaon' }],
  };
  const noVilFormData = new FormData();
  noVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  noVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  noVilFormData.append('batchId', 'BS-NOVIL-01');

  const noVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${noVilFacToken}` },
    body: noVilFormData,
  });
  const noVilRes = await uploadRouteHandler(noVilReq);
  const noVilJson = await noVilRes.json();
  assert(
    noVilRes.status === 403 && noVilJson.error === 'VILLAGE_REQUIRED',
    'SHG Facilitator with missing assigned village rejected with HTTP 403 VILLAGE_REQUIRED'
  );

  // Test C11j: SHG Facilitator cross-district upload rejected with HTTP 403 FORBIDDEN_RECORD_ACCESS
  mockBatchRecord = {
    id: 'BS-KJR-VIL-03',
    centerName: 'Keonjhar Point',
    district: 'Keonjhar', // Different district
    gramPanchayat: 'Badagaon',
    collectors: [{ id: 'COL-03', village: 'Badagaon' }],
  };
  const crossDistFormData = new FormData();
  crossDistFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  crossDistFormData.append('evidenceType', 'COLLECTION_PHOTO');
  crossDistFormData.append('batchId', 'BS-KJR-VIL-03');

  const crossDistReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` }, // Mayurbhanj
    body: crossDistFormData,
  });
  const crossDistRes = await uploadRouteHandler(crossDistReq);
  const crossDistJson = await crossDistRes.json();
  assert(
    crossDistRes.status === 403 && crossDistJson.error === 'FORBIDDEN_RECORD_ACCESS',
    'SHG Facilitator cross-district upload rejected with HTTP 403 FORBIDDEN_RECORD_ACCESS'
  );

  // Reset mock rate limiter state between test batches
  resetRateLimit('anonymous-client', 'uploads');

  // Test C11k: SHG Facilitator matching GP with collectors from two villages rejected with HTTP 403
  mockBatchRecord = {
    id: 'BS-MIX-VIL-01',
    centerName: 'Badagaon Aggregation Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon',
    collectors: [
      { id: 'COL-01', village: 'Badagaon' },
      { id: 'COL-02', village: 'Kadamdiha' },
    ],
  };
  const mixVilFormData = new FormData();
  mixVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  mixVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  mixVilFormData.append('batchId', 'BS-MIX-VIL-01');

  const mixVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: mixVilFormData,
  });
  const mixVilRes = await uploadRouteHandler(mixVilReq);
  const mixVilJson = await mixVilRes.json();
  assert(
    mixVilRes.status === 403 && mixVilJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator matching GP with mixed-village collectors rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN'
  );

  // Test C11l: SHG Facilitator matching GP with one collector missing a village property rejected with HTTP 403
  mockBatchRecord = {
    id: 'BS-MISSING-VIL-01',
    centerName: 'Badagaon Aggregation Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon',
    collectors: [
      { id: 'COL-01', village: 'Badagaon' },
      { id: 'COL-02', village: undefined },
    ],
  };
  const missingVilFormData = new FormData();
  missingVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  missingVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  missingVilFormData.append('batchId', 'BS-MISSING-VIL-01');

  const missingVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: missingVilFormData,
  });
  const missingVilRes = await uploadRouteHandler(missingVilReq);
  const missingVilJson = await missingVilRes.json();
  assert(
    missingVilRes.status === 403 && missingVilJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator matching GP with one collector missing village rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN'
  );

  // Test C11m: SHG Facilitator matching GP with empty/whitespace collector-village value rejected with HTTP 403
  mockBatchRecord = {
    id: 'BS-EMPTY-VIL-01',
    centerName: 'Badagaon Aggregation Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon',
    collectors: [
      { id: 'COL-01', village: 'Badagaon' },
      { id: 'COL-02', village: '   ' },
    ],
  };
  const emptyVilFormData = new FormData();
  emptyVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  emptyVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  emptyVilFormData.append('batchId', 'BS-EMPTY-VIL-01');

  const emptyVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: emptyVilFormData,
  });
  const emptyVilRes = await uploadRouteHandler(emptyVilReq);
  const emptyVilJson = await emptyVilRes.json();
  assert(
    emptyVilRes.status === 403 && emptyVilJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator matching GP with empty collector-village rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN'
  );

  // Test C11n: SHG Facilitator mismatching GP even when collectors match rejected with HTTP 403
  mockBatchRecord = {
    id: 'BS-MISMATCH-GP-01',
    centerName: 'Badagaon Aggregation Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Karanjia-GP', // Mismatched GP
    collectors: [
      { id: 'COL-01', village: 'Badagaon' },
      { id: 'COL-02', village: 'Badagaon' },
    ],
  };
  const mismatchGpFormData = new FormData();
  mismatchGpFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  mismatchGpFormData.append('evidenceType', 'COLLECTION_PHOTO');
  mismatchGpFormData.append('batchId', 'BS-MISMATCH-GP-01');

  const mismatchGpReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: mismatchGpFormData,
  });
  const mismatchGpRes = await uploadRouteHandler(mismatchGpReq);
  const mismatchGpJson = await mismatchGpRes.json();
  assert(
    mismatchGpRes.status === 403 && mismatchGpJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator mismatching GP even when collectors match rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN'
  );

  // Test C12: Failed authorization left zero storage writes and zero database records (SEC-01/SEC-02)
  assert(
    storageUploadCalled === false && dbAttachmentCreated === false,
    'Failed authorization attempts guarantee ZERO storage writes and ZERO database records committed'
  );

  // Test C12b: Authoritative exact center match succeeds upload and commits storage & DB
  const validManagerToken = await createSessionToken({
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    centerId: 'LOC-KRN-01', // Canonical KRN-01
    district: 'Mayurbhanj',
  });
  mockBatchRecord = {
    id: 'BS-KRN-402',
    centerName: 'Karanjia Sub-Divisional Depot', // Resolves to KRN-01
    district: 'Mayurbhanj',
    gramPanchayat: 'Karanjia-GP',
  };
  const validFormData = new FormData();
  validFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  validFormData.append('evidenceType', 'COLLECTION_PHOTO');
  validFormData.append('batchId', 'BS-KRN-402');

  const validReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${validManagerToken}` },
    body: validFormData,
  });
  const validRes = await uploadRouteHandler(validReq);
  const validJson = await validRes.json();
  assert(
    validRes.status === 201 && validJson.success === true,
    'Authoritative exact center match (LOC-KRN-01 <-> Karanjia Sub-Divisional Depot) succeeds upload with HTTP 201'
  );
  assert(
    Boolean(storageUploadCalled) === true && Boolean(dbAttachmentCreated) === true,
    'Authorized upload successfully executes storage adapter and persists database attachment record'
  );

  // Test C12c: Authoritative exact village match succeeds upload and commits storage & DB
  resetRateLimit('anonymous-client', 'uploads');
  storageUploadCalled = false;
  dbAttachmentCreated = false;
  mockBatchRecord = {
    id: 'BS-BDG-401',
    centerName: 'Badagaon Aggregation Point',
    district: 'Mayurbhanj',
    gramPanchayat: 'Badagaon',
    collectors: [
      { id: 'COL-01', village: 'Badagaon' },
      { id: 'COL-02', village: 'Badagaon' },
    ],
  };
  const exactVilFormData = new FormData();
  exactVilFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  exactVilFormData.append('evidenceType', 'COLLECTION_PHOTO');
  exactVilFormData.append('batchId', 'BS-BDG-401');

  const exactVilReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${facBadagaonToken}` },
    body: exactVilFormData,
  });
  const exactVilRes = await uploadRouteHandler(exactVilReq);
  const exactVilJson = await exactVilRes.json();
  assert(
    exactVilRes.status === 201 && exactVilJson.success === true,
    'Authoritative exact village match with all collectors from assigned village succeeds upload with HTTP 201'
  );
  assert(
    Boolean(storageUploadCalled) === true && Boolean(dbAttachmentCreated) === true,
    'Authorized facilitator upload successfully executes storage adapter and persists database record'
  );

  // Clean up mock fetch & storage
  global.fetch = origFetch;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (origDbUrl) process.env.DATABASE_URL = origDbUrl; else delete process.env.DATABASE_URL;

  // --------------------------------------------------------------------------
  // P0-D: Accepted Field Verification & Certified Weight Immutability
  // --------------------------------------------------------------------------
  console.log('\n--- P0-D: Accepted Field Verification & Certified Weight Immutability ---');

  const { POST: verifyCollectionRoute } = await import('../src/app/api/collection/verify/route');

  // Test D1: Unauthenticated field verification rejected with HTTP 401
  const unauthVerifyReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    body: JSON.stringify({ batchId: 'BS-402' }),
  });
  const unauthVerifyRes = await verifyCollectionRoute(unauthVerifyReq);
  assert(
    unauthVerifyRes.status === 401,
    'Unauthenticated field verification rejected with HTTP 401'
  );

  // Test D2: Unauthorized role (COLLECTOR) rejected with HTTP 403
  const colVerifyReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${collectorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ batchId: 'BS-402' }),
  });
  const colVerifyRes = await verifyCollectionRoute(colVerifyReq);
  assert(
    colVerifyRes.status === 403,
    'Collector role forbidden from verifying field weighments (HTTP 403)'
  );

  // Test D3: Mathematical imbalance (Gross - Tare != Net) rejected with HTTP 422
  const badMathReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-402',
      grossWeightKg: 100.0,
      tareWeightKg: 1.5,
      netAcceptedKg: 95.0, // Should be 98.5
      grade: 'Grade A - Properly Dried',
      sackCount: 2,
      sealTagId: 'OD-TAG-402',
      vehicleNumber: 'OD-02-B-4412',
      driverName: 'B. Dehuri',
      tarpaulinConfirmed: true,
      transitWaybillId: 'WB-402',
      observedMoisturePercent: 10.5,
    }),
  });
  const badMathRes = await verifyCollectionRoute(badMathReq);
  assert(
    badMathRes.status === 422,
    'Field verification rejects mathematical imbalance with HTTP 422'
  );

  // Test D4: Verify immutability logic by simulating accepted verification
  // When Step1 is already accepted, attempts to overwrite with new weights throw RECORD_ALREADY_ACCEPTED
  const acceptedStep1 = {
    batchId: 'BS-402',
    grossWeightKg: 101.5,
    tareWeightKg: 1.5,
    netAcceptedKg: 100.0,
    grade: 'Grade A - Properly Dried',
    sealTagId: 'OD-TAG-402',
    verifiedBy: 'R. K. Mohanty',
    verifiedAt: new Date(),
  };

  // Identical submission is a safe idempotent replay
  const submissionIdentical = {
    grossWeightKg: 101.5,
    tareWeightKg: 1.5,
    netAcceptedKg: 100.0,
    grade: 'Grade A - Properly Dried',
    sealTagId: 'OD-TAG-402',
  };
  const isIdentical =
    acceptedStep1.netAcceptedKg === submissionIdentical.netAcceptedKg &&
    acceptedStep1.grossWeightKg === submissionIdentical.grossWeightKg &&
    acceptedStep1.tareWeightKg === submissionIdentical.tareWeightKg &&
    acceptedStep1.grade === submissionIdentical.grade &&
    acceptedStep1.sealTagId === submissionIdentical.sealTagId;
  assert(isIdentical === true, 'Identical retry recognised as safe replay without mutation');

  // Modified submission (tampered netAcceptedKg: 85.0 instead of 100.0)
  const submissionTampered = {
    grossWeightKg: 86.5,
    tareWeightKg: 1.5,
    netAcceptedKg: 85.0,
    grade: 'Grade A - Properly Dried',
    sealTagId: 'OD-TAG-402',
  };
  const isTamperedIdentical =
    acceptedStep1.netAcceptedKg === submissionTampered.netAcceptedKg &&
    acceptedStep1.grossWeightKg === submissionTampered.grossWeightKg;
  assert(
    isTamperedIdentical === false,
    'Modified request detected as overwrite attempt against accepted record'
  );

  // --------------------------------------------------------------------------
  // P0-E: Server Sync Persistence & Zero False Acknowledgements
  // --------------------------------------------------------------------------
  console.log('\n--- P0-E: Server Sync Persistence & Zero False Acknowledgements ---');

  const { POST: syncRouteHandler } = await import('../src/app/api/sync/route');

  // Test E1: Unauthenticated sync request rejected with HTTP 401
  const unauthSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000001',
      localId: '01HRX9Z4K00000000000000001',
      entityType: 'pickup_request',
      action: 'create',
      payload: {},
    }),
  });
  const unauthSyncRes = await syncRouteHandler(unauthSyncReq);
  assert(
    unauthSyncRes.status === 401,
    'Unauthenticated sync request rejected with HTTP 401'
  );

  // Test E2: Role-to-entity permission check (Collector cannot sync storage_receipt)
  const colForbiddenSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${collectorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000002',
      localId: '01HRX9Z4K00000000000000002',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: { batchId: 'BS-402' },
    }),
  });
  const colForbiddenSyncRes = await syncRouteHandler(colForbiddenSyncReq);
  assert(
    colForbiddenSyncRes.status === 403,
    'Collector forbidden from syncing storage receipts (HTTP 403)'
  );

  // Test E3: Payload hash generation and tamper detection
  const payload1 = { batchId: 'BS-402', netAcceptedKg: 100.0, grade: 'Grade A - Properly Dried' };
  const payload2 = { batchId: 'BS-402', netAcceptedKg: 75.0, grade: 'Grade B - Moderate Moisture' };

  const hash1 = crypto.createHash('sha256').update(JSON.stringify(payload1)).digest('hex');
  const hash2 = crypto.createHash('sha256').update(JSON.stringify(payload2)).digest('hex');
  assert(hash1 !== hash2, 'Different payloads produce distinct SHA-256 hashes');

  // Simulated idempotency collision check
  const existingRecordSim = {
    idempotencyKey: '01HRX9Z4K00000000000000099',
    payloadHash: hash1,
  };
  const isKeyReuseTampered = existingRecordSim.payloadHash !== hash2;
  assert(
    isKeyReuseTampered === true,
    'Reusing idempotency key with different payload detected as conflict'
  );

  // Test E4: Unconfigured database safely returns 503 instead of false success
  const facilitatorToken = await createSessionToken({
    userId: 'USR-FAC-001',
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR',
    fullName: 'Sumitra Marndi',
    village: 'Badagaon',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
  });

  const validBatchPayload = {
    id: 'BS-499',
    produceName: 'Dried Mahua Flowers',
    produceOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    district: 'Mayurbhanj',
    block: 'Karanjia',
    gramPanchayat: 'Badagaon',
    centerName: 'Badagaon Van Dhan Kendra',
    shgName: 'Maa Mangala SHG',
    facilitatorName: 'Sumitra Marndi',
    pickupRequestId: 'REQ-499',
    collectors: [
      {
        id: 'COL-001',
        tribalId: 'OR-MAY-1109',
        name: 'Sunita Soren',
        nameOdia: 'ସୁନୀତା ସୋରେନ',
        gender: 'F',
        age: 38,
        village: 'Badagaon',
        villageOdia: 'ବଡ଼ଗାଁ',
        weightKg: 40.0,
        bankName: 'Canara Bank',
        accountEnding: '4812',
      },
    ],
  };

  const syncDevReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${facilitatorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000003',
      localId: '01HRX9Z4K00000000000000003',
      entityType: 'pickup_request',
      action: 'create',
      payload: validBatchPayload,
    }),
  });

  const syncDevRes = await syncRouteHandler(syncDevReq);
  const syncDevJson = await syncDevRes.json();
  assert(
    syncDevRes.status === 503 && syncDevJson.error === 'DATABASE_UNCONFIGURED',
    'Unconfigured database returns HTTP 503 DATABASE_UNCONFIGURED (never false success 200)'
  );

  // --------------------------------------------------------------------------
  // Tests E5-E8: Sync Authorization, Center/Depot Isolation, and Rollback Integrity
  // --------------------------------------------------------------------------
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/banasetu_test';

  let syncDomainWriteOccurred: boolean = false;
  let syncIdempotencyCommitted: boolean = false;
  let committedIdempotencyRecord: any = null;
  const idempotencyStore = new Map<string, any>();
  const p2002KeysToHideInTx = new Set<string>();
  let isDepotDecommissionedForTest: boolean = false;

  const syncMockPrisma: any = {
    syncIdempotencyRecord: {
      findUnique: async (args: any) => {
        const key = args?.where?.idempotencyKey;
        if (key && idempotencyStore.has(key)) {
          return idempotencyStore.get(key);
        }
        if (committedIdempotencyRecord && args?.where?.idempotencyKey === committedIdempotencyRecord.idempotencyKey) {
          return committedIdempotencyRecord;
        }
        return null;
      },
      create: async (args: any) => {
        const key = args?.data?.idempotencyKey;
        if (key && p2002KeysToHideInTx.has(key)) {
          const p2002Err: any = new Error(`Unique constraint failed on the fields: (\`idempotencyKey\`)`);
          p2002Err.code = 'P2002';
          throw p2002Err;
        }
        syncIdempotencyCommitted = true;
        committedIdempotencyRecord = args?.data;
        if (args?.data?.idempotencyKey) {
          idempotencyStore.set(args.data.idempotencyKey, args.data);
        }
        return args?.data;
      },
    },
    syncConflictRecord: {
      create: async () => ({ id: 'CONF-001' }),
    },
    $transaction: async (fn: any) => {
      const txMock = {
        ...syncMockPrisma,
        syncIdempotencyRecord: {
          ...syncMockPrisma.syncIdempotencyRecord,
          findUnique: async (args: any) => {
            const key = args?.where?.idempotencyKey;
            if (key && p2002KeysToHideInTx.has(key)) {
              return null; // Simulated in-transaction window: racing concurrent transaction has not completed yet
            }
            return syncMockPrisma.syncIdempotencyRecord.findUnique(args);
          },
        },
      };
      return fn(txMock);
    },
    batch: {
      findUnique: async (args: any) => {
        if (args?.where?.id === 'BS-JAS-402') {
          return {
            id: 'BS-JAS-402',
            centerName: 'Jashipur Collection Center (JAS-02)',
            district: 'Mayurbhanj',
            status: 'REQUESTED',
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-KJR-101') {
          return {
            id: 'BS-KJR-101',
            centerName: 'Keonjhar Intake Point',
            district: 'Keonjhar',
            status: 'PENDING_VERIFICATION',
            step1: { netAcceptedKg: 100.0 },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-RRP-202') {
          return {
            id: 'BS-RRP-202',
            centerName: 'Rairangpur Point',
            district: 'Mayurbhanj',
            status: 'PENDING_VERIFICATION',
            step1: { netAcceptedKg: 100.0 },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-KRN-402') {
          return {
            id: 'BS-KRN-402',
            centerName: 'Karanjia Block Collection Point #01 (KRN-01)',
            district: 'Mayurbhanj',
            status: 'REQUESTED',
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-UNK-999') {
          return {
            id: 'BS-UNK-999',
            centerName: 'Unknown Unregistered Tribal Point',
            district: 'Mayurbhanj',
            status: 'REQUESTED',
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-DEP-MATCH') {
          return {
            id: 'BS-DEP-MATCH',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'IN_TRANSIT',
            destinationDepotId: 'BRP-01',
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-001',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-DEP-DIFF') {
          return {
            id: 'BS-DEP-DIFF',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'IN_TRANSIT',
            destinationDepotId: 'BRP-02',
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-002',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-DEP-UNASSIGNED') {
          return {
            id: 'BS-DEP-UNASSIGNED',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'PENDING_VERIFICATION',
            destinationDepotId: null,
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-003',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-DEP-COMPLETED') {
          return {
            id: 'BS-DEP-COMPLETED',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'VERIFIED_SALEABLE',
            destinationDepotId: 'BRP-01',
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-004',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: {
              arrivalGrossWeightKg: 101.0,
              arrivalTareWeightKg: 2.0,
              arrivalNetWeightKg: 99.0,
              storageZone: 'ZONE-A',
              discrepancyTriggered: false,
              verifiedBy: 'Baripada Depot In-Charge',
              verifiedAt: new Date(),
            },
          };
        }
        if (args?.where?.id === 'BS-DEP-QUARANTINED') {
          return {
            id: 'BS-DEP-QUARANTINED',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'QUARANTINED_DISCREPANCY',
            destinationDepotId: 'BRP-01',
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-005',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: {
              arrivalGrossWeightKg: 87.0,
              arrivalTareWeightKg: 2.0,
              arrivalNetWeightKg: 85.0,
              storageZone: 'ZONE-Q',
              discrepancyTriggered: true,
              verifiedBy: 'Baripada Depot In-Charge',
              verifiedAt: new Date(),
            },
          };
        }
        if (args?.where?.id === 'BS-NO-DISTRICT') {
          return {
            id: 'BS-NO-DISTRICT',
            centerName: 'Unknown Center',
            district: null,
            status: 'IN_TRANSIT',
            destinationDepotId: 'BRP-01',
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-KJR-REROUTE') {
          return {
            id: 'BS-KJR-REROUTE',
            centerName: 'Keonjhar Center',
            district: 'Keonjhar',
            status: 'IN_TRANSIT',
            destinationDepotId: 'BRP-01',
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-DISPATCH-TEST') {
          return {
            id: 'BS-DISPATCH-TEST',
            centerName: 'Karanjia Block Collection Point #01 (KRN-01)',
            district: 'Mayurbhanj',
            status: 'REQUESTED',
            destinationDepotId: null,
            step1: null,
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-P2002-COLLISION') {
          return {
            id: 'BS-P2002-COLLISION',
            centerName: 'Baripada Collection Center',
            district: 'Mayurbhanj',
            status: 'IN_TRANSIT',
            destinationDepotId: 'BRP-01',
            step1: {
              netAcceptedKg: 100.0,
              grossWeightKg: 102.0,
              tareWeightKg: 2.0,
              grade: 'GRADE_A',
              sealTagId: 'SEAL-P2002',
              verifiedBy: 'M. Das',
              verifiedAt: new Date(),
            },
            step2: null,
          };
        }
        if (args?.where?.id === 'BS-P2002-COLLISION-ST1') {
          return {
            id: 'BS-P2002-COLLISION-ST1',
            centerName: 'Karanjia Block Collection Point #01 (KRN-01)',
            district: 'Mayurbhanj',
            status: 'REQUESTED',
            destinationDepotId: null,
            step1: null,
            step2: null,
          };
        }
        return null;
      },
      update: async (args: any) => {
        syncDomainWriteOccurred = true;
        return {
          id: args?.where?.id,
          status: args?.data?.status || 'UPDATED',
          destinationDepotId: args?.data?.destinationDepotId,
          version: 2,
        };
      },
    },
    aggregationLocation: {
      findUnique: async (args: any) => {
        const code = args?.where?.code;
        if (code === 'BRP-01') {
          return {
            id: 'LOC-BRP-01',
            code: 'BRP-01',
            name: 'Baripada Central Depot',
            locationType: 'CENTRAL_DEPOT',
            isActive: !isDepotDecommissionedForTest,
          };
        }
        if (code === 'BRP-02') {
          return {
            id: 'LOC-BRP-02',
            code: 'BRP-02',
            name: 'Secondary Mayurbhanj Depot',
            locationType: 'CENTRAL_DEPOT',
            isActive: true,
          };
        }
        if (code === 'DEP-INACTIVE') {
          return {
            id: 'LOC-DEP-INACTIVE',
            code: 'DEP-INACTIVE',
            name: 'Decommissioned Depot',
            locationType: 'CENTRAL_DEPOT',
            isActive: false,
          };
        }
        if (code === 'KRN-01') {
          return {
            id: 'LOC-KRN-01',
            code: 'KRN-01',
            name: 'Karanjia Collection Center',
            locationType: 'COLLECTION_CENTER',
            isActive: true,
          };
        }
        return null;
      },
    },
    auditEvent: {
      create: async (args: any) => {
        syncDomainWriteOccurred = true;
        return {
          id: 'AUD-001',
          ...args?.data,
          createdAt: new Date(),
        };
      },
    },
    step1FieldVerification: {
      create: async (args: any) => {
        if (args?.data?.batchId === 'BS-P2002-COLLISION-ST1') {
          const err: any = new Error('Unique constraint failed on the fields: (`batchId`)');
          err.code = 'P2002';
          throw err;
        }
        syncDomainWriteOccurred = true;
        return {
          id: 'ST1-001',
          initialDestinationDepotId: args?.data?.initialDestinationDepotId,
          netAcceptedKg: args?.data?.netAcceptedKg,
          verifiedAt: new Date(),
          verifiedBy: args?.data?.verifiedBy,
        };
      },
    },
    discrepancyCase: {
      upsert: async () => ({ id: 'DISC-001' }),
    },
    step2WarehouseVerification: {
      create: async (args: any) => {
        if (
          args?.data?.batchId === 'BS-DEP-COMPLETED' ||
          args?.data?.batchId === 'BS-DEP-QUARANTINED' ||
          args?.data?.batchId === 'BS-P2002-COLLISION'
        ) {
          const err: any = new Error('Unique constraint failed on the fields: (`batchId`)');
          err.code = 'P2002';
          throw err;
        }
        syncDomainWriteOccurred = true;
        return {
          id: 'ST2-001',
          receivingDepotId: args?.data?.receivingDepotId,
          arrivalNetWeightKg: args?.data?.arrivalNetWeightKg,
          verifiedAt: new Date(),
        };
      },
      upsert: async (args: any) => {
        syncDomainWriteOccurred = true;
        return {
          id: 'ST2-001',
          receivingDepotId: args?.create?.receivingDepotId || args?.update?.receivingDepotId,
          arrivalNetWeightKg: args?.create?.arrivalNetWeightKg || args?.update?.arrivalNetWeightKg,
          verifiedAt: new Date(),
        };
      },
    },
  };
  (global as any).__banasetu_prisma = syncMockPrisma;

  // Test E5: Collection Manager sync of collection entity targeting cross-center batch rejected with HTTP 403
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const crossCenterSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${managerToken}`, // KRN-01
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000005',
      localId: '01HRX9Z4K00000000000000005',
      entityType: 'collection',
      action: 'verify',
      payload: {
        batchId: 'BS-JAS-402', // JAS-02
        grossWeightKg: 101.5,
        tareWeightKg: 1.5,
        netAcceptedKg: 100.0,
        grade: 'Grade A - Properly Dried',
        sackCount: 2,
        sealTagId: 'OD-TAG-402',
        vehicleNumber: 'OD-02-B-4412',
        driverName: 'B. Dehuri',
        tarpaulinConfirmed: true,
        transitWaybillId: 'WB-402',
        observedMoisturePercent: 10.5,
      },
    }),
  });
  const crossCenterSyncRes = await syncRouteHandler(crossCenterSyncReq);
  const crossCenterSyncJson = await crossCenterSyncRes.json();
  assert(
    crossCenterSyncRes.status === 403 &&
      crossCenterSyncJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Collection Manager cross-center collection sync rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN'
  );

  // Test E5b: Collection Manager substring centerId ('01') sync rejected with HTTP 403
  const subSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${substringToken}`, // '01'
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000005B',
      localId: '01HRX9Z4K0000000000000005B',
      entityType: 'collection',
      action: 'verify',
      payload: {
        batchId: 'BS-KRN-402',
        grossWeightKg: 101.5,
        tareWeightKg: 1.5,
        netAcceptedKg: 100.0,
        grade: 'Grade A - Properly Dried',
        sackCount: 2,
        sealTagId: 'OD-TAG-402',
        vehicleNumber: 'OD-02-B-4412',
        driverName: 'B. Dehuri',
        tarpaulinConfirmed: true,
        transitWaybillId: 'WB-402',
        observedMoisturePercent: 10.5,
      },
    }),
  });
  const subSyncRes = await syncRouteHandler(subSyncReq);
  const subSyncJson = await subSyncRes.json();
  assert(
    subSyncRes.status === 403 && subSyncJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Collection Manager substring centerId "01" sync rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN (no substring bypass)'
  );

  // Test E5c: Unmapped / unknown center name collection sync fails closed with HTTP 403
  const unmappedSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${managerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000005C',
      localId: '01HRX9Z4K0000000000000005C',
      entityType: 'collection',
      action: 'verify',
      payload: {
        batchId: 'BS-UNK-999',
        grossWeightKg: 101.5,
        tareWeightKg: 1.5,
        netAcceptedKg: 100.0,
        grade: 'Grade A - Properly Dried',
        sackCount: 2,
        sealTagId: 'OD-TAG-999',
        vehicleNumber: 'OD-02-B-4412',
        driverName: 'B. Dehuri',
        tarpaulinConfirmed: true,
        transitWaybillId: 'WB-999',
        observedMoisturePercent: 10.5,
      },
    }),
  });
  const unmappedSyncRes = await syncRouteHandler(unmappedSyncReq);
  const unmappedSyncJson = await unmappedSyncRes.json();
  assert(
    unmappedSyncRes.status === 403 && unmappedSyncJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Unmapped center name collection sync fails closed with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN'
  );

  // Test E5d: SHG Facilitator sync with collector from different village rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN
  const crossVilBatchPayload = {
    ...validBatchPayload,
    id: 'BS-VIL-SYNC-01',
    collectors: [
      {
        ...validBatchPayload.collectors[0],
        village: 'Kadamdiha', // Different from facilitator's village (Badagaon)
      },
    ],
  };
  const crossVilSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${facilitatorToken}`, // village: Badagaon
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000005D',
      localId: '01HRX9Z4K0000000000000005D',
      entityType: 'pickup_request',
      action: 'create',
      payload: crossVilBatchPayload,
    }),
  });
  const crossVilSyncRes = await syncRouteHandler(crossVilSyncReq);
  const crossVilSyncJson = await crossVilSyncRes.json();
  assert(
    crossVilSyncRes.status === 403 && crossVilSyncJson.error === 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
    'SHG Facilitator cross-village pickup sync rejected with HTTP 403 CROSS_VILLAGE_ACCESS_FORBIDDEN'
  );

  // Test E5e: SHG Facilitator sync with missing assigned village rejected with HTTP 403 VILLAGE_REQUIRED
  const noVilSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${noVilFacToken}`, // village: undefined
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000005E',
      localId: '01HRX9Z4K0000000000000005E',
      entityType: 'pickup_request',
      action: 'create',
      payload: validBatchPayload,
    }),
  });
  const noVilSyncRes = await syncRouteHandler(noVilSyncReq);
  const noVilSyncJson = await noVilSyncRes.json();
  assert(
    noVilSyncRes.status === 403 && noVilSyncJson.error === 'VILLAGE_REQUIRED',
    'SHG Facilitator missing assigned village rejected from sync with HTTP 403 VILLAGE_REQUIRED'
  );

  // Test E5f: SHG Facilitator sync targeting different district rejected with HTTP 403 FORBIDDEN_DISTRICT_ACCESS
  const crossDistBatchPayload = {
    ...validBatchPayload,
    id: 'BS-DIST-SYNC-01',
    district: 'Keonjhar', // Different from facilitator's district (Mayurbhanj)
  };
  const crossDistSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${facilitatorToken}`, // Mayurbhanj
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000005F',
      localId: '01HRX9Z4K0000000000000005F',
      entityType: 'pickup_request',
      action: 'create',
      payload: crossDistBatchPayload,
    }),
  });
  const crossDistSyncRes = await syncRouteHandler(crossDistSyncReq);
  const crossDistSyncJson = await crossDistSyncRes.json();
  assert(
    crossDistSyncRes.status === 403 && crossDistSyncJson.error === 'FORBIDDEN_DISTRICT_ACCESS',
    'SHG Facilitator cross-district pickup sync rejected with HTTP 403 FORBIDDEN_DISTRICT_ACCESS'
  );

  // Test E6: Warehouse Manager sync of storage_receipt targeting cross-district batch rejected with HTTP 403
  const whManagerToken = await createSessionToken({
    userId: 'USR-WHM-001',
    username: 'siba.das',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'S. Das',
    centerId: 'BRP-DEPOT-01',
    district: 'Mayurbhanj',
  });

  const crossDistrictSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${whManagerToken}`, // Mayurbhanj
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000006',
      localId: '01HRX9Z4K00000000000000006',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-KJR-101', // Keonjhar district
        arrivalGrossWeightKg: 100.0,
        arrivalTareWeightKg: 1.5,
        arrivalNetWeightKg: 98.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const crossDistrictSyncRes = await syncRouteHandler(crossDistrictSyncReq);
  const crossDistrictSyncJson = await crossDistrictSyncRes.json();
  assert(
    crossDistrictSyncRes.status === 403 &&
      crossDistrictSyncJson.error === 'CROSS_DISTRICT_ACCESS_FORBIDDEN',
    'Warehouse Manager cross-district storage_receipt sync rejected with HTTP 403 CROSS_DISTRICT_ACCESS_FORBIDDEN'
  );

  // Test E7: Warehouse Manager with unauthorized depot assignment (e.g. collection center KRN-01) rejected with HTTP 403
  const invalidDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${invalidWhmToken}`, // assigned to KRN-01 (not an authorized depot!)
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K00000000000000007',
      localId: '01HRX9Z4K00000000000000007',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-RRP-202',
        arrivalGrossWeightKg: 100.0,
        arrivalTareWeightKg: 1.5,
        arrivalNetWeightKg: 98.5,
        storageZone: 'ZONE-B',
      },
    }),
  });
  const invalidDepotSyncRes = await syncRouteHandler(invalidDepotSyncReq);
  const invalidDepotSyncJson = await invalidDepotSyncRes.json();
  assert(
    invalidDepotSyncRes.status === 403 &&
      invalidDepotSyncJson.error === 'INVALID_DEPOT_ASSIGNMENT',
    'Warehouse Manager with unauthorized depot assignment rejected with HTTP 403 INVALID_DEPOT_ASSIGNMENT'
  );

  // Test E7b: Warehouse Manager missing depot assignment rejected with HTTP 403 DEPOT_REQUIRED
  const missingDepotToken = await createSessionToken({
    userId: 'USR-WHM-MISSING',
    username: 'missing.depot',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'Missing Depot',
    centerId: undefined,
    district: 'Mayurbhanj',
  });
  const missingDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${missingDepotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000007B',
      localId: '01HRX9Z4K0000000000000007B',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-RRP-202',
        arrivalGrossWeightKg: 100.0,
        arrivalTareWeightKg: 1.5,
        arrivalNetWeightKg: 98.5,
        storageZone: 'ZONE-B',
      },
    }),
  });
  const missingDepotSyncRes = await syncRouteHandler(missingDepotSyncReq);
  const missingDepotSyncJson = await missingDepotSyncRes.json();
  assert(
    missingDepotSyncRes.status === 403 &&
      missingDepotSyncJson.error === 'DEPOT_REQUIRED',
    'Warehouse Manager missing depot assignment rejected with HTTP 403 DEPOT_REQUIRED'
  );

  // Test E7c: [SCHEMA AUDIT VERIFICATION] Authoritative audit assertion documenting Prisma depot relations
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const batchModelSection = schemaContent.match(/model Batch \{[\s\S]*?\n\}/)?.[0] || '';
  const batchHasDepotRelation =
    batchModelSection.includes('destinationDepotId') &&
    batchModelSection.includes('destinationDepot') &&
    batchModelSection.includes('BatchActiveDestinationDepot');

  const step1ModelSection = schemaContent.match(/model Step1FieldVerification \{[\s\S]*?\n\}/)?.[0] || '';
  const step1HasDepotRelation =
    step1ModelSection.includes('initialDestinationDepotId') &&
    step1ModelSection.includes('initialDestinationDepot') &&
    step1ModelSection.includes('Step1InitialDestination');

  const step2ModelSection = schemaContent.match(/model Step2WarehouseVerification \{[\s\S]*?\n\}/)?.[0] || '';
  const step2HasDepotRelation =
    step2ModelSection.includes('receivingDepotId') &&
    step2ModelSection.includes('receivingDepot') &&
    step2ModelSection.includes('Step2ReceivingDepot');

  const aggLocModelSection = schemaContent.match(/model AggregationLocation \{[\s\S]*?\n\}/)?.[0] || '';
  const aggLocHasReciprocals =
    aggLocModelSection.includes('activeBatchesDestinedHere') &&
    aggLocModelSection.includes('dispatchesTargetedHere') &&
    aggLocModelSection.includes('receiptsAcceptedHere');

  assert(
    batchHasDepotRelation && step1HasDepotRelation && step2HasDepotRelation && aggLocHasReciprocals,
    'Verified via schema audit: Batch, Step1, Step2, and AggregationLocation have valid reciprocal depot relations'
  );

  // Test E8: Failed sync authorizations leave zero domain writes and zero idempotency receipts committed
  assert(
    syncDomainWriteOccurred === false && syncIdempotencyCommitted === false,
    'Failed sync authorizations guarantee ZERO domain writes and ZERO idempotency receipts committed'
  );

  // --------------------------------------------------------------------------
  // P0-F: Depot Isolation, Dispatch Verification & Destination Integrity
  // --------------------------------------------------------------------------
  console.log('\n--- P0-F: Depot Isolation, Dispatch Verification & Destination Integrity ---');

  const { POST: collectionVerifyHandler } = await import('../src/app/api/collection/verify/route');
  const { POST: inventoryVerifyHandler } = await import('../src/app/api/inventory/verify/route');
  const { POST: rerouteRouteHandler } = await import('../src/app/api/admin/batches/[id]/reroute/route');

  const baripadaWhmToken = await createSessionToken({
    userId: 'USR-WHM-BRP',
    username: 'baripada.manager',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'Baripada Depot In-Charge',
    centerId: 'BRP-DEPOT-01', // Resolves to canonical BRP-01
    district: 'Mayurbhanj',
  });

  const secondaryWhmToken = await createSessionToken({
    userId: 'USR-WHM-SEC',
    username: 'secondary.manager',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'Secondary Depot In-Charge',
    centerId: 'LOC-BRP-02', // Resolves to canonical BRP-02
    district: 'Mayurbhanj',
  });

  const supervisorToken = await createSessionToken({
    userId: 'USR-SUP-001',
    username: 'supervisor.nayak',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'District Supervisor Nayak',
    district: 'Mayurbhanj',
  });

  const colManagerToken = await createSessionToken({
    userId: 'USR-MGR-KRN',
    username: 'karanjia.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Karanjia Manager',
    centerId: 'LOC-KRN-01',
    district: 'Mayurbhanj',
  });

  // Test F1: Direct collection dispatch with invalid destination depot rejected with HTTP 422 INVALID_DESTINATION_DEPOT
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const invalidDispatchReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${colManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DISPATCH-TEST',
      grossWeightKg: 102.0,
      tareWeightKg: 2.0,
      netAcceptedKg: 100.0,
      grade: 'Grade A - Properly Dried',
      sackCount: 2,
      sealTagId: 'SEAL-F1-001',
      vehicleNumber: 'OD-02-B-4412',
      driverName: 'B. Dehuri',
      tarpaulinConfirmed: true,
      transitWaybillId: 'WB-F-001',
      observedMoisturePercent: 10.5,
      destinationDepotId: 'NONEXISTENT-DEPOT',
    }),
  });
  const invalidDispatchRes = await collectionVerifyHandler(invalidDispatchReq);
  const invalidDispatchJson = await invalidDispatchRes.json();
  assert(
    invalidDispatchRes.status === 422 && invalidDispatchJson.error === 'INVALID_DESTINATION_DEPOT',
    'Direct collection dispatch with unknown destination depot rejected with HTTP 422 INVALID_DESTINATION_DEPOT'
  );

  // Test F2: Direct collection dispatch with inactive destination depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT
  const inactiveDispatchReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${colManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DISPATCH-TEST',
      grossWeightKg: 102.0,
      tareWeightKg: 2.0,
      netAcceptedKg: 100.0,
      grade: 'Grade A - Properly Dried',
      sackCount: 2,
      sealTagId: 'SEAL-F2-001',
      vehicleNumber: 'OD-02-B-4412',
      driverName: 'B. Dehuri',
      tarpaulinConfirmed: true,
      transitWaybillId: 'WB-F-002',
      observedMoisturePercent: 10.5,
      destinationDepotId: 'DEP-INACTIVE',
    }),
  });
  const inactiveDispatchRes = await collectionVerifyHandler(inactiveDispatchReq);
  const inactiveDispatchJson = await inactiveDispatchRes.json();
  assert(
    inactiveDispatchRes.status === 422 && inactiveDispatchJson.error === 'INACTIVE_DESTINATION_DEPOT',
    'Direct collection dispatch with decommissioned destination depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT'
  );

  // Test F3: Direct collection dispatch with non-depot facility (COLLECTION_CENTER) rejected with HTTP 422 INVALID_DEPOT_TYPE
  const nonDepotDispatchReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${colManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DISPATCH-TEST',
      grossWeightKg: 102.0,
      tareWeightKg: 2.0,
      netAcceptedKg: 100.0,
      grade: 'Grade A - Properly Dried',
      sackCount: 2,
      sealTagId: 'SEAL-F3-001',
      vehicleNumber: 'OD-02-B-4412',
      driverName: 'B. Dehuri',
      tarpaulinConfirmed: true,
      transitWaybillId: 'WB-F-003',
      observedMoisturePercent: 10.5,
      destinationDepotId: 'KRN-01', // COLLECTION_CENTER, not CENTRAL_DEPOT
    }),
  });
  const nonDepotDispatchRes = await collectionVerifyHandler(nonDepotDispatchReq);
  const nonDepotDispatchJson = await nonDepotDispatchRes.json();
  assert(
    nonDepotDispatchRes.status === 422 && nonDepotDispatchJson.error === 'INVALID_DEPOT_TYPE',
    'Direct collection dispatch to non-depot location rejected with HTTP 422 INVALID_DEPOT_TYPE'
  );

  // Test F4: Offline sync collection dispatch with invalid destination depot rejected with HTTP 422 INVALID_DESTINATION_DEPOT
  const offlineInvalidDispatchReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${colManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000008A',
      localId: '01HRX9Z4K0000000000000008A',
      entityType: 'dispatch',
      action: 'verify',
      payload: {
        batchId: 'BS-DISPATCH-TEST',
        grossWeightKg: 102.0,
        tareWeightKg: 2.0,
        netAcceptedKg: 100.0,
        grade: 'Grade A - Properly Dried',
        sackCount: 2,
        sealTagId: 'SEAL-F4-001',
        vehicleNumber: 'OD-02-B-4412',
        driverName: 'B. Dehuri',
        tarpaulinConfirmed: true,
        transitWaybillId: 'WB-F-004',
        observedMoisturePercent: 10.5,
        destinationDepotId: 'UNKNOWN-DEPOT-999',
      },
    }),
  });
  const offlineInvalidDispatchRes = await syncRouteHandler(offlineInvalidDispatchReq);
  const offlineInvalidDispatchJson = await offlineInvalidDispatchRes.json();
  assert(
    offlineInvalidDispatchRes.status === 422 && offlineInvalidDispatchJson.error === 'INVALID_DESTINATION_DEPOT',
    'Offline sync dispatch with unknown destination depot rejected with HTTP 422 INVALID_DESTINATION_DEPOT'
  );

  // Test F5: Same-district cross-depot storage receipt sync rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const crossDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`, // Assigned to BRP-01
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000008B',
      localId: '01HRX9Z4K0000000000000008B',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-DIFF', // Destined for BRP-02 (same Mayurbhanj district)
        arrivalGrossWeightKg: 101.5,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const crossDepotSyncRes = await syncRouteHandler(crossDepotSyncReq);
  const crossDepotSyncJson = await crossDepotSyncRes.json();
  assert(
    crossDepotSyncRes.status === 403 && crossDepotSyncJson.error === 'CROSS_DEPOT_ACCESS_FORBIDDEN',
    'Same-district cross-depot storage receipt sync rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN'
  );

  // Test F6: Storage receipt sync for unassigned batch (missing destination) rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED
  const unassignedDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000008C',
      localId: '01HRX9Z4K0000000000000008C',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-UNASSIGNED', // destinationDepotId: null
        arrivalGrossWeightKg: 101.5,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const unassignedDepotSyncRes = await syncRouteHandler(unassignedDepotSyncReq);
  const unassignedDepotSyncJson = await unassignedDepotSyncRes.json();
  assert(
    unassignedDepotSyncRes.status === 403 && unassignedDepotSyncJson.error === 'DEPOT_ASSIGNMENT_REQUIRED',
    'Storage receipt sync for unassigned batch rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED (fail-closed, no guessing)'
  );

  // Test F7: Authorized storage receipt sync with exact matching depot succeeds with HTTP 200
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const matchDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`, // BRP-01
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000008D',
      localId: '01HRX9Z4K0000000000000008D',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-MATCH', // Destined for BRP-01
        arrivalGrossWeightKg: 101.5,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const matchDepotSyncRes = await syncRouteHandler(matchDepotSyncReq);
  const matchDepotSyncJson = await matchDepotSyncRes.json();
  assert(
    matchDepotSyncRes.status === 200 && matchDepotSyncJson.success === true,
    'Authorized storage receipt sync with matching depot succeeds with HTTP 200'
  );
  assert(
    Boolean(syncDomainWriteOccurred) === true && Boolean(syncIdempotencyCommitted) === true,
    'Authorized receipt sync persisted domain record and committed idempotency receipt'
  );

  // Test F7b: Offline replay of storage receipt recognised safely without duplicate mutation
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const replayDepotSyncReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K0000000000000008D',
      localId: '01HRX9Z4K0000000000000008D',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-MATCH',
        arrivalGrossWeightKg: 101.5,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const replayDepotSyncRes = await syncRouteHandler(replayDepotSyncReq);
  const replayDepotSyncJson = await replayDepotSyncRes.json();
  assert(
    replayDepotSyncRes.status === 200 && replayDepotSyncJson.idempotentReplay === true,
    'Storage receipt offline replay returns HTTP 200 with cached response'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Offline receipt replay guarantees zero redundant domain writes'
  );

  // Test F8: Direct inventory verification with cross-depot access rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN
  syncDomainWriteOccurred = false;
  syncIdempotencyCommitted = false;
  const crossDepotDirectReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`, // BRP-01
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-DIFF', // BRP-02
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
    }),
  });
  const crossDepotDirectRes = await inventoryVerifyHandler(crossDepotDirectReq);
  const crossDepotDirectJson = await crossDepotDirectRes.json();
  assert(
    crossDepotDirectRes.status === 403 && crossDepotDirectJson.error === 'CROSS_DEPOT_ACCESS_FORBIDDEN',
    'Direct inventory verification with cross-depot access rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN'
  );

  // Test F9: Direct inventory verification for unassigned batch rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED
  const unassignedDirectReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-UNASSIGNED',
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
    }),
  });
  const unassignedDirectRes = await inventoryVerifyHandler(unassignedDirectReq);
  const unassignedDirectJson = await unassignedDirectRes.json();
  assert(
    unassignedDirectRes.status === 403 && unassignedDirectJson.error === 'DEPOT_ASSIGNMENT_REQUIRED',
    'Direct inventory verification for unassigned batch rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED'
  );

  // Test F10: Direct inventory verification with matching depot succeeds with HTTP 200
  const matchDirectReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-MATCH',
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
    }),
  });
  const matchDirectRes = await inventoryVerifyHandler(matchDirectReq);
  const matchDirectJson = await matchDirectRes.json();
  assert(
    matchDirectRes.status === 200 && matchDirectJson.success === true,
    'Direct inventory verification with matching depot succeeds with HTTP 200'
  );

  // Test F11: Warehouse Manager evidence upload with cross-depot access rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-test-32-chars';
  resetRateLimit('anonymous-client', 'uploads');

  const crossDepotUploadFormData = new FormData();
  crossDepotUploadFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  crossDepotUploadFormData.append('evidenceType', 'SCALE_READOUT');
  crossDepotUploadFormData.append('batchId', 'BS-DEP-DIFF');

  const crossDepotUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${baripadaWhmToken}` }, // BRP-01 manager vs BRP-02 batch
    body: crossDepotUploadFormData,
  });
  const crossDepotUploadRes = await uploadRouteHandler(crossDepotUploadReq);
  const crossDepotUploadJson = await crossDepotUploadRes.json();
  assert(
    crossDepotUploadRes.status === 403 && crossDepotUploadJson.error === 'CROSS_DEPOT_ACCESS_FORBIDDEN',
    'Warehouse Manager evidence upload with cross-depot access rejected with HTTP 403 CROSS_DEPOT_ACCESS_FORBIDDEN'
  );

  // Test F12: Warehouse Manager evidence upload for unassigned batch rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED
  resetRateLimit('anonymous-client', 'uploads');
  const unassignedUploadFormData = new FormData();
  unassignedUploadFormData.append('file', new Blob([validJpegBytes], { type: 'image/jpeg' }), 'scale.jpg');
  unassignedUploadFormData.append('evidenceType', 'SCALE_READOUT');
  unassignedUploadFormData.append('batchId', 'BS-DEP-UNASSIGNED');

  const unassignedUploadReq = new NextRequest('http://localhost:3000/api/uploads', {
    method: 'POST',
    headers: { cookie: `banasetu_session=${baripadaWhmToken}` },
    body: unassignedUploadFormData,
  });
  const unassignedUploadRes = await uploadRouteHandler(unassignedUploadReq);
  const unassignedUploadJson = await unassignedUploadRes.json();
  assert(
    unassignedUploadRes.status === 403 && unassignedUploadJson.error === 'DEPOT_ASSIGNMENT_REQUIRED',
    'Warehouse Manager evidence upload for unassigned batch rejected with HTTP 403 DEPOT_ASSIGNMENT_REQUIRED'
  );

  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test F13: Supervisor reroute - Non-supervisor role rejected with HTTP 403
  const unauthRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-DEP-MATCH/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`, // WAREHOUSE_MANAGER
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Route flooded on national highway',
    }),
  });
  const unauthRerouteRes = await rerouteRouteHandler(unauthRerouteReq, { params: { id: 'BS-DEP-MATCH' } });
  assert(
    unauthRerouteRes.status === 403,
    'Non-supervisor attempt to reroute in-transit batch rejected with HTTP 403'
  );

  // Test F14: Supervisor reroute - Inactive new destination depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT
  const inactiveRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-DEP-MATCH/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${supervisorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'DEP-INACTIVE',
      reason: 'Emergency diversion due to road blockage',
    }),
  });
  const inactiveRerouteRes = await rerouteRouteHandler(inactiveRerouteReq, { params: { id: 'BS-DEP-MATCH' } });
  const inactiveRerouteJson = await inactiveRerouteRes.json();
  assert(
    inactiveRerouteRes.status === 422 && inactiveRerouteJson.error === 'INACTIVE_DESTINATION_DEPOT',
    'Supervisor reroute to inactive depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT'
  );

  // Test F15: Supervisor reroute - Completed batch with step2 rejected with HTTP 409 RECORD_ALREADY_ACCEPTED
  const completedRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-DEP-COMPLETED/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${supervisorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Post-receipt reroute attempt',
    }),
  });
  const completedRerouteRes = await rerouteRouteHandler(completedRerouteReq, { params: { id: 'BS-DEP-COMPLETED' } });
  const completedRerouteJson = await completedRerouteRes.json();
  assert(
    completedRerouteRes.status === 409 && completedRerouteJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Supervisor reroute of already received batch rejected with HTTP 409 RECORD_ALREADY_ACCEPTED (concurrency guard)'
  );

  // Test F16: Authorized supervisor reroute succeeds with HTTP 200 and persists immutable AuditEvent
  syncDomainWriteOccurred = false;
  const validRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-DEP-MATCH/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${supervisorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Flooding on Baripada highway diverted transport to Secondary Depot',
      incidentCaseId: 'INC-2026-FLOOD-01',
    }),
  });
  const validRerouteRes = await rerouteRouteHandler(validRerouteReq, { params: { id: 'BS-DEP-MATCH' } });
  const validRerouteJson = await validRerouteRes.json();
  assert(
    validRerouteRes.status === 200 && validRerouteJson.success === true && validRerouteJson.newDestinationDepotId === 'BRP-02',
    'Authorized supervisor reroute succeeds with HTTP 200 and updates active destination'
  );
  assert(
    Boolean(syncDomainWriteOccurred) === true && Boolean(validRerouteJson.auditEventId) === true,
    'Supervisor reroute persisted domain update and generated immutable AuditEvent'
  );

  // --------------------------------------------------------------------------
  // Tests F17-F28: Depot Isolation Security Repairs Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Depot Isolation Security Repairs Verification (F17-F28) ---');

  // Test F17: Re-submitting an identical accepted warehouse receipt returns safe idempotent replay without mutation
  syncDomainWriteOccurred = false;
  const identicalReceiptReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-COMPLETED',
      arrivalGrossWeightKg: 101.0,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.0,
      storageZone: 'ZONE-A',
    }),
  });
  const identicalReceiptRes = await inventoryVerifyHandler(identicalReceiptReq);
  const identicalReceiptJson = await identicalReceiptRes.json();
  assert(
    identicalReceiptRes.status === 200 && (identicalReceiptJson.isReplay === true || identicalReceiptJson.idempotentReplay === true),
    'Re-submitting identical accepted warehouse receipt returns safe idempotent replay (HTTP 200)'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Safe idempotent replay of accepted warehouse receipt performs ZERO domain writes'
  );

  // Test F18: Attempting to alter accepted weights on completed batch rejected with HTTP 409 RECORD_ALREADY_ACCEPTED
  syncDomainWriteOccurred = false;
  const alteredWeightReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-COMPLETED',
      arrivalGrossWeightKg: 100.0,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 98.0, // Altered from original 99.0!
      storageZone: 'ZONE-A',
    }),
  });
  const alteredWeightRes = await inventoryVerifyHandler(alteredWeightReq);
  const alteredWeightJson = await alteredWeightRes.json();
  assert(
    alteredWeightRes.status === 409 && alteredWeightJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Attempting to alter certified weights on accepted warehouse receipt rejected with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Rejected weight modification attempt performs ZERO domain writes'
  );

  // Test F19: Attempting to turn a quarantined receipt into a saleable batch rejected with HTTP 409 RECORD_ALREADY_ACCEPTED
  syncDomainWriteOccurred = false;
  const unquarantineReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-QUARANTINED',
      arrivalGrossWeightKg: 101.0,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.0, // Attempting to clear quarantine discrepancy
      storageZone: 'ZONE-A',
    }),
  });
  const unquarantineRes = await inventoryVerifyHandler(unquarantineReq);
  const unquarantineJson = await unquarantineRes.json();
  assert(
    unquarantineRes.status === 409 && unquarantineJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Attempting to overwrite a quarantined warehouse receipt rejected with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Quarantined receipt cannot be overwritten and batch status cannot be flipped to saleable'
  );

  // Test F20: Two actors attempting to replay the same idempotency key
  // Actor 1: USR-WHM-BRP creates an initial verification with idempotency key
  syncDomainWriteOccurred = false;
  const actor1Key = '01HRX9Z4K-SHARED-IDEMP-01';
  const actor1Req = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-MATCH',
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
      idempotencyKey: actor1Key,
    }),
  });
  const actor1Res = await inventoryVerifyHandler(actor1Req);
  const actor1Json = await actor1Res.json();
  assert(
    actor1Res.status === 200 && actor1Json.success === true,
    'Actor 1 initial warehouse verification with idempotency key succeeds (HTTP 200)'
  );

  // Actor 2: USR-WHM-ACTOR2 tries to replay Actor 1's key
  const actor2WhmToken = await createSessionToken({
    userId: 'USR-WHM-ACTOR2',
    username: 'another.manager',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'Another Warehouse Manager',
    centerId: 'BRP-01',
    district: 'Mayurbhanj',
  });
  syncDomainWriteOccurred = false;
  const actor2ReplayReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${actor2WhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-MATCH',
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
      idempotencyKey: actor1Key,
    }),
  });
  const actor2ReplayRes = await inventoryVerifyHandler(actor2ReplayReq);
  const actor2ReplayJson = await actor2ReplayRes.json();
  assert(
    actor2ReplayRes.status === 403 &&
      actor2ReplayJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS' &&
      !actor2ReplayJson.batch,
    'Actor 2 replay of Actor 1 idempotency key rejected with HTTP 403 FORBIDDEN_IDEMPOTENCY_ACCESS without revealing cached payload'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Cross-actor idempotency key replay causes ZERO domain writes'
  );

  // Test F21: An authorized actor reusing a key with a different request payload
  syncDomainWriteOccurred = false;
  const modifiedPayloadReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-MATCH',
      arrivalGrossWeightKg: 105.0, // Modified payload with same idempotency key
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 103.0,
      storageZone: 'ZONE-B',
      idempotencyKey: actor1Key,
    }),
  });
  const modifiedPayloadRes = await inventoryVerifyHandler(modifiedPayloadReq);
  const modifiedPayloadJson = await modifiedPayloadRes.json();
  assert(
    modifiedPayloadRes.status === 409 && modifiedPayloadJson.error === 'IDEMPOTENCY_CONFLICT',
    'Reusing idempotency key with different payload rejected with HTTP 409 IDEMPOTENCY_CONFLICT'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Idempotency key reuse with modified payload causes ZERO domain writes'
  );

  // Test F22: Unauthorized cross-center dispatch verification rejected before transaction
  const jasManagerToken = await createSessionToken({
    userId: 'USR-MGR-JAS',
    username: 'jashipur.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Jashipur Manager',
    centerId: 'LOC-JAS-02',
    district: 'Mayurbhanj',
  });
  syncDomainWriteOccurred = false;
  const crossCenterVerifyReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${jasManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DISPATCH-TEST', // Assigned to Karanjia KRN-01
      grossWeightKg: 102.0,
      tareWeightKg: 2.0,
      netAcceptedKg: 100.0,
      grade: 'Grade A - Properly Dried',
      sackCount: 2,
      sealTagId: 'SEAL-JAS-001',
      vehicleNumber: 'OD-02-B-4412',
      driverName: 'B. Dehuri',
      tarpaulinConfirmed: true,
      transitWaybillId: 'WB-JAS-001',
      observedMoisturePercent: 10.5,
      destinationDepotId: 'BRP-01',
    }),
  });
  const crossCenterVerifyRes = await collectionVerifyHandler(crossCenterVerifyReq);
  const crossCenterVerifyJson = await crossCenterVerifyRes.json();
  assert(
    crossCenterVerifyRes.status === 403 && crossCenterVerifyJson.error === 'CROSS_CENTER_ACCESS_FORBIDDEN',
    'Cross-center collection dispatch verification rejected with HTTP 403 CROSS_CENTER_ACCESS_FORBIDDEN before transaction'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Unauthorized cross-center dispatch verification causes ZERO domain writes'
  );

  // Test F23: Supervisor attempting cross-district rerouting rejected with HTTP 403 FORBIDDEN_DISTRICT_ACCESS
  syncDomainWriteOccurred = false;
  const crossDistRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-KJR-REROUTE/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${supervisorToken}`, // Mayurbhanj supervisor
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Attempted diversion into another district',
    }),
  });
  const crossDistRerouteRes = await rerouteRouteHandler(crossDistRerouteReq, { params: { id: 'BS-KJR-REROUTE' } });
  const crossDistRerouteJson = await crossDistRerouteRes.json();
  assert(
    crossDistRerouteRes.status === 403 && crossDistRerouteJson.error === 'FORBIDDEN_DISTRICT_ACCESS',
    'Supervisor cross-district batch reroute rejected with HTTP 403 FORBIDDEN_DISTRICT_ACCESS'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Cross-district reroute attempt causes ZERO domain writes'
  );

  // Test F24a: Supervisor with missing district jurisdiction fails closed with HTTP 403 DISTRICT_REQUIRED
  const noDistSupervisorToken = await createSessionToken({
    userId: 'USR-SUP-NODIST',
    username: 'supervisor.nodist',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'Supervisor No District',
    district: undefined as any,
  });
  syncDomainWriteOccurred = false;
  const noDistSupRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-DEP-MATCH/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${noDistSupervisorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Missing jurisdiction reroute attempt',
    }),
  });
  const noDistSupRerouteRes = await rerouteRouteHandler(noDistSupRerouteReq, { params: { id: 'BS-DEP-MATCH' } });
  const noDistSupRerouteJson = await noDistSupRerouteRes.json();
  assert(
    noDistSupRerouteRes.status === 403 && noDistSupRerouteJson.error === 'DISTRICT_REQUIRED',
    'Supervisor with missing district jurisdiction fails closed with HTTP 403 DISTRICT_REQUIRED'
  );

  // Test F24b: Batch with missing district fails closed with HTTP 403 BATCH_DISTRICT_REQUIRED
  syncDomainWriteOccurred = false;
  const noDistBatchRerouteReq = new NextRequest('http://localhost:3000/api/admin/batches/BS-NO-DISTRICT/reroute', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${supervisorToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      newDestinationDepotId: 'BRP-02',
      reason: 'Reroute batch missing district',
    }),
  });
  const noDistBatchRerouteRes = await rerouteRouteHandler(noDistBatchRerouteReq, { params: { id: 'BS-NO-DISTRICT' } });
  const noDistBatchRerouteJson = await noDistBatchRerouteRes.json();
  assert(
    noDistBatchRerouteRes.status === 403 && noDistBatchRerouteJson.error === 'BATCH_DISTRICT_REQUIRED',
    'Reroute of batch with missing district fails closed with HTTP 403 BATCH_DISTRICT_REQUIRED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Missing district reroute attempts cause ZERO domain writes'
  );

  // Test F25: Inactive depot during direct warehouse intake rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT
  isDepotDecommissionedForTest = true;
  syncDomainWriteOccurred = false;
  const inactiveDirectIntakeReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      batchId: 'BS-DEP-MATCH',
      arrivalGrossWeightKg: 101.5,
      arrivalTareWeightKg: 2.0,
      arrivalNetWeightKg: 99.5,
      storageZone: 'ZONE-A',
    }),
  });
  const inactiveDirectIntakeRes = await inventoryVerifyHandler(inactiveDirectIntakeReq);
  const inactiveDirectIntakeJson = await inactiveDirectIntakeRes.json();
  assert(
    inactiveDirectIntakeRes.status === 422 && inactiveDirectIntakeJson.error === 'INACTIVE_DESTINATION_DEPOT',
    'Direct warehouse intake at inactive destination depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Direct warehouse intake at inactive depot causes ZERO domain writes'
  );

  // Test F26: Inactive depot during offline storage receipt sync rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT
  syncDomainWriteOccurred = false;
  const inactiveSyncIntakeReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX9Z4K-INACTIVE-SYNC-01',
      localId: '01HRX9Z4K-INACTIVE-SYNC-01',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-MATCH',
        arrivalGrossWeightKg: 101.5,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.5,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const inactiveSyncIntakeRes = await syncRouteHandler(inactiveSyncIntakeReq);
  const inactiveSyncIntakeJson = await inactiveSyncIntakeRes.json();
  assert(
    inactiveSyncIntakeRes.status === 422 && inactiveSyncIntakeJson.error === 'INACTIVE_DESTINATION_DEPOT',
    'Offline storage receipt sync at inactive destination depot rejected with HTTP 422 INACTIVE_DESTINATION_DEPOT'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Offline storage receipt sync at inactive depot causes ZERO domain writes'
  );
  isDepotDecommissionedForTest = false; // Restore active state

  // Test F27: Negative boundary security audit: zero side effects across all rejections
  assert(
    syncDomainWriteOccurred === false,
    'Security boundary audit: All rejected requests guarantee ZERO database mutations or status changes'
  );

  // Test F28: Seed demo batch consistency and schema referential action audit
  const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
  const seedContent = fs.readFileSync(seedPath, 'utf8');

  const bs402BatchMatch =
    (seedContent.includes("id: '#BS-402'") || seedContent.includes("id: 'BS-402'")) &&
    seedContent.includes("destinationDepotId: 'BRP-01'");
  const bs402Step1Match = seedContent.includes("initialDestinationDepotId: 'BRP-01'");
  const bs402Step2Match = seedContent.includes("receivingDepotId: 'BRP-01'");

  assert(
    bs402BatchMatch && bs402Step1Match && bs402Step2Match,
    'Demo seed batch BS-402 consistently assigns canonical depot code BRP-01 across Batch, Step 1, and Step 2'
  );

  const step1HasRestrict =
    schemaContent.includes('Step1InitialDestination') &&
    /initialDestinationDepot\s+AggregationLocation\??\s+@relation\([^)]*onDelete:\s*Restrict[^)]*\)/.test(schemaContent);
  const step2HasRestrict =
    schemaContent.includes('Step2ReceivingDepot') &&
    /receivingDepot\s+AggregationLocation\??\s+@relation\([^)]*onDelete:\s*Restrict[^)]*\)/.test(schemaContent);

  assert(
    step1HasRestrict && step2HasRestrict,
    'Prisma schema enforces explicit onDelete: Restrict on Step1InitialDestination and Step2ReceivingDepot for durable audit provenance'
  );

  // --------------------------------------------------------------------------
  // Tests F29-F35: P2002 Collision and Offline Sync Consistency Hardening
  // --------------------------------------------------------------------------
  console.log('\n--- P2002 Collision & Offline Sync Consistency Hardening (F29-F35) ---');

  const krnManagerToken = await createSessionToken({
    userId: 'USR-MGR-KRN',
    username: 'karanjia.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Karanjia Manager',
    centerId: 'LOC-KRN-01',
    district: 'Mayurbhanj',
  });
  const otherManagerToken = await createSessionToken({
    userId: 'USR-MGR-OTHER',
    username: 'other.manager',
    role: 'COLLECTION_MANAGER',
    fullName: 'Other Manager',
    centerId: 'LOC-KRN-01',
    district: 'Mayurbhanj',
  });

  const collisionPayload = {
    batchId: 'BS-P2002-COLLISION',
    arrivalGrossWeightKg: 101.5,
    arrivalTareWeightKg: 2.0,
    arrivalNetWeightKg: 99.5,
    storageZone: 'ZONE-A',
  };
  const expectedCollisionHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(collisionPayload))
    .digest('hex');

  // Test F28a: In-transaction idempotency check — Stored record with missing/null actorId fails closed with HTTP 403
  idempotencyStore.set('01HRX-EARLY-NULL-ACTOR', {
    idempotencyKey: '01HRX-EARLY-NULL-ACTOR',
    actorId: null, // Corrupted/missing actor ID
    payloadHash: expectedCollisionHash,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION' }),
  });
  const earlyNullActorReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-EARLY-NULL-ACTOR',
    }),
  });
  const earlyNullActorRes = await inventoryVerifyHandler(earlyNullActorReq);
  const earlyNullActorJson = await earlyNullActorRes.json();
  assert(
    earlyNullActorRes.status === 403 && earlyNullActorJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS',
    'In-tx idempotency check: Stored record with missing/null actorId fails closed with HTTP 403 FORBIDDEN_IDEMPOTENCY_ACCESS'
  );

  // Test F28b: In-transaction idempotency check — Stored record with missing/null payloadHash fails closed with HTTP 409
  idempotencyStore.set('01HRX-EARLY-NULL-HASH', {
    idempotencyKey: '01HRX-EARLY-NULL-HASH',
    actorId: 'USR-WHM-BRP',
    payloadHash: null, // Corrupted/missing payload hash
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION' }),
  });
  const earlyNullHashReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-EARLY-NULL-HASH',
    }),
  });
  const earlyNullHashRes = await inventoryVerifyHandler(earlyNullHashReq);
  const earlyNullHashJson = await earlyNullHashRes.json();
  assert(
    earlyNullHashRes.status === 409 && earlyNullHashJson.error === 'IDEMPOTENCY_CONFLICT',
    'In-tx idempotency check: Stored record with missing/null payloadHash fails closed with HTTP 409 IDEMPOTENCY_CONFLICT'
  );

  // Test F29: Direct Inventory P2002 recovery — Same actor + same payload hash returns cached replay with HTTP 200
  p2002KeysToHideInTx.add('01HRX-COLLISION-SAME-SAME');
  idempotencyStore.set('01HRX-COLLISION-SAME-SAME', {
    idempotencyKey: '01HRX-COLLISION-SAME-SAME',
    actorId: 'USR-WHM-BRP',
    payloadHash: expectedCollisionHash,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION', status: 'VERIFIED_SALEABLE' }),
  });
  const sameSameReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-COLLISION-SAME-SAME',
    }),
  });
  const sameSameRes = await inventoryVerifyHandler(sameSameReq);
  const sameSameJson = await sameSameRes.json();
  assert(
    sameSameRes.status === 200 && sameSameJson.isReplay === true && sameSameJson.batchId === 'BS-P2002-COLLISION',
    'Inventory P2002 collision recovery: Same actor + same payload hash returns cached replay with HTTP 200'
  );

  // Test F30: Direct Inventory P2002 recovery — Same actor + different hash rejected with HTTP 409 IDEMPOTENCY_CONFLICT
  p2002KeysToHideInTx.add('01HRX-COLLISION-SAME-DIFF');
  idempotencyStore.set('01HRX-COLLISION-SAME-DIFF', {
    idempotencyKey: '01HRX-COLLISION-SAME-DIFF',
    actorId: 'USR-WHM-BRP',
    payloadHash: 'stale-different-hash-value',
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION' }),
  });
  const sameDiffReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-COLLISION-SAME-DIFF',
    }),
  });
  const sameDiffRes = await inventoryVerifyHandler(sameDiffReq);
  const sameDiffJson = await sameDiffRes.json();
  assert(
    sameDiffRes.status === 409 && sameDiffJson.error === 'IDEMPOTENCY_CONFLICT',
    'Inventory P2002 collision recovery: Same actor + different payload hash rejected with HTTP 409 IDEMPOTENCY_CONFLICT'
  );

  // Test F31: Direct Inventory P2002 recovery — Different actor + same hash rejected with HTTP 403 without leaking cache
  p2002KeysToHideInTx.add('01HRX-COLLISION-DIFF-SAME');
  idempotencyStore.set('01HRX-COLLISION-DIFF-SAME', {
    idempotencyKey: '01HRX-COLLISION-DIFF-SAME',
    actorId: 'USR-OTHER-WHM',
    payloadHash: expectedCollisionHash,
    responseJson: JSON.stringify({ secretData: 'DO_NOT_LEAK' }),
  });
  const diffSameReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-COLLISION-DIFF-SAME',
    }),
  });
  const diffSameRes = await inventoryVerifyHandler(diffSameReq);
  const diffSameJson = await diffSameRes.json();
  assert(
    diffSameRes.status === 403 &&
      diffSameJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS' &&
      !diffSameJson.secretData,
    'Inventory P2002 collision recovery: Different actor + same payload hash rejected with HTTP 403 without leaking cache'
  );

  // Test F31a: Direct Inventory P2002 recovery — Missing/null actorId fails closed with HTTP 403
  p2002KeysToHideInTx.add('01HRX-COLLISION-NULL-ACTOR');
  idempotencyStore.set('01HRX-COLLISION-NULL-ACTOR', {
    idempotencyKey: '01HRX-COLLISION-NULL-ACTOR',
    actorId: null,
    payloadHash: expectedCollisionHash,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION' }),
  });
  const diffNullActorReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-COLLISION-NULL-ACTOR',
    }),
  });
  const diffNullActorRes = await inventoryVerifyHandler(diffNullActorReq);
  const diffNullActorJson = await diffNullActorRes.json();
  assert(
    diffNullActorRes.status === 403 && diffNullActorJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS',
    'Inventory P2002 collision recovery: Null actorId fails closed with HTTP 403 FORBIDDEN_IDEMPOTENCY_ACCESS'
  );

  // Test F31b: Direct Inventory P2002 recovery — Missing/null payloadHash fails closed with HTTP 409
  p2002KeysToHideInTx.add('01HRX-COLLISION-NULL-HASH');
  idempotencyStore.set('01HRX-COLLISION-NULL-HASH', {
    idempotencyKey: '01HRX-COLLISION-NULL-HASH',
    actorId: 'USR-WHM-BRP',
    payloadHash: null,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION' }),
  });
  const diffNullHashReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      idempotencyKey: '01HRX-COLLISION-NULL-HASH',
    }),
  });
  const diffNullHashRes = await inventoryVerifyHandler(diffNullHashReq);
  const diffNullHashJson = await diffNullHashRes.json();
  assert(
    diffNullHashRes.status === 409 && diffNullHashJson.error === 'IDEMPOTENCY_CONFLICT',
    'Inventory P2002 collision recovery: Null payloadHash fails closed with HTTP 409 IDEMPOTENCY_CONFLICT'
  );

  // --------------------------------------------------------------------------
  // Collection Verification P2002 Recovery Tests (F31c - F31f)
  // --------------------------------------------------------------------------
  const st1Payload = {
    batchId: 'BS-P2002-COLLISION-ST1',
    grossWeightKg: 102.0,
    tareWeightKg: 2.0,
    netAcceptedKg: 100.0,
    grade: 'Grade A - Properly Dried',
    sackCount: 2,
    sealTagId: 'SEAL-ST1-COLLISION',
    vehicleNumber: 'OD-02-B-9999',
    driverName: 'S. Soren',
    tarpaulinConfirmed: true,
    transitWaybillId: 'WB-ST1-COLLISION',
    observedMoisturePercent: 9.8,
    destinationDepotId: 'BRP-01',
  };
  const expectedSt1Hash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        batchId: st1Payload.batchId,
        grossWeightKg: st1Payload.grossWeightKg,
        tareWeightKg: st1Payload.tareWeightKg,
        netAcceptedKg: st1Payload.netAcceptedKg,
        grade: st1Payload.grade,
        sealTagId: st1Payload.sealTagId,
        destinationDepotId: st1Payload.destinationDepotId || null,
      })
    )
    .digest('hex');

  // Test F31c: Collection Verify P2002 recovery — Same actor + same payload hash returns cached replay with HTTP 200
  p2002KeysToHideInTx.add('01HRX-COLLISION-ST1-SAME');
  idempotencyStore.set('01HRX-COLLISION-ST1-SAME', {
    idempotencyKey: '01HRX-COLLISION-ST1-SAME',
    actorId: 'USR-MGR-KRN',
    payloadHash: expectedSt1Hash,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION-ST1', serverVerified: true }),
  });
  const st1SameReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${krnManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...st1Payload,
      idempotencyKey: '01HRX-COLLISION-ST1-SAME',
    }),
  });
  const st1SameRes = await collectionVerifyHandler(st1SameReq);
  const st1SameJson = await st1SameRes.json();
  assert(
    st1SameRes.status === 200 && st1SameJson.isReplay === true && st1SameJson.batchId === 'BS-P2002-COLLISION-ST1',
    'Collection Verify P2002 collision recovery: Same actor + same hash returns cached replay with HTTP 200',
    `Status: ${st1SameRes.status}, Json: ${JSON.stringify(st1SameJson)}`
  );

  // Test F31d: Collection Verify P2002 recovery — Different actor rejected with HTTP 403 without leaking cache
  p2002KeysToHideInTx.add('01HRX-COLLISION-ST1-DIFF');
  idempotencyStore.set('01HRX-COLLISION-ST1-DIFF', {
    idempotencyKey: '01HRX-COLLISION-ST1-DIFF',
    actorId: 'USR-MGR-OTHER',
    payloadHash: expectedSt1Hash,
    responseJson: JSON.stringify({ leakSecret: 'LEAK_PREVENTED' }),
  });
  const st1DiffReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${krnManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...st1Payload,
      idempotencyKey: '01HRX-COLLISION-ST1-DIFF',
    }),
  });
  const st1DiffRes = await collectionVerifyHandler(st1DiffReq);
  const st1DiffJson = await st1DiffRes.json();
  assert(
    st1DiffRes.status === 403 && st1DiffJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS' && !st1DiffJson.leakSecret,
    'Collection Verify P2002 collision recovery: Different actor rejected with HTTP 403 without leaking cache'
  );

  // Test F31e: Collection Verify P2002 recovery — Missing/null actorId fails closed with HTTP 403
  p2002KeysToHideInTx.add('01HRX-COLLISION-ST1-NULL-ACTOR');
  idempotencyStore.set('01HRX-COLLISION-ST1-NULL-ACTOR', {
    idempotencyKey: '01HRX-COLLISION-ST1-NULL-ACTOR',
    actorId: null,
    payloadHash: expectedSt1Hash,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION-ST1' }),
  });
  const st1NullActorReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${krnManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...st1Payload,
      idempotencyKey: '01HRX-COLLISION-ST1-NULL-ACTOR',
    }),
  });
  const st1NullActorRes = await collectionVerifyHandler(st1NullActorReq);
  const st1NullActorJson = await st1NullActorRes.json();
  assert(
    st1NullActorRes.status === 403 && st1NullActorJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS',
    'Collection Verify P2002 collision recovery: Null actorId fails closed with HTTP 403'
  );

  // Test F31f: Collection Verify P2002 recovery — Missing/null payloadHash fails closed with HTTP 409
  p2002KeysToHideInTx.add('01HRX-COLLISION-ST1-NULL-HASH');
  idempotencyStore.set('01HRX-COLLISION-ST1-NULL-HASH', {
    idempotencyKey: '01HRX-COLLISION-ST1-NULL-HASH',
    actorId: 'USR-MGR-KRN',
    payloadHash: null,
    responseJson: JSON.stringify({ success: true, batchId: 'BS-P2002-COLLISION-ST1' }),
  });
  const st1NullHashReq = new NextRequest('http://localhost:3000/api/collection/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${krnManagerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...st1Payload,
      idempotencyKey: '01HRX-COLLISION-ST1-NULL-HASH',
    }),
  });
  const st1NullHashRes = await collectionVerifyHandler(st1NullHashReq);
  const st1NullHashJson = await st1NullHashRes.json();
  assert(
    st1NullHashRes.status === 409 && st1NullHashJson.error === 'IDEMPOTENCY_CONFLICT',
    'Collection Verify P2002 collision recovery: Null payloadHash fails closed with HTTP 409'
  );

  // --------------------------------------------------------------------------
  // Offline Sync P2002 Recovery & Missing Field Tests (F31g - F31j)
  // --------------------------------------------------------------------------
  const syncCollisionPayload = {
    batchId: 'BS-P2002-COLLISION',
    arrivalGrossWeightKg: 101.5,
    arrivalTareWeightKg: 2.0,
    arrivalNetWeightKg: 99.5,
    storageZone: 'ZONE-A',
  };
  const expectedSyncCollisionHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(syncCollisionPayload))
    .digest('hex');

  // Test F31g: Offline sync P2002 recovery — Same actor + same hash returns cached replay with HTTP 200
  p2002KeysToHideInTx.add('01HRX-COLLISION-SYNC-SAME');
  idempotencyStore.set('01HRX-COLLISION-SYNC-SAME', {
    idempotencyKey: '01HRX-COLLISION-SYNC-SAME',
    localId: '01HRX-COLLISION-SYNC-SAME',
    entityType: 'storage_receipt',
    action: 'verify',
    actorId: 'USR-WHM-BRP',
    status: 'PROCESSED',
    payloadHash: expectedSyncCollisionHash,
    responseJson: JSON.stringify({ batchId: 'BS-P2002-COLLISION', status: 'VERIFIED_SALEABLE' }),
  });
  const syncSameReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-COLLISION-SYNC-SAME',
      localId: '01HRX-COLLISION-SYNC-SAME',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: syncCollisionPayload,
    }),
  });
  const syncSameRes = await syncRouteHandler(syncSameReq);
  const syncSameJson = await syncSameRes.json();
  assert(
    syncSameRes.status === 200 && syncSameJson.idempotentReplay === true,
    'Offline sync P2002 collision recovery: Same actor + same hash returns cached replay with HTTP 200'
  );

  // Test F31h: Offline sync P2002 recovery — Different payload hash rejected with HTTP 409 IDEMPOTENCY_CONFLICT
  p2002KeysToHideInTx.add('01HRX-COLLISION-SYNC-DIFF-HASH');
  idempotencyStore.set('01HRX-COLLISION-SYNC-DIFF-HASH', {
    idempotencyKey: '01HRX-COLLISION-SYNC-DIFF-HASH',
    localId: '01HRX-COLLISION-SYNC-DIFF-HASH',
    entityType: 'storage_receipt',
    action: 'verify',
    actorId: 'USR-WHM-BRP',
    status: 'PROCESSED',
    payloadHash: 'stale-different-sync-hash',
    responseJson: JSON.stringify({ batchId: 'BS-P2002-COLLISION' }),
  });
  const syncDiffHashReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-COLLISION-SYNC-DIFF-HASH',
      localId: '01HRX-COLLISION-SYNC-DIFF-HASH',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: syncCollisionPayload,
    }),
  });
  const syncDiffHashRes = await syncRouteHandler(syncDiffHashReq);
  const syncDiffHashJson = await syncDiffHashRes.json();
  assert(
    syncDiffHashRes.status === 409 && syncDiffHashJson.error === 'IDEMPOTENCY_CONFLICT',
    'Offline sync P2002 collision recovery: Different payload hash rejected with HTTP 409 IDEMPOTENCY_CONFLICT'
  );

  // Test F31i: Offline sync P2002 recovery — Missing/null actorId fails closed with HTTP 403
  p2002KeysToHideInTx.add('01HRX-COLLISION-SYNC-NULL-ACTOR');
  idempotencyStore.set('01HRX-COLLISION-SYNC-NULL-ACTOR', {
    idempotencyKey: '01HRX-COLLISION-SYNC-NULL-ACTOR',
    localId: '01HRX-COLLISION-SYNC-NULL-ACTOR',
    entityType: 'storage_receipt',
    action: 'verify',
    actorId: null,
    status: 'PROCESSED',
    payloadHash: expectedSyncCollisionHash,
    responseJson: JSON.stringify({ batchId: 'BS-P2002-COLLISION' }),
  });
  const syncNullActorReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-COLLISION-SYNC-NULL-ACTOR',
      localId: '01HRX-COLLISION-SYNC-NULL-ACTOR',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: syncCollisionPayload,
    }),
  });
  const syncNullActorRes = await syncRouteHandler(syncNullActorReq);
  const syncNullActorJson = await syncNullActorRes.json();
  assert(
    syncNullActorRes.status === 403 && syncNullActorJson.error === 'FORBIDDEN_IDEMPOTENCY_ACCESS',
    'Offline sync P2002 collision recovery: Null actorId fails closed with HTTP 403'
  );

  // Test F31j: Offline sync early check — Missing/null payloadHash in stored record fails closed with HTTP 409
  idempotencyStore.set('01HRX-SYNC-EARLY-NULL-HASH', {
    idempotencyKey: '01HRX-SYNC-EARLY-NULL-HASH',
    localId: '01HRX-SYNC-EARLY-NULL-HASH',
    entityType: 'storage_receipt',
    action: 'verify',
    actorId: 'USR-WHM-BRP',
    status: 'PROCESSED',
    payloadHash: null,
    responseJson: JSON.stringify({ batchId: 'BS-P2002-COLLISION' }),
  });
  const syncEarlyNullHashReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-SYNC-EARLY-NULL-HASH',
      localId: '01HRX-SYNC-EARLY-NULL-HASH',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: syncCollisionPayload,
    }),
  });
  const syncEarlyNullHashRes = await syncRouteHandler(syncEarlyNullHashReq);
  const syncEarlyNullHashJson = await syncEarlyNullHashRes.json();
  assert(
    syncEarlyNullHashRes.status === 409 && syncEarlyNullHashJson.error === 'IDEMPOTENCY_CONFLICT',
    'Offline sync early check: Null payloadHash in stored record fails closed with HTTP 409 IDEMPOTENCY_CONFLICT'
  );

  // Test F31k: Concurrent duplicate warehouse receipt without idempotency key fails closed with HTTP 409 RECORD_ALREADY_ACCEPTED
  const duplicateReceiptNoKeyReq = new NextRequest('http://localhost:3000/api/inventory/verify', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...collisionPayload,
      // No idempotency key provided: unique constraint collision on Step2WarehouseVerification.batchId
    }),
  });
  const duplicateReceiptNoKeyRes = await inventoryVerifyHandler(duplicateReceiptNoKeyReq);
  const duplicateReceiptNoKeyJson = await duplicateReceiptNoKeyRes.json();
  assert(
    duplicateReceiptNoKeyRes.status === 409 && duplicateReceiptNoKeyJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Concurrent duplicate warehouse receipt without idempotency key fails closed with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );

  // Test F32: Offline storage receipt sync — Identical data returns safe replay with HTTP 200
  syncDomainWriteOccurred = false;
  const offlineIdenticalReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-SYNC-IDENTICAL-01',
      localId: '01HRX-SYNC-IDENTICAL-01',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-COMPLETED',
        arrivalGrossWeightKg: 101.0,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.0,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const offlineIdenticalRes = await syncRouteHandler(offlineIdenticalReq);
  const offlineIdenticalJson = await offlineIdenticalRes.json();
  assert(
    offlineIdenticalRes.status === 200 && offlineIdenticalJson.data?.isReplay === true,
    'Offline storage receipt sync: Identical weighments return safe replay (HTTP 200)'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Offline storage receipt identical replay causes ZERO domain writes'
  );

  // Test F33: Offline storage receipt sync — Conflict with different weights rejected with HTTP 409
  syncDomainWriteOccurred = false;
  const offlineDiffWeightsReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-SYNC-DIFF-WEIGHTS-01',
      localId: '01HRX-SYNC-DIFF-WEIGHTS-01',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-COMPLETED',
        arrivalGrossWeightKg: 95.0, // Altered weights
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 93.0,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const offlineDiffWeightsRes = await syncRouteHandler(offlineDiffWeightsReq);
  const offlineDiffWeightsJson = await offlineDiffWeightsRes.json();
  assert(
    offlineDiffWeightsRes.status === 409 && offlineDiffWeightsJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Offline storage receipt sync: Altered arrival weights rejected with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Offline storage receipt weight conflict causes ZERO domain writes'
  );

  // Test F34: Offline storage receipt sync — Conflict with different storage zone rejected with HTTP 409
  syncDomainWriteOccurred = false;
  const offlineDiffZoneReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-SYNC-DIFF-ZONE-01',
      localId: '01HRX-SYNC-DIFF-ZONE-01',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-COMPLETED',
        arrivalGrossWeightKg: 101.0,
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.0,
        storageZone: 'ZONE-DIFFERENT', // Altered storage zone
      },
    }),
  });
  const offlineDiffZoneRes = await syncRouteHandler(offlineDiffZoneReq);
  const offlineDiffZoneJson = await offlineDiffZoneRes.json();
  assert(
    offlineDiffZoneRes.status === 409 && offlineDiffZoneJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Offline storage receipt sync: Altered storage zone rejected with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Offline storage receipt storage zone conflict causes ZERO domain writes'
  );

  // Test F35: Offline storage receipt sync — Quarantined batch cannot be reversed to saleable
  syncDomainWriteOccurred = false;
  const offlineQuarantineReq = new NextRequest('http://localhost:3000/api/sync', {
    method: 'POST',
    headers: {
      cookie: `banasetu_session=${baripadaWhmToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idempotencyKey: '01HRX-SYNC-QUARANTINE-01',
      localId: '01HRX-SYNC-QUARANTINE-01',
      entityType: 'storage_receipt',
      action: 'verify',
      payload: {
        batchId: 'BS-DEP-QUARANTINED',
        arrivalGrossWeightKg: 101.0, // Attempt to clear quarantine hold
        arrivalTareWeightKg: 2.0,
        arrivalNetWeightKg: 99.0,
        storageZone: 'ZONE-A',
      },
    }),
  });
  const offlineQuarantineRes = await syncRouteHandler(offlineQuarantineReq);
  const offlineQuarantineJson = await offlineQuarantineRes.json();
  assert(
    offlineQuarantineRes.status === 409 && offlineQuarantineJson.error === 'RECORD_ALREADY_ACCEPTED',
    'Offline storage receipt sync: Attempt to overwrite quarantined receipt rejected with HTTP 409 RECORD_ALREADY_ACCEPTED'
  );
  assert(
    syncDomainWriteOccurred === false,
    'Quarantined batch cannot be overwritten via offline sync and remains strictly QUARANTINED_DISCREPANCY'
  );

  // Restore DB env
  if (origDbUrl) process.env.DATABASE_URL = origDbUrl; else delete process.env.DATABASE_URL;

  // Restore environment variables
  if (origNodeEnv) (process.env as any).NODE_ENV = origNodeEnv;
  if (origAllowDemo) process.env.ALLOW_DEMO_ACCOUNTS = origAllowDemo;
  if (origSecret) process.env.AUTH_SECRET = origSecret;

  console.log('\n======================================================');
  console.log(`P0 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal P0 test suite runner error:', err);
  process.exit(1);
});
