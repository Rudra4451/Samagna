import { NextRequest, NextResponse } from 'next/server';
import {
  submitOrganisationDocument,
  reviewOrganisationDocument,
  getEcosystemOrganisationById,
} from '@/lib/server/ecosystem';
import { AuthUserContext } from '@/lib/ecosystem';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId query parameter is required.' }, { status: 400 });
    }

    const userRole = request.headers.get('x-user-role') || 'SUPERVISOR_ADMIN';
    const userOrgId = request.headers.get('x-user-org-id') || orgId;
    const userUsername = request.headers.get('x-user-username') || 'system';

    const userContext: AuthUserContext = {
      userId: userUsername,
      username: userUsername,
      role: userRole,
      organisationId: userOrgId,
      fullName: userUsername,
      isPlatformAdmin: userRole === 'SUPERVISOR_ADMIN',
    };

    const data = await getEcosystemOrganisationById(orgId, userContext);
    if (!data) return NextResponse.json({ error: `Organisation not found: ${orgId}` }, { status: 404 });

    return NextResponse.json({ documents: data.documents || [], count: data.documents?.length || 0 });
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, documentType, documentNumber, fileUrl } = body;

    const userRole = request.headers.get('x-user-role') || 'ORG_ADMIN';
    const userOrgId = request.headers.get('x-user-org-id') || orgId;
    const userUsername = request.headers.get('x-user-username') || 'officer';

    const requestingUser: AuthUserContext = {
      userId: userUsername,
      username: userUsername,
      role: userRole,
      organisationId: userOrgId,
      fullName: userUsername,
      isPlatformAdmin: userRole === 'SUPERVISOR_ADMIN',
    };

    const doc = await submitOrganisationDocument(
      orgId,
      { documentType, documentNumber, fileUrl },
      requestingUser
    );
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to submit document' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { docId, status, notes } = body;

    const auditorRole = request.headers.get('x-user-role') || 'SUPERVISOR_ADMIN';
    const auditorUsername = request.headers.get('x-user-username') || 'auditor';
    const auditorName = request.headers.get('x-user-fullname') || 'Government Auditor';

    const auditor: AuthUserContext = {
      userId: auditorUsername,
      username: auditorUsername,
      role: auditorRole,
      fullName: auditorName,
      isPlatformAdmin: auditorRole === 'SUPERVISOR_ADMIN',
    };

    const doc = await reviewOrganisationDocument(docId, status, auditor, notes);
    return NextResponse.json(doc);
  } catch (error: any) {
    const status = error.message.includes('AUDITOR_CLEARANCE_REQUIRED') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to review document' }, { status });
  }
}

