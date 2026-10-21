# ACCESSIBILITY.md — BanaSetu Inclusive Design & A11y Standards

> **Status:** Active & Enforced in Code  
> **Verification Script:** `npm run test:a11y` (`scripts/check-a11y.ts`)  
> **Reference Specs:** WCAG 2.1 AA / Section 508 / WAI-ARIA 1.2 / Prompts 0, 1, 9, 10, 12

---

## 1. Contrast (Measure, Don't Guess)

Every 12–14px body text / background pair must hit $\ge 4.5:1$ contrast ratio. Every large heading ($\ge 18\text{pt}$ / $24\text{px}$) must hit $\ge 3:1$.

### Global Token Contrast Matrix (WCAG 2.1 AA Relative Luminance)

| Token Pair | Foreground Hex | Background Hex | Measured Ratio | WCAG AA Threshold | Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| `ink` on `bg` | `#1F1A14` | `#FAF6EE` | **16.02 : 1** | $\ge 4.5:1$ | **PASS** |
| `ink` on `surface` | `#1F1A14` | `#FFFFFF` | **17.27 : 1** | $\ge 4.5:1$ | **PASS** |
| `ink-muted` on `bg` | `#5E5245` | `#FAF6EE` | **7.04 : 1** | $\ge 4.5:1$ | **PASS** |
| `ink-muted` on `surface` | `#5E5245` | `#FFFFFF` | **7.58 : 1** | $\ge 4.5:1$ | **PASS** |
| `sidebar-ink` on `sidebar-bg` | `#E9E3D3` | `#1F2A22` | **11.61 : 1** | $\ge 4.5:1$ | **PASS** |
| `warning` on `warning-tint` | `#854C0E` | `#EDE5D8` | **5.53 : 1** | $\ge 4.5:1$ | **PASS** |
| `warning` on `bg` | `#854C0E` | `#FAF6EE` | **6.41 : 1** | $\ge 4.5:1$ | **PASS** |
| `success` on `success-tint` | `#2E5C2D` | `#E6ECE2` | **6.50 : 1** | $\ge 4.5:1$ | **PASS** |
| `success` on `bg` | `#2E5C2D` | `#FAF6EE` | **7.26 : 1** | $\ge 4.5:1$ | **PASS** |
| `danger` on `bg` | `#8E2F26` | `#FAF6EE` | **7.54 : 1** | $\ge 4.5:1$ | **PASS** |
| `danger` on `surface` | `#8E2F26` | `#FFFFFF` | **8.12 : 1** | $\ge 4.5:1$ | **PASS** |
| `accent` on `bg` | `#B24E2E` | `#FAF6EE` | **4.84 : 1** | $\ge 4.5:1$ | **PASS** |
| `accent` on `surface` | `#B24E2E` | `#FFFFFF` | **5.22 : 1** | $\ge 4.5:1$ | **PASS** |

### Token Adjustments Applied Globally (in `src/app/globals.css`):
1. **`ink-muted`**: Shifted from `#6B5F52` (borderline on warm tinted backgrounds) to `#5E5245`. Yields **7.04:1** on `#FAF6EE` and **7.58:1** on `#FFFFFF`.
2. **`warning`**: Darkened from `#A36200` to `#854C0E` (deep amber-ochre). Yields **5.53:1** on 10% warning tint (`#EDE5D8`) and **6.41:1** on `#FAF6EE`.
3. **`success`**: Darkened from `#336B31` to `#2E5C2D` (deep forest spruce). Yields **6.50:1** on 10% success tint (`#E6ECE2`) and **7.26:1** on `#FAF6EE`.
4. **`info`**: Deep slate navy `#234252` yielding **>7.8:1** on `#FAF6EE`.

*Rule:* Tokens are modified once globally in CSS custom properties — never patched per-component.

---

## 2. Colour Independence

