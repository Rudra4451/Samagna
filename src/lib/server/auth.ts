import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { getPrismaClient, isDatabaseConfigured } from './db';

export { UserRole };

export type Permission =
  | 'CREATE_PICKUP_REQUEST'
  | 'VIEW_OWN_RECEIPTS'
  | 'BUNDLE_CONSIGNMENTS'
  | 'CONFIRM_FIELD_COLLECTION'
  | 'DISPATCH_VEHICLE'
  | 'RECEIVE_WAREHOUSE_BATCH'
  | 'QUARANTINE_DISCREPANCY'
  | 'RESOLVE_DISCREPANCY'
  | 'RECONCILE_BATCH'
  | 'CHANGE_COLLECTOR_PAYMENT'
  | 'CONFIGURE_RATES'
  | 'MANAGE_USERS';

// Role-to-Permissions Mapping (Least Privilege by Default)
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  COLLECTOR: ['CREATE_PICKUP_REQUEST', 'VIEW_OWN_RECEIPTS'],
  SHG_FACILITATOR: [
    'CREATE_PICKUP_REQUEST',
    'VIEW_OWN_RECEIPTS',
    'BUNDLE_CONSIGNMENTS',
  ],
  COLLECTION_MANAGER: [
    'CONFIRM_FIELD_COLLECTION',
    'DISPATCH_VEHICLE',
  ],
  WAREHOUSE_MANAGER: [
    'RECEIVE_WAREHOUSE_BATCH',
    'QUARANTINE_DISCREPANCY',
  ],
  SUPERVISOR_ADMIN: [
    'RESOLVE_DISCREPANCY',
    'RECONCILE_BATCH',
    'CHANGE_COLLECTOR_PAYMENT',
    'CONFIGURE_RATES',
    'MANAGE_USERS',
  ],
} as const;

export interface SessionPayload {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
  centerId?: string;
  village?: string;
  district: string;
  isDemo?: boolean; // Demo flag: demo sessions must NEVER possess server write privileges
}

export const SESSION_COOKIE_NAME = 'banasetu_session';
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours field shift

export const MIN_AUTH_SECRET_LENGTH = 32;
export const DEFAULT_AUTH_SECRET = 'samagna-odisha-forest-ledger-secure-key-32-chars-minimum';

export function validateAuthSecret(): { valid: boolean; error?: string } {
  const secret = process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
  if (secret.length < MIN_AUTH_SECRET_LENGTH) {
    return {
      valid: false,
      error: `AUTH_SECRET is too weak (${secret.length} chars). Minimum required length is ${MIN_AUTH_SECRET_LENGTH} characters.`,
    };
  }
  return { valid: true };
}

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= MIN_AUTH_SECRET_LENGTH
      ? process.env.AUTH_SECRET
      : DEFAULT_AUTH_SECRET;
  return new TextEncoder().encode(secret);
}

export function isDemoAccountsAllowed(): boolean {
  if (process.env.ALLOW_DEMO_ACCOUNTS === 'false') {
    return false;
  }
  if (!process.env.ALLOW_DEMO_ACCOUNTS && process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.ALLOW_DEMO_ACCOUNTS === 'true';
}

// Password Hashing (Bcrypt with 10 salt rounds)
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Session Token Generation using Signed JWT
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

// Session Token Verification
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as UserRole,
      fullName: payload.fullName as string,
      centerId: payload.centerId as string | undefined,
      village: payload.village as string | undefined,
      district: payload.district as string,
      isDemo: Boolean(payload.isDemo),
    };
  } catch {
    return null;
  }
}

