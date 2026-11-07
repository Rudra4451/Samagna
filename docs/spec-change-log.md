# SAMAGNA — SPECIFICATION CHANGE LOG & DISCREPANCY REGISTER

> **Document:** Phase 0 Specification Change Log & Discrepancy Register (Post-Reconciliation Revision)  
> **Authoritative Specification Baseline:** Samagna Product and Technical Specification v1.0  
> **Specification Version:** `v1.0`  
> **Audit Date:** 2026-11-07  
> **Repository Commit:** `c71049bea79d981b2cd88842cfc6cbf9c42e1c30`  
> **Audit Environment:** Existing Local Working Directory (`c:\Users\rudra\Bana Setu`) — *Not a clean clone*  
> **Governance Status:** APPROVED BY PRODUCT OWNER (GATE G0 SIGNED OFF — REMEDIATION AUTHORIZED)  
> **Sign-Off Timestamp:** 2026-11-07T07:57:24+05:30  

---

## 1. Governance & Rules of Engagement

1. **Authoritative Baseline:** *Samagna Product and Technical Specification v1.0* is the sole locked baseline for this verification pass.
2. **Non-Overriding Principle:** Discovering that the existing codebase behaves differently from Specification v1.0 **does not** automatically alter the specification. Discrepancies are logged here for formal review.
3. **Approval Requirement:** Any proposed specification clarification, refinement, or change requires explicit sign-off from the Product Owner before taking effect.
4. **Locked Owner Decisions:** Where the Product Owner has already issued locked rulings (e.g., O4 and O11 regarding the marketplace subsystem), those decisions are applied directly rather than reopened.

---

## 2. Specification Sections Checked & Discrepancy Matrix

| Spec Ruling / Section ID | Topic | Spec v1.0 Baseline Ruling | Implementation Status | Discrepancy / Alignment Summary | PO Approval Required? |
|:---|:---|:---|:---:|:---|:---:|
| **SPEC-01** | Scope & System Purpose | Non-commercial MFP procurement & custody traceability ledger under TDCCOL LABHA scheme. | **SCOPE EXPANSION (O4/O11 LOCKED)** | An extensive B2B/B2C marketplace, outward inventory sales, and buyer commission system exists. Locked decisions O4/O11 govern removal in Phase 2. | **DECIDED (O4/O11)** |
| **SPEC-02** | Numeric Precision & Types | Financial-grade precision for quantities (kg) and payouts (₹). Deterministic reconciliation. | **DISCREPANCY** | All weight and currency fields in `prisma/schema.prisma` are modeled as `Float` (`DOUBLE PRECISION`), risking IEEE-754 rounding imprecision. | **YES** |
| **SPEC-03** | Audit Log Immutability | Chronological, append-only, tamper-evident audit log with database-enforced immutability. | **DISCREPANCY** | `AuditEvent` model in PostgreSQL has zero triggers or permissions revoking `UPDATE`/`DELETE`. Single database role used for both DDL and runtime DML. | **YES** |
| **SPEC-04** | Authentication & RBAC Across Protected Routes | HS256 JWT tokens with role boundaries (`COLLECTOR`, `SHG_FACILITATOR`, `COLLECTION_MANAGER`, `WAREHOUSE_MANAGER`, `SUPERVISOR_ADMIN`). | **AGREES** | Implemented via `jose` HS256 in `src/lib/server/auth.ts`. Independent route handler enforcement across all 16 protected API endpoints. | **NO** |
| **SPEC-05** | Production Demo Isolation | Demo/evaluator accounts strictly barred from granting access in production environments. | **DISCREPANCY** | `src/app/login/page.tsx` renders 1-click evaluator login buttons in all builds without production guards. Environment variable `ALLOW_DEMO_ACCOUNTS=true` allows test persona login. | **YES** |
| **SPEC-06** | Evidence Storage & Privacy | Private object storage with signed short-lived URLs. Strict fail-closed fallback policy. | **AGREES** | `src/lib/server/storage.ts` uses private Supabase Storage, 3600s signed URLs, 5MB limit, magic bytes check, and SHA-256 hash. Fails closed with HTTP 503 if unconfigured. | **NO** |
| **SPEC-07** | Transit Shrinkage Calculation | $1.5\%$ allowable natural loss benchmark. Non-accusatory quarantine segregation. | **PARTIAL** | Formula sign conventions and tolerance margins differ between client (`unexplainedVariance < 0`) and server (`unexplainedVarianceKg > 0.05 kg`). | **YES** |
| **SPEC-08** | Public QR Verification | Privacy-preserving provenance verification (`/verify/[code]`) with zero PII exposure. | **AGREES (WITH ENUMERATION RISK)** | Route `/api/batches/[id]` strictly masks gatherer PII, phone numbers, and bank details, but sequential codes (`BS-402`) allow batch enumeration. | **YES** |
| **SPEC-09** | Offline Resilience & Outbox | Local-first operation via Dexie IndexedDB with idempotent synchronization. | **AGREES** | Client Dexie outbox, ULID idempotency keys, and server-side deduplication verified across test suites. | **NO** |
| **SPEC-10** | Institutional Governance Inputs | Designates institutional counterparty (O1) and Gate G1 timeline (O3). | **PENDING INPUT** | O1 and O3 require product-owner factual inputs. | **YES** |

