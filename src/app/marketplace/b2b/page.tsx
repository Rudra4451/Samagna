'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  INITIAL_MARKETPLACE_CATALOGUE,
  MarketplaceProduct,
  BusinessIndustry,
} from '@/lib/marketplace';
import { useCartStore } from '@/store/useCartStore';
import {
  Building2,
  ShieldCheck,
  Warehouse,
  QrCode,
  FileText,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function B2BMarketplacePage() {
  const { addItem } = useCartStore();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedQuantities, setSelectedQuantities] = useState<{ [productId: string]: number }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const industries: { label: string; value: string; desc: string }[] = [
    { label: 'All Industries', value: 'ALL', desc: 'All verified wholesale commodities' },
    { label: 'Ayurvedic Medicine', value: 'AYURVEDIC_MEDICINE', desc: 'Dabur, Baidyanath, Patanjali formulations' },
    { label: 'Pharmaceutical', value: 'PHARMACEUTICAL', desc: 'Standardized herbal extractors & active compounds' },
    { label: 'Food Processing', value: 'FOOD_PROCESSING', desc: 'Confectionery, baking, beverages & syrups' },
    { label: 'Cosmetic & Emollients', value: 'COSMETIC', desc: 'Natural oils, butter substitutes, skincare' },
    { label: 'Exporters & Wholesale', value: 'EXPORTER', desc: 'International consignments & domestic mandis' },
  ];

  const b2bProducts = INITIAL_MARKETPLACE_CATALOGUE.filter((p) => {
    if (!p.isAvailableForB2B) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.nameEnglish.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.primaryBatchCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOrderBulk = (product: MarketplaceProduct) => {
    const minMoq = product.b2bMinimumOrderKg;
    const bagWeight = product.b2bPackaging.bagWeightKg;
    const requestedKg = selectedQuantities[product.id] || minMoq;

    if (requestedKg > product.totalVerifiedStockKg) {
      setToastMessage(`Requested quantity (${requestedKg} kg) exceeds available warehouse stock (${product.totalVerifiedStockKg} kg).`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const bags = Math.ceil(requestedKg / bagWeight);
    const actualKg = bags * bagWeight;

    addItem({
      productId: product.id,
      productName: product.nameEnglish,
      scientificName: product.scientificName,
      imagePath: product.imagePath,
      batchCode: product.primaryBatchCode,
      depotId: product.destinationDepotId,
      depotName: product.destinationDepotName,
      buyerType: 'B2B',
      packDescription: `${bags} x ${bagWeight}kg Gunny Bags (${actualKg} kg Wholesale Consignment)`,
      unitWeightKg: actualKg,
      quantityUnits: 1,
      unitPriceInr: product.b2bWholesaleRatePerKg * actualKg,
    });

    setToastMessage(`Added ${actualKg} kg bulk order for ${product.nameEnglish} to cart.`);
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

      {/* Header Banner */}
      <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-mono font-bold">
              <Building2 size={14} />
              <span>COMMERCIAL B2B BULK SOURCING PORTAL</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold text-ink leading-tight">
              Industrial Bulk Forest Produce Procurement
            </h1>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              Serving pharmaceutical manufacturers, ayurvedic pharmacies, food processing enterprises, and wholesale exporters. Direct institutional allocations from government collection centres and the Baripada Central Depôt with guaranteed botanical provenance and transparent commercial terms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/marketplace/register"
              className="px-4 py-2.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <Building2 size={16} />
              <span>Verify Company GSTIN</span>
            </Link>
            <Link
              href="/marketplace/rfq"
              className="px-4 py-2.5 rounded-[3px] border border-rule bg-surface hover:bg-bg-sunken text-ink text-[13px] font-semibold flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              <span>Submit RFQ Quote</span>
            </Link>
          </div>
        </div>

        {/* B2B Target Buyer Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {industries.map((ind) => (
            <button
              key={ind.value}
              type="button"
              onClick={() => setSelectedIndustry(ind.value)}
              className={cn(
                'p-2.5 rounded-[3px] border text-left transition-colors flex flex-col justify-between',
                selectedIndustry === ind.value
                  ? 'border-accent bg-accent/10 text-accent font-semibold'
                  : 'border-rule bg-bg-sunken text-ink-muted hover:text-ink hover:border-ink-subtle'
              )}
            >
              <span className="text-[11px] font-bold block">{ind.label}</span>
              <span className="text-[10px] text-ink-subtle line-clamp-1 mt-1">{ind.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Specs Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bulk produce or batch code..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
          />
        </div>

        <div className="text-[12px] font-mono text-ink-muted">
          Showing <span className="font-bold text-ink">{b2bProducts.length}</span> Verified Commercial Lots
        </div>
      </div>

      {/* Bulk Inventory Table / Matrix */}
      <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
        <div className="p-4 border-b border-rule bg-bg-sunken flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse size={16} className="text-accent" />
            <h2 className="text-[14px] font-heading font-bold text-ink">
              Live Central Warehouse Bulk Inventory Roster
            </h2>
          </div>
          <span className="text-[11px] font-mono text-ink-muted">
            All lots stored in Baripada Central Depôt (BRP-01)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-rule bg-surface font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3.5">Produce & Botanical Spec</th>
                <th scope="col" className="p-3.5">Batch & QR</th>
                <th scope="col" className="p-3.5">Depôt Bay & Origin</th>
                <th scope="col" className="p-3.5">Lab Moisture / Grade</th>
                <th scope="col" className="p-3.5">Available Stock</th>
                <th scope="col" className="p-3.5">Wholesale Rate</th>
                <th scope="col" className="p-3.5">Order Quantity (kg)</th>
                <th scope="col" className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-sans">
              {b2bProducts.map((product) => {
                const minMoq = product.b2bMinimumOrderKg;
                const currentQty = selectedQuantities[product.id] || minMoq;
                const estimatedSubtotal = currentQty * product.b2bWholesaleRatePerKg;

                return (
                  <tr key={product.id} className="hover:bg-bg-sunken/50 transition-colors">
                    {/* Produce */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-[2px] overflow-hidden border border-rule shrink-0">
                          <Image
                            src={product.imagePath}
                            alt={product.nameEnglish}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/marketplace/product/${product.slug}`}
                            className="font-bold text-ink hover:text-accent flex items-center gap-1"
                          >
                            <span>{product.nameEnglish}</span>
                          </Link>
                          <span className="text-[11px] font-mono text-ink-muted italic block">
                            {product.scientificName}
                          </span>
                          <span className="text-[10px] font-mono text-ink-subtle">
                            Packaging: {product.b2bPackaging.packagingMaterial}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Batch */}
                    <td className="p-3.5 font-mono text-[12px]">
                      <Link
                        href={`/verify/${product.primaryBatchCode}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-accent/10 border border-accent/30 text-accent font-bold hover:bg-accent hover:text-white transition-colors"
                        title="View Public Ledger & QR Stencil Verification"
                      >
                        <QrCode size={11} />
                        <span>#{product.primaryBatchCode}</span>
                      </Link>
                      <span className="text-[10px] text-ink-subtle block mt-0.5">
                        Seal: {product.sealTagId}
                      </span>
                    </td>

                    {/* Origin */}
                    <td className="p-3.5">
                      <div className="text-[12px]">
                        <span className="font-semibold text-ink block">{product.destinationDepotName}</span>
                        <span className="text-ink-muted text-[11px]">
                          {product.originGramPanchayat}, {product.originBlock}
                        </span>
                        <span className="text-[10px] text-ink-subtle block">
                          Supplied by: {product.shgSupplierName}
                        </span>
                      </div>
                    </td>

                    {/* Quality Specs */}
                    <td className="p-3.5 font-mono text-[12px]">
                      <span className="px-1.5 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-block">
                        {product.qualityGrade.split('-')[0].trim()}
                      </span>
                      <span className="text-ink-muted block text-[11px] mt-0.5">
                        Moisture: <strong>{product.labCertifiedMoisturePercent}%</strong>
                      </span>
                    </td>

                    {/* Available Stock */}
                    <td className="p-3.5 font-mono">
                      <span className="text-[14px] font-bold text-ink">
                        {product.totalVerifiedStockKg} kg
                      </span>
                      <span className="text-[10px] text-success block">
                        Verified & Saleable
                      </span>
                    </td>

                    {/* Wholesale Rate */}
                    <td className="p-3.5 font-mono">
                      <div className="text-[15px] font-bold text-ink">
                        ₹{product.b2bWholesaleRatePerKg}
                        <span className="text-[11px] text-ink-muted font-normal"> / kg</span>
                      </div>
                      <span className="text-[10px] text-ink-subtle block">
                        MOQ: {product.b2bMinimumOrderKg} kg
                      </span>
                    </td>

                    {/* Quantity Selector */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 w-32">
                        <input
                          type="number"
                          min={product.b2bMinimumOrderKg}
                          max={product.totalVerifiedStockKg}
                          step={product.b2bPackaging.bagWeightKg}
                          value={currentQty}
                          onChange={(e) =>
                            setSelectedQuantities((prev) => ({
                              ...prev,
                              [product.id]: Number(e.target.value),
                            }))
                          }
                          className="w-20 h-[30px] px-2 text-[12px] font-mono border border-rule rounded-[2px] bg-surface text-ink text-center"
                        />
                        <span className="text-[11px] font-mono text-ink-muted">kg</span>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted block mt-0.5">
                        Est: ₹{estimatedSubtotal.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOrderBulk(product)}
                          className="h-[30px] px-3 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[11px] font-semibold flex items-center gap-1 transition-colors whitespace-nowrap"
                        >
                          <Building2 size={12} />
                          <span>Order Bulk</span>
                        </button>
                        <Link
                          href={`/marketplace/rfq?produce=${encodeURIComponent(product.nameEnglish)}&batch=${product.primaryBatchCode}&qty=${currentQty}`}
                          className="h-[30px] px-2.5 rounded-[3px] border border-rule bg-surface hover:bg-bg text-ink text-[11px] font-medium flex items-center justify-center gap-1"
                          title="Submit Request for Quotation"
                        >
                          <FileText size={12} />
                          <span>RFQ</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Assurance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="p-5 border border-rule rounded-[4px] bg-surface space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold">
            <ShieldCheck size={18} />
            <h3 className="text-[14px] font-heading font-bold text-ink">
              Company GSTIN & Pan-India Dispatch
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted leading-relaxed">
            All commercial invoices include valid institutional GST, E-Waybill credentials, and transit passes issued by the Baripada District Procurement Desk.
          </p>
        </div>

        <div className="p-5 border border-rule rounded-[4px] bg-surface space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold">
            <QrCode size={18} />
            <h3 className="text-[14px] font-heading font-bold text-ink">
              End-to-End Batch QR Provenance
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted leading-relaxed">
            Every jute gunny bag carries a tamper-evident seal and barcode matching the official electronic custody ledger, satisfying NMPB and AYUSH compliance.
          </p>
        </div>

        <div className="p-5 border border-rule rounded-[4px] bg-surface space-y-2">
          <div className="flex items-center gap-2 text-success font-bold">
            <TrendingUp size={18} />
            <h3 className="text-[14px] font-heading font-bold text-ink">
              Transparent 3.5% Platform Commission
            </h3>
          </div>
          <p className="text-[12px] text-ink-muted leading-relaxed">
            Platform revenue is earned via an open 3.5% buyer trade commission. Gatherers receive 100% of their DBT MSP entitlement with zero hidden deductions.
          </p>
        </div>
      </div>
    </div>
  );
}

