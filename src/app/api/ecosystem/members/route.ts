import { NextRequest, NextResponse } from 'next/server';
import {
  getOrganisationMembers,
  addOrganisationMember,
  updateOrganisationMemberRole,
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

    const members = await getOrganisationMembers(orgId, userContext);
    return NextResponse.json({ members, count: members.length });
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch members' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, fullName, email, phone, role } = body;

    const userRole = request.headers.get('x-user-role') || 'ORG_ADMIN';
    const userOrgId = request.headers.get('x-user-org-id') || orgId;
    const userUsername = request.headers.get('x-user-username') || 'admin';

    const requestingUser: AuthUserContext = {
      userId: userUsername,
      username: userUsername,
      role: userRole,
      organisationId: userOrgId,
      fullName: userUsername,
      isPlatformAdmin: userRole === 'SUPERVISOR_ADMIN',
    };

    const member = await addOrganisationMember(orgId, { fullName, email, phone, role }, requestingUser);
    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    const status =
      error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED')
        ? 403
        : error.message.includes('DUPLICATE_MEMBER_EMAIL')
        ? 409
        : 400;
    return NextResponse.json({ error: error.message || 'Failed to add member' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, memberId, newRole } = body;

    const userRole = request.headers.get('x-user-role') || 'ORG_ADMIN';
    const userOrgId = request.headers.get('x-user-org-id') || orgId;
    const userUsername = request.headers.get('x-user-username') || 'admin';

    const requestingUser: AuthUserContext = {
      userId: userUsername,
      username: userUsername,
      role: userRole,
      organisationId: userOrgId,
      fullName: userUsername,
      isPlatformAdmin: userRole === 'SUPERVISOR_ADMIN',
    };

    const updated = await updateOrganisationMemberRole(orgId, memberId, newRole, requestingUser);
    return NextResponse.json(updated);
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 400;
    return NextResponse.json({ error: error.message || 'Failed to update member role' }, { status });
  }
}

