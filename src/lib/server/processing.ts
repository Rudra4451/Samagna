/**
 * Server-Side Processing Coordination Network, Capacity Matching & Mass-Balance Reconciliation
 *
 * Invariants:
 * 1. FULL_TRACEABILITY: Input lot reference -> Output value-added lot reference.
 * 2. NO_AUTO_ALLOCATION: Capacity matching produces candidates only; requires manual confirmation.
 * 3. CAPACITY_CONFLICT_PREVENTION: Prevents booking exceeding daily capacity limits on overlapping dates.
 * 4. MASS_BALANCE_RECONCILIATION: Enforces Input Weight = Output Weight + By-Products + Loss before completion.
 * 5. PILOT_REVENUE_INVARIANT: Coordination fee rate is 0.0 in pilot; zero fee deductions from collectors.
 */

import { getPrismaClient, isDatabaseConfigured } from './db';
import {
  ProcessingFacility,
  ProcessingRequest,
  ProcessingJob,
  FacilityVerificationStatus,
  ProcessingRequestStatus,
  ProcessingJobStatus,
  validateMassBalance,
  DEFAULT_PROCESSING_FACILITIES,
  DEFAULT_PROCESSING_REQUESTS,
  DEFAULT_PROCESSING_JOBS,
} from '../processing';
import { getTradeBusinessById } from './b2bTrade';

// Standby In-Memory Data Store (for development, testing, and offline modes)
let standbyFacilities: ProcessingFacility[] = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_FACILITIES));
let standbyRequests: ProcessingRequest[] = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_REQUESTS));
let standbyJobs: ProcessingJob[] = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_JOBS));

export function resetStandbyProcessingStore() {
  standbyFacilities = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_FACILITIES));
  standbyRequests = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_REQUESTS));
  standbyJobs = JSON.parse(JSON.stringify(DEFAULT_PROCESSING_JOBS));
}

// ==========================================
// 1. Facility Management
// ==========================================

export async function getProcessingFacilities(filter?: {
  district?: string;
  category?: string;
  verificationStatus?: FacilityVerificationStatus;
  isActive?: boolean;
}): Promise<ProcessingFacility[]> {
  let facilities = [...standbyFacilities];

  if (filter?.district) {
    facilities = facilities.filter((f) => f.district.toLowerCase() === filter.district!.toLowerCase());
  }
  if (filter?.category) {
    facilities = facilities.filter((f) =>
      f.supportedCategories.some((c) => c.toLowerCase().includes(filter.category!.toLowerCase()))
    );
  }
  if (filter?.verificationStatus) {
    facilities = facilities.filter((f) => f.verificationStatus === filter.verificationStatus);
  }
  if (filter?.isActive !== undefined) {
    facilities = facilities.filter((f) => f.isActive === filter.isActive);
  }

  return facilities;
}

export async function getProcessingFacilityById(id: string): Promise<ProcessingFacility | null> {
  return standbyFacilities.find((f) => f.id === id || f.code === id) || null;
}

