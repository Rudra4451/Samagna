import { MfpProduct, ODISHA_MFP_CATALOGUE } from './products';
import { generateULID } from './ulid';
import { getDatabase, InventorySaleRecord } from './db';

export type BuyerCategory = 'B2B' | 'B2C';

export type OrderStatus = 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export type PaymentMethod = 'DEMO_COMMERCIAL_GATEWAY' | 'CORPORATE_NEFT_RTGS' | 'UPI_DEMO' | 'LETTER_OF_CREDIT';

export type RfqStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'QUOTED' | 'ACCEPTED' | 'REJECTED';

export type BusinessIndustry =
  | 'PHARMACEUTICAL'
  | 'AYURVEDIC_MEDICINE'
  | 'HERBAL_PRODUCTS'
  | 'FOOD_PROCESSING'
  | 'WHOLESALE_DISTRIBUTOR'
  | 'EXPORTER'
  | 'LARGE_SCALE_TRADER';

export interface B2BPackagingOption {
  bagWeightKg: number;
  packagingMaterial: string;
  minimumOrderQuantityKg: number;
  bulkDiscountPercent?: number;
}

export interface B2CPackagingOption {
  id: string;
  sizeLabel: string;
  weightGrams: number;
  priceInr: number;
  stockUnits: number;
  packagingDescription: string;
}

export interface MarketplaceProduct {
  id: string;
  slug: string;
  nameEnglish: string;
  nameOdia: string;
  scientificName: string;
  category: 'Honey' | 'Forest Seeds' | 'Medicinal Herbs' | 'Flowers & Pods' | 'Natural Resins & Spices';
  imagePath: string;
  description: string;
  benefits: string[];
  
  // Warehouse Stock & Provenance Linking
  primaryBatchCode: string;
  alternateBatchCodes?: string[];
  destinationDepotId: string;
  destinationDepotName: string;
  originBlock: string;
  originGramPanchayat: string;
  shgSupplierName: string;
  qualityGrade: string;
  labCertifiedMoisturePercent: number;
  storageBay: string;
  sealTagId: string;
  totalVerifiedStockKg: number;
  allocatedStockKg: number;
  availableStockKg: number; // dynamically computed
  
  // Commercial Pricing (Transparently anchored to MSP)
  officialMspRatePerKg: number;
  b2bWholesaleRatePerKg: number;
  b2bMinimumOrderKg: number;
  b2bPackaging: B2BPackagingOption;
  b2cOptions: B2CPackagingOption[];
  
  isAvailableForB2B: boolean;
  isAvailableForB2C: boolean;
  harvestSeason: string;
}

export interface MarketplaceOrderItem {
  productId: string;
  productName: string;
  scientificName: string;
  batchCode: string;
  depotId: string;
  depotName: string;
  buyerType: BuyerCategory;
  quantityKg: number;
  packDescription: string;
  unitPrice: number;
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  sellerSettlementAmount: number;
}

export interface MarketplaceBuyerDetails {
  buyerType: BuyerCategory;
  name: string;
  email: string;
  phone: string;
  // B2B specific fields
  companyName?: string;
  industry?: BusinessIndustry;
  gstin?: string;
  pan?: string;
  isVerifiedCompany?: boolean;
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  buyerType: BuyerCategory;
  buyer: MarketplaceBuyerDetails;
  items: MarketplaceOrderItem[];
  
  // Financial Breakdown (Strict Transparency)
  totalItemsKg: number;
  totalGrossAmount: number;
  totalCommissionAmount: number;
  totalSellerSettlement: number;
  effectiveCommissionRate: number;
  shippingFee: number;
  finalPayableAmount: number;
  
  // Fulfillment & Provenance
  primaryBatchCode: string;
  verificationQrUrl: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID_DEMO' | 'PENDING_CONFIRMATION';
  fulfillmentStatus: OrderStatus;
  
  trackingTimeline: Array<{
    status: OrderStatus;
    timestamp: number;
    title: string;
    description: string;
    actor: string;
  }>;
  
  invoiceNumber: string;
  createdAt: number;
  notes?: string;
}

