import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { getB2bBiReport } from '@/lib/server/businessIntelligence';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // B2B reporting accessible by administrators and verified commercial trade participants
  const auth = await requireServerRole(req, [
    'SUPERVISOR_ADMIN',
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const report = await getB2bBiReport(auth.actor);

  return NextResponse.json({
    success: true,
    actorRole: auth.actor.role,
    report,
  });
}

