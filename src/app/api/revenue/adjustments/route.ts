import { NextRequest, NextResponse } from 'next/server';
import {
  getFinancialAdjustments,
  createFinancialAdjustment,
} from '@/lib/server/revenueReconciliation';

export async function GET() {
  try {
    const adjustments = await getFinancialAdjustments();
    return NextResponse.json({ adjustments, count: adjustments.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch adjustments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.approvedBy) {
      return NextResponse.json(
        { error: 'FINANCIAL_APPROVAL_REQUIRED: Commercial adjustments require an explicit approver identifier.' },
        { status: 403 }
      );
    }

    const adjustment = await createFinancialAdjustment(body);
    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('APPROVAL_REQUIRED') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to create adjustment' }, { status });
  }
}

