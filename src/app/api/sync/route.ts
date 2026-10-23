import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import {
  SyncRecordIngestSchema,
  CreateBatchInputSchema,
  FieldVerificationInputSchema,
  WarehouseVerificationInputSchema,
} from '@/lib/server/validations';
import {
  requireServerRole,
  UserRole,
  isCenterAuthorizedExact,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

const ALL_ROLES: UserRole[] = [
  'COLLECTOR',
  'SHG_FACILITATOR',
  'COLLECTION_MANAGER',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR_ADMIN',
];

export async function POST(req: NextRequest) {
  // Step 1: Server-side authentication and role check (Mandatory F2 Rule)
  const auth = await requireServerRole(req, ALL_ROLES);
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

  const parsed = SyncRecordIngestSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Sync payload failed schema validation',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const { idempotencyKey, localId, entityType, action, payload } = parsed.data;

  // Step 3: Enforce Role-Specific Mutation Permissions
  // Collectors/Facilitators can only sync pickup_request
  if ((actor.role === 'COLLECTOR' || actor.role === 'SHG_FACILITATOR') && entityType !== 'pickup_request') {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_ENTITY_MUTATION',
        message: `${actor.role} is not permitted to sync '${entityType}' entities.`,
      },
      { status: 403 }
    );
  }

  // Collection Managers can sync collection & dispatch & pickup_request
  if (actor.role === 'COLLECTION_MANAGER' && !['collection', 'dispatch', 'pickup_request'].includes(entityType)) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_ENTITY_MUTATION',
        message: `Collection Manager cannot sync '${entityType}' storage receipts.`,
      },
      { status: 403 }
    );
  }

  // Warehouse Managers can sync storage_receipt & dispatch
  if (actor.role === 'WAREHOUSE_MANAGER' && !['storage_receipt', 'dispatch'].includes(entityType)) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_ENTITY_MUTATION',
        message: `Warehouse Manager cannot sync '${entityType}' field intake.`,
      },
      { status: 403 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message: 'Server PostgreSQL database is unconfigured. Sync mutations are held safely in local Dexie queue.',
      },
      { status: 503 }
    );
  }

  // Compute canonical SHA-256 payload hash to prevent idempotency key reuse with different payloads (P0-E)
  const payloadHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

  try {
    const prisma = getPrismaClient();

    // Step 4: Idempotency Check with Payload Hash verification
    const existingRecord = await prisma.syncIdempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    if (existingRecord) {
      // Ownership verification: Reject if missing or created by a different actor (fail-closed SEC-FIG-01)
      if (!existingRecord.actorId || existingRecord.actorId !== actor.userId) {
        return NextResponse.json(
          {
            error: 'FORBIDDEN_IDEMPOTENCY_ACCESS',
            message: 'Idempotency key was created by another actor or is invalid.',
          },
          { status: 403 }
        );
      }

      // Payload hash verification: Reject if missing or key reuse with different payload (fail-closed SEC-FIG-01)
      if (!existingRecord.payloadHash || existingRecord.payloadHash !== payloadHash) {
        return NextResponse.json(
          {
            error: 'IDEMPOTENCY_CONFLICT',
            message: `Idempotency key '${idempotencyKey}' was already processed with a different payload. Reusing keys with modified payloads is prohibited.`,
          },
          { status: 409 }
        );
      }

      // Revalidate resource permissions before returning cached response
      const targetBatchId = (payload as any)?.batchId || (payload as any)?.id || localId;
      if (targetBatchId && typeof targetBatchId === 'string') {
        const batch = await prisma.batch.findUnique({
          where: { id: targetBatchId },
        });
        if (batch) {
          if (actor.role === 'COLLECTION_MANAGER') {
            if (!actor.centerId || !isCenterAuthorizedExact(actor.centerId, batch.centerName)) {
              return NextResponse.json(
                {
                  error: 'CROSS_CENTER_ACCESS_FORBIDDEN',
                  message: `Collection Manager is restricted to center '${actor.centerId}'. Access to batch '${targetBatchId}' belonging to center '${batch.centerName}' is forbidden.`,
                },
                { status: 403 }
              );
            }
            if (actor.district && batch.district && batch.district !== actor.district) {
              return NextResponse.json(
                {
                  error: 'FORBIDDEN_DISTRICT_ACCESS',
                  message: `Collection Manager is restricted to district '${actor.district}'. Access to batch '${targetBatchId}' in district '${batch.district}' is forbidden.`,
                },
                { status: 403 }
              );
            }
          }

          if (actor.role === 'WAREHOUSE_MANAGER') {
            if (!actor.centerId || !isAuthorizedDepotCenter(actor.centerId)) {
              return NextResponse.json(
                {
                  error: 'INVALID_DEPOT_ASSIGNMENT',
                  message: 'Warehouse Manager must have an assigned depot center identifier.',
                },
                { status: 403 }
              );
            }
            const cleanActorDepot = resolveCanonicalDepotId(actor.centerId);
            const cleanBatchDepot = resolveCanonicalDepotId(batch.destinationDepotId) || batch.destinationDepotId?.trim();
            if (!cleanBatchDepot || cleanBatchDepot !== cleanActorDepot) {
              return NextResponse.json(
                {
                  error: 'CROSS_DEPOT_ACCESS_FORBIDDEN',
                  message: `Warehouse Manager is restricted to depot '${cleanActorDepot}'. Access to batch '${targetBatchId}' destined for '${cleanBatchDepot}' is forbidden.`,
                },
                { status: 403 }
              );
            }
            if (actor.district && batch.district && batch.district !== actor.district) {
              return NextResponse.json(
                {
                  error: 'CROSS_DISTRICT_ACCESS_FORBIDDEN',
                  message: `Warehouse Manager is restricted to district '${actor.district}'. Access to batch '${targetBatchId}' from district '${batch.district}' is forbidden.`,
                },
                { status: 403 }
              );
            }
          }

          if (actor.role === 'SHG_FACILITATOR') {
            if (actor.village && batch.gramPanchayat && batch.gramPanchayat.trim() !== actor.village.trim()) {
              return NextResponse.json(
                {
                  error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
                  message: `Facilitator is restricted to village '${actor.village}'. Access to batch in '${batch.gramPanchayat}' is forbidden.`,
                },
                { status: 403 }
              );
            }
            if (actor.district && batch.district && batch.district !== actor.district) {
              return NextResponse.json(
                {
                  error: 'FORBIDDEN_DISTRICT_ACCESS',
                  message: `Facilitator is not authorized for district '${batch.district}'.`,
                },
                { status: 403 }
              );
            }
          }

          if (actor.role === 'SUPERVISOR_ADMIN') {
            if (actor.district && batch.district && batch.district !== actor.district) {
              return NextResponse.json(
                {
                  error: 'FORBIDDEN_DISTRICT_ACCESS',
                  message: `Supervisor Admin is restricted to district '${actor.district}'. Access to batch '${targetBatchId}' in district '${batch.district}' is forbidden.`,
                },
                { status: 403 }
              );
            }
          }
        }
      }

      const cached = existingRecord.responseJson ? JSON.parse(existingRecord.responseJson) : null;
      return NextResponse.json({
        success: true,
        idempotentReplay: true,
        status: existingRecord.status,
        localId: existingRecord.localId,
        cachedResponse: cached,
        message: 'Idempotent request already processed. Returned cached server result.',
      });
    }

    // Step 4b: Centralized Conflict Persistence (Phase D / F7)
    if ((payload as any)?.isConflict || (payload as any)?.conflictReason) {
      const conflictReason = (payload as any).conflictReason || 'Field record diverged from central authority';
      const batchCode = (payload as any).batchCode || localId;

      const conflictEntry = await prisma.syncConflictRecord.create({
        data: {
          localId,
          batchCode,
          entityType,
          action,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          clientPayload: JSON.stringify(payload),
          serverPayload: JSON.stringify({
            status: 'CONFLICT_DETECTED',
            serverReceivedAt: new Date().toISOString(),
          }),
          conflictReason,
          status: 'OPEN',
        },
      });

      return NextResponse.json(
        {
          error: 'CONFLICT_DETECTED',
          message: `Record ${localId} flagged for supervisor review: ${conflictReason}`,
          conflictId: conflictEntry.id,
          server_payload: {
            batchCode,
            status: 'SERVER_AUTHORITY_CONFLICT',
            reason: conflictReason,
          },
        },
        { status: 409 }
      );
    }

    // Step 5: Atomic Persistence of Real Domain Models (P0-E)
    // Never acknowledge success without actual persistent domain record creation
    let resultPayload: any;

    if (entityType === 'pickup_request') {
      const parsedBatch = CreateBatchInputSchema.safeParse(payload);
      if (!parsedBatch.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_FAILED',
            message: 'Pickup request payload failed domain validation',
            issues: parsedBatch.error.issues,
          },
          { status: 422 }
        );
      }

      const bData = parsedBatch.data;

      // Village isolation check for facilitators
      if (actor.role === 'SHG_FACILITATOR') {
        if (!actor.village || !actor.village.trim()) {
          return NextResponse.json(
            {
              error: 'VILLAGE_REQUIRED',
              message: 'Facilitator must have an assigned village.',
            },
            { status: 403 }
          );
        }
        const cleanActorVillage = actor.village.trim();
        if (!bData.collectors.every((c) => c.village && c.village.trim() === cleanActorVillage)) {
          return NextResponse.json(
            {
              error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
              message: `Facilitator is restricted to village '${cleanActorVillage}'. Cannot submit records for other villages.`,
            },
            { status: 403 }
          );
        }
        if (actor.district && bData.district && bData.district.trim() !== actor.district.trim()) {
          return NextResponse.json(
            {
              error: 'FORBIDDEN_DISTRICT_ACCESS',
              message: `Facilitator is restricted to district '${actor.district}'. Access to district '${bData.district}' is forbidden.`,
            },
            { status: 403 }
          );
        }
      }

      // Center isolation check for collection managers
      if (actor.role === 'COLLECTION_MANAGER') {
        if (!actor.centerId) {
          return NextResponse.json(
            {
              error: 'CENTER_REQUIRED',
              message: 'Collection Manager must have an assigned center identifier.',
            },
            { status: 403 }
          );
        }
        if (!isCenterAuthorizedExact(actor.centerId, bData.centerName)) {
          return NextResponse.json(
            {
              error: 'CROSS_CENTER_ACCESS_FORBIDDEN',
              message: `Collection Manager is restricted to center '${actor.centerId}'. Access to '${bData.centerName}' is forbidden.`,
            },
            { status: 403 }
          );
        }
      }

      resultPayload = await prisma.$transaction(async (tx) => {
        const existingBatch = await tx.batch.findUnique({ where: { id: bData.id } });
        if (existingBatch) {
          const err: any = new Error(`Batch '${bData.id}' already exists on server.`);
          err.code = 'RECORD_ALREADY_EXISTS';
          err.status = 409;
          throw err;
        }

        const rateConfig = await tx.produceRateConfiguration.findFirst({
          where: { produceName: bData.produceName },
        });
        const authoritativeRate = rateConfig?.ratePerKg ?? 42.0;

        const collectorsData = bData.collectors.map((c) => ({
          id: c.id,
          tribalId: c.tribalId,
          name: c.name,
          nameOdia: c.nameOdia,
          gender: c.gender,
          age: c.age,
          village: c.village,
          villageOdia: c.villageOdia,
          weightKg: c.weightKg,
          ratePerKg: authoritativeRate,
          grossPayout: Number((c.weightKg * authoritativeRate).toFixed(2)),
          bankName: c.bankName,
          accountEnding: c.accountEnding,
          dbtRef: `DBT-OD-${Date.now().toString().slice(-4)}`,
          paymentStatus: 'READY_FOR_DISBURSEMENT' as const,
          isSimulated: true,
          collectedDate: new Date().toISOString().split('T')[0],
          signedByFacilitator: actor.fullName,
        }));

        const batch = await tx.batch.create({
          data: {
            id: bData.id,
            produceConfigId: rateConfig?.id,
            produceName: bData.produceName,
            produceOdia: bData.produceOdia,
            scientificName: bData.scientificName,
            district: bData.district,
            block: bData.block,
            gramPanchayat: bData.gramPanchayat,
            centerName: bData.centerName,
            shgName: bData.shgName,
            facilitatorName: actor.fullName,
            referenceRatePerKg: authoritativeRate,
            rateSource: rateConfig?.sourceAuthority ?? 'TDCCOL MSP Baseline (Illustrative)',
            ratePublishedDate: rateConfig?.effectiveFrom?.toISOString().split('T')[0] ?? '2024-04-01',
            seasonalReadinessStatus: 'ACTIVE_HARVEST',
            pickupRequestId: bData.pickupRequestId,
            status: 'REQUESTED',
            version: 1,
            collectors: {
              create: collectorsData,
            },
          },
        });

        const resp = {
          batchId: batch.id,
          status: batch.status,
          collectorCount: collectorsData.length,
          syncedAt: batch.createdAt.toISOString(),
        };

        await tx.syncIdempotencyRecord.create({
          data: {
            idempotencyKey,
            localId,
            entityType,
            action,
            actorId: actor.userId,
            status: 'PROCESSED',
            payloadHash,
            responseJson: JSON.stringify(resp),
          },
        });

        return resp;
      });
    } else if (entityType === 'collection' || entityType === 'dispatch') {
      const parsedField = FieldVerificationInputSchema.safeParse(payload);
      if (!parsedField.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_FAILED',
            message: 'Collection field verification payload failed domain validation',
            issues: parsedField.error.issues,
          },
          { status: 422 }
        );
      }

      const fData = parsedField.data;

      resultPayload = await prisma.$transaction(async (tx) => {
        const batch = await tx.batch.findUnique({
          where: { id: fData.batchId },
          include: { step1: true },
        });

        if (!batch) {
          const notFoundError: any = new Error(`Target batch '${fData.batchId}' not found in server ledger`);
          notFoundError.code = 'BATCH_NOT_FOUND';
          notFoundError.status = 404;
          throw notFoundError;
        }

        // Scope authorization (SEC-03: Collection center isolation)
        if (actor.role === 'COLLECTION_MANAGER') {
          if (!actor.centerId) {
            const err: any = new Error('Collection Manager must have an assigned center identifier.');
            err.code = 'CENTER_REQUIRED';
            err.status = 403;
            throw err;
          }
          const centerMatches = isCenterAuthorizedExact(actor.centerId, batch.centerName);
          if (!centerMatches) {
            const err: any = new Error(
              `Collection Manager is restricted to center '${actor.centerId}'. Access to batch '${fData.batchId}' from center '${batch.centerName}' is forbidden.`
            );
            err.code = 'CROSS_CENTER_ACCESS_FORBIDDEN';
            err.status = 403;
            throw err;
          }
          if (actor.district && batch.district && batch.district !== actor.district) {
            const err: any = new Error(
              `Collection Manager is restricted to district '${actor.district}'. Access to batch '${fData.batchId}' in district '${batch.district}' is forbidden.`
            );
            err.code = 'FORBIDDEN_DISTRICT_ACCESS';
            err.status = 403;
            throw err;
          }
        }

        if (actor.role === 'SUPERVISOR_ADMIN') {
          if (actor.district && batch.district && batch.district !== actor.district) {
            const err: any = new Error(
              `Supervisor Admin is restricted to district '${actor.district}'. Access to batch '${fData.batchId}' in district '${batch.district}' is forbidden.`
            );
            err.code = 'FORBIDDEN_DISTRICT_ACCESS';
            err.status = 403;
            throw err;
          }
        }

        if (batch.step1) {
          const isIdentical =
            batch.step1.netAcceptedKg === fData.netAcceptedKg &&
            batch.step1.grossWeightKg === fData.grossWeightKg &&
            batch.step1.tareWeightKg === fData.tareWeightKg &&
            batch.step1.grade === fData.grade &&
            batch.step1.sealTagId === fData.sealTagId;

          if (isIdentical) {
            return {
              batchId: batch.id,
              status: batch.status,
              isReplay: true,
              verifiedAt: batch.step1.verifiedAt.toISOString(),
              verifiedBy: batch.step1.verifiedBy,
            };
          }

          const conflictError: any = new Error(
            `Field verification for batch '${fData.batchId}' has already been accepted (${batch.step1.netAcceptedKg} kg). Overwriting certified field weighments is prohibited.`
          );
          conflictError.code = 'RECORD_ALREADY_ACCEPTED';
          conflictError.status = 409;
          throw conflictError;
        }

        let canonicalDepot: string | null = null;
        if (fData.destinationDepotId) {
          canonicalDepot =
            resolveCanonicalDepotId(fData.destinationDepotId) ||
            fData.destinationDepotId.trim();

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

        const step1 = await tx.step1FieldVerification.create({
          data: {
            batchId: fData.batchId,
            grossWeightKg: fData.grossWeightKg,
            tareWeightKg: fData.tareWeightKg,
            netAcceptedKg: fData.netAcceptedKg,
            grade: fData.grade,
            sackCount: fData.sackCount,
            sealTagId: fData.sealTagId,
            vehicleNumber: fData.vehicleNumber,
            driverName: fData.driverName,
            tarpaulinConfirmed: fData.tarpaulinConfirmed,
            transitWaybillId: fData.transitWaybillId,
            observedMoisturePercent: fData.observedMoisturePercent,
            initialDestinationDepotId: canonicalDepot ?? null,
            verifiedBy: actor.fullName,
            verifiedByRole: actor.role,
            verifiedAt: new Date(),
            notes: fData.notes ?? null,
          },
        });

        const updatedBatch = await tx.batch.update({
          where: { id: fData.batchId },
          data: {
            status: 'PENDING_VERIFICATION',
            version: { increment: 1 },
            ...(canonicalDepot ? { destinationDepotId: canonicalDepot } : {}),
          },
        });

        const resp = {
          batchId: updatedBatch.id,
          status: updatedBatch.status,
          netAcceptedKg: step1.netAcceptedKg,
          verifiedAt: step1.verifiedAt.toISOString(),
          verifiedBy: actor.fullName,
        };

        await tx.syncIdempotencyRecord.create({
          data: {
            idempotencyKey,
            localId,
            entityType,
            action,
            actorId: actor.userId,
            status: 'PROCESSED',
            payloadHash,
            responseJson: JSON.stringify(resp),
          },
        });

        return resp;
      });
    } else if (entityType === 'storage_receipt') {
      const parsedWarehouse = WarehouseVerificationInputSchema.safeParse(payload);
      if (!parsedWarehouse.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_FAILED',
            message: 'Storage receipt payload failed domain validation',
            issues: parsedWarehouse.error.issues,
          },
          { status: 422 }
        );
      }

      const wData = parsedWarehouse.data;

      resultPayload = await prisma.$transaction(async (tx) => {
        const batch = await tx.batch.findUnique({
          where: { id: wData.batchId },
          include: { step1: true, step2: true },
        });

        if (!batch) {
          const notFoundError: any = new Error(`Target batch '${wData.batchId}' not found in server ledger`);
          notFoundError.code = 'BATCH_NOT_FOUND';
          notFoundError.status = 404;
          throw notFoundError;
        }

        // Scope authorization (SEC-03: Depot and district isolation)
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
            const err: any = new Error('Warehouse Manager assigned depot cannot be resolved.');
            err.code = 'INVALID_DEPOT_ASSIGNMENT';
            err.status = 403;
            throw err;
          }

          // District isolation: Cannot intake batches outside assigned district jurisdiction
          if (actor.district && batch.district && batch.district !== actor.district) {
            const err: any = new Error(
              `Warehouse Manager is restricted to district '${actor.district}'. Access to batch '${wData.batchId}' from district '${batch.district}' is forbidden.`
            );
            err.code = 'CROSS_DISTRICT_ACCESS_FORBIDDEN';
            err.status = 403;
            throw err;
          }

          if (!batch.destinationDepotId) {
            const err: any = new Error(
              `Batch '${wData.batchId}' has no assigned destination depot. Warehouse intake is forbidden until assigned.`
            );
            err.code = 'DEPOT_ASSIGNMENT_REQUIRED';
            err.status = 403;
            throw err;
          }

          const cleanBatchDepot = resolveCanonicalDepotId(batch.destinationDepotId) || batch.destinationDepotId.trim();
          if (cleanBatchDepot !== cleanActorDepot) {
            const err: any = new Error(
              `Warehouse Manager is restricted to depot '${cleanActorDepot}'. Access to batch '${wData.batchId}' destined for '${cleanBatchDepot}' is forbidden.`
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
              `Supervisor Admin is restricted to district '${actor.district}'. Access to batch '${wData.batchId}' in district '${batch.district}' is forbidden.`
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

        if (!batch.step1) {
          const err: any = new Error(`Batch '${wData.batchId}' has not completed authoritative Step 1 Field Verification`);
          err.code = 'PRECONDITION_REQUIRED';
          err.status = 400;
          throw err;
        }

        if (batch.step2) {
          const isIdentical =
            batch.step2.arrivalNetWeightKg === wData.arrivalNetWeightKg &&
            batch.step2.arrivalGrossWeightKg === wData.arrivalGrossWeightKg &&
            batch.step2.arrivalTareWeightKg === wData.arrivalTareWeightKg &&
            batch.step2.storageZone === wData.storageZone;

          if (isIdentical) {
            return {
              batchId: batch.id,
              status: batch.status,
              isReplay: true,
              arrivalNetWeightKg: batch.step2.arrivalNetWeightKg,
              discrepancyTriggered: batch.step2.discrepancyTriggered,
              verifiedAt: batch.step2.verifiedAt.toISOString(),
              verifiedBy: batch.step2.verifiedBy,
            };
          }

          const conflictError: any = new Error(
            `Warehouse arrival verification for batch '${wData.batchId}' has already been accepted and certified (${batch.step2.arrivalNetWeightKg} kg, status: ${batch.status}). Overwriting certified warehouse weighments is prohibited.`
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

        // Certified field weight remains untouched!
        const dispatchedNetKg = batch.step1.netAcceptedKg;
        const tolerancePercent = wData.tolerancePercent ?? 1.5;
        const shrinkageKgAllowed = Number(((dispatchedNetKg * tolerancePercent) / 100).toFixed(2));
        const actualLossKg = Number((dispatchedNetKg - wData.arrivalNetWeightKg).toFixed(2));
        const unexplainedVarianceKg = Number((actualLossKg - shrinkageKgAllowed).toFixed(2));
        const discrepancyTriggered = unexplainedVarianceKg > 2.0;

        const newBatchStatus = discrepancyTriggered ? 'QUARANTINED_DISCREPANCY' : 'VERIFIED_SALEABLE';

        const step2 = await tx.step2WarehouseVerification.create({
          data: {
            batchId: wData.batchId,
            arrivalGrossWeightKg: wData.arrivalGrossWeightKg,
            arrivalTareWeightKg: wData.arrivalTareWeightKg,
            arrivalNetWeightKg: wData.arrivalNetWeightKg,
            storageZone: wData.storageZone,
            receivingDepotId: resolveCanonicalDepotId(actor.centerId) ?? null,
            shrinkagePercentAllowed: tolerancePercent,
            shrinkageKgAllowed,
            unexplainedVarianceKg: -unexplainedVarianceKg,
            discrepancyTriggered,
            supervisorCaseId: discrepancyTriggered ? `DISC-${wData.batchId}` : null,
            verifiedBy: actor.fullName,
            verifiedByRole: actor.role,
            verifiedAt: new Date(),
            notes: wData.notes ?? null,
          },
        });

        const updatedBatch = await tx.batch.update({
          where: { id: wData.batchId },
          data: {
            status: newBatchStatus,
            version: { increment: 1 },
          },
        });

        const resp = {
          batchId: updatedBatch.id,
          status: updatedBatch.status,
          arrivalNetWeightKg: step2.arrivalNetWeightKg,
          discrepancyTriggered,
          verifiedAt: step2.verifiedAt.toISOString(),
          verifiedBy: actor.fullName,
        };

        await tx.syncIdempotencyRecord.create({
          data: {
            idempotencyKey,
            localId,
            entityType,
            action,
            actorId: actor.userId,
            status: 'PROCESSED',
            payloadHash,
            responseJson: JSON.stringify(resp),
          },
        });

        return resp;
      });
    } else {
      // Safe fail-closed: do not return success for unhandled entity types without real persistence
      return NextResponse.json(
        {
          error: 'UNSUPPORTED_SYNC_ENTITY',
          message: `Entity type '${entityType}' action '${action}' cannot be persisted atomically. Server sync persistence is not implemented for this entity.`,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      idempotencyKey,
      localId,
      status: 'PROCESSED',
      data: resultPayload,
      actor: {
        userId: actor.userId,
        role: actor.role,
      },
    });
  } catch (err: any) {
    if (err?.code === 'P2002' && idempotencyKey) {
      try {
        const completed = await getPrismaClient().syncIdempotencyRecord.findUnique({
          where: { idempotencyKey },
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
                message: `Idempotency key '${idempotencyKey}' was already processed with a different payload. Reusing keys with modified payloads is prohibited.`,
              },
              { status: 409 }
            );
          }
          if (completed.responseJson) {
            const cached = JSON.parse(completed.responseJson);
            return NextResponse.json({
              success: true,
              idempotentReplay: true,
              status: completed.status,
              localId: completed.localId,
              cachedResponse: cached,
              message: 'Idempotent request already processed. Returned cached server result.',
            });
          }
        }
      } catch {
        // Fall through
      }
    }

    const status = err?.status || (err?.code === 'P2002' || err?.code === 'RECORD_ALREADY_ACCEPTED' ? 409 : 500);
    return NextResponse.json(
      {
        error: err?.code || 'SYNC_TRANSACTION_FAILED',
        message: err?.message || 'Database sync transaction failed',
        ...(err?.existingVerification ? { existingVerification: err.existingVerification } : {}),
      },
      { status }
    );
  }
}
