# BanaSetu — Minor Forest Produce Traceability & Procurement Ledger

> **Jurisdiction:** Mayurbhanj District, Government of Odisha  
> **Scheme Alignment:** Tribal Development Cooperative Corporation of Odisha Ltd. (TDCCOL) & 100% State-Funded LABHA Scheme (*Laghu Bana Jatiya Dradya Kraya*)  
> **Target Demographic:** 1.4 Million Tribal Gatherers across Mayurbhanj & Similipal Biosphere Reserve  
> **Design Identity:** Warm Editorial Field Ledger (`#FAF6EE` Paper, `#1F2A22` Forest Dark, `#C05638` Terracotta)

---

## 1. Project Mission

BanaSetu (*"Forest Bridge"*) is a purpose-built digital procurement and traceability ledger designed for tribal Minor Forest Produce (MFP) collectors in Odisha.

Historically, primary tribal gatherers suffered from delayed cash settlements, arbitrary quality downgrades, and punitive weight deductions disguised as "transit shrinkage."

BanaSetu solves these structural inequities through:
1. **Low-Literacy First Design:** Zero-typing steppers, native Odia typography (Noto Sans Oriya), and Web Speech synthesis ("Listen to Rate") for non-literate forest dwellers.
2. **Dual-Database Offline Resilience:** Operates 100% offline in deep forest terrain using client-side IndexedDB (Dexie). Syncs idempotently to a central PostgreSQL database when connectivity resumes.
3. **Non-Accusatory Shrinkage Segregation:** Natural moisture loss in transit is mathematically verified against botanical thresholds. Quarantined batches are isolated for administrative review without retroactively altering or deducting the gatherer's certified field payment.
4. **Anti-Slop Editorial Design:** Zero shadows, zero gradients, zero emoji icons, zero rounded pills, and tabular numerals across all screens. Accessible under direct sunlight (WCAG 2.1 AA, contrast $\ge 4.5:1$).

---

## 2. Quickstart & Local Execution

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

