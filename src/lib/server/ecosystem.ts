/**
 * SAMAGNA Phase 9: Ecosystem and Organisation Management Server Engine
 * 
 * Provides server-side multi-tenant organisation isolation, auditable verification,
 * document management, membership and role assignments, and append-only activity logging.
 */

import {
  EcosystemOrganisation,
  OrganisationDocument,
  OrganisationMember,
  OrganisationActivityLog,
  EcosystemOrgCategory,
  EcosystemVerificationStatus,
  OrgMemberRole,
  OrgDocumentType,
  AuthUserContext,
  enforceOrganisationIsolation,
  validateVerificationPrerequisites,
  canTransitionOrgStatus,
  SEED_ECOSYSTEM_ORGANISATIONS,
} from '../ecosystem';

// ============================================================================
// In-Memory Standby Ledgers for Ecosystem Organisations
// ============================================================================

let standbyOrganisations: EcosystemOrganisation[] = [...SEED_ECOSYSTEM_ORGANISATIONS];

let standbyDocuments: OrganisationDocument[] = [
  {
    id: 'DOC-ECO-TDCCOL-01',
    organisationId: 'ECO-ORG-TDCCOL',
    documentType: 'REGISTRATION_CERTIFICATE',
    documentNumber: 'REG-OD-COOP-1972-004',
    fileUrl: '/docs/compliance/tdccol-incorporation-cert.pdf',
    uploadedBy: 'Secretary ST/SC Dev Dept Govt of Odisha',
    uploadedAt: '2025-01-02T10:00:00.000Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Dr. Ramesh Jena, Deputy Director ST/SC Dev Dept Govt of Odisha',
    verifiedAt: '2025-01-10T10:00:00.000Z',
    verificationNotes: 'Certified copy of state cooperative registration verified against government gazette.',
  },
  {
    id: 'DOC-ECO-MAYURFPO-01',
    organisationId: 'ECO-ORG-MAYURFPO',
    documentType: 'REGISTRATION_CERTIFICATE',
    documentNumber: 'U01110OR2021PTC036112',
    fileUrl: '/docs/compliance/mayurbhanj-fpo-mca-cert.pdf',
    uploadedBy: 'Sanjay Majhi (Director)',
    uploadedAt: '2025-02-05T09:30:00.000Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'District Development Manager, NABARD Mayurbhanj',
    verifiedAt: '2025-02-15T11:30:00.000Z',
    verificationNotes: 'Ministry of Corporate Affairs Certificate of Incorporation verified on MCA portal.',
  },
  {
    id: 'DOC-ECO-KARANJIA-01',
    organisationId: 'ECO-ORG-KARANJIASHG',
    documentType: 'REGISTRATION_CERTIFICATE',
    documentNumber: 'REG-OD-WSHG-2018-089',
    fileUrl: '/docs/compliance/karanjia-wshg-federation-cert.pdf',
    uploadedBy: 'Sumitra Marndi (President)',
    uploadedAt: '2025-01-16T11:00:00.000Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Block Development Officer, Karanjia Block',
    verifiedAt: '2025-01-20T14:00:00.000Z',
    verificationNotes: 'Mission Shakti Block Level Federation certification verified.',
  },
  {
    id: 'DOC-ECO-ROURKELA-01',
    organisationId: 'ECO-ORG-ROURKELAMILL',
    documentType: 'FSSAI_LICENSE',
    documentNumber: '12019001000882',
    fileUrl: '/docs/compliance/rourkela-fssai-ayush.pdf',
    uploadedBy: 'Er. Asit Tripathy',
    uploadedAt: '2025-02-16T10:00:00.000Z',
    verificationStatus: 'VERIFIED',
    verifiedBy: 'General Manager, District Industries Centre Sundargarh',
    verifiedAt: '2025-02-20T11:00:00.000Z',
    verificationNotes: 'FSSAI Central Processing License for botanical grinding verified.',
  },
];

