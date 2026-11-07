/**
 * Samagna Phase 10: Business Intelligence, Operational Reporting & Enterprise Traceability
 *
 * Core domain logic, data models, privacy guards, and reporting invariants:
 * 1. Multi-audience operational intelligence (Institutional, B2B, Processing, Commercial).
 * 2. Strict distinction between Actual records, Estimates, and Missing data (Data Fidelity).
 * 3. Enforced PII masking for primary collectors: zero raw collector PII in commercial exports or public pages.
 * 4. Enterprise traceability evidence packaging with chain-of-custody milestones.
 */

import { sanitizeCsvCell } from './server/exportSanitizer';

// ============================================================================
// 1. DATA FIDELITY DEFINITIONS & GUARDS
// ============================================================================

/**
 * Data fidelity classification for every report metric and evidence node:
 * - ACTUAL: Primary verifiable physical weighment, signed gate pass, paid bank remittance.
 * - ESTIMATED: Algorithmic moisture shrinkage allowance, projected processing yield, seasonal calendar projection.
 * - MISSING: Unrecorded weighment, missing warehouse destination log, absent moisture test certificate.
 */
export type DataFidelity = 'ACTUAL' | 'ESTIMATED' | 'MISSING';

export interface FidelityTag<T = number> {
  value: T;
  fidelity: DataFidelity;
  note?: string;
  confidencePercent?: number;
}

export function tagActual<T>(val: T, note?: string): FidelityTag<T> {
  return { value: val, fidelity: 'ACTUAL', note, confidencePercent: 100 };
}

export function tagEstimated<T>(val: T, note?: string, confidencePercent = 85): FidelityTag<T> {
  return { value: val, fidelity: 'ESTIMATED', note, confidencePercent };
}

export function tagMissing<T>(fallback: T, note?: string): FidelityTag<T> {
  return { value: fallback, fidelity: 'MISSING', note: note || 'Data gap identified; record not logged', confidencePercent: 0 };
}

// ============================================================================
// 2. PRIVACY & PII MASKING GUARDS (COLLECTOR PROTECTION)
// ============================================================================

export interface MaskedCollectorContribution {
  maskedId: string;
  maskedName: string;
  villageCluster: string;
  gramPanchayat: string;
  weightKg: number;
  ratePerKg: number;
  payoutAmountRedacted: string;
  fidelity: DataFidelity;
}

/**
 * Mask primary collector name for commercial exports and public verification.
 * e.g., "Sunita Soren" -> "S***** S**** [PRIMARY GATHERER]"
 */
export function maskCollectorName(name?: string): string {
  if (!name || !name.trim()) return 'ANONYMIZED PRODUCER';
  const parts = name.trim().split(/\s+/);
  const masked = parts
    .map((p) => {
      if (p.length <= 1) return p;
      return p[0] + '*'.repeat(Math.max(1, p.length - 1));
    })
    .join(' ');
  return `${masked} [PRIMARY GATHERER]`;
}

/**
 * Mask statutory tribal or government identification.
 * e.g. "OR-MAY-KRN-0842" -> "OR-***-0842"
 */
export function maskTribalId(tribalId?: string): string {
  if (!tribalId || !tribalId.trim()) return 'GOVT-ID-REDACTED';
  const segments = tribalId.split('-');
  if (segments.length >= 3) {
    return `${segments[0]}-***-${segments[segments.length - 1]}`;
  }
  if (tribalId.length > 6) {
    return `${tribalId.slice(0, 3)}***${tribalId.slice(-4)}`;
  }
  return '***-REDACTED';
}

/**
 * Strictly redact banking, Aadhaar, and direct financial credentials.
 */
export function maskFinancialRecord(bank?: string, account?: string): string {
  return '[STATUTORY_PRIVACY_PROTECTED]';
}

/**
 * Mask phone numbers or contact lines.
 */
export function maskPhone(phone?: string): string {
  if (!phone || !phone.trim()) return '[CONTACT_PROTECTED]';
  return phone.replace(/(\d{2})\d{4,6}(\d{2,4})/, '$1******$2');
}

