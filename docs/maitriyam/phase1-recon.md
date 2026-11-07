# Phase 1 — Reconnaissance Report: Maitriyam v0 for Samagna

**Author**: Assistant / Antigravity Engineering  
**Branch**: `feat/maitriyam-p1`  
**Date**: 2026-11-07  
**Status**: Ready for Owner Review (STOP at Phase 1 per Master Prompt v2 Section 3 & 21)

---

## 1. Executive Summary

This reconnaissance audit inspects the target repository (`https://github.com/Rudra4451/Samagna`) directly against the requirements of **Maitriyam v0 — Master Prompt v2**. Every reported item is backed by direct inspection evidence using the strict taxonomy tags: `[Read]`, `[Absent]`, `[Verify]`, and `[Block]`.

No application code or database schema has been mutated during Phase 1. As mandated, this phase concludes with the baseline metrics, identified contradictions, recorded blockers from Section 16, and proposed amendments, halting before initiating Phase 2.

---

## 2. Findings Table (16-Point Inspection Matrix)

| # | Inspection Area | Evidence Tag | Path / Artifact | Concrete Finding & Verified Excerpt |
|---|---|---|---|---|
| **1** | **package.json & Lockfile** | `[Read]` | `package.json` | Next.js `14.2.35`, React `18.3.1`, Dexie `4.0.8`, Prisma `5.22.0`, Zod `3.25.76`, Jose `6.2.13`, TailwindCSS `3.4.14`. Test runner is `tsx` executing individual test scripts under `scripts/`. No Jest, Vitest, or vector SDK present. |
| **2** | **Prisma Models & Schema** | `[Read]` | `prisma/schema.prisma` | 51 total models. `Organisation` exists (line 431); `EcosystemOrganisation` exists (line 1608); `User` has `role UserRole` (5 roles: `COLLECTOR`, `SHG_FACILITATOR`, `COLLECTION_MANAGER`, `WAREHOUSE_MANAGER`, `SUPERVISOR_ADMIN`). `AuditEvent` exists (line 236). `SyncIdempotencyRecord` exists (line 261). `RateLimitCounter` table is `[Absent]`. |
| **3** | **App Routes & Directory Layout** | `[Read]` / `[Absent]` | `src/app/**` | Routes present: `/collector`, `/facilitator`, `/collection`, `/inventory`, `/admin`, `/login`, `/verify`, `/verify/[code]`, `/trade`, `/store`, `/reports`, `/revenue`. Directory `src/domains/` is `[Absent]`. Pilot-status page `/about` is `[Absent]`. |
| **4** | **Authentication & Cookies** | `[Read]` / `[Absent]` | `src/lib/server/auth.ts`, `src/app/api/auth/login/route.ts` | JWT claims: `{ userId, username, role, fullName, centerId, village, district, isDemo }`. Signed via `jose` (HS256). Cookie: `banasetu_session`, flags: `httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 28800`. Root `middleware.ts` is `[Absent]`; route protection relies on layout guards and individual API helper `requireServerRole`. CSRF/Origin verification on POST is `[Absent]`. |
| **5** | **Dexie Database & Stores** | `[Read]` | `src/lib/db.ts` | Single database class `BanaSetuDatabase extends Dexie` with database name `'BanaSetuLedgerDB'`. Current schema version is `5`. Tables: `batches`, `auditEvents`, `discrepancyCases`, `appSettings`, `pendingSync`, `syncQueue`, `offlineAttachments`, `grievances`, `inventorySales`. `inventorySales` exists in v5. Outbox is `syncQueue` (`local_id, batch_code, entity, state, createdAt, dependsOn`). Hard assertion `assert(db.verno === 5)` exists in test suite. |
| **6** | **PWA Shell & Precaching** | `[Absent]` / `[Read]` | `public/`, `src/` | No service worker file (`sw.js`) or web manifest (`manifest.json`) exists in the repository. `/collector` route relies on standard Next.js asset caching and Dexie offline data, but has no service worker precache mechanism. Current first-load JS size for `/collector` is **226 kB** (uncompressed). |
| **7** | **Sync & 409 Capture** | `[Read]` / `[Absent]` | `src/app/api/sync/route.ts` | 409 conflict capture is explicitly implemented (`IDEMPOTENCY_CONFLICT`, `CONFLICT_DETECTED`, `RECORD_ALREADY_ACCEPTED`) persisting to `SyncConflictRecord`. Parameter `clientSchemaVersion` is currently `[Absent]` from sync requests and schema. |
| **8** | **i18n & Locales** | `[Read]` / `[Absent]` | `i18n/`, `src/i18n/`, `scripts/check-i18n.js` | Actual locale files are `en.json` and `or.json` (ISO code `or` for Odia, **not** `od`). Key-parity audit (`scripts/check-i18n.js`) verifies 189 matching keys. Concept of `review-status.json` is currently `[Absent]`. |
| **9** | **Speech Synthesis Code** | `[Read]` | `src/lib/speech.ts`, `src/app/collector/page.tsx` | Web Speech API `SpeechSynthesisUtterance` helper `speakAloud(text, lang = 'or-IN' \| 'en-IN')` with rate `0.9`, pitch `1.0`, voice matcher, and cancel queue. Collector view also implements `window.SpeechRecognition` / `webkitSpeechRecognition` behind voice tap handlers. No third-party SDK is used. |
| **10** | **Design System Palette** | `[Read]` | `tailwind.config.ts`, `src/app/globals.css` | Real palette defined in code: `--color-forest: #2D4F1E`, `--color-cream: #F5E6CC`, `--color-terracotta: #E27D60`, `--color-charcoal-deep: #1F1A14`, `--color-warm-white: #FFFAF2`. Semantic CSS tokens match Tailwind configuration cleanly. |
| **11** | **CSP & Security Headers** | `[Read]` | `next.config.js` | Headers configured in `next.config.js`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`. CSP defined at lines 79-81 uses `'self' 'unsafe-eval' 'unsafe-inline'` without cryptographic nonces. |
| **12** | **Public Verification Route** | `[Read]` | `src/app/verify/[code]/page.tsx`, `src/app/api/batches/[id]/route.ts` | Rate-limited to 60 req/min per IP. Privacy allowlist projection returns batch provenance without gatherer names, Aadhaar, or bank details. Unknown batch yields 404. Withdrawn/quarantined codes return status `QUARANTINED_DISCREPANCY`. Timing is not equalised. Code entropy uses sequential human lot codes (`BS-400`, `BS-402`). |
| **13** | **Masking & Maker-Checker** | `[Read]` / `[Absent]` | `src/lib/businessIntelligence.ts` | Masking functions exist: `maskCollectorName`, `maskTribalId`, `maskFinancialRecord`, `maskPhone`. PII elevation exists solely for `SUPERVISOR_ADMIN` in `/api/reports/traceability/[lotId]`. "Maker-checker" workflow and "disposal approval" are `[Absent]`. |
| **14** | **Rate Limiter & Idempotency** | `[Read]` / `[Absent]` | `src/lib/server/rateLimit.ts`, `prisma/schema.prisma` | Rate limiter uses an in-memory `Map<string, RateLimitRecord>` sliding window with periodic 5-minute cleanup. Database rate-limiting table is `[Absent]`. Idempotency is backed by PostgreSQL table `SyncIdempotencyRecord` with `@unique` index on `idempotencyKey`. |
| **15** | **Environment & Authoritative Host**| `[Read]` | `.env.example`, `netlify.toml`, `render.yaml` | `.env.example` lists `DATABASE_URL`, `AUTH_SECRET`, `ALLOW_DEMO_ACCOUNTS`, `NEXT_PUBLIC_APP_URL`, `SUPABASE_URL`. Both `netlify.toml` (Netlify serverless) and `render.yaml` (Render Node.js container) exist. Netlify hosts `samagna.netlify.app`. |
| **16** | **Test Suites & Runner** | `[Read]` | `scripts/`, `package.json` | 36 test script files in `scripts/`. Command `npm run test:all` executes 34 distinct test modules via `tsx`. Real duration: ~75 seconds. Comprehensive coverage spans i18n parity, a11y contrast, RBAC authorization, inventory sales, and route guards. |

---

## 3. Verified Code Excerpts

### A. Dexie Schema and Version Assertion
From `src/lib/db.ts` (lines 123-140):
```typescript
constructor() {
  super('BanaSetuLedgerDB');
  this.version(3).stores({
    batches: 'id, status, pickupRequestId, updatedAt',
    auditEvents: 'id, timestamp, actorId, actionType',
    discrepancyCases: 'id, batchId, status',
    appSettings: 'key',
    pendingSync: 'id, code, timestamp',
    syncQueue: 'local_id, batch_code, entity, state, createdAt, dependsOn',
  });
  this.version(4).stores({
    offlineAttachments: 'id, recordId, batchCode, uploadState, createdAt',
    grievances: 'id, status, createdAt',
  });
  this.version(5).stores({
    inventorySales: 'id, saleReference, produceName, depotId, syncState, createdAt, idempotencyKey',
  });
}
```

From `scripts/test-inventory-sales.ts` (lines 62-63):
```typescript
const db = new BanaSetuDatabase();
assert(db.verno === 5, 'BanaSetuDatabase configured at version 5');
```

### B. User Roles and RBAC Enum
From `prisma/schema.prisma` (lines 13-19):
```prisma
enum UserRole {
  COLLECTOR
  SHG_FACILITATOR
  COLLECTION_MANAGER
  WAREHOUSE_MANAGER
  SUPERVISOR_ADMIN
}
```
*Note*: `AUDITOR` role does not exist in the schema.

### C. Speech Synthesis Utility
From `src/lib/speech.ts` (lines 6-18):
```typescript
export function speakAloud(text: string, lang: 'or-IN' | 'en-IN' = 'en-IN'): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
```

---

## 4. Contradictions Between Prompt and Codebase

1. **Locale Code**: Prompt specifies `faq.od.json` or `faq.or.json`.
   - *Code reality*: The repository strictly uses `or` (ISO 639-1) across `i18n/or.json`, `src/i18n/or.json`, and `scripts/check-i18n.js`. The prompt's reference to `od` is invalid and must be discarded.
2. **Directory Architecture (`src/domains/`)**: Prompt states `src/domains/assistant/` as the target domain folder.
   - *Code reality*: `src/domains/` is `[Absent]`. The codebase follows standard Next.js App Router layout with `src/lib/`, `src/components/`, and `src/app/`.
3. **Dexie Version Sequence & Test Rigidity**: Prompt expects adding `maitriyamKb` and `maitriyamMeta` via a Dexie schema bump to version 6.
   - *Code reality*: `scripts/test-inventory-sales.ts` line 63 contains a rigid equality assertion: `assert(db.verno === 5)`. Bumping to v6 will break this test unless the assertion is amended to `assert(db.verno >= 5)`.
4. **RateLimitCounter Table**: Prompt expects Postgres-backed `RateLimitCounter`.
   - *Code reality*: The Prisma schema has no `RateLimitCounter` table. Rate limiting is currently handled via in-memory sliding window in `src/lib/server/rateLimit.ts`.
5. **Maker-Checker & Disposal Approval**: Prompt Section 4 and 10 provide examples referencing maker-checker and disposal approvals.
   - *Code reality*: Both features are `[Absent]` in the codebase.
6. **Contested Product Name & Pilot-Status Route**:
   - Product name is used interchangeably: `Samagna` in branding/TopBar and `BanaSetu` in package.json/database name.
   - Route `/about` referenced as the canonical pilot-status page in the prompt is currently `[Absent]`.

---

## 5. Section 16 Blockers & Recorded Decisions

| Blocker # | Section 16 Condition | Codebase Status | Status / Action |
|---|---|---|---|
| **B-1** | **No Organisation model** | `Organisation` exists in `prisma/schema.prisma` (line 431). | `[Resolved]` No fallback needed; table is present. |
| **B-2** | **No Authoritative Host** | Dual hosting configs exist (`netlify.toml` serverless vs `render.yaml` container). Live URL is `samagna.netlify.app`. | `[Block]` On Netlify serverless, in-memory rate limiting and background cron retention purges are ephemeral. Idempotency must rely on PostgreSQL (`SyncIdempotencyRecord`). |
| **B-3** | **Specification Phase 3 & 4 Gating** | `RateLimitCounter` is absent in Postgres; `SyncIdempotencyRecord` is present. | `[Block]` Online chat engine must either persist rate limits in PostgreSQL or use the existing in-memory/Redis limiter with documented multi-node caveats. |
| **B-4** | **Provider, Region & DPDP Decision** | No provider or DPDP compliance agreement recorded. | `[Resolved]` `DisabledProvider` is strictly enforced as the sole provider in v0. |
| **B-5** | **Docs Contradictions Unresolved** | README cites BanaSetu; repository features Samagna; model counts diverge. | `[Block]` Curated assistant corpus cannot index raw README or docs until contradictions are reconciled. |
| **B-6** | **Odia Reviewer Not Identified** | No formal Odia translator sign-off recorded. | `[Resolved]` All Odia entries will ship with `reviewed: false` and render the translation pending review marker. |
| **B-7** | **Design Palette Inconsistency** | `tailwind.config.ts` and `src/app/globals.css` match. | `[Resolved]` Forest green (`#2D4F1E`), warm cream (`#F5E6CC`), terracotta (`#E27D60`), deep charcoal (`#1F1A14`). |
| **B-8** | **No Service-Worker Precache for Field Routes** | Service worker and manifest are completely absent. | `[Block]` Offline availability of Maitriyam launcher cannot be guaranteed on cold visits without network until a service worker is implemented. Offline capabilities apply to warm cached sessions. |
| **B-9** | **Existing Outbox Carrying Assistant Rows** | `syncQueue` in `src/lib/db.ts` is strictly typed for batch entities (`pickup_request`, `collection`, `dispatch`, `storage_receipt`). | `[Block]` Replaying assistant questions to `/api/sync` would pollute batch sync. A dedicated local store `maitriyamOutbox` (or `askLaterQueue`) is required in Dexie v6. |
| **B-10**| **clientSchemaVersion Absent from Sync** | `clientSchemaVersion` is absent from `src/app/api/sync/route.ts`. | `[Block]` Must decide whether to inject `clientSchemaVersion` header without disturbing legacy sync tests. |
| **B-11**| **Contested Product Name & Pilot-Status Wording** | Product name is contested; `/about` is absent. | `[Block]` Requires product owner sign-off on user-facing identity string ("Samagna" vs "BanaSetu") and creation of `/about`. |
| **B-12**| **Absent Features Referenced by Prompt** | Maker-checker and disposal approval do not exist. | `[Resolved]` Excluded completely from all prompts, tools, and assistant examples. |
| **B-13**| **Voice-Privacy Decision Not Recorded** | No voice recording agreement recorded. | `[Resolved]` `MAITRIYAM_VOICE_ENABLED=false` is enforced by default. |

