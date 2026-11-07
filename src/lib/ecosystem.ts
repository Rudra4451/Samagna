/**
 * SAMAGNA Phase 9: Ecosystem and Organisation Management Domain Models
 * 
 * Supports all 9 participating organisation categories across the forest-produce value chain:
 * 1. Institutional organisations (e.g., TDCCOL, TRIFED, Forest Dept)
 * 2. Producer organisations (e.g., FPOs, Tribal Cooperatives)
 * 3. SHGs (Self-Help Groups & Women's SHG Federations)
 * 4. Suppliers (Authorized produce aggregators)
 * 5. Bulk buyers (Wholesale traders, institutional procurement buyers)
 * 6. Manufacturers (Ayurvedic/herbal medicine & FMCG manufacturers)
 * 7. Processing facilities (Deseeding, cryo-grinding, filtration units)
 * 8. Logistics providers (State cooperative transport, freight carriers)
 * 9. Retail partners (State emporiums, partner commercial stores)
 * 
 * CRITICAL ISOLATION & GOVERNANCE RULES:
 * - Server-side multi-tenant organisation isolation: No organisation can access another's private records.
 * - Auditable human verification: Badges require verified compliance documents; fabricated badges are prohibited.
 * - Strict role-based member permissions within organisations.
 */

export type EcosystemOrgCategory =
  | 'INSTITUTIONAL_ORGANISATION'
  | 'PRODUCER_ORGANISATION'
  | 'SHG_FEDERATION'
  | 'SUPPLIER'
  | 'BULK_BUYER'
  | 'MANUFACTURER'
  | 'PROCESSING_FACILITY'
  | 'LOGISTICS_PROVIDER'
  | 'RETAIL_PARTNER';

export type EcosystemVerificationStatus =
  | 'DRAFT_REGISTRATION'
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'VERIFIED_ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export type OrgMemberRole =
  | 'ORG_ADMIN'
  | 'OPERATIONS_OFFICER'
  | 'FINANCIAL_OFFICER'
  | 'FIELD_AGENT'
  | 'READ_ONLY';

export type OrgDocumentType =
  | 'REGISTRATION_CERTIFICATE'
  | 'PAN_CARD'
  | 'GSTIN_CERTIFICATE'
  | 'FSSAI_LICENSE'
  | 'MANDI_LICENSE'
  | 'POLLUTION_CLEARANCE'
  | 'FOREST_RIGHTS_RECOGNITION'
  | 'AUTHORIZATION_LETTER'
  | 'STATUTORY_GOVT_ORDER';

export interface ServiceAreaInfo {
  state: string;
  districts: string[];
  blocks: string[];
  villageClusters: string[];
  pincodes: string[];
  operationalHubs?: string[];
}

export interface OrganisationContact {
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  officeAddress: string;
}

export interface OrganisationDocument {
  id: string; // e.g. "DOC-ECO-001"
  organisationId: string;
  documentType: OrgDocumentType;
  documentNumber: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  verificationStatus: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationNotes: string | null;
}

export interface OrganisationMember {
  id: string; // e.g. "MEM-ECO-001"
  organisationId: string;
  userId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  role: OrgMemberRole;
  status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  assignedBy: string;
  assignedAt: string;
}

