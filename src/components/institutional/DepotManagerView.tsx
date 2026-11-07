'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Warehouse, Scale, ShieldAlert, FileText, ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DepotManagerViewProps {
  currentUser: {
    userId: string;
    username: string;
    role: string;
    fullName: string;
    centerId?: string;
    district: string;
  };
}

export const DepotManagerView: React.FC<DepotManagerViewProps> = ({ currentUser }) => {
  const [depotData, setDepotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/institutional/reports')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setDepotData(data.report);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const assignedDepot = currentUser.centerId || 'BRP-01';

  return (
    <div className="space-y-6">
      {/* Depot Overview Banner */}
      <div className="bg-cream border border-forest/20 rounded p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-forest text-cream px-2 py-0.5 rounded">
                CENTRAL DEPÔT: {assignedDepot}
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                Baripada Central Storage Terminal (Bay 1-4)
              </span>
            </div>
            <h2 className="text-xl font-serif text-forest font-bold">
              Warehouse Verification & Inventory Control
            </h2>
            <p className="text-xs text-ink-muted">
              Depot Manager: {currentUser.fullName} ({currentUser.username}) · Total Capacity: 50,000 kg (50 MT)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/inventory">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5 font-mono text-xs">
                Open Depôt Re-Weigh Terminal <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Depot Bay Allocation & Inventory Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-cream/60 border border-forest/15 p-4 rounded space-y-1">
          <div className="text-[10px] text-ink-muted uppercase">Verified Saleable Stock</div>
          <div className="text-base font-bold text-forest flex items-center gap-1.5">
            <Warehouse className="w-4 h-4 text-leaf" /> 0.0 kg Saleable Stock
          </div>
          <span className="text-[10px] text-ink-muted block">Bays 1-3 Reserved for Certified Batches</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded space-y-1">
          <div className="text-[10px] text-amber-700 uppercase">Incoming Gate Inbound</div>
          <div className="text-base font-bold text-amber-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-600" /> Lot #BS-402 (100.0 kg)
          </div>
          <span className="text-[10px] text-amber-700 block">Pending Tare & Reweigh at Gate Scale #01</span>
        </div>

        <div className="bg-cream/60 border border-forest/15 p-4 rounded space-y-1">
          <div className="text-[10px] text-ink-muted uppercase">Quarantine Isolation Hold</div>
          <div className="text-base font-bold text-forest flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-leaf" /> 0 Active Quarantine Holds
          </div>
          <span className="text-[10px] text-emerald-800 block">1.5% Shrinkage Tolerance Threshold Enforced</span>
        </div>
      </div>

      {/* Arrival Verification Queue */}
      <div className="border border-forest/15 rounded overflow-hidden">
        <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
            Inbound Consignment Gate Reweigh Queue
          </h3>
          <span className="text-[11px] font-mono text-ink-muted">Baripada Receiving Gate</span>
        </div>
        <div className="p-4 space-y-3 text-xs">
          <div className="p-4 bg-paper border border-forest/15 rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-forest">BS-402</span>
                <span className="font-semibold text-ink">Dried Mahua Flowers</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  AWAITING_GATE_REWEIGH
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Origin: Badagaon Point (KRN-01) · Field Net: 100.0 kg · Vehicle: OR-11-F-4412 · Seal: OD-ST-8840
              </p>
              <p className="text-[10px] font-mono text-forest/70">
                Allowable transit loss: 1.5% (Max 1.5 kg allowed)
              </p>
            </div>
            <div className="text-right shrink-0">
              <Link href="/inventory#reweigh">
                <Button size="sm" variant="primary" className="text-xs font-mono">
                  Perform Reweigh Verification
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

