import { NextRequest, NextResponse } from 'next/server';
import {
  getOrderReferrals,
  getOrderReferralById,
  recordOrderReferral,
  updateOrderReferralStatus,
} from '@/lib/server/distribution';
import { OrderReferralStatus } from '@/lib/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const channelId = searchParams.get('channelId') || undefined;
    const partnerId = searchParams.get('partnerId') || undefined;
    const status = (searchParams.get('status') as OrderReferralStatus) || undefined;

    if (id) {
      const referral = await getOrderReferralById(id);
      if (!referral) {
        return NextResponse.json({ error: 'Order referral not found' }, { status: 404 });
      }
      return NextResponse.json({ referral });
    }

    const referrals = await getOrderReferrals({ channelId, partnerId, status });
    return NextResponse.json({ referrals, count: referrals.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newReferral = await recordOrderReferral(body);
    return NextResponse.json({ success: true, referral: newReferral }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record order referral' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { referralId, status, notes } = body;

    if (!referralId || !status) {
      return NextResponse.json({ error: 'referralId and status are required' }, { status: 400 });
    }

    const updated = await updateOrderReferralStatus(referralId, status, notes);
    return NextResponse.json({ success: true, referral: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order referral status' }, { status: 400 });
  }
}

