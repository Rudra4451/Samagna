import { NextRequest, NextResponse } from 'next/server';
import { getCustomerAccountSummary } from '@/lib/server/consumerCommerce';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email query parameter is required' }, { status: 400 });
    }

    const summary = await getCustomerAccountSummary(email);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

