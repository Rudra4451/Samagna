import { NextRequest, NextResponse } from 'next/server';
import {
  getConsumerGrievances,
  submitConsumerGrievance,
  resolveConsumerGrievance,
} from '@/lib/server/consumerCommerce';
import { ConsumerGrievanceType, ConsumerGrievanceStatus } from '@/lib/consumerCommerce';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerEmail = searchParams.get('customerEmail') || undefined;
    const orderId = searchParams.get('orderId') || undefined;

    const grievances = await getConsumerGrievances({ customerEmail, orderId });
    return NextResponse.json({ grievances, count: grievances.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, customerEmail, grievanceType, description, evidenceDocUrl } = body;

    if (!orderId || !customerEmail || !grievanceType || !description) {
      return NextResponse.json(
        { error: 'orderId, customerEmail, grievanceType, and description are required.' },
        { status: 400 }
      );
    }

    const grievance = await submitConsumerGrievance({
      orderId,
      customerEmail,
      grievanceType: grievanceType as ConsumerGrievanceType,
      description,
      evidenceDocUrl,
    });

    return NextResponse.json({ success: true, grievance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit grievance' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketNumber, status, resolutionNotes } = body;

    if (!ticketNumber || !status || !resolutionNotes) {
      return NextResponse.json(
        { error: 'ticketNumber, status, and resolutionNotes are required.' },
        { status: 400 }
      );
    }

    const updated = await resolveConsumerGrievance(
      ticketNumber,
      status as ConsumerGrievanceStatus,
      resolutionNotes
    );

    return NextResponse.json({ success: true, grievance: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update grievance' }, { status: 400 });
  }
}

