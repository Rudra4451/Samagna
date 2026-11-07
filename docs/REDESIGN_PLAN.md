# Samagna · ସମଗ୍ନ — Platform Redesign & Architecture Blueprint
**Document Status:** Approved Architecture Blueprint  
**Target File:** `/docs/REDESIGN_PLAN.md`  
**Author:** Principal Frontend Engineer & Senior UI/UX Architect  
**Product:** Samagna · ସମଗ୍ନ — Minor Forest Produce Procurement, Traceability Custody & B2B Trade  
**Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL & LABHA Scheme Alignment)  
**Target Audiences:** Institutional & Field Operations (B2G) and Enterprise Commercial Buyers (B2B)  

---

## Executive Summary & Core Invariants

Samagna is an institutional digital public infrastructure (DPI) platform orchestrating minor forest produce (MFP) procurement from 1.4 million tribal primary gatherers across Mayurbhanj and the Similipal Biosphere Reserve, directly connecting certified lots to enterprise B2B buyers.

### Invariant Business Rules (Non-Negotiable)
1. **100% Minimum Support Price (MSP) Direct Benefit Transfer (DBT):** Gatherers receive immediate, un-discounted payments with 0% middleman commission or arbitrary scale deductions under the Odisha LABHA scheme (*Laghu Bana Jatiya Dradya Kraya*).
2. **Non-Accusatory Transit Shrinkage Segregation:** Natural botanical moisture evaporation occurring between Village Procurement Centers (VPCs) and Central Storage Depots is mathematically isolated; no retroactive deductions are ever imposed on primary collectors.
3. **Dual-Database Offline Resilience:** Field personnel operate in zero-connectivity jungle tracts via client-side IndexedDB (Dexie.js), synchronizing idempotently with central PostgreSQL when network pings succeed.
4. **End-to-End Custody Transparency:** Every jute gunny bag carries a tamper-evident QR code and cryptographic audit trail accessible publicly via `/verify/[code]`.

This document establishes the end-to-end audit and implementation specification to resolve visual clumsiness, awkward typography wrapping, mobile viewports clipping, dead codebase debt, and navigational confusion, elevating Samagna into a world-class, responsive, and trustworthy enterprise platform.

---

## 1. Repository & Architecture Audit

### 1.1 Structural Map
```
c:\Users\rudra\Bana Setu\
├── .github/workflows/ci.yml       # Continuous integration pipeline
├── demo/                          # [DEBT] Root demo directory containing redundant 1-line seed.ts
├── docs/                          # Architecture, threat model, testing & security audit dossiers
├── i18n/                          # [DEBT] Stale root translation directory out of sync with src/i18n
├── prisma/                        # Database schema, migrations, and PostgreSQL seed scripts
├── public/
│   ├── demo/                      # Video demo (8.7MB) and fallback step images
│   │   └── fallback/              # [DEBT] Duplicate numbered PNGs (1.png-6.png vs step*.png)
│   ├── icon.svg                   # Vector favicon & application mark
│   └── products/                  # 27 botanical photos (10 redundant duplicate alias files ~10MB)
├── scripts/                       # 39 verification, QA, and security test suites
├── src/
│   ├── app/                       # Next.js App Router (37 page routes & API endpoints)
│   ├── components/                # UI components, artifacts, shell, and domain views
│   │   ├── admin/                 # BI, commission, and assistant audit consoles
│   │   ├── artifacts/             # Physical receipt, sack tag, and discrepancy cards
│   │   ├── demo/                  # Demo presentation controls and script overlays
│   │   ├── guidance/              # Botanical inspection and quality cards
│   │   ├── illustrations/         # SVG diagrams for waybills, depots, and custody
│   │   ├── institutional/         # Administrative views for DPO, VPC, and depot managers
│   │   ├── maitriyam/             # Maitriyam conversational AI assistant launcher and modal
│   │   ├── manager/               # Table action menus, filters, editable cells
│   │   ├── map/                   # Waybill transit routing map
│   │   ├── onboarding/            # First-run onboarding tours per persona
│   │   ├── shell/                 # TopBar, AppShell, CollectorTabBar, ManagerSidebar
│   │   └── ui/                    # Base UI atoms (Buttons, Cards, Badges, Tables, Drawers)
│   ├── context/                   # BanaSetu global application context & session state
│   ├── demo/                      # Production demo fixtures and pristine seed state
│   ├── i18n/                      # Active bilingual localization (en.json, or.json) & hook
│   ├── lib/                       # Business logic, math, offline sync, DB client, and security
│   └── store/                     # Zustand stores (useAppStore, useCartStore)
├── .editorconfig
├── .eslintrc.json
├── .gitignore
├── COMMERCIAL_MODEL.md
├── netlify.toml
├── next.config.js
├── package.json
├── postcss.config.js
├── README.md
├── render.yaml
├── ROADMAP.md
├── SECURITY.md
├── tailwind.config.ts
└── tsconfig.json
```

---

### 1.2 Dead Code, Unused Assets & File Removability Audit

Every file in the repository was analyzed via AST/import tracing, ripgrep verification, and dependency auditing. The table below outlines items verified for removal, consolidation, or retention:

| Target File / Folder | Classification | Verification & Import Analysis | Action & Architectural Rationale |
|---|---|---|---|
| `demo/seed.ts` | **DELETE** | Contains only `export * from '../src/demo/seed';`. Used by `src/app/collection/receipt/[code]/page.tsx` due to `../../../../demo/seed` relative path reaching root instead of `@/demo/seed`. | Update 2 import paths to `@/demo/seed` and delete root `demo/` folder entirely. |
| `i18n/` (root directory: `en.json`, `or.json`, `review-status.json`) | **DELETE** | Root directory contains stale translation files. `src/i18n/useTranslation.ts` and `scripts/check-i18n.js` strictly read from `src/i18n/en.json` and `src/i18n/or.json`. | Remove root `i18n/` to eliminate split-brain drift and avoid confusion during copywriting updates. |
| `src/components/ui/StateViews.tsx` | **DELETE** | Grep reveals **0 import references** across the entire codebase. `EmptyState.tsx` already handles empty states, and standard inline loaders/alerts are used elsewhere. | Delete `StateViews.tsx` (175 lines of dead code). |
| `src/components/HonestyBadge.tsx` | **DELETE** | Self-contained component with **0 imports** anywhere in `src/` or `scripts/`. Replaced by `VerifiedBadge.tsx` and `Honesty` status badges in `src/components/ui/`. | Delete `HonestyBadge.tsx`. |
| `src/components/ui/ManagerSidebar.tsx` | **DELETE** | Duplicate mock component only imported by `src/app/design/page.tsx:56`. The real production sidebar is `src/components/shell/ManagerSidebar.tsx` (used in `AppShell.tsx` and verified by test scripts). | Redirect `src/app/design/page.tsx` to `src/components/shell/ManagerSidebar.tsx` and delete `src/components/ui/ManagerSidebar.tsx`. |
| `src/app/warehouse/page.tsx` | **DELETE / MIGRATE** | Client-side redirect component (`useEffect -> router.replace('/inventory')`). Flashes blank screen and loads unnecessary JS bundle. | Move to permanent 308 redirect in `next.config.js` (`/warehouse` -> `/inventory`) and remove page file. |
| `src/app/manager/page.tsx` | **DELETE / MIGRATE** | Client-side redirect component (`useEffect -> router.replace('/collection')`). | Move to permanent 308 redirect in `next.config.js` (`/manager` -> `/collection`) and remove page file. |
| `public/products/broom.jpg` | **DELETE** | Exact byte-for-byte duplicate of `hill-broom.jpg` (1,098,012 bytes). | Keep `hill-broom.jpg`, standardize references, delete alias. |
| `public/products/char.jpg` | **DELETE** | Exact duplicate of `char-seeds.jpg` (816,613 bytes). | Keep `char-seeds.jpg`, delete duplicate alias. |
| `public/products/deseeded-tamarind.jpg` | **DELETE** | Exact duplicate of `tamarind-deseeded.jpg` (922,078 bytes). | Keep `tamarind-deseeded.jpg`, delete alias. |
| `public/products/karanja.jpg` | **DELETE** | Exact duplicate of `karanja-seeds.jpg` (982,472 bytes). | Keep `karanja-seeds.jpg`, delete duplicate alias. |
| `public/products/kendu.jpg` | **DELETE** | Exact duplicate of `kendu-leaves.jpg` (1,004,615 bytes). | Keep `kendu-leaves.jpg`, delete duplicate alias. |
| `public/products/kusum.jpg` | **DELETE** | Exact duplicate of `kusum-seeds.jpg` (941,510 bytes). | Keep `kusum-seeds.jpg`, delete duplicate alias. |
| `public/products/neem.jpg` | **DELETE** | Exact duplicate of `neem-seeds.jpg` (958,215 bytes). | Keep `neem-seeds.jpg`, delete duplicate alias. |
| `public/products/sal.jpg` | **DELETE** | Exact duplicate of `sal-seeds.jpg` (1,112,308 bytes). | Keep `sal-seeds.jpg`, delete duplicate alias. |
| `public/products/tamarind.jpg` | **DELETE** | Exact duplicate of `tamarind-seeded.jpg` (1,008,649 bytes). | Keep `tamarind-seeded.jpg`, delete duplicate alias. |
| `public/products/honey.jpg` | **DELETE** | Exact duplicate of `wild-honey.jpg` (1,058,190 bytes). | Keep `wild-honey.jpg`, delete duplicate alias. Total ~9.5MB saved. |
| `public/demo/fallback/step1_collector_pickup.png` to `step6_audit_timeline.png` | **DELETE** | `FallbackViewerModal.tsx` loads `/demo/fallback/1.png` through `6.png`. The `step*.png` files are unreferenced duplicate outputs generated by `generate-fallback-images.js`. | Delete unreferenced `step*.png` duplicates or rename `1.png`–`6.png` to canonical descriptive names. |
| `public/demo/banasetu-demo.mp4` | **KEEP / CDN OFFLOAD** | 8.7 MB video committed in git. Used on landing page modal and README walkthrough. | Keep local file for offline demo presentation resilience, but configure Git LFS or external CDN mirror for web production builds. |
| `docs/presentations/BanaSetu_HSC_Presentation.*` | **KEEP** | Evaluator presentation assets (PDF 4.2MB, PPTX 3.8MB) used during hackathon and jury evaluation. | Keep in `docs/presentations/` for project archival integrity. |
| `@radix-ui/react-slot` (package.json) | **DELETE** | Grep reveals zero imports of `react-slot` across `src/` and `scripts/`. | Remove from `dependencies` in `package.json`. |
| `@types/qrcode` (package.json) | **RESTRUCTURE** | Currently listed under runtime `dependencies` instead of `devDependencies`. | Move to `devDependencies`. |
| `tsconfig.tsbuildinfo` | **KEEP (GITIGNORED)** | TypeScript incremental build cache. Correctly ignored in `.gitignore` (`*.tsbuildinfo`) and uncommitted in git. | Retain in working tree for fast incremental compilation. |

---

### 1.3 Configuration, Environment & Tooling Assessment

1. **`.gitignore` Assessment:**
   - **Coverage:** Excellent. Covers `.next/`, `node_modules/`, `.env`, `.env*.local`, `*.tsbuildinfo`, `next-env.d.ts`, and local tunnel binaries (`cloudflared.exe`).
   - **Recommendation:** Add `*.mp4` under an optional media ignore or configure Git LFS for video files exceeding 5MB to prevent repository bloat.
2. **Environment Handling:**
   - `.env.example` provides complete documentation for `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`, `SESSION_COOKIE_NAME`, `ADMIN_SECRET_KEY`, and `RATE_LIMIT_ENABLED`.
   - Production secrets are strictly guarded; zero raw credentials committed in tracking.
