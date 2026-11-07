'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import {
  Store,
  Layers,
  Package,
  TrendingUp,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Search,
  PlusCircle,
  ExternalLink,
  Award,
  Sparkles,
  Barcode,
  ShoppingBag,
  Building2,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react';
import {
  DistributionPartnerProfile,
  DistributionBrand,
  RetailProductSku,
  DistributionChannel,
  OrderReferralRecord,
  PartnerSalesReconciliation,
  DistributionProductTier,
} from '@/lib/distribution';

type DistributionTab = 'skus' | 'channels' | 'referrals' | 'reconciliations' | 'partners';

export default function DistributionNetworkPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<DistributionTab>('skus');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [partners, setPartners] = useState<DistributionPartnerProfile[]>([]);
  const [brands, setBrands] = useState<DistributionBrand[]>([]);
  const [skus, setSkus] = useState<RetailProductSku[]>([]);
  const [channels, setChannels] = useState<DistributionChannel[]>([]);
  const [referrals, setReferrals] = useState<OrderReferralRecord[]>([]);
  const [reconciliations, setReconciliations] = useState<PartnerSalesReconciliation[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filters
  const [tierFilter, setTierFilter] = useState<'ALL' | DistributionProductTier>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [referralForm, setReferralForm] = useState({
    channelId: 'CHN-001',
    externalOrderNumber: '',
    customerIdentifier: '',
    skuCode: 'SKU-MW-HONEY-500G',
    quantityUnits: 12,
    fulfilmentNotes: '',
  });

  // Reconciliation Modal State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileForm, setReconcileForm] = useState({
    channelId: 'CHN-001',
    billingPeriodStart: '2025-04-01T00:00:00Z',
    billingPeriodEnd: '2025-04-30T23:59:59Z',
    physicalInventoryDrawdownUnits: 120,
    settlementReference: 'UTR-SBIN-20250428-994102',
  });

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        // Load User
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        // Load Partners
        const pRes = await fetch('/api/trade/distribution/partners');
        if (pRes.ok) {
          const pData = await pRes.json();
          setPartners(pData.partners || []);
        }

        // Load SKUs
        const sRes = await fetch('/api/trade/distribution/skus');
        if (sRes.ok) {
          const sData = await sRes.json();
          setSkus(sData.skus || []);
        }

        // Load Channels
        const cRes = await fetch('/api/trade/distribution/channels');
        if (cRes.ok) {
          const cData = await cRes.json();
          setChannels(cData.channels || []);
        }

        // Load Referrals
        const rRes = await fetch('/api/trade/distribution/referrals');
        if (rRes.ok) {
          const rData = await rRes.json();
          setReferrals(rData.referrals || []);
        }

        // Load Reconciliations & Summary
        const recRes = await fetch('/api/trade/distribution/reconcile');
        if (recRes.ok) {
          const recData = await recRes.json();
          setReconciliations(recData.reconciliations || []);
        }

        const sumRes = await fetch('/api/trade/distribution/reconcile?summary=true');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData.summary);
        }
      } catch (err: any) {
        setErrorMsg('Failed to load distribution network data.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  // Filtered SKUs
  const filteredSkus = skus.filter((sku) => {
    if (tierFilter !== 'ALL' && sku.productTier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sku.productTitle.toLowerCase().includes(q) ||
        sku.skuCode.toLowerCase().includes(q) ||
        sku.originCluster.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action: Export Catalogue Feed
  const handleExportFeed = (channelCode: string, format: 'json' | 'csv') => {
    window.open(`/api/trade/distribution/export?channel=${encodeURIComponent(channelCode)}&format=${format}`, '_blank');
  };

  // Action: Submit Referral
  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/trade/distribution/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: referralForm.channelId,
          externalOrderNumber: referralForm.externalOrderNumber || `EXT-ORD-${Date.now().toString().slice(-5)}`,
          customerIdentifier: referralForm.customerIdentifier || 'Regional Store Partner',
          lineItems: [
            {
              skuCode: referralForm.skuCode,
              quantityUnits: Number(referralForm.quantityUnits),
            },
          ],
          fulfilmentNotes: referralForm.fulfilmentNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record referral');

      setSuccessMsg(`Order referral ${data.referral.referralCode} successfully registered.`);
      setIsReferralModalOpen(false);

      // Refresh data
      const refetch = await fetch('/api/trade/distribution/referrals');
      if (refetch.ok) {
        const rData = await refetch.json();
        setReferrals(rData.referrals || []);
      }
      const refetchSkus = await fetch('/api/trade/distribution/skus');
      if (refetchSkus.ok) {
        const sData = await refetchSkus.json();
        setSkus(sData.skus || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating referral');
    }
  };

  // Action: Update Referral Status
  const handleUpdateReferralStatus = async (referralId: string, status: string, notes?: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/trade/distribution/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralId, status, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update referral');

      setSuccessMsg(`Referral ${data.referral.referralCode} transitioned to ${status}`);
      // Refresh
      const refetch = await fetch('/api/trade/distribution/referrals');
      if (refetch.ok) {
        const rData = await refetch.json();
        setReferrals(rData.referrals || []);
      }
      const refetchSkus = await fetch('/api/trade/distribution/skus');
      if (refetchSkus.ok) {
        const sData = await refetchSkus.json();
        setSkus(sData.skus || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update referral status');
    }
  };

  // Action: Submit Reconciliation
  const handleSubmitReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/trade/distribution/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: reconcileForm.channelId,
          billingPeriodStart: reconcileForm.billingPeriodStart,
          billingPeriodEnd: reconcileForm.billingPeriodEnd,
          physicalInventoryDrawdownUnits: Number(reconcileForm.physicalInventoryDrawdownUnits),
          settlementReference: reconcileForm.settlementReference,
          reconciledBy: currentUser?.fullName || 'Commercial Finance Incharge',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run reconciliation');

      setSuccessMsg(`Reconciliation ${data.reconciliation.reconciliationNumber} generated (${data.reconciliation.status}).`);
      setIsReconcileModalOpen(false);

      // Refresh reconciliations
      const recRefetch = await fetch('/api/trade/distribution/reconcile');
      if (recRefetch.ok) {
        const recData = await recRefetch.json();
        setReconciliations(recData.reconciliations || []);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error running reconciliation');
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Masthead Header */}
        <div className="border-b border-stone-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Store className="w-3.5 h-3.5" /> B2B2C PARTNER DISTRIBUTION
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide bg-stone-100 text-stone-700 border border-stone-200">
                PILOT ENABLEMENT: 0.0% FEE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900">
              B2B2C Partner Distribution Network
            </h1>
            <p className="text-sm text-stone-600 max-w-3xl mt-1 leading-relaxed">
              Federated external consumer channel syndication enabling verified tribal producer organisations, SHG federations,
              and ethical brands to distribute retail-ready packaged goods to external commercial outlets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-mono text-stone-500">Distribution Officer</p>
              <p className="text-sm font-medium text-stone-900">{currentUser?.fullName || 'Commercial Administrator'} ({currentUser?.role || 'SUPERVISOR'})</p>
            </div>
          </div>
        </div>
        {/* Header Notification Banner */}
        {errorMsg && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-600 hover:text-red-900 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Distributed Volume</span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
              {summary?.totalUnitsDistributed || 362}{' '}
              <span className="text-xs font-normal text-stone-500 font-sans">Retail Units</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">Across 4 syndication channels</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Retail GMV (External)</span>
              <Store className="w-5 h-5 text-stone-600" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-stone-900">
              ₹{(summary?.totalRetailGmv || 90760).toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-xs text-stone-500">Gross external consumer sales</p>
          </div>

          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Net Partner Remittance</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-serif font-bold text-emerald-700">
              ₹{(summary?.totalNetPartnerRevenue || 69590).toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-xs text-stone-500">Payable to tribal producer orgs</p>
          </div>

          <div className="bg-stone-900 text-stone-100 p-5 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">MSP Invariant Status</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="mt-2 text-sm font-medium text-emerald-300">100% Payout Guaranteed</div>
            <p className="mt-1 text-xs text-stone-400">Zero fee deduction from primary gatherers</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-200 gap-3">
          <div className="flex space-x-1 sm:space-x-4">
            <button
              onClick={() => setActiveTab('skus')}
              className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === 'skus'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Retail SKUs & Packaging ({skus.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('channels')}
              className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === 'channels'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Channels & Feeds ({channels.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === 'referrals'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Referrals ({referrals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reconciliations')}
              className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === 'reconciliations'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Sales Reconciliations ({reconciliations.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('partners')}
              className={`py-3 px-3 text-sm font-medium border-b-2 flex items-center space-x-2 ${
                activeTab === 'partners'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Partner Profiles ({partners.length})</span>
            </button>
          </div>

          <div className="py-2 flex items-center space-x-2">
            {activeTab === 'referrals' && (
              <Button onClick={() => setIsReferralModalOpen(true)} className="flex items-center space-x-1.5 text-xs">
                <PlusCircle className="w-4 h-4" />
                <span>Record External Referral</span>
              </Button>
            )}
            {activeTab === 'reconciliations' && (
              <Button onClick={() => setIsReconcileModalOpen(true)} className="flex items-center space-x-1.5 text-xs">
                <FileCheck className="w-4 h-4" />
                <span>Run Sales Reconciliation</span>
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: RETAIL SKUs & PACKAGING */}
        {activeTab === 'skus' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-stone-600 uppercase">Product Tier:</span>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as any)}
                  className="text-xs bg-white border border-stone-300 rounded px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="ALL">All Product Tiers</option>
                  <option value="RETAIL_READY_PACKAGED">Retail-Ready Packaged Goods</option>
                  <option value="PROCESSED_BULK">Processed Semi-Bulk</option>
                  <option value="RAW_PRODUCE">Raw Intake Produce</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by title, SKU, or cluster..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSkus.map((sku) => (
                <div
                  key={sku.id}
                  className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors"
                >
                  <div>
                    {/* Header: Tier Badge & SKU */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              sku.productTier === 'RETAIL_READY_PACKAGED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sku.productTier === 'PROCESSED_BULK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {sku.productTier.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-mono text-stone-500">{sku.skuCode}</span>
                        </div>
                        <h3 className="mt-1.5 text-base font-serif font-bold text-stone-900 leading-snug">
                          {sku.productTitle}
                        </h3>
                        {sku.botanicalName && (
                          <p className="text-xs italic text-stone-500">{sku.botanicalName}</p>
                        )}
                      </div>

                      {sku.barcode && (
                        <div className="flex items-center space-x-1 bg-stone-50 px-2 py-1 rounded border border-stone-200 text-xs font-mono text-stone-600">
                          <Barcode className="w-3.5 h-3.5" />
                          <span>{sku.barcode}</span>
                        </div>
                      )}
                    </div>

                    {/* Packaging & Spec Grid */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded text-xs border border-stone-100">
                      <div>
                        <span className="text-stone-500 block">Packaging:</span>
                        <span className="font-semibold text-stone-800">{sku.packagingType.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Net Content:</span>
                        <span className="font-semibold text-stone-800">{sku.netQuantity}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Case Pack:</span>
                        <span className="font-semibold text-stone-800">{sku.casePackSize} Units/Case</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Shelf Life:</span>
                        <span className="font-semibold text-stone-800">{sku.shelfLifeMonths} Months</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Available Stock:</span>
                        <span className="font-semibold text-emerald-700">{sku.inventoryAvailableUnits} Units</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Harvest Lot:</span>
                        <a
                          href={`/verify/${encodeURIComponent(sku.sourceLotReference)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-emerald-700 underline flex items-center space-x-0.5"
                        >
                          <span>{sku.sourceLotReference}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Packaging Material & Origin Story */}
                    <div className="mt-3 text-xs text-stone-600 space-y-1">
                      <p>
                        <span className="font-semibold text-stone-700">Container Spec:</span> {sku.packagingMaterial}
                      </p>
                      <p>
                        <span className="font-semibold text-stone-700">Origin Story:</span> {sku.originCluster} • {sku.communityProvenance}
                      </p>
                    </div>

                    {/* Compliance & Evidence Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                      {sku.isEvidenceVerified ? (
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audited Evidence ({sku.certifications.length} Credentials)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded border border-stone-200">
                          <span>Standard / Uncertified</span>
                        </div>
                      )}
                      {sku.fssaiDeclaration && (
                        <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                          {sku.fssaiDeclaration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing Footer */}
                  <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-stone-500">Commercial Pricing</div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-sm font-bold text-stone-900">₹{sku.wholesalePriceUnitInr}</span>
                        <span className="text-xs text-stone-500">Wholesale</span>
                        <span className="text-xs text-stone-400">|</span>
                        <span className="text-sm font-bold text-emerald-800">₹{sku.retailPriceMrpInr}</span>
                        <span className="text-xs text-stone-500">MRP</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-stone-500">MOQ</div>
                      <div className="text-xs font-semibold text-stone-800">{sku.minOrderQuantityUnits} Units</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DISTRIBUTION CHANNELS & FEEDS */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((chn) => (
                <div key={chn.id} className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-stone-100 text-stone-700">
                          {chn.channelType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-stone-500">{chn.channelCode}</span>
                      </div>
                      <h3 className="mt-1.5 text-base font-serif font-bold text-stone-900">{chn.channelName}</h3>
                      <p className="text-xs text-stone-500">{chn.channelPartnerName}</p>
                    </div>

                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                      Active Channel
                    </span>
                  </div>

                  <div className="mt-3 p-3 bg-stone-50 rounded text-xs space-y-1.5 border border-stone-100">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Contract Agreement:</span>
                      <span className="font-mono text-stone-800 font-medium">{chn.contractAgreementRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Retailer Margin:</span>
                      <span className="font-bold text-stone-800">{chn.retailerMarginPercent}% on MRP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Platform Facilitation Fee:</span>
                      <span className="font-semibold text-emerald-700">0.0% (Pilot Invariant)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Settlement Terms:</span>
                      <span className="text-stone-800">{chn.settlementTerms}</span>
                    </div>
                    <div className="pt-1 text-stone-600">
                      <span className="font-semibold text-stone-700">Audience:</span> {chn.targetAudience}
                    </div>
                  </div>

                  {/* Syndication Feed Export Actions */}
                  <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs text-stone-500">Syndication Export Feed:</span>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleExportFeed(chn.channelCode, 'csv')}
                        className="text-xs flex items-center space-x-1"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>CSV Feed</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleExportFeed(chn.channelCode, 'json')}
                        className="text-xs flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5 text-stone-700" />
                        <span>JSON Feed</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ORDER REFERRALS */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-stone-200 text-xs">
                <thead className="bg-stone-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-stone-700">
                      Referral Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-stone-700">
                      External Order / Customer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-stone-700">
                      Channel & Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-stone-700">
                      Units & Items
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-stone-700">
                      Gross GMV / Wholesale
                    </th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold text-stone-700">
                      Net Producer Payable
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold text-stone-700">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-semibold text-stone-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-stone-900">{ref.referralCode}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-stone-800">{ref.externalOrderNumber}</div>
                        <div className="text-stone-500 truncate max-w-xs">{ref.customerIdentifier}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-stone-700">{ref.channelId}</div>
                        <div className="text-stone-400">{new Date(ref.orderDate).toLocaleDateString('en-IN')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-stone-900">{ref.totalUnits} Units</div>
                        <div className="text-stone-500 truncate max-w-xs">
                          {ref.lineItems.map((li) => `${li.quantityUnits}x ${li.skuCode}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-stone-900">₹{ref.grossOrderValueInr.toLocaleString('en-IN')}</div>
                        <div className="text-stone-500">₹{ref.wholesaleOrderValueInr.toLocaleString('en-IN')} W/S</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-800">
                        ₹{ref.netPartnerPayableInr.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            ref.status === 'CONFIRMED_FULFILLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ref.status === 'SETTLED'
                              ? 'bg-blue-100 text-blue-800'
                              : ref.status === 'RETURNED_CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ref.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {ref.status === 'RECORDED' && (
                          <div className="flex justify-center space-x-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleUpdateReferralStatus(
                                  ref.id,
                                  'CONFIRMED_FULFILLED',
                                  'Outward physical dispatch confirmed by depot.'
                                )
                              }
                              className="text-xs px-2 py-1 text-emerald-700 hover:bg-emerald-50"
                            >
                              Dispatch
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleUpdateReferralStatus(
                                  ref.id,
                                  'RETURNED_CANCELLED',
                                  'Order cancelled prior to physical dispatch.'
                                )
                              }
                              className="text-xs px-2 py-1 text-red-700 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {ref.status === 'CONFIRMED_FULFILLED' && (
                          <span className="text-xs text-stone-400 italic">Dispatched</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SALES RECONCILIATION */}
        {activeTab === 'reconciliations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {reconciliations.map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-stone-900">{rec.reconciliationNumber}</span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            rec.status === 'RECONCILED_SETTLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        Channel: <span className="font-mono font-medium text-stone-700">{rec.channelId}</span> • Period:{' '}
                        {new Date(rec.billingPeriodStart).toLocaleDateString('en-IN')} –{' '}
                        {new Date(rec.billingPeriodEnd).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    {rec.settlementReference && (
                      <div className="text-right">
                        <span className="text-xs text-stone-500 block">Bank Settlement UTR</span>
                        <span className="text-xs font-mono font-bold text-emerald-800">{rec.settlementReference}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3 rounded border border-stone-100">
                    <div>
                      <span className="text-stone-500 block">Referrals Count:</span>
                      <span className="font-bold text-stone-800">{rec.totalReferralsCount} Orders</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Reported Sold Units:</span>
                      <span className="font-bold text-stone-800">{rec.totalUnitsSold} Units</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Physical Drawdown:</span>
                      <span className="font-bold text-stone-800">{rec.physicalInventoryDrawdownUnits} Units</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Drawdown Variance:</span>
                      <span
                        className={`font-bold ${
                          rec.inventoryVarianceUnits === 0 ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {rec.inventoryVarianceUnits === 0 ? '0 (Clean Match)' : `${rec.inventoryVarianceUnits} Units`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                    <div>
                      <span className="text-stone-500 block">Gross Merchandising Value (GMV):</span>
                      <span className="font-semibold text-stone-900">₹{rec.grossMerchandiseValueInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Retailer Margin Deductions:</span>
                      <span className="font-semibold text-stone-800">-₹{rec.channelMarginDeductionsInr.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Net Remitted to Producer Org:</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        ₹{rec.netRemittancePayableInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {rec.discrepancyNotes && (
                    <div className="mt-3 p-2.5 bg-red-50 text-red-800 text-xs rounded border border-red-200">
                      <strong>Audit Note:</strong> {rec.discrepancyNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PARTNER PROFILES & SUBSCRIPTION */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {partners.map((partner) => (
                <div key={partner.id} className="bg-white rounded-lg border border-stone-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {partner.partnerType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-stone-500">{partner.code}</span>
                      </div>
                      <h3 className="mt-1 text-base font-serif font-bold text-stone-900">{partner.organisationName}</h3>
                      <p className="text-xs text-stone-500">{partner.headquartersAddress}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          partner.isVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {partner.isVerified ? 'Verified Producer' : 'Verification Pending'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                        {partner.subscriptionTier.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3 rounded border border-stone-100">
                    <div>
                      <span className="text-stone-500 block">Registration Number:</span>
                      <span className="font-mono text-stone-800 font-medium">{partner.registrationNumber}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">PAN / GSTIN:</span>
                      <span className="font-mono text-stone-800 font-medium">
                        {partner.pan} {partner.gstin ? `• ${partner.gstin}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">FSSAI License:</span>
                      <span className="font-mono text-stone-800 font-medium">
                        {partner.fssaiLicenseNumber || 'N/A (Non-food produce)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Contact Person:</span>
                      <span className="text-stone-800 font-medium">{partner.primaryContactPerson}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span>
                      Districts Covered: <strong className="text-stone-700">{partner.operatingDistricts.join(', ')}</strong>
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      Enablement Fee: 0.0% (Subsidised Community Invariant)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: Record External Referral */}
        {isReferralModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-serif font-bold text-stone-900">Record External Order Referral</h3>
                <button
                  onClick={() => setIsReferralModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReferral} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Distribution Channel</label>
                  <select
                    value={referralForm.channelId}
                    onChange={(e) => setReferralForm({ ...referralForm, channelId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                  >
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.channelName} ({c.channelCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">External Order No.</label>
                    <input
                      type="text"
                      placeholder="e.g. UTKAL-BBSR-099"
                      value={referralForm.externalOrderNumber}
                      onChange={(e) => setReferralForm({ ...referralForm, externalOrderNumber: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Customer / Store Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Saheed Nagar Boutique"
                      value={referralForm.customerIdentifier}
                      onChange={(e) => setReferralForm({ ...referralForm, customerIdentifier: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Retail SKU</label>
                    <select
                      value={referralForm.skuCode}
                      onChange={(e) => setReferralForm({ ...referralForm, skuCode: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                    >
                      {skus.map((s) => (
                        <option key={s.id} value={s.skuCode}>
                          {s.skuCode} ({s.inventoryAvailableUnits} Avail)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Quantity (Units)</label>
                    <input
                      type="number"
                      min="1"
                      value={referralForm.quantityUnits}
                      onChange={(e) => setReferralForm({ ...referralForm, quantityUnits: Number(e.target.value) })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fulfilment Dispatch Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Staging at Karanjia depot for state transport pickup."
                    value={referralForm.fulfilmentNotes}
                    onChange={(e) => setReferralForm({ ...referralForm, fulfilmentNotes: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                  <Button type="button" variant="secondary" onClick={() => setIsReferralModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Referral</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Run Sales Reconciliation */}
        {isReconcileModalOpen && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-stone-200">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-serif font-bold text-stone-900">Execute Sales Reconciliation</h3>
                <button
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReconcile} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Distribution Channel</label>
                  <select
                    value={reconcileForm.channelId}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, channelId: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                  >
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.channelName} ({c.channelCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Billing Period Start</label>
                    <input
                      type="text"
                      value={reconcileForm.billingPeriodStart}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, billingPeriodStart: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Billing Period End</label>
                    <input
                      type="text"
                      value={reconcileForm.billingPeriodEnd}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, billingPeriodEnd: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Physical Drawdown (Units)</label>
                    <input
                      type="number"
                      min="0"
                      value={reconcileForm.physicalInventoryDrawdownUnits}
                      onChange={(e) =>
                        setReconcileForm({
                          ...reconcileForm,
                          physicalInventoryDrawdownUnits: Number(e.target.value),
                        })
                      }
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Settlement Bank UTR</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR-SBIN-20250428-994102"
                      value={reconcileForm.settlementReference}
                      onChange={(e) => setReconcileForm({ ...reconcileForm, settlementReference: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded text-stone-600 border border-stone-200">
                  <p>
                    <strong>Audit Rule:</strong> System will compare reported referral sales within the period against
                    the physical warehouse drawdown. Any mismatch will automatically flag a discrepancy status.
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                  <Button type="button" variant="secondary" onClick={() => setIsReconcileModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Reconcile & Audit</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

