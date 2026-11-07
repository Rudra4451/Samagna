'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Scale, Truck, Users, QrCode, CheckCircle2, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CenterManagerViewProps {
  currentUser: {
    userId: string;
    username: string;
    role: string;
    fullName: string;
    centerId?: string;
    district: string;
  };
}

export const CenterManagerView: React.FC<CenterManagerViewProps> = ({ currentUser }) => {
  const [centerData, setCenterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/institutional/reports')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setCenterData(data.report);
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

  const assignedCenter = currentUser.centerId || 'KRN-01';

  return (
    <div className="space-y-6">
      {/* Center Overview Banner */}
      <div className="bg-cream border border-forest/20 rounded p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-forest text-cream px-2 py-0.5 rounded">
                CENTER FACILITY: {assignedCenter}
              </span>
              <span className="text-[11px] font-mono text-ink-muted">
                Karanjia Block Aggregation Depot
              </span>
            </div>
            <h2 className="text-xl font-serif text-forest font-bold">
              Field Collection & Dispatch Terminal
            </h2>
            <p className="text-xs text-ink-muted">
              Manager: {currentUser.fullName} ({currentUser.username}) · Scope: Karanjia Block & Buffer SHG Clusters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/collection">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5 font-mono text-xs">
                Open Field Weighment Console <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-cream/60 border border-forest/15 p-4 rounded space-y-1">
          <div className="text-[10px] text-ink-muted uppercase">Electronic Scale Calibration</div>
          <div className="text-base font-bold text-forest flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-leaf" /> Scale #04 Certified (±0.05kg)
          </div>
          <span className="text-[10px] text-emerald-800 block">Verified on 2024-04-18 · Zero-tare verified</span>
        </div>

        <div className="bg-cream/60 border border-forest/15 p-4 rounded space-y-1">
          <div className="text-[10px] text-ink-muted uppercase">Active Transit Waybills</div>
          <div className="text-base font-bold text-forest flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-leaf" /> Lot #BS-402 in Transit
          </div>
          <span className="text-[10px] text-ink-muted block">Vehicle: OR-11-F-4412 (Destination: Baripada)</span>
        </div>

        <div className="bg-cream/60 border border-forest/15 p-4 rounded space-y-1">
          <div className="text-[10px] text-ink-muted uppercase">Tribal Gatherer Direct Payouts</div>
          <div className="text-base font-bold text-emerald-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-leaf" /> 3 Gatherers Weighed
          </div>
          <span className="text-[10px] text-emerald-800 block">100% MSP Rate Protected · ₹4,200.00 Disbursed</span>
        </div>
      </div>

      {/* Active Batches Section */}
      <div className="border border-forest/15 rounded overflow-hidden">
        <div className="bg-forest/5 px-4 py-2.5 border-b border-forest/15 flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-forest uppercase tracking-wider">
            Consignment Custody & Transit Seals
          </h3>
          <span className="text-[11px] font-mono text-ink-muted">Baripada Central Depot Destination</span>
        </div>
        <div className="p-4 space-y-3 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-paper border border-forest/10 rounded">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-forest">BS-402</span>
                <span className="font-semibold text-ink">Dried Mahua Flowers (Madhuca longifolia)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  DISPATCHED_IN_TRANSIT
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-0.5">
                Gross: 104.2 kg · Tare: 4.2 kg · Net Accepted: 100.0 kg · Sacks: 3 Jute Gunny Bags
              </p>
              <p className="text-[10px] font-mono text-forest/70 mt-1">
                Security Seal Tag: <code className="bg-cream px-1">OD-ST-8840</code> · Waybill: <code className="bg-cream px-1">WB-KRN-BRP-2024-001</code>
              </p>
            </div>
            <div className="text-right shrink-0">
              <Link href="/collection/tag/BS-402">
                <Button size="sm" variant="secondary" className="text-xs font-mono">
                  Inspect Stencil Tag
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

