import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import { getInstitutionalContract } from '@/lib/server/institutional';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Institutional contracts are restricted to operational managers and supervisors
  const auth = await requireServerRole(req, [
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const contractId = searchParams.get('contractId') || 'CTR-TDCCOL-2025-01';

  const result = await getInstitutionalContract(auth.actor, contractId);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, message: 'Institutional service contract could not be retrieved.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    contract: result.contract,
  });
}

