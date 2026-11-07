import { NextRequest, NextResponse } from 'next/server';
import {
  getFeeSchedules,
  assessPlatformServiceFee,
} from '@/lib/server/revenueReconciliation';

export async function GET() {
  try {
    const schedules = await getFeeSchedules();
    return NextResponse.json({ schedules, count: schedules.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch fee schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fee = await assessPlatformServiceFee(body);
    return NextResponse.json(fee, { status: 201 });
  } catch (error: any) {
    const status =
      error.message.includes('COLLECTOR_FEE_EXEMPT') ||
      error.message.includes('UNAPPROVED_FEE_TERMS_BLOCKED') ||
      error.message.includes('MSP_PROTECTION_VIOLATION')
        ? 403
        : 400;
    return NextResponse.json({ error: error.message || 'Failed to assess fee' }, { status });
  }
}

