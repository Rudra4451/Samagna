/**
 * Comprehensive Automated Verification Suite for Samagna Phase 7:
 * Consumer Marketplace
 *
 * Verifies:
 * 1. Consumer Product Presentation & Truth in Labeling
 * 2. Fair-Trade Collector MSP Protection Invariant
 * 3. Real-Time Inventory Controls & Oversell Prevention
 * 4. End-to-End Consumer Order Lifecycle & Financial Calculations
 * 5. Customer Cancellation Rules & Immediate Stock Restoration
 * 6. Delivery Advancement & Physical Stock Drawdown Commitment
 * 7. Customer Grievance & Returns Lifecycle
 * 8. REST API Endpoints Integration
 */

import {
  getConsumerProducts,
  getConsumerProductBySlug,
  getConsumerProductById,
  createConsumerProduct,
  reserveProductStock,
  releaseProductStock,
  getConsumerOrders,
  getConsumerOrderById,
  createConsumerOrder,
  cancelConsumerOrder,
  advanceOrderStatus,
  getConsumerGrievances,
  submitConsumerGrievance,
  resolveConsumerGrievance,
  getCustomerAccountSummary,
} from '../src/lib/server/consumerCommerce';

import {
  calculateConsumerOrderPricing,
  canCustomerCancelOrder,
  canCustomerSubmitGrievance,
} from '../src/lib/consumerCommerce';

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

