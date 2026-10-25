# Samagna (ସମଗ୍ନ) · BanaSetu

> **Minor Forest Produce (MFP) Procurement & Traceability Custody Ledger**<br />
> **Jurisdiction:** Mayurbhanj District, Government of Odisha<br />
> **Scheme Alignment:** Tribal Development Cooperative Corporation of Odisha Ltd. (TDCCOL) & 100% State-Funded LABHA Scheme (*Laghu Bana Jatiya Dradya Kraya*)<br />
> **Target Demographic:** 1.4 Million Tribal Primary Gatherers across Mayurbhanj & Similipal Biosphere Reserve<br />
> **Design Identity:** Authentic Editorial Field Ledger (`#E86033` Terracotta, `#243828` Deep Forest Green, `#FAF6F0` Warm Parchment, `#FFFFFF` Ledger White)

---

## 1. Project Mission & Context

**Samagna** (ସମଗ୍ନ — *"Complete, Integrated, Harmonious"*, operationalized as **BanaSetu**, *"The Forest Bridge"*) is a purpose-built digital procurement and traceability custody ledger engineered for tribal Minor Forest Produce (MFP) collectors in Mayurbhanj, Odisha.

Under traditional procurement models, primary tribal forest gatherers frequently faced systemic vulnerabilities: delayed cash settlements, arbitrary quality downgrades, non-transparent scale deductions, and punitive weight penalties disguised as "transit shrinkage."

Samagna provides an end-to-end, tamper-evident digital chain of custody from deep forest collection centers to central district warehouses:

1. **Low-Literacy First Design:** Zero-typing workflows, large tactile stepper interfaces, authentic botanical photography, native Odia typography (Noto Sans Oriya), and Web Speech synthesis ("Listen to Rate") for non-literate and elder gatherers.
2. **Dual-Ledger Offline Resilience:** Full operational capability in deep forest terrain without cellular connectivity via client-side IndexedDB (`dexie`). Queued transactions sync idempotently to a central PostgreSQL database when connectivity is restored.
3. **Non-Accusatory Shrinkage Segregation:** Natural botanical moisture loss in transit is mathematically verified against botanical moisture thresholds. Allowable shrinkage is absorbed by state logistics rather than deducted from gatherer payments; quarantined discrepancies are flagged for supervisor review.
4. **Verifiable Custody & Public Traceability:** Every procurement generates a unique receipt and bag tag with QR code verification. Citizens and oversight bodies can verify batch history via `/verify/[code]` with automated PII masking.

---

## 2. Key Architecture & Technical Highlights

```
                                      ┌────────────────────────────────────────┐
                                      │       CLIENT / FIELD BROWSER           │
                                      │  (Offline-First PWA via IndexedDB)     │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                        Offline Mutations│  Local Queries
                                        via Dexie 4.x    │  & Drafts
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │         Client-Side Ledger             │
                                      │     IndexedDB ("banasetu_db")          │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                    Bidirectional Sync   │ Idempotent POST /api/sync
                                    (When Online)        │ with client-generated UUIDs
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │         Next.js 14 App Router          │
                                      │   Server Route Handlers & Auth Guard   │
                                      │     (HS256 JWT in HttpOnly Cookie)     │
                                      └──────────────────┬─────────────────────┘
                                                         │
                                       Prisma ORM 5.x    │ Server-side Storage API
                                                         ▼
                                      ┌────────────────────────────────────────┐
                                      │       Central PostgreSQL Database      │
                                      │      (Supabase / Standard Postgres)    │
                                      └────────────────────────────────────────┘
```

- **Framework:** Next.js 14 (App Router) with React 18, TypeScript 5, and Tailwind CSS 3.4.
- **Client Persistence:** Dexie.js (IndexedDB wrapper) enabling 100% offline intake, draft saving, and conflict-free client reconciliation.
- **Server Persistence:** PostgreSQL managed via Prisma ORM 5.22, with support for Supabase connection pooling and direct connection failover.
- **Session Security:** Cryptographic HS256 JWT tokens via `jose`, stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with 8-hour shift expiry.
- **Production Guard:** `AUTH_SECRET` must be $\ge 32$ characters in production; missing, default, or weak secrets strictly refuse to start authentication.
- **Rate Limiting:** In-memory sliding-window request throttling on sensitive endpoints (max 10 login attempts per 60 seconds).
- **Evidence Pipeline:** Dual storage engine (local file storage + private Supabase Storage buckets) with MIME verification, magic bytes validation, and SHA-256 cryptographic image hashing.

