/**
 * SAMAGNA Phase 2: B2G Institutional Operations, Service Management & Revenue Tracking
 * Defines data structures, default pilot configurations, and reporting aggregates.
 * Invariant: All revenue is fixed-fee; zero collector deductions; no payment gateways.
 */

export type OrganisationType =
  | 'STATE_AGENCY'
  | 'FEDERATION_COOPERATIVE'
  | 'DISTRICT_AUTHORITY'
  | 'APEX_ENTERPRISE'
  | 'ENTERPRISE_PARTNER';

export type OrgVerificationStatus =
  | 'PILOT_VERIFIED'
  | 'PROVISIONAL_PENDING_DOCS'
  | 'SUSPENDED';

export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'RENEWAL_DUE'
  | 'EXPIRED'
  | 'TERMINATED';

export type DeliverableStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'PENDING';

export type InstitutionalInvoiceStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIALLY_PAID';

export type InstitutionalReconciliationStatus =
  | 'FULLY_RECONCILED'
  | 'PENDING_RECONCILIATION'
  | 'VARIANCE_DETECTED';

export interface OrganisationContact {
  nodalOfficer: string;
  designation: string;
  email: string;
  phone: string;
  officeAddress: string;
}

export interface OrganisationServiceArea {
  state: string;
  districts: string[];
  blocks: string[];
  centerIds: string[];
  depotIds: string[];
}

export interface OrganisationOperationalConfig {
  allowableShrinkagePercent: number;
  rateAuthorityReference: string;
  quarantineThresholdDays: number;
  offlineSyncGraceHours: number;
  dbtAutoVerification: boolean;
}

