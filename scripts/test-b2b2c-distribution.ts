/**
 * Comprehensive Automated Verification Suite for Samagna Phase 6:
 * B2B2C Partner Distribution Network
 *
 * Verifies:
 * 1. Partner Organisation Profiles & Verification Gate
 * 2. Brand Profiles & Authorisation
 * 3. Retail Product SKUs, Packaging & Strict Evidence Audit
 * 4. Multi-Channel Distribution Management & Feed Export (JSON & CSV)
 * 5. Order Referral Recording & Inventory Allocation Locking
 * 6. Sales Reconciliation & Physical Stock Discrepancy Detection
 * 7. Pilot Revenue & Fair-Trade Invariants (0.0% Enablement Fee)
 * 8. REST API Endpoints Integration
 */

import {
  getDistributionPartners,
  getDistributionPartnerById,
  registerDistributionPartner,
  updatePartnerVerificationStatus,
  getDistributionBrands,
  getDistributionBrandById,
  createDistributionBrand,
  getRetailProductSkus,
  getRetailProductSkuById,
  createRetailProductSku,
  updateRetailSkuInventory,
  getDistributionChannels,
  getDistributionChannelById,
  createDistributionChannel,
  getOrderReferrals,
  getOrderReferralById,
  recordOrderReferral,
  updateOrderReferralStatus,
  getPartnerSalesReconciliations,
  createSalesReconciliation,
  getDistributionPerformanceSummary,
  updatePartnerSubscriptionTier,
} from '../src/lib/server/distribution';

