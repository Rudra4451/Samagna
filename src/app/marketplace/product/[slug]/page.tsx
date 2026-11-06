'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  INITIAL_MARKETPLACE_CATALOGUE,
  MarketplaceProduct,
  getStoredCommercialConfig,
} from '@/lib/marketplace';
import { useCartStore } from '@/store/useCartStore';
import {
  Building2,
  ShoppingBag,
  ShieldCheck,
  Warehouse,
  QrCode,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Scale,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { addItem } = useCartStore();

  const product = INITIAL_MARKETPLACE_CATALOGUE.find((p) => p.slug === slug) || INITIAL_MARKETPLACE_CATALOGUE[0];

  const [activeTab, setActiveTab] = useState<'b2b' | 'b2c'>(product.isAvailableForB2B ? 'b2b' : 'b2c');
  const [selectedB2COptionId, setSelectedB2COptionId] = useState<string>(product.b2cOptions[0]?.id || '');
  const [b2cQuantity, setB2cQuantity] = useState<number>(1);
  const [b2bQuantityKg, setB2bQuantityKg] = useState<number>(product.b2bMinimumOrderKg);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedB2COpt = product.b2cOptions.find((o) => o.id === selectedB2COptionId) || product.b2cOptions[0];

  // B2B Calculations
  const b2bBagWeight = product.b2bPackaging.bagWeightKg;
  const b2bBags = Math.ceil(b2bQuantityKg / b2bBagWeight);
  const b2bActualKg = b2bBags * b2bBagWeight;
  const b2bGross = b2bActualKg * product.b2bWholesaleRatePerKg;
  const b2bCommission = (b2bGross * 3.5) / 100;
  const b2bSellerSettlement = b2bGross - b2bCommission;

  // B2C Calculations
  const b2cSubtotal = (selectedB2COpt?.priceInr || 0) * b2cQuantity;
  const b2cCommission = (b2cSubtotal * 6.0) / 100;
  const b2cSellerSettlement = b2cSubtotal - b2cCommission;

  const handleAddB2BToCart = () => {
    addItem({
      productId: product.id,
      productName: product.nameEnglish,
      scientificName: product.scientificName,
      imagePath: product.imagePath,
      batchCode: product.primaryBatchCode,
      depotId: product.destinationDepotId,
      depotName: product.destinationDepotName,
      buyerType: 'B2B',
      packDescription: `${b2bBags} x ${b2bBagWeight}kg Gunny Bags (${b2bActualKg} kg Consignment)`,
      unitWeightKg: b2bActualKg,
      quantityUnits: 1,
      unitPriceInr: b2bGross,
    });

    setToastMessage(`Added ${b2bActualKg} kg bulk order for ${product.nameEnglish} to cart.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddB2CToCart = () => {
    if (!selectedB2COpt) return;
    addItem({
      productId: product.id,
      productName: product.nameEnglish,
      scientificName: product.scientificName,
      imagePath: product.imagePath,
      batchCode: product.primaryBatchCode,
      depotId: product.destinationDepotId,
      depotName: product.destinationDepotName,
      buyerType: 'B2C',
      packDescription: `${selectedB2COpt.sizeLabel} (${selectedB2COpt.packagingDescription})`,
      unitWeightKg: selectedB2COpt.weightGrams / 1000,
      quantityUnits: b2cQuantity,
      unitPriceInr: selectedB2COpt.priceInr,
    });

    setToastMessage(`Added ${b2cQuantity} x ${product.nameEnglish} (${selectedB2COpt.sizeLabel}) to cart.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-[4px] shadow-lg flex items-center gap-3 border border-rule animate-in fade-in">
          <CheckCircle2 size={18} className="text-success shrink-0" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
          <Link
            href="/marketplace/cart"
            className="text-[12px] font-mono text-accent hover:underline font-bold ml-2"
          >
            Go to Cart →
          </Link>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] font-mono text-ink-muted">
        <Link href="/marketplace" className="hover:text-ink">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-ink-subtle">{product.category}</span>
        <span>/</span>
        <span className="text-ink font-bold">{product.nameEnglish}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Product Images & Warehouse Provenance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
            <div className="relative h-96 w-full bg-bg-sunken">
              <Image
                src={product.imagePath}
                alt={product.nameEnglish}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-[2px] bg-black/75 backdrop-blur text-white text-[11px] font-mono font-bold tracking-wider">
                  {product.category}
                </span>
                <span className="px-2.5 py-1 rounded-[2px] bg-emerald-600 text-white text-[11px] font-mono font-bold tracking-wider">
                  {product.qualityGrade.split('-')[0].trim()}
                </span>
              </div>
            </div>

            {/* Warehouse Provenance Plate */}
            <div className="p-6 border-t border-rule bg-bg-sunken/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent font-bold font-mono text-[12px]">
                  <Warehouse size={16} />
                  <span>AUTHENTIC CENTRAL DEPÔT PROVENANCE</span>
                </div>
                <Link
                  href={`/verify/${product.primaryBatchCode}`}
                  className="px-2.5 py-1 rounded-[2px] bg-accent hover:bg-accent-hover text-white text-[11px] font-mono font-bold flex items-center gap-1.5 transition-colors"
                  title="Verify on Public Traceability Ledger"
                >
                  <QrCode size={13} />
                  <span>Verify Batch #{product.primaryBatchCode}</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] font-mono">
                <div className="p-2.5 rounded-[3px] border border-rule bg-surface">
                  <span className="text-ink-muted text-[10px] block">Depot Facility</span>
                  <span className="font-bold text-ink">{product.destinationDepotId}</span>
                  <span className="text-[10px] text-ink-subtle block">{product.storageBay}</span>
                </div>
                <div className="p-2.5 rounded-[3px] border border-rule bg-surface">
                  <span className="text-ink-muted text-[10px] block">Moisture Reading</span>
                  <span className="font-bold text-ink text-[14px]">
                    {product.labCertifiedMoisturePercent}%
                  </span>
                  <span className="text-[10px] text-success block">Certified Optimal</span>
                </div>
                <div className="p-2.5 rounded-[3px] border border-rule bg-surface">
                  <span className="text-ink-muted text-[10px] block">Tribal Origin GP</span>
                  <span className="font-bold text-ink">{product.originGramPanchayat}</span>
                  <span className="text-[10px] text-ink-subtle block">{product.originBlock} Block</span>
                </div>
                <div className="p-2.5 rounded-[3px] border border-rule bg-surface">
                  <span className="text-ink-muted text-[10px] block">Available Stock</span>
                  <span className="font-bold text-ink text-[14px]">
                    {product.totalVerifiedStockKg} kg
                  </span>
                  <span className="text-[10px] text-success block">Ready for Dispatch</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-ink-muted bg-surface p-3 rounded-[3px] border border-rule flex items-start gap-2">
                <ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-ink">Zero Deductions Policy:</span>
                  <span>
                    {' '}Every kilogram procured in this batch was purchased directly from forest gatherers of{' '}
                    <strong>{product.shgSupplierName}</strong> at statutory Minimum Support Price (₹{product.officialMspRatePerKg}/kg).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Traditional Uses */}
          <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-4 shadow-none">
            <h2 className="font-heading font-bold text-[18px] text-ink">
              Botanical Specifications & Provenance
            </h2>
            <p className="text-[13px] text-ink leading-relaxed">
              {product.description}
            </p>

            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted block font-semibold">
                Certified Purity & Harvesting Criteria:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.benefits.map((benefit, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-[3px] bg-bg-sunken border border-rule text-[12px] text-ink flex items-center gap-2"
                  >
                    <CheckCircle2 size={14} className="text-success shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Commercial Ordering Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-6 shadow-none sticky top-20">
            {/* Produce Header */}
            <div className="space-y-1.5 border-b border-rule pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-accent font-bold uppercase tracking-wider">
                  Verified Minor Forest Produce
                </span>
                <span className="text-[11px] font-mono text-ink-muted">
                  Harvest: {product.harvestSeason}
                </span>
              </div>
              <h1 className="text-[24px] font-heading font-bold text-ink">
                {product.nameEnglish}
              </h1>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-mono text-ink-muted italic">
                  {product.scientificName}
                </span>
                <span className="font-odia text-[14px] text-ink font-medium">
                  {product.nameOdia}
                </span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-[4px] border border-rule bg-bg-sunken">
              <button
                type="button"
                onClick={() => setActiveTab('b2b')}
                disabled={!product.isAvailableForB2B}
                className={cn(
                  'py-2 text-[12px] font-medium rounded-[3px] transition-colors flex items-center justify-center gap-1.5',
                  activeTab === 'b2b'
                    ? 'bg-surface text-ink font-bold shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <Building2 size={14} />
                <span>B2B Wholesale</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('b2c')}
                disabled={!product.isAvailableForB2C}
                className={cn(
                  'py-2 text-[12px] font-medium rounded-[3px] transition-colors flex items-center justify-center gap-1.5',
                  activeTab === 'b2c'
                    ? 'bg-surface text-ink font-bold shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                <ShoppingBag size={14} />
                <span>B2C Retail Store</span>
              </button>
            </div>

            {/* B2B Wholesale Panel */}
            {activeTab === 'b2b' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-[3px] bg-bg-sunken border border-rule space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[24px] font-mono font-bold text-ink">
                        ₹{product.b2bWholesaleRatePerKg}
                      </span>
                      <span className="text-[12px] font-mono text-ink-muted"> / kg</span>
                    </div>
                    <span className="text-[11px] font-mono text-success font-semibold">
                      Official MSP: ₹{product.officialMspRatePerKg}/kg
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-muted flex items-center justify-between pt-1 border-t border-rule/50">
                    <span>Minimum Order Quantity (MOQ):</span>
                    <span className="font-bold text-ink">{product.b2bMinimumOrderKg} kg</span>
                  </div>
                  <div className="text-[11px] font-mono text-ink-muted flex items-center justify-between">
                    <span>Standard Bulk Packaging:</span>
                    <span className="font-bold text-ink">{product.b2bPackaging.bagWeightKg} kg Gunny Bags</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-ink block">
                    Select Bulk Order Quantity (kg):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={product.b2bMinimumOrderKg}
                      max={product.totalVerifiedStockKg}
                      step={b2bBagWeight}
                      value={b2bQuantityKg}
                      onChange={(e) => setB2bQuantityKg(Math.max(product.b2bMinimumOrderKg, Number(e.target.value)))}
                      className="w-28 h-[40px] px-3 text-[14px] font-mono font-bold border border-rule rounded-[3px] bg-surface text-ink text-center"
                    />
                    <div className="text-[12px] font-mono text-ink-muted">
                      = <strong>{b2bBags}</strong> x {b2bBagWeight}kg bags ({b2bActualKg} kg total)
                    </div>
                  </div>
                </div>

                {/* Financial Transparency Box (Requirement 5) */}
                <div className="p-3.5 rounded-[3px] border border-rule bg-surface space-y-2 text-[12px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Base Merchandise Value:</span>
                    <span className="font-semibold text-ink">₹{b2bGross.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-accent">
                    <span>SAMAGNA Buyer Commission (3.5%):</span>
                    <span className="font-bold">₹{b2bCommission.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-subtle text-[11px]">
                    <span>Collector/SHG Settlement (100% MSP):</span>
                    <span>₹{b2bSellerSettlement.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-rule flex items-center justify-between font-bold text-ink text-[14px]">
                    <span>Total Commercial Payable:</span>
                    <span>₹{b2bGross.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddB2BToCart}
                    className="w-full h-[44px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
                  >
                    <Building2 size={16} />
                    <span>Place Wholesale Order ({b2bActualKg} kg)</span>
                  </button>
                  <Link
                    href={`/marketplace/rfq?produce=${encodeURIComponent(product.nameEnglish)}&batch=${product.primaryBatchCode}&qty=${b2bActualKg}`}
                    className="w-full h-[40px] rounded-[3px] border border-rule bg-surface hover:bg-bg-sunken text-ink text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText size={16} />
                    <span>Request Custom Enterprise Quote (RFQ)</span>
                  </Link>
                </div>
              </div>
            )}

            {/* B2C Retail Consumer Panel */}
            {activeTab === 'b2c' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-ink block">
                    Choose Pack Size:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {product.b2cOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedB2COptionId(opt.id)}
                        className={cn(
                          'p-3 rounded-[3px] border text-left transition-colors flex items-center justify-between',
                          selectedB2COptionId === opt.id
                            ? 'border-accent bg-accent/10 text-accent font-semibold'
                            : 'border-rule bg-surface text-ink hover:border-ink-subtle'
                        )}
                      >
                        <div>
                          <span className="font-bold text-[13px] block">{opt.sizeLabel}</span>
                          <span className="text-[11px] text-ink-muted">{opt.packagingDescription}</span>
                        </div>
                        <span className="text-[16px] font-mono font-bold text-ink">
                          ₹{opt.priceInr}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center justify-between pt-1">
                  <label className="text-[12px] font-semibold text-ink">
                    Quantity of Units:
                  </label>
                  <div className="flex items-center border border-rule rounded-[3px] bg-surface">
                    <button
                      type="button"
                      onClick={() => setB2cQuantity(Math.max(1, b2cQuantity - 1))}
                      className="w-9 h-8 flex items-center justify-center text-ink-muted hover:text-ink font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-[13px] text-ink">
                      {b2cQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setB2cQuantity(b2cQuantity + 1)}
                      className="w-9 h-8 flex items-center justify-center text-ink-muted hover:text-ink font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="p-3.5 rounded-[3px] border border-rule bg-bg-sunken space-y-1.5 text-[12px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Subtotal:</span>
                    <span className="font-semibold text-ink">₹{b2cSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-subtle text-[11px]">
                    <span>Includes 6% SAMAGNA Platform Fee:</span>
                    <span>₹{b2cCommission.toFixed(2)}</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddB2CToCart}
                  className="w-full h-[44px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
                >
                  <ShoppingBag size={16} />
                  <span>Add to Shopping Cart (₹{b2cSubtotal})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

