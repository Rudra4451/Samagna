import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { getInstitutionalBiReport } from '@/lib/server/businessIntelligence';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Institutional reports accessible by operational managers, supervisors, and institutional org admins
  const auth = await requireServerRole(req, [
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district') || undefined;

  const report = await getInstitutionalBiReport(auth.actor, district);

  return NextResponse.json({
    success: true,
    actorRole: auth.actor.role,
    report,
  });
}

