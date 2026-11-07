/**
 * SAMAGNA Phase 5: Logistics & Fulfilment Network Automated Test Suite
 *
 * Validates:
 * 1. Transporter & Carrier Fleet Profiles & Verification Gating
 * 2. Custody Record Linkage (Purchase Orders, Processing Jobs, Warehouse Batches)
 * 3. Commercial Consignment Creation & Automated Freight Calculation
 * 4. Step-by-Step Shipment Lifecycle (Created -> Pickup -> Dispatched -> Delivered)
 * 5. Deterministic Reconciliation: Full Delivery vs Partial Delivery vs Failed Delivery
 * 6. Transit Exception, Delay & Damage Reporting
 * 7. Shipment Cancellation Rules & Boundaries
 * 8. Pilot Revenue Invariants (0.0% Logistics Coordination Fee)
 * 9. REST API Route Integration & Verification
 */

(process.env as any).NODE_ENV = 'test';
process.env.ALLOW_DEMO_ACCOUNTS = 'true';
process.env.AUTH_SECRET = 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  calculateDeliveryVariance,
  DEFAULT_LOGISTICS_PROVIDERS,
  DEFAULT_COMMERCIAL_SHIPMENTS,
} from '../src/lib/logistics';
import {
  resetStandbyLogisticsStore,
  getLogisticsProviders,
  getLogisticsProviderById,
  registerLogisticsProvider,
  updateCarrierVerificationStatus,
  getCommercialShipments,
  getCommercialShipmentById,
  createCommercialShipment,
  confirmShipmentPickup,
  confirmShipmentDispatch,
  confirmShipmentDelivery,
  reportShipmentException,
  cancelShipment,
} from '../src/lib/server/logistics';
import { GET as getCarriersRoute, POST as postCarriersRoute, PATCH as patchCarriersRoute } from '../src/app/api/logistics/carriers/route';
import { GET as getShipmentsRoute, POST as postShipmentsRoute, PATCH as patchShipmentsRoute } from '../src/app/api/logistics/shipments/route';
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
  console.log('   SAMAGNA Phase 5: Logistics & Fulfilment Network    ');
  console.log('======================================================\n');

  resetStandbyLogisticsStore();

  // -------------------------------------------------------------------
  // 1. Transporter & Logistics Provider Profiles
  // -------------------------------------------------------------------
  console.log('--- 1. Carrier Profiles & Verification Gate ---');

  const carriers = await getLogisticsProviders();
  assert(carriers.length >= 4, 'Seed logistics providers are loaded');

  const stateCoopFleet = await getLogisticsProviderById('LOG-OR-COOP-01');
  assert(stateCoopFleet !== null, 'State Forest Produce Transport Cooperative exists');
  if (!stateCoopFleet) throw new Error('stateCoopFleet not found');
  assert(stateCoopFleet.carrierType === 'STATE_COOPERATIVE_FLEET', 'State fleet registered as STATE_COOPERATIVE_FLEET');
  assert(stateCoopFleet.isVerified === true, 'State fleet is verified');
  assert(stateCoopFleet.operatingRatePerKm === 38.0, 'Standard rate is ₹38.00/km');

  const unverifiedCarrier = await getLogisticsProviderById('LOG-UNVERIF-04');
  assert(unverifiedCarrier !== null && unverifiedCarrier.isVerified === false, 'Maa Tarini carrier is unverified');
  assert(unverifiedCarrier?.isActive === false, 'Unverified carrier is inactive');

  // Register a new carrier
  const newCarrier = await registerLogisticsProvider({
    code: 'CARRIER-RAY-01',
    name: 'Rayagada Tribal Agro-Express Logistics',
    carrierType: 'AGGREGATION_SHG_TRANSPORT',
    registrationNumber: 'OD-SHG-TR-2022-019',
    gstin: null,
    pan: 'AABCR9911R',
    contactPerson: 'Siba Prasad Hikaka',
    contactPhone: '+91-9861007788',
    contactEmail: 'rayagada.agro.haulage@gmail.com',
    fleetSize: 4,
    supportedDistricts: ['Rayagada', 'Koraput', 'Kalahandi'],
    operatingRatePerKm: 34.0,
  });

  assert(newCarrier.id.startsWith('LOG-'), 'New carrier receives valid ID');
  assert(newCarrier.isVerified === false, 'Newly registered carrier defaults to unverified');

  // Verify carrier
  const approvedCarrier = await updateCarrierVerificationStatus(newCarrier.id, true, true);
  assert(approvedCarrier.isVerified === true, 'Carrier verification approved');
  assert(approvedCarrier.isActive === true, 'Approved carrier is now active');

  // -------------------------------------------------------------------
  // 2. Custody Record Linkage & Consignment Creation
  // -------------------------------------------------------------------
  console.log('\n--- 2. Custody Record Linkage & Consignment Creation ---');

  const initialShipments = await getCommercialShipments();
  assert(initialShipments.length >= 2, 'Seed shipments loaded');

  const poShipment = await getCommercialShipmentById('SHP-2025-001');
  assert(poShipment !== null, 'Shipment linked to PO exists');
  assert(poShipment?.sourceType === 'PURCHASE_ORDER', 'Source type is PURCHASE_ORDER');
  assert(poShipment?.sourceReferenceId === 'PO-B2B-2025-001', 'Linked explicitly to PO-B2B-2025-001');
  assert(poShipment?.lotReference === 'LIST-MAHUA-2025-01', 'Linked to physical lot LIST-MAHUA-2025-01');

  // Attempt to create shipment with UNVERIFIED carrier (Must be blocked)
  let unverifiedCarrierBlocked = false;
  try {
    await createCommercialShipment({
      carrierId: 'LOG-UNVERIF-04', // Unverified carrier
      vehicleNumber: 'OD-11-Z-9999',
      driverName: 'Unverified Driver',
      driverPhone: '+91-0000000000',
      sourceType: 'PURCHASE_ORDER',
      sourceReferenceId: 'PO-TEST-001',
      lotReference: 'BS-402',
      produceName: 'Mahua',
      dispatchedQuantityKg: 100,
      originFacilityId: 'BRP-01',
      originFacilityName: 'Depot',
      originAddress: 'Baripada',
      destinationFacilityName: 'Destination',
      destinationAddress: 'Destination',
      sealTagIds: ['SEAL-01'],
      tarpaulinSecured: true,
      estimatedArrivalDate: new Date().toISOString(),
      distanceKm: 100,
      supportingDocuments: [],
    });
  } catch (err: any) {
    unverifiedCarrierBlocked = err.message.includes('UNVERIFIED_CARRIER_BLOCKED');
  }
  assert(unverifiedCarrierBlocked, 'Unverified carrier is blocked from consignment dispatch (UNVERIFIED_CARRIER_BLOCKED)');

  // Attempt to create shipment WITHOUT custody linkage (Must be blocked)
  let custodyLinkageBlocked = false;
  try {
    await createCommercialShipment({
      carrierId: stateCoopFleet.id,
      vehicleNumber: 'OD-11-A-4402',
      driverName: 'Driver',
      driverPhone: '+91-0000000000',
      sourceType: 'PURCHASE_ORDER',
      sourceReferenceId: '', // Missing source reference
      lotReference: '', // Missing lot reference
      produceName: 'Mahua',
      dispatchedQuantityKg: 100,
      originFacilityId: 'BRP-01',
      originFacilityName: 'Depot',
      originAddress: 'Baripada',
      destinationFacilityName: 'Destination',
      destinationAddress: 'Destination',
      sealTagIds: ['SEAL-01'],
      tarpaulinSecured: true,
      estimatedArrivalDate: new Date().toISOString(),
      distanceKm: 100,
      supportingDocuments: [],
    });
  } catch (err: any) {
    custodyLinkageBlocked = err.message.includes('CUSTODY_LINKAGE_REQUIRED');
  }
  assert(custodyLinkageBlocked, 'Shipment without custody linkage is blocked (CUSTODY_LINKAGE_REQUIRED)');

  // Create valid shipment linked to a Processing Job
  const validShipment = await createCommercialShipment({
    carrierId: stateCoopFleet.id,
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Jogendra Mahanta',
    driverPhone: '+91-9437123456',
    sourceType: 'PROCESSING_JOB',
    sourceReferenceId: 'JOB-PROC-2025-001',
    lotReference: 'LOT-VAL-HONEY-2025-01', // Refined value-added lot
    produceName: 'Filtered Multifloral Table Honey (FSSAI Grade)',
    dispatchedQuantityKg: 168.0,
    originFacilityId: 'FAC-MAYUR-HONEY-01',
    originFacilityName: 'Karanjia Honey Processing Center',
    originAddress: 'TDCCOL Processing Complex, SH-19, Karanjia',
    destinationFacilityName: 'TDCCOL Apex Central Cold Storage',
    destinationAddress: 'Bhubaneswar Wholesale Hub',
    sealTagIds: ['SEAL-KRN-501', 'SEAL-KRN-502'],
    tarpaulinSecured: true,
    estimatedArrivalDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    distanceKm: 240.0,
    supportingDocuments: ['/docs/gate-pass-501.pdf'],
  });

  assert(validShipment.shipmentNumber.startsWith('SHP-MAYUR-2025-'), 'Valid shipment receives sequential number');
  assert(validShipment.status === 'CREATED', 'Shipment starts in status CREATED');
  assert(validShipment.freightCostInr === 9120.0, 'Freight cost accurately calculated (240 km * ₹38/km = ₹9,120.00)');
  assert(validShipment.logisticsCoordinationFeeRate === 0.0, 'Pilot logistics coordination fee is 0.0%');
  assert(validShipment.logisticsCoordinationFeeInr === 0.0, 'Pilot logistics coordination fee is ₹0.00');

  // -------------------------------------------------------------------
  // 3. Step-by-Step Shipment Lifecycle Execution
  // -------------------------------------------------------------------
  console.log('\n--- 3. Step-by-Step Lifecycle (Pickup -> Dispatch -> Delivery) ---');

  // Confirm Pickup
  const pickedUp = await confirmShipmentPickup(validShipment.id, 'Plant Gate Security', 'Vehicle OD-11-A-4402 loaded at Bay 1.');
  assert(pickedUp.status === 'PICKUP_CONFIRMED', 'Shipment transitioned to PICKUP_CONFIRMED');
  assert(pickedUp.pickupConfirmedAt !== null, 'Pickup timestamp recorded');

  // Confirm Dispatch
  const dispatched = await confirmShipmentDispatch(validShipment.id, 'Logistics Officer', 'EWB-2110-9944-1234', 'Seal tags checked and intact.');
  assert(dispatched.status === 'DISPATCHED_IN_TRANSIT', 'Shipment transitioned to DISPATCHED_IN_TRANSIT');
  assert(dispatched.waybillNumber === 'EWB-2110-9944-1234', 'e-Waybill attached to consignment');

  // Confirm Delivery within standard shrinkage tolerance (168 kg dispatched, 167 kg received -> 1 kg variance < 2.52 kg allowed)
  const delivered = await confirmShipmentDelivery(validShipment.id, 'Warehouse Officer', {
    receivedQuantityKg: 167.0,
    deliverySignedBy: 'Bibhuti Bhusan Pradhan (Bhubaneswar Depot Mgr)',
    podRef: 'POD-SHP-2025-003.pdf',
    notes: 'Received 167.0 kg net. Weight within standard moisture tolerance.',
  });

  assert(delivered.status === 'DELIVERED_CONFIRMED', 'Consignment transitioned to DELIVERED_CONFIRMED');
  assert(delivered.receivedQuantityKg === 167.0, 'Received net weight recorded');
  assert(delivered.quantityVarianceKg === 1.0, 'Variance calculated as 1.0 kg');
  assert(delivered.exceptionType === 'NONE', 'No exception flagged within standard tolerance');
  assert(delivered.proofOfDeliveryDocRef === 'POD-SHP-2025-003.pdf', 'POD document reference attached');
  assert(delivered.auditHistory.length >= 4, 'Audit trail contains all milestone entries');

  // -------------------------------------------------------------------
  // 4. Deterministic Delivery Reconciliation Tests
  // -------------------------------------------------------------------
  console.log('\n--- 4. Delivery Reconciliation (Partial, Failed, Quantity Discrepancy) ---');

  // Test calculateDeliveryVariance helper directly
  const fullDeliveryCheck = calculateDeliveryVariance(100.0, 99.0, 1.5);
  assert(fullDeliveryCheck.recommendedStatus === 'DELIVERED_CONFIRMED', '100 kg -> 99 kg is DELIVERED_CONFIRMED (variance 1.0 kg <= 1.5 kg tolerance)');

  const partialDeliveryCheck = calculateDeliveryVariance(100.0, 90.0, 1.5);
  assert(partialDeliveryCheck.recommendedStatus === 'DELIVERED_PARTIAL', '100 kg -> 90 kg is DELIVERED_PARTIAL (variance 10.0 kg > 1.5 kg tolerance)');
  assert(partialDeliveryCheck.exceptionType === 'QUANTITY_DISCREPANCY', 'Partial delivery flags QUANTITY_DISCREPANCY');

  const failedDeliveryCheck = calculateDeliveryVariance(100.0, 0.0, 1.5);
  assert(failedDeliveryCheck.recommendedStatus === 'DELIVERY_FAILED', '100 kg -> 0 kg is DELIVERY_FAILED');

  // Test Partial Delivery on an actual shipment
  const partialShipment = await createCommercialShipment({
    carrierId: stateCoopFleet.id,
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Driver',
    driverPhone: '+91-9437123456',
    sourceType: 'PURCHASE_ORDER',
    sourceReferenceId: 'PO-TEST-PARTIAL',
    lotReference: 'BS-400',
    produceName: 'Sal Seeds',
    dispatchedQuantityKg: 200.0,
    originFacilityId: 'BRP-01',
    originFacilityName: 'Baripada Depot',
    originAddress: 'Baripada',
    destinationFacilityName: 'Cuttack Plant',
    destinationAddress: 'Cuttack',
    sealTagIds: ['SEAL-01'],
    tarpaulinSecured: true,
    estimatedArrivalDate: new Date().toISOString(),
    distanceKm: 250.0,
    supportingDocuments: [],
  });

  await confirmShipmentPickup(partialShipment.id, 'Gate');
  await confirmShipmentDispatch(partialShipment.id, 'Logistics Officer');

  // Deliver only 180 kg out of 200 kg (20 kg missing, exceeds 3 kg allowed shrinkage)
  const partialResult = await confirmShipmentDelivery(partialShipment.id, 'Receiving Officer', {
    receivedQuantityKg: 180.0,
    deliverySignedBy: 'Receiving Incharge',
    podRef: 'POD-PARTIAL-01.pdf',
    discrepancyReason: '1 gunny bag torn in transit; 20 kg spilled/missing.',
  });

  assert(partialResult.status === 'DELIVERED_PARTIAL', 'Shipment marked as DELIVERED_PARTIAL due to excess variance');
  assert(partialResult.quantityVarianceKg === 20.0, 'Recorded variance of 20.0 kg');
  assert(partialResult.exceptionType === 'QUANTITY_DISCREPANCY', 'Flagged with QUANTITY_DISCREPANCY exception');

  // Test Failed Delivery on an actual shipment (0 kg received / total rejection)
  const failedShipment = await createCommercialShipment({
    carrierId: stateCoopFleet.id,
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Driver',
    driverPhone: '+91-9437123456',
    sourceType: 'PURCHASE_ORDER',
    sourceReferenceId: 'PO-TEST-FAILED',
    lotReference: 'BS-401',
    produceName: 'Mahua',
    dispatchedQuantityKg: 100.0,
    originFacilityId: 'BRP-01',
    originFacilityName: 'Baripada Depot',
    originAddress: 'Baripada',
    destinationFacilityName: 'Kolkata Depot',
    destinationAddress: 'Kolkata',
    sealTagIds: ['SEAL-02'],
    tarpaulinSecured: true,
    estimatedArrivalDate: new Date().toISOString(),
    distanceKm: 220.0,
    supportingDocuments: [],
  });

  await confirmShipmentPickup(failedShipment.id, 'Gate');
  await confirmShipmentDispatch(failedShipment.id, 'Logistics Officer');

  const failedResult = await confirmShipmentDelivery(failedShipment.id, 'Kolkata Gate', {
    receivedQuantityKg: 0.0,
    deliverySignedBy: 'Gate Officer',
    podRef: 'POD-REJECTION-01.pdf',
    discrepancyReason: 'Consignment rejected due to water soaking; zero accepted.',
  });

  assert(failedResult.status === 'DELIVERY_FAILED', 'Shipment marked as DELIVERY_FAILED');
  assert(failedResult.receivedQuantityKg === 0.0, 'Recorded 0.0 kg received');

  // -------------------------------------------------------------------
  // 5. Exception, Delay, Damage & Cancellation Tests
  // -------------------------------------------------------------------
  console.log('\n--- 5. Exception, Delay, Damage & Cancellation Tests ---');

  // Report Exception: Delay & Damage
  const exceptionShipment = await createCommercialShipment({
    carrierId: stateCoopFleet.id,
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Driver',
    driverPhone: '+91-9437123456',
    sourceType: 'PURCHASE_ORDER',
    sourceReferenceId: 'PO-TEST-EXC',
    lotReference: 'BS-402',
    produceName: 'Honey',
    dispatchedQuantityKg: 100.0,
    originFacilityId: 'BRP-01',
    originFacilityName: 'Depot',
    originAddress: 'Baripada',
    destinationFacilityName: 'Plant',
    destinationAddress: 'Bhubaneswar',
    sealTagIds: ['SEAL-03'],
    tarpaulinSecured: true,
    estimatedArrivalDate: new Date().toISOString(),
    distanceKm: 250.0,
    supportingDocuments: [],
  });

  const withException = await reportShipmentException(exceptionShipment.id, 'Control Room', {
    exceptionType: 'VEHICLE_BREAKDOWN',
    notes: 'Axle breakdown near Keonjhar bypass. Replacement vehicle dispatched.',
    delayHours: 8,
    damageKg: 5.0,
  });

  assert(withException.exceptionType === 'VEHICLE_BREAKDOWN', 'Recorded VEHICLE_BREAKDOWN exception');
  assert(withException.delayHours === 8, 'Recorded 8 hours transit delay');
  assert(withException.damageReportedKg === 5.0, 'Recorded 5.0 kg damage');

  // Cancellation Test
  const cancelledShipment = await cancelShipment(exceptionShipment.id, 'Logistics Officer', 'Consignment cancelled due to vehicle breakdown and buyer rescheduling.');
  assert(cancelledShipment.status === 'CANCELLED', 'Shipment transitioned to CANCELLED');

  // Attempting to cancel already delivered shipment (Must be blocked)
  let cancelDeliveredBlocked = false;
  try {
    await cancelShipment(delivered.id, 'Logistics Officer', 'Cannot cancel');
  } catch (err: any) {
    cancelDeliveredBlocked = err.message.includes('Cannot cancel delivered shipment');
  }
  assert(cancelDeliveredBlocked, 'Cancelling a delivered shipment is strictly blocked');

  // -------------------------------------------------------------------
  // 6. Pilot Revenue Invariants
  // -------------------------------------------------------------------
  console.log('\n--- 6. Pilot Revenue Invariants ---');

  const allShipments = await getCommercialShipments();
  const allZeroCoordinationFee = allShipments.every(
    (s) => s.logisticsCoordinationFeeRate === 0.0 && s.logisticsCoordinationFeeInr === 0.0
  );
  assert(allZeroCoordinationFee, 'Logistics coordination fee rate is 0.0% across all pilot shipments');

  // -------------------------------------------------------------------
  // 7. REST API Route Integration Tests
  // -------------------------------------------------------------------
  console.log('\n--- 7. REST API Route Integration Tests ---');

  // A. Carriers GET
  const carReq = new NextRequest('http://localhost:3000/api/logistics/carriers');
  const carRes = await getCarriersRoute(carReq);
  const carData = await carRes.json();
  assert(carRes.status === 200 && carData.success === true, 'GET /api/logistics/carriers returns 200');
  assert(carData.carriers.length >= 4, 'API returns registered carriers');

  // B. Shipments GET
  const shpReq = new NextRequest('http://localhost:3000/api/logistics/shipments');
  const shpRes = await getShipmentsRoute(shpReq);
  const shpData = await shpRes.json();
  assert(shpRes.status === 200 && shpData.success === true, 'GET /api/logistics/shipments returns 200');
  assert(shpData.shipments.length >= 2, 'API returns active consignments');

  // C. Shipments POST via API
  const newShpApiReq = new NextRequest('http://localhost:3000/api/logistics/shipments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carrierId: stateCoopFleet.id,
      vehicleNumber: 'OD-11-A-4402',
      driverName: 'Driver API',
      sourceType: 'PURCHASE_ORDER',
      sourceReferenceId: 'PO-B2B-2025-API',
      lotReference: 'BS-402',
      produceName: 'Mahua',
      dispatchedQuantityKg: 50,
      originFacilityId: 'BRP-01',
      destinationFacilityName: 'API Destination',
      destinationAddress: 'Address',
      distanceKm: 100,
    }),
  });
  const newShpApiRes = await postShipmentsRoute(newShpApiReq);
  const newShpApiData = await newShpApiRes.json();
  assert(newShpApiRes.status === 200 && newShpApiData.success === true, 'POST /api/logistics/shipments creates shipment via API');

  // D. Shipments PATCH via API
  const patchApiReq = new NextRequest('http://localhost:3000/api/logistics/shipments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'PICKUP',
      shipmentId: newShpApiData.shipment.id,
      notes: 'Picked up via API patch',
    }),
  });
  const patchApiRes = await patchShipmentsRoute(patchApiReq);
  const patchApiData = await patchApiRes.json();
  assert(patchApiRes.status === 200 && patchApiData.shipment.status === 'PICKUP_CONFIRMED', 'PATCH /api/logistics/shipments with action=PICKUP confirms pickup');

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  Logistics Network Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('SUCCESS: All logistics coordination & delivery reconciliation checks passed.\n');
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});