---

## 3. User Roles & Workspace Tiers

The application enforces strict server-side Role-Based Access Control (RBAC) across five discrete field personas plus a public verification portal:

| Role Persona | Route | Permitted Capabilities & Responsibilities | Prohibited Boundaries |
|:---|:---|:---|:---|
| **Tribal Collector**<br>(*e.g., Rami Majhi*) | `/collector` | Submit pickup requests, view MSP rate cards, listen to audio rates, save offline drafts, inspect personal receipt ledger. | Cannot access scales, alter warehouse inventory, or configure rates. |
| **SHG Facilitator**<br>(*e.g., Sumitra Soren*) | `/facilitator` | Aggregation oversight, village cluster coordination, proxy assistance for non-literate and elder forest gatherers. | Cannot verify warehouse dispatches or access admin console. |
| **Collection Manager**<br>(*e.g., Bikram Marndi*) | `/collection` | Operate aggregation center scale, record gross and tare bag weights, issue physical receipts and printable QR bag tags. | Cannot modify base rate cards, override shrinkage quarantine, or delete audit logs. |
| **Warehouse Manager**<br>(*e.g., Debasis Das*) | `/inventory` | Central depot intake at Baripada, arrival gross/tare re-weighing, botanical transit shrinkage calculation, quarantine isolation. | Cannot retroactively alter field weight certificates or modify user accounts. |
| **District Supervisor**<br>(*e.g., District DPO*) | `/admin` | District oversight dashboard, configure MSP procurement rates, review quarantined batches, export immutable CSV audit ledger. | Bound by append-only audit trail logging. |
| **Public Verifier**<br>(*Citizen / Inspector*) | `/verify` | Inspect public procurement certificates and verify QR codes (`/verify/[code]`) with automated PII masking. | Read-only. Aadhaar, bank accounts, and phone numbers are permanently masked. |

---

## 4. Quickstart & Local Execution

### Prerequisites

- **Node.js:** 20.x or higher (LTS recommended)
- **npm:** 10.x or higher
- **PostgreSQL:** Optional for local development (application operates with full offline Dexie mock fallback when PostgreSQL is unset)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/Rudra4451/bana-setu.git
cd bana-setu

# 2. Install dependencies cleanly
npm ci

# 3. Configure environment variables
cp .env.example .env.local

# 4. Generate Prisma Client
npx prisma generate

# 5. (Optional) Push schema to local PostgreSQL database
# npx prisma db push

# 6. Run automated verification suites
npm run test:all

# 7. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Variables Reference

Create `.env.local` for local execution or configure these variables in your deployment dashboard:

| Variable Name | Required | Default / Example | Purpose |
|:---|:---:|:---|:---|
| `AUTH_SECRET` | **Yes (Prod)** | Random 32+ character string | Cryptographic key used to sign and verify HS256 JWT session cookies. In production, missing or weak keys will reject authentication. |
| `DATABASE_URL` | Optional | `postgresql://user:pass@host:5432/db` | Connection URI for PostgreSQL database. When absent, app safely falls back to client-side Dexie IndexedDB. |
| `NODE_ENV` | Optional | `development` | Runtime environment mode (`development`, `production`, `test`). |
| `NEXT_PUBLIC_APP_URL` | Optional | `http://localhost:3000` | Canonical origin for generating QR codes, verification URLs, and redirect targets. |
| `ALLOW_DEMO_ACCOUNTS` | Optional | `true` (dev only) | Permits 1-Click persona quick-switching on `/login`. Automatically disabled in production. |
| `SUPABASE_URL` | Optional | `https://[ref].supabase.co` | Managed Supabase Storage URL for durable photo and scale evidence uploads. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `[secret-service-role-key]` | Server-only privileged service role key for private evidence bucket access. |
| `SUPABASE_STORAGE_BUCKET` | Optional | `banasetu-evidence` | Name of the private Supabase evidence bucket. |

---

## 6. Verification Test Suites Matrix

