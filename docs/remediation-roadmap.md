# SAMAGNA — REMEDIATION ROADMAP & IMPLEMENTATION PLAN

> **Document Type:** Authoritative Remediation Strategy & Implementation Roadmap  
> **System:** Samagna Minor Forest Produce (MFP) Custody, Traceability & Commercial Platform  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Target Release:** Samagna v1.1-Production-Hardened  
> **Author:** Principal Security Engineer & Senior Full-Stack Architect  
> **Date:** 2026-11-07  
> **Status:** PROPOSED & SUBMITTED FOR PRODUCT OWNER GATE G0 APPROVAL  

---

## 1. Roadmap Overview & Phasing

To transition Samagna from its current status (**NOT READY FOR PRODUCTION; CONDITIONALLY READY FOR STAGING**) to **FULL PRODUCTION CERTIFICATION**, the following 5-phase remediation plan is established.

Every phase specifies strict prerequisites, risk controls, roll-back strategies, and acceptance verification criteria.

```
┌────────────────────────────────────────────────────────┐
│ Phase 0: Gate G0 Governance Approval & Owner Sign-Off   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 1: P0 Supply-Chain & Framework Security Patching │
│ - Next.js 14.2.24+ / 15.x upgrade                      │
│ - Dependency CVE remediation & build verification      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 2: P0 Database Precision & Financial Migration    │
│ - Migrate Float -> Decimal (PAISE / WEIGHTS)           │
│ - Precision migration script & schema update           │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 3: P1 Database Hardening & Credential Stripping   │
│ - PostgreSQL AuditEvent immutability trigger & DB user │
│ - Strip demo accounts/credentials from prod bundles    │
│ - High-entropy QR verification slugs                   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 4: P2 Infrastructure Scalability & Observability │
│ - Shared Redis/Upstash sliding-window rate limiting   │
│ - End-to-end browser user journey automated testing    │
│ - Structured audit forwarding & health telemetry       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│ Phase 5: Production Verification & Release Gates G1/G2 │
│ - Full 35-suite regression run & security re-scan      │
│ - Executive sign-off for Mayurbhanj District launch    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Phase-by-Phase Remediation Plan

### Phase 0: Governance Sign-Off & Architectural Decisions
- **Objective:** Secure formal Product Owner approval for the audit deliverables and authorize the start of code and dependency modifications.
- **Key Decisions Required:**
  1. Approve the Next.js upgrade strategy: whether to apply the non-breaking patch release (`14.2.24+`) or execute the major version migration to Next.js `15.x`. *(Recommended: `14.2.24+` patch update to maintain zero breaking changes to React 18 and current route handlers).*
  2. Approve the numeric precision strategy: whether to use PostgreSQL `DECIMAL(12, 2)` or integer paise for monetary amounts, and `DECIMAL(10, 3)` for weights. *(Recommended: `DECIMAL` mapping in Prisma with integer paise internal arithmetic in revenue services).*
  3. Authorize Gate G0 progression to Phase 1.
- **Prerequisites:** Product Owner review of `docs/security-audit-report.md` and `docs/security-findings-register.md`.
- **Deliverable:** Signed Gate G0 record in `docs/spec-change-log.md`.

---

### Phase 1: P0 Supply-Chain & Framework Security Patching
- **Target Vulnerabilities:** `SEC-CRIT-01` (GHSA-p293-qw3h-jr36), `SEC-HIGH-01` (GHSA-2xp9-vwfh-vxw4, GHSA-2464-fhr4-w9xw).
- **Actions:**
  1. Create a dedicated Git branch: `security/p0-framework-upgrade`.
  2. Update `next` in `package.json` to `14.2.24` (or latest stable `14.2.x` release that resolves the Windows RCE and image optimizer advisories).
  3. Re-run `npm install` and verify `package-lock.json` dependency graph.
  4. Run `npm audit` to verify that critical vulnerabilities in `next` are eliminated.
  5. Run `npm run build` to confirm zero compilation or TypeScript typing errors.
  6. Execute the full test suite (`npm run test:all`) to verify backward compatibility.
- **Rollback Plan:** Revert `package.json` and `package-lock.json` to base commit `c71049b`.
- **Acceptance Gate:** Zero critical vulnerabilities reported by `npm audit`; all 35 test suites pass.

---

### Phase 2: P0 Database Numeric Precision & Financial Migration
- **Target Vulnerabilities:** `SEC-HIGH-02` (IEEE-754 Floating-Point Precision Risks).
- **Actions:**
  1. Branch: `security/p0-database-precision-migration`.
  2. In `prisma/schema.prisma`, update numeric field types:
     - Monetary fields (`ratePerKg`, `grossPayout`, `referenceRatePerKg`, `salePricePerKg`, `totalAmount`) -> `@db.Decimal(12, 2)`.
     - Physical weight fields (`weightKg`, `grossWeightKg`, `tareWeightKg`, `netAcceptedKg`, `arrivalGrossWeightKg`, `arrivalTareWeightKg`, `arrivalNetWeightKg`, `shrinkageKgAllowed`, `unexplainedVarianceKg`) -> `@db.Decimal(10, 3)`.
  3. Generate PostgreSQL migration SQL:
     ```sql
     -- Migration: FloatToDecimalPrecision
     ALTER TABLE "CollectorContribution"
       ALTER COLUMN "weightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "ratePerKg" TYPE NUMERIC(12, 2),
       ALTER COLUMN "grossPayout" TYPE NUMERIC(12, 2);

     ALTER TABLE "Step1FieldVerification"
       ALTER COLUMN "grossWeightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "tareWeightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "netAcceptedKg" TYPE NUMERIC(10, 3);

     ALTER TABLE "Step2WarehouseVerification"
       ALTER COLUMN "arrivalGrossWeightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "arrivalTareWeightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "arrivalNetWeightKg" TYPE NUMERIC(10, 3),
       ALTER COLUMN "shrinkageKgAllowed" TYPE NUMERIC(10, 3),
       ALTER COLUMN "unexplainedVarianceKg" TYPE NUMERIC(10, 3);
     ```
  4. Update Zod validation schemas in `src/lib/server/validations.ts` to enforce precision bounds without lossy float casting.
  5. Execute unit tests verifying that financial math operations retain exact paise precision across cumulative additions.
- **Rollback Plan:** PostgreSQL down-migration script restoring original column definitions if regressions occur during testing.
- **Acceptance Gate:** Database migration executes cleanly; zero precision drift in `npm run test:collection`, `npm run test:inventory`, and `npm run test:revenue`.

---

### Phase 3: P1 Database Hardening & Credential Stripping
- **Target Vulnerabilities:** `SEC-HIGH-03` (AuditLog Immutability), `SEC-HIGH-04` (Hardcoded Demo Personas), `SEC-MED-02` (Sequential Batch Code Enumeration), `SEC-MED-03` (Shrinkage Parity Divergence).
- **Actions:**
  1. **PostgreSQL Audit Log Immutability:**
     - Deploy a PostgreSQL trigger preventing any `UPDATE` or `DELETE` on the `"AuditEvent"` table.
     - Document runtime PostgreSQL user permissions requiring a non-owner database user.
  2. **Production Bundle Tree-Shaking for Test Accounts:**
     - Wrap demo persona accounts and quick-login components with build-time guards (`process.env.NEXT_PUBLIC_APP_ENV !== 'production'`).
     - Ensure production builds (`next build`) completely exclude `SAFE_TEST_ACCOUNTS` and test credentials from the client JavaScript bundle.
  3. **High-Entropy QR Verification Slugs:**
     - Add a `verificationSlug` field (`String @unique @default(cuid())`) to the `Batch` model.
     - Update `/verify/[code]` and QR tag generators to route via high-entropy slugs, preventing sequential harvest attacks.
  4. **Isomorphic Shrinkage Math Utility:**
     - Consolidate shrinkage formulas into `src/lib/shared/shrinkageMath.ts`, imported by both the warehouse UI and backend validation schemas to eliminate calculation parity divergence.
- **Acceptance Gate:** Attempting to update `AuditEvent` in SQL fails with trigger exception; production build contains zero references to `Test@Pass123`; batch QR verification uses random slugs.

---

### Phase 4: P2 Infrastructure Scalability & Observability
- **Target Vulnerabilities:** `SEC-MED-01` (In-Memory Sliding-Window Rate Limiting).
- **Actions:**
  1. Implement an abstract rate-limiting adapter interface supporting both local in-memory fallback and a production Redis/Upstash provider (`src/lib/server/rateLimit.ts`).
  2. Add automated end-to-end user journey tests using Playwright/Puppeteer covering the complete flow from primary collector intake to warehouse inventory receipt in simulated offline/online modes.
  3. Integrate Sentry or standard structured JSON error forwarding for serverless route handlers.
- **Acceptance Gate:** Rate limit state synchronizes across simulated concurrent workers; E2E browser tests pass.

---

### Phase 5: Production Verification & Release Gates G1/G2
- **Objective:** Final verification, gate transitions, and production authorization.
- **Actions:**
  1. Execute complete verification pass: `npm audit`, `npm run lint`, `npm run test:all`.
  2. Verify that all 25 items on `docs/production-readiness-checklist.md` transition from BLOCKED/CONDITIONAL to PASSED.
  3. Transition Governance Gate from G0 to G1 (Security & Schema Hardened), then to G2 (Staging Certified).
  4. Submit final release packet for formal TDCCOL Project Director sign-off.
- **Acceptance Gate:** 100% checklist items satisfied; executive sign-off recorded.