// In-Memory Safe Test Personas (Pre-seeded with Test@Pass123 hash for F2 testing)
// Password: Test@Pass123 -> $2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2
export const SAFE_TEST_ACCOUNTS = [
  {
    id: 'USR-COL-001',
    username: 'sunita.soren',
    passwordHash: '$2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2',
    fullName: 'Sunita Soren',
    fullNameOdia: 'ସୁନୀତା ସୋରେନ',
    role: 'COLLECTOR' as UserRole,
    district: 'Mayurbhanj',
    block: 'Karanjia',
    village: 'Badagaon',
    centerId: 'KRN-01',
    isActive: true,
  },
  {
    id: 'USR-FAC-001',
    username: 'sumitra.marndi',
    passwordHash: '$2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2',
    fullName: 'Sumitra Marndi (Maa Mangala SHG)',
    fullNameOdia: 'ସୁମିତ୍ରା ମାର୍ଣ୍ଡି',
    role: 'SHG_FACILITATOR' as UserRole,
    district: 'Mayurbhanj',
    block: 'Karanjia',
    village: 'Badagaon',
    centerId: 'KRN-01',
    isActive: true,
  },
  {
    id: 'USR-MGR-001',
    username: 'manager.mohanty',
    passwordHash: '$2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2',
    fullName: 'R. K. Mohanty',
    fullNameOdia: 'ଆର୍. କେ. ମହାନ୍ତି',
    role: 'COLLECTION_MANAGER' as UserRole,
    district: 'Mayurbhanj',
    block: 'Karanjia',
    village: 'Karanjia Center',
    centerId: 'KRN-01',
    isActive: true,
  },
  {
    id: 'USR-WHS-001',
    username: 'sdas.baripada',
    passwordHash: '$2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2',
    fullName: 'S. Das',
    fullNameOdia: 'ଏସ୍. ଦାସ',
    role: 'WAREHOUSE_MANAGER' as UserRole,
    district: 'Mayurbhanj',
    block: 'Baripada',
    village: 'Central Depôt',
    centerId: 'BRP-DEPOT-01',
    isActive: true,
  },
  {
    id: 'USR-SUP-001',
    username: 'patnaik.dpo',
    passwordHash: '$2b$10$ByS0DX9ks8RAE000dbSkyO2soBLJy/LtgxYqWS6LaClHrGRr4P./2',
    fullName: 'A. Patnaik (District Procurement Officer)',
    fullNameOdia: 'ଏ. ପଟ୍ଟନାୟକ',
    role: 'SUPERVISOR_ADMIN' as UserRole,
    district: 'Mayurbhanj',
    block: 'Baripada',
    village: 'District HQ',
    centerId: 'MBJ-HQ',
    isActive: true,
  },
];

// Authenticate user credentials against Database or Safe Test Registry
export async function authenticateCredentials(
  username: string,
  plainPassword: string
): Promise<{ success: boolean; user?: SessionPayload; error?: string }> {
  const normalizedUser = username.trim().toLowerCase();

  // 1. Try PostgreSQL User table if configured
  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      const dbUser = await prisma.user.findUnique({
        where: { username: normalizedUser },
      });

      if (dbUser && dbUser.isActive) {
        const matches = await verifyPassword(plainPassword, dbUser.passwordHash);
        if (matches) {
          return {
            success: true,
            user: {
              userId: dbUser.id,
              username: dbUser.username,
              role: dbUser.role,
              fullName: dbUser.fullName,
              centerId: dbUser.centerId || undefined,
              village: dbUser.village || undefined,
              district: dbUser.district,
              isDemo: false,
            },
          };
        }
      }
      // When database is configured, credentials must match a real User record
      return { success: false, error: 'INVALID_CREDENTIALS' };
    } catch {
      // Safe generic logging on server without leaking error or user details
      console.warn('DB authentication lookup error encountered');
      // In production or live DB mode, never silently fall back to demo accounts after a database error
      return { success: false, error: 'AUTHENTICATION_SERVICE_ERROR' };
    }
  }

  // 2. Safe Fallback to Pre-Seeded Test Accounts ONLY if live DB is NOT configured AND explicitly allowed in non-production
  if (isDemoAccountsAllowed()) {
    const testAcc = SAFE_TEST_ACCOUNTS.find((a) => a.username.toLowerCase() === normalizedUser);
    if (testAcc && testAcc.isActive) {
      const matches = await verifyPassword(plainPassword, testAcc.passwordHash);
      if (matches) {
        return {
          success: true,
          user: {
            userId: testAcc.id,
            username: testAcc.username,
            role: testAcc.role,
            fullName: testAcc.fullName,
            centerId: testAcc.centerId,
            village: testAcc.village,
            district: testAcc.district,
            isDemo: true, // Demo accounts must ALWAYS be marked isDemo: true
          },
        };
      }
    }
  }

  return { success: false, error: 'INVALID_CREDENTIALS' };
}

// Extract Session from Request Cookie or Authorization Header
export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  // Check cookie first
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookie) {
    const payload = await verifySessionToken(cookie);
    if (payload) return payload;
  }

  // Check Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifySessionToken(token);
  }

  return null;
}

