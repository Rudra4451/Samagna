import { NextRequest, NextResponse } from 'next/server';
import {
  getCommercialSettlements,
  getCommercialSettlementById,
  createCommercialSettlement,
  approveAndDisburseSettlement,
} from '@/lib/server/revenueReconciliation';
import { SettlementStatus } from '@/lib/revenueReconciliation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const payeeOrgId = searchParams.get('payeeOrgId') || undefined;
    const status = (searchParams.get('status') as SettlementStatus) || undefined;

    if (id) {
      const settlement = await getCommercialSettlementById(id);
      if (!settlement) {
        return NextResponse.json({ error: `Settlement not found: ${id}` }, { status: 404 });
      }
      return NextResponse.json(settlement);
    }

    const settlements = await getCommercialSettlements({ payeeOrgId, status });
    return NextResponse.json({ settlements, count: settlements.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const settlement = await createCommercialSettlement(body);
    return NextResponse.json(settlement, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('DUPLICATE_SETTLEMENT_BLOCKED')
      ? 409
      : error.message.includes('MSP_PROTECTION_VIOLATION')
      ? 403
      : 400;
    return NextResponse.json({ error: error.message || 'Failed to create settlement' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settlementId, approvedBy, bankDisbursementRef } = body;

    if (!settlementId || !approvedBy || !bankDisbursementRef) {
      return NextResponse.json(
        { error: 'settlementId, approvedBy, and bankDisbursementRef are required fields.' },
        { status: 400 }
      );
    }

    const disbursed = await approveAndDisburseSettlement(settlementId, approvedBy, bankDisbursementRef);
    return NextResponse.json(disbursed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to disburse settlement' }, { status: 400 });
  }
}