export interface Organisation {
  id: string; // "ORG-TDCCOL-OR"
  code: string; // "TDCCOL-OR"
  legalName: string;
  displayName: string;
  orgType: OrganisationType;
  registrationNumber: string;
  statutoryOrderRef: string;
  verificationStatus: OrgVerificationStatus;
  verificationNotes: string;
  isDemonstrationPilot: boolean;
  contact: OrganisationContact;
  serviceArea: OrganisationServiceArea;
  operationalConfig: OrganisationOperationalConfig;
  assignedAdminUsernames: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionalServiceDeliverable {
  id: string;
  code: string;
  title: string;
  description: string;
  milestoneDate: string;
  status: DeliverableStatus;
  acceptanceCriteria: string;
  completedAt?: string;
}

export interface SupportingDocument {
  id: string;
  title: string;
  documentRef: string;
  docType: 'SANCTION_ORDER' | 'MOU' | 'SLA_AGREEMENT' | 'TECHNICAL_PROPOSAL';
  issueDate: string;
  verified: boolean;
}

export interface FixedAgreedFee {
  annualPlatformLicense: number; // e.g. ₹5,00,000
  setupOnboardingFee: number; // e.g. ₹3,00,000
  annualSlaMaintenanceFee: number; // e.g. ₹1,50,000
  totalContractValue: number; // e.g. ₹9,50,000
  currency: 'INR';
}

export interface RenewalTracking {
  daysUntilExpiry: number;
  renewalReviewDate: string;
  renewalNoticeSent: boolean;
  proposedNextTerm: string;
}

export interface InstitutionalServiceContract {
  id: string; // "CTR-TDCCOL-2025-01"
  orgId: string;
  proposalRef: string;
  contractRef: string;
  scopeOfWork: string;
  serviceStartDate: string;
  serviceEndDate: string;
  status: ContractStatus;
  fixedAgreedFee: FixedAgreedFee;
  deliverables: InstitutionalServiceDeliverable[];
  renewalTracking: RenewalTracking;
  supportingDocuments: SupportingDocument[];
  invoiceReferences: string[];
  legalDisclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReference {
  id: string;
  invoiceId: string;
  paymentMethod: 'TREASURY_CHALLAN' | 'NEFT_RTGS' | 'GOVERNMENT_PFMS'; // Strictly manual government rails
  treasuryChallanNo?: string;
  bankUtr?: string;
  pfmsRef?: string;
  paidAmount: number;
  paymentDate: string;
  verifiedByAdmin: string;
  reconciledAt: string;
}

export interface InstitutionalInvoice {
  id: string; // "INV-SAM-2025-Q1"
  contractId: string;
  orgId: string;
  invoiceNumber: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InstitutionalInvoiceStatus;
  reconciliationStatus: InstitutionalReconciliationStatus;
  payments: PaymentReference[];
  paidAmount: number;
  outstandingBalance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueSummary {
  totalAgreedServiceAmount: number;
  totalInvoiced: number;
  totalReceived: number;
  totalOutstandingBalance: number;
  reconciliationStatus: InstitutionalReconciliationStatus;
  servicePeriodHistory: Array<{
    period: string;
    invoiced: number;
    paid: number;
    outstanding: number;
    status: InstitutionalInvoiceStatus;
  }>;
}

// Operational Reporting structures with explicit null-for-missing distinctions
export interface ProductProcurementMetric {
  produceId: string;
  produceName: string;
  produceOdia: string;
  volumeKg: number | null; // null if unrecorded/no data
  grossPayoutInr: number | null;
  averageRatePerKg: number | null;
  batchCount: number;
  hasData: boolean;
}

export interface CenterActivityMetric {
  centerCode: string;
  centerName: string;
  block: string;
  intakeKg: number | null;
  dispatchedKg: number | null;
  batchCount: number;
  activeCollectorsCount: number | null;
  activeFacilitatorsCount: number | null;
  hasActivity: boolean;
}

export interface BatchCustodySummary {
  batchId: string;
  produceName: string;
  status: string;
  originCenter: string;
  destinationDepot: string;
  dispatchedKg: number | null;
  arrivalKg: number | null;
  shrinkageVarianceKg: number | null;
  discrepancyStatus: string | null;
  timelineCount: number;
}

export interface OperationalReport {
  generatedAt: string;
  scopeDistrict: string;
  filterCenterId?: string;
  filterDepotId?: string;
  collectionVolumes: {
    totalBatches: number;
    totalIntakeKg: number;
    netAcceptedKg: number;
    totalSackCount: number;
    hasIntakeRecords: boolean;
  };
  productWiseProcurement: ProductProcurementMetric[];
  collectionCentreActivity: CenterActivityMetric[];
  batchCustodyHistory: BatchCustodySummary[];
  inventoryPosition: {
    verifiedSaleableKg: number;
    inTransitPendingKg: number;
    quarantinedDiscrepancyKg: number;
    outwardSalesDispatchedKg: number;
    totalCapacityKg: number;
    depotUtilisationPercent: number | null;
  };
  quarantineAndExceptions: {
    totalCases: number;
    openQuarantinedCases: number;
    resolvedCases: number;
    totalVarianceKg: number;
    cases: Array<{
      caseId: string;
      batchId: string;
      varianceKg: number;
      status: string;
      reason: string;
      assignedSupervisor: string;
    }>;
  };
  settlementReferences: {
    totalDisbursedInr: number;
    readyForDisbursementInr: number;
    heldForReviewInr: number;
    collectorCount: number;
    mspProtectionCompliant: boolean; // 100% MSP payout invariant
    settlementRatio: number | null;
  };
  operationalPerformance: {
    allowableShrinkagePercent: number;
    actualAverageShrinkagePercent: number | null;
    transitVerificationAvgHours: number | null;
    discrepancyRatePercent: number | null;
    dbtSuccessRatePercent: number | null;
  };
}

// --------------------------------------------------------------------------
// Authoritative Pilot Default Records (Standby Data)
// --------------------------------------------------------------------------

export const DEFAULT_PILOT_ORGANISATION: Organisation = {
  id: 'ORG-TDCCOL-OR',
  code: 'TDCCOL-OR',
  legalName: 'Tribal Development Cooperative Corporation of Odisha Limited',
  displayName: 'TDCCOL Odisha',
  orgType: 'STATE_AGENCY',
  registrationNumber: 'CS-REG-OD-1972-0041',
  statutoryOrderRef: 'ST-SC-DEPT-SANCTION-2024-881',
  verificationStatus: 'PILOT_VERIFIED',
  verificationNotes:
    'Authorized for operational pilot deployment in Mayurbhanj district under ST & SC Development Department administrative sanction reference OD-TD-2024-PL-01.',
  isDemonstrationPilot: true,
  contact: {
    nodalOfficer: 'Dr. A. K. Mohapatra, IAS',
    designation: 'Managing Director & State Nodal Officer',
    email: 'md.tdccol@odisha.gov.in',
    phone: '+91-674-254-2101',
    officeAddress: 'TDCCOL Bhawan, Rupali Square, Saheed Nagar, Bhubaneswar, Odisha 751007',
  },
  serviceArea: {
    state: 'Odisha',
    districts: ['Mayurbhanj'],
    blocks: ['Karanjia', 'Jashipur', 'Rairangpur', 'Baripada'],
    centerIds: ['KRN-01', 'JAS-02', 'RRP-03', 'BDG-V1'],
    depotIds: ['BRP-01'],
  },
  operationalConfig: {
    allowableShrinkagePercent: 1.5,
    rateAuthorityReference: 'TDCCOL MSP LABHA Notification 2024-25',
    quarantineThresholdDays: 3,
    offlineSyncGraceHours: 48,
    dbtAutoVerification: true,
  },
  assignedAdminUsernames: ['patnaik.dpo', 'sdas.baripada'],
  permissions: [
    'CAN_MANAGE_CONTRACTS',
    'CAN_AUTHORIZE_SALES',
    'CAN_EXPORT_AUDIT_LOGS',
    'CAN_RESOLVE_DISCREPANCIES',
    'CAN_VIEW_REVENUE',
  ],
  createdAt: '2025-03-15T10:00:00.000Z',
  updatedAt: '2025-04-01T09:30:00.000Z',
};

export const DEFAULT_PILOT_CONTRACT: InstitutionalServiceContract = {
  id: 'CTR-TDCCOL-2025-01',
  orgId: 'ORG-TDCCOL-OR',
  proposalRef: 'PROP-SAMAGNA-OD-2025-Q1',
  contractRef: 'SAMAGNA-SLA-2025-01',
  scopeOfWork:
    'Institutional software service for primary MFP procurement ledgering, offline weighment sync, Baripada Central Depôt re-weigh verification, automated shrinkage audit dossiers, and primary gatherer DBT settlement auditing for Mayurbhanj district.',
  serviceStartDate: '2025-04-01T00:00:00.000Z',
  serviceEndDate: '2026-03-31T23:59:59.000Z',
  status: 'ACTIVE',
  fixedAgreedFee: {
    annualPlatformLicense: 500000, // ₹5,00,000 / year
    setupOnboardingFee: 300000, // ₹3,00,000 one-time
    annualSlaMaintenanceFee: 150000, // ₹1,50,000 / year
    totalContractValue: 950000, // ₹9,50,000
    currency: 'INR',
  },
  deliverables: [
    {
      id: 'DELIV-01',
      code: 'DEL-SCALE-CALIB',
      title: 'Karanjia & Baripada Scale Calibration & Offline Dexie Sync',
      description: 'Zero-drop offline intake verification across Karanjia (KRN-01) and Baripada (BRP-01).',
      milestoneDate: '2025-04-30T00:00:00.000Z',
      status: 'COMPLETED',
      acceptanceCriteria: 'Dual-scale weighment accuracy with electronic seal tagging and zero record loss.',
      completedAt: '2025-04-25T14:30:00.000Z',
    },
    {
      id: 'DELIV-02',
      code: 'DEL-TRANSIT-AUDIT',
      title: 'Similipal Buffer Transit Rerouting & Shrinkage Verification',
      description: 'Automated 1.5% shrinkage tolerance gate verification and tamper-evident audit dossiers.',
      milestoneDate: '2025-07-15T00:00:00.000Z',
      status: 'COMPLETED',
      acceptanceCriteria: 'End-to-end waybill QR verification with PDF audit dossier export.',
      completedAt: '2025-07-10T11:00:00.000Z',
    },
    {
      id: 'DELIV-03',
      code: 'DEL-DBT-SETTLE',
      title: 'Direct Benefit Transfer (DBT) Payout Audit Interface',
      description: '100% MSP non-deduction verification with bank account mask protection and PFMS audit log.',
      milestoneDate: '2025-10-31T00:00:00.000Z',
      status: 'IN_PROGRESS',
      acceptanceCriteria: 'Simulated and live bank UTR matching with zero administrative commission deductions.',
    },
    {
      id: 'DELIV-04',
      code: 'DEL-ANNUAL-REPORT',
      title: 'FY2025-26 Annual Statutory Value-Chain Reconciliation Report',
      description: 'Comprehensive district procurement, custody, shrinkage, and revenue audit report for ST & SC Dept.',
      milestoneDate: '2026-03-15T00:00:00.000Z',
      status: 'PENDING',
      acceptanceCriteria: 'District-wide ledger reconciliation signed by District Procurement Officer.',
    },
  ],
  renewalTracking: {
    daysUntilExpiry: 145, // Computed or static baseline
    renewalReviewDate: '2026-01-15T00:00:00.000Z',
    renewalNoticeSent: false,
    proposedNextTerm: 'FY 2026-27 (12 Months)',
  },
  supportingDocuments: [
    {
      id: 'DOC-01',
      title: 'ST & SC Development Dept Administrative Sanction Order',
      documentRef: 'ORDER-STSC-2024-8812',
      docType: 'SANCTION_ORDER',
      issueDate: '2024-11-20',
      verified: true,
    },
    {
      id: 'DOC-02',
      title: 'Bilateral Operational SLA Agreement (Mayurbhanj Pilot)',
      documentRef: 'SLA-SAMAGNA-TDCCOL-2025',
      docType: 'SLA_AGREEMENT',
      issueDate: '2025-03-25',
      verified: true,
    },
  ],
  invoiceReferences: ['INV-SAM-2025-Q1', 'INV-SAM-2025-Q2'],
  legalDisclaimer:
    'Operational tracking and administrative audit log only. Does not constitute a legally binding agreement without executed government counter-signature and treasury sanction.',
  createdAt: '2025-03-20T10:00:00.000Z',
  updatedAt: '2025-04-01T09:30:00.000Z',
};

export const DEFAULT_PILOT_INVOICES: InstitutionalInvoice[] = [
  {
    id: 'INV-SAM-2025-Q1',
    contractId: 'CTR-TDCCOL-2025-01',
    orgId: 'ORG-TDCCOL-OR',
    invoiceNumber: 'INV-SAM-2025-Q1',
    billingPeriod: 'Q1 FY2025-26 (Apr - Jun 2025)',
    issueDate: '2025-04-05T00:00:00.000Z',
    dueDate: '2025-05-05T00:00:00.000Z',
    amount: 425000, // Q1 License (₹1,25,000) + Scale Onboarding (₹3,00,000)
    status: 'PAID',
    reconciliationStatus: 'FULLY_RECONCILED',
    payments: [
      {
        id: 'PAY-001',
        invoiceId: 'INV-SAM-2025-Q1',
        paymentMethod: 'TREASURY_CHALLAN',
        treasuryChallanNo: 'TREAS-OD-2025-08149',
        bankUtr: 'SBIN-UTR-20250428-9941',
        pfmsRef: 'PFMS-C10-884102',
        paidAmount: 425000,
        paymentDate: '2025-04-28T14:15:00.000Z',
        verifiedByAdmin: 'patnaik.dpo',
        reconciledAt: '2025-04-29T10:00:00.000Z',
      },
    ],
    paidAmount: 425000,
    outstandingBalance: 0,
    notes: 'Reconciled against Baripada District Treasury Challan #TREAS-OD-2025-08149.',
    createdAt: '2025-04-05T10:00:00.000Z',
    updatedAt: '2025-04-29T10:00:00.000Z',
  },
  {
    id: 'INV-SAM-2025-Q2',
    contractId: 'CTR-TDCCOL-2025-01',
    orgId: 'ORG-TDCCOL-OR',
    invoiceNumber: 'INV-SAM-2025-Q2',
    billingPeriod: 'Q2 FY2025-26 (Jul - Sep 2025)',
    issueDate: '2025-07-05T00:00:00.000Z',
    dueDate: '2025-08-05T00:00:00.000Z',
    amount: 162500, // Q2 License (₹1,25,000) + Q2 SLA Maintenance (₹37,500)
    status: 'PAID',
    reconciliationStatus: 'FULLY_RECONCILED',
    payments: [
      {
        id: 'PAY-002',
        invoiceId: 'INV-SAM-2025-Q2',
        paymentMethod: 'NEFT_RTGS',
        bankUtr: 'HDFC-RTGS-20250720-0012',
        paidAmount: 162500,
        paymentDate: '2025-07-20T11:30:00.000Z',
        verifiedByAdmin: 'patnaik.dpo',
        reconciledAt: '2025-07-21T09:00:00.000Z',
      },
    ],
    paidAmount: 162500,
    outstandingBalance: 0,
    notes: 'Direct RTGS settlement from TDCCOL institutional account.',
    createdAt: '2025-07-05T10:00:00.000Z',
    updatedAt: '2025-07-21T09:00:00.000Z',
  },
  {
    id: 'INV-SAM-2025-Q3',
    contractId: 'CTR-TDCCOL-2025-01',
    orgId: 'ORG-TDCCOL-OR',
    invoiceNumber: 'INV-SAM-2025-Q3',
    billingPeriod: 'Q3 FY2025-26 (Oct - Dec 2025)',
    issueDate: '2025-10-05T00:00:00.000Z',
    dueDate: '2025-11-05T00:00:00.000Z',
    amount: 162500,
    status: 'ISSUED',
    reconciliationStatus: 'PENDING_RECONCILIATION',
    payments: [],
    paidAmount: 0,
    outstandingBalance: 162500,
    notes: 'Submitted for administrative disbursement to State Finance Division.',
    createdAt: '2025-10-05T10:00:00.000Z',
    updatedAt: '2025-10-05T10:00:00.000Z',
  },
];

export function computeRevenueSummary(
  contract: InstitutionalServiceContract,
  invoices: InstitutionalInvoice[]
): RevenueSummary {
  const totalAgreed = contract.fixedAgreedFee.totalContractValue;
  const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.amount, 0);
  const totalReceived = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalOutstanding = totalAgreed - totalReceived;

  let overallReconciliation: InstitutionalReconciliationStatus = 'FULLY_RECONCILED';
  const hasPending = invoices.some((inv) => inv.reconciliationStatus === 'PENDING_RECONCILIATION');
  const hasVariance = invoices.some((inv) => inv.reconciliationStatus === 'VARIANCE_DETECTED');

  if (hasVariance) {
    overallReconciliation = 'VARIANCE_DETECTED';
  } else if (hasPending || totalOutstanding > 0) {
    overallReconciliation = 'PENDING_RECONCILIATION';
  }

  const servicePeriodHistory = invoices.map((inv) => ({
    period: inv.billingPeriod,
    invoiced: inv.amount,
    paid: inv.paidAmount,
    outstanding: inv.outstandingBalance,
    status: inv.status,
  }));

  return {
    totalAgreedServiceAmount: totalAgreed,
    totalInvoiced,
    totalReceived,
    totalOutstandingBalance: totalOutstanding,
    reconciliationStatus: overallReconciliation,
    servicePeriodHistory,
  };
}

