import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { checkRateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Public Batch Verification Endpoint (Phase 4 / Batch 3)
 * Provides unauthenticated public provenance lookup by batch ID or code for QR verification.
 * 
 * Security & Privacy:
 * - Rate-limited to prevent scraping
 * - Strict field allowlist: NEVER exposes personal gatherer names, phone numbers,
 *   Aadhaar/masked IDs, bank accounts, DBT references, facilitator phone numbers,
 *   internal investigation notes, or session data.
 * - Fail-closed: returns HTTP 503 when database is unconfigured.
 * - Returns HTTP 404 for unknown batches (no hardcoded fake specimen data).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Step 1: Rate limiting protection on public endpoint
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = checkRateLimit(ip, 'public-verify-batch', {
    windowMs: 60_000,
    maxRequests: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: `Too many verification requests. Please retry in ${rateLimit.resetInSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  // Step 2: Validate and sanitize requested identifier first
  const rawId = params?.id ? decodeURIComponent(params.id).trim() : '';
  if (!rawId || rawId.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_BATCH_IDENTIFIER',
        message: 'A valid batch identifier is required for verification.',
      },
      { status: 400 }
    );
  }

  const cleanId = rawId.replace(/^#/, '');

  // Step 3: Fail-closed when PostgreSQL database is unconfigured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_UNCONFIGURED',
        serverAvailable: false,
        message: 'Official server verification registry is temporarily unavailable. Offline ledger mode active.',
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Find batch by exact id or common code variations (e.g. BS-402, #BS-402, 402)
    const batch = await prisma.batch.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { id: rawId },
          { id: `#${cleanId}` },
          { id: `BS-${cleanId}` },
        ],
      },
      include: {
        step1: true,
        step2: true,
        discrepancyCases: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: 'BATCH_NOT_FOUND',
          message: `Batch '${rawId}' was not found in the official BanaSetu registry.`,
        },
        { status: 404 }
      );
    }

    // Step 4: Strict Privacy Allowlist Projection
    // NEVER expose tribal gatherer names, phone numbers, bank accounts, Aadhaar,
    // DBT reference strings, facilitator phone numbers, or internal investigation notes.
    const publicProvenance = {
      id: batch.id,
      code: batch.id.startsWith('#') ? batch.id : `#${batch.id}`,
      produceName: batch.produceName,
      produceOdia: batch.produceOdia,
      scientificName: batch.scientificName || null,
      district: batch.district,
      block: batch.block,
      gramPanchayat: batch.gramPanchayat,
      centerName: batch.centerName,
      shgName: batch.shgName,
      status: batch.status,
      seasonalReadinessStatus: batch.seasonalReadinessStatus,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
      step1: batch.step1
        ? {
            grossWeightKg: batch.step1.grossWeightKg,
            tareWeightKg: batch.step1.tareWeightKg,
            netAcceptedKg: batch.step1.netAcceptedKg,
            grade: batch.step1.grade,
            sackCount: batch.step1.sackCount,
            sealTagId: batch.step1.sealTagId,
            transitWaybillId: batch.step1.transitWaybillId,
            initialDestinationDepotId: batch.step1.initialDestinationDepotId || null,
            verifiedAt: batch.step1.verifiedAt.toISOString(),
          }
        : null,
      step2: batch.step2
        ? {
            arrivalGrossWeightKg: batch.step2.arrivalGrossWeightKg,
            arrivalTareWeightKg: batch.step2.arrivalTareWeightKg,
            arrivalNetWeightKg: batch.step2.arrivalNetWeightKg,
            storageZone: batch.step2.storageZone,
            receivingDepotId: batch.step2.receivingDepotId || null,
            shrinkageKgAllowed: batch.step2.shrinkageKgAllowed,
            unexplainedVarianceKg: batch.step2.unexplainedVarianceKg,
            discrepancyTriggered: batch.step2.discrepancyTriggered,
            verifiedAt: batch.step2.verifiedAt.toISOString(),
          }
        : null,
      isQuarantined: batch.status === 'QUARANTINED_DISCREPANCY',
      isVerifiedSaleable: batch.status === 'VERIFIED_SALEABLE',
      verifiedAt: batch.step2?.verifiedAt?.toISOString() || batch.step1?.verifiedAt?.toISOString() || batch.createdAt.toISOString(),
      discrepancyCount: batch.discrepancyCases?.length || 0,
    };

    return NextResponse.json({
      success: true,
      serverAvailable: true,
      batch: publicProvenance,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_ERROR',
        serverAvailable: false,
        message: err?.message || 'Failed to query batch verification data from registry',
      },
      { status: 500 }
    );
  }
}