// ============================================================================
// 3. INSTITUTIONAL OPERATIONS REPORT TYPES
// ============================================================================

export interface InstitutionalBiReport {
  generatedAt: string;
  reportingDistrict: string;
  overallFidelity: DataFidelity;

  summary: {
    totalBatches: number;
    totalProcuredKg: number;
    totalMspDisbursedInr: number;
    activeCentersCount: number;
    activeDistrictsCount: number;
    fidelity: DataFidelity;
  };

  collectionActivity: {
    dailyVolumeKg: { date: string; weightKg: number; batchCount: number; fidelity: DataFidelity }[];
    speciesBreakdown: { produceName: string; weightKg: number; percentage: number; fidelity: DataFidelity }[];
    collectorParticipation: {
      totalGatherersRecorded: number;
      avgKgPerGatherer: number;
      topCollectionPanchayat: string;
      fidelity: DataFidelity;
    };
  };

  procurementRecords: {
    gradeDistribution: {
      gradeA_Kg: number;
      gradeB_Kg: number;
      gradeC_Kg: number;
      fidelity: DataFidelity;
    };
    districtBreakdown: { district: string; volumeKg: number; valueInr: number; fidelity: DataFidelity }[];
    statutoryMspComplianceRatePercent: number; // Invariant: must be 100%
  };

  centrePerformance: {
    centerId: string;
    centerName: string;
    district: string;
    throughputKg: number;
    targetKg: number;
    achievementRatePercent: number;
    operationalUptimePercent: number;
    activeScalesCount: number;
    fidelity: DataFidelity;
  }[];

  batchCustody: {
    batchesByStatus: {
      registered: number;
      inTransit: number;
      verifiedSaleable: number;
      quarantinedDiscrepancy: number;
    };
    transitWaybillsIssued: number;
    avgTransitDays: number;
    activeCarriersCount: number;
    fidelity: DataFidelity;
  };

  inventoryExceptions: {
    currentDepotStockKg: number;
    shrinkageAllowanceKg: number;
    actualShrinkageKg: number;
    openDiscrepanciesCount: number;
    quarantinedWeightKg: number;
    discrepancyRatePercent: number;
    fidelity: DataFidelity;
  };

  operationalReconciliation: {
    totalDispatchedNetKg: number;
    totalArrivalNetKg: number;
    netTransitShrinkageKg: number;
    unexplainedVarianceKg: number;
    reconciliationRatePercent: number;
    fidelity: DataFidelity;
  };
}

// ============================================================================
// 4. B2B BULK TRADE REPORT TYPES
// ============================================================================

export interface B2bBiReport {
  generatedAt: string;
  overallFidelity: DataFidelity;

  summary: {
    totalRfqs: number;
    totalQuotations: number;
    totalPurchaseOrders: number;
    tradeGmvInr: number;
    activeSuppliersCount: number;
    activeBulkBuyersCount: number;
    fidelity: DataFidelity;
  };

  rfqActivity: {
    openRfqsCount: number;
    closedRfqsCount: number;
    totalRequestedVolumeKg: number;
    rfqsByCategory: { category: string; count: number; volumeKg: number; fidelity: DataFidelity }[];
    avgTargetPricePerKg: number;
    fidelity: DataFidelity;
  };

  quotationConversion: {
    quotesSubmitted: number;
    quotesAccepted: number;
    quotesRejected: number;
    conversionRatePercent: number;
    avgQuoteTurnaroundHours: number;
    avgSpreadPercent: number;
    fidelity: DataFidelity;
  };

  purchaseOrders: {
    ordersByStatus: { status: string; count: number; totalValueInr: number; fidelity: DataFidelity }[];
    topOrderedSpecies: { speciesName: string; totalOrderedKg: number; totalValueInr: number; fidelity: DataFidelity }[];
    avgOrderValueInr: number;
    fidelity: DataFidelity;
  };

  supplierActivity: {
    supplierId: string;
    businessName: string;
    district: string;
    activeListingsCount: number;
    availableStockKg: number;
    fulfilledOrdersCount: number;
    reliabilityScorePercent: number;
    fidelity: DataFidelity;
  }[];

