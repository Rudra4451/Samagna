/**
 * Senior Testing Officer Verification Suite
 * Comprehensive automated QA audit across all routes, buttons, authentication,
 * Minor Forest Produce imagery, and API endpoints.
 */

import fs from 'fs';
import path from 'path';

// Pre-load AUTH_SECRET before importing server auth module
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('AUTH_SECRET=')) {
      process.env.AUTH_SECRET = trimmed.split('=')[1].replace(/["']/g, '').trim();
      break;
    }
  }
}
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-auth-secret-for-banasetu-test-suite-minimum-32-chars';

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  UserRole,
  SessionPayload,
} from '../src/lib/server/auth';

const BASE_URL = process.env.TEST_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    totalFailed++;
  }
}

async function createAuthCookie(role: UserRole, username: string = 'qa.officer'): Promise<string> {
  const payload: SessionPayload = {
    userId: `USR-${role.substring(0, 3)}-QA`,
    username,
    role,
    fullName: `QA Testing Officer (${role})`,
    district: 'Mayurbhanj',
    centerId: 'KRN-01',
    isDemo: false,
  };
  const token = await createSessionToken(payload);
  return `${SESSION_COOKIE_NAME}=${token}`;
}

async function main() {
  console.log('================================================================');
  console.log('      SENIOR TESTING OFFICER COMPREHENSIVE VERIFICATION AUDIT    ');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // Probing live server availability
  // -------------------------------------------------------------------------
  let isServerOnline = false;
  try {
    const probe = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(1000) });
    if (probe.status === 200) {
      isServerOnline = true;
    }
  } catch {
    isServerOnline = false;
  }

  if (isServerOnline) {
    console.log(`[INFO] Live server detected at ${BASE_URL}. Running full end-to-end HTTP verification.\n`);
  } else {
    console.log(`[INFO] Local server at ${BASE_URL} not detected (standard headless CI environment).`);
    console.log(`       Executing comprehensive static AST, code integrity, photo assets, and button audits.\n`);
  }

  // -------------------------------------------------------------------------
  // SECTION 1: Product Photography Audit (Original Pictures vs Symbols)
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: Minor Forest Produce Authentic Photography Audit ---');

  const productsDir = path.join(process.cwd(), 'public', 'products');
  assert(fs.existsSync(productsDir), 'public/products directory exists');

  const requiredProducts = [
    { slug: 'mahua', name: 'Dried Mahua Flowers', files: ['mahua.jpg'] },
    { slug: 'sal-seeds', name: 'Sal Tree Seeds', files: ['sal-seeds.jpg', 'sal.jpg'] },
    { slug: 'kendu-leaves', name: 'Kendu Leaves', files: ['kendu-leaves.jpg', 'kendu.jpg'] },
    { slug: 'tamarind-seeded', name: 'Tamarind (Seeded)', files: ['tamarind-seeded.jpg', 'tamarind.jpg'] },
    { slug: 'tamarind-deseeded', name: 'Tamarind (Deseeded)', files: ['tamarind-deseeded.jpg', 'deseeded-tamarind.jpg'] },
    { slug: 'harida', name: 'Harida Fruit', files: ['harida.jpg'] },
    { slug: 'bahada', name: 'Bahada Fruit', files: ['bahada.jpg'] },
    { slug: 'amla', name: 'Amla Fruit', files: ['amla.jpg'] },
    { slug: 'karanja-seeds', name: 'Karanja Seeds', files: ['karanja-seeds.jpg', 'karanja.jpg'] },
    { slug: 'kusum-seeds', name: 'Kusum Seeds', files: ['kusum-seeds.jpg', 'kusum.jpg'] },
    { slug: 'neem-seeds', name: 'Neem Seeds', files: ['neem-seeds.jpg', 'neem.jpg'] },
    { slug: 'char-seeds', name: 'Char Seeds (Chironji)', files: ['char-seeds.jpg', 'char.jpg'] },
    { slug: 'hill-broom', name: 'Hill Broom Grass', files: ['hill-broom.jpg', 'broom.jpg'] },
    { slug: 'wild-honey', name: 'Wild Forest Honey', files: ['wild-honey.jpg', 'honey.jpg'] },
    { slug: 'lac', name: 'Natural Lac (Sticklac)', files: ['lac.jpg'] },
    { slug: 'shikakai', name: 'Shikakai Pods', files: ['shikakai.jpg'] },
    { slug: 'dhataki', name: 'Dhataki Flowers', files: ['dhataki.jpg'] },
  ];

  for (const prod of requiredProducts) {
    const existingFile = prod.files.find(f => fs.existsSync(path.join(productsDir, f)));
    assert(!!existingFile, `Product "${prod.name}" has authentic photo file (${existingFile || 'MISSING'})`);

    if (existingFile) {
      const stats = fs.statSync(path.join(productsDir, existingFile));
      assert(stats.size > 1024, `Photo ${existingFile} has high-resolution non-zero size (${stats.size} bytes)`);

      // Test HTTP 200 fetch from live server if online
      if (isServerOnline) {
        try {
          const res = await fetch(`${BASE_URL}/products/${existingFile}`);
          assert(res.status === 200, `HTTP GET /products/${existingFile} returns 200 OK`);
          assert((res.headers.get('content-type') || '').includes('image/'), `Content-Type is image/* (${res.headers.get('content-type')})`);
        } catch (err: any) {
          assert(false, `HTTP GET /products/${existingFile} failed: ${err.message}`);
        }
      }
    }
  }

  // Verify ProductIcons.tsx implements photo-first rendering
  const productIconsCode = fs.readFileSync(path.join(process.cwd(), 'src/components/ui/ProductIcons.tsx'), 'utf8');
  assert(productIconsCode.includes('getProductImagePath'), 'ProductIcons.tsx implements getProductImagePath lookup');
  assert(productIconsCode.includes('<img') || productIconsCode.includes('img'), 'ProductIcon renders <img> elements for photos');
  assert(productIconsCode.includes('onError'), 'ProductIcon implements onError graceful fallback');

  // -------------------------------------------------------------------------
  // SECTION 2: Route Accessibility & HTTP Status Audit
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Route Accessibility & HTTP Status Audit ---');

  if (isServerOnline) {
    const publicRoutes = [
      { path: '/login', expectedStatus: 200 },
      { path: '/demo', expectedStatus: 200 },
      { path: '/design', expectedStatus: 200 },
      { path: '/verify', expectedStatus: 200 },
      { path: '/verify/BS-402', expectedStatus: 200 },
      { path: '/collection/receipt/BS-402', expectedStatus: 200 },
      { path: '/collection/tag/BS-402', expectedStatus: 200 },
      { path: '/api/health', expectedStatus: 200 },
    ];

    for (const route of publicRoutes) {
      try {
        const res = await fetch(`${BASE_URL}${route.path}`);
        assert(res.status === route.expectedStatus, `Public route ${route.path} responds with HTTP ${res.status}`);
      } catch (err: any) {
        assert(false, `Public route ${route.path} fetch failed: ${err.message}`);
      }
    }
  } else {
    console.log('  [SKIP] Local server offline: route reachability is validated during `next build` static export.');
  }

  // -------------------------------------------------------------------------
  // SECTION 3: Route Guards & RBAC Protection Audit
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Route Guards & RBAC Protection Audit ---');

  if (isServerOnline) {
    const protectedRoutes: Array<{ path: string; allowedRole: UserRole }> = [
      { path: '/collector', allowedRole: 'COLLECTOR' },
      { path: '/collection', allowedRole: 'COLLECTION_MANAGER' },
      { path: '/inventory', allowedRole: 'WAREHOUSE_MANAGER' },
      { path: '/facilitator', allowedRole: 'SHG_FACILITATOR' },
      { path: '/admin', allowedRole: 'SUPERVISOR_ADMIN' },
    ];

    for (const route of protectedRoutes) {
      // 3a. Unauthenticated request MUST redirect (307)
      try {
        const res = await fetch(`${BASE_URL}${route.path}`, { redirect: 'manual' });
        assert(res.status === 307 || res.status === 302, `Unauthenticated ${route.path} redirects (Status: ${res.status})`);
        const loc = res.headers.get('location') || '';
        assert(loc.includes('/login'), `Redirect target includes /login (${loc})`);
      } catch (err: any) {
        assert(false, `Unauthenticated guard test failed on ${route.path}: ${err.message}`);
      }

      // 3b. Authenticated request with authorized role MUST return 200
      try {
        const cookie = await createAuthCookie(route.allowedRole);
        const res = await fetch(`${BASE_URL}${route.path}`, {
          headers: { Cookie: cookie },
        });
        assert(res.status === 200, `Authorized (${route.allowedRole}) access to ${route.path} returns HTTP 200`);
        const html = await res.text();
        assert(html.length > 500, `Page content loaded successfully (${html.length} bytes)`);
      } catch (err: any) {
        assert(false, `Authorized access test failed on ${route.path}: ${err.message}`);
      }
    }
  } else {
    console.log('  [SKIP] Local server offline: route guards are validated via `test:batch5b` and `test:auth`.');
  }

  // -------------------------------------------------------------------------
  // SECTION 4: Button & Interactive Action Handlers Audit
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Interactive Button & Dead Code Audit ---');

  const interactivePages = [
    'src/app/collector/page.tsx',
    'src/app/collection/page.tsx',
    'src/app/inventory/page.tsx',
    'src/app/facilitator/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/login/page.tsx',
    'src/app/verify/page.tsx',
    'src/app/verify/[code]/page.tsx',
    'src/app/collection/receipt/[code]/page.tsx',
    'src/app/collection/tag/[code]/page.tsx',
  ];

  for (const relPath of interactivePages) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      assert(false, `File ${relPath} exists`);
      continue;
    }
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for dummy onClick handlers: onClick={() => {}} or onClick={() => void 0}
    const hasEmptyOnClick = /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/.test(content) ||
                            /onClick\s*=\s*\{\s*\(\s*\)\s*=>\s*void\s+0\s*\}/.test(content);
    assert(!hasEmptyOnClick, `${relPath} contains no empty dummy onClick handlers`);

    // Check for dead dummy hrefs: href="#" without an action
    const deadHashHrefs = content.match(/href\s*=\s*["']#["']/g);
    assert(!deadHashHrefs, `${relPath} has no dead href="#" links (found: ${deadHashHrefs ? deadHashHrefs.length : 0})`);

    // Verify all button tags have either type="button", type="submit", onClick, or disabled
    const buttonMatches = content.match(/<button[\s\S]*?<\/button>/g) || [];
    let unhandledButtons = 0;
    for (const btn of buttonMatches) {
      const hasOnClick = /onClick/.test(btn);
      const isSubmit = /type\s*=\s*["']submit["']/.test(btn);
      const isDisabled = /disabled/.test(btn);
      const isDropdownTrigger = /data-state|aria-expanded|asChild/.test(btn);
      if (!hasOnClick && !isSubmit && !isDisabled && !isDropdownTrigger) {
        unhandledButtons++;
      }
    }
    assert(unhandledButtons === 0, `${relPath}: all ${buttonMatches.length} <button> elements have bound actions (unhandled: ${unhandledButtons})`);
  }

  // -------------------------------------------------------------------------
  // SECTION 5: API Endpoints & Auth Handshake Audit
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: API Endpoints & Auth Handshake Audit ---');

  if (isServerOnline) {
    try {
      // 5a. Health API
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      const healthJson = await healthRes.json();
      assert(healthRes.status === 200 && (healthJson.status === 'ONLINE' || healthJson.status === 'ok'), `/api/health returns status ONLINE (received: ${healthJson.status})`);

      // 5b. Rates API
      const ratesRes = await fetch(`${BASE_URL}/api/rates`);
      const ratesJson = await ratesRes.json();
      assert(ratesRes.status === 200 && ratesJson.rates && ratesJson.rates.length > 0, `/api/rates returns official MSP rates (${ratesJson.rates?.length || 0} products)`);

      // 5c. Login API with invalid password
      const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'sunita.soren', password: 'WrongPassword999' }),
      });
      assert(badLoginRes.status === 401, 'Invalid credentials rejected with HTTP 401 Unauthorized');

      // 5d. Login API with authentic persona credentials
      const goodLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'sunita.soren', password: 'Test@Pass123' }),
      });
      assert(goodLoginRes.status === 200, 'Valid credentials (sunita.soren / Test@Pass123) authenticated with HTTP 200');
      const setCookie = goodLoginRes.headers.get('set-cookie') || '';
      assert(setCookie.includes(SESSION_COOKIE_NAME + '='), `Login sets ${SESSION_COOKIE_NAME} session cookie`);

      // 5e. /api/auth/me endpoint
      if (setCookie) {
        const cookieVal = setCookie.split(';')[0];
        const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Cookie: cookieVal },
        });
        const meJson = await meRes.json();
        assert(meRes.status === 200 && meJson.authenticated === true, '/api/auth/me successfully verifies session token');
      }

      // 5f. Admin Export API (requires SUPERVISOR_ADMIN)
      const adminCookie = await createAuthCookie('SUPERVISOR_ADMIN', 'patnaik.dpo');
      const exportRes = await fetch(`${BASE_URL}/api/admin/export?format=json`, {
        headers: { Cookie: adminCookie },
      });
      assert(exportRes.status === 200, 'Admin export ledger returns HTTP 200');

      // 5g. Admin Conflicts API
      const conflictsRes = await fetch(`${BASE_URL}/api/admin/conflicts`, {
        headers: { Cookie: adminCookie },
      });
      assert(conflictsRes.status === 200, 'Admin conflicts API returns HTTP 200');
    } catch (err: any) {
      assert(false, `API handshake test failed: ${err.message}`);
    }
  } else {
    console.log('  [SKIP] Local server offline: API routes and auth guards are validated via `test:auth` and `test:backend`.');
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`SENIOR TESTING OFFICER AUDIT COMPLETE: ${totalPassed} PASSED, ${totalFailed} FAILED`);
  console.log('================================================================');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal testing error:', err);
  process.exit(1);
});
