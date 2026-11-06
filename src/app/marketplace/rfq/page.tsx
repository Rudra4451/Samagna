'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  INITIAL_MARKETPLACE_CATALOGUE,
  getStoredMarketplaceRfqs,
  saveStoredMarketplaceRfq,
  MarketplaceQuotation,
  BusinessIndustry,
  reserveWarehouseStockForOrder,
  MarketplaceOrder,
} from '@/lib/marketplace';
import { generateULID } from '@/lib/ulid';
import {
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Warehouse,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function MarketplaceRfqContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProduce = searchParams?.get('produce') || 'Dried Mahua Flowers';
  const initialBatch = searchParams?.get('batch') || 'BS-400';
  const initialQty = Number(searchParams?.get('qty') || 100);

  const [rfqs, setRfqs] = useState<MarketplaceQuotation[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [produceName, setProduceName] = useState(initialProduce);
  const [batchCode, setBatchCode] = useState(initialBatch);
  const [requestedKg, setRequestedKg] = useState(initialQty);
  const [targetPrice, setTargetPrice] = useState<number>(45);
  const [deliveryDate, setDeliveryDate] = useState('2025-04-20');
  const [companyName, setCompanyName] = useState('Baidyanath Herbal Formulations Ltd');
  const [industry, setIndustry] = useState<BusinessIndustry>('AYURVEDIC_MEDICINE');
  const [gstin, setGstin] = useState('20AAACB2222B1Z4');
  const [pan, setPan] = useState('AAACB2222B');
  const [contactName, setContactName] = useState('Suresh Singhania');
  const [email, setEmail] = useState('procurement@baidyanath-ayur.com');
  const [phone, setPhone] = useState('+91 93340-98765');
  const [city, setCity] = useState('Jamshedpur');
  const [state, setState] = useState('Jharkhand');
  const [notes, setNotes] = useState('Require airtight nitrogen-flushed packaging for high-humidity monsoon storage.');

  useEffect(() => {
    setRfqs(getStoredMarketplaceRfqs());
    setMounted(true);
  }, []);

  const handleCreateRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const rfqNumber = `RFQ-SMG-${Date.now().toString().slice(-6)}`;
    const newRfq: MarketplaceQuotation = {
      id: generateULID(),
      rfqNumber,
      buyer: {
        buyerType: 'B2B',
        name: contactName,
        email,
        phone,
        companyName,
        industry,
        gstin,
        pan,
        isVerifiedCompany: true,
        addressLine1: `${companyName} Receiving Warehouse`,
        city,
        district: city,
        state,
        pincode: '831001',
      },
      produceName,
      batchCode,
      requestedQuantityKg: requestedKg,
      targetPricePerKg: targetPrice,
      requestedDeliveryDate: deliveryDate,
      status: 'SUBMITTED',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveStoredMarketplaceRfq(newRfq);
    setRfqs([newRfq, ...rfqs]);
    setIsSubmitting(false);
    setSuccessToast(`Quotation Request #${rfqNumber} successfully submitted to the Baripada Commercial Desk.`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  const handleAcceptQuote = async (rfq: MarketplaceQuotation) => {
    const matchedProduct = INITIAL_MARKETPLACE_CATALOGUE.find((p) => p.nameEnglish === rfq.produceName) || INITIAL_MARKETPLACE_CATALOGUE[0];
    const quotedRate = rfq.quotedPricePerKg || rfq.targetPricePerKg || matchedProduct.b2bWholesaleRatePerKg;
    const gross = rfq.requestedQuantityKg * quotedRate;
    const commission = (gross * 3.5) / 100;
    const sellerSettlement = gross - commission;
    const orderNumber = `ORD-B2B-${Date.now().toString().slice(-6)}`;

    const order: MarketplaceOrder = {
      id: generateULID(),
      orderNumber,
      buyerType: 'B2B',
      buyer: rfq.buyer,
      items: [
        {
          productId: matchedProduct.id,
          productName: rfq.produceName,
          scientificName: matchedProduct.scientificName,
          batchCode: rfq.batchCode || matchedProduct.primaryBatchCode,
          depotId: matchedProduct.destinationDepotId,
          depotName: matchedProduct.destinationDepotName,
          buyerType: 'B2B',
          quantityKg: rfq.requestedQuantityKg,
          packDescription: `Wholesale Consignment under ${rfq.rfqNumber}`,
          unitPrice: quotedRate,
          grossAmount: gross,
          commissionPercent: 3.5,
          commissionAmount: commission,
          sellerSettlementAmount: sellerSettlement,
        },
      ],
      totalItemsKg: rfq.requestedQuantityKg,
      totalGrossAmount: gross,
      totalCommissionAmount: commission,
      totalSellerSettlement: sellerSettlement,
      effectiveCommissionRate: 3.5,
      shippingFee: 0,
      finalPayableAmount: gross,
      primaryBatchCode: rfq.batchCode || matchedProduct.primaryBatchCode,
      verificationQrUrl: `https://banasetu.odisha.gov.in/verify/${rfq.batchCode || matchedProduct.primaryBatchCode}`,
      paymentMethod: 'CORPORATE_NEFT_RTGS',
      paymentStatus: 'PAID_DEMO',
      fulfillmentStatus: 'APPROVED',
      trackingTimeline: [
        {
          status: 'APPROVED',
          timestamp: Date.now(),
          title: `RFQ Quote #${rfq.rfqNumber} Accepted`,
          description: `Contract converted to commercial order #${orderNumber}. Stock deducted from Baripada Depôt.`,
          actor: 'SAMAGNA Commercial Desk',
        },
      ],
      invoiceNumber: `INV-SMG-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
    };

    await reserveWarehouseStockForOrder(order);

    // Update RFQ status
    const updated = { ...rfq, status: 'ACCEPTED' as const };
    saveStoredMarketplaceRfq(updated);
    setRfqs(rfqs.map((r) => (r.id === rfq.id ? updated : r)));

    router.push(`/marketplace/orders/${order.orderNumber}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-[4px] shadow-lg flex items-center gap-3 border border-rule animate-in fade-in">
          <CheckCircle2 size={18} className="text-success shrink-0" />
          <span className="text-[13px] font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-rule pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
            Enterprise Wholesale Sourcing
          </span>
          <h1 className="text-[26px] font-heading font-bold text-ink mt-0.5">
            Request for Quotation (RFQ)
          </h1>
          <p className="text-[13px] text-ink-muted">
            For bulk orders above 50 kg or custom contract deliveries. Submit specifications directly to the Baripada Central Depôt procurement officers.
          </p>
        </div>

        <Link
          href="/marketplace/b2b"
          className="text-[12px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>← Back to B2B Catalog</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: RFQ Submission Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCreateRfq} className="border border-rule rounded-[4px] bg-surface p-6 sm:p-7 space-y-5 shadow-none">
            <div className="border-b border-rule pb-3">
              <h2 className="font-heading font-bold text-[16px] text-ink flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                <span>Submit Custom Commercial Quotation Request</span>
              </h2>
            </div>

            {/* Produce & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Target Produce Species *
                </label>
                <select
                  value={produceName}
                  onChange={(e) => setProduceName(e.target.value)}
                  className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink cursor-pointer"
                >
                  {INITIAL_MARKETPLACE_CATALOGUE.map((p) => (
                    <option key={p.id} value={p.nameEnglish}>
                      {p.nameEnglish} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Depôt Batch Lot
                </label>
                <input
                  type="text"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  placeholder="e.g. BS-400, BS-W-410"
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Required Volume (kg) *
                </label>
                <input
                  type="number"
                  min="20"
                  max="10000"
                  required
                  value={requestedKg}
                  onChange={(e) => setRequestedKg(Number(e.target.value))}
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink font-bold"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Target Price (₹/kg)
                </label>
                <input
                  type="number"
                  min="10"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-ink block mb-1">
                  Target Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
              </div>
            </div>

            {/* Enterprise Credentials */}
            <div className="pt-2 border-t border-rule space-y-3">
              <span className="text-[11px] font-mono uppercase text-ink-muted block font-semibold">
                Company & GST Details:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Registered Legal Enterprise Name"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">GSTIN Number *</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="20AAACB2222B1Z4"
                    className="w-full h-[38px] px-3 text-[13px] font-mono font-bold uppercase border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">Contact Officer *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Officer Name"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="procurement@co.com"
                    className="w-full h-[38px] px-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-ink block mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 93340-XXXXX"
                    className="w-full h-[38px] px-3 text-[13px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
            </div>

            {/* Notes / Special Specs */}
            <div>
              <label className="text-[12px] font-semibold text-ink block mb-1">
                Packaging & Moisture Specifications / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention desired moisture limits, packaging material, lab certificate requirements..."
                className="w-full p-2.5 text-[12px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[44px] rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-none"
            >
              <Send size={15} />
              <span>Submit Commercial RFQ</span>
            </button>
          </form>
        </div>

        {/* Right: Existing RFQs Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-heading font-bold text-[16px] text-ink flex items-center gap-2">
                <Clock size={16} className="text-accent" />
                <span>Enterprise Quotation Tracker</span>
              </h3>
              <span className="text-[11px] font-mono text-ink-muted">
                {rfqs.length} Active Request{rfqs.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {rfqs.map((rfq) => {
                const isQuoted = rfq.status === 'QUOTED';
                const isAccepted = rfq.status === 'ACCEPTED';

                return (
                  <div
                    key={rfq.id}
                    className="p-4 rounded-[3px] border border-rule bg-bg-sunken space-y-2.5 font-mono text-[12px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{rfq.rfqNumber}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-[2px] text-[10px] uppercase font-bold border',
                          isQuoted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isAccepted
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        {rfq.status}
                      </span>
                    </div>

                    <div className="text-[13px] font-sans font-bold text-ink">
                      {rfq.produceName}
                    </div>

                    <div className="text-ink-muted text-[11px] space-y-0.5">
                      <div>Volume: <strong>{rfq.requestedQuantityKg} kg</strong></div>
                      <div>Target: ₹{rfq.targetPricePerKg}/kg · Lot #{rfq.batchCode || 'BS-400'}</div>
                      <div>Company: {rfq.buyer.companyName}</div>
                    </div>

                    {rfq.adminRemarks && (
                      <div className="p-2 rounded-[2px] bg-surface border border-rule text-[11px] text-ink leading-relaxed">
                        <strong className="text-accent">Depôt Quote:</strong> {rfq.adminRemarks}
                      </div>
                    )}

                    {isQuoted && (
                      <div className="pt-2 border-t border-rule flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-ink-muted block">Quoted Price:</span>
                          <span className="font-bold text-[14px] text-ink">
                            ₹{rfq.quotedPricePerKg} / kg
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAcceptQuote(rfq)}
                          className="px-3 py-1.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 size={13} />
                          <span>Accept & Purchase</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceRfqPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas py-12 px-4 flex items-center justify-center">
          <div className="text-center font-mono text-sm text-ink-muted">Loading Enterprise RFQ Desk...</div>
        </div>
      }
    >
      <MarketplaceRfqContent />
    </Suspense>
  );
}

