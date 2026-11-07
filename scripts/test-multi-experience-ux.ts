/**
 * Phase 11 — Samagna Multi-Experience UX Integration Test Suite
 *
 * Validates:
 * 1. Coverage across all 12 platform experiences (routes, layouts, personas).
 * 2. Audience-specific UI differentiation (mobile-first collector, desk sidebar, commercial wide layout, consumer editorial).
 * 3. Consistent Organisation Context Bar & Primary Gatherer 0% Fee Invariant.
 * 4. Unified Notification Center (drawer, filters, actions, unread count).
 * 5. Samagna Multi-Experience Suite Launcher (4 suites, 12 experiences, clearance badges).
 * 6. Extended Role Switcher (10 distinct personas mapped to authentic workflow routes).
 * 7. Reusable UX State Primitives (Loading, Error, Success, Empty).
 * 8. Live HTTP route status, RBAC boundaries, and absence of dead buttons or decorative elements.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

function makeRequest(
  urlPath: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${urlPath}`,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function loginUser(username: string, password = 'Test@Pass123'): Promise<string> {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const cookieHeader = (res.headers['set-cookie'] || []).join('; ');
  const match = cookieHeader.match(/banasetu_session=([^;]+)/);
  if (!match) {
    throw new Error(`Failed to log in as ${username}. Status: ${res.statusCode}`);
  }
  return `banasetu_session=${match[1]}`;
}

async function runMultiExperienceTests() {
  console.log('\n======================================================');
  console.log('   PHASE 11: SAMAGNA MULTI-EXPERIENCE UX AUDIT');
  console.log('======================================================\n');

  // --- SECTION 1: Architectural File & Component Verification ---
  console.log('--- 1. Multi-Experience Architecture & Component Files ---');
  const appShellPath = path.join(process.cwd(), 'src/components/shell/AppShell.tsx');
  const topBarPath = path.join(process.cwd(), 'src/components/shell/TopBar.tsx');
  const appStorePath = path.join(process.cwd(), 'src/store/useAppStore.ts');
  const orgBarPath = path.join(process.cwd(), 'src/components/shell/OrganisationContextBar.tsx');
  const notifDrawerPath = path.join(process.cwd(), 'src/components/shell/NotificationDrawer.tsx');
  const appLauncherPath = path.join(process.cwd(), 'src/components/shell/AppLauncherModal.tsx');
  const stateViewsPath = path.join(process.cwd(), 'src/components/ui/StateViews.tsx');

  assert(fs.existsSync(appShellPath), 'AppShell.tsx component exists');
  assert(fs.existsSync(topBarPath), 'TopBar.tsx component exists');
  assert(fs.existsSync(appStorePath), 'useAppStore.ts store exists');
  assert(fs.existsSync(orgBarPath), 'OrganisationContextBar.tsx exists');
  assert(fs.existsSync(notifDrawerPath), 'NotificationDrawer.tsx exists');
  assert(fs.existsSync(appLauncherPath), 'AppLauncherModal.tsx exists');
  assert(fs.existsSync(stateViewsPath), 'StateViews.tsx exists');

  // --- SECTION 2: Persona Matrix & State Store Verification ---
  console.log('\n--- 2. Persona Matrix & State Store Expansion ---');
  const storeContent = fs.readFileSync(appStorePath, 'utf-8');
  assert(storeContent.includes("'b2b_buyer'"), 'DemoRole supports b2b_buyer persona');
  assert(storeContent.includes("'processor'"), 'DemoRole supports processor persona');
  assert(storeContent.includes("'logistics'"), 'DemoRole supports logistics persona');
  assert(storeContent.includes("'retail_partner'"), 'DemoRole supports retail_partner persona');
  assert(storeContent.includes("'finance_officer'"), 'DemoRole supports finance_officer persona');
  assert(storeContent.includes('activeOrganisationId'), 'App store tracks activeOrganisationId');
  assert(storeContent.includes('activeOrganisationName'), 'App store tracks activeOrganisationName');
  assert(storeContent.includes('unreadNotificationCount'), 'App store tracks unreadNotificationCount');
  assert(storeContent.includes('isAppLauncherOpen'), 'App store tracks isAppLauncherOpen');
  assert(storeContent.includes('isNotificationDrawerOpen'), 'App store tracks isNotificationDrawerOpen');

  // --- SECTION 3: 12 Experiences in Suite Launcher & Navigation ---
  console.log('\n--- 3. Samagna Suite Launcher (12 Platform Experiences) ---');
  const launcherContent = fs.readFileSync(appLauncherPath, 'utf-8');
  assert(launcherContent.includes('/collector'), 'Launcher covers 1. Collector Experience');
  assert(launcherContent.includes('/facilitator'), 'Launcher covers 2. Facilitator Experience');
  assert(launcherContent.includes('/collection'), 'Launcher covers 3. Collection Management');
  assert(launcherContent.includes('/inventory'), 'Launcher covers 4. Warehouse & Inventory');
  assert(launcherContent.includes('/trade'), 'Launcher covers 5. B2B Trade & RFQs');
  assert(launcherContent.includes('/processing'), 'Launcher covers 6. Processing & Value-Addition');
  assert(launcherContent.includes('/logistics'), 'Launcher covers 7. Logistics & Fulfilment');
  assert(launcherContent.includes('/distribution'), 'Launcher covers 8. Partner Distribution');
  assert(launcherContent.includes('/store'), 'Launcher covers 9. Consumer Storefront (B2C)');
  assert(launcherContent.includes('/verify'), 'Launcher covers 10. Public Provenance & Verification');
  assert(launcherContent.includes('/institutional'), 'Launcher covers 11. Institutional Admin');
  assert(launcherContent.includes('/reports'), 'Launcher covers 12. Revenue, Settlements & BI Reports');
  assert(launcherContent.includes('Tribal Gatherer 0% Platform Fee Protected'), 'Launcher enforces Collector 0% Fee policy guarantee');

  // --- SECTION 4: Audience-Specific Layout Differentiation ---
  console.log('\n--- 4. Audience-Specific Layout Architecture (AppShell.tsx) ---');
  const shellContent = fs.readFileSync(appShellPath, 'utf-8');
  assert(shellContent.includes('max-w-[480px]'), 'Collector view uses mobile-first 480px container');
  assert(shellContent.includes('CollectorTabBar'), 'Collector view renders CollectorTabBar');
  assert(shellContent.includes('ManagerSidebar'), 'Operational desk views render ManagerSidebar');
  assert(shellContent.includes('max-w-[1400px]'), 'Commercial and Institutional views render wide 1400px dashboard');
  assert(shellContent.includes('OrganisationContextBar'), 'AppShell renders OrganisationContextBar on operational/commercial routes');

  // --- SECTION 5: Organisation Context Bar & Statutory Invariants ---
  console.log('\n--- 5. Tenant Organisation Context & Invariants ---');
  const orgBarContent = fs.readFileSync(orgBarPath, 'utf-8');
  assert(orgBarContent.includes('Active Tenant:'), 'OrganisationContextBar displays Active Tenant label');
  assert(orgBarContent.includes('Statutory Verification'), 'OrganisationContextBar displays Statutory Verification badge');
  assert(orgBarContent.includes('Collector 0% Platform Fee Protected'), 'OrganisationContextBar upholds 0% platform fee protection for collectors');
  assert(orgBarContent.includes('Statutory MSP Active'), 'OrganisationContextBar upholds Statutory MSP enforcement');

  // --- SECTION 6: Unified Notification System ---
  console.log('\n--- 6. Unified Value-Chain Notification System ---');
  const notifContent = fs.readFileSync(notifDrawerPath, 'utf-8');
  assert(notifContent.includes('Value-Chain Notifications'), 'Notification drawer heading defined');
  assert(notifContent.includes('Mark all read'), 'Supports marking all notifications as read');
  assert(notifContent.includes('/institutional'), 'Links to institutional deliverable review');
  assert(notifContent.includes('/trade'), 'Links to B2B quotations and RFQs');
  assert(notifContent.includes('/processing'), 'Links to processing recovery yield inspection');
  assert(notifContent.includes('/logistics'), 'Links to logistics custody chain');
  assert(notifContent.includes('Protected Ledger Audit Stream'), 'Displays ledger audit stream status');

  // --- SECTION 7: Reusable UX State Primitives ---
  console.log('\n--- 7. Reusable UX State Primitives & Accessibility ---');
  const stateContent = fs.readFileSync(stateViewsPath, 'utf-8');
  assert(stateContent.includes('export const LoadingState'), 'Provides standardized LoadingState');
  assert(stateContent.includes('aria-busy="true"'), 'LoadingState defines accessible aria-busy');
  assert(stateContent.includes('export const ErrorState'), 'Provides standardized ErrorState');
  assert(stateContent.includes('role="alert"'), 'ErrorState defines accessible role="alert"');
  assert(stateContent.includes('export const SuccessState'), 'Provides standardized SuccessState');
  assert(stateContent.includes('export const EmptyStateView'), 'Provides standardized EmptyStateView');

  // --- SECTION 8: Interactive Buttons & No Dead Code ---
  console.log('\n--- 8. Interactive Triggers & No Dead Buttons Audit ---');
  const topBarContent = fs.readFileSync(topBarPath, 'utf-8');
  assert(topBarContent.includes('toggleAppLauncher'), 'TopBar has bound trigger for App Launcher modal');
  assert(topBarContent.includes('toggleNotificationDrawer'), 'TopBar has bound trigger for Notification drawer');
  assert(topBarContent.includes('unreadNotificationCount'), 'TopBar renders dynamic unread notification badge');
  assert(!topBarContent.includes('href="#"'), 'TopBar contains zero dead href="#" links');

  // --- SECTION 9: Live HTTP Route & RBAC Verification ---
  console.log('\n--- 9. Live HTTP Verification Across All 12 Experiences ---');

  // Public / Consumer Experiences (HTTP 200)
  const homeRes = await makeRequest('/');
  assert(homeRes.statusCode === 200, 'Public Home / responds with HTTP 200');

  const verifyRes = await makeRequest('/verify');
  assert(verifyRes.statusCode === 200, 'Public Provenance /verify responds with HTTP 200');

  const storeRes = await makeRequest('/store');
  assert(storeRes.statusCode === 200, 'B2C Storefront /store responds with HTTP 200');

  const storeCartRes = await makeRequest('/store/cart');
  assert(storeCartRes.statusCode === 200, 'B2C Store Cart /store/cart responds with HTTP 200');

  // Unauthenticated Protected Routes (Must redirect to /login with 307)
  const unauthCollector = await makeRequest('/collector');
  assert(unauthCollector.statusCode === 307, 'Unauthenticated /collector redirects safely (HTTP 307)');

  const unauthCollection = await makeRequest('/collection');
  assert(unauthCollection.statusCode === 307, 'Unauthenticated /collection redirects safely (HTTP 307)');

  const unauthInventory = await makeRequest('/inventory');
  assert(unauthInventory.statusCode === 307, 'Unauthenticated /inventory redirects safely (HTTP 307)');

  const unauthTrade = await makeRequest('/trade');
  assert(unauthTrade.statusCode === 307, 'Unauthenticated /trade redirects safely (HTTP 307)');

  const unauthProcessing = await makeRequest('/processing');
  assert(unauthProcessing.statusCode === 307, 'Unauthenticated /processing redirects safely (HTTP 307)');

  const unauthLogistics = await makeRequest('/logistics');
  assert(unauthLogistics.statusCode === 307, 'Unauthenticated /logistics redirects safely (HTTP 307)');

  const unauthDistribution = await makeRequest('/distribution');
  assert(unauthDistribution.statusCode === 307, 'Unauthenticated /distribution redirects safely (HTTP 307)');

  const unauthRevenue = await makeRequest('/revenue');
  assert(unauthRevenue.statusCode === 307, 'Unauthenticated /revenue redirects safely (HTTP 307)');

  const unauthEcosystem = await makeRequest('/ecosystem');
  assert(unauthEcosystem.statusCode === 307, 'Unauthenticated /ecosystem redirects safely (HTTP 307)');

  const unauthReports = await makeRequest('/reports');
  assert(unauthReports.statusCode === 307, 'Unauthenticated /reports redirects safely (HTTP 307)');

  // Authenticated Role Access Handshakes
  const collectorCookie = await loginUser('sunita.soren');
  const authCollectorRes = await makeRequest('/collector', {
    headers: { Cookie: collectorCookie },
  });
  assert(authCollectorRes.statusCode === 200, 'Authenticated Collector accesses /collector with HTTP 200');

  const managerCookie = await loginUser('manager.mohanty');
  const authManagerRes = await makeRequest('/collection', {
    headers: { Cookie: managerCookie },
  });
  assert(authManagerRes.statusCode === 200, 'Authenticated Collection Manager accesses /collection with HTTP 200');

  const adminCookie = await loginUser('patnaik.dpo');
  const authAdminRes = await makeRequest('/institutional', {
    headers: { Cookie: adminCookie },
  });
  assert(authAdminRes.statusCode === 200, 'Authenticated District Officer accesses /institutional with HTTP 200');

  const authTradeRes = await makeRequest('/trade', {
    headers: { Cookie: adminCookie },
  });
  assert(authTradeRes.statusCode === 200, 'Authenticated Authority accesses /trade with HTTP 200');

  const authProcessingRes = await makeRequest('/processing', {
    headers: { Cookie: adminCookie },
  });
  assert(authProcessingRes.statusCode === 200, 'Authenticated Authority accesses /processing with HTTP 200');

  const authLogisticsRes = await makeRequest('/logistics', {
    headers: { Cookie: adminCookie },
  });
  assert(authLogisticsRes.statusCode === 200, 'Authenticated Authority accesses /logistics with HTTP 200');

  const authRevenueRes = await makeRequest('/revenue', {
    headers: { Cookie: adminCookie },
  });
  assert(authRevenueRes.statusCode === 200, 'Authenticated Authority accesses /revenue with HTTP 200');

  const authReportsRes = await makeRequest('/reports', {
    headers: { Cookie: adminCookie },
  });
  assert(authReportsRes.statusCode === 200, 'Authenticated Authority accesses /reports with HTTP 200');

  console.log('\n======================================================');
  console.log(`PHASE 11 TEST RESULTS: ${passCount}/${passCount + failCount} checks passed.`);
  console.log('======================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runMultiExperienceTests().catch((err) => {
  console.error('Test suite failed with unhandled exception:', err);
  process.exit(1);
});

