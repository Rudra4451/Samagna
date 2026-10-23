import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { CreateBatchInputSchema, BatchQueryFilterSchema } from '@/lib/server/validations';
import {
  requireServerRole,
  isResourceAuthorized,
  isCenterAuthorizedExact,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Step 1: Server-side authentication and role check (Mandatory F2/Batch 3 Rule)
  const auth = await requireServerRole(req, [
    'COLLECTOR',
    'SHG_FACILITATOR',
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;

  // Step 2: Validate query parameters with Zod schema first
  const url = new URL(req.url);
  const queryParams = {
    status: url.searchParams.get('status') || undefined,
    produceName: url.searchParams.get('produceName') || url.searchParams.get('product') || undefined,
    limit: url.searchParams.get('limit') || undefined,
    offset: url.searchParams.get('offset') || undefined,
  };

  const parsed = BatchQueryFilterSchema.safeParse(queryParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_FAILED',
        message: 'Invalid query parameters for batch retrieval',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const { status, produceName, limit, offset } = parsed.data;

  // Step 3: Validate database configuration (Fail-closed / distinction of unconfigured DB)
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_UNCONFIGURED',
        serverAvailable: false,
        message: 'DATABASE_URL is not configured. Server batches are unavailable; client operates via Dexie.',
        batches: [],
      },
      { status: 503 }
    );
  }

  // Step 4: Enforce role-specific access boundaries (District, Depot, Center, Village)
  let whereClause: any = {};

  // District isolation: all roles are bounded by their district
  if (actor.district) {
    whereClause.district = actor.district;
  }

  if (actor.role === 'COLLECTION_MANAGER') {
    if (!actor.centerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'CENTER_REQUIRED',
          message: 'Collection Manager must have an assigned center identifier.',
        },
        { status: 403 }
      );
    }
    whereClause.centerName = { contains: actor.centerId };
  } else if (actor.role === 'WAREHOUSE_MANAGER') {
    if (!actor.centerId || !isAuthorizedDepotCenter(actor.centerId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_DEPOT_ASSIGNMENT',
          message: 'Warehouse Manager must have an assigned depot center identifier.',
        },
        { status: 403 }
      );
    }
    const cleanActorDepot = resolveCanonicalDepotId(actor.centerId) || actor.centerId;
    whereClause.OR = [
      { destinationDepotId: cleanActorDepot },
      { step1: { initialDestinationDepotId: cleanActorDepot } },
      { step2: { receivingDepotId: cleanActorDepot } },
    ];
  } else if (actor.role === 'SHG_FACILITATOR') {
    if (actor.village) {
      whereClause.collectors = {
        some: {
          village: actor.village,
        },
      };
    }
  } else if (actor.role === 'COLLECTOR') {
    whereClause.collectors = {
      some: {
        OR: [
          { id: actor.userId },
          { tribalId: actor.userId },
        ],
      },
    };
  } else if (actor.role === 'SUPERVISOR_ADMIN') {
    const filterDistrict = url.searchParams.get('district');
    if (filterDistrict) {
      whereClause.district = filterDistrict;
    }
  }

  // Apply optional filters
  if (status) {
    whereClause.status = status;
  }
  if (produceName) {
    whereClause.produceName = { contains: produceName, mode: 'insensitive' };
  }

  try {
    const prisma = getPrismaClient();
    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where: whereClause,
        include: {
          collectors: true,
          step1: true,
          step2: true,
          discrepancyCases: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.batch.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      serverAvailable: true,
      source: 'DATABASE_POSTGRESQL',
      count: batches.length,
      total,
      limit,
      offset,
      batches,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_ERROR',
        serverAvailable: false,
        message: err?.message || 'Failed to query batches from server database',
      },
      { status: 500 }
    );
  }
}


