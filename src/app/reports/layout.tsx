import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Business Intelligence & Enterprise Traceability | Samagna',
  description:
    'Operational intelligence, multi-audience reporting, and PII-safe enterprise traceability for the Samagna forest-produce value chain.',
};

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect('/login?redirect=/reports');
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    redirect('/login?redirect=/reports');
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

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans selection:bg-accent-tint selection:text-ink">
      {children}
    </div>
  );
}
