/**
 * SAMAGNA Phase 8: Revenue and Commercial Reconciliation Domain Models
 * 
 * Unifies financial operations across institutional service contracts and commercial operations:
 * 1. Institutional service contract
 * 2. Service deliverable
 * 3. Invoice
 * 4. Invoice line
 * 5. Commercial order
 * 6. Platform service fee
 * 7. Processing service fee
 * 8. Logistics service fee
 * 9. Payment reference
 * 10. Settlement
 * 11. Reconciliation
 * 12. Refund or adjustment
 * 
 * CRITICAL FINANCIAL RULES & INVARIANTS:
 * - Collector access remains 100% free (zero platform charges).
 * - Minimum Support Price (MSP) entitlements cannot be reduced by platform fees.
 * - Simulated payment references are NEVER represented as actual bank transfers.
 * - Automatic payments or deductions are strictly prohibited (all require explicit human approval).
 * - Fees cannot be applied to commercial transactions without approved terms.
 * - All calculations utilize exact integer paise representations.
 */

import { Money, toPaise, fromPaise, addPaise, calculatePercentagePaise } from './financialMath';

// ============================================================================
// 1. Institutional Service Contract & 2. Service Deliverable
// ============================================================================

export type InstitutionalContractStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'RENEWAL_PENDING' | 'TERMINATED';
export type DeliverableStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED_FOR_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED';

export interface FixedFeeBreakdown {
  annualPlatformLicensePaise: number;
  setupOnboardingFeePaise: number;
  annualSlaMaintenanceFeePaise: number;
  annualPlatformLicenseInr: number;
  setupOnboardingFeeInr: number;
  annualSlaMaintenanceFeeInr: number;
}

