/**
 * BanaSetu Product Handling, Environment & Storage Guidance Engine
 * 
 * Single shared source of truth for product-driven handling, packaging, transport,
 * and depot storage specifications across Collector, Collection Manager, and Inventory Manager.
 * 
 * Conforms to TDCCOL & TRIFED operational guidelines for Odisha Minor Forest Produce (MFP).
 * NOTE: Unconfigured parameters are explicitly reported as "Not configured — verify locally"
 * to avoid inventing unverified official government thresholds.
 */

import { ODISHA_MFP_CATALOGUE, MfpProduct } from './products';

export type MoistureSensitivityLevel = 'HIGH' | 'MODERATE' | 'LOW';

export type GuidanceStatus =
  | 'OFFICIAL_RECOMMENDED'
  | 'PROTOTYPE_BASELINE'
  | 'LOCAL_VERIFICATION_REQUIRED';

export type CapabilityMatchStatus =
  | 'SUITABLE'
  | 'UNSUITABLE'
  | 'UNKNOWN_REQUIRES_INSPECTION';

export interface InspectionChecklistItem {
  id: string;
  label: string;
  stage: 'COLLECTION' | 'DISPATCH' | 'STORAGE' | 'ALL';
  mandatory: boolean;
  guidanceNote?: string;
}

export interface TemperatureLimit {
  minC?: number;
  maxC?: number;
  notes: string;
}

export interface HumidityLimit {
  maxRelativeHumidityPercent?: number;
  notes: string;
}

export interface ProductHandlingProfile {
  productId: string;
  productSlug: string;
  productName: string;
  productNameOdia: string;
  scientificName: string;
  primaryHarvestSeason: string;
  
  // Handling & Packaging
  collectionHandling: string[];
  standardPackaging: string;
  packagingProtection: string[];
  typicalTareKgPerBag: number;
  
  // Transport & Precautions
  transportPrecautions: string[];
  
  // Moisture & Environment
  moistureSensitivity: MoistureSensitivityLevel;
  verifiedMoistureMaxPercent: number | null;
  allowableShrinkagePercent: number;
  moistureNotes: string;
  
  // Storage & Warehouse
  storageEnvironment: string;
  temperatureLimit: TemperatureLimit | null;
  humidityLimit: HumidityLimit | null;
  suitableStorageCapabilities: string[];
  requiredVehicleCapabilities: string[];
  recommendedDepotZone: string;
  
  // Integrity & Governance
  warnings: string[];
  inspectionChecklist: InspectionChecklistItem[];
  sourceReference: string;
  guidanceStatus: GuidanceStatus;
}