let standbyMembers: OrganisationMember[] = [
  {
    id: 'MEM-ECO-001',
    organisationId: 'ECO-ORG-TDCCOL',
    userId: 'USR-ADMIN-TDCCOL',
    fullName: 'Patnaik DPO',
    email: 'patnaik.dpo@tdccol.odisha.gov.in',
    phone: '+91-94370-19281',
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    assignedBy: 'Managing Director, TDCCOL',
    assignedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'MEM-ECO-002',
    organisationId: 'ECO-ORG-TDCCOL',
    userId: 'USR-OPS-TDCCOL',
    fullName: 'S. Das (Depôt Head)',
    email: 'sdas.baripada@tdccol.odisha.gov.in',
    phone: '+91-94371-22819',
    role: 'OPERATIONS_OFFICER',
    status: 'ACTIVE',
    assignedBy: 'Patnaik DPO',
    assignedAt: '2025-01-05T00:00:00.000Z',
  },
  {
    id: 'MEM-ECO-003',
    organisationId: 'ECO-ORG-MAYURFPO',
    userId: 'USR-FPO-MAJHI',
    fullName: 'Sanjay Majhi',
    email: 'sanjay.majhi@similipalfpo.org',
    phone: '+91-94371-88291',
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    assignedBy: 'Board of Directors, FPO',
    assignedAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'MEM-ECO-004',
    organisationId: 'ECO-ORG-KARANJIASHG',
    userId: 'USR-SHG-SUMITRA',
    fullName: 'Sumitra Marndi',
    email: 'sumitra.marndi@mission-shakti.od.gov.in',
    phone: '+91-94382-77112',
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    assignedBy: 'Executive Committee, WSHG',
    assignedAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'MEM-ECO-005',
    organisationId: 'ECO-ORG-DABURBUYER',
    userId: 'USR-DABUR-JOSHI',
    fullName: 'Vikram Joshi',
    email: 'vikram.joshi@dabur.com',
    phone: '+91-98100-29182',
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    assignedBy: 'Corporate Procurement Committee, Dabur India',
    assignedAt: '2025-01-20T00:00:00.000Z',
  },
];

let standbyActivityLogs: OrganisationActivityLog[] = [
  {
    id: 'ACT-ECO-001',
    organisationId: 'ECO-ORG-TDCCOL',
    action: 'ORGANISATION_REGISTERED',
    actor: 'Secretary ST/SC Dev Dept Govt of Odisha',
    details: 'Initial registration of TDCCOL Odisha as statewide institutional value-chain operator.',
    timestamp: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ACT-ECO-002',
    organisationId: 'ECO-ORG-TDCCOL',
    action: 'VERIFICATION_APPROVED',
    actor: 'Dr. Ramesh Jena, Deputy Director ST/SC Dev Dept Govt of Odisha',
    details: 'Verified active status granted following statutory charter audit.',
    timestamp: '2025-01-10T10:00:00.000Z',
  },
];

// ============================================================================
// Internal Helper: Record Organisation Activity Log
// ============================================================================

