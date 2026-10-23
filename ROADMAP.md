# ROADMAP.md — BanaSetu Full Build Specification Mapping & Roadmap

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger  
> **Source Specification:** *BanaSetu — Full Build Prompt Pack (F + G)*  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  

---

## 1. Specification Mapping & Phase Status

| Original Code | Requirement Title | Phase Group | Implemented Status | Verification Evidence |
|:---|:---|:---:|:---:|:---|
| **Prompt 0** | Project Context & Mission | Phase A | **COMPLETE** | Documented in `README.md`, `ARCHITECTURE.md`. |
| **Prompt 1** | Design System & Anti-Slop Rules | Phase A | **COMPLETE** | `#FAF6EE` paper, `#1F2A22` forest dark, `#C05638` terracotta. Tabular nums, zero shadows/gradients. |
| **F0** | Context Reset for Real Build | Phase A | **COMPLETE** | Preservation of existing Dexie & test suites; zero destructive actions. |
| **F1** | Repo, Environment, CI & Decisions | Phase A | **COMPLETE** | `.github/workflows/ci.yml`, `DECISIONS.md`, `DEPLOY.md`. |
| **F2** | Database Relational Schema | Phase A | **COMPLETE** | `prisma/schema.prisma` with 11 relational models. `npx prisma generate` clean. |
| **F3** | Auth, RBAC, Middleware, Sessions | Phase B | **COMPLETE** | JWT `jose` HS256 HttpOnly cookies, 5-role RBAC matrix. `npm run test:auth`. |
| **F4** | API Conventions, Validation & Limits | Phase B | **COMPLETE** | Zod schemas, standard responses, sliding-window rate limiter. `npm run test:backend`. |
| **F5** | File Uploads & Evidence Hashing | Phase C | **COMPLETE** | `/api/uploads` multipart parser, 5MB limit, SHA-256 digests. `npm run test:uploads`. |
| **F6** | Offline Outbox & Sync Engine | Phase C | **COMPLETE** | Dexie syncQueue, exponential backoff, `/api/sync` handshake. `npm run test:collector`. |
| **F7** | Conflict Resolution & Review | Phase C | **COMPLETE** | HTTP 409 conflict detection, admin conflict inspection. `npm run test:admin`. |
| **F8** | Collector Application PWA | Phase D | **COMPLETE** | Low-literacy UI, zero-typing steppers, camera capture, drafts. `npm run test:collector`. |
| **F9** | Collection Center Intake | Phase D | **COMPLETE** | Scale gross/tare calculator, payable breakdown, QR tag. `npm run test:collection`. |
| **F10** | Warehouse Inventory & Shrinkage | Phase D | **COMPLETE** | Transit shrinkage engine (1.5%), quarantine bay, stock limits. `npm run test:inventory`. |
| **F11** | Admin Rates, Users, Exports, Audit | Phase F | **COMPLETE** | Multi-tab admin console, rate calibration, CSV export. `npm run test:admin`. |
| **F12** | Printable Receipts & Verification | Phase G | **COMPLETE** | Dual QR codes, `/verify/[code]` privacy-shielded certificate. `npm run test:flows`. |
| **F13** | English & Odia Internationalization | Phase G | **COMPLETE** | 189 keys, 100% parity across `en.json` and `or.json`. `npm run test:i18n`. |
| **F14** | Automated Testing Suite | Phase I | **COMPLETE** | 11 automated test suites running 563 checks in CI. `npm run test:all`. |
| **F15** | Security Hardening & Headers | Phase B | **COMPLETE** | CSP headers, X-Frame-Options, bcrypt work factor 10, rate limits. `npm run test:backend`. |
| **F16** | Production Build & Observability | Phase J | **COMPLETE** | `npm run build` static compilation (19 pages), `/api/health`. |
| **F17** | Institutional Submission Package | Phase J | **COMPLETE** | Complete 12-file markdown institutional documentation suite. |
| **G1** | Odisha 17 MFP Catalogue | Phase E | **COMPLETE** | All 17 botanical species in `src/lib/products.ts`. `npm run test:catalogue`. |
| **G2** | Product SVG Illustrations | Phase E | **COMPLETE** | 17 botanical linework SVGs in `ProductIcons.tsx`. |
| **G3** | Maps & Location Intelligence | Phase E | **COMPLETE** | Pure SVG `TransitRouteMap.tsx` for Mayurbhanj corridor. `npm run test:catalogue`. |
| **G4** | Dead-Button & Link Integrity Audit | Phase I | **COMPLETE** | `scripts/test-flows-g4.ts` testing 43 interactive checks. `npm run test:flows`. |
| **G5** | Complete Authentication Pages | Phase F | **COMPLETE** | Dedicated `/login` and `/unauthorized` pages with persona switcher. |
| **G6** | Complete Admin Console | Phase F | **COMPLETE** | Dedicated `/admin` with 6 functional operational tabs. |
| **G7** | Low-Literacy Collector UX | Phase H | **COMPLETE** | Fraunces 36px numerals, Web Speech synthesis ("Listen to Rate"). |
| **G8** | Performance & Perceived Speed | Phase I | **COMPLETE** | First load JS < 205 kB, instant local Dexie writes, zero layout shift. |
| **G9** | Weather & Target-User Features | Phase H | **COMPLETE** | Micro-climate drying advisories in `WeatherAdvisoryCard.tsx`. |
| **G10** | Final Comprehensive QA | Phase J | **COMPLETE** | Documented in `FINAL_QA.md` and `WHAT_IS_REAL.md`. |

---

## 2. Future Production Roadmap (Beyond Sandbox)

1. **Formal TDCCOL Production Deployment:**
   - Provision high-availability managed PostgreSQL on Odisha State Data Centre (OSDC) or NIC MeghRaj Cloud.
   - Run `npx prisma migrate deploy` on production database.
2. **Direct Benefit Transfer (DBT) Banking Gateway Integration:**
   - Execute formal API tie-up with State Bank of India / Odisha Gramya Bank for automated PFMS (Public Financial Management System) disbursements.
3. **Hardware Bluetooth Scale Pairing:**
   - Implement Web Bluetooth API (W3C standard) to pair digital weighing scales directly to `/collection` gross weight inputs, eliminating manual key-entry error.
4. **LoRaWAN / Satellite Field Repeaters:**
   - Pilot solar-powered LoRaWAN mesh repeaters across deep Similipal forest hamlets to relay low-bandwidth JSON sync packets.
