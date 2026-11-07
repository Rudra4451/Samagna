'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Truck,
  Lock,
  CreditCard,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export default function StoreCheckoutPage() {
  const router = useRouter();
  const {
    items,
    clearCart,
    getTotalItemsCount,
    getTotalGross,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  // Customer shipping form
  const [formData, setFormData] = useState({
    customerName: 'Ananya Mohapatra',
    customerEmail: 'ananya.mohapatra@gmail.com',
    customerPhone: '+91-9437012345',
    street: 'Plot 214, Saheed Nagar, Near Durga Mandap',
    city: 'Bhubaneswar',
    district: 'Khurda',
    state: 'Odisha',
    pincode: '751007',
    paymentMethod: 'DEMO_COMMERCIAL_GATEWAY',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6 text-xs font-mono text-stone-500">
        Loading checkout console...
      </div>
    );
  }

  const subtotal = getTotalGross();
  const totalUnits = getTotalItemsCount();
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  const totalPayable = subtotal + shippingFee;

  // Handle Order Submit
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (items.length === 0) {
        throw new Error('Your cart is empty. Please add items before placing an order.');
      }

      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
        },
        items: items.map((i) => ({
          productId: i.productId,
          quantityUnits: i.quantityUnits,
        })),
        paymentMethod: formData.paymentMethod,
      };

      const res = await fetch('/api/consumer/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Success! Clear cart and show order confirmation
      clearCart();
      setConfirmedOrder(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmed State
  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg border border-stone-200 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">
              Order Confirmed & Allocated
            </h1>
            <p className="text-xs text-stone-600 font-light">
              Thank you for supporting ethical tribal wild-produce gathering in Mayurbhanj.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-stone-500 uppercase tracking-wider">Order Reference:</span>
              <span className="font-mono font-bold text-stone-900 text-sm">{confirmedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Traceable Physical Lot:</span>
              <a
                href={`/verify/${encodeURIComponent(confirmedOrder.primaryLotReference)}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-800 underline flex items-center space-x-1"
              >
                <span>{confirmedOrder.primaryLotReference}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Total Payable:</span>
              <span className="font-serif font-bold text-stone-900">₹{confirmedOrder.totalPayableInr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Shipping To:</span>
              <span className="text-stone-800 text-right">
                {confirmedOrder.customerName}, {confirmedOrder.shippingAddress.city} - {confirmedOrder.shippingAddress.pincode}
              </span>
            </div>
          </div>

          <div className="pt-2 text-center flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/store/account"
              className="px-6 py-3 bg-[#1B4332] text-white text-xs font-semibold rounded hover:bg-[#2D5A27] transition-colors"
            >
              View Order in Account
            </Link>
            <Link
              href="/store"
              className="px-6 py-3 bg-stone-100 text-stone-800 text-xs font-semibold rounded hover:bg-stone-200 transition-colors"
            >
              Return to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/store/cart" className="flex items-center space-x-2 text-xs font-semibold text-stone-700 hover:text-[#1B4332]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Basket</span>
          </Link>

          <Link href="/store" className="flex items-center">
            <SamagnaLogo variant="forest" size="sm" />
          </Link>

          <div className="flex items-center space-x-1 text-xs text-stone-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypted Order Tunnel</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {errorMsg && (
          <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Shipping & Customer Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-200 pb-3">
                1. Delivery & Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number (SMS Tracking)</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                    required
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-stone-700 mb-1">Email Address (Order Dossier)</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                  required
                />
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-stone-700 mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Postal Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method (Demo Gateway) */}
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-200 pb-3">
                2. Payment Method (Sandbox / Test Gateway)
              </h3>

              <div className="space-y-3 text-xs">
                {[
                  {
                    id: 'DEMO_COMMERCIAL_GATEWAY',
                    title: 'Simulated Card / NetBanking Gateway',
                    desc: 'Pre-authorized test checkout without external bank redirection.',
                  },
                  {
                    id: 'DEMO_UPI',
                    title: 'Simulated UPI Collect / QR',
                    desc: 'Instant mock QR authorization for testing payment confirmation.',
                  },
                  {
                    id: 'CASH_ON_DELIVERY_TRIAL',
                    title: 'Cash on Delivery (Trial Verification)',
                    desc: 'Pay cash upon delivery verification at your doorstep.',
                  },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`block p-3.5 rounded border cursor-pointer transition-all ${
                      formData.paymentMethod === pm.id
                        ? 'border-[#1B4332] bg-[#FAF8F5]'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={formData.paymentMethod === pm.id}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="text-[#1B4332] focus:ring-[#1B4332]"
                      />
                      <div>
                        <div className="font-semibold text-stone-900">{pm.title}</div>
                        <div className="text-stone-500 mt-0.5">{pm.desc}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm space-y-4 sticky top-24">
              <h3 className="font-serif font-bold text-stone-900 text-base border-b border-stone-200 pb-3">
                Items in Basket ({totalUnits})
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto text-xs pr-1 divide-y divide-stone-100">
                {items.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between">
                    <div>
                      <div className="font-semibold text-stone-800">{item.productName}</div>
                      <div className="text-stone-500">{item.quantityUnits} × ₹{item.unitPriceInr}</div>
                    </div>
                    <div className="font-semibold text-stone-900">₹{item.subtotalInr}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-stone-200 text-xs space-y-2 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium text-stone-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon-Neutral Freight:</span>
                  <span className="font-medium text-stone-900">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Platform Enablement Fee:</span>
                  <span className="font-mono">₹0.00 (Pilot)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-serif font-bold text-stone-900 text-base">Grand Total</span>
                <span className="font-serif font-bold text-stone-900 text-xl">₹{totalPayable}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className={`w-full py-3.5 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm ${
                  submitting
                    ? 'bg-stone-400 cursor-wait'
                    : 'bg-[#1B4332] hover:bg-[#2D5A27]'
                }`}
              >
                {submitting ? 'Allocating Harvest Stock...' : `Confirm & Authorize Order • ₹${totalPayable}`}
              </button>

              <div className="text-[11px] text-stone-500 text-center leading-relaxed">
                By placing this order, you support direct fair-trade compensation to primary tribal forest gatherers.
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

