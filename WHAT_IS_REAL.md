# WHAT_IS_REAL.md — BanaSetu Technical Reality & Veracity Disclosure

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Status:** Normative Technical Reality Audit  
> **Rule:** Absolute truth in engineering. Zero simulated artifacts presented as live production credentials.

---

## 1. Executive Summary

BanaSetu is engineered as a **resilient dual-engine application**:
1. **Local-First Client Engine (100% Real & Operable):** Runs locally in the browser using Dexie (IndexedDB), React 18, Next.js 14, Web Audio/Speech API, Web Crypto API, and Canvas/SVG generation. Works completely offline with zero server dependencies.
2. **Server-Side Enterprise Engine (100% Implemented & Tested in Isolation):** Implements Prisma ORM (15 relational models), version-controlled migrations (`prisma/migrations/0_init`), repeatable pilot seed script (`prisma/seed.ts`), sliding-window rate limiters, bcryptjs password hashing, HMAC-SHA256 JWT session tokens, dual storage abstraction (`SupabaseStorageAdapter` + `LocalStorageAdapter`), binary magic bytes validation, and Zod data validation schemas.
3. **Database & External Services Status:**
   - **PostgreSQL Connection:** Configurable via `DATABASE_URL`. When unconfigured or unreachable, all endpoints gracefully return `HTTP 503 DATABASE_UNCONFIGURED` without crashing, preserving client data in the offline Dexie outbox.
   - **Durable Evidence Storage:** Storage abstraction implemented in `src/lib/server/storage.ts`. Supports private managed Supabase Storage buckets via short-lived signed URLs. When `SUPABASE_URL` is unconfigured, falls back gracefully to local server disk storage (`public/uploads`).
   - **Payment Gateway:** **SIMULATED**. Payouts are generated with traceable reference numbers (e.g. `PAY-MAYURBHANJ-xxxx`) and explicitly labelled *"Simulated DBT Reference — Non-Banking Sandbox"*. No live banking or UPI rails are connected.
   - **Government APIs:** **PROVISIONAL / ILLUSTRATIVE**. Minimum Support Prices (MSP) and shrinkage tolerances are sourced from illustrative reference tables (e.g. Mahua at ₹42/kg, Sal seeds at ₹28/kg) and explicitly marked as illustrative benchmarks.

---

## 2. Feature-by-Feature Reality Matrix

| Component / Subsystem | Real Implementation | Simulated / Mocked | Notes & Evidence |
|:---|:---:|:---:|:---|
| **Collector PWA Interface** | **REAL** | None | Full offline collection requests, speech synthesis ("Listen to Rate"), weather advisories, draft recovery, and camera preview via HTML5 Media Capture. |
| **Bilingual Support (EN / OR)** | **REAL** | None | 189 keys with 100% parity between English and Odia (`i18n/en.json`, `i18n/or.json`). Verified by `npm run test:i18n`. |
| **Inclusive Design & A11y** | **REAL** | None | WCAG 2.1 AA compliant. All contrast ratios $\ge 4.5:1$. Tested by `npm run test:a11y`. Zero box-shadows, zero gradients, zero emoji. |
| **Client Database (Dexie)** | **REAL** | None | IndexedDB schema with tables for `weighmentRecords`, `syncQueue`, `products`, `discrepancies`, and `offlineBatches`. |
| **Server Schema & Migrations** | **REAL** | Ready for live DB | 15 relational models in `prisma/schema.prisma`. Version-controlled SQL migration in `prisma/migrations/0_init/migration.sql`. Seed in `prisma/seed.ts`. Validated via `npx prisma generate`. |
| **Authentication & RBAC** | **REAL** | Demo persona switcher | Cryptographically signed HS256 JWT cookies with role enforcement across 5 roles. Quick-login persona switcher provided for evaluation. |
| **Rate Limiter** | **REAL** | In-Memory MemoryStore | Sliding-window in-memory limiter with IP tracking, HTTP 429 response, and standard headers (`X-RateLimit-*`). Tested by `npm run test:backend`. |
| **Storage Abstraction & Uploads**| **REAL** | Local fallback active | Storage abstraction (`src/lib/server/storage.ts`) supports Supabase private bucket and local disk fallback. Enforces 5MB limit, MIME whitelist, magic bytes signatures, and SHA-256 digests. Tested by `npm run test:uploads`. |
| **Transit Shrinkage Engine** | **REAL** | None | Mathematical tolerance validation (1.5% benchmark). Automated segregation into quarantine bay on excess loss. Verified by `npm run test:inventory`. |
| **Offline Sync & Central Conflicts**| **REAL** | Ready for live DB | Client Dexie outbox with exponential backoff and 3-way arbitration. Central conflict review API (`/api/admin/conflicts`) and Admin Console Tab 3 connected to `SyncConflictRecord`. |
| **Public Verification** | **REAL** | None | Dual QR code tag and public receipt verification (`/verify/[code]`) with strict Aadhaar/bank privacy masking. |
| **Admin Console & Exports** | **REAL** | None | Multi-tab admin console with live rate editing, user directory, conflict review, and CSV export (`/api/admin/export`). |
| **Banking / Direct Benefit Transfer (DBT)** | None | **SIMULATED** | Payout status and reference IDs are simulated for sandbox demonstration. Live banking credentials must not be added without RBI approval. |
| **Official Odisha Portal Integration** | None | **PROVISIONAL** | Forest department data and procurement thresholds are based on published guidelines but run independently. |

---

## 3. Storage Adapters

### A. Local Storage (Client)
- **Engine:** IndexedDB wrapped by Dexie.js v4.0.8.
- **Persistence:** High-durability local client storage. Retains pending submissions across browser refreshes, device reboots, and airplane mode toggles.
- **Outbox Pattern:** Unsynced weighments and batches are queued in `syncQueue` with retry counts, exponential backoff, and idempotency keys.

### B. Managed Evidence Storage (Server Abstraction)
- **Engine:** `StorageAdapter` interface in `src/lib/server/storage.ts`.
- **Supabase Storage Adapter:** Connects to private managed bucket `banasetu-evidence`. Issues short-lived signed URLs for authenticated access.
- **Local Fallback Adapter:** Writes to local filesystem (`public/uploads`) with sanitized ULID filenames when Supabase is unconfigured.
- **Tamper Protection:** Stream parser calculates SHA-256 digest upon ingress and validates binary magic bytes signatures (JPEG, PNG, WebP, audio).

---

## 4. Verification & Testing Proof

All 12 verification suites run locally without requiring an active internet connection or live external cloud services:

1. `npm run test:i18n` — 189 translation keys, 100% parity across English and Odia.
2. `npm run test:a11y` — 18 automated accessibility, contrast, and label pairing checks.
3. `npm run test:auth` — 32 JWT signature, cookie security, and role permission checks.
4. `npm run test:collector` — 23 tribal collector workflow and draft persistence checks.
5. `npm run test:collection` — 32 intake center weighment and scale math checks.
6. `npm run test:inventory` — 51 warehouse transit shrinkage and quarantine checks.
7. `npm run test:backend` — 22 rate limiting, API error format, and security checks.
8. `npm run test:uploads` — 20 multipart upload, MIME restriction, magic bytes, and hash checks.
9. `npm run test:catalogue` — 125 17-product botanical and Mayurbhanj geography checks.
10. `npm run test:admin` — 19 administration, RBAC clearance, CSV export, and conflict arbitration checks.
11. `npm run test:flows` — 44 route existence, dead-button, and link integrity checks (including `/api/admin/conflicts`).
12. `npm run test:db` — 12 database connection detection, idempotency deduplication, transaction rollback, and relational integrity checks.
