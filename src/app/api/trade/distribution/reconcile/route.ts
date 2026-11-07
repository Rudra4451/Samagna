import { NextRequest, NextResponse } from 'next/server';
import {
  getPartnerSalesReconciliations,
  createSalesReconciliation,
  getDistributionPerformanceSummary,
} from '@/lib/server/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get('partnerId') || undefined;
    const isSummary = searchParams.get('summary') === 'true';

    if (isSummary) {
      const summary = await getDistributionPerformanceSummary(partnerId);
      return NextResponse.json({ summary });
    }

    const reconciliations = await getPartnerSalesReconciliations(partnerId);
    return NextResponse.json({ reconciliations, count: reconciliations.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reconciliation = await createSalesReconciliation(body);
    return NextResponse.json({ success: true, reconciliation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to execute sales reconciliation' }, { status: 400 });
  }
}

