/**
 * SAMAGNA Phase 4: Processing and Value-Addition Coordination Network
 *
 * Invariants:
 * 1. FULL_TRACEABILITY: Unbroken parent input lot -> output value-added lot lineage.
 * 2. MASS_BALANCE_RECONCILIATION: Input Net Weight = Output Net Weight + By-Products + Processing Loss.
 * 3. NO_AUTO_ALLOCATION: Capacity matching provides comparison candidates only; requires manual confirmation.
 * 4. CAPACITY_CONFLICT_PREVENTION: Prevents booking exceeding daily capacity limits on overlapping dates.
 * 5. PILOT_REVENUE_INVARIANT: Coordination fee rate is 0.0 in pilot; zero fee deductions from collectors.
 */

export type FacilityVerificationStatus =
  | 'PENDING_INSPECTION'
  | 'VERIFIED_OPERATIONAL'
  | 'UNDER_MAINTENANCE'
  | 'SUSPENDED';

export type ProcessingRequestStatus =
  | 'SUBMITTED'
  | 'MATCHED'
  | 'UNDER_FACILITY_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'JOB_SCHEDULED'
  | 'CANCELLED';

export type ProcessingJobStatus =
  | 'SCHEDULED'
  | 'INPUT_STAGED'
  | 'IN_PROCESS'
  | 'OUTPUT_INSPECTION'
  | 'COMPLETED_VERIFIED'
  | 'REJECTED_DISCREPANCY';

