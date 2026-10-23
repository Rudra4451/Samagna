# FEATURES.md — BanaSetu Feature Catalog & Functional Matrix

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger & Traceability Engine  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Audience:** Government Procurement Officers, SHG Facilitators, System Evaluators

---

## 1. Tribal Collector PWA (`/collector`)

| Feature | Description | Inclusive Design & Safety Safeguards |
|:---|:---|:---|
| **Zero-Typing Stepper** | Large +/- 5 kg buttons for rapid quantity selection. | 36px Fraunces tabular numerals; supports keyboard arrow navigation and touch targets $\ge 44\text{px}$. |
| **"Listen to Rate" Audio** | Text-to-speech button vocalizing product rates in clear spoken language. | Powered by Web Speech Synthesis API; requires zero reading skills. |
| **Micro-Climate Drying Advisory** | Weather card providing field advisories (e.g. humidity, drying recommendations for Mahua). | Clearly labelled *"Illustrative Mayurbhanj Field Weather Simulation"*. |
| **Bilingual Language Toggle** | Instant one-click toggle between English and Odia. | 189 keys, 100% key parity; uses high-legibility Noto Sans Oriya typography. |
| **Camera Evidence Capture** | In-app photo capture of harvested produce bags. | Native file/camera fallback with local instant preview and offline preservation. |
| **Draft Recovery & Undo** | Auto-saves draft forms in IndexedDB; displays a 6-second undo toast after request submission. | Prevents accidental lost work in deep forest terrain without network. |
| **Personal Request Ledger** | Tabulated list of previous collection requests with color-independent status badges. | Combines status text, border accents, and geometric shapes (●, ◆, ▲). |

---

## 2. Collection Center Intake (`/collection`)

| Feature | Description | Inclusive Design & Safety Safeguards |
|:---|:---|:---|
| **Intake Queue** | Live list of incoming collector requests awaiting physical scale weighment. | Fast keyboard navigation with `j`/`k` row jumping and `/` search focus. |
| **Scale Gross & Tare Calculator** | Enters gross scale reading and sack count/tare; computes certified net weight automatically. | Enforces minimum sack tare (0.6 kg default) and prevents negative net weight. |
| **Payable Calculation** | Computes immediate payout: $\text{Net Weight} \times \text{Benchmark Rate}$. | Displays transparent breakdown: Gross, Tare, Net, Rate, Total Amount. |
| **A6 Receipt & QR Tag Generator** | Generates printable field receipt and bag tag with machine-readable QR codes. | Thermal and dot-matrix printer-friendly black-and-white layout. |
| **Batch Dispatch Bundling** | Groups verified weighments into transit dispatch manifests for central depot transit. | Immutable record linking original gatherers to the dispatched batch. |

---

## 3. Central Warehouse Depot & Inventory (`/inventory`)

| Feature | Description | Inclusive Design & Safety Safeguards |
|:---|:---|:---|
| **Inward Arrival Reweighing** | Records gross arrival weight from transport trucks arriving from forest collection centers. | Authoritative dispatched field weight is read from server records, never trusted from client. |
| **Transit Shrinkage Engine** | Calculates transit moisture loss against configured botanical tolerance (1.5% benchmark). | Non-accusatory: losses $\le 1.5\%$ are approved as natural transit evaporation. |
| **Segregated Quarantine Bay** | Batches exceeding shrinkage tolerance are immediately isolated into quarantine. | Generates supervisor discrepancy case; gatherer's field payout is NEVER deducted. |
| **Available Stock Ledger** | Live aggregate view of verified warehouse stock broken down by botanical species. | Quarantined and pending stock are isolated from available inventory. |
| **Outward Sale Allocation** | Drawer for allocating verified stock to tribal cooperatives and commercial buyers. | **Strict Invariant:** Allocations cannot exceed available stock; inventory can never become negative. |

---

## 4. Administration & Governance Console (`/admin`)

| Feature | Description | Inclusive Design & Safety Safeguards |
|:---|:---|:---|
| **Rate Card Calibration** | Super-admin interface for adjusting procurement rates and allowable transit shrinkage per species. | Explicit provenance disclaimer; bounds checks prevent irrational rates. |
| **User Directory** | View and manage authorized officers across 5 operational roles. | Cryptographically enforced RBAC; collectors cannot access this view. |
| **Discrepancy Resolution** | Review quarantined transit batches, inspect photos/reasons, and record resolution verdicts. | Actions logged transactionally to the audit trail. |
| **Immutable Audit Trail** | Tabulated historical log of all weighments, logins, rate modifications, and stock allocations. | Records actor ID, action type, IP address, and timestamp. |
| **CSV / JSON Data Export** | One-click export of procurement batches and rate cards (`/api/admin/export`). | Compatible with standard spreadsheet software for district auditing. |
| **Topography Route Map** | Offline SVG transit map showing Mayurbhanj aggregation centers, depots, and road corridors. | Zero external map tile dependencies; operates 100% offline. |

---

## 5. Public Verification & Traceability (`/verify`)

| Feature | Description | Inclusive Design & Safety Safeguards |
|:---|:---|:---|
| **Public QR Code Scan** | Scannable by consumers, buyers, or auditors via mobile phone camera. | Resolves directly to verified batch certification details. |
| **Privacy-Preserving Display** | Shows botanical produce, harvest date, collection center, certified weight, and quality grade. | **Zero Aadhaar or bank account exposure**; protects gatherer identity. |
| **Cryptographic Evidence Link** | Verifies uploaded photo against SHA-256 evidence hash. | Guarantees tamper-proof non-repudiation of field weighments. |