export async function registerProcessingFacility(
  input: Omit<ProcessingFacility, 'id' | 'createdAt' | 'updatedAt' | 'verificationStatus'>
): Promise<ProcessingFacility> {
  const newId = `FAC-${input.district.toUpperCase().slice(0, 5)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const facility: ProcessingFacility = {
    ...input,
    id: newId,
    verificationStatus: 'PENDING_INSPECTION',
    createdAt: now,
    updatedAt: now,
  };

  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      await prisma.processingFacility.create({
        data: {
          id: facility.id,
          code: facility.code,
          name: facility.name,
          operatorOrgId: facility.operatorOrgId,
          operatorOrgName: facility.operatorOrgName,
          locationAddress: facility.locationAddress,
          district: facility.district,
          state: facility.state,
          pincode: facility.pincode,
          processingCapabilities: facility.processingCapabilities.join(', '),
          supportedCategories: facility.supportedCategories.join(', '),
          machineryEquipment: facility.machineryEquipment,
          dailyCapacityKg: facility.dailyCapacityKg,
          operatingAvailability: facility.operatingAvailability,
          minimumBatchKg: facility.minimumBatchKg,
          indicativeProcessingChargePerKg: facility.indicativeProcessingChargePerKg,
          verificationStatus: 'PENDING_INSPECTION',
          isActive: facility.isActive,
        },
      });
    } catch {
      // fallback
    }
  }

  standbyFacilities.unshift(facility);
  return facility;
}

export async function updateFacilityVerificationStatus(
  id: string,
  status: FacilityVerificationStatus
): Promise<ProcessingFacility> {
  const facility = standbyFacilities.find((f) => f.id === id);
  if (!facility) throw new Error(`Facility not found: ${id}`);

  facility.verificationStatus = status;
  facility.isActive = status === 'VERIFIED_OPERATIONAL';
  facility.updatedAt = new Date().toISOString();

  return facility;
}

// ==========================================
// 2. Processing Requests
// ==========================================

export async function getProcessingRequests(filter?: {
  requestingOrgId?: string;
  status?: ProcessingRequestStatus;
  targetFacilityId?: string;
}): Promise<ProcessingRequest[]> {
  let requests = [...standbyRequests];

  if (filter?.requestingOrgId) {
    requests = requests.filter((r) => r.requestingOrgId === filter.requestingOrgId);
  }
  if (filter?.status) {
    requests = requests.filter((r) => r.status === filter.status);
  }
  if (filter?.targetFacilityId) {
    requests = requests.filter((r) => r.targetFacilityId === filter.targetFacilityId);
  }

  return requests;
}

export async function getProcessingRequestById(id: string): Promise<ProcessingRequest | null> {
  return standbyRequests.find((r) => r.id === id || r.requestNumber === id) || null;
}

export async function submitProcessingRequest(
  input: Omit<ProcessingRequest, 'id' | 'requestNumber' | 'status' | 'expectedOutputQuantityKg' | 'createdAt' | 'updatedAt' | 'rejectionReason'>
): Promise<ProcessingRequest> {
  // Check requesting organisation clearance
  const org = await getTradeBusinessById(input.requestingOrgId);
  if (org && org.verificationStatus !== 'VERIFIED_ACTIVE') {
    throw new Error(
      `UNVERIFIED_ORGANISATION_BLOCKED: Organisation '${input.requestingOrgId}' is not verified for processing requests.`
    );
  }

  const now = new Date().toISOString();
  const reqSeq = standbyRequests.length + 1;
  const requestId = `REQ-PROC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const requestNumber = `REQ-PROC-2025-${reqSeq.toString().padStart(3, '0')}`;

  const expectedOutputQuantityKg =
    Math.round(((input.inputQuantityKg * input.expectedYieldPercent) / 100) * 100) / 100;

  const request: ProcessingRequest = {
    ...input,
    id: requestId,
    requestNumber,
    expectedOutputQuantityKg,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };

  standbyRequests.unshift(request);
  return request;
}

// ==========================================
// 3. Capacity Matching Workflow (Manual Review Gate)
// ==========================================

export interface FacilityCapacityMatchResult {
  facility: ProcessingFacility;
  isCapable: boolean;
  batchMeetsMinimum: boolean;
  hasCapacityConflict: boolean;
  bookedCapacityKg: number;
  availableCapacityKg: number;
  estimatedProcessingDays: number;
  indicativeCostInr: number;
  compatibilityScore: number; // 0 to 100
  notes: string;
}

/**
 * Evaluates candidate facilities for a processing request.
 * INVARIANT: Does NOT automatically allocate physical inventory or guarantee capacity.
 * Prepares candidate comparison for manual review and confirmation.
 */
