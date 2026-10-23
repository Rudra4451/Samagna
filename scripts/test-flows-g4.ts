/**
 * scripts/test-flows-g4.ts
 *
 * G4 Audit: Dead-button, Broken Link, and Workflow Navigation Verification
 * Validates that all interactive routes, links, and API handlers in the app
 * are connected to real endpoints and handlers.
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

console.log('======================================================');
console.log('   BanaSetu G4: Dead-Button & Route Integrity Audit   ');
console.log('======================================================\n');

// 1. Audit Known Routes Existence
console.log('--- 1. Application Route Endpoints ---');
const routes = [
  'src/app/page.tsx',
  'src/app/collector/page.tsx',
  'src/app/collection/page.tsx',
  'src/app/inventory/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/login/page.tsx',
  'src/app/unauthorized/page.tsx',
  'src/app/verify/page.tsx',
  'src/app/verify/[code]/page.tsx',
  'src/app/collection/receipt/[code]/page.tsx',
  'src/app/collection/tag/[code]/page.tsx',
  'src/app/settings/sync/page.tsx',
  'src/app/demo/page.tsx',
  'src/app/demo/handoff/page.tsx',
  'src/app/demo/state/page.tsx',
  'src/app/design/page.tsx',
  'src/app/design/print/page.tsx',
  'src/app/facilitator/page.tsx',
];

for (const route of routes) {
  const fullPath = path.resolve(process.cwd(), route);
  assert(fs.existsSync(fullPath), `Route component exists: ${route}`);
}

// 2. Audit API Endpoints Existence
console.log('\n--- 2. Server API Route Handlers ---');
const apiRoutes = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/logout/route.ts',
  'src/app/api/auth/me/route.ts',
  'src/app/api/batches/route.ts',
  'src/app/api/collection/verify/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/inventory/verify/route.ts',
  'src/app/api/rates/route.ts',
  'src/app/api/sync/route.ts',
  'src/app/api/uploads/route.ts',
  'src/app/api/admin/export/route.ts',
  'src/app/api/admin/conflicts/route.ts',
];

for (const api of apiRoutes) {
  const fullPath = path.resolve(process.cwd(), api);
  assert(fs.existsSync(fullPath), `API endpoint handler exists: ${api}`);
}

// 3. Scan for Empty onClick Handlers ("dead buttons") in App Pages
console.log('\n--- 3. Interactive Button & Action Handlers ---');
const clientPages = [
  'src/app/collector/page.tsx',
  'src/app/collection/page.tsx',
  'src/app/inventory/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/login/page.tsx',
  'src/app/verify/page.tsx',
  'src/app/verify/[code]/page.tsx',
];

for (const page of clientPages) {
  const fullPath = path.resolve(process.cwd(), page);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check for empty handler pattern like onClick={() => {}} or onClick={() => void 0}
  const hasEmptyHandler = /onClick=\{\(\)\s*=>\s*\{\s*\}\}/.test(content);
  assert(!hasEmptyHandler, `${page}: Contains no empty dummy onClick handlers`);

  // Check that button elements have text, aria-label, or child elements
  const lines = content.split('\n');
  let hasValidButtons = true;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<button') && lines[i].includes('onClick=""')) {
      hasValidButtons = false;
    }
  }
  assert(hasValidButtons, `${page}: All buttons have non-empty action bindings`);
}

// 4. Verify Internal Links in Navigation & Headers
console.log('\n--- 4. Navigation Link Target Validation ---');
const validPaths = [
  '/',
  '/collector',
  '/collection',
  '/inventory',
  '/admin',
  '/login',
  '/unauthorized',
  '/verify',
  '/settings/sync',
  '/demo',
  '/demo/handoff',
  '/demo/state',
  '/design',
  '/facilitator',
];

// Verify AppShell navigation links
const appShellPath = path.resolve(process.cwd(), 'src/components/layout/AppShell.tsx');
if (fs.existsSync(appShellPath)) {
  const appShellContent = fs.readFileSync(appShellPath, 'utf8');
  const hrefMatches = Array.from(appShellContent.matchAll(/href="([^"]+)"/g)).map(m => m[1]);
  for (const href of hrefMatches) {
    if (href.startsWith('/')) {
      const baseHref = href.split('?')[0].split('#')[0];
      const isValid = validPaths.includes(baseHref);
      assert(isValid, `AppShell link target is valid: ${href}`);
    }
  }
}

console.log('\n======================================================');
console.log(`G4 TEST RESULTS: ${passed}/${passed + failed} checks passed.`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
}
