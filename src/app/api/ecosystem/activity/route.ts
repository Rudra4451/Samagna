import { NextRequest, NextResponse } from 'next/server';
import { getOrganisationActivityLogs } from '@/lib/server/ecosystem';
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

    const activityLogs = await getOrganisationActivityLogs(orgId, userContext);
    return NextResponse.json({ activityLogs, count: activityLogs.length });
  } catch (error: any) {
    const status = error.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch activity logs' }, { status });
  }
}

