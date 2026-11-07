import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ecosystem & Organisation Management | Samagna Value-Chain Operations',
  description:
    'Manage participating organisations across the forest-produce value chain: institutional bodies, producer collectives, SHGs, processors, buyers, and logistics providers with multi-tenant isolation.',
};

export default async function EcosystemLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect('/login?redirect=/ecosystem');
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    redirect('/login?redirect=/ecosystem');
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