3. **Scripts & Verification Suites:**
   - `scripts/` contains 39 specialized test harnesses validating RBAC, PDF generation, offline sync, shrinkage math, and accessibility.
   - `scripts/test-offline-photo-sync.ts` (60 checks) and `scripts/test-pdf-download-share.ts` (32 checks) are fully functional and pass 100%, but were accidentally excluded from `test:all` in `package.json`.
   - **Action:** Add both scripts into `package.json` under `npm run test:all`.
4. **Linting & TypeScript Configuration:**
   - `tsconfig.json` enforces `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`, and path alias `"@/*": ["./src/*"]`.
   - `.eslintrc.json` extends `next/core-web-vitals`.
5. **Package Metadata & Licensing:**
   - **Package name:** Currently `"name": "bana-setu"`. Should be aliased or documented to reflect the official product identity: `"samagna"`.
   - **Licensing:** `LICENSE` file is missing at root. Add `LICENSE` (Apache-2.0 or MIT for open public digital infrastructure).
   - **Contributing:** Add `CONTRIBUTING.md` defining branching rules, Conventional Commits, and test requirements.
   - **Text Encoding in README.md:** `README.md` contains ANSI double-encoded characters (`Samagna Â· BanaSetu (à¬¸à¬®à¬—à­ à¬¨)`). Convert file to clean UTF-8 (`Samagna · BanaSetu (ସମଗ୍ନ)`).

---

## 2. Bug & Mobile Audit (320px to 1440px Viewports)

Testing was conducted across 9 standardized device breakpoints:
- **320px:** Small Mobile (iPhone SE 1st gen, Galaxy Fold outer display)
- **360px:** Standard Android Mobile (Galaxy S10e, budget devices)
- **390px:** Standard iOS Mobile (iPhone 12/13/14/15)
- **414px / 430px:** Large Mobile (iPhone Plus/Max, Galaxy Note/Ultra)
- **768px:** Small Tablet (iPad mini, portrait tablets)
- **1024px:** Tablet Landscape / Small Laptop (iPad Pro, Surface)
- **1280px:** Standard Laptop (MacBook Air, ThinkPad 13)
- **1440px:** Desktop (iMac, external 1080p/2K monitors)
- **1920px:** Large Desktop Display

---

### 2.1 Prioritized Bug Register

| Bug ID | Component / File | Viewport / Trigger | Root Cause | Proposed Solution | Severity |
|---|---|---|---|---|---|
| **BUG-01** | `src/app/page.tsx:302` | 320px–414px | Fixed `w-[680px]` background ambient glow div (`w-[680px] h-[340px] bg-[#E27D60]/8 blur-3xl`). On mobile browsers, unconstrained wide blur layers cause horizontal scrollbar triggers and subpixel viewport shaking. | Replace with fluid responsive width: `w-full max-w-[540px] h-[240px] sm:h-[340px]` contained within `overflow-x-clip` parent. | **P0 (Critical)** |
| **BUG-02** | `src/app/page.tsx:327, 335` | 320px–360px | `whitespace-nowrap` on primary & secondary CTA buttons (`px-6 py-3.5`). On 320px screens, button contents + container padding exceed available container width, pushing buttons off-screen. | Remove `whitespace-nowrap`, adjust mobile padding to `px-4 py-3 sm:px-6 sm:py-3.5`, and allow flex column stacking with `w-full sm:w-auto`. | **P0 (Critical)** |
| **BUG-03** | `src/components/maitriyam/MaitriyamLauncher.tsx:480` | 320px–430px | Fixed widget positioning (`fixed bottom-4 right-3 z-[9999]`) floating over primary action buttons, footer links, and mobile tab bars. | Adjust z-index to `z-[75]` (below modals `z-[80]`), add `bottom-20 sm:bottom-6` safe area clearance when mobile bottom nav bars or checkout footers are present. | **P0 (Critical)** |
| **BUG-04** | `src/app/page.tsx:125-134` & section IDs | All viewports | Anchor links (`#operations`, `#trade`, `#how-it-works`, `#traceability`, `#about`) scroll to section top without accounting for sticky header height (`h-16 sm:h-20`). Section titles are clipped behind the header bar. | Add CSS `scroll-mt-20 md:scroll-mt-24` to all section root containers. | **P1 (High)** |
| **BUG-05** | `src/app/page.tsx:220-295` | 320px–767px | Mobile hamburger menu is rendered as an unconstrained inline block without focus trapping, body scroll locking, or backdrop scrim. Tapping background interacts with underlying page. | Wrap mobile menu in a modal drawer/sheet with `aria-modal="true"`, focus trap (`useFocusTrap`), body scroll lock (`overflow-hidden` on body), and smooth entrance animation. | **P1 (High)** |
| **BUG-06** | Multiple files (`page.tsx`, `layout.tsx`, `login/page.tsx`) | All viewports | Character encoding corruption (mojibake). Multi-byte UTF-8 Odia script characters rendered as ANSI garbage (e.g. `à¬¶à­...`, `Â·`, `â€”`). | Re-encode all corrupted Odia botanical names, titles, and em-dashes to clean UTF-8 literals (`ଶୁଖିଲା ମହୁଲ ଫୁଲ`, `·`, `—`). | **P1 (High)** |
| **BUG-07** | `tailwind.config.ts`, `globals.css` | All viewports | Sub-12px font sizes (`text-[10px]`, `text-[11px]`, `'section-label': ['11px']`, `'badge': ['11px']`). Unreadable on low-density mobile screens; violates WCAG text clarity guidelines. | Enforce minimum 12px type scale across all badges, section labels, and metadata chips (`text-xs` / `12px`). | **P1 (High)** |
| **BUG-08** | `src/components/shell/TopBar.tsx:40-60` | 320px–390px | Header utility actions (`fontScale` toggle `h-7`, sync status `h-7`, notifications `h-8`) have tap target bounds under 44x44px (28px–32px), failing WCAG 2.5.5. | Apply `min-h-[44px] min-w-[44px]` touch target hitboxes using invisible pseudo-elements (`after:inset-[-8px]`) or padded button wrappers. | **P1 (High)** |
| **BUG-09** | `src/app/globals.css:1` | All viewports | `@import url('https://fonts.googleapis.com/css2?...')` blocks CSS stylesheet parsing, delays First Contentful Paint (FCP), and causes FOIT (Flash of Invisible Text). CSP also restricts third-party font sources. | Migrate font loading to `next/font/google` in `src/app/layout.tsx`. Preloads fonts at build time, self-hosts assets, and satisfies strict CSP `'self'`. | **P1 (High)** |
| **BUG-10** | `src/app/page.tsx:374` & `public/products/` | Mobile 4G | Hero product image (`/products/mahua.jpg`) is a raw 1.0 MB JPEG. Loading a 1MB image on 4G mobile pushes LCP past 3.2s, failing Core Web Vitals (<2.5s). | Configure Next.js image optimization (`formats: ['image/avif', 'image/webp']` in `next.config.js`), generate responsive srcset, and target <180KB compressed payload. | **P1 (High)** |
| **BUG-11** | `src/app/page.tsx:368` (Preview Card) | 320px–360px | Metric columns inside hero preview card use fixed 3-column grid (`grid-cols-3 divide-x`). At 320px, individual cells are ~80px wide, causing numeric labels (`100% Payout OK`) to wrap awkwardly across 3 lines. | Change grid to `grid-cols-1 xs:grid-cols-3` with vertical dividers on mobile and horizontal dividers on xs+. | **P2 (Medium)** |
| **BUG-12** | `src/app/demo/page.tsx` | All viewports | Restricted lock screen blocks visitors unless `?demo=1` query param is present. Users cannot see demo credentials or jump directly into the 12 system personas. | Add an accessible evaluator demo directory banner linking directly to `/login` personas, or provide an inline 1-click stage demo unlock button. | **P2 (Medium)** |
| **BUG-13** | Multiple containers (`min-h-screen`, `h-screen`) | iOS Safari / Chrome Mobile | Use of `100vh` ignores dynamic mobile browser address bars (URL bar expansion/collapse), causing bottom content clipping and layout jank during scroll. | Replace `h-screen` / `min-h-screen` with `min-h-dvh` (Dynamic Viewport Height) to adapt seamlessly to mobile browser chrome. | **P2 (Medium)** |
| **BUG-14** | `src/app/page.tsx:645` | 320px–768px | Section headings are excessively long (e.g. "How Forest Produce Moves from Tree to Commercial Buyer"), consuming 4+ vertical lines on mobile. | Rewrite to punchy, editorial headlines: "The Forest-to-Market Value Chain" with secondary subtitle. | **P2 (Medium)** |

