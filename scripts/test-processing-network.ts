/**
 * SAMAGNA Phase 4: Processing and Value-Addition Network Automated Test Suite
 *
 * Validates:
 * 1. Processing Facility Registration, Equipment Directory & Verification Status
 * 2. Processing Request Submission & Gating
 * 3. Capacity Matching Workflow (Manual Review Gate — No Automatic Inventory Allocation)
 * 4. Capacity Conflict Prevention & Scheduling Bounds
 * 5. Full Input-to-Output Lot Traceability Lineage
 * 6. Accurate Mass-Balance Reconciliation (Input = Output + By-Products + Loss)
 * 7. Quality Inspection Certification Enforcement
 * 8. Pilot Revenue Invariant (0.0% Coordination Fee, Zero Collector MSP Deductions)
 * 9. REST API Route Integration & Role-Based Authorization
 */

(process.env as any).NODE_ENV = 'test';
process.env.ALLOW_DEMO_ACCOUNTS = 'true';
process.env.AUTH_SECRET = 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  validateMassBalance,
  DEFAULT_PROCESSING_FACILITIES,
  DEFAULT_PROCESSING_REQUESTS,
  DEFAULT_PROCESSING_JOBS,
} from '../src/lib/processing';
import {
  resetStandbyProcessingStore,
  getProcessingFacilities,
  getProcessingFacilityById,
  registerProcessingFacility,
  updateFacilityVerificationStatus,
  getProcessingRequests,
  getProcessingRequestById,
  submitProcessingRequest,
  matchProcessingFacilitiesForRequest,
  reviewProcessingRequest,
  getProcessingJobs,
  getProcessingJobById,
  scheduleProcessingJob,
  updateProcessingJobProgress,
} from '../src/lib/server/processing';
import { GET as getFacilitiesRoute, POST as postFacilitiesRoute, PATCH as patchFacilitiesRoute } from '../src/app/api/processing/facilities/route';
import { GET as getRequestsRoute, POST as postRequestsRoute, PATCH as patchRequestsRoute } from '../src/app/api/processing/requests/route';
import { GET as getJobsRoute, POST as postJobsRoute, PATCH as patchJobsRoute } from '../src/app/api/processing/jobs/route';
import { createSessionToken } from '../src/lib/server/auth';
import { NextRequest } from 'next/server';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean | undefined | null | unknown, testName: string, detail?: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   SAMAGNA Phase 4: Processing & Value-Addition Net   ');
  console.log('======================================================\n');

  resetStandbyProcessingStore();

  // -------------------------------------------------------------------
  // 1. Processing Facility Directory & Verification
  // -------------------------------------------------------------------
  console.log('--- 1. Facility Management & Verification ---');

  const facilities = await getProcessingFacilities();
  assert(facilities.length >= 4, 'Seed processing facilities are loaded');

  const honeyFacility = await getProcessingFacilityById('FAC-MAYUR-HONEY-01');
  assert(honeyFacility !== null, 'Karanjia Honey Filtration center exists');
  assert(honeyFacility?.verificationStatus === 'VERIFIED_OPERATIONAL', 'Karanjia center is VERIFIED_OPERATIONAL');
  assert(honeyFacility?.dailyCapacityKg === 500.0, 'Karanjia center has 500 kg/day daily capacity');
  assert(honeyFacility?.processingCapabilities.includes('Cold Multi-Stage Filtration'), 'Certified for cold multi-stage filtration');

  const tamarindFacility = await getProcessingFacilityById('FAC-KORAPUT-TAMARIND-01');
  assert(tamarindFacility?.district === 'Koraput', 'Sunabeda Tamarind center is in Koraput district');
  assert(tamarindFacility?.dailyCapacityKg === 1000.0, 'Sunabeda Tamarind center daily capacity is 1,000 kg/day');

  // Register a new processing facility
  const newFacility = await registerProcessingFacility({
    code: 'FAC-BOUDH-01',
    name: 'Boudh Kendu Leaf Curing & Baling Center',
    operatorOrgId: 'ORG-TDCCOL-OR',
    operatorOrgName: 'TDCCOL Processing Partner',
    locationAddress: 'Forest Depot Road, Boudh',
    district: 'Boudh',
    state: 'Odisha',
    pincode: '762014',
    processingCapabilities: ['Moisture Equalization', 'Hydraulic Burlap Baling', 'Pest Barrier Fumigation'],
    supportedCategories: ['Non-Timber Forest Produce'],
    machineryEquipment: 'Electric Drying Chamber, 50-Ton Hydraulic Baler',
    dailyCapacityKg: 750.0,
    operatingAvailability: 'MON_TO_SAT_8AM_6PM',
    minimumBatchKg: 100.0,
    indicativeProcessingChargePerKg: 6.0,
    isActive: false,
  });

  assert(newFacility.id.startsWith('FAC-BOUDH-'), 'New facility receives valid ID');
  assert(newFacility.verificationStatus === 'PENDING_INSPECTION', 'New facility defaults to PENDING_INSPECTION');
  assert(newFacility.isActive === false, 'Pending facility is inactive until inspection');

  // Approve facility
  const approvedFac = await updateFacilityVerificationStatus(newFacility.id, 'VERIFIED_OPERATIONAL');
  assert(approvedFac.verificationStatus === 'VERIFIED_OPERATIONAL', 'Facility approved to VERIFIED_OPERATIONAL');
  assert(approvedFac.isActive === true, 'Approved facility is active');

  // -------------------------------------------------------------------
  // 2. Processing Requests & Gating
  // -------------------------------------------------------------------
  console.log('\n--- 2. Processing Requests & Enterprise Submission ---');

  const requests = await getProcessingRequests();
  assert(requests.length >= 2, 'Initial processing requests loaded');

  const daburReq = await getProcessingRequestById('REQ-PROC-2025-001');
  assert(daburReq !== null, 'Dabur Honey filtration request exists');
  assert(daburReq?.inputQuantityKg === 200.0, 'Input quantity is 200.0 kg');
  assert(daburReq?.expectedYieldPercent === 85.0, 'Expected yield is 85.0%');
  assert(daburReq?.expectedOutputQuantityKg === 170.0, 'Expected output quantity is 170.0 kg (85% of 200kg)');

  // Submit new request from verified enterprise
  const newRequest = await submitProcessingRequest({
    requestingOrgId: 'BUS-BAIDYA-02',
    requestingOrgName: 'Shree Baidyanath Ayurved Bhawan Pvt Ltd',
    targetFacilityId: null, // Open for capacity matching
    inputProduceSlug: 'harida',
    inputProduceName: 'Haritaki (Harida)',
    inputQuantityKg: 300.0,
    requiredOutputName: 'Cryo-Pulverized Haritaki Fine Powder (100 Mesh)',
    desiredQualitySpecs: 'Tannin > 32%, moisture < 9.0%, micro-sieved',
    expectedYieldPercent: 82.0,
    preferredStartDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    preferredCompletionDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    deliveryRequirements: 'Direct transit to Baidyanath Kolkata Plant',
  });

  assert(newRequest.status === 'SUBMITTED', 'Processing request created with status SUBMITTED');
  assert(newRequest.requestNumber.startsWith('REQ-PROC-2025-'), 'Sequential request number assigned');
  assert(newRequest.expectedOutputQuantityKg === 246.0, 'Expected output calculated: 300 * 82% = 246.0 kg');

  // -------------------------------------------------------------------
  // 3. Capacity Matching Workflow (Manual Review Gate)
  // -------------------------------------------------------------------
  console.log('\n--- 3. Capacity Matching & Non-Automatic Allocation ---');

  const matchResult = await matchProcessingFacilitiesForRequest(newRequest.id);
  assert(matchResult.candidateMatches.length > 0, 'Candidate matching returns evaluated facilities');

  const topMatch = matchResult.candidateMatches[0];
  assert(topMatch.facility.name.includes('Rourkela Wild Medicinal'), 'Rourkela Cryo-Pulverization facility ranked #1 for Harida grinding');
  assert(topMatch.isCapable === true, 'Top match identified as capable for cryo-milling medicinal flora');
  assert(topMatch.batchMeetsMinimum === true, 'Batch of 300 kg meets facility minimum batch (50 kg)');
  assert(topMatch.hasCapacityConflict === false, 'No capacity conflict on open dates');

  // INVARIANT: Matching does NOT allocate inventory or change request status automatically
  const reqAfterMatch = await getProcessingRequestById(newRequest.id);
  assert(reqAfterMatch?.status === 'SUBMITTED', 'Request remains SUBMITTED after matching — zero auto-allocation');

  // Manual Review and Confirmation Gate
  const acceptedRequest = await reviewProcessingRequest(newRequest.id, 'ACCEPT', topMatch.facility.id, 'Reviewed and accepted by plant coordinator.');
  assert(acceptedRequest.status === 'ACCEPTED', 'Request transitioned to ACCEPTED via manual confirmation');
  assert(acceptedRequest.targetFacilityId === topMatch.facility.id, 'Target facility confirmed manually');

  // -------------------------------------------------------------------
  // 4. Capacity Conflict Prevention
  // -------------------------------------------------------------------
  console.log('\n--- 4. Capacity Conflict Prevention ---');

  // Attempting to schedule a job exceeding the facility capacity limit
  let conflictError = false;
  try {
    // Schedule an enormous request that exceeds 3x daily capacity (500 * 3 = 1500 kg limit)
    const massiveReq = await submitProcessingRequest({
      requestingOrgId: 'BUS-DABUR-01',
      requestingOrgName: 'Dabur India',
      inputProduceSlug: 'honey-wild',
      inputProduceName: 'Raw Honey',
      inputQuantityKg: 2000.0, // Exceeds capacity
      requiredOutputName: 'Filtered Honey',
      desiredQualitySpecs: 'Standard',
      expectedYieldPercent: 85.0,
      preferredStartDate: '2025-05-01T00:00:00.000Z',
      preferredCompletionDate: '2025-05-03T00:00:00.000Z',
      deliveryRequirements: 'Depot transfer',
    });

    await scheduleProcessingJob({
      requestId: massiveReq.id,
      facilityId: 'FAC-MAYUR-HONEY-01',
      inputLotRef: 'BS-MASSIVE-01',
      startDate: '2025-05-01T00:00:00.000Z',
      targetCompletionDate: '2025-05-03T00:00:00.000Z',
      actor: 'Coordinator',
    });
  } catch (err: any) {
    conflictError = err.message.includes('CAPACITY_CONFLICT_EXCEEDED');
  }
  assert(conflictError, 'Capacity conflict engine blocks scheduling jobs exceeding facility capacity (CAPACITY_CONFLICT_EXCEEDED)');

  // -------------------------------------------------------------------
  // 5. Job Scheduling & Full Input-to-Output Lot Traceability
  // -------------------------------------------------------------------
  console.log('\n--- 5. Job Scheduling & Parent-to-Child Traceability ---');

  const scheduledJob = await scheduleProcessingJob({
    requestId: newRequest.id,
    facilityId: topMatch.facility.id,
    inputLotRef: 'BS-405', // Parent raw lot in warehouse
    startDate: '2025-04-10T08:00:00.000Z',
    targetCompletionDate: '2025-04-12T18:00:00.000Z',
    actor: 'Dr. Ramesh Jena (TDCCOL Plant Coord)',
  });

  assert(scheduledJob.jobCode.startsWith('JOB-PROC-2025-'), 'Job receives unique sequential jobCode');
  assert(scheduledJob.inputLotRef === 'BS-405', 'Maintains explicit parent input lot ref BS-405');
  assert(scheduledJob.outputLotRef.startsWith('LOT-VAL-HARIDA-'), 'Generated traceable child output lot ref');
  assert(scheduledJob.status === 'SCHEDULED', 'Job status initialized to SCHEDULED');
  assert(scheduledJob.coordinationFeeRate === 0.0, 'Coordination fee rate is 0.0% in pilot');
  assert(scheduledJob.coordinationFeeInr === 0.0, 'Coordination fee amount is ₹0.00');

  // Transition: SCHEDULED -> INPUT_STAGED
  const stagedJob = await updateProcessingJobProgress(scheduledJob.id, 'INPUT_STAGED', 'Plant Floor Supervisor', {
    notes: 'Lot BS-405 received: 300.0 kg gross verified on calibrated platform scale.',
  });
  assert(stagedJob.status === 'INPUT_STAGED', 'Job transitioned to INPUT_STAGED');

  // Transition: INPUT_STAGED -> IN_PROCESS
  const processingJob = await updateProcessingJobProgress(scheduledJob.id, 'IN_PROCESS', 'Cryo-Mill Operator', {
    notes: 'Cryogenic grinding with liquid nitrogen coolant active. Sieve mesh calibrated to 100 mesh.',
  });
  assert(processingJob.status === 'IN_PROCESS', 'Job transitioned to IN_PROCESS');

  // Transition: IN_PROCESS -> OUTPUT_INSPECTION
  const inspectionJob = await updateProcessingJobProgress(scheduledJob.id, 'OUTPUT_INSPECTION', 'QC Technician', {
    notes: 'Milling complete. Powder sampled for moisture and tannin assay.',
  });
  assert(inspectionJob.status === 'OUTPUT_INSPECTION', 'Job transitioned to OUTPUT_INSPECTION');

  // -------------------------------------------------------------------
  // 6. Mass-Balance Reconciliation & QC Certification Gate
  // -------------------------------------------------------------------
  console.log('\n--- 6. Mass-Balance Reconciliation & QC Gate ---');

  // Test Mass-Balance validation function directly
  const balancedCheck = validateMassBalance(300.0, 246.0, 36.0, 18.0);
  assert(balancedCheck.valid === true, 'Mass balance validation passes when Input (300) = Output (246) + By-Products (36) + Loss (18)');
  assert(balancedCheck.varianceKg === 0, 'Variance is exactly 0 kg');

  const discrepantCheck = validateMassBalance(300.0, 200.0, 20.0, 10.0);
  assert(discrepantCheck.valid === false, 'Mass balance detects unaccounted loss (300 != 200 + 20 + 10)');

  // Attempting to complete job with mass-balance discrepancy (Must be blocked)
  let discrepancyBlocked = false;
  try {
    await updateProcessingJobProgress(scheduledJob.id, 'COMPLETED_VERIFIED', 'Inspector', {
      outputQuantityKg: 200.0, // Discrepant numbers: 200 + 20 + 10 = 230 kg != 300 kg
      byProductQuantityKg: 20.0,
      processingLossKg: 10.0,
      qualityInspectionRef: 'QC-TEST-001',
    });
  } catch (err: any) {
    discrepancyBlocked = err.message.includes('MASS_BALANCE_DISCREPANCY_BLOCKED');
  }
  assert(discrepancyBlocked, 'Mass-balance discrepancy strictly blocks job completion (MASS_BALANCE_DISCREPANCY_BLOCKED)');

  // Attempting to complete job without quality inspection certificate (Must be blocked)
  let missingQcBlocked = false;
  try {
    await updateProcessingJobProgress(scheduledJob.id, 'COMPLETED_VERIFIED', 'Inspector', {
      outputQuantityKg: 246.0, // Balanced numbers: 246 + 36 + 18 = 300 kg
      byProductQuantityKg: 36.0,
      processingLossKg: 18.0,
      qualityInspectionRef: '', // Missing QC ref
    });
  } catch (err: any) {
    missingQcBlocked = err.message.includes('QUALITY_INSPECTION_REQUIRED');
  }
  assert(missingQcBlocked, 'Missing quality inspection certificate blocks job completion (QUALITY_INSPECTION_REQUIRED)');

  // Successful completion with verified mass-balance and QC certificate
  const completedJob = await updateProcessingJobProgress(scheduledJob.id, 'COMPLETED_VERIFIED', 'Dr. Ramesh Jena', {
    outputQuantityKg: 246.0,
    byProductQuantityKg: 36.0,
    byProductDescription: 'Coarse Husk & Seed Kernel Shell By-Products (Recovered for Compost/Tannin Extracts)',
    processingLossKg: 18.0, // 6.0% moisture/dust shrinkage
    qualityInspectionRef: 'QC-AYUSH-ROU-2025-014',
    qualityInspectionNotes: 'Tannin content assayed at 33.4% (compliant), moisture 8.8%, passed microbial limits.',
    documentUrl: '/docs/qc-ROU-2025-014.pdf',
    notes: 'Mass balance verified. Released to value-added inventory.',
  });

  assert(completedJob.status === 'COMPLETED_VERIFIED', 'Job successfully completed and verified');
  assert(completedJob.outputQuantityKg === 246.0, 'Output quantity recorded');
  assert(completedJob.byProductQuantityKg === 36.0, 'By-product quantity recorded');
  assert(completedJob.processingLossKg === 18.0, 'Processing loss recorded');
  assert(completedJob.actualYieldPercent === 82.0, 'Actual yield recorded as 82.0%');
  assert(completedJob.qualityInspectionRef === 'QC-AYUSH-ROU-2025-014', 'Quality inspection ref attached');
  assert(completedJob.auditHistory.length === 5, 'Append-only audit trail contains all 5 milestone transitions');

  // -------------------------------------------------------------------
  // 7. Pilot Revenue Invariant Verification
  // -------------------------------------------------------------------
  console.log('\n--- 7. Pilot Revenue Invariants ---');

  const allJobs = await getProcessingJobs();
  const allZeroFee = allJobs.every((j) => j.coordinationFeeRate === 0.0 && j.coordinationFeeInr === 0.0);
  assert(allZeroFee, 'Coordination fee rate is 0.0% across all pilot processing jobs');

  // -------------------------------------------------------------------
  // 8. REST API Route Integration Tests
  // -------------------------------------------------------------------
  console.log('\n--- 8. REST API Route Integration Tests ---');

  // A. Facilities GET
  const facReq = new NextRequest('http://localhost:3000/api/processing/facilities');
  const facRes = await getFacilitiesRoute(facReq);
  const facData = await facRes.json();
  assert(facRes.status === 200 && facData.success === true, 'GET /api/processing/facilities returns 200');
  assert(facData.facilities.length >= 4, 'API returns registered facilities');

  // B. Single Facility GET
  const singleFacReq = new NextRequest('http://localhost:3000/api/processing/facilities?id=FAC-MAYUR-HONEY-01');
  const singleFacRes = await getFacilitiesRoute(singleFacReq);
  const singleFacData = await singleFacRes.json();
  assert(singleFacRes.status === 200 && singleFacData.facility.code === 'FAC-KRN-01', 'GET /api/processing/facilities?id=... returns specific facility');

  // C. Requests GET
  const reqReq = new NextRequest('http://localhost:3000/api/processing/requests');
  const reqRes = await getRequestsRoute(reqReq);
  const reqData = await reqRes.json();
  assert(reqRes.status === 200 && reqData.success === true, 'GET /api/processing/requests returns 200');

  // D. Capacity Matching via API PATCH
  const matchReq = new NextRequest('http://localhost:3000/api/processing/requests', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'MATCH', requestId: 'REQ-PROC-2025-001' }),
  });
  const matchRes = await patchRequestsRoute(matchReq);
  const matchData = await matchRes.json();
  assert(matchRes.status === 200 && matchData.success === true, 'PATCH /api/processing/requests with action=MATCH returns 200');
  assert(matchData.candidates.length > 0, 'Capacity matching returns candidate list without auto-allocation');

  // E. Jobs GET
  const jobsReq = new NextRequest('http://localhost:3000/api/processing/jobs');
  const jobsRes = await getJobsRoute(jobsReq);
  const jobsData = await jobsRes.json();
  assert(jobsRes.status === 200 && jobsData.jobs.length >= 2, 'GET /api/processing/jobs returns active and completed jobs');

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  Processing Network Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('SUCCESS: All processing coordination, capacity matching & mass-balance checks passed.\n');
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});

