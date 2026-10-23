-- ==============================================================================
-- Migration: 0_init
-- Description: Initial baseline schema migration for BanaSetu MFP Ledger
-- Database: PostgreSQL (Supabase / Standard PostgreSQL 15+)
-- ==============================================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM (
  'COLLECTOR',
  'SHG_FACILITATOR',
  'COLLECTION_MANAGER',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR_ADMIN'
);

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM (
  'REQUESTED',
  'SAVED_OFFLINE_PENDING_SYNC',
  'PENDING_VERIFICATION',
  'VERIFIED_SALEABLE',
  'QUARANTINED_DISCREPANCY'
);

-- CreateEnum
CREATE TYPE "DiscrepancyStatus" AS ENUM (
  'OPEN_QUARANTINED',
  'JOINT_REVIEW_PENDING',
  'RECONCILED'
);

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM (
  'READY_FOR_DISBURSEMENT',
  'PAID_SIMULATED',
  'HELD_FOR_REVIEW'
);

-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fullNameOdia" TEXT,
    "role" "UserRole" NOT NULL,
    "district" TEXT NOT NULL DEFAULT 'Mayurbhanj',
    "block" TEXT,
    "village" TEXT,
    "centerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProduceRateConfiguration
CREATE TABLE "ProduceRateConfiguration" (
    "id" TEXT NOT NULL,
    "produceName" TEXT NOT NULL,
    "produceOdia" TEXT NOT NULL,
    "scientificName" TEXT,
    "ratePerKg" DOUBLE PRECISION NOT NULL,
    "allowableShrinkagePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "sourceAuthority" TEXT NOT NULL,
    "isOfficialVerified" BOOLEAN NOT NULL DEFAULT false,
    "provenanceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProduceRateConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Batch
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "produceConfigId" TEXT,
    "produceName" TEXT NOT NULL,
    "produceOdia" TEXT NOT NULL,
    "scientificName" TEXT,
    "district" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "gramPanchayat" TEXT NOT NULL,
    "centerName" TEXT NOT NULL,
    "shgName" TEXT NOT NULL,
    "facilitatorName" TEXT NOT NULL,
    "referenceRatePerKg" DOUBLE PRECISION NOT NULL,
    "rateSource" TEXT NOT NULL,
    "ratePublishedDate" TEXT NOT NULL,
    "seasonalReadinessStatus" TEXT NOT NULL,
    "pickupRequestId" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'REQUESTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: CollectorContribution
CREATE TABLE "CollectorContribution" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "tribalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameOdia" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "village" TEXT NOT NULL,
    "villageOdia" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "ratePerKg" DOUBLE PRECISION NOT NULL,
    "grossPayout" DOUBLE PRECISION NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountEnding" TEXT NOT NULL,
    "dbtRef" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'READY_FOR_DISBURSEMENT',
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "collectedDate" TEXT NOT NULL,
    "signedByFacilitator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectorContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Step1FieldVerification
CREATE TABLE "Step1FieldVerification" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "grossWeightKg" DOUBLE PRECISION NOT NULL,
    "tareWeightKg" DOUBLE PRECISION NOT NULL,
    "netAcceptedKg" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "sackCount" INTEGER NOT NULL,
    "sealTagId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "tarpaulinConfirmed" BOOLEAN NOT NULL DEFAULT true,
    "transitWaybillId" TEXT NOT NULL,
    "observedMoisturePercent" DOUBLE PRECISION NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "verifiedByRole" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "localRecordId" TEXT,
    "notes" TEXT,

    CONSTRAINT "Step1FieldVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Step2WarehouseVerification
CREATE TABLE "Step2WarehouseVerification" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "arrivalGrossWeightKg" DOUBLE PRECISION NOT NULL,
    "arrivalTareWeightKg" DOUBLE PRECISION NOT NULL,
    "arrivalNetWeightKg" DOUBLE PRECISION NOT NULL,
    "storageZone" TEXT NOT NULL,
    "shrinkagePercentAllowed" DOUBLE PRECISION NOT NULL,
    "shrinkageKgAllowed" DOUBLE PRECISION NOT NULL,
    "unexplainedVarianceKg" DOUBLE PRECISION NOT NULL,
    "discrepancyTriggered" BOOLEAN NOT NULL DEFAULT false,
    "supervisorCaseId" TEXT,
    "verifiedBy" TEXT NOT NULL,
    "verifiedByRole" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Step2WarehouseVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DiscrepancyCase
CREATE TABLE "DiscrepancyCase" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "dispatchedNetKg" DOUBLE PRECISION NOT NULL,
    "arrivalNetKg" DOUBLE PRECISION NOT NULL,
    "shrinkageAllowedKg" DOUBLE PRECISION NOT NULL,
    "unexplainedVarianceKg" DOUBLE PRECISION NOT NULL,
    "status" "DiscrepancyStatus" NOT NULL DEFAULT 'OPEN_QUARANTINED',
    "currentActionTaken" TEXT NOT NULL,
    "assignedSupervisor" TEXT NOT NULL,
    "resolutionReason" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DiscrepancyCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditEvent
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "evidencePhotoUrl" TEXT,
    "evidenceLabel" TEXT,
    "syncId" TEXT,
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "previousHash" TEXT,
    "eventHash" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SyncIdempotencyRecord
CREATE TABLE "SyncIdempotencyRecord" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payloadHash" TEXT,
    "responseJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncIdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductCatalogue
CREATE TABLE "ProductCatalogue" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "nameOdia" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "botanicalFamily" TEXT,
    "primaryHarvestSeason" TEXT NOT NULL,
    "standardPackaging" TEXT NOT NULL,
    "typicalTareKgPerBag" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "baselineMoistureMaxPercent" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "allowableShrinkagePercent" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "currentBenchmarkRatePerKg" DOUBLE PRECISION NOT NULL,
    "rateSource" TEXT NOT NULL DEFAULT 'TDCCOL MSP Notification (Illustrative Baseline)',
    "isOfficialMsp" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "iconSvgKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCatalogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AggregationLocation
CREATE TABLE "AggregationLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameOdia" TEXT NOT NULL,
    "district" TEXT NOT NULL DEFAULT 'Mayurbhanj',
    "block" TEXT NOT NULL,
    "gramPanchayat" TEXT NOT NULL,
    "village" TEXT,
    "locationType" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "storageCapacityKg" DOUBLE PRECISION NOT NULL,
    "managerName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregationLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: GrievanceRecord
CREATE TABLE "GrievanceRecord" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "collectorName" TEXT NOT NULL,
    "collectorOdia" TEXT,
    "village" TEXT NOT NULL,
    "contactPhone" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "supervisorNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrievanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UploadedAttachment
CREATE TABLE "UploadedAttachment" (
    "id" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storageKey" TEXT,
    "bucketName" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "batchId" TEXT,
    "uploaderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SyncConflictRecord
CREATE TABLE "SyncConflictRecord" (
    "id" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "clientPayload" TEXT NOT NULL,
    "serverPayload" TEXT NOT NULL,
    "conflictReason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncConflictRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_username_idx" ON "User"("username");

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

CREATE UNIQUE INDEX "ProduceRateConfiguration_produceName_key" ON "ProduceRateConfiguration"("produceName");

CREATE INDEX "Batch_status_idx" ON "Batch"("status");
CREATE INDEX "Batch_pickupRequestId_idx" ON "Batch"("pickupRequestId");
CREATE INDEX "Batch_updatedAt_idx" ON "Batch"("updatedAt");

CREATE INDEX "CollectorContribution_batchId_idx" ON "CollectorContribution"("batchId");

CREATE UNIQUE INDEX "Step1FieldVerification_batchId_key" ON "Step1FieldVerification"("batchId");
CREATE UNIQUE INDEX "Step2WarehouseVerification_batchId_key" ON "Step2WarehouseVerification"("batchId");

CREATE INDEX "DiscrepancyCase_batchId_idx" ON "DiscrepancyCase"("batchId");
CREATE INDEX "DiscrepancyCase_status_idx" ON "DiscrepancyCase"("status");

CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent"("timestamp");
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");
CREATE INDEX "AuditEvent_actionType_idx" ON "AuditEvent"("actionType");

CREATE UNIQUE INDEX "SyncIdempotencyRecord_idempotencyKey_key" ON "SyncIdempotencyRecord"("idempotencyKey");
CREATE INDEX "SyncIdempotencyRecord_idempotencyKey_idx" ON "SyncIdempotencyRecord"("idempotencyKey");
CREATE INDEX "SyncIdempotencyRecord_localId_idx" ON "SyncIdempotencyRecord"("localId");

CREATE UNIQUE INDEX "ProductCatalogue_slug_key" ON "ProductCatalogue"("slug");
CREATE INDEX "ProductCatalogue_slug_idx" ON "ProductCatalogue"("slug");

CREATE UNIQUE INDEX "AggregationLocation_code_key" ON "AggregationLocation"("code");
CREATE INDEX "AggregationLocation_block_idx" ON "AggregationLocation"("block");
CREATE INDEX "AggregationLocation_locationType_idx" ON "AggregationLocation"("locationType");

CREATE UNIQUE INDEX "GrievanceRecord_trackingCode_key" ON "GrievanceRecord"("trackingCode");
CREATE INDEX "GrievanceRecord_status_idx" ON "GrievanceRecord"("status");
CREATE INDEX "GrievanceRecord_trackingCode_idx" ON "GrievanceRecord"("trackingCode");

CREATE INDEX "UploadedAttachment_batchId_idx" ON "UploadedAttachment"("batchId");
CREATE INDEX "UploadedAttachment_uploaderId_idx" ON "UploadedAttachment"("uploaderId");
CREATE INDEX "UploadedAttachment_storageKey_idx" ON "UploadedAttachment"("storageKey");

CREATE INDEX "SyncConflictRecord_status_idx" ON "SyncConflictRecord"("status");
CREATE INDEX "SyncConflictRecord_batchCode_idx" ON "SyncConflictRecord"("batchCode");
CREATE INDEX "SyncConflictRecord_createdAt_idx" ON "SyncConflictRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_produceConfigId_fkey" FOREIGN KEY ("produceConfigId") REFERENCES "ProduceRateConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CollectorContribution" ADD CONSTRAINT "CollectorContribution_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Step1FieldVerification" ADD CONSTRAINT "Step1FieldVerification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Step2WarehouseVerification" ADD CONSTRAINT "Step2WarehouseVerification_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscrepancyCase" ADD CONSTRAINT "DiscrepancyCase_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
