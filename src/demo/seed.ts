export interface Collector {
  id: string;
  tribalId: string;
  name: string;
  nameOdia: string;
  gender: 'F' | 'M';
  age: number;
  village: string;
  villageOdia: string;
  weightKg: number;
  ratePerKg: number;
  grossPayout: number;
  bankName: string;
  accountEnding: string;
  dbtRef: string;
  paymentStatus: 'PAID_SIMULATED' | 'READY_FOR_DISBURSEMENT';
  collectedDate: string;
}

export interface Facilitator {
  id: string;
  name: string;
  nameOdia: string;
  role: string;
  shgName: string;
  center: string;
  phoneEnding: string;
}

export interface CollectionManager {
  id: string;
  name: string;
  role: string;
  division: string;
  center: string;
}

export interface InventoryManager {
  id: string;
  name: string;
  role: string;
  depotName: string;
  terminalId: string;
}

export interface Product {
  id: string;
  name: string;
  nameOdia: string;
  scientificName: string;
  ratePerKg: number;
  rateSource: string; // "MSP 2024 (simulated)"
  season: string;
  standardTolerancePercent: number;
}

export interface BatchRecord {
  id: string; // "BS-402"
  produceId: string;
  produceName: string;
  produceOdia: string;
  status: 'pending_verification' | 'verified_saleable' | 'quarantined_discrepancy';
  statusLabel: string;
  totalNetKg: number;
  grossKg: number;
  tareKg: number;
  sackCount: number;
  sealTagId: string;
  vehicleNumber: string;
  driverName: string;
  dispatchTimestamp: string;
  centerName: string;
  facilitatorId: string;
  collectionManagerId: string;
  collectorContributions: Collector[];
  notes: string;
  mockLabel: string;
}

export interface StockLedger {
  saleableStockKg: number; // 0 kg per spec ("Do not seed any saleable stock")
  inTransitPendingVerificationKg: number; // 100.00 kg
  quarantinedDiscrepancyKg: number; // 0 kg
}

export const DEMO_COLLECTORS: Collector[] = [
  {
    id: 'COL-001',
    tribalId: 'OR-MAY-KRN-0842',
    name: 'Raimati Soren',
    nameOdia: 'ରାଇମତୀ ସୋରେନ',
    gender: 'F',
    age: 38,
    village: 'Badagaon, Karanjia',
    villageOdia: 'ବଡ଼ଗାଁ, କରଞ୍ଜିଆ',
    weightKg: 40.0,
    ratePerKg: 42.0,
    grossPayout: 1680.0,
    bankName: 'Canara Bank (Karanjia Branch)',
    accountEnding: '•••4812',
    dbtRef: 'DBT-OD-2024-8841 (Simulated)',
    paymentStatus: 'PAID_SIMULATED',
    collectedDate: '2024-04-18 09:15 AM IST',
  },
  {
    id: 'COL-002',
    tribalId: 'OR-MAY-KRN-1109',
    name: 'Gura Marndi',
    nameOdia: 'ଗୁରା ମାରାଣ୍ଡି',
    gender: 'M',
    age: 44,
    village: 'Badagaon, Karanjia',
    villageOdia: 'ବଡ଼ଗାଁ, କରଞ୍ଜିଆ',
    weightKg: 35.0,
    ratePerKg: 42.0,
    grossPayout: 1470.0,
    bankName: 'Odisha Gramya Bank (Karanjia)',
    accountEnding: '•••9103',
    dbtRef: 'DBT-OD-2024-8842 (Simulated)',
    paymentStatus: 'PAID_SIMULATED',
    collectedDate: '2024-04-18 09:40 AM IST',
  },
  {
    id: 'COL-003',
    tribalId: 'OR-MAY-KRN-0623',
    name: 'Sombari Murmu',
    nameOdia: 'ସୋମବାରୀ ମୁର୍ମୁ',
    gender: 'F',
    age: 29,
    village: 'Kadamdiha, Karanjia',
    villageOdia: 'କଦମଡିହା, କରଞ୍ଜିଆ',
    weightKg: 25.0,
    ratePerKg: 42.0,
    grossPayout: 1050.0,
    bankName: 'State Bank of India (Karanjia)',
    accountEnding: '•••2271',
    dbtRef: 'DBT-OD-2024-8843 (Simulated)',
    paymentStatus: 'PAID_SIMULATED',
    collectedDate: '2024-04-18 10:05 AM IST',
  },
];

export const DEMO_FACILITATOR: Facilitator = {
  id: 'SHG-FAC-09',
  name: 'Champa Majhi',
  nameOdia: 'ଚମ୍ପା ମାଝି',
  role: 'Van Dhan SHG Facilitator (Simulated)',
  shgName: 'Maa Tarini Tribal Self Help Group',
  center: 'Badagaon Van Dhan Vikas Kendra',
  phoneEnding: '•••5521',
};

export const DEMO_COLLECTION_MANAGER: CollectionManager = {
  id: 'CM-12',
  name: 'R. Mohanty',
  role: 'Field Collection Manager (Simulated)',
  division: 'Mayurbhanj Tribal MFP Circle',
  center: 'Karanjia Block Collection Point #01',
};

export const DEMO_INVENTORY_MANAGER: InventoryManager = {
  id: 'IM-04',
  name: 'S. Das',
  role: 'Warehouse Inventory Manager (Simulated)',
  depotName: 'Baripada Central Depôt #02',
  terminalId: 'BRP-D02-09',
};

export const DEMO_PRODUCT: Product = {
  id: 'PROD-MAHUA-01',
  name: 'Dried Mahua Flowers',
  nameOdia: 'ଶୁଖିଲା ମହୁଲ ଫୁଲ',
  scientificName: 'Madhuca longifolia',
  ratePerKg: 42.0,
  rateSource: 'MSP 2024 (simulated)',
  season: 'Spring / Summer 2024',
  standardTolerancePercent: 2.0,
};

export const DEMO_BATCH_BS402: BatchRecord = {
  id: 'BS-402',
  produceId: DEMO_PRODUCT.id,
  produceName: DEMO_PRODUCT.name,
  produceOdia: DEMO_PRODUCT.nameOdia,
  status: 'pending_verification',
  statusLabel: 'Pending Depôt Verification',
  totalNetKg: 100.0,
  grossKg: 104.2,
  tareKg: 4.2,
  sackCount: 3,
  sealTagId: 'OD-ST-8840',
  vehicleNumber: 'OR-11-F-4412',
  driverName: 'B. Soren',
  dispatchTimestamp: '2024-04-18 11:20 AM IST',
  centerName: 'Badagaon Van Dhan Vikas Kendra',
  facilitatorId: DEMO_FACILITATOR.id,
  collectionManagerId: DEMO_COLLECTION_MANAGER.id,
  collectorContributions: DEMO_COLLECTORS,
  notes: 'Weighed on electronic scale #04. Double-stitched jute gunny bags with stencil #BS-402. Dispatched under tarpaulin cover to Baripada.',
  mockLabel: 'Mock Data · Prototype Field Record',
};

export const DEMO_STOCK_LEDGER: StockLedger = {
  saleableStockKg: 0, // Explicitly 0: "Do not seed any saleable stock"
  inTransitPendingVerificationKg: 100.0,
  quarantinedDiscrepancyKg: 0,
};