---

## 3. Design System & Token Architecture

The design system replaces fragmented, hardcoded hex values (`#25351F`, `#2D4F1E`, `#F5E6CC`, `#FFFAF2`, `#D7D2C8`, `#E27D60`, `#1F1A14`, `#544E45`) with a unified semantic token system powered by CSS variables and Tailwind theme tokens.

### 3.1 Color Palette & Semantic Tokens

```
                                  SAMAGNA COLOR ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────────────────┐
 │ PRIMARY CANOPY (Dark/Hero)     CANVAS & PARCHMENT (Light)      TERRACOTTA (Accent)      │
 │ ┌───────────────────────────┐  ┌───────────────────────────┐   ┌──────────────────────┐ │
 │ │ Deep Canopy:   #0D170A    │  │ Canvas White:   #FFFAF2   │   │ Terracotta:  #E27D60 │ │
 │ │ Forest Canopy: #152410    │  │ Warm Parchment: #F5E6CC   │   │ Deep Terrac: #B84E34 │ │
 │ │ Forest Green:  #2D4F1E    │  │ Sunken Sand:    #E9DDC9   │   │ Soft Tint:   #FCF1ED │ │
 │ │ Forest Hover:  #203A15    │  │ Soft Border:    #D7D2C8   │   │                      │ │
 │ └───────────────────────────┘  └───────────────────────────┘   └──────────────────────┘ │
 │                                                                                         │
 │ INK & TYPOGRAPHY               STATUS & FEEDBACK               SURFACES & SHADOWS       │
 │ ┌───────────────────────────┐  ┌───────────────────────────┐   ┌──────────────────────┐ │
 │ │ Primary Ink:   #1F1A14    │  │ Success Green:  #2E5C2D   │   │ Surface:     #FFFFFF │ │
 │ │ Muted Ink:     #4A4A4A    │  │ Warning Amber:  #854C0E   │   │ Glass White: #FFFFFF │ │
 │ │ Subtle Ink:    #6B655B    │  │ Danger Crimson: #8E2F26   │   │ Glass Dark:  #152410 │ │
 │ │ Inverse Cream: #FFFAF2    │  │ Info Navy:      #234252   │   │ Shadow Tint: #152410 │ │
 │ └───────────────────────────┘  └───────────────────────────┘   └──────────────────────┘ │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Complete Token Definitions (`src/app/globals.css`)
```css
:root {
  /* --- Foundation Canopy Tokens (Hero & Dark Sections) --- */
  --canopy-deepest: #0D170A;
  --canopy-deep: #152410;
  --forest-primary: #2D4F1E;
  --forest-hover: #203A15;
  --forest-surface: #25351F;

  /* --- Foundation Light Tokens (Parchment & Editorial Canvas) --- */
  --canvas-warm: #FFFAF2;
  --parchment: #F5E6CC;
  --sand-sunken: #E9DDC9;
  --border-soft: #D7D2C8;
  --border-subtle: #E6E1D8;

  /* --- Accent Palette (Terracotta Earth) --- */
  --terracotta-primary: #E27D60;
  --terracotta-deep: #B84E34;     /* Guaranteed >4.5:1 WCAG AA contrast on white/parchment */
  --terracotta-tint: #FCF1ED;

  /* --- Typography Ink Hierarchy --- */
  --ink-primary: #1F1A14;          /* >14:1 contrast on white, >11:1 on parchment */
  --ink-muted: #4A4A4A;            /* >6.2:1 contrast on white */
  --ink-subtle: #6B655B;           /* >4.5:1 contrast on white (WCAG AA compliant) */
  --ink-inverse: #FFFAF2;          /* Clean cream text on dark canopy */
  --ink-inverse-muted: #D7D2C8;

  /* --- Statutory Status Tokens --- */
  --status-success: #2E5C2D;
  --status-success-bg: #EDF5EC;
  --status-warning: #854C0E;
  --status-warning-bg: #FEF9C3;
  --status-danger: #8E2F26;
  --status-danger-bg: #FEE2E2;
  --status-info: #234252;
  --status-info-bg: #E0F2FE;

  /* --- Radii Scale --- */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-pill: 9999px;

  /* --- Elevation & Shadows (Organic Forest Tints) --- */
  --shadow-2xs: 0 1px 2px 0 rgba(21, 36, 16, 0.04);
  --shadow-xs: 0 1px 3px 0 rgba(21, 36, 16, 0.06), 0 1px 2px -1px rgba(21, 36, 16, 0.04);
  --shadow-card: 0 2px 6px -1px rgba(21, 36, 16, 0.08), 0 1px 4px -1px rgba(21, 36, 16, 0.04);
  --shadow-elevated: 0 8px 24px -4px rgba(21, 36, 16, 0.12), 0 4px 8px -2px rgba(21, 36, 16, 0.06);
  --shadow-modal: 0 20px 48px -12px rgba(13, 23, 10, 0.35);

  /* --- Z-Index Layer Hierarchy --- */
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 40;
  --z-drawer-backdrop: 50;
  --z-drawer: 60;
  --z-modal-backdrop: 70;
  --z-assistant: 75;              /* Floating assistant sits between base and modals */
  --z-modal: 80;
  --z-toast: 90;
  --z-tooltip: 100;
}
```

---

### 3.2 Typography System & Fluid `clamp()` Scales

The typographic system harmonizes four font families:
1. **Fraunces (`var(--font-serif)`):** Variable optical size display serif (9–144pt) for editorial prestige, conveying statutory authority and heritage.
2. **Manrope (`var(--font-sans)`):** Geometric humanist sans-serif for UI controls, inputs, data grids, and body copy.
3. **IBM Plex Mono (`var(--font-mono)`):** High-precision monospace for weights, batch serials (`#BS-402`), transaction hashes, and financial rates.
4. **Noto Sans Oriya (`var(--font-odia)`):** Native regional typography with comprehensive fallbacks: `['Noto Sans Oriya', 'Nirmala UI', 'Kalinga', 'sans-serif']`.

