/**
 * Samagna Consumer Marketplace
 * Domain Models, Seed Editorial Catalogue, Pricing Transparency & Workflow Engines
 */

export type ConsumerOrderStatus =
  | 'ORDER_PLACED_CONFIRMED'
  | 'PROCESSING_PACKED'
  | 'DISPATCHED_IN_TRANSIT'
  | 'DELIVERED_CONFIRMED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED_REFUNDED';

export type ConsumerGrievanceType =
  | 'DAMAGED_IN_TRANSIT'
  | 'SEAL_BROKEN'
  | 'QUALITY_DEFECT'
  | 'WRONG_ITEM_RECEIVED'
  | 'DELIVERY_DELAY'
  | 'OTHER';

export type ConsumerGrievanceStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REPLACEMENT_APPROVED'
  | 'REFUND_APPROVED'
  | 'REJECTED'
  | 'RESOLVED';

export type ConsumerProductCategory =
  | 'WILD_HONEY'
  | 'FOREST_SEEDS'
  | 'MEDICINAL_BOTANICALS'
  | 'NATURAL_EDIBLES';

export interface ConsumerProduct {
  id: string;
  slug: string;
  title: string;
  odiaName: string;
  scientificName: string;
  category: ConsumerProductCategory;
  categoryLabel: string;
  heroImage: string;
  galleryImages: string[];
  tagline: string;
  story: string;
  sellerOrg: {
    id: string;
    name: string;
    type: string;
    district: string;
    registrationNumber: string;
    fssaiLicense: string;
  };
  intermediaryDisclosure: string;
  harvestCluster: string;
  harvestSeason: string;
  traditionalPractice: string;
  packaging: {
    type: string;
    netQuantity: string;
    weightGrams: number;
    materialDescription: string;
    tamperEvidentSeal: boolean;
  };
  pricing: {
    mrpInr: number;
    fairTradeMspShareInr: number;
    packagingAndTestingShareInr: number;
    logisticsShareInr: number;
    platformFeeInr: number; // 0.0 in pilot
  };
  stock: {
    totalOnHandUnits: number;
    availableUnits: number;
    allocatedUnits: number;
    isAvailable: boolean;
  };
  compliance: {
    fssaiLicenseNumber: string;
    labPurityCertificateRef: string;
    labPurityDetails: string;
    isVerifiedEvidence: boolean;
    lotReference: string;
    batchVerificationUrl: string;
  };
  dietaryAndAttributes: string[];
  storageInstructions: string;
  shelfLifeMonths: number;
}

export interface ConsumerOrderItem {
  productId: string;
  productSlug: string;
  productTitle: string;
  quantityUnits: number;
  unitPriceInr: number;
  totalPriceInr: number;
  packDescription: string;
  sourceLotReference: string;
  fairTradeCollectorShareInr: number;
}

