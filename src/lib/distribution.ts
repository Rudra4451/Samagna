/**
 * Samagna B2B2C Partner Distribution Network
 * Domain Models, Types, Seed Datasets & Pricing Reconciliation Engines
 */

export type PartnerOrgType =
  | 'PRODUCER_ORGANISATION'
  | 'SHG_FEDERATION'
  | 'CONSUMER_BRAND'
  | 'RETAIL_DISTRIBUTOR'
  | 'INSTITUTIONAL_RESELLER';

export type PartnerVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED_ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export type DistributionProductTier =
  | 'RAW_PRODUCE'
  | 'PROCESSED_BULK'
  | 'RETAIL_READY_PACKAGED';

export type DistributionChannelType =
  | 'EXTERNAL_RETAIL_PARTNER'
  | 'PARTNER_OWNED_STORE'
  | 'INSTITUTIONAL_BUYER'
  | 'APPROVED_RESELLER_NETWORK';

export type PackagingType =
  | 'GLASS_JAR'
  | 'STANDUP_POUCH'
  | 'CORRUGATED_BOX'
  | 'TIN_CANISTER'
  | 'COMPOSITE_DRUM';

export type OrderReferralStatus =
  | 'RECORDED'
  | 'CONFIRMED_FULFILLED'
  | 'RETURNED_CANCELLED'
  | 'SETTLED';

export type SalesReconciliationStatus =
  | 'PENDING_RECONCILIATION'
  | 'RECONCILED_SETTLED'
  | 'DISCREPANCY_FLAGGED';

export type PartnerSubscriptionTier =
  | 'COMMUNITY_PILOT'
  | 'GROWTH_PARTNER'
  | 'ENTERPRISE_NETWORK';

export interface VerifiableEvidence {
  credentialType: 'FSSAI_LICENSE' | 'GI_REGISTRATION' | 'NPOP_ORGANIC' | 'LAB_PURITY_ASSAY' | 'FAIR_TRADE_AUDIT';
  credentialNumber: string;
  issuingAuthority: string;
  issuedDate: string;
  expiryDate?: string;
  documentUrl?: string;
  isVerified: boolean;
}

export interface DistributionPartnerProfile {
  id: string;
  code: string;
  organisationName: string;
  partnerType: PartnerOrgType;
  registrationNumber: string;
  gstin?: string | null;
  pan: string;
  fssaiLicenseNumber?: string | null;
  primaryContactPerson: string;
  contactPhone: string;
  contactEmail: string;
  headquartersAddress: string;
  operatingDistricts: string[];
  verificationStatus: PartnerVerificationStatus;
  isVerified: boolean;
  isActive: boolean;
  subscriptionTier: PartnerSubscriptionTier;
  subscriptionFeeInr: number;
  enablementFeeRate: number; // Inactive 0.0% in pilot
  createdAt: string;
  updatedAt: string;
}

