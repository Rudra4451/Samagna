/**
 * SAMAGNA Phase 8: Revenue and Commercial Reconciliation Server Engine
 * 
 * Provides server-side transaction management, idempotency enforcement,
 * precision decimal math, reconciliation processing, and immutable audit logging.
 */

import {
  InstitutionalServiceContract,
  ServiceDeliverable,
  CommercialInvoice,
  CommercialInvoiceLine,
  CommercialOrderReference,
  CommercialOrderType,
  ConfigurableFeeSchedule,
  PlatformServiceFee,
  ProcessingServiceFee,
  LogisticsServiceFee,
  PaymentReference,
  CommercialSettlement,
  FinancialReconciliation,
  FinancialAdjustment,
  FinancialAuditEntry,
  OrganisationFinancialSummary,
  InvoiceStatus,
  FinancialReconciliationStatus,
  ChargeCategory,
  InvoiceType,
  PaymentInstrumentType,
  SettlementStatus,
  isCollectorFeeExempt,
  validateMspProtection,
  validateFeeTermsApproval,
  calculateInvoiceTotals,
  calculateReconciliationVariance,
  SEED_FEE_SCHEDULES,
} from '../revenueReconciliation';
import { toPaise, fromPaise, addPaise, calculatePercentagePaise } from '../financialMath';
import { isDatabaseConfigured, getPrismaClient } from './db';

// ============================================================================
// In-Memory Standby Ledgers (Fail-Safe & In-Memory Operation)
// ============================================================================

