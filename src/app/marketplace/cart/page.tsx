'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import {
  ShoppingBag,
  Building2,
  Trash2,
  Warehouse,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Package,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceCartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItemsCount,
    getTotalKg,
    getTotalGross,
    getTotalCommission,
    getTotalSellerSettlement,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[13px] font-mono text-ink-muted">
        Loading commercial cart items...
      </div>
    );
  }

  const totalUnits = getTotalItemsCount();
  const totalKg = getTotalKg();
  const grossAmount = getTotalGross();
  const commissionAmount = getTotalCommission();
  const sellerSettlement = getTotalSellerSettlement();

  const isB2BOnly = items.length > 0 && items.every((i) => i.buyerType === 'B2B');
  const isMixed = items.some((i) => i.buyerType === 'B2B') && items.some((i) => i.buyerType === 'B2C');
  const estimatedShipping = isB2BOnly ? 0 : 50;
  const finalPayable = grossAmount + estimatedShipping;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-rule pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
            Commercial Procurement
          </span>
          <h1 className="text-[26px] font-heading font-bold text-ink mt-0.5">
            Commercial Cart & Order Staging
          </h1>
        </div>
        <Link
          href="/marketplace"
          className="text-[12px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Continue Sourcing</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-16 border border-rule rounded-[4px] bg-surface text-center space-y-4">
          <ShoppingBag size={48} className="mx-auto text-ink-muted opacity-40" />
          <h2 className="text-[20px] font-heading font-bold text-ink">
            Your Commercial Cart is Empty
          </h2>
          <p className="text-[13px] text-ink-muted max-w-md mx-auto">
            You have not selected any verified forest produce yet. Browse our B2B wholesale commodities or consumer packaged goods to start.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/marketplace/b2b"
              className="px-4 py-2 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-semibold flex items-center gap-1.5"
            >
              <Building2 size={14} />
              <span>Browse B2B Wholesale</span>
            </Link>
            <Link
              href="/marketplace/b2c"
              className="px-4 py-2 rounded-[3px] border border-rule bg-surface hover:bg-bg-sunken text-ink text-[12px] font-semibold flex items-center gap-1.5"
            >
              <ShoppingBag size={14} />
              <span>Browse Consumer Shop</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="border border-rule rounded-[4px] bg-surface overflow-hidden shadow-none">
              <div className="p-3.5 border-b border-rule bg-bg-sunken flex items-center justify-between text-[12px] font-mono">
                <span className="font-semibold text-ink">
                  {totalUnits} Item{totalUnits > 1 ? 's' : ''} staged ({totalKg} kg total produce)
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-danger hover:underline text-[11px]"
                >
                  Clear All Items
                </button>
              </div>

              <div className="divide-y divide-rule">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-16 rounded-[3px] overflow-hidden border border-rule shrink-0 bg-bg-sunken">
                        <Image
                          src={item.imagePath}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-[15px]">
                            {item.productName}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] border font-bold',
                              item.buyerType === 'B2B'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            )}
                          >
                            {item.buyerType}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-ink-muted">
                          <span>{item.packDescription}</span>
                          <span className="text-ink-subtle mx-1">·</span>
                          <Link
                            href={`/verify/${item.batchCode}`}
                            className="text-accent hover:underline font-bold inline-flex items-center gap-0.5"
                          >
                            <QrCode size={11} />
                            <span>Lot #{item.batchCode}</span>
                          </Link>
                        </div>
                        <div className="text-[10px] font-mono text-ink-subtle">
                          Depot: {item.depotName}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-rule/50">
                      <div className="flex items-center border border-rule rounded-[3px] bg-surface">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantityUnits - 1)}
                          className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink font-bold text-[12px]"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-[12px] text-ink">
                          {item.quantityUnits}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantityUnits + 1)}
                          className="w-7 h-7 flex items-center justify-center text-ink-muted hover:text-ink font-bold text-[12px]"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-ink text-[15px]">
                          ₹{item.subtotalInr.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono text-ink-muted">
                          (₹{item.unitPriceInr} / unit)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-[3px] text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warehouse Stock Deductions Guarantee */}
            <div className="p-4 border border-rule rounded-[4px] bg-surface flex items-start gap-3">
              <Warehouse size={18} className="text-accent shrink-0 mt-0.5" />
              <div className="space-y-1 text-[12px]">
                <span className="font-bold text-ink block">
                  Automatic Warehouse Stock Synchronization
                </span>
                <p className="text-ink-muted leading-relaxed">
                  Upon order placement, SAMAGNA immediately records an outward stock allocation against the designated batch in the Baripada Central Depôt ledger. This prevents double allocation while leaving the original government procurement records 100% unaltered.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary & Financial Breakdown (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-5 shadow-none sticky top-20">
              <h2 className="font-heading font-bold text-[16px] text-ink border-b border-rule pb-3">
                Order Financial Summary
              </h2>

              <div className="space-y-2.5 text-[12px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Gross Produce Value:</span>
                  <span className="font-semibold text-ink">₹{grossAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-accent">
                  <span className="flex items-center gap-1">
                    <span>Platform Commission:</span>
                  </span>
                  <span className="font-bold">₹{commissionAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-ink-subtle text-[11px] pl-2 border-l border-accent/40">
                  <span>Collector Entitlement (100% MSP):</span>
                  <span>₹{sellerSettlement.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">
                    {isB2BOnly ? 'Transit Freight Loading:' : 'Estimated Shipping & Packaging:'}
                  </span>
                  <span className="text-ink font-semibold">
                    {estimatedShipping === 0 ? 'Complimentary Depot Pickup' : `₹${estimatedShipping}`}
                  </span>
                </div>

                <div className="pt-3 border-t border-rule flex items-baseline justify-between">
                  <div>
                    <span className="font-heading font-bold text-ink text-[16px]">Total Payable:</span>
                    <span className="text-[10px] text-ink-muted block">All taxes & fees included</span>
                  </div>
                  <span className="font-mono font-bold text-ink text-[22px]">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => router.push('/marketplace/checkout')}
                className="w-full h-[46px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
              >
                <span>Proceed to Commercial Checkout</span>
                <ArrowRight size={15} />
              </button>

              {/* Safe Demo Notice */}
              <div className="p-3 rounded-[3px] bg-bg-sunken border border-rule text-[11px] font-mono text-ink-muted space-y-1">
                <div className="flex items-center gap-1.5 text-accent font-bold">
                  <ShieldCheck size={14} />
                  <span>Verified Commercial Checkout</span>
                </div>
                <p>
                  Demonstration gateway available. Orders are committed to the local warehouse inventory ledger with traceable invoice generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

