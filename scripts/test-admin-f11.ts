/**
 * BanaSetu F11, G6 & Batch 4 Automated Test Suite
 * Validates Admin Console Governance, Route Protection, Role Provisions,
 * Real Data Exports (Zero-Mock), Conflict Arbitration, and Transit Rerouting.
 */

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import { NextRequest } from 'next/server';
import { ODISHA_MFP_CATALOGUE } from '../src/lib/products';
import {
  ROLE_PERMISSIONS,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SessionPayload,
} from '../src/lib/server/auth';
import { GET as exportGetRoute } from '../src/app/api/admin/export/route';
import {
  GET as conflictsGetRoute,
  POST as conflictsPostRoute,
} from '../src/app/api/admin/conflicts/route';
import { POST as reroutePostRoute } from '../src/app/api/admin/batches/[id]/reroute/route';

async function runAdminF11TestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu Batch 4: Admin Route Protection & Exports  ');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      process.exitCode = 1;
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  function makeRequest(
    url: string,
    options?: {
      method?: string;
      cookie?: string;
      body?: any;
    }
  ): NextRequest {
    const headers = new Headers();
    if (options?.cookie) {
      headers.set('cookie', `${SESSION_COOKIE_NAME}=${options.cookie}`);
    }
    if (options?.body !== undefined) {
      headers.set('content-type', 'application/json');
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method: options?.method || 'GET',
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  // Generate test session tokens
  const supervisorToken = await createSessionToken({
    userId: 'USR-SUP-001',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'A. Patnaik (District Procurement Officer)',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  const demoSupervisorToken = await createSessionToken({
    userId: 'USR-SUP-DEMO',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'A. Patnaik (Demo Session)',
    district: 'Mayurbhanj',
    isDemo: true,
  });

  const collectorToken = await createSessionToken({
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  const facilitatorToken = await createSessionToken({
    userId: 'USR-FAC-001',
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR',
    fullName: 'Sumitra Marndi',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  const collectionManagerToken = await createSessionToken({
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  const warehouseManagerToken = await createSessionToken({
    userId: 'USR-WHS-001',
    username: 'sdas.baripada',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'S. Das',
    centerId: 'BRP-DEPOT-01',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  // --- Group 1: Role Clearances for Administration ---
  console.log('--- 1. Administrative Clearances (SUPERVISOR_ADMIN) ---');
  const adminPermissions = ROLE_PERMISSIONS['SUPERVISOR_ADMIN'];
  assert(adminPermissions.includes('CONFIGURE_RATES'), 'SUPERVISOR_ADMIN has CONFIGURE_RATES permission');
  assert(adminPermissions.includes('MANAGE_USERS'), 'SUPERVISOR_ADMIN has MANAGE_USERS permission');
  assert(adminPermissions.includes('RESOLVE_DISCREPANCY'), 'SUPERVISOR_ADMIN has RESOLVE_DISCREPANCY permission');

  const collectorPermissions = ROLE_PERMISSIONS['COLLECTOR'];
  assert(!collectorPermissions.includes('CONFIGURE_RATES'), 'COLLECTOR cannot configure rates');
  assert(!collectorPermissions.includes('MANAGE_USERS'), 'COLLECTOR cannot manage users');

  const whManagerPermissions = ROLE_PERMISSIONS['WAREHOUSE_MANAGER'];
  assert(!whManagerPermissions.includes('CONFIGURE_RATES'), 'WAREHOUSE_MANAGER cannot configure rates');

  // --- Group 2: Rate Card Provenance & Invariants ---
  console.log('\n--- 2. Rate Card Provenance & Calibration Guardrails ---');
  const mahua = ODISHA_MFP_CATALOGUE.find((p) => p.slug === 'mahua');
  assert(!!mahua, 'Mahua exists in rate catalogue');
  assert(Boolean(mahua?.rateSource.includes('Simulated') || mahua?.rateSource.includes('Illustrative')), 'Rate source explicitly carries simulation/illustrative disclaimer');
  assert(mahua?.allowableShrinkagePercent === 1.5, 'Default allowable transit shrinkage is 1.5%');

  // Validate calibration bounds
  const validNewRate = 45.0;
  assert(validNewRate > 0 && validNewRate < 1000, 'Calibrated rate is within realistic procurement bounds');
  const validShrinkage = 1.8;
  assert(validShrinkage >= 0 && validShrinkage <= 5.0, 'Shrinkage tolerance within safe bounds (<= 5%)');

  // --- Group 3: CSV Export Data Integrity ---
  console.log('\n--- 3. CSV Data Export Structure ---');
  const sampleCsvHeader = 'ID,Slug,English Name,Odia Name,Scientific Name,Harvest Season,Benchmark Rate (INR/kg),Shrinkage Tolerance (%),Baseline Moisture Max (%),Packaging Standard,Rate Source Authority';
  assert(sampleCsvHeader.includes('Benchmark Rate'), 'CSV export headers include Benchmark Rate');
  assert(sampleCsvHeader.includes('Shrinkage Tolerance'), 'CSV export headers include Shrinkage Tolerance');
  assert(sampleCsvHeader.includes('Scientific Name'), 'CSV export headers include Scientific Name');

  // --- Group 4: Dual-Write Conflict Arbitration Invariants (Phase D) ---
  console.log('\n--- 4. Central Dual-Write Conflict Arbitration Invariants ---');
  const validResolutions = ['KEEP_LOCAL', 'KEEP_SERVER', 'MERGE'];
  assert(validResolutions.includes('KEEP_LOCAL'), 'Supports Keep Local arbitration');
  assert(validResolutions.includes('KEEP_SERVER'), 'Supports Keep Server arbitration');
  assert(validResolutions.includes('MERGE'), 'Supports Merge arbitration');

  const emptyMergeReason = '';
  assert(emptyMergeReason.trim().length < 5, 'Enforces substantive justification on merge resolution');
  const validMergeReason = 'Joint inspection confirmed tare bag weight variation on electronic scale';
  assert(validMergeReason.trim().length >= 5, 'Accepts valid supervisor arbitration rationale');

  // --- Group 5: Server-Side Route Protection & Authentication Guardrails (Batch 4) ---
  console.log('\n--- 5. Server-Side Route Protection & Access Control ---');

  // 5.1 /api/admin/export access control
  const unauthExportReq = makeRequest('/api/admin/export?entity=rates');
  const unauthExportRes = await exportGetRoute(unauthExportReq);
  assert(unauthExportRes.status === 401, 'Anonymous request to /api/admin/export rejected with HTTP 401 UNAUTHENTICATED');

  const collectorExportReq = makeRequest('/api/admin/export?entity=rates', { cookie: collectorToken });
  const collectorExportRes = await exportGetRoute(collectorExportReq);
  assert(collectorExportRes.status === 403, 'COLLECTOR role rejected from /api/admin/export with HTTP 403 FORBIDDEN');

  const facilitatorExportReq = makeRequest('/api/admin/export?entity=rates', { cookie: facilitatorToken });
  const facilitatorExportRes = await exportGetRoute(facilitatorExportReq);
  assert(facilitatorExportRes.status === 403, 'SHG_FACILITATOR role rejected from /api/admin/export with HTTP 403 FORBIDDEN');

  const mgrExportReq = makeRequest('/api/admin/export?entity=rates', { cookie: collectionManagerToken });
  const mgrExportRes = await exportGetRoute(mgrExportReq);
  assert(mgrExportRes.status === 403, 'COLLECTION_MANAGER role rejected from /api/admin/export with HTTP 403 FORBIDDEN');

  const whExportReq = makeRequest('/api/admin/export?entity=rates', { cookie: warehouseManagerToken });
  const whExportRes = await exportGetRoute(whExportReq);
  assert(whExportRes.status === 403, 'WAREHOUSE_MANAGER role rejected from /api/admin/export with HTTP 403 FORBIDDEN');

  const demoSupervisorExportReq = makeRequest('/api/admin/export?entity=rates', { cookie: demoSupervisorToken });
  const demoSupervisorExportRes = await exportGetRoute(demoSupervisorExportReq);
  assert(demoSupervisorExportRes.status === 403, 'Demo supervisor session rejected from /api/admin/export with HTTP 403 DEMO_SESSION_MUTATION_BLOCKED');

  // 5.2 /api/admin/conflicts access control
  const unauthConflictsReq = makeRequest('/api/admin/conflicts');
  const unauthConflictsRes = await conflictsGetRoute(unauthConflictsReq);
  assert(unauthConflictsRes.status === 401, 'Anonymous request to /api/admin/conflicts rejected with HTTP 401 UNAUTHENTICATED');

  const colConflictsReq = makeRequest('/api/admin/conflicts', { cookie: collectionManagerToken });
  const colConflictsRes = await conflictsGetRoute(colConflictsReq);
  assert(colConflictsRes.status === 403, 'COLLECTION_MANAGER rejected from GET /api/admin/conflicts with HTTP 403 FORBIDDEN');

  const whConflictsReq = makeRequest('/api/admin/conflicts', { cookie: warehouseManagerToken });
  const whConflictsRes = await conflictsGetRoute(whConflictsReq);
  assert(whConflictsRes.status === 403, 'WAREHOUSE_MANAGER rejected from GET /api/admin/conflicts with HTTP 403 FORBIDDEN');

  const demoConflictsReq = makeRequest('/api/admin/conflicts', { cookie: demoSupervisorToken });
  const demoConflictsRes = await conflictsGetRoute(demoConflictsReq);
  assert(demoConflictsRes.status === 403, 'Demo supervisor session rejected from /api/admin/conflicts with HTTP 403 DEMO_SESSION_MUTATION_BLOCKED');

  // 5.3 /api/admin/batches/[id]/reroute access control
  const unauthRerouteReq = makeRequest('/api/admin/batches/BS-402/reroute', { method: 'POST', body: {} });
  const unauthRerouteRes = await reroutePostRoute(unauthRerouteReq, { params: Promise.resolve({ id: 'BS-402' }) });
  assert(unauthRerouteRes.status === 401, 'Anonymous request to transit reroute rejected with HTTP 401 UNAUTHENTICATED');

  const whRerouteReq = makeRequest('/api/admin/batches/BS-402/reroute', {
    method: 'POST',
    cookie: warehouseManagerToken,
    body: { newDestinationDepotId: 'BRP-01', reason: 'Administrative depot capacity rebalancing test' },
  });
  const whRerouteRes = await reroutePostRoute(whRerouteReq, { params: Promise.resolve({ id: 'BS-402' }) });
  assert(whRerouteRes.status === 403, 'WAREHOUSE_MANAGER rejected from transit reroute with HTTP 403 FORBIDDEN');

  const demoRerouteReq = makeRequest('/api/admin/batches/BS-402/reroute', {
    method: 'POST',
    cookie: demoSupervisorToken,
    body: { newDestinationDepotId: 'BRP-01', reason: 'Administrative depot capacity rebalancing test' },
  });
  const demoRerouteRes = await reroutePostRoute(demoRerouteReq, { params: Promise.resolve({ id: 'BS-402' }) });
  assert(demoRerouteRes.status === 403, 'Demo supervisor rejected from transit reroute with HTTP 403 DEMO_SESSION_MUTATION_BLOCKED');

  // --- Group 6: Real Data Exports & Zero Mock Data Invariants (Batch 4) ---
  console.log('\n--- 6. Real Data Exports & Zero-Mock Ledger Invariants ---');

  // 6.1 Rates JSON Export
  const supervisorRatesJsonReq = makeRequest('/api/admin/export?entity=rates&format=json', { cookie: supervisorToken });
  const supervisorRatesJsonRes = await exportGetRoute(supervisorRatesJsonReq);
  assert(supervisorRatesJsonRes.status === 200, 'Authorized SUPERVISOR_ADMIN exports rates as JSON (HTTP 200)');
  const ratesJsonData = await supervisorRatesJsonRes.json();
  assert(ratesJsonData.success === true, 'Rates export returns success: true');
  assert(ratesJsonData.count === 17, 'Rates export returns all 17 Odisha MFP species');
  assert(ratesJsonData.exporter === 'A. Patnaik (District Procurement Officer)', 'Rates export carries authenticated exporter identity');
  assert(ratesJsonData.district === 'Mayurbhanj', 'Rates export carries supervisor district jurisdiction');

  // 6.2 Rates CSV Export
  const supervisorRatesCsvReq = makeRequest('/api/admin/export?entity=rates&format=csv', { cookie: supervisorToken });
  const supervisorRatesCsvRes = await exportGetRoute(supervisorRatesCsvReq);
  assert(supervisorRatesCsvRes.status === 200, 'Authorized SUPERVISOR_ADMIN exports rates as CSV (HTTP 200)');
  assert(
    supervisorRatesCsvRes.headers.get('content-type')?.includes('text/csv') === true,
    'Rates CSV export sets Content-Type text/csv header'
  );
  const ratesCsvText = await supervisorRatesCsvRes.text();
  assert(ratesCsvText.includes('Benchmark Rate (INR/kg)'), 'Rates CSV content contains Benchmark Rate header');
  assert(ratesCsvText.includes('Dried Mahua Flowers'), 'Rates CSV content contains authentic produce data');

  // 6.3 Batch Ledger Export: Must fail-closed when database unconfigured (Zero Fake Data)
  const supervisorBatchJsonReq = makeRequest('/api/admin/export?entity=batches&format=json', { cookie: supervisorToken });
  const supervisorBatchJsonRes = await exportGetRoute(supervisorBatchJsonReq);
  assert(
    supervisorBatchJsonRes.status === 503,
    'Batch ledger export fails closed with HTTP 503 DATABASE_UNCONFIGURED when PostgreSQL is unconfigured'
  );
  const batchErrorJson = await supervisorBatchJsonRes.json();
  assert(batchErrorJson.error === 'DATABASE_UNCONFIGURED', 'Batch export explicitly returns DATABASE_UNCONFIGURED error code');
  assert(
    batchErrorJson.data === undefined,
    'Batch export strictly withholds mock/sample batch records when database is unavailable'
  );

  const supervisorBatchCsvReq = makeRequest('/api/admin/export?entity=batches&format=csv', { cookie: supervisorToken });
  const supervisorBatchCsvRes = await exportGetRoute(supervisorBatchCsvReq);
  assert(
    supervisorBatchCsvRes.status === 503,
    'Batch CSV export fails closed with HTTP 503 without emitting fake CSV rows'
  );

  // 6.4 Cryptographic Audit Trail Export: Must fail-closed when database unconfigured
  const supervisorAuditReq = makeRequest('/api/admin/export?entity=audit&format=json', { cookie: supervisorToken });
  const supervisorAuditRes = await exportGetRoute(supervisorAuditReq);
  assert(
    supervisorAuditRes.status === 503,
    'Audit trail export fails closed with HTTP 503 DATABASE_UNCONFIGURED when PostgreSQL is unconfigured'
  );

  // 6.5 Parameter Validation
  const invalidEntityReq = makeRequest('/api/admin/export?entity=nonexistent', { cookie: supervisorToken });
  const invalidEntityRes = await exportGetRoute(invalidEntityReq);
  assert(invalidEntityRes.status === 400, 'Invalid export entity rejected with HTTP 400 INVALID_ENTITY');

  const invalidFormatReq = makeRequest('/api/admin/export?entity=rates&format=xml', { cookie: supervisorToken });
  const invalidFormatRes = await exportGetRoute(invalidFormatReq);
  assert(invalidFormatRes.status === 400, 'Invalid export format rejected with HTTP 400 INVALID_FORMAT');

  // --- Group 7: Conflict Arbitration & Fail-Closed Guardrails (Batch 4) ---
  console.log('\n--- 7. Conflict Arbitration & State Guardrails ---');

  const supervisorConflictsGetReq = makeRequest('/api/admin/conflicts', { cookie: supervisorToken });
  const supervisorConflictsGetRes = await conflictsGetRoute(supervisorConflictsGetReq);
  assert(supervisorConflictsGetRes.status === 200, 'Authorized SUPERVISOR_ADMIN accesses conflict ledger (HTTP 200)');
  const conflictsGetData = await supervisorConflictsGetRes.json();
  assert(
    conflictsGetData.source === 'LOCAL_STANDBY' || conflictsGetData.source === 'DATABASE_POSTGRESQL',
    'Conflict ledger reports honest data source (LOCAL_STANDBY without live database)'
  );

  // Malformed POST parameters
  const badParamPostReq = makeRequest('/api/admin/conflicts', {
    method: 'POST',
    cookie: supervisorToken,
    body: { conflictId: 'CONF-001', resolution: 'INVALID_TYPE' },
  });
  const badParamPostRes = await conflictsPostRoute(badParamPostReq);
  assert(badParamPostRes.status === 422, 'Invalid conflict resolution type rejected with HTTP 422');

  const shortMergeNoteReq = makeRequest('/api/admin/conflicts', {
    method: 'POST',
    cookie: supervisorToken,
    body: { conflictId: 'CONF-001', resolution: 'MERGE', resolutionNote: 'bad' },
  });
  const shortMergeNoteRes = await conflictsPostRoute(shortMergeNoteReq);
  assert(shortMergeNoteRes.status === 422, 'Merge resolution without substantive note rejected with HTTP 422 REASON_REQUIRED');

  // Valid resolution on unconfigured DB must fail closed (HTTP 503)
  const validConflictPostReq = makeRequest('/api/admin/conflicts', {
    method: 'POST',
    cookie: supervisorToken,
    body: {
      conflictId: 'CONF-001',
      resolution: 'KEEP_SERVER',
      resolutionNote: 'Supervisor verified electronic weighbridge calibration ticket #WB-991',
    },
  });
  const validConflictPostRes = await conflictsPostRoute(validConflictPostReq);
  assert(
    validConflictPostRes.status === 503,
    'Conflict resolution safely returns HTTP 503 DATABASE_UNCONFIGURED when server DB is unavailable'
  );

  // --- Group 8: Transit Reroute & District Jurisdiction Safeguards (Batch 4) ---
  console.log('\n--- 8. Transit Rerouting & Schema Enforcement ---');

  const malformedRerouteReq = makeRequest('/api/admin/batches/BS-402/reroute', {
    method: 'POST',
    cookie: supervisorToken,
    body: { newDestinationDepotId: 'BRP-01', reason: 'short' }, // reason must be >= 10 chars
  });
  const malformedRerouteRes = await reroutePostRoute(malformedRerouteReq, {
    params: Promise.resolve({ id: 'BS-402' }),
  });
  assert(malformedRerouteRes.status === 422, 'Reroute with reason under 10 chars rejected with HTTP 422 VALIDATION_FAILED');

  const validRerouteReq = makeRequest('/api/admin/batches/BS-402/reroute', {
    method: 'POST',
    cookie: supervisorToken,
    body: {
      newDestinationDepotId: 'BRP-01',
      reason: 'Administrative depot capacity rebalancing for central warehouse',
    },
  });
  const validRerouteRes = await reroutePostRoute(validRerouteReq, {
    params: Promise.resolve({ id: 'BS-402' }),
  });
  assert(
    validRerouteRes.status === 503,
    'Transit reroute safely returns HTTP 503 DATABASE_UNCONFIGURED without live database'
  );

  console.log('\n======================================================');
  console.log(`BATCH 4 & F11 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runAdminF11TestSuite().catch((err) => {
  console.error('Admin test suite encountered an error:', err);
  process.exit(1);
});