async function runAllConsumerCommerceTests() {
  console.log('\n======================================================');
  console.log('      SAMAGNA Phase 7: Consumer Marketplace Desk      ');
  console.log('======================================================\n');

  // -------------------------------------------------------------------
  // 1. Consumer Product Presentation & Truth in Labeling
  // -------------------------------------------------------------------
  console.log('--- 1. Consumer Product Presentation & Truth in Labeling ---');

  const products = await getConsumerProducts();
  assert(products.length >= 4, 'Seed consumer catalogue loaded');

  const wildHoney = await getConsumerProductBySlug('mayurbhanj-wild-honey-500g');
  assert(wildHoney !== null, 'Mayurbhanj Wild Honey product exists');
  if (!wildHoney) throw new Error('wildHoney not found');

  assert(wildHoney.category === 'WILD_HONEY', 'Product category is WILD_HONEY');
  assert(wildHoney.scientificName === 'Apis dorsata comb nectar', 'Scientific botanical name documented');
  assert(wildHoney.odiaName === 'ମୟୂରଭଞ୍ଜ ପ୍ରାକୃତିକ ଜଙ୍ଗଲ ମହୁ', 'Odia vernacular name documented');
  assert(wildHoney.harvestCluster.includes('Similipal Biosphere Reserve'), 'Origin cluster documented');
  assert(wildHoney.packaging.type === 'Glass Jar', 'Packaging container is Glass Jar');
  assert(wildHoney.packaging.tamperEvidentSeal === true, 'Tamper-evident induction seal declared');

  // Intermediary Disclosure Verification
  assert(
    wildHoney.intermediaryDisclosure.includes('Gathered by Santhal and Kolha tribal honey gatherers'),
    'Intermediary disclosure explicitly names primary gatherer collectives'
  );
  assert(
    wildHoney.intermediaryDisclosure.includes('Karanjia TDCCOL Complex'),
    'Intermediary disclosure identifies aggregation, testing, and packaging facilities'
  );

  // Compliance & Provenance Verification
  assert(wildHoney.compliance.fssaiLicenseNumber === '12023999000124', 'FSSAI License documented');
  assert(wildHoney.compliance.labPurityCertificateRef === 'QC-LAB-2025-HONEY-08', 'State food testing lab assay documented');
  assert(wildHoney.compliance.lotReference === 'LOT-VAL-HONEY-2025-01', 'Direct physical custody lot linkage');

  // -------------------------------------------------------------------
  // 2. Fair-Trade Collector MSP Protection Invariant
  // -------------------------------------------------------------------
  console.log('\n--- 2. Fair-Trade Collector MSP Protection Invariant ---');

  assert(wildHoney.pricing.mrpInr === 380.0, 'Retail MRP is ₹380.00');
  assert(wildHoney.pricing.fairTradeMspShareInr === 210.0, 'Primary gatherer MSP share is ₹210.00 (100% protected)');
  assert(wildHoney.pricing.platformFeeInr === 0.0, 'Platform service fee is ₹0.00 in pilot');

  // Pricing Invariant Test: MRP cannot be lower than gatherer MSP entitlement
  let pricingViolationBlocked = false;
  try {
    await createConsumerProduct({
      slug: 'violation-honey',
      title: 'Violation Honey',
      odiaName: 'ଭୁଲ ମହୁ',
      scientificName: 'Apis dorsata',
      category: 'WILD_HONEY',
      categoryLabel: 'Wild Honey',
      heroImage: '/products/honey.jpg',
      galleryImages: [],
      tagline: 'Faulty Pricing',
      story: 'Story',
      sellerOrg: wildHoney.sellerOrg,
      intermediaryDisclosure: 'Disclosure',
      harvestCluster: 'Karanjia',
      harvestSeason: 'Spring',
      traditionalPractice: 'Practice',
      packaging: wildHoney.packaging,
      pricing: {
        mrpInr: 100.0, // VIOLATION: MRP < Gatherer MSP share (210)
        fairTradeMspShareInr: 210.0,
        packagingAndTestingShareInr: 50.0,
        logisticsShareInr: 20.0,
        platformFeeInr: 0.0,
      },
      stock: wildHoney.stock,
      compliance: wildHoney.compliance,
      dietaryAndAttributes: [],
      storageInstructions: 'Dry place',
      shelfLifeMonths: 12,
    });
  } catch (err: any) {
    pricingViolationBlocked = err.message.includes('Pricing violation');
  }
  assert(pricingViolationBlocked, 'Product with MRP below primary gatherer MSP share is blocked');

  // -------------------------------------------------------------------
  // 3. Real-Time Inventory Controls & Oversell Prevention
  // -------------------------------------------------------------------
  console.log('\n--- 3. Real-Time Inventory Controls & Oversell Prevention ---');

  const outOfStockHoney = await getConsumerProductBySlug('rare-wild-black-honey');
  assert(outOfStockHoney !== null, 'Out of stock seasonal fixture exists');
  assert(outOfStockHoney?.stock.isAvailable === false, 'Out-of-stock product has isAvailable=false');
  assert(outOfStockHoney?.stock.availableUnits === 0, 'Out-of-stock product has 0 available units');

  // Attempting to reserve stock on out-of-stock product must fail
  let outOfStockBlocked = false;
  try {
    if (outOfStockHoney) {
      await reserveProductStock(outOfStockHoney.id, 1);
    }
  } catch (err: any) {
    outOfStockBlocked = err.message.includes('Insufficient available stock');
  }
  assert(outOfStockBlocked, 'Purchasing/reserving out-of-stock product is strictly blocked');

  // Exceeding available units must fail
  const initialAvailable = wildHoney.stock.availableUnits;
  let oversellBlocked = false;
  try {
    await reserveProductStock(wildHoney.id, initialAvailable + 100);
  } catch (err: any) {
    oversellBlocked = err.message.includes('Insufficient available stock');
  }
  assert(oversellBlocked, 'Overselling beyond available warehouse units is strictly blocked');

  // -------------------------------------------------------------------
  // 4. End-to-End Consumer Order Lifecycle & Financial Calculations
  // -------------------------------------------------------------------
  console.log('\n--- 4. End-to-End Consumer Order Lifecycle & Financial Calculations ---');

  // Test pricing calculation helper directly
  const freeShippingPricing = calculateConsumerOrderPricing([
    { unitPriceInr: 380.0, quantityUnits: 2, fairTradeMspShareInr: 210.0 }, // ₹760
  ]);
  assert(freeShippingPricing.subtotalInr === 760.0, 'Subtotal is ₹760.00');
  assert(freeShippingPricing.shippingFeeInr === 0.0, 'Orders >= ₹500 receive FREE shipping');
  assert(freeShippingPricing.totalPayableInr === 760.0, 'Total payable is ₹760.00');
  assert(freeShippingPricing.platformFeeInr === 0.0, 'Platform enablement fee is ₹0.00');
  assert(freeShippingPricing.totalFairTradeMspShareInr === 420.0, 'Total gatherer MSP share is ₹420.00');

  const paidShippingPricing = calculateConsumerOrderPricing([
    { unitPriceInr: 185.0, quantityUnits: 1, fairTradeMspShareInr: 95.0 }, // ₹185 (< ₹500)
  ]);
  assert(paidShippingPricing.shippingFeeInr === 50.0, 'Orders < ₹500 charge standard ₹50 eco-freight');
  assert(paidShippingPricing.totalPayableInr === 235.0, 'Total payable includes ₹50 shipping (₹235.00)');

  // Create an actual consumer order
  const preOrderAvailable = wildHoney.stock.availableUnits;
  const preOrderAllocated = wildHoney.stock.allocatedUnits;

  const newOrder = await createConsumerOrder({
    customerName: 'Debasmita Rout',
    customerEmail: 'debasmita.rout@gmail.com',
    customerPhone: '+91-9437199221',
    shippingAddress: {
      street: 'Plot 44, Forest View Enclave, Chandrasekharpur',
      city: 'Bhubaneswar',
      district: 'Khurda',
      state: 'Odisha',
      pincode: '751024',
    },
    items: [
      {
        productId: wildHoney.id,
        quantityUnits: 2,
      },
    ],
    paymentMethod: 'DEMO_COMMERCIAL_GATEWAY',
  });

  assert(newOrder.orderNumber.startsWith('ORD-SMG-2025-'), 'Order receives sequential order number');
  assert(newOrder.orderStatus === 'ORDER_PLACED_CONFIRMED', 'Order starts in status ORDER_PLACED_CONFIRMED');
  assert(newOrder.totalUnits === 2, 'Total units is 2');
  assert(newOrder.subtotalInr === 760.0, 'Subtotal is ₹760.00');
  assert(newOrder.shippingFeeInr === 0.0, 'Shipping fee is ₹0.00 (Order >= ₹500)');
  assert(newOrder.totalPayableInr === 760.0, 'Total payable is ₹760.00');
  assert(newOrder.primaryLotReference === 'LOT-VAL-HONEY-2025-01', 'Traceable to harvest lot LOT-VAL-HONEY-2025-01');

  // Verify stock allocation hold
  const postOrderHoney = await getConsumerProductById(wildHoney.id);
  if (!postOrderHoney) throw new Error('Honey not found');
  assert(
    postOrderHoney.stock.availableUnits === preOrderAvailable - 2,
    'Available units decremented by 2 upon order placement'
  );
  assert(
    postOrderHoney.stock.allocatedUnits === preOrderAllocated + 2,
    'Allocated units incremented by 2 upon order placement'
  );

  // -------------------------------------------------------------------
  // 5. Customer Cancellation Rules & Immediate Stock Restoration
  // -------------------------------------------------------------------
  console.log('\n--- 5. Customer Cancellation Rules & Immediate Stock Restoration ---');

  // Check canCustomerCancelOrder helper
  assert(canCustomerCancelOrder('ORDER_PLACED_CONFIRMED') === true, 'ORDER_PLACED_CONFIRMED can be cancelled');
  assert(canCustomerCancelOrder('PROCESSING_PACKED') === true, 'PROCESSING_PACKED can be cancelled');
  assert(canCustomerCancelOrder('DISPATCHED_IN_TRANSIT') === false, 'DISPATCHED_IN_TRANSIT cannot be cancelled');
  assert(canCustomerCancelOrder('DELIVERED_CONFIRMED') === false, 'DELIVERED_CONFIRMED cannot be cancelled');

  // Cancel the newly placed order
  const cancelledOrder = await cancelConsumerOrder(
    newOrder.id,
    'debasmita.rout@gmail.com',
    'Customer ordered duplicate quantity by mistake.'
  );

  assert(cancelledOrder.orderStatus === 'CANCELLED', 'Order transitioned to CANCELLED');
  assert(cancelledOrder.cancellationReason !== null, 'Cancellation reason recorded');

  // Verify stock was restored
  const postCancelHoney = await getConsumerProductById(wildHoney.id);
  if (!postCancelHoney) throw new Error('Honey not found');
  assert(
    postCancelHoney.stock.availableUnits === preOrderAvailable,
    'Available warehouse stock restored to pre-order level upon cancellation'
  );
  assert(
    postCancelHoney.stock.allocatedUnits === preOrderAllocated,
    'Allocated stock returned to pre-order level upon cancellation'
  );

  // -------------------------------------------------------------------
  // 6. Delivery Advancement & Physical Stock Commitment
  // -------------------------------------------------------------------
  console.log('\n--- 6. Delivery Advancement & Physical Stock Commitment ---');

  // Create another order and progress to delivered
  const orderForDelivery = await createConsumerOrder({
    customerName: 'Sanjay Behera',
    customerEmail: 'sanjay.behera@gmail.com',
    customerPhone: '+91-9861005544',
    shippingAddress: {
      street: 'Line 2, Madhuban',
      city: 'Baripada',
      district: 'Mayurbhanj',
      state: 'Odisha',
      pincode: '757001',
    },
    items: [{ productId: wildHoney.id, quantityUnits: 1 }],
  });

  const initialOnHand = postCancelHoney.stock.totalOnHandUnits;

  // Advance to PACKED
  await advanceOrderStatus(orderForDelivery.id, 'PROCESSING_PACKED', 'Warehouse Officer');
  // Advance to IN_TRANSIT with waybill
  await advanceOrderStatus(orderForDelivery.id, 'DISPATCHED_IN_TRANSIT', 'Logistics Officer', 'Dispatched locally', 'WAYBILL-BRP-901');

  // Cancellation must now be blocked
  let cancelInTransitBlocked = false;
  try {
    await cancelConsumerOrder(orderForDelivery.id, 'sanjay.behera@gmail.com', 'Cancel in transit');
  } catch (err: any) {
    cancelInTransitBlocked = err.message.includes('cannot be cancelled');
  }
  assert(cancelInTransitBlocked, 'Attempting to cancel an in-transit order is strictly blocked');

  // Advance to DELIVERED
  const deliveredOrder = await advanceOrderStatus(orderForDelivery.id, 'DELIVERED_CONFIRMED', 'Courier Delivery Agent', 'Delivered to recipient');
  assert(deliveredOrder.orderStatus === 'DELIVERED_CONFIRMED', 'Order transitioned to DELIVERED_CONFIRMED');
  assert(deliveredOrder.deliveredAt !== null, 'Delivered timestamp recorded');

  // Verify physical on-hand stock committed/reduced
  const postDeliveryHoney = await getConsumerProductById(wildHoney.id);
  if (!postDeliveryHoney) throw new Error('Honey not found');
  assert(
    postDeliveryHoney.stock.totalOnHandUnits === initialOnHand - 1,
    'Physical warehouse on-hand units decremented upon confirmed delivery'
  );

  // -------------------------------------------------------------------
  // 7. Customer Grievance & Returns Lifecycle
  // -------------------------------------------------------------------
  console.log('\n--- 7. Customer Grievance & Returns Lifecycle ---');

  // Attempting grievance on unfulfilled order is blocked
  assert(canCustomerSubmitGrievance('ORDER_PLACED_CONFIRMED') === false, 'Cannot submit grievance for unfulfilled order');
  assert(canCustomerSubmitGrievance('DELIVERED_CONFIRMED') === true, 'Delivered order allows grievance submission');

  // Submit grievance on delivered order
  const newGrievance = await submitConsumerGrievance({
    orderId: deliveredOrder.id,
    customerEmail: 'sanjay.behera@gmail.com',
    grievanceType: 'DAMAGED_IN_TRANSIT',
    description: 'Outer seal had evidence of moisture ingress during rain transit.',
    evidenceDocUrl: '/docs/grievances/evidence-901.jpg',
  });

  assert(newGrievance.ticketNumber.startsWith('GRV-2025-'), 'Grievance ticket receives valid sequential code');
  assert(newGrievance.status === 'SUBMITTED', 'Grievance ticket starts in status SUBMITTED');

  // Resolve grievance
  const resolved = await resolveConsumerGrievance(
    newGrievance.ticketNumber,
    'RESOLVED',
    'Replacement jar dispatched under priority carbon-neutral haulage. Incident closed.'
  );
  assert(resolved.status === 'RESOLVED', 'Grievance resolved successfully');
  assert(resolved.resolutionNotes !== null, 'Resolution notes attached to ticket');

  // Test customer account summary
  const accountSummary = await getCustomerAccountSummary('sanjay.behera@gmail.com');
  assert(accountSummary.totalOrdersCount >= 1, 'Account summary retrieves customer orders');

  const ananyaSummary = await getCustomerAccountSummary('ananya.mohapatra@gmail.com');
  assert(ananyaSummary.deliveredOrdersCount >= 1, 'Account summary calculates delivered orders');

  // -------------------------------------------------------------------
  // 8. REST API Endpoints Integration Tests
  // -------------------------------------------------------------------
  console.log('\n--- 8. REST API Endpoints Integration Tests ---');

  const baseUrl = 'http://localhost:3000';

  // GET /api/consumer/products
  const prodRes = await fetch(`${baseUrl}/api/consumer/products`);
  assert(prodRes.status === 200, 'GET /api/consumer/products returns 200');
  const prodData = await prodRes.json();
  assert(Array.isArray(prodData.products) && prodData.products.length >= 4, 'API returns consumer catalogue');

  // GET /api/consumer/products?slug=mayurbhanj-wild-honey-500g
  const slugRes = await fetch(`${baseUrl}/api/consumer/products?slug=mayurbhanj-wild-honey-500g`);
  assert(slugRes.status === 200, 'GET /api/consumer/products?slug=... returns 200');
  const slugData = await slugRes.json();
  assert(slugData.product.slug === 'mayurbhanj-wild-honey-500g', 'API returns specific product by slug');

  // GET /api/consumer/orders
  const ordRes = await fetch(`${baseUrl}/api/consumer/orders`);
  assert(ordRes.status === 200, 'GET /api/consumer/orders returns 200');
  const ordData = await ordRes.json();
  assert(Array.isArray(ordData.orders), 'API returns consumer orders');

  // POST /api/consumer/orders
  const postOrdRes = await fetch(`${baseUrl}/api/consumer/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'API Customer',
      customerEmail: 'api.customer@test.com',
      customerPhone: '+91-9999900000',
      shippingAddress: {
        street: '123 Forest View',
        city: 'Baripada',
        district: 'Mayurbhanj',
        state: 'Odisha',
        pincode: '757001',
      },
      items: [{ productId: wildHoney.id, quantityUnits: 1 }],
    }),
  });
  assert(postOrdRes.status === 201, 'POST /api/consumer/orders creates order via API');
  const postOrdData = await postOrdRes.json();
  assert(postOrdData.order.orderNumber.startsWith('ORD-SMG-2025-'), 'Created order has valid number');

  // PATCH /api/consumer/orders (Cancel)
  const cancelRes = await fetch(`${baseUrl}/api/consumer/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'CANCEL',
      orderId: postOrdData.order.id,
      customerEmail: 'api.customer@test.com',
      reason: 'Cancelled via API test',
    }),
  });
  assert(cancelRes.status === 200, 'PATCH /api/consumer/orders cancels order via API');

  // POST /api/consumer/grievances (Using seed delivered order ORD-SEED-001)
  const postGrvRes = await fetch(`${baseUrl}/api/consumer/grievances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: 'ORD-SEED-001',
      customerEmail: 'ananya.mohapatra@gmail.com',
      grievanceType: 'OTHER',
      description: 'API test grievance inquiry regarding tamper seal inspection.',
    }),
  });
  assert(postGrvRes.status === 201, 'POST /api/consumer/grievances creates grievance via API');

  // GET /api/consumer/account
  const accRes = await fetch(`${baseUrl}/api/consumer/account?email=sanjay.behera@gmail.com`);
  assert(accRes.status === 200, 'GET /api/consumer/account returns 200');
  const accData = await accRes.json();
  assert(accData.summary.customerEmail === 'sanjay.behera@gmail.com', 'API returns account summary');

  // -------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`  Consumer Marketplace Test Results: ${passedTests}/${totalTests} Passed`);
  console.log('======================================================\n');
  console.log('SUCCESS: All consumer storefront, inventory, and order checks passed.');
}

runAllConsumerCommerceTests().catch((err) => {
  console.error('\nFAILURE in Consumer Marketplace test suite:', err);
  process.exit(1);
});
