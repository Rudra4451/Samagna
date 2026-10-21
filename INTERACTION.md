# INTERACTION.md — BanaSetu Interaction Contract

This document defines the behavioral and interaction rules governing the BanaSetu application. It prescribes how the application behaves, enforces cognitive and operational budgets, and establishes strict invariants for field ledger resilience.

---

## 1. Click Budget & Core Flow Budgets

Every core task has a strict upper bound on user interactions. Any flow exceeding its budget must be redesigned:

| Core Task | Max Clicks | Measured Path |
| :--- | :---: | :--- |
| **Collector submits pickup** | **≤ 4** | 1. Tap "Request pickup" (opens sheet) → 2. Adjust quantity (+/-) → 3. Tap "Submit pickup request" → 4. See confirmation toast |
| **Collector views receipt** | **≤ 2** | 1. Tap "View receipt" on receipt row → 2. Bottom sheet displays certified weights and payout breakdown |
| **Collection manager records collection** | **≤ 6** | 1. Click row in queue → 2. Fill/verify gross & tare weights → 3. Select quality grade (A/B/C) → 4. Review A6 tag preview → 5. Click "Confirm collection" → 6. See receipt toast & status promotion |
| **Inventory manager verifies batch** | **≤ 4** | 1. Click batch row → 2. Verify arrival weight & scale seal → 3. Observe shrinkage evaluation & flag → 4. Click "Approve to saleable" |

---

## 2. Primary Action Placement

Every view contains **exactly one** primary action (`bg-accent text-accent-ink`). Never place two primary buttons on one screen:

- **Desktop Drawer**: Bottom-right corner of the drawer footer (`DrawerFooter`). Secondary actions align to the left.
- **Desktop Full Page**: Top-right corner of the page container, aligned horizontally with the page title and metadata row.
- **Mobile View**: Full-width sticky action at the screen bottom, exactly 56px tall (`h-[56px] min-h-[44px]`), resting immediately above the 64px tab bar.

---

## 3. Confirmation Grammar

Confirmation weight is strictly matched to action reversibility:

1. **Reversible Actions** (e.g., save offline, edit field value, change storage location):
   - **No confirmation modal or dialog.**
   - Action executes immediately and dispatches an **Undo Toast** remaining active for **6 seconds**.
2. **Semi-Reversible Actions** (e.g., promote to saleable, synchronize offline queue):
   - **Inline confirmation only.** The trigger replaces its label with inline confirmation options (e.g., "Confirm promotion? [Yes] [Cancel]"). No floating modals.
3. **Irreversible Actions** (e.g., permanent cancellation of queued pickup, batch write-off):
   - Requires a **typed confirmation word** (`"confirm"` or localized equivalent) entered in an inline text field before the submit button unlocks.
4. **Strict Invariants**:
   - Never use `window.alert()`, `window.confirm()`, or `window.prompt()`.
   - Never stack a modal on top of another modal.

---

## 4. Receipts of Action (No Silent Successes)

Every user action must result in a visible state change accompanied by an auditable "receipt":
- **Toast with Concrete Result**: Specific figures, codes, or delta weights (e.g., *"Collection confirmed · #BS-402 · 100.0 kg net"*).
- **Inline Result Row**: New row dynamically prepended to the ledger table or audit timeline with monotonic timestamp.
- **Printable Output**: Dedicated printable document (A6 batch tag or A5 bilingual receipt).
- **State Badge Mutation**: Immediate visible status transition (e.g., `Pending` → `Collected` → `Available`).

---

## 5. Client-Side Idempotency

All mutation triggers ("Confirm", "Submit", "Approve", "Sync") must be safely clickable multiple times without corrupting state or creating duplicate entries:
- Every action execution generates a unique client-side idempotency key (`act-{name}-{timestamp}-{random}`).
- The trigger button enters a disabled state for at least **300ms** after execution completes (`minPendingMs: 300`).
- While in-flight (`isPending`), duplicate click events are dropped.

---

## 6. Cancel & Discard Semantics

- **Keyboard Escape**: Pressing `Esc` dismisses the topmost active layer only.
- **Draft Persistence**: Unconfirmed form inputs (stepper quantities, scale tare entries) survive drawer/sheet closing and persist in session draft state.
- **Auditable Finality**: Confirmed collections cannot be cancelled silently without an auditable discrepancy note.
- **Unsaved Changes Prompt**: When unsaved edits exist, closing triggers an inline warning: *"Unsaved changes — discard? [Discard] [Keep Editing]"*.

---

## 7. Stale Data Handling

Every list and detail view displays its fetch status in **11px font-mono text-ink-subtle**:
- Format: `Fetched HH:MM:SS (Xs ago)`
- When data age exceeds **60 seconds**, an inline trigger appears: `Stale · refresh`.
- The application **never auto-refreshes silently**, preventing layout shifts during active field data entry.

---

## 8. Undo Over Confirmation (Mandatory Scenarios)

The application implements immediate undo with 6-second window for reversible operations:
1. **Undo Remove from Offline Queue**: Restores cached offline collection record into IndexedDB/state.
2. **Undo Storage Location Change**: Reverts warehouse rack assignment to previously assigned zone.
3. **Undo Reject Reason on Batch**: Restores batch status from `Quarantined` to `Pending Verification`.

---

## 9. Focus Management & Accessibility

- **Opening**: Opening a drawer or bottom sheet shifts programmatic focus directly to its title element (`DrawerTitle` / `BottomSheetTitle`).
- **Closing**: Closing restores focus automatically to the trigger element that initiated the layer.
- **Tab Order**: Tab order mirrors the DOM hierarchy exactly.
- **Visible Focus Rings**: Every focusable element maintains a 2px solid terracotta focus outline (`:focus-visible { outline: 2px solid var(--accent); }`).

---

## 10. Four Distinct System States

The system strictly avoids conflating missing or empty data. Every table, list, and stat tile explicitly renders one of four distinct states:

| State | Visual Treatment | Example Copy |
| :--- | :--- | :--- |
| **Empty** | Bordered card, small-caps section label, neutral body copy, one rectangular action | *"No collection requests recorded in this Van Dhan Kendra yet."* |
| **Zero (Success)** | Bordered card, success status badge, green indicator dot | *"All batches verified — 0 items remaining in arrival queue."* |
| **Unknown (Error)** | 1px danger border, danger text caption, rectangular "Retry fetch" button | *"Could not read local cache · Check device storage permissions."* |
| **Loading (In-Flight)** | Static 1px-bordered grey blocks, no shimmer, no moving animation | Block skeleton placeholders matching target layout dimensions |
