# DESIGN_MOTION.md — BanaSetu Motion System Specification

> **Status:** Active & Strictly Enforced in Code  
> **Source Helper:** [`src/lib/motion.ts`](file:///c:/Users/rudra/Bana%20Setu/src/lib/motion.ts)  
> **Stylesheet:** [`src/app/globals.css`](file:///c:/Users/rudra/Bana%20Setu/src/app/globals.css)  
> **Interactive Live Showcase:** [`/design`](http://localhost:3000/design) (Section 11)  
> **Reference Specs:** Prompts 0, 1, 9, 15

---

## The Four Allowed Motion Patterns

BanaSetu is designed as an unadorned field integrity ledger. Animation is used exclusively for spatial context and state continuity. Exactly four motion patterns are permitted in the application. Any motion not listed here is strictly prohibited.

| Pattern | Trigger | Transform / Properties | Timing & Duration | Timing Function | Reduced Motion (`prefers-reduced-motion: reduce`) |
|:---|:---|:---|:---:|:---:|:---:|
| **1a. Drawer Slide** | Record inspection open/close | `translateX(100%) → translateX(0)` | Enter: **180ms**<br>Exit: **140ms** | `cubic-bezier(0.16, 1, 0.3, 1)` | Instant show / hide (`transform: none`, `transition: none`) |
| **1b. Sheet Slide** | Mobile bottom sheet open/close | `translateY(100%) → translateY(0)` | Enter: **180ms**<br>Exit: **140ms** | `cubic-bezier(0.16, 1, 0.3, 1)` | Instant show / hide (`transform: none`, `transition: none`) |
| **2. Badge Crossfade** | Batch status change | `background-color`, `color`, `border-color` | **120ms** | `linear` | Instant colour swap (`transition: none`) |
| **3. Toast Slide** | System receipt / notification | `translateY(100%) → translateY(0)` | Enter: **150ms**<br>Exit: **120ms** | Enter: `ease-out`<br>Exit: `ease-in` | Instant display (`transform: none`, `opacity: 1`) |
| **4. Audit Timeline Live Entry** | Event logged in current session | `opacity: 0 → 1` | **100ms** | `linear` | Instant display (`opacity: 1`, `transition: none`) |

---

## Detailed Pattern Implementations

### Pattern 1: Drawer / Sheet Slide-In
- **Drawer:** Slides from the right viewport edge (`translateX(100%) → 0`). Open is `180ms cubic-bezier(0.16, 1, 0.3, 1)`. Close is `140ms reverse`.
- **Sheet:** Slides from the bottom viewport edge (`translateY(100%) → 0`). Open is `180ms cubic-bezier(0.16, 1, 0.3, 1)`. Close is `140ms reverse`.
- **Hard Rule:** **No opacity crossfade** on the backdrop overlay or the drawer content. Modals appear with an instant clean backdrop cut (`bg-ink/40`).
- **Code Reference:** [`src/components/ui/Drawer.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/ui/Drawer.tsx), [`src/components/ui/BottomSheet.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/ui/BottomSheet.tsx)
- **CSS Utility:** `.motion-drawer-slide`, `.motion-sheet-slide`

### Pattern 2: Status Badge Crossfade
- Triggered **only** when a batch or record transitions state (e.g. `Draft` $\rightarrow$ `Queued` $\rightarrow$ `Synced`, or `Pending` $\rightarrow$ `Available` / `Quarantined`).
- Exactly **120ms** colour crossfade across background, text, and border.
- **Hard Rule:** **No scale, no bounce, no size change.**
- **Code Reference:** [`src/components/ui/StatusBadge.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/ui/StatusBadge.tsx), [`src/components/ui/SyncStatusBadge.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/ui/SyncStatusBadge.tsx)
- **CSS Utility:** `.motion-badge-crossfade`

### Pattern 3: Toast Enter / Exit
- Bottom slide: **150ms ease-out** on enter (`translateY(100%) → 0`), **120ms ease-in** on exit (`translateY(0) → translateY(100%)`).
- **Stacking Invariant:** **Maximum one toast at a time.** New toasts instantly replace rather than stack.
- **Screen Reader:** `role="status"`, `aria-live="polite"`.
- **Code Reference:** [`src/components/ui/Toast.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/ui/Toast.tsx)
- **CSS Utility:** `.motion-toast-slide`, `.motion-toast-enter`, `.motion-toast-exit`

### Pattern 4: Audit Timeline Live Event Fade
- **100ms** opacity fade on entry (`opacity: 0 → 1`).
- Applied **only** to events recorded during the active session (`isLive: true`).
- **Hard Rule:** Historical events loaded from storage are rendered with **zero animation** (`opacity: 1` static).
- **Code Reference:** [`src/components/artifacts/AuditTimelineArtifact.tsx`](file:///c:/Users/rudra/Bana%20Setu/src/components/artifacts/AuditTimelineArtifact.tsx)
- **CSS Utility:** `.motion-audit-live`

---

## Disallowed Motion Audit (Strict Banned List)

The following motion patterns are absolutely banned from the BanaSetu codebase:

1. **Hover Animations:** No scale (`transform: scale(...)`), no vertical lift (`translateY(-2px)`), no shadow growth. Button and link hover effects are strictly limited to colour transitions with **max 80ms duration** (`.transition-colors { transition-duration: 80ms !important; }`).
2. **Page Transitions:** Navigating between `/collector`, `/collection`, `/inventory`, `/settings` is completely instantaneous. Zero crossfade or route transition.
3. **Skeleton Shimmer:** Skeletons are rendered as static 1px-bordered grey blocks. No gradient sweeps, no shimmer, no pulsing.
4. **Number Count-Up:** All numbers, quantities, prices, and percentages appear immediately at their final value. No tick-up / count-up counters.
5. **Confetti / Celebration Effects:** Strictly prohibited. When a collector submits or a payment disburses, the official printable receipt *is* the confirmation.
6. **Parallax, Scroll Reveals, Marquees:** Prohibited. Content is anchored in DOM flow.
7. **Loader Spinners:** No rotating circular loaders or loading dots. Actions taking $>400\text{ms}$ display static skeleton blocks or the text label *"Still working…"* (Prompt 10 / Prompt 15).
8. **Attention Pulse:** No pulsing badges, ringing icons, or glowing buttons (`animate-pulse` banned).
9. **Collector Primary Action:** The primary action button (e.g. *"Request pickup"*, *"Submit"*) has zero entrance animation or idle throbbing.

---

## Reduced Motion Guarantee

In accordance with WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions), enabling `prefers-reduced-motion: reduce` in the browser or operating system instantly zeroes all transitions:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition: none !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }

  .motion-drawer-slide,
  .motion-sheet-slide {
    transform: none !important;
    transition: none !important;
  }
  .motion-badge-crossfade {
    transition: none !important;
  }
  .motion-toast-slide {
    transform: none !important;
    opacity: 1 !important;
    transition: none !important;
  }
  .motion-audit-live {
    opacity: 1 !important;
    transition: none !important;
  }
}
```

---

## Live Interactive Demonstrations

Live test examples of all four patterns are accessible at:
- **URL:** [`http://localhost:3000/design`](http://localhost:3000/design)
- **Section 11:** *The Four Allowed Motion Patterns*
  - **Pattern 1:** Test interactive Drawer (180ms ease-out) and Sheet (180ms bottom slide).
  - **Pattern 2:** Live status badge toggle cycling Available $\rightarrow$ Pending $\rightarrow$ Quarantined (120ms crossfade).
  - **Pattern 3:** Trigger toast with 150ms slide-in / 120ms exit, proving new toasts replace rather than stack.
  - **Pattern 4:** Live audit timeline event generator triggering the 100ms entry fade on newly created entries only.
