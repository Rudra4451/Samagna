import { NextRequest, NextResponse } from 'next/server';
import {
  getEcosystemOrganisations,
  getEcosystemOrganisationById,
  registerEcosystemOrganisation,
  reviewEcosystemOrganisation,
} from '@/lib/server/ecosystem';
import { EcosystemOrgCategory, EcosystemVerificationStatus, AuthUserContext } from '@/lib/ecosystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const category = (searchParams.get('category') as EcosystemOrgCategory) || undefined;
    const verificationStatus = (searchParams.get('status') as EcosystemVerificationStatus) || undefined;
    const district = searchParams.get('district') || undefined;
    const search = searchParams.get('search') || undefined;

    // Optional user context for private profile queries
    const userRole = request.headers.get('x-user-role') || undefined;
    const userOrgId = request.headers.get('x-user-org-id') || undefined;
    const userUsername = request.headers.get('x-user-username') || 'system';

    const userContext: AuthUserContext | undefined = userRole
      ? {
          userId: userUsername,
          username: userUsername,
          role: userRole,
          organisationId: userOrgId,
          fullName: userUsername,
          isPlatformAdmin: userRole === 'SUPERVISOR_ADMIN',
        }
      : undefined;

    if (id) {
      const orgData = await getEcosystemOrganisationById(id, userContext);
      if (!orgData) {
        return NextResponse.json({ error: `Organisation not found: ${id}` }, { status: 404 });
      }
      return NextResponse.json(orgData);
    }

    const organisations = await getEcosystemOrganisations({ category, verificationStatus, district, search });
    return NextResponse.json({ organisations, count: organisations.length });
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch organisations' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userRole = request.headers.get('x-user-role') || 'ORG_ADMIN';
    const userUsername = request.headers.get('x-user-username') || 'applicant';

    const registeringUser: AuthUserContext = {
      userId: userUsername,
      username: userUsername,
      role: userRole,
      fullName: body.contact?.primaryContactName || userUsername,
    };

    const newOrg = await registerEcosystemOrganisation(body, registeringUser);
    return NextResponse.json(newOrg, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('DUPLICATE_ORGANISATION_CODE') ? 409 : 400;
    return NextResponse.json({ error: error.message || 'Failed to register organisation' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, action, notes, rejectionReason } = body;

    const auditorRole = request.headers.get('x-user-role') || 'SUPERVISOR_ADMIN';
    const auditorUsername = request.headers.get('x-user-username') || 'auditor.official';
    const auditorName = request.headers.get('x-user-fullname') || 'Dr. Ramesh Jena (Deputy Director ST/SC Dev Dept)';

    const auditorContext: AuthUserContext = {
      userId: auditorUsername,
      username: auditorUsername,
      role: auditorRole,
      fullName: auditorName,
      isPlatformAdmin: auditorRole === 'SUPERVISOR_ADMIN',
    };

    if (!orgId || !action) {
      return NextResponse.json({ error: 'orgId and action are required fields.' }, { status: 400 });
    }

    const updated = await reviewEcosystemOrganisation(orgId, action, auditorContext, notes, rejectionReason);
    return NextResponse.json(updated);
  } catch (error: any) {
    const status =
      error.message.includes('FABRICATED_BADGE_PROHIBITED') ||
      error.message.includes('AUDITOR_CLEARANCE_REQUIRED')
        ? 403
        : 400;
    return NextResponse.json({ error: error.message || 'Failed to review organisation' }, { status });
  }
}

