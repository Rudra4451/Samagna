/**
 * Validates and sanitizes post-login redirect targets (Fix 3 - Open Redirect Hardening)
 *
 * 1. Rejects protocol-relative URLs (`//example.com`)
 * 2. Rejects raw and URL-encoded backslashes (`/\\`, `\`, `%5c`, `%5C`)
 * 3. Rejects external schemes (`http:`, `https:`, `javascript:`, `data:`)
 * 4. Rejects control characters, newlines, tabs, and null bytes
 * 5. Prevents redirect loops back to `/login`, `/logout`, or `/unauthorized`
 * 6. Enforces role-based route clearance (e.g. `/admin` restricted strictly to `SUPERVISOR_ADMIN`)
 * 7. Preserves valid internal routes and safe query parameters
 */

export const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  SUPERVISOR_ADMIN: [
    '/admin',
    '/inventory',
    '/collection',
    '/collector',
    '/facilitator',
    '/verify',
    '/demo',
    '/design',
  ],
  WAREHOUSE_MANAGER: ['/inventory', '/verify', '/demo'],
  COLLECTION_MANAGER: ['/collection', '/verify', '/demo'],
  COLLECTOR: ['/collector', '/verify', '/demo'],
  SHG_FACILITATOR: ['/facilitator', '/collector', '/verify', '/demo'],
};

export function getDefaultDestinationForRole(role: string): string {
  switch (role) {
    case 'COLLECTOR':
      return '/collector';
    case 'COLLECTION_MANAGER':
      return '/collection';
    case 'WAREHOUSE_MANAGER':
      return '/inventory';
    case 'SHG_FACILITATOR':
      return '/facilitator';
    case 'SUPERVISOR_ADMIN':
    default:
      return '/admin';
  }
}

export function getSafeRedirectDestination(
  redirectParam: string | null | undefined,
  role: string
): string {
  const defaultDest = getDefaultDestinationForRole(role);
  if (!redirectParam || typeof redirectParam !== 'string') {
    return defaultDest;
  }

  const trimmed = redirectParam.trim();
  if (!trimmed) {
    return defaultDest;
  }

  // 1. Must start with a single '/' and not with '//' (protocol-relative URLs)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultDest;
  }

  // 2. Reject backslashes in all forms (raw '\', encoded '%5c', '%5C', '/\')
  if (
    trimmed.includes('\\') ||
    trimmed.toLowerCase().includes('%5c') ||
    trimmed.includes('%2f%2f') ||
    trimmed.includes('/\\')
  ) {
    return defaultDest;
  }

  // 3. Reject control characters, carriage returns, newlines, tabs, and null bytes
  if (/[\r\n\t\0]/.test(trimmed)) {
    return defaultDest;
  }

  // 4. Extract path part before query and hash for inspection
  const [pathnameAndHash] = trimmed.split('?');
  const [pathname] = pathnameAndHash.split('#');

  // Must not have colon in path part (rejects javascript:, data:, external schemes)
  if (pathname.includes(':')) {
    return defaultDest;
  }

  // Validate using URL parser with dummy origin
  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost' || parsed.username || parsed.password) {
      return defaultDest;
    }
  } catch {
    return defaultDest;
  }

  // 5. Prevent redirect loops back to login, logout, or unauthorized pages
  const normalizedPath = pathname.toLowerCase();
  if (
    normalizedPath === '/login' ||
    normalizedPath === '/logout' ||
    normalizedPath === '/unauthorized'
  ) {
    return defaultDest;
  }

  // 6. Role-based route authorization & restrictions
  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] || [];
  const isAuthorizedForRole = allowedPrefixes.some(
    (prefix) =>
      normalizedPath === prefix ||
      normalizedPath.startsWith(`${prefix}/`) ||
      normalizedPath.startsWith(`${prefix}?`)
  );

  if (!isAuthorizedForRole) {
    return defaultDest;
  }

  // Valid internal route with safe query params preserved
  return trimmed;
}
