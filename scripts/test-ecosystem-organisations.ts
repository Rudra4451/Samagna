/**
 * SAMAGNA Phase 9 Test Suite: Ecosystem and Organisation Management
 * 
 * Verifies:
 * 1. Support for All 9 Value-Chain Organisation Categories
 * 2. Organisation Registration & Initial Admin Assignment
 * 3. Document Management & Compliance Dossier Auditing
 * 4. Auditable Verification Workflows & Anti-Fabrication Guards
 * 5. Membership Management & Role Assignments
 * 6. Server-Side Multi-Tenant Organisation Isolation
 * 7. Service-Area Jurisdiction & Operational Topography
 * 8. Immutable Organisation Activity History
 * 9. REST API Route Integration & HTTP Isolation Enforcements
 */

import {
  getEcosystemOrganisations,
  getEcosystemOrganisationById,
  registerEcosystemOrganisation,
  submitOrganisationDocument,
  reviewOrganisationDocument,
  reviewEcosystemOrganisation,
  getOrganisationMembers,
  addOrganisationMember,
  updateOrganisationMemberRole,
  getOrganisationActivityLogs,
} from '../src/lib/server/ecosystem';
import {
  EcosystemOrgCategory,
  AuthUserContext,
  checkOrganisationIsolation,
  validateVerificationPrerequisites,
  canTransitionOrgStatus,
} from '../src/lib/ecosystem';