export interface VehicleCapabilityRecord {
  vehicleNumber: string;
  driverName: string;
  driverPhone?: string;
  vehicleType: string;
  capabilities: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'EXPIRED';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface DepotCapabilityRecord {
  depotId: string;
  depotName: string;
  depotNameOdia?: string;
  block: string;
  locationType: string;
  capabilities: string[];
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'EXPIRED';
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface CapabilityMatchResult {
  status: CapabilityMatchStatus;
  summary: string;
  matchedCapabilities: string[];
  missingCapabilities: string[];
  recommendation: string;
}

/**
 * Common storage & transport capability tokens used across Mayurbhanj infrastructure
 */
export const CAPABILITY_DEFINITIONS: Record<string, { label: string; description: string; type: 'VEHICLE' | 'DEPOT' | 'BOTH' }> = {
  WATERPROOF_TARPAULIN: {
    label: 'Waterproof Tarpaulin Cover',
    description: 'Heavy-duty water-resistant tarpaulin firmly secured over cargo bed.',
    type: 'VEHICLE',
  },
  CLEAN_DRY_BED: {
    label: 'Clean Dry Cargo Bed',
    description: 'Free of chemical residue, oil stains, fertilizers, or damp sawdust.',
    type: 'VEHICLE',
  },
  SECURED_LASHING: {
    label: 'Secured Cargo Lashings',
    description: 'Cargo tie-down anchors to prevent sack shifting or crushing on unpaved roads.',
    type: 'VEHICLE',
  },
  FOOD_GRADE_CONTAINMENT: {
    label: 'Food-Grade Containment',
    description: 'Dedicated non-toxic transport, required for raw honey carboys and culinary produce.',
    type: 'VEHICLE',
  },
  DRY_AERATED_BAY: {
    label: 'Dry Aerated Storage Bay',
    description: 'Shed with natural cross-ventilation or louvered vents protecting from dampness.',
    type: 'DEPOT',
  },
  RAISED_DUNNAGE_PALLETS: {
    label: 'Raised Dunnage Pallets',
    description: 'Wooden or bamboo pallets keeping sacks at least 15 cm above ground to block floor moisture.',
    type: 'DEPOT',
  },
  COOL_SHADED_RESIN_BAY: {
    label: 'Cool Shaded Resin Bay',
    description: 'Ambient temperature maintained below 35°C to prevent heat-induced caking/blocking of sticklac.',
    type: 'DEPOT',
  },
  SEALED_FOOD_GRADE_STORAGE: {
    label: 'Sealed Food-Grade Storage',
    description: 'Airtight, pest-proof storage room for food-grade carboys and deseeded tamarind slabs.',
    type: 'DEPOT',
  },
  QUARANTINE_ISOLATION_ZONE: {
    label: 'Quarantine Segregation Zone',
    description: 'Dedicated physically separated wire mesh bay for discrepant or infested lots.',
    type: 'DEPOT',
  },
};

/**
 * 17 Odisha Minor Forest Produce Handling Profiles
 * Synchronized with ODISHA_MFP_CATALOGUE
 */
export const PRODUCT_HANDLING_PROFILES: Record<string, ProductHandlingProfile> = {
  mahua: {
    productId: 'PROD-01',
    productSlug: 'mahua',
    productName: 'Dried Mahua Flowers',
    productNameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
    scientificName: 'Madhuca longifolia',
    primaryHarvestSeason: 'March - May',
    collectionHandling: [
      'Gather freshly fallen corollas from cleared forest floor before midday dew evaporation.',
      'Sun-dry exclusively on clean natural bamboo mats or tarpaulins; never dry directly on bare red soil.',
      'Turn flowers 3 to 4 times daily to achieve uniform dehydration without scorch marks.',
    ],
    standardPackaging: '50kg Jute Gunny Bag (Double-stitched)',
    packagingProtection: [
      'Pack in clean, dry jute gunny bags allowing natural moisture vapor transpiration.',
      'Stack on wooden or bamboo dunnage pallets at least 15 cm above ground.',
      'Maintain 60 cm perimeter space away from depot masonry walls.',
    ],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: [
      'Strictly cover with heavy-duty waterproof tarpaulin during vehicle transit.',
      'Do not haul on open flatbeds during rain showers or misty mornings.',
      'Avoid high sack stacks exceeding 8 tiers to prevent bottom bag corolla crushing.',
    ],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 12.0,
    allowableShrinkagePercent: 1.5,
    moistureNotes: 'Flowers above 12.0% moisture trigger anaerobic fermentation, dark sticky caking, and sour alcohol odor.',
    storageEnvironment: 'Dry, well-aerated depot bay with continuous cross-ventilation. Keep away from direct sunlight.',
    temperatureLimit: null, // Ambient shade storage; no official cooling gazetted
    humidityLimit: {
      maxRelativeHumidityPercent: 65,
      notes: 'Relative humidity above 70% induces rapid moisture re-absorption and mold germination.',
    },
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: [
      'Fermentation Hazard: Batches exceeding 12.0% moisture turn dark reddish-black and lose commercial value.',
      'Mold Susceptibility: Exposure to puddle water or damp floors leads to Aspergillus contamination.',
    ],
    inspectionChecklist: [
      { id: 'ck-mh-1', label: 'Check for sweet natural aroma; reject sour fermented or alcoholic smell.', stage: 'ALL', mandatory: true },
      { id: 'ck-mh-2', label: 'Verify corollas are pliable yet non-sticky to touch with moisture ≤ 12.0%.', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-mh-3', label: 'Inspect jute bags for dry stenciling and absence of water tide marks.', stage: 'DISPATCH', mandatory: true },
      { id: 'ck-mh-4', label: 'Verify raised pallet placement with 15 cm minimum clearance above depot slab.', stage: 'STORAGE', mandatory: true },
    ],
    sourceReference: 'TDCCOL Van Dhan Operational Standard 2024 & Odisha MFP Harvest Manual',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'sal-seeds': {
    productId: 'PROD-02',
    productSlug: 'sal-seeds',
    productName: 'Sal Tree Seeds',
    productNameOdia: 'ଶାଳ ମଞ୍ଜି',
    scientificName: 'Shorea robusta',
    primaryHarvestSeason: 'May - July',
    collectionHandling: [
      'Collect fallen ripe winged fruits from forest floor; de-wing manually by light beating or winnowing.',
      'Decorticate shells carefully to extract intact kernel pairs without crushing embryonic oil tissue.',
      'Sun-dry decorticated kernels until crisp and free of sap stickiness.',
    ],
    standardPackaging: '50kg Jute Gunny Bag',
    packagingProtection: [
      'Use porous breathable jute bags to prevent kernel oil rancidity and sweating.',
      'Keep away from heat sources and humid exterior walls.',
    ],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: [
      'Cover with tarpaulin to guard against pre-monsoon thunderstorms.',
      'Ensure truck cargo bed is clean and devoid of mineral oil or pesticide contamination.',
    ],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 10.0,
    allowableShrinkagePercent: 1.2,
    moistureNotes: 'High oil content seeds (>10% moisture) rapidly develop hydrolytic rancidity and free fatty acids.',
    storageEnvironment: 'Cool, aerated warehouse bay on wooden pallets. Maximum stack height 6 bags.',
    temperatureLimit: null,
    humidityLimit: {
      maxRelativeHumidityPercent: 60,
      notes: 'High humidity causes internal seed germination and fungal rot.',
    },
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: [
      'Rancidity Risk: Kernels stored in damp heat produce rancid odor unsuitable for sal butter processing.',
      'Weevil Infestation: Check kernels for pinholes indicating beetle boring.',
    ],
    inspectionChecklist: [
      { id: 'ck-sal-1', label: 'Confirm seed moisture is below 10.0% threshold.', stage: 'ALL', mandatory: true },
      { id: 'ck-sal-2', label: 'Examine kernel interior by splitting sample: white/cream interior required; brown/black rejected.', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-sal-3', label: 'Verify vehicle has clean cargo bed free of fuel or fertilizer.', stage: 'DISPATCH', mandatory: true },
    ],
    sourceReference: 'TDCCOL Seed Procurement Guidelines & TRIFED Sal Kernel Quality Standard',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'kendu-leaves': {
    productId: 'PROD-03',
    productSlug: 'kendu-leaves',
    productName: 'Kendu Leaves',
    productNameOdia: 'କେନ୍ଦୁ ପତ୍ର',
    scientificName: 'Diospyros melanoxylon',
    primaryHarvestSeason: 'April - June',
    collectionHandling: [
      'Pluck mature, disease-free copper-green leaves during dawn hours.',
      'Tie leaves into uniform kerries of 100 leaves each using natural bark or twine.',
      'Air-cure in shaded phadi sheds; avoid scorching direct sunlight that causes leaf brittleness.',
    ],
    standardPackaging: '100-leaf Plucked Kerri / Bundle',
    packagingProtection: [
      'Stack kerries vertically in aerated bamboo phadis.',
      'Protect against premature rain and dry termite attack.',
    ],
    typicalTareKgPerBag: 1.0,
    transportPrecautions: [
      'High fire risk produce: Prohibit smoking or open sparks near transit vehicle.',
      'Fasten heavy tarpaulins securely to prevent kerri blow-off at highway speed.',
    ],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 11.0,
    allowableShrinkagePercent: 2.0,
    moistureNotes: 'Over-dried leaves become brittle and crack; damp leaves rot inside dense kerri centers.',
    storageEnvironment: 'Spacious, dry, fire-protected state phadi warehouse with pest traps.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: [
      'Fire Hazard: Dried Kendu leaf bundles are highly combustible. No sparks within 50 meters.',
      'Brittleness: Handling dry kerries roughly shatters leaf edges, reducing wrapper grading.',
    ],
    inspectionChecklist: [
      { id: 'ck-kl-1', label: 'Verify kerries count matches tag declaration (100 leaves per kerri).', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-kl-2', label: 'Check for absence of blister blight or fungal gall spots.', stage: 'ALL', mandatory: true },
      { id: 'ck-kl-3', label: 'Confirm vehicle fire extinguisher is present and in green pressure zone.', stage: 'DISPATCH', mandatory: true },
    ],
    sourceReference: 'Odisha Forest Development Corporation (OFDC) Kendu Leaf Manual',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'tamarind-seeded': {
    productId: 'PROD-04',
    productSlug: 'tamarind-seeded',
    productName: 'Seeded Tamarind',
    productNameOdia: 'ମଞ୍ଜି ଥିବା ତେନ୍ତୁଳି',
    scientificName: 'Tamarindus indica',
    primaryHarvestSeason: 'January - April',
    collectionHandling: [
      'Harvest fully ripe brown pods from branches using bamboo poles.',
      'Crack brittle outer shell and discard broken shell fragments.',
      'Leave inner seeds and fibrous veins intact; sun-dry pulp on clean mats for 2 days.',
    ],
    standardPackaging: '40kg Jute Bag',
    packagingProtection: ['Pack in double-layered jute bags.', 'Keep off bare ground to prevent sugar exudate staining.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Cover with tarpaulin.', 'Avoid stacking under heavy seed bags to prevent pulp crushing.'],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 14.0,
    allowableShrinkagePercent: 1.8,
    moistureNotes: 'Sticky tartaric acid pulp attracts moisture from humid air if left uncovered.',
    storageEnvironment: 'Well-ventilated dry depot zone away from cement contact.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: ['Insect Attraction: Sticky acidic pulp attracts ants, beetles, and fruit flies.'],
    inspectionChecklist: [
      { id: 'ck-ts-1', label: 'Ensure pulp is free of mold threads and dirt clods.', stage: 'ALL', mandatory: true },
      { id: 'ck-ts-2', label: 'Verify moisture content ≤ 14.0%.', stage: 'COLLECTION', mandatory: true },
    ],
    sourceReference: 'TDCCOL Minor Forest Produce Manual 2024',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'tamarind-deseeded': {
    productId: 'PROD-05',
    productSlug: 'tamarind-deseeded',
    productName: 'De-seeded Tamarind',
    productNameOdia: 'ମଞ୍ଜି ବିହୀନ ତେନ୍ତୁଳି',
    scientificName: 'Tamarindus indica',
    primaryHarvestSeason: 'January - April',
    collectionHandling: [
      'Peeled and de-stoned by tribal SHG women using stainless steel tools.',
      'Compress into uniform 1 kg or 5 kg compact slabs using wooden press.',
      'Wrap in food-grade plastic lining before corrugated master packaging.',
    ],
    standardPackaging: '25kg Vacuum Slab / Box',
    packagingProtection: ['Poly-lined food-grade corrugated cartons or food-grade vacuum sacks.'],
    typicalTareKgPerBag: 0.8,
    transportPrecautions: ['Must not get wet under any circumstances.', 'Keep separate from pungent non-food commodities.'],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 13.0,
    allowableShrinkagePercent: 1.0,
    moistureNotes: 'Processed culinary item; moisture ingress causes fungal blooms on slab surfaces.',
    storageEnvironment: 'Pest-proof, dry food-grade storage room.',
    temperatureLimit: { maxC: 32, notes: 'Temperatures above 32°C cause sugar melting and black discoloration.' },
    humidityLimit: { maxRelativeHumidityPercent: 60, notes: 'Requires low humidity to prevent slab adhesion.' },
    suitableStorageCapabilities: ['SEALED_FOOD_GRADE_STORAGE', 'DRY_AERATED_BAY'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'FOOD_GRADE_CONTAINMENT'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: ['Discoloration: Prolonged heat oxidizes golden-brown tamarind pulp into unmarketable black resin.'],
    inspectionChecklist: [
      { id: 'ck-td-1', label: 'Verify complete absence of hard seed stones in sample.', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-td-2', label: 'Check poly-liner seal integrity.', stage: 'DISPATCH', mandatory: true },
    ],
    sourceReference: 'TRIFED Food Processing & Van Dhan Value-Addition Guidelines',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  harida: {
    productId: 'PROD-06',
    productSlug: 'harida',
    productName: 'Harida Fruit (Chebulic Myrobalan)',
    productNameOdia: 'ହରିଡ଼ା',
    scientificName: 'Terminalia chebula',
    primaryHarvestSeason: 'November - February',
    collectionHandling: [
      'Collect fallen yellow-green mature drupes from ground beneath mother trees.',
      'Sun-dry thoroughly until fruit skin turns yellowish-brown with prominent longitudinal ribs.',
      'Discard insect-bored or rot-spotted drupes during primary sorting.',
    ],
    standardPackaging: '50kg Jute Gunny Bag',
    packagingProtection: ['Standard jute gunny bags on wooden dunnage.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Tarpaulin covered transport.', 'Stacking height up to 8 bags allowed.'],
    moistureSensitivity: 'LOW',
    verifiedMoistureMaxPercent: 10.0,
    allowableShrinkagePercent: 1.0,
    moistureNotes: 'Low moisture hard drupe; resilient to handling when dried below 10.0%.',
    storageEnvironment: 'Standard dry warehouse bay on pallets.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Hardness Check: Inadequately dried fruit remains soft and harbors internal weevil larvae.'],
    inspectionChecklist: [
      { id: 'ck-hd-1', label: 'Check for hard brittle texture when struck with light hammer.', stage: 'ALL', mandatory: true },
      { id: 'ck-hd-2', label: 'Verify absence of boring holes indicating seed beetle exit.', stage: 'COLLECTION', mandatory: true },
    ],
    sourceReference: 'Ayurvedic Pharmacopoeia of India & TDCCOL MFP Specifications',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  bahada: {
    productId: 'PROD-07',
    productSlug: 'bahada',
    productName: 'Bahada Fruit (Belleric Myrobalan)',
    productNameOdia: 'ବାହାଡ଼ା',
    scientificName: 'Terminalia bellirica',
    primaryHarvestSeason: 'November - February',
    collectionHandling: [
      'Gather mature fallen subglobose fruits; clean off leaf litter.',
      'Sun-dry on raised mats until grey velvety surface is completely dry.',
    ],
    standardPackaging: '50kg Jute Gunny Bag',
    packagingProtection: ['Jute gunny bag on dunnage pallets.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Standard tarpaulin protection.'],
    moistureSensitivity: 'LOW',
    verifiedMoistureMaxPercent: 10.5,
    allowableShrinkagePercent: 1.2,
    moistureNotes: 'Moisture must remain ≤ 10.5% to avoid internal kernel fungal blackening.',
    storageEnvironment: 'Dry aerated bay.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Internal rot can occur if gathered from marshy forest floor.'],
    inspectionChecklist: [
      { id: 'ck-bh-1', label: 'Examine external velvety rind for dry uniform grey color.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'TDCCOL Technical Specification Sheet',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  amla: {
    productId: 'PROD-08',
    productSlug: 'amla',
    productName: 'Amla (Indian Gooseberry)',
    productNameOdia: 'ଅଁଳା',
    scientificName: 'Phyllanthus emblica',
    primaryHarvestSeason: 'October - January',
    collectionHandling: [
      'Collect wild forest amla; segment fresh fruit and sun-dry to produce dry amla shreds.',
      'Maintain clean stainless steel or bamboo cutting surfaces to avoid tannin discoloration.',
    ],
    standardPackaging: '40kg Perforated Hessian Bag',
    packagingProtection: ['Perforated hessian bags allowing natural air circulation.'],
    typicalTareKgPerBag: 1.2,
    transportPrecautions: ['Cover from rain; protect from road dust.'],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 12.0,
    allowableShrinkagePercent: 2.5,
    moistureNotes: 'High natural ascorbic acid content degrades rapidly when damp.',
    storageEnvironment: 'Dry ventilated storage bay away from iron/metal contact.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Iron Contact: High tannin reacts with iron to turn produce pitch black.'],
    inspectionChecklist: [
      { id: 'ck-am-1', label: 'Confirm dry amla shreds are crisp and light greyish-brown.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'National Medicinal Plants Board (NMPB) Quality Standards',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'karanja-seeds': {
    productId: 'PROD-09',
    productSlug: 'karanja-seeds',
    productName: 'Karanja Seeds',
    productNameOdia: 'କରଞ୍ଜ ମଞ୍ଜି',
    scientificName: 'Millettia pinnata',
    primaryHarvestSeason: 'April - June',
    collectionHandling: [
      'Collect fallen pods, decorticate thick woody shell, extract kidney-shaped kernels.',
      'Dry kernels in shade or mild sun.',
    ],
    standardPackaging: '50kg Jute Gunny Bag',
    packagingProtection: ['Breathable jute bags.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Standard covered vehicle transport.'],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 9.0,
    allowableShrinkagePercent: 1.0,
    moistureNotes: 'Non-edible oilseeds; keep separate from edible commodities.',
    storageEnvironment: 'Dry aerated bay. Keep isolated from grain/food stocks.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: ['Toxicity: Non-edible oilseeds containing pongamol; do not cross-contaminate edible grains.'],
    inspectionChecklist: [
      { id: 'ck-kr-1', label: 'Verify seeds are free from mold and woody shell debris.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'TDCCOL Industrial Oilseeds Procurement Guideline',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'kusum-seeds': {
    productId: 'PROD-10',
    productSlug: 'kusum-seeds',
    productName: 'Kusum Seeds',
    productNameOdia: 'କୁସୁମ ମଞ୍ଜି',
    scientificName: 'Schleichera oleosa',
    primaryHarvestSeason: 'June - August',
    collectionHandling: [
      'Collect globose fruits, wash pulpy aril off in stream or vessel, sun-dry brown seeds.',
    ],
    standardPackaging: '50kg Jute Gunny Bag',
    packagingProtection: ['Jute gunny bag on dunnage.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Tarpaulin cover required during monsoon transit.'],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 9.5,
    allowableShrinkagePercent: 1.1,
    moistureNotes: 'Harvested during monsoon onset; careful pre-transit drying is essential.',
    storageEnvironment: 'Elevated pallet storage in dry bay.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: ['Monsoon dampness triggers kernel rot if moisture > 9.5%.'],
    inspectionChecklist: [
      { id: 'ck-ks-1', label: 'Ensure complete removal of fleshy fruit pulp before bagging.', stage: 'COLLECTION', mandatory: true },
    ],
    sourceReference: 'Odisha Forest Department MFP Baseline',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'neem-seeds': {
    productId: 'PROD-11',
    productSlug: 'neem-seeds',
    productName: 'Neem Seeds',
    productNameOdia: 'ନିମ୍ବ ମଞ୍ଜି',
    scientificName: 'Azadirachta indica',
    primaryHarvestSeason: 'May - July',
    collectionHandling: [
      'Collect fallen ripe yellow drupes; depulp manually and sun-dry clean white endocarps.',
    ],
    standardPackaging: '50kg Jute Bag',
    packagingProtection: ['Breathable jute sacks.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: ['Covered transport.'],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 10.0,
    allowableShrinkagePercent: 1.0,
    moistureNotes: 'Moisture above 10.0% degrades azadirachtin bioactive content.',
    storageEnvironment: 'Dry aerated warehouse bay.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: ['Depulping Residue: Incomplete depulping leads to maggot breeding.'],
    inspectionChecklist: [
      { id: 'ck-nm-1', label: 'Verify stones are clean, white, and dry without adhering pulp.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'TRIFED Bio-active Oilseed Quality Guidelines',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'char-seeds': {
    productId: 'PROD-12',
    productSlug: 'char-seeds',
    productName: 'Char Seeds (Chironji)',
    productNameOdia: 'ଚାର ମଞ୍ଜି',
    scientificName: 'Buchanania lanzan',
    primaryHarvestSeason: 'April - May',
    collectionHandling: [
      'High-value forest nut. Gather ripe fruits, soak and depulp, sun-dry stony shells.',
      'Decorticate stony shell carefully without breaking delicate sweet kernel.',
    ],
    standardPackaging: '25kg Poly-lined Jute Bag',
    packagingProtection: ['Poly-lined clean jute bag or vacuum box; high economic value.'],
    typicalTareKgPerBag: 1.0,
    transportPrecautions: ['Double secured vehicle lashings; high pilferage risk commodity.'],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 8.0,
    allowableShrinkagePercent: 0.8,
    moistureNotes: 'Nut kernels with high oil content; moisture above 8.0% causes fast mold.',
    storageEnvironment: 'Secure, locked dry warehouse bay on raised dunnage.',
    temperatureLimit: { maxC: 30, notes: 'Ambient cool storage recommended to preserve delicate almond-like fat.' },
    humidityLimit: { maxRelativeHumidityPercent: 55, notes: 'Requires dry air to prevent kernel dampening.' },
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['High Value / Pilferage: Count and seal tags must be verified at every custody transfer.'],
    inspectionChecklist: [
      { id: 'ck-ch-1', label: 'Verify sealed poly-liner intactness.', stage: 'ALL', mandatory: true },
      { id: 'ck-ch-2', label: 'Check kernel freshness; reject bitter rancid batches.', stage: 'COLLECTION', mandatory: true },
    ],
    sourceReference: 'TDCCOL High-Value MFP Manual & TRIFED Chironji Benchmark',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'hill-broom': {
    productId: 'PROD-13',
    productSlug: 'hill-broom',
    productName: 'Hill Broom Grass',
    productNameOdia: 'ଝାଡ଼ୁ ଘାସ',
    scientificName: 'Thysanolaena latifolia',
    primaryHarvestSeason: 'January - March',
    collectionHandling: [
      'Harvest mature panicle culms before flower seed shed.',
      'Sun-dry panicles on hillside rocks; tie into standard 500g or 1kg bundles.',
    ],
    standardPackaging: '50kg Pressed Bale',
    packagingProtection: ['Compressed strapped bales with galvanized wire or sisal twine.'],
    typicalTareKgPerBag: 1.0,
    transportPrecautions: ['High volume / low density cargo. Secure with robust side net/tarpaulins.'],
    moistureSensitivity: 'LOW',
    verifiedMoistureMaxPercent: 12.0,
    allowableShrinkagePercent: 2.0,
    moistureNotes: 'If baled while wet, grass rots and becomes brittle at binding node.',
    storageEnvironment: 'Elevated shed with high ceiling and rodent protection.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Fire Hazard: High volume dry grass is extremely flammable. Strict no-smoking zone.'],
    inspectionChecklist: [
      { id: 'ck-hb-1', label: 'Check panicle color (greenish-gold preferred; black/moldy rejected).', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'Odisha Tribal Development Society Hill Broom Standard',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  'wild-honey': {
    productId: 'PROD-14',
    productSlug: 'wild-honey',
    productName: 'Wild Forest Honey',
    productNameOdia: 'ଜଙ୍ଗଲୀ ପ୍ରାକୃତିକ ମହୁ',
    scientificName: 'Apis dorsata',
    primaryHarvestSeason: 'Year-round (Peak: March - June)',
    collectionHandling: [
      'Sustainably harvest honey portion of rock/tree comb without killing bee brood.',
      'Filter raw honey through multiple layers of sterile cotton cheesecloth.',
      'Never boil or expose raw honey to direct flame.',
    ],
    standardPackaging: '30kg Food-Grade HDPE Carboy',
    packagingProtection: [
      'Airtight food-grade virgin HDPE carboys with hermetic inner seal and screw cap.',
      'Never use rusted iron drums, recycled pesticide cans, or open buckets.',
    ],
    typicalTareKgPerBag: 1.8,
    transportPrecautions: [
      'Transport in upright orientation only. Fasten carboys with individual web strapping.',
      'Protect carboys from direct solar baking on vehicle bed.',
      'Must travel in food-grade clean transport.',
    ],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 20.0,
    allowableShrinkagePercent: 0.5,
    moistureNotes: 'Moisture above 20.0% activates wild osmo-tolerant yeasts, causing explosive gas fermentation.',
    storageEnvironment: 'Cool, sealed food-grade storage room away from direct solar radiation.',
    temperatureLimit: {
      maxC: 30,
      notes: 'Storage above 30°C causes rapid HMF (hydroxymethylfurfural) increase and flavor loss.',
    },
    humidityLimit: {
      maxRelativeHumidityPercent: 65,
      notes: 'Honey is intensely hygroscopic; absorbs ambient moisture if container cap is cracked.',
    },
    suitableStorageCapabilities: ['SEALED_FOOD_GRADE_STORAGE', 'DRY_AERATED_BAY'],
    requiredVehicleCapabilities: ['FOOD_GRADE_CONTAINMENT', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack A (Central Bay)',
    warnings: [
      'Fermentation Danger: Honey >20% moisture ferments, building internal CO2 pressure in carboys.',
      'Hygroscopic: Will absorb room moisture and odors if container seal is compromised.',
    ],
    inspectionChecklist: [
      { id: 'ck-hn-1', label: 'Verify carboy seal cap is hermetically tight with zero leakage.', stage: 'ALL', mandatory: true },
      { id: 'ck-hn-2', label: 'Measure moisture with honey refractometer (must be ≤ 20.0%).', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-hn-3', label: 'Inspect for absence of bee parts, wax debris, and brood particles.', stage: 'COLLECTION', mandatory: true },
      { id: 'ck-hn-4', label: 'Verify upright tie-down on transport vehicle.', stage: 'DISPATCH', mandatory: true },
    ],
    sourceReference: 'FSSAI Honey Standards (2020) & TRIFED Wild Forest Honey Guidelines',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  lac: {
    productId: 'PROD-15',
    productSlug: 'lac',
    productName: 'Natural Lac (Sticklac)',
    productNameOdia: 'ପ୍ରାକୃତିକ ଲାଖ',
    scientificName: 'Kerria lacca',
    primaryHarvestSeason: 'October - December / June - July',
    collectionHandling: [
      'Scrape encrusted resin from Ber, Kusum, or Palas host twigs using non-injurious blades.',
      'Air-dry scraped sticklac in shaded, well-ventilated rooms; turn twice daily.',
      'NEVER expose raw sticklac to direct hot sun.',
    ],
    standardPackaging: '40kg Jute Gunny Bag',
    packagingProtection: ['Breathable jute sacks stored exclusively in shaded, cool, well-ventilated bays.'],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: [
      'High thermal sensitivity: Night or early morning transit recommended during summer.',
      'Protect cargo bed from heat buildup; do not park under direct midday sun.',
    ],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: 8.0,
    allowableShrinkagePercent: 1.0,
    moistureNotes: 'Moisture combined with summer heat causes resin grains to fuse into an intractable solid lump.',
    storageEnvironment: 'Cool, shaded resin bay. Continuous ventilation required.',
    temperatureLimit: {
      maxC: 35,
      notes: 'CRITICAL: Above 35°C, natural sticklac softens and blocks (fuses together into solid rock).',
    },
    humidityLimit: null,
    suitableStorageCapabilities: ['COOL_SHADED_RESIN_BAY', 'DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: [
      'Thermal Blocking Risk: If exposed to >35°C, granular sticklac fuses into a hard block, causing severe value loss.',
      'Moth & Beetle Damage: Inspect for predator moth webs (Eublemma amabilis).',
    ],
    inspectionChecklist: [
      { id: 'ck-lc-1', label: 'Check that sticklac grains are free-flowing and not caked together.', stage: 'ALL', mandatory: true },
      { id: 'ck-lc-2', label: 'Verify depot bay temperature is below 35°C.', stage: 'STORAGE', mandatory: true },
      { id: 'ck-lc-3', label: 'Confirm vehicle transit has sun-shade protection.', stage: 'DISPATCH', mandatory: true },
    ],
    sourceReference: 'ICAR - Indian Institute of Natural Resins and Gums (IINRG) Ranchi Manual',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  shikakai: {
    productId: 'PROD-16',
    productSlug: 'shikakai',
    productName: 'Shikakai Pods',
    productNameOdia: 'ଶିକାକାଇ',
    scientificName: 'Senegalia rugata',
    primaryHarvestSeason: 'December - February',
    collectionHandling: [
      'Harvest mature brown wrinkled pods from thorny climbing shrubs.',
      'Sun-dry until pods become dark brown and snap crisply when bent.',
    ],
    standardPackaging: '40kg Jute Bag',
    packagingProtection: ['Standard jute gunny bags.'],
    typicalTareKgPerBag: 1.2,
    transportPrecautions: ['Standard covered vehicle transit.'],
    moistureSensitivity: 'LOW',
    verifiedMoistureMaxPercent: 11.0,
    allowableShrinkagePercent: 1.5,
    moistureNotes: 'Dry saponin pods; keep dry to prevent saponin leaching.',
    storageEnvironment: 'Dry aerated bay on pallets.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Moisture causes white powdery mold inside seed pods.'],
    inspectionChecklist: [
      { id: 'ck-sh-1', label: 'Confirm pods snap cleanly without spongy dampness.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'TDCCOL Herbal Procurement Manual',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },

  dhataki: {
    productId: 'PROD-17',
    productSlug: 'dhataki',
    productName: 'Dhataki Flowers',
    productNameOdia: 'ଧାତକୀ ଫୁଲ',
    scientificName: 'Woodfordia fruticosa',
    primaryHarvestSeason: 'February - April',
    collectionHandling: [
      'Gather scarlet tubular flowers during peak bloom.',
      'Sun-dry promptly on clean cotton cloth or bamboo mats to preserve natural fermentation yeast.',
    ],
    standardPackaging: '25kg Poly-lined Jute Bag',
    packagingProtection: ['Poly-lined jute bags to guard delicate flower petals against humidity.'],
    typicalTareKgPerBag: 1.0,
    transportPrecautions: ['Gentle handling to prevent crushing dried petals.'],
    moistureSensitivity: 'HIGH',
    verifiedMoistureMaxPercent: 10.0,
    allowableShrinkagePercent: 1.2,
    moistureNotes: 'Delicate Ayurvedic fermentation inoculant; high moisture destroys natural flora.',
    storageEnvironment: 'Dry, shaded, clean warehouse bay on raised dunnage.',
    temperatureLimit: null,
    humidityLimit: null,
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: ['Petal Crushing: Avoid heavy stacks exceeding 5 bags.'],
    inspectionChecklist: [
      { id: 'ck-dh-1', label: 'Verify red tubular flower color is bright without black fungal mold.', stage: 'ALL', mandatory: true },
    ],
    sourceReference: 'Ayurvedic Pharmacopoeia of India & TRIFED MFP Manual',
    guidanceStatus: 'OFFICIAL_RECOMMENDED',
  },
};

/**
 * Fallback profile for unconfigured or unknown produce items.
 * Adheres strictly to: "If a requirement is unknown, display 'Not configured — verify locally.'
 * Never invent official temperature, humidity, moisture, certification, or safety thresholds."
 */
export function createUnconfiguredFallbackProfile(productIdentifier: string): ProductHandlingProfile {
  return {
    productId: `PROD-UNKNOWN-${productIdentifier}`,
    productSlug: productIdentifier.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    productName: productIdentifier || 'Unconfigured Produce Item',
    productNameOdia: 'ଅଣ-କନଫିଗର ହୋଇଥିବା ବନଜାତ ଦ୍ରବ୍ୟ',
    scientificName: 'Not recorded in verified catalogue',
    primaryHarvestSeason: 'Not configured — verify locally',
    collectionHandling: [
      'Handling instructions not configured — conduct localized inspection.',
      'Follow standard forest produce sanitation and avoid direct ground contact.',
    ],
    standardPackaging: 'Standard breathable bag (Not configured — verify locally)',
    packagingProtection: [
      'Elevate on raised dunnage pallets as general safety measure.',
      'Not configured — verify locally with district forest officer.',
    ],
    typicalTareKgPerBag: 1.5,
    transportPrecautions: [
      'Default precaution: Protect with waterproof tarpaulin cover against unexpected rain.',
      'Not configured — verify locally before long-distance transit.',
    ],
    moistureSensitivity: 'MODERATE',
    verifiedMoistureMaxPercent: null, // Honest null: no invented threshold
    allowableShrinkagePercent: 1.5,
    moistureNotes: 'Not configured — verify locally. No official moisture threshold recorded for this item.',
    storageEnvironment: 'Not configured — verify locally. Standard dry aerated shed recommended.',
    temperatureLimit: null, // Honest null
    humidityLimit: null,    // Honest null
    suitableStorageCapabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    requiredVehicleCapabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED'],
    recommendedDepotZone: 'Rack B (Dry Stack)',
    warnings: [
      'Unverified Profile: No official state handling gazette linked to this product code.',
      'Conduct physical moisture and insect test before formal depot acceptance.',
    ],
    inspectionChecklist: [
      {
        id: 'ck-unk-1',
        label: 'Perform visual inspection for rot, mold, or live pest activity.',
        stage: 'ALL',
        mandatory: true,
        guidanceNote: 'Verify locally against state Van Dhan guidelines.',
      },
    ],
    sourceReference: 'Local Aggregation Center Ad-hoc Assessment (Simulated Baseline)',
    guidanceStatus: 'LOCAL_VERIFICATION_REQUIRED',
  };
}

/**
 * Resolves a product handling profile from any key, id, slug, or name.
 */
export function getProductGuidance(identifier: string | null | undefined): ProductHandlingProfile {
  if (!identifier) {
    return createUnconfiguredFallbackProfile('Unknown Item');
  }

  const normalized = identifier.trim().toLowerCase();

  // 1. Direct slug match
  if (PRODUCT_HANDLING_PROFILES[normalized]) {
    return PRODUCT_HANDLING_PROFILES[normalized];
  }

  // 2. Exact match in ODISHA_MFP_CATALOGUE (ID, slug, English name, or Odia name)
  const exactCatMatch = ODISHA_MFP_CATALOGUE.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.slug.toLowerCase() === normalized ||
      p.nameEnglish.toLowerCase() === normalized ||
      p.nameOdia.toLowerCase() === normalized
  );
  if (exactCatMatch && PRODUCT_HANDLING_PROFILES[exactCatMatch.slug]) {
    return PRODUCT_HANDLING_PROFILES[exactCatMatch.slug];
  }

  // 3. Normalized slug variations (e.g. replacing spaces/hyphens)
  const slugified = normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (PRODUCT_HANDLING_PROFILES[slugified]) {
    return PRODUCT_HANDLING_PROFILES[slugified];
  }

  // 4. Substring matching in ODISHA_MFP_CATALOGUE
  // Check deseeded tamarind before generic tamarind
  if (normalized.includes('deseed') || normalized.includes('de-seed') || normalized.includes('ମଞ୍ଜି ବିହୀନ')) {
    return PRODUCT_HANDLING_PROFILES['tamarind-deseeded'];
  }

  const partialCatMatch = ODISHA_MFP_CATALOGUE.find(
    (p) =>
      p.nameEnglish.toLowerCase().includes(normalized) ||
      p.nameOdia.includes(normalized)
  );
  if (partialCatMatch && PRODUCT_HANDLING_PROFILES[partialCatMatch.slug]) {
    return PRODUCT_HANDLING_PROFILES[partialCatMatch.slug];
  }

  // 5. Fallback matching for common keywords (e.g. 'mahua', 'sal', 'tamarind', 'honey')
  if (normalized.includes('mahua') || normalized.includes('ମହୁଲ')) return PRODUCT_HANDLING_PROFILES['mahua'];
  if (normalized.includes('sal') || normalized.includes('ଶାଳ')) return PRODUCT_HANDLING_PROFILES['sal-seeds'];
  if (normalized.includes('kendu') || normalized.includes('କେନ୍ଦୁ')) return PRODUCT_HANDLING_PROFILES['kendu-leaves'];
  if (normalized.includes('honey') || normalized.includes('मधु') || normalized.includes('ମହୁ')) return PRODUCT_HANDLING_PROFILES['wild-honey'];
  if (normalized.includes('tamarind') || normalized.includes('ତେନ୍ତୁଳି')) return PRODUCT_HANDLING_PROFILES['tamarind-seeded'];
  if (normalized.includes('lac') || normalized.includes('ଲାଖ')) return PRODUCT_HANDLING_PROFILES['lac'];
  if (normalized.includes('harida') || normalized.includes('ହରିଡ଼ା')) return PRODUCT_HANDLING_PROFILES['harida'];
  if (normalized.includes('bahada') || normalized.includes('ବାହାଡ଼ା')) return PRODUCT_HANDLING_PROFILES['bahada'];
  if (normalized.includes('amla') || normalized.includes('ଅଁଳା')) return PRODUCT_HANDLING_PROFILES['amla'];
  if (normalized.includes('char') || normalized.includes('chironji') || normalized.includes('ଚାର')) return PRODUCT_HANDLING_PROFILES['char-seeds'];
  if (normalized.includes('broom') || normalized.includes('ଝାଡ଼ୁ')) return PRODUCT_HANDLING_PROFILES['hill-broom'];
  if (normalized.includes('karanja')) return PRODUCT_HANDLING_PROFILES['karanja-seeds'];
  if (normalized.includes('kusum')) return PRODUCT_HANDLING_PROFILES['kusum-seeds'];
  if (normalized.includes('neem')) return PRODUCT_HANDLING_PROFILES['neem-seeds'];
  if (normalized.includes('shikakai')) return PRODUCT_HANDLING_PROFILES['shikakai'];
  if (normalized.includes('dhataki')) return PRODUCT_HANDLING_PROFILES['dhataki'];

  // 4. Safe fallback without inventing values
  return createUnconfiguredFallbackProfile(identifier);
}

/**
 * Fleet of recorded vehicles with verified or unverified transit capabilities
 */
export const RECORDED_VEHICLES: VehicleCapabilityRecord[] = [
  {
    vehicleNumber: 'OR-11-F-4412',
    driverName: 'B. Soren',
    driverPhone: '94371-88421',
    vehicleType: 'Covered Medium Cargo Truck (3.5 Ton)',
    capabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-03-10 · Karanjia Field Depot Inspector',
    verifiedBy: 'R. Mohanty (CM-12)',
    notes: 'Heavy-duty 550 GSM waterproof tarpaulin with tie-down winches. Bed cleaned and dry.',
  },
  {
    vehicleNumber: 'OD-11-AB-1234',
    driverName: 'B. Nayak',
    driverPhone: '94371-55210',
    vehicleType: 'Covered Light Commercial Van (1.5 Ton)',
    capabilities: ['WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-03-12 · Rairangpur Checkpost',
    verifiedBy: 'S. Das (IM-04)',
    notes: 'Enclosed canopy with sealed tarpaulin flaps.',
  },
  {
    vehicleNumber: 'OD-11-FG-8801',
    driverName: 'P. Majhi',
    driverPhone: '94372-11002',
    vehicleType: 'Specialized Food-Grade Insulated Van',
    capabilities: ['FOOD_GRADE_CONTAINMENT', 'WATERPROOF_TARPAULIN', 'CLEAN_DRY_BED', 'SECURED_LASHING'],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-03-01 · Baripada Quality Lab',
    verifiedBy: 'K. C. Jena (Food Safety Officer)',
    notes: 'Dedicated sanitary transport suitable for honey carboys and deseeded tamarind slabs.',
  },
  {
    vehicleNumber: 'OR-11-OPEN-99',
    driverName: 'G. Hembram',
    driverPhone: '94378-99214',
    vehicleType: 'Open Flatbed Tractor Trailer',
    capabilities: ['CLEAN_DRY_BED'], // Missing tarpaulin and food containment
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-02-18 · Karanjia Rural Yard',
    verifiedBy: 'A. Mohanty (CM-01)',
    notes: 'Open trailer without overhead tarpaulin canopy. Restricted to dry-weather non-sensitive cartage.',
  },
  {
    vehicleNumber: 'JH-05-UNK-55',
    driverName: 'Unregistered Transporter',
    driverPhone: 'Not provided',
    vehicleType: 'Third-party Hired Lorry',
    capabilities: [],
    verificationStatus: 'UNVERIFIED',
    notes: 'Capabilities have not been inspected or recorded. Requires physical pre-dispatch check.',
  },
];

/**
 * Aggregation centers and depots with recorded storage capabilities
 */
export const RECORDED_DEPOTS: DepotCapabilityRecord[] = [
  {
    depotId: 'LOC-BRP-01',
    depotName: 'Baripada Central Depôt #02',
    depotNameOdia: 'ବାରିପଦା କେନ୍ଦ୍ରୀୟ ଡିପୋ',
    block: 'Baripada Sadar',
    locationType: 'CENTRAL_DEPOT',
    capabilities: [
      'DRY_AERATED_BAY',
      'RAISED_DUNNAGE_PALLETS',
      'COOL_SHADED_RESIN_BAY',
      'SEALED_FOOD_GRADE_STORAGE',
      'QUARANTINE_ISOLATION_ZONE',
    ],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-01-15 · State Depot Audit',
    verifiedBy: 'TDCCOL Regional Quality Inspector',
    notes: '500 MT capacity state depot with full dunnage pallets and dedicated quarantine cell.',
  },
  {
    depotId: 'LOC-KRN-01',
    depotName: 'Karanjia Aggregation Center #01',
    depotNameOdia: 'କରଞ୍ଜିଆ ସଂଗ୍ରହ କେନ୍ଦ୍ର',
    block: 'Karanjia',
    locationType: 'BLOCK_AGGREGATION',
    capabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS', 'QUARANTINE_ISOLATION_ZONE'],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-02-10 · Sub-divisional Inspection',
    verifiedBy: 'A. Mohanty (CM-01)',
    notes: '80 MT capacity transit shed. Suitable for dry grain and flowers; lacks cool resin bay.',
  },
  {
    depotId: 'LOC-JAS-02',
    depotName: 'Jashipur Collection Center',
    depotNameOdia: 'ଯଶୀପୁର ସଂଗ୍ରହ କେନ୍ଦ୍ର',
    block: 'Jashipur',
    locationType: 'BLOCK_AGGREGATION',
    capabilities: ['DRY_AERATED_BAY', 'RAISED_DUNNAGE_PALLETS'],
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-02-14 · Sub-divisional Inspection',
    verifiedBy: 'R. K. Behera (CM-02)',
    notes: 'Standard dry shed on raised dunnage.',
  },
  {
    depotId: 'LOC-YARD-OPEN',
    depotName: 'Karanjia Overflow Open Yard',
    depotNameOdia: 'କରଞ୍ଜିଆ ଖୋଲା ଅଗଣା',
    block: 'Karanjia',
    locationType: 'VILLAGE_COLLECTION',
    capabilities: [], // Unroofed open yard lacking dry aerated bay and pallets
    verificationStatus: 'VERIFIED',
    verifiedAt: '2025-01-20 · Field Assessment',
    verifiedBy: 'A. Mohanty (CM-01)',
    notes: 'Unsheltered gravel yard. Unsuitable for moisture-sensitive forest produce.',
  },
  {
    depotId: 'LOC-TEMP-UNKN',
    depotName: 'Temporary Transit Holding Point #09',
    depotNameOdia: 'ଅସ୍ଥାୟୀ ସଂଗ୍ରହ ବିନ୍ଦୁ',
    block: 'Mayurbhanj Hills',
    locationType: 'VILLAGE_COLLECTION',
    capabilities: [],
    verificationStatus: 'UNVERIFIED',
    notes: 'Unverified facilities. No physical inspection on record.',
  },
];

/**
 * Evaluates whether a vehicle is suitable for carrying a product
 */
export function evaluateVehicleCompatibility(
  product: string | ProductHandlingProfile,
  vehicle: VehicleCapabilityRecord | string
): CapabilityMatchResult {
  const profile = typeof product === 'string' ? getProductGuidance(product) : product;
  const vehicleRecord: VehicleCapabilityRecord | undefined =
    typeof vehicle === 'string'
      ? RECORDED_VEHICLES.find((v) => v.vehicleNumber.toLowerCase() === vehicle.trim().toLowerCase())
      : vehicle;

  // Rule: Do not claim vehicle is suitable if not recorded or not verified
  if (!vehicleRecord) {
    return {
      status: 'UNKNOWN_REQUIRES_INSPECTION',
      summary: 'Vehicle capabilities not recorded in system.',
      matchedCapabilities: [],
      missingCapabilities: profile.requiredVehicleCapabilities,
      recommendation: 'Mandatory pre-dispatch physical inspection required before assigning vehicle.',
    };
  }

  if (vehicleRecord.verificationStatus !== 'VERIFIED') {
    return {
      status: 'UNKNOWN_REQUIRES_INSPECTION',
      summary: `Vehicle inspection status is ${vehicleRecord.verificationStatus}.`,
      matchedCapabilities: vehicleRecord.capabilities,
      missingCapabilities: profile.requiredVehicleCapabilities.filter(
        (c) => !vehicleRecord.capabilities.includes(c)
      ),
      recommendation: 'Vehicle capabilities have not been certified. Physical inspection required before dispatch.',
    };
  }

  // Check required capabilities
  const missing = profile.requiredVehicleCapabilities.filter(
    (cap) => !vehicleRecord.capabilities.includes(cap)
  );
  const matched = profile.requiredVehicleCapabilities.filter((cap) =>
    vehicleRecord.capabilities.includes(cap)
  );

  if (missing.length > 0) {
    const missingLabels = missing.map((c) => CAPABILITY_DEFINITIONS[c]?.label || c).join(', ');
    return {
      status: 'UNSUITABLE',
      summary: `Vehicle lacks required capabilities: ${missingLabels}.`,
      matchedCapabilities: matched,
      missingCapabilities: missing,
      recommendation: `Do not dispatch ${profile.productName} in this vehicle. Requires: ${missingLabels}.`,
    };
  }

  return {
    status: 'SUITABLE',
    summary: 'Vehicle satisfies all transport and weather protection requirements.',
    matchedCapabilities: matched,
    missingCapabilities: [],
    recommendation: 'Approved for consignment dispatch under standard security seal.',
  };
}

/**
 * Evaluates whether a destination depot is suitable for storing a product
 */
export function evaluateDepotCompatibility(
  product: string | ProductHandlingProfile,
  depot: DepotCapabilityRecord | string
): CapabilityMatchResult {
  const profile = typeof product === 'string' ? getProductGuidance(product) : product;
  const depotRecord: DepotCapabilityRecord | undefined =
    typeof depot === 'string'
      ? RECORDED_DEPOTS.find(
          (d) =>
            d.depotId.toLowerCase() === depot.trim().toLowerCase() ||
            d.depotName.toLowerCase().includes(depot.trim().toLowerCase()) ||
            depot.trim().toLowerCase().includes(d.depotId.toLowerCase())
        )
      : depot;

  // Rule: Do not claim depot is suitable if capabilities are not recorded or not verified
  if (!depotRecord) {
    return {
      status: 'UNKNOWN_REQUIRES_INSPECTION',
      summary: 'Destination depot capabilities not recorded in registry.',
      matchedCapabilities: [],
      missingCapabilities: profile.suitableStorageCapabilities,
      recommendation: 'Depot storage facilities must be inspected locally before routing stock.',
    };
  }

  if (depotRecord.verificationStatus !== 'VERIFIED') {
    return {
      status: 'UNKNOWN_REQUIRES_INSPECTION',
      summary: `Depot verification status is ${depotRecord.verificationStatus}.`,
      matchedCapabilities: depotRecord.capabilities,
      missingCapabilities: profile.suitableStorageCapabilities.filter(
        (c) => !depotRecord.capabilities.includes(c)
      ),
      recommendation: 'Depot certification expired or pending. Requires supervisor clearance.',
    };
  }

  // Check required capabilities
  const missing = profile.suitableStorageCapabilities.filter(
    (cap) => !depotRecord.capabilities.includes(cap)
  );
  const matched = profile.suitableStorageCapabilities.filter((cap) =>
    depotRecord.capabilities.includes(cap)
  );

  if (missing.length > 0) {
    const missingLabels = missing.map((c) => CAPABILITY_DEFINITIONS[c]?.label || c).join(', ');
    return {
      status: 'UNSUITABLE',
      summary: `Depot lacks required storage capabilities: ${missingLabels}.`,
      matchedCapabilities: matched,
      missingCapabilities: missing,
      recommendation: `Unsuitable destination for ${profile.productName}. Lacks: ${missingLabels}.`,
    };
  }

  return {
    status: 'SUITABLE',
    summary: 'Depot provides all required environmental storage bays and dunnage infrastructure.',
    matchedCapabilities: matched,
    missingCapabilities: [],
    recommendation: 'Approved destination depot for physical stock intake and ledger booking.',
  };
}

/**
 * Combined Dispatch Match Evaluation
 */
export function evaluateDispatchMatch(
  productIdentifier: string,
  vehicleNumber: string,
  depotId: string
): {
  profile: ProductHandlingProfile;
  vehicleResult: CapabilityMatchResult;
  depotResult: CapabilityMatchResult;
  overallStatus: CapabilityMatchStatus;
  canDispatchSafely: boolean;
  blockReason?: string;
} {
  const profile = getProductGuidance(productIdentifier);
  const vehicleResult = evaluateVehicleCompatibility(profile, vehicleNumber);
  const depotResult = evaluateDepotCompatibility(profile, depotId);

  let overallStatus: CapabilityMatchStatus = 'SUITABLE';
  let canDispatchSafely = true;
  let blockReason: string | undefined = undefined;

  if (vehicleResult.status === 'UNSUITABLE' || depotResult.status === 'UNSUITABLE') {
    overallStatus = 'UNSUITABLE';
    canDispatchSafely = false;
    blockReason =
      vehicleResult.status === 'UNSUITABLE'
        ? `Incompatible Vehicle: ${vehicleResult.summary}`
        : `Incompatible Depot: ${depotResult.summary}`;
  } else if (
    vehicleResult.status === 'UNKNOWN_REQUIRES_INSPECTION' ||
    depotResult.status === 'UNKNOWN_REQUIRES_INSPECTION'
  ) {
    overallStatus = 'UNKNOWN_REQUIRES_INSPECTION';
    canDispatchSafely = false;
    blockReason =
      vehicleResult.status === 'UNKNOWN_REQUIRES_INSPECTION'
        ? `Unverified Vehicle: ${vehicleResult.summary}`
        : `Unverified Depot: ${depotResult.summary}`;
  }

  return {
    profile,
    vehicleResult,
    depotResult,
    overallStatus,
    canDispatchSafely,
    blockReason,
  };
}