let standbyContracts: InstitutionalServiceContract[] = [
  {
    id: 'CTR-TDCCOL-2025-01',
    contractNumber: 'CTR-TDCCOL-2025-01',
    organisationId: 'ORG-TDCCOL-ODISHA',
    organisationName: 'TDCCOL Odisha',
    scopeOfWork: 'Institutional statewide forest-produce digital custody, weighing verification and value-chain tracking across Mayurbhanj and Koraput districts.',
    commencementDate: '2025-01-01T00:00:00.000Z',
    expiryDate: '2025-12-31T23:59:59.000Z',
    fixedFeeBreakdown: {
      annualPlatformLicensePaise: 180000000, // ₹18,00,000
      setupOnboardingFeePaise: 35000000,    // ₹3,50,000
      annualSlaMaintenanceFeePaise: 45000000, // ₹4,50,000
      annualPlatformLicenseInr: 1800000.0,
      setupOnboardingFeeInr: 350000.0,
      annualSlaMaintenanceFeeInr: 450000.0,
    },
    totalContractValuePaise: 260000000, // ₹26,00,000.00
    totalContractValueInr: 2600000.0,
    currency: 'INR',
    status: 'ACTIVE',
    renewalReviewDate: '2025-10-01T00:00:00.000Z',
    renewalNoticeSent: false,
    deliverablesCount: 3,
    invoicesCount: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

let standbyDeliverables: ServiceDeliverable[] = [
  {
    id: 'DELIV-2025-001',
    contractId: 'CTR-TDCCOL-2025-01',
    deliverableCode: 'DELIV-ONBOARD-MAYURBHANJ',
    title: 'Phase 1: Mayurbhanj Primary Collection Center Onboarding',
    description: 'Onboarding 40 tribal SHG collection centers and 120 weighing scales with offline sync.',
    acceptanceCriteria: '100% test batches verified with digital receipts and sack tags.',
    milestoneDate: '2025-03-31T00:00:00.000Z',
    milestoneFeePaise: 65000000, // ₹6,50,000.00
    milestoneFeeInr: 650000.0,
    status: 'ACCEPTED',
    acceptedBy: 'Managing Director, TDCCOL',
    acceptedAt: '2025-03-28T14:30:00.000Z',
    notes: 'All 40 centers verified operational.',
  },
  {
    id: 'DELIV-2025-002',
    contractId: 'CTR-TDCCOL-2025-01',
    deliverableCode: 'DELIV-TRACEABILITY-PILOT',
    title: 'Phase 2: Lot Traceability & Depôt Weighing Audit System',
    description: 'Central depôt barcode intake and moisture shrinkage reconciliation ledger.',
    acceptanceCriteria: 'Depôt arrival re-weigh and automated tolerance bounds verified.',
    milestoneDate: '2025-06-30T00:00:00.000Z',
    milestoneFeePaise: 65000000, // ₹6,50,000.00
    milestoneFeeInr: 650000.0,
    status: 'IN_PROGRESS',
    acceptedBy: null,
    acceptedAt: null,
    notes: 'Integration tests in progress.',
  },
];

let standbyInvoices: CommercialInvoice[] = [
  {
    id: 'INV-2025-0001',
    invoiceNumber: 'INV-SMG-2025-0001',
    organisationId: 'ORG-TDCCOL-ODISHA',
    organisationName: 'TDCCOL Odisha',
    contractId: 'CTR-TDCCOL-2025-01',
    orderReference: null,
    invoiceType: 'INSTITUTIONAL_CONTRACT',
    invoiceDate: '2025-04-01T00:00:00.000Z',
    dueDate: '2025-04-30T00:00:00.000Z',
    subtotalPaise: 65000000, // ₹6,50,000
    taxPaise: 11700000,     // 18% GST = ₹1,17,000
    totalAmountPaise: 76700000, // ₹7,67,000.00
    paidAmountPaise: 76700000,
    outstandingAmountPaise: 0,
    subtotalInr: 650000.0,
    taxInr: 117000.0,
    totalAmountInr: 767000.0,
    paidAmountInr: 767000.0,
    outstandingAmountInr: 0.0,
    currency: 'INR',
    status: 'PAID',
    reconciliationStatus: 'FULLY_RECONCILED',
    approvedBy: 'Financial Advisor, ST/SC Dev Dept Govt of Odisha',
    approvalTimestamp: '2025-04-02T10:00:00.000Z',
    approvalNotes: 'Deliverable DELIV-ONBOARD-MAYURBHANJ milestone verified and accepted.',
    cancellationReason: null,
    disputeReason: null,
    lines: [
      {
        id: 'LINE-001',
        invoiceId: 'INV-2025-0001',
        lineNumber: 1,
        chargeCategory: 'INSTITUTIONAL_FIXED_FEE',
        description: 'Fixed milestone fee for Mayurbhanj center onboarding (Deliverable DELIV-ONBOARD-MAYURBHANJ)',
        quantity: 1,
        unitOfMeasure: 'MILESTONE',
        unitPricePaise: 65000000,
        unitPriceInr: 650000.0,
        amountPaise: 65000000,
        amountInr: 650000.0,
        sourceReferenceType: 'CONTRACT_DELIVERABLE',
        sourceReferenceId: 'DELIV-2025-001',
      },
    ],
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: '2025-04-10T16:00:00.000Z',
  },
];

let standbyFeeSchedules: ConfigurableFeeSchedule[] = [...SEED_FEE_SCHEDULES];

let standbyPaymentReferences: PaymentReference[] = [
  {
    id: 'PAY-REF-2025-001',
    referenceCode: 'PAY-CHALLAN-2025-0891',
    invoiceId: 'INV-2025-0001',
    orderReference: null,
    instrumentType: 'TREASURY_CHALLAN',
    instrumentNumber: 'CY-OD-TREAS-2025-04-88912',
    isSimulated: false,
    simulationDisclaimer: 'VERIFIED STATE TREASURY E-CHALLAN',
    remitterEntity: 'Tribal Development Cooperative Corporation of Odisha Ltd',
    remitterBankBranch: 'State Bank of India, Special Treasury Branch Bhubaneswar',
    amountPaise: 76700000,
    amountInr: 767000.0,
    paymentDate: '2025-04-10T11:30:00.000Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Chief Accounts Officer, ST/SC Dev Dept',
    verifiedAt: '2025-04-10T15:45:00.000Z',
    rejectionReason: null,
    notes: 'Treasury challan credited to Samagna state forest operations ledger.',
    createdAt: '2025-04-10T11:30:00.000Z',
    updatedAt: '2025-04-10T15:45:00.000Z',
  },
];

let standbySettlements: CommercialSettlement[] = [
  {
    id: 'SETTL-2025-001',
    settlementNumber: 'SETTL-SMG-2025-001',
    idempotencyKey: 'IDEMP-SETTL-SHG-MAHUA-2025-01',
    payeeOrgId: 'BUS-SHG-KARANJIA',
    payeeOrgName: 'Karanjia Tribal Mahila Producer Federation',
    payeeType: 'SHG_FEDERATION',
    settlementType: 'PRODUCER_MSP_PAYOUT',
    sourceReference: 'LIST-MAHUA-2025-01',
    grossAmountPaise: 11400000, // ₹1,14,000.00 (3,000 kg @ ₹38.00 MSP)
    deductionsPaise: 0,        // INVARIANT: Zero deductions from MSP!
    netPayablePaise: 11400000,
    grossAmountInr: 114000.0,
    deductionsInr: 0.0,
    netPayableInr: 114000.0,
    currency: 'INR',
    status: 'SETTLED',
    approvedBy: 'Dr. Ramesh Jena (District Project Coordinator)',
    approvalTimestamp: '2025-04-05T09:00:00.000Z',
    disbursementBankRef: 'UTR-SBIN-2025-04-771829',
    disbursedAt: '2025-04-05T14:20:00.000Z',
    cancellationReason: null,
    notes: '100% MSP payout to primary collector federation bank account.',
    createdAt: '2025-04-04T10:00:00.000Z',
    updatedAt: '2025-04-05T14:20:00.000Z',
  },
];

let standbyReconciliations: FinancialReconciliation[] = [
  {
    id: 'REC-FIN-2025-001',
    reconciliationCode: 'REC-SMG-2025-0001',
    invoiceId: 'INV-2025-0001',
    orderReference: null,
    settlementId: null,
    paymentReferenceId: 'PAY-REF-2025-001',
    expectedPaise: 76700000,
    receivedPaise: 76700000,
    variancePaise: 0,
    expectedInr: 767000.0,
    receivedInr: 767000.0,
    varianceInr: 0.0,
    status: 'FULLY_RECONCILED',
    discrepancyType: null,
    discrepancyNotes: null,
    reconciledBy: 'Senior Audit Officer',
    reconciledAt: '2025-04-10T16:00:00.000Z',
  },
];

let standbyAdjustments: FinancialAdjustment[] = [];

let standbyAuditTrail: FinancialAuditEntry[] = [
  {
    id: 'AUDIT-FIN-001',
    entityType: 'CONTRACT',
    entityId: 'CTR-TDCCOL-2025-01',
    action: 'CONTRACT_COMMENCED',
    actor: 'Secretary ST/SC Dev Dept Govt of Odisha',
    previousStateJson: null,
    newStateJson: JSON.stringify({ contractNumber: 'CTR-TDCCOL-2025-01', totalValueInr: 2600000.0 }),
    notes: 'Institutional service engagement formally executed.',
    timestamp: '2025-01-01T00:00:00.000Z',
  },
];

// ============================================================================
// Audit Logging Helper
// ============================================================================

export function recordFinancialAudit(entry: Omit<FinancialAuditEntry, 'id' | 'timestamp'>): FinancialAuditEntry {
  const auditRecord: FinancialAuditEntry = {
    ...entry,
    id: `AUDIT-FIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };
  standbyAuditTrail.unshift(auditRecord);
  return auditRecord;
}

export async function getFinancialAuditTrail(filter?: {
  entityId?: string;
  entityType?: string;
  actor?: string;
}): Promise<FinancialAuditEntry[]> {
  let entries = [...standbyAuditTrail];
  if (filter?.entityId) entries = entries.filter((e) => e.entityId === filter.entityId);
  if (filter?.entityType) entries = entries.filter((e) => e.entityType === filter.entityType);
  if (filter?.actor) entries = entries.filter((e) => e.actor === filter.actor);
  return entries;
}

// ============================================================================
// 1. Institutional Service Contracts & 2. Deliverables
// ============================================================================

export async function getInstitutionalContracts(): Promise<InstitutionalServiceContract[]> {
  return [...standbyContracts];
}

export async function getInstitutionalContractById(id: string): Promise<InstitutionalServiceContract | null> {
  return standbyContracts.find((c) => c.id === id || c.contractNumber === id) || null;
}

export async function getDeliverablesByContract(contractId: string): Promise<ServiceDeliverable[]> {
  return standbyDeliverables.filter((d) => d.contractId === contractId);
}

export async function recordDeliverableAcceptance(
  deliverableId: string,
  acceptedBy: string,
  notes?: string
): Promise<ServiceDeliverable> {
  const deliverable = standbyDeliverables.find((d) => d.id === deliverableId || d.deliverableCode === deliverableId);
  if (!deliverable) throw new Error(`Deliverable not found: ${deliverableId}`);

  const prevStatus = deliverable.status;
  const now = new Date().toISOString();
  deliverable.status = 'ACCEPTED';
  deliverable.acceptedBy = acceptedBy;
  deliverable.acceptedAt = now;
  if (notes) deliverable.notes = notes;

  recordFinancialAudit({
    entityType: 'CONTRACT',
    entityId: deliverable.contractId,
    action: 'DELIVERABLE_ACCEPTED',
    actor: acceptedBy,
    previousStateJson: JSON.stringify({ deliverableId, status: prevStatus }),
    newStateJson: JSON.stringify({ deliverableId, status: 'ACCEPTED', acceptedAt: now }),
    notes: `Milestone deliverable '${deliverable.title}' accepted by ${acceptedBy}.`,
  });

  return deliverable;
}

// ============================================================================
// 3. Invoice Generation & Status Tracking
// ============================================================================

export async function getCommercialInvoices(filter?: {
  organisationId?: string;
  status?: InvoiceStatus;
  invoiceType?: InvoiceType;
}): Promise<CommercialInvoice[]> {
  let invoices = [...standbyInvoices];
  if (filter?.organisationId) invoices = invoices.filter((i) => i.organisationId === filter.organisationId);
  if (filter?.status) invoices = invoices.filter((i) => i.status === filter.status);
  if (filter?.invoiceType) invoices = invoices.filter((i) => i.invoiceType === filter.invoiceType);
  return invoices;
}

export async function getCommercialInvoiceById(id: string): Promise<CommercialInvoice | null> {
  return standbyInvoices.find((i) => i.id === id || i.invoiceNumber === id) || null;
}

export async function generateCommercialInvoice(input: {
  organisationId: string;
  organisationName: string;
  contractId?: string | null;
  orderReference?: string | null;
  invoiceType: InvoiceType;
  invoiceDate: string;
  dueDate: string;
  taxRatePercent?: number;
  approvedBy: string; // INVARIANT: Record who approved each commercial charge
  approvalNotes?: string;
  lines: Array<{
    chargeCategory: ChargeCategory;
    description: string;
    quantity: number;
    unitOfMeasure: string;
    unitPriceInr: number;
    sourceReferenceType: 'CONTRACT_DELIVERABLE' | 'PURCHASE_ORDER' | 'PROCESSING_JOB' | 'LOGISTICS_SHIPMENT' | 'ORDER_REFERRAL' | 'CONSUMER_ORDER' | 'ADJUSTMENT';
    sourceReferenceId: string;
  }>;
}): Promise<CommercialInvoice> {
  // CRITICAL REQUIREMENT: Record who approved each commercial charge
  if (!input.approvedBy || input.approvedBy.trim().length === 0) {
    throw new Error('FINANCIAL_APPROVAL_REQUIRED: Commercial invoices require an explicit approver identifier before generation.');
  }

  if (!input.lines || input.lines.length === 0) {
    throw new Error('INVOICE_LINES_REQUIRED: Commercial invoice must contain at least one line item.');
  }

  // Exact paise math for all line items
  const processedLines: CommercialInvoiceLine[] = input.lines.map((line, idx) => {
    const unitPricePaise = toPaise(line.unitPriceInr);
    const amountPaise = Math.round(unitPricePaise * line.quantity);
    return {
      id: `LINE-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      invoiceId: '', // populated below
      lineNumber: idx + 1,
      chargeCategory: line.chargeCategory,
      description: line.description,
      quantity: line.quantity,
      unitOfMeasure: line.unitOfMeasure,
      unitPricePaise,
      unitPriceInr: fromPaise(unitPricePaise),
      amountPaise,
      amountInr: fromPaise(amountPaise),
      sourceReferenceType: line.sourceReferenceType,
      sourceReferenceId: line.sourceReferenceId,
    };
  });

  const totals = calculateInvoiceTotals(processedLines, input.taxRatePercent || 0);

  const seq = standbyInvoices.length + 1;
  const invoiceId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const invoiceNumber = `INV-SMG-2025-${seq.toString().padStart(4, '0')}`;

  // Check duplicate invoice number
  if (standbyInvoices.some((i) => i.invoiceNumber === invoiceNumber)) {
    throw new Error(`DUPLICATE_INVOICE_BLOCKED: Invoice with number ${invoiceNumber} already exists.`);
  }

  processedLines.forEach((l) => (l.invoiceId = invoiceId));

  const now = new Date().toISOString();
  const invoice: CommercialInvoice = {
    id: invoiceId,
    invoiceNumber,
    organisationId: input.organisationId,
    organisationName: input.organisationName,
    contractId: input.contractId || null,
    orderReference: input.orderReference || null,
    invoiceType: input.invoiceType,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    subtotalPaise: totals.subtotalPaise,
    taxPaise: totals.taxPaise,
    totalAmountPaise: totals.totalAmountPaise,
    paidAmountPaise: 0,
    outstandingAmountPaise: totals.totalAmountPaise,
    subtotalInr: totals.subtotalInr,
    taxInr: totals.taxInr,
    totalAmountInr: totals.totalAmountInr,
    paidAmountInr: 0.0,
    outstandingAmountInr: totals.totalAmountInr,
    currency: 'INR',
    status: 'ISSUED',
    reconciliationStatus: 'UNRECONCILED',
    approvedBy: input.approvedBy,
    approvalTimestamp: now,
    approvalNotes: input.approvalNotes || null,
    cancellationReason: null,
    disputeReason: null,
    lines: processedLines,
    createdAt: now,
    updatedAt: now,
  };

  standbyInvoices.unshift(invoice);

  recordFinancialAudit({
    entityType: 'INVOICE',
    entityId: invoice.id,
    action: 'INVOICE_GENERATED',
    actor: input.approvedBy,
    previousStateJson: null,
    newStateJson: JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      totalAmountInr: invoice.totalAmountInr,
      status: invoice.status,
    }),
    notes: `Invoice ${invoiceNumber} generated for ${input.organisationName}. Approved by ${input.approvedBy}.`,
  });

  return invoice;
}

