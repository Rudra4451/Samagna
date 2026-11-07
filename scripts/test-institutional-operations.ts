/**
 * SAMAGNA Phase 2: Automated Institutional Operations & Service Management Test Suite
 * Validates:
 * 1. Verified Institutional Organisation Management & Isolation
 * 2. Institutional Service Agreement (SLA), Fixed Fee, Deliverables & Renewal Tracking
 * 3. Operational Reporting with Strict Null vs Zero Distinction
 * 4. Role-Aware Institutional Dashboards & Boundaries
 * 5. Fixed-Fee Revenue Tracking, Treasury Reconciliation & Payment Gateway Blocking
 */

(process.env as any).NODE_ENV = 'test';
process.env.ALLOW_DEMO_ACCOUNTS = 'true';
process.env.AUTH_SECRET = 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  Organisation,
  InstitutionalServiceContract,
  InstitutionalInvoice,
  computeRevenueSummary,
  DEFAULT_PILOT_ORGANISATION,
  DEFAULT_PILOT_CONTRACT,
  DEFAULT_PILOT_INVOICES,
} from '../src/lib/institutional';
import {
  isActorAuthorizedForOrganisation,
  getInstitutionalOrganisation,
  updateInstitutionalConfiguration,
  getInstitutionalContract,
  getInstitutionalRevenue,
  recordInstitutionalPayment,
  generateOperationalReport,
} from '../src/lib/server/institutional';
import { SessionPayload } from '../src/lib/server/auth';
import { GET as getOrgRoute, PATCH as patchOrgRoute } from '../src/app/api/institutional/organisations/route';
import { GET as getContractRoute } from '../src/app/api/institutional/contracts/route';
import { GET as getRevenueRoute, POST as postRevenueRoute } from '../src/app/api/institutional/revenue/route';
import { GET as getReportsRoute } from '../src/app/api/institutional/reports/route';
import { createSessionToken } from '../src/lib/server/auth';
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
  console.log('   SAMAGNA Phase 2: Institutional Operations & SLA    ');
  console.log('======================================================\n');

  // Personas
  const supervisorActor: SessionPayload = {
    userId: 'USR-SUP-001',
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'A. Patnaik (District Procurement Officer)',
    district: 'Mayurbhanj',
    centerId: 'MBJ-HQ',
    isDemo: false,
  };

  const demoSupervisorActor: SessionPayload = {
    ...supervisorActor,
    isDemo: true,
  };

  const collectionManagerActor: SessionPayload = {
    userId: 'USR-MGR-001',
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    fullName: 'R. K. Mohanty',
    district: 'Mayurbhanj',
    centerId: 'KRN-01',
    isDemo: false,
  };

  const otherDistrictActor: SessionPayload = {
    userId: 'USR-EXT-999',
    username: 'external.officer',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'External Officer',
    district: 'Sundargarh',
    isDemo: false,
  };

  const warehouseManagerActor: SessionPayload = {
    userId: 'USR-WHS-001',
    username: 'sdas.baripada',
    role: 'WAREHOUSE_MANAGER',
    fullName: 'S. Das',
    district: 'Mayurbhanj',
    centerId: 'BRP-01',
    isDemo: false,
  };

  const collectorActor: SessionPayload = {
    userId: 'USR-COL-001',
    username: 'sunita.soren',
    role: 'COLLECTOR',
    fullName: 'Sunita Soren',
    district: 'Mayurbhanj',
    isDemo: false,
  };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: Institutional Organisation Profile, Verification & Isolation
  // --------------------------------------------------------------------------
  console.log('--- 1. Institutional Organisation Profile & Multi-Tenant Isolation ---');

  assert(
    DEFAULT_PILOT_ORGANISATION.verificationStatus === 'PILOT_VERIFIED',
    'Organisation carries verified status (PILOT_VERIFIED)'
  );
  assert(
    DEFAULT_PILOT_ORGANISATION.isDemonstrationPilot === true,
    'Organisation explicitly flagged with transparent pilot demonstration notice'
  );
  assert(
    DEFAULT_PILOT_ORGANISATION.statutoryOrderRef === 'ST-SC-DEPT-SANCTION-2024-881',
    'Organisation linked to official administrative sanction order'
  );
  assert(
    DEFAULT_PILOT_ORGANISATION.serviceArea.districts.includes('Mayurbhanj'),
    'Service area encompasses Mayurbhanj district'
  );
  assert(
    DEFAULT_PILOT_ORGANISATION.serviceArea.centerIds.includes('KRN-01') &&
      DEFAULT_PILOT_ORGANISATION.serviceArea.depotIds.includes('BRP-01'),
    'Service area encompasses Karanjia center and Baripada depot'
  );

  // Authorization checks
  assert(
    isActorAuthorizedForOrganisation(supervisorActor, DEFAULT_PILOT_ORGANISATION) === true,
    'Supervisor within Mayurbhanj authorized for TDCCOL Odisha'
  );
  assert(
    isActorAuthorizedForOrganisation(collectionManagerActor, DEFAULT_PILOT_ORGANISATION) === true,
    'Karanjia Collection Manager authorized for TDCCOL Odisha'
  );
  assert(
    isActorAuthorizedForOrganisation(otherDistrictActor, DEFAULT_PILOT_ORGANISATION) === false,
    'External district officer BLOCKED from accessing Mayurbhanj TDCCOL organisation'
  );

  // Configuration update clearances
  const validConfigUpdate = await updateInstitutionalConfiguration(supervisorActor, DEFAULT_PILOT_ORGANISATION.id, {
    allowableShrinkagePercent: 1.8,
  });
  assert(
    validConfigUpdate.success === true &&
      validConfigUpdate.organisation?.operationalConfig.allowableShrinkagePercent === 1.8,
    'SUPERVISOR_ADMIN permitted to update operational shrinkage tolerance'
  );

  const blockedConfigUpdate = await updateInstitutionalConfiguration(
    collectionManagerActor,
    DEFAULT_PILOT_ORGANISATION.id,
    { allowableShrinkagePercent: 2.5 }
  );
  assert(
    blockedConfigUpdate.success === false && blockedConfigUpdate.error === 'FORBIDDEN_SUPERVISOR_ONLY',
    'COLLECTION_MANAGER forbidden from mutating operational configuration'
  );

  // Reset back to baseline 1.5%
  await updateInstitutionalConfiguration(supervisorActor, DEFAULT_PILOT_ORGANISATION.id, {
    allowableShrinkagePercent: 1.5,
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Institutional Service Agreement (SLA), Deliverables & Renewal
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Institutional Service Agreement (SLA), Deliverables & Fees ---');

  const contractResult = await getInstitutionalContract(supervisorActor);
  assert(contractResult.success === true && Boolean(contractResult.contract), 'Supervisor retrieves service contract');

  const contract = contractResult.contract!;
  assert(contract.status === 'ACTIVE', 'Service contract status is ACTIVE');
  assert(contract.proposalRef === 'PROP-SAMAGNA-OD-2025-Q1', 'Proposal reference matches verified quote');
  assert(contract.contractRef === 'SAMAGNA-SLA-2025-01', 'Contract reference matches verified SLA');

  // Fixed Agreed Fee Breakdown
  assert(
    contract.fixedAgreedFee.annualPlatformLicense === 500000,
    'Annual platform licensing fee is ₹5,00,000'
  );
  assert(
    contract.fixedAgreedFee.setupOnboardingFee === 300000,
    'Scale onboarding and center setup fee is ₹3,00,000'
  );
  assert(
    contract.fixedAgreedFee.annualSlaMaintenanceFee === 150000,
    'Annual technology support & SLA maintenance fee is ₹1,50,000'
  );
  assert(
    contract.fixedAgreedFee.totalContractValue === 950000,
    'Total agreed institutional contract value is ₹9,50,000'
  );

  // Deliverables & Acceptance Criteria
  assert(contract.deliverables.length >= 4, 'Contract includes at least 4 milestone deliverables');
  const scaleDeliv = contract.deliverables.find((d) => d.code === 'DEL-SCALE-CALIB');
  assert(scaleDeliv?.status === 'COMPLETED', 'Scale calibration deliverable marked COMPLETED');
  assert(
    Boolean(scaleDeliv?.acceptanceCriteria),
    'Deliverable defines explicit acceptance criteria'
  );

  // Legal Non-Binding Disclaimer
  assert(
    contract.legalDisclaimer.includes('Does not constitute a legally binding agreement'),
    'Contract explicitly carries disclaimer barring automated execution of binding agreement'
  );

  // Collector Role Blocked from Contracts
  const collectorContract = await getInstitutionalContract(collectorActor);
  assert(
    collectorContract.success === false && collectorContract.error === 'FORBIDDEN_ADMIN_OR_MANAGER_ONLY',
    'Primary Collector role forbidden from inspecting institutional SLA contracts'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Operational Reporting with Strict Null vs Zero Distinction
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Operational Reporting (Strict Null vs Zero Distinction) ---');

  const reportResult = await generateOperationalReport(supervisorActor);
  assert(reportResult.success === true && Boolean(reportResult.report), 'Generates operational report');

  const report = reportResult.report!;
  assert(report.collectionVolumes.totalBatches >= 1, 'Report includes verified batch BS-402');
  assert(report.collectionVolumes.totalIntakeKg >= 100.0, 'Gross intake accurately aggregates electronic weighment');

  // Check Product-Wise Null Distinction
  const mahuaMetric = report.productWiseProcurement.find((p) => p.produceName.includes('Mahua'));
  assert(
    mahuaMetric?.volumeKg === 100.0 && mahuaMetric?.hasData === true,
    'Measured product (Mahua) returns actual recorded volume (100.0 kg) with hasData: true'
  );

  const unrecordedMetric = report.productWiseProcurement.find((p) => p.produceName.includes('Chironji'));
  assert(
    unrecordedMetric?.volumeKg === null && unrecordedMetric?.hasData === false,
    'Unrecorded species (Chironji) returns volumeKg: null and hasData: false (NOT 0.00 kg)'
  );
  assert(
    unrecordedMetric?.grossPayoutInr === null && unrecordedMetric?.averageRatePerKg === null,
    'Unrecorded species financial metrics are null'
  );

  // Collection Centre Activity Null Distinction
  const activeCenter = report.collectionCentreActivity.find((c) => c.centerCode === 'BDG-V1');
  assert(
    activeCenter?.intakeKg === 100.0 && activeCenter?.hasActivity === true,
    'Active center (Badagaon) returns recorded intake (100.0 kg)'
  );

  const inactiveCenter = report.collectionCentreActivity.find((c) => c.centerCode === 'JAS-02');
  assert(
    inactiveCenter?.intakeKg === null && inactiveCenter?.hasActivity === false,
    'Center without activity (Jashipur) returns intakeKg: null (NOT 0.00 kg)'
  );

  // 100% MSP Payout Non-Deduction Guarantee
  assert(
    report.settlementReferences.mspProtectionCompliant === true,
    '100% of notified MSP guaranteed to flow directly to primary gatherers'
  );

  // Warehouse Verification Status (Honest distinction: BS-402 is pending depot reweigh)
  assert(
    report.operationalPerformance.actualAverageShrinkagePercent === null,
    'Average shrinkage returns null when depot arrival re-weigh has not yet occurred'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 4: Fixed-Fee Revenue Tracking & Treasury Reconciliation
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Fixed-Fee Revenue Tracking & Treasury Reconciliation ---');

  const revenueResult = await getInstitutionalRevenue(supervisorActor);
  assert(revenueResult.success === true && Boolean(revenueResult.revenueSummary), 'Supervisor retrieves revenue summary');

  const rev = revenueResult.revenueSummary!;
  assert(rev.totalAgreedServiceAmount === 950000, 'Total agreed service fee is ₹9,50,000');
  assert(rev.totalInvoiced === 750000, 'Total invoiced amount is ₹7,50,000 across Q1, Q2, Q3');
  assert(rev.totalReceived === 587500, 'Total reconciled revenue received is ₹5,87,500');
  assert(rev.totalOutstandingBalance === 362500, 'Outstanding contract balance is ₹3,62,500');

  // Verify Invoice 1 Treasury Challan Reconciliation
  const q1Invoice = revenueResult.invoices?.find((i) => i.id === 'INV-SAM-2025-Q1');
  assert(q1Invoice?.status === 'PAID', 'Q1 Invoice status is PAID');
  assert(
    q1Invoice?.reconciliationStatus === 'FULLY_RECONCILED',
    'Q1 Invoice reconciliation status is FULLY_RECONCILED'
  );
  assert(
    q1Invoice?.payments[0]?.treasuryChallanNo === 'TREAS-OD-2025-08149',
    'Q1 Payment bound to official District Treasury Challan'
  );

  // Record Manual Government Settlement for Q3 Invoice
  const reconcileQ3 = await recordInstitutionalPayment(supervisorActor, {
    invoiceId: 'INV-SAM-2025-Q3',
    paymentMethod: 'NEFT_RTGS',
    bankUtr: 'SBIN-RTGS-20251101-4419',
    paidAmount: 162500,
    paymentDate: '2025-11-01T10:00:00.000Z',
    notes: 'Q3 institutional disbursement cleared by Finance Dept.',
  });
  assert(reconcileQ3.success === true, 'Successfully reconciled government RTGS payment for Q3');
  assert(reconcileQ3.invoice?.status === 'PAID', 'Q3 Invoice updated to PAID after full settlement');
  assert(
    reconcileQ3.invoice?.reconciliationStatus === 'FULLY_RECONCILED',
    'Q3 Reconciliation updated to FULLY_RECONCILED'
  );

  // Payment Gateway Rejection Invariant
  const gatewayAttempt = await recordInstitutionalPayment(supervisorActor, {
    invoiceId: 'INV-SAM-2025-Q3',
    paymentMethod: 'STRIPE_GATEWAY' as any,
    paidAmount: 1000,
    paymentDate: '2025-11-01',
  });
  assert(
    gatewayAttempt.success === false && gatewayAttempt.error === 'PAYMENT_GATEWAY_NOT_SUPPORTED',
    'Payment gateway integration attempts are strictly rejected'
  );

  // Demo Protection Invariant
  const demoPaymentAttempt = await recordInstitutionalPayment(demoSupervisorActor, {
    invoiceId: 'INV-SAM-2025-Q3',
    paymentMethod: 'TREASURY_CHALLAN',
    treasuryChallanNo: 'FAKE-CHALLAN',
    paidAmount: 5000,
    paymentDate: '2025-11-01',
  });
  assert(
    demoPaymentAttempt.success === false && demoPaymentAttempt.error === 'DEMO_SESSION_MUTATION_BLOCKED',
    'Demo sessions strictly blocked from recording payments'
  );

  // Confidentiality Check
  const managerRevenue = await getInstitutionalRevenue(collectionManagerActor);
  assert(
    managerRevenue.success === false && managerRevenue.error === 'FORBIDDEN_FINANCIAL_ADMIN_ONLY',
    'Collection Manager blocked from financial revenue records'
  );

  // --------------------------------------------------------------------------
  // TEST GROUP 5: Server-Side API HTTP Route Authorization Matrix
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Server-Side API Route Protection Matrix ---');

  const supervisorToken = await createSessionToken(supervisorActor);
  const managerToken = await createSessionToken(collectionManagerActor);
  const collectorToken = await createSessionToken(collectorActor);
  const demoToken = await createSessionToken(demoSupervisorActor);

  // 5.1 /api/institutional/organisations
  const unauthOrgReq = new NextRequest('http://localhost:3000/api/institutional/organisations');
  const unauthOrgRes = await getOrgRoute(unauthOrgReq);
  assert(unauthOrgRes.status === 401, 'Anonymous request to /api/institutional/organisations rejected with 401');

  const authOrgReq = new NextRequest('http://localhost:3000/api/institutional/organisations', {
    headers: { Authorization: `Bearer ${supervisorToken}` },
  });
  const authOrgRes = await getOrgRoute(authOrgReq);
  assert(authOrgRes.status === 200, 'SUPERVISOR_ADMIN accesses organisations API with 200');

  // PATCH /api/institutional/organisations demo blocked
  const demoPatchReq = new NextRequest('http://localhost:3000/api/institutional/organisations', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${demoToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operationalConfig: { allowableShrinkagePercent: 2.0 } }),
  });
  const demoPatchRes = await patchOrgRoute(demoPatchReq);
  assert(demoPatchRes.status === 403, 'Demo supervisor session rejected from mutating configuration (403)');

  // 5.2 /api/institutional/revenue
  const managerRevReq = new NextRequest('http://localhost:3000/api/institutional/revenue', {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  const managerRevRes = await getRevenueRoute(managerRevReq);
  assert(managerRevRes.status === 403, 'COLLECTION_MANAGER rejected from revenue API (403 FORBIDDEN)');

  const collectorRevReq = new NextRequest('http://localhost:3000/api/institutional/revenue', {
    headers: { Authorization: `Bearer ${collectorToken}` },
  });
  const collectorRevRes = await getRevenueRoute(collectorRevReq);
  assert(collectorRevRes.status === 403, 'COLLECTOR rejected from revenue API (403 FORBIDDEN)');

  // 5.3 /api/institutional/reports
  const reportReq = new NextRequest('http://localhost:3000/api/institutional/reports', {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  const reportRes = await getReportsRoute(reportReq);
  assert(reportRes.status === 200, 'COLLECTION_MANAGER authorized to access operational reports (200)');
  const reportJson = await reportRes.json();
  assert(
    reportJson.actorFacility === 'KRN-01',
    'Report API automatically binds facility scope to actor centerId'
  );

  console.log('\n======================================================');
  console.log(`PHASE 2 TEST RESULTS: ${passedTests}/${totalTests} checks passed.`);
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal error during Phase 2 test suite execution:', err);
  process.exit(1);
});