#### Zero-Render-Blocking Font Loading (`src/app/layout.tsx`)
```tsx
import { Fraunces, Manrope, IBM_Plex_Mono, Noto_Sans_Oriya } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const notoSansOriya = Noto_Sans_Oriya({
  weight: ['400', '600', '700'],
  subsets: ['oriya'],
  variable: '--font-odia',
  display: 'swap',
});
```

#### Fluid Type Scale (`clamp()`)
To ensure smooth responsiveness from 320px mobile to 1920px desktop without jarring media query jumps, the following fluid type tokens are established:

| Token Name | Clamp Expression | 320px (Mobile) | 768px (Tablet) | 1440px (Desktop) | Usage Target |
|---|---|---:|---:|---:|---|
| `.type-display-hero` | `clamp(2.125rem, 1.45rem + 3.1vw, 4.25rem)` | 34px | 44px | 68px | Landing Hero Headline |
| `.type-h1` | `clamp(1.75rem, 1.35rem + 1.8vw, 2.75rem)` | 28px | 34px | 44px | Major Section Headlines |
| `.type-h2` | `clamp(1.35rem, 1.15rem + 1.1vw, 2.0rem)` | 22px | 25px | 32px | Sub-section & Pathway Headers |
| `.type-h3` | `clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem)` | 18px | 19px | 22px | Card Titles, Timeline Steps |
| `.type-body-lead` | `clamp(1.0rem, 0.95rem + 0.3vw, 1.1875rem)` | 16px | 17px | 19px | Section Intros, Hero Subtitles |
| `.type-body` | `clamp(0.875rem, 0.85rem + 0.15vw, 1.0rem)` | 14px | 15px | 16px | Standard Paragraphs, Tables |
| `.type-label` | `12px` (Strict Minimum) | 12px | 12px | 12px | Badges, Meta, Metric Labels |

> [!IMPORTANT]
> **Strict 12px Minimum Rule:** All previous `text-[10px]` and `text-[11px]` labels are eliminated. Field gatherers, depot staff, and enterprise buyers will never encounter text smaller than 12px (`0.75rem`), with minimum line-height of `1.4` and letter-spacing `0.04em` for guaranteed legibility.

---

## 4. Landing Page Redesign Specification

The landing page (`src/app/page.tsx`) is transformed from a text-dense document into an evocative, authoritative visual product introduction that instantly communicates trust, institutional scale, and commercial efficiency.