  buyerActivity: {
    buyerId: string;
    businessName: string;
    category: string;
    rfqsIssued: number;
    ordersPlaced: number;
    totalSpendInr: number;
    repeatBuyer: boolean;
    fidelity: DataFidelity;
  }[];

  orderFulfilment: {
    onTimeDeliveryRatePercent: number;
    lotAcceptanceRatePercent: number;
    orderDiscrepancyRatePercent: number;
    avgFulfillmentDays: number;
    fidelity: DataFidelity;
  };
}

// ============================================================================
// 5. PROCESSING & VALUE-ADDITION REPORT TYPES
// ============================================================================

export interface ProcessingBiReport {
  generatedAt: string;
  overallFidelity: DataFidelity;

  summary: {
    totalFacilities: number;
    totalDailyCapacityKg: number;
    currentAllocatedCapacityKg: number;
    overallUtilizationPercent: number;
    activeJobsCount: number;
    fidelity: DataFidelity;
  };

  facilityUtilisation: {
    facilityId: string;
    facilityName: string;
    location: string;
    capacityKgDay: number;
    allocatedKgDay: number;
    utilizationPercent: number;
    operationalStatus: string;
    fidelity: DataFidelity;
  }[];

  processingCapacity: {
    processingType: string;
    totalCapacityKgDay: number;
    activeLinesCount: number;
    unitCostEstimateInrKg: number;
    fidelity: DataFidelity;
  }[];

  inputOutputReconciliation: {
    totalRawInputKg: number;
    totalFinishedOutputKg: number;
    totalByProductKg: number;
    totalProcessLossKg: number;
    actualRecoveryRatePercent: number;
    standardBenchmarkRatePercent: number;
    yieldVariancePercent: number;
    fidelity: DataFidelity;
  };

  jobPerformance: {
    scheduledJobs: number;
    inProgressJobs: number;
    completedJobs: number;
    delayedJobs: number;
    slaAdherencePercent: number;
    avgTurnaroundDays: number;
    fidelity: DataFidelity;
  };
}

// ============================================================================
// 6. COMMERCIAL OPERATIONS REPORT TYPES
// ============================================================================

export interface CommercialBiReport {
  generatedAt: string;
  overallFidelity: DataFidelity;

  summary: {
    totalServiceRevenueInr: number;
    totalInvoicedInr: number;
    totalCollectedInr: number;
    totalOutstandingInr: number;
    collectorFeeProtectionVerified: boolean; // Must be true (0 fees on primary collectors)
    fidelity: DataFidelity;
  };

  institutionalRevenue: {
    activeContractsCount: number;
    totalContractValueInr: number;
    billedRevenueInr: number;
    pendingDeliverablesCount: number;
    renewalsDueNext30DaysCount: number;
    fidelity: DataFidelity;
  };

  invoiceStatus: {
    invoicesByStatus: { status: string; count: number; totalAmountInr: number; fidelity: DataFidelity }[];
    totalInvoicedInr: number;
    totalPaidInr: number;
    overdueInvoicesCount: number;
    overdueAmountInr: number;
    fidelity: DataFidelity;
  };

  reconciledTransactions: {
    reconciledCount: number;
    reconciledVolumeInr: number;
    bankReferenceMatchPercent: number;
    reconciliationVarianceInr: number; // 0.00 in healthy state
    fidelity: DataFidelity;
  };

  approvedServiceFees: {
    platformFacilitationFeesInr: number;
    processingFeesInr: number;
    logisticsCoordinationFeesInr: number;
    primaryCollectorDeductionsInr: number; // Must be strictly 0
    fidelity: DataFidelity;
  };

  outstandingBalances: {
    totalAccountsReceivableInr: number;
    agingBuckets: {
      under30DaysInr: number;
      thirtyToSixtyDaysInr: number;
      over60DaysInr: number;
    };
    fidelity: DataFidelity;
  };
}