---

## 3. Detailed Discrepancy Analysis & Implementation Sequence

### Discrepancy 1: Outward Stock Sales & Commercial Marketplace (SPEC-01)
- **Specification v1.0 Mandate:**
  - Samagna is specified as a statutory tribal Minor Forest Produce custody and traceability ledger designed to record field collections, scale weighments, vehicle transit dispatches, warehouse arrivals, and quarantine reconciliations under the Odisha LABHA scheme.
- **Existing Implementation Behavior:**
  - The repository contains an active B2B/B2C marketplace (`src/app/marketplace/`), commercial cart store (`src/store/useCartStore.ts`), commercial accounting logic (`src/lib/marketplace.ts`), outward stock allocation in warehouse inventory (`src/app/inventory/page.tsx`), and three commercial revenue tabs in the admin console (`src/app/admin/page.tsx`).
- **Application of Locked Owner Decisions (O4 & O11):**
  - **Decision Status:** ALREADY LOCKED BY PRODUCT OWNER.
  - **Mandated Execution Sequence:**
    1. **Preserve Prototype:** The commercial marketplace prototype shall be preserved with Git tag `archive/marketplace-prototype`.
    2. **Phase 0 Restraint:** Inspect outward allocation and sales during Phase 0 without modifying files. Do not create the Git tag or delete routes during Phase 0.
    3. **Phase 2 Removal:** Remove marketplace routes and commercial files during Phase 2 according to the locked specification and approved implementation sequence.
- **Remaining Technical Implementation Questions:**
  - *Technical Question T1:* How should warehouse inventory outward allocation (`handleExecuteSale` and `InventorySale`) be decoupled from commercial buyer concepts when marketplace routes are removed in Phase 2?
  - *Technical Question T2:* Should outward bulk transfers to government central processing plants (e.g. TDCCOL Baripada Processing Unit) retain a minimal non-commercial warehouse dispatch ledger model within Phase 1?

---

### Discrepancy 2: Decimal Precision for Weights and Currencies (SPEC-02)
- **Specification v1.0 Mandate:**
  - Procurement weighments and financial payouts must be recorded with exact deterministic precision, avoiding rounding distortions.
- **Existing Implementation Behavior:**
  - `prisma/schema.prisma` uses `Float` (`DOUBLE PRECISION` in PostgreSQL) for all weights (`grossWeightKg`, `tareWeightKg`, `netAcceptedKg`, `arrivalNetWeightKg`) and monetary fields (`ratePerKg`, `grossPayout`).
