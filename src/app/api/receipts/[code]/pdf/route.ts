import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { getSession, isCenterAuthorizedExact } from '@/lib/server/auth';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { generateReceiptPdfBuffer, ReceiptPdfData } from '@/lib/server/pdf/receiptPdf';

export const dynamic = 'force-dynamic';

/**
 * Permitted operational roles with clearance for collection receipt downloads.
 * Note: Under least privilege, WAREHOUSE_MANAGER is denied primary collection receipts.
 */
const AUTHORIZED_ROLES = new Set([
  'COLLECTOR',
  'SHG_FACILITATOR',
  'COLLECTION_MANAGER',
  'SUPERVISOR_ADMIN',
]);

/**
 * GET /api/receipts/[code]/pdf
 * Generates an authoritative server-side A5 receipt PDF from verified database records.
 * 
 * Security & Access Control:
 * - Session authentication enforced FIRST.
 * - Rate-limited to 60 req/min, keyed strictly to authenticated session.userId (resistant to X-Forwarded-For spoofing).
 * - Least-privilege role clearance (WAREHOUSE_MANAGER denied; only roles with collection receipt relevance permitted).
 * - Collector ownership verification: COLLECTOR role must have an immutable ID match in batch.collectors.
 * - Center assignment verification: Facilitators and Managers must be assigned to the batch intake center.
 * - District boundary isolation: All roles strictly contained to their assigned district.
 * - Zero fabricated personal data: Batches without collectors cleanly render N/A for individual fields.
 * - Multi-gatherer accuracy: Batches with multiple collectors are labeled as aggregates and do not attribute the full batch to one person.
 * - Fails safely closed when PostgreSQL is unconfigured (HTTP 503 DATABASE_UNCONFIGURED).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
): Promise<NextResponse> {
  // Step 1: Authentication Enforcement (Authentication FIRST)
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'UNAUTHENTICATED',
        message: 'Valid authentication session required to access official receipt PDFs.',
      },
      { status: 401 }
    );
  }

  // Step 2: Rate Limiting Bound to Authenticated User ID (Cannot be bypassed by rotating forwarding headers)
  const rateLimitKey = `user:${session.userId}`;
  const rateLimit = checkRateLimit(rateLimitKey, 'receipt-pdf-download', {
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

  // Step 3: Role Authorization Enforcement (Least Privilege)
  if (session.role === 'WAREHOUSE_MANAGER') {
    return NextResponse.json(
      {
        success: false,
        error: 'ROLE_NOT_AUTHORIZED_FOR_RECEIPTS',
        message:
          'Warehouse managers do not have operational clearance for primary collection receipts.',
      },
      { status: 403 }
    );
  }

  if (!AUTHORIZED_ROLES.has(session.role)) {
    return NextResponse.json(
      {
        success: false,
        error: 'FORBIDDEN',
        message: `Role '${session.role}' is not authorized to access collection receipts.`,
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
        error: 'INVALID_RECEIPT_CODE',
        message: 'A valid receipt code or batch identifier is required.',
      },
      { status: 400 }
    );
  }

  const cleanCode = rawCode.replace(/^#/, '');

  // Step 5: Fail-Closed when PostgreSQL Database is Unconfigured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: 'DATABASE_UNCONFIGURED',
        serverAvailable: false,
        message:
          'Official database registry is unconfigured. Receipt PDF generation requires an authoritative database connection.',
      },
      { status: 503 }
    );
  }

  // Step 6: Query Authoritative Database Records
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
          error: 'RECEIPT_NOT_FOUND',
          message: `Official receipt for batch '${rawCode}' was not found in the registry.`,
        },
        { status: 404 }
      );
    }

    // Step 7: District Boundary Isolation Check
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
          message: `Access denied. Receipt belongs to district '${batch.district}', but session is scoped to '${session.district}'.`,
        },
        { status: 403 }
      );
    }

    // Step 8: Strict Role Ownership & Assignment Scoping (No IDOR)
    if (session.role === 'COLLECTOR') {
      // Must prove stable ownership between session.userId and a collector record in this batch.
      // Names, villages, and district membership alone DO NOT prove ownership.
      const isOwner = batch.collectors.some((c) => c.id === session.userId);
      if (!isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: 'FORBIDDEN_RECEIPT_OWNERSHIP',
            message:
              'Access denied. Collector session does not own any verified contribution records in this batch.',
          },
          { status: 403 }
        );
      }
    } else if (session.role === 'SHG_FACILITATOR') {
      // Facilitator access: must be assigned to this batch's aggregation center
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
      // Collection manager access: must be assigned to this batch's aggregation center
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
    }
    // SUPERVISOR_ADMIN has district-wide audit authority within their verified district (checked in Step 7).

    // Step 9: Assemble Truthful Receipt Data (Zero Fabricated Personal / Bank / DBT Data)
    const ratePerKg = batch.referenceRatePerKg;
    let collectorName = 'Aggregate Consignment / Unassigned';
    let tribalId = 'N/A (Bulk Collection)';
    let village = batch.gramPanchayat;
    let accountEnding = 'N/A';
    let bankName = 'N/A';
    let paymentStatus = 'UNASSIGNED';
    let paymentRef = 'N/A';
    let isSimulated = true;
    let netWeightKg = batch.step1?.netAcceptedKg ?? batch.step2?.arrivalNetWeightKg ?? 0;
    let totalAmount = Number((netWeightKg * ratePerKg).toFixed(2));

    if (batch.collectors && batch.collectors.length > 0) {
      if (session.role === 'COLLECTOR') {
        // Safe verified per-collector values for the authenticated owner
        const userContribution = batch.collectors.find((c) => c.id === session.userId);
        if (!userContribution) {
          return NextResponse.json(
            {
              success: false,
              error: 'FORBIDDEN_RECEIPT_OWNERSHIP',
              message: 'Collector does not have a verified contribution record in this batch.',
            },
            { status: 403 }
          );
        }
        collectorName = userContribution.name;
        tribalId = userContribution.tribalId;
        village = userContribution.village;
        accountEnding = userContribution.accountEnding;
        bankName = userContribution.bankName;
        paymentStatus = userContribution.paymentStatus;
        paymentRef = userContribution.dbtRef;
        isSimulated = userContribution.isSimulated;
        netWeightKg = userContribution.weightKg;
        totalAmount = userContribution.grossPayout;
      } else if (batch.collectors.length === 1) {
        // Single verified collector in batch
        const single = batch.collectors[0];
        collectorName = single.name;
        tribalId = single.tribalId;
        village = single.village;
        accountEnding = single.accountEnding;
        bankName = single.bankName;
        paymentStatus = single.paymentStatus;
        paymentRef = single.dbtRef;
        isSimulated = single.isSimulated;
        netWeightKg = single.weightKg;
        totalAmount = single.grossPayout;
      } else {
        // Multiple collectors in batch accessed by supervisory staff:
        // Do NOT falsely assign the full batch weight to collector #1. Label clearly as consolidated batch.
        collectorName = `Consolidated Batch (${batch.collectors.length} Contributing Gatherers)`;
        tribalId = 'N/A (Multi-Gatherer Consignment)';
        village = `${batch.block}, ${batch.district}`;
        accountEnding = 'N/A';
        bankName = 'Multiple DBT Accounts';
        paymentStatus = 'MULTI_CONTRIBUTOR_SUMMARY';
        paymentRef = 'BATCH-CONSOLIDATED-PAYOUT';
        isSimulated = batch.collectors.some((c) => c.isSimulated);
        netWeightKg = batch.step1?.netAcceptedKg ?? batch.step2?.arrivalNetWeightKg ?? 0;
        totalAmount = Number((netWeightKg * ratePerKg).toFixed(2));
      }
    }

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

    const receiptData: ReceiptPdfData = {
      code: batch.id,
      produceName: batch.produceName,
      produceOdia: batch.produceOdia,
      scientificName: batch.scientificName || null,
      district: batch.district,
      block: batch.block,
      gramPanchayat: batch.gramPanchayat,
      centerName: batch.centerName,
      shgName: batch.shgName,
      facilitatorName: batch.facilitatorName,
      grade: batch.step1?.grade || 'Standard / A',
      sackCount: batch.step1?.sackCount || 1,
      sealTagId: batch.step1?.sealTagId || null,
      transitWaybillId: batch.step1?.transitWaybillId || null,
      grossWeightKg: batch.step1?.grossWeightKg ?? netWeightKg,
      tareWeightKg: batch.step1?.tareWeightKg ?? 0,
      netWeightKg,
      ratePerKg,
      rateSource: batch.rateSource,
      ratePublishedDate: batch.ratePublishedDate,
      totalAmount,
      dateStr,
      status: batch.status,
      // Truthful Collector Record
      collectorName,
      collectorNameOdia: undefined,
      tribalId,
      village,
      accountEnding,
      bankName,
      // Payment state & simulation disclosure
      paymentStatus,
      paymentRef,
      isSimulated,
      verificationUrl,
    };

    // Step 10: Render PDF Buffer
    const pdfBuffer = await generateReceiptPdfBuffer(receiptData);

    // Step 11: Return Valid PDF Response with Safe Headers
    const sanitizedFilename = `BanaSetu-Receipt-${cleanCode.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

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
    console.error('Receipt PDF generation encountered unexpected server error:', err?.message);
    return NextResponse.json(
      {
        success: false,
        error: 'PDF_GENERATION_FAILED',
        message: 'An unexpected internal error occurred while generating the receipt PDF.',
      },
      { status: 500 }
    );
  }
}