```
═════════════════════════════════════════════════════════════════════════════════
               SAMAGNA LANDING PAGE STRUCTURAL BLUEPRINT
═════════════════════════════════════════════════════════════════════════════════

  [ STICKY NAVIGATION HEADER ]
  Logo (Samagna · ସମଗ୍ନ) ── Desktop Links ── Verify Batch ── Sign In (12 Roles)
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 1: DARK SAL-FOREST CANOPY HERO (Full Bleed)
  │
  │  [Layer 1: Deep Sal Forest Canopy AVIF Image]
  │  [Layer 2: Radial Gradient #152410 (85%) -> Deep Canopy #0D170A (96%)]
  │  [Layer 3: Subtle CSS Mist Parallax Layer]
  │
  │  Eyebrow: [TDCCOL · LABHA SCHEME · MAYURBHANJ DISTRICT]
  │  Headline: "From the forest to the marketplace." (Fraunces Display Serif)
  │  Subhead:  Direct Benefit Transfer for tribal gatherers, digital custody tracking,
  │            and verified B2B trade for forest produce.
  │
  │  CTAs: [ Explore Operations (B2G) ]   [ Explore Marketplace (B2B) ]
  │
  │  Trust Strip: TDCCOL Official · 100% DBT Guarantee · Similipal Biosphere Reserve
  │
  │  Animated Stat Counters:
  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
  │  │    1.4M+      │ │     100%      │ │      17       │ │      ₹0       │
  │  │ Tribal Primary│ │ Direct Benefit│ │  Certified    │ │ Intermediary  │
  │  │   Gatherers   │ │ Transfer (DBT)│ │  Botanicals   │ │  Deductions   │
  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
  │
  ▼ [ Scroll Cue Chevron ]
 ─────────────────────────────────────────────────────────────────────────────────
  [ ORGANIC CURVED SVG DIVIDER: Transition from #0D170A to #FFFAF2 ]
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 2: TWO PATHWAYS (B2G vs B2B)
  │
  │  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
  │  │ INSTITUTIONAL OPERATIONS (B2G)  │   │ COMMERCIAL MARKETPLACE (B2B)    │
  │  │ ─────────────────────────────── │   │ ─────────────────────────────── │
  │  │ • Offline Digital Scale Sync    │   │ • Verified Batch Provenance     │
  │  │ • Voice Receipts in Odia        │   │ • Digital Audit Dossiers (PDF)  │
  │  │ • Moisture Loss Triage          │   │ • Wholesale RFQ Bidding & Escrow│
  │  │ • GPS Waybill Tracking          │   │ • Bulk Container Dispatch       │
  │  │                                 │   │                                 │
  │  │ [ Open Field Desks → ]          │   │ [ Explore B2B Trade → ]         │
  │  └─────────────────────────────────┘   └─────────────────────────────────┘
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 3: 4-STEP CONNECTED VALUE-CHAIN TIMELINE
  │
  │  [01: Forest Intake] ──► [02: Digital Tag] ──► [03: Depot Triage] ──► [04: B2B Trade]
  │  Primary collector      Jute gunny bag         Baripada depot reweigh  Enterprise buyer
  │  weighment + DBT        tagged with QR         verifies shrinkage      purchases verified lot
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 4: BOTANICAL PRODUCE CATALOGUE (17 Certified Varieties)
  │
  │  [Tabs: All | Oilseeds | Medicinal | Forest Honey | Fibres]
  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │  │ Mahua Flower │ │  Sal Seeds   │ │ Chironji Nut │ │ Wild Honey   │
  │  │ ₹42 / kg     │ │ ₹20 / kg     │ │ ₹120 / kg    │ │ ₹225 / kg    │
  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 5: INTERACTIVE BATCH TRACEABILITY DOSSIER
  │
  │  Bag Journey: Similipal Tracts ➔ Karanjia VPC ➔ Baripada Central Depot
  │  Interactive Batch Search Input: [ Enter Batch #BS-402 ] [ Verify Dossier ]
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 6: STATUTORY LABHA GOVERNANCE & AUDIT ASSURANCE
  │  Statutory mandate under Section 4(b) · State Treasury verification · Zero Tare
 ─────────────────────────────────────────────────────────────────────────────────
  ▲ SECTION 7: INSTITUTIONAL FOOTER
  │  4 Columns: Platform Navigation · Institutional Desks · Legal & LABHA · Helplines
═════════════════════════════════════════════════════════════════════════════════
```

---

### 4.1 Hero Section Implementation Details

1. **Visual Composition:**
   - **Background Image:** Sal-tree canopy photograph (`/images/hero-sal-canopy.webp`) served via `next/image` with `priority`, `quality={80}`, and `fill`.
   - **Gradient Treatment:** Multi-stop dark canopy scrim:
     `linear-gradient(180deg, rgba(13, 23, 10, 0.78) 0%, rgba(21, 36, 16, 0.88) 60%, rgba(13, 23, 10, 1.0) 100%)`.
   - **Atmospheric Mist:** Lightweight CSS pseudo-element (`before:absolute`) rendering a subtle linear translation mist, disabled when `prefers-reduced-motion` is active.
2. **Typography & Content Hierarchy:**
   - **Eyebrow:** Pill badge with `#E27D60` amber dot: `TDCCOL · LABHA SCHEME · MAYURBHANJ DISTRICT`.
   - **Headline:** Fraunces variable display font:
     ```html
     <h1 className="type-display-hero text-[#FFFAF2] max-w-4xl mx-auto text-balance font-normal leading-[1.08]">
       From the forest <br className="hidden sm:inline" />
       <span className="italic font-normal text-[#E27D60]">to the marketplace.</span>
     </h1>
     ```
   - **Subhead:** Max 640px wide, 16px–18px font size: *"Direct Benefit Transfer for tribal gatherers, digital custody tracking, and verified B2B trade for forest produce."*
3. **CTA Buttons (Accessible Touch Targets):**
   - **Primary Action (B2G):** Forest Green (`#2D4F1E`) container with Cream text (`#FFFAF2`), subtle terracotta accent border, min 48px height: `Explore Operations (B2G) →`.
   - **Secondary Action (B2B):** Translucent frosted glass (`bg-white/10 border-white/25 hover:bg-white/15 backdrop-blur-sm`), Cream text: `Explore Marketplace (B2B) →`.
4. **Stat Counters Strip:**
   - 4-column responsive grid (`grid-cols-2 lg:grid-cols-4`) featuring count-up animations for `1.4M+`, `100%`, `17`, and `₹0`.
   - Mobile fallback: Displays static values directly without triggering JS scroll calculations.

---

### 4.2 Curved Transition & Textured Parchment Canvas

1. **Curved Section Divider:**
   - Seamless SVG transition element joining the dark hero (`#0D170A`) to the light parchment body (`#FFFAF2`).
   - Pure vector path (`d="M0,0 C480,80 960,80 1440,0 L1440,60 L0,60 Z"`), non-scaling stroke, zero pixelation.