export interface MarketplaceQuotation {
  id: string;
  rfqNumber: string;
  buyer: MarketplaceBuyerDetails;
  produceName: string;
  batchCode?: string;
  requestedQuantityKg: number;
  targetPricePerKg?: number;
  requestedDeliveryDate: string;
  status: RfqStatus;
  quotedPricePerKg?: number;
  quotedCommissionPercent?: number;
  quotedTotalAmount?: number;
  adminRemarks?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommercialRevenueConfig {
  // 1. Government Institutional Services
  govRoyaltyPercent: number; // e.g. 2.5%
  govAnnualLicensingFee: number; // e.g. ₹5,00,000 / year
  govTechMaintenanceFee: number; // e.g. ₹1,50,000 / year
  
  // 2. Commercial Buyer Commission
  b2bCommissionPercent: number; // e.g. 3.5%
  b2cCommissionPercent: number; // e.g. 6.0%
}

export const DEFAULT_COMMERCIAL_CONFIG: CommercialRevenueConfig = {
  govRoyaltyPercent: 2.5,
  govAnnualLicensingFee: 500000,
  govTechMaintenanceFee: 150000,
  b2bCommissionPercent: 3.5,
  b2cCommissionPercent: 6.0,
};

/**
 * 7 Primary Verified Commercial Produce Lines linked directly to existing warehouse stock
 * All stock is anchored to real verified batches in Baripada Central Depôt (BRP-01)
 */
export const INITIAL_MARKETPLACE_CATALOGUE: MarketplaceProduct[] = [
  {
    id: 'MKT-MAHUA',
    slug: 'mahua',
    nameEnglish: 'Dried Mahua Flowers',
    nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    category: 'Flowers & Pods',
    imagePath: '/products/mahua.jpg',
    description: 'Direct sun-dried forest blossom corollas gathered at dawn in Similipal buffer tracts. Certified low-moisture grade suitable for ayurvedic syrups, natural fermentation, and confectionery.',
    benefits: ['Rich in natural fructose and dietary minerals', 'Zero chemical processing or sulfur additives', 'Traditional respiratory and digestive restorative'],
    primaryBatchCode: 'BS-400',
    alternateBatchCodes: ['BS-398', 'BS-395'],
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 02)',
    originBlock: 'Karanjia',
    originGramPanchayat: 'Badagaon GP',
    shgSupplierName: 'Maa Tarini SHG (Facilitator: Champa Majhi)',
    qualityGrade: 'Grade A - Properly Dried',
    labCertifiedMoisturePercent: 8.4,
    storageBay: 'Bay 02 (Dry Timber Stack)',
    sealTagId: 'OD-MBJ-KRN-400',
    totalVerifiedStockKg: 103.8, // 34.5 (BS-400) + 24.6 (BS-398) + 44.7 (BS-395)
    allocatedStockKg: 0,
    availableStockKg: 103.8,
    officialMspRatePerKg: 42.0,
    b2bWholesaleRatePerKg: 46.0,
    b2bMinimumOrderKg: 50.0,
    b2bPackaging: {
      bagWeightKg: 50,
      packagingMaterial: '50kg Jute Gunny Bag with Tamper-evident Seal',
      minimumOrderQuantityKg: 50,
      bulkDiscountPercent: 2.5,
    },
    b2cOptions: [
      {
        id: 'opt-mahua-500g',
        sizeLabel: '500g Eco-Pouch',
        weightGrams: 500,
        priceInr: 45,
        stockUnits: 120,
        packagingDescription: 'Airtight resealable kraft food-grade pouch',
      },
      {
        id: 'opt-mahua-1kg',
        sizeLabel: '1 kg Family Pack',
        weightGrams: 1000,
        priceInr: 85,
        stockUnits: 60,
        packagingDescription: 'Triple-laminated aroma-preserving pack',
      },
      {
        id: 'opt-mahua-5kg',
        sizeLabel: '5 kg Bulk Box',
        weightGrams: 5000,
        priceInr: 395,
        stockUnits: 15,
        packagingDescription: 'Corrugated bulk storage box with inner liner',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'March to May',
  },
  {
    id: 'MKT-HONEY',
    slug: 'wild-honey',
    nameEnglish: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ମହୁ',
    scientificName: 'Apis dorsata comb nectar',
    category: 'Honey',
    imagePath: '/products/wild-honey.jpg',
    description: 'Raw multi-floral wild cliff honey harvested sustainably by tribal honey-hunters from Similipal Biosphere Reserve. Unpasteurized and coarse linen-filtered to retain active enzymes, bee pollen, and propolis.',
    benefits: ['Raw & unprocessed — rich in live diastase enzymes', 'Natural immunity booster with natural pollen', 'Zero added invert syrup or corn sweeteners'],
    primaryBatchCode: 'BS-W-410',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 03)',
    originBlock: 'Jashipur',
    originGramPanchayat: 'Gudugudia GP',
    shgSupplierName: 'Similipal Vanasampada SHG Federation',
    qualityGrade: 'Grade A - Certified Unadulterated',
    labCertifiedMoisturePercent: 18.2,
    storageBay: 'Bay 03 (Hermetic Food-Grade Storage)',
    sealTagId: 'OD-MBJ-JAS-410',
    totalVerifiedStockKg: 150.0,
    allocatedStockKg: 0,
    availableStockKg: 150.0,
    officialMspRatePerKg: 225.0,
    b2bWholesaleRatePerKg: 260.0,
    b2bMinimumOrderKg: 20.0,
    b2bPackaging: {
      bagWeightKg: 20,
      packagingMaterial: '20L Food-Grade HDPE Jerry Can with Tamper Seal',
      minimumOrderQuantityKg: 20,
      bulkDiscountPercent: 4.0,
    },
    b2cOptions: [
      {
        id: 'opt-honey-250g',
        sizeLabel: '250g Glass Jar',
        weightGrams: 250,
        priceInr: 125,
        stockUnits: 180,
        packagingDescription: 'Hexagonal food-safe glass bottle with metal lug cap',
      },
      {
        id: 'opt-honey-500g',
        sizeLabel: '500g Glass Jar',
        weightGrams: 500,
        priceInr: 235,
        stockUnits: 140,
        packagingDescription: 'Heritage glass jar with batch traceability seal',
      },
      {
        id: 'opt-honey-1kg',
        sizeLabel: '1 kg Squeeze Bottle',
        weightGrams: 1000,
        priceInr: 440,
        stockUnits: 90,
        packagingDescription: 'Ergonomic no-drip food-grade bottle',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'April to June',
  },
  {
    id: 'MKT-TAMARIND',
    slug: 'tamarind',
    nameEnglish: 'Seeded Wild Tamarind',
    nameOdia: 'ତେନ୍ତୁଳି (ମଞ୍ଜି ସହିତ)',
    scientificName: 'Tamarindus indica',
    category: 'Flowers & Pods',
    imagePath: '/products/tamarind-seeded.jpg',
    description: 'Naturally cured deep reddish-brown tamarind pods gathered across Mayurbhanj hill tracts. High tartaric acid content, excellent binding properties for natural seasonings and confectionery concentrate.',
    benefits: ['High natural tartaric acid and pectin', 'Sun-cured without chemical bleaching or preservatives', 'Natural digestive and culinary acidulant'],
    primaryBatchCode: 'BS-T-415',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 01)',
    originBlock: 'Karanjia',
    originGramPanchayat: 'Tato GP',
    shgSupplierName: 'Maa Durga Mahila Mandal',
    qualityGrade: 'Grade A - Cured Slab',
    labCertifiedMoisturePercent: 13.5,
    storageBay: 'Bay 01 (Dehumidified Pallet Section)',
    sealTagId: 'OD-MBJ-KRN-415',
    totalVerifiedStockKg: 240.0,
    allocatedStockKg: 0,
    availableStockKg: 240.0,
    officialMspRatePerKg: 36.0,
    b2bWholesaleRatePerKg: 40.0,
    b2bMinimumOrderKg: 40.0,
    b2bPackaging: {
      bagWeightKg: 40,
      packagingMaterial: '40kg Jute Bag with Polyethylene Inner Liner',
      minimumOrderQuantityKg: 40,
      bulkDiscountPercent: 3.0,
    },
    b2cOptions: [
      {
        id: 'opt-tam-500g',
        sizeLabel: '500g Compact Brick',
        weightGrams: 500,
        priceInr: 35,
        stockUnits: 200,
        packagingDescription: 'Vacuum-sealed moisture-barrier block',
      },
      {
        id: 'opt-tam-1kg',
        sizeLabel: '1 kg Brick Pack',
        weightGrams: 1000,
        priceInr: 65,
        stockUnits: 150,
        packagingDescription: 'Twin vacuum-pack blocks in kraft sleeve',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'January to April',
  },
  {
    id: 'MKT-CHIRONJI',
    slug: 'char-seeds',
    nameEnglish: 'Chironji / Char Seeds',
    nameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    category: 'Forest Seeds',
    imagePath: '/products/char-seeds.jpg',
    description: 'High-value forest tree nuts gathered in dry deciduousSimilipal tracts. Delicate sweet almond-like flavour prized for ayurvedic confections, holistic skincare formulations, and gourmet garnishing.',
    benefits: ['Dense plant protein and natural linoleic acid', 'Nutritive tonic in classical ayurvedic preparations', 'Zero artificial polish or chemical dehusking'],
    primaryBatchCode: 'BS-C-412',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 03)',
    originBlock: 'Rairangpur',
    originGramPanchayat: 'Gorumahisani GP',
    shgSupplierName: 'Baidyanath Forest Gatherers SHG',
    qualityGrade: 'Grade A - Premium Kernels',
    labCertifiedMoisturePercent: 7.8,
    storageBay: 'Bay 03 (Temperature-Monitored Bin)',
    sealTagId: 'OD-MBJ-RRP-412',
    totalVerifiedStockKg: 95.0,
    allocatedStockKg: 0,
    availableStockKg: 95.0,
    officialMspRatePerKg: 120.0,
    b2bWholesaleRatePerKg: 145.0,
    b2bMinimumOrderKg: 25.0,
    b2bPackaging: {
      bagWeightKg: 25,
      packagingMaterial: '25kg High-Density Poly Bag with Desiccant Pouch',
      minimumOrderQuantityKg: 25,
      bulkDiscountPercent: 2.0,
    },
    b2cOptions: [
      {
        id: 'opt-char-250g',
        sizeLabel: '250g Vacuum Jar',
        weightGrams: 250,
        priceInr: 85,
        stockUnits: 100,
        packagingDescription: 'Sealed nitrogen-flushed freshness tub',
      },
      {
        id: 'opt-char-500g',
        sizeLabel: '500g Pouch',
        weightGrams: 500,
        priceInr: 160,
        stockUnits: 75,
        packagingDescription: 'Zip-lock moisture-proof foil pouch',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'April to June',
  },
  {
    id: 'MKT-SAL',
    slug: 'sal-seeds',
    nameEnglish: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    category: 'Forest Seeds',
    imagePath: '/products/sal-seeds.jpg',
    description: 'Decorticated winged tree seeds hand-sorted by forest collectors. High-yield vegetable lipid source utilized internationally for confectionery cocoa-butter equivalent (CBE) and cosmetic emollients.',
    benefits: ['Natural plant lipids with high stearic/oleic profile', 'Ideal raw material for clean chocolate manufacturing', 'Direct sustainable Similipal gatherer collection'],
    primaryBatchCode: 'BS-S-418',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 04)',
    originBlock: 'Karanjia',
    originGramPanchayat: 'Badagaon GP',
    shgSupplierName: 'Maa Tarini SHG',
    qualityGrade: 'Grade A - Sound Decorticated',
    labCertifiedMoisturePercent: 9.2,
    storageBay: 'Bay 04 (Dry Timber Racks)',
    sealTagId: 'OD-MBJ-KRN-418',
    totalVerifiedStockKg: 500.0,
    allocatedStockKg: 0,
    availableStockKg: 500.0,
    officialMspRatePerKg: 28.0,
    b2bWholesaleRatePerKg: 32.0,
    b2bMinimumOrderKg: 100.0,
    b2bPackaging: {
      bagWeightKg: 50,
      packagingMaterial: '50kg Heavy-Duty Jute Gunny Bag',
      minimumOrderQuantityKg: 100,
      bulkDiscountPercent: 5.0,
    },
    b2cOptions: [
      {
        id: 'opt-sal-1kg',
        sizeLabel: '1 kg Raw Seeds Pack',
        weightGrams: 1000,
        priceInr: 45,
        stockUnits: 40,
        packagingDescription: 'Bio-based compostable pouch',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'May to July',
  },
  {
    id: 'MKT-HARIDA',
    slug: 'harida',
    nameEnglish: 'Harida / Chebulic Myrobalan',
    nameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    category: 'Medicinal Herbs',
    imagePath: '/products/harida.jpg',
    description: 'The golden myrobalan revered in classical Triphala formulations. Sun-cured forest fruits selected for thick pulp and optimum tannin balance, rigorously batch-tested for zero aflatoxin and ideal moisture.',
    benefits: ['Key cornerstone of Triphala herbal compound', 'Rich in chebulic acid, chebulagic acid, and natural tannins', 'Traditional digestive detoxifier and skin toner'],
    primaryBatchCode: 'BS-H-420',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 04)',
    originBlock: 'Bisoi',
    originGramPanchayat: 'Manada GP',
    shgSupplierName: 'Similipal Oushadhi SHG Cluster',
    qualityGrade: 'Grade A - Bold Yellow Kernels',
    labCertifiedMoisturePercent: 10.4,
    storageBay: 'Bay 04 (Dry Timber Racks)',
    sealTagId: 'OD-MBJ-BIS-420',
    totalVerifiedStockKg: 180.0,
    allocatedStockKg: 0,
    availableStockKg: 180.0,
    officialMspRatePerKg: 25.0,
    b2bWholesaleRatePerKg: 30.0,
    b2bMinimumOrderKg: 50.0,
    b2bPackaging: {
      bagWeightKg: 50,
      packagingMaterial: '50kg Jute Bag with Inner Moisture Barrier',
      minimumOrderQuantityKg: 50,
      bulkDiscountPercent: 3.0,
    },
    b2cOptions: [
      {
        id: 'opt-harida-500g',
        sizeLabel: '500g Whole Dry Fruit',
        weightGrams: 500,
        priceInr: 30,
        stockUnits: 110,
        packagingDescription: 'Herbal resealable barrier pouch',
      },
      {
        id: 'opt-harida-1kg',
        sizeLabel: '1 kg Pantry Pack',
        weightGrams: 1000,
        priceInr: 55,
        stockUnits: 80,
        packagingDescription: 'Aroma-sealed dual-layer pack',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'November to February',
  },
  {
    id: 'MKT-AMLA',
    slug: 'amla',
    nameEnglish: 'Amla / Indian Gooseberry',
    nameOdia: 'ଅଁଳା',
    scientificName: 'Phyllanthus emblica',
    category: 'Medicinal Herbs',
    imagePath: '/products/amla.jpg',
    description: 'Dried whole wild amla fruit collected from Similipal forest valleys. Extremely dense in natural heat-stable ascorbic acid (Vitamin C) and bio-flavonoids, graded for clean pulp yield and minimal seed core.',
    benefits: ['Superior bio-available Vitamin C content', 'Primary ingredient in Chyawanprash and hair therapies', 'Zero sulfur bleaching; sun-dried on bamboo screens'],
    primaryBatchCode: 'BS-A-422',
    destinationDepotId: 'BRP-01',
    destinationDepotName: 'Baripada Central Depôt (Bay 04)',
    originBlock: 'Jashipur',
    originGramPanchayat: 'Matiagarh GP',
    shgSupplierName: 'Maa Mangala Mahila Samiti',
    qualityGrade: 'Grade A - Thick Pulp Slices',
    labCertifiedMoisturePercent: 11.2,
    storageBay: 'Bay 04 (Dry Timber Racks)',
    sealTagId: 'OD-MBJ-JAS-422',
    totalVerifiedStockKg: 140.0,
    allocatedStockKg: 0,
    availableStockKg: 140.0,
    officialMspRatePerKg: 32.0,
    b2bWholesaleRatePerKg: 38.0,
    b2bMinimumOrderKg: 50.0,
    b2bPackaging: {
      bagWeightKg: 50,
      packagingMaterial: '50kg Jute Bag with Hermetic Poly Liner',
      minimumOrderQuantityKg: 50,
      bulkDiscountPercent: 2.5,
    },
    b2cOptions: [
      {
        id: 'opt-amla-500g',
        sizeLabel: '500g Dry Slices',
        weightGrams: 500,
        priceInr: 38,
        stockUnits: 95,
        packagingDescription: 'UV-protective stand-up pouch',
      },
      {
        id: 'opt-amla-1kg',
        sizeLabel: '1 kg Pack',
        weightGrams: 1000,
        priceInr: 72,
        stockUnits: 65,
        packagingDescription: 'Heavy-gauge zip sealed bag',
      },
    ],
    isAvailableForB2B: true,
    isAvailableForB2C: true,
    harvestSeason: 'November to February',
  },
];

/**
 * Storage helpers for orders, RFQs, and settings
 */
const ORDERS_STORAGE_KEY = 'samagna_marketplace_orders';
const RFQS_STORAGE_KEY = 'samagna_marketplace_rfqs';
const CONFIG_STORAGE_KEY = 'samagna_commercial_config';

export function getStoredCommercialConfig(): CommercialRevenueConfig {
  if (typeof window === 'undefined') return DEFAULT_COMMERCIAL_CONFIG;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_COMMERCIAL_CONFIG;
    return { ...DEFAULT_COMMERCIAL_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_COMMERCIAL_CONFIG;
  }
}

export function saveStoredCommercialConfig(cfg: CommercialRevenueConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save commercial config:', e);
  }
}

export function getStoredMarketplaceOrders(): MarketplaceOrder[] {
  if (typeof window === 'undefined') return getInitialSampleOrders();
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleOrders();
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialSampleOrders();
  }
}

export function saveStoredMarketplaceOrder(order: MarketplaceOrder): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getStoredMarketplaceOrders();
    const existingIndex = orders.findIndex((o) => o.id === order.id);
    let updated: MarketplaceOrder[];
    if (existingIndex >= 0) {
      updated = [...orders];
      updated[existingIndex] = order;
    } else {
      updated = [order, ...orders];
    }
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save marketplace order:', e);
  }
}

export function getStoredMarketplaceRfqs(): MarketplaceQuotation[] {
  if (typeof window === 'undefined') return getInitialSampleRfqs();
  try {
    const raw = localStorage.getItem(RFQS_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleRfqs();
      localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialSampleRfqs();
  }
}

export function saveStoredMarketplaceRfq(rfq: MarketplaceQuotation): void {
  if (typeof window === 'undefined') return;
  try {
    const rfqs = getStoredMarketplaceRfqs();
    const existingIdx = rfqs.findIndex((r) => r.id === rfq.id);
    let updated: MarketplaceQuotation[];
    if (existingIdx >= 0) {
      updated = [...rfqs];
      updated[existingIdx] = rfq;
    } else {
      updated = [rfq, ...rfqs];
    }
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save RFQ:', e);
  }
}

/**
 * Deduct warehouse stock when a commercial marketplace order is placed.
 * Creates an official inventorySale in Dexie so the Warehouse manager sees it immediately!
 */
export async function reserveWarehouseStockForOrder(order: MarketplaceOrder): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { success: true, message: 'Server-side stub' };
  }

  try {
    const db = getDatabase();

    for (const item of order.items) {
      const saleId = generateULID();
      const idempotencyKey = generateULID();
      const saleRecord: InventorySaleRecord = {
        id: saleId,
        saleReference: order.orderNumber,
        produceName: item.productName,
        quantityKg: item.quantityKg,
        buyerName: order.buyer.companyName || order.buyer.name,
        destination: `${order.buyer.city}, ${order.buyer.state} (${order.buyerType} Order)`,
        salePricePerKg: item.unitPrice,
        totalAmount: item.grossAmount,
        depotId: item.depotId || 'BRP-01',
        actor: {
          id: 'COMMERCIAL_MARKETPLACE',
          name: 'SAMAGNA Commercial Desk',
          role: 'MARKETPLACE_GATEWAY',
        },
        notes: `Commercial ${order.buyerType} Allocation from Lot #${item.batchCode}. Commission: ₹${item.commissionAmount.toFixed(2)} (${item.commissionPercent}%)`,
        idempotencyKey,
        createdAt: Date.now(),
        syncState: 'queued',
      };

      await db.inventorySales.put(saleRecord);

      // Audit trail record for full government traceability
      await db.auditEvents.put({
        id: `aud-${Date.now()}-${item.batchCode}`,
        timestamp: new Date().toISOString(),
        actorId: 'COMMERCIAL_GATEWAY',
        actorName: 'SAMAGNA Marketplace Engine',
        actorRole: 'MARKETPLACE_ALLOCATOR',
        actionType: 'STOCK_SEPARATION_UPDATED',
        title: `Commercial Stock Reserved: ${order.orderNumber}`,
        description: `Reserved ${item.quantityKg} kg of ${item.productName} (Lot #${item.batchCode}) for ${order.buyer.companyName || order.buyer.name} (${order.buyerType}). MSP value fully preserved.`,
        details: {
          orderNumber: order.orderNumber,
          buyerType: order.buyerType,
          quantityKg: item.quantityKg,
          commissionEarned: item.commissionAmount,
          settlementAmount: item.sellerSettlementAmount,
        },
        isSimulatedBadge: 'Commercial Transaction',
      });
    }

    saveStoredMarketplaceOrder(order);
    return { success: true, message: 'Stock successfully reserved and linked to warehouse ledger.' };
  } catch (err: any) {
    console.error('Error reserving warehouse stock:', err);
    saveStoredMarketplaceOrder(order);
    return { success: false, message: err?.message || 'Could not write to local warehouse database.' };
  }
}

/**
 * Seed sample initial orders for evaluation and demonstration
 */
function getInitialSampleOrders(): MarketplaceOrder[] {
  return [
    {
      id: 'ord-b2b-001',
      orderNumber: 'ORD-B2B-2025-081',
      buyerType: 'B2B',
      buyer: {
        buyerType: 'B2B',
        name: 'Dr. Vivek Sharma (Procurement Head)',
        companyName: 'Dabur India Ayurvedic Sourcing Division',
        industry: 'AYURVEDIC_MEDICINE',
        gstin: '07AAACD1111A1Z5',
        pan: 'AAACD1111A',
        isVerifiedCompany: true,
        email: 'procurement.ayurveda@dabur.com',
        phone: '+91 98110-XXXXX',
        addressLine1: 'Dabur Plant 4, Sahibabad Industrial Area',
        city: 'Ghaziabad',
        district: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201010',
      },
      items: [
        {
          productId: 'MKT-MAHUA',
          productName: 'Dried Mahua Flowers',
          scientificName: 'Madhuca longifolia',
          batchCode: 'BS-400',
          depotId: 'BRP-01',
          depotName: 'Baripada Central Depôt (Bay 02)',
          buyerType: 'B2B',
          quantityKg: 50.0,
          packDescription: '1 x 50kg Jute Gunny Bag (Tamper-evident Seal)',
          unitPrice: 46.0,
          grossAmount: 2300.0,
          commissionPercent: 3.5,
          commissionAmount: 80.5,
          sellerSettlementAmount: 2219.5,
        },
      ],
      totalItemsKg: 50.0,
      totalGrossAmount: 2300.0,
      totalCommissionAmount: 80.5,
      totalSellerSettlement: 2219.5,
      effectiveCommissionRate: 3.5,
      shippingFee: 0,
      finalPayableAmount: 2300.0,
      primaryBatchCode: 'BS-400',
      verificationQrUrl: 'https://banasetu.odisha.gov.in/verify/BS-400',
      paymentMethod: 'CORPORATE_NEFT_RTGS',
      paymentStatus: 'PAID_DEMO',
      fulfillmentStatus: 'DISPATCHED',
      trackingTimeline: [
        {
          status: 'PENDING',
          timestamp: Date.now() - 86400000 * 2,
          title: 'Order Placed & Stock Reserved',
          description: '50.0 kg reserved from Lot #BS-400 at Baripada Central Depôt.',
          actor: 'Commercial Order Engine',
        },
        {
          status: 'APPROVED',
          timestamp: Date.now() - 86400000 * 1.5,
          title: 'Quality Compliance & GST Verified',
          description: 'GSTIN verified. Moisture reading certified at 8.4%.',
          actor: 'S. Das (Warehouse Inventory Manager)',
        },
        {
          status: 'DISPATCHED',
          timestamp: Date.now() - 86400000 * 0.5,
          title: 'Consignment Handed to Transit Logistics',
          description: 'Dispatched via Oditrans Fleet Vehicle #OD-11-AB-1234.',
          actor: 'Baripada Depôt Dispatch Desk',
        },
      ],
      invoiceNumber: 'INV-SMG-2025-081',
      createdAt: Date.now() - 86400000 * 2,
      notes: 'Standard contract procurement for botanical extraction.',
    },
    {
      id: 'ord-b2c-002',
      orderNumber: 'ORD-B2C-2025-104',
      buyerType: 'B2C',
      buyer: {
        buyerType: 'B2C',
        name: 'Ananya Mohapatra',
        email: 'ananya.mohapatra@gmail.com',
        phone: '+91 94370-XXXXX',
        addressLine1: 'Plot 214, Saheed Nagar',
        city: 'Bhubaneswar',
        district: 'Khurda',
        state: 'Odisha',
        pincode: '751007',
      },
      items: [
        {
          productId: 'MKT-HONEY',
          productName: 'Wild Forest Honey',
          scientificName: 'Apis dorsata comb nectar',
          batchCode: 'BS-W-410',
          depotId: 'BRP-01',
          depotName: 'Baripada Central Depôt (Bay 03)',
          buyerType: 'B2C',
          quantityKg: 1.0,
          packDescription: '2 x 500g Glass Jar',
          unitPrice: 235.0,
          grossAmount: 470.0,
          commissionPercent: 6.0,
          commissionAmount: 28.2,
          sellerSettlementAmount: 441.8,
        },
        {
          productId: 'MKT-CHIRONJI',
          productName: 'Chironji / Char Seeds',
          scientificName: 'Buchanania lanzan',
          batchCode: 'BS-C-412',
          depotId: 'BRP-01',
          depotName: 'Baripada Central Depôt (Bay 03)',
          buyerType: 'B2C',
          quantityKg: 0.5,
          packDescription: '1 x 500g Pouch',
          unitPrice: 160.0,
          grossAmount: 160.0,
          commissionPercent: 6.0,
          commissionAmount: 9.6,
          sellerSettlementAmount: 150.4,
        },
      ],
      totalItemsKg: 1.5,
      totalGrossAmount: 630.0,
      totalCommissionAmount: 37.8,
      totalSellerSettlement: 592.2,
      effectiveCommissionRate: 6.0,
      shippingFee: 50.0,
      finalPayableAmount: 680.0,
      primaryBatchCode: 'BS-W-410',
      verificationQrUrl: 'https://banasetu.odisha.gov.in/verify/BS-W-410',
      paymentMethod: 'UPI_DEMO',
      paymentStatus: 'PAID_DEMO',
      fulfillmentStatus: 'APPROVED',
      trackingTimeline: [
        {
          status: 'PENDING',
          timestamp: Date.now() - 3600000 * 5,
          title: 'Order Confirmed',
          description: 'Payment verified via simulated UPI gateway.',
          actor: 'SAMAGNA Pay Portal',
        },
        {
          status: 'APPROVED',
          timestamp: Date.now() - 3600000 * 2,
          title: 'Packed at Baripada Central Packaging Unit',
          description: 'Airtight glass jars sealed with QR batch stamps.',
          actor: 'Packaging Supervisor B. Nayak',
        },
      ],
      invoiceNumber: 'INV-SMG-2025-104',
      createdAt: Date.now() - 3600000 * 5,
    },
  ];
}

/**
 * Seed sample initial RFQs for evaluation and demonstration
 */
function getInitialSampleRfqs(): MarketplaceQuotation[] {
  return [
    {
      id: 'rfq-2025-001',
      rfqNumber: 'RFQ-SMG-2025-001',
      buyer: {
        buyerType: 'B2B',
        name: 'Suresh Singhania',
        companyName: 'Baidyanath Herbal Formulations Ltd',
        industry: 'AYURVEDIC_MEDICINE',
        gstin: '20AAACB2222B1Z4',
        pan: 'AAACB2222B',
        isVerifiedCompany: true,
        email: 'procurement@baidyanath-ayur.com',
        phone: '+91 93340-XXXXX',
        addressLine1: 'Baidyanath Industrial Complex, Baridih',
        city: 'Jamshedpur',
        district: 'East Singhbhum',
        state: 'Jharkhand',
        pincode: '831017',
      },
      produceName: 'Wild Forest Honey',
      batchCode: 'BS-W-410',
      requestedQuantityKg: 100.0,
      targetPricePerKg: 250.0,
      requestedDeliveryDate: '2025-04-10',
      status: 'QUOTED',
      quotedPricePerKg: 255.0,
      quotedCommissionPercent: 3.5,
      quotedTotalAmount: 25500.0,
      adminRemarks: 'Quotation approved at ₹255/kg based on verified moisture certificate (18.2%). Consignment ready in Baripada Bay 03.',
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'rfq-2025-002',
      rfqNumber: 'RFQ-SMG-2025-002',
      buyer: {
        buyerType: 'B2B',
        name: 'K. R. Venkatraman',
        companyName: 'Himalaya Wellness Herbal Extracts Unit',
        industry: 'PHARMACEUTICAL',
        gstin: '29AAACH3333C1Z3',
        pan: 'AAACH3333C',
        isVerifiedCompany: true,
        email: 'botanicals.sourcing@himalayawellness.com',
        phone: '+91 98450-XXXXX',
        addressLine1: 'Makali, Tumkur Road',
        city: 'Bengaluru',
        district: 'Bengaluru Rural',
        state: 'Karnataka',
        pincode: '562123',
      },
      produceName: 'Harida / Chebulic Myrobalan',
      batchCode: 'BS-H-420',
      requestedQuantityKg: 150.0,
      targetPricePerKg: 28.0,
      requestedDeliveryDate: '2025-04-15',
      status: 'UNDER_REVIEW',
      adminRemarks: 'Awaiting laboratory fungal analysis certification before dispatch quote confirmation.',
      createdAt: Date.now() - 86400000 * 1,
      updatedAt: Date.now() - 86400000 * 1,
    },
  ];
}