No critical information is communicated by colour alone. Every status badge, discrepancy flag, and sync indicator combines **three redundant channels**:
1. **Status Label text** (11px uppercase monospace or small-caps).
2. **2px Left Border** in the status token hue (`border-l-2`).
3. **Preceding Geometric Shape / Lucide Icon**:
   - `●` (Solid circle) — Available / Synced / Verified (`success`)
   - `◆` (Solid diamond) — Pending Verification / Queued (`warning`)
   - `▲` (Solid upward triangle) — Discrepancy Flag / Quarantined (`danger`)
   - `■` (Solid square) — Sold / Info (`info`)
   - `○` (Hollow circle) — Neutral / Draft (`ink-muted`)
   - `↻` (Cycle arrow) — Syncing in-flight
   - `★` (Star) — Accent milestone

Implemented in:
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/VerifiedBadge.tsx`
- `src/components/ui/SyncStatusBadge.tsx`
- `src/components/artifacts/DiscrepancyCardArtifact.tsx`

---

## 3. Keyboard Navigation

The entire application is 100% operable without a pointing device:

### Collector Flow
- **Tabs:** `Tab` moves through bottom tabs (`Home`, `Prices`, `Requests`, `Help`). Active tab has `role="tab"`, `aria-selected="true"`.
- **Pickup Request Sheet:** Triggerable via `Enter` or `Space`.
- **Quantity Stepper:** Implemented with `role="spinbutton"`, `aria-valuenow`, `aria-valuemin="5"`, `aria-valuemax="500"`.
  - `ArrowUp` / `ArrowRight`: increases quantity by step (+5 kg).
  - `ArrowDown` / `ArrowLeft`: decreases quantity by step (-5 kg).
  - `Home` / `End`: jumps to 5 kg / 500 kg.
- **Submission & Receipts:** `Enter` submits form; focus moves to confirmation card; `Enter` opens print dialog or triggers share.

### Manager Flows (Collection & Inventory)
- **`j` / `k`**: Navigate down / up table rows with visible active row indicator.
- **`Enter`**: Open selected row drawer.
- **`/`**: Jump directly to global search input from anywhere on the page.
- **`Esc`**: Ordered dismissal: closes topmost drawer/sheet $\rightarrow$ blurs search box $\rightarrow$ clears active filters.
- **`g then c` / `g then i` / `g then s`**: Navigate to Collection, Inventory, or Settings.
- **`?`**: Toggle Keyboard Shortcuts help drawer.
- **`s`**: Initiate background sync from Sync drawer.

---

## 4. Screen Reader Support (VoiceOver / NVDA)

1. **Form Labels:** Every `<input>`, `<select>`, and `<textarea>` is paired with a real `<label>` element (`<label htmlFor="...">`), not `aria-label` only.
2. **Table Semantic Headers:** Every table column header declares `<th scope="col">` (via `TableHead` or native `th`), and row headers use `<th scope="row">` where appropriate.
3. **Modal & Sheet Announcements:** Drawers and bottom sheets declare `aria-live="polite"` on content containers and programmatically shift focus to `DrawerTitle` / `BottomSheetTitle` upon opening. Focus is trapped inside dialogs and returns to trigger upon closing (`@radix-ui/react-dialog`).
4. **Toasts:** Active notification banners use `role="status"` and `aria-live="polite"` (never aggressive `assertive`) to avoid interrupting user speech.
5. **Atomic Sync State Announcements:** `SyncStatusBadge` encapsulates state changes inside an `<span className="sr-only" aria-live="polite" aria-atomic="true">` announcing solely the new state (e.g. *"Status updated: Synced"*), preventing the screen reader from re-reading the entire table row.

---

## 5. Zoom & Font Scaling

1. **200% Browser Zoom:** All containers use flexible grid/flexbox layouts with `max-w-` constraints and horizontal scrolling wrappers (`overflow-x-auto`) for data tables. No text is clipped or overlapping at 200% desktop zoom.
2. **Collector Font-Scale Toggle:** Supports **16px**, **18px**, and **20px** base body scaling without horizontal overflow or truncating batch numbers, rates, or Odia script ligatures.

---

## 6. Motion & Vestibular Safety

Respects `prefers-reduced-motion: reduce` at the root stylesheet level (`src/app/globals.css`):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
All slide-in drawers, fading overlays, and skeleton pulses become instant cuts.

---

## 7. Touch Targets (Minimum 44×44 CSS px)

1. **All Interactive Elements:** Buttons, tab triggers, inputs, checkboxes, and links meet or exceed **44×44 CSS px** tap targets on mobile viewports:
   - Mobile primary action buttons: 52px–56px height.
   - Tab bar items: 64px height.
   - Table row tap targets: 44px height in comfortable mode.
   - Stepper buttons: 48×48px.
2. **Documented Exception:** Non-interactive status badges / chips (`StatusBadge`, `VerifiedBadge`, `SyncStatusBadge`) are compact metadata pills (20–24px height). As they are strictly display-only and not clickable targets, they are exempt under WCAG 2.5.5 / 2.5.8.

---

## 8. Copy Readability (Collector-Facing $\le$ Grade 9)

Collector-facing copy in `src/i18n/en.json` is optimized for low-literacy users, verified via the Flesch-Kincaid Grade Level formula:
$$\text{Grade Level} = 0.39 \left(\frac{\text{total words}}{\text{total sentences}}\right) + 11.8 \left(\frac{\text{total syllables}}{\text{total words}}\right) - 15.59$$

### Audit Results:
- **`collector.empty_requests_body`**: *"You have no active pickup requests scheduled."* $\rightarrow$ **Grade 4.2**
- **`collector.facilitator_note`**: *"Your village helper can also book this for you."* $\rightarrow$ **Grade 3.6**
- **`complaint.info`**: *"We protect collectors from wrong scale cuts or slow pay."* $\rightarrow$ **Grade 3.9**
- **`sheet.pickup_desc`**: *"Steps 1 to 3: Pick crop, amount, and center"* $\rightarrow$ **Grade 2.5**
- **`receipt.dbt_badge`**: *"Direct bank transfer to your account"* $\rightarrow$ **Grade 5.8**
- **`offline.submit_caption`**: *"Will be saved locally and sync when online."* $\rightarrow$ **Grade 3.8**

*Every collector-facing string is $\le$ Grade 8.*

> **Odia Copy Governance:** Machine translations are strictly barred for production. All Odia strings in `src/i18n/or.json` require review and sign-off by a native Odia speaker from Mayurbhanj district prior to field release.

---

## 9. Forms & Descriptive Validation Messages

1. **No Placeholder As Label:** Placeholders provide formatting examples only (e.g. `e.g. BS-402`). Visible `<label>` tags identify the field purpose.
2. **Field-Specific Error Resolution:** Error messages name the field and explicitly instruct how to fix the error:
   - **Gross Weight:** *"Gross weight must be a number between 1 and 1000."* (Not *"Invalid input"*).
   - **Tare Weight:** *"Tare weight must be lower than gross weight. Adjust tare deduction."*
   - **Arrival Weight:** *"Arrival weight must be a number between 1 and 1000."*
   - **Short Code Lookup:** *"No batch found with code '...'. Enter a valid code like BS-402."*

---

## 10. Focus Visibility

- **Keyboard Focus Ring:** Default outline is `2px solid var(--accent)` with `2px` offset (`outline-offset: 2px`). Visible on every interactive element.
- **Dark Sidebar Focus Contrast:**
  ```css
  aside :focus-visible,
  [data-theme='dark'] :focus-visible {
    outline: 2px solid #E9E3D3 !important;
    outline-offset: 2px !important;
  }
  ```
  On the dark green sidebar (`#1F2A22`), focused buttons display high-contrast `#E9E3D3` (11.61:1).

---

## Automated Verification Suite (`npm run test:a11y`)

Run anytime to audit code against this specification:
```bash
npm run test:a11y
```
Checks:
- WCAG AA $\ge 4.5:1$ contrast for all token pairs.
- Real `<label>` pairing for all `<input>`, `<select>`, `<textarea>`.
- `<th scope="col">` / `<th scope="row">` compliance on all tables.
- Flesch-Kincaid $\le$ Grade 9 on collector strings.
- Invariant zero-tolerance check for forbidden punitive vocabulary.
