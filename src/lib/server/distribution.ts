/**
 * Server-Side Operations for Samagna B2B2C Partner Distribution Network
 * Implements Partner Profiles, Brand Management, Retail SKUs, Channel Governance,
 * Referral Processing, and Sales Reconciliation.
 */

import {
  DistributionPartnerProfile,
  DistributionBrand,
  RetailProductSku,
  DistributionChannel,
  OrderReferralRecord,
  PartnerSalesReconciliation,
  DistributionProductTier,
  DistributionChannelType,
  PartnerVerificationStatus,
  OrderReferralStatus,
  SalesReconciliationStatus,
  PartnerSubscriptionTier,
  SEED_DISTRIBUTION_PARTNERS,
  SEED_DISTRIBUTION_BRANDS,
  SEED_RETAIL_SKUS,
  SEED_DISTRIBUTION_CHANNELS,
  SEED_ORDER_REFERRALS,
  SEED_SALES_RECONCILIATIONS,
  calculateReconciliationVariance,
} from '@/lib/distribution';

// In-Memory Storage Singletons with Seed Data Fallback
let inMemoryPartners: DistributionPartnerProfile[] = [...SEED_DISTRIBUTION_PARTNERS];
let inMemoryBrands: DistributionBrand[] = [...SEED_DISTRIBUTION_BRANDS];
let inMemorySkus: RetailProductSku[] = [...SEED_RETAIL_SKUS];
let inMemoryChannels: DistributionChannel[] = [...SEED_DISTRIBUTION_CHANNELS];
let inMemoryReferrals: OrderReferralRecord[] = [...SEED_ORDER_REFERRALS];
let inMemoryReconciliations: PartnerSalesReconciliation[] = [...SEED_SALES_RECONCILIATIONS];

// ==========================================
// 1. Partner Organisation Operations
// ==========================================

export async function getDistributionPartners(filters?: {
  partnerType?: string;
  isVerified?: boolean;
  isActive?: boolean;
}): Promise<DistributionPartnerProfile[]> {
  let list = [...inMemoryPartners];
  if (filters?.partnerType) {
    list = list.filter((p) => p.partnerType === filters.partnerType);
  }
  if (filters?.isVerified !== undefined) {
    list = list.filter((p) => p.isVerified === filters.isVerified);
  }
  if (filters?.isActive !== undefined) {
    list = list.filter((p) => p.isActive === filters.isActive);
  }
  return list;
}

export async function getDistributionPartnerById(id: string): Promise<DistributionPartnerProfile | null> {
  const partner = inMemoryPartners.find((p) => p.id === id || p.code === id);
  return partner || null;
}

