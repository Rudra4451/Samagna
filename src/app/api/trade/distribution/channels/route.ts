import { NextRequest, NextResponse } from 'next/server';
import {
  getDistributionChannels,
  getDistributionChannelById,
  createDistributionChannel,
} from '@/lib/server/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const partnerId = searchParams.get('partnerId') || undefined;

    if (id) {
      const channel = await getDistributionChannelById(id);
      if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }
      return NextResponse.json({ channel });
    }

    const channels = await getDistributionChannels(partnerId);
    return NextResponse.json({ channels, count: channels.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newChannel = await createDistributionChannel(body);
    return NextResponse.json({ success: true, channel: newChannel }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create channel' }, { status: 400 });
  }
}

