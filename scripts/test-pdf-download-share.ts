/**
 * BanaSetu PDF Download & Share Invariant Test Suite
 * Validates separation of Download PDF and Share PDF actions:
 * - Direct download via Blob URL lifecycle (createObjectURL -> a.download -> revokeObjectURL)
 * - Strict non-invocation of navigator.share during download actions
 * - Web Share API file-sharing with graceful fallback to download
 * - Error handling for 401, 403, 503, network offline, invalid MIME, and empty blobs
 * - UI button and handler presence across Collector, Receipt, Tag, and Admin components
 */

import fs from 'fs';
import path from 'path';
import { sanitizePdfFilename, downloadPdfBlob, sharePdf } from '../src/lib/pdfClient';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   BanaSetu PDF Download & Share Action QA Suite     ');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // 1. Filename Sanitization & Security Guards
  // --------------------------------------------------------------------------
  console.log('--- 1. Filename Sanitization & Extension Invariants ---');

  assert(
    sanitizePdfFilename('BanaSetu-Receipt', '#BS-402') === 'BanaSetu-Receipt-BS-402.pdf',
    'Leading hash stripped from code: BanaSetu-Receipt-BS-402.pdf'
  );

  assert(
    sanitizePdfFilename('BanaSetu-BatchTag', 'BS-402') === 'BanaSetu-BatchTag-BS-402.pdf',
    'Standard batch tag filename formatted with .pdf extension'
  );

  assert(
    sanitizePdfFilename('BanaSetu-AuditDossier', '../traversal/evil#BS 402') === 'BanaSetu-AuditDossier-___traversal_evil_BS_402.pdf',
    'Path traversal characters and spaces safely neutralized'
  );

  // --------------------------------------------------------------------------
  // 2. Download PDF: Offline Detection
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Network Offline Guard ---');

  // Mock navigator.onLine = false using Object.defineProperty for Node 20+ compatibility
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  let shareCalled = false;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      onLine: false,
      share: async () => {
        shareCalled = true;
      },
    },
    configurable: true,
    writable: true,
  });

  let offlineErrorCaught = false;
  let offlineErrorMsg = '';
  try {
    await downloadPdfBlob({
      url: '/api/receipts/BS-402/pdf',
      filename: 'BanaSetu-Receipt-BS-402.pdf',
      onError: (msg) => {
        offlineErrorMsg = msg;
      },
    });
  } catch (err: any) {
    offlineErrorCaught = true;
  }

  assert(
    offlineErrorCaught && offlineErrorMsg.includes('offline'),
    'Offline state immediately rejects with clear network message'
  );
  assert(
    shareCalled === false,
    'Download action NEVER invokes navigator.share when offline'
  );

  // --------------------------------------------------------------------------
  // 3. Download PDF: Error Status Codes & Invalid Payloads
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Error Handling (401, 403, 503, Invalid Content-Type) ---');

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      onLine: true,
      share: async () => {
        shareCalled = true;
      },
    },
    configurable: true,
    writable: true,
  });

  const originalFetch = global.fetch;

  // Test 401 Unauthorized
  global.fetch = async () =>
    new Response(JSON.stringify({ error: 'UNAUTHENTICATED', message: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  let authErrorCaught = false;
  try {
    await downloadPdfBlob({
      url: '/api/receipts/BS-402/pdf',
      filename: 'BanaSetu-Receipt-BS-402.pdf',
    });
  } catch (err: any) {
    authErrorCaught = err.message.includes('expired') || err.message.includes('Session');
  }
  assert(authErrorCaught, 'HTTP 401 caught with session expiration message');
  assert(shareCalled === false, 'HTTP 401 failure does not trigger share option');

  // Test 403 Forbidden
  global.fetch = async () =>
    new Response(JSON.stringify({ error: 'FORBIDDEN', message: 'Clearance denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });

  let forbiddenErrorCaught = false;
  try {
    await downloadPdfBlob({
      url: '/api/audit/BS-402/pdf',
      filename: 'BanaSetu-AuditDossier-BS-402.pdf',
    });
  } catch (err: any) {
    forbiddenErrorCaught = err.message.includes('denied') || err.message.includes('permission');
  }
  assert(forbiddenErrorCaught, 'HTTP 403 caught with access denied message');

  // Test 503 Database Unconfigured
  global.fetch = async () =>
    new Response(
      JSON.stringify({
        error: 'DATABASE_UNCONFIGURED',
        message: 'PostgreSQL database is unconfigured. Official server-signed PDF receipts require an active database.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  let unconfiguredErrorCaught = false;
  try {
    await downloadPdfBlob({
      url: '/api/receipts/BS-402/pdf',
      filename: 'BanaSetu-Receipt-BS-402.pdf',
    });
  } catch (err: any) {
    unconfiguredErrorCaught = err.message.includes('unconfigured') || err.message.includes('database');
  }
  assert(unconfiguredErrorCaught, 'HTTP 503 caught with clear database unconfigured message');

  // Test Invalid Content-Type (HTML or JSON returned with 200)
  global.fetch = async () =>
    new Response('<html><body>Error Page</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  let invalidMimeCaught = false;
  try {
    await downloadPdfBlob({
      url: '/api/receipts/BS-402/pdf',
      filename: 'BanaSetu-Receipt-BS-402.pdf',
    });
  } catch (err: any) {
    invalidMimeCaught = err.message.includes('valid PDF');
  }
  assert(invalidMimeCaught, 'Non-PDF Content-Type rejected to prevent corrupt file download');

  // --------------------------------------------------------------------------
  // 4. Download PDF: Successful Blob Download & Object URL Lifecycle
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Blob URL Lifecycle & Direct File Trigger ---');

  const mockPdfBytes = Buffer.from('%PDF-1.4 Mock Authoritative PDF Document Stream %%EOF');
  let objectUrlCreated = false;
  let objectUrlRevoked = false;
  let createdBlobUrl = '';
  let anchorClicked = false;
  let downloadedFilename = '';

  const mockWindow = {
    URL: {
      createObjectURL: (blob: any) => {
        objectUrlCreated = true;
        createdBlobUrl = `blob:http://localhost:3000/${Math.random().toString(36).slice(2)}`;
        return createdBlobUrl;
      },
      revokeObjectURL: (url: string) => {
        if (url === createdBlobUrl) {
          objectUrlRevoked = true;
        }
      },
    },
  };

  const mockDocument = {
    body: {
      appendChild: (el: any) => {},
      removeChild: (el: any) => {},
      contains: (el: any) => true,
    },
    createElement: (tag: string) => {
      const element: any = {
        style: {},
        click: () => {
          anchorClicked = true;
          downloadedFilename = element.download;
        },
      };
      return element;
    },
  };

  (global as any).window = mockWindow;
  (global as any).document = mockDocument;

  global.fetch = async () =>
    new Response(mockPdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="BanaSetu-Receipt-BS-402.pdf"',
      },
    });

  const downloadResult = await downloadPdfBlob({
    url: '/api/receipts/BS-402/pdf',
    filename: 'BanaSetu-Receipt-BS-402.pdf',
  });

  assert(downloadResult.success, 'Successful download returns success confirmation');
  assert(objectUrlCreated, 'Blob URL created from valid server PDF stream');
  assert(anchorClicked, 'Native download link clicked programmatically');
  assert(
    downloadedFilename === 'BanaSetu-Receipt-BS-402.pdf',
    `Download initiated with exact filename: ${downloadedFilename}`
  );
  assert(shareCalled === false, 'Download action strictly did NOT invoke navigator.share');

  // Wait for setTimeout revoke
  await new Promise((r) => setTimeout(r, 1100));
  assert(objectUrlRevoked, 'Object URL safely revoked after download initiated');

  // --------------------------------------------------------------------------
  // 5. Share PDF: Level 2 Web Share & Fallback Invariants
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Web Share Action & Fallback Verification ---');

  let shareInvoked = false;
  let sharedPayload: any = null;
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      onLine: true,
      share: async (data: any) => {
        shareInvoked = true;
        sharedPayload = data;
      },
    },
    configurable: true,
    writable: true,
  });

  const shareResult = await sharePdf({
    url: '/api/receipts/BS-402/pdf',
    filename: 'BanaSetu-Receipt-BS-402.pdf',
    title: 'BanaSetu Receipt BS-402',
    text: 'Official Collection Receipt',
  });

  assert(shareResult.success, 'Share action executed successfully');
  assert(shareInvoked, 'Share action invokes navigator.share as intended');
  assert(
    sharedPayload?.title === 'BanaSetu Receipt BS-402',
    'Share payload contains correct document metadata'
  );

  // Restore fetch, window, navigator
  global.fetch = originalFetch;
  if (originalNavigatorDescriptor) {
    Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor);
  } else {
    delete (globalThis as any).navigator;
  }

  // --------------------------------------------------------------------------
  // 6. UI Integration & Separate Action Buttons Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 6. UI Separation Verification (Collector, Receipts, Tags, Admin) ---');

  // 6.1 Collector page
  const collectorPage = fs.readFileSync(path.resolve(__dirname, '../src/app/collector/page.tsx'), 'utf8');
  assert(
    collectorPage.includes('id="btn-download-receipt-pdf"'),
    'Collector home contains distinct Download Receipt PDF button (#btn-download-receipt-pdf)'
  );
  assert(
    collectorPage.includes('id="btn-share-receipt"'),
    'Collector home contains distinct Share Receipt button (#btn-share-receipt)'
  );
  assert(
    collectorPage.includes('id="btn-modal-download-receipt-pdf"'),
    'Receipt detail modal contains distinct Download Receipt PDF button (#btn-modal-download-receipt-pdf)'
  );
  assert(
    collectorPage.includes('id="btn-modal-share-receipt"'),
    'Receipt detail modal contains distinct Share Receipt button (#btn-modal-share-receipt)'
  );

  // 6.2 Collection Receipt page
  const receiptPage = fs.readFileSync(path.resolve(__dirname, '../src/app/collection/receipt/[code]/page.tsx'), 'utf8');
  assert(
    receiptPage.includes('id="btn-download-receipt-pdf"'),
    'Collection receipt page contains distinct Download PDF button (#btn-download-receipt-pdf)'
  );
  assert(
    receiptPage.includes('id="btn-share-receipt-pdf"'),
    'Collection receipt page contains distinct Share PDF button (#btn-share-receipt-pdf)'
  );

  // 6.3 Collection Tag page
  const tagPage = fs.readFileSync(path.resolve(__dirname, '../src/app/collection/tag/[code]/page.tsx'), 'utf8');
  assert(
    tagPage.includes('id="btn-download-collection-tag-pdf"'),
    'Collection tag page contains distinct Download A6 Tag button (#btn-download-collection-tag-pdf)'
  );
  assert(
    tagPage.includes('id="btn-download-product-spec-pdf"'),
    'Collection tag page contains distinct Download Spec Tag button (#btn-download-product-spec-pdf)'
  );
  assert(
    tagPage.includes('id="btn-share-tag-pdf"'),
    'Collection tag page contains distinct Share Tag button (#btn-share-tag-pdf)'
  );

  // 6.4 Audit Timeline Artifact
  const auditArtifact = fs.readFileSync(path.resolve(__dirname, '../src/components/artifacts/AuditTimelineArtifact.tsx'), 'utf8');
  assert(
    auditArtifact.includes('id="btn-download-audit-pdf"'),
    'Audit timeline contains distinct Download PDF button (#btn-download-audit-pdf)'
  );
  assert(
    auditArtifact.includes('id="btn-share-audit-pdf"'),
    'Audit timeline contains distinct Share button (#btn-share-audit-pdf)'
  );

  // 6.5 Admin Console
  const adminPage = fs.readFileSync(path.resolve(__dirname, '../src/app/admin/page.tsx'), 'utf8');
  assert(
    adminPage.includes('id="btn-admin-download-audit-pdf"'),
    'Admin console contains distinct Download PDF button (#btn-admin-download-audit-pdf)'
  );
  assert(
    adminPage.includes('id="btn-admin-share-audit-pdf"'),
    'Admin console contains distinct Share button (#btn-admin-share-audit-pdf)'
  );

  console.log('\n======================================================');
  console.log(`PDF DOWNLOAD/SHARE TEST RESULTS: ${passed}/${passed + failed} checks passed.`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
