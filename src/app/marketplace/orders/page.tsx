'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getStoredMarketplaceOrders,
  MarketplaceOrder,
  OrderStatus,
} from '@/lib/marketplace';
import {
  Package,
  Building2,
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  QrCode,
  ArrowRight,
  Filter,
  Warehouse,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MarketplaceOrdersPage() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setOrders(getStoredMarketplaceOrders());
    setMounted(true);
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.fulfillmentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        order.orderNumber.toLowerCase().includes(q) ||
        order.buyer.name.toLowerCase().includes(q) ||
        (order.buyer.companyName && order.buyer.companyName.toLowerCase().includes(q)) ||
        order.primaryBatchCode.toLowerCase().includes(q) ||
        order.invoiceNumber.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Delivered</span>
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="px-2 py-0.5 rounded-[2px] bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-mono font-bold flex items-center gap-1">
            <Truck size={12} />
            <span>In Transit</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-mono font-bold flex items-center gap-1">
            <Warehouse size={12} />
            <span>Stock Reserved</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-2 py-0.5 rounded-[2px] bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-mono font-bold flex items-center gap-1">
            <Clock size={12} />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-rule pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold">
            Procurement Ledger
          </span>
          <h1 className="text-[26px] font-heading font-bold text-ink mt-0.5">
            Commercial Orders & Invoices
          </h1>
          <p className="text-[13px] text-ink-muted">
            Track wholesale consignments and retail orders linked directly to verified Baripada Central Depôt inventory.
          </p>
        </div>

        <Link
          href="/marketplace"
          className="px-3.5 py-2 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Package size={14} />
          <span>New Order</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, company, batch code (e.g. BS-400), or invoice..."
            className="w-full h-[36px] pl-9 pr-3 text-[13px] border border-rule rounded-[3px] bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink font-sans"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'APPROVED', 'DISPATCHED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                'px-2.5 py-1 rounded-[3px] text-[11px] font-mono border transition-colors whitespace-nowrap',
                statusFilter === st
                  ? 'border-accent bg-accent/10 text-accent font-bold'
                  : 'border-rule bg-surface text-ink-muted hover:text-ink'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center border border-rule rounded-[4px] bg-surface space-y-3">
            <Package size={36} className="mx-auto text-ink-muted opacity-40" />
            <h3 className="font-heading font-bold text-[18px] text-ink">No Commercial Orders Found</h3>
            <p className="text-[13px] text-ink-muted max-w-md mx-auto">
              No orders matched your current filters. Place an order through our B2B wholesale or consumer shop to generate traceable transactions.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-rule rounded-[4px] bg-surface p-5 space-y-4 hover:border-ink-subtle transition-all shadow-none"
            >
              {/* Top Row: Meta Info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'text-[10px] font-mono uppercase px-2 py-0.5 rounded-[2px] border font-bold',
                      order.buyerType === 'B2B'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    )}
                  >
                    {order.buyerType} Wholesale
                  </span>
                  <Link
                    href={`/marketplace/orders/${order.orderNumber}`}
                    className="font-mono font-bold text-[15px] text-ink hover:text-accent transition-colors"
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="text-ink-subtle">·</span>
                  <span className="text-[12px] font-mono text-ink-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.fulfillmentStatus)}
                  <span className="text-[11px] font-mono text-ink-muted">
                    Invoice: <strong className="text-ink">{order.invoiceNumber}</strong>
                  </span>
                </div>
              </div>

              {/* Middle Row: Buyer & Items Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-[13px]">
                {/* Buyer Column (4 cols) */}
                <div className="md:col-span-4 space-y-1">
                  <span className="text-[11px] font-mono text-ink-muted block uppercase">
                    Consignment Destination:
                  </span>
                  <div className="font-bold text-ink">
                    {order.buyer.companyName || order.buyer.name}
                  </div>
                  {order.buyer.gstin && (
                    <div className="text-[11px] font-mono text-ink-muted">
                      GSTIN: {order.buyer.gstin}
                    </div>
                  )}
                  <div className="text-[11px] text-ink-muted">
                    {order.buyer.city}, {order.buyer.state} - {order.buyer.pincode}
                  </div>
                </div>

                {/* Items Summary (5 cols) */}
                <div className="md:col-span-5 space-y-1">
                  <span className="text-[11px] font-mono text-ink-muted block uppercase">
                    Produce Items & Batch Provenance:
                  </span>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[12px] font-mono">
                        <div>
                          <span className="font-bold text-ink">{item.productName}</span>
                          <span className="text-ink-muted ml-1.5">({item.packDescription})</span>
                        </div>
                        <Link
                          href={`/verify/${item.batchCode}`}
                          className="text-accent hover:underline inline-flex items-center gap-0.5 text-[11px]"
                          title="Verify Batch"
                        >
                          <QrCode size={11} />
                          <span>#{item.batchCode}</span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Totals (3 cols) */}
                <div className="md:col-span-3 text-left md:text-right space-y-1 font-mono">
                  <span className="text-[11px] text-ink-muted block uppercase">
                    Commercial Settlement:
                  </span>
                  <div className="text-[18px] font-bold text-ink">
                    ₹{order.finalPayableAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-accent">
                    Platform Fee: ₹{order.totalCommissionAmount.toFixed(2)} ({order.effectiveCommissionRate}%)
                  </div>
                  <div className="text-[10px] text-ink-subtle">
                    Collector Entitlement: ₹{order.totalSellerSettlement.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] font-mono text-ink-muted">
                  <Warehouse size={13} className="text-accent" />
                  <span>Deducted from Baripada Central Depôt Ledger</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/verify/${order.primaryBatchCode}`}
                    className="px-2.5 py-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink text-[12px] font-mono font-medium flex items-center gap-1"
                  >
                    <QrCode size={13} />
                    <span>Verify QR Provenance</span>
                  </Link>

                  <Link
                    href={`/marketplace/orders/${order.orderNumber}`}
                    className="px-3 py-1.5 rounded-[3px] bg-accent hover:bg-accent-hover text-white text-[12px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FileText size={13} />
                    <span>View Digital Tax Invoice</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

