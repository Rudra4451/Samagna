'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getStoredMarketplaceOrders,
  MarketplaceOrder,
} from '@/lib/marketplace';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import {
  Package,
  Building2,
  ShoppingBag,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Warehouse,
  QrCode,
  ShieldCheck,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.id as string;

  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const all = getStoredMarketplaceOrders();
    const found = all.find((o) => o.orderNumber === orderNumber || o.id === orderNumber);
    if (found) {
      setOrder(found);
    } else if (all.length > 0) {
      setOrder(all[0]);
    }
    setMounted(true);
  }, [orderNumber]);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center font-mono text-[13px] text-ink-muted">
        Loading commercial invoice details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-[20px] font-heading font-bold text-ink">Order Not Found</h2>
        <p className="text-[13px] text-ink-muted">The requested order #{orderNumber} could not be located.</p>
        <Link
          href="/marketplace/orders"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[3px] bg-accent text-white text-[12px] font-semibold"
        >
          View All Orders
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Action Bar (hidden during printing) */}
      <div className="print:hidden border-b border-rule pb-4 flex items-center justify-between">
        <Link
          href="/marketplace/orders"
          className="text-[12px] font-mono text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/verify/${order.primaryBatchCode}`}
            className="px-3 py-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink text-[12px] font-mono font-semibold flex items-center gap-1.5"
          >
            <QrCode size={13} />
            <span>Verify Batch #{order.primaryBatchCode}</span>
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors shadow-none"
          >
            <Printer size={14} />
            <span>Print Official Invoice</span>
          </button>
        </div>
      </div>

      {/* Fulfillment Status Step Progress Bar */}
      <div className="print:hidden border border-rule rounded-[4px] bg-surface p-5 space-y-4 shadow-none">
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-ink">
            <Package size={16} className="text-accent" />
            <span>LIVE CONSIGNMENT DISPATCH TRACKER · LOT #{order.primaryBatchCode}</span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-[2px] bg-accent/10 text-accent font-bold">
            STATUS: {order.fulfillmentStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12px] font-mono">
          <div className="p-3 rounded-[3px] bg-bg-sunken border border-rule space-y-1">
            <span className="text-ink-muted text-[10px] block font-bold">STEP 1: ORDER CONFIRMED</span>
            <span className="font-bold text-ink flex items-center gap-1 text-success">
              <CheckCircle2 size={13} /> Staged & Authorized
            </span>
            <span className="text-[11px] text-ink-subtle block">Payment verified via {order.paymentMethod}</span>
          </div>

          <div className="p-3 rounded-[3px] bg-bg-sunken border border-rule space-y-1">
            <span className="text-ink-muted text-[10px] block font-bold">STEP 2: DEPÔT INVENTORY DEDUCTED</span>
            <span className="font-bold text-ink flex items-center gap-1 text-success">
              <CheckCircle2 size={13} /> Stock Reserved & Allocated
            </span>
            <span className="text-[11px] text-ink-subtle block">Baripada Central Depôt (Lot #{order.primaryBatchCode})</span>
          </div>

          <div className="p-3 rounded-[3px] bg-bg-sunken border border-rule space-y-1">
            <span className="text-ink-muted text-[10px] block font-bold">STEP 3: TRANSIT LOGISTICS</span>
            <span className="font-bold text-ink flex items-center gap-1 text-accent">
              <Truck size={13} /> Dispatched to Carrier
            </span>
            <span className="text-[11px] text-ink-subtle block">Destined for {order.buyer.city}, {order.buyer.state}</span>
          </div>
        </div>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="border border-rule rounded-[4px] bg-surface p-8 sm:p-10 space-y-8 shadow-none text-ink">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-rule pb-6">
          <div className="space-y-2">
            <SamagnaLogo variant="light" size="sm" showTagline />
            <div className="text-[11px] font-mono text-ink-muted space-y-0.5 pt-1">
              <p className="font-bold text-ink">SAMAGNA FOREST PRODUCE COMMERCIAL DESK</p>
              <p>District Procurement Office, Baripada Central Depôt</p>
              <p>Mayurbhanj District, Odisha - 757001</p>
              <p>GSTIN: 21AAAGT0000A1Z2 · State Code: 21 (Odisha)</p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono space-y-1">
            <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-accent/10 text-accent font-bold inline-block">
              COMMERCIAL TAX INVOICE
            </span>
            <div className="text-[20px] font-bold text-ink">{order.invoiceNumber}</div>
            <div className="text-[12px] text-ink-muted">
              Order Ref: <strong>{order.orderNumber}</strong>
            </div>
            <div className="text-[12px] text-ink-muted">
              Dated:{' '}
              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[12px]">
          {/* Bill To */}
          <div className="space-y-1.5 p-4 rounded-[3px] border border-rule bg-bg-sunken/40">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-bold">
              Billed & Shipped To:
            </span>
            <div className="font-bold text-ink text-[14px]">
              {order.buyer.companyName || order.buyer.name}
            </div>
            {order.buyer.companyName && (
              <div className="text-ink-muted text-[11px]">Attn: {order.buyer.name}</div>
            )}
            {order.buyer.gstin && (
              <div className="font-mono text-[11px] text-accent font-bold">
                GSTIN: {order.buyer.gstin}
              </div>
            )}
            {order.buyer.pan && (
              <div className="font-mono text-[11px] text-ink-muted">
                PAN: {order.buyer.pan}
              </div>
            )}
            <div className="text-ink-muted leading-relaxed">
              {order.buyer.addressLine1}
              {order.buyer.addressLine2 && `, ${order.buyer.addressLine2}`}
              <br />
              {order.buyer.city}, {order.buyer.district}, {order.buyer.state} - {order.buyer.pincode}
            </div>
            <div className="font-mono text-[11px] text-ink-muted">
              Email: {order.buyer.email} · Tel: {order.buyer.phone}
            </div>
          </div>

          {/* Depôt Origin & Transit Authority */}
          <div className="space-y-1.5 p-4 rounded-[3px] border border-rule bg-bg-sunken/40 font-mono text-[11px]">
            <span className="text-[10px] uppercase tracking-wider text-ink-muted block font-bold">
              Depôt Dispatch & Stencil Authority:
            </span>
            <div className="font-bold text-ink text-[13px]">
              Baripada Central Depôt (Facility Code: BRP-01)
            </div>
            <div className="text-ink-muted">
              Primary Lot Identification: <strong>#{order.primaryBatchCode}</strong>
            </div>
            <div className="text-ink-muted">
              E-Waybill Transit Waybill: <strong>WB-OD-2025-SMG-{order.orderNumber.slice(-4)}</strong>
            </div>
            <div className="text-ink-muted">
              Settlement Gateway: <strong>{order.paymentMethod}</strong>
            </div>
            <div className="text-success font-semibold flex items-center gap-1 pt-1">
              <CheckCircle2 size={12} />
              <span>Certified Stock Reweighed & Dispatched</span>
            </div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="overflow-x-auto border border-rule rounded-[3px]">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-rule bg-bg-sunken font-mono text-[11px] text-ink-muted uppercase">
                <th scope="col" className="p-3">#</th>
                <th scope="col" className="p-3">Produce Item & Botanical Name</th>
                <th scope="col" className="p-3">Batch Code</th>
                <th scope="col" className="p-3">Packaging / Weight</th>
                <th scope="col" className="p-3 text-right">Unit Price</th>
                <th scope="col" className="p-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule font-sans">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-3 font-mono text-ink-muted">{idx + 1}</td>
                  <td className="p-3">
                    <span className="font-bold text-ink block">{item.productName}</span>
                    <span className="text-[11px] font-mono text-ink-muted italic">
                      {item.scientificName}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <Link
                      href={`/verify/${item.batchCode}`}
                      className="text-accent hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <QrCode size={11} />
                      <span>#{item.batchCode}</span>
                    </Link>
                  </td>
                  <td className="p-3 font-mono">
                    <span>{item.packDescription}</span>
                    <span className="text-ink-muted block text-[11px]">({item.quantityKg} kg)</span>
                  </td>
                  <td className="p-3 text-right font-mono">
                    ₹{item.unitPrice.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-ink">
                    ₹{item.grossAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown & Commission Transparency (Requirements 5 & 6) */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          {/* QR Provenance Stencil Card */}
          <div className="p-4 rounded-[3px] border border-rule bg-bg-sunken sm:w-72 space-y-2">
            <div className="flex items-center gap-1.5 text-accent font-bold font-mono text-[11px]">
              <QrCode size={14} />
              <span>AUTHENTICITY QR STENCIL</span>
            </div>
            <p className="text-[11px] text-ink-muted leading-relaxed font-mono">
              Scan or navigate to verify tribal collector weighment and moisture logs:
            </p>
            <div className="font-mono text-[10px] break-all text-accent hover:underline">
              <Link href={`/verify/${order.primaryBatchCode}`}>
                {order.verificationQrUrl}
              </Link>
            </div>
          </div>

          {/* Grand Totals */}
          <div className="w-full sm:w-80 space-y-2 font-mono text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Gross Produce Value:</span>
              <span className="font-semibold text-ink">
                ₹{order.totalGrossAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-accent">
              <span>SAMAGNA Buyer Commission ({order.effectiveCommissionRate}%):</span>
              <span className="font-bold">₹{order.totalCommissionAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-subtle pl-2 border-l border-accent">
              <span>Collector Disbursed Net (100% MSP):</span>
              <span>₹{order.totalSellerSettlement.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Freight & Transit Packaging:</span>
              <span className="text-ink font-semibold">
                {order.shippingFee === 0 ? '₹0.00 (Ex-Depot)' : `₹${order.shippingFee.toFixed(2)}`}
              </span>
            </div>

            <div className="pt-2 border-t border-rule flex items-baseline justify-between font-bold text-ink text-[16px]">
              <span>Final Paid Amount:</span>
              <span className="text-[20px] font-mono text-accent">
                ₹{order.finalPayableAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Declarations */}
        <div className="pt-6 border-t border-rule text-[11px] font-mono text-ink-muted space-y-2">
          <p className="font-semibold text-ink">
            Statutory Declarations & Non-Deduction Invariant:
          </p>
          <p>
            1. This invoice reflects a commercial transaction under the SAMAGNA Minor Forest Produce direct market channel.
          </p>
          <p>
            2. Platform commissions are collected from the commercial buyer as a service fee and are <strong>never deducted</strong> from the Minimum Support Price (MSP) entitlement of primary tribal forest gatherers.
          </p>
          <p>
            3. All produce is certified to originate from sustainable gathering operations in Mayurbhanj forest divisions.
          </p>
        </div>
      </div>
    </div>
  );
}

