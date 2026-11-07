import { NextRequest, NextResponse } from 'next/server';
import {
  getCommercialShipments,
  getCommercialShipmentById,
  createCommercialShipment,
  confirmShipmentPickup,
  confirmShipmentDispatch,
  confirmShipmentDelivery,
  reportShipmentException,
  cancelShipment,
} from '@/lib/server/logistics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const carrierId = searchParams.get('carrierId') || undefined;
    const sourceReferenceId = searchParams.get('sourceReferenceId') || undefined;
    const lotReference = searchParams.get('lotReference') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const shipment = await getCommercialShipmentById(id);
      if (!shipment) {
        return NextResponse.json({ success: false, error: 'SHIPMENT_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, shipment });
    }

    const shipments = await getCommercialShipments({ carrierId, sourceReferenceId, lotReference, status });
    return NextResponse.json({ success: true, count: shipments.length, shipments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.carrierId || !body.vehicleNumber || !body.driverName || !body.sourceReferenceId || !body.lotReference || !body.dispatchedQuantityKg) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'carrierId, vehicleNumber, driverName, sourceReferenceId, lotReference, and dispatchedQuantityKg are required.',
        },
        { status: 422 }
      );
    }

    const shipment = await createCommercialShipment({
      waybillNumber: body.waybillNumber || null,
      carrierId: body.carrierId,
      vehicleNumber: body.vehicleNumber,
      driverName: body.driverName,
      driverPhone: body.driverPhone || '+91-0000000000',
      driverLicenseNumber: body.driverLicenseNumber || null,
      sourceType: body.sourceType || 'PURCHASE_ORDER',
      sourceReferenceId: body.sourceReferenceId,
      lotReference: body.lotReference,
      produceName: body.produceName || 'Minor Forest Produce',
      dispatchedQuantityKg: Number(body.dispatchedQuantityKg),
      originFacilityId: body.originFacilityId || 'BRP-01',
      originFacilityName: body.originFacilityName || 'Baripada Central Depot',
      originAddress: body.originAddress || 'Station Road, Baripada',
      destinationFacilityId: body.destinationFacilityId || null,
      destinationFacilityName: body.destinationFacilityName || 'Destination Terminal',
      destinationAddress: body.destinationAddress || 'Destination Address',
      sealTagIds: Array.isArray(body.sealTagIds) ? body.sealTagIds : [body.sealTagIds || 'SEAL-DEFAULT-01'],
      tarpaulinSecured: body.tarpaulinSecured !== undefined ? Boolean(body.tarpaulinSecured) : true,
      estimatedArrivalDate: body.estimatedArrivalDate || new Date(Date.now() + 3 * 86400000).toISOString(),
      distanceKm: Number(body.distanceKm || 120.0),
      supportingDocuments: Array.isArray(body.supportingDocuments) ? body.supportingDocuments : [],
    });

    return NextResponse.json({
      success: true,
      message: 'Commercial shipment created and linked to custody record.',
      shipment,
    });
  } catch (err: any) {
    const status = err.message.includes('UNVERIFIED_CARRIER_BLOCKED') || err.message.includes('CUSTODY_LINKAGE_REQUIRED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, shipmentId, actor = 'Logistics Officer', ...params } = body;

    if (!shipmentId || !action) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'shipmentId and action are required.' },
        { status: 422 }
      );
    }

    if (action === 'PICKUP') {
      const updated = await confirmShipmentPickup(shipmentId, actor, params.notes);
      return NextResponse.json({ success: true, message: 'Pickup confirmed.', shipment: updated });
    }

    if (action === 'DISPATCH') {
      const updated = await confirmShipmentDispatch(shipmentId, actor, params.waybillNumber, params.notes);
      return NextResponse.json({ success: true, message: 'Dispatch confirmed in transit.', shipment: updated });
    }

    if (action === 'DELIVERY') {
      const { receivedQuantityKg, deliverySignedBy, podRef, damageKg, discrepancyReason, notes } = params;
      if (receivedQuantityKg === undefined || !deliverySignedBy) {
        return NextResponse.json(
          { success: false, error: 'MISSING_DELIVERY_DATA', message: 'receivedQuantityKg and deliverySignedBy are required.' },
          { status: 422 }
        );
      }

      const updated = await confirmShipmentDelivery(shipmentId, actor, {
        receivedQuantityKg: Number(receivedQuantityKg),
        deliverySignedBy,
        podRef,
        damageKg: damageKg ? Number(damageKg) : 0,
        discrepancyReason,
        notes,
      });

      return NextResponse.json({ success: true, message: `Delivery recorded as ${updated.status}.`, shipment: updated });
    }

    if (action === 'EXCEPTION') {
      const { exceptionType, notes, delayHours, damageKg } = params;
      if (!exceptionType || !notes) {
        return NextResponse.json(
          { success: false, error: 'MISSING_EXCEPTION_DATA', message: 'exceptionType and notes are required.' },
          { status: 422 }
        );
      }

      const updated = await reportShipmentException(shipmentId, actor, {
        exceptionType,
        notes,
        delayHours: delayHours ? Number(delayHours) : 0,
        damageKg: damageKg ? Number(damageKg) : 0,
      });

      return NextResponse.json({ success: true, message: 'Exception recorded.', shipment: updated });
    }

    if (action === 'CANCEL') {
      const { reason = 'Cancelled by coordinator' } = params;
      const updated = await cancelShipment(shipmentId, actor, reason);
      return NextResponse.json({ success: true, message: 'Shipment cancelled.', shipment: updated });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

