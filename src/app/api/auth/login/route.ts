import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  authenticateCredentials,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/server/auth';

import { checkRateLimit, resetRateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const LoginInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  // Apply sliding-window rate limiting (10 attempts per minute per IP / client)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-client';
  const rateLimit = checkRateLimit(clientIp, 'auth-login', { windowMs: 60_000, maxRequests: 10 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many login attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  }

  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON', message: 'Malformed JSON payload' },
      { status: 400 }
    );
  }

  const parsed = LoginInputSchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_FAILED', message: 'Username and password required' },
      { status: 422 }
    );
  }

  const { username, password } = parsed.data;

  // Authenticate against database or safe test registry
  const authResult = await authenticateCredentials(username, password);
  if (!authResult.success || !authResult.user) {
    if (authResult.error === 'AUTHENTICATION_SERVICE_ERROR') {
      return NextResponse.json(
        {
          error: 'AUTHENTICATION_SERVICE_ERROR',
          message: 'Authentication service temporarily unavailable. Database connection error.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid username or password. Check credentials and retry.',
      },
      { status: 401 }
    );
  }

  // Reset failed attempt counter on successful login
  resetRateLimit(clientIp, 'auth-login');

  // Create cryptographically signed session token
  let token: string;
  try {
    token = await createSessionToken(authResult.user);
  } catch (err) {
    console.error('Authentication token creation failed:', err instanceof Error ? err.message : 'Configuration error');
    return NextResponse.json(
      {
        error: 'SERVER_CONFIGURATION_ERROR',
        message: 'Authentication service temporarily unavailable.',
      },
      { status: 500 }
    );
  }

  // Return user info and set secure HTTP-only session cookie
  const response = NextResponse.json({
    success: true,
    user: authResult.user,
    token, // Also return in body for mobile / API client bearer auth
  });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