export interface OrganisationActivityLog {
  id: string; // e.g. "ACT-ECO-001"
  organisationId: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface EcosystemOrganisation {
  id: string; // e.g. "ECO-ORG-TDCCOL"
  code: string; // e.g. "TDCCOL-OD"
  legalName: string;
  tradeName: string;
  category: EcosystemOrgCategory;
  registrationNumber: string | null;
  panNumber: string | null;
  gstin: string | null;
  fssaiNumber: string | null;
  verificationStatus: EcosystemVerificationStatus;
  verificationNotes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  serviceArea: ServiceAreaInfo;
  contact: OrganisationContact;
  operationalCapacityNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// User context representation for server-side isolation
export interface AuthUserContext {
  userId: string;
  username: string;
  role: string; // e.g. "SUPERVISOR_ADMIN", "COLLECTION_MANAGER", "ORG_ADMIN", etc.
  organisationId?: string | null; // The organisation this user belongs to
  fullName: string;
  isPlatformAdmin?: boolean; // Platform admins / regulators have statewide multi-tenant clearance
}

// ============================================================================
// Multi-Tenant Isolation & Verification Invariant Functions
// ============================================================================

/**
 * CRITICAL ISOLATION GUARD:
 * Enforces that an organisation user can ONLY access records belonging to their own organisation.
 * Platform administrators / state regulators have statewide clearance for audit oversight.
 */
export function checkOrganisationIsolation(
  user: AuthUserContext,
  targetOrganisationId: string
): { allowed: boolean; reason?: string } {
  // Platform supervisors and state administrators have statewide audit clearance
  if (user.role === 'SUPERVISOR_ADMIN' || user.isPlatformAdmin === true) {
    return { allowed: true };
  }

  // Without organisation linkage, unassigned users cannot access private tenant records
  if (!user.organisationId) {
    return {
      allowed: false,
      reason: `UNASSIGNED_USER_BLOCKED: User '${user.username}' is not affiliated with any verified organisation.`,
    };
  }

  // Cross-organisation access violation
  if (user.organisationId !== targetOrganisationId) {
    return {
      allowed: false,
      reason: `CROSS_ORGANISATION_ACCESS_BLOCKED: Organisation '${user.organisationId}' is strictly prohibited from accessing private records of organisation '${targetOrganisationId}'.`,
    };
  }

  return { allowed: true };
}

/**
 * Asserts organisation isolation; throws an error if breached.
 */
export function enforceOrganisationIsolation(user: AuthUserContext, targetOrganisationId: string): void {
  const result = checkOrganisationIsolation(user, targetOrganisationId);
  if (!result.allowed) {
    throw new Error(result.reason || 'CROSS_ORGANISATION_ACCESS_BLOCKED');
  }
}

/**
 * INVARIANT: Auditable verification process & No Fabricated Badges.
 * An organisation cannot be approved to VERIFIED_ACTIVE without:
 * 1. An identified human auditor with title
 * 2. Registration number or PAN
 * 3. At least one uploaded and verified document
 */
export function validateVerificationPrerequisites(
  org: EcosystemOrganisation,
  documents: OrganisationDocument[],
  auditor: string
): { eligible: boolean; message: string } {
  if (!auditor || auditor.trim().length === 0) {
    return {
      eligible: false,
      message: 'HUMAN_AUDITOR_REQUIRED: Verification requires sign-off from a designated government or platform auditor.',
    };
  }

  if (!org.registrationNumber && !org.panNumber) {
    return {
      eligible: false,
      message: 'STATUTORY_ID_REQUIRED: Organisation must provide an official Registration Number or PAN before verification.',
    };
  }

  const hasVerifiedDoc = documents.some(
    (d) => d.organisationId === org.id && d.verificationStatus === 'VERIFIED'
  );

  if (!hasVerifiedDoc) {
    return {
      eligible: false,
      message: 'VERIFICATION_EVIDENCE_REQUIRED: Cannot grant VERIFIED_ACTIVE badge without at least one verified compliance document in the audit dossier.',
    };
  }

  return { eligible: true, message: 'All compliance prerequisites verified.' };
}

/**
 * Validates allowed state transitions for organisation verification status.
 */
export function canTransitionOrgStatus(
  currentStatus: EcosystemVerificationStatus,
  targetStatus: EcosystemVerificationStatus
): boolean {
  if (currentStatus === targetStatus) return true;

  const validTransitions: Record<EcosystemVerificationStatus, EcosystemVerificationStatus[]> = {
    DRAFT_REGISTRATION: ['PENDING_VERIFICATION'],
    PENDING_VERIFICATION: ['UNDER_REVIEW', 'VERIFIED_ACTIVE', 'REJECTED'],
    UNDER_REVIEW: ['VERIFIED_ACTIVE', 'REJECTED', 'PENDING_VERIFICATION'],
    VERIFIED_ACTIVE: ['SUSPENDED', 'UNDER_REVIEW'],
    REJECTED: ['PENDING_VERIFICATION'], // May re-apply
    SUSPENDED: ['UNDER_REVIEW', 'VERIFIED_ACTIVE'],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

// ============================================================================
// Seed Data: 9 Distinct Participating Organisations
// ============================================================================

export const SEED_ECOSYSTEM_ORGANISATIONS: EcosystemOrganisation[] = [
  // 1. Institutional Organisation
  {
    id: 'ECO-ORG-TDCCOL',
    code: 'TDCCOL-OR',
    legalName: 'Tribal Development Cooperative Corporation of Odisha Limited',
    tradeName: 'TDCCOL Odisha',
    category: 'INSTITUTIONAL_ORGANISATION',
    registrationNumber: 'REG-OD-COOP-1972-004',
    panNumber: 'AAACT7721K',
    gstin: '21AAACT7721K1Z2',
    fssaiNumber: '12022001000145',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Statutory tribal development corporation audited under Odisha State Cooperative Societies Act.',
    verifiedBy: 'Dr. Ramesh Jena, Deputy Director ST/SC Dev Dept Govt of Odisha',
    verifiedAt: '2025-01-10T10:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Mayurbhanj', 'Koraput', 'Rayagada', 'Keonjhar', 'Kandhamal'],
      blocks: ['Karanjia', 'Baripada', 'Jashipur', 'Sunabeda', 'Rayagada'],
      villageClusters: ['Badagaon', 'Gorumahisani', 'Similipal Buffer', 'Borigumma'],
      pincodes: ['757037', '757001', '763002'],
      operationalHubs: ['Central Depôt Baripada', 'Karanjia Procurement Center'],
    },
    contact: {
      primaryContactName: 'Managing Director, TDCCOL',
      primaryContactEmail: 'md@tdccol.odisha.gov.in',
      primaryContactPhone: '+91-674-2541289',
      officeAddress: 'Rupali Square, Bhoi Nagar, Bhubaneswar, Odisha 751022',
    },
    operationalCapacityNotes: 'Statewide nodal aggregation capacity: 25,000 MT/year across 14 tribal districts.',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z',
  },

  // 2. Producer Organisation
  {
    id: 'ECO-ORG-MAYURFPO',
    code: 'MAYUR-FPO-01',
    legalName: 'Mayurbhanj Tribal Forest Farmers Producer Company Limited',
    tradeName: 'Similipal Forest Produce FPO',
    category: 'PRODUCER_ORGANISATION',
    registrationNumber: 'U01110OR2021PTC036112',
    panNumber: 'AABCM9912L',
    gstin: '21AABCM9912L1Z9',
    fssaiNumber: null,
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Incorporated under Companies Act 2013; 1,200 Santhal & Kolha tribal farmer members verified.',
    verifiedBy: 'District Development Manager, NABARD Mayurbhanj',
    verifiedAt: '2025-02-15T11:30:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Mayurbhanj'],
      blocks: ['Karanjia', 'Raruan', 'Sukruli'],
      villageClusters: ['Badagaon', 'Karanjia Tribal Hamlet', 'Dudhkundi'],
      pincodes: ['757037', '757039'],
      operationalHubs: ['Badagaon Aggregation Shed'],
    },
    contact: {
      primaryContactName: 'Sanjay Majhi (Director)',
      primaryContactEmail: 'contact@similipalfpo.org',
      primaryContactPhone: '+91-94371-88291',
      officeAddress: 'Main Road, Karanjia, Mayurbhanj, Odisha 757037',
    },
    operationalCapacityNotes: 'Direct aggregation capacity: 1,500 MT/season (Mahua, Sal seed, Harida).',
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-02-15T11:30:00.000Z',
  },