- **Discrepancy Severity:** HIGH
- **Proposed Clarification / Change:**
  - Update Specification v1.0 database guidelines to explicitly mandate `DECIMAL(10, 2)` or integer grams for physical weights and integer paise for monetary payouts.
  - Schedule schema migration in Release 1.
- **Product Owner Approval:** **REQUIRED**

---

### Discrepancy 3: Database-Level Immutability & Role Separation (SPEC-03)
- **Specification v1.0 Mandate:**
  - The audit log must be legally robust, tamper-evident, and immutable against administrative tampering.
- **Existing Implementation Behavior:**
  - `AuditEvent` is a mutable table in PostgreSQL without triggers, database rules, or revoked update/delete privileges.
  - The database connection string connects as the single table owner for both migration DDL and runtime DML.
  - A trigger alone is insufficient if the runtime connection retains superuser or table owner permissions (which allow `ALTER TABLE ... DISABLE TRIGGER`).
- **Discrepancy Severity:** CRITICAL
- **Proposed Clarification / Change:**
  - Update Specification v1.0 Section 6 to mandate true database-level immutability:
    1. Distinct database roles: a migration DDL role (`banasetu_migrator`) and a runtime application role (`banasetu_app`).
    2. `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "AuditEvent" FROM banasetu_app;`
    3. An append-only trigger raising an exception on any modification attempt.
- **Product Owner Approval:** **REQUIRED**

---

### Discrepancy 4: Demo Persona Login in Production Builds (SPEC-05)
- **Specification v1.0 Mandate:**
  - Sandbox evaluation mechanisms must be strictly segregated from production authentication gateways.
- **Existing Implementation Behavior:**
  - 1-Click Evaluator Persona buttons are rendered unconditionally in `src/app/login/page.tsx`. If `ALLOW_DEMO_ACCOUNTS=true` is set, test personas authenticate with `Test@Pass123` and gain visual access to `/admin` and operational dashboards.
- **Discrepancy Severity:** HIGH
- **Proposed Clarification / Change:**
  - Clarify Spec v1.0 Section 2 to state: "Demo personas and evaluation quick-login elements shall be stripped from production build bundles or conditionally compiled only when `NEXT_PUBLIC_ENABLE_DEMO_PERSONAS === 'true'` in non-production environments. Server layout guards shall reject demo sessions in production mode."
- **Product Owner Approval:** **REQUIRED**

---

### Discrepancy 5: Client/Server Shrinkage Math & Threshold Alignment (SPEC-07)
- **Specification v1.0 Mandate:**
  - Natural transit shrinkage tolerance benchmark is $1.5\%$. Discrepancies exceeding allowable shrinkage shall be segregated into quarantine.
- **Existing Implementation Behavior:**
  - Client flags quarantine on any negative variance ($\text{unexplainedVariance} < 0$).
  - Server flags quarantine only when excess loss exceeds $0.05\text{ kg}$ (`shrinkageDeficitThresholdKg`).
  - Client uses negative sign for loss; server computes positive excess loss, flips it to negative on insert, and returns positive in API response.
- **Discrepancy Severity:** MEDIUM
- **Proposed Clarification / Change:**
  - Harmonize the specification: explicitly document that a $0.05\text{ kg}$ rounding threshold applies before quarantine is triggered, and define a single authoritative sign convention (Deficit $= \text{Arrival Net} - \text{Expected Net}$; Discrepancy triggered if $\text{Deficit} < -0.05\text{ kg}$).
- **Product Owner Approval:** **REQUIRED**

---

### Discrepancy 6: Public Verification Code Entropy & Sequential Enumeration (SPEC-08)
- **Specification v1.0 Mandate:**
  - Public batch verification shall allow consumers and auditors to verify batch provenance without exposing gatherer PII or enabling bulk data harvesting.
