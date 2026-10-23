# DECISIONS.md — BanaSetu Architecture Decision Records (ADR)

**System:** BanaSetu — Minor Forest Produce Ledger & Traceability Engine  
**Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
**Status:** Active & Normative

---

## ADR 01: Dual-Database Resilience Architecture (Dexie + PostgreSQL)
- **Context:** Forest collection aggregation points in Mayurbhanj operate in deep forest and hill terrain with intermittent or absent cellular connectivity. However, state-level procurement requires relational consistency, central auditability, and reconciliation.
- **Decision:** Use client-side IndexedDB via Dexie for local-first operations and PostgreSQL via Prisma for the central server ledger. Local devices write immediately to Dexie outbox queues with client-generated ULIDs. When online, batches sync to PostgreSQL. When the database is unconfigured or unreachable, the system gracefully responds with HTTP 503 `DATABASE_UNCONFIGURED` without losing local records.
- **Consequences:** Eliminates single point of failure in remote field operations; requires robust idempotency keys and outbox sync retry queues.

---

## ADR 02: Stateless Signed JWT Sessions with Least-Privilege RBAC
- **Context:** Field managers and tribal collectors switch between intermittent network states. Complex centralized OAuth redirect flows fail when internet access drops mid-shift.
- **Decision:** Implement stateless, cryptographically signed JSON Web Tokens (JWT) using `jose` and `HS256`, stored in secure `HttpOnly`, `SameSite=Lax` cookies. Enforce 5 strict roles: `COLLECTOR`, `SHG_FACILITATOR`, `COLLECTION_MANAGER`, `WAREHOUSE_MANAGER`, and `SUPERVISOR_ADMIN`. All data mutations require verified server-side session checks.
- **Consequences:** Low server overhead, immune to client role-spoofing, resilient during 8-hour field shifts.

---

## ADR 03: Non-Accusatory Shrinkage Segregation Engine
- **Context:** In transit between forest aggregation centers and central depots (e.g. Karanjia $\rightarrow$ Baripada), produce naturally loses weight through moisture evaporation. Historically, transit shrinkage was used punitively against tribal gatherers.
- **Decision:** Apply a standard, configurable natural shrinkage allowance (1.5% baseline benchmark). Discrepancies exceeding this threshold are automatically routed to a segregated quarantine bay (`QUARANTINED_DISCREPANCY`) for supervisor review. Crucially, the tribal gatherer's accepted field weight and payout reference remain 100% safeguarded and cannot be retroactively altered by warehouse reweighing.
- **Consequences:** Protects tribal rights under LABHA Yojana; eliminates fraudulent weight deductions while maintaining institutional integrity.

---

## ADR 04: Pure Linework Design System & Anti-Slop Discipline
- **Context:** Field ledgers must be readable under direct sunlight on low-cost devices and printable on low-ink A6 field dot-matrix/thermal printers. Modern SaaS trends (gradients, shadows, glassmorphism) impair readability and battery life.
- **Decision:** Adhere strictly to a warm editorial aesthetic: `#FAF6EE` warm paper background, `#1F2A22` forest dark manager sidebar, `#C05638` terracotta primary action. Zero CSS box-shadows, zero gradients, zero emoji icons, zero rounded-full pill buttons (except status tags). Tabular numerals globally. Touch targets $\ge 44\text{px}$.
- **Consequences:** High visual contrast (>4.5:1 WCAG AA across all tokens), zero visual noise, professional credibility for government stakeholders.

---

## ADR 05: Offline-First Zero-Typing Paths for Low-Literacy Users
- **Context:** 1.4 million tribal forest gatherers include members with limited formal literacy and low digital proficiency.
- **Decision:** Provide zero-typing flows: large Fraunces 36px numerals, photo capture with default zero-weight (delegating weighing to certified scales), quantity steppers, Odia language priority with Noto Sans Oriya, and an instant 6-second undo toast rather than blocking confirmation modals.
- **Consequences:** Dramatically reduces error rates and empowers tribal gatherers to verify their rights independently.
