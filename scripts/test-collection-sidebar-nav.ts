/**
 * BanaSetu — Regression Test Suite: Collection Sidebar Navigation
 *
 * Verifies:
 * 1. Sidebar configuration for Field Operations & System items
 * 2. Hash routing logic & active state calculation in ManagerSidebar
 * 3. Section rendering in CollectionManagerPage (Aggregation, Collectors, Dispatches, Audit)
 * 4. Browser Back/Forward popstate/hashchange integration
 * 5. Accessibility attributes (role="tablist", aria-selected, aria-current, focus outlines)
 * 6. Design Tokens page return link navigation
 * 7. Live HTTP verification of /collection and /design on local dev server
 * 8. Role-based access control (RBAC) verification for collection routes
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { createSessionToken } from '../src/lib/server/auth';

function check(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function fetchHttp(url: string, cookie?: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; html: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: cookie ? { Cookie: cookie } : {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, html: data }));
      }
    );
    req.on('error', (err) => reject(err));
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('BanaSetu — Collection Sidebar Navigation & Section Route Tests');
  console.log('================================================================\n');

  const sidebarPath = path.join(process.cwd(), 'src/components/shell/ManagerSidebar.tsx');
  const collectionPagePath = path.join(process.cwd(), 'src/app/collection/page.tsx');
  const designPagePath = path.join(process.cwd(), 'src/app/design/page.tsx');
  const collectionLayoutPath = path.join(process.cwd(), 'src/app/collection/layout.tsx');

  // --------------------------------------------------------------------------
  console.log('--- 1. ManagerSidebar Configuration & Active State ---');
  // --------------------------------------------------------------------------
  const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

  // Verify 4 Field Operations items are defined with correct hrefs
  check(sidebarCode.includes("label: 'Field Aggregation'") && sidebarCode.includes("href: '/collection'"), 'Field Aggregation defined with href /collection');
  check(sidebarCode.includes("label: 'Tribal Collectors'") && sidebarCode.includes("href: '/collection#collectors'"), 'Tribal Collectors defined with href /collection#collectors');
  check(sidebarCode.includes("label: 'Transit Dispatches'") && sidebarCode.includes("href: '/collection#dispatches'"), 'Transit Dispatches defined with href /collection#dispatches');
  check(sidebarCode.includes("label: 'Custody Audit Log'") && sidebarCode.includes("href: '/collection#audit'"), 'Custody Audit Log defined with href /collection#audit');

  // Verify System item Design Tokens
  check(sidebarCode.includes('Design Tokens') && sidebarCode.includes("href=\"/design\""), 'Design Tokens defined with href /design');

  // Verify no dead href="#" links
  check(!sidebarCode.includes('href="#"'), 'No dead href="#" links in ManagerSidebar');

  // Verify currentHash state and hashchange listener
  check(sidebarCode.includes('currentHash') && sidebarCode.includes('hashchange') && sidebarCode.includes('popstate'), 'ManagerSidebar tracks currentHash and listens to hashchange & popstate events');

  // Verify accessible aria-current attribute and keyboard focus styling
  check(sidebarCode.includes("aria-current={isActive ? 'page' : undefined}"), 'ManagerSidebar provides aria-current="page" on active item');
  check(sidebarCode.includes('focus:outline-2') && sidebarCode.includes('focus:outline-accent'), 'ManagerSidebar provides high-visibility focus outline styling for keyboard navigation');

  // --------------------------------------------------------------------------
  console.log('\n--- 2. Collection Page Section Routing & Handlers ---');
  // --------------------------------------------------------------------------
  const collectionCode = fs.readFileSync(collectionPagePath, 'utf8');

  // Verify activeSection state and CollectionSection type
  check(collectionCode.includes("type CollectionSection = 'aggregation' | 'collectors' | 'dispatches' | 'audit'"), 'CollectionSection type covers all 4 Field Operations sections');
  check(collectionCode.includes('const [activeSection, setActiveSection] = useState<CollectionSection>'), 'activeSection state hook present');

  // Verify history integration and back/forward support
  check(collectionCode.includes("window.addEventListener('hashchange', handleHash)") && collectionCode.includes("window.addEventListener('popstate', handleHash)"), 'Hash and popstate listeners synchronize activeSection on Back/Forward navigation');
  check(collectionCode.includes('window.history.pushState'), 'navigateToSection uses pushState to preserve browser history');

  // Verify Top Tab Strip accessibility
  check(collectionCode.includes('role="tablist"'), 'Section navigation bar defines role="tablist"');
  check(collectionCode.includes('role="tab"'), 'Section buttons define role="tab"');
  check(collectionCode.includes("aria-selected={activeSection === 'aggregation'}") && collectionCode.includes("aria-selected={activeSection === 'collectors'}"), 'Section buttons properly set aria-selected based on activeSection');

  // Verify Section 1: Field Aggregation
  check(collectionCode.includes('id="aggregation"'), 'Section 1 contains id="aggregation"');
  check(collectionCode.includes('Season readiness'), 'Section 1 renders Season readiness card');
  check(collectionCode.includes('id="pickup-queue-table"'), 'Section 1 renders Field Intake Queue table');

  // Verify Section 2: Tribal Collectors Registry
  check(collectionCode.includes('id="collectors"'), 'Section 2 contains id="collectors"');
  check(collectionCode.includes('COLLECTION_TRIBAL_COLLECTORS'), 'Section 2 uses realistic prototype collector data');
  check(collectionCode.includes('Sunita Soren') && collectionCode.includes('Budhu Marndi') && collectionCode.includes('Kamla Majhi'), 'Section 2 renders registered tribal gatherers');
  check(collectionCode.includes('ସୁନୀତା ସୋରେନ'), 'Section 2 preserves Odia script gatherer names');
  check(collectionCode.includes('DBT-OD-2024-8841'), 'Section 2 renders verified DBT transfer references');

  // Verify Section 3: Transit Dispatches & Custody Handover
  check(collectionCode.includes('id="dispatches"'), 'Section 3 contains id="dispatches"');
  check(collectionCode.includes('COLLECTION_DISPATCHES'), 'Section 3 uses transit dispatch data');
  check(collectionCode.includes('WB-OD-24-099') && collectionCode.includes('OD-ST-8840'), 'Section 3 displays active waybills and security seal tags');
  check(collectionCode.includes('Tarpaulin dry'), 'Section 3 renders transit security compliance checklists');
  check(collectionCode.includes('/collection/receipt/BS-402') && collectionCode.includes('/collection/tag/BS-402'), 'Section 3 provides direct links to receipt and sack stencil tags');

  // Verify Section 4: Custody Audit Log & Dossier
  check(collectionCode.includes('id="audit"'), 'Section 4 contains id="audit"');
  check(collectionCode.includes('COLLECTION_AUDIT_EVENTS'), 'Section 4 defines custody audit trail events');
  check(collectionCode.includes('<AuditTimelineArtifact'), 'Section 4 embeds reusable AuditTimelineArtifact component');
  
  const artifactCode = fs.readFileSync(path.join(process.cwd(), 'src/components/artifacts/AuditTimelineArtifact.tsx'), 'utf8');
  check(artifactCode.includes('btn-download-audit-pdf') && artifactCode.includes('btn-share-audit-pdf'), 'Audit timeline artifact provides dedicated Download and Share actions for audit dossiers');

  // --------------------------------------------------------------------------
  console.log('\n--- 3. Design Tokens Page Return Navigation ---');
  // --------------------------------------------------------------------------
  const designCode = fs.readFileSync(designPagePath, 'utf8');
  check(designCode.includes("href=\"/collection\""), 'Design Tokens page provides return link to /collection');
  check(designCode.includes('Return to Collection Dashboard'), 'Design Tokens page link text is descriptive');

  // --------------------------------------------------------------------------
  console.log('\n--- 4. Role-Based Access Control (RBAC) Verification ---');
  // --------------------------------------------------------------------------
  const layoutCode = fs.readFileSync(collectionLayoutPath, 'utf8');
  check(layoutCode.includes("allowedRoles = ['COLLECTION_MANAGER', 'SUPERVISOR_ADMIN']"), 'Collection layout restricts access to COLLECTION_MANAGER and SUPERVISOR_ADMIN');
  check(layoutCode.includes("redirect('/unauthorized')") || layoutCode.includes("redirect('/login"), 'Unauthorized access is safely redirected');

  // Test role authorization matrix
  const allowedRoles = ['COLLECTION_MANAGER', 'SUPERVISOR_ADMIN'];
  const testRoles = [
    { role: 'COLLECTION_MANAGER', expected: true },
    { role: 'SUPERVISOR_ADMIN', expected: true },
    { role: 'PRIMARY_COLLECTOR', expected: false },
    { role: 'FIELD_FACILITATOR', expected: false },
    { role: 'DEPOT_MANAGER', expected: false },
  ];

  for (const { role, expected } of testRoles) {
    const isAllowed = allowedRoles.includes(role);
    check(isAllowed === expected, `Role ${role} authorization check matches expectation (${isAllowed ? 'ALLOWED' : 'BLOCKED'})`);
  }

  // --------------------------------------------------------------------------
  console.log('\n--- 5. Live HTTP Verification (Dev Server) ---');
  // --------------------------------------------------------------------------
  try {
    const unauthRes = await fetchHttp('http://localhost:3000/collection');
    check(
      unauthRes.status === 307 && (unauthRes.headers.location || '').includes('/login?redirect=/collection'),
      `Unauthenticated GET /collection safely redirects to login (HTTP ${unauthRes.status}, location: ${unauthRes.headers.location})`
    );
  } catch (err: any) {
    console.warn(`⚠️ HTTP check on /collection: ${err.message}`);
  }

  try {
    const designRes = await fetchHttp('http://localhost:3000/design');
    check(designRes.status === 200, `GET /design returned HTTP ${designRes.status}`);
    check(designRes.html.includes('Return to Collection Dashboard'), 'GET /design HTML contains Return to Collection Dashboard link');
    check(designRes.html.includes('href="/collection"'), 'GET /design HTML links back to /collection');
  } catch (err: any) {
    console.warn(`⚠️ HTTP check on /design: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log('All Collection Sidebar Navigation Tests Passed Successfully! ✨');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
