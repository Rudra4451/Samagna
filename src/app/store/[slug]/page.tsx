'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ConsumerProduct } from '@/lib/consumerCommerce';
import { useCartStore } from '@/store/useCartStore';
import {
  ShoppingBag,
  ShieldCheck,
  Award,
  Truck,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Info,
  Clock,
  Sparkles,
  Package,
  Layers,
  Heart,
  Share2,
} from 'lucide-react';

export default function StoreProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<ConsumerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/consumer/products?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
        } else {
          setErrorMsg('Product not found in catalogue.');
        }
      } catch (err) {
        setErrorMsg('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-xs font-mono text-stone-500">
        Loading verified product chronicle...
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-serif font-bold text-stone-900">Product Not Found</h2>
        <p className="text-xs text-stone-600 mt-2">{errorMsg || 'The requested product record does not exist.'}</p>
        <Link href="/store" className="mt-4 px-4 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded">
          Return to Store
        </Link>
      </div>
    );
  }

  const isAvailable = product.stock.isAvailable && product.stock.availableUnits > 0;
  const maxAvailable = product.stock.availableUnits;

  const handleAddToCart = () => {
    if (!isAvailable) return;

    addItem({
      productId: product.id,
      productName: product.title,
      scientificName: product.scientificName,
      imagePath: product.heroImage,
      batchCode: product.compliance.lotReference,
      depotId: 'BRP-01',
      depotName: `${product.harvestCluster} (TDCCOL Staging Bay)`,
      buyerType: 'B2C',
      packDescription: `${product.packaging.netQuantity} (${product.packaging.type})`,
      unitWeightKg: product.packaging.weightGrams / 1000.0,
      quantityUnits: quantity,
      unitPriceInr: product.pricing.mrpInr,
    });

    setAddedToast(`Added ${quantity} unit(s) of ${product.title} to your basket.`);
    setTimeout(() => setAddedToast(null), 3500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Toast */}
      {addedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1B4332] text-white px-4 py-3 rounded-md shadow-xl text-xs flex items-center space-x-2 animate-fade-in border border-[#2D5A27]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{addedToast}</span>
          <Link href="/store/cart" className="underline font-bold ml-2 hover:text-emerald-300">
            View Basket
          </Link>
        </div>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/store" className="flex items-center space-x-2 text-xs font-semibold text-stone-700 hover:text-[#1B4332]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Produce</span>
          </Link>

          <Link href="/store" className="font-serif text-lg font-bold text-[#1B4332]">
            SAMAGNA FOREST STORE
          </Link>

          <Link href="/store/cart" className="relative p-2 text-stone-700 hover:text-[#1B4332]">
            <ShoppingBag className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Product Hero Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Visual Presentation */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shadow-sm relative">
              <img
                src={product.heroImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#1B4332] border border-stone-200 shadow-sm">
                  {product.categoryLabel}
                </span>
              </div>
            </div>

            {/* Quality & Batch Authentication Plate */}
            <div className="p-4 bg-white rounded-lg border border-stone-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 flex items-center space-x-1.5">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>State Laboratory Assay Purity</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {product.compliance.labPurityCertificateRef}
                </span>
              </div>
              <p className="text-stone-600">{product.compliance.labPurityDetails}</p>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-stone-500">Physical Harvest Lot:</span>
                <a
                  href={`/verify/${encodeURIComponent(product.compliance.lotReference)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-800 underline flex items-center space-x-1 hover:text-emerald-900"
                >
                  <span>{product.compliance.lotReference}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Commercial & Narrative Details */}
          <div className="space-y-6">
            <div>
              <div className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                {product.harvestCluster} • {product.harvestSeason}
              </div>
              <h1 className="mt-1 text-3xl sm:text-4xl font-serif font-bold text-stone-900 leading-tight">
                {product.title}
              </h1>

              <div className="mt-2 flex items-baseline space-x-3 text-sm">
                <span className="font-serif italic text-stone-600">{product.scientificName}</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-700 font-medium">{product.odiaName}</span>
              </div>

              <p className="mt-4 text-sm text-stone-700 leading-relaxed font-light">
                {product.tagline}
              </p>
            </div>

            {/* Price & Primary Gatherer Share Banner */}
            <div className="p-4 bg-[#F4EFE6] rounded-lg border border-[#E8DCC4] space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-stone-500 uppercase tracking-wider">Retail MRP</span>
                  <div className="text-3xl font-serif font-bold text-stone-900">
                    ₹{product.pricing.mrpInr}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">Net Quantity</span>
                  <span className="text-sm font-semibold text-stone-900">{product.packaging.netQuantity}</span>
                </div>
              </div>

              {/* Transparent Financial Split */}
              <div className="pt-2 border-t border-stone-200/70 text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>Primary Tribal Gatherer Share (100% MSP):</span>
                  <span className="font-bold text-emerald-800">₹{product.pricing.fairTradeMspShareInr}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHG Aggregation, Lab Assay & Induction Seal:</span>
                  <span>₹{product.pricing.packagingAndTestingShareInr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature-Controlled Freight Allocation:</span>
                  <span>₹{product.pricing.logisticsShareInr}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>State Platform Facilitation Fee (Pilot):</span>
                  <span className="font-mono">₹0.00 (Waived)</span>
                </div>
              </div>
            </div>

            {/* Inventory & Quantity Selection */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600">Inventory Status:</span>
                {isAvailable ? (
                  <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>{maxAvailable} Units in Central Warehouse Bay</span>
                  </span>
                ) : (
                  <span className="text-red-700 font-semibold">Seasonal Stock Depleted</span>
                )}
              </div>

              {isAvailable && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-stone-300 rounded bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-stone-600 hover:text-stone-900 font-bold"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-xs font-semibold text-stone-900 min-w-[2.5rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(maxAvailable, quantity + 1))}
                      className="px-3 py-2 text-stone-600 hover:text-stone-900 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-6 bg-[#1B4332] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#2D5A27] transition-colors shadow-sm"
                  >
                    Add to Basket • ₹{product.pricing.mrpInr * quantity}
                  </button>
                </div>
              )}
            </div>

            {/* Intermediary Disclosure & Provenance Accordion */}
            <div className="space-y-3 pt-4 border-t border-stone-200 text-xs">
              <div>
                <h4 className="font-semibold text-stone-900 uppercase tracking-wider mb-1">
                  Forest Harvesting Chronicle
                </h4>
                <p className="text-stone-600 leading-relaxed font-light">{product.story}</p>
              </div>

              <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-1.5">
                <div className="font-semibold text-stone-800">Truth in Sourcing Disclosure:</div>
                <p className="text-stone-600 leading-relaxed">{product.intermediaryDisclosure}</p>
                <div className="pt-1 text-[11px] text-stone-500">
                  Producer Org: <strong>{product.sellerOrg.name}</strong> • Reg: {product.sellerOrg.registrationNumber}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-stone-500 block">Packaging Specification:</span>
                  <span className="font-medium text-stone-800">{product.packaging.materialDescription}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Shelf Life & Storage:</span>
                  <span className="font-medium text-stone-800">{product.shelfLifeMonths} Months • {product.storageInstructions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

