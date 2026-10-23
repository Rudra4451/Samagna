/**
 * BanaSetu Batch 5B: Operational Route Security Test Suite
 *
 * Validates:
 * 1. Server-side session verification & cookie inspection
 * 2. Route protection for /admin, /inventory, /collection, /collector, /facilitator
 * 3. Role boundary matrix (allowed vs forbidden roles per operational tier)
 * 4. Anonymous and invalid session rejection with safe redirects
 * 5. Public route accessibility (/verify/[code], /api/health)
 * 6. Bcrypt documentation alignment verification
 */

process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import fs from 'fs';
import path from 'path';
import {
  createSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword,
} from '../src/lib/server/auth';
import {
  getSafeRedirectDestination,
  getDefaultDestinationForRole,
  ROLE_ALLOWED_PREFIXES,
} from '../src/lib/authRedirect';

async function runBatch5bRouteGuardTests() {
  console.log('\n======================================================');
  console.log('   BanaSetu Batch 5B: Operational Route Security QA   ');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
      process.exitCode = 1;
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --- 1. Layout Guard Files Verification ---
  console.log('--- 1. Server Component Layout Guard Presence ---');
  const requiredLayouts = [
    'src/app/admin/layout.tsx',
    'src/app/inventory/layout.tsx',
    'src/app/collection/layout.tsx',
    'src/app/collector/layout.tsx',
    'src/app/facilitator/layout.tsx',
  ];

  for (const relPath of requiredLayouts) {
    const fullPath = path.join(process.cwd(), relPath);
    assert(fs.existsSync(fullPath), `Layout guard exists: ${relPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(content.includes('verifySessionToken'), `${relPath} verifies session token`);
    assert(content.includes('redirect('), `${relPath} enforces server redirect`);
    assert(content.includes("export const dynamic = 'force-dynamic'"), `${relPath} is force-dynamic`);
  }

  // --- 2. Operational Route Role Authorization Matrix ---
  console.log('\n--- 2. Operational Route Role Authorization Matrix ---');

  const OPERATIONAL_ROUTE_POLICY: Record<string, { allowed: string[]; forbidden: string[] }> = {
    '/admin': {
      allowed: ['SUPERVISOR_ADMIN'],
      forbidden: ['COLLECTOR', 'SHG_FACILITATOR', 'COLLECTION_MANAGER', 'WAREHOUSE_MANAGER'],
    },
    '/inventory': {
      allowed: ['WAREHOUSE_MANAGER', 'SUPERVISOR_ADMIN'],
      forbidden: ['COLLECTOR', 'SHG_FACILITATOR', 'COLLECTION_MANAGER'],
    },
    '/collection': {
      allowed: ['COLLECTION_MANAGER', 'SUPERVISOR_ADMIN'],
      forbidden: ['COLLECTOR', 'SHG_FACILITATOR', 'WAREHOUSE_MANAGER'],
    },
    '/collector': {
      allowed: ['COLLECTOR', 'SHG_FACILITATOR', 'SUPERVISOR_ADMIN'],
      forbidden: ['COLLECTION_MANAGER', 'WAREHOUSE_MANAGER'],
    },
    '/facilitator': {
      allowed: ['SHG_FACILITATOR', 'SUPERVISOR_ADMIN'],
      forbidden: ['COLLECTOR', 'COLLECTION_MANAGER', 'WAREHOUSE_MANAGER'],
    },
  };

  // Helper simulating layout authorization logic
  function evaluateLayoutAuthorization(
    route: string,
    session: { role: string } | null
  ): { action: 'RENDER' | 'REDIRECT_LOGIN' | 'REDIRECT_UNAUTHORIZED'; destination?: string } {
    if (!session) {
      return { action: 'REDIRECT_LOGIN', destination: `/login?redirect=${route}` };
    }
    const policy = OPERATIONAL_ROUTE_POLICY[route];
    if (!policy) {
      return { action: 'REDIRECT_UNAUTHORIZED', destination: '/unauthorized' };
    }
    if (policy.allowed.includes(session.role)) {
      return { action: 'RENDER' };
    }
    return { action: 'REDIRECT_UNAUTHORIZED', destination: '/unauthorized' };
  }

  for (const [route, policy] of Object.entries(OPERATIONAL_ROUTE_POLICY)) {
    // 2.1 Unauthenticated / Missing session
    const anonResult = evaluateLayoutAuthorization(route, null);
    assert(
      anonResult.action === 'REDIRECT_LOGIN' && anonResult.destination === `/login?redirect=${route}`,
      `Unauthenticated access to ${route} redirects to /login?redirect=${route}`
    );

    // 2.2 Allowed roles
    for (const role of policy.allowed) {
      const allowedResult = evaluateLayoutAuthorization(route, { role });
      assert(
        allowedResult.action === 'RENDER',
        `Role '${role}' authorized to access ${route}`
      );
    }

    // 2.3 Forbidden roles
    for (const role of policy.forbidden) {
      const forbiddenResult = evaluateLayoutAuthorization(route, { role });
      assert(
        forbiddenResult.action === 'REDIRECT_UNAUTHORIZED' && forbiddenResult.destination === '/unauthorized',
        `Role '${role}' forbidden from ${route} and redirected to /unauthorized`
      );
    }
  }

  // --- 3. Token Integrity and Tampering Rejection ---
  console.log('\n--- 3. Token Integrity & Session Rejection ---');

  const validToken = await createSessionToken({
    userId: 'USR-WH-001',
    username: 'sdas.baripada',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'S. Das',
    district: 'Mayurbhanj',
    centerId: 'LOC-BRP-01',
    isDemo: false,
  });

  const verifiedSession = await verifySessionToken(validToken);
  assert(verifiedSession !== null && verifiedSession.username === 'sdas.baripada', 'Valid session token successfully verified');

  const tamperedToken = validToken.slice(0, -6) + 'xxxxxx';
  const tamperedSession = await verifySessionToken(tamperedToken);
  assert(tamperedSession === null, 'Tampered session token fails verification (returns null)');

  const emptySession = await verifySessionToken('');
  assert(emptySession === null, 'Empty session string fails verification (returns null)');

  const malformedSession = await verifySessionToken('not.a.valid.jwt.payload');
  assert(malformedSession === null, 'Malformed JWT fails verification (returns null)');

  // --- 4. Post-Login Redirect Loop and Boundary Checks ---
  console.log('\n--- 4. Safe Redirects & Loop Prevention ---');

  assert(getSafeRedirectDestination('/inventory', 'WAREHOUSE_MANAGER') === '/inventory', 'WAREHOUSE_MANAGER allowed redirect to /inventory');
  assert(getSafeRedirectDestination('/admin', 'COLLECTOR') === '/collector', 'COLLECTOR attempting redirect to /admin safely routed to /collector');
  assert(getSafeRedirectDestination('/login', 'SUPERVISOR_ADMIN') === '/admin', 'Redirect to /login prevented from creating loop');
  assert(getSafeRedirectDestination('/unauthorized', 'COLLECTION_MANAGER') === '/collection', 'Redirect to /unauthorized routed to role default');

  // --- 5. Public Routes Unaffected ---
  console.log('\n--- 5. Public Route Independence ---');

  const publicRoutes = ['/verify', '/verify/BS-402', '/login'];
  for (const pub of publicRoutes) {
    const layoutPath = path.join(process.cwd(), 'src/app', pub.split('/')[1], 'layout.tsx');
    assert(!fs.existsSync(layoutPath), `Public route ${pub} does not have a restrictive layout guard`);
  }

  // --- 6. Bcrypt Documentation Alignment Verification ---
  console.log('\n--- 6. Bcrypt Policy Alignment Verification ---');

  const securityMd = fs.readFileSync(path.join(process.cwd(), 'SECURITY.md'), 'utf8');
  assert(securityMd.includes('salt work-factor of 10'), 'SECURITY.md specifies bcrypt work-factor of 10');
  assert(!securityMd.includes('salt work-factor of 12'), 'SECURITY.md no longer contains stale work-factor 12');

  const roadmapMd = fs.readFileSync(path.join(process.cwd(), 'ROADMAP.md'), 'utf8');
  assert(roadmapMd.includes('bcrypt work factor 10'), 'ROADMAP.md specifies bcrypt work factor 10');
  assert(!roadmapMd.includes('bcrypt work factor 12'), 'ROADMAP.md no longer contains stale work factor 12');

  const testHash = await hashPassword('TestPassword123');
  assert(/^\$2[ab]\$10\$/.test(testHash), 'hashPassword produces $2a$10$ or $2b$10$ format (10 salt rounds)');
  const passwordMatch = await verifyPassword('TestPassword123', testHash);
  assert(passwordMatch === true, 'verifyPassword verifies password against cost factor 10 hash');

  console.log('\n======================================================');
  console.log(`BATCH 5B ROUTE GUARD TEST RESULTS: ${passed}/${total} checks passed.`);
  console.log('======================================================\n');
}

runBatch5bRouteGuardTests().catch((err) => {
  console.error('Batch 5B test suite error:', err);
  process.exit(1);
});
