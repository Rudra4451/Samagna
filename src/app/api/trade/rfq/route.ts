import { NextRequest, NextResponse } from 'next/server';
import {
  getTradeRfqs,
  getTradeRfqById,
  createTradeRfq,
  submitTradeQuotation,
  rejectOrCancelRfq,
} from '@/lib/server/b2bTrade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const buyerOrgId = searchParams.get('buyerOrgId') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const rfq = await getTradeRfqById(id);
      if (!rfq) {
        return NextResponse.json({ success: false, error: 'RFQ_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, rfq });
    }

    const rfqs = await getTradeRfqs({ buyerOrgId, status });
    return NextResponse.json({ success: true, count: rfqs.length, rfqs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.buyerOrgId || !body.produceSlug || !body.produceName || !body.requestedGrade || !body.requestedQuantityKg || !body.deliveryLocation) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'buyerOrgId, produceSlug, produceName, requestedGrade, requestedQuantityKg, and deliveryLocation are required.',
        },
        { status: 422 }
      );
    }

    const rfq = await createTradeRfq({
      buyerOrgId: body.buyerOrgId,
      listingId: body.listingId || null,
      produceSlug: body.produceSlug,
      produceName: body.produceName,
      requestedGrade: body.requestedGrade,
      requestedQuantityKg: Number(body.requestedQuantityKg),
      deliveryLocation: body.deliveryLocation,
      targetDeliveryDate: body.targetDeliveryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      packagingRequirements: body.packagingRequirements || null,
      buyerNotes: body.buyerNotes || null,
    });

    return NextResponse.json({
      success: true,
      message: 'RFQ created and submitted to seller desk.',
      rfq,
    });
  } catch (err: any) {
    const status = err.message.includes('UNVERIFIED_BUYER_BLOCKED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, rfqId, ...params } = body;

    if (!rfqId || !action) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'rfqId and action are required.' },
        { status: 422 }
      );
    }

    if (action === 'QUOTE') {
      const { sellerOrgId, quotedPricePerKg, deliveryTimelineDays, deliveryTerms, paymentTerms, sellerRemarks } = params;
      if (!sellerOrgId || quotedPricePerKg === undefined) {
        return NextResponse.json(
          { success: false, error: 'MISSING_QUOTE_FIELDS', message: 'sellerOrgId and quotedPricePerKg required.' },
          { status: 422 }
        );
      }

      const result = await submitTradeQuotation({
        rfqId,
        sellerOrgId,
        quotedPricePerKg: Number(quotedPricePerKg),
        deliveryTimelineDays: Number(deliveryTimelineDays || 7),
        deliveryTerms,
        paymentTerms,
        sellerRemarks,
      });

      return NextResponse.json({
        success: true,
        message: 'Quotation submitted and inventory allocation lock established (72h duration).',
        quotation: result.quotation,
        allocationLock: result.allocationLock,
      });
    }

    if (action === 'REJECT') {
      const { actor = 'Seller Admin', reason = 'Cannot fulfill specifications or requested schedule' } = params;
      const rfq = await rejectOrCancelRfq(rfqId, actor, reason, false);
      return NextResponse.json({
        success: true,
        message: 'RFQ rejected and any reserved allocations released.',
        rfq,
      });
    }

    if (action === 'CANCEL') {
      const { actor = 'Buyer Admin', reason = 'Procurement requirement cancelled by buyer' } = params;
      const rfq = await rejectOrCancelRfq(rfqId, actor, reason, true);
      return NextResponse.json({
        success: true,
        message: 'RFQ cancelled and any reserved allocations released.',
        rfq,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    const status = err.message.includes('BLOCKED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

