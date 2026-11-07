import { NextRequest, NextResponse } from 'next/server';
import { getOrganisationRevenueReport } from '@/lib/server/revenueReconciliation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId') || undefined;

    const reports = await getOrganisationRevenueReport(orgId);
    return NextResponse.json({ reports, count: reports.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate organisation revenue report' },
      { status: 500 }
    );
  }
}

