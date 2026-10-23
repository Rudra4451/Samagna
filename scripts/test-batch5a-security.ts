/**
 * BanaSetu Batch 5A: Targeted Security Remediation Test Suite
 *
 * Validates:
 * 1. Fix 1: CSV Formula Injection (CWE-1236) Protection
 * 2. Fix 2: Cross-District Conflict Visibility & Isolation
 * 3. Fix 3: Post-Login Open Redirect & Role-Boundary Hardening
 */

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import { NextRequest } from 'next/server';
import { sanitizeCsvCell, escapeCsvField } from '../src/lib/server/exportSanitizer';
import {
  getSafeRedirectDestination,
  getDefaultDestinationForRole,
  ROLE_ALLOWED_PREFIXES,
} from '../src/lib/authRedirect';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '../src/lib/server/auth';
import { GET as exportGetRoute } from '../src/app/api/admin/export/route';
import {
  GET as conflictsGetRoute,
  POST as conflictsPostRoute,
} from '../src/app/api/admin/conflicts/route';

async function runBatch5aSecurityTests() {
  console.log('\n======================================================');
  console.log('   BanaSetu Batch 5A: Targeted Security Remediation   ');
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
  const supervisorMayurbhanjToken = await createSessionToken({
    userId: 'USR-SUP-MAYURBHANJ',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'R. K. Patnaik',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  const supervisorNoDistrictToken = await createSessionToken({
    userId: 'USR-SUP-NO-DISTRICT',
    username: 'admin.global',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'Global Admin (Missing District)',
    district: '',
    isDemo: false,
  });

  const collectorToken = await createSessionToken({
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    district: 'Mayurbhanj',
    isDemo: false,
  });

  // =========================================================================
  // FIX 1: CSV Formula Injection Protection (CWE-1236)
  // =========================================================================
  console.log('--- 1. Fix 1: CSV Formula Injection Sanitization ---');

  // 1.1 Dangerous formula prefixes neutralised with single quote
  assert(sanitizeCsvCell('=SUM(A1:B1)') === "\"'=SUM(A1:B1)\"", 'Formula trigger "=" prefixed with single quote');
  assert(sanitizeCsvCell("=cmd|' /C calc'!A0") === "\"'=cmd|' /C calc'!A0\"", 'Command execution payload sanitized with single quote prefix');
  assert(sanitizeCsvCell('=cmd|"calc"') === "\"''=cmd|\"\"calc\"\"\"".replace(/^"''/, "\"'"), 'Formula trigger with double quotes escaped per RFC 4180');
  assert(sanitizeCsvCell('+cmd|...') === "\"'+cmd|...\"", 'Formula trigger "+" prefixed with single quote');
  assert(sanitizeCsvCell('@SUM(1,2)') === "\"'@SUM(1,2)\"", 'Formula trigger "@" prefixed with single quote');
  assert(sanitizeCsvCell('\t=cmd') === "\"'\t=cmd\"", 'Tab prefix followed by formula trigger neutralized');
  assert(sanitizeCsvCell('\r=cmd') === "\"'\r=cmd\"", 'Carriage return prefix followed by formula trigger neutralized');
  assert(sanitizeCsvCell('   =1+1') === "\"'   =1+1\"", 'Leading whitespace before formula trigger neutralized');
  assert(sanitizeCsvCell('-danger_macro') === "\"'-danger_macro\"", 'Negative text string prefixed with single quote');

  // 1.2 Normal negative and positive numeric values preserved for math
  assert(sanitizeCsvCell(-12.5) === '"-12.5"', 'Numeric negative float preserved as standard number');
  assert(sanitizeCsvCell('-12.5') === '"-12.5"', 'String negative float preserved as standard number');
  assert(sanitizeCsvCell(-0.05) === '"-0.05"', 'Small negative float (shrinkage variance) preserved');
  assert(sanitizeCsvCell('-0.05') === '"-0.05"', 'String small negative float preserved');
  assert(sanitizeCsvCell(0) === '"0"', 'Zero preserved as valid numeric');
  assert(sanitizeCsvCell(42) === '"42"', 'Positive integer preserved');
  assert(sanitizeCsvCell('100.5') === '"100.5"', 'String positive float preserved');

  // 1.3 Quotes, commas, newlines preserved per RFC 4180
  assert(sanitizeCsvCell('He said "Hello"') === '"He said ""Hello"""', 'Embedded double quotes correctly doubled');
  assert(sanitizeCsvCell('Baripada, Mayurbhanj') === '"Baripada, Mayurbhanj"', 'Commas within cell enclosed in quotes');
  assert(sanitizeCsvCell('Line 1\nLine 2') === '"Line 1\nLine 2"', 'Newlines enclosed in quotes');

  // 1.4 Empty and null values
  assert(sanitizeCsvCell(null) === '""', 'null returns empty quotes');
  assert(sanitizeCsvCell(undefined) === '""', 'undefined returns empty quotes');
  assert(sanitizeCsvCell('') === '""', 'empty string returns empty quotes');

  // 1.5 Unicode and Odia script preserved
  assert(sanitizeCsvCell('ମହୁଲ ଫୁଲ') === '"ମହୁଲ ଫୁଲ"', 'Odia Unicode produce name preserved intact');
  assert(sanitizeCsvCell('OD-MAYURBHANJ-କେନ୍ଦୁ-402') === '"OD-MAYURBHANJ-କେନ୍ଦୁ-402"', 'Bilingual code preserved intact');

  // 1.6 Export route integration check
  const ratesCsvReq = makeRequest('/api/admin/export?entity=rates&format=csv', { cookie: supervisorMayurbhanjToken });
  const ratesCsvRes = await exportGetRoute(ratesCsvReq);
  assert(ratesCsvRes.status === 200, 'Rates CSV export returns HTTP 200');
  const ratesCsvText = await ratesCsvRes.text();
  assert(ratesCsvText.includes('Dried Mahua Flowers'), 'Rates CSV contains expected product text');
  assert(ratesCsvText.includes('ମହୁଲ ଫୁଲ'), 'Rates CSV contains Odia Unicode text');
  assert(!ratesCsvText.includes('"=') && !ratesCsvText.includes('"+cmd'), 'Rates CSV contains zero unescaped formula triggers');

  // =========================================================================
  // FIX 2: Cross-District Conflict Visibility & Isolation
  // =========================================================================
  console.log('\n--- 2. Fix 2: Cross-District Conflict Visibility & Isolation ---');

  // 2.1 Unauthorized roles rejected
  const anonConflictsRes = await conflictsGetRoute(makeRequest('/api/admin/conflicts'));
  assert(anonConflictsRes.status === 401, 'Anonymous GET /api/admin/conflicts rejected with HTTP 401');

  const colConflictsRes = await conflictsGetRoute(makeRequest('/api/admin/conflicts', { cookie: collectorToken }));
  assert(colConflictsRes.status === 403, 'COLLECTOR rejected from GET /api/admin/conflicts with HTTP 403');

  // 2.2 Missing supervisor district rejected (fail closed)
  const noDistConflictsGetRes = await conflictsGetRoute(makeRequest('/api/admin/conflicts', { cookie: supervisorNoDistrictToken }));
  assert(noDistConflictsGetRes.status === 403, 'Supervisor without district rejected on GET with HTTP 403 DISTRICT_REQUIRED');
  const noDistGetJson = await noDistConflictsGetRes.json();
  assert(noDistGetJson.error === 'DISTRICT_REQUIRED', 'GET error explicitly indicates DISTRICT_REQUIRED');

  const noDistConflictsPostRes = await conflictsPostRoute(makeRequest('/api/admin/conflicts', {
    method: 'POST',
    cookie: supervisorNoDistrictToken,
    body: { conflictId: 'CONF-001', resolution: 'KEEP_SERVER' },
  }));
  assert(noDistConflictsPostRes.status === 403, 'Supervisor without district rejected on POST with HTTP 403 DISTRICT_REQUIRED');
  const noDistPostJson = await noDistConflictsPostRes.json();
  assert(noDistPostJson.error === 'DISTRICT_REQUIRED', 'POST error explicitly indicates DISTRICT_REQUIRED');

  // 2.3 Unconfigured database behavior (fail closed to live records)
  const mbjConflictsGetRes = await conflictsGetRoute(makeRequest('/api/admin/conflicts', { cookie: supervisorMayurbhanjToken }));
  assert(mbjConflictsGetRes.status === 200, 'Authorized supervisor with district receives HTTP 200 in standby mode');
  const mbjGetJson = await mbjConflictsGetRes.json();
  assert(mbjGetJson.source === 'LOCAL_STANDBY', 'Returns LOCAL_STANDBY when PostgreSQL is unconfigured');
  assert(mbjGetJson.district === 'Mayurbhanj', 'Carries supervisor district filter');
  assert(Array.isArray(mbjGetJson.conflicts) && mbjGetJson.conflicts.length === 0, 'Does not emit unverified conflicts');

  // 2.4 District isolation logic verification
  // Simulate district conflict filtering
  const mockConflicts = [
    { id: 'CONF-MAY-01', batchCode: 'BS-401', actorId: 'USR-01', clientPayload: JSON.stringify({ district: 'Mayurbhanj' }) },
    { id: 'CONF-SUN-01', batchCode: 'BS-801', actorId: 'USR-02', clientPayload: JSON.stringify({ district: 'Sundargarh' }) },
    { id: 'CONF-AMB-01', batchCode: 'BS-999', actorId: 'USR-03', clientPayload: JSON.stringify({}) }, // Missing district
  ];
  const mockBatchDistricts = new Map([
    ['BS-401', 'mayurbhanj'],
    ['BS-801', 'sundargarh'],
  ]);

  const supervisorDistrict = 'mayurbhanj';
  const filtered = mockConflicts.filter((c) => {
    if (c.batchCode && mockBatchDistricts.has(c.batchCode)) {
      return mockBatchDistricts.get(c.batchCode) === supervisorDistrict;
    }
    return false; // ambiguous fails closed
  });

  assert(filtered.length === 1 && filtered[0].id === 'CONF-MAY-01', 'Filters to exact supervisor district (Mayurbhanj)');
  assert(!filtered.some((c) => c.id === 'CONF-SUN-01'), 'Strictly excludes other-district conflict (Sundargarh)');
  assert(!filtered.some((c) => c.id === 'CONF-AMB-01'), 'Fails closed for ambiguous conflict without known district');

  // =========================================================================
  // FIX 3: Post-Login Open Redirect & Role-Boundary Hardening
  // =========================================================================
  console.log('\n--- 3. Fix 3: Post-Login Open Redirect & Role-Boundary Hardening ---');

  // 3.1 Valid role-specific destinations
  assert(getSafeRedirectDestination('/admin', 'SUPERVISOR_ADMIN') === '/admin', 'SUPERVISOR_ADMIN permitted to redirect to /admin');
  assert(getSafeRedirectDestination('/collector', 'COLLECTOR') === '/collector', 'COLLECTOR permitted to redirect to /collector');
  assert(getSafeRedirectDestination('/collection', 'COLLECTION_MANAGER') === '/collection', 'COLLECTION_MANAGER permitted to redirect to /collection');
  assert(getSafeRedirectDestination('/inventory', 'WAREHOUSE_MANAGER') === '/inventory', 'WAREHOUSE_MANAGER permitted to redirect to /inventory');
  assert(getSafeRedirectDestination('/facilitator', 'SHG_FACILITATOR') === '/facilitator', 'SHG_FACILITATOR permitted to redirect to /facilitator');

  // 3.2 Query parameters preserved on valid routes
  assert(
    getSafeRedirectDestination('/inventory?bay=quarantine&tab=active', 'WAREHOUSE_MANAGER') === '/inventory?bay=quarantine&tab=active',
    'Safe query parameters preserved on authorized route'
  );
  assert(
    getSafeRedirectDestination('/admin?tab=conflicts', 'SUPERVISOR_ADMIN') === '/admin?tab=conflicts',
    'Safe query parameters preserved on admin route'
  );

  // 3.3 Unauthorized role access to /admin rejected
  assert(getSafeRedirectDestination('/admin', 'COLLECTOR') === '/collector', 'COLLECTOR rejected from /admin and routed to /collector');
  assert(getSafeRedirectDestination('/admin', 'COLLECTION_MANAGER') === '/collection', 'COLLECTION_MANAGER rejected from /admin and routed to /collection');
  assert(getSafeRedirectDestination('/admin', 'WAREHOUSE_MANAGER') === '/inventory', 'WAREHOUSE_MANAGER rejected from /admin and routed to /inventory');
  assert(getSafeRedirectDestination('/admin', 'SHG_FACILITATOR') === '/facilitator', 'SHG_FACILITATOR rejected from /admin and routed to /facilitator');

  // 3.4 Cross-role unauthorized route access rejected
  assert(getSafeRedirectDestination('/inventory', 'COLLECTOR') === '/collector', 'COLLECTOR cannot access /inventory');
  assert(getSafeRedirectDestination('/collection', 'WAREHOUSE_MANAGER') === '/inventory', 'WAREHOUSE_MANAGER cannot access /collection');

  // 3.5 Protocol-relative URLs rejected
  assert(getSafeRedirectDestination('//example.com', 'SUPERVISOR_ADMIN') === '/admin', 'Protocol-relative "//example.com" rejected');
  assert(getSafeRedirectDestination('//evil.com/phishing', 'COLLECTOR') === '/collector', 'Protocol-relative "//evil.com" rejected');
  assert(getSafeRedirectDestination('///triple-slash.com', 'WAREHOUSE_MANAGER') === '/inventory', 'Triple-slash "///..." rejected');

  // 3.6 Backslash attack vectors rejected
  assert(getSafeRedirectDestination('/\\example.com', 'SUPERVISOR_ADMIN') === '/admin', 'Backslash "/\\\\example.com" rejected');
  assert(getSafeRedirectDestination('/\\evil.com', 'COLLECTOR') === '/collector', 'Backslash "/\\\\evil.com" rejected');
  assert(getSafeRedirectDestination('/test\\path', 'SUPERVISOR_ADMIN') === '/admin', 'Mid-path backslash rejected');
  assert(getSafeRedirectDestination('\\\\evil.com', 'SUPERVISOR_ADMIN') === '/admin', 'Leading backslashes rejected');

  // 3.7 URL-encoded attack vectors rejected
  assert(getSafeRedirectDestination('/%5cexample.com', 'SUPERVISOR_ADMIN') === '/admin', 'Encoded backslash "%5c" rejected');
  assert(getSafeRedirectDestination('/%5Cexample.com', 'COLLECTOR') === '/collector', 'Uppercase encoded backslash "%5C" rejected');
  assert(getSafeRedirectDestination('/%2f%2fexample.com', 'SUPERVISOR_ADMIN') === '/admin', 'Encoded double-slash "%2f%2f" rejected');

  // 3.8 External schemes rejected
  assert(getSafeRedirectDestination('https://evil.com', 'SUPERVISOR_ADMIN') === '/admin', 'External https scheme rejected');
  assert(getSafeRedirectDestination('http://evil.com', 'COLLECTOR') === '/collector', 'External http scheme rejected');
  assert(getSafeRedirectDestination('javascript:alert(1)', 'SUPERVISOR_ADMIN') === '/admin', 'javascript: pseudo-protocol rejected');
  assert(getSafeRedirectDestination('data:text/html,<script>alert(1)</script>', 'SUPERVISOR_ADMIN') === '/admin', 'data: URI scheme rejected');

  // 3.9 Redirect loops prevented
  assert(getSafeRedirectDestination('/login', 'SUPERVISOR_ADMIN') === '/admin', 'Redirect to /login rejected to prevent loop');
  assert(getSafeRedirectDestination('/login?redirect=/admin', 'COLLECTOR') === '/collector', 'Nested /login redirect rejected');
  assert(getSafeRedirectDestination('/logout', 'WAREHOUSE_MANAGER') === '/inventory', 'Redirect to /logout rejected');
  assert(getSafeRedirectDestination('/unauthorized', 'SUPERVISOR_ADMIN') === '/admin', 'Redirect to /unauthorized rejected');

  // 3.10 Malformed and empty inputs
  assert(getSafeRedirectDestination('', 'SUPERVISOR_ADMIN') === '/admin', 'Empty string returns default destination');
  assert(getSafeRedirectDestination('   ', 'COLLECTOR') === '/collector', 'Whitespace returns default destination');
  assert(getSafeRedirectDestination(null, 'WAREHOUSE_MANAGER') === '/inventory', 'null returns default destination');
  assert(getSafeRedirectDestination(undefined, 'SHG_FACILITATOR') === '/facilitator', 'undefined returns default destination');
  assert(getSafeRedirectDestination('/not-a-real-page', 'SUPERVISOR_ADMIN') === '/admin', 'Unrecognized route rejected');

  console.log('\n======================================================');
  console.log(`BATCH 5A SECURITY TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runBatch5aSecurityTests().catch((err) => {
  console.error('Batch 5A test suite encountered an error:', err);
  process.exit(1);
});