export async function updateCommercialInvoiceStatus(
  invoiceId: string,
  nextStatus: InvoiceStatus,
  actor: string,
  notes?: string
): Promise<CommercialInvoice> {
  const invoice = await getCommercialInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const prevStatus = invoice.status;
  const now = new Date().toISOString();

  // Validate allowed state transitions
  if (prevStatus === 'PAID' && nextStatus === 'CANCELLED') {
    throw new Error('INVALID_STATUS_TRANSITION: Cannot cancel a fully paid invoice without issuing a formal adjustment or refund.');
  }

  if (nextStatus === 'CANCELLED') {
    invoice.cancellationReason = notes || 'Cancelled by authorized administrative operator.';
    invoice.outstandingAmountPaise = 0;
    invoice.outstandingAmountInr = 0.0;
  } else if (nextStatus === 'DISPUTED') {
    invoice.disputeReason = notes || 'Billing dispute raised by counterparty.';
  }

  invoice.status = nextStatus;
  invoice.updatedAt = now;

  recordFinancialAudit({
    entityType: 'INVOICE',
    entityId: invoice.id,
    action: `STATUS_${nextStatus}`,
    actor,
    previousStateJson: JSON.stringify({ status: prevStatus }),
    newStateJson: JSON.stringify({ status: nextStatus, notes }),
    notes: `Invoice ${invoice.invoiceNumber} status transitioned from ${prevStatus} to ${nextStatus}. Reason: ${notes || 'N/A'}.`,
  });

  return invoice;
}

