'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Package,
  Award,
  Truck,
} from 'lucide-react';

export default function StoreCartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItemsCount,
    getTotalGross,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-xs font-mono text-stone-500">
        Loading forest produce basket...
      </div>
    );
  }

  const subtotal = getTotalGross();
  const totalUnits = getTotalItemsCount();
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  const totalPayable = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/store" className="flex items-center space-x-2 text-xs font-semibold text-stone-700 hover:text-[#1B4332]">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>

          <Link href="/store" className="flex items-center">
            <SamagnaLogo variant="forest" size="sm" />
          </Link>

          <span className="text-xs text-stone-500 font-mono">
            {totalUnits} {totalUnits === 1 ? 'Item' : 'Items'}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {items.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-stone-900">Your basket is empty</h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Explore our curated seasonal harvest from the Similipal Biosphere Reserve.
            </p>
            <Link
              href="/store"
              className="inline-block mt-4 px-6 py-3 bg-[#1B4332] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#2D5A27] transition-colors"
            >
              Explore Natural Produce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Selected Forest Produce
                </span>
                <button
                  onClick={clearCart}
                  className="text-xs text-stone-400 hover:text-red-700 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 bg-white rounded-lg border border-stone-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.imagePath}
                        alt={item.productName}
                        className="w-16 h-16 shrink-0 object-cover rounded bg-stone-100 border border-stone-200"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-stone-900 text-sm">
                          {item.productName}
                        </h4>
                        <p className="text-xs italic text-stone-500">{item.scientificName}</p>
                        <p className="text-xs text-stone-600 mt-1">{item.packDescription}</p>
                        <span className="inline-block text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                          Lot: {item.batchCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-8">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-stone-300 rounded bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantityUnits - 1))}
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 font-bold text-xs"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 text-xs font-semibold text-stone-900 min-w-[2rem] text-center">
                          {item.quantityUnits}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantityUnits + 1)}
                          className="px-2.5 py-1 text-stone-600 hover:text-stone-900 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Price & Delete */}
                      <div className="text-right">
                        <div className="font-serif font-bold text-stone-900 text-sm">
                          ₹{item.subtotalInr}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          ₹{item.unitPriceInr} / unit
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-red-700 p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Financial Summary & Checkout Action */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-200 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalUnits} items):</span>
                    <span className="font-medium text-stone-900">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Carbon-Neutral Freight:</span>
                    <span className="font-medium text-stone-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 font-semibold">FREE (Above ₹500)</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>Statutory GST / Taxes:</span>
                    <span className="font-mono">Included</span>
                  </div>

                  <div className="flex justify-between text-stone-500">
                    <span>Marketplace Service Fee:</span>
                    <span className="font-mono">₹0.00 (Pilot)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                  <span className="font-serif font-bold text-stone-900 text-base">Total Payable</span>
                  <span className="font-serif font-bold text-stone-900 text-xl">₹{totalPayable}</span>
                </div>

                <Link
                  href="/store/checkout"
                  className="block w-full py-3.5 bg-[#1B4332] text-white text-center text-xs font-bold uppercase tracking-wider rounded hover:bg-[#2D5A27] transition-colors shadow-sm"
                >
                  Proceed to Checkout • ₹{totalPayable}
                </Link>

                <div className="pt-3 border-t border-stone-100 text-xs text-stone-500 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>100% Minimum Support Price protected for primary tribal gatherers.</span>
                  </div>
                  <div className="flex items-center space-x-2 text-stone-600">
                    <Truck className="w-4 h-4 flex-shrink-0" />
                    <span>Direct dispatch from Mayurbhanj Depot within 48 hours.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sticky Checkout Bar (Rule 5 & Phase 4 Standard) */}
        {items.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 shadow-lg flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-stone-500 uppercase">Total Payable</div>
              <div className="font-serif font-bold text-stone-900 text-lg">₹{totalPayable}</div>
            </div>
            <Link
              href="/store/checkout"
              className="touch-target px-6 py-2.5 bg-[#1B4332] text-white text-xs font-bold uppercase tracking-wider rounded-[6px] hover:bg-[#2D5A27] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