The repository contains 24 automated test suites verifying institutional correctness, accessibility, cryptographic security, and business logic. Run individual suites or execute the complete test pipeline via `npm run test:all`:

| Test Command | Scope & Verified Logic | Total Checks |
|:---|:---|:---:|
| `npm run test:i18n` | Bilingual English/Odia parity across all translation keys | 189 keys (100% parity) |
| `npm run test:a11y` | WCAG 2.1 AA token contrast ratios, keyboard accessibility, ARIA | 18 checks |
| `npm run test:auth` | Production secret hardening, JWT cookies, RBAC route guards, logout | 63 checks |
| `npm run test:collector` | Collector pickup flow, offline drafts, audio speech fallback | 23 checks |
| `npm run test:collection` | Scale math (gross - tare = net), receipt generation, idempotency | 32 checks |
| `npm run test:inventory` | Transit shrinkage math, botanical tolerance, quarantine bay, dispatches | 51 checks |
| `npm run test:backend` | Sliding-window rate limiting, HTTP error schemas, security headers | 22 checks |
| `npm run test:uploads` | Multipart parser, MIME whitelist, magic bytes validation, SHA-256 | 14 checks |
| `npm run test:catalogue` | 17 verified MFP species, Mayurbhanj forest blocks, botanical rates | 125 checks |
| `npm run test:admin` | Admin clearance, rate card adjustments, immutable CSV export | 14 checks |
| `npm run test:flows` | Route integrity, interactive element audit, zero dead links | 43 checks |
| `npm run test:db` | Database connection handling and graceful offline fallback | 12 checks |
| `npm run test:sales` | Warehouse stock depletion and outward dispatch allocation | 15 checks |
| `npm run test:sync-cross` | Cross-device client-server synchronization idempotency | 18 checks |
| `npm run test:batch5a` | Advanced security controls and tamper resistance | 20 checks |
| `npm run test:batch5b` | Role boundary enforcement and unauthenticated redirection | 16 checks |
| `npm run test:pdf` | Binary PDF collection receipt generation | 8 checks |
| `npm run test:tags` | Printable PDF bag tag with QR code data stream | 8 checks |
| `npm run test:audit-pdf` | District audit trail PDF report rendering | 8 checks |
| `npm run test:filter-hydration`| Filter bar state preservation and hydration stability | 10 checks |
| `npm run test:sidebar-nav` | Collection manager navigation consistency | 8 checks |
| `npm run test:inventory-sidebar-nav` | Inventory warehouse navigation consistency | 8 checks |
| `npm run test:product-guidance` | Authentic botanical images and asset integrity | 22 checks |
| `npm run test:senior-qa` | Senior QA audit across all routes, buttons, and endpoints | 138 checks |
| **`npm run test:all`** | **Comprehensive Full System Verification Pipeline** | **700+ checks (100% PASS)** |

---

## 7. Codebase Directory Structure

```
bana-setu/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI workflow (least-privilege, lint, test, build)
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── seed.ts                # Database seeder for Mayurbhanj administrative units & products
├── public/
│   ├── products/              # Authentic high-resolution botanical photography
│   └── icons/                 # PWA icons and SVG graphics
├── scripts/                   # 24 automated verification test suites
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Authentication portal with 1-Click Persona switcher
│   │   ├── admin/             # District DPO Admin dashboard & rate card editor
│   │   ├── collection/        # Collection center scale weighment & receipt issuing
│   │   ├── collector/         # Tribal collector pickup requests & rate cards
│   │   ├── facilitator/       # SHG cluster aggregation & elder assistance
│   │   ├── inventory/         # Warehouse depot intake, transit shrinkage & stock
│   │   ├── verify/            # Public certificate & QR code verification portal
│   │   ├── api/               # Server Route Handlers (auth, sync, rates, uploads, admin)
│   │   └── layout.tsx         # Root layout with bilingual metadata and typography
│   ├── components/
│   │   ├── ui/                # Accessible design system primitives (buttons, dialogs, cards)
│   │   ├── layout/            # Navigation headers, bilingual switchers, and sidebars
│   │   └── shared/            # QR generators, status badges, and audio rate readouts
│   └── lib/
│       ├── client/            # Dexie IndexedDB client database & offline outbox
│       ├── server/            # Auth JWT, RBAC guards, rate limiter, storage, Prisma
│       ├── config/            # MFP botanical species catalog & Mayurbhanj geography
│       └── i18n/              # English & Odia translation dictionaries
├── .editorconfig              # Consistent multi-editor formatting rules
├── .eslintrc.json             # Compatible ESLint configuration (next/core-web-vitals)
├── netlify.toml               # Netlify deployment configuration (no hardcoded secrets)
├── package.json               # Dependencies and verification scripts
├── ARCHITECTURE.md            # Technical architecture deep-dive
├── SECURITY.md                # Security posture, RBAC specifications & audit assessment
└── WHAT_IS_REAL.md            # Complete disclosure of real vs. simulated sandbox boundaries
```

