import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { requireServerRole, resolveCanonicalDepotId } from '@/lib/server/auth';
import { RerouteBatchInputSchema } from '@/lib/server/validations';
import { generateULID } from '@/lib/ulid';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  // Step 1: Supervisor-only authentication guard
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;
  const resolvedParams = await Promise.resolve(props.params);
  const batchId = resolvedParams?.id;

  // Step 2: Parse and validate input payload
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const parsed = RerouteBatchInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Reroute request failed input schema validation',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Step 3: Validate canonical target depot
  const canonicalNewDepot =
    resolveCanonicalDepotId(data.newDestinationDepotId) ||
    data.newDestinationDepotId.trim();

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message: 'Server database is unconfigured. Transit reroutes cannot be committed.',
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Step 4: Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: batchId },
        include: { step1: true, step2: true },
      });

      if (!batch) {
        const notFound: any = new Error(`Batch '${batchId}' not found in server ledger`);
        notFound.code = 'BATCH_NOT_FOUND';
        notFound.status = 404;
        throw notFound;
      }

      // Enforce the supervisor's district jurisdiction inside the transaction before mutation
      if (!actor.district || !actor.district.trim()) {
        const err: any = new Error(
          'Supervisor Admin must have an assigned district jurisdiction.'
        );
        err.code = 'DISTRICT_REQUIRED';
        err.status = 403;
        throw err;
      }

      if (!batch.district || !batch.district.trim()) {
        const err: any = new Error(
          `Batch '${batchId}' has no authoritative district recorded. Cross-district verification failed.`
        );
        err.code = 'BATCH_DISTRICT_REQUIRED';
        err.status = 403;
        throw err;
      }

      if (actor.district.trim() !== batch.district.trim()) {
        const err: any = new Error(
          `Supervisor Admin is restricted to district '${actor.district.trim()}'. Rerouting batch '${batchId}' in district '${batch.district.trim()}' is forbidden.`
        );
        err.code = 'FORBIDDEN_DISTRICT_ACCESS';
        err.status = 403;
        throw err;
      }

      // Precondition: Must already be dispatched (step 1 must exist)
      if (!batch.step1) {
        const err: any = new Error(
          `Batch '${batchId}' has not completed Step 1 dispatch. Destination can only be rerouted in transit.`
        );
        err.code = 'PRECONDITION_REQUIRED';
        err.status = 400;
        throw err;
      }

      // Concurrency & state safety: Cannot reroute once warehouse receipt is accepted
      if (batch.step2) {
        const err: any = new Error(
          `Batch '${batchId}' has already completed Step 2 warehouse receipt at depot. Rerouting accepted lots is prohibited.`
        );
        err.code = 'RECORD_ALREADY_ACCEPTED';
        err.status = 409;
        throw err;
      }

      // Verify target facility is an active central depot
      const targetLocation = await tx.aggregationLocation.findUnique({
        where: { code: canonicalNewDepot },
      });
      if (!targetLocation) {
        const err: any = new Error(
          `Target depot '${canonicalNewDepot}' was not found in registered aggregation locations.`
        );
        err.code = 'INVALID_DESTINATION_DEPOT';
        err.status = 422;
        throw err;
      }
      if (!targetLocation.isActive) {
        const err: any = new Error(
          `Target depot '${canonicalNewDepot}' is inactive. Rerouting to inactive depots is prohibited.`
        );
        err.code = 'INACTIVE_DESTINATION_DEPOT';
        err.status = 422;
        throw err;
      }
      if (targetLocation.locationType !== 'CENTRAL_DEPOT') {
        const err: any = new Error(
          `Facility '${canonicalNewDepot}' is classified as '${targetLocation.locationType}'. Target must be classified as a CENTRAL_DEPOT.`
        );
        err.code = 'INVALID_DEPOT_TYPE';
        err.status = 422;
        throw err;
      }

      const previousDepot = batch.destinationDepotId ?? null;

      // Update active destination on Batch
      const updatedBatch = await tx.batch.update({
        where: { id: batchId },
        data: {
          destinationDepotId: canonicalNewDepot,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      // Record immutable audit event
      const auditEventId = generateULID();
      await tx.auditEvent.create({
        data: {
          id: auditEventId,
          batchId: batch.id,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: 'TRANSIT_DESTINATION_REROUTED',
          title: `Transit Rerouted: ${previousDepot || 'UNASSIGNED'} -> ${canonicalNewDepot}`,
          description: data.reason,
          details: JSON.stringify({
            previousDepot,
            newDestinationDepotId: canonicalNewDepot,
            initialDispatchDepot: batch.step1.initialDestinationDepotId ?? null,
            transitWaybillId: batch.step1.transitWaybillId,
            incidentCaseId: data.incidentCaseId || null,
          }),
          isSimulated: false,
        },
      });

      return {
        success: true,
        batchId: updatedBatch.id,
        previousDestinationDepotId: previousDepot,
        newDestinationDepotId: canonicalNewDepot,
        reroutedBy: actor.fullName,
        reroutedAt: new Date().toISOString(),
        auditEventId,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: err.code || 'REROUTE_FAILED',
        message: err.message || 'Failed to reroute batch destination',
      },
      { status }
    );
  }
}
