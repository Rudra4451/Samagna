import { NextRequest, NextResponse } from 'next/server';
import {
  getFinancialReconciliations,
  reconcileInvoiceWithPayment,
} from '@/lib/server/revenueReconciliation';

export async function GET() {
  try {
    const reconciliations = await getFinancialReconciliations();
    return NextResponse.json({ reconciliations, count: reconciliations.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reconciliations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, paymentReferenceId, reconciledBy } = body;

    if (!invoiceId || !paymentReferenceId || !reconciledBy) {
      return NextResponse.json(
        { error: 'invoiceId, paymentReferenceId, and reconciledBy are required fields.' },
        { status: 400 }
      );
    }

    const result = await reconcileInvoiceWithPayment(invoiceId, paymentReferenceId, reconciledBy);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process financial reconciliation' },
      { status: 400 }
    );
  }
}