import {
  exportPartnerCatalogue,
  calculateChannelPricing,
  calculateReconciliationVariance,
} from '../src/lib/distribution';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean | undefined | null | unknown, description: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  [PASS] ${description}`);
  } else {
    console.error(`  [FAIL] ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runAllDistributionTests() {
  console.log('\n======================================================');
  console.log('   SAMAGNA Phase 6: B2B2C Partner Distribution Network');
  console.log('======================================================\n');

  // -------------------------------------------------------------------
  // 1. Partner Organisation Profiles & Verification Gate
  // -------------------------------------------------------------------
  console.log('--- 1. Partner Organisation Profiles & Verification Gate ---');

  const partners = await getDistributionPartners();
  assert(partners.length >= 3, 'Seed distribution partners are loaded');

  const karanJiaShg = await getDistributionPartnerById('PRT-MAYUR-01');
  assert(karanJiaShg !== null, 'Karanjia Tribal Mahila Federation exists');
  if (!karanJiaShg) throw new Error('karanJiaShg not found');
  assert(karanJiaShg.partnerType === 'SHG_FEDERATION', 'Partner type is SHG_FEDERATION');
  assert(karanJiaShg.isVerified === true, 'Karanjia Federation is verified');
  assert(karanJiaShg.fssaiLicenseNumber === '12023999000124', 'FSSAI License recorded');

  const unverifiedPartner = await getDistributionPartnerById('PRT-UNVERIF-04');
  assert(unverifiedPartner !== null && unverifiedPartner.isVerified === false, 'Test partner is unverified');
  assert(unverifiedPartner?.isActive === false, 'Unverified partner is inactive');

  // Mandatory fields check
  let mandatoryCheckPassed = false;
  try {
    await registerDistributionPartner({
      code: '',
      organisationName: '',
      partnerType: 'PRODUCER_ORGANISATION',
      registrationNumber: '',
      pan: '',
      primaryContactPerson: 'Contact',
      contactPhone: '+91-9000000000',
      contactEmail: 'missing@pan.com',
      headquartersAddress: 'Baripada',
      operatingDistricts: ['Mayurbhanj'],
    });
  } catch (err: any) {
    mandatoryCheckPassed = err.message.includes('Mandatory compliance details missing');
  }
  assert(mandatoryCheckPassed, 'Registration without mandatory PAN and registration number is blocked');

  // Register new verified partner
  const newPartner = await registerDistributionPartner({
    code: 'PRT-SIMIL-AGRO-01',
    organisationName: 'Similipal Agro-Tribal FPO',
    partnerType: 'PRODUCER_ORGANISATION',
    registrationNumber: 'U01100OR2023PTC049102',
    pan: 'AACCS4411Q',
    gstin: '21AACCS4411Q1ZU',
    primaryContactPerson: 'Subhashree Murmu',
    contactPhone: '+91-9437998877',
    contactEmail: 'subhashree@similipalfpo.in',
    headquartersAddress: 'Jashipur Tribal Market, Mayurbhanj - 757034',
    operatingDistricts: ['Mayurbhanj', 'Keonjhar'],
  });

  assert(newPartner.id.startsWith('PRT-'), 'New partner receives valid identifier');
  assert(newPartner.isVerified === false, 'Newly registered partner defaults to unverified');

  const approvedPartner = await updatePartnerVerificationStatus(newPartner.id, true, true, 'VERIFIED_ACTIVE');
  assert(approvedPartner.isVerified === true, 'Partner verification status approved');
  assert(approvedPartner.isActive === true, 'Approved partner is marked active');

  // -------------------------------------------------------------------
  // 2. Brand Profiles & Authorisation
  // -------------------------------------------------------------------
  console.log('\n--- 2. Brand Profiles & Authorisation ---');

  const brands = await getDistributionBrands();
  assert(brands.length >= 2, 'Seed distribution brands loaded');

  const mayurWildBrand = await getDistributionBrandById('BRD-MAYUR-WILD');
  assert(mayurWildBrand !== null, 'Mayurbhanj Wild brand exists');
  if (!mayurWildBrand) throw new Error('mayurWildBrand not found');
  assert(mayurWildBrand.brandName === 'Mayurbhanj Wild', 'Brand name is Mayurbhanj Wild');
  assert(mayurWildBrand.originDistrict === 'Mayurbhanj', 'Origin district is Mayurbhanj');

  // Attempt to create brand under unverified partner (Must be blocked)
  let unverifiedBrandBlocked = false;
  try {
    await createDistributionBrand({
      brandCode: 'BRD-TEST-UNVERIF',
      partnerId: 'PRT-UNVERIF-04',
      brandName: 'Unverified Forest Brand',
      originDistrict: 'Mayurbhanj',
      brandStory: 'Test story',
      ethosStatement: 'Test ethos',
      contactEmail: 'test@unverified.com',
    });
  } catch (err: any) {
    unverifiedBrandBlocked = err.message.includes('Cannot create brand under unverified partner');
  }
  assert(unverifiedBrandBlocked, 'Creating brand under unverified partner is strictly blocked');

  // Create brand under approved partner
  const newBrand = await createDistributionBrand({
    brandCode: 'BRD-SIMIL-HARVEST',
    partnerId: approvedPartner.id,
    brandName: 'Similipal Canopy Harvests',
    originDistrict: 'Mayurbhanj',
    brandStory: 'Gathered by women SHG cooperatives in the Similipal biosphere highlands.',
    ethosStatement: 'Ethical, wild-foraged botanicals with fair-trade collector remuneration.',
    contactEmail: 'harvests@similipalfpo.in',
  });
  assert(newBrand.brandCode === 'BRD-SIMIL-HARVEST', 'Brand registered under verified partner');

  // -------------------------------------------------------------------
  // 3. Retail Product SKUs, Packaging & Strict Evidence Audit
  // -------------------------------------------------------------------
  console.log('\n--- 3. Retail Product SKUs, Packaging & Strict Evidence Audit ---');

  const skus = await getRetailProductSkus();
  assert(skus.length >= 4, 'Seed retail SKUs loaded');

  const packagedHoney = await getRetailProductSkuById('SKU-MW-HONEY-500G');
  assert(packagedHoney !== null, 'Packaged honey SKU exists');
  if (!packagedHoney) throw new Error('packagedHoney not found');
  assert(packagedHoney.productTier === 'RETAIL_READY_PACKAGED', 'Honey classified as RETAIL_READY_PACKAGED');
  assert(packagedHoney.packagingType === 'GLASS_JAR', 'Container type is GLASS_JAR');
  assert(packagedHoney.casePackSize === 12, 'Case pack size is 12 units');
  assert(packagedHoney.wholesalePriceUnitInr === 295.0, 'Wholesale unit price is ₹295.00');
  assert(packagedHoney.retailPriceMrpInr === 380.0, 'Retail MRP is ₹380.00');
  assert(packagedHoney.isEvidenceVerified === true, 'Purity & FSSAI evidence verified');
  assert(packagedHoney.certifications.length === 2, 'Has 2 documented certificates (FSSAI + NMR Lab Assay)');

  const rawProduceSku = await getRetailProductSkuById('SKU-RAW-SAL-SEED-BULK');
  assert(rawProduceSku !== null, 'Raw produce SKU exists');
  assert(rawProduceSku?.productTier === 'RAW_PRODUCE', 'Raw Sal Seed classified as RAW_PRODUCE');
  assert(rawProduceSku?.isEvidenceVerified === false, 'Raw intake produce has no fabricated certifications');

  const semiBulkSku = await getRetailProductSkuById('SKU-PROC-HARIDA-EXT');
  assert(semiBulkSku !== null, 'Semi-bulk processed SKU exists');
  assert(semiBulkSku?.productTier === 'PROCESSED_BULK', 'Harida powder classified as PROCESSED_BULK');
  assert(semiBulkSku?.packagingType === 'COMPOSITE_DRUM', 'Packaging type is COMPOSITE_DRUM');

  // Invariant test: MRP cannot be lower than wholesale price
  let pricingViolationBlocked = false;
  try {
    await createRetailProductSku({
      skuCode: 'SKU-PRICE-FAIL',
      barcode: null,
      brandId: mayurWildBrand.id,
      partnerId: karanJiaShg.id,
      productTitle: 'Faulty Pricing Product',
      productTier: 'RETAIL_READY_PACKAGED',
      category: 'Edibles',
      netQuantity: '100 g',
      netWeightGrams: 100.0,
      casePackSize: 10,
      packagingType: 'GLASS_JAR',
      packagingMaterial: 'Glass',
      shelfLifeMonths: 12,
      ingredients: 'Natural extract',
      storageInstructions: 'Dry place',
      originCluster: 'Karanjia',
      communityProvenance: 'Tribal Collective',
      harvestSeason: 'Spring',
      traditionalHarvestPractice: 'Hand pick',
      wholesalePriceUnitInr: 200.0,
      wholesalePriceCaseInr: 2000.0,
      retailPriceMrpInr: 150.0, // VIOLATION: MRP < Wholesale
      minOrderQuantityUnits: 10,
      inventoryOnHandUnits: 100,
      inventoryAllocatedUnits: 0,
      inventoryAvailableUnits: 100,
      sourceLotReference: 'LOT-VAL-HONEY-2025-01',
      certifications: [],
      isEvidenceVerified: false,
      isPublished: true,
    });
  } catch (err: any) {
    pricingViolationBlocked = err.message.includes('Pricing violation');
  }
  assert(pricingViolationBlocked, 'MRP lower than wholesale price is blocked');

  // Invariant test: Custody linkage required
  let missingCustodyBlocked = false;
  try {
    await createRetailProductSku({
      skuCode: 'SKU-CUSTODY-FAIL',
      barcode: null,
      brandId: mayurWildBrand.id,
      partnerId: karanJiaShg.id,
      productTitle: 'Missing Custody Product',
      productTier: 'RETAIL_READY_PACKAGED',
      category: 'Edibles',
      netQuantity: '100 g',
      netWeightGrams: 100.0,
      casePackSize: 10,
      packagingType: 'GLASS_JAR',
      packagingMaterial: 'Glass',
      shelfLifeMonths: 12,
      ingredients: 'Natural extract',
      storageInstructions: 'Dry place',
      originCluster: 'Karanjia',
      communityProvenance: 'Tribal Collective',
      harvestSeason: 'Spring',
      traditionalHarvestPractice: 'Hand pick',
      wholesalePriceUnitInr: 100.0,
      wholesalePriceCaseInr: 1000.0,
      retailPriceMrpInr: 150.0,
      minOrderQuantityUnits: 10,
      inventoryOnHandUnits: 100,
      inventoryAllocatedUnits: 0,
      inventoryAvailableUnits: 100,
      sourceLotReference: '', // VIOLATION: Missing custody lot reference
      certifications: [],
      isEvidenceVerified: false,
      isPublished: true,
    });
  } catch (err: any) {
    missingCustodyBlocked = err.message.includes('Mandatory custody linkage error');
  }
  assert(missingCustodyBlocked, 'Retail SKU without source harvest lot reference is blocked');

  // -------------------------------------------------------------------
  // 4. Multi-Channel Distribution Management & Feed Export
  // -------------------------------------------------------------------
  console.log('\n--- 4. Multi-Channel Distribution Management & Feed Export ---');

  const channels = await getDistributionChannels();
  assert(channels.length >= 4, 'Seed distribution channels loaded');

  const retailChannel = await getDistributionChannelById('CHN-UTKAL-01');
  assert(retailChannel !== null, 'Utkalika State Emporium channel exists');
  if (!retailChannel) throw new Error('retailChannel not found');
  assert(retailChannel.channelType === 'EXTERNAL_RETAIL_PARTNER', 'Type is EXTERNAL_RETAIL_PARTNER');
  assert(retailChannel.retailerMarginPercent === 22.0, 'Standard retailer margin is 22.0%');

  const d2cChannel = await getDistributionChannelById('CHN-MAYUR-D2C');
  assert(d2cChannel?.channelType === 'PARTNER_OWNED_STORE', 'Type is PARTNER_OWNED_STORE');

  const instChannel = await getDistributionChannelById('CHN-APEX-INST');
  assert(instChannel?.channelType === 'INSTITUTIONAL_BUYER', 'Type is INSTITUTIONAL_BUYER');

  const resellerChannel = await getDistributionChannelById('CHN-RESELL-EAST');
  assert(resellerChannel?.channelType === 'APPROVED_RESELLER_NETWORK', 'Type is APPROVED_RESELLER_NETWORK');

  // Test margin calculation helper
  const pricing = calculateChannelPricing(295.0, 380.0, 22.0, 0.0);
  assert(pricing.retailerMarginAmount === 83.6, 'Retailer margin amount is ₹83.60 on ₹380 MRP (22%)');
  assert(pricing.platformFeeAmount === 0.0, 'Platform enablement fee is ₹0.00 in pilot');
  assert(pricing.netProducerRealization === 295.0, 'Net producer realization is full wholesale price ₹295.00');

  // Test catalogue feed export (JSON & CSV)
  const jsonFeedString = exportPartnerCatalogue([packagedHoney], retailChannel, 'json');
  const jsonFeed = JSON.parse(jsonFeedString);
  assert(jsonFeed.channel_code === 'CHN-UTKAL-01', 'JSON feed export contains channel code');
  assert(jsonFeed.items.length === 1, 'JSON feed contains 1 published SKU');
  assert(jsonFeed.items[0].sku_code === 'SKU-MW-HONEY-500G', 'JSON feed contains honey SKU');
  assert(jsonFeed.items[0].batch_verification_url.includes('LOT-VAL-HONEY-2025-01'), 'JSON feed contains batch verification URL');

  const csvFeed = exportPartnerCatalogue([packagedHoney], retailChannel, 'csv');
  assert(csvFeed.includes('sku_code,barcode_ean13,product_title'), 'CSV feed contains expected header row');
  assert(csvFeed.includes('SKU-MW-HONEY-500G'), 'CSV feed contains SKU code row');

  // -------------------------------------------------------------------
  // 5. Order Referral Recording & Inventory Allocation Locking
  // -------------------------------------------------------------------
  console.log('\n--- 5. Order Referral Recording & Inventory Allocation Locking ---');

  const initialHoney = await getRetailProductSkuById('SKU-MW-HONEY-500G');
  if (!initialHoney) throw new Error('Honey SKU not found');
  const initialAvailableUnits = initialHoney.inventoryAvailableUnits;
  const initialAllocatedUnits = initialHoney.inventoryAllocatedUnits;
  const initialOnHandUnits = initialHoney.inventoryOnHandUnits;

  // Record an order referral for 24 units (2 cases)
  const newReferral = await recordOrderReferral({
    channelId: retailChannel.id,
    externalOrderNumber: 'EXT-UTKAL-NEW-01',
    customerIdentifier: 'Utkalika New Delhi Emporium',
    lineItems: [
      {
        skuCode: 'SKU-MW-HONEY-500G',
        quantityUnits: 24,
      },
    ],
    fulfilmentNotes: 'Ship via State Road Transport under temperature-controlled packaging.',
  });

  assert(newReferral.referralCode.startsWith('REF-ORD-2025-'), 'Referral receives sequential code');
  assert(newReferral.status === 'RECORDED', 'Referral status is RECORDED');
  assert(newReferral.totalUnits === 24, 'Total units is 24');
  assert(newReferral.grossOrderValueInr === 24 * 380.0, 'Gross order value is ₹9,120.00 (24 * ₹380 MRP)');
  assert(newReferral.wholesaleOrderValueInr === 24 * 295.0, 'Wholesale value is ₹7,080.00 (24 * ₹295)');
  assert(newReferral.platformEnablementFeeInr === 0.0, 'Platform enablement fee is ₹0.00');
  assert(newReferral.netPartnerPayableInr === 7080.0, 'Net partner payable is ₹7,080.00');

  // Verify stock allocation hold
  const updatedHoney = await getRetailProductSkuById('SKU-MW-HONEY-500G');
  if (!updatedHoney) throw new Error('Honey SKU not found');
  assert(
    updatedHoney.inventoryAllocatedUnits === initialAllocatedUnits + 24,
    'Inventory allocated units increased by 24'
  );
  assert(
    updatedHoney.inventoryAvailableUnits === initialAvailableUnits - 24,
    'Inventory available units decreased by 24'
  );

  // Transition to CONFIRMED_FULFILLED (Physical stock drawn down)
  const fulfilledReferral = await updateOrderReferralStatus(
    newReferral.id,
    'CONFIRMED_FULFILLED',
    'Dispatched from Karanjia Depot via E-Waybill #EWB-2110-8849-3012.'
  );
  assert(fulfilledReferral.status === 'CONFIRMED_FULFILLED', 'Referral transitioned to CONFIRMED_FULFILLED');

  const postFulfilHoney = await getRetailProductSkuById('SKU-MW-HONEY-500G');
  if (!postFulfilHoney) throw new Error('Honey SKU not found');
  assert(
    postFulfilHoney.inventoryOnHandUnits === initialOnHandUnits - 24,
    'Physical on-hand units decremented by 24 upon fulfilled dispatch'
  );

  // -------------------------------------------------------------------
  // 6. Sales Reconciliation & Physical Stock Discrepancy Detection
  // -------------------------------------------------------------------
  console.log('\n--- 6. Sales Reconciliation & Physical Stock Discrepancy Detection ---');

  // Test calculateReconciliationVariance helper
  const cleanMatch = calculateReconciliationVariance(120, 120);
  assert(cleanMatch.isDiscrepancy === false, '120 reported == 120 physical is clean match');
  assert(cleanMatch.status === 'RECONCILED_SETTLED', 'Clean match status is RECONCILED_SETTLED');

  const discrepancyMatch = calculateReconciliationVariance(120, 100);
  assert(discrepancyMatch.isDiscrepancy === true, '120 reported != 100 physical flags discrepancy');
  assert(discrepancyMatch.status === 'DISCREPANCY_FLAGGED', 'Discrepancy status is DISCREPANCY_FLAGGED');
  assert(discrepancyMatch.varianceUnits === 20, 'Variance calculated as 20 units');

  // Execute clean reconciliation on Utkalika Channel
  const cleanRecon = await createSalesReconciliation({
    channelId: retailChannel.id,
    billingPeriodStart: '2025-04-01T00:00:00Z',
    billingPeriodEnd: '2025-04-30T23:59:59Z',
    physicalInventoryDrawdownUnits: 120, // 120 units from April 2025 referral
    settlementReference: 'UTR-SBIN-20250430-882190',
    reconciledBy: 'Rabindra Jena (Finance Officer)',
  });

  assert(cleanRecon.reconciliationNumber.startsWith('REC-B2B2C-2025-'), 'Reconciliation receives valid sequential code');
  assert(cleanRecon.status === 'RECONCILED_SETTLED', 'Reconciliation settled cleanly');
  assert(cleanRecon.inventoryVarianceUnits === 0, 'Inventory variance is 0 units');
  assert(cleanRecon.settlementReference === 'UTR-SBIN-20250430-882190', 'Bank UTR recorded');

  // Execute reconciliation with discrepancy (e.g. physical drawdown short by 10 units)
  const discrepantRecon = await createSalesReconciliation({
    channelId: retailChannel.id,
    billingPeriodStart: '2025-04-01T00:00:00Z',
    billingPeriodEnd: '2025-04-30T23:59:59Z',
    physicalInventoryDrawdownUnits: 110, // 10 units short of 120
    reconciledBy: 'Rabindra Jena (Finance Officer)',
  });

  assert(discrepantRecon.status === 'DISCREPANCY_FLAGGED', 'Mismatching reconciliation marked DISCREPANCY_FLAGGED');
  assert(discrepantRecon.inventoryVarianceUnits === 10, 'Variance of 10 units identified');
  assert(discrepantRecon.discrepancyNotes !== null, 'Discrepancy notes generated');

  // -------------------------------------------------------------------
  // 7. Pilot Revenue & Fair-Trade Invariants
  // -------------------------------------------------------------------
  console.log('\n--- 7. Pilot Revenue & Fair-Trade Invariants ---');

  const summary = await getDistributionPerformanceSummary();
  assert(summary.totalPlatformFees === 0.0, 'Platform enablement fee is 0.0 across all partner sales');
  assert(
    summary.fairTradeMspProtectionGuarantee.includes('100% of statutory MSP paid to primary gatherers'),
    'Fair-trade primary gatherer protection guarantee documented'
  );

  // Test subscription tier models
  const tierUpdate = await updatePartnerSubscriptionTier(karanJiaShg.id, 'GROWTH_PARTNER', 0.0);
  assert(tierUpdate.subscriptionTier === 'GROWTH_PARTNER', 'Subscription tier upgraded to GROWTH_PARTNER');
  assert(tierUpdate.enablementFeeRate === 0.0, 'Pilot enablement fee remains 0.0%');

  // -------------------------------------------------------------------
  // 8. REST API Endpoints Integration Tests
  // -------------------------------------------------------------------
  console.log('\n--- 8. REST API Endpoints Integration Tests ---');

  const baseUrl = 'http://localhost:3000';

  // GET /api/trade/distribution/partners
  const pRes = await fetch(`${baseUrl}/api/trade/distribution/partners`);
  assert(pRes.status === 200, 'GET /api/trade/distribution/partners returns 200');
  const pData = await pRes.json();
  assert(Array.isArray(pData.partners) && pData.partners.length >= 3, 'API returns partner profiles');

  // GET /api/trade/distribution/skus
  const sRes = await fetch(`${baseUrl}/api/trade/distribution/skus`);
  assert(sRes.status === 200, 'GET /api/trade/distribution/skus returns 200');
  const sData = await sRes.json();
  assert(Array.isArray(sData.skus) && sData.skus.length >= 4, 'API returns retail product SKUs');

  // GET /api/trade/distribution/channels
  const cRes = await fetch(`${baseUrl}/api/trade/distribution/channels`);
  assert(cRes.status === 200, 'GET /api/trade/distribution/channels returns 200');
  const cData = await cRes.json();
  assert(Array.isArray(cData.channels) && cData.channels.length >= 4, 'API returns distribution channels');

  // GET /api/trade/distribution/referrals
  const rRes = await fetch(`${baseUrl}/api/trade/distribution/referrals`);
  assert(rRes.status === 200, 'GET /api/trade/distribution/referrals returns 200');
  const rData = await rRes.json();
  assert(Array.isArray(rData.referrals), 'API returns order referrals');

  // POST /api/trade/distribution/referrals
  const postRefRes = await fetch(`${baseUrl}/api/trade/distribution/referrals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channelId: 'CHN-001',
      externalOrderNumber: 'API-TEST-REF-99',
      customerIdentifier: 'API Test Customer',
      lineItems: [
        {
          skuCode: 'SKU-SF-MAHUA-250G',
          quantityUnits: 24,
        },
      ],
    }),
  });
  assert(postRefRes.status === 201, 'POST /api/trade/distribution/referrals creates referral via API');

  // GET /api/trade/distribution/export
  const expRes = await fetch(`${baseUrl}/api/trade/distribution/export?channel=CHN-UTKAL-01&format=json`);
  assert(expRes.status === 200, 'GET /api/trade/distribution/export returns 200');
  const expData = await expRes.json();
  assert(expData.channel_code === 'CHN-UTKAL-01', 'Catalogue export returns valid JSON channel feed');

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  B2B2C Partner Distribution Network Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');
  console.log('SUCCESS: All partner enablement, retail SKU, and reconciliation checks passed.');
}

runAllDistributionTests().catch((err) => {
  console.error('\nFAILURE in Distribution Network test suite:', err);
  process.exit(1);
});
