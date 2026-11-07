import { NextRequest, NextResponse } from 'next/server';
import {
  getConsumerOrders,
  getConsumerOrderById,
  createConsumerOrder,
  cancelConsumerOrder,
  advanceOrderStatus,
} from '@/lib/server/consumerCommerce';
import { ConsumerOrderStatus } from '@/lib/consumerCommerce';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const customerEmail = searchParams.get('customerEmail') || undefined;
    const status = (searchParams.get('status') as ConsumerOrderStatus) || undefined;

    if (id) {
      const order = await getConsumerOrderById(id);
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    const orders = await getConsumerOrders({ customerEmail, status });
    return NextResponse.json({ orders, count: orders.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newOrder = await createConsumerOrder(body);
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, customerEmail, reason, newStatus, actor, notes, trackingConsignmentRef } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (action === 'CANCEL') {
      if (!customerEmail || !reason) {
        return NextResponse.json({ error: 'customerEmail and reason are required for cancellation' }, { status: 400 });
      }
      const cancelledOrder = await cancelConsumerOrder(orderId, customerEmail, reason);
      return NextResponse.json({ success: true, order: cancelledOrder });
    }

    if (action === 'ADVANCE_STATUS') {
      if (!newStatus) {
        return NextResponse.json({ error: 'newStatus is required to advance status' }, { status: 400 });
      }
      const updatedOrder = await advanceOrderStatus(orderId, newStatus, actor || 'Operations Desk', notes, trackingConsignmentRef);
      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 400 });
  }
}

