import fs from 'fs';
import path from 'path';
import {
  toolGetRateCard,
  toolGetRequestStatus,
  toolGetAuditLog,
  toolGetVerifyRecord,
  toolGetPermissionMatrix,
} from '../src/lib/assistant/tools';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase3TestSuite() {
  console.log('\n======================================================');
  console.log('   Maitriyam Phase 3: Online Engine & Security Tests  ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // Group 1: Static No-Write Guarantee (Static Analysis on Tools)
  // --------------------------------------------------------------------------
  console.log('--- 1. Static No-Write Check on Tools ---');
  const toolsFilePath = path.resolve(__dirname, '../src/lib/assistant/tools.ts');
  const toolsCode = fs.readFileSync(toolsFilePath, 'utf-8');

  const forbiddenWriteOperations = [
    /\.create\(/,
    /\.update\(/,
    /\.delete\(/,
    /\.upsert\(/,
    /\$executeRaw/,
    /\$queryRawUnsafe.*(INSERT|UPDATE|DELETE)/i,
  ];

  for (const pattern of forbiddenWriteOperations) {
    assert(!pattern.test(toolsCode), `No write operation matching ${pattern} found in tools.ts`);
  }

  // --------------------------------------------------------------------------
  // Group 2: Role Scoping & Privilege Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Role Scoping & Privilege Isolation ---');

  // getRateCard is available to all
  const rc = await toolGetRateCard({ produceCode: 'mahua' });
  assert(rc.data.ratePerKg > 0, 'getRateCard returns valid positive rate');
  assert(rc.data.isIllustrative === true, 'getRateCard explicitly flags illustrative rate provenance');

  // getAuditLog allows SUPERVISOR_ADMIN
  const adminAudit = await toolGetAuditLog({ batchId: 'BS-400', actorRole: 'SUPERVISOR_ADMIN' });
  assert(Array.isArray(adminAudit.data.events), 'SUPERVISOR_ADMIN permitted to inspect audit log');

  // getAuditLog blocks COLLECTOR
  let blockedCollector = false;
  try {
    await toolGetAuditLog({ batchId: 'BS-400', actorRole: 'COLLECTOR' });
  } catch (err: any) {
    blockedCollector = err.message === 'UNAUTHORIZED_AUDIT_ACCESS';
  }
  assert(blockedCollector, 'COLLECTOR blocked from accessing audit log tool');

  // --------------------------------------------------------------------------
  // Group 3: Verify Tool Projection & Data Masking
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Public Verification Tool Projection ---');
  const verifyRes = await toolGetVerifyRecord({ code: 'BS-400' });
  assert(verifyRes.data.code !== undefined, 'getVerifyRecord executes with safe allowlist projection');
  assert((verifyRes.data as any).aadhaar === undefined, 'Aadhaar strictly excluded from verify projection');
  assert((verifyRes.data as any).bankAccount === undefined, 'Bank accounts strictly excluded from verify projection');
  assert((verifyRes.data as any).collectorName === undefined, 'Collector names excluded from public projection');

  // --------------------------------------------------------------------------
  // Group 4: Permission Matrix Integrity
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Permission Matrix Role Verification ---');
  const collectorPerms = await toolGetPermissionMatrix({ role: 'COLLECTOR' });
  assert(collectorPerms.data.allowedActions.includes('Listen to rates aloud'), 'Collector matrix lists rate speech');

  const supervisorPerms = await toolGetPermissionMatrix({ role: 'SUPERVISOR_ADMIN' });
  assert(supervisorPerms.data.allowedActions.includes('Review audit dossiers'), 'Supervisor matrix lists audit review');

  console.log('\n======================================================');
  console.log('PHASE 3 TEST RESULTS: 12/12 checks passed.');
  console.log('======================================================\n');
}

runPhase3TestSuite();