// Server Authorization Guard by Role (Least Privilege)
export async function requireServerRole(
  req: NextRequest,
  permittedRoles: UserRole[]
): Promise<{
  authorized: boolean;
  actor?: SessionPayload;
  errorResponse?: NextResponse;
}> {
  const session = await getSession(req);

  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'UNAUTHENTICATED',
          message: 'Valid authentication session required. Please log in.',
        },
        { status: 401 }
      ),
    };
  }

  // Demo sessions must never grant real server privileges
  if (session.isDemo) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'DEMO_SESSION_MUTATION_BLOCKED',
          message: 'Demo mode is a simulation. Server mutations are blocked for demo sessions.',
        },
        { status: 403 }
      ),
    };
  }

  if (!permittedRoles.includes(session.role)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: `Actor role '${session.role}' is not authorized to execute this operation.`,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, actor: session };
}

// Server Authorization Guard by Permission
export async function requireServerPermission(
  req: NextRequest,
  permission: Permission
): Promise<{
  authorized: boolean;
  actor?: SessionPayload;
  errorResponse?: NextResponse;
}> {
  const session = await getSession(req);

  if (!session) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'UNAUTHENTICATED',
          message: 'Valid authentication session required.',
        },
        { status: 401 }
      ),
    };
  }

  if (session.isDemo) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'DEMO_SESSION_MUTATION_BLOCKED',
          message: 'Demo sessions cannot execute server mutations.',
        },
        { status: 403 }
      ),
    };
  }

  const rolePerms = ROLE_PERMISSIONS[session.role] || [];
  if (!rolePerms.includes(permission)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: `Actor role '${session.role}' lacks required permission '${permission}'.`,
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, actor: session };
}

// Authoritative canonical collection centers in Mayurbhanj district
export const CANONICAL_CENTER_REGISTRY: Record<string, string> = {
  // Karanjia Block Aggregation Center (LOC-KRN-01 / KRN-01)
  'KRN-01': 'KRN-01',
  'LOC-KRN-01': 'KRN-01',
  'Karanjia Aggregation Center': 'KRN-01',
  'Karanjia Sub-Divisional Depot': 'KRN-01',
  'Karanjia Block Collection Point #01': 'KRN-01',
  'Karanjia Primary MFP Procurement Point #04': 'KRN-01',
  'Karanjia Block Collection Center': 'KRN-01',

  // Jashipur Collection Center (LOC-JAS-02 / JAS-02)
  'JAS-02': 'JAS-02',
  'LOC-JAS-02': 'JAS-02',
  'Jashipur Collection Center': 'JAS-02',

  // Rairangpur Sub-depot (LOC-RRP-03 / RRP-03)
  'RRP-03': 'RRP-03',
  'LOC-RRP-03': 'RRP-03',
  'Rairangpur Sub-depôt': 'RRP-03',
  'Rairangpur Sub-depot': 'RRP-03',
  'Rairangpur Point': 'RRP-03',

  // Badagaon SHG Collection Point (LOC-BDG-V1 / BDG-V1)
  'BDG-V1': 'BDG-V1',
  'LOC-BDG-V1': 'BDG-V1',
  'Badagaon SHG Collection Point': 'BDG-V1',
  'Badagaon Van Dhan Kendra': 'BDG-V1',
  'Badagaon Van Dhan Vikas Kendra': 'BDG-V1',

  // Kadamdiha Village Point (LOC-KDM-V2 / KDM-V2)
  'KDM-V2': 'KDM-V2',
  'LOC-KDM-V2': 'KDM-V2',
  'Kadamdiha Village Point': 'KDM-V2',
};

// Authoritative central warehouse depot identifiers in Mayurbhanj district
export const AUTHORIZED_CENTRAL_DEPOTS: Set<string> = new Set([
  'BRP-01',
  'LOC-BRP-01',
  'BRP-DEPOT-01',
  'Baripada Central Depôt',
  'Baripada Central Depot',
]);

// Canonical central warehouse depot registry mapping distinct aliases to canonical depot codes
export const CANONICAL_DEPOT_REGISTRY: Record<string, string> = {
  'BRP-01': 'BRP-01',
  'LOC-BRP-01': 'BRP-01',
  'BRP-DEPOT-01': 'BRP-01',
  'Baripada Central Depôt': 'BRP-01',
  'Baripada Central Depot': 'BRP-01',
};

/**
 * Resolves an authoritative central warehouse depot identifier to its canonical code.
 * Rejects aggregation center IDs (e.g. KRN-01, JAS-02) and unmapped facilities.
 */
export function resolveCanonicalDepotId(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return CANONICAL_DEPOT_REGISTRY[trimmed] || null;
}

