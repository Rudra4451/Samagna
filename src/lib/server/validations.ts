import { z } from 'zod';

export const SyncEntityTypeSchema = z.enum([
  'pickup_request',
  'collection',
  'dispatch',
  'storage_receipt',
]);

export const SyncActionSchema = z.enum([
  'create',
  'update',
  'verify',
  'quarantine',
]);

export const QualityGradeSchema = z.enum([
  'Grade A - Properly Dried',
  'Grade B - Moderate Moisture',
  'Grade C - Substandard',
]);

// Validation for incoming sync record ingestion
export const SyncRecordIngestSchema = z.object({
  idempotencyKey: z
    .string()
    .min(8, 'Idempotency key must be at least 8 characters (ULID or act-key recommended)'),
  localId: z.string().min(4, 'Local identifier is required'),
  entityType: SyncEntityTypeSchema,
  action: SyncActionSchema,
  payload: z.record(z.any()),
  hasPhotos: z.boolean().optional(),
});

// Validation for Batch Creation / Pickup Request
export const CreateBatchInputSchema = z.object({
  id: z.string().min(4, 'Batch ID/code is required'),
  produceName: z.string().min(2, 'Produce name is required'),
  produceOdia: z.string().min(1, 'Odia name is required'),
  scientificName: z.string().optional(),
  district: z.string().min(2, 'District is required'),
  block: z.string().min(2, 'Block is required'),
  gramPanchayat: z.string().min(2, 'Gram Panchayat is required'),
  centerName: z.string().min(2, 'Center name is required'),
  shgName: z.string().min(2, 'SHG name is required'),
  facilitatorName: z.string().min(2, 'Facilitator name is required'),
  pickupRequestId: z.string().min(2, 'Pickup request ID is required'),
  collectors: z
    .array(
      z.object({
        id: z.string(),
        tribalId: z.string(),
        name: z.string(),
        nameOdia: z.string(),
        gender: z.enum(['F', 'M', 'Other']),
        age: z.number().int().min(18).max(100),
        village: z.string(),
        villageOdia: z.string(),
        weightKg: z.number().positive(),
        bankName: z.string(),
        accountEnding: z.string().regex(/^\d{4}$/, 'Account ending must be 4 digits'),
      })
    )
    .min(1, 'At least one collector contribution is required'),
});

// Validation for Field Weighment & Vehicle Dispatch (Step 1)
export const FieldVerificationInputSchema = z
  .object({
    batchId: z.string().min(3),
    grossWeightKg: z.number().positive('Gross weight must be positive'),
    tareWeightKg: z.number().nonnegative('Tare weight must be non-negative'),
    netAcceptedKg: z.number().positive('Net weight must be positive'),
    grade: QualityGradeSchema,
    sackCount: z.number().int().positive('Sack count must be at least 1'),
    sealTagId: z.string().min(3, 'Seal tag ID is required'),
    vehicleNumber: z.string().min(5, 'Vehicle number is required'),
    driverName: z.string().min(2, 'Driver name is required'),
    tarpaulinConfirmed: z.boolean(),
    transitWaybillId: z.string().min(3, 'Transit waybill is required'),
    destinationDepotId: z.string().min(2, 'Destination depot must be at least 2 characters').optional(),
    observedMoisturePercent: z.number().min(0).max(100),
    notes: z.string().optional(),
    idempotencyKey: z.string().min(8, 'Idempotency key must be at least 8 characters').optional(),
  })
  .refine(
    (data) => Math.abs(data.grossWeightKg - data.tareWeightKg - data.netAcceptedKg) <= 0.05,
    {
      message: 'Net accepted weight must equal Gross weight minus Tare weight',
      path: ['netAcceptedKg'],
    }
  );

// Validation for Warehouse Arrival Reweighment (Step 2)
export const WarehouseVerificationInputSchema = z
  .object({
    batchId: z.string().min(3),
    arrivalGrossWeightKg: z.number().positive('Arrival gross weight must be positive'),
    arrivalTareWeightKg: z.number().nonnegative('Arrival tare weight must be non-negative'),
    arrivalNetWeightKg: z.number().positive('Arrival net weight must be positive'),
    storageZone: z.string().min(2, 'Storage zone is required'),
    notes: z.string().optional(),
    tolerancePercent: z.number().positive('Tolerance percent must be positive').max(10, 'Tolerance percent cannot exceed 10%').optional(),
    assignedSupervisor: z.string().min(3, 'Assigned supervisor must be at least 3 characters').optional(),
    idempotencyKey: z.string().min(8, 'Idempotency key must be at least 8 characters').optional(),
  })
  .refine(
    (data) =>
      Math.abs(data.arrivalGrossWeightKg - data.arrivalTareWeightKg - data.arrivalNetWeightKg) <=
      0.05,
    {
      message: 'Arrival Net weight must equal Gross weight minus Tare weight',
      path: ['arrivalNetWeightKg'],
    }
  );

// Validation for Supervisor Discrepancy Resolution
// Rule: A discrepancy must not automatically reduce, cancel, approve, or settle a collector's payment.
// An authorized review and an auditable decision is required.
export const DiscrepancyResolutionInputSchema = z.object({
  caseId: z.string().min(3, 'Case ID is required'),
  batchId: z.string().min(3, 'Batch ID is required'),
  resolutionReason: z
    .string()
    .min(5, 'Detailed resolution reason is required for administrative audit trail'),
  supervisorNotes: z
    .string()
    .min(10, 'Supervisor authorization notes must be at least 10 characters'),
  action: z.enum(['RECONCILE_AS_SALEABLE', 'CONFIRM_QUARANTINE_HOLD']),
  collectorPaymentAction: z
    .enum(['MAINTAIN_FULL_PAYOUT', 'HOLD_PENDING_TRI_PARTY_AUDIT'])
    .default('MAINTAIN_FULL_PAYOUT'),
});

// Validation for Supervisor Transit Rerouting
export const RerouteBatchInputSchema = z.object({
  newDestinationDepotId: z.string().min(3, 'New destination depot is required'),
  reason: z.string().min(10, 'Formal administrative reason of at least 10 characters is required'),
  incidentCaseId: z.string().optional(),
});

// Validation for Outward Warehouse Sale & Dispatch (Phase F10 & Batch 2)
export const CreateInventorySaleSchema = z.object({
  id: z.string().min(4, 'Sale ID must be at least 4 characters').optional(),
  saleReference: z.string().min(4, 'Sale reference must be at least 4 characters').optional(),
  produceName: z.string().min(2, 'Produce name is required'),
  quantityKg: z.number().positive('Sale quantity must be greater than 0 kg'),
  buyerName: z.string().min(2, 'Buyer name is required'),
  destination: z.string().optional(),
  salePricePerKg: z.number().positive('Sale price per kg must be positive').optional(),
  totalAmount: z.number().positive('Total amount must be positive').optional(),
  depotId: z.string().min(2, 'Depot identifier is required'),
  notes: z.string().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key must be at least 8 characters'),
});

// Validation for Query Filters on Batch Listing (Phase F4 / Batch 3)
export const BatchQueryFilterSchema = z.object({
  status: z
    .enum([
      'REQUESTED',
      'SAVED_OFFLINE_PENDING_SYNC',
      'PENDING_VERIFICATION',
      'VERIFIED_SALEABLE',
      'QUARANTINED_DISCREPANCY',
    ])
    .optional(),
  produceName: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