export async function registerDistributionPartner(data: {
  code: string;
  organisationName: string;
  partnerType: DistributionPartnerProfile['partnerType'];
  registrationNumber: string;
  gstin?: string | null;
  pan: string;
  fssaiLicenseNumber?: string | null;
  primaryContactPerson: string;
  contactPhone: string;
  contactEmail: string;
  headquartersAddress: string;
  operatingDistricts: string[];
  subscriptionTier?: PartnerSubscriptionTier;
}): Promise<DistributionPartnerProfile> {
  if (!data.code || !data.organisationName || !data.registrationNumber || !data.pan) {
    throw new Error('Mandatory compliance details missing: code, organisationName, registrationNumber, and pan are required.');
  }

  const existing = inMemoryPartners.find((p) => p.code === data.code);
  if (existing) {
    throw new Error(`Partner code '${data.code}' is already registered.`);
  }

  const now = new Date().toISOString();
  const newPartner: DistributionPartnerProfile = {
    id: `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    code: data.code,
    organisationName: data.organisationName,
    partnerType: data.partnerType,
    registrationNumber: data.registrationNumber,
    gstin: data.gstin || null,
    pan: data.pan,
    fssaiLicenseNumber: data.fssaiLicenseNumber || null,
    primaryContactPerson: data.primaryContactPerson,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    headquartersAddress: data.headquartersAddress,
    operatingDistricts: data.operatingDistricts,
    verificationStatus: 'PENDING_VERIFICATION',
    isVerified: false,
    isActive: false,
    subscriptionTier: data.subscriptionTier || 'COMMUNITY_PILOT',
    subscriptionFeeInr: 0.0,
    enablementFeeRate: 0.0, // 0.0% in pilot
    createdAt: now,
    updatedAt: now,
  };

  inMemoryPartners.push(newPartner);
  return newPartner;
}

export async function updatePartnerVerificationStatus(
  partnerId: string,
  isVerified: boolean,
  isActive: boolean,
  status: PartnerVerificationStatus
): Promise<DistributionPartnerProfile> {
  const partner = await getDistributionPartnerById(partnerId);
  if (!partner) throw new Error(`Partner not found: ${partnerId}`);

  partner.isVerified = isVerified;
  partner.isActive = isActive;
  partner.verificationStatus = status;
  partner.updatedAt = new Date().toISOString();

  return partner;
}

// ==========================================
// 2. Brand Operations
// ==========================================

export async function getDistributionBrands(partnerId?: string): Promise<DistributionBrand[]> {
  if (partnerId) {
    return inMemoryBrands.filter((b) => b.partnerId === partnerId);
  }
  return [...inMemoryBrands];
}

export async function getDistributionBrandById(id: string): Promise<DistributionBrand | null> {
  const brand = inMemoryBrands.find((b) => b.id === id || b.brandCode === id);
  return brand || null;
}

export async function createDistributionBrand(data: {
  brandCode: string;
  partnerId: string;
  brandName: string;
  originDistrict: string;
  brandStory: string;
  ethosStatement: string;
  logoUrl?: string;
  primaryColorHex?: string;
  contactEmail: string;
  websiteUrl?: string;
}): Promise<DistributionBrand> {
  const partner = await getDistributionPartnerById(data.partnerId);
  if (!partner) throw new Error(`Parent partner organisation not found: ${data.partnerId}`);
  if (!partner.isVerified) {
    throw new Error(`Cannot create brand under unverified partner: ${partner.organisationName}. Partner verification required.`);
  }

  const existing = inMemoryBrands.find((b) => b.brandCode === data.brandCode);
  if (existing) {
    throw new Error(`Brand code '${data.brandCode}' already exists.`);
  }

  const now = new Date().toISOString();
  const newBrand: DistributionBrand = {
    id: `BRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    brandCode: data.brandCode,
    partnerId: data.partnerId,
    brandName: data.brandName,
    originDistrict: data.originDistrict,
    brandStory: data.brandStory,
    ethosStatement: data.ethosStatement,
    logoUrl: data.logoUrl || null,
    primaryColorHex: data.primaryColorHex || '#233827',
    contactEmail: data.contactEmail,
    websiteUrl: data.websiteUrl || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryBrands.push(newBrand);
  return newBrand;
}

// ==========================================
// 3. Retail Product SKU & Evidence Operations
// ==========================================

export async function getRetailProductSkus(filters?: {
  partnerId?: string;
  brandId?: string;
  tier?: DistributionProductTier;
  isPublished?: boolean;
}): Promise<RetailProductSku[]> {
  let list = [...inMemorySkus];
  if (filters?.partnerId) {
    list = list.filter((s) => s.partnerId === filters.partnerId);
  }
  if (filters?.brandId) {
    list = list.filter((s) => s.brandId === filters.brandId);
  }
  if (filters?.tier) {
    list = list.filter((s) => s.productTier === filters.tier);
  }
  if (filters?.isPublished !== undefined) {
    list = list.filter((s) => s.isPublished === filters.isPublished);
  }
  return list;
}

export async function getRetailProductSkuById(id: string): Promise<RetailProductSku | null> {
  const sku = inMemorySkus.find((s) => s.id === id || s.skuCode === id);
  return sku || null;
}

export async function createRetailProductSku(data: Omit<RetailProductSku, 'id' | 'createdAt' | 'updatedAt'>): Promise<RetailProductSku> {
  const partner = await getDistributionPartnerById(data.partnerId);
  if (!partner) throw new Error(`Partner not found: ${data.partnerId}`);
  if (!partner.isVerified) {
    throw new Error(`Cannot register retail SKU under unverified partner: ${partner.organisationName}. Verification required.`);
  }

  const brand = await getDistributionBrandById(data.brandId);
  if (!brand) throw new Error(`Brand not found: ${data.brandId}`);

  if (!data.sourceLotReference) {
    throw new Error('Mandatory custody linkage error: sourceLotReference is required to link retail product to physical harvest lot.');
  }

  if (data.retailPriceMrpInr < data.wholesalePriceUnitInr) {
    throw new Error(`Pricing violation: MRP (₹${data.retailPriceMrpInr}) cannot be less than wholesale price (₹${data.wholesalePriceUnitInr}).`);
  }

  // Strict Evidence Audit Rule:
  // If claims of organic/purity/GI are submitted without genuine evidence, block or flag uncertified.
  let isEvidenceVerified = false;
  let verificationNotes = data.verificationNotes || null;

  if (data.certifications && data.certifications.length > 0) {
    const validCerts = data.certifications.filter((c) => c.credentialNumber && c.issuingAuthority && c.isVerified);
    if (validCerts.length > 0) {
      isEvidenceVerified = true;
    } else {
      isEvidenceVerified = false;
      verificationNotes = 'Certifications submitted are unverified or pending documentary audit.';
    }
  } else {
    isEvidenceVerified = false;
    verificationNotes = 'Standard / Uncertified Forest Produce (No premium credentials claimed)';
  }

  const now = new Date().toISOString();
  const newSku: RetailProductSku = {
    ...data,
    id: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    isEvidenceVerified,
    verificationNotes,
    inventoryAvailableUnits: data.inventoryOnHandUnits - data.inventoryAllocatedUnits,
    createdAt: now,
    updatedAt: now,
  };

  inMemorySkus.push(newSku);
  return newSku;
}

export async function updateRetailSkuInventory(
  skuId: string,
  onHandDelta: number,
  allocatedDelta: number
): Promise<RetailProductSku> {
  const sku = await getRetailProductSkuById(skuId);
  if (!sku) throw new Error(`SKU not found: ${skuId}`);

  sku.inventoryOnHandUnits += onHandDelta;
  sku.inventoryAllocatedUnits += allocatedDelta;
  sku.inventoryAvailableUnits = sku.inventoryOnHandUnits - sku.inventoryAllocatedUnits;

  if (sku.inventoryOnHandUnits < 0 || sku.inventoryAllocatedUnits < 0 || sku.inventoryAvailableUnits < 0) {
    throw new Error(`Inventory underflow for SKU '${sku.skuCode}': onHand=${sku.inventoryOnHandUnits}, allocated=${sku.inventoryAllocatedUnits}, available=${sku.inventoryAvailableUnits}`);
  }

  sku.updatedAt = new Date().toISOString();
  return sku;
}

// ==========================================
// 4. Channel Operations
// ==========================================

export async function getDistributionChannels(partnerId?: string): Promise<DistributionChannel[]> {
  if (partnerId) {
    return inMemoryChannels.filter((c) => c.partnerId === partnerId);
  }
  return [...inMemoryChannels];
}

export async function getDistributionChannelById(id: string): Promise<DistributionChannel | null> {
  const channel = inMemoryChannels.find((c) => c.id === id || c.channelCode === id);
  return channel || null;
}

export async function createDistributionChannel(data: {
  channelCode: string;
  channelName: string;
  channelType: DistributionChannelType;
  partnerId: string;
  channelPartnerName: string;
  contractAgreementRef: string;
  retailerMarginPercent: number;
  platformEnablementFeeRate?: number;
  settlementTerms: string;
  targetAudience: string;
  catalogueFeedUrl?: string;
}): Promise<DistributionChannel> {
  const partner = await getDistributionPartnerById(data.partnerId);
  if (!partner) throw new Error(`Partner not found: ${data.partnerId}`);

  if (data.retailerMarginPercent <= 0 || data.retailerMarginPercent > 50) {
    throw new Error(`Retailer margin percent must be between 0.1% and 50.0%. Provided: ${data.retailerMarginPercent}%`);
  }

  const existing = inMemoryChannels.find((c) => c.channelCode === data.channelCode);
  if (existing) {
    throw new Error(`Channel code '${data.channelCode}' is already registered.`);
  }

  const now = new Date().toISOString();
  const newChannel: DistributionChannel = {
    id: `CHN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    channelCode: data.channelCode,
    channelName: data.channelName,
    channelType: data.channelType,
    partnerId: data.partnerId,
    channelPartnerName: data.channelPartnerName,
    contractAgreementRef: data.contractAgreementRef,
    retailerMarginPercent: data.retailerMarginPercent,
    platformEnablementFeeRate: 0.0, // Strict 0.0% pilot invariant
    settlementTerms: data.settlementTerms,
    targetAudience: data.targetAudience,
    catalogueFeedUrl: data.catalogueFeedUrl || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryChannels.push(newChannel);
  return newChannel;
}

// ==========================================
// 5. Order Referral Operations
// ==========================================

export async function getOrderReferrals(filters?: {
  channelId?: string;
  partnerId?: string;
  status?: OrderReferralStatus;
}): Promise<OrderReferralRecord[]> {
  let list = [...inMemoryReferrals];
  if (filters?.channelId) {
    list = list.filter((r) => r.channelId === filters.channelId);
  }
  if (filters?.partnerId) {
    list = list.filter((r) => r.partnerId === filters.partnerId);
  }
  if (filters?.status) {
    list = list.filter((r) => r.status === filters.status);
  }
  return list;
}

export async function getOrderReferralById(id: string): Promise<OrderReferralRecord | null> {
  const referral = inMemoryReferrals.find((r) => r.id === id || r.referralCode === id);
  return referral || null;
}

export async function recordOrderReferral(data: {
  channelId: string;
  externalOrderNumber: string;
  customerIdentifier: string;
  lineItems: Array<{ skuCode: string; quantityUnits: number }>;
  fulfilmentNotes?: string;
}): Promise<OrderReferralRecord> {
  const channel = await getDistributionChannelById(data.channelId);
  if (!channel) throw new Error(`Distribution channel not found: ${data.channelId}`);
  if (!channel.isActive) throw new Error(`Distribution channel '${channel.channelName}' is currently inactive.`);

  const partner = await getDistributionPartnerById(channel.partnerId);
  if (!partner) throw new Error(`Parent partner organisation not found: ${channel.partnerId}`);

  if (!data.lineItems || data.lineItems.length === 0) {
    throw new Error('Order referral requires at least one SKU line item.');
  }

  // Validate items and compute totals
  let grossOrderValueInr = 0;
  let wholesaleOrderValueInr = 0;
  let totalUnits = 0;

  const processedLineItems = [];

  for (const item of data.lineItems) {
    const sku = await getRetailProductSkuById(item.skuCode);
    if (!sku) throw new Error(`Product SKU not found: ${item.skuCode}`);
    if (sku.inventoryAvailableUnits < item.quantityUnits) {
      throw new Error(
        `Insufficient available stock for SKU '${sku.skuCode}'. Available: ${sku.inventoryAvailableUnits}, Requested: ${item.quantityUnits}`
      );
    }

    const itemWholesale = sku.wholesalePriceUnitInr * item.quantityUnits;
    const itemRetail = sku.retailPriceMrpInr * item.quantityUnits;

    grossOrderValueInr += itemRetail;
    wholesaleOrderValueInr += itemWholesale;
    totalUnits += item.quantityUnits;

    // Lock allocation in inventory
    await updateRetailSkuInventory(sku.id, 0, item.quantityUnits);

    processedLineItems.push({
      skuCode: sku.skuCode,
      productTitle: sku.productTitle,
      quantityUnits: item.quantityUnits,
      unitWholesaleInr: sku.wholesalePriceUnitInr,
      retailPriceMrpInr: sku.retailPriceMrpInr,
      totalWholesaleInr: itemWholesale,
    });
  }

  const channelMarginAmountInr = (grossOrderValueInr * channel.retailerMarginPercent) / 100.0;
  const platformEnablementFeeInr = 0.0; // Inactive in pilot
  const netPartnerPayableInr = wholesaleOrderValueInr - platformEnablementFeeInr;

  const now = new Date().toISOString();
  const newReferral: OrderReferralRecord = {
    id: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    referralCode: `REF-ORD-2025-${(inMemoryReferrals.length + 1).toString().padStart(3, '0')}`,
    channelId: channel.id,
    partnerId: partner.id,
    externalOrderNumber: data.externalOrderNumber,
    customerIdentifier: data.customerIdentifier,
    orderDate: now,
    lineItems: processedLineItems,
    totalUnits,
    grossOrderValueInr,
    wholesaleOrderValueInr,
    channelMarginAmountInr,
    platformEnablementFeeInr,
    netPartnerPayableInr,
    status: 'RECORDED',
    fulfilmentNotes: data.fulfilmentNotes || null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryReferrals.push(newReferral);
  return newReferral;
}

export async function updateOrderReferralStatus(
  referralId: string,
  newStatus: OrderReferralStatus,
  notes?: string
): Promise<OrderReferralRecord> {
  const referral = await getOrderReferralById(referralId);
  if (!referral) throw new Error(`Order referral not found: ${referralId}`);

  const prevStatus = referral.status;

  if (newStatus === 'CONFIRMED_FULFILLED' && prevStatus === 'RECORDED') {
    // Physical stock dispatched: decrement on-hand and decrement allocated
    for (const item of referral.lineItems) {
      const sku = await getRetailProductSkuById(item.skuCode);
      if (sku) {
        await updateRetailSkuInventory(sku.id, -item.quantityUnits, -item.quantityUnits);
      }
    }
  } else if (newStatus === 'RETURNED_CANCELLED' && prevStatus === 'RECORDED') {
    // Release allocated hold
    for (const item of referral.lineItems) {
      const sku = await getRetailProductSkuById(item.skuCode);
      if (sku) {
        await updateRetailSkuInventory(sku.id, 0, -item.quantityUnits);
      }
    }
  }

  referral.status = newStatus;
  if (notes) referral.fulfilmentNotes = notes;
  referral.updatedAt = new Date().toISOString();

  return referral;
}

// ==========================================
// 6. Sales Reconciliation Operations
// ==========================================

export async function getPartnerSalesReconciliations(partnerId?: string): Promise<PartnerSalesReconciliation[]> {
  if (partnerId) {
    return inMemoryReconciliations.filter((r) => r.partnerId === partnerId);
  }
  return [...inMemoryReconciliations];
}

export async function createSalesReconciliation(data: {
  channelId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  physicalInventoryDrawdownUnits: number;
  settlementReference?: string;
  reconciledBy: string;
}): Promise<PartnerSalesReconciliation> {
  const channel = await getDistributionChannelById(data.channelId);
  if (!channel) throw new Error(`Channel not found: ${data.channelId}`);

  const partner = await getDistributionPartnerById(channel.partnerId);
  if (!partner) throw new Error(`Partner not found: ${channel.partnerId}`);

  // Fetch referrals for this channel within period
  const referrals = inMemoryReferrals.filter((r) => {
    if (r.channelId !== channel.id) return false;
    if (r.status === 'RETURNED_CANCELLED') return false;
    const rDate = new Date(r.orderDate).getTime();
    const start = new Date(data.billingPeriodStart).getTime();
    const end = new Date(data.billingPeriodEnd).getTime();
    return rDate >= start && rDate <= end;
  });

  const totalReferralsCount = referrals.length;
  let totalUnitsSold = 0;
  let grossMerchandiseValueInr = 0;
  let channelMarginDeductionsInr = 0;
  let netRemittancePayableInr = 0;

  for (const r of referrals) {
    totalUnitsSold += r.totalUnits;
    grossMerchandiseValueInr += r.grossOrderValueInr;
    channelMarginDeductionsInr += r.channelMarginAmountInr;
    netRemittancePayableInr += r.netPartnerPayableInr;
  }

  // Cross-check with physical inventory drawdown
  const varianceCheck = calculateReconciliationVariance(totalUnitsSold, data.physicalInventoryDrawdownUnits);

  const now = new Date().toISOString();
  const newReconciliation: PartnerSalesReconciliation = {
    id: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reconciliationNumber: `REC-B2B2C-2025-${(inMemoryReconciliations.length + 1).toString().padStart(3, '0')}`,
    channelId: channel.id,
    partnerId: partner.id,
    billingPeriodStart: data.billingPeriodStart,
    billingPeriodEnd: data.billingPeriodEnd,
    totalReferralsCount,
    totalUnitsSold,
    grossMerchandiseValueInr,
    channelMarginDeductionsInr,
    platformEnablementFeesInr: 0.0, // 0.0% in pilot
    netRemittancePayableInr,
    physicalInventoryDrawdownUnits: data.physicalInventoryDrawdownUnits,
    inventoryVarianceUnits: varianceCheck.varianceUnits,
    status: varianceCheck.status,
    settlementReference: data.settlementReference || null,
    discrepancyNotes: varianceCheck.isDiscrepancy ? varianceCheck.message : null,
    reconciledAt: now,
    reconciledBy: data.reconciledBy,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryReconciliations.push(newReconciliation);
  return newReconciliation;
}

// ==========================================
// 7. Performance & Enablement Reporting
// ==========================================

export async function getDistributionPerformanceSummary(partnerId?: string) {
  const partners = await getDistributionPartners();
  const skus = await getRetailProductSkus(partnerId ? { partnerId } : undefined);
  const channels = await getDistributionChannels(partnerId);
  const referrals = await getOrderReferrals(partnerId ? { partnerId } : undefined);
  const reconciliations = await getPartnerSalesReconciliations(partnerId);

  const totalRetailGmv = referrals.reduce((sum, r) => sum + r.grossOrderValueInr, 0);
  const totalNetPartnerRevenue = referrals.reduce((sum, r) => sum + r.netPartnerPayableInr, 0);
  const totalUnitsDistributed = referrals.reduce((sum, r) => sum + r.totalUnits, 0);
  const totalPlatformFees = referrals.reduce((sum, r) => sum + r.platformEnablementFeeInr, 0); // 0.0

  const activeChannelsCount = channels.filter((c) => c.isActive).length;
  const publishedSkusCount = skus.filter((s) => s.isPublished).length;

  return {
    totalPartners: partners.length,
    activeChannelsCount,
    publishedSkusCount,
    totalUnitsDistributed,
    totalRetailGmv,
    totalNetPartnerRevenue,
    totalPlatformFees,
    fairTradeMspProtectionGuarantee: '100% of statutory MSP paid to primary gatherers without partner commission deduction',
    reconciledSettlementRate: reconciliations.length > 0 ? (reconciliations.filter((r) => r.status === 'RECONCILED_SETTLED').length / reconciliations.length) * 100 : 100,
  };
}

// ==========================================
// 8. Subscription Model Configuration
// ==========================================

export async function updatePartnerSubscriptionTier(
  partnerId: string,
  tier: PartnerSubscriptionTier,
  subscriptionFeeInr: number = 0.0
): Promise<DistributionPartnerProfile> {
  const partner = await getDistributionPartnerById(partnerId);
  if (!partner) throw new Error(`Partner not found: ${partnerId}`);

  partner.subscriptionTier = tier;
  partner.subscriptionFeeInr = subscriptionFeeInr;
  // Pilot invariant: Enablement fee rate remains 0.0% during pilot phase
  partner.enablementFeeRate = 0.0;
  partner.updatedAt = new Date().toISOString();

  return partner;
}

