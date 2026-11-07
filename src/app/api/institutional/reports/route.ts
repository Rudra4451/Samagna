import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { generateOperationalReport } from '@/lib/server/institutional';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Operational reporting is accessible by collection managers, warehouse managers, and supervisors
  const auth = await requireServerRole(req, [
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const result = await generateOperationalReport(auth.actor);
  if (!result.success || !result.report) {
    return NextResponse.json(
      { success: false, error: result.error, message: 'Failed to generate operational report.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    actorRole: auth.actor.role,
    actorFacility: auth.actor.centerId || auth.actor.district,
    report: result.report,
  });
}