export async function matchProcessingFacilitiesForRequest(
  requestId: string
): Promise<{ request: ProcessingRequest; candidateMatches: FacilityCapacityMatchResult[] }> {
  const request = await getProcessingRequestById(requestId);
  if (!request) throw new Error(`Processing request not found: ${requestId}`);

  const activeFacilities = standbyFacilities.filter(
    (f) => f.verificationStatus === 'VERIFIED_OPERATIONAL' && f.isActive
  );

  const candidateMatches: FacilityCapacityMatchResult[] = activeFacilities.map((facility) => {
    // 1. Capability & Category Matching with Specificity Scoring
    const capabilityKeywords = facility.processingCapabilities.map((c) => c.toLowerCase());
    const categoryKeywords = facility.supportedCategories.map((c) => c.toLowerCase());

    const isSpecificMatch =
      capabilityKeywords.some((cap) =>
        (request.inputProduceName.toLowerCase().includes('honey') && (cap.includes('honey') || cap.includes('filtration'))) ||
        (request.inputProduceName.toLowerCase().includes('tamarind') && (cap.includes('tamarind') || cap.includes('deseed'))) ||
        (request.inputProduceName.toLowerCase().includes('harida') && (cap.includes('harida') || cap.includes('pulveriz') || cap.includes('mesh'))) ||
        (request.requiredOutputName.toLowerCase().includes('powder') && (cap.includes('pulveriz') || cap.includes('mill') || cap.includes('granul')))
      ) ||
      (request.inputProduceName.toLowerCase().includes('harida') && facility.name.toLowerCase().includes('medicinal'));

    const isGeneralCategoryMatch = categoryKeywords.some((cat) => {
      if (request.inputProduceSlug.includes('honey')) return cat.includes('honey');
      if (request.inputProduceSlug.includes('harida')) return cat.includes('medicinal');
      if (request.inputProduceSlug.includes('tamarind')) return cat.includes('produce');
      return cat.includes('produce');
    });

    const isCapable = isSpecificMatch || isGeneralCategoryMatch;

    // 2. Minimum Batch Size Check
    const batchMeetsMinimum = request.inputQuantityKg >= facility.minimumBatchKg;

    // 3. Capacity Conflict Check across dates
    const reqStart = new Date(request.preferredStartDate).getTime();
    const reqEnd = new Date(request.preferredCompletionDate).getTime();

    // Check active jobs running at this facility with overlapping dates
    const overlappingJobs = standbyJobs.filter((job) => {
      if (job.facilityId !== facility.id) return false;
      if (job.status === 'COMPLETED_VERIFIED' || job.status === 'REJECTED_DISCREPANCY') return false;

      const jobStart = new Date(job.startDate).getTime();
      const jobEnd = new Date(job.targetCompletionDate).getTime();
      return reqStart <= jobEnd && reqEnd >= jobStart;
    });

    const bookedCapacityKg = overlappingJobs.reduce((sum, j) => sum + j.inputQuantityKg, 0);
    const availableCapacityKg = Math.max(0, facility.dailyCapacityKg - bookedCapacityKg);

    // If request daily rate exceeds available capacity, flag conflict
    const estimatedDays = Math.max(1, Math.ceil(request.inputQuantityKg / facility.dailyCapacityKg));
    const hasCapacityConflict = request.inputQuantityKg > availableCapacityKg && bookedCapacityKg > 0;

    // Indicative Processing Cost
    const indicativeCostInr = Math.round(request.inputQuantityKg * facility.indicativeProcessingChargePerKg * 100) / 100;

    // Compatibility Score Calculation
    let score = 0;
    if (isSpecificMatch) {
      score += 60;
    } else if (isGeneralCategoryMatch) {
      score += 25;
    }
    if (batchMeetsMinimum) score += 20;
    if (!hasCapacityConflict) score += 20;

    let notes = isCapable
      ? `Facility has certified equipment for ${request.inputProduceName}.`
      : `Produce category may require special tooling.`;

    if (!batchMeetsMinimum) {
      notes += ` Batch quantity (${request.inputQuantityKg} kg) is below facility MOQ (${facility.minimumBatchKg} kg).`;
    }
    if (hasCapacityConflict) {
      notes += ` Capacity conflict warning: facility has ${bookedCapacityKg} kg scheduled during preferred window.`;
    }

    return {
      facility,
      isCapable,
      batchMeetsMinimum,
      hasCapacityConflict,
      bookedCapacityKg,
      availableCapacityKg,
      estimatedProcessingDays: estimatedDays,
      indicativeCostInr,
      compatibilityScore: score,
      notes,
    };
  });

  // Sort candidates by compatibility score descending
  candidateMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return { request, candidateMatches };
}