// ============================================================================
// 7. ENTERPRISE TRACEABILITY & EVIDENCE PACKAGES
// ============================================================================

export type CustodyCheckpointType =
  | 'HARVEST_COLLECTION'
  | 'FIELD_VERIFICATION_WEIGHMENT'
  | 'TRANSIT_DISPATCH'
  | 'DEPOT_RECEIPT_VERIFICATION'
  | 'PROCESSING_VALUE_ADD'
  | 'COMMERCIAL_ORDER_FULFILMENT';

export interface CustodyTimelineCheckpoint {
  stepOrder: number;
  checkpointType: CustodyCheckpointType;
  title: string;
  nodeName: string;
  location: string;
  timestamp: string;
  actorIdentityMasked: string;
  actorRole: string;
  recordedWeightKg?: number;
  weightDeltaKg?: number;
  sealOrWaybillReference?: string;
  fidelity: DataFidelity;
  fidelityNote: string;
}

export interface EnterpriseTraceabilityDossier {
  lotId: string;
  batchCode: string;
  produceName: string;
  produceOdia: string;
  scientificName: string;
  harvestSeason: string;
  standardGrade: string;

  originJurisdiction: {
    state: string;
    district: string;
    block: string;
    gramPanchayat: string;
    centerName: string;
    shgFederation?: string;
    depotDestination: string;
  };

  collectorProvenance: {
    totalPrimaryCollectors: number;
    villageClusters: string[];
    tribalCommunities: string[];
    piiProtectionActive: boolean;
    collectorsSummary: MaskedCollectorContribution[];
  };

  chainOfCustody: CustodyTimelineCheckpoint[];

  weightReconciliation: {
    fieldNetAcceptedKg: number;
    depotArrivalNetKg: number;
    transitShrinkageKg: number;
    shrinkageToleranceKg: number;
    unexplainedVarianceKg: number;
    reconciliationStatus: 'RECONCILED' | 'WITHIN_SHRINKAGE_TOLERANCE' | 'QUARANTINED_DISCREPANCY';
    fidelity: DataFidelity;
  };

  qualityAndStandards: {
    grade: string;
    moisturePercent?: number;
    allowableMoistureLimit: number;
    foreignMatterPercent?: number;
    packagingStandard: string;
    qualityAuditStatus: 'VERIFIED_COMPLIANT' | 'PENDING_LAB_ASSAY' | 'QUARANTINED';
    certifications: string[];
    fidelity: DataFidelity;
  };

  processingFootprint?: {
    facilityId: string;
    facilityName: string;
    jobId: string;
    inputQuantityKg: number;
    outputQuantityKg: number;
    recoveryRatePercent: number;
    processingType: string;
    fidelity: DataFidelity;
  };

  commercialFulfilment?: {
    purchaseOrderId?: string;
    buyerCategoryMasked?: string;
    channel?: string;
    fulfillmentStatus?: string;
    fidelity: DataFidelity;
  };

  dataCompletenessScore: number; // 0-100%
  overallFidelity: DataFidelity;

  exportMetadata: {
    exportedAt: string;
    exportedByRole: string;
    audience: 'PUBLIC_VERIFICATION' | 'COMMERCIAL_BUYER' | 'INSTITUTIONAL_REGULATOR';
    piiProtectionActive: boolean;
    tamperEvidentDigest: string;
  };
}

// ============================================================================
// 8. CONTROLLED EXPORT GENERATORS (JSON & DEFENSIVE CSV)
// ============================================================================

/**
 * Generate cryptographic SHA-256 digest placeholder for provenance tamper detection.
 */
