import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import {
  getTradeBusinesses,
  getTradeBusinessById,
  registerTradeBusiness,
  updateBusinessVerificationStatus,
} from '@/lib/server/b2bTrade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') as any;

    if (id) {
      const business = await getTradeBusinessById(id);
      if (!business) {
        return NextResponse.json({ success: false, error: 'BUSINESS_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, business });
    }

    const businesses = await getTradeBusinesses(status ? { verificationStatus: status } : undefined);
    return NextResponse.json({ success: true, count: businesses.length, businesses });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.companyName || !body.businessType || !body.registrationNumber || !body.pan) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'Company name, business type, registration number, and PAN are required.',
        },
        { status: 422 }
      );
    }

    const business = await registerTradeBusiness({
      companyName: body.companyName,
      tradeName: body.tradeName || null,
      businessType: body.businessType,
      registrationNumber: body.registrationNumber,
      gstin: body.gstin || null,
      pan: body.pan,
      fssaiLicense: body.fssaiLicense || null,
      ayushLicense: body.ayushLicense || null,
      verificationNotes: body.verificationNotes || 'Awaiting document verification by state nodal desk.',
      registeredAddress: body.registeredAddress || 'Registered Office Address',
      city: body.city || 'Bhubaneswar',
      district: body.district || 'Khordha',
      state: body.state || 'Odisha',
      pincode: body.pincode || '751001',
      authorizedContactName: body.authorizedContactName || 'Authorized Signatory',
      contactEmail: body.contactEmail || 'contact@business.example.com',
      contactPhone: body.contactPhone || '+91-0000000000',
      bankName: body.bankName || null,
      bankBranch: body.bankBranch || null,
      accountNumberEnding: body.accountNumberEnding || null,
      ifscCode: body.ifscCode || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Business successfully registered for B2B trading. Awaiting nodal verification.',
      business,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Verification updates require supervisory clearance
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { id, verificationStatus, verificationNotes } = body;

    if (!id || !verificationStatus) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'Business id and verificationStatus required.' },
        { status: 422 }
      );
    }

    const updated = await updateBusinessVerificationStatus(id, verificationStatus, verificationNotes);
    return NextResponse.json({ success: true, business: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