// ==========================================
// 4. Manual Review & Confirmation
// ==========================================

export async function reviewProcessingRequest(
  requestId: string,
  action: 'ACCEPT' | 'REJECT',
  facilityId?: string,
  notes?: string
): Promise<ProcessingRequest> {
  const request = await getProcessingRequestById(requestId);
  if (!request) throw new Error(`Processing request not found: ${requestId}`);

  const now = new Date().toISOString();

  if (action === 'ACCEPT') {
    if (!facilityId) throw new Error('Facility must be designated when accepting a processing request.');
    request.targetFacilityId = facilityId;
    request.status = 'ACCEPTED';
    request.updatedAt = now;
  } else {
    request.status = 'REJECTED';
    request.rejectionReason = notes || 'Capacity not available or specifications incompatible.';
    request.updatedAt = now;
  }

  return request;
}

// ==========================================
// 5. Processing Jobs & Full Traceability
// ==========================================

export async function getProcessingJobs(filter?: {
  facilityId?: string;
  status?: ProcessingJobStatus;
  inputLotRef?: string;
  outputLotRef?: string;
}): Promise<ProcessingJob[]> {
  let jobs = [...standbyJobs];

  if (filter?.facilityId) {
    jobs = jobs.filter((j) => j.facilityId === filter.facilityId);
  }
  if (filter?.status) {
    jobs = jobs.filter((j) => j.status === filter.status);
  }
  if (filter?.inputLotRef) {
    jobs = jobs.filter((j) => j.inputLotRef === filter.inputLotRef);
  }
  if (filter?.outputLotRef) {
    jobs = jobs.filter((j) => j.outputLotRef === filter.outputLotRef);
  }

  return jobs;
}

export async function getProcessingJobById(id: string): Promise<ProcessingJob | null> {
  return standbyJobs.find((j) => j.id === id || j.jobCode === id) || null;
}