  // 3. SHG Federation
  {
    id: 'ECO-ORG-KARANJIASHG',
    code: 'SHG-FED-KARANJIA',
    legalName: 'Karanjia Tribal Mahila Producer Cooperative Federation',
    tradeName: 'Maa Similipal SHG Federation',
    category: 'SHG_FEDERATION',
    registrationNumber: 'REG-OD-WSHG-2018-089',
    panNumber: 'AAALK4412B',
    gstin: null,
    fssaiNumber: '22023001000912',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Federation of 42 Women SHGs under Odisha Livelihoods Mission (Mission Shakti).',
    verifiedBy: 'Block Development Officer, Karanjia Block',
    verifiedAt: '2025-01-20T14:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Mayurbhanj'],
      blocks: ['Karanjia', 'Jashipur'],
      villageClusters: ['Badagaon', 'Tato', 'Baidaposi'],
      pincodes: ['757037'],
    },
    contact: {
      primaryContactName: 'Sumitra Marndi (President)',
      primaryContactEmail: 'karanjia.wshg@mission-shakti.od.gov.in',
      primaryContactPhone: '+91-94382-77112',
      officeAddress: 'Mission Shakti Bhawan, Sub-Divisional Office, Karanjia 757037',
    },
    operationalCapacityNotes: 'Primary collection and primary sorting capacity: 400 MT/year.',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-20T14:00:00.000Z',
  },

  // 4. Supplier
  {
    id: 'ECO-ORG-KALINGASUPP',
    code: 'SUPP-KALINGA-01',
    legalName: 'Kalinga Forest Flora Supply Agency',
    tradeName: 'Kalinga Bio-Botanicals',
    category: 'SUPPLIER',
    registrationNumber: 'UDYAM-OD-17-0029182',
    panNumber: 'AAGCK1182N',
    gstin: '21AAGCK1182N1Z4',
    fssaiNumber: null,
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Registered MSME raw flora trader with Mayurbhanj DFO transit license.',
    verifiedBy: 'Divisional Forest Officer, Baripada Division',
    verifiedAt: '2025-02-18T16:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Mayurbhanj', 'Keonjhar'],
      blocks: ['Baripada', 'Betnoti'],
      villageClusters: ['Baripada Outskirts', 'Betnoti'],
      pincodes: ['757001'],
    },
    contact: {
      primaryContactName: 'Debendra Mohanty',
      primaryContactEmail: 'debendra@kalingabio.in',
      primaryContactPhone: '+91-94370-11229',
      officeAddress: 'Station Road, Baripada, Mayurbhanj, Odisha 757001',
    },
    operationalCapacityNotes: 'Transit supply handling: 2,000 MT/year with warehouse storage.',
    createdAt: '2025-02-10T00:00:00.000Z',
    updatedAt: '2025-02-18T16:00:00.000Z',
  },

  // 5. Bulk Buyer
  {
    id: 'ECO-ORG-DABURBUYER',
    code: 'BUYER-DABUR-01',
    legalName: 'Dabur India Limited',
    tradeName: 'Dabur Herbal & Natural Procurement',
    category: 'BULK_BUYER',
    registrationNumber: 'L24230DL1975PLC007908',
    panNumber: 'AAACD0012E',
    gstin: '07AAACD0012E1Z8',
    fssaiNumber: '10014011001895',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'Public limited enterprise audited with corporate AYUSH manufacturing licenses.',
    verifiedBy: 'State Medicinal Plants Board (SMPB) Odisha',
    verifiedAt: '2025-01-25T15:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'National',
      districts: ['Mayurbhanj', 'Koraput'],
      blocks: ['All'],
      villageClusters: ['State Depôts'],
      pincodes: ['757001', '763002'],
    },
    contact: {
      primaryContactName: 'Vikram Joshi (VP Herb Procurement)',
      primaryContactEmail: 'herbal.sourcing@dabur.com',
      primaryContactPhone: '+91-120-3982000',
      officeAddress: 'Kaushambi, Sahibabad, Ghaziabad, UP 201010',
    },
    operationalCapacityNotes: 'Annual raw botanical procurement demand: 5,000 MT across Honey, Amla, Harida.',
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-01-25T15:00:00.000Z',
  },

  // 6. Manufacturer
  {
    id: 'ECO-ORG-PATANJALIMFG',
    code: 'MFG-PATANJALI-01',
    legalName: 'Patanjali Ayurved Limited',
    tradeName: 'Patanjali Herbal Processing Division',
    category: 'MANUFACTURER',
    registrationNumber: 'U24237UR2006PLC031412',
    panNumber: 'AAACP8821R',
    gstin: '05AAACP8821R1Z1',
    fssaiNumber: '10012012000180',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'GMP & AYUSH certified bulk pharmaceutical processing division.',
    verifiedBy: 'Drug Controller & AYUSH Directorate Govt of Odisha',
    verifiedAt: '2025-02-12T10:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'National',
      districts: ['Mayurbhanj', 'Koraput', 'Kandhamal'],
      blocks: ['All'],
      villageClusters: ['Central Depôts'],
      pincodes: ['757001'],
    },
    contact: {
      primaryContactName: 'Dr. R.K. Sharma (Plant Head)',
      primaryContactEmail: 'procurement@patanjaliayurved.org',
      primaryContactPhone: '+91-1334-240008',
      officeAddress: 'Patanjali Food & Herbal Park, Haridwar, Uttarakhand 249405',
    },
    operationalCapacityNotes: 'Pharmaceutical formulation capacity: 10,000 MT/year.',
    createdAt: '2025-02-05T00:00:00.000Z',
    updatedAt: '2025-02-12T10:00:00.000Z',
  },

  // 7. Processing Facility
  {
    id: 'ECO-ORG-ROURKELAMILL',
    code: 'FAC-ROURKELA-01',
    legalName: 'Rourkela Wild Medicinal Pulverization Center',
    tradeName: 'Rourkela Cryo-Milling Unit',
    category: 'PROCESSING_FACILITY',
    registrationNumber: 'FAC-OR-MSME-2019-991',
    panNumber: 'AABFR4419M',
    gstin: '21AABFR4419M1Z3',
    fssaiNumber: '12019001000882',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'AYUSH-compliant cryogenic nitrogen grinding and sieve-mesh facility.',
    verifiedBy: 'General Manager, District Industries Centre Sundargarh',
    verifiedAt: '2025-02-20T11:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Sundargarh', 'Mayurbhanj'],
      blocks: ['Rourkela Industrial Area'],
      villageClusters: ['Kalunga Industrial Estate'],
      pincodes: ['769004'],
    },
    contact: {
      primaryContactName: 'Er. Asit Tripathy',
      primaryContactEmail: 'asit@rourkelacryo.in',
      primaryContactPhone: '+91-661-2401822',
      officeAddress: 'Plot 44, Kalunga Industrial Area, Sundargarh, Odisha 769004',
    },
    operationalCapacityNotes: 'Cryogenic micro-pulverization throughput: 3,000 kg/day (100 mesh).',
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-20T11:00:00.000Z',
  },

  // 8. Logistics Provider
  {
    id: 'ECO-ORG-LOGSTATECOOP',
    code: 'LOG-STATE-FLEET',
    legalName: 'Odisha State Forest Produce Transport Cooperative Fleet',
    tradeName: 'State Green Logistics Fleet',
    category: 'LOGISTICS_PROVIDER',
    registrationNumber: 'REG-OD-TRANS-COOP-2016',
    panNumber: 'AAAFO1199P',
    gstin: '21AAAFO1199P1Z5',
    fssaiNumber: null,
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'State certified cooperative transport fleet with 45 GPS-equipped trucks.',
    verifiedBy: 'Regional Transport Officer (RTO) Mayurbhanj',
    verifiedAt: '2025-01-18T10:00:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'Odisha',
      districts: ['Mayurbhanj', 'Koraput', 'Sundargarh', 'Cuttack', 'Khordha'],
      blocks: ['All Inter-District Corridors'],
      villageClusters: ['Statewide Network'],
      pincodes: ['757001', '751022'],
    },
    contact: {
      primaryContactName: 'Capt. P.K. Jena (Transport Coord)',
      primaryContactEmail: 'dispatch@forestlogistics.odisha.gov.in',
      primaryContactPhone: '+91-674-2591823',
      officeAddress: 'Transport Bhawan, Rasulgarh, Bhubaneswar 751010',
    },
    operationalCapacityNotes: 'Fleet capacity: 45 trucks (10-25 MT) with calibrated tare weight sensors.',
    createdAt: '2025-01-10T00:00:00.000Z',
    updatedAt: '2025-01-18T10:00:00.000Z',
  },

  // 9. Retail Partner
  {
    id: 'ECO-ORG-UTKALIKASTORE',
    code: 'RET-UTKALIKA-01',
    legalName: 'Odisha State Handicrafts & Handloom Emporium (Utkalika)',
    tradeName: 'Utkalika Forest & Tribal Treasures',
    category: 'RETAIL_PARTNER',
    registrationNumber: 'REG-OD-EMP-1962-001',
    panNumber: 'AAAUO2291Q',
    gstin: '21AAAUO2291Q1Z7',
    fssaiNumber: '12018001000491',
    verificationStatus: 'VERIFIED_ACTIVE',
    verificationNotes: 'State-owned retail chain with prime emporiums in Bhubaneswar, New Delhi, Kolkata.',
    verifiedBy: 'Director of Handicrafts Govt of Odisha',
    verifiedAt: '2025-01-22T14:30:00.000Z',
    rejectionReason: null,
    serviceArea: {
      state: 'National',
      districts: ['Khordha', 'New Delhi', 'Kolkata'],
      blocks: ['Metro Retail Centers'],
      villageClusters: ['Prime Commercial Outlets'],
      pincodes: ['751001', '110001', '700016'],
    },
    contact: {
      primaryContactName: 'Geetanjali Mohapatra (Retail Head)',
      primaryContactEmail: 'emporium@utkalikaodisha.com',
      primaryContactPhone: '+91-674-2530182',
      officeAddress: 'Utkalika Market Building, Ashok Nagar, Bhubaneswar 751001',
    },
    operationalCapacityNotes: '18 flagship emporiums and connected e-commerce fulfilment center.',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-01-22T14:30:00.000Z',
  },
];
