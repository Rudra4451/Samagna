import { NextRequest, NextResponse } from 'next/server';
import {
  getTradePurchaseOrders,
  getTradePurchaseOrderById,
  acceptTradeQuotation,
  updatePurchaseOrderStatus,
} from '@/lib/server/b2bTrade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const buyerOrgId = searchParams.get('buyerOrgId') || undefined;
    const sellerOrgId = searchParams.get('sellerOrgId') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const order = await getTradePurchaseOrderById(id);
      if (!order) {
        return NextResponse.json({ success: false, error: 'ORDER_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    const orders = await getTradePurchaseOrders({ buyerOrgId, sellerOrgId, status });
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quotationId, buyerActor = 'Authorized Buyer Representative' } = body;

    if (!quotationId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_QUOTATION_ID', message: 'quotationId is required to generate a purchase order.' },
        { status: 422 }
      );
    }

    const po = await acceptTradeQuotation(quotationId, buyerActor);
    return NextResponse.json({
      success: true,
      message: 'Quotation accepted. Purchase Order formally issued and inventory allocation committed.',
      purchaseOrder: po,
    });
  } catch (err: any) {
    const status = err.message.includes('UNVERIFIED_BUYER_BLOCKED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { poId, status, actor = 'System Operator', notes, extra } = body;

    if (!poId || !status) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'poId and status are required.' },
        { status: 422 }
      );
    }

    const updated = await updatePurchaseOrderStatus(poId, status, actor, notes, extra);
    return NextResponse.json({
      success: true,
      message: `Purchase Order status transitioned to ${status}.`,
      purchaseOrder: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

