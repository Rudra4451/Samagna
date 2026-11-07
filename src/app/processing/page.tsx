'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import {
  Factory,
  Layers,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowRight,
  Search,
  PlusCircle,
  Check,
  X,
  Scale,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  ProcessingFacility,
  ProcessingRequest,
  ProcessingJob,
} from '@/lib/processing';

type ProcessingTab = 'facilities' | 'requests' | 'jobs' | 'submit_request';

export default function ProcessingNetworkPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<ProcessingTab>('facilities');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [facilities, setFacilities] = useState<ProcessingFacility[]>([]);
  const [requests, setRequests] = useState<ProcessingRequest[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  // Capacity matching drawer/modal state
  const [activeMatchRequestId, setActiveMatchRequestId] = useState<string | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Form state
  const [requestForm, setRequestForm] = useState({
    requestingOrgId: 'BUS-DABUR-01',
    requestingOrgName: 'Dabur India Limited',
    inputProduceSlug: 'honey-wild',
    inputProduceName: 'Raw Forest Honey (Similipal Reserve)',
    inputQuantityKg: 200,
    requiredOutputName: 'Filtered Multifloral Table Honey (FSSAI Grade)',
    desiredQualitySpecs: 'Moisture < 18.0%, HMF < 20 mg/kg, zero artificial heat crystallization',
    expectedYieldPercent: 85,
    facilityRequirements: 'Must use 316L stainless steel food-grade filtration with cold wax separation.',
    preferredStartDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    preferredCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    deliveryRequirements: 'Dispatch in 15kg food-grade carboys to Sahibabad unit.',
  });

  const loadData = async () => {
    try {
      const [facRes, reqRes, jobRes] = await Promise.all([
        fetch('/api/processing/facilities'),
        fetch('/api/processing/requests'),
        fetch('/api/processing/jobs'),
      ]);

      if (facRes.ok) {
        const d = await facRes.json();
        if (d.success) setFacilities(d.facilities);
      }
      if (reqRes.ok) {
        const d = await reqRes.json();
        if (d.success) setRequests(d.requests);
      }
      if (jobRes.ok) {
        const d = await jobRes.json();
        if (d.success) setJobs(d.jobs);
      }
    } catch (err: any) {
      console.error('Failed to load processing data:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/processing');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          loadData().finally(() => setLoading(false));
        }
      })
      .catch((err) => {
        console.error('Auth verification error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleRunCapacityMatch = async (reqId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsMatchingLoading(true);
    setActiveMatchRequestId(reqId);

    try {
      const res = await fetch('/api/processing/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MATCH', requestId: reqId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to match capacity.');
        return;
      }
      setMatchingCandidates(data.candidates);
      setSuccessMsg('Facility candidate evaluation completed. Ready for manual operator review.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setIsMatchingLoading(false);
    }
  };

  const handleReviewDecision = async (reqId: string, decision: 'ACCEPT' | 'REJECT', facilityId?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/processing/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVIEW',
          requestId: reqId,
          decision,
          facilityId,
          notes: decision === 'ACCEPT' ? 'Manually accepted by processing coordinator.' : 'Declined by coordinator.',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to record decision.');
        return;
      }

      setSuccessMsg(`Request ${reqId} successfully ${decision.toLowerCase()}ed.`);
      setActiveMatchRequestId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/processing/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to submit processing request.');
        return;
      }

      setSuccessMsg(`Processing request ${data.request.requestNumber} submitted for capacity matching.`);
      setActiveTab('requests');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-ink">
        <p className="text-[13px] font-mono text-ink-muted">Loading processing network registry...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[1240px] mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Masthead Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-primary/10 text-primary border border-primary/20">
                <Factory className="w-3.5 h-3.5" /> VALUE-ADDITION NETWORK
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-surface-elevated text-ink-muted border border-border">
                PILOT COORDINATION: 0.0% FEE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-ink">
              Processing & Value-Addition Network
            </h1>
            <p className="text-[14px] text-ink-muted max-w-2xl mt-1 leading-relaxed">
              Coordinates agro-industrial processing facilities across Odisha forest clusters. Connects raw forest
              harvests with primary processing, deseeding, micro-filtration, and cryogenic pulverization units.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] font-mono text-ink-muted">Operator Clearance</p>
              <p className="text-[13px] font-medium text-ink">{currentUser.fullName} ({currentUser.role})</p>
            </div>
          </div>
        </div>

        {/* Global Policy Bar */}
        <div className="p-4 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-ink">
              <p className="font-medium">Strict Mass-Balance Reconciliation & Parent-Child Lineage</p>
              <p className="text-ink-muted text-[12px]">
                Input Lot Net Weight = Output Lot + By-Products + Processing Loss. Traceability maintained across all refined commodities.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              Capacity Engine: Manual Review Gate
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              QC: FSSAI / AYUSH
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[13px] flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-border overflow-x-auto space-x-2 pb-1">
          <button
            onClick={() => setActiveTab('facilities')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'facilities'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Factory className="w-4 h-4" />
            Processing Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Layers className="w-4 h-4" />
            Processing Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'jobs'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <FileText className="w-4 h-4" />
            Job Tracking & Traceability ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab('submit_request')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'submit_request'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Submit Processing Request
          </button>
        </div>

        {/* TAB 1: FACILITY DIRECTORY */}
        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Certified Forest Produce Processing Facilities</h2>
                <p className="text-[13px] text-ink-muted">
                  Industrial and semi-industrial processing plants equipped with specialized drying, deseeding, milling, and filtration lines.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {facilities.map((fac) => {
                const isVerified = fac.verificationStatus === 'VERIFIED_OPERATIONAL';
                return (
                  <div
                    key={fac.id}
                    className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {fac.code}
                          </span>
                          <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {fac.verificationStatus}
                          </span>
                        </div>
                        <h3 className="font-serif font-medium text-lg text-ink">{fac.name}</h3>
                        <p className="text-[12px] text-ink-muted">{fac.district}, {fac.state} • {fac.locationAddress}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] font-mono text-ink-muted uppercase">Daily Capacity</p>
                        <p className="text-xl font-mono font-bold text-primary">{fac.dailyCapacityKg} <span className="text-[12px] text-ink-muted font-sans">kg/day</span></p>
                      </div>
                    </div>

                    <div className="space-y-2 py-2 border-y border-border text-[12px]">
                      <div>
                        <p className="text-ink-muted font-medium mb-1">Processing Capabilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {fac.processingCapabilities.map((cap) => (
                            <span key={cap} className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-ink border border-border">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="pt-1">
                        <p className="text-ink-muted font-medium">Machinery & Tooling:</p>
                        <p className="text-ink italic">{fac.machineryEquipment}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[12px]">
                      <div>
                        <p className="text-ink-muted">Min Batch Size</p>
                        <p className="font-mono font-medium text-ink">{fac.minimumBatchKg} kg</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Operating Hours</p>
                        <p className="font-medium text-ink text-[11px]">{fac.operatingAvailability.replace(/_/g, ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-ink-muted">Indicative Charge</p>
                        <p className="font-mono font-medium text-ink">₹{fac.indicativeProcessingChargePerKg.toFixed(2)}/kg</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PROCESSING REQUESTS & CAPACITY MATCHING */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Commercial Processing Requests</h2>
                <p className="text-[13px] text-ink-muted">
                  Enterprise value-addition requirements. Uses capacity conflict checking without automated inventory locking.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('submit_request')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Submit New Request
              </Button>
            </div>

            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-bold text-primary">{req.requestNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        req.status === 'JOB_SCHEDULED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : req.status === 'ACCEPTED'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : req.status === 'REJECTED'
                          ? 'bg-danger/10 text-danger border border-danger/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        STATUS: {req.status}
                      </span>
                    </div>

                    <p className="text-[12px] font-mono text-ink-muted">
                      Preferred Dates: {new Date(req.preferredStartDate).toLocaleDateString()} – {new Date(req.preferredCompletionDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                    <div>
                      <p className="text-ink-muted text-[11px]">Requesting Enterprise</p>
                      <p className="font-medium text-ink">{req.requestingOrgName}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Input Harvest</p>
                      <p className="font-medium text-ink">{req.inputProduceName}</p>
                      <p className="font-mono text-[12px] text-ink-muted">{req.inputQuantityKg} kg net</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Required Output & Yield</p>
                      <p className="font-medium text-ink">{req.requiredOutputName}</p>
                      <p className="font-mono text-[12px] text-emerald-600 dark:text-emerald-400">
                        {req.expectedOutputQuantityKg} kg expected ({req.expectedYieldPercent}% yield)
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Designated Facility</p>
                      <p className="font-medium text-ink">{req.targetFacilityId || 'Open for Capacity Matching'}</p>
                    </div>
                  </div>

                  <div className="text-[12px] text-ink-muted bg-bg p-3 rounded border border-border space-y-1">
                    <p><span className="font-medium text-ink">Quality Specification:</span> {req.desiredQualitySpecs}</p>
                    {req.facilityRequirements && (
                      <p><span className="font-medium text-ink">Plant Conditions:</span> {req.facilityRequirements}</p>
                    )}
                    <p><span className="font-medium text-ink">Delivery Terms:</span> {req.deliveryRequirements}</p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] font-mono text-ink-muted flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                      Manual Confirmation Required (No Auto-Allocation)
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'SUBMITTED' || req.status === 'UNDER_FACILITY_REVIEW' ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRunCapacityMatch(req.id)}
                            disabled={isMatchingLoading && activeMatchRequestId === req.id}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            {isMatchingLoading && activeMatchRequestId === req.id ? 'Evaluating...' : 'Match Candidate Facilities'}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReviewDecision(req.id, 'REJECT')}
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Capacity Matching Comparison Drawer */}
                  {activeMatchRequestId === req.id && matchingCandidates.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-surface-elevated border border-primary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-medium text-ink text-[14px]">
                          Facility Capacity Matching Results (Ranked by Compatibility)
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveMatchRequestId(null)}
                        >
                          Close
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {matchingCandidates.map((cand, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-bg rounded border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-medium text-[13px] text-ink">{cand.facility.name}</span>
                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface border border-border text-primary font-medium">
                                  Score: {cand.compatibilityScore}/100
                                </span>
                              </div>
                              <p className="text-ink-muted text-[11px]">{cand.notes}</p>
                              <p className="font-mono text-ink-muted text-[11px]">
                                Daily Cap: {cand.facility.dailyCapacityKg} kg • Available: {cand.availableCapacityKg} kg • Est Cost: ₹{cand.indicativeCostInr.toLocaleString()}
                              </p>
                            </div>

                            <div className="shrink-0 flex items-center gap-2">
                              {cand.hasCapacityConflict && (
                                <span className="text-[11px] text-amber-600 font-mono flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Conflict
                                </span>
                              )}
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleReviewDecision(req.id, 'ACCEPT', cand.facility.id)}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Confirm & Accept
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROCESSING JOBS & MASS BALANCE */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Active Processing Jobs & Lot Traceability Lineage</h2>
                <p className="text-[13px] text-ink-muted">
                  Parent input lot to refined child lot tracking with mass-balance reconciliation and quality inspection dossiers.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-border rounded-xl bg-surface p-6 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-ink">{job.jobCode}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                          job.status === 'COMPLETED_VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-muted font-mono mt-0.5">
                        Facility: {job.facilityName} ({job.facilityId})
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-mono text-ink-muted uppercase">Coordination Fee (Pilot)</p>
                      <p className="text-xl font-mono font-bold text-primary">₹0.00 <span className="text-[11px] text-ink-muted font-sans">(0.0% fee)</span></p>
                    </div>
                  </div>

                  {/* Traceability Lineage Banner */}
                  <div className="p-4 rounded-lg bg-surface-elevated border border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
                    <div className="border-r border-border pr-4 space-y-1">
                      <p className="text-[11px] font-mono uppercase text-ink-muted">Input Parent Lot Reference</p>
                      <p className="font-mono font-bold text-base text-ink">{job.inputLotRef}</p>
                      <p className="font-medium text-ink">{job.inputProduceName}</p>
                      <p className="font-mono text-ink-muted">{job.inputQuantityKg} kg net weight</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
                        Derived Value-Added Child Lot
                      </p>
                      <p className="font-mono font-bold text-base text-primary">{job.outputLotRef}</p>
                      <p className="font-medium text-ink">{job.outputProduceName}</p>
                      <p className="font-mono text-emerald-600 dark:text-emerald-400">
                        {job.outputQuantityKg ? `${job.outputQuantityKg} kg verified output` : 'In processing'}
                      </p>
                    </div>
                  </div>

                  {/* Mass-Balance Breakdown */}
                  {job.status === 'COMPLETED_VERIFIED' && (
                    <div className="p-4 rounded-lg bg-bg border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-mono uppercase text-ink-muted font-medium">
                          Mass-Balance Reconciliation Breakdown
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Balanced
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[12px] font-mono py-1 border-t border-border">
                        <div>
                          <p className="text-ink-muted text-[11px]">Input Raw Net</p>
                          <p className="font-bold text-ink">{job.inputQuantityKg} kg</p>
                        </div>
                        <div>
                          <p className="text-ink-muted text-[11px]">Verified Yield</p>
                          <p className="font-bold text-emerald-600">{job.outputQuantityKg} kg</p>
                        </div>
                        <div>
                          <p className="text-ink-muted text-[11px]">By-Products</p>
                          <p className="font-bold text-ink">{job.byProductQuantityKg || 0} kg</p>
                        </div>
                        <div>
                          <p className="text-ink-muted text-[11px]">Processing Loss</p>
                          <p className="font-bold text-ink-muted">{job.processingLossKg || 0} kg</p>
                        </div>
                      </div>

                      {job.byProductDescription && (
                        <p className="text-[12px] text-ink-muted italic border-t border-border pt-1">
                          Recovered By-Products: {job.byProductDescription} ({job.byProductQuantityKg} kg)
                        </p>
                      )}

                      {job.qualityInspectionRef && (
                        <div className="flex items-center justify-between text-[12px] border-t border-border pt-2">
                          <span className="text-ink-muted">Quality Certificate:</span>
                          <span className="font-mono text-primary flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {job.qualityInspectionRef} — {job.qualityInspectionNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit History Log */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Processing Audit Trail</p>
                    <div className="space-y-1">
                      {job.auditHistory.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[12px] font-mono text-ink-muted">
                          <span className="text-emerald-600 dark:text-emerald-400">●</span>
                          <span>[{new Date(entry.timestamp).toLocaleTimeString()}]</span>
                          <span className="font-medium text-ink">{entry.action}</span>
                          <span>by {entry.actor}</span>
                          <span className="italic">— {entry.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUBMIT PROCESSING REQUEST FORM */}
        {activeTab === 'submit_request' && (
          <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-surface shadow-sm space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif font-medium text-xl text-ink">Submit Processing & Value-Addition Request</h2>
              <p className="text-[13px] text-ink-muted mt-1">
                Initiate a formal processing request for forest produce transformation across state processing units.
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="req-org" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Requesting Organisation
                  </label>
                  <input
                    id="req-org"
                    type="text"
                    value={requestForm.requestingOrgName}
                    onChange={(e) => setRequestForm({ ...requestForm, requestingOrgName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="req-produce" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Input Harvest Commodity
                  </label>
                  <input
                    id="req-produce"
                    type="text"
                    value={requestForm.inputProduceName}
                    onChange={(e) => setRequestForm({ ...requestForm, inputProduceName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="req-input-qty" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Input Quantity Available (kg)
                  </label>
                  <input
                    id="req-input-qty"
                    type="number"
                    min="50"
                    value={requestForm.inputQuantityKg}
                    onChange={(e) => setRequestForm({ ...requestForm, inputQuantityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="req-yield" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Expected Yield (%)
                  </label>
                  <input
                    id="req-yield"
                    type="number"
                    min="10"
                    max="100"
                    value={requestForm.expectedYieldPercent}
                    onChange={(e) => setRequestForm({ ...requestForm, expectedYieldPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="req-output" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Required Output Commodity Specification
                  </label>
                  <input
                    id="req-output"
                    type="text"
                    value={requestForm.requiredOutputName}
                    onChange={(e) => setRequestForm({ ...requestForm, requiredOutputName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="req-qc" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Desired Quality & Compliance Standards
                  </label>
                  <input
                    id="req-qc"
                    type="text"
                    value={requestForm.desiredQualitySpecs}
                    onChange={(e) => setRequestForm({ ...requestForm, desiredQualitySpecs: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="req-start" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Preferred Start Date
                  </label>
                  <input
                    id="req-start"
                    type="date"
                    value={requestForm.preferredStartDate}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredStartDate: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="req-end" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Target Completion Date
                  </label>
                  <input
                    id="req-end"
                    type="date"
                    value={requestForm.preferredCompletionDate}
                    onChange={(e) => setRequestForm({ ...requestForm, preferredCompletionDate: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="req-facility" className="block text-[12px] font-mono text-ink-muted mb-1">
                  Facility Tooling & Equipment Prerequisites
                </label>
                <textarea
                  id="req-facility"
                  rows={2}
                  value={requestForm.facilityRequirements}
                  onChange={(e) => setRequestForm({ ...requestForm, facilityRequirements: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setActiveTab('requests')}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Submit Request for Matching
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

