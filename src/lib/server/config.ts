/**
 * BanaSetu Institutional Operational Parameters & Regulatory Disclaimers
 *
 * IMPORTANT: Minor Forest Produce (MFP) transit shrinkage benchmarks, sack tare deductions,
 * and quality classification thresholds configured here are illustrative operational guidelines
 * for system prototyping and testing. They are NOT statutory Odisha state procurement regulations.
 */

export const INSTITUTIONAL_CONFIG = {
  // Configurable transit moisture shrinkage tolerance (illustrative benchmark: 1.5%)
  defaultShrinkageTolerancePercent:
    typeof process !== 'undefined' && process.env?.DEFAULT_SHRINKAGE_TOLERANCE_PERCENT
      ? Number(process.env.DEFAULT_SHRINKAGE_TOLERANCE_PERCENT)
      : 1.5,

  // Rounding variance threshold before flagging excess loss (illustrative: 0.05 kg / 50g)
  shrinkageDeficitThresholdKg:
    typeof process !== 'undefined' && process.env?.SHRINKAGE_DEFICIT_THRESHOLD_KG
      ? Number(process.env.SHRINKAGE_DEFICIT_THRESHOLD_KG)
      : 0.05,

  // Standard sack tare deduction (illustrative: 1.5 kg per gunny bag)
  standardSackTareKg:
    typeof process !== 'undefined' && process.env?.STANDARD_SACK_TARE_KG
      ? Number(process.env.STANDARD_SACK_TARE_KG)
      : 1.5,

  // Regulatory and operational disclaimers
  disclaimers: {
    shrinkage:
      'Transit shrinkage allowance (1.5%) and rounding threshold (0.05 kg) are illustrative operational benchmarks for testing. They do not represent official Odisha Minor Forest Produce statutory procurement rules.',
    tare:
      'Standard sack tare (1.5 kg/bag) is an illustrative baseline and must be calibrated to physical packaging.',
    dbt:
      'All Direct Benefit Transfer (DBT) and banking identifiers in this prototype are simulated test stubs.',
  },
} as const;

/**
 * Resolves the designated administrative supervisor/admin for discrepancy cases.
 * Uses configurable environment desk rule or defaults to the district administrative desk.
 * Avoids hardcoding an individual person's identity.
 */
export function resolveSupervisorAssignment(
  district: string = 'Mayurbhanj',
  explicitAssignment?: string
): string {
  if (explicitAssignment && explicitAssignment.trim().length > 0) {
    return explicitAssignment.trim();
  }
  const envDesk = typeof process !== 'undefined' ? process.env?.SUPERVISOR_ADMIN_DESK : undefined;
  if (envDesk && envDesk.trim().length > 0) {
    return envDesk.trim();
  }
  return `District Procurement Supervisor (${district || 'Mayurbhanj'} TDCCOL Administrative Desk)`;
}
