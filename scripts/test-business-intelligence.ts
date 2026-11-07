/**
 * Automated Verification Suite for Samagna Phase 10:
 * Business Intelligence, Multi-Audience Reporting & Enterprise Traceability
 */

import {
  getInstitutionalBiReport,
  getB2bBiReport,
  getProcessingBiReport,
  getCommercialBiReport,
  getEnterpriseTraceabilityDossier,
} from '../src/lib/server/businessIntelligence';

import {
  maskCollectorName,
  maskTribalId,
  maskFinancialRecord,
  tagActual,
  tagEstimated,
  tagMissing,
  generateProvenanceDigest,
  generateTraceabilityPassportJson,
  generateTraceabilityPassportCsv,
} from '../src/lib/businessIntelligence';

import { sanitizeCsvCell } from '../src/lib/server/exportSanitizer';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   SAMAGNA Phase 10: Business Intelligence & BI Tests  ');
  console.log('======================================================\n');

  // Personas
  const adminActor: any = {
    userId: 'USR-ADMIN-01',
    role: 'SUPERVISOR_ADMIN',
    district: 'Mayurbhanj',
    fullName: 'A. Patnaik (District Admin)',
  };

  // --------------------------------------------------------------------------
  console.log('--- 1. Data Fidelity Ground Rules & Tagging ---');
  // --------------------------------------------------------------------------
  const actualTag = tagActual(100.0, 'Calibrated electronic scale');
  assert(actualTag.fidelity === 'ACTUAL', 'tagActual marks fidelity as ACTUAL');
  assert(actualTag.confidencePercent === 100, 'tagActual confidence is 100%');

  const estimatedTag = tagEstimated(1.5, 'Moisture shrinkage model', 85);
  assert(estimatedTag.fidelity === 'ESTIMATED', 'tagEstimated marks fidelity as ESTIMATED');
  assert(estimatedTag.confidencePercent === 85, 'tagEstimated confidence reflects model estimate');

  const missingTag = tagMissing(0, 'Missing inward receipt');
  assert(missingTag.fidelity === 'MISSING', 'tagMissing marks fidelity as MISSING');
  assert(missingTag.confidencePercent === 0, 'tagMissing confidence is 0%');

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Collector Privacy & PII Masking Guards ---');
  // --------------------------------------------------------------------------
  const maskedName = maskCollectorName('Sunita Soren');
  assert(maskedName.startsWith('S***** S****'), `Collector name is masked (${maskedName})`);
  assert(maskedName.includes('PRIMARY GATHERER'), 'Masked name tags verified primary gatherer status');
  assert(!maskedName.includes('Sunita'), 'Raw collector first name is strictly redacted');

  const maskedId = maskTribalId('OR-MAY-KRN-0842');
  assert(maskedId === 'OR-***-0842', `Tribal ID is masked to jurisdiction and token (${maskedId})`);
  assert(!maskedId.includes('KRN'), 'Specific sub-district identifier is redacted in public token');

  const maskedFin = maskFinancialRecord('State Bank of India', '••••4812');
  assert(maskedFin === '[STATUTORY_PRIVACY_PROTECTED]', 'Direct bank records are strictly redacted');

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Institutional Operations Reporting (B2G) ---');
  // --------------------------------------------------------------------------
  const instReport = await getInstitutionalBiReport(adminActor);
  assert(instReport.summary.totalBatches >= 5, `Total verified batches reported (${instReport.summary.totalBatches})`);
  assert(instReport.summary.totalProcuredKg >= 400, `Total procured volume reported (${instReport.summary.totalProcuredKg} kg)`);
  assert(instReport.summary.totalMspDisbursedInr > 0, `Total statutory MSP disbursed calculated (₹${instReport.summary.totalMspDisbursedInr})`);
  assert(instReport.procurementRecords.statutoryMspComplianceRatePercent === 100.0, 'Statutory MSP compliance rate is guaranteed 100%');
  assert(instReport.collectionActivity.speciesBreakdown.length >= 4, 'Intake species breakdown tracks all major botanicals');
  assert(instReport.centrePerformance.length >= 3, 'Aggregation centre throughput and target achievement tracked');

  const badagaonCenter = instReport.centrePerformance.find((c) => c.centerId === 'CEN-KRN-01');
  assert(Boolean(badagaonCenter), 'Badagaon Van Dhan Kendra performance record found');
  assert(badagaonCenter!.throughputKg > 0, 'Center throughput is greater than zero');

  assert(instReport.operationalReconciliation.totalDispatchedNetKg > 0, 'Reconciliation tracks total dispatched weight');
  assert(instReport.operationalReconciliation.totalArrivalNetKg > 0, 'Reconciliation tracks total arrival weight');
  assert(instReport.operationalReconciliation.netTransitShrinkageKg > 0, 'Net transit shrinkage is isolated from unexplained variance');
  assert(instReport.inventoryExceptions.openDiscrepanciesCount === 1, 'Quarantined discrepancy case is properly reported in exceptions');

  // --------------------------------------------------------------------------
  console.log('\n--- 4. B2B Bulk Trade Reporting ---');
  // --------------------------------------------------------------------------
  const b2bReport = await getB2bBiReport(adminActor);
  assert(b2bReport.summary.totalRfqs >= 1, `Total RFQs reported (${b2bReport.summary.totalRfqs})`);
  assert(b2bReport.summary.tradeGmvInr > 0, `B2B trade GMV calculated (₹${b2bReport.summary.tradeGmvInr})`);
  assert(b2bReport.quotationConversion.conversionRatePercent > 0, `Quotation conversion rate tracked (${b2bReport.quotationConversion.conversionRatePercent}%)`);
  assert(b2bReport.orderFulfilment.lotAcceptanceRatePercent >= 95, `Lot acceptance rate is high quality (${b2bReport.orderFulfilment.lotAcceptanceRatePercent}%)`);
  assert(b2bReport.supplierActivity.length >= 1, 'Verified supplier activity and reliability score tracked');
  assert(b2bReport.buyerActivity.length >= 1, 'Bulk buyer procurement spend and repeat purchase tracked');

  // --------------------------------------------------------------------------
  console.log('\n--- 5. Processing & Value-Addition Reporting ---');
  // --------------------------------------------------------------------------
  const procReport = await getProcessingBiReport(adminActor);
  assert(procReport.summary.totalDailyCapacityKg >= 2500, `Total daily milling capacity tracked (${procReport.summary.totalDailyCapacityKg} kg/day)`);
  assert(procReport.summary.overallUtilizationPercent > 0, `Capacity utilisation rate calculated (${procReport.summary.overallUtilizationPercent}%)`);
  assert(procReport.inputOutputReconciliation.totalRawInputKg > 0, 'Input-output reconciliation tracks raw feed kg');
  assert(procReport.inputOutputReconciliation.totalFinishedOutputKg > 0, 'Input-output reconciliation tracks finished yield kg');
  assert(procReport.inputOutputReconciliation.actualRecoveryRatePercent > 70, `Botanical recovery rate verified (${procReport.inputOutputReconciliation.actualRecoveryRatePercent}%)`);
  assert(procReport.jobPerformance.slaAdherencePercent >= 90, `Processing job SLA turnaround adherence tracked (${procReport.jobPerformance.slaAdherencePercent}%)`);

  // --------------------------------------------------------------------------
  console.log('\n--- 6. Commercial Operations & Revenue Reconciliation ---');
  // --------------------------------------------------------------------------
  const commReport = await getCommercialBiReport(adminActor);
  assert(commReport.summary.totalServiceRevenueInr > 0, `Total service revenue tracked (₹${commReport.summary.totalServiceRevenueInr})`);
  assert(commReport.summary.totalCollectedInr > 0, `Total collected revenue tracked (₹${commReport.summary.totalCollectedInr})`);
  assert(commReport.summary.collectorFeeProtectionVerified === true, 'Primary collector fee protection is verified active');
  assert(commReport.approvedServiceFees.primaryCollectorDeductionsInr === 0.0, 'Collector platform deduction is strictly ₹0.00');
  assert(commReport.reconciledTransactions.bankReferenceMatchPercent === 100.0, 'Bank reconciliation reference match is 100%');
  assert(commReport.reconciledTransactions.reconciliationVarianceInr === 0.0, 'Reconciliation variance is zero');
  assert(commReport.outstandingBalances.agingBuckets.under30DaysInr >= 0, 'Accounts receivable aging analysis computed');

  // --------------------------------------------------------------------------
  console.log('\n--- 7. Enterprise Traceability Dossiers & Custody Milestones ---');
  // --------------------------------------------------------------------------
  const dossier = await getEnterpriseTraceabilityDossier('BS-402', adminActor, 'COMMERCIAL_BUYER');
  assert(Boolean(dossier), 'Enterprise traceability dossier generated for lot BS-402');
  assert(dossier!.batchCode === '#BS-402', `Batch code matches #${dossier!.batchCode}`);
  assert(dossier!.produceName === 'Dried Mahua Flowers', 'Produce name matches botanical specimen');
  assert(dossier!.scientificName === 'Madhuca longifolia', 'Scientific botanical name included');
  assert(dossier!.collectorProvenance.piiProtectionActive === true, 'PII protection is explicitly active');

  // Verify collector anonymization
  for (const c of dossier!.collectorProvenance.collectorsSummary) {
    assert(!c.maskedName.includes('Sunita') && !c.maskedName.includes('Budhu'), `Collector name is safely masked (${c.maskedName})`);
    assert(c.payoutAmountRedacted === '[STATUTORY_PRIVACY_PROTECTED]', 'Individual payout amount is redacted in commercial export');
  }

  // Verify 6-step chain of custody timeline
  assert(dossier!.chainOfCustody.length === 6, `Complete 6-step chain of custody timeline present (${dossier!.chainOfCustody.length} steps)`);
  assert(dossier!.chainOfCustody[0].checkpointType === 'HARVEST_COLLECTION', 'Step 1 is HARVEST_COLLECTION');
  assert(dossier!.chainOfCustody[1].checkpointType === 'FIELD_VERIFICATION_WEIGHMENT', 'Step 2 is FIELD_VERIFICATION_WEIGHMENT');
  assert(dossier!.chainOfCustody[2].checkpointType === 'TRANSIT_DISPATCH', 'Step 3 is TRANSIT_DISPATCH');
  assert(dossier!.chainOfCustody[3].checkpointType === 'DEPOT_RECEIPT_VERIFICATION', 'Step 4 is DEPOT_RECEIPT_VERIFICATION');
  assert(dossier!.chainOfCustody[4].checkpointType === 'PROCESSING_VALUE_ADD', 'Step 5 is PROCESSING_VALUE_ADD');
  assert(dossier!.chainOfCustody[5].checkpointType === 'COMMERCIAL_ORDER_FULFILMENT', 'Step 6 is COMMERCIAL_ORDER_FULFILMENT');

  // Verify weight reconciliation
  assert(dossier!.weightReconciliation.fieldNetAcceptedKg === 100.0, 'Field intake net weight is 100.0 kg');
  assert(dossier!.weightReconciliation.depotArrivalNetKg === 98.5, 'Depot arrival net weight is 98.5 kg');
  assert(dossier!.weightReconciliation.transitShrinkageKg === 1.5, 'Transit shrinkage is exactly 1.5 kg');
  assert(dossier!.weightReconciliation.shrinkageToleranceKg === 2.0, 'Shrinkage tolerance is 2.0 kg');
  assert(dossier!.weightReconciliation.unexplainedVarianceKg === 0.0, 'Unexplained variance is 0.0 kg');

  // Verify tamper-evident cryptographic digest
  assert(dossier!.exportMetadata.tamperEvidentDigest.startsWith('SHA256-'), `Tamper evident digest present (${dossier!.exportMetadata.tamperEvidentDigest})`);
  assert(dossier!.dataCompletenessScore >= 95, `Completeness score is high (${dossier!.dataCompletenessScore}%)`);

  // --------------------------------------------------------------------------
  console.log('\n--- 8. Controlled Exports & Formula Injection Neutralization ---');
  // --------------------------------------------------------------------------
  const jsonExport = generateTraceabilityPassportJson(dossier!);
  assert(jsonExport.includes('"batchCode": "#BS-402"'), 'JSON export includes batch code');
  assert(jsonExport.includes('"piiProtectionActive": true'), 'JSON export confirms PII protection');

  const csvExport = generateTraceabilityPassportCsv(dossier!);
  assert(csvExport.includes('"#BS-402"'), 'CSV export contains quoted batch code');
  assert(csvExport.includes('"Madhuca longifolia"'), 'CSV export contains scientific name');
  assert(csvExport.includes('CUSTODY TIMELINE'), 'CSV export includes custody timeline section (with formula neutralization)');

  // Verify CSV formula injection defense (OWASP CWE-1236)
  const dangerousCell = sanitizeCsvCell('=cmd|/C calc.exe!A0');
  assert(dangerousCell.startsWith("\"'=cmd"), `Dangerous formula trigger '=' neutralized with leading quote (${dangerousCell})`);

  const plusCell = sanitizeCsvCell('+12345Formula');
  assert(plusCell.startsWith("\"'+"), `Dangerous trigger '+' neutralized (${plusCell})`);

  const atCell = sanitizeCsvCell('@SUM(1,2)');
  assert(atCell.startsWith("\"'@"), `Dangerous trigger '@' neutralized (${atCell})`);

  // Legitimate number remains numeric
  const safeNumber = sanitizeCsvCell(42.5);
  assert(safeNumber === '"42.5"', `Legitimate numeric value preserved as pure number (${safeNumber})`);

  // --------------------------------------------------------------------------
  console.log('\n--- 9. REST API Endpoints Integration Tests ---');
  // --------------------------------------------------------------------------
  const host = 'http://localhost:3000';

  try {
    // 1. Traceability Public / Commercial endpoint
    const traceRes = await fetch(`${host}/api/reports/traceability/BS-402`);
    assert(traceRes.status === 200, `GET /api/reports/traceability/BS-402 responds with ${traceRes.status}`);
    const traceJson = await traceRes.json();
    assert(traceJson.success === true, 'Traceability endpoint returns success: true');
    assert(traceJson.dossier?.batchCode === '#BS-402', 'Returned dossier matches requested batch');

    // 2. CSV Export endpoint
    const exportCsvRes = await fetch(`${host}/api/reports/traceability/BS-402/export?format=csv`);
    assert(exportCsvRes.status === 200, `GET /api/reports/traceability/BS-402/export?format=csv responds with ${exportCsvRes.status}`);
    const contentType = exportCsvRes.headers.get('content-type') || '';
    assert(contentType.includes('text/csv'), `Content-Type is text/csv (${contentType})`);
    const csvBody = await exportCsvRes.text();
    assert(csvBody.includes('#BS-402'), 'CSV export contains batch identifier');

    // 3. JSON Export endpoint
    const exportJsonRes = await fetch(`${host}/api/reports/traceability/BS-402/export?format=json`);
    assert(exportJsonRes.status === 200, `GET /api/reports/traceability/BS-402/export?format=json responds with ${exportJsonRes.status}`);
    const jsonContentType = exportJsonRes.headers.get('content-type') || '';
    assert(jsonContentType.includes('application/json'), `Content-Type is application/json (${jsonContentType})`);

    // 4. Role-guarded endpoints without auth return 401 Unauthenticated
    const unauthInstRes = await fetch(`${host}/api/reports/institutional`);
    assert(unauthInstRes.status === 401, `Unauthenticated GET /api/reports/institutional returns 401 (${unauthInstRes.status})`);

    const unauthB2bRes = await fetch(`${host}/api/reports/b2b`);
    assert(unauthB2bRes.status === 401, `Unauthenticated GET /api/reports/b2b returns 401 (${unauthB2bRes.status})`);

    const unauthProcRes = await fetch(`${host}/api/reports/processing`);
    assert(unauthProcRes.status === 401, `Unauthenticated GET /api/reports/processing returns 401 (${unauthProcRes.status})`);

    const unauthCommRes = await fetch(`${host}/api/reports/commercial`);
    assert(unauthCommRes.status === 401, `Unauthenticated GET /api/reports/commercial returns 401 (${unauthCommRes.status})`);
  } catch (err: any) {
    console.warn('Network tests skipped or failed:', err?.message);
    throw err;
  }

  console.log('\n======================================================');
  console.log(`  Business Intelligence Test Results: ${passedChecks}/${totalChecks} Passed`);
  console.log('======================================================\n');
  console.log('SUCCESS: All institutional, B2B, processing, commercial, and enterprise traceability reports verified.\n');
}

runTestSuite().catch((err) => {
  console.error('\n[FATAL] Test execution failed:\n', err);
  process.exit(1);
});
