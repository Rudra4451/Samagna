'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import {
  Truck,
  Layers,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Search,
  PlusCircle,
  ExternalLink,
  MapPin,
  Scale,
  XCircle,
  FileCheck,
} from 'lucide-react';
import {
  LogisticsProvider,
  CommercialShipment,
  ShipmentStatus,
} from '@/lib/logistics';

type LogisticsTab = 'shipments' | 'confirmations' | 'exceptions' | 'carriers' | 'create_shipment';

export default function LogisticsNetworkPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    district: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<LogisticsTab>('shipments');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [carriers, setCarriers] = useState<LogisticsProvider[]>([]);
  const [shipments, setShipments] = useState<CommercialShipment[]>([]);

  // Delivery confirmation modal state
  const [selectedShipmentForDelivery, setSelectedShipmentForDelivery] = useState<CommercialShipment | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    receivedQuantityKg: 50,
    deliverySignedBy: '',
    podRef: 'POD-B2B-VERIFIED.pdf',
    damageKg: 0,
    discrepancyReason: '',
  });

  // Shipment creation form state
  const [createForm, setCreateForm] = useState({
    carrierId: 'LOG-OR-COOP-01',
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Jogendra Mahanta',
    driverPhone: '+91-9437123456',
    sourceType: 'PURCHASE_ORDER' as const,
    sourceReferenceId: 'PO-B2B-2025-001',
    lotReference: 'LIST-MAHUA-2025-01',
    produceName: 'Dried Mahua Flowers (Grade 1 / Premium)',
    dispatchedQuantityKg: 50,
    originFacilityId: 'BRP-01',
    originFacilityName: 'Baripada Central Terminal Depôt',
    originAddress: 'TDCCOL Depot, Station Road, Baripada, Mayurbhanj 757001',
    destinationFacilityName: 'Dabur India Ayurvedic Manufacturing Unit',
    destinationAddress: 'Plot 22, Site IV, Sahibabad Industrial Area, Ghaziabad, UP 201010',
    distanceKm: 1450,
    sealTagIds: 'SEAL-BRP-991, SEAL-BRP-992',
  });

  const loadData = async () => {
    try {
      const [carRes, shpRes] = await Promise.all([
        fetch('/api/logistics/carriers'),
        fetch('/api/logistics/shipments'),
      ]);

      if (carRes.ok) {
        const d = await carRes.json();
        if (d.success) setCarriers(d.carriers);
      }
      if (shpRes.ok) {
        const d = await shpRes.json();
        if (d.success) setShipments(d.shipments);
      }
    } catch (err: any) {
      console.error('Failed to load logistics data:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/logistics');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          loadData().finally(() => setLoading(false));
        }
      })
      .catch((err) => {
        console.error('Auth verification error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleConfirmDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForDelivery) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/logistics/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELIVERY',
          shipmentId: selectedShipmentForDelivery.id,
          actor: currentUser?.fullName || 'Receiving Officer',
          ...deliveryForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to record delivery.');
        return;
      }

      setSuccessMsg(`Delivery recorded as ${data.shipment.status}. Proof of delivery attached.`);
      setSelectedShipmentForDelivery(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  const handleCreateShipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/logistics/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          sealTagIds: createForm.sealTagIds.split(',').map((s) => s.trim()),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Failed to create shipment.');
        return;
      }

      setSuccessMsg(`Commercial shipment ${data.shipment.shipmentNumber} created and linked to custody record.`);
      setActiveTab('shipments');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-ink">
        <p className="text-[13px] font-mono text-ink-muted">Loading commercial logistics network records...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[1240px] mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Masthead Header */}
        <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-primary/10 text-primary border border-primary/20">
                <Truck className="w-3.5 h-3.5" /> FULFILMENT & FREIGHT NETWORK
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide bg-surface-elevated text-ink-muted border border-border">
                PILOT COORDINATION: 0.0% FEE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-ink">
              Commercial Logistics & Fulfilment Network
            </h1>
            <p className="text-[14px] text-ink-muted max-w-2xl mt-1 leading-relaxed">
              Coordinates commercial transport of forest-produce consignments between collection points, state warehouses,
              processing facilities, and enterprise buyers with unbroken custody linkage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[12px] font-mono text-ink-muted">Logistics Officer</p>
              <p className="text-[13px] font-medium text-ink">{currentUser.fullName} ({currentUser.role})</p>
            </div>
          </div>
        </div>

        {/* Global Policy Bar */}
        <div className="p-4 rounded-lg bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-ink">
              <p className="font-medium">Direct Custody Linkage & Proof-of-Delivery Reconciliation</p>
              <p className="text-ink-muted text-[12px]">
                Every commercial consignment is linked to an existing Purchase Order, Processing Job, or Warehouse Batch. Zero artificial GPS simulation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              Reconciliation: Shrinkage Adjusted
            </span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-bg border border-border text-ink-muted">
              Security: Tarpaulin & Tamper Seals
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-[13px] flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[13px] flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-border overflow-x-auto space-x-2 pb-1">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'shipments'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Truck className="w-4 h-4" />
            Active Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('confirmations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'confirmations'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Proof of Delivery
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'exceptions'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Exceptions & Damage
          </button>
          <button
            onClick={() => setActiveTab('carriers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'carriers'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <Layers className="w-4 h-4" />
            Verified Carriers ({carriers.length})
          </button>
          <button
            onClick={() => setActiveTab('create_shipment')}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'create_shipment'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink hover:border-border'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create Consignment
          </button>
        </div>

        {/* TAB 1: ACTIVE SHIPMENTS */}
        {activeTab === 'shipments' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Commercial Consignments in Transit & Fulfilment</h2>
                <p className="text-[13px] text-ink-muted">
                  Consignments verified against statutory transit permits and e-waybills.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('create_shipment')}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Dispatch New Consignment
              </Button>
            </div>

            <div className="space-y-5">
              {shipments.map((shp) => (
                <div
                  key={shp.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-bold text-primary">{shp.shipmentNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium ${
                        shp.status === 'DELIVERED_CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : shp.status === 'DELIVERED_PARTIAL'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : shp.status === 'DISPATCHED_IN_TRANSIT'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        STATUS: {shp.status}
                      </span>
                      {shp.waybillNumber && (
                        <span className="font-mono text-[11px] bg-bg px-2 py-0.5 rounded border border-border text-ink-muted">
                          {shp.waybillNumber}
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] font-mono text-ink-muted">
                      Est Arrival: {new Date(shp.estimatedArrivalDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Route & Custody Linkage Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                    <div className="space-y-1">
                      <p className="text-ink-muted text-[11px] font-mono uppercase">Origin Location</p>
                      <p className="font-medium text-ink">{shp.originFacilityName}</p>
                      <p className="text-ink-muted text-[12px]">{shp.originAddress}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-ink-muted text-[11px] font-mono uppercase">Destination Terminal</p>
                      <p className="font-medium text-ink">{shp.destinationFacilityName}</p>
                      <p className="text-ink-muted text-[12px]">{shp.destinationAddress}</p>
                    </div>

                    <div className="space-y-1 bg-surface-elevated p-3 rounded border border-border">
                      <p className="text-ink-muted text-[11px] font-mono uppercase">Custody Lineage Link</p>
                      <p className="font-mono font-bold text-ink">{shp.sourceType}: {shp.sourceReferenceId}</p>
                      <p className="font-medium text-primary text-[12px]">Lot: {shp.lotReference}</p>
                      <p className="font-mono text-ink-muted text-[11px]">{shp.dispatchedQuantityKg} kg net</p>
                    </div>
                  </div>

                  {/* Transport & Carrier specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-y border-border text-[12px]">
                    <div>
                      <p className="text-ink-muted">Carrier Fleet</p>
                      <p className="font-medium text-ink">{shp.carrierName}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Vehicle & Driver</p>
                      <p className="font-mono font-medium text-ink">{shp.vehicleNumber}</p>
                      <p className="text-ink-muted text-[11px]">{shp.driverName} ({shp.driverPhone})</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Security Seals</p>
                      <p className="font-mono text-[11px] text-ink">{shp.sealTagIds.join(', ')}</p>
                      <p className="text-ink-muted text-[11px]">{shp.tarpaulinSecured ? 'Tarpaulin Secured' : 'Open Bed'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-ink-muted">Freight & Distance</p>
                      <p className="font-mono font-medium text-ink">₹{shp.freightCostInr.toLocaleString()}</p>
                      <p className="font-mono text-ink-muted text-[11px]">{shp.distanceKm} km</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] font-mono text-ink-muted">
                      Audit Trail: {shp.auditHistory.length} milestone transitions recorded
                    </div>

                    <div className="flex items-center gap-2">
                      {shp.status === 'DISPATCHED_IN_TRANSIT' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedShipmentForDelivery(shp);
                            setDeliveryForm({
                              receivedQuantityKg: shp.dispatchedQuantityKg,
                              deliverySignedBy: '',
                              podRef: `POD-${shp.shipmentNumber}.pdf`,
                              damageKg: 0,
                              discrepancyReason: '',
                            });
                          }}
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                          Record Delivery & POD
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DELIVERY CONFIRMATION MODAL */}
        {selectedShipmentForDelivery && (
          <div className="p-6 rounded-xl border border-primary/30 bg-surface shadow-xl space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-medium text-lg text-ink">
                Record Delivery & Proof of Delivery ({selectedShipmentForDelivery.shipmentNumber})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedShipmentForDelivery(null)}
              >
                Cancel
              </Button>
            </div>

            <form onSubmit={handleConfirmDeliverySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pod-dispatched" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Dispatched Net Weight (kg)
                  </label>
                  <input
                    id="pod-dispatched"
                    type="number"
                    disabled
                    value={selectedShipmentForDelivery.dispatchedQuantityKg}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink-muted font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="pod-received" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Actual Received Net Weight (kg)
                  </label>
                  <input
                    id="pod-received"
                    type="number"
                    step="0.1"
                    value={deliveryForm.receivedQuantityKg}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, receivedQuantityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pod-signer" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Receiving Officer Signature / Name
                  </label>
                  <input
                    id="pod-signer"
                    type="text"
                    placeholder="e.g. A. Sengupta (Quality Lead)"
                    value={deliveryForm.deliverySignedBy}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliverySignedBy: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pod-doc" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Proof of Delivery Document Reference
                  </label>
                  <input
                    id="pod-doc"
                    type="text"
                    value={deliveryForm.podRef}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, podRef: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pod-damage" className="block text-[12px] font-mono text-ink-muted mb-1">
                    En-Route Damage Observed (kg)
                  </label>
                  <input
                    id="pod-damage"
                    type="number"
                    step="0.1"
                    value={deliveryForm.damageKg}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, damageKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="pod-discrepancy" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Discrepancy Notes / Explanation
                  </label>
                  <input
                    id="pod-discrepancy"
                    type="text"
                    placeholder="Explain unexplained weight loss if any"
                    value={deliveryForm.discrepancyReason}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, discrepancyReason: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedShipmentForDelivery(null)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Record Delivery & Reconcile Weight
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: PROOF OF DELIVERY RECONCILIATIONS */}
        {activeTab === 'confirmations' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Proof of Delivery & Weight Variance Records</h2>
                <p className="text-[13px] text-ink-muted">
                  Formal delivery vouchers signed by destination receivers with tare-verified weighment slips.
                </p>
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-elevated border-b border-border text-[11px] font-mono uppercase text-ink-muted">
                    <tr>
                      <th scope="col" className="p-3.5">Shipment & Consignment</th>
                      <th scope="col" className="p-3.5">Linked Custody Ref</th>
                      <th scope="col" className="p-3.5">Dispatched vs Received</th>
                      <th scope="col" className="p-3.5">Variance</th>
                      <th scope="col" className="p-3.5">POD Document</th>
                      <th scope="col" className="p-3.5">Signed By</th>
                      <th scope="col" className="p-3.5 text-right">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shipments.map((shp) => (
                      <tr key={shp.id} className="hover:bg-bg/50 transition-colors">
                        <td className="p-3.5">
                          <p className="font-mono font-bold text-ink">{shp.shipmentNumber}</p>
                          <p className="text-[11px] text-ink-muted">{shp.vehicleNumber} ({shp.carrierName})</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-elevated text-primary border border-border">
                            {shp.sourceReferenceId}
                          </span>
                          <p className="text-[11px] text-ink-muted mt-0.5">Lot: {shp.lotReference}</p>
                        </td>
                        <td className="p-3.5 font-mono text-[12px] text-ink">
                          {shp.dispatchedQuantityKg} kg → {shp.receivedQuantityKg !== null ? `${shp.receivedQuantityKg} kg` : 'In transit'}
                        </td>
                        <td className="p-3.5 font-mono text-[12px]">
                          {shp.quantityVarianceKg !== undefined && shp.quantityVarianceKg > 0 ? (
                            <span className="text-amber-600 font-medium">-{shp.quantityVarianceKg} kg</span>
                          ) : (
                            <span className="text-emerald-600">0.0 kg</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[12px]">
                          {shp.proofOfDeliveryDocRef ? (
                            <span className="text-primary flex items-center gap-1 cursor-pointer">
                              <ExternalLink className="w-3 h-3" />
                              {shp.proofOfDeliveryDocRef}
                            </span>
                          ) : (
                            <span className="text-ink-muted italic">Pending</span>
                          )}
                        </td>
                        <td className="p-3.5 text-[12px] text-ink">
                          {shp.deliverySignedBy || '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                            shp.status === 'DELIVERED_CONFIRMED'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : shp.status === 'DELIVERED_PARTIAL'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {shp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXCEPTIONS & DAMAGE */}
        {activeTab === 'exceptions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Transit Exceptions, Delays & Damage Reporting</h2>
                <p className="text-[13px] text-ink-muted">
                  Formal audit log of en-route incidents, vehicle breakdowns, weather disruptions, and damage claims.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {shipments.filter((s) => s.exceptionType !== 'NONE' || s.damageReportedKg! > 0).length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface text-ink-muted">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="font-serif text-base text-ink">No Active Transit Exceptions</p>
                  <p className="text-[13px] mt-1">All commercial consignments are operating within normal transit tolerances.</p>
                </div>
              ) : (
                shipments
                  .filter((s) => s.exceptionType !== 'NONE' || s.damageReportedKg! > 0)
                  .map((shp) => (
                    <div
                      key={shp.id}
                      className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.02] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-ink">{shp.shipmentNumber}</span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium border border-amber-500/20">
                            EXCEPTION: {shp.exceptionType}
                          </span>
                        </div>
                        <span className="font-mono text-[12px] text-ink-muted">{shp.vehicleNumber}</span>
                      </div>

                      <div className="text-[12px] text-ink bg-bg p-3 rounded border border-border space-y-1">
                        <p><span className="font-medium">Incident Report:</span> {shp.exceptionNotes || 'No notes recorded.'}</p>
                        {shp.damageReportedKg! > 0 && (
                          <p className="text-danger font-medium font-mono">Damage Weight: {shp.damageReportedKg} kg</p>
                        )}
                        {shp.delayHours! > 0 && (
                          <p className="text-amber-600 font-medium font-mono">Transit Delay: +{shp.delayHours} hours</p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: VERIFIED CARRIERS */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif text-ink">Authorized Transporters & Fleet Operators</h2>
                <p className="text-[13px] text-ink-muted">
                  State cooperative fleets, SHG cluster transporters, and commercial carriers verified for statutory forest transit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {carriers.map((car) => (
                <div
                  key={car.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                          {car.code}
                        </span>
                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-medium ${
                          car.isVerified
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {car.isVerified ? 'VERIFIED CARRIER' : 'PENDING INSPECTION'}
                        </span>
                      </div>
                      <h3 className="font-serif font-medium text-lg text-ink">{car.name}</h3>
                      <p className="text-[12px] text-ink-muted">{car.carrierType.replace(/_/g, ' ')}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] font-mono text-ink-muted uppercase">Fleet Size</p>
                      <p className="text-xl font-mono font-bold text-primary">{car.fleetSize} <span className="text-[12px] text-ink-muted font-sans">trucks</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-border text-[12px]">
                    <div>
                      <p className="text-ink-muted">Registration / PAN</p>
                      <p className="font-mono font-medium text-ink">{car.registrationNumber}</p>
                      <p className="font-mono text-[11px] text-ink-muted">PAN: {car.pan}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Fleet Rate</p>
                      <p className="font-mono font-medium text-ink">₹{car.operatingRatePerKm.toFixed(2)}/km</p>
                      <p className="text-ink-muted text-[11px]">Calibrated GPS Odometer</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Contact Officer</p>
                      <p className="font-medium text-ink">{car.contactPerson}</p>
                      <p className="text-ink-muted text-[11px]">{car.contactPhone}</p>
                    </div>
                    <div>
                      <p className="text-ink-muted">Operational Districts</p>
                      <p className="font-medium text-ink text-[11px]">{car.supportedDistricts.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CREATE COMMERCIAL CONSIGNMENT */}
        {activeTab === 'create_shipment' && (
          <div className="max-w-2xl mx-auto p-6 rounded-xl border border-border bg-surface shadow-sm space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="font-serif font-medium text-xl text-ink">Create Commercial Consignment & Dispatch</h2>
              <p className="text-[13px] text-ink-muted mt-1">
                Link commercial shipment to an existing Purchase Order or Processing Job with statutory seal verification.
              </p>
            </div>

            <form onSubmit={handleCreateShipmentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shp-carrier" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Designated Logistics Carrier
                  </label>
                  <select
                    id="shp-carrier"
                    value={createForm.carrierId}
                    onChange={(e) => setCreateForm({ ...createForm, carrierId: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                  >
                    {carriers.map((c) => (
                      <option key={c.id} value={c.id} disabled={!c.isVerified}>
                        {c.name} ({c.carrierType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="shp-vehicle" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Vehicle Registration Number
                  </label>
                  <input
                    id="shp-vehicle"
                    type="text"
                    value={createForm.vehicleNumber}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-driver" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Driver Name
                  </label>
                  <input
                    id="shp-driver"
                    type="text"
                    value={createForm.driverName}
                    onChange={(e) => setCreateForm({ ...createForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-phone" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Driver Contact Phone
                  </label>
                  <input
                    id="shp-phone"
                    type="text"
                    value={createForm.driverPhone}
                    onChange={(e) => setCreateForm({ ...createForm, driverPhone: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-source-ref" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Linked Custody Order / Job Ref
                  </label>
                  <input
                    id="shp-source-ref"
                    type="text"
                    value={createForm.sourceReferenceId}
                    onChange={(e) => setCreateForm({ ...createForm, sourceReferenceId: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-lot-ref" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Physical Warehouse Lot Ref
                  </label>
                  <input
                    id="shp-lot-ref"
                    type="text"
                    value={createForm.lotReference}
                    onChange={(e) => setCreateForm({ ...createForm, lotReference: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-produce" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Produce Description
                  </label>
                  <input
                    id="shp-produce"
                    type="text"
                    value={createForm.produceName}
                    onChange={(e) => setCreateForm({ ...createForm, produceName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-qty" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Dispatched Net Quantity (kg)
                  </label>
                  <input
                    id="shp-qty"
                    type="number"
                    min="10"
                    value={createForm.dispatchedQuantityKg}
                    onChange={(e) => setCreateForm({ ...createForm, dispatchedQuantityKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="shp-dest" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Destination Terminal & Receiving Facility
                  </label>
                  <input
                    id="shp-dest"
                    type="text"
                    value={createForm.destinationFacilityName}
                    onChange={(e) => setCreateForm({ ...createForm, destinationFacilityName: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="shp-dest-addr" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Destination Address
                  </label>
                  <input
                    id="shp-dest-addr"
                    type="text"
                    value={createForm.destinationAddress}
                    onChange={(e) => setCreateForm({ ...createForm, destinationAddress: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-seals" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Seal Tag Identifiers (Comma-separated)
                  </label>
                  <input
                    id="shp-seals"
                    type="text"
                    value={createForm.sealTagIds}
                    onChange={(e) => setCreateForm({ ...createForm, sealTagIds: e.target.value })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="shp-dist" className="block text-[12px] font-mono text-ink-muted mb-1">
                    Transit Distance (km)
                  </label>
                  <input
                    id="shp-dist"
                    type="number"
                    min="5"
                    value={createForm.distanceKm}
                    onChange={(e) => setCreateForm({ ...createForm, distanceKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-[13px] rounded-lg bg-bg border border-border text-ink focus:outline-none focus:border-primary font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setActiveTab('shipments')}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Issue Consignment & Confirm Dispatch
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}