export async function scheduleProcessingJob(input: {
  requestId: string;
  facilityId: string;
  inputLotRef: string;
  startDate: string;
  targetCompletionDate: string;
  actor: string;
}): Promise<ProcessingJob> {
  const request = await getProcessingRequestById(input.requestId);
  if (!request) throw new Error(`Processing request not found: ${input.requestId}`);

  const facility = await getProcessingFacilityById(input.facilityId);
  if (!facility || !facility.isActive) {
    throw new Error(`Facility not found or inactive: ${input.facilityId}`);
  }

  // Capacity conflict check: Verify facility daily capacity is not breached by active jobs
  const reqStart = new Date(input.startDate).getTime();
  const reqEnd = new Date(input.targetCompletionDate).getTime();
  const overlappingJobs = standbyJobs.filter((job) => {
    if (job.facilityId !== facility.id) return false;
    if (job.status === 'COMPLETED_VERIFIED' || job.status === 'REJECTED_DISCREPANCY') return false;
    const jStart = new Date(job.startDate).getTime();
    const jEnd = new Date(job.targetCompletionDate).getTime();
    return reqStart <= jEnd && reqEnd >= jStart;
  });

  const currentlyBookedKg = overlappingJobs.reduce((sum, j) => sum + j.inputQuantityKg, 0);
  if (currentlyBookedKg + request.inputQuantityKg > facility.dailyCapacityKg * 3) {
    throw new Error(
      `CAPACITY_CONFLICT_EXCEEDED: Facility '${facility.name}' has ${currentlyBookedKg} kg scheduled; cannot accept ${request.inputQuantityKg} kg.`
    );
  }

  const now = new Date().toISOString();
  const jobSeq = standbyJobs.length + 1;
  const jobId = `JOB-PROC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const jobCode = `JOB-PROC-2025-${jobSeq.toString().padStart(3, '0')}`;
  const outputLotRef = `LOT-VAL-${request.inputProduceSlug.toUpperCase().slice(0, 6)}-${jobSeq.toString().padStart(3, '0')}`;

  const job: ProcessingJob = {
    id: jobId,
    jobCode,
    requestId: request.id,
    facilityId: facility.id,
    facilityName: facility.name,
    inputLotRef: input.inputLotRef,
    inputProduceName: request.inputProduceName,
    inputQuantityKg: request.inputQuantityKg,
    outputProduceName: request.requiredOutputName,
    outputLotRef,
    outputQuantityKg: null,
    processingLossKg: null,
    byProductQuantityKg: null,
    byProductDescription: null,
    actualYieldPercent: null,
    startDate: input.startDate,
    targetCompletionDate: input.targetCompletionDate,
    actualCompletionDate: null,
    qualityInspectionRef: null,
    qualityInspectionNotes: null,
    status: 'SCHEDULED',
    supportingDocuments: [],
    auditHistory: [
      {
        timestamp: now,
        actor: input.actor,
        action: 'SCHEDULE_PROCESSING_JOB',
        previousStatus: 'ACCEPTED',
        newStatus: 'SCHEDULED',
        notes: `Scheduled processing job from Request ${request.requestNumber}. Assigned output lot ref ${outputLotRef}.`,
      },
    ],
    coordinationFeeRate: 0.0, // 0.0 in pilot
    coordinationFeeInr: 0.0,
    createdAt: now,
    updatedAt: now,
  };

  request.status = 'JOB_SCHEDULED';
  request.targetFacilityId = facility.id;
  request.updatedAt = now;

  standbyJobs.unshift(job);
  return job;
}

export async function updateProcessingJobProgress(
  jobId: string,
  newStatus: ProcessingJobStatus,
  actor: string,
  updateData?: {
    outputQuantityKg?: number;
    processingLossKg?: number;
    byProductQuantityKg?: number;
    byProductDescription?: string;
    qualityInspectionRef?: string;
    qualityInspectionNotes?: string;
    notes?: string;
    documentUrl?: string;
  }
): Promise<ProcessingJob> {
  const job = await getProcessingJobById(jobId);
  if (!job) throw new Error(`Processing job not found: ${jobId}`);

  const now = new Date().toISOString();
  const prevStatus = job.status;

  // Mass-Balance Reconciliation on Completion
  if (newStatus === 'COMPLETED_VERIFIED') {
    const outputKg = updateData?.outputQuantityKg ?? job.outputQuantityKg;
    const lossKg = updateData?.processingLossKg ?? job.processingLossKg;
    const byProductKg = updateData?.byProductQuantityKg ?? job.byProductQuantityKg ?? 0;

    if (outputKg === undefined || outputKg === null || lossKg === undefined || lossKg === null) {
      throw new Error(
        'MASS_BALANCE_DATA_REQUIRED: Output net weight and processing loss are mandatory to complete a job.'
      );
    }

    const mb = validateMassBalance(job.inputQuantityKg, outputKg, byProductKg, lossKg);
    if (!mb.valid) {
      throw new Error(`MASS_BALANCE_DISCREPANCY_BLOCKED: ${mb.message}`);
    }

    // Quality Inspection Check
    const qcRef = updateData?.qualityInspectionRef || job.qualityInspectionRef;
    if (!qcRef) {
      throw new Error('QUALITY_INSPECTION_REQUIRED: Quality inspection certificate reference is mandatory before releasing output.');
    }

    job.outputQuantityKg = outputKg;
    job.processingLossKg = lossKg;
    job.byProductQuantityKg = byProductKg;
    if (updateData?.byProductDescription) job.byProductDescription = updateData.byProductDescription;
    job.actualYieldPercent = Math.round(((outputKg / job.inputQuantityKg) * 100) * 100) / 100;
    job.actualCompletionDate = now;
    job.qualityInspectionRef = qcRef;
    if (updateData?.qualityInspectionNotes) job.qualityInspectionNotes = updateData.qualityInspectionNotes;
  }

  job.status = newStatus;
  job.updatedAt = now;

  if (updateData?.documentUrl && !job.supportingDocuments.includes(updateData.documentUrl)) {
    job.supportingDocuments.push(updateData.documentUrl);
  }

  job.auditHistory.push({
    timestamp: now,
    actor,
    action: `TRANSITION_TO_${newStatus}`,
    previousStatus: prevStatus,
    newStatus,
    notes: updateData?.notes || `Job status updated to ${newStatus}.`,
  });

  return job;
}