---

## 8. Real Code vs. Sandbox Boundaries

To ensure complete transparency during technical reviews and institutional evaluations, the system boundaries are documented below:

| Component | Implementation Status | Technical Details |
|:---|:---:|:---|
| **Procurement & Scale Math** | **100% Real Code** | Gross, tare, and net weighment calculations with botanical moisture shrinkage thresholds are executed in real time. |
| **Offline IndexedDB Storage** | **100% Real Code** | Dexie.js database creates real persistent tables in browser IndexedDB, supporting full offline usage and sync. |
| **Authentication & RBAC** | **100% Real Code** | Real HS256 JWT tokens, bcrypt password verification, cookie issuance, and server-side role boundary checks. |
| **Durable Evidence Storage** | **Hybrid / Dual Mode** | Full Supabase Storage integration with short-lived signed URLs; falls back to local disk storage when Supabase is unconfigured. |
| **Banking DBT Settlements** | **Simulated Sandbox** | Payout reference numbers (e.g. `PAY-MAYURBHANJ-xxx`) are simulated. Live DBT integration requires formal banking clearance with RBI and state treasury. |
| **SMS Notification Gateway** | **Simulated Sandbox** | Logs SMS dispatch events and verification payloads. Live delivery requires authorized CDAC/NIC gateway credentials. |
| **Aadhaar Verification** | **Privacy Masked** | In compliance with Indian data privacy statutes, Aadhaar numbers are never stored in raw form and are masked across all interfaces. |

For an itemized breakdown, see [`WHAT_IS_REAL.md`](./WHAT_IS_REAL.md).

---

## 9. System Documentation Index

The repository includes a comprehensive institutional documentation suite:

- **[`WHAT_IS_REAL.md`](./WHAT_IS_REAL.md):** Transparent disclosure of real code vs simulated sandboxes.
- **[`ARCHITECTURE.md`](./ARCHITECTURE.md):** Technical deep-dive into dual-database architecture, JWT sessions, and sync protocols.
- **[`SECURITY.md`](./SECURITY.md):** Security posture, RBAC boundary enforcement, rate limiting, and dependency audit assessment.
- **[`ACCESSIBILITY.md`](./ACCESSIBILITY.md):** WCAG 2.1 AA token contrast ratios, keyboard shortcuts, and screen reader design.
- **[`FEATURES.md`](./FEATURES.md):** Complete functional catalog across all 5 user tiers.
- **[`STATES.md`](./STATES.md):** State machines for batch lifecycles, shrinkage segregation, and offline outbox sync.
- **[`DECISIONS.md`](./DECISIONS.md):** Architecture Decision Records (ADRs 01–05).
- **[`DEPLOY.md`](./DEPLOY.md):** Clean-clone setup, PostgreSQL migration commands, and containerization.
- **[`FINAL_QA.md`](./FINAL_QA.md):** Comprehensive test results, walkthroughs, and edge cases.
- **[`IMPLEMENTATION_GAP_AUDIT.md`](./IMPLEMENTATION_GAP_AUDIT.md):** Master requirement-by-requirement gap audit.

---

## 10. Authorship & Project Attribution

- **Project Lead & Maintainer:** Rudra Narayan Panda ([@Rudra4451](https://github.com/Rudra4451))
- **Reference Domain:** Tribal Development Cooperative Corporation of Odisha Ltd. (TDCCOL) & District Administration of Mayurbhanj, Odisha.
- **Repository:** [https://github.com/Rudra4451/bana-setu](https://github.com/Rudra4451/bana-setu)
