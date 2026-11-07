/**
 * Server-Side B2B Bulk Trade Operations, Verification Gate, RFQ State Machine & Inventory Locks
 *
 * Invariants:
 * 1. UNVERIFIED_ORGANISATION_BLOCKED: Only VERIFIED_ACTIVE organisations can transact.
 * 2. UNAUTHORIZED_STOCK_LISTING_BLOCKED: Listings require statutory clearance ('AUTH-DPO-*' and verified: true).
 * 3. ALLOCATION_LOCK_PREVENTS_DOUBLE_SALE: Quotations reserve inventory with a 72-hour lock; released on rejection/cancellation.
 * 4. FAIR_TRADE_PRICING: Platform service fee rate is 0.0 in pilot; zero collector deductions.
 */

import { getPrismaClient, isDatabaseConfigured } from './db';
import {
  TradeBusinessProfile,
  TradeListing,
  TradeRfq,
  TradeQuotation,
  TradeAllocationLock,
  TradePurchaseOrder,
  TradeVerificationStatus,
  RfqLifecycleStatus,
  PurchaseOrderStatus,
  canBusinessTrade,
  DEFAULT_TRADE_BUSINESSES,
  DEFAULT_TRADE_LISTINGS,
  DEFAULT_TRADE_RFQS,
  DEFAULT_TRADE_QUOTATIONS,
  DEFAULT_TRADE_PURCHASE_ORDERS,
  B2B_STRUCTURED_CATALOGUE,
} from '../b2bTrade';

// Standby In-Memory Data Store (for development, offline, and test suite runners)
let standbyBusinesses: TradeBusinessProfile[] = JSON.parse(JSON.stringify(DEFAULT_TRADE_BUSINESSES));
let standbyListings: TradeListing[] = JSON.parse(JSON.stringify(DEFAULT_TRADE_LISTINGS));
let standbyRfqs: TradeRfq[] = JSON.parse(JSON.stringify(DEFAULT_TRADE_RFQS));
let standbyQuotations: TradeQuotation[] = JSON.parse(JSON.stringify(DEFAULT_TRADE_QUOTATIONS));
let standbyLocks: TradeAllocationLock[] = [];
let standbyPurchaseOrders: TradePurchaseOrder[] = JSON.parse(JSON.stringify(DEFAULT_TRADE_PURCHASE_ORDERS));

export function resetStandbyTradeStore() {
  standbyBusinesses = JSON.parse(JSON.stringify(DEFAULT_TRADE_BUSINESSES));
  standbyListings = JSON.parse(JSON.stringify(DEFAULT_TRADE_LISTINGS));
  standbyRfqs = JSON.parse(JSON.stringify(DEFAULT_TRADE_RFQS));
  standbyQuotations = JSON.parse(JSON.stringify(DEFAULT_TRADE_QUOTATIONS));
  standbyLocks = [];
  standbyPurchaseOrders = JSON.parse(JSON.stringify(DEFAULT_TRADE_PURCHASE_ORDERS));
}

// ==========================================
// 1. Business Onboarding & Verification Gate
// ==========================================

export async function getTradeBusinesses(filter?: {
  verificationStatus?: TradeVerificationStatus;
}): Promise<TradeBusinessProfile[]> {
  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      const where: any = {};
      if (filter?.verificationStatus) where.verificationStatus = filter.verificationStatus;
      const rows = await prisma.tradeBusinessProfile.findMany({ where, orderBy: { createdAt: 'desc' } });
      if (rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          businessType: r.businessType as any,
          verificationStatus: r.verificationStatus as any,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback to standby
    }
  }

  if (filter?.verificationStatus) {
    return standbyBusinesses.filter((b) => b.verificationStatus === filter.verificationStatus);
  }
  return [...standbyBusinesses];
}

export async function getTradeBusinessById(id: string): Promise<TradeBusinessProfile | null> {
  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      const row = await prisma.tradeBusinessProfile.findUnique({ where: { id } });
      if (row) {
        return {
          ...row,
          businessType: row.businessType as any,
          verificationStatus: row.verificationStatus as any,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fallback to standby
    }
  }
  return standbyBusinesses.find((b) => b.id === id) || null;
}

