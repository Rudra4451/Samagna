import { NextRequest, NextResponse } from 'next/server';
import { getEnterpriseTraceabilityDossier } from '@/lib/server/businessIntelligence';
import {
  generateTraceabilityPassportJson,
  generateTraceabilityPassportCsv,
} from '@/lib/businessIntelligence';
import { getSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { lotId: string } }
) {
  const lotId = params?.lotId || '';
  if (!lotId || lotId.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'INVALID_LOT_ID', message: 'Lot identifier is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'json').toLowerCase();
  const requestedAudience = (searchParams.get('audience') || 'COMMERCIAL_BUYER').toUpperCase();

  const actor = await getSession(req);

  // Commercial exports must NEVER expose unmasked collector PII
  // Only internal regulator role can view unmasked data
  let audience: 'PUBLIC_VERIFICATION' | 'COMMERCIAL_BUYER' | 'INSTITUTIONAL_REGULATOR' = 'COMMERCIAL_BUYER';
  if (requestedAudience === 'INSTITUTIONAL_REGULATOR' && actor?.role === 'SUPERVISOR_ADMIN') {
    audience = 'INSTITUTIONAL_REGULATOR';
  } else if (requestedAudience === 'PUBLIC_VERIFICATION') {
    audience = 'PUBLIC_VERIFICATION';
  }

  const dossier = await getEnterpriseTraceabilityDossier(lotId, actor, audience);

  if (!dossier) {
    return NextResponse.json(
      { success: false, error: 'LOT_NOT_FOUND', message: `Traceability record for lot ${lotId} not found` },
      { status: 404 }
    );
  }

  const cleanLot = lotId.replace(/^#/, '');

  if (format === 'csv') {
    const csvContent = generateTraceabilityPassportCsv(dossier);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="samagna_traceability_${cleanLot}_${Date.now()}.csv"`,
      },
    });
  }

  // Default: JSON export
  const jsonContent = generateTraceabilityPassportJson(dossier);
  return new NextResponse(jsonContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="samagna_traceability_${cleanLot}_${Date.now()}.json"`,
    },
  });
}