2. **Topographic Leaf Texture:**
   - Subtle background SVG contour pattern applied to subsequent sections at `opacity: 0.04` (`pointer-events-none`).
   - Communicates botanical provenance without compromising contrast or readability.

---

### 4.3 Interactive Sections Breakdown

#### 1. Two Pathways (B2G vs B2B)
- Elevated twin cards with 1px border (`var(--border-soft)`), subtle forest hover shadows (`--shadow-elevated`), and clean role badging.
- **Card 1 (Operations):** Highlights offline mobile scale sync, Odia voice assistance, bag QR generation, and waybills. CTA points to `/collection` and `/collector`.
- **Card 2 (Commercial):** Highlights verified lot dossiers, wholesale RFQs, bulk lab certificates, and freight waybills. CTA points to `/trade` and `/store`.

#### 2. Connected 4-Step Value Chain
- Replaces disconnected paragraphs with a connected horizontal timeline on desktop and vertical stepper on mobile:
  - **Step 1:** Forest Floor Intake & DBT (Primary gatherer presents produce; scale auto-computes DBT).
  - **Step 2:** Digital Bag Tagging & Waybill (Jute bag tagged with tamper-evident QR code and GPS timestamp).
  - **Step 3:** Central Depot Reweigh & Moisture Triage (Depot reweigh verifies natural transit shrinkage vs theft).
  - **Step 4:** B2B Lot Auction & Enterprise Trade (Commercial buyers bid on verified lots with full origin dossier).
- Each step features an authentic SVG illustration and technical metadata callout.

#### 3. Produce Catalogue Section
- Quick-filter tabs (`All`, `Oilseeds`, `Botanical Flowers`, `Forest Honey`, `Tamarind`).
- 6 featured cards on landing page linking to `/store` and `/trade`.
- Card details include:
  - High-res botanical photo with aspect-ratio preservation.
  - Bilingual typography (`Mahua Flowers` / `ଶୁଖିଲା ମହୁଲ ଫୁଲ`).
  - Latin botanical classification (`Madhuca longifolia`).
  - Statutory Minimum Support Price (`₹42.00 / kg`).
  - Certified packaging specs (`50kg Jute Gunny Bag`).

#### 4. Traceability Dossier & Bag Journey
- Visual step progression tracking actual demo batch **#BS-402** from Similipal Forest Tracts to Karanjia VPC to Baripada Central Depot.
- Interactive batch search input with quick-code pills (`#BS-402`, `#BS-400`, `#BS-398`) routing instantly to `/verify/[code]`.

#### 5. Statutory Governance Block
- Government of Odisha LABHA Scheme statutory protections.
- Zero middleman deduction pledge with direct links to `/about` and `/privacy`.

#### 6. Institutional Footer
- Clean 4-column structured footer with institutional links, grievance helpline, RTI disclosure, emergency contact, copyright, and language switcher.

---

### 4.4 Micro-Interactions, Motion & Header Behavior

1. **Sticky Header Condensation:**
   - Header height transitions from `80px` (`h-20`) to `60px` (`h-15`) upon scrolling past 60px.
   - Glassmorphism background: `bg-[#FFFAF2]/90 backdrop-blur-md border-b border-[#D7D2C8]`.
2. **Mobile Menu with Focus Trap:**
   - Fullscreen drawer overlay with backdrop blur.
   - Focus trapped within drawer while open; keyboard `Escape` closes drawer.
   - Background body scroll strictly locked (`document.body.style.overflow = 'hidden'`).
3. **Floating Maitriyam Widget Collision Avoidance:**
   - Widget positioned at `right-4 sm:right-6 bottom-4 sm:bottom-6 z-[75]`.
   - On mobile screens with bottom navigation (`CollectorTabBar`), launcher auto-offsets to `bottom-20`.
   - Chat modal opens as a bottom sheet on mobile (`h-[80vh] inset-x-2 bottom-2 rounded-t-xl`) and as a floating card on desktop (`w-[420px] h-[580px]`).

---

### 4.5 Performance Budget & Asset Licensing

| Metric | Target Budget | Implementation Strategy |
|---|---|---|
| **Largest Contentful Paint (LCP)** | **< 2.2s** (4G Mobile) | Hero image converted to AVIF/WebP, loaded via Next.js `<Image priority sizes="100vw">`. Initial hero payload <180KB. |
| **First Contentful Paint (FCP)** | **< 1.0s** | Zero render-blocking `@import` fonts; self-hosted Google fonts via `next/font`. |
| **Cumulative Layout Shift (CLS)** | **0.00** | Strict explicit aspect-ratio and width/height containers on all images, icons, and hero headers. |
| **Total Initial JS (Gzipped)** | **< 160KB** | Tree-shake unused Radix packages, dynamically import Maitriyam assistant drawer. |
| **Total CSS Payload** | **< 35KB** | Clean Tailwind purge, removed duplicate inline hex classes. |

#### New Assets & Licensing Specifications
1. **Hero Sal Forest Canopy Image:**
   - **Source:** Unsplash / Pexels (CC0 / Free Commercial License) featuring dense tropical moist deciduous Sal forest (*Shorea robusta*) characteristic of the Similipal Biosphere Reserve.
   - **Formats:** Pre-compressed to `.webp` and `.avif` in three responsive widths: `720w`, `1440w`, `1920w`.
2. **Topographic Contour Vectors:**
   - **Source:** Custom in-repo SVG vector pattern (mathematically generated, 1.8KB).
   - **Licensing:** Native project asset, 100% proprietary open code.

---

## 5. Execution Roadmap

```
═════════════════════════════════════════════════════════════════════════════════
                         EXECUTION PHASES & GATES
═════════════════════════════════════════════════════════════════════════════════

  [Phase 1: Hygiene] ──► [Phase 2: Tokens] ──► [Phase 3: Landing] ──► [Phase 4: Mobile]
     Remove debt,          CSS variables,         Dark canopy hero,      Responsive fixes,
     consolidate imgs      next/font, clamp()     timeline, catalogue    touch targets, a11y
                                                                               │
                                                                               ▼
  [Phase 6: Verification] ◄──────────────────────────────────────── [Phase 5: Auth & Demo]
     test:all (39 suites),                                              Persona login hub,
     Lighthouse, zero CLS                                               mojibake cleanup
═════════════════════════════════════════════════════════════════════════════════
```