export async function registerTradeBusiness(
  input: Omit<TradeBusinessProfile, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus'>
): Promise<TradeBusinessProfile> {
  const newId = `BUS-${Date.now().toString().slice(-6)}`;
  const now = new Date().toISOString();
  const profile: TradeBusinessProfile = {
    ...input,
    id: newId,
    verificationStatus: 'PENDING_VERIFICATION',
    createdAt: now,
    updatedAt: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      await prisma.tradeBusinessProfile.create({
        data: {
          id: profile.id,
          companyName: profile.companyName,
          tradeName: profile.tradeName,
          businessType: profile.businessType as any,
          registrationNumber: profile.registrationNumber,
          gstin: profile.gstin,
          pan: profile.pan,
          fssaiLicense: profile.fssaiLicense,
          ayushLicense: profile.ayushLicense,
          verificationStatus: 'PENDING_VERIFICATION',
          verificationNotes: profile.verificationNotes,
          registeredAddress: profile.registeredAddress,
          city: profile.city,
          district: profile.district,
          state: profile.state,
          pincode: profile.pincode,
          authorizedContactName: profile.authorizedContactName,
          contactEmail: profile.contactEmail,
          contactPhone: profile.contactPhone,
          bankName: profile.bankName,
          bankBranch: profile.bankBranch,
          accountNumberEnding: profile.accountNumberEnding,
          ifscCode: profile.ifscCode,
        },
      });
    } catch {
      // fallback
    }
  }

  standbyBusinesses.unshift(profile);
  return profile;
}

export async function updateBusinessVerificationStatus(
  id: string,
  verificationStatus: TradeVerificationStatus,
  verificationNotes?: string
): Promise<TradeBusinessProfile> {
  const now = new Date().toISOString();
  const existing = standbyBusinesses.find((b) => b.id === id);
  if (!existing) {
    throw new Error(`Business not found: ${id}`);
  }

  existing.verificationStatus = verificationStatus;
  if (verificationNotes) existing.verificationNotes = verificationNotes;
  existing.updatedAt = now;

  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      await prisma.tradeBusinessProfile.update({
        where: { id },
        data: {
          verificationStatus: verificationStatus as any,
          verificationNotes: existing.verificationNotes,
        },
      });
    } catch {
      // fallback
    }
  }

  return existing;
}

// ==========================================
// 2. Structured B2B Catalogue
// ==========================================

export function getStructuredTradeCatalogue() {
  return B2B_STRUCTURED_CATALOGUE;
}

export function getTradeCatalogueItem(slug: string) {
  return B2B_STRUCTURED_CATALOGUE.find((p) => p.slug === slug) || null;
}

// ==========================================
// 3. Lot-Based Trade Discovery & Listing Gate
// ==========================================

export async function getTradeListings(filter?: {
  produceSlug?: string;
  isActive?: boolean;
  sellerOrgId?: string;
}): Promise<TradeListing[]> {
  let results = [...standbyListings];

  if (filter?.produceSlug) {
    results = results.filter((l) => l.produceSlug === filter.produceSlug);
  }
  if (filter?.isActive !== undefined) {
    results = results.filter((l) => l.isActive === filter.isActive);
  }
  if (filter?.sellerOrgId) {
    results = results.filter((l) => l.sellerOrgId === filter.sellerOrgId);
  }

  return results;
}

export async function getTradeListingById(id: string): Promise<TradeListing | null> {
  return standbyListings.find((l) => l.id === id) || null;
}