export interface InstitutionalServiceContract {
  id: string; // e.g. "CTR-TDCCOL-2025-01"
  contractNumber: string;
  organisationId: string;
  organisationName: string;
  scopeOfWork: string;
  commencementDate: string;
  expiryDate: string;
  fixedFeeBreakdown: FixedFeeBreakdown;
  totalContractValuePaise: number;
  totalContractValueInr: number;
  currency: 'INR';
  status: InstitutionalContractStatus;
  renewalReviewDate: string;
  renewalNoticeSent: boolean;
  deliverablesCount: number;
  invoicesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDeliverable {
  id: string; // e.g. "DELIV-2025-001"
  contractId: string;
  deliverableCode: string; // e.g. "MS-1-PORTAL-DEPLOY"
  title: string;
  description: string;
  acceptanceCriteria: string;
  milestoneDate: string;
  milestoneFeePaise: number;
  milestoneFeeInr: number;
  status: DeliverableStatus;
  acceptedBy: string | null;
  acceptedAt: string | null;
  notes: string | null;
}

// ============================================================================
// 3. Invoice & 4. Invoice Line
// ============================================================================

export type InvoiceType =
  | 'INSTITUTIONAL_CONTRACT'
  | 'B2B_TRADE'
  | 'PROCESSING_SERVICE'
  | 'LOGISTICS_FREIGHT'
  | 'PARTNER_DISTRIBUTION'
  | 'CONSUMER_ORDER';

export type InvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'CANCELLED'
  | 'DISPUTED';

export type ChargeCategory =
  | 'INSTITUTIONAL_FIXED_FEE'
  | 'PLATFORM_SERVICE_FEE'
  | 'PROCESSING_SERVICE_FEE'
  | 'LOGISTICS_SERVICE_FEE'
  | 'COMMODITY_PURCHASE'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT';

export interface CommercialInvoiceLine {
  id: string; // e.g. "INV-LINE-001"
  invoiceId: string;
  lineNumber: number;
  chargeCategory: ChargeCategory;
  description: string;
  quantity: number;
  unitOfMeasure: string;
  unitPricePaise: number;
  unitPriceInr: number;
  amountPaise: number;
  amountInr: number;
  sourceReferenceType: 'CONTRACT_DELIVERABLE' | 'PURCHASE_ORDER' | 'PROCESSING_JOB' | 'LOGISTICS_SHIPMENT' | 'ORDER_REFERRAL' | 'CONSUMER_ORDER' | 'ADJUSTMENT';
  sourceReferenceId: string;
}

export interface CommercialInvoice {
  id: string; // e.g. "INV-2025-0001"
  invoiceNumber: string; // e.g. "INV-SMG-2025-0001"
  organisationId: string;
  organisationName: string;
  contractId: string | null;
  orderReference: string | null;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate: string;
  subtotalPaise: number;
  taxPaise: number; // e.g. GST
  totalAmountPaise: number;
  paidAmountPaise: number;
  outstandingAmountPaise: number;
  subtotalInr: number;
  taxInr: number;
  totalAmountInr: number;
  paidAmountInr: number;
  outstandingAmountInr: number;
  currency: 'INR';
  status: InvoiceStatus;
  reconciliationStatus: FinancialReconciliationStatus;
  approvedBy: string; // INVARIANT: Record who approved each commercial charge
  approvalTimestamp: string;
  approvalNotes: string | null;
  cancellationReason: string | null;
  disputeReason: string | null;
  lines: CommercialInvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. Commercial Order Reference
// ============================================================================

export type CommercialOrderType =
  | 'B2B_PURCHASE_ORDER'
  | 'CONSUMER_ORDER'
  | 'PARTNER_REFERRAL'
  | 'PROCESSING_JOB'
  | 'LOGISTICS_CONSIGNMENT'
  | 'INSTITUTIONAL_MILESTONE';

export interface CommercialOrderReference {
  orderReferenceCode: string; // e.g. "PO-B2B-2025-001", "ORD-SMG-2025-0012"
  orderType: CommercialOrderType;
  entityId: string;
  buyerOrgName: string;
  sellerOrgName: string;
  grossValuePaise: number;
  grossValueInr: number;
  primaryGathererMspPaise: number; // INVARIANT: 100% statutory MSP share guaranteed
  primaryGathererMspInr: number;
  status: string;
  orderedAt: string;
}

// ============================================================================
// 6. Platform Service Fee, 7. Processing Service Fee, 8. Logistics Service Fee
// ============================================================================

export type FeeDomain =
  | 'INSTITUTIONAL_B2G'
  | 'B2B_TRADE'
  | 'PROCESSING'
  | 'LOGISTICS'
  | 'B2B2C_DISTRIBUTION'
  | 'B2C_CONSUMER';

export type FeeStructureType =
  | 'EXEMPT_PILOT'
  | 'FIXED_PER_TRANSACTION'
  | 'PERCENTAGE_ORDER_VALUE'
  | 'TIERED_VOLUME';

export interface ConfigurableFeeSchedule {
  id: string; // e.g. "FEE-PILOT-2025"
  code: string;
  name: string;
  domain: FeeDomain;
  structure: FeeStructureType;
  ratePercent: number; // 0.0 in pilot
  fixedAmountPaise: number;
  fixedAmountInr: number;
  minimumChargePaise: number;
  minimumChargeInr: number;
  capAmountPaise: number | null;
  capAmountInr: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isApprovedTerms: boolean; // INVARIANT: Cannot apply fee without approved terms
  approvedBy: string;
  collectorExempt: boolean; // INVARIANT: Collector access remains free
  mspProtectionClause: boolean; // INVARIANT: MSP cannot be reduced by platform fee
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformServiceFee {
  id: string; // e.g. "FEE-PLT-2025-001"
  scheduleCode: string;
  appliedToEntityType: CommercialOrderType;
  appliedToEntityId: string;
  grossTransactionPaise: number;
  feeRatePercent: number;
  feeAmountPaise: number;
  feeAmountInr: number;
  isPilotExempt: boolean;
  isApprovedTerms: boolean;
  approvedBy: string;
  approvalReference: string;
  mspProtected: boolean;
  assessedAt: string;
}

export interface ProcessingServiceFee {
  id: string; // e.g. "FEE-PROC-2025-001"
  facilityId: string;
  facilityName: string;
  jobId: string;
  jobCode: string;
  inputQuantityKg: number;
  processingRatePerKgInr: number;
  grossProcessingChargePaise: number;
  grossProcessingChargeInr: number;
  coordinationFeePaise: number; // 0 in pilot
  coordinationFeeInr: number;
  approvedBy: string;
  recordedAt: string;
}

export interface LogisticsServiceFee {
  id: string; // e.g. "FEE-LOG-2025-001"
  carrierId: string;
  carrierName: string;
  shipmentId: string;
  shipmentCode: string;
  distanceKm: number;
  freightRatePerKmInr: number;
  grossFreightPaise: number;
  grossFreightInr: number;
  coordinationFeePaise: number; // 0 in pilot
  coordinationFeeInr: number;
  approvedBy: string;
  recordedAt: string;
}

// ============================================================================
// 9. Payment Reference
// ============================================================================

export type PaymentInstrumentType =
  | 'TREASURY_CHALLAN'
  | 'BANK_NEFT_RTGS'
  | 'DEMO_COMMERCIAL_GATEWAY'
  | 'DEMO_UPI'
  | 'LETTER_OF_CREDIT';

export type PaymentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED_INVALID';

export interface PaymentReference {
  id: string; // e.g. "PAY-REF-2025-001"
  referenceCode: string;
  invoiceId: string | null;
  orderReference: string | null;
  instrumentType: PaymentInstrumentType;
  instrumentNumber: string; // Challan number or Bank UTR or Gateway Ref
  isSimulated: boolean; // INVARIANT: Never represent simulated demo as actual bank transfer
  simulationDisclaimer: string;
  remitterEntity: string;
  remitterBankBranch: string | null;
  amountPaise: number;
  amountInr: number;
  paymentDate: string;
  verificationStatus: PaymentVerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 10. Settlement
// ============================================================================

export type SettlementType =
  | 'PRODUCER_MSP_PAYOUT'
  | 'PROCESSOR_FEE_PAYOUT'
  | 'CARRIER_FREIGHT_PAYOUT'
  | 'PARTNER_PROCEEDS';

export type SettlementStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SETTLED'
  | 'BLOCKED_DISPUTE'
  | 'CANCELLED';

export interface CommercialSettlement {
  id: string; // e.g. "SETTL-2025-001"
  settlementNumber: string; // e.g. "SETTL-SMG-2025-001"
  idempotencyKey: string; // INVARIANT: Prevents duplicate settlement records
  payeeOrgId: string;
  payeeOrgName: string;
  payeeType: 'SHG_FEDERATION' | 'PRODUCER_ORG' | 'PROCESSOR' | 'CARRIER';
  settlementType: SettlementType;
  sourceReference: string; // Link to Lot, Order, Job, or Consignment
  grossAmountPaise: number;
  deductionsPaise: number; // INVARIANT: Zero deductions from primary gatherer MSP
  netPayablePaise: number;
  grossAmountInr: number;
  deductionsInr: number;
  netPayableInr: number;
  currency: 'INR';
  status: SettlementStatus;
  approvedBy: string | null; // INVARIANT: No automatic payments; requires explicit approval
  approvalTimestamp: string | null;
  disbursementBankRef: string | null;
  disbursedAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 11. Reconciliation
// ============================================================================

export type FinancialReconciliationStatus =
  | 'UNRECONCILED'
  | 'PARTIALLY_RECONCILED'
  | 'FULLY_RECONCILED'
  | 'DISCREPANCY_FLAGGED'
  | 'DISPUTED';

export type DiscrepancyType =
  | 'UNDER_PAYMENT'
  | 'OVER_PAYMENT'
  | 'TIMING_MISMATCH'
  | 'UNMATCHED_INSTRUMENT'
  | 'UNAUTHORIZED_DEDUCTION';

export interface FinancialReconciliation {
  id: string; // e.g. "REC-FIN-2025-001"
  reconciliationCode: string;
  invoiceId: string | null;
  orderReference: string | null;
  settlementId: string | null;
  paymentReferenceId: string;
  expectedPaise: number;
  receivedPaise: number;
  variancePaise: number; // expected - received
  expectedInr: number;
  receivedInr: number;
  varianceInr: number;
  status: FinancialReconciliationStatus;
  discrepancyType: DiscrepancyType | null;
  discrepancyNotes: string | null;
  reconciledBy: string;
  reconciledAt: string;
}

// ============================================================================
// 12. Refund or Adjustment
// ============================================================================

export type AdjustmentType =
  | 'TRANSIT_DAMAGE_REFUND'
  | 'QUALITY_PENALTY_CREDIT'
  | 'TAX_CORRECTION'
  | 'DISPUTE_ADJUSTMENT'
  | 'FEE_WAIVER'
  | 'GOODWILL_CREDIT';

export type AdjustmentDirection =
  | 'CREDIT_TO_CUSTOMER'
  | 'DEBIT_FROM_PAYEE'
  | 'FEE_WAIVER';

export interface FinancialAdjustment {
  id: string; // e.g. "ADJ-2025-001"
  adjustmentNumber: string;
  targetInvoiceId: string | null;
  targetOrderId: string | null;
  adjustmentType: AdjustmentType;
  direction: AdjustmentDirection;
  amountPaise: number;
  amountInr: number;
  reason: string;
  approvedBy: string; // INVARIANT: Record who approved each adjustment
  approvedAt: string;
  status: 'PENDING' | 'APPLIED' | 'REJECTED';
  notes: string | null;
  createdAt: string;
}

// ============================================================================
// Financial Audit Trail & Organization Revenue Reports
// ============================================================================

export interface FinancialAuditEntry {
  id: string;
  entityType: 'INVOICE' | 'SETTLEMENT' | 'RECONCILIATION' | 'ADJUSTMENT' | 'FEE_SCHEDULE' | 'CONTRACT';
  entityId: string;
  action: string;
  actor: string;
  previousStateJson: string | null;
  newStateJson: string | null;
  notes: string;
  timestamp: string;
}

export interface OrganisationFinancialSummary {
  organisationId: string;
  organisationName: string;
  totalInvoicedPaise: number;
  totalPaidPaise: number;
  totalOutstandingPaise: number;
  totalSettledPaise: number;
  totalAdjustmentsPaise: number;
  platformFeesCollectedPaise: number; // 0 in pilot
  totalInvoicedInr: number;
  totalPaidInr: number;
  totalOutstandingInr: number;
  totalSettledInr: number;
  totalAdjustmentsInr: number;
  platformFeesCollectedInr: number;
  activeContractsCount: number;
  invoicesCount: number;
  settlementsCount: number;
  unreconciledInvoicesCount: number;
  disputedInvoicesCount: number;
}

// ============================================================================
// Invariant & State Validation Functions
// ============================================================================

/**
 * INVARIANT: Collector access remains free.
 * Primary collectors never incur platform fees or charges.
 */
export function isCollectorFeeExempt(role: string): boolean {
  const exemptRoles = ['PRIMARY_COLLECTOR', 'COLLECTOR', 'TRIBAL_GATHERER'];
  return exemptRoles.includes(role.toUpperCase());
}

/**
 * INVARIANT: MSP entitlements cannot be reduced by platform fees.
 * The primary gatherer MSP portion must equal net payout without deduction.
 */
export function validateMspProtection(grossMspPaise: number, deductionsPaise: number): {
  compliant: boolean;
  message: string;
} {
  if (deductionsPaise > 0) {
    return {
      compliant: false,
      message: `MSP_PROTECTION_VIOLATION: Statutory Minimum Support Price (MSP) entitlement (₹${(grossMspPaise / 100).toFixed(2)}) cannot be reduced by fees (₹${(deductionsPaise / 100).toFixed(2)}).`,
    };
  }
  return { compliant: true, message: 'MSP entitlement 100% protected without fee deductions.' };
}

/**
 * INVARIANT: Fees cannot be applied to commercial transactions without approved terms.
 */
export function validateFeeTermsApproval(schedule: ConfigurableFeeSchedule): boolean {
  return schedule.isApprovedTerms === true;
}

/**
 * Calculates invoice totals from lines using exact paise math.
 */
export function calculateInvoiceTotals(
  lines: Array<{ amountPaise: number }>,
  taxRatePercent: number = 0
): {
  subtotalPaise: number;
  taxPaise: number;
  totalAmountPaise: number;
  subtotalInr: number;
  taxInr: number;
  totalAmountInr: number;
} {
  const subtotalPaise = addPaise(...lines.map((l) => l.amountPaise));
  const taxPaise = calculatePercentagePaise(subtotalPaise, taxRatePercent);
  const totalAmountPaise = subtotalPaise + taxPaise;

  return {
    subtotalPaise,
    taxPaise,
    totalAmountPaise,
    subtotalInr: fromPaise(subtotalPaise),
    taxInr: fromPaise(taxPaise),
    totalAmountInr: fromPaise(totalAmountPaise),
  };
}

/**
 * Calculates reconciliation variance between expected and received instruments.
 */
export function calculateReconciliationVariance(expectedPaise: number, receivedPaise: number): {
  variancePaise: number;
  varianceInr: number;
  status: FinancialReconciliationStatus;
  discrepancyType: DiscrepancyType | null;
} {
  const diff = expectedPaise - receivedPaise;
  if (diff === 0) {
    return {
      variancePaise: 0,
      varianceInr: 0,
      status: 'FULLY_RECONCILED',
      discrepancyType: null,
    };
  } else if (diff > 0) {
    return {
      variancePaise: diff,
      varianceInr: fromPaise(diff),
      status: receivedPaise > 0 ? 'PARTIALLY_RECONCILED' : 'DISCREPANCY_FLAGGED',
      discrepancyType: 'UNDER_PAYMENT',
    };
  } else {
    return {
      variancePaise: diff,
      varianceInr: fromPaise(diff),
      status: 'DISCREPANCY_FLAGGED',
      discrepancyType: 'OVER_PAYMENT',
    };
  }
}

// ============================================================================
// Seed Data Fixtures for Phase 8
// ============================================================================

export const SEED_FEE_SCHEDULES: ConfigurableFeeSchedule[] = [
  {
    id: 'FEE-PILOT-2025',
    code: 'FEE-PILOT-2025',
    name: 'State Forest Operations Pilot Schedule (0% Fee)',
    domain: 'INSTITUTIONAL_B2G',
    structure: 'EXEMPT_PILOT',
    ratePercent: 0.0,
    fixedAmountPaise: 0,
    fixedAmountInr: 0,
    minimumChargePaise: 0,
    minimumChargeInr: 0,
    capAmountPaise: null,
    capAmountInr: null,
    effectiveFrom: '2025-01-01T00:00:00.000Z',
    effectiveTo: '2025-12-31T23:59:59.000Z',
    isApprovedTerms: true,
    approvedBy: 'Secretary ST/SC Dev Dept Govt of Odisha',
    collectorExempt: true,
    mspProtectionClause: true,
    notes: 'Platform fee waived during initial statewide custody pilot.',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'FEE-COMM-2026-B2B',
    code: 'FEE-COMM-2026-B2B',
    name: 'Future Commercial B2B Trade Fee Schedule (Subject to Terms Approval)',
    domain: 'B2B_TRADE',
    structure: 'PERCENTAGE_ORDER_VALUE',
    ratePercent: 1.5,
    fixedAmountPaise: 0,
    fixedAmountInr: 0,
    minimumChargePaise: 50000, // ₹500
    minimumChargeInr: 500,
    capAmountPaise: 5000000, // ₹50,000
    capAmountInr: 50000,
    effectiveFrom: '2026-04-01T00:00:00.000Z',
    effectiveTo: null,
    isApprovedTerms: false, // DRAFT: Pending Board ratification
    approvedBy: 'Board of Directors (Pending)',
    collectorExempt: true,
    mspProtectionClause: true,
    notes: 'Prepared future fee schedule. Cannot be applied without approved commercial terms.',
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
];

