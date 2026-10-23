import { NextRequest, NextResponse } from 'next/server';
import { getSession, ROLE_PERMISSIONS } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json(
      { authenticated: false, message: 'No active authenticated session.' },
      { status: 401 }
    );
  }

  const permissions = ROLE_PERMISSIONS[session.role] || [];

  return NextResponse.json({
    authenticated: true,
    user: session,
    permissions,
  });
}
