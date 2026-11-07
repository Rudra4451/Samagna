-- ==============================================================================
-- Migration: 20261107_precision_and_immutability
-- Description: Financial numeric precision migration & AuditEvent tamper-proofing trigger
-- Database: PostgreSQL 15+ (Production TDCCOL Mayurbhanj deployment)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Precision Migration: Weights to NUMERIC(10, 3), Currency to NUMERIC(12, 2)
-- ------------------------------------------------------------------------------

-- Step 1: Collector contributions
ALTER TABLE "CollectorContribution"
  ALTER COLUMN "weightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "ratePerKg" TYPE NUMERIC(12, 2),
  ALTER COLUMN "grossPayout" TYPE NUMERIC(12, 2);

-- Step 2: Produce rates
ALTER TABLE "ProduceRateConfiguration"
  ALTER COLUMN "ratePerKg" TYPE NUMERIC(12, 2),
  ALTER COLUMN "allowableShrinkagePercent" TYPE NUMERIC(5, 2);

-- Step 3: Product catalogue
ALTER TABLE "ProductCatalogue"
  ALTER COLUMN "referenceRatePerKg" TYPE NUMERIC(12, 2);

-- Step 4: Step 1 Field Verification
ALTER TABLE "Step1FieldVerification"
  ALTER COLUMN "grossWeightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "tareWeightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "netAcceptedKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "observedMoisturePercent" TYPE NUMERIC(5, 2);

-- Step 5: Step 2 Warehouse Verification
ALTER TABLE "Step2WarehouseVerification"
  ALTER COLUMN "arrivalGrossWeightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "arrivalTareWeightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "arrivalNetWeightKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "shrinkagePercentAllowed" TYPE NUMERIC(5, 2),
  ALTER COLUMN "shrinkageKgAllowed" TYPE NUMERIC(10, 3),
  ALTER COLUMN "unexplainedVarianceKg" TYPE NUMERIC(10, 3);

-- Step 6: Discrepancy cases
ALTER TABLE "DiscrepancyCase"
  ALTER COLUMN "dispatchedNetKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "arrivalNetKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "shrinkageAllowedKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "unexplainedVarianceKg" TYPE NUMERIC(10, 3);

-- Step 7: Inventory sales
ALTER TABLE "InventorySale"
  ALTER COLUMN "quantityKg" TYPE NUMERIC(10, 3),
  ALTER COLUMN "salePricePerKg" TYPE NUMERIC(12, 2),
  ALTER COLUMN "totalAmount" TYPE NUMERIC(12, 2);

-- ------------------------------------------------------------------------------
-- 2. Audit Trail Immutability: Prevent UPDATE or DELETE on AuditEvent
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditEvent records are strictly immutable. UPDATE, DELETE, and TRUNCATE operations are prohibited by TDCCOL regulatory audit policy.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_event_immutable ON "AuditEvent";

CREATE TRIGGER trg_audit_event_immutable
BEFORE UPDATE OR DELETE ON "AuditEvent"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_tampering();

-- Security Notice:
-- In production, the runtime application database user should be granted
-- INSERT, SELECT ONLY on "AuditEvent", with explicit REVOKE on UPDATE, DELETE, TRUNCATE:
-- REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "AuditEvent" FROM app_runtime_user;

