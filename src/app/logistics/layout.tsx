import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect('/login?redirect=/logistics');
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    redirect('/login?redirect=/logistics');
  }

  const allowedRoles: UserRole[] = [
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
    'SHG_FACILITATOR',
    'COLLECTOR',
  ];

  if (!allowedRoles.includes(payload.role)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}

