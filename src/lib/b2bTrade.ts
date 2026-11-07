/**
 * SAMAGNA Phase 3: B2B Bulk Trade Platform
 * Data models, catalogue specifications, verification statuses, and trade lifecycles.
 *
 * Invariants:
 * 1. Only verified businesses ('VERIFIED_ACTIVE') have trading clearance.
 * 2. Only stock with verified statutory clearance ('isStatutoryClearanceVerified: true') can be listed.
 * 3. Double-selling prevented via TradeAllocationLock on quotation issuance.
 * 4. 100% MSP to primary collectors; platform service fee rate = 0.0 in pilot.
 * 5. Authentic botanical identity and commercial grades; zero invented certifications.
 */

export type TradeOrgType =
  | 'MANUFACTURER'
  | 'BULK_BUYER'
  | 'WHOLESALER'
  | 'PROCESSOR'
  | 'PRODUCER_ORGANISATION'
  | 'AUTHORISED_SUPPLIER'
  | 'STATE_AGENCY';

export type TradeVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED_ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export type RfqLifecycleStatus =
  | 'SUBMITTED'
  | 'SELLER_REVIEW'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PO_CREATED';

export type PurchaseOrderStatus =
  | 'ISSUED'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TradeBusinessProfile {
  id: string; // e.g. "BUS-DABUR-01"
  companyName: string;
  tradeName?: string | null;
  businessType: TradeOrgType;
  registrationNumber: string;
  gstin?: string | null;
  pan: string;
  fssaiLicense?: string | null;
  ayushLicense?: string | null;
  verificationStatus: TradeVerificationStatus;
  verificationNotes?: string | null;
  registeredAddress: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  authorizedContactName: string;
  contactEmail: string;
  contactPhone: string;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumberEnding?: string | null;
  ifscCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeListing {
  id: string; // e.g. "LIST-MAHUA-2025-01"
  sellerOrgId: string;
  sellerOrgName?: string;
  produceSlug: string;
  produceName: string;
  scientificName?: string | null;
  qualityGrade: string; // e.g. "Grade 1 / Premium", "FAQ"
  totalLotQuantityKg: number;
  allocatedQuantityKg: number;
  availableQuantityKg: number;
  minimumOrderQuantityKg: number;
  indicativePricePerKg: number;
  depotFacilityId: string;
  storageBayLocation?: string | null;
  warehouseBatchRef: string; // e.g. "BS-402"
  lotSaleAuthorizationRef: string; // e.g. "AUTH-DPO-2025-001"
  authorizingOfficer: string;
  isStatutoryClearanceVerified: boolean;
  availabilityStartDate: string;
  availabilityEndDate: string;
  isActive: boolean;
  labReportUrl?: string | null;
  inspectionCertificateRef?: string | null;
  packagingDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeRfq {
  id: string; // e.g. "RFQ-2025-001"
  rfqNumber: string; // e.g. "RFQ-B2B-2025-001"
  buyerOrgId: string;
  buyerOrgName?: string;
  listingId?: string | null;
  produceSlug: string;
  produceName: string;
  requestedGrade: string;
  requestedQuantityKg: number;
  deliveryLocation: string;
  targetDeliveryDate: string;
  packagingRequirements?: string | null;
  buyerNotes?: string | null;
  status: RfqLifecycleStatus;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeQuotation {
  id: string; // e.g. "QUOT-2025-001"
  quotationNumber: string; // e.g. "QUOT-B2B-2025-001"
  rfqId: string;
  sellerOrgId: string;
  sellerOrgName?: string;
  listingId?: string | null;
  quotedPricePerKg: number;
  minimumOrderQuantityKg: number;
  quotedTotalAmount: number;
  deliveryTimelineDays: number;
  deliveryTerms: string;
  paymentTerms: string;
  validUntil: string;
  sellerRemarks?: string | null;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TradeAllocationLock {
  id: string;
  listingId: string;
  quotationId?: string | null;
  reservedQuantityKg: number;
  lockExpiresAt: string;
  isCommitted: boolean;
  isReleased: boolean;
  createdAt: string;
}

export interface TradeAuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}

export interface TradePurchaseOrder {
  id: string; // e.g. "PO-2025-001"
  poNumber: string; // e.g. "PO-B2B-2025-001"
  buyerOrgId: string;
  buyerOrgName?: string;
  sellerOrgId: string;
  sellerOrgName?: string;
  rfqId: string;
  quotationId: string;
  produceName: string;
  scientificName?: string | null;
  qualityGrade: string;
  quantityKg: number;
  agreedPricePerKg: number;
  totalOrderAmount: number;
  deliveryTerms: string;
  deliveryAddress: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus;
  eWaybillNumber?: string | null;
  qualityInspectionCertRef?: string | null;
  auditHistory: TradeAuditLogEntry[];
  platformServiceFeeRate: number; // 0.0 in pilot
  createdAt: string;
  updatedAt: string;
}

export interface B2BProductCatalogueItem {
  slug: string;
  nameEnglish: string;
  nameOdia: string;
  scientificName: string;
  botanicalFamily: string;
  category: 'Non-Timber Forest Produce' | 'Oilseed' | 'Gum & Resin' | 'Medicinal Flora';
  availableGrades: string[];
  standardUom: string;
  baselineMoistureMaxPercent: number;
  maxForeignMatterPercent: number;
  primaryOriginDistricts: string[];
  standardPackaging: string;
  requiredDocuments: string[];
  indicativeBenchmarkRatePerKg: number;
  description: string;
}

/**
 * Verified B2B Product Catalogue for 17 Odisha Forest Commodities.
 * Authentic botanical identity, physical grades, and testing criteria.
 */
export const B2B_STRUCTURED_CATALOGUE: B2BProductCatalogueItem[] = [
  {
    slug: 'mahua',
    nameEnglish: 'Dried Mahua Flowers',
    nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    botanicalFamily: 'Sapotaceae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Premium', 'Grade 2 / Standard', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 12.0,
    maxForeignMatterPercent: 1.5,
    primaryOriginDistricts: ['Mayurbhanj', 'Sundargarh', 'Keonjhar', 'Koraput'],
    standardPackaging: '50kg Jute Gunny Bag (Double Stitched)',
    requiredDocuments: ['Certificate of Origin', 'Moisture Test Slip', 'TDCCOL Lot Release Note'],
    indicativeBenchmarkRatePerKg: 42.0,
    description: 'Sun-dried natural fleshy corollas gathered from forest reserves with sugar and saponin content intact.',
  },
  {
    slug: 'sal-seeds',
    nameEnglish: 'Sal Tree Seeds',
    nameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    botanicalFamily: 'Dipterocarpaceae',
    category: 'Oilseed',
    availableGrades: ['Grade 1 / Industrial Oil Grade', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 2.0,
    primaryOriginDistricts: ['Mayurbhanj', 'Keonjhar', 'Sambalpur', 'Deogarh'],
    standardPackaging: '50kg Jute Gunny Bag',
    requiredDocuments: ['Certificate of Origin', 'Depot Weighment Slip'],
    indicativeBenchmarkRatePerKg: 28.0,
    description: 'Decorticated winged seeds suitable for vegetable fat extraction and confectionery butter substitution.',
  },
  {
    slug: 'kendu-leaves',
    nameEnglish: 'Kendu Leaves',
    nameOdia: 'କେନ୍ଦୁ ପତ୍ର',
    scientificName: 'Diospyros melanoxylon',
    botanicalFamily: 'Ebenaceae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Export Grade', 'Grade 2 / Standard', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 11.0,
    maxForeignMatterPercent: 0.5,
    primaryOriginDistricts: ['Sambalpur', 'Bolangir', 'Kalahandi', 'Boudh'],
    standardPackaging: '100-leaf Plucked Kerri / Bundle in Hessian Wrapping',
    requiredDocuments: ['OFDC / Forest Transit Permit', 'Phytosanitary Clearance'],
    indicativeBenchmarkRatePerKg: 55.0,
    description: 'Selected air-cured forest leaves harvested under Odisha statutory regulation with high elasticity.',
  },
  {
    slug: 'tamarind-seeded',
    nameEnglish: 'Seeded Tamarind',
    nameOdia: 'ମଞ୍ଜି ଥିବା ତେନ୍ତୁଳି',
    scientificName: 'Tamarindus indica',
    botanicalFamily: 'Fabaceae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Premium Red Pulp', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 14.0,
    maxForeignMatterPercent: 2.0,
    primaryOriginDistricts: ['Koraput', 'Rayagada', 'Nabarangpur', 'Malkangiri'],
    standardPackaging: '40kg Jute Bag with Polythene Lining',
    requiredDocuments: ['Certificate of Origin', 'Quality Verification Record'],
    indicativeBenchmarkRatePerKg: 36.0,
    description: 'Whole ripe tamarind pods de-shelled with natural tartaric acidity preserved.',
  },
  {
    slug: 'harida',
    nameEnglish: 'Haritaki (Harida)',
    nameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    botanicalFamily: 'Combretaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Whole Bold', 'Grade 2 / Standard', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 1.0,
    primaryOriginDistricts: ['Kandhamal', 'Koraput', 'Rayagada'],
    standardPackaging: '40kg HDPE Lined Gunny Bag',
    requiredDocuments: ['Certificate of Origin', 'Moisture Analysis Certificate', 'AYUSH Raw Material Clearance'],
    indicativeBenchmarkRatePerKg: 35.0,
    description: 'Dried whole myrobalan fruits rich in hydrolysable tannins, fundamental for Ayurvedic Triphala.',
  },
  {
    slug: 'bahada',
    nameEnglish: 'Bibhitaki (Bahada)',
    nameOdia: 'ବାହାଡ଼ା',
    scientificName: 'Terminalia bellirica',
    botanicalFamily: 'Combretaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Whole Bold', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 11.0,
    maxForeignMatterPercent: 1.5,
    primaryOriginDistricts: ['Kandhamal', 'Mayurbhanj', 'Ganjam'],
    standardPackaging: '40kg Gunny Bag',
    requiredDocuments: ['Certificate of Origin', 'Moisture Test Slip'],
    indicativeBenchmarkRatePerKg: 30.0,
    description: 'Dried fruits with high gallic acid and tannin content, harvested from deciduous forest belts.',
  },
  {
    slug: 'amla-dry',
    nameEnglish: 'Dried Wild Amla',
    nameOdia: 'ଶୁଖିଲା ଅଁଳା',
    scientificName: 'Phyllanthus emblica',
    botanicalFamily: 'Phyllanthaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Segmented Seedless', 'FAQ Seeded'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 1.0,
    primaryOriginDistricts: ['Kandhamal', 'Koraput', 'Mayurbhanj'],
    standardPackaging: '25kg Polypropylene Lined Bag',
    requiredDocuments: ['Certificate of Origin', 'Ascorbic Acid Baseline Analysis'],
    indicativeBenchmarkRatePerKg: 65.0,
    description: 'Sun-dried forest emblic gooseberry segments preserved without chemical treatment.',
  },
  {
    slug: 'chironji',
    nameEnglish: 'Chironji / Char Seeds',
    nameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    botanicalFamily: 'Anacardiaceae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Whole Kernels', 'FAQ In-Shell'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 8.0,
    maxForeignMatterPercent: 0.5,
    primaryOriginDistricts: ['Sundargarh', 'Keonjhar', 'Mayurbhanj'],
    standardPackaging: '20kg Vacuum Sealed Bag or Tin Container',
    requiredDocuments: ['Certificate of Origin', 'Purity & Grade Certificate'],
    indicativeBenchmarkRatePerKg: 180.0,
    description: 'Nutrient-rich edible kernels harvested wild, renowned for sweet almond-like aroma and culinary value.',
  },
  {
    slug: 'karanj-seeds',
    nameEnglish: 'Karanja Seeds',
    nameOdia: 'କରଞ୍ଜ ମଞ୍ଜି',
    scientificName: 'Millettia pinnata',
    botanicalFamily: 'Fabaceae',
    category: 'Oilseed',
    availableGrades: ['Grade 1 / High Oil Content', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 9.0,
    maxForeignMatterPercent: 2.0,
    primaryOriginDistricts: ['Bhadrak', 'Balasore', 'Mayurbhanj', 'Puri'],
    standardPackaging: '50kg Jute Gunny Bag',
    requiredDocuments: ['Certificate of Origin', 'Depot Release Certificate'],
    indicativeBenchmarkRatePerKg: 32.0,
    description: 'Non-edible oilseeds with potent karanjin content for bio-pesticide and industrial lubricant extraction.',
  },
  {
    slug: 'neem-seeds',
    nameEnglish: 'Neem Seeds',
    nameOdia: 'ନିମ ମଞ୍ଜି',
    scientificName: 'Azadirachta indica',
    botanicalFamily: 'Meliaceae',
    category: 'Oilseed',
    availableGrades: ['Grade 1 / Cleaned Kernels', 'FAQ Whole Dried'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 9.5,
    maxForeignMatterPercent: 1.8,
    primaryOriginDistricts: ['Ganjam', 'Khordha', 'Nayagarh', 'Cuttack'],
    standardPackaging: '50kg Jute Bag',
    requiredDocuments: ['Certificate of Origin', 'Moisture Test Slip'],
    indicativeBenchmarkRatePerKg: 27.0,
    description: 'Dried neem drupes rich in azadirachtin for organic agriculture formulations and medicinal oil.',
  },
  {
    slug: 'kusum-seeds',
    nameEnglish: 'Kusum Seeds',
    nameOdia: 'କୁସୁମ ମଞ୍ଜି',
    scientificName: 'Schleichera oleosa',
    botanicalFamily: 'Sapindaceae',
    category: 'Oilseed',
    availableGrades: ['Grade 1 / High Oleic', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 2.0,
    primaryOriginDistricts: ['Mayurbhanj', 'Keonjhar', 'Sambalpur'],
    standardPackaging: '50kg Jute Gunny Bag',
    requiredDocuments: ['Certificate of Origin'],
    indicativeBenchmarkRatePerKg: 30.0,
    description: 'High-fat seeds from the Ceylon oak tree utilized for traditional macassar oil and soap manufacture.',
  },
  {
    slug: 'sal-resin',
    nameEnglish: 'Sal Dammar (Jhuna)',
    nameOdia: 'ଝୁଣା',
    scientificName: 'Shorea robusta',
    botanicalFamily: 'Dipterocarpaceae',
    category: 'Gum & Resin',
    availableGrades: ['Grade 1 / Translucent Amber Tears', 'Grade 2 / Dark Resin', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 5.0,
    maxForeignMatterPercent: 1.0,
    primaryOriginDistricts: ['Mayurbhanj', 'Keonjhar', 'Sundargarh'],
    standardPackaging: '25kg Polyethylene Lined Carton Box',
    requiredDocuments: ['Certificate of Origin', 'Forest Transit Permit'],
    indicativeBenchmarkRatePerKg: 120.0,
    description: 'Aromatic oleoresin naturally exudated from Sal trunks, extensively used in perfumery and dhoop incense.',
  },
  {
    slug: 'honey-wild',
    nameEnglish: 'Wild Forest Honey',
    nameOdia: 'ଜଙ୍ଗଲୀ ମହୁ',
    scientificName: 'Apis dorsata',
    botanicalFamily: 'Apidae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Raw Filtered', 'Grade 2 / Unfiltered Comb'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 18.0,
    maxForeignMatterPercent: 0.2,
    primaryOriginDistricts: ['Similipal (Mayurbhanj)', 'Koraput', 'Kandhamal'],
    standardPackaging: '15kg Food-Grade HDPE Carboys / Stainless Steel Casks',
    requiredDocuments: ['Certificate of Origin', 'FSSAI Raw Honey Clearance', 'Moisture & HMF Certificate'],
    indicativeBenchmarkRatePerKg: 220.0,
    description: 'Multifloral raw forest honey harvested sustainably by traditional cliff and rock-bee honey hunters.',
  },
  {
    slug: 'hill-broom',
    nameEnglish: 'Hill Broom Grass',
    nameOdia: 'ଝାଡୁ ଘାସ',
    scientificName: 'Thysanolaena latifolia',
    botanicalFamily: 'Poaceae',
    category: 'Non-Timber Forest Produce',
    availableGrades: ['Grade 1 / Extra Long Tassel (>100cm)', 'FAQ (>80cm)'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 12.0,
    maxForeignMatterPercent: 1.0,
    primaryOriginDistricts: ['Rayagada', 'Koraput', 'Gajapati', 'Kandhamal'],
    standardPackaging: '50kg Pressed Bales in Burlap',
    requiredDocuments: ['Certificate of Origin', 'Depot Tassel Length Verification'],
    indicativeBenchmarkRatePerKg: 45.0,
    description: 'Perennial hill grass panicles gathered along forest slopes for commercial broom manufacturing.',
  },
  {
    slug: 'shikakai',
    nameEnglish: 'Shikakai Pods',
    nameOdia: 'ଶିକାକାଇ',
    scientificName: 'Senegalia rugata',
    botanicalFamily: 'Fabaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Whole Dried Pods', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 11.0,
    maxForeignMatterPercent: 1.5,
    primaryOriginDistricts: ['Ganjam', 'Gajapati', 'Rayagada'],
    standardPackaging: '30kg Gunny Bag',
    requiredDocuments: ['Certificate of Origin', 'Saponin Test Clearance'],
    indicativeBenchmarkRatePerKg: 50.0,
    description: 'Saponin-rich dried fruit pods traditionally used as a gentle natural hair cleansing agent.',
  },
  {
    slug: 'bael-pulp',
    nameEnglish: 'Dried Bael Slices',
    nameOdia: 'ଶୁଖିଲା ବେଲ',
    scientificName: 'Aegle marmelos',
    botanicalFamily: 'Rutaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Sun-Dried Rings', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 1.0,
    primaryOriginDistricts: ['Dhenkanal', 'Angul', 'Nayagarh'],
    standardPackaging: '25kg Polypropylene Lined Bag',
    requiredDocuments: ['Certificate of Origin', 'Moisture Test Certificate'],
    indicativeBenchmarkRatePerKg: 38.0,
    description: 'Transversely sliced sun-dried golden fruit rings with mucilage and digestive pectin intact.',
  },
  {
    slug: 'kalmegh',
    nameEnglish: 'Kalmegh (King of Bitters)',
    nameOdia: 'ଭୂଇଁନିମ୍ବ / କାଳମେଘ',
    scientificName: 'Andrographis paniculata',
    botanicalFamily: 'Acanthaceae',
    category: 'Medicinal Flora',
    availableGrades: ['Grade 1 / Whole Dried Herb (Andrographolide >1.5%)', 'FAQ'],
    standardUom: 'kg',
    baselineMoistureMaxPercent: 10.0,
    maxForeignMatterPercent: 2.0,
    primaryOriginDistricts: ['Mayurbhanj', 'Keonjhar', 'Kandhamal'],
    standardPackaging: '25kg Pressed Gunny Bale',
    requiredDocuments: ['Certificate of Origin', 'Active Marker Assay Report (HPLC)'],
    indicativeBenchmarkRatePerKg: 75.0,
    description: 'Harvested wild whole aerial plant parts renowned for potent hepatoprotective and bitter principles.',
  },
];

/**
 * Default Seed Business Profiles for Phase 3
 */
export const DEFAULT_TRADE_BUSINESSES: TradeBusinessProfile[] = [
  {
    id: 'ORG-TDCCOL-OR',
    companyName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    tradeName: 'TDCCOL Apex Procurement & Marketing',
    businessType: 'STATE_AGENCY',
    registrationNumber: 'OR-COOP-APEX-1967-001',
    gstin: '21BBACT1234D1Z2',
    pan: 'BBACT1234D',
    fssaiLicense: '10020031000123',
    ayushLicense: null,
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Statutory State Apex Federation under ST & SC Development Department, Govt of Odisha',
    registeredAddress: 'TDCCOL Bhavan, Bhoi Nagar, Rupali Square',
    city: 'Bhubaneswar',
    district: 'Khordha',
    state: 'Odisha',
    pincode: '751022',
    authorizedContactName: 'Dr. Ramesh Chandra Jena',
    contactEmail: 'trade.apex@tdccol.odisha.gov.in',
    contactPhone: '+91-674-2542001',
    bankName: 'State Bank of India',
    bankBranch: 'Secretariat Branch, Bhubaneswar',
    accountNumberEnding: '4401',
    ifscCode: 'SBIN0000213',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'BUS-DABUR-01',
    companyName: 'Dabur India Limited',
    tradeName: 'Dabur Ayurvedic Natural Products Division',
    businessType: 'MANUFACTURER',
    registrationNumber: 'L24230DL1975PLC007908',
    gstin: '21AAACD0123A1Z5',
    pan: 'AAACD0123A',
    fssaiLicense: '10014011002011',
    ayushLicense: 'DL-AYUSH-1988-044',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'CIN, PAN, GSTIN & AYUSH license verified against MCA & State Portal.',
    registeredAddress: '8/3 Asaf Ali Road',
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    pincode: '110002',
    authorizedContactName: 'Vikramaditya Sengupta',
    contactEmail: 'procurement.herbal@dabur.com',
    contactPhone: '+91-11-23253000',
    bankName: 'HDFC Bank',
    bankBranch: 'Barakhamba Road, New Delhi',
    accountNumberEnding: '9822',
    ifscCode: 'HDFC0000003',
    createdAt: '2025-02-15T10:00:00.000Z',
    updatedAt: '2025-02-15T10:00:00.000Z',
  },
  {
    id: 'BUS-BAIDYA-02',
    companyName: 'Shree Baidyanath Ayurved Bhawan Pvt Ltd',
    tradeName: 'Baidyanath Herbal Processing Works',
    businessType: 'PROCESSOR',
    registrationNumber: 'U24233WB1940PTC010022',
    gstin: '21AABCB9876C1Z3',
    pan: 'AABCB9876C',
    fssaiLicense: '10016021003445',
    ayushLicense: 'WB-AYUSH-1960-012',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Verified manufacturer & processor of traditional Ayurvedic Pharmacopoeia items.',
    registeredAddress: '1 Gupta Lane, Girish Park',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    pincode: '700006',
    authorizedContactName: 'Aniruddha Sharma',
    contactEmail: 'sourcing.b2b@baidyanath.co.in',
    contactPhone: '+91-33-22415500',
    bankName: 'ICICI Bank',
    bankBranch: 'Chowringhee Branch, Kolkata',
    accountNumberEnding: '6543',
    ifscCode: 'ICIC0000006',
    createdAt: '2025-02-20T11:30:00.000Z',
    updatedAt: '2025-02-20T11:30:00.000Z',
  },
  {
    id: 'BUS-UNVERIF-03',
    companyName: 'Shree Herbal Traders (Unverified Test Entity)',
    tradeName: 'Shree Herbal Traders',
    businessType: 'WHOLESALER',
    registrationNumber: 'UDYAM-OD-19-0012345',
    gstin: '21AABCS5555M1Z8',
    pan: 'AABCS5555M',
    fssaiLicense: null,
    ayushLicense: null,
    verificationStatus: 'PENDING_VERIFICATION',
    verificationNotes: 'Submitted for verification; GSTIN and PAN document uploads pending verification by state nodal desk.',
    registeredAddress: 'Station Road, Badambadi',
    city: 'Cuttack',
    district: 'Cuttack',
    state: 'Odisha',
    pincode: '753012',
    authorizedContactName: 'Bishnu Charan Sahoo',
    contactEmail: 'shree.herbal.cuttack@gmail.com',
    contactPhone: '+91-9861000123',
    bankName: 'Punjab National Bank',
    bankBranch: 'Badambadi, Cuttack',
    accountNumberEnding: '1120',
    ifscCode: 'PUNB0054300',
    createdAt: '2025-03-01T09:00:00.000Z',
    updatedAt: '2025-03-01T09:00:00.000Z',
  },
];

/**
 * Initial Seed Trade Listings
 * Invariant: Must have verified statutory release ('AUTH-DPO-*' and 'isStatutoryClearanceVerified: true')
 */
export const DEFAULT_TRADE_LISTINGS: TradeListing[] = [
  {
    id: 'LIST-MAHUA-2025-01',
    sellerOrgId: 'ORG-TDCCOL-OR',
    sellerOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    produceSlug: 'mahua',
    produceName: 'Dried Mahua Flowers',
    scientificName: 'Madhuca longifolia',
    qualityGrade: 'Grade 1 / Premium',
    totalLotQuantityKg: 100.0,
    allocatedQuantityKg: 0.0,
    availableQuantityKg: 100.0,
    minimumOrderQuantityKg: 25.0,
    indicativePricePerKg: 52.0,
    depotFacilityId: 'BRP-01',
    storageBayLocation: 'Bay 01-A (Ambient Aerated)',
    warehouseBatchRef: 'BS-402',
    lotSaleAuthorizationRef: 'AUTH-DPO-2025-001',
    authorizingOfficer: 'patnaik.dpo',
    isStatutoryClearanceVerified: true,
    availabilityStartDate: '2025-03-01T00:00:00.000Z',
    availabilityEndDate: '2025-06-30T23:59:59.000Z',
    isActive: true,
    labReportUrl: '/reports/lab-BS402-moisture-11.2.pdf',
    inspectionCertificateRef: 'QC-BRP-2025-042',
    packagingDescription: '50kg Jute Gunny Bag (Double Stitched, New Food Grade)',
    createdAt: '2025-03-02T10:00:00.000Z',
    updatedAt: '2025-03-02T10:00:00.000Z',
  },
  {
    id: 'LIST-SAL-2025-01',
    sellerOrgId: 'ORG-TDCCOL-OR',
    sellerOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    produceSlug: 'sal-seeds',
    produceName: 'Sal Tree Seeds',
    scientificName: 'Shorea robusta',
    qualityGrade: 'Grade 1 / Standard',
    totalLotQuantityKg: 500.0,
    allocatedQuantityKg: 0.0,
    availableQuantityKg: 500.0,
    minimumOrderQuantityKg: 50.0,
    indicativePricePerKg: 34.0,
    depotFacilityId: 'BRP-01',
    storageBayLocation: 'Bay 03-C (Ventilated Pallet Stacks)',
    warehouseBatchRef: 'BS-400',
    lotSaleAuthorizationRef: 'AUTH-DPO-2025-002',
    authorizingOfficer: 'patnaik.dpo',
    isStatutoryClearanceVerified: true,
    availabilityStartDate: '2025-03-01T00:00:00.000Z',
    availabilityEndDate: '2025-07-31T23:59:59.000Z',
    isActive: true,
    labReportUrl: '/reports/lab-BS400-oil-19.4.pdf',
    inspectionCertificateRef: 'QC-BRP-2025-039',
    packagingDescription: '50kg Jute Gunny Bag',
    createdAt: '2025-03-02T10:30:00.000Z',
    updatedAt: '2025-03-02T10:30:00.000Z',
  },
];

/**
 * Initial Seed RFQs
 */
export const DEFAULT_TRADE_RFQS: TradeRfq[] = [
  {
    id: 'RFQ-2025-001',
    rfqNumber: 'RFQ-B2B-2025-001',
    buyerOrgId: 'BUS-DABUR-01',
    buyerOrgName: 'Dabur India Limited',
    listingId: 'LIST-MAHUA-2025-01',
    produceSlug: 'mahua',
    produceName: 'Dried Mahua Flowers',
    requestedGrade: 'Grade 1 / Premium',
    requestedQuantityKg: 50.0,
    deliveryLocation: 'Dabur Ayurvedic Manufacturing Unit, Sahibabad Industrial Area, Ghaziabad, UP',
    targetDeliveryDate: '2025-04-15T00:00:00.000Z',
    packagingRequirements: 'Standard 50kg double-stitched jute bags with tamper-evident tags',
    buyerNotes: 'Moisture must not exceed 12.0%. Required for seasonal herbal tonics formulation.',
    status: 'PO_CREATED',
    rejectionReason: null,
    cancellationReason: null,
    createdAt: '2025-03-05T08:30:00.000Z',
    updatedAt: '2025-03-06T14:00:00.000Z',
  },
];

/**
 * Initial Seed Quotations
 */
export const DEFAULT_TRADE_QUOTATIONS: TradeQuotation[] = [
  {
    id: 'QUOT-2025-001',
    quotationNumber: 'QUOT-B2B-2025-001',
    rfqId: 'RFQ-2025-001',
    sellerOrgId: 'ORG-TDCCOL-OR',
    sellerOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    listingId: 'LIST-MAHUA-2025-01',
    quotedPricePerKg: 50.0,
    minimumOrderQuantityKg: 25.0,
    quotedTotalAmount: 2500.0,
    deliveryTimelineDays: 7,
    deliveryTerms: 'Ex-Depot Baripada Central Terminal (BRP-01), Mayurbhanj. Freight on Buyer account.',
    paymentTerms: '100% Corporate RTGS against verified Dispatch Inspection Dossier',
    validUntil: '2025-03-20T23:59:59.000Z',
    sellerRemarks: 'Moisture tested at 11.2%. Pre-dispatch inspection by Buyer quality agent welcomed at BRP-01.',
    isAccepted: true,
    createdAt: '2025-03-05T12:00:00.000Z',
    updatedAt: '2025-03-06T11:00:00.000Z',
  },
];

/**
 * Initial Seed Purchase Orders
 */
export const DEFAULT_TRADE_PURCHASE_ORDERS: TradePurchaseOrder[] = [
  {
    id: 'PO-2025-001',
    poNumber: 'PO-B2B-2025-001',
    buyerOrgId: 'BUS-DABUR-01',
    buyerOrgName: 'Dabur India Limited',
    sellerOrgId: 'ORG-TDCCOL-OR',
    sellerOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    rfqId: 'RFQ-2025-001',
    quotationId: 'QUOT-2025-001',
    produceName: 'Dried Mahua Flowers',
    scientificName: 'Madhuca longifolia',
    qualityGrade: 'Grade 1 / Premium',
    quantityKg: 50.0,
    agreedPricePerKg: 50.0,
    totalOrderAmount: 2500.0,
    deliveryTerms: 'Ex-Depot Baripada Central Terminal (BRP-01), Mayurbhanj',
    deliveryAddress: 'Dabur Ayurvedic Manufacturing Unit, Plot 22, Site IV, Sahibabad Industrial Area, Ghaziabad, UP 201010',
    expectedDeliveryDate: '2025-04-15T00:00:00.000Z',
    status: 'CONFIRMED',
    eWaybillNumber: 'EWB-2110-8849-3012',
    qualityInspectionCertRef: 'QC-BRP-2025-042',
    auditHistory: [
      {
        timestamp: '2025-03-06T11:00:00.000Z',
        actor: 'vikramaditya.sengupta (Dabur Buyer Rep)',
        action: 'ISSUE_PURCHASE_ORDER',
        previousStatus: 'QUOTED',
        newStatus: 'ISSUED',
        notes: 'Accepted Quotation QUOT-B2B-2025-001 with total value INR 2,500.00',
      },
      {
        timestamp: '2025-03-06T14:00:00.000Z',
        actor: 'trade.apex@tdccol.odisha.gov.in (TDCCOL Seller Rep)',
        action: 'CONFIRM_PURCHASE_ORDER',
        previousStatus: 'ISSUED',
        newStatus: 'CONFIRMED',
        notes: 'Confirmed stock availability in Bay 01-A at BRP-01. Dispatch scheduled.',
      },
    ],
    platformServiceFeeRate: 0.0,
    createdAt: '2025-03-06T11:00:00.000Z',
    updatedAt: '2025-03-06T14:00:00.000Z',
  },
];

/**
 * Access Gate: Only VERIFIED_ACTIVE businesses are authorized for B2B trading operations.
 */
export function canBusinessTrade(status: TradeVerificationStatus): boolean {
  return status === 'VERIFIED_ACTIVE';
}

