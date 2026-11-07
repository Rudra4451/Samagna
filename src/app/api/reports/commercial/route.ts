import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { getCommercialBiReport } from '@/lib/server/businessIntelligence';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Commercial revenue reports accessible by supervisor admins and managers
  const auth = await requireServerRole(req, [
    'SUPERVISOR_ADMIN',
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const report = await getCommercialBiReport(auth.actor);

  return NextResponse.json({
    success: true,
    actorRole: auth.actor.role,
    report,
  });
}

