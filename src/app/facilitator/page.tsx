'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/shell/AppShell';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { SyncStatusBadge } from '../../components/ui/SyncStatusBadge';
import { SectionLabel } from '../../components/ui/SectionLabel';
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
} from 'lucide-react';
import { cn } from '../../lib/utils';

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

  const totalQtyKg = members.reduce((acc, m) => acc + m.qtyKg, 0);
  const totalEntitlement = members.reduce((acc, m) => acc + m.totalAmount, 0);

  const handleRecordGroupPickup = () => {
    complete();
    // Scroll to group form
    document.getElementById('group-intake-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AppShell>
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

          {/* Bottom Three Boxes: Individual Collector Receipts */}
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
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div>
              <SectionLabel>Group Roster</SectionLabel>
              <h2 className="font-heading text-[18px] font-bold text-ink">
                Record a pickup for a group
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono uppercase text-ink-muted block">Total Roster Entitlement</span>
              <span className="font-heading text-[20px] font-bold text-accent tabular-nums">
                ₹{totalEntitlement.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

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
                    <td className="p-2.5 font-sans text-ink">{m.product}</td>
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
          <div className="pt-2 flex items-center justify-between">
            <p className="text-[12px] text-ink-subtle font-mono">
              Each collector is credited directly via DBT to their linked bank account.
            </p>

            <Button
              variant="primary"
              onClick={() => setIsGroupSubmitted(true)}
              className="h-[44px] px-5"
            >
              {isGroupSubmitted ? '✓ Group Consignment Dispatched' : 'Submit Group Consignment'}
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