export async function POST(req: NextRequest) {
  // Step 1: Server-side authentication and role check (Mandatory F2 Rule)
  // Only COLLECTOR, SHG_FACILITATOR, COLLECTION_MANAGER, and SUPERVISOR_ADMIN can create batches
  const auth = await requireServerRole(req, [
    'COLLECTOR',
    'SHG_FACILITATOR',
    'COLLECTION_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;

  // Step 2: Validate incoming request body with Zod schema
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const parsed = CreateBatchInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Request payload failed schema validation',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Step 3: Multi-tenant / village / center isolation check
  // Prevent unauthorized access to another user's or village's records
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
    if (!isCenterAuthorizedExact(actor.centerId, data.centerName)) {
      return NextResponse.json(
        {
          error: 'CROSS_CENTER_ACCESS_FORBIDDEN',
          message: `Collection Manager is restricted to center '${actor.centerId}'. Access to '${data.centerName}' is forbidden.`,
        },
        { status: 403 }
      );
    }
    if (actor.district && data.district && data.district !== actor.district) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Collection Manager is not authorized for district '${data.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'SHG_FACILITATOR' && actor.village && !data.collectors.every((c) => c.village === actor.village)) {
    return NextResponse.json(
      {
        error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
        message: `Facilitator is restricted to village '${actor.village}'. Cannot submit records for other villages.`,
      },
      { status: 403 }
    );
  }

  // Step 4: Database persistence or offline mode diagnostic
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message: 'Server database is not configured. Persisted locally in Dexie.',
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Step 5: Server-side price calculation and database transaction
    // Client-supplied actor identities or prices are NEVER trusted
    const result = await prisma.$transaction(async (tx) => {
      // Look up authoritative produce rate configuration
      const rateConfig = await tx.produceRateConfiguration.findFirst({
        where: { produceName: data.produceName },
      });

      const authoritativeRate = rateConfig?.ratePerKg ?? 42.0;

      // Recalculate collector contributions using authoritative rate
      const collectorsData = data.collectors.map((c) => {
        const grossPayout = Number((c.weightKg * authoritativeRate).toFixed(2));
        return {
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
          grossPayout,
          bankName: c.bankName,
          accountEnding: c.accountEnding,
          dbtRef: `TXN-STAGED-${Date.now()}`,
          paymentStatus: 'READY_FOR_DISBURSEMENT' as const,
          isSimulated: true,
          collectedDate: new Date().toISOString().split('T')[0],
          signedByFacilitator: actor.fullName, // Bound to authenticated session actor
        };
      });

      const newBatch = await tx.batch.create({
        data: {
          id: data.id,
          produceConfigId: rateConfig?.id ?? null,
          produceName: data.produceName,
          produceOdia: data.produceOdia,
          scientificName: data.scientificName ?? null,
          district: actor.district, // Bound to authenticated session district
          block: data.block,
          gramPanchayat: data.gramPanchayat,
          centerName: data.centerName,
          shgName: data.shgName,
          facilitatorName: actor.fullName, // Bound to session
          referenceRatePerKg: authoritativeRate,
          rateSource: rateConfig?.sourceAuthority ?? 'TDCCOL LABHA Benchmark',
          ratePublishedDate: new Date().toISOString().split('T')[0],
          seasonalReadinessStatus: 'Active Procurement',
          pickupRequestId: data.pickupRequestId,
          status: 'REQUESTED',
          version: 1,
          collectors: {
            create: collectorsData,
          },
        },
        include: {
          collectors: true,
        },
      });

      // Append initial audit event attributed to real authenticated actor
      await tx.auditEvent.create({
        data: {
          id: `AUD-${Date.now()}`,
          batchId: newBatch.id,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: 'AGGREGATION_INITIATED',
          title: 'Batch aggregation initiated',
          description: `Batch ${newBatch.id} created by authenticated ${actor.role} (${actor.fullName}).`,
          isSimulated: true,
        },
      });

      return newBatch;
    });

    return NextResponse.json({ success: true, batch: result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'PERSISTENCE_ERROR',
        message: err?.message || 'Transaction failed',
      },
      { status: 500 }
    );
  }
}
