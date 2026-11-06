'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import {
  MarketplaceOrder,
  MarketplaceBuyerDetails,
  BusinessIndustry,
  reserveWarehouseStockForOrder,
  PaymentMethod,
} from '@/lib/marketplace';
import { generateULID } from '@/lib/ulid';
import {
  Building2,
  ShoppingBag,
  ShieldCheck,
  Warehouse,
  QrCode,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceCheckoutPage() {
  const router = useRouter();
  const {
    items,
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

  const totalUnits = mounted ? getTotalItemsCount() : 0;
  const totalKg = mounted ? getTotalKg() : 0;
  const grossAmount = mounted ? getTotalGross() : 0;
  const commissionAmount = mounted ? getTotalCommission() : 0;
  const sellerSettlement = mounted ? getTotalSellerSettlement() : 0;

  // Determine buyer category based on cart items
  const isB2B = items.some((i) => i.buyerType === 'B2B');
  const buyerType = isB2B ? 'B2B' : 'B2C';

  // Buyer Form State
  const [buyerDetails, setBuyerDetails] = useState<MarketplaceBuyerDetails>({
    buyerType,
    name: isB2B ? 'Dr. Vivek Sharma' : 'Ramesh Chandra Patra',
    email: isB2B ? 'procurement@dabur.com' : 'ramesh.patra@gmail.com',
    phone: '+91 98110-98765',
    companyName: isB2B ? 'Dabur India Ayurvedic Sourcing Division' : '',
    industry: isB2B ? 'AYURVEDIC_MEDICINE' : undefined,
    gstin: isB2B ? '07AAACD1111A1Z5' : '',
    pan: isB2B ? 'AAACD1111A' : '',
    isVerifiedCompany: isB2B,
    addressLine1: isB2B ? 'Plot 14, Phase II, Industrial Area' : 'House 42, Forest Colony, Station Road',
    city: isB2B ? 'Ghaziabad' : 'Baripada',
    district: isB2B ? 'Ghaziabad' : 'Mayurbhanj',
    state: isB2B ? 'Uttar Pradesh' : 'Odisha',
    pincode: isB2B ? '201010' : '757001',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DEMO_COMMERCIAL_GATEWAY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (mounted && items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-[20px] font-heading font-bold text-ink">Your cart is empty</h2>
        <p className="text-[13px] text-ink-muted">Add products before checking out.</p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-accent text-white text-[12px] font-semibold"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const shippingFee = isB2B ? 0 : 50;
  const finalPayable = grossAmount + shippingFee;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!buyerDetails.name.trim() || !buyerDetails.email.trim() || !buyerDetails.addressLine1.trim()) {
      setErrorMsg('Please complete all mandatory buyer and address fields.');
      return;
    }

    if (isB2B && (!buyerDetails.companyName?.trim() || !buyerDetails.gstin?.trim())) {
      setErrorMsg('Company Name and GSTIN are mandatory for B2B wholesale transactions.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const orderId = generateULID();
      const orderNumber = `ORD-${buyerType}-${Date.now().toString().slice(-6)}`;
      const invoiceNumber = `INV-SMG-${Date.now().toString().slice(-6)}`;
      const primaryBatch = items[0]?.batchCode || 'BS-400';

      const order: MarketplaceOrder = {
        id: orderId,
        orderNumber,
        buyerType,
        buyer: buyerDetails,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          scientificName: i.scientificName,
          batchCode: i.batchCode,
          depotId: i.depotId,
          depotName: i.depotName,
          buyerType: i.buyerType,
          quantityKg: i.totalKg,
          packDescription: i.packDescription,
          unitPrice: i.unitPriceInr,
          grossAmount: i.subtotalInr,
          commissionPercent: i.commissionRate,
          commissionAmount: i.commissionAmount,
          sellerSettlementAmount: i.sellerAmount,
        })),
        totalItemsKg: totalKg,
        totalGrossAmount: grossAmount,
        totalCommissionAmount: commissionAmount,
        totalSellerSettlement: sellerSettlement,
        effectiveCommissionRate: isB2B ? 3.5 : 6.0,
        shippingFee,
        finalPayableAmount: finalPayable,
        primaryBatchCode: primaryBatch,
        verificationQrUrl: `https://banasetu.odisha.gov.in/verify/${primaryBatch}`,
        paymentMethod,
        paymentStatus: 'PAID_DEMO',
        fulfillmentStatus: 'APPROVED',
        trackingTimeline: [
          {
            status: 'PENDING',
            timestamp: Date.now(),
            title: 'Commercial Order Staged',
            description: `Order ${orderNumber} authorized. Payment verified via ${paymentMethod}.`,
            actor: 'SAMAGNA Commercial Gateway',
          },
          {
            status: 'APPROVED',
            timestamp: Date.now(),
            title: 'Warehouse Stock Reserved',
            description: `${totalKg} kg deducted from live stock at Baripada Central Depôt (Lot #${primaryBatch}).`,
            actor: 'Baripada Central Depôt Ledger',
          },
        ],
        invoiceNumber,
        createdAt: Date.now(),
      };

      // Reserve stock in Dexie warehouse inventory and log audit event
      await reserveWarehouseStockForOrder(order);

      // Clear shopping cart
      clearCart();

      // Navigate to order confirmation and digital invoice
      router.push(`/marketplace/orders/${order.orderNumber}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMsg(err?.message || 'Failed to process commercial order.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-rule pb-4 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
            {buyerType === 'B2B' ? 'Industrial B2B Procurement' : 'Consumer Retail Store'}
          </span>
          <h1 className="text-[26px] font-heading font-bold text-ink mt-0.5">
            Commercial Order Checkout
          </h1>
        </div>
        <Link
          href="/marketplace/cart"
          className="text-[12px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Cart</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-[3px] text-danger text-[12px] font-mono flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form: Buyer Details & Shipping Address (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Buyer Identification */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-4 shadow-none">
              <div className="flex items-center gap-2 text-ink font-heading font-bold text-[16px] border-b border-rule pb-3">
                {buyerType === 'B2B' ? <Building2 size={18} className="text-accent" /> : <ShoppingBag size={18} className="text-accent" />}
                <span>
                  {buyerType === 'B2B' ? 'Enterprise & Company Verification' : 'Customer Contact Details'}
                </span>
              </div>

              {buyerType === 'B2B' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">
                      Registered Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerDetails.companyName || ''}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, companyName: e.target.value })}
                      placeholder="e.g. Dabur India Limited / Baidyanath Ayurveda"
                      className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-ink block mb-1">
                        Corporate GSTIN Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerDetails.gstin || ''}
                        onChange={(e) => setBuyerDetails({ ...buyerDetails, gstin: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full h-[38px] px-3 text-[13px] font-mono font-bold uppercase border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-ink block mb-1">
                        Company PAN Number
                      </label>
                      <input
                        type="text"
                        value={buyerDetails.pan || ''}
                        onChange={(e) => setBuyerDetails({ ...buyerDetails, pan: e.target.value.toUpperCase() })}
                        placeholder="AAAAA0000A"
                        className="w-full h-[38px] px-3 text-[13px] font-mono uppercase border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">
                      Industry Classification
                    </label>
                    <select
                      value={buyerDetails.industry || 'AYURVEDIC_MEDICINE'}
                      onChange={(e) =>
                        setBuyerDetails({ ...buyerDetails, industry: e.target.value as BusinessIndustry })
                      }
                      className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink cursor-pointer"
                    >
                      <option value="AYURVEDIC_MEDICINE">Ayurvedic & Classical Herbal Medicine</option>
                      <option value="PHARMACEUTICAL">Standardized Pharmaceutical Extracts</option>
                      <option value="FOOD_PROCESSING">Food & Confectionery Processing</option>
                      <option value="WHOLESALE_DISTRIBUTOR">Wholesale Botanical Distributor</option>
                      <option value="EXPORTER">International Botanical Exporter</option>
                      <option value="LARGE_SCALE_TRADER">Large-Scale Domestic Commodity Trader</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    {buyerType === 'B2B' ? 'Authorized Officer Name *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerDetails.name}
                    onChange={(e) => setBuyerDetails({ ...buyerDetails, name: e.target.value })}
                    placeholder="e.g. Dr. Vivek Sharma"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={buyerDetails.email}
                    onChange={(e) => setBuyerDetails({ ...buyerDetails, email: e.target.value })}
                    placeholder="procurement@company.com"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Mobile / Telephone Number *
                </label>
                <input
                  type="text"
                  required
                  value={buyerDetails.phone}
                  onChange={(e) => setBuyerDetails({ ...buyerDetails, phone: e.target.value })}
                  placeholder="+91 98110-XXXXX"
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            {/* Consignment Delivery Address */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-4 shadow-none">
              <h2 className="text-ink font-heading font-bold text-[16px] border-b border-rule pb-3">
                Consignment Delivery & Shipping Address
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">
                    Facility / Warehouse / Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerDetails.addressLine1}
                    onChange={(e) => setBuyerDetails({ ...buyerDetails, addressLine1: e.target.value })}
                    placeholder="Factory Unit / Receiving Gate / Street Address"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={buyerDetails.city}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, city: e.target.value })}
                      placeholder="City"
                      className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">District *</label>
                    <input
                      type="text"
                      required
                      value={buyerDetails.district}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, district: e.target.value })}
                      placeholder="District"
                      className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={buyerDetails.state}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, state: e.target.value })}
                      placeholder="State"
                      className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-ink block mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={buyerDetails.pincode}
                      onChange={(e) => setBuyerDetails({ ...buyerDetails, pincode: e.target.value })}
                      placeholder="757001"
                      className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selector (Demo Checkout requirement) */}
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <h2 className="text-ink font-heading font-bold text-[16px]">
                  Commercial Settlement Method
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] bg-warning/10 border border-warning/30 text-warning font-bold">
                  SIMULATED DEMO GATEWAY
                </span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-[3px] border border-accent bg-accent/5 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="DEMO_COMMERCIAL_GATEWAY"
                      checked={paymentMethod === 'DEMO_COMMERCIAL_GATEWAY'}
                      onChange={() => setPaymentMethod('DEMO_COMMERCIAL_GATEWAY')}
                      className="accent-accent"
                    />
                    <div>
                      <span className="font-bold text-[13px] text-ink block">
                        Instant Commercial Demo Checkout
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Simulated live approval · Commits stock deduction immediately to warehouse ledger
                      </span>
                    </div>
                  </div>
                  <CreditCard size={18} className="text-accent" />
                </label>

                {buyerType === 'B2B' ? (
                  <label className="flex items-center justify-between p-3 rounded-[3px] border border-rule bg-surface hover:bg-bg-sunken cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CORPORATE_NEFT_RTGS"
                        checked={paymentMethod === 'CORPORATE_NEFT_RTGS'}
                        onChange={() => setPaymentMethod('CORPORATE_NEFT_RTGS')}
                        className="accent-accent"
                      />
                      <div>
                        <span className="font-bold text-[13px] text-ink block">
                          Corporate Bank Transfer (NEFT / RTGS)
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Official institutional escrow account via State Bank of India Baripada
                        </span>
                      </div>
                    </div>
                    <Building2 size={18} className="text-ink-muted" />
                  </label>
                ) : (
                  <label className="flex items-center justify-between p-3 rounded-[3px] border border-rule bg-surface hover:bg-bg-sunken cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="UPI_DEMO"
                        checked={paymentMethod === 'UPI_DEMO'}
                        onChange={() => setPaymentMethod('UPI_DEMO')}
                        className="accent-accent"
                      />
                      <div>
                        <span className="font-bold text-[13px] text-ink block">
                          Instant UPI Demo (GPay / PhonePe / BHIM)
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          Fast consumer checkout simulation with digital receipt
                        </span>
                      </div>
                    </div>
                    <ShieldCheck size={18} className="text-ink-muted" />
                  </label>
                )}
              </div>

              <div className="p-3 rounded-[3px] bg-bg-sunken border border-rule text-[11px] font-mono text-ink-muted flex items-start gap-2">
                <Lock size={14} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Demo Safeguard: Because live banking gateway credentials are withheld for evaluation, this transaction creates verified local ledger records without charging real bank accounts.
                </span>
              </div>
            </div>
          </div>

          {/* Right Summary: Transparent Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-rule rounded-[4px] bg-surface p-6 space-y-6 shadow-none sticky top-20">
              <h2 className="font-heading font-bold text-[16px] text-ink border-b border-rule pb-3">
                Transparent Fee Review
              </h2>

              {/* Items Staged */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="text-[12px] font-mono flex items-start justify-between border-b border-rule/50 pb-2">
                    <div>
                      <span className="font-bold text-ink block">{item.productName}</span>
                      <span className="text-[11px] text-ink-muted">
                        {item.packDescription} · Lot #{item.batchCode}
                      </span>
                    </div>
                    <span className="font-bold text-ink">
                      ₹{item.subtotalInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Financial Calculation */}
              <div className="p-4 rounded-[3px] border border-rule bg-bg-sunken space-y-2 text-[12px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Gross Produce Value:</span>
                  <span className="font-semibold text-ink">₹{grossAmount.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex items-center justify-between text-accent font-semibold">
                  <span>
                    SAMAGNA Fee ({buyerType === 'B2B' ? '3.5% Wholesale' : '6.0% Retail'}):
                  </span>
                  <span>₹{commissionAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-subtle pl-2 border-l border-accent">
                  <span>Collector MSP Entitlement (100%):</span>
                  <span>₹{sellerSettlement.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ink-muted">Freight & Handling:</span>
                  <span className="text-ink font-semibold">
                    {shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}
                  </span>
                </div>

                <div className="pt-2 border-t border-rule flex items-baseline justify-between font-bold text-ink text-[16px]">
                  <span>Total Amount:</span>
                  <span className="text-[20px] font-mono">
                    ₹{finalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Warehouse Inventory Protection Notice */}
              <div className="space-y-1 text-[11px] font-mono text-ink-muted">
                <div className="flex items-center gap-1.5 text-success font-bold">
                  <CheckCircle2 size={13} />
                  <span>Immediate Warehouse Allocation</span>
                </div>
                <p>
                  Deducts {totalKg} kg directly from Baripada Central Depôt (Lot #{items[0]?.batchCode || 'BS-400'}). MSP entitlement to tribal gatherers is never altered.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[48px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Commercial Allocation...</span>
                ) : (
                  <>
                    <span>Confirm & Authorize Order (₹{finalPayable})</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

