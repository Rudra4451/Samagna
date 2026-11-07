/**
 * Server-Side Operations for Samagna Consumer Marketplace
 * Inventory Controls, Oversell Prevention, Order Workflows,
 * Cancellation Rules, Grievance Management & Customer Accounts.
 */

import {
  ConsumerProduct,
  ConsumerOrder,
  ConsumerOrderItem,
  ConsumerGrievance,
  ConsumerOrderStatus,
  ConsumerGrievanceType,
  ConsumerGrievanceStatus,
  ConsumerProductCategory,
  SEED_CONSUMER_PRODUCTS,
  SEED_CONSUMER_ORDERS,
  SEED_CONSUMER_GRIEVANCES,
  calculateConsumerOrderPricing,
  canCustomerCancelOrder,
  canCustomerSubmitGrievance,
} from '@/lib/consumerCommerce';

// In-Memory Storage Singletons with Seed Data Fallbacks
let inMemoryProducts: ConsumerProduct[] = [...SEED_CONSUMER_PRODUCTS];
let inMemoryOrders: ConsumerOrder[] = [...SEED_CONSUMER_ORDERS];
let inMemoryGrievances: ConsumerGrievance[] = [...SEED_CONSUMER_GRIEVANCES];

// ==========================================
// 1. Consumer Product Catalogue
// ==========================================

