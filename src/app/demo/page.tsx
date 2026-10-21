'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppShell } from '../../components/shell/AppShell';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';
import { resetDemoState, DEMO_ACTS } from '../../demo/seedData';
import { db } from '../../lib/db';

function DemoHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isDemo = searchParams.get('demo') === '1';

  const [activeAct, setActiveAct] = useState<number>(1);
  const [resetting, setResetting] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    if (!isDemo) return;
    const loadCounts = async () => {
      try {
        const bCount = await db.batches.count();
        const sCount = await db.syncQueue.count();
        setBatchCount(bCount);
        setPendingSyncCount(sCount);
      } catch (e) {
        console.error('Error loading DB counts', e);
      }
    };
    loadCounts();
  }, [isDemo]);

  // If not reachable with ?demo=1, gate the view
  if (!isDemo) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-[4px] border border-rule bg-bg-sunken flex items-center justify-center text-ink-muted">
            <Lock size={22} strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-[24px] font-semibold text-ink">
              Stage Demo Restricted Surface
            </h1>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              This orchestration surface is designed exclusively for the 3-minute stage presentation. It requires explicit evaluator activation.
            </p>
          </div>
          <div>
            <Link href="/demo?demo=1">
              <Button variant="primary" className="h-[40px] px-5">
                Launch Stage Demo (?demo=1)
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleLaunchAct = async (actNum: number, route: string) => {
    setActiveAct(actNum);
    router.push(`${route}&script=1`);
  };

  const handleResumeAct = async (actNum: number, route: string) => {
    setResetting(true);
    await resetDemoState(actNum);
    setActiveAct(actNum);
    setResetting(false);
    router.push(`${route}&script=1`);
  };

  const handleResetPristine = async () => {
    setResetting(true);
    await resetDemoState(1);
    setResetting(false);
    router.refresh();
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 py-4">
        {/* Stage Header Banner */}
        <div className="border border-rule bg-surface p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-accent text-accent-ink px-2 py-0.5 rounded-[2px]">
                  BanaSetu Stage Engine
                </span>
                <span className="font-mono text-[11px] text-ink-muted">
                  3-Minute Script Orchestrator
                </span>
              </div>
              <h1 className="font-heading text-[28px] font-bold text-ink">
                Stage Demo Control & Recovery Hub
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPristine}
                disabled={resetting}
                className="h-[36px] px-3.5 rounded-[2px] border border-danger/80 bg-danger/10 hover:bg-danger/20 text-danger text-[12px] font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>{resetting ? 'Resetting…' : 'Reset All to Boot Baseline'}</span>
              </button>
            </div>
          </div>

          <p className="text-[14px] text-ink-muted max-w-3xl leading-relaxed">
            Every step of the 3-minute stage flow is deterministic, zero-typing, and protected by offline fallback slides. If you accidentally navigate away on stage, use the <strong className="text-ink">Resume from Act</strong> controls below to restore the exact state instantaneously.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[12px] font-mono">
            <div className="border border-rule p-2.5 bg-bg-sunken/40">
              <div className="text-ink-muted text-[11px]">STAGE TIMING BUDGET</div>
              <div className="font-semibold text-ink text-[14px]">2:45 (+15s buffer)</div>
            </div>
            <div className="border border-rule p-2.5 bg-bg-sunken/40">
              <div className="text-ink-muted text-[11px]">NETWORK SIMULATION</div>
              <div className="font-semibold text-success text-[14px]">Forced Online / Det.</div>
            </div>
            <div className="border border-rule p-2.5 bg-bg-sunken/40">
              <div className="text-ink-muted text-[11px]">PRE-SEEDED BATCHES</div>
              <div className="font-semibold text-ink text-[14px]">#BS-400 & #BS-402</div>
            </div>
            <div className="border border-rule p-2.5 bg-bg-sunken/40">
              <div className="text-ink-muted text-[11px]">DISCREPANCY RENDER</div>
              <div className="font-semibold text-accent text-[14px]">&lt; 300ms precomputed</div>
            </div>
          </div>
        </div>

        {/* 3-Minute Script Act Navigation */}
        <div className="space-y-4">
          <SectionLabel as="h2">01 / The Three-Minute Stage Timeline (Recovery & Launch)</SectionLabel>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Act 1 Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-accent">
                    0:30–1:30 (60s)
                  </span>
                  <StatusBadge variant="warning">Village Pickup</StatusBadge>
                </div>
                <CardTitle className="text-[18px]">Act 1 · Collector & Collection</CardTitle>
                <CardDescription>
                  Sunita Soren logs 100 kg Mahua at Badagaon Point. Queued sync, instant receipt, A6 bag stencil tag.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-[12px] text-ink-muted border border-rule p-2.5 bg-bg-sunken space-y-1 font-mono">
                  <div>• Role: Tribal Collector & Field Manager</div>
                  <div>• Pre-filled: 100, 0, 100 kg (Zero-typing)</div>
                  <div>• Stencil: OD-MBJ-KRN-402</div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full h-[36px]"
                    onClick={() => handleLaunchAct(1, '/collector?demo=1')}
                  >
                    <Play size={14} className="mr-1.5" /> Launch Act 1 (/collector)
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-[32px] text-[12px]"
                    onClick={() => handleResumeAct(1, '/collector?demo=1')}
                  >
                    Resume from start of Act 1
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Act 2 Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-danger">
                    1:30–2:30 (60s)
                  </span>
                  <StatusBadge variant="danger">Discrepancy</StatusBadge>
                </div>
                <CardTitle className="text-[18px]">Act 2 · Warehouse Discrepancy</CardTitle>
                <CardDescription>
                  Depôt re-weigh at 95 kg triggers 3.5 kg excess transit shrinkage in &lt;300ms. Non-accusatory quarantine.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-[12px] text-ink-muted border border-rule p-2.5 bg-bg-sunken space-y-1 font-mono">
                  <div>• Role: Inventory Manager (S. Das)</div>
                  <div>• Arrival Re-weigh: Pre-filled 95.0 kg</div>
                  <div>• Deficit: -3.5 kg excess vs 1.5% tolerance</div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full h-[36px]"
                    onClick={() => handleLaunchAct(2, '/inventory?demo=1')}
                  >
                    <Play size={14} className="mr-1.5" /> Launch Act 2 (/inventory)
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-[32px] text-[12px]"
                    onClick={() => handleResumeAct(2, '/inventory?demo=1')}
                  >
                    Resume from start of Act 2
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Act 3 Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-info">
                    2:30–3:00 (30s)
                  </span>
                  <StatusBadge variant="info">Safeguards & Audit</StatusBadge>
                </div>
                <CardTitle className="text-[18px]">Act 3 · Safeguards & Audit</CardTitle>
                <CardDescription>
                  Cryptographic custody hash, historical #BS-395 resolution precedent, and tribal payout defense.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="text-[12px] text-ink-muted border border-rule p-2.5 bg-bg-sunken space-y-1 font-mono">
                  <div>• Historical Case: #BS-395 resolved</div>
                  <div>• Precedent: Moisture sensor reconciled</div>
                  <div>• Collector DBT: 100% Payout Guaranteed</div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    className="w-full h-[36px]"
                    onClick={() => handleLaunchAct(3, '/collection/receipt/BS-402?demo=1')}
                  >
                    <Play size={14} className="mr-1.5" /> Launch Act 3 (Receipt & Audit)
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-[32px] text-[12px]"
                    onClick={() => handleResumeAct(3, '/collection/receipt/BS-402?demo=1')}
                  >
                    Resume from start of Act 3
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pre-Seeded State Verification Table */}
        <div className="space-y-4">
          <SectionLabel as="h2">02 / Rule 1 Pre-Seeded State Verification</SectionLabel>

          <div className="border border-rule bg-surface overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-rule bg-bg-sunken text-[11px] font-mono uppercase text-ink-muted">
                  <th scope="col" className="py-2.5 px-4 font-semibold">Entity / Seed Item</th>
                  <th scope="col" className="py-2.5 px-4 font-semibold">Identifier & Details</th>
                  <th scope="col" className="py-2.5 px-4 font-semibold">Pre-Seeded Purpose</th>
                  <th scope="col" className="py-2.5 px-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-mono text-[12px]">
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">3 Collectors (2 Villages)</td>
                  <td className="py-2.5 px-4 text-ink-muted">Sunita Soren, Budhu Marndi (Badagaon) &amp; Kamla Majhi (Kadamdiha)</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">Multi-village aggregation baseline</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-success font-semibold">SEEDED</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">Facilitator &amp; Managers</td>
                  <td className="py-2.5 px-4 text-ink-muted">Champa Majhi (SHG-FAC-09), R. Mohanty (CM-12), S. Das (IM-04)</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">3-role chain of custody actors</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-success font-semibold">SEEDED</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">Batch #BS-400</td>
                  <td className="py-2.5 px-4 text-ink-muted">₹42.00/kg · 60.0 kg verified stock</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">&quot;Already working&quot; warehouse stock baseline</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-success font-semibold">VERIFIED</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">Batch #BS-402</td>
                  <td className="py-2.5 px-4 text-ink-muted">100.0 kg collection record · arrival not entered</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">Target lot for live stage discrepancy</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-warning font-semibold">PENDING</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">Queued Offline Record</td>
                  <td className="py-2.5 px-4 text-ink-muted">Pickup request from Budhu Marndi (35 kg · #BS-403)</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">Demonstrates offline queue badge &amp; sync</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-warning font-semibold">QUEUED</span></td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-sans font-medium text-ink">Historical Case #BS-395</td>
                  <td className="py-2.5 px-4 text-ink-muted">80.0 kg dispatch vs 78.5 kg arrival (-1.5 kg natural shrinkage)</td>
                  <td className="py-2.5 px-4 text-ink-muted font-sans">&quot;Resolved by supervisor&quot; precedent</td>
                  <td className="py-2.5 px-4 text-right"><span className="text-info font-semibold">RESOLVED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Evaluator Links & Offline Fallback Resources */}
        <div className="space-y-4">
          <SectionLabel as="h2">03 / Stage Fallback Resources &amp; Post-Demo Hand-off</SectionLabel>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/demo/fallback-slides" className="block">
              <div className="border border-rule bg-surface p-4 hover:border-ink transition-colors space-y-2 h-full">
                <div className="flex items-center justify-between text-ink">
                  <span className="font-semibold text-[14px]">Offline Fallback Deck</span>
                  <ExternalLink size={14} className="text-ink-muted" />
                </div>
                <p className="text-[12px] text-ink-muted">
                  6 high-resolution 2x slides and printable PDF page covering every second of the 3-minute script.
                </p>
                <div className="font-mono text-[11px] text-accent">View /demo/fallback-slides &rarr;</div>
              </div>
            </Link>

            <Link href="/demo/handoff" className="block">
              <div className="border border-rule bg-surface p-4 hover:border-ink transition-colors space-y-2 h-full">
                <div className="flex items-center justify-between text-ink">
                  <span className="font-semibold text-[14px]">Post-Demo Evaluator Handoff</span>
                  <ExternalLink size={14} className="text-ink-muted" />
                </div>
                <p className="text-[12px] text-ink-muted">
                  QR code link to static deck, &quot;What&apos;s mocked&quot; list, architecture summary, and team contacts.
                </p>
                <div className="font-mono text-[11px] text-accent">View /demo/handoff &rarr;</div>
              </div>
            </Link>

            <Link href="/demo/state?demo=1" className="block">
              <div className="border border-rule bg-surface p-4 hover:border-ink transition-colors space-y-2 h-full">
                <div className="flex items-center justify-between text-ink">
                  <span className="font-semibold text-[14px]">Live State Inspector</span>
                  <ExternalLink size={14} className="text-ink-muted" />
                </div>
                <p className="text-[12px] text-ink-muted">
                  Inspect raw IndexedDB tables, force simulated sync conflicts, and verify anti-slop rules.
                </p>
                <div className="font-mono text-[11px] text-accent">View /demo/state &rarr;</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function DemoHubPage() {
  return (
    <Suspense fallback={null}>
      <DemoHubContent />
    </Suspense>
  );
}
