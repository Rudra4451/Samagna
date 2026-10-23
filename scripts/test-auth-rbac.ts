/**
 * BanaSetu F2 Automated Test Suite
 * Validates Authentication, Session Life Cycle, RBAC Matrix, Boundary Isolation, and Anti-Spoofing.
 */

(process.env as any).NODE_ENV = 'test';
process.env.ALLOW_DEMO_ACCOUNTS = 'true';
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  authenticateCredentials,
  createSessionToken,
  verifySessionToken,
  requireServerRole,
  requireServerPermission,
  isResourceAuthorized,
  isDemoAccountsAllowed,
  ROLE_PERMISSIONS,
  UserRole,
  Permission,
  SessionPayload,
} from '../src/lib/server/auth';
import { NextRequest } from 'next/server';

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
  console.log('   BanaSetu F2: Authentication & RBAC Test Suite     ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Successful and Failed Login
  // --------------------------------------------------------------------------
  console.log('--- 1. Login Authentication & Password Verification ---');

  // 1.1 Valid logins for each role
  const rolesToTest: { user: string; role: UserRole }[] = [
    { user: 'sunita.soren', role: 'COLLECTOR' },
    { user: 'sumitra.marndi', role: 'SHG_FACILITATOR' },
    { user: 'manager.mohanty', role: 'COLLECTION_MANAGER' },
    { user: 'sdas.baripada', role: 'WAREHOUSE_MANAGER' },
    { user: 'patnaik.dpo', role: 'SUPERVISOR_ADMIN' },
  ];

  for (const { user, role } of rolesToTest) {
    const res = await authenticateCredentials(user, 'Test@Pass123');
    assert(
      res.success === true && res.user?.role === role,
      `Valid login for ${role} (${user})`
    );
  }

  // 1.2 Invalid password
  const failedPass = await authenticateCredentials('manager.mohanty', 'WrongPassword!999');
  assert(
    failedPass.success === false && failedPass.error === 'INVALID_CREDENTIALS',
    'Rejects incorrect password'
  );

  // 1.3 Non-existent user
  const nonExistent = await authenticateCredentials('fake.admin', 'Test@Pass123');
  assert(
    nonExistent.success === false && nonExistent.error === 'INVALID_CREDENTIALS',
    'Rejects non-existent username'
  );

  // 1.4 Case insensitivity on username
  const caseInsensitive = await authenticateCredentials('Manager.Mohanty', 'Test@Pass123');
  assert(caseInsensitive.success === true, 'Username authentication is case-insensitive');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Session Creation, Validation, and Expiration
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Session Token Lifecycle & Cryptographic Signing ---');

  const testPayload: SessionPayload = {
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
    isDemo: false,
  };

  const token = await createSessionToken(testPayload);
  assert(typeof token === 'string' && token.split('.').length === 3, 'Creates valid signed 3-part JWT');

  const verified = await verifySessionToken(token);
  assert(
    verified !== null &&
      verified.userId === testPayload.userId &&
      verified.role === testPayload.role &&
      verified.centerId === 'KRN-01',
    'Verifies token signature and extracts session payload'
  );

  // Tampered Token
  const tamperedToken = token.slice(0, -6) + 'xxxxxx';
  const tamperedRes = await verifySessionToken(tamperedToken);
  assert(tamperedRes === null, 'Rejects tampered session token');

  // Expired / Malformed Token
  const malformedRes = await verifySessionToken('not-a-real-token');
  assert(malformedRes === null, 'Rejects malformed token');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Unauthenticated API Requests
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Unauthenticated API Request Blocking ---');

  const mockUnauthReq = new NextRequest('http://localhost:3000/api/batches', {
    method: 'POST',
  });

  const unauthRoleCheck = await requireServerRole(mockUnauthReq, ['COLLECTION_MANAGER']);
  assert(
    unauthRoleCheck.authorized === false &&
      unauthRoleCheck.errorResponse?.status === 401,
    'Unauthenticated request blocked with HTTP 401'
  );

  const unauthPermCheck = await requireServerPermission(mockUnauthReq, 'CONFIRM_FIELD_COLLECTION');
  assert(
    unauthPermCheck.authorized === false &&
      unauthPermCheck.errorResponse?.status === 401,
    'Unauthenticated permission check blocked with HTTP 401'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Role-Based Permission Matrix (Permitted vs Forbidden)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Role-Based Access Control (Least Privilege) ---');

  // Helper to create authenticated NextRequest with session cookie
  async function createAuthReq(session: SessionPayload, url: string = 'http://localhost:3000/api/test') {
    const sToken = await createSessionToken(session);
    return new NextRequest(url, {
      method: 'POST',
      headers: {
        cookie: `banasetu_session=${sToken}`,
      },
    });
  }

  // Collector Permissions
  const collectorReq = await createAuthReq({
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    village: 'Badagaon',
    district: 'Mayurbhanj',
  });

  const colCanPickup = await requireServerPermission(collectorReq, 'CREATE_PICKUP_REQUEST');
  assert(colCanPickup.authorized === true, 'Collector PERMITTED to create pickup request');

  const colCannotWeigh = await requireServerPermission(collectorReq, 'CONFIRM_FIELD_COLLECTION');
  assert(
    colCannotWeigh.authorized === false && colCannotWeigh.errorResponse?.status === 403,
    'Collector FORBIDDEN from confirming field collection (HTTP 403)'
  );

  const colCannotDiscrepancy = await requireServerPermission(collectorReq, 'RESOLVE_DISCREPANCY');
  assert(
    colCannotDiscrepancy.authorized === false && colCannotDiscrepancy.errorResponse?.status === 403,
    'Collector FORBIDDEN from resolving discrepancies (HTTP 403)'
  );

  // Collection Manager Permissions
  const mgrReq = await createAuthReq(testPayload);

  const mgrCanWeigh = await requireServerPermission(mgrReq, 'CONFIRM_FIELD_COLLECTION');
  assert(mgrCanWeigh.authorized === true, 'Collection Manager PERMITTED to confirm field collection');

  const mgrCanDispatch = await requireServerPermission(mgrReq, 'DISPATCH_VEHICLE');
  assert(mgrCanDispatch.authorized === true, 'Collection Manager PERMITTED to dispatch vehicle');

  const mgrCannotResolve = await requireServerPermission(mgrReq, 'RESOLVE_DISCREPANCY');
  assert(
    mgrCannotResolve.authorized === false && mgrCannotResolve.errorResponse?.status === 403,
    'Collection Manager FORBIDDEN from resolving discrepancies (HTTP 403)'
  );

  // Warehouse Manager Permissions
  const whsReq = await createAuthReq({
    userId: 'USR-WHS-001',
    username: 'sdas.baripada',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'S. Das',
    centerId: 'BRP-DEPOT-01',
    district: 'Mayurbhanj',
  });

  const whsCanQuarantine = await requireServerPermission(whsReq, 'QUARANTINE_DISCREPANCY');
  assert(whsCanQuarantine.authorized === true, 'Warehouse Manager PERMITTED to quarantine discrepancy');

  const whsCannotChangePayment = await requireServerPermission(whsReq, 'CHANGE_COLLECTOR_PAYMENT');
  assert(
    whsCannotChangePayment.authorized === false && whsCannotChangePayment.errorResponse?.status === 403,
    'Warehouse Manager FORBIDDEN from modifying collector payment (HTTP 403)'
  );

  // Supervisor Admin Permissions
  const supReq = await createAuthReq({
    userId: 'USR-SUP-001',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'A. Patnaik',
    centerId: 'MBJ-HQ',
    district: 'Mayurbhanj',
  });

  const supCanResolve = await requireServerPermission(supReq, 'RESOLVE_DISCREPANCY');
  assert(supCanResolve.authorized === true, 'Supervisor Admin PERMITTED to resolve discrepancy');

  const supCanModifyPayment = await requireServerPermission(supReq, 'CHANGE_COLLECTOR_PAYMENT');
  assert(supCanModifyPayment.authorized === true, 'Supervisor Admin PERMITTED to authorize payment adjustments');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Anti-Spoofing Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Anti-Spoofing & Actor Identity Binding ---');

  // When a collector sends a request with spoofed role headers or body claims:
  // The server ignores them and derives identity exclusively from the authenticated session.
  const spoofAttemptReq = await createAuthReq(
    {
      userId: 'USR-COL-001',
      username: 'sunita.soren',
      role: 'COLLECTOR',
      fullName: 'Sunita Soren',
      district: 'Mayurbhanj',
    },
    'http://localhost:3000/api/batches'
  );

  // Spoofing headers
  spoofAttemptReq.headers.set('x-banasetu-role', 'SUPERVISOR_ADMIN');
  spoofAttemptReq.headers.set('x-banasetu-actor-id', 'USR-SUP-001');

  // Attempting supervisor operation
  const spoofCheck = await requireServerPermission(spoofAttemptReq, 'RESOLVE_DISCREPANCY');
  assert(
    spoofCheck.authorized === false && spoofCheck.errorResponse?.status === 403,
    'Ignores spoofed role headers; binds strictly to verified session (HTTP 403)'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 6: Multi-Tenant / Center / Village Boundary Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Multi-Tenant & Village/Center Boundary Isolation ---');

  const mgrActor: SessionPayload = {
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    centerId: 'KRN-01',
    district: 'Mayurbhanj',
  };

  const isOwnCenterAuth = isResourceAuthorized(mgrActor, { centerId: 'KRN-01' });
  assert(isOwnCenterAuth === true, 'Collection Manager authorized for own center (KRN-01)');

  const isCrossCenterAuth = isResourceAuthorized(mgrActor, { centerId: 'JAS-02' });
  assert(isCrossCenterAuth === false, 'Collection Manager BLOCKED from other center (JAS-02)');

  const facActor: SessionPayload = {
    userId: 'USR-FAC-001',
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR',
    fullName: 'Sumitra Marndi',
    village: 'Badagaon',
    district: 'Mayurbhanj',
  };

  const isOwnVillageAuth = isResourceAuthorized(facActor, { village: 'Badagaon' });
  assert(isOwnVillageAuth === true, 'Facilitator authorized for own village (Badagaon)');

  const isCrossVillageAuth = isResourceAuthorized(facActor, { village: 'Similipal-North' });
  assert(isCrossVillageAuth === false, 'Facilitator BLOCKED from other village (Similipal-North)');

  const colActor: SessionPayload = {
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    village: 'Badagaon',
    district: 'Mayurbhanj',
  };

  const isOwnDataAuth = isResourceAuthorized(colActor, { collectorId: 'USR-COL-001' });
  assert(isOwnDataAuth === true, 'Collector authorized to access own record');

  const isOtherDataAuth = isResourceAuthorized(colActor, { collectorId: 'USR-COL-002' });
  assert(isOtherDataAuth === false, 'Collector BLOCKED from accessing another collector record');

  // --------------------------------------------------------------------------
  // TEST GROUP 7: Demo Mode Server Mutation Guard
  // --------------------------------------------------------------------------
  console.log('\n--- 7. Demo Mode Protection (Simulations Cannot Mutate Server) ---');

  const demoReq = await createAuthReq({
    userId: 'DEMO-USER-001',
    username: 'demo.collector',
    role: 'COLLECTOR',
    fullName: 'Demo Collector (Simulated)',
    district: 'Mayurbhanj',
    isDemo: true, // Flagged as demo simulation
  });

  const demoCheck = await requireServerRole(demoReq, ['COLLECTOR']);
  assert(
    demoCheck.authorized === false &&
      demoCheck.errorResponse?.status === 403,
    'Demo mode sessions blocked from executing server mutations (HTTP 403)'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 8: Evaluator & Demo Accounts Security Invariants (Finding 2)
  // --------------------------------------------------------------------------
  console.log('\n--- 8. Evaluator Opt-In & Production Rejection Invariants ---');

  // 8.1 In test/dev with opt-in enabled, all 5 evaluator personas authenticate with isDemo: true
  assert(
    isDemoAccountsAllowed() === true,
    'isDemoAccountsAllowed returns true in development/test with ALLOW_DEMO_ACCOUNTS=true'
  );

  const evaluatorPersonas: { username: string; expectedRole: UserRole }[] = [
    { username: 'sunita.soren', expectedRole: 'COLLECTOR' },
    { username: 'sumitra.marndi', expectedRole: 'SHG_FACILITATOR' },
    { username: 'manager.mohanty', expectedRole: 'COLLECTION_MANAGER' },
    { username: 'sdas.baripada', expectedRole: 'WAREHOUSE_MANAGER' },
    { username: 'patnaik.dpo', expectedRole: 'SUPERVISOR_ADMIN' },
  ];

  for (const persona of evaluatorPersonas) {
    const res = await authenticateCredentials(persona.username, 'Test@Pass123');
    assert(
      res.success === true &&
        res.user?.isDemo === true &&
        res.user?.role === persona.expectedRole &&
        res.user?.username === persona.username,
      `Evaluator persona '${persona.username}' authenticates with role ${persona.expectedRole} and isDemo: true`
    );
  }

  // 8.2 Incorrect passwords for evaluator personas reject with INVALID_CREDENTIALS
  const wrongPassResult = await authenticateCredentials('sumitra.marndi', 'WrongPassword!456');
  assert(
    wrongPassResult.success === false && wrongPassResult.error === 'INVALID_CREDENTIALS',
    'Evaluator persona sumitra.marndi rejects incorrect password'
  );

  const wrongPassCollector = await authenticateCredentials('sunita.soren', 'InvalidPass@789');
  assert(
    wrongPassCollector.success === false && wrongPassCollector.error === 'INVALID_CREDENTIALS',
    'Evaluator persona sunita.soren rejects incorrect password'
  );

  // 8.3 In production, demo accounts are STRICTLY forbidden even with ALLOW_DEMO_ACCOUNTS=true
  (process.env as any).NODE_ENV = 'production';
  assert(
    isDemoAccountsAllowed() === false,
    'isDemoAccountsAllowed permanently returns false when NODE_ENV is production'
  );

  const prodLoginDpo = await authenticateCredentials('patnaik.dpo', 'Test@Pass123');
  assert(
    prodLoginDpo.success === false && prodLoginDpo.error === 'INVALID_CREDENTIALS',
    'Production environment strictly rejects demo account authentication (patnaik.dpo)'
  );

  const prodLoginFacilitator = await authenticateCredentials('sumitra.marndi', 'Test@Pass123');
  assert(
    prodLoginFacilitator.success === false && prodLoginFacilitator.error === 'INVALID_CREDENTIALS',
    'Production environment strictly rejects demo account authentication (sumitra.marndi)'
  );

  // 8.4 In development, when ALLOW_DEMO_ACCOUNTS is false or unset, demo accounts are rejected
  (process.env as any).NODE_ENV = 'development';
  process.env.ALLOW_DEMO_ACCOUNTS = 'false';
  assert(
    isDemoAccountsAllowed() === false,
    'isDemoAccountsAllowed returns false when ALLOW_DEMO_ACCOUNTS is false'
  );

  const disabledLogin = await authenticateCredentials('sumitra.marndi', 'Test@Pass123');
  assert(
    disabledLogin.success === false && disabledLogin.error === 'INVALID_CREDENTIALS',
    'Demo accounts rejected in development when ALLOW_DEMO_ACCOUNTS is not explicitly true'
  );

  delete process.env.ALLOW_DEMO_ACCOUNTS;
  assert(
    isDemoAccountsAllowed() === false,
    'isDemoAccountsAllowed returns false when ALLOW_DEMO_ACCOUNTS is unset'
  );
  const unsetLogin = await authenticateCredentials('sumitra.marndi', 'Test@Pass123');
  assert(
    unsetLogin.success === false && unsetLogin.error === 'INVALID_CREDENTIALS',
    'Demo accounts rejected in development when ALLOW_DEMO_ACCOUNTS is unset'
  );

  // 8.5 Configured database failure must return AUTHENTICATION_SERVICE_ERROR and never fall back
  process.env.ALLOW_DEMO_ACCOUNTS = 'true';
  const origDbUrl = process.env.DATABASE_URL;
  const origPrisma = (global as any).__banasetu_prisma;
  process.env.DATABASE_URL = 'postgresql://configured-user:real-pass@localhost:5432/live_ledger';
  (global as any).__banasetu_prisma = {
    user: {
      findUnique: async () => {
        throw new Error('Simulated PostgreSQL connection failure');
      },
    },
  };

  const dbFailureResult = await authenticateCredentials('sumitra.marndi', 'Test@Pass123');
  assert(
    dbFailureResult.success === false &&
      dbFailureResult.error === 'AUTHENTICATION_SERVICE_ERROR',
    'Configured database failure returns AUTHENTICATION_SERVICE_ERROR without demo fallback'
  );

  // Restore database state
  if (origDbUrl) {
    process.env.DATABASE_URL = origDbUrl;
  } else {
    delete process.env.DATABASE_URL;
  }
  if (origPrisma) {
    (global as any).__banasetu_prisma = origPrisma;
  } else {
    delete (global as any).__banasetu_prisma;
  }

  // Reset back to test environment
  (process.env as any).NODE_ENV = 'test';
  process.env.ALLOW_DEMO_ACCOUNTS = 'true';

  console.log('\n======================================================');
  console.log(`F2 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test runner encountered uncaught error:', err);
  process.exit(1);
});
