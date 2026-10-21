# BanaSetu 3-Minute Stage Script (`DEMO_SCRIPT.md`)
**Institutional Target**: Tribal Development Co-operative Corporation of Odisha (TDCCOL) & LABHA Yojana  
**Total Stage Timing**: 2:45 min (+15s buffer for audience pause / applause)  
**Rule**: Zero typing on stage. Every input is pre-filled (`100, 0, 100` collection; `95` arrival). Discrepancy renders in &lt;300ms.

---

## Stage Overview & Second-by-Second Map

```
0:00                    0:30                                    1:30                            2:30          2:45  3:00
|-----------------------|---------------------------------------|-------------------------------|--------------|-----|
  ACT 0: INSTITUTIONAL     ACT 1: VILLAGE PICKUP & COLLECTION      ACT 2: WAREHOUSE DISCREPANCY   ACT 3: SAFEGUARDS  BUFFER
  Problem & Mandate        Zero-Typing, Offline Queue & Sack Tag   Arrival 95 kg, Shrinkage Math  Audit & LABHA Payout
```

---

## Detailed Second-by-Second Execution Matrix

| Time Window | Screen / Route | Presenter Action (Zero Typing) | Spoken Script / Pitch Cue | Fallback Trigger |
|---|---|---|---|---|
| **0:00 – 0:15** | Deck / `/demo?demo=1` | Stand center stage. Boot app to `/demo?demo=1`. | *"In Odisha, 1.4 million tribal forest gatherers harvest minor forest produce under the scorching sun. But their earnings leak across a dual-ledger divide: paper receipts in the village, separate digital tally in state warehouses."* | Slide 1 (`/demo/fallback/1.png`) |
| **0:15 – 0:30** | `/demo?demo=1` | Click **"Launch Act 1 (/collector)"**. | *"Under the state’s LABHA Yojana, minimum support prices are mandated by law. Yet moisture loss in transit is frequently weaponized against tribal self-help groups. We built BanaSetu to make forest produce custody immutable and non-punitive."* | Slide 1 |
| **0:30 – 0:50** | `/collector?demo=1` | View mobile card for **Sunita Soren** in Badagaon. Tap **"Request Pickup"** bottom sheet. | *"Here is Sunita Soren’s phone in Badagaon village. Notice three things: 36px Fraunces numbers lead, Odia script is first-class, and actions live in the thumb zone. She dropped 100 kg of Mahua flowers at ₹42/kg."* | Slide 1 |
| **0:50 – 1:10** | `/collection?demo=1` | Switch to Collection Manager view. Click Row **#BS-402**. Form opens pre-filled (`100, 0, 100`). Click **"Confirm Weighment & Dispatch"**. | *"At the aggregation point, Collection Manager Mohanty verifies the electronic scale. Zero typing needed: 100 kg gross, 0 kg tare, 100 kg net are pre-filled. One click seals Batch #BS-402 into durable local Dexie storage."* | Slide 2 (`/demo/fallback/2.png`) |
| **1:10 – 1:30** | `/collection/tag/BS-402?demo=1` & `/collection/receipt/BS-402?demo=1` | Display printed A6 Stencil Tag and bilingual Receipt. | *"Immediately, two immutable physical artifacts are created: a bilingual Odia-English receipt protecting Sunita’s ₹4,200 DBT payout, and an A6 bag stencil tag with seal OD-MBJ-KRN-402 for the truck."* | Slide 3 (`/demo/fallback/3.png`) |
| **1:30 – 1:55** | `/inventory?demo=1` | Switch to Warehouse Inventory view. Click row **#BS-402** waiting in custody queue. Drawer opens with pre-filled **95.0 kg**. | *"The truck travels 132 km to Baripada Central Depôt. Inventory Manager S. Das places the sacks on the platform scale. Arrival weight: 95.0 kg. That’s a 5 kg loss. What happens next?"* | Slide 4 (`/demo/fallback/4.png`) |
| **1:55 – 2:15** | `/inventory?demo=1` (Drawer) | Observe Discrepancy Card rendered in **&lt;300ms**. Point to allowable shrinkage vs excess loss. | *"Watch this card—computed in under 300 milliseconds. BanaSetu’s shrinkage engine applies the mandated 1.5% natural moisture allowance (-1.5 kg). But the remaining 3.5 kg deficit is unexplained. Instead of blaming the tribal gatherer, the lot is segregated to Quarantine Vault Bay 2."* | Slide 5 (`/demo/fallback/5.png`) |
| **2:15 – 2:30** | `/inventory?demo=1` | Click **"Hold for Supervisor Review"**. Toast confirms quarantine. | *"Notice the language: strictly non-accusatory. Case #DISC-402 is assigned to District Procurement Officer Patnaik. The batch is locked from saleable stock, but Sunita’s village payout remains 100% safeguarded."* | Slide 5 |
| **2:30 – 2:45** | `/collection/receipt/BS-402?demo=1` & Audit Tab | Show Monotonic Custody Hash & Precedent Case **#BS-395**. | *"Our cryptographic audit log proves custody at every second. And look at historical Case #BS-395: when a moisture meter confirmed natural desiccation, the supervisor reconciled the batch without penalties. That is institutional trust."* | Slide 6 (`/demo/fallback/6.png`) |
| **2:45 – 3:00** | `/demo/handoff` | Click **"Post-Demo Evaluator Handoff"**. Show QR code & colophon. | *"Zero box-shadows, zero gradients, 100% offline-first. Scan the QR code to review our live repo and evaluator dossier. BanaSetu turns minor forest produce into verifiable tribal wealth. Thank you."* | Slide 6 |

---

## Stage Controls Quick Reference

The **Demo Control Panel** is permanently docked at the bottom-right on all `?demo=1` screens:

- **Reset demo data**: Instantly re-seeds IndexedDB to pristine baseline (`#BS-400` verified 60kg, `#BS-402` pending, Budhu queued sync).
- **Force offline**: Deterministically toggles offline banner and background sync queue.
- **Force sync conflict**: Demonstrates dual-write conflict resolution on `#BS-402`.
- **Jump to**: Direct 1-click jumps to `Collector`, `Collection`, `Inventory`, `Tag`, and `Receipt`.
- **Show fallback**: Replaces current view with corresponding 2x high-resolution screenshot if projector or network glitches.
- **Script Bar**: Toggled via `?demo=1&script=1`. Teleprompter bar displays current line and second marker across the top 32px of the viewport.

---

## Invariant Verifications

1. **Zero Typing**: Pre-filled weights (`100, 0, 100` and `95.0 kg`).
2. **Deterministic Offline**: Simulated network engine prevents un-deterministic cloud failures.
3. **Recovery in 1 Click**: Accidental navigation is repaired by clicking **"Resume from start of Act X"** in `/demo`.
4. **Contrast & Aesthetics**: Strict 1px rules, Fraunces serif headings, IBM Plex Sans, Noto Sans Oriya, no gradients, no shadows.
