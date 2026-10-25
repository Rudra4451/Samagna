import assert from 'node:assert';
import {
  authenticateCredentials,
  createSessionToken,
  verifySessionToken,
  SESSION_MAX_AGE_SECONDS,
} from '../src/lib/server/auth';
import { getSafeRedirectDestination, getDefaultDestinationForRole } from '../src/lib/authRedirect';

async function runPrompt2Verification() {
  console.log('\n======================================================');
  console.log('   Prompt 2: Login, Logout & Authentication Flow Verification');
  console.log('======================================================\n');

  // Ensure demo accounts are enabled for evaluation
  process.env.ALLOW_DEMO_ACCOUNTS = 'true';

  // 1. Test All Role Logins
  console.log('--- 1. Testing All 5 Role Logins (collector, manager, warehouse, admin, facilitator) ---');

  const testCases = [
    {
      username: 'sunita.soren',
      password: 'Test@Pass123',
      expectedRole: 'COLLECTOR',
      expectedDest: '/collector',
      label: 'Collector (Sunita Soren)',
    },
    {
      username: 'manager.mohanty',
      password: 'Test@Pass123',
      expectedRole: 'COLLECTION_MANAGER',
      expectedDest: '/collection',
      label: 'Collection Manager (A. Mohanty)',
    },
    {
      username: 'sdas.baripada',
      password: 'Test@Pass123',
      expectedRole: 'WAREHOUSE_MANAGER',
      expectedDest: '/inventory',
      label: 'Warehouse Manager (S. Das)',
    },
    {
      username: 'patnaik.dpo',
      password: 'Test@Pass123',
      expectedRole: 'SUPERVISOR_ADMIN',
      expectedDest: '/admin',
      label: 'Supervisor Admin (R. K. Patnaik)',
    },
    {
      username: 'sumitra.marndi',
      password: 'Test@Pass123',
      expectedRole: 'SHG_FACILITATOR',
      expectedDest: '/facilitator',
      label: 'SHG Facilitator (Sumitra Marndi)',
    },
  ];

  for (const tc of testCases) {
    const auth = await authenticateCredentials(tc.username, tc.password);
    assert(auth.success === true, `Login must succeed for ${tc.label}`);
    assert(auth.user !== undefined, `User payload must be defined for ${tc.label}`);
    assert.strictEqual(auth.user?.role, tc.expectedRole, `Role must match ${tc.expectedRole}`);
    
    // Check default dashboard destination
    const dest = getDefaultDestinationForRole(auth.user!.role);
    assert.strictEqual(dest, tc.expectedDest, `Default route for ${auth.user!.role} must be ${tc.expectedDest}`);

    // Create session token and verify
    const token = await createSessionToken(auth.user!);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT must be valid 3-part token');

    const session = await verifySessionToken(token);
    assert(session !== null, 'Session token must decode cleanly');
    assert.strictEqual(session?.username, tc.username, 'Session payload username must match');
    assert.strictEqual(session?.role, tc.expectedRole, 'Session payload role must match');

    console.log(`  [PASS] ${tc.label}: Authenticated as ${auth.user?.role} -> ${dest}`);
  }

  // 2. Error Handling & Validation
  console.log('\n--- 2. Error Handling & Bad Credentials ---');

  const badPass = await authenticateCredentials('patnaik.dpo', 'IncorrectPassword999');
  assert.strictEqual(badPass.success, false, 'Bad password must be rejected');
  assert.strictEqual(badPass.error, 'INVALID_CREDENTIALS', 'Error code must be INVALID_CREDENTIALS');
  console.log('  [PASS] Incorrect password rejected with INVALID_CREDENTIALS');

  const unknownUser = await authenticateCredentials('ghost.collector', 'Test@Pass123');
  assert.strictEqual(unknownUser.success, false, 'Unknown user must be rejected');
  assert.strictEqual(unknownUser.error, 'INVALID_CREDENTIALS', 'Error code must be INVALID_CREDENTIALS');
  console.log('  [PASS] Non-existent user rejected with INVALID_CREDENTIALS');

  // 3. Proper Redirects & Role Boundary Clearance
  console.log('\n--- 3. Proper Redirects & Role Escalation Defense ---');

  // Open-redirect prevention
  const openRedirect1 = getSafeRedirectDestination('//evil.com', 'COLLECTOR');
  assert.strictEqual(openRedirect1, '/collector', 'Protocol-relative URL must fall back to /collector');
  console.log('  [PASS] Blocked protocol-relative open-redirect (//evil.com)');

  const openRedirect2 = getSafeRedirectDestination('https://attacker.site/steal', 'SUPERVISOR_ADMIN');
  assert.strictEqual(openRedirect2, '/admin', 'External scheme URL must fall back to /admin');
  console.log('  [PASS] Blocked external URL open-redirect (https://attacker.site/steal)');

  // Role clearance enforcement
  const collectorToAdmin = getSafeRedirectDestination('/admin', 'COLLECTOR');
  assert.strictEqual(collectorToAdmin, '/collector', 'Collector cannot be redirected to /admin');
  console.log('  [PASS] Collector barred from /admin redirect -> safe fallback to /collector');

  const warehouseToCollection = getSafeRedirectDestination('/collection', 'WAREHOUSE_MANAGER');
  assert.strictEqual(warehouseToCollection, '/inventory', 'Warehouse manager barred from /collection redirect');
  console.log('  [PASS] Warehouse manager barred from /collection redirect -> safe fallback to /inventory');

  const adminToAdmin = getSafeRedirectDestination('/admin', 'SUPERVISOR_ADMIN');
  assert.strictEqual(adminToAdmin, '/admin', 'Admin legitimately permitted to /admin');
  console.log('  [PASS] Admin authorized for /admin redirect');

  console.log('\n======================================================');
  console.log('   PROMPT 2 VERIFICATION: ALL 13 CHECKS PASSED');
  console.log('======================================================\n');
}

runPrompt2Verification().catch((err) => {
  console.error('Prompt 2 verification failed:', err);
  process.exit(1);
});
