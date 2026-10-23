/**
 * BanaSetu F4 & F15 Automated Test Suite
 * Validates Rate Limiting, API Envelopes, and Security Hardening Invariants
 */

import { checkRateLimit, resetRateLimit } from '../src/lib/server/rateLimit';
import { apiSuccess, apiError } from '../src/lib/server/response';

async function runBackendSecurityTestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu F4/F15: Backend Security & API Test Suite  ');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // --- Group 1: Sliding-Window Rate Limiting ---
  console.log('--- 1. Sliding-Window Token Bucket Rate Limiting ---');
  const testIp = '192.168.1.100';
  resetRateLimit(testIp, 'test-route');

  // Perform 5 allowed requests
  for (let i = 1; i <= 5; i++) {
    const res = checkRateLimit(testIp, 'test-route', { windowMs: 10_000, maxRequests: 5 });
    assert(res.allowed === true, `Request ${i} within limit is allowed`);
    assert(res.remaining === 5 - i, `Remaining count decrements to ${5 - i}`);
  }

  // 6th request must be rejected
  const blockedRes = checkRateLimit(testIp, 'test-route', { windowMs: 10_000, maxRequests: 5 });
  assert(blockedRes.allowed === false, 'Request exceeding maxRequests is blocked');
  assert(blockedRes.remaining === 0, 'Remaining count is 0 when blocked');
  assert(blockedRes.resetInSeconds > 0, 'Returns non-zero resetInSeconds');

  // Resetting allows requests again
  resetRateLimit(testIp, 'test-route');
  const resetRes = checkRateLimit(testIp, 'test-route', { windowMs: 10_000, maxRequests: 5 });
  assert(resetRes.allowed === true, 'Resetting rate limit immediately re-allows requests');

  // --- Group 2: Standardized API Response Envelopes ---
  console.log('\n--- 2. Standardized API Response Envelopes ---');
  const successRes = apiSuccess({ id: 'BS-402', status: 'VERIFIED' }, { total: 1 }, 200);
  assert(successRes.status === 200, 'Success response has HTTP 200');
  const successJson = await successRes.json();
  assert(successJson.success === true, 'Success envelope has success: true');
  assert(successJson.data.id === 'BS-402', 'Success envelope carries data payload');
  assert(successJson.meta.total === 1, 'Success envelope carries meta');

  const errorRes = apiError('Field validation failed', 'VALIDATION_FAILED', 422, null, {
    grossWeightKg: ['Gross weight must be positive'],
  });
  assert(errorRes.status === 422, 'Error response has HTTP 422');
  const errorJson = await errorRes.json();
  assert(errorJson.success === false, 'Error envelope has success: false');
  assert(errorJson.error.code === 'VALIDATION_FAILED', 'Error code is VALIDATION_FAILED');
  assert(
    errorJson.error.fieldErrors.grossWeightKg[0] === 'Gross weight must be positive',
    'Error envelope preserves fieldErrors structure'
  );

  console.log('\n======================================================');
  console.log(`F4/F15 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runBackendSecurityTestSuite().catch((err) => {
  console.error('Backend security test suite encountered an error:', err);
  process.exit(1);
});
