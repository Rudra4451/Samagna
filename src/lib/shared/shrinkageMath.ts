/**
 * src/lib/shared/shrinkageMath.ts
 *
 * Isomorphic, Single-Source-of-Truth Shrinkage & Moisture Loss Calculation Engine
 * Shared identically between client UI views (warehouse intake) and server validation schemas.
 * 
 * Enforces Government of Odisha LABHA Scheme natural loss standards:
 * - Benchmark allowable natural loss: 1.5%
 * - Discrepancy threshold: > 2.0 kg unexplained variance
 */

export interface ShrinkageCalculationInput {
  dispatchedNetKg: number;
  arrivalNetKg: number;
  tolerancePercent?: number; // Default: 1.5%
  discrepancyThresholdKg?: number; // Default: 2.0 kg
}

export interface ShrinkageCalculationResult {
  dispatchedNetKg: number;
  arrivalNetKg: number;
  tolerancePercent: number;
  actualLossKg: number;
  shrinkageKgAllowed: number;
  unexplainedVarianceKg: number;
  isLossWithinTolerance: boolean;
  discrepancyTriggered: boolean;
  statusRecommendation: 'VERIFIED_SALEABLE' | 'QUARANTINED_DISCREPANCY';
}

/**
 * Calculates transit shrinkage and variance with exact decimal rounding (2 decimal places)
 */
export function calculateShrinkage({
  dispatchedNetKg,
  arrivalNetKg,
  tolerancePercent = 1.5,
  discrepancyThresholdKg = 2.0,
}: ShrinkageCalculationInput): ShrinkageCalculationResult {
  const dispatched = Number(dispatchedNetKg.toFixed(2));
  const arrival = Number(arrivalNetKg.toFixed(2));
  const tolerance = Number(tolerancePercent.toFixed(2));

  // Allowable natural moisture loss (e.g. 1.5% of dispatched net)
  const shrinkageKgAllowed = Number(((dispatched * tolerance) / 100).toFixed(2));

  // Actual transit weight difference
  const actualLossKg = Number((dispatched - arrival).toFixed(2));

  // Unexplained variance: loss in excess of allowed shrinkage
  const rawExcessLoss = Number((actualLossKg - shrinkageKgAllowed).toFixed(2));
  const unexplainedVarianceKg = rawExcessLoss > 0 ? rawExcessLoss : 0;

  // True if actual loss does not exceed allowable shrinkage
  const isLossWithinTolerance = actualLossKg <= shrinkageKgAllowed;

  // Triggers formal quarantine hold if unexplained loss exceeds the statutory threshold (2.0 kg)
  const discrepancyTriggered = unexplainedVarianceKg > discrepancyThresholdKg;

  return {
    dispatchedNetKg: dispatched,
    arrivalNetKg: arrival,
    tolerancePercent: tolerance,
    actualLossKg,
    shrinkageKgAllowed,
    unexplainedVarianceKg,
    isLossWithinTolerance,
    discrepancyTriggered,
    statusRecommendation: discrepancyTriggered
      ? 'QUARANTINED_DISCREPANCY'
      : 'VERIFIED_SALEABLE',
  };
}

