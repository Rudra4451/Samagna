import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { requireServerRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Only SUPERVISOR_ADMIN can access centralized conflict ledger
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;
  if (!actor.district || !actor.district.trim()) {
    return NextResponse.json(
      {
        error: 'DISTRICT_REQUIRED',
        message: 'Supervisor Admin must have an assigned district jurisdiction to access conflicts.',
      },
      { status: 403 }
    );
  }

  if (!isDatabaseConfigured()) {
    // If database unconfigured, return diagnostic status
    return NextResponse.json({
      source: 'LOCAL_STANDBY',
      message: 'PostgreSQL database unconfigured. Active conflicts are arbitrated through local Dexie outbox.',
      district: actor.district.trim(),
      conflicts: [],
    });
  }

  try {
    const prisma = getPrismaClient();
    const actorDistrict = actor.district.trim().toLowerCase();

    const conflicts = await prisma.syncConflictRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const batchCodes = Array.from(new Set(conflicts.map((c) => c.batchCode).filter(Boolean)));
    const actorIds = Array.from(new Set(conflicts.map((c) => c.actorId).filter(Boolean)));

    const [batches, submittingUsers] = await Promise.all([
      prisma.batch.findMany({
        where: { id: { in: batchCodes } },
        select: { id: true, district: true },
      }),
      prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, district: true },
      }),
    ]);

    const batchDistrictMap = new Map(batches.map((b) => [b.id, b.district?.trim().toLowerCase()]));
    const userDistrictMap = new Map(submittingUsers.map((u) => [u.id, u.district?.trim().toLowerCase()]));

    // Strictly filter conflicts to only those reliably associated with supervisor's district.
    // Never expose another district's conflicts or ambiguous records.
    const filteredConflicts = conflicts.filter((conflict) => {
      // 1. Direct Batch lookup
      if (conflict.batchCode && batchDistrictMap.has(conflict.batchCode)) {
        const bDistrict = batchDistrictMap.get(conflict.batchCode);
        return Boolean(bDistrict && bDistrict === actorDistrict);
      }

      // 2. Client payload + submitting user verification
      let payloadDistrict: string | null = null;
      try {
        const p = JSON.parse(conflict.clientPayload);
        if (typeof p?.district === 'string' && p.district.trim()) {
          payloadDistrict = p.district.trim().toLowerCase();
        }
      } catch {}

      const uDistrict = userDistrictMap.get(conflict.actorId);
      if (
        payloadDistrict &&
        uDistrict &&
        payloadDistrict === actorDistrict &&
        uDistrict === actorDistrict
      ) {
        return true;
      }

      // Ambiguous or other-district: fail closed (exclude from supervisor view)
      return false;
    });

    return NextResponse.json({
      source: 'DATABASE_POSTGRESQL',
      count: filteredConflicts.length,
      district: actor.district.trim(),
      conflicts: filteredConflicts,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'DATABASE_QUERY_FAILED',
        message: err?.message || 'Failed to query conflict records from PostgreSQL',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Only supervisors and admins can arbitrate conflicts
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;
  if (!actor.district || !actor.district.trim()) {
    return NextResponse.json(
      {
        error: 'DISTRICT_REQUIRED',
        message: 'Supervisor Admin must have an assigned district jurisdiction to arbitrate conflicts.',
      },
      { status: 403 }
    );
  }

  let bodyJson: any;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const { conflictId, resolution, resolutionNote, mergedPayload } = bodyJson;

  if (!conflictId || !['KEEP_LOCAL', 'KEEP_SERVER', 'MERGE'].includes(resolution)) {
    return NextResponse.json(
      {
        error: 'INVALID_RESOLUTION_PARAMETERS',
        message: 'Must provide valid conflictId and resolution (KEEP_LOCAL, KEEP_SERVER, or MERGE).',
      },
      { status: 422 }
    );
  }

  if (resolution === 'MERGE' && (!resolutionNote || resolutionNote.trim().length < 5)) {
    return NextResponse.json(
      {
        error: 'REASON_REQUIRED',
        message: 'A substantive supervisor resolution note (min 5 chars) is mandatory when merging records.',
      },
      { status: 422 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message: 'Server database is unconfigured. Conflict resolution recorded in client Dexie ledger.',
        clientResolution: {
          conflictId,
          resolution,
          resolvedBy: actor.fullName,
          resolvedAt: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    const result = await prisma.$transaction(async (tx) => {
      const conflict = await tx.syncConflictRecord.findUnique({
        where: { id: conflictId },
      });

      if (!conflict) {
        const notFound: any = new Error(`Conflict record with ID "${conflictId}" was not found.`);
        notFound.code = 'CONFLICT_NOT_FOUND';
        notFound.status = 404;
        throw notFound;
      }

      const actorDistrict = actor.district.trim().toLowerCase();
      let isAuthorizedDistrict = false;

      // Check if conflict is associated with a batch in the database
      if (conflict.batchCode) {
        const batch = await tx.batch.findUnique({
          where: { id: conflict.batchCode },
          select: { id: true, district: true },
        });

        if (batch) {
          if (!batch.district || !batch.district.trim()) {
            const err: any = new Error(
              `Batch '${conflict.batchCode}' has no registered district. Ambiguous conflict resolution rejected.`
            );
            err.code = 'AMBIGUOUS_DISTRICT_CONFLICT';
            err.status = 403;
            throw err;
          }

          if (batch.district.trim().toLowerCase() !== actorDistrict) {
            const forbidden: any = new Error(
              `Supervisor Admin is restricted to district '${actor.district.trim()}'. Conflict resolution for batch '${conflict.batchCode}' in district '${batch.district.trim()}' is forbidden.`
            );
            forbidden.code = 'FORBIDDEN_DISTRICT_ACCESS';
            forbidden.status = 403;
            throw forbidden;
          }

          isAuthorizedDistrict = true;
        }
      }

      // If not verified via batch table, check clientPayload and submitting user
      if (!isAuthorizedDistrict) {
        let payloadDistrict: string | null = null;
        try {
          const p = JSON.parse(conflict.clientPayload);
          if (typeof p?.district === 'string' && p.district.trim()) {
            payloadDistrict = p.district.trim().toLowerCase();
          }
        } catch {}

        const submittingUser = await tx.user.findUnique({
          where: { id: conflict.actorId },
          select: { district: true },
        });
        const uDistrict = submittingUser?.district?.trim().toLowerCase();

        if (payloadDistrict && uDistrict) {
          if (payloadDistrict !== actorDistrict || uDistrict !== actorDistrict) {
            const forbidden: any = new Error(
              `Supervisor Admin is restricted to district '${actor.district.trim()}'. Conflict resolution for record in district '${payloadDistrict || uDistrict}' is forbidden.`
            );
            forbidden.code = 'FORBIDDEN_DISTRICT_ACCESS';
            forbidden.status = 403;
            throw forbidden;
          }
          isAuthorizedDistrict = true;
        } else {
          // Cannot reliably associate conflict with a district without schema migration
          const ambiguous: any = new Error(
            `Conflict record '${conflictId}' cannot be reliably associated with supervisor's district without a schema migration. Resolution rejected.`
          );
          ambiguous.code = 'AMBIGUOUS_DISTRICT_CONFLICT';
          ambiguous.status = 403;
          throw ambiguous;
        }
      }

      const statusMap: Record<string, string> = {
        KEEP_LOCAL: 'RESOLVED_KEEP_LOCAL',
        KEEP_SERVER: 'RESOLVED_KEEP_SERVER',
        MERGE: 'RESOLVED_MERGED',
      };

      const updated = await tx.syncConflictRecord.update({
        where: { id: conflictId },
        data: {
          status: statusMap[resolution],
          resolutionNote: resolutionNote || `Supervisor arbitrated conflict via ${resolution}.`,
          resolvedBy: actor.fullName,
          resolvedAt: new Date(),
        },
      });

      // Write immutable audit log entry
      await tx.auditEvent.create({
        data: {
          id: `AUD-CONF-${Date.now()}`,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          actionType: 'SYNC_CONFLICT_RESOLVED',
          title: `Sync Conflict Arbitrated for ${conflict.batchCode}`,
          description: `Supervisor arbitrated dual-write conflict for ${conflict.batchCode} using ${resolution}. Reason: ${resolutionNote || 'None'}`,
          details: JSON.stringify({
            conflictId,
            batchCode: conflict.batchCode,
            resolution,
            mergedPayload,
            district: actor.district.trim(),
          }),
          isSimulated: true,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      conflict: result,
      message: `Conflict ${conflictId} successfully resolved via ${resolution}.`,
    });
  } catch (err: any) {
    const status = err.status || 500;
    return NextResponse.json(
      {
        error: err.code || 'CONFLICT_RESOLUTION_FAILED',
        message: err?.message || 'Database transaction for conflict resolution failed.',
      },
      { status }
    );
  }
}
