'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ConsumerOrder,
  ConsumerGrievance,
  canCustomerCancelOrder,
  canCustomerSubmitGrievance,
} from '@/lib/consumerCommerce';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  User,
  Truck,
  RotateCcw,
} from 'lucide-react';

export default function StoreAccountPage() {
  const [customerEmail, setCustomerEmail] = useState('ananya.mohapatra@gmail.com');
  const [orders, setOrders] = useState<ConsumerOrder[]>([]);
  const [grievances, setGrievances] = useState<ConsumerGrievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cancellation Modal State
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<ConsumerOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of delivery schedule / placed by mistake.');

  // Grievance / Return Modal State
  const [selectedOrderForGrievance, setSelectedOrderForGrievance] = useState<ConsumerOrder | null>(null);
  const [grievanceForm, setGrievanceForm] = useState({
    grievanceType: 'DAMAGED_IN_TRANSIT',
    description: '',
    evidenceDocUrl: '/docs/grievances/evidence-photo.jpg',
  });

  const loadCustomerData = async (email: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [ordRes, grvRes] = await Promise.all([
        fetch(`/api/consumer/orders?customerEmail=${encodeURIComponent(email)}`),
        fetch(`/api/consumer/grievances?customerEmail=${encodeURIComponent(email)}`),
      ]);

      if (ordRes.ok) {
        const oData = await ordRes.json();
        setOrders(oData.orders || []);
      }
      if (grvRes.ok) {
        const gData = await grvRes.json();
        setGrievances(gData.grievances || []);
      }
    } catch (err) {
      setErrorMsg('Failed to load customer account records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData(customerEmail);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomerData(customerEmail);
  };

  // Submit Cancellation
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForCancel) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/consumer/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL',
          orderId: selectedOrderForCancel.id,
          customerEmail,
          reason: cancelReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order.');

      setSuccessMsg(`Order ${data.order.orderNumber} has been successfully cancelled and warehouse stock restored.`);
      setSelectedOrderForCancel(null);
      loadCustomerData(customerEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing cancellation.');
    }
  };

  // Submit Grievance / Return
  const handleConfirmGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForGrievance) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/consumer/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderForGrievance.id,
          customerEmail,
          grievanceType: grievanceForm.grievanceType,
          description: grievanceForm.description,
          evidenceDocUrl: grievanceForm.evidenceDocUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit grievance.');

      setSuccessMsg(`Grievance ticket ${data.grievance.ticketNumber} logged. Our quality desk will inspect the evidence.`);
      setSelectedOrderForGrievance(null);
      loadCustomerData(customerEmail);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting grievance.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/store" className="flex items-center space-x-2 text-xs font-semibold text-stone-700 hover:text-[#1B4332]">
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </Link>

          <Link href="/store" className="font-serif text-lg font-bold text-[#1B4332]">
            CUSTOMER ACCOUNT & ORDERS
          </Link>

          <Link href="/store/cart" className="relative p-2 text-stone-700 hover:text-[#1B4332]">
            <ShoppingBag className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Banner Feedback */}
        {errorMsg && (
          <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="font-bold text-red-700">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-700">✕</button>
          </div>
        )}

        {/* Account Lookup Bar */}
        <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-stone-900 text-base">Customer Account Profile</h2>
              <p className="text-xs text-stone-500">Order tracking, cancellation, and grievance returns management</p>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex items-center space-x-2 w-full sm:w-auto">
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter your customer email..."
              className="text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded w-full sm:w-64 text-stone-800"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#1B4332] text-white text-xs font-semibold rounded hover:bg-[#2D5A27] transition-colors"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Orders Section */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-stone-900 text-xl border-b border-stone-200 pb-2">
            Order History ({orders.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-stone-500">
              Retrieving customer orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 bg-white rounded-lg border border-stone-200 text-center text-stone-500 text-xs">
              No orders found for {customerEmail}.
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const canCancel = canCustomerCancelOrder(order.orderStatus);
                const canGrievance = canCustomerSubmitGrievance(order.orderStatus);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden"
                  >
                    {/* Order Card Header */}
                    <div className="p-5 bg-stone-50/70 border-b border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              order.orderStatus === 'DELIVERED_CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.orderStatus === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : order.orderStatus === 'RETURN_REQUESTED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-stone-500 mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN')} • Paid via {order.paymentMethod}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="text-stone-500 block text-[11px]">Total Paid</span>
                          <span className="font-serif font-bold text-stone-900 text-base">
                            ₹{order.totalPayableInr}
                          </span>
                        </div>

                        {canCancel && (
                          <button
                            onClick={() => setSelectedOrderForCancel(order)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-semibold transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}

                        {canGrievance && (
                          <button
                            onClick={() => {
                              setSelectedOrderForGrievance(order);
                              setGrievanceForm({
                                grievanceType: 'DAMAGED_IN_TRANSIT',
                                description: '',
                                evidenceDocUrl: '/docs/grievances/evidence-photo.jpg',
                              });
                            }}
                            className="px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 rounded text-xs font-semibold flex items-center space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Return / Grievance</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Body */}
                    <div className="p-5 space-y-4">
                      {/* Line Items */}
                      <div className="divide-y divide-stone-100 text-xs">
                        {order.lineItems.map((item, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-stone-800">{item.productTitle}</div>
                              <div className="text-stone-500">{item.packDescription}</div>
                              <a
                                href={`/verify/${encodeURIComponent(item.sourceLotReference)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[10px] text-emerald-800 underline flex items-center space-x-1 mt-0.5"
                              >
                                <span>Batch: {item.sourceLotReference}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>

                            <div className="text-right">
                              <span className="text-stone-900 font-semibold">₹{item.totalPriceInr}</span>
                              <div className="text-stone-400 text-[11px]">
                                {item.quantityUnits} × ₹{item.unitPriceInr}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Shipping & Consignment Info */}
                      <div className="p-3 bg-stone-50 rounded text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 border border-stone-200">
                        <div>
                          <span className="text-stone-500 block">Delivery Address:</span>
                          <span className="font-medium text-stone-800">
                            {order.customerName}, {order.shippingAddress.street}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-500 block">Transit Waybill / Dispatch Reference:</span>
                          <span className="font-mono font-medium text-stone-800">
                            {order.trackingConsignmentRef || 'Consignment staging at Mayurbhanj Depot'}
                          </span>
                        </div>
                      </div>

                      {/* Milestone Timeline */}
                      <div className="pt-2 border-t border-stone-100 text-xs">
                        <span className="text-stone-500 font-semibold uppercase tracking-wider block mb-2">
                          Tracking Chronicle:
                        </span>
                        <div className="space-y-2">
                          {order.timeline.map((entry, tIdx) => (
                            <div key={tIdx} className="flex items-start space-x-2 text-stone-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] mt-1.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold text-stone-800">{entry.title}</span>
                                <span className="text-stone-400 text-[11px] ml-2 font-mono">
                                  ({new Date(entry.timestamp).toLocaleString('en-IN')})
                                </span>
                                <p className="text-stone-500 text-[11px]">{entry.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grievance Tickets Section */}
        {grievances.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="font-serif font-bold text-stone-900 text-xl border-b border-stone-200 pb-2">
              Return & Grievance Tickets ({grievances.length})
            </h3>
            <div className="space-y-3">
              {grievances.map((g) => (
                <div key={g.id} className="p-4 bg-white rounded-lg border border-stone-200 shadow-sm text-xs space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono font-bold text-stone-900">{g.ticketNumber} • {g.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                      {g.status}
                    </span>
                  </div>
                  <p className="text-stone-700"><strong>Incident:</strong> {g.grievanceType.replace(/_/g, ' ')}</p>
                  <p className="text-stone-600">{g.description}</p>
                  {g.resolutionNotes && (
                    <div className="p-2 bg-emerald-50 text-emerald-800 rounded mt-2 border border-emerald-200">
                      <strong>Resolution:</strong> {g.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: Cancellation */}
        {selectedOrderForCancel && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-200">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                Cancel Order {selectedOrderForCancel.orderNumber}
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Your order will be immediately cancelled and reserved harvest produce restored to available inventory.
              </p>

              <form onSubmit={handleConfirmCancel} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Reason for Cancellation</label>
                  <textarea
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForCancel(null)}
                    className="px-4 py-2 border border-stone-300 rounded text-stone-700"
                  >
                    Keep Order
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-700 text-white rounded font-semibold hover:bg-red-800"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Grievance / Return */}
        {selectedOrderForGrievance && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-stone-200">
              <h3 className="font-serif font-bold text-stone-900 text-base">
                File Return or Grievance Ticket
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Reporting issue for {selectedOrderForGrievance.orderNumber}. All customer grievances are arbitrated under our 7-day tamper policy.
              </p>

              <form onSubmit={handleConfirmGrievance} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Grievance Category</label>
                  <select
                    value={grievanceForm.grievanceType}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, grievanceType: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                  >
                    <option value="DAMAGED_IN_TRANSIT">Transit Breakage / Leakage</option>
                    <option value="SEAL_BROKEN">Tamper-Evident Induction Seal Compromised</option>
                    <option value="QUALITY_DEFECT">Sensory / Botanical Quality Discrepancy</option>
                    <option value="WRONG_ITEM_RECEIVED">Incorrect Pack Size or SKU Received</option>
                    <option value="DELIVERY_DELAY">Excess Transit Delay</option>
                    <option value="OTHER">Other Service Grievance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Incident Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the issue observed upon package inspection..."
                    value={grievanceForm.description}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2.5 text-stone-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Evidence Photo Document Link</label>
                  <input
                    type="text"
                    value={grievanceForm.evidenceDocUrl}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, evidenceDocUrl: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded p-2 text-stone-800"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForGrievance(null)}
                    className="px-4 py-2 border border-stone-300 rounded text-stone-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1B4332] text-white rounded font-semibold hover:bg-[#2D5A27]"
                  >
                    Submit Grievance Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