export interface ProcessingFacility {
  id: string; // e.g. "FAC-MAYUR-HONEY-01"
  code: string; // e.g. "FAC-KRN-01"
  name: string;
  operatorOrgId: string;
  operatorOrgName: string;
  locationAddress: string;
  district: string;
  state: string;
  pincode: string;
  processingCapabilities: string[];
  supportedCategories: string[];
  machineryEquipment: string;
  dailyCapacityKg: number;
  operatingAvailability: string;
  minimumBatchKg: number;
  indicativeProcessingChargePerKg: number;
  verificationStatus: FacilityVerificationStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingRequest {
  id: string; // e.g. "REQ-PROC-2025-001"
  requestNumber: string; // e.g. "REQ-PROC-2025-001"
  requestingOrgId: string;
  requestingOrgName: string;
  targetFacilityId?: string | null;
  inputProduceSlug: string;
  inputProduceName: string;
  inputQuantityKg: number;
  requiredOutputName: string;
  desiredQualitySpecs: string;
  expectedYieldPercent: number;
  expectedOutputQuantityKg: number;
  facilityRequirements?: string | null;
  preferredStartDate: string;
  preferredCompletionDate: string;
  deliveryRequirements: string;
  status: ProcessingRequestStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingAuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}

export interface ProcessingJob {
  id: string; // e.g. "JOB-PROC-2025-001"
  jobCode: string; // e.g. "JOB-PROC-2025-001"
  requestId: string;
  facilityId: string;
  facilityName?: string;
  inputLotRef: string; // Physical parent lot reference (e.g. "BS-402")
  inputProduceName: string;
  inputQuantityKg: number;
  outputProduceName: string;
  outputLotRef: string; // New refined output lot reference (e.g. "LOT-VAL-HONEY-2025-01")
  outputQuantityKg?: number | null;
  processingLossKg?: number | null;
  byProductQuantityKg?: number | null;
  byProductDescription?: string | null;
  actualYieldPercent?: number | null;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string | null;
  qualityInspectionRef?: string | null;
  qualityInspectionNotes?: string | null;
  status: ProcessingJobStatus;
  supportingDocuments: string[];
  auditHistory: ProcessingAuditLogEntry[];
  coordinationFeeRate: number; // 0.0 in pilot
  coordinationFeeInr: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Validates mass-balance conservation:
 * Input Net Weight = Output Net Weight + By-Product Weight + Processing Loss
 */
export function validateMassBalance(
  inputKg: number,
  outputKg: number,
  byProductKg: number,
  lossKg: number,
  tolerancePercent = 0.5
): { valid: boolean; varianceKg: number; actualTotalKg: number; message: string } {
  const actualTotalKg = Math.round((outputKg + byProductKg + lossKg) * 100) / 100;
  const varianceKg = Math.round(Math.abs(inputKg - actualTotalKg) * 100) / 100;
  const maxAllowedVarianceKg = Math.round((inputKg * (tolerancePercent / 100)) * 100) / 100;

  const valid = varianceKg <= maxAllowedVarianceKg;
  const message = valid
    ? `Mass balance reconciled successfully: Input ${inputKg} kg = Output ${outputKg} kg + By-Products ${byProductKg} kg + Loss ${lossKg} kg (Variance: ${varianceKg} kg).`
    : `Mass balance discrepancy detected! Input ${inputKg} kg does not equal sum of Output (${outputKg} kg) + By-Products (${byProductKg} kg) + Loss (${lossKg} kg). Variance: ${varianceKg} kg exceeds tolerance ${maxAllowedVarianceKg} kg.`;

  return { valid, varianceKg, actualTotalKg, message };
}

/**
 * Seed Processing Facilities for Odisha Forest Clusters
 */
export const DEFAULT_PROCESSING_FACILITIES: ProcessingFacility[] = [
  {
    id: 'FAC-MAYUR-HONEY-01',
    code: 'FAC-KRN-01',
    name: 'Karanjia Tribal Honey Filtration & Curing Center',
    operatorOrgId: 'ORG-TDCCOL-OR',
    operatorOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    locationAddress: 'TDCCOL Processing Complex, SH-19, Karanjia',
    district: 'Mayurbhanj',
    state: 'Odisha',
    pincode: '757037',
    processingCapabilities: [
      'Cold Multi-Stage Filtration',
      'Vacuum Moisture Reduction',
      'Beeswax Separation & Casting',
      'Food-Grade Bottling & Nitrogen Sealing',
    ],
    supportedCategories: ['Non-Timber Forest Produce', 'Honey'],
    machineryEquipment: '316L Stainless Steel Vacuum Processing Unit, Rotary Drum Honey Warmer, 5-Micron Bag Filter',
    dailyCapacityKg: 500.0,
    operatingAvailability: 'MON_TO_SAT_8AM_6PM',
    minimumBatchKg: 50.0,
    indicativeProcessingChargePerKg: 14.0,
    verificationStatus: 'VERIFIED_OPERATIONAL',
    isActive: true,
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'FAC-KORAPUT-TAMARIND-01',
    code: 'FAC-SNB-01',
    name: 'Sunabeda High-Altitude Tamarind Deseeding & Value-Addition Unit',
    operatorOrgId: 'ORG-TDCCOL-OR',
    operatorOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    locationAddress: 'Industrial Estate, Phase II, Sunabeda',
    district: 'Koraput',
    state: 'Odisha',
    pincode: '763002',
    processingCapabilities: [
      'Mechanical Pod De-husking',
      'Roller De-seeding',
      'Fibre Stripping',
      'Hydraulic Slab Pressing & Vacuum Packaging',
    ],
    supportedCategories: ['Non-Timber Forest Produce'],
    machineryEquipment: 'Industrial Tamarind Deseeder (1.5 HP), Twin Roller Cracker, 10-Ton Hydraulic Slab Press',
    dailyCapacityKg: 1000.0,
    operatingAvailability: 'MON_TO_SAT_7AM_7PM',
    minimumBatchKg: 100.0,
    indicativeProcessingChargePerKg: 8.5,
    verificationStatus: 'VERIFIED_OPERATIONAL',
    isActive: true,
    createdAt: '2025-01-20T10:00:00.000Z',
    updatedAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'FAC-SUNDAR-HERBAL-01',
    code: 'FAC-ROU-01',
    name: 'Rourkela Wild Medicinal Flora Grinding & Granulation Plant',
    operatorOrgId: 'BUS-BAIDYA-02',
    operatorOrgName: 'Shree Baidyanath Ayurved Bhawan Pvt Ltd',
    locationAddress: 'Kalunga Industrial Area, Rourkela',
    district: 'Sundargarh',
    state: 'Odisha',
    pincode: '770031',
    processingCapabilities: [
      'Cryogenic Fine Pulverization',
      'Mechanical Sieve Grading (60-120 Mesh)',
      'Decoction Granulation',
      'AYUSH GMP Moisture Standardization',
    ],
    supportedCategories: ['Medicinal Flora', 'Oilseed'],
    machineryEquipment: 'Liquid Nitrogen Cryo-Mill, Vibratory Sifter, Fluidized Bed Granulator',
    dailyCapacityKg: 800.0,
    operatingAvailability: 'MON_TO_FRI_8AM_8PM',
    minimumBatchKg: 50.0,
    indicativeProcessingChargePerKg: 12.0,
    verificationStatus: 'VERIFIED_OPERATIONAL',
    isActive: true,
    createdAt: '2025-02-01T11:00:00.000Z',
    updatedAt: '2025-02-01T11:00:00.000Z',
  },
  {
    id: 'FAC-MALKAN-OIL-01',
    code: 'FAC-MLK-01',
    name: 'Malkangiri Tribal Oilseed Mechanical Expeller Unit',
    operatorOrgId: 'ORG-TDCCOL-OR',
    operatorOrgName: 'Tribal Development Co-operative Corporation of Odisha Ltd (TDCCOL)',
    locationAddress: 'Sub-Divisional Godown Complex, Malkangiri',
    district: 'Malkangiri',
    state: 'Odisha',
    pincode: '764045',
    processingCapabilities: [
      'Cold Oil Expelling (Karanja, Neem, Kusum)',
      'Oil Cake Compacting',
      'Clarification Tank Settling',
    ],
    supportedCategories: ['Oilseed'],
    machineryEquipment: 'Kirloskar 6-Bolt Expeller, Filter Press, Oil Clarification Vat',
    dailyCapacityKg: 600.0,
    operatingAvailability: 'MON_TO_SAT_8AM_5PM',
    minimumBatchKg: 75.0,
    indicativeProcessingChargePerKg: 9.0,
    verificationStatus: 'PENDING_INSPECTION',
    isActive: false,
    createdAt: '2025-02-10T14:00:00.000Z',
    updatedAt: '2025-02-10T14:00:00.000Z',
  },
];

/**
 * Seed Processing Requests
 */
export const DEFAULT_PROCESSING_REQUESTS: ProcessingRequest[] = [
  {
    id: 'REQ-PROC-2025-001',
    requestNumber: 'REQ-PROC-2025-001',
    requestingOrgId: 'BUS-DABUR-01',
    requestingOrgName: 'Dabur India Limited',
    targetFacilityId: 'FAC-MAYUR-HONEY-01',
    inputProduceSlug: 'honey-wild',
    inputProduceName: 'Raw Forest Honey (Similipal Reserve)',
    inputQuantityKg: 200.0,
    requiredOutputName: 'Filtered Multifloral Table Honey (FSSAI Grade)',
    desiredQualitySpecs: 'Moisture < 18.0%, HMF < 20 mg/kg, zero artificial heating crystallization',
    expectedYieldPercent: 85.0,
    expectedOutputQuantityKg: 170.0,
    facilityRequirements: 'Must use 316L stainless steel food-grade filtration with cold wax separation.',
    preferredStartDate: '2025-04-01T00:00:00.000Z',
    preferredCompletionDate: '2025-04-05T00:00:00.000Z',
    deliveryRequirements: 'Dispatch in 15kg food-grade carboys to Sahibabad unit.',
    status: 'JOB_SCHEDULED',
    rejectionReason: null,
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2025-03-02T12:00:00.000Z',
  },
  {
    id: 'REQ-PROC-2025-002',
    requestNumber: 'REQ-PROC-2025-002',
    requestingOrgId: 'BUS-BAIDYA-02',
    requestingOrgName: 'Shree Baidyanath Ayurved Bhawan Pvt Ltd',
    targetFacilityId: 'FAC-SUNDAR-HERBAL-01',
    inputProduceSlug: 'harida',
    inputProduceName: 'Haritaki (Harida)',
    inputQuantityKg: 150.0,
    requiredOutputName: 'Cryo-Milled Haritaki Fruit Pulp Powder (80 Mesh)',
    desiredQualitySpecs: 'Tannin content > 30%, moisture < 9.5%, zero charred particle contamination',
    expectedYieldPercent: 80.0,
    expectedOutputQuantityKg: 120.0,
    facilityRequirements: 'Cryogenic pulverization to preserve thermolabile hydrolysable tannins.',
    preferredStartDate: '2025-04-10T00:00:00.000Z',
    preferredCompletionDate: '2025-04-12T00:00:00.000Z',
    deliveryRequirements: 'Moisture barrier bags packed in 25kg drums.',
    status: 'UNDER_FACILITY_REVIEW',
    rejectionReason: null,
    createdAt: '2025-03-04T11:30:00.000Z',
    updatedAt: '2025-03-04T11:30:00.000Z',
  },
];

/**
 * Seed Processing Jobs with Complete Lineage & Mass-Balance
 */
export const DEFAULT_PROCESSING_JOBS: ProcessingJob[] = [
  {
    id: 'JOB-PROC-2025-001',
    jobCode: 'JOB-PROC-2025-001',
    requestId: 'REQ-PROC-2025-001',
    facilityId: 'FAC-MAYUR-HONEY-01',
    facilityName: 'Karanjia Tribal Honey Filtration & Curing Center',
    inputLotRef: 'BS-402', // Input Raw Lot Ref
    inputProduceName: 'Raw Forest Honey (Similipal Reserve)',
    inputQuantityKg: 200.0,
    outputProduceName: 'Filtered Multifloral Table Honey (FSSAI Grade)',
    outputLotRef: 'LOT-VAL-HONEY-2025-01', // Unique traceable output lot
    outputQuantityKg: 168.0,
    processingLossKg: 10.0,
    byProductQuantityKg: 22.0,
    byProductDescription: 'Pure Forest Beeswax (Capped Comb Wax Cakes)',
    actualYieldPercent: 84.0,
    startDate: '2025-04-01T08:00:00.000Z',
    targetCompletionDate: '2025-04-03T18:00:00.000Z',
    actualCompletionDate: '2025-04-03T17:30:00.000Z',
    qualityInspectionRef: 'QC-FAC-2025-088',
    qualityInspectionNotes: 'Moisture 17.6% (compliant <18%), HMF 12 mg/kg, FSSAI table grade certified.',
    status: 'COMPLETED_VERIFIED',
    supportingDocuments: [
      '/docs/proc-QC-FAC-2025-088.pdf',
      '/docs/weighment-inward-200kg.pdf',
      '/docs/weighment-outward-168kg.pdf',
    ],
    auditHistory: [
      {
        timestamp: '2025-03-02T12:00:00.000Z',
        actor: 'sdas.baripada (Facility Manager)',
        action: 'SCHEDULE_PROCESSING_JOB',
        previousStatus: 'UNDER_FACILITY_REVIEW',
        newStatus: 'SCHEDULED',
        notes: 'Confirmed capacity in Karanjia Honey Unit. Job scheduled for April 1-3.',
      },
      {
        timestamp: '2025-04-01T08:30:00.000Z',
        actor: 'operator.karanjia',
        action: 'STAGE_RAW_MATERIAL',
        previousStatus: 'SCHEDULED',
        newStatus: 'INPUT_STAGED',
        notes: 'Inward lot BS-402 weighed and sampled: 200.0 kg gross raw honey.',
      },
      {
        timestamp: '2025-04-02T10:00:00.000Z',
        actor: 'operator.karanjia',
        action: 'COMMENCE_FILTRATION',
        previousStatus: 'INPUT_STAGED',
        newStatus: 'IN_PROCESS',
        notes: 'Cold filtration and vacuum curing active.',
      },
      {
        timestamp: '2025-04-03T17:30:00.000Z',
        actor: 'qc.inspector.mayurbhanj',
        action: 'RECORD_MASS_BALANCE_AND_QC',
        previousStatus: 'OUTPUT_INSPECTION',
        newStatus: 'COMPLETED_VERIFIED',
        notes: 'Mass balance reconciled: 168kg honey + 22kg beeswax + 10kg loss = 200kg input. QC passed.',
      },
    ],
    coordinationFeeRate: 0.0, // 0.0 in pilot
    coordinationFeeInr: 0.0,
    createdAt: '2025-03-02T12:00:00.000Z',
    updatedAt: '2025-04-03T17:30:00.000Z',
  },
];