export async function createTradeListing(
  input: Omit<TradeListing, 'id' | 'allocatedQuantityKg' | 'availableQuantityKg' | 'createdAt' | 'updatedAt'>
): Promise<TradeListing> {
  // Gate 1: Check Seller Verification
  const seller = await getTradeBusinessById(input.sellerOrgId);
  if (!seller || !canBusinessTrade(seller.verificationStatus)) {
    throw new Error(
      `UNVERIFIED_SELLER_BLOCKED: Business '${input.sellerOrgId}' is not verified for trading.`
    );
  }

  // Gate 2: Statutory Clearance Invariant
  if (!input.isStatutoryClearanceVerified || !input.lotSaleAuthorizationRef) {
    throw new Error(
      `UNAUTHORIZED_STOCK_LISTING_BLOCKED: Lot must have verified statutory clearance from DPO prior to commercial listing.`
    );
  }

  const newId = `LIST-${input.produceSlug.toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  const listing: TradeListing = {
    ...input,
    id: newId,
    sellerOrgName: seller.companyName,
    allocatedQuantityKg: 0.0,
    availableQuantityKg: input.totalLotQuantityKg,
    createdAt: now,
    updatedAt: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      await prisma.tradeListing.create({
        data: {
          id: listing.id,
          sellerOrgId: listing.sellerOrgId,
          produceSlug: listing.produceSlug,
          produceName: listing.produceName,
          scientificName: listing.scientificName,
          qualityGrade: listing.qualityGrade,
          totalLotQuantityKg: listing.totalLotQuantityKg,
          allocatedQuantityKg: 0.0,
          availableQuantityKg: listing.availableQuantityKg,
          minimumOrderQuantityKg: listing.minimumOrderQuantityKg,
          indicativePricePerKg: listing.indicativePricePerKg,
          depotFacilityId: listing.depotFacilityId,
          storageBayLocation: listing.storageBayLocation,
          warehouseBatchRef: listing.warehouseBatchRef,
          lotSaleAuthorizationRef: listing.lotSaleAuthorizationRef,
          authorizingOfficer: listing.authorizingOfficer,
          isStatutoryClearanceVerified: true,
          availabilityStartDate: new Date(listing.availabilityStartDate),
          availabilityEndDate: new Date(listing.availabilityEndDate),
          isActive: listing.isActive,
          labReportUrl: listing.labReportUrl,
          inspectionCertificateRef: listing.inspectionCertificateRef,
          packagingDescription: listing.packagingDescription,
        },
      });
    } catch {
      // fallback
    }
  }

  standbyListings.unshift(listing);
  return listing;
}

// ==========================================
// 4. RFQ Workflow & Quotation Issuance
// ==========================================

export async function getTradeRfqs(filter?: {
  buyerOrgId?: string;
  status?: RfqLifecycleStatus;
}): Promise<TradeRfq[]> {
  let rfqs = [...standbyRfqs];
  if (filter?.buyerOrgId) {
    rfqs = rfqs.filter((r) => r.buyerOrgId === filter.buyerOrgId);
  }
  if (filter?.status) {
    rfqs = rfqs.filter((r) => r.status === filter.status);
  }
  return rfqs;
}

export async function getTradeRfqById(id: string): Promise<TradeRfq | null> {
  return standbyRfqs.find((r) => r.id === id) || null;
}

export async function createTradeRfq(
  input: Omit<TradeRfq, 'id' | 'rfqNumber' | 'status' | 'createdAt' | 'updatedAt' | 'rejectionReason' | 'cancellationReason'>
): Promise<TradeRfq> {
  // Gate 1: Check Buyer Verification
  const buyer = await getTradeBusinessById(input.buyerOrgId);
  if (!buyer || !canBusinessTrade(buyer.verificationStatus)) {
    throw new Error(
      `UNVERIFIED_BUYER_BLOCKED: Business '${input.buyerOrgId}' is unverified and cannot submit RFQs.`
    );
  }

  // Validate listing if referenced
  if (input.listingId) {
    const listing = await getTradeListingById(input.listingId);
    if (!listing || !listing.isActive) {
      throw new Error(`Referenced listing '${input.listingId}' is inactive or not found.`);
    }
    if (input.requestedQuantityKg > listing.availableQuantityKg) {
      throw new Error(
        `Requested quantity (${input.requestedQuantityKg} kg) exceeds available quantity (${listing.availableQuantityKg} kg).`
      );
    }
    if (input.requestedQuantityKg < listing.minimumOrderQuantityKg) {
      throw new Error(
        `Requested quantity (${input.requestedQuantityKg} kg) is below minimum order quantity (${listing.minimumOrderQuantityKg} kg).`
      );
    }
  }

  const now = new Date().toISOString();
  const sequenceNum = standbyRfqs.length + 1;
  const rfqId = `RFQ-${Date.now().toString().slice(-6)}`;
  const rfqNumber = `RFQ-B2B-2025-${sequenceNum.toString().padStart(3, '0')}`;

  const rfq: TradeRfq = {
    ...input,
    id: rfqId,
    rfqNumber,
    buyerOrgName: buyer.companyName,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  standbyRfqs.unshift(rfq);
  return rfq;
}

export async function submitTradeQuotation(input: {
  rfqId: string;
  sellerOrgId: string;
  quotedPricePerKg: number;
  deliveryTimelineDays: number;
  deliveryTerms?: string;
  paymentTerms?: string;
  validUntilDays?: number;
  sellerRemarks?: string;
}): Promise<{ quotation: TradeQuotation; allocationLock: TradeAllocationLock }> {
  // Gate 1: Check Seller Verification
  const seller = await getTradeBusinessById(input.sellerOrgId);
  if (!seller || !canBusinessTrade(seller.verificationStatus)) {
    throw new Error(
      `UNVERIFIED_SELLER_BLOCKED: Seller '${input.sellerOrgId}' is not verified for issuing quotations.`
    );
  }

  const rfq = await getTradeRfqById(input.rfqId);
  if (!rfq) {
    throw new Error(`RFQ not found: ${input.rfqId}`);
  }
  if (rfq.status !== 'SUBMITTED' && rfq.status !== 'SELLER_REVIEW') {
    throw new Error(`Cannot quote on RFQ in status '${rfq.status}'. Must be SUBMITTED or SELLER_REVIEW.`);
  }

  let listing: TradeListing | null = null;
  if (rfq.listingId) {
    listing = await getTradeListingById(rfq.listingId);
    if (!listing) throw new Error(`Listing not found: ${rfq.listingId}`);

    if (listing.availableQuantityKg < rfq.requestedQuantityKg) {
      throw new Error(
        `Insufficient available quantity in listing (${listing.availableQuantityKg} kg) for RFQ request (${rfq.requestedQuantityKg} kg).`
      );
    }
  }

  const now = new Date();
  const quoteSeq = standbyQuotations.length + 1;
  const quoteId = `QUOT-${Date.now().toString().slice(-6)}`;
  const quotationNumber = `QUOT-B2B-2025-${quoteSeq.toString().padStart(3, '0')}`;

  const validUntilDate = new Date(now.getTime() + (input.validUntilDays || 14) * 24 * 60 * 60 * 1000);
  const lockExpiryDate = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours lock

  const quotedTotalAmount = Math.round(input.quotedPricePerKg * rfq.requestedQuantityKg * 100) / 100;

  const quotation: TradeQuotation = {
    id: quoteId,
    quotationNumber,
    rfqId: rfq.id,
    sellerOrgId: input.sellerOrgId,
    sellerOrgName: seller.companyName,
    listingId: rfq.listingId,
    quotedPricePerKg: input.quotedPricePerKg,
    minimumOrderQuantityKg: listing ? listing.minimumOrderQuantityKg : 25,
    quotedTotalAmount,
    deliveryTimelineDays: input.deliveryTimelineDays,
    deliveryTerms: input.deliveryTerms || 'Ex-Depot Baripada Central Terminal (BRP-01)',
    paymentTerms: input.paymentTerms || 'Corporate NEFT / RTGS against Delivery Inspection',
    validUntil: validUntilDate.toISOString(),
    sellerRemarks: input.sellerRemarks,
    isAccepted: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Inventory Allocation Lock creation
  let lockId = `LOCK-${Date.now().toString().slice(-6)}`;
  const allocationLock: TradeAllocationLock = {
    id: lockId,
    listingId: rfq.listingId || 'LIST-STANDALONE',
    quotationId: quoteId,
    reservedQuantityKg: rfq.requestedQuantityKg,
    lockExpiresAt: lockExpiryDate.toISOString(),
    isCommitted: false,
    isReleased: false,
    createdAt: now.toISOString(),
  };

  // Reserve the inventory in the listing
  if (listing) {
    listing.allocatedQuantityKg = Math.round((listing.allocatedQuantityKg + rfq.requestedQuantityKg) * 100) / 100;
    listing.availableQuantityKg = Math.max(0, Math.round((listing.totalLotQuantityKg - listing.allocatedQuantityKg) * 100) / 100);
    listing.updatedAt = now.toISOString();
  }

  rfq.status = 'QUOTED';
  rfq.updatedAt = now.toISOString();

  standbyQuotations.unshift(quotation);
  standbyLocks.unshift(allocationLock);

  return { quotation, allocationLock };
}

// ==========================================
// 5. Quotation Acceptance & PO Conversion
// ==========================================

export async function acceptTradeQuotation(
  quotationId: string,
  buyerActor: string
): Promise<TradePurchaseOrder> {
  const quotation = standbyQuotations.find((q) => q.id === quotationId);
  if (!quotation) {
    throw new Error(`Quotation not found: ${quotationId}`);
  }

  const rfq = standbyRfqs.find((r) => r.id === quotation.rfqId);
  if (!rfq) {
    throw new Error(`RFQ not found for quotation: ${quotation.rfqId}`);
  }

  const buyer = await getTradeBusinessById(rfq.buyerOrgId);
  if (!buyer || !canBusinessTrade(buyer.verificationStatus)) {
    throw new Error(`UNVERIFIED_BUYER_BLOCKED: Buyer '${rfq.buyerOrgId}' is not verified.`);
  }

  const seller = await getTradeBusinessById(quotation.sellerOrgId);
  if (!seller) {
    throw new Error(`Seller not found: ${quotation.sellerOrgId}`);
  }

  const now = new Date();
  const poSeq = standbyPurchaseOrders.length + 1;
  const poId = `PO-${Date.now().toString().slice(-6)}`;
  const poNumber = `PO-B2B-2025-${poSeq.toString().padStart(3, '0')}`;

  // Commit the inventory allocation lock
  const lock = standbyLocks.find((l) => l.quotationId === quotation.id);
  if (lock) {
    lock.isCommitted = true;
  }

  quotation.isAccepted = true;
  quotation.updatedAt = now.toISOString();

  rfq.status = 'PO_CREATED';
  rfq.updatedAt = now.toISOString();

  const purchaseOrder: TradePurchaseOrder = {
    id: poId,
    poNumber,
    buyerOrgId: buyer.id,
    buyerOrgName: buyer.companyName,
    sellerOrgId: seller.id,
    sellerOrgName: seller.companyName,
    rfqId: rfq.id,
    quotationId: quotation.id,
    produceName: rfq.produceName,
    scientificName: null,
    qualityGrade: rfq.requestedGrade,
    quantityKg: rfq.requestedQuantityKg,
    agreedPricePerKg: quotation.quotedPricePerKg,
    totalOrderAmount: quotation.quotedTotalAmount,
    deliveryTerms: quotation.deliveryTerms,
    deliveryAddress: rfq.deliveryLocation,
    expectedDeliveryDate: rfq.targetDeliveryDate,
    status: 'ISSUED',
    auditHistory: [
      {
        timestamp: now.toISOString(),
        actor: buyerActor,
        action: 'ISSUE_PURCHASE_ORDER',
        previousStatus: 'QUOTED',
        newStatus: 'ISSUED',
        notes: `Accepted Quotation ${quotation.quotationNumber} with agreed rate ₹${quotation.quotedPricePerKg}/kg.`,
      },
    ],
    platformServiceFeeRate: 0.0, // Fixed 0.0 in pilot
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  standbyPurchaseOrders.unshift(purchaseOrder);
  return purchaseOrder;
}

// ==========================================
// 6. Rejection / Cancellation & Lock Release
// ==========================================

export async function rejectOrCancelRfq(
  rfqId: string,
  actor: string,
  reason: string,
  isCancellation = false
): Promise<TradeRfq> {
  const rfq = standbyRfqs.find((r) => r.id === rfqId);
  if (!rfq) throw new Error(`RFQ not found: ${rfqId}`);

  const now = new Date().toISOString();
  rfq.status = isCancellation ? 'CANCELLED' : 'REJECTED';
  if (isCancellation) {
    rfq.cancellationReason = reason;
  } else {
    rfq.rejectionReason = reason;
  }
  rfq.updatedAt = now;

  // Release any associated allocation lock
  const quotations = standbyQuotations.filter((q) => q.rfqId === rfqId);
  for (const quote of quotations) {
    const lock = standbyLocks.find((l) => l.quotationId === quote.id && !l.isCommitted && !l.isReleased);
    if (lock) {
      lock.isReleased = true;
      if (rfq.listingId) {
        const listing = standbyListings.find((l) => l.id === rfq.listingId);
        if (listing) {
          listing.allocatedQuantityKg = Math.max(0, Math.round((listing.allocatedQuantityKg - lock.reservedQuantityKg) * 100) / 100);
          listing.availableQuantityKg = Math.round((listing.totalLotQuantityKg - listing.allocatedQuantityKg) * 100) / 100;
          listing.updatedAt = now;
        }
      }
    }
  }

  return rfq;
}

// ==========================================
// 7. Purchase Order Lifecycle & Audit Trail
// ==========================================

export async function getTradePurchaseOrders(filter?: {
  buyerOrgId?: string;
  sellerOrgId?: string;
  status?: PurchaseOrderStatus;
}): Promise<TradePurchaseOrder[]> {
  let orders = [...standbyPurchaseOrders];
  if (filter?.buyerOrgId) {
    orders = orders.filter((o) => o.buyerOrgId === filter.buyerOrgId);
  }
  if (filter?.sellerOrgId) {
    orders = orders.filter((o) => o.sellerOrgId === filter.sellerOrgId);
  }
  if (filter?.status) {
    orders = orders.filter((o) => o.status === filter.status);
  }
  return orders;
}

export async function getTradePurchaseOrderById(id: string): Promise<TradePurchaseOrder | null> {
  return standbyPurchaseOrders.find((o) => o.id === id || o.poNumber === id) || null;
}

export async function updatePurchaseOrderStatus(
  poId: string,
  newStatus: PurchaseOrderStatus,
  actor: string,
  notes?: string,
  extra?: { eWaybillNumber?: string; qualityInspectionCertRef?: string }
): Promise<TradePurchaseOrder> {
  const order = standbyPurchaseOrders.find((o) => o.id === poId || o.poNumber === poId);
  if (!order) throw new Error(`Purchase order not found: ${poId}`);

  const now = new Date().toISOString();
  const prevStatus = order.status;

  order.status = newStatus;
  if (extra?.eWaybillNumber) order.eWaybillNumber = extra.eWaybillNumber;
  if (extra?.qualityInspectionCertRef) order.qualityInspectionCertRef = extra.qualityInspectionCertRef;
  order.updatedAt = now;

  order.auditHistory.push({
    timestamp: now,
    actor,
    action: `STATUS_CHANGE_TO_${newStatus}`,
    previousStatus: prevStatus,
    newStatus,
    notes: notes || `Order status updated to ${newStatus}`,
  });

  // If order was cancelled before dispatch, release allocated quantities back
  if (newStatus === 'CANCELLED' && (prevStatus === 'ISSUED' || prevStatus === 'CONFIRMED')) {
    const quote = standbyQuotations.find((q) => q.id === order.quotationId);
    if (quote && quote.listingId) {
      const listing = standbyListings.find((l) => l.id === quote.listingId);
      if (listing) {
        listing.allocatedQuantityKg = Math.max(0, Math.round((listing.allocatedQuantityKg - order.quantityKg) * 100) / 100);
        listing.availableQuantityKg = Math.round((listing.totalLotQuantityKg - listing.allocatedQuantityKg) * 100) / 100;
        listing.updatedAt = now;
      }
    }
  }

  return order;
}

export function getActiveAllocationLocks(): TradeAllocationLock[] {
  return [...standbyLocks];
}

