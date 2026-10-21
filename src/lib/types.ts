export type RoleType = 'COLLECTOR_SHG' | 'FIELD_MANAGER' | 'WAREHOUSE_MANAGER';

export type BatchStatus =
  | 'REQUESTED'
  | 'SAVED_OFFLINE_PENDING_SYNC'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED_SALEABLE'
  | 'QUARANTINED_DISCREPANCY';

export interface CollectorContribution {
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
  signedByFacilitator: string;
}

export interface Step1FieldVerification {
  grossWeightKg: number;
  tareWeightKg: number;
  netAcceptedKg: number;
  grade: 'Grade A - Properly Dried' | 'Grade B - Moderate Moisture' | 'Grade C - Substandard';
  sackCount: number;
  sealTagId: string;
  vehicleNumber: string;
  driverName: string;
  tarpaulinConfirmed: boolean;
  transitWaybillId: string;
  observedMoisturePercent: number;
  verifiedBy: string;
  verifiedByRole: string;
  verifiedAt: string;
  localRecordId?: string;
  notes?: string;
}

export interface Step2WarehouseVerification {
  arrivalGrossWeightKg: number;
  arrivalTareWeightKg: number;
  arrivalNetWeightKg: number;
  storageZone: string;
  shrinkagePercentAllowed: number;
  shrinkageKgAllowed: number;
  unexplainedVarianceKg: number;
  discrepancyTriggered: boolean;
  supervisorCaseId?: string;
  verifiedBy: string;
  verifiedByRole: string;
  verifiedAt: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType:
    | 'AGGREGATION_INITIATED'
    | 'COLLECTOR_RECEIPT_ISSUED'
    | 'FIELD_WEIGH_COMPLETED'
    | 'OFFLINE_SAVED'
    | 'OFFLINE_SYNCED'
    | 'VEHICLE_DISPATCHED'
    | 'WAREHOUSE_REWEIGH_COMPLETED'
    | 'SHRINKAGE_APPLIED'
    | 'DISCREPANCY_QUARANTINED'
    | 'STOCK_SEPARATION_UPDATED';
  title: string;
  description: string;
  details?: Record<string, any>;
  evidencePhotoPlaceholder?: string;
  evidenceLabel?: string;
  syncId?: string;
  isSimulatedBadge?: string;
}

export interface DiscrepancyCase {
  id: string; // 'DISC-402'
  batchId: string;
  dispatchedNetKg: number;
  arrivalNetKg: number;
  shrinkageAllowedKg: number;
  unexplainedVarianceKg: number;
  status: 'OPEN_QUARANTINED' | 'JOINT_REVIEW_PENDING' | 'RECONCILED';
  currentActionTaken: string;
  assignedSupervisor: string;
  createdAt: string;
  notes: string;
}

export interface BatchRecord {
  id: string; // 'BS-402'
  produceName: string;
  produceOdia: string;
  scientificName: string;
  district: string;
  block: string;
  gramPanchayat: string;
  centerName: string;
  shgName: string;
  facilitatorName: string;
  referenceRatePerKg: number;
  rateSource: string;
  ratePublishedDate: string;
  seasonalReadinessStatus: string;
  pickupRequestId: string;
  collectors: CollectorContribution[];
  status: BatchStatus;
  step1: Step1FieldVerification;
  step2: Step2WarehouseVerification | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLedgerCounters {
  expectedSeasonalForecastKg: number;
  inTransitPendingVerificationKg: number;
  verifiedSaleableStockKg: number;
  quarantinedDiscrepancyKg: number;
}
