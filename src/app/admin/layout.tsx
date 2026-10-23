import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    redirect('/login?redirect=/admin');
  }

  const session = await verifySessionToken(sessionCookie);
  if (!session) {
    redirect('/login?redirect=/admin');
  }

  if (session.role !== 'SUPERVISOR_ADMIN') {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