// ============================================================================
// 4. Configurable Fee Schedules & Commercial Fee Assessment
// ============================================================================

export async function getFeeSchedules(): Promise<ConfigurableFeeSchedule[]> {
  return [...standbyFeeSchedules];
}

export async function getFeeScheduleByCode(code: string): Promise<ConfigurableFeeSchedule | null> {
  return standbyFeeSchedules.find((s) => s.code === code || s.id === code) || null;
}

export async function assessPlatformServiceFee(input: {
  scheduleCode: string;
  orderType: CommercialOrderType;
  orderId: string;
  orderGrossAmountInr: number;
  primaryGathererMspInr: number;
  actorRole: string;
  assessedBy: string;
}): Promise<PlatformServiceFee> {
  // CRITICAL RULE 1: Collector access remains free
  if (isCollectorFeeExempt(input.actorRole)) {
    throw new Error(`COLLECTOR_FEE_EXEMPT: Role '${input.actorRole}' is strictly exempt from platform service fees.`);
  }

  const schedule = await getFeeScheduleByCode(input.scheduleCode);
  if (!schedule) throw new Error(`Fee schedule not found: ${input.scheduleCode}`);

  // CRITICAL RULE 5: Do not apply fees to commercial transactions without approved terms
  if (!validateFeeTermsApproval(schedule)) {
    throw new Error(
      `UNAPPROVED_FEE_TERMS_BLOCKED: Fee schedule '${schedule.name}' (${schedule.code}) is in draft status. Cannot apply fees without approved commercial terms.`
    );
  }

  const grossPaise = toPaise(input.orderGrossAmountInr);
  let feePaise = 0;

  if (schedule.structure === 'EXEMPT_PILOT') {
    feePaise = 0;
  } else if (schedule.structure === 'FIXED_PER_TRANSACTION') {
    feePaise = schedule.fixedAmountPaise;
  } else if (schedule.structure === 'PERCENTAGE_ORDER_VALUE') {
    feePaise = calculatePercentagePaise(grossPaise, schedule.ratePercent);
    if (schedule.minimumChargePaise > 0 && feePaise < schedule.minimumChargePaise) {
      feePaise = schedule.minimumChargePaise;
    }
    if (schedule.capAmountPaise && feePaise > schedule.capAmountPaise) {
      feePaise = schedule.capAmountPaise;
    }
  }

  // CRITICAL RULE 2: MSP entitlements cannot be reduced by platform fees
  const mspPaise = toPaise(input.primaryGathererMspInr);
  if (grossPaise - feePaise < mspPaise) {
    throw new Error(
      `MSP_PROTECTION_VIOLATION: Assessing platform fee of ₹${fromPaise(feePaise)} would reduce collector realization below statutory MSP (₹${fromPaise(mspPaise)}).`
    );
  }

  const feeRecord: PlatformServiceFee = {
    id: `FEE-PLT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    scheduleCode: schedule.code,
    appliedToEntityType: input.orderType,
    appliedToEntityId: input.orderId,
    grossTransactionPaise: grossPaise,
    feeRatePercent: schedule.ratePercent,
    feeAmountPaise: feePaise,
    feeAmountInr: fromPaise(feePaise),
    isPilotExempt: schedule.structure === 'EXEMPT_PILOT',
    isApprovedTerms: schedule.isApprovedTerms,
    approvedBy: input.assessedBy,
    approvalReference: `APPR-TERMS-${schedule.code}`,
    mspProtected: true,
    assessedAt: new Date().toISOString(),
  };

  recordFinancialAudit({
    entityType: 'FEE_SCHEDULE',
    entityId: feeRecord.id,
    action: 'FEE_ASSESSED',
    actor: input.assessedBy,
    previousStateJson: null,
    newStateJson: JSON.stringify(feeRecord),
    notes: `Assessed platform fee of ${feeRecord.feeAmountInr} on ${input.orderType} ${input.orderId}.`,
  });

  return feeRecord;
}

// ============================================================================
// 5. Payment References (Never Claiming Simulated as Actual Transfers)
// ============================================================================

export async function getPaymentReferences(filter?: {
  invoiceId?: string;
  verificationStatus?: string;
}): Promise<PaymentReference[]> {
  let refs = [...standbyPaymentReferences];
  if (filter?.invoiceId) refs = refs.filter((r) => r.invoiceId === filter.invoiceId);
  if (filter?.verificationStatus) refs = refs.filter((r) => r.verificationStatus === filter.verificationStatus);
  return refs;
}

export async function getPaymentReferenceById(id: string): Promise<PaymentReference | null> {
  return standbyPaymentReferences.find((r) => r.id === id || r.referenceCode === id || r.instrumentNumber === id) || null;
}

export async function recordPaymentReference(input: {
  invoiceId?: string | null;
  orderReference?: string | null;
  instrumentType: PaymentInstrumentType;
  instrumentNumber: string;
  isSimulated: boolean;
  remitterEntity: string;
  remitterBankBranch?: string | null;
  amountInr: number;
  paymentDate: string;
  verifiedBy?: string | null;
  notes?: string | null;
}): Promise<PaymentReference> {
  // CRITICAL RULE 3: Do not represent simulated payment references as actual bank transfers
  const simulationDisclaimer = input.isSimulated
    ? 'SIMULATED DEMONSTRATION INSTRUMENT - NOT AN ACTUAL BANK TRANSFER OR TREASURY SETTLEMENT'
    : 'VERIFIED OFFICIAL BANKING OR TREASURY INSTRUMENT';

  const amountPaise = toPaise(input.amountInr);
  const now = new Date().toISOString();
  const refCode = `PAY-REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const paymentRef: PaymentReference = {
    id: refCode,
    referenceCode: refCode,
    invoiceId: input.invoiceId || null,
    orderReference: input.orderReference || null,
    instrumentType: input.instrumentType,
    instrumentNumber: input.instrumentNumber,
    isSimulated: input.isSimulated,
    simulationDisclaimer,
    remitterEntity: input.remitterEntity,
    remitterBankBranch: input.remitterBankBranch || null,
    amountPaise,
    amountInr: fromPaise(amountPaise),
    paymentDate: input.paymentDate,
    verificationStatus: input.isSimulated ? 'PENDING_VERIFICATION' : 'VERIFIED',
    verifiedBy: input.verifiedBy || null,
    verifiedAt: input.verifiedBy ? now : null,
    rejectionReason: null,
    notes: input.notes || null,
    createdAt: now,
    updatedAt: now,
  };

  standbyPaymentReferences.unshift(paymentRef);

  recordFinancialAudit({
    entityType: 'RECONCILIATION',
    entityId: paymentRef.id,
    action: 'PAYMENT_REFERENCE_RECORDED',
    actor: input.verifiedBy || 'System / Billing Desk',
    previousStateJson: null,
    newStateJson: JSON.stringify({
      referenceCode: paymentRef.referenceCode,
      amountInr: paymentRef.amountInr,
      isSimulated: paymentRef.isSimulated,
    }),
    notes: `Payment reference ${paymentRef.instrumentNumber} (${paymentRef.instrumentType}) recorded. Simulated: ${paymentRef.isSimulated}.`,
  });

  return paymentRef;
}

// ============================================================================
// 6. Settlements & Idempotency Protection (Zero Deductions from MSP)
// ============================================================================

export async function getCommercialSettlements(filter?: {
  payeeOrgId?: string;
  status?: SettlementStatus;
}): Promise<CommercialSettlement[]> {
  let settlements = [...standbySettlements];
  if (filter?.payeeOrgId) settlements = settlements.filter((s) => s.payeeOrgId === filter.payeeOrgId);
  if (filter?.status) settlements = settlements.filter((s) => s.status === filter.status);
  return settlements;
}

export async function getCommercialSettlementById(id: string): Promise<CommercialSettlement | null> {
  return standbySettlements.find((s) => s.id === id || s.settlementNumber === id) || null;
}

export async function createCommercialSettlement(input: {
  idempotencyKey: string; // INVARIANT: Prevent duplicate settlement records
  payeeOrgId: string;
  payeeOrgName: string;
  payeeType: 'SHG_FEDERATION' | 'PRODUCER_ORG' | 'PROCESSOR' | 'CARRIER';
  settlementType: 'PRODUCER_MSP_PAYOUT' | 'PROCESSOR_FEE_PAYOUT' | 'CARRIER_FREIGHT_PAYOUT' | 'PARTNER_PROCEEDS';
  sourceReference: string;
  grossAmountInr: number;
  deductionsInr?: number;
  approvedBy?: string; // INVARIANT: No automatic payments; requires explicit human approval
  notes?: string;
}): Promise<CommercialSettlement> {
  // CRITICAL REQUIREMENT 8: Prevent duplicate settlement records via idempotency key
  const duplicate = standbySettlements.find((s) => s.idempotencyKey === input.idempotencyKey);
  if (duplicate) {
    throw new Error(
      `DUPLICATE_SETTLEMENT_BLOCKED: A settlement with idempotency key '${input.idempotencyKey}' already exists (${duplicate.settlementNumber}).`
    );
  }

  const grossPaise = toPaise(input.grossAmountInr);
  const deductionsPaise = toPaise(input.deductionsInr || 0);

  // CRITICAL RULE 2: MSP entitlements cannot be reduced by platform fees
  if (input.settlementType === 'PRODUCER_MSP_PAYOUT') {
    const mspCheck = validateMspProtection(grossPaise, deductionsPaise);
    if (!mspCheck.compliant) {
      throw new Error(mspCheck.message);
    }
  }

  const netPayablePaise = grossPaise - deductionsPaise;
  const seq = standbySettlements.length + 1;
  const settlementId = `SETTL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const settlementNumber = `SETTL-SMG-2025-${seq.toString().padStart(3, '0')}`;
  const now = new Date().toISOString();

  // CRITICAL RULE 4: Do not introduce automatic payments or deductions
  const status: SettlementStatus = input.approvedBy ? 'APPROVED' : 'PENDING_APPROVAL';

  const settlement: CommercialSettlement = {
    id: settlementId,
    settlementNumber,
    idempotencyKey: input.idempotencyKey,
    payeeOrgId: input.payeeOrgId,
    payeeOrgName: input.payeeOrgName,
    payeeType: input.payeeType,
    settlementType: input.settlementType,
    sourceReference: input.sourceReference,
    grossAmountPaise: grossPaise,
    deductionsPaise,
    netPayablePaise,
    grossAmountInr: fromPaise(grossPaise),
    deductionsInr: fromPaise(deductionsPaise),
    netPayableInr: fromPaise(netPayablePaise),
    currency: 'INR',
    status,
    approvedBy: input.approvedBy || null,
    approvalTimestamp: input.approvedBy ? now : null,
    disbursementBankRef: null,
    disbursedAt: null,
    cancellationReason: null,
    notes: input.notes || null,
    createdAt: now,
    updatedAt: now,
  };

  standbySettlements.unshift(settlement);

  recordFinancialAudit({
    entityType: 'SETTLEMENT',
    entityId: settlement.id,
    action: 'SETTLEMENT_CREATED',
    actor: input.approvedBy || 'Operations Desk',
    previousStateJson: null,
    newStateJson: JSON.stringify({
      settlementNumber: settlement.settlementNumber,
      netPayableInr: settlement.netPayableInr,
      status: settlement.status,
    }),
    notes: `Settlement ${settlementNumber} created for ${input.payeeOrgName}. Net payable: ₹${settlement.netPayableInr}.`,
  });

  return settlement;
}

export async function approveAndDisburseSettlement(
  settlementId: string,
  approvedBy: string,
  bankDisbursementRef: string
): Promise<CommercialSettlement> {
  const settlement = await getCommercialSettlementById(settlementId);
  if (!settlement) throw new Error(`Settlement not found: ${settlementId}`);

  if (settlement.status === 'SETTLED') {
    throw new Error('DUPLICATE_DISBURSEMENT_BLOCKED: This settlement has already been settled and disbursed.');
  }

  const prevStatus = settlement.status;
  const now = new Date().toISOString();
  settlement.status = 'SETTLED';
  settlement.approvedBy = approvedBy;
  settlement.approvalTimestamp = now;
  settlement.disbursementBankRef = bankDisbursementRef;
  settlement.disbursedAt = now;
  settlement.updatedAt = now;

  recordFinancialAudit({
    entityType: 'SETTLEMENT',
    entityId: settlement.id,
    action: 'SETTLEMENT_DISBURSED',
    actor: approvedBy,
    previousStateJson: JSON.stringify({ status: prevStatus }),
    newStateJson: JSON.stringify({ status: 'SETTLED', bankDisbursementRef, disbursedAt: now }),
    notes: `Settlement ${settlement.settlementNumber} approved and disbursed by ${approvedBy} via ref ${bankDisbursementRef}.`,
  });

  return settlement;
}

// ============================================================================
// 7. Reconciliation Engine (Full, Partial & Discrepancy Flagging)
// ============================================================================

export async function getFinancialReconciliations(): Promise<FinancialReconciliation[]> {
  return [...standbyReconciliations];
}

export async function reconcileInvoiceWithPayment(
  invoiceId: string,
  paymentReferenceId: string,
  reconciledBy: string
): Promise<{
  reconciliation: FinancialReconciliation;
  invoice: CommercialInvoice;
}> {
  const invoice = await getCommercialInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const payment = await getPaymentReferenceById(paymentReferenceId);
  if (!payment) throw new Error(`Payment reference not found: ${paymentReferenceId}`);

  const expectedPaise = invoice.outstandingAmountPaise;
  const receivedPaise = payment.amountPaise;

  const result = calculateReconciliationVariance(expectedPaise, receivedPaise);

  const seq = standbyReconciliations.length + 1;
  const recCode = `REC-SMG-2025-${seq.toString().padStart(4, '0')}`;
  const now = new Date().toISOString();

  const reconciliation: FinancialReconciliation = {
    id: `REC-FIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    reconciliationCode: recCode,
    invoiceId: invoice.id,
    orderReference: invoice.orderReference,
    settlementId: null,
    paymentReferenceId: payment.id,
    expectedPaise,
    receivedPaise,
    variancePaise: result.variancePaise,
    expectedInr: fromPaise(expectedPaise),
    receivedInr: fromPaise(receivedPaise),
    varianceInr: result.varianceInr,
    status: result.status,
    discrepancyType: result.discrepancyType,
    discrepancyNotes:
      result.variancePaise !== 0
        ? `Variance of ₹${result.varianceInr.toFixed(2)} between invoice balance and received instrument.`
        : null,
    reconciledBy,
    reconciledAt: now,
  };

  standbyReconciliations.unshift(reconciliation);

  // Update invoice paid & outstanding balances
  const newlyPaidPaise = Math.min(expectedPaise, receivedPaise);
  invoice.paidAmountPaise += newlyPaidPaise;
  invoice.outstandingAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
  invoice.paidAmountInr = fromPaise(invoice.paidAmountPaise);
  invoice.outstandingAmountInr = fromPaise(invoice.outstandingAmountPaise);
  invoice.reconciliationStatus = result.status;

  if (invoice.outstandingAmountPaise === 0) {
    invoice.status = 'PAID';
  } else if (invoice.paidAmountPaise > 0) {
    invoice.status = 'PARTIALLY_PAID';
  }

  invoice.updatedAt = now;

  recordFinancialAudit({
    entityType: 'RECONCILIATION',
    entityId: reconciliation.id,
    action: `RECONCILE_${result.status}`,
    actor: reconciledBy,
    previousStateJson: JSON.stringify({ invoiceOutstandingInr: fromPaise(expectedPaise) }),
    newStateJson: JSON.stringify({
      reconciliationCode: reconciliation.reconciliationCode,
      status: reconciliation.status,
      varianceInr: reconciliation.varianceInr,
      invoiceRemainingInr: invoice.outstandingAmountInr,
    }),
    notes: `Reconciled invoice ${invoice.invoiceNumber} with payment ${payment.instrumentNumber}. Status: ${result.status}.`,
  });

  return { reconciliation, invoice };
}

