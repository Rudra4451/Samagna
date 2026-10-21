/**
 * BanaSetu Field Ledger Motion System (Prompt 15)
 *
 * Strict Motion Specification:
 * Exactly four allowed motion patterns exist in the application.
 * Any motion not listed here is strictly prohibited.
 *
 * Allowed motion (4 patterns, nothing else):
 * 1. Drawer / sheet slide-in: transform translateX(100%) -> 0 (drawer) or translateY(100%) -> 0 (sheet).
 *    180ms cubic-bezier(0.16, 1, 0.3, 1). No opacity crossfade. Close is 140ms reverse.
 * 2. Status badge crossfade: Only when a batch changes state (e.g., pending -> available).
 *    120ms colour crossfade on background and text. No scale, no bounce.
 * 3. Toast enter/exit: bottom slide 150ms ease-out on enter, 120ms ease-in on exit.
 *    Max one toast at a time; new toasts replace rather than stack.
 * 4. Audit timeline new event: 100ms opacity fade on entry.
 *    Only for events created during the current session. Historical events never animate.
 *
 * Disallowed, absolutely:
 * - Hover animations (colour transitions max 80ms; no scale, no lift, no shadow).
 * - Page transitions (route change is instant).
 * - Skeleton shimmer (static skeleton blocks only, no pulse).
 * - Number count-up on stat tiles.
 * - Confetti. Ever.
 * - Parallax, scroll reveals, marquees.
 * - Loader spinners. Use skeleton or "Still working…" copy after 400ms.
 * - Attention pulse on any element.
 * - Any animation on the collector's primary action button.
 *
 * Reduced motion:
 * - prefers-reduced-motion: reduce disables all 4 patterns (instant transitions).
 */

export const MOTION_PATTERNS = {
  // Pattern 1a: Drawer slide-in
  drawer: {
    name: 'Drawer Slide-In',
    enterDurationMs: 180,
    exitDurationMs: 140,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transformEnter: 'translateX(100%) -> translateX(0)',
    transformExit: 'translateX(0) -> translateX(100%)',
    className: 'motion-drawer-slide',
  },

  // Pattern 1b: Sheet slide-in
  sheet: {
    name: 'Sheet Slide-In',
    enterDurationMs: 180,
    exitDurationMs: 140,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transformEnter: 'translateY(100%) -> translateY(0)',
    transformExit: 'translateY(0) -> translateY(100%)',
    className: 'motion-sheet-slide',
  },

  // Pattern 2: Status badge crossfade
  statusBadge: {
    name: 'Status Badge Crossfade',
    durationMs: 120,
    easing: 'linear',
    properties: ['background-color', 'color', 'border-color'],
    className: 'motion-badge-crossfade',
  },

  // Pattern 3: Toast enter/exit
  toast: {
    name: 'Toast Slide',
    enterDurationMs: 150,
    exitDurationMs: 120,
    enterEasing: 'ease-out',
    exitEasing: 'ease-in',
    maxToasts: 1, // Max one toast at a time; replaces rather than stacks
    className: 'motion-toast-slide',
  },

  // Pattern 4: Audit timeline new event
  auditTimeline: {
    name: 'Audit Timeline Live Event Fade',
    durationMs: 100,
    easing: 'linear',
    property: 'opacity',
    className: 'motion-audit-live',
  },
} as const;

export type AllowedMotionPattern = keyof typeof MOTION_PATTERNS;

/**
 * Returns the CSS class name for a given allowed motion pattern.
 */
export function getMotionClass(pattern: AllowedMotionPattern): string {
  return MOTION_PATTERNS[pattern].className;
}