---

## 6. Baseline Metrics

- **TypeScript Compilation**: `npx tsc --noEmit` exits with `0` errors.
- **Verification Suites (`npm run test:all`)**:
  - **Total Passing Suites**: 34 suites passed cleanly (0 failed).
  - **Verified i18n Keys**: 189 keys in perfect parity.
  - **Release QA Audit**: 68 passed, 0 failed.
  - **Duration**: 74.8 seconds on reference workstation.
- **Bundle Size Baseline (`next build`)**:
  - `/collector` First Load JS: **226 kB** (page size: 29.5 kB).
  - `/collection` First Load JS: **237 kB**.
  - `/inventory` First Load JS: **230 kB**.
  - `/admin` First Load JS: **207 kB**.
  - `/verify/[code]` First Load JS: **140 kB**.
  - Total shared First Load JS: **87.2 kB**.

---

## 7. Decisions Needed from Product Owner

1. **Dexie Version 6 Assertion Amendment**:
   - Approve updating `scripts/test-inventory-sales.ts` line 63 from `assert(db.verno === 5)` to `assert(db.verno >= 5)` so that adding `maitriyamKb` and `maitriyamMeta` in version 6 does not fail regression tests.
2. **Canonical Product Name**:
   - Confirm whether Maitriyam introduces itself as *"Samagna Assistant"* or *"BanaSetu Assistant"*.