// ============================================================================
// 8. Refunds & Adjustments
// ============================================================================

export async function getFinancialAdjustments(): Promise<FinancialAdjustment[]> {
  return [...standbyAdjustments];
}

export async function createFinancialAdjustment(input: {
  targetInvoiceId?: string | null;
  targetOrderId?: string | null;
  adjustmentType: 'TRANSIT_DAMAGE_REFUND' | 'QUALITY_PENALTY_CREDIT' | 'TAX_CORRECTION' | 'DISPUTE_ADJUSTMENT' | 'FEE_WAIVER' | 'GOODWILL_CREDIT';
  direction: 'CREDIT_TO_CUSTOMER' | 'DEBIT_FROM_PAYEE' | 'FEE_WAIVER';
  amountInr: number;
  reason: string;
  approvedBy: string; // INVARIANT: Record who approved each adjustment
  notes?: string;
}): Promise<FinancialAdjustment> {
  if (!input.approvedBy || input.approvedBy.trim().length === 0) {
    throw new Error('FINANCIAL_APPROVAL_REQUIRED: Commercial adjustments require an explicit approver identifier.');
  }

  const amountPaise = toPaise(input.amountInr);
  const seq = standbyAdjustments.length + 1;
  const adjNumber = `ADJ-SMG-2025-${seq.toString().padStart(3, '0')}`;
  const now = new Date().toISOString();

  const adjustment: FinancialAdjustment = {
    id: `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    adjustmentNumber: adjNumber,
    targetInvoiceId: input.targetInvoiceId || null,
    targetOrderId: input.targetOrderId || null,
    adjustmentType: input.adjustmentType,
    direction: input.direction,
    amountPaise,
    amountInr: fromPaise(amountPaise),
    reason: input.reason,
    approvedBy: input.approvedBy,
    approvedAt: now,
    status: 'APPLIED',
    notes: input.notes || null,
    createdAt: now,
  };

  standbyAdjustments.unshift(adjustment);

  // If linked to an invoice, apply credit adjustment to outstanding balance
  if (input.targetInvoiceId) {
    const invoice = await getCommercialInvoiceById(input.targetInvoiceId);
    if (invoice && input.direction === 'CREDIT_TO_CUSTOMER') {
      invoice.outstandingAmountPaise = Math.max(0, invoice.outstandingAmountPaise - amountPaise);
      invoice.outstandingAmountInr = fromPaise(invoice.outstandingAmountPaise);
      if (invoice.outstandingAmountPaise === 0 && invoice.status !== 'CANCELLED') {
        invoice.status = 'PAID';
      }
      invoice.updatedAt = now;
    }
  }

  recordFinancialAudit({
    entityType: 'ADJUSTMENT',
    entityId: adjustment.id,
    action: 'ADJUSTMENT_APPLIED',
    actor: input.approvedBy,
    previousStateJson: null,
    newStateJson: JSON.stringify(adjustment),
    notes: `Financial adjustment ${adjNumber} of ₹${adjustment.amountInr} applied by ${input.approvedBy}. Reason: ${input.reason}.`,
  });

  return adjustment;
}

// ============================================================================
// 9. Organisation-Level Revenue Reporting
// ============================================================================

export async function getOrganisationRevenueReport(orgId?: string): Promise<OrganisationFinancialSummary[]> {
  const orgInvoices = orgId ? standbyInvoices.filter((i) => i.organisationId === orgId) : standbyInvoices;
  const orgSettlements = orgId ? standbySettlements.filter((s) => s.payeeOrgId === orgId) : standbySettlements;
  const orgAdjustments = orgId
    ? standbyAdjustments.filter((a) => {
        const inv = standbyInvoices.find((i) => i.id === a.targetInvoiceId);
        return inv?.organisationId === orgId;
      })
    : standbyAdjustments;

  // Group by organisation
  const orgMap = new Map<string, { orgName: string; invoices: CommercialInvoice[]; settlements: CommercialSettlement[]; adjustments: FinancialAdjustment[] }>();

  standbyInvoices.forEach((inv) => {
    if (orgId && inv.organisationId !== orgId) return;
    if (!orgMap.has(inv.organisationId)) {
      orgMap.set(inv.organisationId, { orgName: inv.organisationName, invoices: [], settlements: [], adjustments: [] });
    }
    orgMap.get(inv.organisationId)!.invoices.push(inv);
  });

  standbySettlements.forEach((stl) => {
    if (orgId && stl.payeeOrgId !== orgId) return;
    if (!orgMap.has(stl.payeeOrgId)) {
      orgMap.set(stl.payeeOrgId, { orgName: stl.payeeOrgName, invoices: [], settlements: [], adjustments: [] });
    }
    orgMap.get(stl.payeeOrgId)!.settlements.push(stl);
  });

  const summaries: OrganisationFinancialSummary[] = [];

  orgMap.forEach((data, oId) => {
    const totalInvoicedPaise = data.invoices.reduce((sum, i) => sum + i.totalAmountPaise, 0);
    const totalPaidPaise = data.invoices.reduce((sum, i) => sum + i.paidAmountPaise, 0);
    const totalOutstandingPaise = data.invoices.reduce((sum, i) => sum + i.outstandingAmountPaise, 0);
    const totalSettledPaise = data.settlements.reduce((sum, s) => (s.status === 'SETTLED' ? sum + s.netPayablePaise : sum), 0);
    const totalAdjustmentsPaise = data.adjustments.reduce((sum, a) => sum + a.amountPaise, 0);

    const activeContracts = standbyContracts.filter((c) => c.organisationId === oId && c.status === 'ACTIVE').length;
    const unreconciled = data.invoices.filter((i) => i.reconciliationStatus === 'UNRECONCILED' || i.reconciliationStatus === 'PARTIALLY_RECONCILED').length;
    const disputed = data.invoices.filter((i) => i.status === 'DISPUTED').length;

    summaries.push({
      organisationId: oId,
      organisationName: data.orgName,
      totalInvoicedPaise,
      totalPaidPaise,
      totalOutstandingPaise,
      totalSettledPaise,
      totalAdjustmentsPaise,
      platformFeesCollectedPaise: 0, // 0 in pilot
      totalInvoicedInr: fromPaise(totalInvoicedPaise),
      totalPaidInr: fromPaise(totalPaidPaise),
      totalOutstandingInr: fromPaise(totalOutstandingPaise),
      totalSettledInr: fromPaise(totalSettledPaise),
      totalAdjustmentsInr: fromPaise(totalAdjustmentsPaise),
      platformFeesCollectedInr: 0.0,
      activeContractsCount: activeContracts,
      invoicesCount: data.invoices.length,
      settlementsCount: data.settlements.length,
      unreconciledInvoicesCount: unreconciled,
      disputedInvoicesCount: disputed,
    });
  });

  return summaries;
}
