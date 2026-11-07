import { NextRequest, NextResponse } from 'next/server';
import {
  getCommercialInvoices,
  getCommercialInvoiceById,
  generateCommercialInvoice,
  updateCommercialInvoiceStatus,
} from '@/lib/server/revenueReconciliation';
import { InvoiceStatus, InvoiceType } from '@/lib/revenueReconciliation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const organisationId = searchParams.get('organisationId') || undefined;
    const status = (searchParams.get('status') as InvoiceStatus) || undefined;
    const invoiceType = (searchParams.get('invoiceType') as InvoiceType) || undefined;

    if (id) {
      const invoice = await getCommercialInvoiceById(id);
      if (!invoice) {
        return NextResponse.json({ error: `Invoice not found: ${id}` }, { status: 404 });
      }
      return NextResponse.json(invoice);
    }

    const invoices = await getCommercialInvoices({ organisationId, status, invoiceType });
    return NextResponse.json({ invoices, count: invoices.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.approvedBy) {
      return NextResponse.json(
        { error: 'FINANCIAL_APPROVAL_REQUIRED: Commercial invoices require an explicit approver identifier.' },
        { status: 403 }
      );
    }

    const invoice = await generateCommercialInvoice(body);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('APPROVAL_REQUIRED') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to generate commercial invoice' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId, nextStatus, actor, notes } = body;

    if (!invoiceId || !nextStatus || !actor) {
      return NextResponse.json(
        { error: 'invoiceId, nextStatus, and actor are required fields.' },
        { status: 400 }
      );
    }

    const updated = await updateCommercialInvoiceStatus(invoiceId, nextStatus, actor, notes);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update invoice status' }, { status: 400 });
  }
}

