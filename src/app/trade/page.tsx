'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Package,
  Layers,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowRight,
  Search,
  Filter,
  Lock,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import {
  TradeBusinessProfile,
  TradeListing,
  TradeRfq,
  TradeQuotation,
  TradePurchaseOrder,
  B2BProductCatalogueItem,
} from '@/lib/b2bTrade';

type TradeTab = 'discovery' | 'catalogue' | 'rfq_desk' | 'orders' | 'businesses';

export default function B2BBulkTradePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TradeTab>('discovery');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [catalogue, setCatalogue] = useState<B2BProductCatalogueItem[]>([]);
  const [rfqs, setRfqs] = useState<TradeRfq[]>([]);
  const [orders, setOrders] = useState<TradePurchaseOrder[]>([]);
  const [businesses, setBusinesses] = useState<TradeBusinessProfile[]>([]);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states for creating RFQ
  const [isCreatingRfq, setIsCreatingRfq] = useState(false);
  const [selectedListingForRfq, setSelectedListingForRfq] = useState<TradeListing | null>(null);
  const [rfqForm, setRfqForm] = useState({
    buyerOrgId: 'BUS-DABUR-01',
    produceSlug: 'mahua',
    produceName: 'Dried Mahua Flowers',
    requestedGrade: 'Grade 1 / Premium',
    requestedQuantityKg: 50,
    deliveryLocation: 'Dabur Ayurvedic Manufacturing Unit, Plot 22, Site IV, Sahibabad Industrial Area, Ghaziabad, UP',
    buyerNotes: 'Standard moisture analysis report required upon dispatch.',
  });

  const loadAllData = async () => {
    try {
      const [listRes, catRes, rfqRes, ordRes, busRes] = await Promise.all([
        fetch('/api/trade/listings'),
        fetch('/api/trade/catalogue'),
        fetch('/api/trade/rfq'),
        fetch('/api/trade/orders'),
        fetch('/api/trade/businesses'),
      ]);

      if (listRes.ok) {
        const d = await listRes.json();
        if (d.success) setListings(d.listings);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        if (d.success) setCatalogue(d.catalogue);
      }
      if (rfqRes.ok) {
        const d = await rfqRes.json();
        if (d.success) setRfqs(d.rfqs);
      }
      if (ordRes.ok) {
        const d = await ordRes.json();
        if (d.success) setOrders(d.orders);
      }
      if (busRes.ok) {
        const d = await busRes.json();
        if (d.success) setBusinesses(d.businesses);
      }
    } catch (err: any) {
      console.error('Failed to load trade data:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/trade');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          loadAllData().finally(() => setLoading(false));
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

  const handleOpenRfqForListing = (listing: TradeListing) => {
    setSelectedListingForRfq(listing);
    setRfqForm((prev) => ({
      ...prev,
      produceSlug: listing.produceSlug,
      produceName: listing.produceName,
      requestedGrade: listing.qualityGrade,
      requestedQuantityKg: listing.minimumOrderQuantityKg,
    }));
    setIsCreatingRfq(true);
    setActiveTab('rfq_desk');
  };

  const handleCreateRfqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/trade/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rfqForm,
          listingId: selectedListingForRfq ? selectedListingForRfq.id : undefined,
          targetDeliveryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to submit RFQ.');
        return;
      }

      setSuccessMsg(`RFQ created successfully (${data.rfq.rfqNumber}).`);
      setIsCreatingRfq(false);
      setSelectedListingForRfq(null);
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  const handleAcceptQuotation = async (quotationId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/trade/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId,
          buyerActor: currentUser?.fullName || 'Buyer Representative',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to issue purchase order.');
        return;
      }

      setSuccessMsg(`Purchase Order ${data.purchaseOrder.poNumber} issued successfully.`);
      setActiveTab('orders');
      await loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-ink">
        <p className="text-[13px] font-mono text-ink-muted">Verifying trade clearance and loading platform records...</p>
      </div>
    );
  }

  const filteredCatalogue = catalogue.filter((item) => {
    const matchesSearch =
      item.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell>
      <div className="max-w-[1240px] mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Masthead Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" /> STATUTORY B2B TRADE DESK
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-surface-elevated text-ink-muted border border-border">
                PILOT SERVICE: 0.0% COMMERCIAL FEE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold tracking-tight text-ink text-balance">
              Institutional Forest Produce Trade Desk
            </h1>
            <p className="text-[14px] text-ink-muted max-w-2xl mt-1.5 leading-relaxed text-pretty">
              Wholesale procurement portal connecting verified processors, pharmaceutical manufacturers, and bulk buyers
              with authorized TDCCOL minor forest produce inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] font-mono text-ink-muted">Operator Clearance</p>
              <p className="text-[13px] font-medium text-ink">{currentUser.fullName} ({currentUser.role})</p>
            </div>
          </div>
        </div>

        {/* Global Policy Alert Bar */}
        <div className="p-4 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-ink">
              <p className="font-medium">100% Minimum Support Price (MSP) Primary Flow Guarantee</p>
              <p className="text-ink-muted text-[12px]">
                Platform service fee rate is zero in pilot. 100% of notified collection value is disbursed directly to forest gatherers.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              Inventory Lock: 72h Active
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              Clearance: DPO Enforced
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
            onClick={() => setActiveTab('discovery')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'discovery'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Package className="w-4 h-4" />
            Lot Discovery ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'catalogue'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Layers className="w-4 h-4" />
            Structured Catalogue ({catalogue.length})
          </button>
          <button
            onClick={() => setActiveTab('rfq_desk')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'rfq_desk'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <FileText className="w-4 h-4" />
            RFQ & Quotation Desk ({rfqs.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Truck className="w-4 h-4" />
            Purchase Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'businesses'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Verified Enterprises ({businesses.length})
          </button>
        </div>

        {/* TAB 1: LOT-BASED TRADE DISCOVERY */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Authorised Physical Lots Available for Trade</h2>
                <p className="text-[13px] text-ink-muted">
                  Physical warehouse stock with verified DPO commercial sale release and laboratory quality certificates.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedListingForRfq(null);
                  setIsCreatingRfq(true);
                  setActiveTab('rfq_desk');
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Raise General RFQ
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-surface rounded-xl border border-border p-5 space-y-4 shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                          {lot.id}
                        </span>
                        <span className="font-mono text-[11px] bg-surface-elevated text-ink-muted px-2 py-0.5 rounded border border-border">
                          Batch: {lot.warehouseBatchRef}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-medium text-ink">{lot.produceName}</h3>
                      <p className="text-[12px] italic text-ink-muted font-serif">{lot.scientificName}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-mono text-ink-muted uppercase">Indicative Price</p>
                      <p className="text-xl font-mono font-medium text-primary">₹{lot.indicativePricePerKg.toFixed(2)}<span className="text-[12px] text-ink-muted font-sans">/kg</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-border text-[12px]">
                    <div>
                      <p className="text-ink-muted">Quality Grade</p>
                      <p className="font-medium text-ink">{lot.qualityGrade}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Depot & Storage Bay</p>
                      <p className="font-medium text-ink">{lot.depotFacilityId} • {lot.storageBayLocation || 'Standard Bay'}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Available Quantity</p>
                      <p className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        {lot.availableQuantityKg} kg <span className="text-ink-muted text-[11px]">(of {lot.totalLotQuantityKg} kg)</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Minimum Order Qty</p>
                      <p className="font-mono font-medium text-ink">{lot.minimumOrderQuantityKg} kg</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-[12px]">
                    <div className="flex items-center justify-between text-ink-muted">
                      <span>Statutory Clearance Ref:</span>
                      <span className="font-mono font-medium text-ink flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {lot.lotSaleAuthorizationRef} ({lot.authorizingOfficer})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-ink-muted">
                      <span>Packaging:</span>
                      <span className="text-ink font-medium">{lot.packagingDescription}</span>
                    </div>
                    {lot.inspectionCertificateRef && (
                      <div className="flex items-center justify-between text-ink-muted">
                        <span>Quality Dossier:</span>
                        <span className="font-mono text-primary flex items-center gap-1 cursor-pointer">
                          <ExternalLink className="w-3 h-3" />
                          {lot.inspectionCertificateRef}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenRfqForListing(lot)}
                    >
                      Raise Purchase RFQ for this Lot
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STRUCTURED B2B CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Odisha Forest Produce Procurement Catalogue</h2>
                <p className="text-[13px] text-ink-muted">
                  Authentic botanical nomenclature, verified commercial grades, moisture thresholds, and packaging standards.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    aria-label="Search produce catalogue"
                    placeholder="Search produce..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-[13px] rounded-lg bg-surface border border-border text-ink focus:outline-none focus:border-primary w-48 sm:w-64"
                  />
                </div>
                <select
                  aria-label="Filter by category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 text-[13px] rounded-lg bg-surface border border-border text-ink focus:outline-none focus:border-primary"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Non-Timber Forest Produce">Non-Timber Produce</option>
                  <option value="Oilseed">Oilseed</option>
                  <option value="Medicinal Flora">Medicinal Flora</option>
                  <option value="Gum & Resin">Gum & Resin</option>
                </select>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-elevated border-b border-border text-[11px] font-mono uppercase text-ink-muted">
                    <tr>
                      <th scope="col" className="p-3.5">Commodity & Botanical Identity</th>
                      <th scope="col" className="p-3.5">Category</th>
                      <th scope="col" className="p-3.5">Commercial Grades</th>
                      <th scope="col" className="p-3.5">Moisture Max</th>
                      <th scope="col" className="p-3.5">Standard Packaging</th>
                      <th scope="col" className="p-3.5">Primary Origin</th>
                      <th scope="col" className="p-3.5 text-right">TDCCOL Benchmark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCatalogue.map((item) => (
                      <tr key={item.slug} className="hover:bg-bg/50 transition-colors">
                        <td className="p-3.5">
                          <p className="font-serif font-medium text-ink">{item.nameEnglish}</p>
                          <p className="text-[11px] text-ink-muted">{item.nameOdia}</p>
                          <p className="text-[12px] italic text-primary font-serif">{item.scientificName} ({item.botanicalFamily})</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-bg border border-border text-ink-muted">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {item.availableGrades.map((g) => (
                              <span key={g} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-ink">
                                {g}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[12px] text-ink">
                          {item.baselineMoistureMaxPercent.toFixed(1)}%
                        </td>
                        <td className="p-3.5 text-[12px] text-ink-muted">
                          {item.standardPackaging}
                        </td>
                        <td className="p-3.5 text-[12px] text-ink-muted">
                          {item.primaryOriginDistricts.slice(0, 2).join(', ')}
                        </td>
                        <td className="p-3.5 text-right font-mono font-medium text-ink">
                          ₹{item.indicativeBenchmarkRatePerKg.toFixed(2)}/kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RFQ & QUOTATION DESK */}
        {activeTab === 'rfq_desk' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">RFQ & Quotation Workflow Desk</h2>
                <p className="text-[13px] text-ink-muted">
                  Bilateral procurement state machine: Request for Quotation → Quotation Issuance (72h lock) → Purchase Order Generation.
                </p>
              </div>

              {!isCreatingRfq && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreatingRfq(true)}
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create New RFQ
                </Button>
              )}
            </div>

            {/* Create RFQ Form Modal/Drawer */}
            {isCreatingRfq && (
              <div className="p-5 rounded-xl border border-primary/30 bg-surface shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-serif font-medium text-lg text-ink">
                    Submit Formal Request for Quotation (RFQ)
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreatingRfq(false);
                      setSelectedListingForRfq(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>

                <form onSubmit={handleCreateRfqSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="rfq-buyer" className="block text-[12px] font-mono text-ink-muted mb-1">
                        Buyer Organisation (Verified KYC Only)
                      </label>
                      <select
                        id="rfq-buyer"
                        value={rfqForm.buyerOrgId}
                        onChange={(e) => setRfqForm({ ...rfqForm, buyerOrgId: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                      >
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id} disabled={b.verificationStatus !== 'VERIFIED_ACTIVE'}>
                            {b.companyName} ({b.verificationStatus})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="rfq-commodity" className="block text-[12px] font-mono text-ink-muted mb-1">
                        Commodity
                      </label>
                      <input
                        id="rfq-commodity"
                        type="text"
                        value={rfqForm.produceName}
                        onChange={(e) => setRfqForm({ ...rfqForm, produceName: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="rfq-grade" className="block text-[12px] font-mono text-ink-muted mb-1">
                        Required Commercial Grade
                      </label>
                      <input
                        id="rfq-grade"
                        type="text"
                        value={rfqForm.requestedGrade}
                        onChange={(e) => setRfqForm({ ...rfqForm, requestedGrade: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="rfq-qty" className="block text-[12px] font-mono text-ink-muted mb-1">
                        Quantity Required (kg)
                      </label>
                      <input
                        id="rfq-qty"
                        type="number"
                        min="25"
                        value={rfqForm.requestedQuantityKg}
                        onChange={(e) => setRfqForm({ ...rfqForm, requestedQuantityKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="rfq-delivery" className="block text-[12px] font-mono text-ink-muted mb-1">
                        Delivery Destination / Receiving Facility
                      </label>
                      <input
                        id="rfq-delivery"
                        type="text"
                        value={rfqForm.deliveryLocation}
                        onChange={(e) => setRfqForm({ ...rfqForm, deliveryLocation: e.target.value })}
                        className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rfq-notes" className="block text-[12px] font-mono text-ink-muted mb-1">
                      Procurement Specifications & Inspection Conditions
                    </label>
                    <textarea
                      id="rfq-notes"
                      rows={2}
                      value={rfqForm.buyerNotes}
                      onChange={(e) => setRfqForm({ ...rfqForm, buyerNotes: e.target.value })}
                      className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setIsCreatingRfq(false)}
                    >
                      Dismiss
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Submit RFQ to Seller Desk
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Existing RFQs List */}
            <div className="space-y-4">
              {rfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-semibold text-primary">{rfq.rfqNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        rfq.status === 'PO_CREATED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : rfq.status === 'QUOTED'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        STATUS: {rfq.status}
                      </span>
                    </div>

                    <p className="text-[12px] text-ink-muted font-mono">
                      Target Delivery: {new Date(rfq.targetDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                    <div>
                      <p className="text-ink-muted text-[11px]">Buyer Enterprise</p>
                      <p className="font-medium text-ink">{rfq.buyerOrgName || rfq.buyerOrgId}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Produce & Required Grade</p>
                      <p className="font-medium text-ink">{rfq.produceName} ({rfq.requestedGrade})</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Requested Quantity</p>
                      <p className="font-mono font-medium text-ink">{rfq.requestedQuantityKg} kg</p>
                    </div>
                  </div>

                  <div className="text-[12px] text-ink-muted bg-bg p-2.5 rounded border border-border">
                    <p><span className="font-medium text-ink">Delivery Destination:</span> {rfq.deliveryLocation}</p>
                    {rfq.buyerNotes && <p className="mt-1"><span className="font-medium text-ink">Buyer Requirements:</span> {rfq.buyerNotes}</p>}
                  </div>

                  {/* Actions based on state */}
                  {rfq.status === 'QUOTED' && (
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] text-amber-600 font-mono">
                        <Lock className="w-3.5 h-3.5" />
                        72h Stock Allocation Lock Active
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptQuotation('QUOT-2025-001')}
                      >
                        Accept Quotation & Issue PO
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PURCHASE ORDERS & DISPATCHES */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Formal Commercial Purchase Orders</h2>
                <p className="text-[13px] text-ink-muted">
                  Enforceable institutional contracts with agreed commercial rates, e-waybills, and append-only audit trail logs.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {orders.map((po) => (
                <div
                  key={po.id}
                  className="border border-border rounded-xl bg-surface p-6 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-ink">{po.poNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                          po.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {po.status}
                        </span>
                      </div>
                      <p className="text-[12px] text-ink-muted font-mono mt-0.5">
                        Issued on {new Date(po.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-mono text-ink-muted uppercase">Total Agreed Order Value</p>
                      <p className="text-2xl font-mono font-bold text-primary">₹{po.totalOrderAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                    <div>
                      <p className="text-ink-muted text-[11px]">Buyer Enterprise</p>
                      <p className="font-medium text-ink">{po.buyerOrgName || po.buyerOrgId}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Seller Apex Entity</p>
                      <p className="font-medium text-ink">{po.sellerOrgName || po.sellerOrgId}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Produce & Agreed Rate</p>
                      <p className="font-medium text-ink">{po.produceName} ({po.qualityGrade})</p>
                      <p className="font-mono text-[12px] text-ink-muted">₹{po.agreedPricePerKg.toFixed(2)}/kg × {po.quantityKg} kg</p>
                    </div>
                    <div>
                      <p className="text-ink-muted text-[11px]">Statutory References</p>
                      <p className="font-mono text-[12px] text-ink">{po.eWaybillNumber || 'Pending Dispatch'}</p>
                      <p className="font-mono text-[11px] text-ink-muted">QC: {po.qualityInspectionCertRef || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-bg rounded-lg border border-border text-[12px] space-y-1">
                    <p><span className="font-medium text-ink">Delivery Terms:</span> {po.deliveryTerms}</p>
                    <p><span className="font-medium text-ink">Shipping Address:</span> {po.deliveryAddress}</p>
                  </div>

                  {/* Audit History Log */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono uppercase text-ink-muted tracking-wider">Append-Only Audit Trail</p>
                    <div className="space-y-1.5">
                      {po.auditHistory.map((entry, idx) => (
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

        {/* TAB 5: BUSINESS VERIFICATION DESK */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Registered Commercial Enterprises & KYC Directory</h2>
                <p className="text-[13px] text-ink-muted">
                  Strict gatekeeping ensures unverified organisations cannot place orders, issue quotes, or list produce.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businesses.map((biz) => {
                const isVerified = biz.verificationStatus === 'VERIFIED_ACTIVE';
                return (
                  <div
                    key={biz.id}
                    className={`p-5 rounded-xl border bg-surface space-y-4 shadow-sm ${
                      isVerified ? 'border-border' : 'border-amber-500/40 bg-amber-500/[0.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[11px] bg-surface-elevated text-ink-muted px-2 py-0.5 rounded border border-border">
                            {biz.id}
                          </span>
                          <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                            isVerified
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            {biz.verificationStatus}
                          </span>
                        </div>
                        <h3 className="font-serif font-medium text-lg text-ink">{biz.companyName}</h3>
                        <p className="text-[12px] text-ink-muted">{biz.businessType}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-3 border-y border-border text-[12px]">
                      <div>
                        <p className="text-ink-muted">Registration / CIN</p>
                        <p className="font-mono font-medium text-ink">{biz.registrationNumber}</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">PAN / GSTIN</p>
                        <p className="font-mono font-medium text-ink">{biz.pan} {biz.gstin ? `• ${biz.gstin}` : ''}</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Contact Officer</p>
                        <p className="font-medium text-ink">{biz.authorizedContactName}</p>
                        <p className="text-ink-muted text-[11px]">{biz.contactEmail}</p>
                      </div>
                      <div>
                        <p className="text-ink-muted">Registered Location</p>
                        <p className="font-medium text-ink">{biz.city}, {biz.state}</p>
                      </div>
                    </div>

                    <div className="text-[12px] text-ink-muted">
                      <p className="font-medium text-ink">Verification Notes:</p>
                      <p className="italic">{biz.verificationNotes || 'No notes recorded.'}</p>
                    </div>

                    {!isVerified && (
                      <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Trading clearance restricted until KYC documents are approved by state desk.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