export async function getConsumerProducts(filters?: {
  category?: ConsumerProductCategory;
  inStockOnly?: boolean;
  query?: string;
}): Promise<ConsumerProduct[]> {
  let list = [...inMemoryProducts];

  if (filters?.category) {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters?.inStockOnly) {
    list = list.filter((p) => p.stock.isAvailable && p.stock.availableUnits > 0);
  }

  if (filters?.query && filters.query.trim()) {
    const q = filters.query.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.story.toLowerCase().includes(q) ||
        p.harvestCluster.toLowerCase().includes(q) ||
        p.sellerOrg.name.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getConsumerProductBySlug(slug: string): Promise<ConsumerProduct | null> {
  const product = inMemoryProducts.find((p) => p.slug === slug || p.id === slug);
  return product || null;
}

export async function getConsumerProductById(id: string): Promise<ConsumerProduct | null> {
  const product = inMemoryProducts.find((p) => p.id === id);
  return product || null;
}

export async function createConsumerProduct(
  data: Omit<ConsumerProduct, 'id'>
): Promise<ConsumerProduct> {
  if (!data.compliance.lotReference) {
    throw new Error('Mandatory custody violation: Product must link to a valid harvest lot reference.');
  }

  if (data.pricing.mrpInr < data.pricing.fairTradeMspShareInr) {
    throw new Error('Pricing violation: Retail MRP cannot be less than primary collector fair-trade MSP share.');
  }

  const existingSlug = inMemoryProducts.find((p) => p.slug === data.slug);
  if (existingSlug) {
    throw new Error(`Product slug '${data.slug}' already exists.`);
  }

  const newProduct: ConsumerProduct = {
    ...data,
    id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };

  inMemoryProducts.push(newProduct);
  return newProduct;
}

// ==========================================
// 2. Real-Time Inventory Controls (Oversell Prevention)
// ==========================================

export async function reserveProductStock(
  productId: string,
  quantityUnits: number
): Promise<ConsumerProduct> {
  const product = await getConsumerProductById(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  if (product.stock.availableUnits < quantityUnits) {
    throw new Error(
      `Insufficient available stock for '${product.title}'. Requested: ${quantityUnits}, Available: ${product.stock.availableUnits}`
    );
  }

  product.stock.availableUnits -= quantityUnits;
  product.stock.allocatedUnits += quantityUnits;
  product.stock.isAvailable = product.stock.availableUnits > 0;

  return product;
}

export async function releaseProductStock(
  productId: string,
  quantityUnits: number
): Promise<ConsumerProduct> {
  const product = await getConsumerProductById(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  product.stock.allocatedUnits = Math.max(0, product.stock.allocatedUnits - quantityUnits);
  product.stock.availableUnits += quantityUnits;
  product.stock.isAvailable = product.stock.availableUnits > 0;

  return product;
}

export async function commitProductStockFulfillment(
  productId: string,
  quantityUnits: number
): Promise<ConsumerProduct> {
  const product = await getConsumerProductById(productId);
  if (!product) throw new Error(`Product not found: ${productId}`);

  product.stock.allocatedUnits = Math.max(0, product.stock.allocatedUnits - quantityUnits);
  product.stock.totalOnHandUnits = Math.max(0, product.stock.totalOnHandUnits - quantityUnits);
  product.stock.isAvailable = product.stock.availableUnits > 0;

  return product;
}

// ==========================================
// 3. Consumer Order Workflows & Lifecycle
// ==========================================

export async function getConsumerOrders(filters?: {
  customerEmail?: string;
  status?: ConsumerOrderStatus;
}): Promise<ConsumerOrder[]> {
  let list = [...inMemoryOrders];

  if (filters?.customerEmail) {
    const email = filters.customerEmail.toLowerCase();
    list = list.filter((o) => o.customerEmail.toLowerCase() === email);
  }

  if (filters?.status) {
    list = list.filter((o) => o.orderStatus === filters.status);
  }

  // Sort latest first
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getConsumerOrderById(id: string): Promise<ConsumerOrder | null> {
  const order = inMemoryOrders.find((o) => o.id === id || o.orderNumber === id);
  return order || null;
}

export async function createConsumerOrder(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ConsumerOrder['shippingAddress'];
  items: Array<{
    productId: string;
    quantityUnits: number;
  }>;
  paymentMethod?: string;
}): Promise<ConsumerOrder> {
  if (!data.items || data.items.length === 0) {
    throw new Error('Order must contain at least one product item.');
  }

  if (!data.customerName || !data.customerEmail || !data.customerPhone) {
    throw new Error('Mandatory customer contact details missing (name, email, and phone required).');
  }

  if (!data.shippingAddress?.street || !data.shippingAddress?.city || !data.shippingAddress?.pincode) {
    throw new Error('Incomplete shipping address: street, city, and 6-digit postal pincode are required.');
  }

  // Pre-validate stock availability for all items before reservation
  for (const item of data.items) {
    const product = await getConsumerProductById(item.productId);
    if (!product) throw new Error(`Product not found: ${item.productId}`);
    if (product.stock.availableUnits < item.quantityUnits) {
      throw new Error(
        `Cannot fulfill order: Insufficient stock for '${product.title}'. Available: ${product.stock.availableUnits}, Requested: ${item.quantityUnits}`
      );
    }
  }

  // Execute stock reservation & build line items
  const processedItems: ConsumerOrderItem[] = [];
  let primaryLotReference = '';

  for (const item of data.items) {
    const product = await getConsumerProductById(item.productId);
    if (!product) continue;

    // Reserve stock immediately to prevent overselling
    await reserveProductStock(product.id, item.quantityUnits);

    if (!primaryLotReference) {
      primaryLotReference = product.compliance.lotReference;
    }

    const totalPriceInr = product.pricing.mrpInr * item.quantityUnits;
    const fairTradeCollectorShareInr = product.pricing.fairTradeMspShareInr * item.quantityUnits;

    processedItems.push({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      quantityUnits: item.quantityUnits,
      unitPriceInr: product.pricing.mrpInr,
      totalPriceInr,
      packDescription: `${product.packaging.netQuantity} (${product.packaging.type})`,
      sourceLotReference: product.compliance.lotReference,
      fairTradeCollectorShareInr,
    });
  }

  // Financial Pricing Engine
  const pricing = calculateConsumerOrderPricing(
    processedItems.map((pi) => ({
      unitPriceInr: pi.unitPriceInr,
      quantityUnits: pi.quantityUnits,
      fairTradeMspShareInr: pi.fairTradeCollectorShareInr / pi.quantityUnits,
    }))
  );

  const now = new Date().toISOString();
  const orderNumber = `ORD-SMG-2025-${(inMemoryOrders.length + 1).toString().padStart(4, '0')}`;

  const newOrder: ConsumerOrder = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail.toLowerCase(),
    customerPhone: data.customerPhone,
    shippingAddress: data.shippingAddress,
    lineItems: processedItems,
    totalUnits: pricing.totalUnits,
    subtotalInr: pricing.subtotalInr,
    shippingFeeInr: pricing.shippingFeeInr,
    discountInr: pricing.discountInr,
    totalPayableInr: pricing.totalPayableInr,
    paymentMethod: data.paymentMethod || 'DEMO_COMMERCIAL_GATEWAY',
    paymentStatus: 'PAID_DEMO',
    orderStatus: 'ORDER_PLACED_CONFIRMED',
    primaryLotReference,
    trackingConsignmentRef: null,
    timeline: [
      {
        status: 'ORDER_PLACED_CONFIRMED',
        timestamp: now,
        title: 'Order Confirmed & Stock Allocated',
        description: `Payment authorized. Reserved stock linked to physical harvest lot ${primaryLotReference}.`,
        actor: 'Samagna Commerce Gateway',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  inMemoryOrders.push(newOrder);
  return newOrder;
}

export async function cancelConsumerOrder(
  orderId: string,
  customerEmail: string,
  reason: string
): Promise<ConsumerOrder> {
  const order = await getConsumerOrderById(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);

  if (order.customerEmail.toLowerCase() !== customerEmail.toLowerCase()) {
    throw new Error('Unauthorized: Customer email does not match order record.');
  }

  if (!canCustomerCancelOrder(order.orderStatus)) {
    throw new Error(
      `Order ${order.orderNumber} cannot be cancelled because it is in status '${order.orderStatus}'. Only orders awaiting dispatch can be cancelled.`
    );
  }

  // Restore reserved stock for all items
  for (const item of order.lineItems) {
    await releaseProductStock(item.productId, item.quantityUnits);
  }

  const now = new Date().toISOString();
  order.orderStatus = 'CANCELLED';
  order.cancellationReason = reason;
  order.cancelledAt = now;
  order.updatedAt = now;

  order.timeline.push({
    status: 'CANCELLED',
    timestamp: now,
    title: 'Order Cancelled by Customer',
    description: `Order cancelled. Reason: ${reason}. Reserved stock restored to warehouse inventory.`,
    actor: customerEmail,
  });

  return order;
}

export async function advanceOrderStatus(
  orderId: string,
  newStatus: ConsumerOrderStatus,
  actor: string,
  notes?: string,
  trackingConsignmentRef?: string
): Promise<ConsumerOrder> {
  const order = await getConsumerOrderById(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);

  const now = new Date().toISOString();
  order.orderStatus = newStatus;
  order.updatedAt = now;

  if (trackingConsignmentRef) {
    order.trackingConsignmentRef = trackingConsignmentRef;
  }

  if (newStatus === 'DELIVERED_CONFIRMED') {
    order.deliveredAt = now;
    // Commit physical stock decrement upon confirmed delivery
    for (const item of order.lineItems) {
      await commitProductStockFulfillment(item.productId, item.quantityUnits);
    }
  }

  order.timeline.push({
    status: newStatus,
    timestamp: now,
    title: `Status: ${newStatus.replace(/_/g, ' ')}`,
    description: notes || `Order progressed to ${newStatus}.`,
    actor,
  });

  return order;
}

// ==========================================
// 4. Returns & Customer Grievances
// ==========================================

export async function getConsumerGrievances(filters?: {
  customerEmail?: string;
  orderId?: string;
}): Promise<ConsumerGrievance[]> {
  let list = [...inMemoryGrievances];

  if (filters?.customerEmail) {
    const email = filters.customerEmail.toLowerCase();
    list = list.filter((g) => g.customerEmail.toLowerCase() === email);
  }

  if (filters?.orderId) {
    list = list.filter((g) => g.orderId === filters.orderId);
  }

  return list;
}

export async function submitConsumerGrievance(data: {
  orderId: string;
  customerEmail: string;
  grievanceType: ConsumerGrievanceType;
  description: string;
  evidenceDocUrl?: string;
}): Promise<ConsumerGrievance> {
  const order = await getConsumerOrderById(data.orderId);
  if (!order) throw new Error(`Order not found: ${data.orderId}`);

  if (order.customerEmail.toLowerCase() !== data.customerEmail.toLowerCase()) {
    throw new Error('Unauthorized: Customer email does not match order record.');
  }

  if (!canCustomerSubmitGrievance(order.orderStatus)) {
    throw new Error(
      `Cannot submit grievance for order in status '${order.orderStatus}'. Grievance is only valid for orders in transit or delivered.`
    );
  }

  const now = new Date().toISOString();
  const ticketNumber = `GRV-2025-${(inMemoryGrievances.length + 1).toString().padStart(3, '0')}`;

  const newGrievance: ConsumerGrievance = {
    id: `GRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticketNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: data.customerEmail.toLowerCase(),
    grievanceType: data.grievanceType,
    description: data.description,
    evidenceDocUrl: data.evidenceDocUrl || null,
    status: 'SUBMITTED',
    resolutionNotes: null,
    createdAt: now,
    resolvedAt: null,
  };

  inMemoryGrievances.push(newGrievance);

  // Update order status to return requested if applicable
  if (data.grievanceType === 'DAMAGED_IN_TRANSIT' || data.grievanceType === 'SEAL_BROKEN') {
    order.orderStatus = 'RETURN_REQUESTED';
    order.timeline.push({
      status: 'RETURN_REQUESTED',
      timestamp: now,
      title: 'Customer Grievance Ticket Logged',
      description: `Ticket ${ticketNumber}: ${data.grievanceType.replace(/_/g, ' ')}. ${data.description}`,
      actor: data.customerEmail,
    });
  }

  return newGrievance;
}

export async function resolveConsumerGrievance(
  ticketNumber: string,
  status: ConsumerGrievanceStatus,
  resolutionNotes: string
): Promise<ConsumerGrievance> {
  const grievance = inMemoryGrievances.find((g) => g.ticketNumber === ticketNumber);
  if (!grievance) throw new Error(`Grievance ticket not found: ${ticketNumber}`);

  const now = new Date().toISOString();
  grievance.status = status;
  grievance.resolutionNotes = resolutionNotes;
  grievance.resolvedAt = now;

  return grievance;
}

// ==========================================
// 5. Customer Account Overview
// ==========================================

export async function getCustomerAccountSummary(customerEmail: string) {
  const email = customerEmail.toLowerCase();
  const orders = await getConsumerOrders({ customerEmail: email });
  const grievances = await getConsumerGrievances({ customerEmail: email });

  const totalSpentInr = orders
    .filter((o) => o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalPayableInr, 0);

  const activeOrdersCount = orders.filter(
    (o) =>
      o.orderStatus === 'ORDER_PLACED_CONFIRMED' ||
      o.orderStatus === 'PROCESSING_PACKED' ||
      o.orderStatus === 'DISPATCHED_IN_TRANSIT'
  ).length;

  const deliveredOrdersCount = orders.filter((o) => o.orderStatus === 'DELIVERED_CONFIRMED').length;

  return {
    customerEmail: email,
    totalOrdersCount: orders.length,
    activeOrdersCount,
    deliveredOrdersCount,
    totalSpentInr,
    recentOrders: orders.slice(0, 5),
    openGrievances: grievances.filter((g) => g.status !== 'RESOLVED' && g.status !== 'REJECTED'),
  };
}

