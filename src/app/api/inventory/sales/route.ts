import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { CreateInventorySaleSchema } from '@/lib/server/validations';
import {
  requireServerRole,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';
import { generateULID } from '@/lib/ulid';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Step 1: Server authorization guard (Only Warehouse Managers or Supervisors)
  const auth = await requireServerRole(req, ['WAREHOUSE_MANAGER', 'SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;

  // Step 2: Database persistence fallback
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: true,
        message: 'DATABASE_URL is not configured. Server sales are held in client-side Dexie ledger.',
        sales: [],
        availableStockKg: 0,
      },
      { status: 200 }
    );
  }

  try {
    const prisma = getPrismaClient();

    let whereClause: any = {};

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
      whereClause.depotId = cleanActorDepot;
    }

    const sales = await prisma.inventorySale.findMany({
      where: whereClause,
      orderBy: { dispatchedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'DATABASE_ERROR',
        message: err?.message || 'Failed to query inventory sales',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Step 1: Server authorization guard (F10: Only Warehouse Managers or Supervisors)
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

  const parsed = CreateInventorySaleSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_FAILED',
        message: 'Inventory outward sale failed schema validation',
        issues: parsed.error.issues,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Canonical depot resolution
  const canonicalDepot = resolveCanonicalDepotId(data.depotId) || data.depotId.trim();

  // Step 3: Scope authorization & Depot Isolation (SEC-03 / SEC-DEP)
  if (actor.role === 'WAREHOUSE_MANAGER') {
    if (!actor.centerId) {
      return NextResponse.json(
        {
          error: 'DEPOT_REQUIRED',
          message: 'Warehouse Manager must have an assigned depot center identifier.',
        },
        { status: 403 }
      );
    }

    if (!isAuthorizedDepotCenter(actor.centerId)) {
      return NextResponse.json(
        {
          error: 'INVALID_DEPOT_ASSIGNMENT',
          message: `Warehouse Manager center '${actor.centerId}' is not an authorized central depot.`,
        },
        { status: 403 }
      );
    }

    const cleanActorDepot = resolveCanonicalDepotId(actor.centerId);
    if (cleanActorDepot !== canonicalDepot) {
      return NextResponse.json(
        {
          error: 'CROSS_DEPOT_ACCESS_FORBIDDEN',
          message: `Warehouse Manager is restricted to depot '${cleanActorDepot}'. Sales from '${canonicalDepot}' are forbidden.`,
        },
        { status: 403 }
      );
    }

    if (actor.district && data.depotId.startsWith('BRP') && actor.district !== 'Mayurbhanj') {
      return NextResponse.json(
        {
          error: 'CROSS_DISTRICT_ACCESS_FORBIDDEN',
          message: `Warehouse Manager is restricted to district '${actor.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'SUPERVISOR_ADMIN') {
    if (actor.district && data.depotId.startsWith('BRP') && actor.district !== 'Mayurbhanj') {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_DISTRICT_ACCESS',
          message: `Supervisor is restricted to district '${actor.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  // Step 4: Handle unconfigured database fallback (fail-closed, no phantom server sync)
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message: 'Server PostgreSQL database is unconfigured. Outward sales must be held safely in local Dexie ledger.',
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Step 5: Execute atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 5a. Idempotency Check with Actor Ownership Verification (SEC-FIG-01)
      const existingSale = await tx.inventorySale.findFirst({
        where: { idempotencyKey: data.idempotencyKey },
      });

      if (existingSale) {
        if (!existingSale.actorId || existingSale.actorId !== actor.userId) {
          const err: any = new Error('Idempotency key was created by another actor or is invalid.');
          err.code = 'FORBIDDEN_IDEMPOTENCY_ACCESS';
          err.status = 403;
          throw err;
        }

        // Return cached replay
        return {
          idempotentReplay: true,
          data: existingSale,
          message: 'Idempotent request already processed. Returned cached sale result.',
        };
      }

      // 5b. Validate Depot facility exists and is active
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
          `Depot facility '${canonicalDepot}' is inactive. Sales from inactive depots are prohibited.`
        );
        err.code = 'INACTIVE_DESTINATION_DEPOT';
        err.status = 422;
        throw err;
      }

      if (depotLoc.locationType !== 'CENTRAL_DEPOT') {
        const err: any = new Error(
          `Facility '${canonicalDepot}' is classified as '${depotLoc.locationType}'. Outward sales must originate from a CENTRAL_DEPOT.`
        );
        err.code = 'INVALID_DEPOT_TYPE';
        err.status = 422;
        throw err;
      }

      // 5c. Concurrency-Safe Stock Calculation
      // Incoming verified saleable stock
      const incomingBatches = await tx.batch.findMany({
        where: {
          destinationDepotId: canonicalDepot,
          produceName: data.produceName,
          status: 'VERIFIED_SALEABLE',
        },
        include: { step2: true },
      });

      const totalIncomingKg = incomingBatches.reduce(
        (acc, b) => acc + (b.step2?.arrivalNetWeightKg ?? 0),
        0
      );

      // Existing outward sales for this produce and depot
      const existingSales = await tx.inventorySale.findMany({
        where: {
          depotId: canonicalDepot,
          produceName: data.produceName,
        },
      });

      const totalSoldKg = existingSales.reduce((acc, s) => acc + s.quantityKg, 0);
      const availableStockKg = Math.max(0, Number((totalIncomingKg - totalSoldKg).toFixed(2)));

      if (data.quantityKg > availableStockKg) {
        const err: any = new Error(
          `Sale quantity (${data.quantityKg} kg) exceeds available saleable stock (${availableStockKg.toFixed(1)} kg) at depot '${canonicalDepot}'. Negative inventory is prohibited.`
        );
        err.code = 'INSUFFICIENT_STOCK';
        err.status = 422;
        throw err;
      }

      // 5d. Persist Outward Sale Record
      const saleId = data.id || generateULID();
      const saleRef = data.saleReference || `SALE-${canonicalDepot}-${Date.now()}`;
      const totalAmt =
        data.totalAmount ??
        (data.salePricePerKg ? Number((data.quantityKg * data.salePricePerKg).toFixed(2)) : null);

      const sale = await tx.inventorySale.create({
        data: {
          id: saleId,
          saleReference: saleRef,
          produceName: data.produceName,
          quantityKg: data.quantityKg,
          buyerName: data.buyerName,
          destination: data.destination ?? null,
          salePricePerKg: data.salePricePerKg ?? null,
          totalAmount: totalAmt,
          depotId: canonicalDepot,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          idempotencyKey: data.idempotencyKey,
          notes: data.notes ?? null,
        },
      });

      // 5e. Append Immutable Audit Event
      await tx.auditEvent.create({
        data: {
          id: generateULID(),
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: 'OUTWARD_SALE_DISPATCHED',
          title: `Outward Sale: ${data.quantityKg} kg of ${data.produceName}`,
          description: `Dispatched ${data.quantityKg} kg to ${data.buyerName} from depot '${canonicalDepot}'. Remaining stock: ${(availableStockKg - data.quantityKg).toFixed(1)} kg.`,
          details: JSON.stringify({
            saleId: sale.id,
            saleReference: sale.saleReference,
            quantityKg: data.quantityKg,
            buyerName: data.buyerName,
            remainingStockKg: Number((availableStockKg - data.quantityKg).toFixed(2)),
          }),
        },
      });

      return {
        idempotentReplay: false,
        data: sale,
        availableStockKg: Number((availableStockKg - data.quantityKg).toFixed(2)),
      };
    });

    return NextResponse.json(
      {
        success: true,
        idempotentReplay: result.idempotentReplay,
        data: result.data,
        availableStockKg: result.availableStockKg,
      },
      { status: result.idempotentReplay ? 200 : 201 }
    );
  } catch (err: any) {
    if (err?.code === 'P2002') {
      try {
        const prisma = getPrismaClient();
        const existing = await prisma.inventorySale.findFirst({
          where: { idempotencyKey: data.idempotencyKey },
        });

        if (!existing?.actorId || existing.actorId !== actor.userId) {
          return NextResponse.json(
            {
              error: 'FORBIDDEN_IDEMPOTENCY_ACCESS',
              message: 'Idempotency key collision from another actor.',
            },
            { status: 403 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            idempotentReplay: true,
            data: existing,
            message: 'Idempotent request already processed. Returned cached sale result.',
          },
          { status: 200 }
        );
      } catch {
        return NextResponse.json(
          { error: 'IDEMPOTENCY_CONFLICT', message: 'Concurrent idempotency collision' },
          { status: 409 }
        );
      }
    }

    const statusCode = err?.status || (err?.code === 'INSUFFICIENT_STOCK' ? 422 : 500);
    return NextResponse.json(
      {
        error: err?.code || 'INTERNAL_ERROR',
        message: err?.message || 'Failed to process inventory outward sale',
      },
      { status: statusCode }
    );
  }
}
