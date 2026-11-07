import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import {
  getInstitutionalRevenue,
  recordInstitutionalPayment,
} from '@/lib/server/institutional';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Institutional revenue records are confidential: restricted strictly to SUPERVISOR_ADMIN
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const contractId = searchParams.get('contractId') || 'CTR-TDCCOL-2025-01';

  const result = await getInstitutionalRevenue(auth.actor, contractId);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, message: 'Institutional revenue records could not be retrieved.' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    revenueSummary: result.revenueSummary,
    invoices: result.invoices,
  });
}

export async function POST(req: NextRequest) {
  // Payment reconciliation restricted to SUPERVISOR_ADMIN
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  if (auth.actor.isDemo) {
    return NextResponse.json(
      {
        success: false,
        error: 'DEMO_SESSION_MUTATION_BLOCKED',
        message: 'Demo sessions cannot execute financial ledger mutations.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      invoiceId,
      paymentMethod,
      treasuryChallanNo,
      bankUtr,
      pfmsRef,
      paidAmount,
      paymentDate,
      notes,
    } = body;

    if (!invoiceId || !paymentMethod || !paidAmount || paidAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_FAILED',
          message: 'Valid invoiceId, paymentMethod, and positive paidAmount are required.',
        },
        { status: 422 }
      );
    }

    const result = await recordInstitutionalPayment(auth.actor, {
      invoiceId,
      paymentMethod,
      treasuryChallanNo,
      bankUtr,
      pfmsRef,
      paidAmount: Number(paidAmount),
      paymentDate: paymentDate || new Date().toISOString(),
      notes,
    });

    if (!result.success) {
      const status =
        result.error === 'PAYMENT_GATEWAY_NOT_SUPPORTED'
          ? 400
          : result.error === 'INVOICE_NOT_FOUND'
          ? 404
          : 422;
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message:
            result.error === 'PAYMENT_GATEWAY_NOT_SUPPORTED'
              ? 'Payment gateways are strictly unsupported. Institutional reconciliation must use Treasury Challan, NEFT/RTGS, or PFMS references.'
              : 'Payment reconciliation failed.',
        },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Government payment reference successfully reconciled.',
      invoice: result.invoice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'MALFORMED_JSON_BODY', message: err?.message || 'Invalid JSON body.' },
      { status: 400 }
    );
  }
}

