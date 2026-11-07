import { NextRequest, NextResponse } from 'next/server';
import { getEnterpriseTraceabilityDossier } from '@/lib/server/businessIntelligence';
import { getSession } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { lotId: string } }
) {
  const lotId = params?.lotId || '';
  if (!lotId || lotId.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'INVALID_LOT_ID', message: 'Lot or Batch identifier is required' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const requestedAudience = (searchParams.get('audience') || 'COMMERCIAL_BUYER').toUpperCase();

  // Inspect session (optional for public/commercial, required for internal regulatory unmasking)
  const actor = await getSession(req);

  // Only SUPERVISOR_ADMIN can access unmasked INSTITUTIONAL_REGULATOR view
  let audience: 'PUBLIC_VERIFICATION' | 'COMMERCIAL_BUYER' | 'INSTITUTIONAL_REGULATOR' = 'COMMERCIAL_BUYER';
  if (requestedAudience === 'PUBLIC_VERIFICATION') {
    audience = 'PUBLIC_VERIFICATION';
  } else if (requestedAudience === 'INSTITUTIONAL_REGULATOR' && actor?.role === 'SUPERVISOR_ADMIN') {
    audience = 'INSTITUTIONAL_REGULATOR';
  } else {
    audience = 'COMMERCIAL_BUYER';
  }

  const dossier = await getEnterpriseTraceabilityDossier(lotId, actor, audience);

  if (!dossier) {
    return NextResponse.json(
      { success: false, error: 'LOT_NOT_FOUND', message: `No traceability record found for lot ${lotId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    dossier,
  });
}
