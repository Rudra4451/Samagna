/**
 * BanaSetu Demo Seed & State Orchestrator (Prompt 14)
 * Governs the 3-minute stage flow across Acts 1, 2, and 3.
 */

import { db, seedInitialData } from '../lib/db';
import {
  INITIAL_BATCH_BS400,
  INITIAL_BATCH_BS402,
  INITIAL_DISCREPANCY_CASE_BS395,
  INITIAL_DISCREPANCY_CASE,
  INITIAL_AUDIT_TRAIL,
  INITIAL_COLLECTORS,
} from '../lib/seed';

export interface ActDefinition {
  act: number;
  title: string;
  subtitle: string;
  timeRange: string;
  targetRoute: string;
  focusPoint: string;
}

export const DEMO_ACTS: ActDefinition[] = [
  {
    act: 0,
    title: 'Act 0 · Institutional Fit',
    subtitle: 'TDCCOL Mandate & Dual Ledger Problem',
    timeRange: '0:00–0:30',
    targetRoute: '/demo?demo=1',
    focusPoint: 'State rate circulars, MSP price transparency, paper receipt friction.',
  },
  {
    act: 1,
    title: 'Act 1 · Village Pickup & Collection',
    subtitle: 'Zero-Typing Stepper, Offline Sync Queue & Bag Stencil Tag',
    timeRange: '0:30–1:30',
    targetRoute: '/collector?demo=1',
    focusPoint: 'Thumb-zone collection sheet, pre-filled 100kg, immediate receipt & QR stencil tag.',
  },
  {
    act: 2,
    title: 'Act 2 · Warehouse Discrepancy',
    subtitle: 'Arrival Re-Weigh (95 kg) & Moisture Allowance Math',
    timeRange: '1:30–2:30',
    targetRoute: '/inventory?demo=1',
    focusPoint: 'One-click 95kg verification, 1.5% natural transit shrinkage, instant excess flag in <300ms.',
  },
  {
    act: 3,
    title: 'Act 3 · Safeguards & Audit Timeline',
    subtitle: 'Quarantine Vault, Monotonic Audit Trail & DBT Payout Defense',
    timeRange: '2:30–3:00',
    targetRoute: '/collection/receipt/BS-402?demo=1',
    focusPoint: 'Non-punitive supervisor review (#BS-395 precedent), tribal payout guaranteed under LABHA.',
  },
];

/**
 * Reset all demo data to pristine boot state or specific act state.
 */
export async function resetDemoState(act: number = 1): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Re-seed Dexie database tables
  await seedInitialData(true);

  // 2. Adjust state per target Act
  if (act === 2) {
    // Act 2: #BS-402 is ready at Baripada depot for immediate 95kg intake verification
    const b402 = await db.batches.get('BS-402');
    if (b402) {
      await db.batches.put({
        ...b402,
        status: 'PENDING_VERIFICATION',
        step2: null,
      });
    }
  } else if (act === 3) {
    // Act 3: #BS-402 has been quarantined with excess shrinkage
    const b402 = await db.batches.get('BS-402');
    if (b402) {
      await db.batches.put({
        ...b402,
        status: 'QUARANTINED_DISCREPANCY',
        step2: {
          arrivalGrossWeightKg: 96.5,
          arrivalTareWeightKg: 1.5,
          arrivalNetWeightKg: 95.0,
          storageZone: 'Zone C - Quarantine Vault Bay 2',
          shrinkagePercentAllowed: 1.5,
          shrinkageKgAllowed: 1.5,
          unexplainedVarianceKg: -3.5,
          discrepancyTriggered: true,
          supervisorCaseId: 'DISC-402',
          verifiedBy: 'S. Das (ID: IM-04)',
          verifiedByRole: 'Warehouse Inventory Manager',
          verifiedAt: 'Today · 02:45 PM',
          notes: 'Excess deficit of -3.5 kg flagged. Batch segregated to Quarantine Bay 2 under non-accusatory protocol.',
        },
      });
    }
    await db.discrepancyCases.put(INITIAL_DISCREPANCY_CASE);
  }

  // 3. Set standard localStorage flags for stage stability
  try {
    localStorage.setItem('onboarded:collector', 'true');
    localStorage.setItem('onboarded:collection', 'true');
    localStorage.setItem('onboarded:inventory', 'true');
    localStorage.setItem('bana-setu-offline', 'false');
    localStorage.setItem('bana-setu-font-scale', '16');
    localStorage.setItem('demo:current-act', String(act));
    localStorage.setItem('demo:fallback-active', 'false');
  } catch (err) {
    console.error('Could not set localStorage in demo reset', err);
  }

  // 4. Notify app listeners
  window.dispatchEvent(new Event('bana-setu-demo-reset'));
  window.dispatchEvent(new Event('storage'));
}
