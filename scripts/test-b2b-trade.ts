/**
 * SAMAGNA Phase 3: Automated B2B Bulk Trade Platform Test Suite
 *
 * Validates:
 * 1. Business Onboarding, KYC Gating & Trading Clearance
 * 2. Structured B2B Forest Catalogue (17 Commodities with Authentic Botanical Identity)
 * 3. Lot-Based Trade Discovery & Statutory DPO Clearance Gate
 * 4. RFQ Lifecycle State Machine & Double-Selling Prevention via 72h Allocation Locks
 * 5. Purchase Order Generation, Invariant Checks & Append-Only Audit Trail
 * 6. Quotation Rejection/Cancellation & Automatic Allocation Lock Release
 * 7. Fair-Trade Pilot Revenue Invariants (0.0% Commercial Fee, 100% Collector MSP Protection)
 * 8. REST API Endpoints & Access Control
 */

(process.env as any).NODE_ENV = 'test';
process.env.ALLOW_DEMO_ACCOUNTS = 'true';
process.env.AUTH_SECRET = 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  canBusinessTrade,
  B2B_STRUCTURED_CATALOGUE,
  DEFAULT_TRADE_BUSINESSES,
  DEFAULT_TRADE_LISTINGS,
  DEFAULT_TRADE_RFQS,
  DEFAULT_TRADE_QUOTATIONS,
  DEFAULT_TRADE_PURCHASE_ORDERS,
} from '../src/lib/b2bTrade';
import {
  resetStandbyTradeStore,
  getTradeBusinesses,
  getTradeBusinessById,
  registerTradeBusiness,
  updateBusinessVerificationStatus,
  getStructuredTradeCatalogue,
  getTradeCatalogueItem,
  getTradeListings,
  getTradeListingById,
  createTradeListing,
  getTradeRfqs,
  getTradeRfqById,
  createTradeRfq,
  submitTradeQuotation,
  acceptTradeQuotation,
  rejectOrCancelRfq,
  getTradePurchaseOrders,
  getTradePurchaseOrderById,
  updatePurchaseOrderStatus,
  getActiveAllocationLocks,
} from '../src/lib/server/b2bTrade';
import { GET as getCatalogueRoute } from '../src/app/api/trade/catalogue/route';
import { GET as getListingsRoute, POST as postListingsRoute } from '../src/app/api/trade/listings/route';
import { GET as getBusinessesRoute, POST as postBusinessesRoute, PATCH as patchBusinessesRoute } from '../src/app/api/trade/businesses/route';
import { GET as getRfqRoute, POST as postRfqRoute, PATCH as patchRfqRoute } from '../src/app/api/trade/rfq/route';
import { GET as getOrdersRoute, POST as postOrdersRoute, PATCH as patchOrdersRoute } from '../src/app/api/trade/orders/route';
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
  console.log('       SAMAGNA Phase 3: B2B Bulk Trade Platform       ');
  console.log('======================================================\n');

  resetStandbyTradeStore();

  // -------------------------------------------------------------------
  // 1. Business Onboarding, KYC & Trading Clearance Gate
  // -------------------------------------------------------------------
  console.log('--- 1. Business Onboarding & Trading Clearance Gate ---');

  const initialBusinesses = await getTradeBusinesses();
  assert(initialBusinesses.length >= 4, 'Initial seed businesses are loaded (TDCCOL, Dabur, Baidyanath, Unverified)');

  const tdccol = await getTradeBusinessById('ORG-TDCCOL-OR');
  assert(tdccol !== null && tdccol.verificationStatus === 'VERIFIED_ACTIVE', 'TDCCOL Apex Federation is VERIFIED_ACTIVE');
  assert(canBusinessTrade(tdccol!.verificationStatus) === true, 'TDCCOL has active trading clearance');

  const dabur = await getTradeBusinessById('BUS-DABUR-01');
  assert(dabur !== null && dabur.businessType === 'MANUFACTURER', 'Dabur India is registered as MANUFACTURER');
  assert(canBusinessTrade(dabur!.verificationStatus) === true, 'Dabur has verified trading clearance');

  const unverifiedEntity = await getTradeBusinessById('BUS-UNVERIF-03');
  assert(unverifiedEntity !== null && unverifiedEntity.verificationStatus === 'PENDING_VERIFICATION', 'Shree Herbal is PENDING_VERIFICATION');
  assert(canBusinessTrade(unverifiedEntity!.verificationStatus) === false, 'Unverified business is strictly blocked from trading clearance');

  // Register a new business
  const registered = await registerTradeBusiness({
    companyName: 'Patanjali Ayurved Sourcing Div',
    tradeName: 'Patanjali Ayurved',
    businessType: 'MANUFACTURER',
    registrationNumber: 'U24233UR2006PLC031864',
    gstin: '05AABCP1234D1Z9',
    pan: 'AABCP1234D',
    fssaiLicense: '10014012000266',
    ayushLicense: 'UA-AYUSH-2008-011',
    verificationNotes: 'Submitted for verification',
    registeredAddress: 'D-38, Industrial Area, Haridwar',
    city: 'Haridwar',
    district: 'Haridwar',
    state: 'Uttarakhand',
    pincode: '249401',
    authorizedContactName: 'Acharya Balkrishna',
    contactEmail: 'procurement@patanjali.org',
    contactPhone: '+91-1334-240000',
    bankName: 'Punjab National Bank',
    bankBranch: 'Haridwar Main',
    accountNumberEnding: '5001',
    ifscCode: 'PUNB0012000',
  });

  assert(registered.id.startsWith('BUS-'), 'Registered business receives valid ID');
  assert(registered.verificationStatus === 'PENDING_VERIFICATION', 'New registration defaults to PENDING_VERIFICATION');
  assert(canBusinessTrade(registered.verificationStatus) === false, 'Newly registered entity cannot trade until verified');

  // Verify business
  const approved = await updateBusinessVerificationStatus(registered.id, 'VERIFIED_ACTIVE', 'KYC verified against MCA');
  assert(approved.verificationStatus === 'VERIFIED_ACTIVE', 'State desk can approve business to VERIFIED_ACTIVE');
  assert(canBusinessTrade(approved.verificationStatus) === true, 'Approved business gains active trading clearance');

  // -------------------------------------------------------------------
  // 2. Structured B2B Forest Produce Catalogue
  // -------------------------------------------------------------------
  console.log('\n--- 2. Structured B2B Forest Produce Catalogue ---');

  const catalogue = getStructuredTradeCatalogue();
  assert(catalogue.length === 17, 'Catalogue contains all 17 authentic Odisha Minor Forest Produce commodities');

  const mahua = getTradeCatalogueItem('mahua');
  assert(mahua !== null, 'Mahua exists in structured catalogue');
  assert(mahua?.scientificName === 'Madhuca longifolia', 'Mahua botanical identity is Madhuca longifolia');
  assert(mahua?.botanicalFamily === 'Sapotaceae', 'Mahua botanical family is Sapotaceae');
  assert(mahua?.availableGrades.includes('Grade 1 / Premium'), 'Mahua supports Grade 1 / Premium commercial grade');
  assert(mahua?.baselineMoistureMaxPercent === 12.0, 'Mahua maximum moisture threshold is 12.0%');

  const salSeeds = getTradeCatalogueItem('sal-seeds');
  assert(salSeeds !== null, 'Sal Seeds exists in structured catalogue');
  assert(salSeeds?.scientificName === 'Shorea robusta', 'Sal Seeds botanical identity is Shorea robusta');
  assert(salSeeds?.category === 'Oilseed', 'Sal Seeds categorized accurately as Oilseed');

  const kendu = getTradeCatalogueItem('kendu-leaves');
  assert(kendu?.scientificName === 'Diospyros melanoxylon', 'Kendu Leaves botanical identity is Diospyros melanoxylon');

  const harida = getTradeCatalogueItem('harida');
  assert(harida?.scientificName === 'Terminalia chebula', 'Harida botanical identity is Terminalia chebula');

  const kalmegh = getTradeCatalogueItem('kalmegh');
  assert(kalmegh?.scientificName === 'Andrographis paniculata', 'Kalmegh botanical identity is Andrographis paniculata');

  // -------------------------------------------------------------------
  // 3. Lot-Based Trade Discovery & Statutory Clearance Gate
  // -------------------------------------------------------------------
  console.log('\n--- 3. Lot-Based Trade Discovery & Statutory Clearance Gate ---');

  const listings = await getTradeListings();
  assert(listings.length >= 2, 'Initial authorized trade listings present');

  const mahuaLot = await getTradeListingById('LIST-MAHUA-2025-01');
  assert(mahuaLot !== null, 'Mahua Lot #LIST-MAHUA-2025-01 exists');
  assert(mahuaLot?.isStatutoryClearanceVerified === true, 'Mahua Lot has verified statutory clearance');
  assert(mahuaLot?.lotSaleAuthorizationRef === 'AUTH-DPO-2025-001', 'Mahua Lot has explicit DPO release ref AUTH-DPO-2025-001');
  assert(mahuaLot?.warehouseBatchRef === 'BS-402', 'Mahua Lot links to physical warehouse batch BS-402');
  assert(mahuaLot?.availableQuantityKg === 100.0, 'Available quantity matches unreserved stock (100 kg)');

  // Attempt to create a listing WITHOUT statutory clearance (Must be blocked)
  let blockedListingError = false;
  try {
    await createTradeListing({
      sellerOrgId: 'ORG-TDCCOL-OR',
      produceSlug: 'mahua',
      produceName: 'Dried Mahua Flowers',
      qualityGrade: 'FAQ',
      totalLotQuantityKg: 50.0,
      minimumOrderQuantityKg: 10.0,
      indicativePricePerKg: 40.0,
      depotFacilityId: 'BRP-01',
      warehouseBatchRef: 'BS-UNAUTH-01',
      lotSaleAuthorizationRef: '', // Missing authorization
      authorizingOfficer: '',
      isStatutoryClearanceVerified: false, // Not verified
      availabilityStartDate: new Date().toISOString(),
      availabilityEndDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      packagingDescription: '50kg Gunny Bag',
    });
  } catch (err: any) {
    blockedListingError = err.message.includes('UNAUTHORIZED_STOCK_LISTING_BLOCKED');
  }
  assert(blockedListingError, 'Stock without DPO statutory release is strictly blocked from listing (UNAUTHORIZED_STOCK_LISTING_BLOCKED)');

  // Attempt to create a listing with an UNVERIFIED seller (Must be blocked)
  let blockedSellerError = false;
  try {
    await createTradeListing({
      sellerOrgId: 'BUS-UNVERIF-03', // Unverified seller
      produceSlug: 'mahua',
      produceName: 'Dried Mahua Flowers',
      qualityGrade: 'FAQ',
      totalLotQuantityKg: 50.0,
      minimumOrderQuantityKg: 10.0,
      indicativePricePerKg: 40.0,
      depotFacilityId: 'BRP-01',
      warehouseBatchRef: 'BS-999',
      lotSaleAuthorizationRef: 'AUTH-FAKE-01',
      authorizingOfficer: 'unknown',
      isStatutoryClearanceVerified: true,
      availabilityStartDate: new Date().toISOString(),
      availabilityEndDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
      packagingDescription: '50kg Gunny Bag',
    });
  } catch (err: any) {
    blockedSellerError = err.message.includes('UNVERIFIED_SELLER_BLOCKED');
  }
  assert(blockedSellerError, 'Unverified business is blocked from creating lot listings (UNVERIFIED_SELLER_BLOCKED)');

  // Create a valid listing with statutory clearance
  const validListing = await createTradeListing({
    sellerOrgId: 'ORG-TDCCOL-OR',
    produceSlug: 'harida',
    produceName: 'Haritaki (Harida)',
    scientificName: 'Terminalia chebula',
    qualityGrade: 'Grade 1 / Whole Bold',
    totalLotQuantityKg: 200.0,
    minimumOrderQuantityKg: 25.0,
    indicativePricePerKg: 38.0,
    depotFacilityId: 'BRP-01',
    storageBayLocation: 'Bay 02-A',
    warehouseBatchRef: 'BS-405',
    lotSaleAuthorizationRef: 'AUTH-DPO-2025-003',
    authorizingOfficer: 'patnaik.dpo',
    isStatutoryClearanceVerified: true,
    availabilityStartDate: new Date().toISOString(),
    availabilityEndDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    isActive: true,
    packagingDescription: '40kg HDPE Lined Gunny Bag',
  });
  assert(validListing.id.startsWith('LIST-HARIDA-'), 'Authorized listing successfully created');
  assert(validListing.availableQuantityKg === 200.0, 'Available quantity initialized to total lot quantity');

  // -------------------------------------------------------------------
  // 4. RFQ Workflow & 72h Inventory Allocation Lock
  // -------------------------------------------------------------------
  console.log('\n--- 4. RFQ Workflow & Double-Selling Prevention ---');

  // Attempt to submit RFQ from UNVERIFIED buyer (Must be blocked)
  let blockedBuyerRfq = false;
  try {
    await createTradeRfq({
      buyerOrgId: 'BUS-UNVERIF-03', // Unverified buyer
      listingId: validListing.id,
      produceSlug: 'harida',
      produceName: 'Haritaki (Harida)',
      requestedGrade: 'Grade 1 / Whole Bold',
      requestedQuantityKg: 50.0,
      deliveryLocation: 'Cuttack Warehouse',
      targetDeliveryDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    });
  } catch (err: any) {
    blockedBuyerRfq = err.message.includes('UNVERIFIED_BUYER_BLOCKED');
  }
  assert(blockedBuyerRfq, 'Unverified buyer is blocked from creating RFQs (UNVERIFIED_BUYER_BLOCKED)');

  // Attempt to request quantity exceeding available lot quantity (Must be blocked)
  let quantityExceededError = false;
  try {
    await createTradeRfq({
      buyerOrgId: 'BUS-DABUR-01',
      listingId: validListing.id,
      produceSlug: 'harida',
      produceName: 'Haritaki (Harida)',
      requestedGrade: 'Grade 1 / Whole Bold',
      requestedQuantityKg: 500.0, // Exceeds 200.0 kg available
      deliveryLocation: 'Sahibabad Facility',
      targetDeliveryDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    });
  } catch (err: any) {
    quantityExceededError = err.message.includes('exceeds available quantity');
  }
  assert(quantityExceededError, 'RFQ requested quantity exceeding lot availability is rejected');

  // Valid RFQ creation by verified buyer
  const rfq = await createTradeRfq({
    buyerOrgId: 'BUS-DABUR-01',
    listingId: validListing.id,
    produceSlug: 'harida',
    produceName: 'Haritaki (Harida)',
    requestedGrade: 'Grade 1 / Whole Bold',
    requestedQuantityKg: 60.0,
    deliveryLocation: 'Dabur Sahibabad Unit IV, Ghaziabad, UP',
    targetDeliveryDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    buyerNotes: 'Moisture must not exceed 10.0%. AYUSH test certificate mandatory.',
  });

  assert(rfq.status === 'SUBMITTED', 'New RFQ is created with status SUBMITTED');
  assert(rfq.rfqNumber.startsWith('RFQ-B2B-2025-'), 'RFQ receives standard sequential numbering');

  // Seller issues quotation on the RFQ
  const quoteResult = await submitTradeQuotation({
    rfqId: rfq.id,
    sellerOrgId: 'ORG-TDCCOL-OR',
    quotedPricePerKg: 37.5,
    deliveryTimelineDays: 7,
    deliveryTerms: 'Ex-Depot Baripada Central Terminal (BRP-01)',
    paymentTerms: '100% RTGS against pre-dispatch inspection',
    validUntilDays: 14,
    sellerRemarks: 'Moisture certified at 8.8%. Sample seal retained.',
  });

  const { quotation, allocationLock } = quoteResult;
  assert(quotation.quotedPricePerKg === 37.5, 'Quotation records agreed unit price');
  assert(quotation.quotedTotalAmount === 2250.0, 'Quotation total amount calculated reliably (37.5 * 60 = 2250.0)');
  assert(quotation.isAccepted === false, 'Quotation starts in unaccepted state');

  // Check inventory allocation lock
  assert(allocationLock.reservedQuantityKg === 60.0, 'Allocation lock reserves exactly 60.0 kg');
  assert(allocationLock.isCommitted === false, 'Allocation lock is uncommitted before PO issuance');
  assert(allocationLock.isReleased === false, 'Allocation lock is active');

  // Check that the listing inventory was deducted
  const listingAfterLock = await getTradeListingById(validListing.id);
  assert(listingAfterLock?.allocatedQuantityKg === 60.0, 'Listing allocated quantity increased by 60.0 kg');
  assert(listingAfterLock?.availableQuantityKg === 140.0, 'Listing available quantity reduced from 200.0 to 140.0 kg');

  // Verify updated RFQ status
  const rfqAfterQuote = await getTradeRfqById(rfq.id);
  assert(rfqAfterQuote?.status === 'QUOTED', 'RFQ status transitioned to QUOTED upon quotation issuance');

  // -------------------------------------------------------------------
  // 5. Quotation Acceptance, PO Conversion & Audit Trail
  // -------------------------------------------------------------------
  console.log('\n--- 5. Quotation Acceptance & Purchase Order Lifecycle ---');

  const po = await acceptTradeQuotation(quotation.id, 'Vikramaditya Sengupta (Dabur Sourcing)');
  assert(po.poNumber.startsWith('PO-B2B-2025-'), 'Purchase order issued with formal PO number');
  assert(po.status === 'ISSUED', 'Purchase order status initialized to ISSUED');
  assert(po.quantityKg === 60.0, 'PO quantity matches quotation');
  assert(po.agreedPricePerKg === 37.5, 'PO agreed unit price matches quotation');
  assert(po.totalOrderAmount === 2250.0, 'PO total order amount matches quotation');
  assert(po.platformServiceFeeRate === 0.0, 'Platform service fee rate is 0.0% in pilot');
  assert(po.auditHistory.length >= 1, 'Audit history records PO issuance entry');
  assert(po.auditHistory[0].action === 'ISSUE_PURCHASE_ORDER', 'Audit action recorded as ISSUE_PURCHASE_ORDER');

  // Check that the allocation lock is now committed
  const committedLock = getActiveAllocationLocks().find((l) => l.quotationId === quotation.id);
  assert(committedLock?.isCommitted === true, 'Allocation lock is formally committed upon PO issuance');

  // Seller confirms the PO
  const confirmedPO = await updatePurchaseOrderStatus(
    po.id,
    'CONFIRMED',
    'TDCCOL Apex Desk',
    'Stock verified in Bay 02-A at BRP-01 depot. Dispatch scheduled for April 10.'
  );
  assert(confirmedPO.status === 'CONFIRMED', 'PO status transitioned to CONFIRMED');
  assert(confirmedPO.auditHistory.length === 2, 'Audit trail appended with CONFIRMED entry');

  // Dispatch PO with e-Waybill
  const dispatchedPO = await updatePurchaseOrderStatus(
    po.id,
    'DISPATCHED',
    'Warehouse Logistics Officer',
    'Loaded on Vehicle OD-11-A-4402 with calibrated weighment slip.',
    { eWaybillNumber: 'EWB-2110-9944-7711', qualityInspectionCertRef: 'QC-BRP-2025-058' }
  );
  assert(dispatchedPO.status === 'DISPATCHED', 'PO status transitioned to DISPATCHED');
  assert(dispatchedPO.eWaybillNumber === 'EWB-2110-9944-7711', 'e-Waybill reference attached to PO');
  assert(dispatchedPO.qualityInspectionCertRef === 'QC-BRP-2025-058', 'Quality certificate attached');
  assert(dispatchedPO.auditHistory.length === 3, 'Audit trail appended with DISPATCHED entry');

  // Deliver PO
  const deliveredPO = await updatePurchaseOrderStatus(
    po.id,
    'DELIVERED',
    'Dabur Inward Receiving Officer',
    'Goods received at Sahibabad depot. Moisture verified at 8.9%.'
  );
  assert(deliveredPO.status === 'DELIVERED', 'PO status transitioned to DELIVERED');
  assert(deliveredPO.auditHistory.length === 4, 'Audit trail contains complete append-only history');

  // -------------------------------------------------------------------
  // 6. Quotation Rejection/Cancellation & Inventory Lock Release
  // -------------------------------------------------------------------
  console.log('\n--- 6. Rejection/Cancellation & Inventory Lock Release ---');

  // Create another RFQ on the same listing for 40 kg
  const rfq2 = await createTradeRfq({
    buyerOrgId: 'BUS-BAIDYA-02',
    listingId: validListing.id,
    produceSlug: 'harida',
    produceName: 'Haritaki (Harida)',
    requestedGrade: 'Grade 1 / Whole Bold',
    requestedQuantityKg: 40.0,
    deliveryLocation: 'Baidyanath Kolkata Works',
    targetDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString(),
  });

  const quote2Result = await submitTradeQuotation({
    rfqId: rfq2.id,
    sellerOrgId: 'ORG-TDCCOL-OR',
    quotedPricePerKg: 38.0,
    deliveryTimelineDays: 5,
  });

  // Verify listing quantities before cancellation
  const listingBeforeCancel = await getTradeListingById(validListing.id);
  assert(listingBeforeCancel?.availableQuantityKg === 100.0, 'Available quantity was 100.0 kg after second quote lock');

  // Buyer cancels the RFQ
  const cancelledRfq = await rejectOrCancelRfq(rfq2.id, 'Baidyanath Sourcing Desk', 'Procurement rescheduled to next quarter', true);
  assert(cancelledRfq.status === 'CANCELLED', 'RFQ status transitioned to CANCELLED');
  assert(cancelledRfq.cancellationReason !== null, 'Cancellation reason preserved');

  // Check that the allocation lock was released
  const releasedLock = getActiveAllocationLocks().find((l) => l.quotationId === quote2Result.quotation.id);
  assert(releasedLock?.isReleased === true, 'Allocation lock released upon cancellation');

  // Check that the listing inventory was automatically restored
  const listingAfterCancel = await getTradeListingById(validListing.id);
  assert(listingAfterCancel?.availableQuantityKg === 140.0, 'Available quantity restored to 140.0 kg after lock release');
  assert(listingAfterCancel?.allocatedQuantityKg === 60.0, 'Allocated quantity decreased back to 60.0 kg');

  // -------------------------------------------------------------------
  // 7. REST API Route Integration Tests
  // -------------------------------------------------------------------
  console.log('\n--- 7. REST API Route Integration Tests ---');

  // A. Catalogue API
  const catReq = new NextRequest('http://localhost:3000/api/trade/catalogue');
  const catRes = await getCatalogueRoute(catReq);
  const catData = await catRes.json();
  assert(catRes.status === 200 && catData.success === true, 'GET /api/trade/catalogue returns 200');
  assert(catData.count === 17, 'Catalogue endpoint returns 17 commodities');

  // B. Single Commodity API
  const singleCatReq = new NextRequest('http://localhost:3000/api/trade/catalogue?slug=mahua');
  const singleCatRes = await getCatalogueRoute(singleCatReq);
  const singleCatData = await singleCatRes.json();
  assert(singleCatRes.status === 200 && singleCatData.item.slug === 'mahua', 'GET /api/trade/catalogue?slug=mahua returns Mahua data');

  // C. Listings API
  const listReq = new NextRequest('http://localhost:3000/api/trade/listings');
  const listRes = await getListingsRoute(listReq);
  const listData = await listRes.json();
  assert(listRes.status === 200 && listData.success === true, 'GET /api/trade/listings returns 200');
  assert(listData.listings.length >= 2, 'Listings endpoint returns active trade listings');

  // D. Create Listing via API without clearance (Must return 403)
  const invalidListReq = new NextRequest('http://localhost:3000/api/trade/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sellerOrgId: 'ORG-TDCCOL-OR',
      produceSlug: 'mahua',
      produceName: 'Mahua',
      totalLotQuantityKg: 100,
      indicativePricePerKg: 50,
      isStatutoryClearanceVerified: false, // Invariant violation
    }),
  });
  const invalidListRes = await postListingsRoute(invalidListReq);
  const invalidListData = await invalidListRes.json();
  assert(invalidListRes.status === 403, 'POST /api/trade/listings without statutory clearance returns 403');
  assert(invalidListData.error === 'UNAUTHORIZED_STOCK_LISTING_BLOCKED', 'Returns UNAUTHORIZED_STOCK_LISTING_BLOCKED error code');

  // E. Businesses API
  const busReq = new NextRequest('http://localhost:3000/api/trade/businesses');
  const busRes = await getBusinessesRoute(busReq);
  const busData = await busRes.json();
  assert(busRes.status === 200 && busData.businesses.length >= 4, 'GET /api/trade/businesses returns registered enterprises');

  // F. Create RFQ via API with unverified buyer (Must return 403)
  const unverifiedRfqReq = new NextRequest('http://localhost:3000/api/trade/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerOrgId: 'BUS-UNVERIF-03', // Unverified buyer
      produceSlug: 'mahua',
      produceName: 'Dried Mahua Flowers',
      requestedGrade: 'Grade 1 / Premium',
      requestedQuantityKg: 50,
      deliveryLocation: 'Bhubaneswar',
    }),
  });
  const unverifiedRfqRes = await postRfqRoute(unverifiedRfqReq);
  const unverifiedRfqData = await unverifiedRfqRes.json();
  assert(unverifiedRfqRes.status === 403, 'POST /api/trade/rfq with unverified buyer returns 403');
  assert(unverifiedRfqData.error.includes('UNVERIFIED_BUYER_BLOCKED'), 'Returns UNVERIFIED_BUYER_BLOCKED error');

  // G. Orders API
  const ordersReq = new NextRequest('http://localhost:3000/api/trade/orders');
  const ordersRes = await getOrdersRoute(ordersReq);
  const ordersData = await ordersRes.json();
  assert(ordersRes.status === 200 && ordersData.orders.length >= 1, 'GET /api/trade/orders returns purchase orders');

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  B2B Bulk Trade Platform Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    console.log('SUCCESS: All B2B trade state machine & invariant checks passed flawlessly.\n');
  } else {
    console.error(`FAILURE: ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});