- **Existing Implementation Behavior:**
  - Batches use sequential identifiers (`BS-400`, `BS-402`), enabling public batch enumeration.
- **Discrepancy Severity:** HIGH
- **Proposed Clarification / Change:**
  - Amend Spec v1.0 Section 4: "Public QR verification URLs shall incorporate a high-entropy random lookup key (e.g. `BS-402-v7F2k9M`) to prevent sequential code guessing, while physical bag stencil tags retain the human-readable batch code `BS-402`."
- **Product Owner Approval:** **REQUIRED**

---

## 4. Pending Product Owner Directives

The following configuration parameters remain pending Product Owner input:

1. **O1 — Institutional Counterparty Name:**
   - Current status: `OWNER INPUT REQUIRED`
   - Baseline options: TDCCOL Mayurbhanj / NIC MeghRaj / "none yet".
2. **O3 — Target Gate G1 Date:**
   - Current status: `OWNER INPUT REQUIRED`
   - Target date for completion of Phase 1 hardening and transition to staging.

---

## 6. Phase 10 — Business Intelligence, Operational Reporting & Enterprise Traceability

### 6.1 Objective Accomplished
Integrated cross-value-chain business intelligence and verifiable enterprise traceability across Institutional (B2G), B2B Bulk Trade, Processing & Value-Addition, and Commercial Operations.

### 6.2 Data Fidelity Specification
Every operational report metric, table column, and custody checkpoint explicitly categorizes its data fidelity:
1. `ACTUAL`: Primary physical records verified via electronic weighment scales, signed gate passes, bank remittance IDs, or lab assay certificates.
2. `ESTIMATED`: Algorithmic moisture shrinkage allowances ($1.5\% - 2.0\%$), standard milling recovery benchmarks ($78\%$), or seasonal calendar projections.
3. `MISSING`: Field unrecorded, gate-inward pending, or lab assay certificates absent.

### 6.3 Collector Privacy Protection & PII Redaction
- **Zero Raw PII Leakage:** Primary tribal gatherer names are cryptographic-masked (`maskCollectorName` $\to$ `S***** S**** [PRIMARY GATHERER]`), government IDs are masked (`OR-***-0842`), and banking/payout details are strictly redacted (`[STATUTORY_PRIVACY_PROTECTED]`) in all commercial dossiers, public verification endpoints, and exported packages.
- **Controlled Exports:** Evidence packages exported in JSON or CSV are sanitized with OWASP CWE-1236 formula injection defenses (prefixing triggers `=+-@\t\r` with single quotes `'`).
- **Free Collector Access Invariant:** Primary collector platform deductions are strictly ₹0.00 (`collectorFeeProtectionVerified === true`), guaranteeing statutory MSP protection.

### 6.4 Verification Evidence
- Automated test suite `scripts/test-business-intelligence.ts` executed with **89/89 passed checks (100%)**.
- End-to-end regression suite `npm run test:all` executed with **34/34 test suites passing (0 failures)**.
- Next.js production build `npm run build` compiled all 63 static and dynamic routes with exit code 0.

---

## 7. Phase 11 — Samagna Multi-Experience UX Integration

### 7.1 Objective Accomplished
Delivered a cohesive yet audience-specific multi-experience user interface covering all 12 distinct platform experiences across the Samagna value chain:
1. Public Website (`/`, `/verify`, `/privacy`, `/terms`)
2. Collector Experience (`/collector`)
3. Facilitator Experience (`/facilitator`)
4. Collection Management (`/collection`)
5. Warehouse & Inventory (`/inventory`, `/warehouse`)
6. Institutional Administration (`/institutional`, `/admin`)
7. B2B Trade & RFQ (`/trade`, `/marketplace/b2b`, `/marketplace/rfq`)
8. Processing & Value-Addition (`/processing`)
9. Logistics & Fulfilment (`/logistics`)
10. B2C Consumer Storefront (`/store`, `/store/[slug]`, `/store/cart`, `/store/checkout`, `/store/account`)
11. Partner Distribution Network (`/distribution`)
12. Commercial Administration, Revenue & BI (`/revenue`, `/ecosystem`, `/reports`)

