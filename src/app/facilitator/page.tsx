'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { getDatabase } from '../../lib/db';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SyncStatusBadge } from '../../components/ui/SyncStatusBadge';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { FacilitatorOnboarding } from '../../components/onboarding/FacilitatorOnboarding';
import { useRoleOnboarding } from '../../lib/useOnboarding';
import {
  Users,
  FileText,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ProductIcon } from '../../components/ui/ProductIcons';

interface GroupMember {
  id: string;
  name: string;
  tribalId: string;
  village: string;
  product: string;
  qtyKg: number;
  ratePerKg: number;
  totalAmount: number;
  batchCode: string;
}

export default function FacilitatorPage() {
  const { isOffline, language } = useAppStore();
  const isOr = language === 'OR';

  // Role onboarding state (Rule 1 & 6)
  const { isOnboarded, isLoaded, complete, reset } = useRoleOnboarding('facilitator');

  // Group members state
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: 'gm-1',
      name: 'Raimati Soren',
      tribalId: 'OD-MAY-7721',
      village: 'Badampahar',
      product: 'Dried Mahua Flowers',
      qtyKg: 100.0,
      ratePerKg: 42.0,
      totalAmount: 4200.0,
      batchCode: '#BS-402',
    },
    {
      id: 'gm-2',
      name: 'Sunita Majhi',
      tribalId: 'OD-MAY-4019',
      village: 'Kaptipada',
      product: 'Sal Tree Seeds',
      qtyKg: 50.0,
      ratePerKg: 28.0,
      totalAmount: 1400.0,
      batchCode: '#BS-400',
    },
    {
      id: 'gm-3',
      name: 'Gita Murmu',
      tribalId: 'OD-MAY-8812',
      village: 'Udala',
      product: 'Wild Forest Honey',
      qtyKg: 20.0,
      ratePerKg: 180.0,
      totalAmount: 3600.0,
      batchCode: '#BS-398',
    },
  ]);

  const [isGroupSubmitted, setIsGroupSubmitted] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newTribalId, setNewTribalId] = useState('');
  const [newVillage, setNewVillage] = useState('Badampahar');
  const [newProduct, setNewProduct] = useState('Dried Mahua Flowers');
  const [newQty, setNewQty] = useState(30);

  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    description: string;
    variant: 'success' | 'info' | 'warning';
  } | null>(null);

  const totalQtyKg = members.reduce((acc, m) => acc + m.qtyKg, 0);
  const totalEntitlement = members.reduce((acc, m) => acc + m.totalAmount, 0);

  const handleRecordGroupPickup = () => {
    complete();
    document.getElementById('group-intake-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const rate = newProduct === 'Dried Mahua Flowers' ? 42.0 : newProduct === 'Sal Tree Seeds' ? 28.0 : 180.0;
    const batchNum = Math.floor(405 + Math.random() * 40);
    const newMember: GroupMember = {
      id: `gm-${Date.now()}`,
      name: newName.trim(),
      tribalId: newTribalId.trim() || `OD-MAY-${Math.floor(1000 + Math.random() * 9000)}`,
      village: newVillage,
      product: newProduct,
      qtyKg: Number(newQty),
      ratePerKg: rate,
      totalAmount: Number((newQty * rate).toFixed(2)),
      batchCode: `#BS-${batchNum}`,
    };

    setMembers((prev) => [...prev, newMember]);
    setNewName('');
    setNewTribalId('');
    setShowAddForm(false);
    setActiveToast({
      id: `toast-${Date.now()}`,
      variant: 'info',
      title: `Collector added to consignment roster`,
      description: `${newMember.name} (${newMember.qtyKg} kg · ${newMember.batchCode}) added.`,
    });
  };

  const handleSubmitGroupConsignment = async () => {
    setIsGroupSubmitted(true);
    try {
      const db = getDatabase();
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
      const timestampMs = Date.now();

      for (const m of members) {
        const cleanId = m.batchCode.replace('#', '');

        // 1. Put/update batch in db.batches
        await db.batches.put({
          id: cleanId,
          produceName: m.product,
          produceOdia: m.product === 'Dried Mahua Flowers' ? 'ଶୁଖିଲା ମହୁଲ ଫୁଲ' : m.product === 'Sal Tree Seeds' ? 'ଶାଳ ମଞ୍ଜି' : 'ଜଙ୍ଗଲି ମହୁ',
          scientificName: 'Similipal NTFP Reserve',
          district: 'Mayurbhanj (ମୟୂରଭଞ୍ଜ)',
          block: 'Karanjia (କରଞ୍ଜିଆ)',
          gramPanchayat: 'Badampahar GP',
          centerName: 'Badagaon Van Dhan Vikas Kendra',
          shgName: 'Maa Tarini Tribal Self Help Group',
          facilitatorName: 'Champa Majhi (ID: SHG-FAC-09)',
          referenceRatePerKg: m.ratePerKg,
          rateSource: 'LABHA Scheme Notified Floor MSP',
          ratePublishedDate: '15-Apr-2024',
          seasonalReadinessStatus: 'Group Consignment Dispatched',
          pickupRequestId: `REQ-GRP-${cleanId}`,
          collectors: [{
            id: `COL-${cleanId}`,
            tribalId: m.tribalId,
            name: m.name,
            nameOdia: m.name,
            gender: 'F',
            age: 32,
            village: m.village,
            villageOdia: m.village,
            weightKg: m.qtyKg,
            ratePerKg: m.ratePerKg,
            grossPayout: m.totalAmount,
            bankName: 'Odisha Gramya Bank',
            accountEnding: '•••5521',
            dbtRef: `DBT-OD-${Math.floor(1000 + Math.random() * 9000)}`,
            paymentStatus: 'READY_FOR_DISBURSEMENT',
            collectedDate: nowStr,
            signedByFacilitator: 'Champa Majhi (SHG-FAC-09)',
          }],
          status: isOffline ? 'SAVED_OFFLINE_PENDING_SYNC' : 'PENDING_VERIFICATION',
          step1: {
            grossWeightKg: Number((m.qtyKg + 1.5).toFixed(2)),
            tareWeightKg: 1.5,
            netAcceptedKg: m.qtyKg,
            grade: 'Grade A - Properly Dried',
            sackCount: 1,
            sealTagId: `OD-GRP-${cleanId}`,
            vehicleNumber: 'OR-11-F-4412',
            driverName: 'B. Soren',
            tarpaulinConfirmed: true,
            transitWaybillId: `WB-GRP-24-${cleanId}`,
            observedMoisturePercent: 8.0,
            verifiedBy: 'Champa Majhi (ID: SHG-FAC-09)',
            verifiedByRole: 'Van Dhan SHG Facilitator',
            verifiedAt: nowStr,
            notes: `Aggregated under cluster route 04. Individual sovereign DBT entitlement ₹${m.totalAmount}.`,
          },
          step2: null,
          createdAt: nowStr,
          updatedAt: nowStr,
        });

        // 2. Queue in syncQueue
        await db.syncQueue.put({
          local_id: `ULID-GRP-${cleanId}-${timestampMs}`,
          batch_code: m.batchCode,
          entity: 'collection',
          action: 'create',
          actor: {
            id: 'SHG-FAC-09',
            name: 'Champa Majhi',
            role: 'SHG Facilitator',
          },
          payload: {
            collector: m.name,
            tribalId: m.tribalId,
            village: m.village,
            product: m.product,
            qtyKg: m.qtyKg,
            totalAmount: m.totalAmount,
            batchCode: m.batchCode,
          },
          state: isOffline ? 'queued' : 'synced',
          createdAt: timestampMs,
          updatedAt: timestampMs,
          retryCount: 0,
          approxSizeBytes: 850,
        });
      }

      // 3. Log audit event
      await db.auditEvents.put({
        id: `AUD-FAC-${timestampMs}`,
        timestamp: nowStr,
        actorId: 'SHG-FAC-09',
        actorName: 'Champa Majhi',
        actorRole: 'Van Dhan SHG Facilitator',
        actionType: 'AGGREGATION_INITIATED',
        title: `Group Consignment Dispatched: ${members.length} Collectors (${totalQtyKg.toFixed(1)} kg)`,
        description: `Consignment aggregated for transport under driver B. Soren. Sovereign receipts generated for ${members.map((m) => m.batchCode).join(', ')}.`,
        details: {
          collectorCount: members.length,
          totalQtyKg,
          totalEntitlement,
          status: isOffline ? 'Saved Offline' : 'Pending Verification',
        },
      });

      setActiveToast({
        id: `toast-${Date.now()}`,
        variant: isOffline ? 'warning' : 'success',
        title: isOffline ? 'Group Consignment Queued Locally' : 'Group Consignment Dispatched & Synced',
        description: isOffline
          ? `All ${members.length} records (${totalQtyKg.toFixed(1)} kg) safely queued in device IndexedDB.`
          : `Handshake verified. Sovereign A5 receipts ready for all ${members.length} collectors.`,
      });
    } catch (err) {
      console.warn('Dexie save error in facilitator:', err);
    }
  };

  return (
    <AppShell>
      <ToastContainer>
        {activeToast && (
          <Toast
            id={activeToast.id}
            variant={activeToast.variant}
            title={activeToast.title}
            description={activeToast.description}
            onClose={() => setActiveToast(null)}
          />
        )}
      </ToastContainer>

      {/* Facilitator First-Run Onboarding Modal (Rule 6) */}
      {!isOnboarded && isLoaded && (
        <FacilitatorOnboarding
          onRecordGroupPickup={handleRecordGroupPickup}
          onSkip={complete}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-rule pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold">
                Self-Help Group (SHG) Facilitator
              </span>
              <StatusBadge variant="neutral">Cluster Mode</StatusBadge>
            </div>
            <h1 className="font-heading text-[26px] font-bold text-ink leading-tight mt-1">
              Group Logistical Pickup & Multi-Receipt Dispatch
            </h1>
            <p className="text-[13px] text-ink-muted mt-0.5">
              Facilitator: Champa Majhi (ID: SHG-FAC-09) · Similipal North Cluster
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SyncStatusBadge state={isOffline ? 'queued' : 'synced'} />
          </div>
        </div>

        {/* Small Diagram: Three small bordered boxes with arrows (Rule 6) */}
        <div className="border border-rule rounded-[4px] p-5 bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <SectionLabel>Logistical Aggregation Engine</SectionLabel>
            <span className="text-[11px] font-mono text-ink-subtle">
              Rule 6 · 1 Aggregated Pickup → N Sovereign Receipts
            </span>
          </div>

          {/* Top Box: 1 Aggregated Pickup */}
          <div className="border border-rule rounded-[2px] p-3 bg-bg-sunken text-center max-w-[340px] mx-auto space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-ink-muted block font-bold">
              Aggregated Transport Pickup
            </span>
            <div className="font-heading text-[18px] font-bold text-ink tabular-nums">
              1 Transport Consignment ({totalQtyKg.toFixed(1)} kg)
            </div>
            <span className="text-[11px] font-mono text-ink-subtle block">
              Driver B. Soren · Similipal Corridor Route 04
            </span>
          </div>

          {/* Arrows */}
          <div className="flex justify-around max-w-[480px] mx-auto px-4 text-ink-subtle" aria-hidden="true">
            <div className="flex flex-col items-center">
              <ArrowDown size={16} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center">
              <ArrowDown size={16} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center">
              <ArrowDown size={16} strokeWidth={1.5} />
            </div>
          </div>

          {/* Bottom Boxes: Individual Collector Receipts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {members.map((m, idx) => (
              <div
                key={m.id}
                className="border border-rule rounded-[2px] p-3 bg-bg-sunken/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-ink-muted font-bold">
                    Receipt #{idx + 1}
                  </span>
                  <span className="font-heading text-[13px] font-bold text-accent tabular-nums">
                    {m.batchCode}
                  </span>
                </div>
                <div className="font-semibold text-ink text-[14px]">
                  {m.name}
                </div>
                <div className="text-[11px] text-ink-muted">
                  {m.village} · {m.tribalId}
                </div>
                <div className="flex items-center gap-2 pt-1 pb-0.5">
                  <div className="w-5 h-5 rounded-[2px] overflow-hidden border border-rule/50 bg-bg-sunken flex-shrink-0">
                    <ProductIcon product={m.product} size={20} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[12px] font-medium text-ink truncate">{m.product}</span>
                </div>
                <div className="border-t border-rule pt-1.5 flex items-baseline justify-between">
                  <span className="font-mono text-[12px] font-bold text-ink tabular-nums">
                    {m.qtyKg} kg
                  </span>
                  <span className="font-heading text-[14px] font-bold text-accent tabular-nums">
                    ₹{m.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-1">
                  <Link
                    href={`/collection/receipt/${m.batchCode.replace('#', '')}`}
                    target="_blank"
                    className="text-[11px] font-mono text-accent hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Individual A5 Receipt</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Intake Section */}
        <section id="group-intake-section" className="border border-rule rounded-[4px] p-5 bg-surface space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-rule pb-2 gap-2">
            <div>
              <SectionLabel>Group Roster</SectionLabel>
              <h2 className="font-heading text-[18px] font-bold text-ink">
                Record a pickup for a group
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-[36px] text-[12px]"
              >
                <Plus size={14} className="mr-1" />
                <span>{showAddForm ? 'Cancel' : 'Add Collector'}</span>
              </Button>

              <div className="text-right">
                <span className="text-[11px] font-mono uppercase text-ink-muted block">Total Roster Entitlement</span>
                <span className="font-heading text-[20px] font-bold text-accent tabular-nums">
                  ₹{totalEntitlement.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Add Collector to Roster Form */}
          {showAddForm && (
            <form onSubmit={handleAddMember} className="p-3.5 border border-rule rounded-[4px] bg-bg-sunken space-y-3">
              <span className="text-[12px] font-bold text-ink block uppercase tracking-wider font-mono">
                Add Collector to Consignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="member-name-input" className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Collector Full Name
                  </label>
                  <input
                    id="member-name-input"
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Parvati Hansdah"
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface text-[13px] text-ink focus:outline-accent"
                  />
                </div>
                <div>
                  <label htmlFor="member-village-input" className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Village
                  </label>
                  <input
                    id="member-village-input"
                    type="text"
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface text-[13px] text-ink focus:outline-accent"
                  />
                </div>
                <div>
                  <label htmlFor="member-product-select" className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Product
                  </label>
                  <select
                    id="member-product-select"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="w-full h-[36px] px-2 rounded-[2px] border border-rule bg-surface text-[13px] text-ink focus:outline-accent"
                  >
                    <option value="Dried Mahua Flowers">Dried Mahua Flowers (₹42/kg)</option>
                    <option value="Sal Tree Seeds">Sal Tree Seeds (₹28/kg)</option>
                    <option value="Wild Forest Honey">Wild Forest Honey (₹180/kg)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="member-qty-input" className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Quantity (kg)
                  </label>
                  <input
                    id="member-qty-input"
                    type="number"
                    min="1"
                    max="500"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface text-[13px] text-ink focus:outline-accent font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" size="sm" className="h-[36px] px-4">
                  Add to Consignment Roster
                </Button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="border border-rule rounded-[2px] overflow-x-auto">
            <table className="w-full text-[13px] border-collapse bg-surface text-left">
              <thead>
                <tr className="bg-bg-sunken border-b border-rule text-[11px] font-mono uppercase text-ink-muted">
                  <th scope="col" className="p-2.5">Collector</th>
                  <th scope="col" className="p-2.5">Village</th>
                  <th scope="col" className="p-2.5">Product</th>
                  <th scope="col" className="p-2.5 text-right">Quantity</th>
                  <th scope="col" className="p-2.5 text-right">Entitlement</th>
                  <th scope="col" className="p-2.5 text-center">Batch Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-bg-sunken/40">
                    <td className="p-2.5 font-sans font-semibold text-ink">{m.name}</td>
                    <td className="p-2.5 text-ink-muted">{m.village}</td>
                    <td className="p-2.5 font-sans text-ink">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-[2px] overflow-hidden border border-rule/50 bg-bg-sunken flex-shrink-0">
                          <ProductIcon product={m.product} size={20} className="w-full h-full object-cover" />
                        </div>
                        <span>{m.product}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-bold text-ink tabular-nums">{m.qtyKg} kg</td>
                    <td className="p-2.5 text-right font-bold text-accent tabular-nums">₹{m.totalAmount}</td>
                    <td className="p-2.5 text-center">
                      <Link
                        href={`/collection/receipt/${m.batchCode.replace('#', '')}`}
                        target="_blank"
                        className="text-accent hover:underline font-bold"
                      >
                        {m.batchCode} ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[12px] text-ink-subtle font-mono">
              Each collector is credited directly via DBT to their linked bank account.
            </p>

            <Button
              variant="primary"
              onClick={handleSubmitGroupConsignment}
              className="h-[44px] px-5"
            >
              {isGroupSubmitted ? '✓ Group Consignment Dispatched & Synced' : 'Submit Group Consignment'}
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