export interface ConsumerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  lineItems: ConsumerOrderItem[];
  totalUnits: number;
  subtotalInr: number;
  shippingFeeInr: number;
  discountInr: number;
  totalPayableInr: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: ConsumerOrderStatus;
  primaryLotReference: string;
  trackingConsignmentRef?: string | null;
  timeline: Array<{
    status: ConsumerOrderStatus;
    timestamp: string;
    title: string;
    description: string;
    actor: string;
  }>;
  cancellationReason?: string | null;
  cancelledAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumerGrievance {
  id: string;
  ticketNumber: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  grievanceType: ConsumerGrievanceType;
  description: string;
  evidenceDocUrl?: string | null;
  status: ConsumerGrievanceStatus;
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ==========================================
// Seed Consumer Products (Editorial Quality)
// ==========================================

export const SEED_CONSUMER_PRODUCTS: ConsumerProduct[] = [
  {
    id: 'PROD-HONEY-500G',
    slug: 'mayurbhanj-wild-honey-500g',
    title: 'Mayurbhanj Wild Multifloral Raw Forest Honey',
    odiaName: 'ମୟୂରଭଞ୍ଜ ପ୍ରାକୃତିକ ଜଙ୍ଗଲ ମହୁ',
    scientificName: 'Apis dorsata comb nectar',
    category: 'WILD_HONEY',
    categoryLabel: 'Wild Honey & Nectars',
    heroImage: '/products/honey.jpg',
    galleryImages: ['/products/honey.jpg', '/products/honey-detail.jpg'],
    tagline: 'Raw, unpasteurized cliff honey harvested from the deep sal forest canopies of Similipal.',
    story: 'Harvested under nocturnal smoke repellents from towering cliff faces and sal crowns in the pristine buffer zones of Similipal Biosphere Reserve. Gathered with multi-generational tribal reverence preserving bee brood integrity.',
    sellerOrg: {
      id: 'PRT-MAYUR-01',
      name: 'Karanjia Tribal Mahila Forest Produce Federation',
      type: 'Women Self-Help Group Federation',
      district: 'Mayurbhanj',
      registrationNumber: 'OR-MAYUR-SHG-2018-092',
      fssaiLicense: '12023999000124',
    },
    intermediaryDisclosure: 'Gathered by Santhal and Kolha tribal honey gatherers; aggregated, gravity-filtered, and tested at the Karanjia TDCCOL Complex; packaged under FSSAI-compliant cleanroom conditions.',
    harvestCluster: 'Karanjia Buffer Zone, Similipal Biosphere Reserve',
    harvestSeason: 'Spring Multifloral Bloom (March - May 2025)',
    traditionalPractice: 'Nocturnal cliff climb with herbal smoke repellent; non-destructive lower-comb harvest.',
    packaging: {
      type: 'Glass Jar',
      netQuantity: '500 g',
      weightGrams: 500.0,
      materialDescription: 'Lead-free amber flint glass jar with food-grade induction heat seal; 100% recyclable outer carton.',
      tamperEvidentSeal: true,
    },
    pricing: {
      mrpInr: 380.0,
      fairTradeMspShareInr: 210.0, // Primary gatherer MSP guarantee
      packagingAndTestingShareInr: 110.0, // SHG filtering, induction jar, lab NMR assay
      logisticsShareInr: 60.0, // Temperature-controlled transport
      platformFeeInr: 0.0, // Waived in pilot
    },
    stock: {
      totalOnHandUnits: 480,
      availableUnits: 420,
      allocatedUnits: 60,
      isAvailable: true,
    },
    compliance: {
      fssaiLicenseNumber: '12023999000124',
      labPurityCertificateRef: 'QC-LAB-2025-HONEY-08',
      labPurityDetails: 'State Food Testing Lab, Cuttack certified: 0% added invert sugar, moisture 17.8%, pollen count > 25,000/g.',
      isVerifiedEvidence: true,
      lotReference: 'LOT-VAL-HONEY-2025-01',
      batchVerificationUrl: 'https://samagna.gov.in/verify/LOT-VAL-HONEY-2025-01',
    },
    dietaryAndAttributes: ['100% Pure Raw', 'Unpasteurized', 'Zero High-Fructose Corn Syrup', 'FSSAI Certified'],
    storageInstructions: 'Store at room temperature in a dry place away from direct sunlight. Do not refrigerate. Natural crystallization confirms purity.',
    shelfLifeMonths: 24,
  },
  {
    id: 'PROD-MAHUA-250G',
    slug: 'similipal-dried-mahua-blossoms',
    title: 'Similipal Sun-Dried Mahua Blossom Petals',
    odiaName: 'ସିମିଳିପାଳ ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia var. latifolia',
    category: 'NATURAL_EDIBLES',
    categoryLabel: 'Forest Edibles & Flowers',
    heroImage: '/products/mahua.jpg',
    galleryImages: ['/products/mahua.jpg'],
    tagline: 'Naturally sweet forest blossom petals hand-gathered at dawn and solar poly-tunnel dried.',
    story: 'In early spring, mature Mahua trees shed fragrant golden blossoms at dawn. Tribal families sweep the cleared forest floors beneath the canopies, collecting pure fallen petals for nutritious culinary use and natural sweetening.',
    sellerOrg: {
      id: 'PRT-SIMIL-02',
      name: 'Mayurbhanj Forest Producer Company Ltd (MFPCL)',
      type: 'Tribal Producer Company',
      district: 'Mayurbhanj',
      registrationNumber: 'U01100OR2021PTC035412',
      fssaiLicense: '12022999000881',
    },
    intermediaryDisclosure: 'Gathered by Bathudi and Munda forest-dwelling communities; solar-dried in hygienic poly-tunnels by Karanjia SHGs; packaged by MFPCL.',
    harvestCluster: 'Keonjhar Border Buffer Tracts, Similipal Reserve',
    harvestSeason: 'Spring Dawn Bloom (March - April 2025)',
    traditionalPractice: 'Dawn gathering on swept forest ground; dust-free solar dehydration.',
    packaging: {
      type: 'Standup Kraft Pouch',
      netQuantity: '250 g',
      weightGrams: 250.0,
      materialDescription: 'Multi-barrier eco-kraft paper pouch with airtight resealable zip closure.',
      tamperEvidentSeal: true,
    },
    pricing: {
      mrpInr: 185.0,
      fairTradeMspShareInr: 95.0,
      packagingAndTestingShareInr: 55.0,
      logisticsShareInr: 35.0,
      platformFeeInr: 0.0,
    },
    stock: {
      totalOnHandUnits: 360,
      availableUnits: 310,
      allocatedUnits: 50,
      isAvailable: true,
    },
    compliance: {
      fssaiLicenseNumber: '12022999000881',
      labPurityCertificateRef: 'QC-LAB-2025-MAH-02',
      labPurityDetails: 'OUAT Food Testing Lab certified: Aflatoxin-free, natural sucrose/fructose 68%, moisture 8.2%.',
      isVerifiedEvidence: true,
      lotReference: 'BS-401',
      batchVerificationUrl: 'https://samagna.gov.in/verify/BS-401',
    },
    dietaryAndAttributes: ['Natural Plant Sweetener', 'Rich in Iron & Calcium', 'Zero Preservatives', 'Vegan'],
    storageInstructions: 'Store in an airtight container in a cool, dry place. Reseal tightly after each use.',
    shelfLifeMonths: 12,
  },
  {
    id: 'PROD-CHIRONJI-500G',
    slug: 'similipal-wild-chironji-nuts',
    title: 'Wild Chironji (Char Nut Kernels) Hand-Decorticated',
    odiaName: 'ପ୍ରାକୃତିକ ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    category: 'FOREST_SEEDS',
    categoryLabel: 'Forest Seeds & Nuts',
    heroImage: '/products/chironji.jpg',
    galleryImages: ['/products/chironji.jpg'],
    tagline: 'Delicate, almond-flavoured wild char seeds collected from deciduous forest hills.',
    story: 'Wild Chironji trees grow naturally in the dry deciduous foothills of Mayurbhanj. Gatherers hand-pick the fallen fruit, wash off the outer pulp, and delicately crack the hard seed coats by hand.',
    sellerOrg: {
      id: 'PRT-SIMIL-02',
      name: 'Mayurbhanj Forest Producer Company Ltd (MFPCL)',
      type: 'Tribal Producer Company',
      district: 'Mayurbhanj',
      registrationNumber: 'U01100OR2021PTC035412',
      fssaiLicense: '12022999000881',
    },
    intermediaryDisclosure: 'Gathered by tribal primary gatherers; graded and manual stone-decorticated by Mayurbhanj women cooperatives.',
    harvestCluster: 'Mayurbhanj Foothills Deciduous Ridge',
    harvestSeason: 'Early Summer (April - May 2025)',
    traditionalPractice: 'Selective collection of ripe fallen drupes; gentle manual stone cracking.',
    packaging: {
      type: 'Glass Jar',
      netQuantity: '500 g',
      weightGrams: 500.0,
      materialDescription: 'Food-grade glass jar with vacuum seal and moisture barrier.',
      tamperEvidentSeal: true,
    },
    pricing: {
      mrpInr: 490.0,
      fairTradeMspShareInr: 290.0,
      packagingAndTestingShareInr: 130.0,
      logisticsShareInr: 70.0,
      platformFeeInr: 0.0,
    },
    stock: {
      totalOnHandUnits: 200,
      availableUnits: 175,
      allocatedUnits: 25,
      isAvailable: true,
    },
    compliance: {
      fssaiLicenseNumber: '12022999000881',
      labPurityCertificateRef: 'QC-LAB-2025-CHR-04',
      labPurityDetails: 'State Food Testing Lab certified: 0% adulteration, protein content 19.5%, high oleic acid profile.',
      isVerifiedEvidence: true,
      lotReference: 'BS-C-412',
      batchVerificationUrl: 'https://samagna.gov.in/verify/BS-C-412',
    },
    dietaryAndAttributes: ['High Protein Nut', 'Natural Brain Tonic', 'Raw & Unsalted', 'Gluten Free'],
    storageInstructions: 'Keep in an airtight jar in a cool, dark pantry or refrigerate after opening to preserve delicate essential oils.',
    shelfLifeMonths: 9,
  },
  {
    id: 'PROD-HARIDA-250G',
    slug: 'similipal-sun-cured-harida',
    title: 'Sun-Cured Whole Harida (Chebulic Myrobalan)',
    odiaName: 'ସିମିଳିପାଳ ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    category: 'MEDICINAL_BOTANICALS',
    categoryLabel: 'Medicinal & Ayurvedic Botanicals',
    heroImage: '/products/harida.jpg',
    galleryImages: ['/products/harida.jpg'],
    tagline: 'Ancient revered Ayurvedic botanical for digestive wellness and vitality.',
    story: 'Known as the King of Medicines in traditional medicine, Harida fruits are ethically foraged from wild trees growing high on Mayurbhanj mountain ridges when fully ripened.',
    sellerOrg: {
      id: 'PRT-MAYUR-01',
      name: 'Karanjia Tribal Mahila Forest Produce Federation',
      type: 'Women Self-Help Group Federation',
      district: 'Mayurbhanj',
      registrationNumber: 'OR-MAYUR-SHG-2018-092',
      fssaiLicense: '12023999000124',
    },
    intermediaryDisclosure: 'Gathered by Mayurbhanj tribal gatherers; sorted, washed, and shade-cured by Karanjia Mahila SHG.',
    harvestCluster: 'Similipal South Ridge, Mayurbhanj',
    harvestSeason: 'Winter Harvest (November - January 2025)',
    traditionalPractice: 'Manual harvesting of golden mature drupes; hygienic solar-curing.',
    packaging: {
      type: 'Kraft Pouch',
      netQuantity: '250 g',
      weightGrams: 250.0,
      materialDescription: 'Biodegradable kraft paper pouch with food-safe moisture lining.',
      tamperEvidentSeal: true,
    },
    pricing: {
      mrpInr: 120.0,
      fairTradeMspShareInr: 65.0,
      packagingAndTestingShareInr: 35.0,
      logisticsShareInr: 20.0,
      platformFeeInr: 0.0,
    },
    stock: {
      totalOnHandUnits: 250,
      availableUnits: 220,
      allocatedUnits: 30,
      isAvailable: true,
    },
    compliance: {
      fssaiLicenseNumber: '12023999000124',
      labPurityCertificateRef: 'QC-LAB-2025-HRD-01',
      labPurityDetails: 'Microbial assay certified: Tannin content > 32%, moisture 9.4%.',
      isVerifiedEvidence: true,
      lotReference: 'LOT-PROC-HARIDA-2025-01',
      batchVerificationUrl: 'https://samagna.gov.in/verify/LOT-PROC-HARIDA-2025-01',
    },
    dietaryAndAttributes: ['Key Triphala Ingredient', 'Natural Antioxidant', 'Non-GMO', 'Wild Harvested'],
    storageInstructions: 'Store in a cool dry place away from moisture.',
    shelfLifeMonths: 24,
  },
  {
    id: 'PROD-OUT-OF-STOCK',
    slug: 'rare-wild-black-honey',
    title: 'Similipal Rare Deep-Canopy Wild Black Honey (Seasonal)',
    odiaName: 'ଦୁର୍ଲଭ କଳା ମହୁ',
    scientificName: 'Apis dorsata high-altitude nectar',
    category: 'WILD_HONEY',
    categoryLabel: 'Wild Honey & Nectars',
    heroImage: '/products/honey.jpg',
    galleryImages: ['/products/honey.jpg'],
    tagline: 'Ultra-rare dark forest honey with intense mineral depth. Harvested once a year.',
    story: 'Harvested exclusively from high-altitude ancient trees in the core biosphere zone during late autumn. Highly limited batch.',
    sellerOrg: {
      id: 'PRT-MAYUR-01',
      name: 'Karanjia Tribal Mahila Forest Produce Federation',
      type: 'Women Self-Help Group Federation',
      district: 'Mayurbhanj',
      registrationNumber: 'OR-MAYUR-SHG-2018-092',
      fssaiLicense: '12023999000124',
    },
    intermediaryDisclosure: 'Collected by Santhal indigenous gatherers; tested and packed by Karanjia SHG.',
    harvestCluster: 'Core Biosphere Zone, Similipal',
    harvestSeason: 'Late Autumn (November 2024)',
    traditionalPractice: 'Nocturnal tree cut; brood-conserving extraction.',
    packaging: {
      type: 'Glass Jar',
      netQuantity: '250 g',
      weightGrams: 250.0,
      materialDescription: 'Flint glass jar with tamper seal.',
      tamperEvidentSeal: true,
    },
    pricing: {
      mrpInr: 450.0,
      fairTradeMspShareInr: 280.0,
      packagingAndTestingShareInr: 110.0,
      logisticsShareInr: 60.0,
      platformFeeInr: 0.0,
    },
    stock: {
      totalOnHandUnits: 0,
      availableUnits: 0, // OUT OF STOCK
      allocatedUnits: 0,
      isAvailable: false,
    },
    compliance: {
      fssaiLicenseNumber: '12023999000124',
      labPurityCertificateRef: 'QC-LAB-2024-BLKHONEY-01',
      labPurityDetails: 'NMR verified purity; zero adulterants.',
      isVerifiedEvidence: true,
      lotReference: 'LOT-BLK-HONEY-2024',
      batchVerificationUrl: 'https://samagna.gov.in/verify/LOT-BLK-HONEY-2024',
    },
    dietaryAndAttributes: ['Limited Biosphere Reserve Batch', 'High Phenolic Content'],
    storageInstructions: 'Room temperature storage.',
    shelfLifeMonths: 24,
  },
];

// ==========================================
// Seed Consumer Orders & Grievances
// ==========================================

export const SEED_CONSUMER_ORDERS: ConsumerOrder[] = [
  {
    id: 'ORD-SEED-001',
    orderNumber: 'ORD-SMG-2025-0001',
    customerName: 'Ananya Mohapatra',
    customerEmail: 'ananya.mohapatra@gmail.com',
    customerPhone: '+91-9437012345',
    shippingAddress: {
      street: 'Plot 214, Saheed Nagar',
      city: 'Bhubaneswar',
      district: 'Khurda',
      state: 'Odisha',
      pincode: '751007',
    },
    lineItems: [
      {
        productId: 'PROD-HONEY-500G',
        productSlug: 'mayurbhanj-wild-honey-500g',
        productTitle: 'Mayurbhanj Wild Multifloral Raw Forest Honey (500g Glass Jar)',
        quantityUnits: 2,
        unitPriceInr: 380.0,
        totalPriceInr: 760.0,
        packDescription: '500g Glass Jar with Induction Seal',
        sourceLotReference: 'LOT-VAL-HONEY-2025-01',
        fairTradeCollectorShareInr: 420.0,
      },
    ],
    totalUnits: 2,
    subtotalInr: 760.0,
    shippingFeeInr: 0.0, // Free delivery above ₹500
    discountInr: 0.0,
    totalPayableInr: 760.0,
    paymentMethod: 'DEMO_COMMERCIAL_GATEWAY',
    paymentStatus: 'PAID_DEMO',
    orderStatus: 'DELIVERED_CONFIRMED',
    primaryLotReference: 'LOT-VAL-HONEY-2025-01',
    trackingConsignmentRef: 'SHP-MAYUR-2025-001',
    timeline: [
      {
        status: 'ORDER_PLACED_CONFIRMED',
        timestamp: '2025-04-12T10:15:00Z',
        title: 'Order Confirmed',
        description: 'Payment authorized via demo commercial gateway; stock reserved from Lot LOT-VAL-HONEY-2025-01.',
        actor: 'Samagna Commerce Gateway',
      },
      {
        status: 'PROCESSING_PACKED',
        timestamp: '2025-04-12T14:30:00Z',
        title: 'Packed at Karanjia Central Depot',
        description: 'Airtight amber glass jars sealed with batch QR tags.',
        actor: 'Packaging Incharge (Karanjia Depot)',
      },
      {
        status: 'DISPATCHED_IN_TRANSIT',
        timestamp: '2025-04-13T09:00:00Z',
        title: 'Dispatched via Oditrans Fleet',
        description: 'Handed over to carrier OD State Transport under Waybill #EWB-2110-8849-3012.',
        actor: 'Logistics Desk',
      },
      {
        status: 'DELIVERED_CONFIRMED',
        timestamp: '2025-04-14T16:45:00Z',
        title: 'Delivered to Customer',
        description: 'Signed and delivered at Saheed Nagar, Bhubaneswar.',
        actor: 'Delivery Agent',
      },
    ],
    deliveredAt: '2025-04-14T16:45:00Z',
    createdAt: '2025-04-12T10:15:00Z',
    updatedAt: '2025-04-14T16:45:00Z',
  },
  {
    id: 'ORD-SEED-002',
    orderNumber: 'ORD-SMG-2025-0002',
    customerName: 'Debabrata Pradhan',
    customerEmail: 'd.pradhan@techcorp.in',
    customerPhone: '+91-9861002233',
    shippingAddress: {
      street: 'Flat 4B, Utkal Heights, Pahala',
      city: 'Bhubaneswar',
      district: 'Khurda',
      state: 'Odisha',
      pincode: '752101',
    },
    lineItems: [
      {
        productId: 'PROD-MAHUA-250G',
        productSlug: 'similipal-dried-mahua-blossoms',
        productTitle: 'Similipal Sun-Dried Mahua Blossom Petals (250g Pouch)',
        quantityUnits: 2,
        unitPriceInr: 185.0,
        totalPriceInr: 370.0,
        packDescription: '250g Standup Kraft Pouch',
        sourceLotReference: 'BS-401',
        fairTradeCollectorShareInr: 190.0,
      },
    ],
    totalUnits: 2,
    subtotalInr: 370.0,
    shippingFeeInr: 50.0, // Standard eco-freight below ₹500
    discountInr: 0.0,
    totalPayableInr: 420.0,
    paymentMethod: 'DEMO_UPI',
    paymentStatus: 'PAID_DEMO',
    orderStatus: 'ORDER_PLACED_CONFIRMED',
    primaryLotReference: 'BS-401',
    timeline: [
      {
        status: 'ORDER_PLACED_CONFIRMED',
        timestamp: '2025-04-20T11:00:00Z',
        title: 'Order Confirmed',
        description: 'Order placed; inventory reserved in Baripada Central Warehouse.',
        actor: 'Samagna Commerce Gateway',
      },
    ],
    createdAt: '2025-04-20T11:00:00Z',
    updatedAt: '2025-04-20T11:00:00Z',
  },
];

export const SEED_CONSUMER_GRIEVANCES: ConsumerGrievance[] = [
  {
    id: 'GRV-SEED-001',
    ticketNumber: 'GRV-2025-001',
    orderId: 'ORD-SEED-001',
    orderNumber: 'ORD-SMG-2025-0001',
    customerEmail: 'ananya.mohapatra@gmail.com',
    grievanceType: 'SEAL_BROKEN',
    description: 'One of the outer tamper-evident induction seals had a slight hairline tear upon delivery inspection.',
    evidenceDocUrl: '/docs/grievances/seal-tear-evidence.jpg',
    status: 'RESOLVED',
    resolutionNotes: 'Customer support verified incident; complimentary replacement jar dispatched with priority seal audit.',
    createdAt: '2025-04-15T09:30:00Z',
    resolvedAt: '2025-04-16T11:00:00Z',
  },
];

// ==========================================
// Commerce Invariants & Financial Engines
// ==========================================

export function calculateConsumerOrderPricing(
  items: Array<{ unitPriceInr: number; quantityUnits: number; fairTradeMspShareInr?: number }>
) {
  let subtotalInr = 0;
  let totalUnits = 0;
  let totalFairTradeMspShareInr = 0;

  for (const item of items) {
    subtotalInr += item.unitPriceInr * item.quantityUnits;
    totalUnits += item.quantityUnits;
    if (item.fairTradeMspShareInr) {
      totalFairTradeMspShareInr += item.fairTradeMspShareInr * item.quantityUnits;
    }
  }

  // Free carbon-neutral shipping on orders >= ₹500, otherwise ₹50 flat rate
  const shippingFeeInr = subtotalInr >= 500 || subtotalInr === 0 ? 0.0 : 50.0;
  const discountInr = 0.0;
  const totalPayableInr = subtotalInr + shippingFeeInr - discountInr;
  const platformFeeInr = 0.0; // Strict 0.0% pilot invariant

  return {
    subtotalInr,
    totalUnits,
    shippingFeeInr,
    discountInr,
    totalPayableInr,
    platformFeeInr,
    totalFairTradeMspShareInr,
  };
}

export function canCustomerCancelOrder(status: ConsumerOrderStatus): boolean {
  // Only unfulfilled orders (not yet handed to transit carrier or delivered) can be cancelled directly
  return status === 'ORDER_PLACED_CONFIRMED' || status === 'PROCESSING_PACKED';
}

export function canCustomerSubmitGrievance(status: ConsumerOrderStatus): boolean {
  // Grievances apply to orders that have been dispatched, delivered, or return-requested
  return (
    status === 'DISPATCHED_IN_TRANSIT' ||
    status === 'DELIVERED_CONFIRMED' ||
    status === 'RETURN_REQUESTED'
  );
}

