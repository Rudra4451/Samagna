'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  INITIAL_MARKETPLACE_CATALOGUE,
  MarketplaceProduct,
  BuyerCategory,
  getStoredCommercialConfig,
} from '@/lib/marketplace';
import { useCartStore } from '@/store/useCartStore';
import {
  Search,
  Building2,
  ShoppingBag,
  ShieldCheck,
  Warehouse,
  CheckCircle2,
  ArrowRight,
  Filter,
  Package,
  Layers,
  Sparkles,
  QrCode,
  ExternalLink,
  ChevronRight,
  Check,
  Clock,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceHomePage() {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [activeMode, setActiveMode] = useState<BuyerCategory | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Selected packaging option for quick B2C add
  const [selectedPackOption, setSelectedPackOption] = useState<{ [productId: string]: string }>({});

  const categories = ['ALL', 'Honey', 'Forest Seeds', 'Medicinal Herbs', 'Flowers & Pods'];

  const filteredProducts = useMemo(() => {
    return INITIAL_MARKETPLACE_CATALOGUE.filter((product) => {
      // Mode filter
      if (activeMode === 'B2B' && !product.isAvailableForB2B) return false;
      if (activeMode === 'B2C' && !product.isAvailableForB2C) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && product.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.nameEnglish.toLowerCase().includes(query);
        const matchesOdia = product.nameOdia.toLowerCase().includes(query);
        const matchesSci = product.scientificName.toLowerCase().includes(query);
        const matchesBatch = product.primaryBatchCode.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        if (!matchesName && !matchesOdia && !matchesSci && !matchesBatch && !matchesDesc) return false;
      }

      return true;
    });
  }, [activeMode, selectedCategory, searchQuery]);

  const handleQuickAddB2C = (product: MarketplaceProduct) => {
    const selectedOptId = selectedPackOption[product.id] || product.b2cOptions[0]?.id;
    const option = product.b2cOptions.find((o) => o.id === selectedOptId) || product.b2cOptions[0];
    if (!option) return;

    addItem({
      productId: product.id,
      productName: product.nameEnglish,
      scientificName: product.scientificName,
      imagePath: product.imagePath,
      batchCode: product.primaryBatchCode,
      depotId: product.destinationDepotId,
      depotName: product.destinationDepotName,
      buyerType: 'B2C',
      packDescription: `${option.sizeLabel} (${option.packagingDescription})`,
      unitWeightKg: option.weightGrams / 1000,
      quantityUnits: 1,
      unitPriceInr: option.priceInr,
    });

    setAddedToast(`Added 1 x ${product.nameEnglish} (${option.sizeLabel}) to cart`);
    setTimeout(() => setAddedToast(null), 3500);
  };

  const handleQuickAddB2B = (product: MarketplaceProduct) => {
    const minMoq = product.b2bMinimumOrderKg;
    const bagWeight = product.b2bPackaging.bagWeightKg;
    const bags = Math.ceil(minMoq / bagWeight);
    const totalKg = bags * bagWeight;

    addItem({
      productId: product.id,
      productName: product.nameEnglish,
      scientificName: product.scientificName,
      imagePath: product.imagePath,
      batchCode: product.primaryBatchCode,
      depotId: product.destinationDepotId,
      depotName: product.destinationDepotName,
      buyerType: 'B2B',
      packDescription: `${bags} x ${bagWeight}kg Gunny Bag (Wholesale MOQ)`,
      unitWeightKg: totalKg,
      quantityUnits: 1,
      unitPriceInr: product.b2bWholesaleRatePerKg * totalKg,
    });

    setAddedToast(`Added ${totalKg} kg wholesale order for ${product.nameEnglish} to cart`);
    setTimeout(() => setAddedToast(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-[4px] shadow-lg flex items-center gap-3 border border-rule animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={18} className="text-success shrink-0" />
          <span className="text-[13px] font-medium">{addedToast}</span>
          <Link
            href="/marketplace/cart"
            className="text-[12px] font-mono text-accent hover:underline font-bold ml-2"
          >
            View Cart →
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono font-bold">
              <Sparkles size={14} />
              <span>DIRECT COMMERCIAL PROCUREMENT ECOSYSTEM</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold text-ink leading-tight">
              Verified Odisha Forest Produce Marketplace
            </h1>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              Procure certified wild forest produce directly from Mayurbhanj tribal collection centres and the Baripada Central Depôt. Every commercial consignment carries complete batch provenance, certified laboratory moisture specs, and uncompromised MSP protections for tribal gatherers.
            </p>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-3 sm:w-80 shrink-0">
            <div className="p-3 rounded-[3px] border border-rule bg-bg-sunken space-y-1">
              <div className="flex items-center gap-1.5 text-accent text-[12px] font-bold">
                <Building2 size={14} />
                <span>B2B Wholesale</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Pharma & food grade bulk lots with RFQ quotation contracts.
              </p>
            </div>
            <div className="p-3 rounded-[3px] border border-rule bg-bg-sunken space-y-1">
              <div className="flex items-center gap-1.5 text-accent text-[12px] font-bold">
                <ShoppingBag size={14} />
                <span>B2C Retail</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Purity-tested individual jars and retail pouches for consumers.
              </p>
            </div>
            <div className="p-3 rounded-[3px] border border-rule bg-bg-sunken space-y-1">
              <div className="flex items-center gap-1.5 text-success text-[12px] font-bold">
                <Warehouse size={14} />
                <span>Live Depôt Link</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Real-time stock deduction from Baripada Central Depôt #02.
              </p>
            </div>
            <div className="p-3 rounded-[3px] border border-rule bg-bg-sunken space-y-1">
              <div className="flex items-center gap-1.5 text-accent text-[12px] font-bold">
                <ShieldCheck size={14} />
                <span>Zero Deductions</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Tribal collectors receive 100% of statutory MSP payout.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="pt-4 border-t border-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-[4px] border border-rule bg-bg-sunken">
            <button
              type="button"
              onClick={() => setActiveMode('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-[3px] text-[12px] font-medium transition-colors',
                activeMode === 'ALL'
                  ? 'bg-surface text-ink font-bold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              All Categories
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('B2B')}
              className={cn(
                'px-3 py-1.5 rounded-[3px] text-[12px] font-medium transition-colors flex items-center gap-1.5',
                activeMode === 'B2B'
                  ? 'bg-surface text-ink font-bold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <Building2 size={13} />
              <span>B2B Bulk Sourcing</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('B2C')}
              className={cn(
                'px-3 py-1.5 rounded-[3px] text-[12px] font-medium transition-colors flex items-center gap-1.5',
                activeMode === 'B2C'
                  ? 'bg-surface text-ink font-bold shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              <ShoppingBag size={13} />
              <span>B2C Retail Store</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search produce name, botanical family, or batch code (e.g. BS-400)..."
              className="w-full h-[36px] pl-9 pr-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted mr-1">
          Species Group:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3 py-1 rounded-[3px] text-[12px] border transition-colors whitespace-nowrap',
              selectedCategory === cat
                ? 'border-accent bg-accent/10 text-accent font-bold'
                : 'border-rule bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle'
            )}
          >
            {cat === 'ALL' ? 'All Botanical Groups' : cat}
          </button>
        ))}
      </div>

      {/* Product Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const currentPackId = selectedPackOption[product.id] || product.b2cOptions[0]?.id;
          const currentPack =
            product.b2cOptions.find((o) => o.id === currentPackId) || product.b2cOptions[0];

          return (
            <div
              key={product.id}
              className="border border-rule rounded-[4px] bg-surface flex flex-col overflow-hidden hover:border-ink-subtle transition-all shadow-none group"
            >
              {/* Image & Badges */}
              <div className="relative h-48 w-full bg-bg-sunken overflow-hidden border-b border-rule">
                <Image
                  src={product.imagePath}
                  alt={product.nameEnglish}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 rounded-[2px] bg-black/75 backdrop-blur text-white text-[10px] font-mono font-bold tracking-wider">
                    {product.category}
                  </span>
                  <Link
                    href={`/verify/${product.primaryBatchCode}`}
                    className="pointer-events-auto px-2 py-0.5 rounded-[2px] bg-accent text-white text-[10px] font-mono font-bold tracking-wider hover:bg-accent-hover flex items-center gap-1 shadow-sm"
                    title="Click to view public government ledger & QR verification"
                  >
                    <QrCode size={11} />
                    <span>#{product.primaryBatchCode}</span>
                  </Link>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2 py-0.5 rounded-[2px] bg-white/95 text-ink text-[10px] font-mono font-semibold border border-rule/50">
                    Moisture: {product.labCertifiedMoisturePercent}% · {product.qualityGrade.split('-')[0]}
                  </span>
                  <span className="px-2 py-0.5 rounded-[2px] bg-white/95 text-ink text-[10px] font-mono font-bold border border-rule/50">
                    Stock: {product.totalVerifiedStockKg} kg
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-heading font-bold text-[18px] text-ink group-hover:text-accent transition-colors">
                      <Link href={`/marketplace/product/${product.slug}`}>
                        {product.nameEnglish}
                      </Link>
                    </h3>
                    <span className="font-odia text-[13px] text-ink-muted shrink-0">
                      {product.nameOdia}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-ink-muted italic">
                    {product.scientificName} · {product.originGramPanchayat}, {product.originBlock}
                  </p>

                  <p className="text-[12px] text-ink-muted line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Pricing & Order Section based on active mode */}
                <div className="pt-3 border-t border-rule space-y-3">
                  {/* B2B Wholesale Details */}
                  {(activeMode === 'ALL' || activeMode === 'B2B') && (
                    <div className="p-2.5 rounded-[3px] bg-bg-sunken border border-rule space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-ink-muted font-semibold flex items-center gap-1">
                          <Building2 size={12} className="text-accent" />
                          <span>B2B Wholesale</span>
                        </span>
                        <span className="text-[10px] text-ink-subtle">
                          MOQ: {product.b2bMinimumOrderKg} kg
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[16px] font-mono font-bold text-ink">
                            ₹{product.b2bWholesaleRatePerKg}
                          </span>
                          <span className="text-[11px] font-mono text-ink-muted"> / kg</span>
                        </div>
                        <span className="text-[10px] font-mono text-success font-semibold">
                          (Govt MSP: ₹{product.officialMspRatePerKg}/kg)
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAddB2B(product)}
                          className="flex-1 h-[30px] rounded-[3px] bg-surface hover:bg-bg border border-rule text-ink text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Building2 size={12} />
                          <span>Add Bulk MOQ</span>
                        </button>
                        <Link
                          href={`/marketplace/rfq?produce=${encodeURIComponent(product.nameEnglish)}&batch=${product.primaryBatchCode}`}
                          className="px-2.5 h-[30px] rounded-[3px] border border-rule bg-surface hover:bg-bg text-ink text-[11px] font-medium flex items-center justify-center gap-1"
                          title="Submit Request for Quotation"
                        >
                          <span>RFQ</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* B2C Retail Packaged Option */}
                  {(activeMode === 'ALL' || activeMode === 'B2C') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-ink-muted font-semibold flex items-center gap-1">
                          <ShoppingBag size={12} className="text-accent" />
                          <span>Consumer Pack:</span>
                        </span>
                        {product.b2cOptions.length > 1 ? (
                          <select
                            value={currentPackId}
                            onChange={(e) =>
                              setSelectedPackOption((prev) => ({
                                ...prev,
                                [product.id]: e.target.value,
                              }))
                            }
                            className="h-[24px] px-1.5 text-[11px] font-mono border border-rule rounded-[2px] bg-surface text-ink cursor-pointer"
                          >
                            {product.b2cOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.sizeLabel} (₹{opt.priceInr})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[11px] font-mono font-semibold text-ink">
                            {currentPack?.sizeLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[18px] font-mono font-bold text-ink">
                            ₹{currentPack?.priceInr}
                          </span>
                          <span className="text-[11px] text-ink-muted ml-1">
                            ({currentPack?.sizeLabel})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleQuickAddB2C(product)}
                          className="h-[32px] px-3.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-none"
                        >
                          <ShoppingBag size={13} />
                          <span>Buy Now</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View Details Link */}
                  <Link
                    href={`/marketplace/product/${product.slug}`}
                    className="block text-center text-[11px] font-mono text-ink-muted hover:text-accent pt-1"
                  >
                    View Batch Origin & Lab Certificate →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="p-12 text-center border border-rule rounded-[4px] bg-surface space-y-3">
          <Package size={36} className="mx-auto text-ink-muted opacity-50" />
          <h3 className="font-heading font-bold text-[18px] text-ink">
            No Verified Produce Found
          </h3>
          <p className="text-[13px] text-ink-muted max-w-md mx-auto">
            No active batches matched your search query. Try selecting another botanical group or reset your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveMode('ALL');
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-[3px] bg-accent text-white text-[12px] font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Institutional Royalty & Commission Notice (Requirements 2, 4, 5) */}
      <div className="p-5 rounded-[4px] border border-rule bg-bg-sunken flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[12px]">
        <div className="space-y-1 max-w-3xl">
          <div className="flex items-center gap-2 text-accent font-bold font-mono">
            <Percent size={14} />
            <span>TRANSPARENT REVENUE & STATUTORY MSP PRESERVATION</span>
          </div>
          <p className="text-ink-muted leading-relaxed">
            Marketplace transactions include a transparent platform commission (3.5% wholesale / 6.0% consumer retail) supporting digital infrastructure maintenance. Government royalty charges are institutional arrangements and are <strong>never deducted from the Minimum Support Price (MSP)</strong> guaranteed to primary forest gatherers.
          </p>
        </div>
        <Link
          href="/admin"
          className="shrink-0 px-3.5 py-2 rounded-[3px] border border-rule bg-surface hover:bg-bg text-ink text-[12px] font-mono font-semibold flex items-center gap-1.5"
        >
          <span>Admin Revenue Portal</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

