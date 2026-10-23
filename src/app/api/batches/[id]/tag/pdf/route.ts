import { NextRequest } from 'next/server';
import { GET as tagPdfHandler } from '@/app/api/tags/[code]/pdf/route';

export const dynamic = 'force-dynamic';

/**
 * GET /api/batches/[id]/tag/pdf
 * Re-exports tag PDF generation under the RESTful /api/batches hierarchy.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return tagPdfHandler(req, { params: { code: params.id } });
}
