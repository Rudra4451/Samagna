'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import {
  Building2,
  Users,
  ShieldCheck,
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Lock,
  Layers,
  ChevronRight,
  ShieldAlert,
  X,
  UserPlus,
  Upload,
} from 'lucide-react';
import {
  EcosystemOrganisation,
  EcosystemOrgCategory,
  EcosystemVerificationStatus,
  OrgMemberRole,
  OrganisationDocument,
  OrganisationMember,
  OrganisationActivityLog,
} from '@/lib/ecosystem';

const CATEGORY_LABELS: Record<EcosystemOrgCategory, string> = {
  INSTITUTIONAL_ORGANISATION: 'Institutional Body',
  PRODUCER_ORGANISATION: 'Producer Org (FPO)',
  SHG_FEDERATION: 'SHG Federation',
  SUPPLIER: 'Produce Supplier',
  BULK_BUYER: 'Bulk Commercial Buyer',
  MANUFACTURER: 'Ayurvedic / FMCG Mfg',
  PROCESSING_FACILITY: 'Processing Unit',
  LOGISTICS_PROVIDER: 'Logistics Fleet',
  RETAIL_PARTNER: 'Retail Partner',
};

export default function EcosystemOperationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    organisationId?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Directory & selected tenant data
  const [organisations, setOrganisations] = useState<EcosystemOrganisation[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<EcosystemOrganisation | null>(null);
  const [orgDocs, setOrgDocs] = useState<OrganisationDocument[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganisationMember[]>([]);
  const [orgLogs, setOrgLogs] = useState<OrganisationActivityLog[]>([]);

  // Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & form state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // New Org Form
  const [regCode, setRegCode] = useState('');
  const [regLegalName, setRegLegalName] = useState('');
  const [regTradeName, setRegTradeName] = useState('');
  const [regCategory, setRegCategory] = useState<EcosystemOrgCategory>('PRODUCER_ORGANISATION');
  const [regNumber, setRegNumber] = useState('');
  const [regPan, setRegPan] = useState('');
  const [regDistrict, setRegDistrict] = useState('Mayurbhanj');
  const [regContactName, setRegContactName] = useState('');
  const [regContactEmail, setRegContactEmail] = useState('');
  const [regContactPhone, setRegContactPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // New Member Form
  const [newMemName, setNewMemName] = useState('');
  const [newMemEmail, setNewMemEmail] = useState('');
  const [newMemPhone, setNewMemPhone] = useState('');
  const [newMemRole, setNewMemRole] = useState<OrgMemberRole>('OPERATIONS_OFFICER');

  // New Doc Form
  const [newDocType, setNewDocType] = useState('REGISTRATION_CERTIFICATE');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadOrganisations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/ecosystem/organisations?${params.toString()}`);
      const data = await res.json();
      if (data.organisations) {
        setOrganisations(data.organisations);
      }
    } catch (err: any) {
      console.error('Failed to load organisations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (orgId: string) => {
    try {
      const headers: Record<string, string> = {
        'x-user-role': currentUser?.role || 'SUPERVISOR_ADMIN',
        'x-user-org-id': currentUser?.organisationId || orgId,
        'x-user-username': currentUser?.username || 'admin',
      };

      const res = await fetch(`/api/ecosystem/organisations?id=${orgId}`, { headers });
      const data = await res.json();
      if (data.organisation) {
        setSelectedOrg(data.organisation);
        setOrgDocs(data.documents || []);
        setOrgMembers(data.members || []);
        setOrgLogs(data.activityLogs || []);
      }
    } catch (err: any) {
      console.error('Failed to load private org profile:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/ecosystem');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Auth verification error:', err))
      .finally(() => {
        if (isMounted) loadOrganisations();
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    loadOrganisations();
  }, [selectedCategory, selectedStatus]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/ecosystem/organisations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'ORG_ADMIN',
          'x-user-username': currentUser?.username || 'applicant',
        },
        body: JSON.stringify({
          code: regCode,
          legalName: regLegalName,
          tradeName: regTradeName,
          category: regCategory,
          registrationNumber: regNumber,
          panNumber: regPan,
          serviceArea: {
            state: 'Odisha',
            districts: [regDistrict],
            blocks: ['Karanjia'],
            villageClusters: ['Badagaon'],
            pincodes: ['757037'],
          },
          contact: {
            primaryContactName: regContactName,
            primaryContactEmail: regContactEmail,
            primaryContactPhone: regContactPhone,
            officeAddress: regAddress,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register organisation');

      setActionSuccess(`Organisation ${data.tradeName} (${data.code}) successfully registered! Pending compliance verification.`);
      setShowRegisterModal(false);
      loadOrganisations();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/ecosystem/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'SUPERVISOR_ADMIN',
          'x-user-org-id': currentUser?.organisationId || selectedOrg.id,
          'x-user-username': currentUser?.username || 'admin',
        },
        body: JSON.stringify({
          orgId: selectedOrg.id,
          fullName: newMemName,
          email: newMemEmail,
          phone: newMemPhone,
          role: newMemRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setActionSuccess(`Member ${data.fullName} assigned role ${data.role} under ${selectedOrg.tradeName}.`);
      setShowMemberModal(false);
      loadOrgDetails(selectedOrg.id);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/ecosystem/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'SUPERVISOR_ADMIN',
          'x-user-org-id': currentUser?.organisationId || selectedOrg.id,
          'x-user-username': currentUser?.username || 'officer',
        },
        body: JSON.stringify({
          orgId: selectedOrg.id,
          documentType: newDocType,
          documentNumber: newDocNumber,
          fileUrl: newDocUrl || `/docs/compliance/${newDocNumber.toLowerCase()}.pdf`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload document');

      setActionSuccess(`Document ${data.documentType} (${data.documentNumber}) submitted for audit review.`);
      setShowDocModal(false);
      loadOrgDetails(selectedOrg.id);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[#FDFBF7] text-[#1A2E1A] p-4 sm:p-6 lg:p-8">
        {/* Header Masthead */}
        <div className="max-w-7xl mx-auto mb-6 bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-[#88D49E]" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#1B4332]">
                    Ecosystem & Organisation Management
                  </h1>
                  <p className="text-xs text-[#526D52]">
                    Multi-tenant federation registry, verification audit dossiers & role assignments across 9 value-chain categories
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audited Verification Only
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB]">
                <Lock className="w-3.5 h-3.5" />
                Server-Side Tenant Isolation
              </span>
              <button
                onClick={loadOrganisations}
                className="p-2 text-[#526D52] hover:text-[#1B4332] hover:bg-[#F4F1EA] rounded-lg transition-colors"
                title="Refresh Organisation Registry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className="mt-4 p-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg text-xs text-[#2E7D32] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="mt-4 p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-lg text-xs text-[#C62828] flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {actionError}
            </div>
          )}
        </div>

        {/* Filter Toolbar & Actions */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-[#526D52] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search organisations by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrganisations()}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E5E0D8] rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-2 border border-[#E5E0D8] rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
            >
              <option value="ALL">All 9 Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                <option key={cat} value={cat}>
                  {label}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs px-3 py-2 border border-[#E5E0D8] rounded-lg bg-white focus:outline-none focus:border-[#1B4332]"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED_ACTIVE">Verified Active</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1B4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2D5A27] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Register New Organisation
          </button>
        </div>

        {/* Organisation Directory Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {organisations.map((org) => {
            const isSelected = selectedOrg?.id === org.id;
            return (
              <div
                key={org.id}
                onClick={() => loadOrgDetails(org.id)}
                className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative ${
                  isSelected ? 'border-[#1B4332] ring-2 ring-[#1B4332]/20' : 'border-[#E5E0D8]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4F1EA] text-[#334D33] font-mono">
                    {org.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      org.verificationStatus === 'VERIFIED_ACTIVE'
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : org.verificationStatus === 'UNDER_REVIEW'
                        ? 'bg-[#FFF8E1] text-[#F57F17]'
                        : org.verificationStatus === 'SUSPENDED'
                        ? 'bg-[#FFEBEE] text-[#C62828]'
                        : 'bg-[#E3F2FD] text-[#1565C0]'
                    }`}
                  >
                    {org.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-[#1B4332] line-clamp-1">{org.tradeName}</h3>
                <p className="text-xs text-[#526D52] mb-3 line-clamp-1">{org.legalName}</p>

                <div className="text-xs text-[#1B4332] font-semibold bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E5E0D8] mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#526D52]">Category:</span>
                    <span>{CATEGORY_LABELS[org.category]}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#526D52]">Jurisdiction:</span>
                    <span>{org.serviceArea.districts.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#526D52] pt-2 border-t border-[#E5E0D8]">
                  <span>{org.contact.primaryContactName}</span>
                  <div className="flex items-center gap-1 font-semibold text-[#1B4332]">
                    Manage Profile <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Organisation Details Drawer */}
        {selectedOrg && (
          <div className="max-w-7xl mx-auto bg-white border border-[#E5E0D8] rounded-xl p-6 shadow-sm mb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8] mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#F4F1EA] text-[#334D33]">
                    {selectedOrg.code}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedOrg.verificationStatus === 'VERIFIED_ACTIVE'
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : 'bg-[#FFF8E1] text-[#F57F17]'
                    }`}
                  >
                    {selectedOrg.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#1B4332] mt-1">{selectedOrg.tradeName}</h2>
                <p className="text-xs text-[#526D52]">{selectedOrg.legalName}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDocModal(true)}
                  className="px-3 py-1.5 border border-[#E5E0D8] rounded-lg text-xs font-semibold text-[#1B4332] hover:bg-[#FAF8F5] inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload Document
                </button>
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="px-3 py-1.5 bg-[#1B4332] text-white rounded-lg text-xs font-semibold hover:bg-[#2D5A27] inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Member
                </button>
              </div>
            </div>

            {/* Profile & Service Area Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-xs">
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8]">
                <h4 className="font-bold text-[#1B4332] mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#526D52]" /> Statutory Registrations
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[#526D52]">Registration #:</span>
                    <div className="font-mono font-medium">{selectedOrg.registrationNumber || 'Pending'}</div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">PAN:</span>
                    <div className="font-mono font-medium">{selectedOrg.panNumber || 'Pending'}</div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">GSTIN:</span>
                    <div className="font-mono font-medium">{selectedOrg.gstin || 'Exempt / Not Applicable'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8]">
                <h4 className="font-bold text-[#1B4332] mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#526D52]" /> Service Area & Jurisdiction
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[#526D52]">State & Districts:</span>
                    <div className="font-medium">
                      {selectedOrg.serviceArea.state} ({selectedOrg.serviceArea.districts.join(', ')})
                    </div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">Operational Blocks:</span>
                    <div className="font-medium">{selectedOrg.serviceArea.blocks.join(', ')}</div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">Primary Hubs:</span>
                    <div className="font-medium">
                      {selectedOrg.serviceArea.operationalHubs?.join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D8]">
                <h4 className="font-bold text-[#1B4332] mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#526D52]" /> Human Verification Sign-Off
                </h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[#526D52]">Verified By Auditor:</span>
                    <div className="font-medium">{selectedOrg.verifiedBy || 'Pending Official Audit'}</div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">Audit Date:</span>
                    <div className="font-medium">
                      {selectedOrg.verifiedAt ? new Date(selectedOrg.verifiedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#526D52]">Auditor Notes:</span>
                    <div className="text-[11px] text-[#526D52] italic">
                      {selectedOrg.verificationNotes || 'No notes recorded.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Documents Dossier */}
            <div className="mb-8">
              <h3 className="text-base font-serif font-bold text-[#1B4332] mb-3">
                Compliance & Verification Documents ({orgDocs.length})
              </h3>
              <div className="overflow-x-auto border border-[#E5E0D8] rounded-xl">
                <table className="w-full text-left text-xs text-[#1A2E1A]">
                  <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Document Type</th>
                      <th scope="col" className="px-4 py-2.5">Document Identifier</th>
                      <th scope="col" className="px-4 py-2.5">Uploaded By</th>
                      <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                      <th scope="col" className="px-4 py-2.5">Auditor</th>
                      <th scope="col" className="px-4 py-2.5">Verification Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {orgDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-[#526D52]">
                          No compliance documents uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      orgDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[#FAF8F5]">
                          <td className="px-4 py-2.5 font-semibold text-[#1B4332]">
                            {doc.documentType.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-2.5 font-mono">{doc.documentNumber}</td>
                          <td className="px-4 py-2.5 text-[#526D52]">{doc.uploadedBy}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                doc.verificationStatus === 'VERIFIED'
                                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                  : doc.verificationStatus === 'REJECTED'
                                  ? 'bg-[#FFEBEE] text-[#C62828]'
                                  : 'bg-[#FFF8E1] text-[#F57F17]'
                              }`}
                            >
                              {doc.verificationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#526D52]">{doc.verifiedBy || 'Pending'}</td>
                          <td className="px-4 py-2.5 text-[#526D52]">{doc.verificationNotes || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Member Directory & Role Assignments */}
            <div className="mb-8">
              <h3 className="text-base font-serif font-bold text-[#1B4332] mb-3">
                Authorised Members & Roles ({orgMembers.length})
              </h3>
              <div className="overflow-x-auto border border-[#E5E0D8] rounded-xl">
                <table className="w-full text-left text-xs text-[#1A2E1A]">
                  <thead className="bg-[#FAF8F5] text-[#526D52] uppercase font-semibold border-b border-[#E5E0D8]">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Full Name</th>
                      <th scope="col" className="px-4 py-2.5">Email Address</th>
                      <th scope="col" className="px-4 py-2.5">Assigned Role</th>
                      <th scope="col" className="px-4 py-2.5 text-center">Status</th>
                      <th scope="col" className="px-4 py-2.5">Assigned By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8]">
                    {orgMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-[#526D52]">
                          No members registered.
                        </td>
                      </tr>
                    ) : (
                      orgMembers.map((mem) => (
                        <tr key={mem.id} className="hover:bg-[#FAF8F5]">
                          <td className="px-4 py-2.5 font-semibold text-[#1B4332]">{mem.fullName}</td>
                          <td className="px-4 py-2.5 font-mono">{mem.email}</td>
                          <td className="px-4 py-2.5 font-semibold text-[#1565C0]">{mem.role}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                              {mem.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#526D52]">{mem.assignedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Organisation Activity Log */}
            <div>
              <h3 className="text-base font-serif font-bold text-[#1B4332] mb-3">
                Immutable Tenant Activity History
              </h3>
              <div className="space-y-2 border border-[#E5E0D8] rounded-xl p-4 bg-[#FAF8F5] max-h-60 overflow-y-auto">
                {orgLogs.length === 0 ? (
                  <div className="text-center text-xs text-[#526D52] py-4">No activity records.</div>
                ) : (
                  orgLogs.map((log) => (
                    <div key={log.id} className="text-xs p-2.5 bg-white rounded-lg border border-[#E5E0D8]">
                      <div className="flex items-center justify-between text-[11px] text-[#526D52] mb-1">
                        <span className="font-semibold text-[#1B4332]">{log.action}</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-[#1A2E1A]">{log.details}</div>
                      <div className="text-[10px] text-[#526D52] mt-0.5">Actor: {log.actor}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Register New Organisation */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl border border-[#E5E0D8] max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-serif font-bold text-[#1B4332] mb-1">Register New Ecosystem Organisation</h3>
              <p className="text-xs text-[#526D52] mb-4">
                Onboard a participating value-chain organisation across the 9 supported categories.
              </p>

              <form onSubmit={handleRegister} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Unique Code (Uppercase)</label>
                    <input
                      type="text"
                      value={regCode}
                      onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                      required
                      placeholder="e.g. MAYUR-BIO-01"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Category</label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as EcosystemOrgCategory)}
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
                        <option key={cat} value={cat}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Trade / Display Name</label>
                  <input
                    type="text"
                    value={regTradeName}
                    onChange={(e) => setRegTradeName(e.target.value)}
                    required
                    placeholder="e.g. Similipal Bio-Botanicals"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Legal Registered Entity Name</label>
                  <input
                    type="text"
                    value={regLegalName}
                    onChange={(e) => setRegLegalName(e.target.value)}
                    required
                    placeholder="e.g. Similipal Bio-Botanicals Producer Company Limited"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Registration / Incorporation #</label>
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. U01110OR2023PTC..."
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={regPan}
                      onChange={(e) => setRegPan(e.target.value.toUpperCase())}
                      placeholder="e.g. AABCS9912K"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={regContactName}
                      onChange={(e) => setRegContactName(e.target.value)}
                      required
                      placeholder="Name"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      value={regContactEmail}
                      onChange={(e) => setRegContactEmail(e.target.value)}
                      required
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#526D52] font-semibold mb-1">Phone</label>
                    <input
                      type="text"
                      value={regContactPhone}
                      onChange={(e) => setRegContactPhone(e.target.value)}
                      required
                      placeholder="Phone"
                      className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Office Address</label>
                  <textarea
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    required
                    rows={2}
                    placeholder="Registered address in Odisha..."
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-[#526D52] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D5A27]"
                  >
                    Submit Registration
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Member */}
        {showMemberModal && selectedOrg && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E5E0D8]">
              <h3 className="text-lg font-serif font-bold text-[#1B4332] mb-1">Add Organisation Member</h3>
              <p className="text-xs text-[#526D52] mb-4">
                Assign an authorised user and role to {selectedOrg.tradeName}.
              </p>

              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    required
                    placeholder="e.g. Ramesh Chandra Majhi"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newMemEmail}
                    onChange={(e) => setNewMemEmail(e.target.value)}
                    required
                    placeholder="e.g. ramesh@similipalfpo.org"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Role Assignment</label>
                  <select
                    value={newMemRole}
                    onChange={(e) => setNewMemRole(e.target.value as OrgMemberRole)}
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  >
                    <option value="ORG_ADMIN">Organisation Administrator</option>
                    <option value="OPERATIONS_OFFICER">Operations Officer</option>
                    <option value="FINANCIAL_OFFICER">Financial Officer</option>
                    <option value="FIELD_AGENT">Field Agent</option>
                    <option value="READ_ONLY">Read-Only Auditor</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-[#526D52] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D5A27]"
                  >
                    Assign Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload Document */}
        {showDocModal && selectedOrg && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#E5E0D8]">
              <h3 className="text-lg font-serif font-bold text-[#1B4332] mb-1">Upload Compliance Document</h3>
              <p className="text-xs text-[#526D52] mb-4">
                Submit statutory licenses and certificates for {selectedOrg.tradeName}.
              </p>

              <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Document Category</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  >
                    <option value="REGISTRATION_CERTIFICATE">Certificate of Incorporation / Registration</option>
                    <option value="PAN_CARD">Permanent Account Number (PAN) Card</option>
                    <option value="GSTIN_CERTIFICATE">GST Registration Certificate</option>
                    <option value="FSSAI_LICENSE">FSSAI Food Safety License</option>
                    <option value="MANDI_LICENSE">Mandi Flora Trading License</option>
                    <option value="POLLUTION_CLEARANCE">Pollution Control Board Clearance</option>
                    <option value="FOREST_RIGHTS_RECOGNITION">Forest Rights Act (FRA) Recognition</option>
                    <option value="STATUTORY_GOVT_ORDER">Statutory Government Executive Order</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Document / Certificate Number</label>
                  <input
                    type="text"
                    value={newDocNumber}
                    onChange={(e) => setNewDocNumber(e.target.value)}
                    required
                    placeholder="e.g. REG-OD-2023-889"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div>
                  <label className="block text-[#526D52] font-semibold mb-1">Document Archive Reference URL</label>
                  <input
                    type="text"
                    value={newDocUrl}
                    onChange={(e) => setNewDocUrl(e.target.value)}
                    placeholder="/docs/compliance/certificate.pdf"
                    className="w-full px-3 py-2 border border-[#E5E0D8] rounded-lg focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E0D8]">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-4 py-2 border border-[#E5E0D8] rounded-lg text-[#526D52] hover:bg-[#FAF8F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded-lg font-semibold hover:bg-[#2D5A27]"
                  >
                    Upload Document
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

