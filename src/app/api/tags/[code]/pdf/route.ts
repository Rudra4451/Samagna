import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import {
  getSession,
  isCenterAuthorizedExact,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { generateTagPdfBuffer, TagPdfData, TagType } from '@/lib/server/pdf/tagPdf';
import { ODISHA_MFP_CATALOGUE } from '@/lib/products';

export const dynamic = 'force-dynamic';

/**
 * Permitted operational roles with clearance for batch/product tag PDF generation.
 */
const AUTHORIZED_TAG_ROLES = new Set([
  'COLLECTOR',
  'SHG_FACILITATOR',
  'COLLECTION_MANAGER',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR_ADMIN',
]);

/**
 * GET /api/tags/[code]/pdf?type=collection|product
 * Generates an authoritative server-side A6 tag PDF from verified database records.
 *
 * Query Parameters:
 * - type: "collection" (default, physical bag sack tag) | "product" (produce lot specification tag)
 *
 * Security & Access Control:
 * - Session authentication enforced FIRST.
 * - Rate-limited to 60 req/min, keyed strictly to authenticated session.userId.
 * - Least-privilege role clearance.
 * - Scoped authorization:
 *   - COLLECTOR: Must have verified contribution in the batch.
 *   - SHG_FACILITATOR: Must be assigned to intake center.
 *   - COLLECTION_MANAGER: Must be assigned to intake center.
 *   - WAREHOUSE_MANAGER: Must be assigned to destination depot.
 *   - SUPERVISOR_ADMIN: District-wide audit access.
 * - District containment: strictly isolates cross-district attempts.
 * - Fails safely closed when PostgreSQL is unconfigured (HTTP 503).
 * - Zero private collector identity exposed (no full names, Aadhaar, bank, or DBT references).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  // Step 1: Authentication Enforcement
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Valid authentication session required to access official tag PDFs.',
      },
      { status: 401 }
    );
  }

  // Step 2: Rate Limiting Bound to Authenticated User ID (Resistant to X-Forwarded-For spoofing)
  const rateLimitKey = `user:${session.userId}`;
  const rateLimit = checkRateLimit(rateLimitKey, 'tag-pdf-download', {
    windowMs: 60_000,
    maxRequests: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Please retry in ${rateLimit.resetInSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  // Step 3: Role Authorization Enforcement
  if (!AUTHORIZED_TAG_ROLES.has(session.role)) {
    return NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: `Role '${session.role}' is not authorized to generate tag PDFs.`,
      },
      { status: 403 }
    );
  }

  // Step 4: Validate and Sanitize Requested Code
  const rawCode = params?.code ? decodeURIComponent(params.code).trim() : '';
  if (!rawCode || rawCode.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_BATCH_IDENTIFIER',
        message: 'A valid batch identifier or tag code is required.',
      },
      { status: 400 }
    );
  }

  const cleanCode = rawCode.replace(/^#/, '');

  // Step 5: Determine Tag Type
  const url = new URL(req.url);
  const rawType = (url.searchParams.get('type') || 'collection').trim().toLowerCase();
  const tagType: TagType = rawType === 'product' ? 'product' : 'collection';

  // Step 6: Fail-Closed when PostgreSQL Database is Unconfigured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_UNCONFIGURED',
        serverAvailable: false,
        message:
          'Official database registry is unconfigured. Tag PDF generation requires an authoritative database connection.',
      },
      { status: 503 }
    );
  }

  // Step 7: Query Authoritative Database Records
  try {
    const prisma = getPrismaClient();

    const batch = await prisma.batch.findFirst({
      where: {
        OR: [
          { id: cleanCode },
          { id: rawCode },
          { id: `#${cleanCode}` },
          { id: `BS-${cleanCode}` },
        ],
      },
      include: {
        step1: true,
        step2: true,
        collectors: true,
      },
    });

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: 'BATCH_NOT_FOUND',
          message: `Official batch record for '${rawCode}' was not found in the registry.`,
        },
        { status: 404 }
      );
    }

    // Step 8: District Boundary Isolation Check
    if (!session.district) {
      return NextResponse.json(
        {
          success: false,
          error: 'DISTRICT_REQUIRED',
          message: 'Session lacks required district boundary assignment.',
        },
        { status: 403 }
      );
    }

    if (session.district.trim().toLowerCase() !== batch.district.trim().toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'CROSS_DISTRICT_ACCESS_FORBIDDEN',
          message: `Access denied. Batch belongs to district '${batch.district}', but session is scoped to '${session.district}'.`,
        },
        { status: 403 }
      );
    }

    // Step 9: Scoped Role Assignment Checks
    if (session.role === 'COLLECTOR') {
      const isOwner = batch.collectors.some((c) => c.id === session.userId);
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN_TAG_OWNERSHIP',
            message:
              'Access denied. Collector session does not own any verified contribution records in this batch.',
          },
          { status: 403 }
        );
      }
    } else if (session.role === 'SHG_FACILITATOR') {
      if (!isCenterAuthorizedExact(session.centerId, batch.centerName)) {
        return NextResponse.json(
          {
            success: false,
            error: 'FACILITATOR_ASSIGNMENT_MISMATCH',
            message: `Access denied. Facilitator center '${
              session.centerId || 'UNASSIGNED'
            }' does not match batch intake center '${batch.centerName}'.`,
          },
          { status: 403 }
        );
      }
    } else if (session.role === 'COLLECTION_MANAGER') {
      if (!isCenterAuthorizedExact(session.centerId, batch.centerName)) {
        return NextResponse.json(
          {
            success: false,
            error: 'COLLECTION_MANAGER_ASSIGNMENT_MISMATCH',
            message: `Access denied. Collection manager center '${
              session.centerId || 'UNASSIGNED'
            }' does not match batch intake center '${batch.centerName}'.`,
          },
          { status: 403 }
        );
      }
    } else if (session.role === 'WAREHOUSE_MANAGER') {
      const isDepot = isAuthorizedDepotCenter(session.centerId);
      const actorDepot = resolveCanonicalDepotId(session.centerId);
      const batchDepot =
        resolveCanonicalDepotId(batch.destinationDepotId) ||
        resolveCanonicalDepotId(batch.step1?.initialDestinationDepotId) ||
        resolveCanonicalDepotId(batch.step2?.receivingDepotId);

      if (!isDepot || !actorDepot || actorDepot !== batchDepot) {
        return NextResponse.json(
          {
            success: false,
            error: 'WAREHOUSE_DEPOT_MISMATCH',
            message: `Access denied. Warehouse manager depot '${
              session.centerId || 'UNASSIGNED'
            }' does not match batch destination depot '${
              batch.destinationDepotId || 'UNASSIGNED'
            }'.`,
          },
          { status: 403 }
        );
      }
    }
    // SUPERVISOR_ADMIN has district-wide clearance verified in Step 8.

    // Step 10: Assemble Tag Data (Zero Private Identity Information)
    const netWeightKg =
      batch.step1?.netAcceptedKg ?? batch.step2?.arrivalNetWeightKg ?? null;
    const grossWeightKg = batch.step1?.grossWeightKg ?? null;
    const tareWeightKg = batch.step1?.tareWeightKg ?? null;
    const sackCount = batch.step1?.sackCount ?? (batch.step2 ? 1 : null);
    const sealTagId = batch.step1?.sealTagId || null;
    const transitWaybillId = batch.step1?.transitWaybillId || null;
    const qualityGrade = batch.step1?.grade || null;

    const dateStr = batch.step1?.verifiedAt
      ? new Date(batch.step1.verifiedAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : new Date(batch.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://banasetu.odisha.gov.in';
    const verificationUrl = `${appBaseUrl}/verify/${cleanCode}`;

    // Lookup species handling guidance from authoritative catalogue
    const normProduce = batch.produceName.trim().toLowerCase();
    const prodProfile = ODISHA_MFP_CATALOGUE.find(
      (p) =>
        p.nameEnglish.toLowerCase() === normProduce ||
        p.slug.toLowerCase() === normProduce ||
        normProduce.includes(p.slug.toLowerCase()) ||
        p.nameEnglish.toLowerCase().includes(normProduce)
    );

    const tagData: TagPdfData = {
      code: batch.id,
      produceName: batch.produceName,
      produceOdia: batch.produceOdia,
      scientificName: batch.scientificName || prodProfile?.scientificName || null,
      category: prodProfile?.botanicalFamily || null,
      district: batch.district,
      block: batch.block,
      gramPanchayat: batch.gramPanchayat,
      centerName: batch.centerName,
      destinationDepot: batch.destinationDepotId || 'Baripada Central Depôt (BRP-01)',
      status: batch.status,
      netWeightKg,
      grossWeightKg,
      tareWeightKg,
      sackCount,
      sealTagId,
      transitWaybillId,
      qualityGrade,
      dateStr,
      verificationUrl,
      // Verified product guidance (when configured)
      standardPackaging: prodProfile?.standardPackaging,
      maxMoisturePercent: prodProfile?.baselineMoistureMaxPercent,
      shrinkageTolerancePercent: prodProfile?.allowableShrinkagePercent,
      harvestSeason: prodProfile?.primaryHarvestSeason,
      storageGuidelines: prodProfile?.description,
    };

    // Step 11: Render Tag PDF Buffer
    const pdfBuffer = await generateTagPdfBuffer(tagData, tagType);

    // Step 12: Return PDF Response with Safe Headers
    const prefix = tagType === 'product' ? 'BanaSetu-ProductTag' : 'BanaSetu-BatchTag';
    const sanitizedFilename = `${prefix}-${cleanCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Tag PDF generation encountered unexpected server error:', err?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'An unexpected internal error occurred while generating the tag PDF.',
      },
      { status: 500 }
    );
  }
}
