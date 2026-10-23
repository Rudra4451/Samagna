import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { ODISHA_MFP_CATALOGUE } from '@/lib/products';

export const dynamic = 'force-dynamic';

import { escapeCsvField } from '@/lib/server/exportSanitizer';


export async function GET(req: NextRequest) {
  // Enforce SUPERVISOR_ADMIN clearance.
  // Rejects unauthenticated requests with 401 UNAUTHENTICATED.
  // Rejects demo sessions with 403 DEMO_SESSION_MUTATION_BLOCKED.
  // Rejects non-supervisor roles with 403 FORBIDDEN.
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase(); // 'json' or 'csv'
  const entity = (searchParams.get('entity') || 'rates').toLowerCase(); // 'rates', 'batches', 'audit'

  if (format !== 'json' && format !== 'csv') {
    return NextResponse.json(
      {
        success: false,
        error: 'INVALID_FORMAT',
        message: "Format must be either 'json' or 'csv'.",
      },
      { status: 400 }
    );
  }

  // --- ENTITY 1: 17 Minor Forest Produce Rates & Standards Catalogue ---
  if (entity === 'rates') {
    let catalogue = ODISHA_MFP_CATALOGUE;

    // If PostgreSQL database is configured, load current produce configurations
    if (isDatabaseConfigured()) {
      try {
        const prisma = getPrismaClient();
        const dbConfigs = await prisma.produceRateConfiguration.findMany({
          orderBy: { produceName: 'asc' },
        });
        if (dbConfigs && dbConfigs.length > 0) {
          catalogue = dbConfigs.map((cfg) => {
            const staticMatch = ODISHA_MFP_CATALOGUE.find(
              (p) => p.nameEnglish.toLowerCase() === cfg.produceName.toLowerCase()
            );
            return {
              id: cfg.id,
              slug: staticMatch?.slug || cfg.produceName.toLowerCase().replace(/\s+/g, '-'),
              nameEnglish: cfg.produceName,
              nameOdia: cfg.produceOdia,
              scientificName: cfg.scientificName || staticMatch?.scientificName || '',
              primaryHarvestSeason: staticMatch?.primaryHarvestSeason || 'Seasonal',
              currentBenchmarkRatePerKg: cfg.ratePerKg,
              allowableShrinkagePercent: cfg.allowableShrinkagePercent,
              baselineMoistureMaxPercent: staticMatch?.baselineMoistureMaxPercent || 12.0,
              standardPackaging: staticMatch?.standardPackaging || 'Standard Jute Bag',
              rateSource: cfg.sourceAuthority,
              description: staticMatch?.description || '',
              botanicalFamily: staticMatch?.botanicalFamily || '',
              typicalTareKgPerBag: staticMatch?.typicalTareKgPerBag || 1.5,
              iconKey: staticMatch?.iconKey || 'leaf',
              isOfficialMsp: cfg.isOfficialVerified,
              unit: staticMatch?.unit || 'kg',
            };
          });
        }
      } catch (err: any) {
        console.warn('Failed to query produce rates from PostgreSQL:', err?.message);
      }
    }

    if (format === 'csv') {
      const headers = [
        'ID',
        'Slug',
        'English Name',
        'Odia Name',
        'Scientific Name',
        'Harvest Season',
        'Benchmark Rate (INR/kg)',
        'Shrinkage Tolerance (%)',
        'Baseline Moisture Max (%)',
        'Packaging Standard',
        'Rate Source Authority',
      ];

      const rows = catalogue.map((p) => [
        escapeCsvField(p.id),
        escapeCsvField(p.slug),
        escapeCsvField(p.nameEnglish),
        escapeCsvField(p.nameOdia),
        escapeCsvField(p.scientificName),
        escapeCsvField(p.primaryHarvestSeason),
        escapeCsvField(p.currentBenchmarkRatePerKg),
        escapeCsvField(p.allowableShrinkagePercent),
        escapeCsvField(p.baselineMoistureMaxPercent),
        escapeCsvField(p.standardPackaging),
        escapeCsvField(p.rateSource),
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="banasetu_mfp_rates_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: catalogue.length,
      data: catalogue,
      exportedAt: new Date().toISOString(),
      exporter: actor.fullName,
      district: actor.district,
    });
  }

  // --- ENTITY 2: Batch Ledger Records ---
  if (entity === 'batches') {
    // Zero mock/fabricated records: Fail closed if database is unconfigured
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_UNCONFIGURED',
          message:
            'Server PostgreSQL database is unconfigured. Real batch ledger records cannot be exported without an active database connection.',
        },
        { status: 503 }
      );
    }

    try {
      const prisma = getPrismaClient();

      // Enforce District Isolation: Supervisor can only export batches within their assigned district
      const whereClause: any = {};
      if (actor.district && actor.district.trim()) {
        whereClause.district = actor.district.trim();
      }

      const batches = await prisma.batch.findMany({
        where: whereClause,
        include: {
          step1: true,
          step2: true,
          discrepancyCases: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (format === 'csv') {
        const headers = [
          'Batch Code',
          'Produce Name',
          'Scientific Name',
          'District',
          'Block',
          'Gram Panchayat',
          'Center Name',
          'Status',
          'Gross Weight (kg)',
          'Tare Weight (kg)',
          'Dispatched Net (kg)',
          'Arrival Net (kg)',
          'Shrinkage Allowed (kg)',
          'Unexplained Variance (kg)',
          'Vehicle Number',
          'Transit Waybill',
          'Destination Depot',
          'Discrepancy Status',
          'Created At',
        ];

        const rows = batches.map((b) => {
          const step1 = b.step1;
          const step2 = b.step2;
          const disc = b.discrepancyCases?.[0];

          return [
            escapeCsvField(b.id),
            escapeCsvField(b.produceName),
            escapeCsvField(b.scientificName || ''),
            escapeCsvField(b.district),
            escapeCsvField(b.block),
            escapeCsvField(b.gramPanchayat),
            escapeCsvField(b.centerName),
            escapeCsvField(b.status),
            escapeCsvField(step1?.grossWeightKg ?? ''),
            escapeCsvField(step1?.tareWeightKg ?? ''),
            escapeCsvField(step1?.netAcceptedKg ?? ''),
            escapeCsvField(step2?.arrivalNetWeightKg ?? ''),
            escapeCsvField(step2?.shrinkageKgAllowed ?? ''),
            escapeCsvField(step2?.unexplainedVarianceKg ?? ''),
            escapeCsvField(step1?.vehicleNumber ?? ''),
            escapeCsvField(step1?.transitWaybillId ?? ''),
            escapeCsvField(b.destinationDepotId ?? ''),
            escapeCsvField(disc?.status ?? 'NONE'),
            escapeCsvField(b.createdAt.toISOString()),
          ];
        });

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="banasetu_batches_${actor.district || 'all'}_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        count: batches.length,
        district: actor.district,
        data: batches,
        exportedAt: new Date().toISOString(),
        exporter: actor.fullName,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_QUERY_FAILED',
          message: err?.message || 'Failed to query batch records from database',
        },
        { status: 500 }
      );
    }
  }

  // --- ENTITY 3: Cryptographic Audit Trail Events ---
  if (entity === 'audit') {
    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_UNCONFIGURED',
          message:
            'Server PostgreSQL database is unconfigured. Real audit trail records cannot be exported without an active database connection.',
        },
        { status: 503 }
      );
    }

    try {
      const prisma = getPrismaClient();
      const events = await prisma.auditEvent.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      if (format === 'csv') {
        const headers = [
          'Event ID',
          'Timestamp',
          'Action Type',
          'Title',
          'Actor Name',
          'Actor Role',
          'Batch Code',
          'Description',
          'Is Simulated',
        ];

        const rows = events.map((e) => [
          escapeCsvField(e.id),
          escapeCsvField(e.timestamp.toISOString()),
          escapeCsvField(e.actionType),
          escapeCsvField(e.title),
          escapeCsvField(e.actorName),
          escapeCsvField(e.actorRole),
          escapeCsvField(e.batchId || ''),
          escapeCsvField(e.description),
          escapeCsvField(e.isSimulated),
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="banasetu_audit_trail_${Date.now()}.csv"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        count: events.length,
        data: events,
        exportedAt: new Date().toISOString(),
        exporter: actor.fullName,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_QUERY_FAILED',
          message: err?.message || 'Failed to query audit records from database',
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'INVALID_ENTITY',
      message: "Export entity must be one of: 'rates', 'batches', or 'audit'.",
    },
    { status: 400 }
  );
}
