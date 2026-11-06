'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  INITIAL_MARKETPLACE_CATALOGUE,
  MarketplaceProduct,
} from '@/lib/marketplace';
import { useCartStore } from '@/store/useCartStore';
import {
  ShoppingBag,
  ShieldCheck,
  Warehouse,
  QrCode,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  Package,
  Heart,
  Star,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function B2CMarketplacePage() {
  const { addItem } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPackOption, setSelectedPackOption] = useState<{ [productId: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['ALL', 'Honey', 'Forest Seeds', 'Medicinal Herbs', 'Flowers & Pods'];

  const b2cProducts = INITIAL_MARKETPLACE_CATALOGUE.filter((p) => {
    if (!p.isAvailableForB2C) return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.nameEnglish.toLowerCase().includes(q) ||
        p.scientificName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleAddToCart = (product: MarketplaceProduct) => {
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

    setToastMessage(`Added 1 x ${product.nameEnglish} (${option.sizeLabel}) to cart.`);
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
            Open Cart →
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold">
              <ShoppingBag size={14} />
              <span>CONSUMER RETAIL STORE · PURE FOREST HARVEST</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-heading font-bold text-ink leading-tight">
              Direct-from-Forest Consumer Store
            </h1>
            <p className="text-[14px] text-ink-muted leading-relaxed">
              Order laboratory-tested wild honey, authentic dried flowers, whole nuts, and traditional ayurvedic herbs. Packed in eco-friendly jars and sealed pouches at the Baripada Central Processing Unit. Every purchase directly empowers Mayurbhanj tribal self-help groups.
            </p>
          </div>

          <div className="p-4 rounded-[3px] border border-rule bg-bg-sunken sm:w-80 shrink-0 space-y-2">
            <div className="flex items-center gap-2 text-accent font-bold text-[13px]">
              <Sparkles size={16} />
              <span>Consumer Purity Guarantee</span>
            </div>
            <ul className="text-[11px] text-ink-muted space-y-1.5 font-mono">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-success" />
                <span>100% Unadulterated Wild Harvest</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-success" />
                <span>Zero Artificial Preservatives</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-success" />
                <span>Batch QR Traceability on Every Pack</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="pt-4 border-t border-rule flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-[12px] border transition-colors whitespace-nowrap',
                  selectedCategory === cat
                    ? 'border-accent bg-accent/10 text-accent font-bold'
                    : 'border-rule bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle'
                )}
              >
                {cat === 'ALL' ? 'All Consumer Products' : cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full h-[36px] pl-9 pr-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {b2cProducts.map((product) => {
          const currentPackId = selectedPackOption[product.id] || product.b2cOptions[0]?.id;
          const currentPack =
            product.b2cOptions.find((o) => o.id === currentPackId) || product.b2cOptions[0];

          return (
            <div
              key={product.id}
              className="border border-rule rounded-[4px] bg-surface flex flex-col overflow-hidden hover:border-ink-subtle transition-all group"
            >
              {/* Photo */}
              <div className="relative h-52 w-full bg-bg-sunken border-b border-rule overflow-hidden">
                <Image
                  src={product.imagePath}
                  alt={product.nameEnglish}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-[2px] bg-black/70 backdrop-blur text-white text-[10px] font-mono font-bold">
                    {product.category}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <Link
                    href={`/verify/${product.primaryBatchCode}`}
                    className="px-2 py-0.5 rounded-[2px] bg-white/95 text-accent text-[10px] font-mono font-bold border border-rule flex items-center gap-1 shadow-sm hover:bg-accent hover:text-white transition-colors"
                  >
                    <QrCode size={11} />
                    <span>#{product.primaryBatchCode}</span>
                  </Link>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-heading font-bold text-[18px] text-ink group-hover:text-accent transition-colors">
                      <Link href={`/marketplace/product/${product.slug}`}>
                        {product.nameEnglish}
                      </Link>
                    </h3>
                    <span className="font-odia text-[13px] text-ink-muted">
                      {product.nameOdia}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-ink-muted italic">
                    {product.scientificName} · {product.originGramPanchayat}
                  </p>

                  <p className="text-[12px] text-ink-muted line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Highlights */}
                  <div className="pt-2 flex flex-wrap gap-1">
                    {product.benefits.slice(0, 2).map((benefit, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted"
                      >
                        ✓ {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Packaging Selector & Price */}
                <div className="pt-3 border-t border-rule space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-ink-muted block">
                      Choose Packaging Size:
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {product.b2cOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setSelectedPackOption((prev) => ({
                              ...prev,
                              [product.id]: opt.id,
                            }))
                          }
                          className={cn(
                            'p-1.5 rounded-[2px] border text-left text-[11px] font-mono transition-colors',
                            currentPackId === opt.id
                              ? 'border-accent bg-accent/10 text-accent font-bold'
                              : 'border-rule bg-surface text-ink-muted hover:border-ink-subtle'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt.sizeLabel}</span>
                            <span className="font-bold text-ink">₹{opt.priceInr}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[20px] font-mono font-bold text-ink">
                        ₹{currentPack?.priceInr}
                      </span>
                      <span className="text-[11px] text-ink-muted ml-1 font-mono">
                        ({currentPack?.sizeLabel})
                      </span>
                      <span className="text-[10px] text-ink-subtle block font-mono">
                        Incl. 6% platform commission
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="h-[36px] px-4 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors shadow-none"
                    >
                      <ShoppingBag size={14} />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