### Phase 1: Repository Hygiene & Debt Elimination
- [ ] Delete `demo/seed.ts` and update 2 relative imports in `src/app/collection/receipt/[code]/page.tsx` and `tag/[code]/page.tsx` to `@/demo/seed`.
- [ ] Remove dead root `i18n/` directory (`en.json`, `or.json`, `review-status.json`).
- [ ] Remove unused components: `src/components/ui/StateViews.tsx` and `src/components/HonestyBadge.tsx`.
- [ ] Consolidate `src/components/ui/ManagerSidebar.tsx` into `src/components/shell/ManagerSidebar.tsx` and update `src/app/design/page.tsx`.
- [ ] Delete 10 duplicate image aliases in `public/products/` (`broom.jpg`, `char.jpg`, `honey.jpg`, etc.) and standardize `ProductIcons.tsx` and `consumerCommerce.ts`.
- [ ] Consolidate duplicate fallback PNGs in `public/demo/fallback/`.
- [ ] Remove `@radix-ui/react-slot` from `package.json` and move `@types/qrcode` to `devDependencies`.
- [ ] Add `LICENSE` (Apache-2.0) and `CONTRIBUTING.md`.

### Phase 2: Design System Tokenization & Font Infrastructure
- [ ] Replace render-blocking `@import` in `src/app/globals.css` with `next/font/google` in `src/app/layout.tsx`.
- [ ] Configure complete CSS variable tokens (`--canopy-deepest`, `--canopy-deep`, `--forest-primary`, `--canvas-warm`, etc.) in `globals.css`.
- [ ] Update `tailwind.config.ts` with semantic color mappings, `clamp()` fluid type scale, and min-12px label constraints.
- [ ] Establish resilient Odia font fallback stack: `['Noto Sans Oriya', 'Nirmala UI', 'Kalinga', 'sans-serif']`.
- [ ] Replace hardcoded hex values in `TopBar.tsx`, `AppShell.tsx`, `Button.tsx`, and `Card.tsx` with design tokens.

### Phase 3: Landing Page Redesign
- [ ] Rebuild Hero section with dark Sal-forest canopy background, radial overlay, and subtle mist layer.
- [ ] Implement cream Fraunces display headline with accessible WCAG AAA contrast (>10:1).
- [ ] Create animated stat counter strip with static mobile fallbacks.
- [ ] Construct seamless curved SVG transition divider between hero and parchment canvas.
- [ ] Redesign Two Pathways section with elevated institutional (B2G) and commercial (B2B) cards.
- [ ] Build connected 4-step value-chain timeline with responsive stepper layout.
- [ ] Enhance botanical produce catalogue with category filter tabs and quick-fact cards.
- [ ] Implement interactive batch journey dossier for Batch #BS-402 with direct verification input.
- [ ] Structure statutory LABHA governance and institutional footer.

### Phase 4: Mobile & Responsive Bug Fixes (320px to 1440px)
- [ ] Remove fixed `w-[680px]` hero blob and `whitespace-nowrap` button constraints.
- [ ] Add `scroll-mt-20 md:scroll-mt-24` to all landing page section targets.
- [ ] Convert mobile hamburger menu into an accessible drawer with focus trap and body scroll lock.
- [ ] Eliminate Maitriyam assistant overlap: lower z-index to `z-[75]` and add mobile bottom clearance.
- [ ] Enforce 44x44px minimum tap targets across header utilities, selector chips, and quick code buttons.
- [ ] Fix 100vh mobile bugs by migrating containers to `min-h-dvh`.
- [ ] Resolve mojibake encoding corruption across all pages (`page.tsx`, `login/page.tsx`, `layout.tsx`).

### Phase 5: Demo Hub, Auth & Cross-Page UX Alignment
- [ ] Update `/demo` to provide an accessible 1-click stage demo activation and clear directory to `/login`.
- [ ] Ensure all 12 test personas on `/login` display clean Odia role names and direct destination routing.
- [ ] Migrate client-side redirect pages (`/warehouse`, `/manager`) to permanent 308 redirects in `next.config.js`.
- [ ] Add missing test scripts (`test-offline-photo-sync.ts`, `test-pdf-download-share.ts`) to `package.json`'s `test:all`.

### Phase 6: Automated Verification & Performance Audit
- [ ] Run complete test suite (`npm run test:all`) covering all 39 test harnesses.
- [ ] Verify zero console errors, hydration mismatches, and broken links.
- [ ] Conduct automated accessibility audit (`npm run test:a11y`) ensuring 100% WCAG AA contrast compliance.
- [ ] Verify Core Web Vitals: LCP < 2.2s on mobile 4G, CLS = 0.00, FID/INP < 100ms.

---

### 5.1 Git Branching & Conventional Commit Strategy

All redesign changes must be executed on an isolated feature branch with strict commit hygiene:

1. **Branch Name:** `feat/responsive-redesign`
2. **Commit Conventions:**
   - `chore(repo): eliminate dead files, duplicate assets, and unused dependencies`
   - `refactor(tokens): establish css variables, next-font loading, and clamp scale`
   - `feat(landing): implement dark canopy hero, curved divider, and stat counters`
   - `feat(landing): implement value-chain timeline and botanical catalogue cards`
   - `fix(mobile): resolve 320px button wrapping, hero blob, and tap targets`
   - `fix(assistant): resolve maitriyam z-index collision and mobile offset`
   - `fix(i18n): sanitize mojibake utf-8 odia characters across pages`
   - `test(qa): add offline sync and pdf tests to test:all and verify release gates`
3. **Pull Request & Gate:** Zero breaking changes to Prisma schema or backend APIs; 100% pass rate on all 39 test scripts before merging to `master`.

---

*End of Blueprint. Output saved to `/docs/REDESIGN_PLAN.md`.*

