import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import {
  getProcessingFacilities,
  getProcessingFacilityById,
  registerProcessingFacility,
  updateFacilityVerificationStatus,
} from '@/lib/server/processing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const district = searchParams.get('district') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const facility = await getProcessingFacilityById(id);
      if (!facility) {
        return NextResponse.json({ success: false, error: 'FACILITY_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, facility });
    }

    const facilities = await getProcessingFacilities({
      district,
      category,
      verificationStatus: status,
    });

    return NextResponse.json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.code || !body.name || !body.operatorOrgId || !body.district || !body.dailyCapacityKg) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Facility code, name, operatorOrgId, district, and dailyCapacityKg are required.',
        },
        { status: 422 }
      );
    }

    const facility = await registerProcessingFacility({
      code: body.code,
      name: body.name,
      operatorOrgId: body.operatorOrgId,
      operatorOrgName: body.operatorOrgName || 'TDCCOL Processing Partner',
      locationAddress: body.locationAddress || 'Processing Unit Address',
      district: body.district,
      state: body.state || 'Odisha',
      pincode: body.pincode || '757001',
      processingCapabilities: Array.isArray(body.processingCapabilities)
        ? body.processingCapabilities
        : [body.processingCapabilities || 'General Cleaning & Grading'],
      supportedCategories: Array.isArray(body.supportedCategories)
        ? body.supportedCategories
        : [body.supportedCategories || 'Non-Timber Forest Produce'],
      machineryEquipment: body.machineryEquipment || 'Standard Processing Machinery',
      dailyCapacityKg: Number(body.dailyCapacityKg),
      operatingAvailability: body.operatingAvailability || 'MON_TO_SAT_8AM_6PM',
      minimumBatchKg: Number(body.minimumBatchKg || 50),
      indicativeProcessingChargePerKg: Number(body.indicativeProcessingChargePerKg || 10),
      isActive: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Processing facility registered. Awaiting operational inspection.',
      facility,
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
    const { id, verificationStatus } = body;

    if (!id || !verificationStatus) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Facility id and verificationStatus required.' },
        { status: 422 }
      );
    }

    const updated = await updateFacilityVerificationStatus(id, verificationStatus);
    return NextResponse.json({ success: true, facility: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