export function recordOrganisationActivity(
  organisationId: string,
  action: string,
  actor: string,
  details: string
): OrganisationActivityLog {
  const log: OrganisationActivityLog = {
    id: `ACT-ECO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    organisationId,
    action,
    actor,
    details,
    timestamp: new Date().toISOString(),
  };
  standbyActivityLogs.unshift(log);
  return log;
}

// ============================================================================
// 1. Organisation Directory & Isolated Lookups
// ============================================================================

export async function getEcosystemOrganisations(filter?: {
  category?: EcosystemOrgCategory;
  verificationStatus?: EcosystemVerificationStatus;
  state?: string;
  district?: string;
  search?: string;
}): Promise<EcosystemOrganisation[]> {
  let orgs = [...standbyOrganisations];

  if (filter?.category) {
    orgs = orgs.filter((o) => o.category === filter.category);
  }
  if (filter?.verificationStatus) {
    orgs = orgs.filter((o) => o.verificationStatus === filter.verificationStatus);
  }
  if (filter?.state) {
    orgs = orgs.filter((o) => o.serviceArea.state.toLowerCase() === filter.state!.toLowerCase());
  }
  if (filter?.district) {
    orgs = orgs.filter((o) =>
      o.serviceArea.districts.some((d) => d.toLowerCase().includes(filter.district!.toLowerCase()))
    );
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    orgs = orgs.filter(
      (o) =>
        o.legalName.toLowerCase().includes(q) ||
        o.tradeName.toLowerCase().includes(q) ||
        o.code.toLowerCase().includes(q) ||
        o.contact.primaryContactName.toLowerCase().includes(q)
    );
  }

  return orgs;
}

/**
 * Retrieves organisation details with server-side multi-tenant isolation.
 * If requestingUser is supplied, enforces that non-platform-admins can only
 * access confidential details for their own organisation.
 */
export async function getEcosystemOrganisationById(
  orgId: string,
  requestingUser?: AuthUserContext
): Promise<{
  organisation: EcosystemOrganisation;
  documents?: OrganisationDocument[];
  members?: OrganisationMember[];
  activityLogs?: OrganisationActivityLog[];
} | null> {
  const org = standbyOrganisations.find((o) => o.id === orgId || o.code === orgId);
  if (!org) return null;

  // If requestingUser is specified, enforce isolation for private profile data
  if (requestingUser) {
    enforceOrganisationIsolation(requestingUser, org.id);
    const documents = standbyDocuments.filter((d) => d.organisationId === org.id);
    const members = standbyMembers.filter((m) => m.organisationId === org.id);
    const activityLogs = standbyActivityLogs.filter((l) => l.organisationId === org.id);

    return { organisation: org, documents, members, activityLogs };
  }

  return { organisation: org };
}

// ============================================================================
// 2. Organisation Registration Workflow
// ============================================================================

export async function registerEcosystemOrganisation(
  input: {
    code: string;
    legalName: string;
    tradeName: string;
    category: EcosystemOrgCategory;
    registrationNumber?: string | null;
    panNumber?: string | null;
    gstin?: string | null;
    fssaiNumber?: string | null;
    serviceArea: {
      state: string;
      districts: string[];
      blocks: string[];
      villageClusters: string[];
      pincodes: string[];
      operationalHubs?: string[];
    };
    contact: {
      primaryContactName: string;
      primaryContactEmail: string;
      primaryContactPhone: string;
      officeAddress: string;
    };
    operationalCapacityNotes?: string | null;
  },
  registeringUser: AuthUserContext
): Promise<EcosystemOrganisation> {
  // Check code uniqueness
  const existing = standbyOrganisations.find((o) => o.code.toUpperCase() === input.code.toUpperCase());
  if (existing) {
    throw new Error(`DUPLICATE_ORGANISATION_CODE: Organisation code '${input.code}' is already registered.`);
  }

  const now = new Date().toISOString();
  const orgId = `ECO-ORG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newOrg: EcosystemOrganisation = {
    id: orgId,
    code: input.code.toUpperCase(),
    legalName: input.legalName,
    tradeName: input.tradeName,
    category: input.category,
    registrationNumber: input.registrationNumber || null,
    panNumber: input.panNumber || null,
    gstin: input.gstin || null,
    fssaiNumber: input.fssaiNumber || null,
    verificationStatus: 'PENDING_VERIFICATION', // Defaults to pending
    verificationNotes: null,
    verifiedBy: null,
    verifiedAt: null,
    rejectionReason: null,
    serviceArea: input.serviceArea,
    contact: input.contact,
    operationalCapacityNotes: input.operationalCapacityNotes || null,
    createdAt: now,
    updatedAt: now,
  };

  standbyOrganisations.unshift(newOrg);

  // Automatically assign registering user as first ORG_ADMIN
  const memberId = `MEM-ECO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const initialAdmin: OrganisationMember = {
    id: memberId,
    organisationId: newOrg.id,
    userId: registeringUser.userId,
    fullName: registeringUser.fullName || input.contact.primaryContactName,
    email: input.contact.primaryContactEmail,
    phone: input.contact.primaryContactPhone,
    role: 'ORG_ADMIN',
    status: 'ACTIVE',
    assignedBy: registeringUser.fullName || 'System Registration',
    assignedAt: now,
  };
  standbyMembers.unshift(initialAdmin);

  recordOrganisationActivity(
    newOrg.id,
    'ORGANISATION_REGISTERED',
    registeringUser.fullName || registeringUser.username,
    `Registered ${newOrg.tradeName} under category ${newOrg.category}. Status: PENDING_VERIFICATION.`
  );

  return newOrg;
}

// ============================================================================
// 3. Document Management & Compliance Dossier
// ============================================================================

export async function submitOrganisationDocument(
  orgId: string,
  docInput: {
    documentType: OrgDocumentType;
    documentNumber: string;
    fileUrl: string;
  },
  requestingUser: AuthUserContext
): Promise<OrganisationDocument> {
  // CRITICAL ISOLATION: Member can only upload for their own org
  enforceOrganisationIsolation(requestingUser, orgId);

  const org = standbyOrganisations.find((o) => o.id === orgId);
  if (!org) throw new Error(`Organisation not found: ${orgId}`);

  const now = new Date().toISOString();
  const docId = `DOC-ECO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const doc: OrganisationDocument = {
    id: docId,
    organisationId: org.id,
    documentType: docInput.documentType,
    documentNumber: docInput.documentNumber,
    fileUrl: docInput.fileUrl,
    uploadedBy: requestingUser.fullName || requestingUser.username,
    uploadedAt: now,
    verificationStatus: 'SUBMITTED',
    verifiedBy: null,
    verifiedAt: null,
    verificationNotes: null,
  };

  standbyDocuments.unshift(doc);

  recordOrganisationActivity(
    org.id,
    'DOCUMENT_UPLOADED',
    requestingUser.fullName || requestingUser.username,
    `Uploaded ${doc.documentType} (Number: ${doc.documentNumber}) for compliance review.`
  );

  return doc;
}

export async function reviewOrganisationDocument(
  docId: string,
  status: 'VERIFIED' | 'REJECTED',
  auditor: AuthUserContext,
  notes?: string
): Promise<OrganisationDocument> {
  // Only platform supervisors/auditors can verify documents
  if (auditor.role !== 'SUPERVISOR_ADMIN' && auditor.isPlatformAdmin !== true) {
    throw new Error('AUDITOR_CLEARANCE_REQUIRED: Only platform regulators or supervisors can audit compliance documents.');
  }

  const doc = standbyDocuments.find((d) => d.id === docId);
  if (!doc) throw new Error(`Document not found: ${docId}`);

  const now = new Date().toISOString();
  doc.verificationStatus = status;
  doc.verifiedBy = auditor.fullName || auditor.username;
  doc.verifiedAt = now;
  doc.verificationNotes = notes || null;

  recordOrganisationActivity(
    doc.organisationId,
    status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
    auditor.fullName || auditor.username,
    `${status} compliance document ${doc.documentType} (${doc.documentNumber}). Notes: ${notes || 'N/A'}.`
  );

  return doc;
}

// ============================================================================
// 4. Auditable Verification Workflow (No Fabricated Badges)
// ============================================================================

export async function reviewEcosystemOrganisation(
  orgId: string,
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'SUSPEND',
  auditor: AuthUserContext,
  notes?: string,
  rejectionReason?: string
): Promise<EcosystemOrganisation> {
  // Only platform supervisors or state regulators can approve/reject organisations
  if (auditor.role !== 'SUPERVISOR_ADMIN' && auditor.isPlatformAdmin !== true) {
    throw new Error('AUDITOR_CLEARANCE_REQUIRED: Only platform regulators or supervisors can approve organisation verification.');
  }

  const org = standbyOrganisations.find((o) => o.id === orgId);
  if (!org) throw new Error(`Organisation not found: ${orgId}`);

  const now = new Date().toISOString();
  const prevStatus = org.verificationStatus;

  if (action === 'APPROVE') {
    // CRITICAL INVARIANT: Cannot fabricate verification badges without documented evidence
    const prereq = validateVerificationPrerequisites(
      org,
      standbyDocuments,
      auditor.fullName || auditor.username
    );

    if (!prereq.eligible) {
      throw new Error(`FABRICATED_BADGE_PROHIBITED: ${prereq.message}`);
    }

    if (!canTransitionOrgStatus(prevStatus, 'VERIFIED_ACTIVE')) {
      throw new Error(`INVALID_STATUS_TRANSITION: Cannot transition organisation from ${prevStatus} to VERIFIED_ACTIVE.`);
    }

    org.verificationStatus = 'VERIFIED_ACTIVE';
    org.verifiedBy = auditor.fullName || auditor.username;
    org.verifiedAt = now;
    org.verificationNotes = notes || 'All statutory registration documents and service areas audited and certified.';
    org.rejectionReason = null;
    org.updatedAt = now;

    recordOrganisationActivity(
      org.id,
      'VERIFICATION_APPROVED',
      auditor.fullName || auditor.username,
      `Organisation verified active by auditor. Status: VERIFIED_ACTIVE.`
    );
  } else if (action === 'REJECT') {
    org.verificationStatus = 'REJECTED';
    org.rejectionReason = rejectionReason || notes || 'Statutory documentation incomplete or non-compliant.';
    org.verificationNotes = notes || null;
    org.updatedAt = now;

    recordOrganisationActivity(
      org.id,
      'VERIFICATION_REJECTED',
      auditor.fullName || auditor.username,
      `Organisation verification rejected. Reason: ${org.rejectionReason}.`
    );
  } else if (action === 'SUSPEND') {
    org.verificationStatus = 'SUSPENDED';
    org.rejectionReason = rejectionReason || notes || 'Suspended pending compliance investigation.';
    org.updatedAt = now;

    recordOrganisationActivity(
      org.id,
      'ORGANISATION_SUSPENDED',
      auditor.fullName || auditor.username,
      `Organisation status suspended. Reason: ${org.rejectionReason}.`
    );
  } else if (action === 'REQUEST_CHANGES') {
    org.verificationStatus = 'UNDER_REVIEW';
    org.verificationNotes = notes || 'Additional compliance documentation requested from applicant.';
    org.updatedAt = now;

    recordOrganisationActivity(
      org.id,
      'CHANGES_REQUESTED',
      auditor.fullName || auditor.username,
      `Applicant requested to provide updated documents: ${notes}.`
    );
  }

  return org;
}

// ============================================================================
// 5. Membership Management & Role Assignments
// ============================================================================

export async function getOrganisationMembers(
  orgId: string,
  requestingUser: AuthUserContext
): Promise<OrganisationMember[]> {
  // CRITICAL ISOLATION: Member directory is private to the organisation
  enforceOrganisationIsolation(requestingUser, orgId);
  return standbyMembers.filter((m) => m.organisationId === orgId);
}

export async function addOrganisationMember(
  orgId: string,
  memberInput: {
    fullName: string;
    email: string;
    phone?: string | null;
    role: OrgMemberRole;
  },
  requestingUser: AuthUserContext
): Promise<OrganisationMember> {
  // CRITICAL ISOLATION
  enforceOrganisationIsolation(requestingUser, orgId);

  // Check if email already belongs to this org
  const existing = standbyMembers.find(
    (m) => m.organisationId === orgId && m.email.toLowerCase() === memberInput.email.toLowerCase()
  );
  if (existing) {
    throw new Error(`DUPLICATE_MEMBER_EMAIL: User with email '${memberInput.email}' is already a member of this organisation.`);
  }

  const now = new Date().toISOString();
  const memberId = `MEM-ECO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newMember: OrganisationMember = {
    id: memberId,
    organisationId: orgId,
    userId: null, // Linked upon first login
    fullName: memberInput.fullName,
    email: memberInput.email.toLowerCase(),
    phone: memberInput.phone || null,
    role: memberInput.role,
    status: 'ACTIVE',
    assignedBy: requestingUser.fullName || requestingUser.username,
    assignedAt: now,
  };

  standbyMembers.unshift(newMember);

  recordOrganisationActivity(
    orgId,
    'MEMBER_ADDED',
    requestingUser.fullName || requestingUser.username,
    `Added member ${newMember.fullName} (${newMember.email}) with role ${newMember.role}.`
  );

  return newMember;
}

export async function updateOrganisationMemberRole(
  orgId: string,
  memberId: string,
  newRole: OrgMemberRole,
  requestingUser: AuthUserContext
): Promise<OrganisationMember> {
  // CRITICAL ISOLATION
  enforceOrganisationIsolation(requestingUser, orgId);

  const member = standbyMembers.find((m) => m.id === memberId && m.organisationId === orgId);
  if (!member) throw new Error(`Member not found in organisation: ${memberId}`);

  const prevRole = member.role;
  member.role = newRole;

  recordOrganisationActivity(
    orgId,
    'ROLE_ASSIGNED',
    requestingUser.fullName || requestingUser.username,
    `Updated role for ${member.fullName} from ${prevRole} to ${newRole}.`
  );

  return member;
}

// ============================================================================
// 6. Organisation Activity History
// ============================================================================

export async function getOrganisationActivityLogs(
  orgId: string,
  requestingUser: AuthUserContext
): Promise<OrganisationActivityLog[]> {
  // CRITICAL ISOLATION: Activity history is confidential to the tenant
  enforceOrganisationIsolation(requestingUser, orgId);
  return standbyActivityLogs.filter((l) => l.organisationId === orgId);
}

