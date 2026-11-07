import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME, UserRole } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Revenue & Financial Reconciliation | Samagna Value-Chain Operations',
  description:
    'Unified financial operations module covering institutional contracts, invoice generation, payment reconciliation, settlement disbursements, and immutable audit ledgers.',
};

export default async function RevenueLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect('/login?redirect=/revenue');
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    redirect('/login?redirect=/revenue');
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
