import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { FieldVerificationInputSchema } from '@/lib/server/validations';
import {
  requireServerRole,
  isCenterAuthorizedExact,
  resolveCanonicalDepotId,
  resolveCanonicalCenterId,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Step 1: Server authorization guard (F4: Only Collection Managers or Supervisors)
  const auth = await requireServerRole(req, ['COLLECTION_MANAGER', 'SUPERVISOR_ADMIN']);
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

  const parsed = FieldVerificationInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Field weighment verification failed schema validation',
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
        grossWeightKg: data.grossWeightKg,
        tareWeightKg: data.tareWeightKg,
        netAcceptedKg: data.netAcceptedKg,
        grade: data.grade,
        sealTagId: data.sealTagId,
        destinationDepotId: data.destinationDepotId || null,
      })
    )
    .digest('hex');

  // Validate destination depot if provided
  let canonicalDepot: string | null = null;
  if (data.destinationDepotId) {
    canonicalDepot =
      resolveCanonicalDepotId(data.destinationDepotId) ||
      resolveCanonicalCenterId(data.destinationDepotId) ||
      data.destinationDepotId.trim();
  }

  // Step 4: Handle database persistence
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message:
          'PostgreSQL server database is unconfigured. Field verification must be saved locally and is pending server synchronization.',
        serverVerified: false,
        status: 'SAVED_OFFLINE_PENDING_SYNC',
        clientVerification: {
          batchId: data.batchId,
          grossWeightKg: data.grossWeightKg,
          tareWeightKg: data.tareWeightKg,
          netAcceptedKg: data.netAcceptedKg,
          grade: data.grade,
          sealTagId: data.sealTagId,
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

    // Step 5: Execute database transaction
    // Idempotency check is performed inside transaction AFTER batch lookup and actor authorization
    const result = await prisma.$transaction(async (tx) => {
      // Find existing batch with step1 verification (P0-D)
      const batch = await tx.batch.findUnique({
        where: { id: data.batchId },
        include: { step1: true },
      });

      if (!batch) {
        throw new Error(`Batch '${data.batchId}' not found in server ledger`);
      }

      // Scope authorization: Collection Manager center isolation
      if (actor.role === 'COLLECTION_MANAGER') {
        if (!actor.centerId) {
          const err: any = new Error('Collection Manager must have an assigned center identifier.');
          err.code = 'CENTER_REQUIRED';
          err.status = 403;
          throw err;
        }
        if (!isCenterAuthorizedExact(actor.centerId, batch.centerName)) {
          const err: any = new Error(
            `Collection Manager is restricted to center '${actor.centerId}'. Access to batch '${data.batchId}' belonging to center '${batch.centerName}' is forbidden.`
          );
          err.code = 'CROSS_CENTER_ACCESS_FORBIDDEN';
          err.status = 403;
          throw err;
        }
        if (actor.district && batch.district && batch.district !== actor.district) {
          const err: any = new Error(
            `Collection Manager is restricted to district '${actor.district}'. Access to batch '${data.batchId}' in district '${batch.district}' is forbidden.`
          );
          err.code = 'FORBIDDEN_DISTRICT_ACCESS';
          err.status = 403;
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

      // Once field verification is accepted/certified, do not let repeated or modified requests overwrite it
      if (batch.step1) {
        const isIdentical =
          batch.step1.netAcceptedKg === data.netAcceptedKg &&
          batch.step1.grossWeightKg === data.grossWeightKg &&
          batch.step1.tareWeightKg === data.tareWeightKg &&
          batch.step1.grade === data.grade &&
          batch.step1.sealTagId === data.sealTagId;

        if (isIdentical) {
          // Legitimate retry of the exact same verified values: return safe replay without mutating state
          return {
            success: true,
            serverVerified: true,
            batchId: batch.id,
            status: batch.status,
            verifiedAt: batch.step1.verifiedAt.toISOString(),
            verifiedBy: batch.step1.verifiedBy,
            isReplay: true,
          };
        }

        const conflictError: any = new Error(
          `Field verification for batch '${data.batchId}' has already been accepted and certified (${batch.step1.netAcceptedKg} kg). Overwriting certified field weighments is prohibited.`
        );
        conflictError.code = 'RECORD_ALREADY_ACCEPTED';
        conflictError.existingVerification = {
          batchId: batch.step1.batchId,
          netAcceptedKg: batch.step1.netAcceptedKg,
          grossWeightKg: batch.step1.grossWeightKg,
          tareWeightKg: batch.step1.tareWeightKg,
          grade: batch.step1.grade,
          sealTagId: batch.step1.sealTagId,
          verifiedBy: batch.step1.verifiedBy,
          verifiedAt: batch.step1.verifiedAt,
        };
        throw conflictError;
      }

      if (canonicalDepot) {
        const depotLoc = await tx.aggregationLocation.findUnique({
          where: { code: canonicalDepot },
        });
        if (!depotLoc) {
          const err: any = new Error(
            `Depot facility '${canonicalDepot}' was not found in registered aggregation locations.`
          );
          err.code = 'INVALID_DESTINATION_DEPOT';
          err.status = 422;
          throw err;
        }
        if (!depotLoc.isActive) {
          const err: any = new Error(
            `Depot facility '${canonicalDepot}' is inactive. Dispatches to inactive depots are prohibited.`
          );
          err.code = 'INACTIVE_DESTINATION_DEPOT';
          err.status = 422;
          throw err;
        }
        if (depotLoc.locationType !== 'CENTRAL_DEPOT') {
          const err: any = new Error(
            `Facility '${canonicalDepot}' is classified as '${depotLoc.locationType}'. Destination must be classified as a CENTRAL_DEPOT.`
          );
          err.code = 'INVALID_DEPOT_TYPE';
          err.status = 422;
          throw err;
        }
      }

      // Create Step 1 Field Verification (Atomic insert, protected by @unique batchId)
      const step1 = await tx.step1FieldVerification.create({
        data: {
          batchId: data.batchId,
          grossWeightKg: data.grossWeightKg,
          tareWeightKg: data.tareWeightKg,
          netAcceptedKg: data.netAcceptedKg,
          grade: data.grade,
          sackCount: data.sackCount,
          sealTagId: data.sealTagId,
          vehicleNumber: data.vehicleNumber,
          driverName: data.driverName,
          tarpaulinConfirmed: data.tarpaulinConfirmed,
          transitWaybillId: data.transitWaybillId,
          observedMoisturePercent: data.observedMoisturePercent,
          initialDestinationDepotId: canonicalDepot ?? null,
          verifiedBy: actor.fullName, // Bound to authenticated session actor
          verifiedByRole: actor.role,
          verifiedAt: new Date(),
          notes: data.notes ?? null,
        },
      });

      // Promote batch status to PENDING_VERIFICATION (in transit to warehouse)
      const updatedBatch = await tx.batch.update({
        where: { id: data.batchId },
        data: {
          status: 'PENDING_VERIFICATION',
          version: { increment: 1 },
          ...(canonicalDepot ? { destinationDepotId: canonicalDepot } : {}),
        },
      });

      // Record immutable audit event
      await tx.auditEvent.create({
        data: {
          id: `AUD-VERIFY-${Date.now()}`,
          batchId: data.batchId,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: 'FIELD_WEIGH_COMPLETED',
          title: `Field collection verified (${data.netAcceptedKg} kg net)`,
          description: `Gross scale: ${data.grossWeightKg} kg, Tare deduction: ${data.tareWeightKg} kg. Seal Tag: ${data.sealTagId}. Grade: ${data.grade}.`,
          details: JSON.stringify({
            grossKg: data.grossWeightKg,
            tareKg: data.tareWeightKg,
            netKg: data.netAcceptedKg,
            sealTag: data.sealTagId,
            vehicle: data.vehicleNumber,
            driver: data.driverName,
          }),
          isSimulated: true,
        },
      });

      const responsePayload = {
        success: true,
        serverVerified: true,
        batchId: updatedBatch.id,
        status: updatedBatch.status,
        verifiedAt: step1.verifiedAt.toISOString(),
        verifiedBy: actor.fullName,
      };

      // Record idempotency receipt
      if (data.idempotencyKey) {
        await tx.syncIdempotencyRecord.create({
          data: {
            idempotencyKey: data.idempotencyKey,
            localId: data.batchId,
            entityType: 'collection',
            action: 'verify',
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
          message: `Field verification for batch '${data.batchId}' was already submitted. Concurrent overwrite prevented.`,
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
      err?.code === 'CENTER_REQUIRED' ||
      err?.code === 'CROSS_CENTER_ACCESS_FORBIDDEN' ||
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

    if (err?.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'BATCH_NOT_FOUND', message: err.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: 'FIELD_VERIFICATION_TRANSACTION_FAILED',
        message: err?.message || 'Database transaction failed during field verification',
        serverVerified: false,
      },
      { status: 500 }
    );
  }
}