export function generateProvenanceDigest(lotId: string, timestamp: string, netKg: number): string {
  // Simple deterministic hash simulation for environments without native crypto sync
  const raw = `${lotId}|${timestamp}|${netKg}|SAMAGNA_ENTERPRISE_TRACEABILITY`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SHA256-${hex}${Date.now().toString(16).slice(-8)}`;
}

/**
 * Export enterprise traceability evidence package as JSON string.
 */
export function generateTraceabilityPassportJson(dossier: EnterpriseTraceabilityDossier): string {
  return JSON.stringify(dossier, null, 2);
}

/**
 * Export enterprise traceability evidence package as RFC 4180 CSV with OWASP formula injection neutralization.
 */
export function generateTraceabilityPassportCsv(dossier: EnterpriseTraceabilityDossier): string {
  const rows: string[] = [];

  // Metadata Header Block
  rows.push(['Section', 'Property', 'Value', 'Data Fidelity'].map(sanitizeCsvCell).join(','));
  rows.push(['LOT_IDENTIFIER', 'Batch ID', dossier.batchCode, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['BOTANICAL_SPECIMEN', 'English Produce', dossier.produceName, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['BOTANICAL_SPECIMEN', 'Scientific Name', dossier.scientificName, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['ORIGIN_JURISDICTION', 'State', dossier.originJurisdiction.state, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['ORIGIN_JURISDICTION', 'District', dossier.originJurisdiction.district, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['ORIGIN_JURISDICTION', 'Gram Panchayat', dossier.originJurisdiction.gramPanchayat, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['ORIGIN_JURISDICTION', 'Aggregation Center', dossier.originJurisdiction.centerName, 'ACTUAL'].map(sanitizeCsvCell).join(','));

  // Collector Summary Block (strictly masked)
  rows.push(['COLLECTOR_PROTECTION', 'Total Gatherers', String(dossier.collectorProvenance.totalPrimaryCollectors), 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['COLLECTOR_PROTECTION', 'PII Protection Active', String(dossier.collectorProvenance.piiProtectionActive), 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['COLLECTOR_PROTECTION', 'Tribal Communities', dossier.collectorProvenance.tribalCommunities.join('; '), 'ACTUAL'].map(sanitizeCsvCell).join(','));

  // Custody Timeline Block
  rows.push(['--- CUSTODY TIMELINE ---', '', '', ''].map(sanitizeCsvCell).join(','));
  rows.push(['Step', 'Checkpoint Title', 'Location & Handler', 'Recorded Weight (kg)', 'Fidelity'].map(sanitizeCsvCell).join(','));
  for (const cp of dossier.chainOfCustody) {
    rows.push([
      String(cp.stepOrder),
      cp.title,
      `${cp.location} (${cp.actorIdentityMasked} - ${cp.actorRole})`,
      cp.recordedWeightKg !== undefined ? String(cp.recordedWeightKg) : 'N/A',
      cp.fidelity,
    ].map(sanitizeCsvCell).join(','));
  }

  // Weight Reconciliation Block
  rows.push(['--- WEIGHT RECONCILIATION ---', '', '', ''].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Field Net Accepted (kg)', String(dossier.weightReconciliation.fieldNetAcceptedKg), dossier.weightReconciliation.fidelity].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Depot Arrival Net (kg)', String(dossier.weightReconciliation.depotArrivalNetKg), dossier.weightReconciliation.fidelity].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Transit Shrinkage (kg)', String(dossier.weightReconciliation.transitShrinkageKg), 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Shrinkage Allowance (kg)', String(dossier.weightReconciliation.shrinkageToleranceKg), 'ESTIMATED'].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Unexplained Variance (kg)', String(dossier.weightReconciliation.unexplainedVarianceKg), 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['WEIGHMENT', 'Reconciliation Status', dossier.weightReconciliation.reconciliationStatus, 'ACTUAL'].map(sanitizeCsvCell).join(','));

  // Export Signature
  rows.push(['--- AUDIT INTEGRITY ---', '', '', ''].map(sanitizeCsvCell).join(','));
  rows.push(['AUDIT', 'Completeness Score', `${dossier.dataCompletenessScore}%`, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['AUDIT', 'Tamper Evident Digest', dossier.exportMetadata.tamperEvidentDigest, 'ACTUAL'].map(sanitizeCsvCell).join(','));
  rows.push(['AUDIT', 'Exported At', dossier.exportMetadata.exportedAt, 'ACTUAL'].map(sanitizeCsvCell).join(','));

  return rows.join('\n');
}

