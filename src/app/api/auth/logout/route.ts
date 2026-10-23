import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/server/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully. Local offline records in Dexie remain preserved.',
  });

  // Clear session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