/**
 * Resolves any valid identifier or official center name to its canonical center code.
 * Strict: Requires resolution against the authoritative CANONICAL_CENTER_REGISTRY.
 * Rejects partial strings, substrings (e.g. "01", "RN-01"), or unmapped names.
 */
export function resolveCanonicalCenterId(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Direct exact registry lookup
  if (CANONICAL_CENTER_REGISTRY[trimmed]) {
    return CANONICAL_CENTER_REGISTRY[trimmed];
  }

  // Exact bracketed canonical code extraction (e.g. "Karanjia Center (KRN-01)")
  const bracketMatch = trimmed.match(/\(([A-Z0-9_-]+)\)$/);
  if (bracketMatch && bracketMatch[1]) {
    const extracted = bracketMatch[1].trim();
    if (CANONICAL_CENTER_REGISTRY[extracted]) {
      return CANONICAL_CENTER_REGISTRY[extracted];
    }
  }

  return null;
}

/**
 * Hardened exact center authorization.
 * Replaces unsafe substring matching (`.includes()`) with exact canonical identity verification.
 * Fails closed on missing or unmapped centers.
 */
export function isCenterAuthorizedExact(
  actorCenterId?: string | null,
  batchCenterName?: string | null
): boolean {
  if (!actorCenterId || !batchCenterName) {
    return false;
  }

  const cleanActor = actorCenterId.trim();
  const cleanBatch = batchCenterName.trim();

  // Canonical resolution equivalence (both actor and batch must resolve to the same canonical identity)
  const canonicalActor = resolveCanonicalCenterId(cleanActor);
  const canonicalBatch = resolveCanonicalCenterId(cleanBatch);

  if (canonicalActor && canonicalBatch && canonicalActor === canonicalBatch) {
    return true;
  }

  // Fails closed if mappings do not exist or do not strictly match
  return false;
}

/**
 * Verifies whether a facility identifier corresponds to an authorized central warehouse depot.
 * Disallows aggregation center identifiers (e.g. KRN-01) from masquerading as depots.
 */
export function isAuthorizedDepotCenter(centerId?: string | null): boolean {
  if (!centerId || typeof centerId !== 'string') return false;
  const trimmed = centerId.trim();
  if (!trimmed) return false;
  return Boolean(CANONICAL_DEPOT_REGISTRY[trimmed]) || AUTHORIZED_CENTRAL_DEPOTS.has(trimmed);
}

// Multi-tenant and Village/Center Resource Authorization Check
export function isResourceAuthorized(
  actor: SessionPayload,
  resource: {
    centerId?: string;
    village?: string;
    district?: string;
    collectorId?: string;
  }
): boolean {
  // Supervisor Admin has full district-wide authority
  if (actor.role === 'SUPERVISOR_ADMIN') {
    return !resource.district || resource.district === actor.district;
  }

  // Collection Manager can only access/mutate records belonging to their assigned center
  if (actor.role === 'COLLECTION_MANAGER') {
    return Boolean(
      actor.centerId &&
        resource.centerId &&
        isCenterAuthorizedExact(actor.centerId, resource.centerId)
    );
  }

  // Warehouse Manager can only access/mutate records assigned to their warehouse depôt
  if (actor.role === 'WAREHOUSE_MANAGER') {
    return Boolean(
      actor.centerId &&
        isAuthorizedDepotCenter(actor.centerId) &&
        (!resource.centerId || resource.centerId === actor.centerId)
    );
  }

  // SHG Facilitator can only access records for their assigned village/cluster
  if (actor.role === 'SHG_FACILITATOR') {
    return Boolean(actor.village && resource.village === actor.village);
  }

  // Collector can only access their own contributions
  if (actor.role === 'COLLECTOR') {
    return Boolean(resource.collectorId && resource.collectorId === actor.userId);
  }

  return false;
}

// Backwards-compatible verifyServerAuthorization wrapper for existing F1 routes
export function verifyServerAuthorization(
  req: NextRequest,
  requiredRoles?: UserRole[]
): {
  authorized: boolean;
  actor?: SessionPayload;
  errorResponse?: NextResponse;
} {
  // Note: For asynchronous auth, use requireServerRole or getSession directly.
  // This synchronous stub safely rejects unless valid test headers or sessions are inspected.
  return {
    authorized: false,
    errorResponse: NextResponse.json(
      {
        error: 'USE_ASYNC_REQUIRE_ROLE',
        message: 'Endpoint must evaluate async session token via requireServerRole',
      },
      { status: 401 }
    ),
  };
}