export interface DistributionBrand {
  id: string;
  brandCode: string;
  partnerId: string;
  brandName: string;
  originDistrict: string;
  brandStory: string;
  ethosStatement: string;
  logoUrl?: string | null;
  primaryColorHex: string;
  contactEmail: string;
  websiteUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RetailProductSku {
  id: string;
  skuCode: string;
  barcode?: string | null; // EAN-13 / GTIN
  brandId: string;
  partnerId: string;
  productTitle: string;
  productTier: DistributionProductTier;
  category: string;
  botanicalName?: string | null;
  netQuantity: string;
  netWeightGrams: number;
  casePackSize: number;
  packagingType: PackagingType;
  packagingMaterial: string;
  shelfLifeMonths: number;
  ingredients: string;
  storageInstructions: string;
  originCluster: string;
  communityProvenance: string;
  harvestSeason: string;
  traditionalHarvestPractice: string;
  wholesalePriceUnitInr: number;
  wholesalePriceCaseInr: number;
  retailPriceMrpInr: number;
  minOrderQuantityUnits: number;
  inventoryOnHandUnits: number;
  inventoryAllocatedUnits: number;
  inventoryAvailableUnits: number;
  sourceLotReference: string;
  fssaiDeclaration?: string | null;
  certifications: VerifiableEvidence[];
  isEvidenceVerified: boolean;
  verificationNotes?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionChannel {
  id: string;
  channelCode: string;
  channelName: string;
  channelType: DistributionChannelType;
  partnerId: string;
  channelPartnerName: string;
  contractAgreementRef: string;
  retailerMarginPercent: number; // e.g. 20.0%
  platformEnablementFeeRate: number; // 0.0% in pilot
  settlementTerms: string;
  targetAudience: string;
  catalogueFeedUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderReferralLineItem {
  skuCode: string;
  productTitle: string;
  quantityUnits: number;
  unitWholesaleInr: number;
  retailPriceMrpInr: number;
  totalWholesaleInr: number;
}

export interface OrderReferralRecord {
  id: string;
  referralCode: string;
  channelId: string;
  partnerId: string;
  externalOrderNumber: string;
  customerIdentifier: string;
  orderDate: string;
  lineItems: OrderReferralLineItem[];
  totalUnits: number;
  grossOrderValueInr: number; // Retail GMV
  wholesaleOrderValueInr: number; // Wholesale payable before channel margin
  channelMarginAmountInr: number;
  platformEnablementFeeInr: number; // 0.0 in pilot
  netPartnerPayableInr: number;
  status: OrderReferralStatus;
  fulfilmentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSalesReconciliation {
  id: string;
  reconciliationNumber: string;
  channelId: string;
  partnerId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalReferralsCount: number;
  totalUnitsSold: number;
  grossMerchandiseValueInr: number;
  channelMarginDeductionsInr: number;
  platformEnablementFeesInr: number; // 0.0 in pilot
  netRemittancePayableInr: number;
  physicalInventoryDrawdownUnits: number;
  inventoryVarianceUnits: number; // Discrepancy if units drawn != units sold
  status: SalesReconciliationStatus;
  settlementReference?: string | null;
  discrepancyNotes?: string | null;
  reconciledAt?: string | null;
  reconciledBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Seed Data: Partner Profiles
// ==========================================

export const SEED_DISTRIBUTION_PARTNERS: DistributionPartnerProfile[] = [
  {
    id: 'PRT-MAYUR-01',
    code: 'PRT-KRN-SHG',
    organisationName: 'Karanjia Tribal Mahila Forest Produce Federation',
    partnerType: 'SHG_FEDERATION',
    registrationNumber: 'OR-MAYUR-SHG-2018-092',
    gstin: '21AAATK9912M1Z5',
    pan: 'AAATK9912M',
    fssaiLicenseNumber: '12023999000124',
    primaryContactPerson: 'Sumitra Marndi (Federation President)',
    contactPhone: '+91-9437198765',
    contactEmail: 'karanjia.mahila.federation@gmail.com',
    headquartersAddress: 'TDCCOL Cluster Complex, SH-19, Karanjia, Mayurbhanj - 757037',
    operatingDistricts: ['Mayurbhanj', 'Keonjhar'],
    verificationStatus: 'VERIFIED_ACTIVE',
    isVerified: true,
    isActive: true,
    subscriptionTier: 'COMMUNITY_PILOT',
    subscriptionFeeInr: 0.0,
    enablementFeeRate: 0.0, // 0.0% in pilot
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'PRT-SIMIL-02',
    code: 'PRT-MFPCL-01',
    organisationName: 'Mayurbhanj Forest Producer Company Ltd (MFPCL)',
    partnerType: 'PRODUCER_ORGANISATION',
    registrationNumber: 'U01100OR2021PTC035412',
    gstin: '21AABCM8821R1ZK',
    pan: 'AABCM8821R',
    fssaiLicenseNumber: '12022999000881',
    primaryContactPerson: 'Dr. Biswaranjan Mohanty (MD & CEO)',
    contactPhone: '+91-9437255443',
    contactEmail: 'connect@mayurbhanjforestproducers.co.in',
    headquartersAddress: 'Station Road, Baripada, Mayurbhanj - 757001',
    operatingDistricts: ['Mayurbhanj', 'Balasore', 'Bhadrak'],
    verificationStatus: 'VERIFIED_ACTIVE',
    isVerified: true,
    isActive: true,
    subscriptionTier: 'GROWTH_PARTNER',
    subscriptionFeeInr: 0.0,
    enablementFeeRate: 0.0, // 0.0% in pilot
    createdAt: '2025-01-12T11:00:00Z',
    updatedAt: '2025-01-12T11:00:00Z',
  },
  {
    id: 'PRT-KALINGA-03',
    code: 'PRT-ONBC-01',
    organisationName: 'Odisha Natural Botanicals Collective',
    partnerType: 'CONSUMER_BRAND',
    registrationNumber: 'OR-BBSR-LLP-2023-0044',
    gstin: '21AAAFO5511B1ZF',
    pan: 'AAAFO5511B',
    fssaiLicenseNumber: '12024999001190',
    primaryContactPerson: 'Rashmi Rekha Senapati',
    contactPhone: '+91-9861122334',
    contactEmail: 'partnerships@odishanaturals.in',
    headquartersAddress: 'Infocity Avenue, Patia, Bhubaneswar - 751024',
    operatingDistricts: ['Khordha', 'Cuttack', 'Puri'],
    verificationStatus: 'VERIFIED_ACTIVE',
    isVerified: true,
    isActive: true,
    subscriptionTier: 'GROWTH_PARTNER',
    subscriptionFeeInr: 0.0,
    enablementFeeRate: 0.0,
    createdAt: '2025-01-15T09:30:00Z',
    updatedAt: '2025-01-15T09:30:00Z',
  },
  {
    id: 'PRT-UNVERIF-04',
    code: 'PRT-UNVERIF-TEST',
    organisationName: 'Maa Durgadevi Forest Resellers (Unverified Test)',
    partnerType: 'RETAIL_DISTRIBUTOR',
    registrationNumber: 'PENDING-REG-2025',
    gstin: null,
    pan: 'PENDINGPAN1',
    fssaiLicenseNumber: null,
    primaryContactPerson: 'Trial Contact',
    contactPhone: '+91-9000000000',
    contactEmail: 'unverified@test.com',
    headquartersAddress: 'Karanjia Market, Mayurbhanj',
    operatingDistricts: ['Mayurbhanj'],
    verificationStatus: 'PENDING_VERIFICATION',
    isVerified: false,
    isActive: false,
    subscriptionTier: 'COMMUNITY_PILOT',
    subscriptionFeeInr: 0.0,
    enablementFeeRate: 0.0,
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  },
];

// ==========================================
// Seed Data: Brand Profiles
// ==========================================

export const SEED_DISTRIBUTION_BRANDS: DistributionBrand[] = [
  {
    id: 'BRD-001',
    brandCode: 'BRD-MAYUR-WILD',
    partnerId: 'PRT-MAYUR-01',
    brandName: 'Mayurbhanj Wild',
    originDistrict: 'Mayurbhanj',
    brandStory: 'Nurtured in the biosphere core of Similipal, Mayurbhanj Wild represents centuries-old ethical wild harvest traditions passed down through Santhal, Ho, and Kolha indigenous tribal communities.',
    ethosStatement: '100% traceably gathered from deep forest canopies. Fair-trade gatherer compensation guaranteed.',
    logoUrl: '/images/brands/mayurbhanj-wild.svg',
    primaryColorHex: '#233827',
    contactEmail: 'wild@mayurbhanj.org',
    websiteUrl: 'https://mayurbhanjwild.org',
    isActive: true,
    createdAt: '2025-01-10T10:30:00Z',
    updatedAt: '2025-01-10T10:30:00Z',
  },
  {
    id: 'BRD-002',
    brandCode: 'BRD-SIMIL-PURE',
    partnerId: 'PRT-SIMIL-02',
    brandName: 'Similipal Forest Pure',
    originDistrict: 'Mayurbhanj',
    brandStory: 'Similipal Forest Pure brings unadulterated forest botanicals, floral nectar, and ancient herbs directly from certified collection clusters to discerning modern households.',
    ethosStatement: 'Raw, unblended, and minimally processed to preserve native phytonutrients and botanical integrity.',
    logoUrl: '/images/brands/similipal-pure.svg',
    primaryColorHex: '#1B4332',
    contactEmail: 'pure@similipalforest.com',
    websiteUrl: 'https://similipalforest.com',
    isActive: true,
    createdAt: '2025-01-12T11:30:00Z',
    updatedAt: '2025-01-12T11:30:00Z',
  },
];

// ==========================================
// Seed Data: Retail Product SKUs
// ==========================================

export const SEED_RETAIL_SKUS: RetailProductSku[] = [
  {
    id: 'SKU-001',
    skuCode: 'SKU-MW-HONEY-500G',
    barcode: '8906012340012',
    brandId: 'BRD-001',
    partnerId: 'PRT-MAYUR-01',
    productTitle: 'Mayurbhanj Wild Multifloral Raw Forest Honey (500g Glass Jar)',
    productTier: 'RETAIL_READY_PACKAGED',
    category: 'Honey & Sweeteners',
    botanicalName: 'Apis dorsata multifloral forest nectar',
    netQuantity: '500 g',
    netWeightGrams: 500.0,
    casePackSize: 12,
    packagingType: 'GLASS_JAR',
    packagingMaterial: 'Lead-free amber flint glass jar with food-grade induction heat seal; 100% recyclable carton.',
    shelfLifeMonths: 24,
    ingredients: '100% Pure Wild Forest Honey (Unpasteurized)',
    storageInstructions: 'Store at room temperature in a dry place away from direct sunlight. Do not refrigerate. Natural crystallization is proof of purity.',
    originCluster: 'Karanjia Buffer Zone, Similipal Biosphere Reserve, Mayurbhanj',
    communityProvenance: 'Santhal & Kolha Tribal Forest Honey Gatherers (Women SHG Clusters)',
    harvestSeason: 'Spring Multifloral Bloom (March - May 2025)',
    traditionalHarvestPractice: 'Ethical nocturnal cliff-climbing with herbal smoke repellent; non-destructive lower comb cut preserving the brood chamber.',
    wholesalePriceUnitInr: 295.0,
    wholesalePriceCaseInr: 3540.0,
    retailPriceMrpInr: 380.0,
    minOrderQuantityUnits: 12, // 1 case
    inventoryOnHandUnits: 1440,
    inventoryAllocatedUnits: 240,
    inventoryAvailableUnits: 1200,
    sourceLotReference: 'LOT-VAL-HONEY-2025-01', // Refined honey lot from Phase 4
    fssaiDeclaration: 'FSSAI Lic. No. 12023999000124 (Odisha State Authority)',
    certifications: [
      {
        credentialType: 'FSSAI_LICENSE',
        credentialNumber: '12023999000124',
        issuingAuthority: 'Food Safety and Standards Authority of India (Odisha)',
        issuedDate: '2023-04-01',
        expiryDate: '2028-03-31',
        documentUrl: '/docs/compliance/fssai-karanjia-12023999000124.pdf',
        isVerified: true,
      },
      {
        credentialType: 'LAB_PURITY_ASSAY',
        credentialNumber: 'QC-LAB-2025-HONEY-08',
        issuingAuthority: 'State Food Testing Laboratory, Cuttack',
        issuedDate: '2025-04-18',
        documentUrl: '/docs/lab/qc-honey-nmr-purity-2025-08.pdf',
        isVerified: true,
      },
    ],
    isEvidenceVerified: true,
    verificationNotes: 'NMR spectral test and pollen count verified by State Food Testing Lab, Cuttack. 0% added sugars, moisture 17.8%.',
    isPublished: true,
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'SKU-002',
    skuCode: 'SKU-SF-MAHUA-250G',
    barcode: '8906012340029',
    brandId: 'BRD-002',
    partnerId: 'PRT-SIMIL-02',
    productTitle: 'Similipal Pure Dried Mahua Blossom Nibbles (250g Pouch)',
    productTier: 'RETAIL_READY_PACKAGED',
    category: 'Dry Fruits & Natural Edibles',
    botanicalName: 'Madhuca longifolia var. latifolia',
    netQuantity: '250 g',
    netWeightGrams: 250.0,
    casePackSize: 24,
    packagingType: 'STANDUP_POUCH',
    packagingMaterial: 'Multi-barrier eco-kraft paper pouch with resealable airtight zip closure.',
    shelfLifeMonths: 12,
    ingredients: '100% Sun-Dried Wild Mahua Petals',
    storageInstructions: 'Store in an airtight container in a cool, dry place. Reseal pouch tightly after opening.',
    originCluster: 'Keonjhar Border Buffer Tracts, Similipal Reserve',
    communityProvenance: 'Bathudi and Munda Indigenous Gathering Communities',
    harvestSeason: 'Spring Dawn Bloom (March - April 2025)',
    traditionalHarvestPractice: 'Hand-picked at dawn from cleared forest floor beneath mature flowering Mahua trees; clean solar poly-tunnel drying.',
    wholesalePriceUnitInr: 140.0,
    wholesalePriceCaseInr: 3360.0,
    retailPriceMrpInr: 185.0,
    minOrderQuantityUnits: 24, // 1 case
    inventoryOnHandUnits: 960,
    inventoryAllocatedUnits: 120,
    inventoryAvailableUnits: 840,
    sourceLotReference: 'BS-401',
    fssaiDeclaration: 'FSSAI Lic. No. 12022999000881',
    certifications: [
      {
        credentialType: 'FSSAI_LICENSE',
        credentialNumber: '12022999000881',
        issuingAuthority: 'FSSAI Mayurbhanj District Office',
        issuedDate: '2022-08-15',
        expiryDate: '2027-08-14',
        documentUrl: '/docs/compliance/fssai-mfpcl-12022999000881.pdf',
        isVerified: true,
      },
      {
        credentialType: 'LAB_PURITY_ASSAY',
        credentialNumber: 'QC-LAB-2025-MAH-02',
        issuingAuthority: 'Orissa University of Agriculture & Technology (OUAT) Food Lab',
        issuedDate: '2025-04-12',
        documentUrl: '/docs/lab/ouat-mahua-assay-2025-02.pdf',
        isVerified: true,
      },
    ],
    isEvidenceVerified: true,
    verificationNotes: 'Aflatoxin-free test certificate issued by OUAT Food Testing Lab.',
    isPublished: true,
    createdAt: '2025-01-22T11:00:00Z',
    updatedAt: '2025-01-22T11:00:00Z',
  },
  {
    id: 'SKU-003',
    skuCode: 'SKU-PROC-HARIDA-EXT',
    barcode: null,
    brandId: 'BRD-002',
    partnerId: 'PRT-SIMIL-02',
    productTitle: 'Standardized Micro-Pulverized Harida Powder (Semi-Bulk)',
    productTier: 'PROCESSED_BULK',
    category: 'Medicinal Herbs & Extracts',
    botanicalName: 'Terminalia chebula',
    netQuantity: '25 kg',
    netWeightGrams: 25000.0,
    casePackSize: 1,
    packagingType: 'COMPOSITE_DRUM',
    packagingMaterial: 'Industrial fibre drum with double polyethylene food-grade barrier liner.',
    shelfLifeMonths: 24,
    ingredients: '100% De-seeded Terminalia chebula pulp powder (120 mesh)',
    storageInstructions: 'Store in dry sealed warehouse bay at < 25°C.',
    originCluster: 'Mayurbhanj South Division Foothills',
    communityProvenance: 'Mayurbhanj Tribal Primary Cooperatives',
    harvestSeason: 'Winter Harvest (November 2024 - January 2025)',
    traditionalHarvestPractice: 'Hand-collection of mature fallen drupes; stone-grinding with dust elimination.',
    wholesalePriceUnitInr: 4500.0,
    wholesalePriceCaseInr: 4500.0,
    retailPriceMrpInr: 6000.0,
    minOrderQuantityUnits: 2,
    inventoryOnHandUnits: 80,
    inventoryAllocatedUnits: 20,
    inventoryAvailableUnits: 60,
    sourceLotReference: 'LOT-PROC-HARIDA-2025-01',
    fssaiDeclaration: 'Ayush / FSSAI Bulk Specification',
    certifications: [],
    isEvidenceVerified: false,
    verificationNotes: 'Standard Commercial Grade (Uncertified / Testing Pending)',
    isPublished: true,
    createdAt: '2025-01-25T14:00:00Z',
    updatedAt: '2025-01-25T14:00:00Z',
  },
  {
    id: 'SKU-004',
    skuCode: 'SKU-RAW-SAL-SEED-BULK',
    barcode: null,
    brandId: 'BRD-001',
    partnerId: 'PRT-MAYUR-01',
    productTitle: 'Raw Wild Sal Seeds (Bana Jhuna Shorea robusta Intake)',
    productTier: 'RAW_PRODUCE',
    category: 'Raw Forest Produce',
    botanicalName: 'Shorea robusta',
    netQuantity: '50 kg',
    netWeightGrams: 50000.0,
    casePackSize: 1,
    packagingType: 'CORRUGATED_BOX',
    packagingMaterial: 'Heavy-duty breathable jute burlap gunny bags with inner moisture barrier.',
    shelfLifeMonths: 6,
    ingredients: 'Raw unpeeled Sal seeds',
    storageInstructions: 'Elevated wooden pallet storage in ventilated dry depot bay.',
    originCluster: 'Baripada Central Foothills, Mayurbhanj',
    communityProvenance: 'Similipal Tribal Primary Gatherers',
    harvestSeason: 'Summer Harvest (May - June 2024)',
    traditionalHarvestPractice: 'Ground sweeping beneath canopy; hand winnowing of forest chaff.',
    wholesalePriceUnitInr: 1900.0,
    wholesalePriceCaseInr: 1900.0,
    retailPriceMrpInr: 2400.0,
    minOrderQuantityUnits: 10,
    inventoryOnHandUnits: 400,
    inventoryAllocatedUnits: 100,
    inventoryAvailableUnits: 300,
    sourceLotReference: 'BS-400',
    fssaiDeclaration: null,
    certifications: [],
    isEvidenceVerified: false,
    verificationNotes: 'Raw Intake Produce (Standard Non-Certified)',
    isPublished: true,
    createdAt: '2025-01-26T09:00:00Z',
    updatedAt: '2025-01-26T09:00:00Z',
  },
];

// ==========================================
// Seed Data: Distribution Channels
// ==========================================

export const SEED_DISTRIBUTION_CHANNELS: DistributionChannel[] = [
  {
    id: 'CHN-001',
    channelCode: 'CHN-UTKAL-01',
    channelName: 'Utkalika State Emporium Network',
    channelType: 'EXTERNAL_RETAIL_PARTNER',
    partnerId: 'PRT-MAYUR-01',
    channelPartnerName: 'Utkalika Handloom & Handicrafts State Apex',
    contractAgreementRef: 'AGR-UTKAL-2025-09',
    retailerMarginPercent: 22.0, // 22% retail margin on MRP
    platformEnablementFeeRate: 0.0, // 0.0% in pilot
    settlementTerms: 'Net-30 days post delivery confirmation',
    targetAudience: 'Tourists, cultural connoisseurs, and premium domestic shoppers in Bhubaneswar, Puri, Kolkata, and New Delhi emporia.',
    catalogueFeedUrl: '/api/trade/catalogue/export?channel=CHN-UTKAL-01&format=json',
    isActive: true,
    createdAt: '2025-01-18T10:00:00Z',
    updatedAt: '2025-01-18T10:00:00Z',
  },
  {
    id: 'CHN-002',
    channelCode: 'CHN-MAYUR-D2C',
    channelName: 'Mayurbhanj Wild D2C Brand Flagship',
    channelType: 'PARTNER_OWNED_STORE',
    partnerId: 'PRT-MAYUR-01',
    channelPartnerName: 'Mayurbhanj Wild Online Storefront',
    contractAgreementRef: 'D2C-OPER-2025-01',
    retailerMarginPercent: 10.0, // Packaging & direct fulfilment allowance
    platformEnablementFeeRate: 0.0,
    settlementTerms: 'Weekly Net-7 payout cycle',
    targetAudience: 'Health-conscious urban consumers, chefs, and natural food enthusiasts across India.',
    catalogueFeedUrl: '/api/trade/catalogue/export?channel=CHN-MAYUR-D2C&format=json',
    isActive: true,
    createdAt: '2025-01-20T12:00:00Z',
    updatedAt: '2025-01-20T12:00:00Z',
  },
  {
    id: 'CHN-003',
    channelCode: 'CHN-APEX-INST',
    channelName: 'Odisha Tribal Development Apex Kitchens',
    channelType: 'INSTITUTIONAL_BUYER',
    partnerId: 'PRT-SIMIL-02',
    channelPartnerName: 'State Welfare & Ashram School Canteen System',
    contractAgreementRef: 'INST-WELFARE-2025-044',
    retailerMarginPercent: 12.0, // Institutional bulk procurement concession
    platformEnablementFeeRate: 0.0,
    settlementTerms: 'Government Treasury Challan Net-45',
    targetAudience: 'Hostel welfare diets and tribal youth athletic feeding programs.',
    catalogueFeedUrl: '/api/trade/catalogue/export?channel=CHN-APEX-INST&format=json',
    isActive: true,
    createdAt: '2025-01-22T15:00:00Z',
    updatedAt: '2025-01-22T15:00:00Z',
  },
  {
    id: 'CHN-004',
    channelCode: 'CHN-RESELL-EAST',
    channelName: 'Eastern India Cooperative Organic Reseller Alliance',
    channelType: 'APPROVED_RESELLER_NETWORK',
    partnerId: 'PRT-SIMIL-02',
    channelPartnerName: 'Eastern Organic Distributors Consortium',
    contractAgreementRef: 'DIST-EAST-2025-11',
    retailerMarginPercent: 25.0, // Regional distributor wholesale margin
    platformEnablementFeeRate: 0.0,
    settlementTerms: 'Letter of Credit / Net-30',
    targetAudience: 'Specialty organic grocers across Kolkata, Patna, Ranchi, and Guwahati.',
    catalogueFeedUrl: '/api/trade/catalogue/export?channel=CHN-RESELL-EAST&format=json',
    isActive: true,
    createdAt: '2025-01-25T11:00:00Z',
    updatedAt: '2025-01-25T11:00:00Z',
  },
];

// ==========================================
// Seed Data: Order Referrals
// ==========================================

export const SEED_ORDER_REFERRALS: OrderReferralRecord[] = [
  {
    id: 'REF-001',
    referralCode: 'REF-ORD-2025-001',
    channelId: 'CHN-001',
    partnerId: 'PRT-MAYUR-01',
    externalOrderNumber: 'UTKAL-BBSR-2025-081',
    customerIdentifier: 'Utkalika Flagship Store, Saheed Nagar, Bhubaneswar',
    orderDate: '2025-04-10T11:30:00Z',
    lineItems: [
      {
        skuCode: 'SKU-MW-HONEY-500G',
        productTitle: 'Mayurbhanj Wild Multifloral Raw Forest Honey (500g Glass Jar)',
        quantityUnits: 120, // 10 cases
        unitWholesaleInr: 295.0,
        retailPriceMrpInr: 380.0,
        totalWholesaleInr: 35400.0,
      },
    ],
    totalUnits: 120,
    grossOrderValueInr: 45600.0, // 120 * 380
    wholesaleOrderValueInr: 35400.0, // 120 * 295
    channelMarginAmountInr: 10200.0, // 45600 - 35400 (22.36% margin)
    platformEnablementFeeInr: 0.0, // Pilot invariant: 0.0%
    netPartnerPayableInr: 35400.0,
    status: 'CONFIRMED_FULFILLED',
    fulfilmentNotes: 'Dispatched via OD State Transport under Seal #SEAL-BRP-991.',
    createdAt: '2025-04-10T12:00:00Z',
    updatedAt: '2025-04-12T16:00:00Z',
  },
  {
    id: 'REF-002',
    referralCode: 'REF-ORD-2025-002',
    channelId: 'CHN-002',
    partnerId: 'PRT-MAYUR-01',
    externalOrderNumber: 'D2C-MAYUR-4091',
    customerIdentifier: 'Cust #4091 (Bangalore Urban)',
    orderDate: '2025-04-14T14:15:00Z',
    lineItems: [
      {
        skuCode: 'SKU-MW-HONEY-500G',
        productTitle: 'Mayurbhanj Wild Multifloral Raw Forest Honey (500g Glass Jar)',
        quantityUnits: 2,
        unitWholesaleInr: 295.0,
        retailPriceMrpInr: 380.0,
        totalWholesaleInr: 590.0,
      },
    ],
    totalUnits: 2,
    grossOrderValueInr: 760.0,
    wholesaleOrderValueInr: 590.0,
    channelMarginAmountInr: 170.0,
    platformEnablementFeeInr: 0.0,
    netPartnerPayableInr: 590.0,
    status: 'CONFIRMED_FULFILLED',
    fulfilmentNotes: 'Direct postal dispatch from Karanjia Depot with tamper seal.',
    createdAt: '2025-04-14T14:20:00Z',
    updatedAt: '2025-04-15T09:00:00Z',
  },
  {
    id: 'REF-003',
    referralCode: 'REF-ORD-2025-003',
    channelId: 'CHN-004',
    partnerId: 'PRT-SIMIL-02',
    externalOrderNumber: 'EODC-KOLKATA-2025-102',
    customerIdentifier: 'Eastern Organic Depot, Salt Lake City, Kolkata',
    orderDate: '2025-04-18T10:00:00Z',
    lineItems: [
      {
        skuCode: 'SKU-SF-MAHUA-250G',
        productTitle: 'Similipal Pure Dried Mahua Blossom Nibbles (250g Pouch)',
        quantityUnits: 240, // 10 cases
        unitWholesaleInr: 140.0,
        retailPriceMrpInr: 185.0,
        totalWholesaleInr: 33600.0,
      },
    ],
    totalUnits: 240,
    grossOrderValueInr: 44400.0,
    wholesaleOrderValueInr: 33600.0,
    channelMarginAmountInr: 10800.0,
    platformEnablementFeeInr: 0.0,
    netPartnerPayableInr: 33600.0,
    status: 'RECORDED',
    fulfilmentNotes: 'Pending dispatch staging at Baripada Central Depot.',
    createdAt: '2025-04-18T10:15:00Z',
    updatedAt: '2025-04-18T10:15:00Z',
  },
];

// ==========================================
// Seed Data: Partner Sales Reconciliations
// ==========================================

export const SEED_SALES_RECONCILIATIONS: PartnerSalesReconciliation[] = [
  {
    id: 'REC-001',
    reconciliationNumber: 'REC-B2B2C-2025-001',
    channelId: 'CHN-001',
    partnerId: 'PRT-MAYUR-01',
    billingPeriodStart: '2025-04-01T00:00:00Z',
    billingPeriodEnd: '2025-04-30T23:59:59Z',
    totalReferralsCount: 1,
    totalUnitsSold: 120,
    grossMerchandiseValueInr: 45600.0,
    channelMarginDeductionsInr: 10200.0,
    platformEnablementFeesInr: 0.0, // Pilot 0.0%
    netRemittancePayableInr: 35400.0,
    physicalInventoryDrawdownUnits: 120,
    inventoryVarianceUnits: 0, // Perfect alignment: 120 sold == 120 dispatched
    status: 'RECONCILED_SETTLED',
    settlementReference: 'UTR-SBIN-20250428-994102',
    discrepancyNotes: null,
    reconciledAt: '2025-04-28T14:30:00Z',
    reconciledBy: 'Rabindra Jena (Commercial Finance Officer)',
    createdAt: '2025-04-28T14:00:00Z',
    updatedAt: '2025-04-28T14:30:00Z',
  },
];

// ==========================================
// Business Calculation & Export Utilities
// ==========================================

/**
 * Calculates channel economics for a SKU under a specific margin structure
 */
export function calculateChannelPricing(
  wholesalePriceUnitInr: number,
  retailPriceMrpInr: number,
  channelMarginPercent: number,
  platformEnablementFeeRate: number = 0.0
) {
  const retailerMarginAmount = (retailPriceMrpInr * channelMarginPercent) / 100.0;
  const platformFeeAmount = (wholesalePriceUnitInr * platformEnablementFeeRate) / 100.0;
  const netProducerRealization = wholesalePriceUnitInr - platformFeeAmount;
  const marginSpreadPercent = ((retailPriceMrpInr - wholesalePriceUnitInr) / retailPriceMrpInr) * 100.0;

  return {
    wholesalePriceUnitInr,
    retailPriceMrpInr,
    retailerMarginAmount,
    channelMarginPercent,
    platformFeeAmount,
    netProducerRealization,
    marginSpreadPercent: Number(marginSpreadPercent.toFixed(2)),
  };
}

/**
 * Generates an external export feed of retail-ready SKUs for channel syndication
 */
export function exportPartnerCatalogue(
  skus: RetailProductSku[],
  channel: DistributionChannel,
  format: 'json' | 'csv' = 'json'
): string {
  const exportItems = skus
    .filter((s) => s.isPublished)
    .map((s) => ({
      sku_code: s.skuCode,
      barcode_ean13: s.barcode || 'N/A',
      product_title: s.productTitle,
      product_tier: s.productTier,
      category: s.category,
      botanical_identity: s.botanicalName || 'Unspecified',
      net_quantity: s.netQuantity,
      net_weight_grams: s.netWeightGrams,
      case_pack_size: s.casePackSize,
      packaging_type: s.packagingType,
      packaging_material: s.packagingMaterial,
      shelf_life_months: s.shelfLifeMonths,
      ingredients: s.ingredients,
      origin_cluster: s.originCluster,
      community_provenance: s.communityProvenance,
      harvest_season: s.harvestSeason,
      wholesale_unit_inr: s.wholesalePriceUnitInr,
      wholesale_case_inr: s.wholesalePriceCaseInr,
      retail_mrp_inr: s.retailPriceMrpInr,
      min_order_quantity_units: s.minOrderQuantityUnits,
      inventory_available_units: s.inventoryAvailableUnits,
      source_lot_reference: s.sourceLotReference,
      certifications: s.certifications.map((c) => `${c.credentialType}: ${c.credentialNumber}`).join('; ') || 'Standard / Uncertified',
      evidence_verified: s.isEvidenceVerified ? 'VERIFIED' : 'PENDING_EVIDENCE',
      batch_verification_url: `https://samagna.gov.in/verify/${encodeURIComponent(s.sourceLotReference)}`,
    }));

  if (format === 'csv') {
    if (exportItems.length === 0) return '';
    const headers = Object.keys(exportItems[0]).join(',');
    const rows = exportItems.map((item) =>
      Object.values(item)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    return [headers, ...rows].join('\n');
  }

  return JSON.stringify(
    {
      channel_code: channel.channelCode,
      channel_name: channel.channelName,
      partner_id: channel.partnerId,
      exported_at: new Date().toISOString(),
      item_count: exportItems.length,
      items: exportItems,
    },
    null,
    2
  );
}

/**
 * Reconciles sales referrals against physical warehouse drawdowns
 */
export function calculateReconciliationVariance(
  reportedSoldUnits: number,
  physicalDrawdownUnits: number
): {
  isDiscrepancy: boolean;
  varianceUnits: number;
  status: SalesReconciliationStatus;
  message: string;
} {
  const varianceUnits = reportedSoldUnits - physicalDrawdownUnits;

  if (varianceUnits === 0) {
    return {
      isDiscrepancy: false,
      varianceUnits: 0,
      status: 'RECONCILED_SETTLED',
      message: 'Physical inventory drawdown perfectly matches reported channel sales.',
    };
  }

  return {
    isDiscrepancy: true,
    varianceUnits,
    status: 'DISCREPANCY_FLAGGED',
    message: `Discrepancy detected: ${Math.abs(varianceUnits)} unit(s) ${
      varianceUnits > 0 ? 'sold without corresponding physical dispatch' : 'dispatched without recorded referral sales'
    }.`,
  };
}