let totalChecks = 0;
let passedChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runEcosystemTestSuite() {
  console.log('\n======================================================');
  console.log('   SAMAGNA Phase 9: Ecosystem & Organisation Mgmt     ');
  console.log('======================================================');

  // -------------------------------------------------------------------
  // 1. Support for All 9 Participating Organisation Categories
  // -------------------------------------------------------------------
  console.log('\n--- 1. Support for All 9 Organisation Categories ---');

  const allOrgs = await getEcosystemOrganisations();
  assert(allOrgs.length >= 9, 'All 9 seed organisations loaded in registry');

  const categories: EcosystemOrgCategory[] = [
    'INSTITUTIONAL_ORGANISATION',
    'PRODUCER_ORGANISATION',
    'SHG_FEDERATION',
    'SUPPLIER',
    'BULK_BUYER',
    'MANUFACTURER',
    'PROCESSING_FACILITY',
    'LOGISTICS_PROVIDER',
    'RETAIL_PARTNER',
  ];

  for (const cat of categories) {
    const org = allOrgs.find((o) => o.category === cat);
    assert(org !== undefined, `Category "${cat}" is supported and registered`);
  }

  // -------------------------------------------------------------------
  // 2. Organisation Registration Workflow
  // -------------------------------------------------------------------
  console.log('\n--- 2. Organisation Registration Workflow ---');

  const registeringUser: AuthUserContext = {
    userId: 'USR-REG-TEST-01',
    username: 'priya.behera',
    role: 'COLLECTOR',
    fullName: 'Priya Behera',
  };

  const newOrg = await registerEcosystemOrganisation(
    {
      code: 'TEST-FPO-KORAPUT-01',
      legalName: 'Koraput Tribal Bio-Organic Producer Company Limited',
      tradeName: 'Koraput Hill Herbs FPO',
      category: 'PRODUCER_ORGANISATION',
      registrationNumber: 'U01110OR2024PTC049102',
      panNumber: 'AABCK9901M',
      gstin: null,
      fssaiNumber: null,
      serviceArea: {
        state: 'Odisha',
        districts: ['Koraput', 'Rayagada'],
        blocks: ['Semiliguda', 'Pottangi'],
        villageClusters: ['Deomali Foothills', 'Sunabeda Valley'],
        pincodes: ['764036', '764039'],
      },
      contact: {
        primaryContactName: 'Priya Behera',
        primaryContactEmail: 'priya@koraputhillherbs.org',
        primaryContactPhone: '+91-94371-55019',
        officeAddress: 'Main Road, Semiliguda, Koraput, Odisha 764036',
      },
      operationalCapacityNotes: 'Aggregation capacity: 800 MT/season across Tamarind and Wild Ginger.',
    },
    registeringUser
  );

  assert(newOrg.id.startsWith('ECO-ORG-'), 'New organisation assigned unique ECO-ORG ID');
  assert(newOrg.code === 'TEST-FPO-KORAPUT-01', 'Organisation code preserved in uppercase');
  assert(newOrg.verificationStatus === 'PENDING_VERIFICATION', 'Default status is PENDING_VERIFICATION');
  assert(newOrg.serviceArea.districts.includes('Koraput'), 'Service area includes Koraput');

  // Verify registering user is automatically assigned as initial ORG_ADMIN
  const creatorContext: AuthUserContext = {
    userId: registeringUser.userId,
    username: registeringUser.username,
    role: 'ORG_ADMIN',
    organisationId: newOrg.id,
    fullName: registeringUser.fullName,
  };

  const members = await getOrganisationMembers(newOrg.id, creatorContext);
  assert(members.length === 1, 'Initial member automatically created');
  assert(members[0].role === 'ORG_ADMIN', 'Registering user assigned ORG_ADMIN role');
  assert(members[0].email === 'priya@koraputhillherbs.org', 'Member email matches contact email');

  // Duplicate code prevention
  let duplicateCodeBlocked = false;
  try {
    await registerEcosystemOrganisation(
      {
        code: 'TEST-FPO-KORAPUT-01', // duplicate code!
        legalName: 'Duplicate Company',
        tradeName: 'Duplicate Trade',
        category: 'SUPPLIER',
        serviceArea: { state: 'Odisha', districts: ['Mayurbhanj'], blocks: [], villageClusters: [], pincodes: [] },
        contact: { primaryContactName: 'Test', primaryContactEmail: 'test@dup.com', primaryContactPhone: '123', officeAddress: 'Test' },
      },
      registeringUser
    );
  } catch (err: any) {
    duplicateCodeBlocked = err.message.includes('DUPLICATE_ORGANISATION_CODE');
  }
  assert(duplicateCodeBlocked, 'Duplicate organisation code is strictly blocked (DUPLICATE_ORGANISATION_CODE)');

  // -------------------------------------------------------------------
  // 3. Document Management & Compliance Dossier Auditing
  // -------------------------------------------------------------------
  console.log('\n--- 3. Document Management & Compliance Dossier ---');

  // Submit Incorporation Certificate
  const doc1 = await submitOrganisationDocument(
    newOrg.id,
    {
      documentType: 'REGISTRATION_CERTIFICATE',
      documentNumber: 'U01110OR2024PTC049102',
      fileUrl: '/docs/compliance/koraput-mca-incorporation.pdf',
    },
    creatorContext
  );

  assert(doc1.id.startsWith('DOC-ECO-'), 'Document receives unique DOC-ECO identifier');
  assert(doc1.verificationStatus === 'SUBMITTED', 'Initial document status is SUBMITTED');
  assert(doc1.documentType === 'REGISTRATION_CERTIFICATE', 'Document type is REGISTRATION_CERTIFICATE');

  // Review & Verify Document by Platform Auditor
  const auditorContext: AuthUserContext = {
    userId: 'USR-AUDITOR-01',
    username: 'auditor.jena',
    role: 'SUPERVISOR_ADMIN',
    fullName: 'Dr. Ramesh Jena (Deputy Director ST/SC Dev Dept)',
    isPlatformAdmin: true,
  };

  const verifiedDoc = await reviewOrganisationDocument(
    doc1.id,
    'VERIFIED',
    auditorContext,
    'MCA portal verification confirmed authentic incorporation certificate.'
  );

  assert(verifiedDoc.verificationStatus === 'VERIFIED', 'Document status updated to VERIFIED');
  assert(verifiedDoc.verifiedBy === 'Dr. Ramesh Jena (Deputy Director ST/SC Dev Dept)', 'Auditor recorded on document');
  assert(verifiedDoc.verificationNotes !== null, 'Auditor notes recorded');

  // -------------------------------------------------------------------
  // 4. Auditable Verification Workflows & Anti-Fabrication Invariants
  // -------------------------------------------------------------------
  console.log('\n--- 4. Auditable Verification & Anti-Fabrication Guards ---');

  // Attempting to approve an organisation without any verified documents must be blocked!
  const unverifiedOrg = await registerEcosystemOrganisation(
    {
      code: 'UNVERIFIED-SUPP-01',
      legalName: 'Unverified Shell Supplier',
      tradeName: 'Shell Supplier',
      category: 'SUPPLIER',
      serviceArea: { state: 'Odisha', districts: ['Mayurbhanj'], blocks: [], villageClusters: [], pincodes: [] },
      contact: { primaryContactName: 'Test', primaryContactEmail: 'shell@supplier.com', primaryContactPhone: '123', officeAddress: 'Test' },
    },
    registeringUser
  );

  let fabricatedBadgeBlocked = false;
  try {
    await reviewEcosystemOrganisation(
      unverifiedOrg.id,
      'APPROVE',
      auditorContext,
      'Attempting to approve without compliance documents.'
    );
  } catch (err: any) {
    fabricatedBadgeBlocked = err.message.includes('FABRICATED_BADGE_PROHIBITED');
  }
  assert(fabricatedBadgeBlocked, 'Attempting to verify an organisation without compliance documents is strictly blocked (FABRICATED_BADGE_PROHIBITED)');

  // Now verify newOrg which HAS verifiedDoc1
  const approvedOrg = await reviewEcosystemOrganisation(
    newOrg.id,
    'APPROVE',
    auditorContext,
    'Incorporation certificate and tribal farmer membership register verified.'
  );

  assert(approvedOrg.verificationStatus === 'VERIFIED_ACTIVE', 'Organisation transitioned to VERIFIED_ACTIVE');
  assert(approvedOrg.verifiedBy === 'Dr. Ramesh Jena (Deputy Director ST/SC Dev Dept)', 'Auditor recorded on verified org');
  assert(approvedOrg.verifiedAt !== null, 'Verification timestamp recorded');

  // State machine checks
  assert(canTransitionOrgStatus('PENDING_VERIFICATION', 'UNDER_REVIEW') === true, 'PENDING -> UNDER_REVIEW allowed');
  assert(canTransitionOrgStatus('UNDER_REVIEW', 'VERIFIED_ACTIVE') === true, 'UNDER_REVIEW -> VERIFIED_ACTIVE allowed');
  assert(canTransitionOrgStatus('VERIFIED_ACTIVE', 'SUSPENDED') === true, 'VERIFIED_ACTIVE -> SUSPENDED allowed');
  assert(canTransitionOrgStatus('DRAFT_REGISTRATION', 'VERIFIED_ACTIVE') === false, 'DRAFT -> VERIFIED_ACTIVE directly is blocked');

  // -------------------------------------------------------------------
  // 5. Membership Management & Role Assignments
  // -------------------------------------------------------------------
  console.log('\n--- 5. Membership Management & Role Assignments ---');

  const newMember = await addOrganisationMember(
    newOrg.id,
    {
      fullName: 'Bikram Khora',
      email: 'bikram.khora@koraputhillherbs.org',
      phone: '+91-94371-99201',
      role: 'OPERATIONS_OFFICER',
    },
    creatorContext
  );

  assert(newMember.fullName === 'Bikram Khora', 'Member added successfully');
  assert(newMember.role === 'OPERATIONS_OFFICER', 'Assigned role is OPERATIONS_OFFICER');
  assert(newMember.status === 'ACTIVE', 'Member status is ACTIVE');

  // Role update: Promote to FINANCIAL_OFFICER
  const updatedMember = await updateOrganisationMemberRole(
    newOrg.id,
    newMember.id,
    'FINANCIAL_OFFICER',
    creatorContext
  );

  assert(updatedMember.role === 'FINANCIAL_OFFICER', 'Member role updated to FINANCIAL_OFFICER');

  // Duplicate email detection within the same organisation
  let duplicateMemberBlocked = false;
  try {
    await addOrganisationMember(
      newOrg.id,
      {
        fullName: 'Bikram Duplicate',
        email: 'bikram.khora@koraputhillherbs.org', // Duplicate email!
        role: 'FIELD_AGENT',
      },
      creatorContext
    );
  } catch (err: any) {
    duplicateMemberBlocked = err.message.includes('DUPLICATE_MEMBER_EMAIL');
  }
  assert(duplicateMemberBlocked, 'Adding member with duplicate email in same organisation is blocked (DUPLICATE_MEMBER_EMAIL)');

  // -------------------------------------------------------------------
  // 6. Server-Side Multi-Tenant Organisation Isolation
  // -------------------------------------------------------------------
  console.log('\n--- 6. Server-Side Multi-Tenant Organisation Isolation ---');

  // Context for an external tenant: Dabur Corporate Buyer
  const externalTenantUser: AuthUserContext = {
    userId: 'USR-DABUR-01',
    username: 'vikram.joshi',
    role: 'ORG_ADMIN',
    organisationId: 'ECO-ORG-DABURBUYER', // Belongs to Dabur!
    fullName: 'Vikram Joshi (Dabur India)',
    isPlatformAdmin: false,
  };

  // INVARIANT: An organisation cannot access another organisation's private records
  const isolationCheck = checkOrganisationIsolation(externalTenantUser, newOrg.id);
  assert(isolationCheck.allowed === false, 'Tenant isolation check forbids cross-organisation access');
  assert(
    isolationCheck.reason?.includes('CROSS_ORGANISATION_ACCESS_BLOCKED') ?? false,
    'Isolation check flags CROSS_ORGANISATION_ACCESS_BLOCKED'
  );

  // Attempt to access private documents of newOrg as Dabur user (Must throw 403)
  let crossOrgDocBlocked = false;
  try {
    await submitOrganisationDocument(
      newOrg.id,
      {
        documentType: 'PAN_CARD',
        documentNumber: 'ILLEGAL-PAN',
        fileUrl: '/docs/illegal.pdf',
      },
      externalTenantUser // Foreign tenant!
    );
  } catch (err: any) {
    crossOrgDocBlocked = err.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED');
  }
  assert(crossOrgDocBlocked, 'Mutating another organisation private documents is strictly blocked (CROSS_ORGANISATION_ACCESS_BLOCKED)');

  // Attempt to view private members of newOrg as Dabur user (Must throw 403)
  let crossOrgMemberBlocked = false;
  try {
    await getOrganisationMembers(newOrg.id, externalTenantUser);
  } catch (err: any) {
    crossOrgMemberBlocked = err.message.includes('CROSS_ORGANISATION_ACCESS_BLOCKED');
  }
  assert(crossOrgMemberBlocked, 'Viewing another organisation private members is strictly blocked (CROSS_ORGANISATION_ACCESS_BLOCKED)');

  // Platform admin can access across tenants for audit oversight
  const adminIsolation = checkOrganisationIsolation(auditorContext, newOrg.id);
  assert(adminIsolation.allowed === true, 'Platform admin / regulator has statewide cross-tenant audit clearance');

  // -------------------------------------------------------------------
  // 7. Service-Area Jurisdiction & Operational Topography
  // -------------------------------------------------------------------
  console.log('\n--- 7. Service Area Jurisdiction & Topography ---');

  const tdccolOrg = (await getEcosystemOrganisationById('ECO-ORG-TDCCOL'))?.organisation;
  assert(tdccolOrg !== undefined, 'TDCCOL organisation retrieved');
  assert(tdccolOrg?.serviceArea.state === 'Odisha', 'State is Odisha');
  assert((tdccolOrg?.serviceArea.districts.length ?? 0) >= 3, 'Covers at least 3 tribal districts');
  assert(Boolean(tdccolOrg?.serviceArea.districts.includes('Mayurbhanj')), 'Covers Mayurbhanj');
  assert(Boolean(tdccolOrg?.serviceArea.districts.includes('Koraput')), 'Covers Koraput');

  // -------------------------------------------------------------------
  // 8. Immutable Organisation Activity History
  // -------------------------------------------------------------------
  console.log('\n--- 8. Immutable Organisation Activity History ---');

  const activityLogs = await getOrganisationActivityLogs(newOrg.id, creatorContext);
  assert(activityLogs.length >= 4, 'Append-only activity logs recorded multiple tenant events');

  const actions = activityLogs.map((l) => l.action);
  assert(actions.includes('ORGANISATION_REGISTERED'), 'Activity log includes ORGANISATION_REGISTERED');
  assert(actions.includes('DOCUMENT_UPLOADED'), 'Activity log includes DOCUMENT_UPLOADED');
  assert(actions.includes('VERIFICATION_APPROVED'), 'Activity log includes VERIFICATION_APPROVED');
  assert(actions.includes('MEMBER_ADDED'), 'Activity log includes MEMBER_ADDED');

  const allHaveActor = activityLogs.every((l) => Boolean(l.actor));
  assert(allHaveActor, 'Every activity log contains identified actor identity');

  // -------------------------------------------------------------------
  // 9. REST API Route Integration Tests (Live Dev Server)
  // -------------------------------------------------------------------
  console.log('\n--- 9. REST API Endpoints Integration Tests ---');

  const baseUrl = 'http://localhost:3000';

  // GET /api/ecosystem/organisations
  const resOrgs = await fetch(`${baseUrl}/api/ecosystem/organisations`);
  assert(resOrgs.status === 200, 'GET /api/ecosystem/organisations returns 200');
  const dataOrgs = await resOrgs.json();
  assert(Array.isArray(dataOrgs.organisations), 'Organisations endpoint returns list');
  assert(dataOrgs.count >= 9, 'Directory lists participating organisations');

  // GET /api/ecosystem/organisations?category=SHG_FEDERATION
  const resShg = await fetch(`${baseUrl}/api/ecosystem/organisations?category=SHG_FEDERATION`);
  assert(resShg.status === 200, 'GET /api/ecosystem/organisations?category=SHG_FEDERATION returns 200');
  const dataShg = await resShg.json();
  assert(dataShg.organisations.every((o: any) => o.category === 'SHG_FEDERATION'), 'Filter by category works correctly');

  // GET /api/ecosystem/documents?orgId=... (Authorized)
  const resDocs = await fetch(`${baseUrl}/api/ecosystem/documents?orgId=ECO-ORG-TDCCOL`, {
    headers: {
      'x-user-role': 'SUPERVISOR_ADMIN',
      'x-user-org-id': 'ECO-ORG-TDCCOL',
      'x-user-username': 'patnaik.dpo',
    },
  });
  assert(resDocs.status === 200, 'GET /api/ecosystem/documents for authorized user returns 200');

  // GET /api/ecosystem/documents?orgId=... (Cross-org access forbidden 403)
  const resCrossDocs = await fetch(`${baseUrl}/api/ecosystem/documents?orgId=ECO-ORG-TDCCOL`, {
    headers: {
      'x-user-role': 'ORG_ADMIN',
      'x-user-org-id': 'ECO-ORG-DABURBUYER', // Foreign tenant!
      'x-user-username': 'vikram.joshi',
    },
  });
  assert(resCrossDocs.status === 403, 'Cross-organisation document access blocked with HTTP 403 Forbidden');

  // GET /api/ecosystem/members?orgId=... (Authorized)
  const resMembers = await fetch(`${baseUrl}/api/ecosystem/members?orgId=ECO-ORG-TDCCOL`, {
    headers: {
      'x-user-role': 'SUPERVISOR_ADMIN',
      'x-user-org-id': 'ECO-ORG-TDCCOL',
      'x-user-username': 'patnaik.dpo',
    },
  });
  assert(resMembers.status === 200, 'GET /api/ecosystem/members for authorized user returns 200');

  // GET /api/ecosystem/members?orgId=... (Cross-org access forbidden 403)
  const resCrossMembers = await fetch(`${baseUrl}/api/ecosystem/members?orgId=ECO-ORG-TDCCOL`, {
    headers: {
      'x-user-role': 'ORG_ADMIN',
      'x-user-org-id': 'ECO-ORG-DABURBUYER', // Foreign tenant!
      'x-user-username': 'vikram.joshi',
    },
  });
  assert(resCrossMembers.status === 403, 'Cross-organisation member access blocked with HTTP 403 Forbidden');

  // GET /api/ecosystem/activity?orgId=... (Authorized)
  const resActivity = await fetch(`${baseUrl}/api/ecosystem/activity?orgId=ECO-ORG-TDCCOL`, {
    headers: {
      'x-user-role': 'SUPERVISOR_ADMIN',
      'x-user-org-id': 'ECO-ORG-TDCCOL',
      'x-user-username': 'patnaik.dpo',
    },
  });
  assert(resActivity.status === 200, 'GET /api/ecosystem/activity returns 200');

  console.log('\n======================================================');
  console.log(`  Ecosystem & Organisation Test Results: ${passedChecks}/${totalChecks} Passed`);
  console.log('======================================================\n');
  console.log('SUCCESS: All 9 organisation categories, tenant isolation, and verification audits passed.\n');
}

runEcosystemTestSuite().catch((err) => {
  console.error('\nFAILURE in Ecosystem Organisation test suite:', err);
  process.exit(1);
});
