import { NextRequest, NextResponse } from 'next/server';
import {
  getDistributionPartners,
  getDistributionPartnerById,
  registerDistributionPartner,
  updatePartnerVerificationStatus,
  updatePartnerSubscriptionTier,
} from '@/lib/server/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerType = searchParams.get('partnerType') || undefined;
    const isVerified = searchParams.has('isVerified') ? searchParams.get('isVerified') === 'true' : undefined;
    const isActive = searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined;
    const id = searchParams.get('id');

    if (id) {
      const partner = await getDistributionPartnerById(id);
      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
      }
      return NextResponse.json({ partner });
    }

    const partners = await getDistributionPartners({ partnerType, isVerified, isActive });
    return NextResponse.json({ partners, count: partners.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newPartner = await registerDistributionPartner(body);
    return NextResponse.json({ success: true, partner: newPartner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to register partner' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, partnerId, isVerified, isActive, verificationStatus, subscriptionTier, subscriptionFeeInr } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required' }, { status: 400 });
    }

    if (action === 'UPDATE_SUBSCRIPTION') {
      const updated = await updatePartnerSubscriptionTier(partnerId, subscriptionTier, subscriptionFeeInr);
      return NextResponse.json({ success: true, partner: updated });
    }

    // Default action: VERIFY
    const updated = await updatePartnerVerificationStatus(
      partnerId,
      Boolean(isVerified),
      Boolean(isActive),
      verificationStatus || 'VERIFIED_ACTIVE'
    );

    return NextResponse.json({ success: true, partner: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update partner' }, { status: 400 });
  }
}

