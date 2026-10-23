import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { WarehouseVerificationInputSchema } from '@/lib/server/validations';
import { requireServerRole, isAuthorizedDepotCenter, resolveCanonicalDepotId } from '@/lib/server/auth';
import { INSTITUTIONAL_CONFIG, resolveSupervisorAssignment } from '@/lib/server/config';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Step 1: Server authorization guard (F5: Only Warehouse Managers or Supervisors)
  const auth = await requireServerRole(req, ['WAREHOUSE_MANAGER', 'SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;

  // Step 2: Parse and validate incoming payload with Zod
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const parsed = WarehouseVerificationInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Warehouse arrival reweighment failed schema validation',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Compute canonical SHA-256 payload hash to prevent idempotency key reuse with different payloads
  const payloadHash = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        batchId: data.batchId,
        arrivalGrossWeightKg: data.arrivalGrossWeightKg,
        arrivalTareWeightKg: data.arrivalTareWeightKg,
        arrivalNetWeightKg: data.arrivalNetWeightKg,
        storageZone: data.storageZone,
      })
    )
    .digest('hex');

  // Step 3: Handle database persistence fallback
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message:
          'PostgreSQL server database is unconfigured. Warehouse arrival verification must be saved locally and is pending server synchronization.',
        serverVerified: false,
        status: 'SAVED_OFFLINE_PENDING_SYNC',
        provenanceDisclaimer: INSTITUTIONAL_CONFIG.disclaimers.shrinkage,
        clientVerification: {
          batchId: data.batchId,
          arrivalGrossWeightKg: data.arrivalGrossWeightKg,
          arrivalTareWeightKg: data.arrivalTareWeightKg,
          arrivalNetWeightKg: data.arrivalNetWeightKg,
          storageZone: data.storageZone,
          tolerancePercent: data.tolerancePercent ?? INSTITUTIONAL_CONFIG.defaultShrinkageTolerancePercent,
          assignedSupervisor: resolveSupervisorAssignment(actor.district, data.assignedSupervisor),
          verifiedBy: actor.fullName,
          verifiedByRole: actor.role,
          verifiedAt: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Step 4: Execute atomic database transaction
    // Idempotency check is performed inside transaction AFTER batch lookup and actor authorization
    const result = await prisma.$transaction(async (tx) => {
      // Find existing batch with step 1 field verification and step 2 warehouse verification
      const batch = await tx.batch.findUnique({
        where: { id: data.batchId },
        include: { step1: true, step2: true },
      });

      if (!batch) {
        throw new Error(`Batch '${data.batchId}' not found in server ledger`);
      }

      // Scope authorization: Warehouse Manager depot & district isolation
      if (actor.role === 'WAREHOUSE_MANAGER') {
        if (!actor.centerId) {
          const err: any = new Error('Warehouse Manager must have an assigned depot center identifier.');
          err.code = 'DEPOT_REQUIRED';
          err.status = 403;
          throw err;
        }

        if (!isAuthorizedDepotCenter(actor.centerId)) {
          const err: any = new Error(
            `Warehouse Manager assigned center '${actor.centerId}' is not an authorized central warehouse depot.`
          );
          err.code = 'INVALID_DEPOT_ASSIGNMENT';
          err.status = 403;
          throw err;
        }

        const cleanActorDepot = resolveCanonicalDepotId(actor.centerId);
        if (!cleanActorDepot) {
          const err: any = new Error(
            `Warehouse Manager assigned depot '${actor.centerId}' cannot be resolved to an authoritative canonical depot.`
          );
          err.code = 'INVALID_DEPOT_ASSIGNMENT';
          err.status = 403;
          throw err;
        }

        if (actor.district && batch.district && batch.district !== actor.district) {
          const err: any = new Error(
            `Warehouse Manager is restricted to district '${actor.district}'. Access to batch '${data.batchId}' from district '${batch.district}' is forbidden.`
          );
          err.code = 'CROSS_DISTRICT_ACCESS_FORBIDDEN';
          err.status = 403;
          throw err;
        }

        if (!batch.destinationDepotId) {
          const err: any = new Error(
            `Batch '${data.batchId}' has no assigned destination depot. Warehouse intake is forbidden until assigned.`
          );
          err.code = 'DEPOT_ASSIGNMENT_REQUIRED';
          err.status = 403;
          throw err;
        }

        const cleanBatchDepot = resolveCanonicalDepotId(batch.destinationDepotId) || batch.destinationDepotId.trim();
        if (cleanBatchDepot !== cleanActorDepot) {
          const err: any = new Error(
            `Warehouse Manager is restricted to depot '${cleanActorDepot}'. Access to batch '${data.batchId}' destined for '${cleanBatchDepot}' is forbidden.`
          );
          err.code = 'CROSS_DEPOT_ACCESS_FORBIDDEN';
          err.status = 403;
          throw err;
        }

        // Database Active-Depot Validation (SEC-DEP-04)
        const depotLoc = await tx.aggregationLocation.findUnique({
          where: { code: cleanBatchDepot },
        });
        if (!depotLoc) {
          const err: any = new Error(
            `Depot facility '${cleanBatchDepot}' was not found in registered aggregation locations.`
          );
          err.code = 'INVALID_DESTINATION_DEPOT';
          err.status = 422;
          throw err;
        }
        if (!depotLoc.isActive) {
          const err: any = new Error(
            `Depot facility '${cleanBatchDepot}' is inactive. Warehouse receipt at inactive depots is prohibited.`
          );
          err.code = 'INACTIVE_DESTINATION_DEPOT';
          err.status = 422;
          throw err;
        }
        if (depotLoc.locationType !== 'CENTRAL_DEPOT') {
          const err: any = new Error(
            `Facility '${cleanBatchDepot}' is classified as '${depotLoc.locationType}'. Destination must be classified as a CENTRAL_DEPOT.`
          );
          err.code = 'INVALID_DEPOT_TYPE';
          err.status = 422;
          throw err;
        }
      }

      if (actor.role === 'SUPERVISOR_ADMIN') {
        if (actor.district && batch.district && batch.district !== actor.district) {
          const err: any = new Error(
            `Supervisor Admin is restricted to district '${actor.district}'. Access to batch '${data.batchId}' in district '${batch.district}' is forbidden.`
          );
          err.code = 'FORBIDDEN_DISTRICT_ACCESS';
          err.status = 403;
          throw err;
        }

        if (batch.destinationDepotId) {
          const cleanBatchDepot = resolveCanonicalDepotId(batch.destinationDepotId) || batch.destinationDepotId.trim();
          const depotLoc = await tx.aggregationLocation.findUnique({
            where: { code: cleanBatchDepot },
          });
          if (depotLoc && !depotLoc.isActive) {
            const err: any = new Error(
              `Depot facility '${cleanBatchDepot}' is inactive. Warehouse receipt at inactive depots is prohibited.`
            );
            err.code = 'INACTIVE_DESTINATION_DEPOT';
            err.status = 422;
            throw err;
          }
        }
      }

      // In-transaction Idempotency Check with Ownership & Payload Hash Verification (SEC-DEP-02)
      // Executed strictly AFTER batch lookup and actor authorization
      if (data.idempotencyKey) {
        const inTxExisting = await tx.syncIdempotencyRecord.findUnique({
          where: { idempotencyKey: data.idempotencyKey },
        });
        if (inTxExisting) {
          // Ownership verification: Reject if missing or created by a different actor (fail-closed SEC-FIG-01)
          if (!inTxExisting.actorId || inTxExisting.actorId !== actor.userId) {
            const err: any = new Error('Idempotency key was created by another actor or is invalid.');
            err.code = 'FORBIDDEN_IDEMPOTENCY_ACCESS';
            err.status = 403;
            throw err;
          }
          // Payload hash verification: Reject if missing or key reuse with different parameters (fail-closed SEC-FIG-01)
          if (!inTxExisting.payloadHash || inTxExisting.payloadHash !== payloadHash) {
            const err: any = new Error(
              `Idempotency key '${data.idempotencyKey}' was already used with a different payload. Reusing keys with modified payloads is prohibited.`
            );
            err.code = 'IDEMPOTENCY_CONFLICT';
            err.status = 409;
            throw err;
          }
          if (inTxExisting.responseJson) {
            try {
              return {
                ...JSON.parse(inTxExisting.responseJson),
                isReplay: true,
              };
            } catch {
              // Fall through if corrupt
            }
          }
        }
      }

      // Precondition: Dispatched weight MUST be read from authoritative persisted server data (Step 1)
      if (!batch.step1) {
        throw new Error(
          `Batch '${data.batchId}' has not completed authoritative Step 1 Field Verification in server ledger`
        );
      }

      // Warehouse Receipt Immutability & Quarantine Hold Protection (SEC-DEP-01)
      if (batch.step2) {
        const isIdentical =
          batch.step2.arrivalNetWeightKg === data.arrivalNetWeightKg &&
          batch.step2.arrivalGrossWeightKg === data.arrivalGrossWeightKg &&
          batch.step2.arrivalTareWeightKg === data.arrivalTareWeightKg &&
          batch.step2.storageZone === data.storageZone;

        if (isIdentical) {
          // Legitimate retry of the exact same verified values: return safe replay without mutating state or status
          return {
            success: true,
            serverVerified: true,
            batchId: batch.id,
            status: batch.status,
            discrepancyTriggered: batch.step2.discrepancyTriggered,
            dispatchedNetKg: batch.step1.netAcceptedKg,
            arrivalNetKg: batch.step2.arrivalNetWeightKg,
            shrinkageKgAllowed: batch.step2.shrinkageKgAllowed,
            unexplainedVarianceKg: -batch.step2.unexplainedVarianceKg,
            storageZone: batch.step2.storageZone,
            verifiedAt: batch.step2.verifiedAt.toISOString(),
            verifiedBy: batch.step2.verifiedBy,
            isReplay: true,
          };
        }

        const conflictError: any = new Error(
          `Warehouse arrival verification for batch '${data.batchId}' has already been accepted and certified (${batch.step2.arrivalNetWeightKg} kg, status: ${batch.status}). Overwriting certified warehouse weighments is prohibited.`
        );
        conflictError.code = 'RECORD_ALREADY_ACCEPTED';
        conflictError.status = 409;
        conflictError.existingVerification = {
          batchId: batch.id,
          arrivalNetWeightKg: batch.step2.arrivalNetWeightKg,
          arrivalGrossWeightKg: batch.step2.arrivalGrossWeightKg,
          arrivalTareWeightKg: batch.step2.arrivalTareWeightKg,
          storageZone: batch.step2.storageZone,
          discrepancyTriggered: batch.step2.discrepancyTriggered,
          verifiedBy: batch.step2.verifiedBy,
          verifiedAt: batch.step2.verifiedAt,
        };
        throw conflictError;
      }

      const dispatchedNetKg = batch.step1.netAcceptedKg;

      // Allowable transit loss percentage (configurable institutional benchmark)
      const tolerancePercent = data.tolerancePercent ?? INSTITUTIONAL_CONFIG.defaultShrinkageTolerancePercent;
      const shrinkageKgAllowed = Number(((dispatchedNetKg * tolerancePercent) / 100).toFixed(2));
      const actualLossKg = Number((dispatchedNetKg - data.arrivalNetWeightKg).toFixed(2));
      const unexplainedVarianceKg = Number((actualLossKg - shrinkageKgAllowed).toFixed(2));
      // Discrepancy triggered if actual loss exceeds allowable natural loss by configurable threshold
      const discrepancyTriggered = unexplainedVarianceKg > INSTITUTIONAL_CONFIG.shrinkageDeficitThresholdKg;

      const newBatchStatus = discrepancyTriggered ? 'QUARANTINED_DISCREPANCY' : 'VERIFIED_SALEABLE';
      const assignedSupervisor = resolveSupervisorAssignment(batch.district, data.assignedSupervisor);

      // Create Step 2 Warehouse Verification (Atomic insert, protected by @unique batchId)
      const step2 = await tx.step2WarehouseVerification.create({
        data: {
          batchId: data.batchId,
          arrivalGrossWeightKg: data.arrivalGrossWeightKg,
          arrivalTareWeightKg: data.arrivalTareWeightKg,
          arrivalNetWeightKg: data.arrivalNetWeightKg,
          storageZone: data.storageZone,
          receivingDepotId: resolveCanonicalDepotId(actor.centerId) ?? null,
          shrinkagePercentAllowed: tolerancePercent,
          shrinkageKgAllowed,
          unexplainedVarianceKg: -unexplainedVarianceKg,
          discrepancyTriggered,
          supervisorCaseId: discrepancyTriggered ? `DISC-${data.batchId}` : null,
          verifiedBy: actor.fullName,
          verifiedByRole: actor.role,
          verifiedAt: new Date(),
          notes: data.notes ?? null,
        },
      });

      // Update batch status and optimistic version
      const updatedBatch = await tx.batch.update({
        where: { id: data.batchId },
        data: {
          status: newBatchStatus,
          version: { increment: 1 },
        },
      });

      // If discrepancy triggered, upsert DiscrepancyCase for supervisor review
      if (discrepancyTriggered) {
        await tx.discrepancyCase.upsert({
          where: { id: `DISC-${data.batchId}` },
          create: {
            id: `DISC-${data.batchId}`,
            batchId: data.batchId,
            dispatchedNetKg,
            arrivalNetKg: data.arrivalNetWeightKg,
            shrinkageAllowedKg: shrinkageKgAllowed,
            unexplainedVarianceKg: -unexplainedVarianceKg,
            status: 'OPEN_QUARANTINED',
            currentActionTaken: `Quarantine hold placed on lot; ${unexplainedVarianceKg} kg deficit held under administrative review.`,
            assignedSupervisor,
            notes: data.notes || `Produce delivered at Central Depôt. Unexplained loss of ${unexplainedVarianceKg} kg exceeds ${tolerancePercent}% natural tolerance.`,
          },
          update: {
            dispatchedNetKg,
            arrivalNetKg: data.arrivalNetWeightKg,
            shrinkageAllowedKg: shrinkageKgAllowed,
            unexplainedVarianceKg: -unexplainedVarianceKg,
            currentActionTaken: `Quarantine hold placed on lot; ${unexplainedVarianceKg} kg deficit held under administrative review.`,
            assignedSupervisor,
            notes: data.notes || `Produce delivered at Central Depôt. Unexplained loss of ${unexplainedVarianceKg} kg exceeds ${tolerancePercent}% natural tolerance.`,
          },
        });
      }

      // Record immutable audit event with collision-safe unique identifier
      await tx.auditEvent.create({
        data: {
          id: `AUD-WH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          batchId: data.batchId,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: discrepancyTriggered ? 'DISCREPANCY_QUARANTINED' : 'WAREHOUSE_REWEIGH_COMPLETED',
          title: discrepancyTriggered
            ? `Batch #${data.batchId} Quarantined: ${unexplainedVarianceKg} kg Excess Transit Loss`
            : `Batch #${data.batchId} Verified Saleable (+${data.arrivalNetWeightKg} kg in ${data.storageZone})`,
          description: `Arrival net scale: ${data.arrivalNetWeightKg} kg. Dispatched: ${dispatchedNetKg} kg. Natural shrinkage allowance: ${shrinkageKgAllowed} kg (${tolerancePercent}%).`,
          details: JSON.stringify({
            arrivalGrossKg: data.arrivalGrossWeightKg,
            arrivalTareKg: data.arrivalTareWeightKg,
            arrivalNetKg: data.arrivalNetWeightKg,
            dispatchedNetKg,
            shrinkageAllowedKg: shrinkageKgAllowed,
            unexplainedVarianceKg,
            discrepancyTriggered,
            storageZone: data.storageZone,
            assignedSupervisor,
            provenanceDisclaimer: INSTITUTIONAL_CONFIG.disclaimers.shrinkage,
          }),
          isSimulated: true,
        },
      });

      const responsePayload = {
        success: true,
        serverVerified: true,
        batchId: updatedBatch.id,
        status: updatedBatch.status,
        discrepancyTriggered,
        dispatchedNetKg,
        arrivalNetKg: data.arrivalNetWeightKg,
        shrinkageKgAllowed,
        unexplainedVarianceKg,
        storageZone: data.storageZone,
        verifiedAt: step2.verifiedAt.toISOString(),
        verifiedBy: actor.fullName,
        assignedSupervisor: discrepancyTriggered ? assignedSupervisor : undefined,
        provenanceDisclaimer: INSTITUTIONAL_CONFIG.disclaimers.shrinkage,
      };

      // Record idempotency receipt
      if (data.idempotencyKey) {
        await tx.syncIdempotencyRecord.create({
          data: {
            idempotencyKey: data.idempotencyKey,
            localId: data.batchId,
            entityType: 'storage_receipt',
            action: discrepancyTriggered ? 'quarantine' : 'verify',
            actorId: actor.userId,
            status: 'PROCESSED',
            payloadHash,
            responseJson: JSON.stringify(responsePayload),
          },
        });
      }

      return responsePayload;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'RECORD_ALREADY_ACCEPTED') {
      return NextResponse.json(
        {
          error: 'RECORD_ALREADY_ACCEPTED',
          message: err.message,
          existingVerification: err.existingVerification,
        },
        { status: 409 }
      );
    }

    if (err?.code === 'P2002') {
      // Check if it's an idempotency retry that succeeded concurrently
      if (data.idempotencyKey) {
        try {
          const completed = await getPrismaClient().syncIdempotencyRecord.findUnique({
            where: { idempotencyKey: data.idempotencyKey },
          });
          if (completed) {
            // Ownership verification: Reject if missing or created by a different actor (fail-closed SEC-FIG-01)
            if (!completed.actorId || completed.actorId !== actor.userId) {
              return NextResponse.json(
                {
                  error: 'FORBIDDEN_IDEMPOTENCY_ACCESS',
                  message: 'Idempotency key was created by another actor or is invalid.',
                },
                { status: 403 }
              );
            }
            // Payload hash verification: Reject if missing or key reuse with different payload (fail-closed SEC-FIG-01)
            if (!completed.payloadHash || completed.payloadHash !== payloadHash) {
              return NextResponse.json(
                {
                  error: 'IDEMPOTENCY_CONFLICT',
                  message: `Idempotency key '${data.idempotencyKey}' was already used with a different payload. Reusing keys with modified payloads is prohibited.`,
                },
                { status: 409 }
              );
            }
            if (completed.responseJson) {
              const cached = JSON.parse(completed.responseJson);
              return NextResponse.json({ ...cached, isReplay: true }, { status: 200 });
            }
          }
        } catch {
          // Fall through
        }
      }

      return NextResponse.json(
        {
          error: 'RECORD_ALREADY_ACCEPTED',
          message: `Warehouse arrival verification for batch '${data.batchId}' was already submitted. Concurrent overwrite prevented.`,
        },
        { status: 409 }
      );
    }

    if (err?.status && err?.code) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.status }
      );
    }

    if (
      err?.code === 'DEPOT_REQUIRED' ||
      err?.code === 'INVALID_DEPOT_ASSIGNMENT' ||
      err?.code === 'DEPOT_ASSIGNMENT_REQUIRED' ||
      err?.code === 'CROSS_DEPOT_ACCESS_FORBIDDEN' ||
      err?.code === 'CROSS_DISTRICT_ACCESS_FORBIDDEN' ||
      err?.code === 'FORBIDDEN_DISTRICT_ACCESS' ||
      err?.code === 'FORBIDDEN_IDEMPOTENCY_ACCESS'
    ) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 403 }
      );
    }

    if (err?.code === 'IDEMPOTENCY_CONFLICT') {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'WAREHOUSE_VERIFICATION_TRANSACTION_FAILED',
        message: err?.message || 'Database transaction failed during warehouse verification',
        serverVerified: false,
      },
      { status: 500 }
    );
  }
}