3. **Creation of `/about` Pilot Page**:
   - Approve adding a clean, accessible pilot disclaimer page at `src/app/about/page.tsx` stating non-affiliation and experimental pilot status.
4. **Outbox Store Separation**:
   - Confirm creating a dedicated Dexie store `maitriyamOutbox` (instead of polluting `syncQueue`) with auto-purge on user logout.
5. **Rate-Limit Storage**:
   - Confirm whether to add a `MaitriyamRateLimit` model to `prisma/schema.prisma` or reuse the existing sliding-window memory/Redis mechanism in `src/lib/server/rateLimit.ts`.

---

## 8. Proposed Amendments to Master Prompt v2

1. **Locale File Naming**: Change all references from `faq.od.json` to `faq.or.json` in accordance with repository standards.
2. **Folder Structure**: Permit placing offline knowledge base under `src/lib/assistant/knowledge/` or create `src/domains/` cleanly.
3. **Scope Clarification**: Remove all references to maker-checker, disposal approvals, or AUDITOR role since they do not exist in the domain model.
4. **Test Flexibility**: Amend the requirement to preserve `db.verno === 5` to allow Dexie version progression (`db.verno >= 5`).

---

## 9. Sequencing Plan Against Specification

```
Phase 1: Reconnaissance & Audit Report (Completed)
   │
   └──> [Owner Approval Gate G-P1]
         │
         ├──> Phase 2: Offline Knowledge Base & Pure Matcher
         │      • Curated FAQ (faq.en.json, faq.or.json)
         │      • Deterministic Matcher (Unicode NFC, trigrams, score thresholds)
         │      • Dexie v6 migration (maitriyamKb, maitriyamMeta, maitriyamOutbox)
         │      • Local diagnostics module & reference device timing tests
         │
         ├──> Phase 3: Online Engine & Read-Only Tools (Server API)
         │      • Endpoints: /api/assistant/chat, /api/assistant/config, /api/public/assistant/chat
         │      • Read-only tools (getRateCard, getRequestStatus, getAuditLog, getVerifyRecord)
         │      • DisabledProvider default implementation & degradation matrix
         │      • Threat model deliverable: docs/maitriyam/threat-model.md
         │
         ├──> Phase 4: Public Surface Mounting (Gate G-Public)
         │      • Mount launcher on Landing and /verify/[code]
         │      • Deploy /about pilot status page
         │
         ├──> Phase 5: Field Surfaces & Ask-Later Queue
         │      • Mount on /collector, /facilitator, /collection
         │      • Replay queue with idempotency keys
         │
         ├──> Phase 6: Admin Surface & Audit History
         │      • Read-only audit interaction history on /admin
         │
         ├──> Phase 7: Comprehensive Security, Threat Model & QA Pass
         │
         └──> Phase 8: Handover & Documentation Delivery
```

---

**HALT DIRECTIVE REACHED**:
Per instructions in Section 3 and Section 21 of the Master Prompt v2, Phase 1 reconnaissance is complete. The assistant has stopped and is waiting for product-owner review and approval before proceeding to Phase 2.