### 7.2 Audience-Specific UX Differentiation
- **Non-Homogenized Shell Architecture:** Avoided forcing identical layouts onto incompatible personas.
  - *Tribal Collector (`/collector`):* Mobile-first 480px centered viewport, `CollectorTabBar`, low-literacy touch targets (min 44px), bilingual Odia/English toggle, voice prompt support, and 100% offline Dexie IndexedDB resilience.
  - *Desk Managers (`/collection`, `/inventory`):* Dedicated `ManagerSidebar` with tabular density, scale readout hooks, and batch quarantine workflows.
  - *Facilitators (`/facilitator`):* Centered 4-column group aggregation views and member passbooks.
  - *Commercial & Institutional Dashboards (`/institutional`, `/trade`, `/processing`, `/logistics`, `/distribution`, `/revenue`, `/ecosystem`, `/reports`):* High-density full-width utilitarian layouts with `OrganisationContextBar`.
  - *Consumer Store & Public (`/`, `/store`, `/verify`):* Organic editorial brand presentation with Oswald headers, photo plates, and botanical storytelling.

### 7.3 Tenant Organisation Context & Invariants
- **`OrganisationContextBar`:** Unifies cross-module enterprise sessions by surfacing active tenant entity, category badge (State Institutional Apex, B2B Commercial Buyer, Primary Processing Facility, Logistics Carrier, Retail Distribution Partner), statutory verification badge, and district jurisdiction.
- **Collector Protection Invariant:** Prominently enforces that tribal primary gatherers are 100% exempt from platform deductions (`Collector 0% Platform Fee Protected · Statutory MSP Enforcement Active`).

### 7.4 Value-Chain Notification Center
- **`NotificationDrawer`:** Real-time accessible slide-over drawer aggregating categorized alerts across the ecosystem:
  - Deliverable sign-offs requiring district administrative approval.
  - RFQ bids and quotations requiring buyer/supplier review.
  - Milling recovery benchmarks and SLA completion slips.
  - Freight dispatches and multi-leg transit chain of custody transfers.
  - Offline local ledger synchronization confirmations.
- Includes dynamic unread badge counter in top bar, filter tabs (`All`, `Action Required`, `Custody & Lots`, `Commercial`), and direct actionable routing.

### 7.5 Multi-Experience Suite Launcher
- **`AppLauncherModal`:** Accessible modal organizing all 12 platform experiences into 4 logical suites:
  1. *Field & Gathering Operations* (Collector, Facilitator, Collection Desk, Warehouse).
  2. *Commercial Value Chain* (B2B Trade, Processing, Logistics, Partner Distribution).
  3. *Consumer & Public Provenance* (B2C Storefront, Public Verification).
  4. *Governance & Commercial Admin* (Institutional B2G, Revenue Settlements & BI Reports).
- Displays clear clearance badges, bilingual titles, and active route markers.

### 7.6 State Views & Interaction Hygiene
- Standardized `StateViews.tsx` primitives (`LoadingState`, `ErrorState`, `SuccessState`, `EmptyStateView`) with WCAG 2.1 AA accessibility tokens (`aria-busy`, `role="status"`, `role="alert"`).
- Extended demo role switcher in `TopBar.tsx` supporting 10 distinct personas mapped directly to operational and commercial routes.
- Zero dead buttons, dummy handlers, or inert `#` links.

### 7.7 Verification Evidence
- Automated test suite `scripts/test-multi-experience-ux.ts` executed with **78/78 checks passed (100%)**.
- Complete regression suite `npm run test:all` executed with **35/35 test suites passing (0 failures)**.
- Next.js production build `npm run build` compiled all 63 static and dynamic routes with exit code 0.

