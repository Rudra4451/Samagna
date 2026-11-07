import { NextRequest, NextResponse } from 'next/server';
import { getStructuredTradeCatalogue, getTradeCatalogueItem } from '@/lib/server/b2bTrade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const item = getTradeCatalogueItem(slug);
      if (!item) {
        return NextResponse.json({ success: false, error: 'COMMODITY_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, item });
    }

    const catalogue = getStructuredTradeCatalogue();
    return NextResponse.json({
      success: true,
      count: catalogue.length,
      catalogue,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