```bash
# 1. Install dependencies cleanly
npm ci

# 2. Generate Prisma database client
npx prisma generate

# 3. Run all 11 automated verification test suites
npm run test:all

# 4. Start local development server
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## 3. Role Personas for Sandbox Evaluation

For evaluation and demonstration, navigate to [`/login`](http://localhost:3000/login) to use the 1-Click Persona Quick-Switcher:

| Persona Name | Role | Primary Interface | Sandbox Responsibilities |
|:---|:---|:---|:---|
| **Rami Majhi** | `COLLECTOR` | `/collector` | Primary Santhal tribal gatherer. Requests pickup, checks MSP rates, listens to audio rate cards, views receipts. |
| **Sumitra Soren** | `SHG_FACILITATOR` | `/facilitator` | Local SHG leader. Aggregates collection requests from forest hamlets and assists elders. |
| **Bikram Marndi** | `COLLECTION_MANAGER` | `/collection` | Operates village aggregation center scale. Performs physical weighments, deducts sack tare, issues bag tags. |
| **Debasis Das** | `WAREHOUSE_MANAGER` | `/inventory` | Central depot manager at Baripada. Reweighs arrival trucks, tracks transit shrinkage, allocates outward sales. |
| **District Collector** | `SUPERVISOR_ADMIN` | `/admin` | Mayurbhanj District Administration. Configures rate cards, reviews quarantined batches, exports audit logs. |

---

## 4. Verification Test Suites Matrix

Run individual test suites or the entire suite via `npm run test:all`:

| Command | Target | Verifications |
|:---|:---|:---:|
| `npm run test:i18n` | Bilingual English/Odia key parity | 189 keys (100% parity) |
| `npm run test:a11y` | WCAG 2.1 AA, contrast, label pairings | 18 checks |
| `npm run test:auth` | JWT session cookies, RBAC permissions | 32 checks |
| `npm run test:collector` | Collector workflow, offline drafts | 23 checks |
| `npm run test:collection` | Gross/tare scale math, idempotency | 32 checks |
| `npm run test:inventory` | Transit shrinkage, quarantine bay, stock | 51 checks |
| `npm run test:backend` | Rate limiting, error format, security | 22 checks |
| `npm run test:uploads` | Multipart parser, MIME types, SHA-256 | 14 checks |
| `npm run test:catalogue` | 17 MFP species, Mayurbhanj geography | 125 checks |
| `npm run test:admin` | Admin clearance, rate cards, CSV export | 14 checks |
| `npm run test:flows` | Dead-button audit, route integrity | 43 checks |
| **`npm run test:all`** | **Comprehensive Full System Suite** | **563 checks (100% PASS)** |

---

## 5. System Documentation Index

The repository includes a comprehensive institutional documentation suite:

- **[`WHAT_IS_REAL.md`](file:///c:/Users/princ/Documents/bana-setu-main/WHAT_IS_REAL.md):** Transparent disclosure of real code vs simulated sandboxes (payments, live DB).
- **[`FINAL_QA.md`](file:///c:/Users/princ/Documents/bana-setu-main/FINAL_QA.md):** Comprehensive test results, walkthroughs, and edge cases.
- **[`ARCHITECTURE.md`](file:///c:/Users/princ/Documents/bana-setu-main/ARCHITECTURE.md):** Technical deep-dive into dual-database architecture, JWT sessions, and data flow.
- **[`SECURITY.md`](file:///c:/Users/princ/Documents/bana-setu-main/SECURITY.md):** Security posture, RBAC boundary enforcement, rate limiting, and evidence hashing.
- **[`ACCESSIBILITY.md`](file:///c:/Users/princ/Documents/bana-setu-main/ACCESSIBILITY.md):** WCAG 2.1 AA token contrast ratios, keyboard shortcuts, and screen reader design.
- **[`FEATURES.md`](file:///c:/Users/princ/Documents/bana-setu-main/FEATURES.md):** Complete functional catalog across all 5 user tiers.
- **[`STATES.md`](file:///c:/Users/princ/Documents/bana-setu-main/STATES.md):** State machines for batch lifecycles, shrinkage segregation, and offline outbox sync.
- **[`DECISIONS.md`](file:///c:/Users/princ/Documents/bana-setu-main/DECISIONS.md):** Architecture Decision Records (ADRs 01–05).
- **[`DEPLOY.md`](file:///c:/Users/princ/Documents/bana-setu-main/DEPLOY.md):** Clean-clone setup, PostgreSQL migration commands, and containerization.
- **[`ROADMAP.md`](file:///c:/Users/princ/Documents/bana-setu-main/ROADMAP.md):** Mapping to the original Full Build Prompt Pack (F0–F17, G1–G10).
- **[`EVALUATION.md`](file:///c:/Users/princ/Documents/bana-setu-main/EVALUATION.md):** Evaluation against government procurement criteria and anti-slop rules.
- **[`IMPLEMENTATION_GAP_AUDIT.md`](file:///c:/Users/princ/Documents/bana-setu-main/IMPLEMENTATION_GAP_AUDIT.md):** Master requirement-by-requirement gap audit.

---

## 6. Technical Reality & Disclaimers

1. **Non-Banking Sandbox:** Payout reference numbers (e.g. `PAY-MAYURBHANJ-xxx`) are simulated for demonstration. Live DBT integration requires formal banking clearance from the Reserve Bank of India and TDCCOL.
2. **Provisional Rates:** Procurement rates (e.g. Mahua at ₹42/kg) and shrinkage allowances (1.5%) are sourced from baseline guidelines and are clearly labelled illustrative in the UI.
3. **No Biometric Fingerprint Capture:** In strict compliance with Indian data privacy regulations, no biometric fingerprint templates are captured or stored.
