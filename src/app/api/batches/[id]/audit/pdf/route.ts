import { NextRequest } from 'next/server';
import { GET as auditPdfHandler } from '@/app/api/audit/[entityId]/pdf/route';

export const dynamic = 'force-dynamic';

/**
 * RESTful Alias Route for Batch Audit Trail PDF (Phase F12-C)
 * GET /api/batches/[id]/audit/pdf -> delegates to /api/audit/[entityId]/pdf
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return auditPdfHandler(req, { params: { entityId: params.id } });
}
