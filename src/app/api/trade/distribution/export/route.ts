import { NextRequest, NextResponse } from 'next/server';
import {
  getDistributionChannelById,
  getRetailProductSkus,
} from '@/lib/server/distribution';
import { exportPartnerCatalogue } from '@/lib/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channel') || searchParams.get('channelId');
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json';

    if (!channelId) {
      return NextResponse.json({ error: 'channel or channelId query parameter is required' }, { status: 400 });
    }

    const channel = await getDistributionChannelById(channelId);
    if (!channel) {
      return NextResponse.json({ error: `Distribution channel not found: ${channelId}` }, { status: 404 });
    }

    const skus = await getRetailProductSkus({ partnerId: channel.partnerId, isPublished: true });
    const exportedFeed = exportPartnerCatalogue(skus, channel, format);

    if (format === 'csv') {
      return new NextResponse(exportedFeed, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="catalogue-${channel.channelCode}.csv"`,
        },
      });
    }

    return new NextResponse(exportedFeed, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

