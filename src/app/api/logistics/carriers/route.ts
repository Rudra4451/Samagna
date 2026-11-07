import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import {
  getLogisticsProviders,
  getLogisticsProviderById,
  registerLogisticsProvider,
  updateCarrierVerificationStatus,
} from '@/lib/server/logistics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const district = searchParams.get('district') || undefined;

    if (id) {
      const carrier = await getLogisticsProviderById(id);
      if (!carrier) {
        return NextResponse.json({ success: false, error: 'CARRIER_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, carrier });
    }

    const carriers = await getLogisticsProviders({ district });
    return NextResponse.json({ success: true, count: carriers.length, carriers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.code || !body.name || !body.carrierType || !body.pan || !body.contactPhone) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Carrier code, name, carrierType, PAN, and contactPhone are required.',
        },
        { status: 422 }
      );
    }

    const carrier = await registerLogisticsProvider({
      code: body.code,
      name: body.name,
      carrierType: body.carrierType,
      registrationNumber: body.registrationNumber || 'APPLIED',
      gstin: body.gstin || null,
      pan: body.pan,
      contactPerson: body.contactPerson || 'Fleet Manager',
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail || 'carrier@transport.example.com',
      fleetSize: Number(body.fleetSize || 2),
      supportedDistricts: Array.isArray(body.supportedDistricts)
        ? body.supportedDistricts
        : [body.supportedDistricts || 'Mayurbhanj'],
      operatingRatePerKm: Number(body.operatingRatePerKm || 35.0),
    });

    return NextResponse.json({
      success: true,
      message: 'Logistics provider registered. Awaiting compliance inspection.',
      carrier,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { id, isVerified, isActive } = body;

    if (!id || isVerified === undefined || isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Carrier id, isVerified, and isActive required.' },
        { status: 422 }
      );
    }

    const updated = await updateCarrierVerificationStatus(id, Boolean(isVerified), Boolean(isActive));
    return NextResponse.json({ success: true, carrier: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

