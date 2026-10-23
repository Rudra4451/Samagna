import { NextRequest, NextResponse } from 'next/server';
import {
  getSession,
  isCenterAuthorizedExact,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { generateAuditPdfBuffer, AuditPdfData, AuditPdfEventItem, AuditPdfDiscrepancyItem } from '@/lib/server/pdf/auditPdf';

export const dynamic = 'force-dynamic';

const AUTHORIZED_AUDIT_ROLES = [
  'SUPERVISOR_ADMIN',
  'WAREHOUSE_MANAGER',
  'COLLECTION_MANAGER',
  'SHG_FACILITATOR',
] as const;

/**
 * Extracts safe operational summary from arbitrary audit JSON details.
 * Strictly prevents leaking sensitive gatherer PII, bank accounts, or credentials.
 */
function extractSafeAuditSummary(detailsStr: string | null): string | null {
  if (!detailsStr) return null;
  try {
    const parsed = JSON.parse(detailsStr);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const parts: string[] = [];
    if (parsed.netAcceptedKg !== undefined) parts.push(`Net: ${Number(parsed.netAcceptedKg).toFixed(1)} kg`);
    if (parsed.arrivalNetWeightKg !== undefined) parts.push(`Arrival: ${Number(parsed.arrivalNetWeightKg).toFixed(1)} kg`);
    if (parsed.unexplainedVarianceKg !== undefined) parts.push(`Variance: ${Number(parsed.unexplainedVarianceKg).toFixed(2)} kg`);
    if (parsed.sealTagId) parts.push(`Seal: ${String(parsed.sealTagId)}`);
    if (parsed.transitWaybillId) parts.push(`Waybill: ${String(parsed.transitWaybillId)}`);
    if (parsed.vehicleNumber) parts.push(`Vehicle: ${String(parsed.vehicleNumber)}`);
    if (parsed.reason) parts.push(`Reason: ${String(parsed.reason).substring(0, 40)}`);
    if (parsed.depotId) parts.push(`Depot: ${String(parsed.depotId)}`);

    return parts.length > 0 ? parts.join(' · ') : null;
  } catch {
    return null;
  }
}

/**
 * Primary Server-Side Audit Trail & Discrepancy Dossier PDF Handler (Phase F12-C)
 * 
 * Generates an authoritative, print-ready ISO 216 A4 multi-page document
 * consolidating chain-of-custody weighments, transit waybills, tolerance calculations,
 * and chronological audit events.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  // Step 1: Authentication
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'A valid authenticated session is required to download audit dossiers.',
      },
      { status: 401 }
    );
  }

  // Step 2: Role Authorization
  if (session.role === 'COLLECTOR') {
    return NextResponse.json(
      {
        success: false,
        error: 'ROLE_NOT_AUTHORIZED_FOR_AUDIT_DOSSIER',
        message: 'Collectors are not authorized to download internal custody audit dossiers. Use official receipt or public verification route.',
      },
      { status: 403 }
    );
  }

  if (!AUTHORIZED_AUDIT_ROLES.includes(session.role as any)) {
    return NextResponse.json(
      {
        success: false,
        error: 'ROLE_NOT_AUTHORIZED',
        message: `Role '${session.role}' is not authorized to generate administrative audit dossiers.`,
      },
      { status: 403 }
    );
  }

  // Step 3: Rate Limiting
  const rateLimit = checkRateLimit(`user:${session.userId}`, 'audit-pdf-download', {
    windowMs: 60_000,
    maxRequests: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: `Audit dossier rate limit exceeded. Retry in ${rateLimit.resetInSeconds} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  // Step 4: Validate Entity Identifier
  const rawEntityId = params?.entityId ? decodeURIComponent(params.entityId).trim() : '';
  if (!rawEntityId || rawEntityId.length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_ENTITY_IDENTIFIER',
        message: 'A valid entity identifier (e.g. batch code or discrepancy ID) is required.',
      },
      { status: 400 }
    );
  }

  const cleanId = rawEntityId.replace(/^#/, '');

  // Step 5: Fail-closed standby when database unconfigured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_UNCONFIGURED',
        serverAvailable: false,
        message: 'Server PostgreSQL database is unconfigured. Real audit trail records cannot be generated without an active database connection.',
      },
      { status: 503 }
    );
  }

  try {
    const prisma = getPrismaClient();

    // Query target batch by exact id or common code variations
    let batch = await prisma.batch.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { id: rawEntityId },
          { id: `#${cleanId}` },
          { id: `BS-${cleanId}` },
        ],
      },
      include: {
        step1: true,
        step2: true,
        discrepancyCases: true,
        destinationDepot: true,
      },
    });

    // If not found as batch, check if entityId is a DiscrepancyCase ID (e.g. DISC-402)
    if (!batch && cleanId.toUpperCase().startsWith('DISC-')) {
      const disc = await prisma.discrepancyCase.findFirst({
        where: { id: cleanId },
        include: {
          batch: {
            include: {
              step1: true,
              step2: true,
              discrepancyCases: true,
              destinationDepot: true,
            },
          },
        },
      });
      if (disc && disc.batch) {
        batch = disc.batch;
      }
    }

    if (!batch) {
      return NextResponse.json(
        {
          success: false,
          error: 'ENTITY_NOT_FOUND',
          message: `Entity '${rawEntityId}' was not found in the official BanaSetu registry.`,
        },
        { status: 404 }
      );
    }

    // Step 6: District Scoping
    if (!session.district || session.district.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'DISTRICT_ASSIGNMENT_REQUIRED',
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
          message: `Access denied. Entity belongs to district '${batch.district}', but session is scoped to '${session.district}'.`,
        },
        { status: 403 }
      );
    }

    // Step 7: Scoped Role Assignment Checks
    if (session.role === 'SHG_FACILITATOR') {
      if (!isCenterAuthorizedExact(session.centerId, batch.centerName)) {
        return NextResponse.json(
          {
            success: false,
            error: 'FACILITATOR_ASSIGNMENT_MISMATCH',
            message: `Access denied. Facilitator center '${session.centerId || 'UNASSIGNED'}' does not match batch intake center '${batch.centerName}'.`,
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
            message: `Access denied. Collection manager center '${session.centerId || 'UNASSIGNED'}' does not match batch intake center '${batch.centerName}'.`,
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
            message: `Access denied. Warehouse manager depot '${session.centerId || 'UNASSIGNED'}' does not match batch destination depot '${batch.destinationDepotId || 'UNASSIGNED'}'.`,
          },
          { status: 403 }
        );
      }
    }
    // SUPERVISOR_ADMIN has district-wide clearance verified in Step 6.

    // Step 8: Query Chronological Audit Events for this Entity
    const auditRows = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { batchId: batch.id },
          { batchId: `#${batch.id.replace(/^#/, '')}` },
        ],
      },
      orderBy: { timestamp: 'asc' },
      take: 200,
    });

    const events: AuditPdfEventItem[] = auditRows.map((e) => ({
      id: e.id,
      timestamp: new Date(e.timestamp).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actionType: e.actionType,
      title: e.title,
      actorName: e.actorName,
      actorRole: e.actorRole,
      description: e.description,
      isSimulated: Boolean(e.isSimulated),
      eventHash: e.eventHash || null,
      previousHash: e.previousHash || null,
      safeDetailsSummary: extractSafeAuditSummary(e.details),
    }));

    // Step 9: Assemble Discrepancies
    const discrepancies: AuditPdfDiscrepancyItem[] = (batch.discrepancyCases || []).map((d) => ({
      id: d.id,
      status: d.status,
      dispatchedNetKg: d.dispatchedNetKg,
      arrivalNetKg: d.arrivalNetKg,
      shrinkageAllowedKg: d.shrinkageAllowedKg,
      unexplainedVarianceKg: d.unexplainedVarianceKg,
      currentActionTaken: d.currentActionTaken,
      assignedSupervisor: d.assignedSupervisor,
      resolutionReason: d.resolutionReason || null,
      notes: d.notes || null,
      createdAt: new Date(d.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      resolvedAt: d.resolvedAt
        ? new Date(d.resolvedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : null,
    }));

    // Step 10: Assemble Complete Audit Data Contract
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://banasetu.odisha.gov.in';
    const cleanBatchCode = batch.id.replace(/^#/, '');
    const verificationUrl = `${appBaseUrl}/verify/${cleanBatchCode}`;

    const auditPdfData: AuditPdfData = {
      entityId: batch.id,
      entityType: 'batch',
      produceName: batch.produceName,
      produceOdia: batch.produceOdia,
      scientificName: batch.scientificName || null,
      status: batch.status,
      district: batch.district,
      block: batch.block,
      gramPanchayat: batch.gramPanchayat,
      centerName: batch.centerName,
      shgName: batch.shgName,
      destinationDepot: batch.destinationDepot?.name || batch.destinationDepotId || 'Baripada Central Depôt (BRP-01)',
      step1: batch.step1
        ? {
            grossWeightKg: batch.step1.grossWeightKg,
            tareWeightKg: batch.step1.tareWeightKg,
            netAcceptedKg: batch.step1.netAcceptedKg,
            grade: batch.step1.grade,
            sackCount: batch.step1.sackCount,
            sealTagId: batch.step1.sealTagId,
            transitWaybillId: batch.step1.transitWaybillId,
            vehicleNumber: batch.step1.vehicleNumber,
            driverName: batch.step1.driverName,
            tarpaulinConfirmed: Boolean(batch.step1.tarpaulinConfirmed),
            observedMoisturePercent: batch.step1.observedMoisturePercent,
            verifiedBy: batch.step1.verifiedBy,
            verifiedByRole: batch.step1.verifiedByRole,
            verifiedAt: new Date(batch.step1.verifiedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : null,
      step2: batch.step2
        ? {
            arrivalGrossWeightKg: batch.step2.arrivalGrossWeightKg,
            arrivalTareWeightKg: batch.step2.arrivalTareWeightKg,
            arrivalNetWeightKg: batch.step2.arrivalNetWeightKg,
            storageZone: batch.step2.storageZone,
            receivingDepot: batch.step2.receivingDepotId || batch.destinationDepotId || 'Baripada Central Depôt (BRP-01)',
            shrinkagePercentAllowed: batch.step2.shrinkagePercentAllowed,
            shrinkageKgAllowed: batch.step2.shrinkageKgAllowed,
            unexplainedVarianceKg: batch.step2.unexplainedVarianceKg,
            discrepancyTriggered: Boolean(batch.step2.discrepancyTriggered),
            verifiedBy: batch.step2.verifiedBy,
            verifiedByRole: batch.step2.verifiedByRole,
            verifiedAt: new Date(batch.step2.verifiedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : null,
      discrepancies,
      events,
      generatedAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      generatedBy: {
        userId: session.userId,
        name: session.fullName || session.username,
        role: session.role,
        district: session.district,
      },
      verificationUrl,
    };

    // Step 11: Generate A4 PDF Buffer
    const pdfBuffer = await generateAuditPdfBuffer(auditPdfData);

    // Step 12: Return PDF Response with Safe Headers
    const sanitizedFilename = `BanaSetu-AuditDossier-${cleanBatchCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

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
    console.error('Audit PDF generation encountered unexpected server error:', err?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'An unexpected internal error occurred while generating the audit dossier PDF.',
      },
      { status: 500 }
    );
  }
}
