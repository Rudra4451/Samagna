'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ConsumerProduct,
  ConsumerProductCategory,
} from '@/lib/consumerCommerce';
import { useCartStore } from '@/store/useCartStore';
import {
  ShoppingBag,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRight,
  ExternalLink,
  Leaf,
  Layers,
  Heart,
  Truck,
  Check,
  Clock,
  User,
} from 'lucide-react';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';

export default function StoreHomePage() {
  const { items, addItem } = useCartStore();
  const [products, setProducts] = useState<ConsumerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ConsumerProductCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const cartCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantityUnits, 0);
  }, [items]);

  useEffect(() => {
    async function loadCatalogue() {
      try {
        setLoading(true);
        const res = await fetch('/api/consumer/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to load store catalogue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (inStockOnly && (!p.stock.isAvailable || p.stock.availableUnits <= 0)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.scientificName.toLowerCase().includes(q) ||
          p.story.toLowerCase().includes(q) ||
          p.harvestCluster.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, inStockOnly, searchQuery]);

  const handleQuickAdd = (product: ConsumerProduct) => {
    if (!product.stock.isAvailable || product.stock.availableUnits <= 0) return;

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
      quantityUnits: 1,
      unitPriceInr: product.pricing.mrpInr,
    });

    setAddedToast(`Added ${product.title} to your basket`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1B4332] text-white px-4 py-3 rounded-md shadow-xl text-xs flex items-center space-x-2 animate-fade-in border border-[#2D5A27]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{addedToast}</span>
          <Link href="/store/cart" className="underline font-bold ml-2 hover:text-emerald-300">
            View Basket
          </Link>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-rule">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/store" className="flex items-center gap-2 group" aria-label="Samagna Forest Store">
            <SamagnaLogo variant="forest" size="md" showTagline />
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs uppercase tracking-wider font-semibold text-stone-700">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`hover:text-[#1B4332] transition-colors ${selectedCategory === 'ALL' ? 'text-[#1B4332] border-b-2 border-[#1B4332] pb-1' : ''}`}
            >
              All Produce
            </button>
            <button
              onClick={() => setSelectedCategory('WILD_HONEY')}
              className={`hover:text-[#1B4332] transition-colors ${selectedCategory === 'WILD_HONEY' ? 'text-[#1B4332] border-b-2 border-[#1B4332] pb-1' : ''}`}
            >
              Wild Honey
            </button>
            <button
              onClick={() => setSelectedCategory('NATURAL_EDIBLES')}
              className={`hover:text-[#1B4332] transition-colors ${selectedCategory === 'NATURAL_EDIBLES' ? 'text-[#1B4332] border-b-2 border-[#1B4332] pb-1' : ''}`}
            >
              Mahua & Edibles
            </button>
            <button
              onClick={() => setSelectedCategory('FOREST_SEEDS')}
              className={`hover:text-[#1B4332] transition-colors ${selectedCategory === 'FOREST_SEEDS' ? 'text-[#1B4332] border-b-2 border-[#1B4332] pb-1' : ''}`}
            >
              Forest Seeds
            </button>
            <button
              onClick={() => setSelectedCategory('MEDICINAL_BOTANICALS')}
              className={`hover:text-[#1B4332] transition-colors ${selectedCategory === 'MEDICINAL_BOTANICALS' ? 'text-[#1B4332] border-b-2 border-[#1B4332] pb-1' : ''}`}
            >
              Ayurvedic Botanicals
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/store/account"
              className="text-stone-700 hover:text-[#1B4332] transition-colors text-xs font-semibold flex items-center space-x-1.5"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">My Account</span>
            </Link>

            <Link
              href="/store/cart"
              className="relative p-2.5 bg-white border border-stone-300 rounded-full text-stone-800 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors shadow-sm"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2D5A27] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Editorial Showcase */}
      <section className="relative border-b border-stone-200 bg-[#F4EFE6] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#1B4332]/10 border border-[#1B4332]/20 text-[#1B4332] text-xs font-semibold uppercase tracking-wider">
              <Leaf className="w-3.5 h-3.5 text-[#2D5A27]" />
              <span>Similipal Biosphere Reserve • Ethical Wild Harvest</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-[1.1]">
              Pure nourishment from the ancient canopies of Odisha.
            </h1>
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-2xl font-light">
              Unblended, raw forest honey, sun-cured tree blossoms, and wild medicinal seeds gathered by indigenous tribal families.
              100% traceably authenticated and tested under certified state food laboratories.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-stone-600 font-medium">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2D5A27]" />
                <span>100% Gatherer MSP Guaranteed</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-[#2D5A27]" />
                <span>FSSAI & Lab NMR Assay Certified</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-[#2D5A27]" />
                <span>Carbon-Neutral Forest Dispatch</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Discovery Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none w-full md:w-auto">
            {[
              { id: 'ALL', label: 'All Products' },
              { id: 'WILD_HONEY', label: 'Wild Honey' },
              { id: 'NATURAL_EDIBLES', label: 'Mahua & Edibles' },
              { id: 'FOREST_SEEDS', label: 'Seeds & Nuts' },
              { id: 'MEDICINAL_BOTANICALS', label: 'Ayurvedic Botanicals' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#1B4332] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Stock Toggle */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search honey, seeds, cluster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-200 rounded-full text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span className="font-medium whitespace-nowrap">In Stock Only</span>
            </label>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <div className="py-24 text-center text-xs font-mono text-stone-500">
            Loading verified natural forest produce...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-base font-serif text-stone-600">No matching forest produce found.</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              className="mt-3 text-xs font-semibold text-[#1B4332] underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const isAvailable = product.stock.isAvailable && product.stock.availableUnits > 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between group"
                >
                  {/* Card Image & Badges */}
                  <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                    <img
                      src={product.heroImage}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 text-[#1B4332] border border-stone-200 shadow-sm backdrop-blur-sm">
                        {product.categoryLabel}
                      </span>
                    </div>

                    {!isAvailable && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-3 py-1 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider rounded border border-stone-700">
                          Seasonal Stock Depleted
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                        {product.harvestCluster}
                      </div>

                      <Link href={`/store/${product.slug}`} className="block mt-1">
                        <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-[#1B4332] transition-colors leading-snug">
                          {product.title}
                        </h3>
                      </Link>

                      <div className="mt-1 flex items-baseline space-x-2 text-xs">
                        <span className="font-serif italic text-stone-500">{product.scientificName}</span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-600">{product.odiaName}</span>
                      </div>

                      <p className="mt-3 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {product.tagline}
                      </p>

                      {/* Packaging & Stock Pill */}
                      <div className="mt-4 flex items-center justify-between text-xs text-stone-500 border-t border-stone-100 pt-3">
                        <span>
                          Pack: <strong className="text-stone-800">{product.packaging.netQuantity}</strong> ({product.packaging.type})
                        </span>
                        <span>
                          {isAvailable ? (
                            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>{product.stock.availableUnits} Available</span>
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">Sold Out</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Pricing & Action */}
                    <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-serif font-bold text-stone-900">
                          ₹{product.pricing.mrpInr}
                        </div>
                        <div className="text-[10px] text-emerald-800 font-medium">
                          ₹{product.pricing.fairTradeMspShareInr} to Primary Gatherer
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/store/${product.slug}`}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-[#1B4332] transition-colors"
                        >
                          Story & Lab
                        </Link>

                        <button
                          onClick={() => handleQuickAdd(product)}
                          disabled={!isAvailable}
                          className={`px-4 py-2 rounded text-xs font-semibold transition-colors shadow-sm ${
                            isAvailable
                              ? 'bg-[#1B4332] text-white hover:bg-[#2D5A27]'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          {isAvailable ? 'Add to Basket' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Provenance Story Section */}
      <section className="bg-white border-t border-stone-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h2 className="text-3xl font-serif font-bold text-stone-900">
              The Journey of Authentic Forest Custody
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed font-light">
              Unlike commercial commodity brokers, Samagna guarantees end-to-end provenance. Every jar of wild honey and every pouch of dried Mahua is tied to a documented physical harvest lot.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2 p-5 bg-[#FAF8F5] rounded-lg border border-stone-200">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-serif font-bold text-stone-900">Ethical Wild Harvest</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Gathered by Santhal and Kolha indigenous collectives using time-honoured non-destructive canopy extraction.
              </p>
            </div>

            <div className="space-y-2 p-5 bg-[#FAF8F5] rounded-lg border border-stone-200">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-serif font-bold text-stone-900">SHG Primary Testing</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Women Self-Help Groups at Karanjia perform initial refractometer moisture assays and hygienic gravity filtration.
              </p>
            </div>

            <div className="space-y-2 p-5 bg-[#FAF8F5] rounded-lg border border-stone-200">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-serif font-bold text-stone-900">Laboratory Assay</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Certified by State Food Testing Laboratories: 0% adulterants, NMR sugar profiling, and zero synthetic pesticides.
              </p>
            </div>

            <div className="space-y-2 p-5 bg-[#FAF8F5] rounded-lg border border-stone-200">
              <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-serif font-bold text-stone-900">Tamper-Evident Dispatch</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Sealed under induction foil in lead-free glass jars and shipped directly from the Baripada Central Depot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 py-12 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-serif text-xl font-bold text-white block">SAMAGNA</span>
            <p className="mt-2 text-stone-400 leading-relaxed">
              Institutional Minor Forest Produce operations & verified consumer marketplace.
            </p>
            <p className="mt-3 text-stone-500 font-mono text-[11px]">
              FSSAI Lic: 12023999000124 • TDCCOL
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Consumer Produce</h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/store" className="hover:text-white">Wild Similipal Honey</Link></li>
              <li><Link href="/store" className="hover:text-white">Solar-Cured Mahua Petals</Link></li>
              <li><Link href="/store" className="hover:text-white">Wild Chironji Kernels</Link></li>
              <li><Link href="/store" className="hover:text-white">Ayurvedic Whole Harida</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Consumer Trust & Policy</h4>
            <ul className="space-y-2 text-stone-400">
              <li><span className="text-stone-300">7-Day Tamper Seal Policy</span></li>
              <li><span className="text-stone-300">Carbon-Neutral Freight Dispatch</span></li>
              <li><Link href="/store/account" className="hover:text-white">Grievance & Returns Portal</Link></li>
              <li><Link href="/verify" className="hover:text-white">Batch QR Lot Verification</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white uppercase tracking-wider mb-3">Grievance & Support</h4>
            <p className="text-stone-400 leading-relaxed">
              TDCCOL Forest Produce Directorate, Mayurbhanj Complex.
            </p>
            <p className="mt-2 text-stone-300">support@samagna.odisha.gov.in</p>
            <p className="text-stone-300">+91 674 254-XXXX (10 AM - 5 PM IST)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

