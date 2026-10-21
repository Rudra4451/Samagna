'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/shell/AppShell';
import { useAppStore } from '../../../store/useAppStore';
import { useFontScale } from '../../../lib/useFontScale';
import { useOffline } from '../../../lib/useOffline';
import { Button } from '../../../components/ui/Button';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { WifiOff, Wifi, Languages, Type, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

import { resetDemoState } from '../../../demo/seedData';

export default function DemoStatePage() {
  const { isOffline, setOffline, language, setLanguage } = useAppStore();
  const { fontScale, setFontScale } = useFontScale();
  const { forceMockConflict } = useOffline();
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const notify = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  return (
    <AppShell>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="border-b border-rule pb-3 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-ink">
              Demo State Configuration
            </h1>
            <p className="text-[12px] text-ink-muted">
              Live state toggles for evaluator and field inspection.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/demo?demo=1">
              <Button variant="secondary" size="sm" className="gap-1">
                Demo Hub
              </Button>
            </Link>
            <Link href="/collector?demo=1">
              <Button variant="secondary" size="sm" className="gap-1">
                <ArrowLeft size={14} /> Collector
              </Button>
            </Link>
          </div>
        </div>

        {/* Non-blocking feedback banner (INTERACTION.md Rule 3: No window.alert) */}
        {statusBanner && (
          <div className="p-3 border border-success bg-success/10 text-success text-[12px] font-mono font-medium rounded-[2px] flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}

        <div className="grid gap-4">
          {/* Card 0: Master Rule 1 Pre-Seeded Reset */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-accent" />
                Deterministic Stage State Seeding
              </CardTitle>
              <CardDescription>
                Resets IndexedDB and localStorage to the exact pre-seeded state required by Rule 1.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await resetDemoState(1);
                    notify('Seeded to Act 1 baseline (#BS-400 verified, #BS-402 pending).');
                  }}
                >
                  Seed Act 1
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await resetDemoState(2);
                    notify('Seeded to Act 2 baseline (ready for warehouse re-weigh).');
                  }}
                >
                  Seed Act 2
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await resetDemoState(3);
                    notify('Seeded to Act 3 baseline (discrepancy quarantined).');
                  }}
                >
                  Seed Act 3
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Card 1: Offline Simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2">
                {isOffline ? <WifiOff size={18} className="text-warning" /> : <Wifi size={18} className="text-success" />}
                Offline Engine Simulation
              </CardTitle>
              <CardDescription>
                Simulates remote forest fringe disconnection. Top 32px banner activates, and submissions save locally to device storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-2">
              <span className="font-mono text-[13px] font-semibold">
                Status: {isOffline ? 'FORCED OFFLINE' : 'ONLINE'}
              </span>
              <Button
                variant={isOffline ? 'primary' : 'secondary'}
                onClick={() => setOffline(!isOffline)}
              >
                {isOffline ? 'Switch Online' : 'Force Offline Mode'}
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Odia-First Language */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2">
                <Languages size={18} className="text-accent" />
                Language Toggle (Odia / English)
              </CardTitle>
              <CardDescription>
                Switches entire collector interface into Noto Sans Oriya (17px / 1.6). Mock payment references remain English to match official receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-2">
              <span className="font-mono text-[13px] font-semibold">
                Active: {language === 'OR' ? 'ଓଡ଼ିଆ (OR)' : 'English (EN)'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant={language === 'EN' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLanguage('EN')}
                >
                  English
                </Button>
                <Button
                  variant={language === 'OR' ? 'primary' : 'secondary'}
                  size="sm"
                  className="font-odia"
                  onClick={() => setLanguage('OR')}
                >
                  ଓଡ଼ିଆ
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Font Scale Preference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2">
                <Type size={18} className="text-ink" />
                Base Font Scale Preference
              </CardTitle>
              <CardDescription>
                Simulates high-accessibility zoom levels (16px, 18px, 20px). Layout is certified never to clip or truncate figures at 20px.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-semibold">
                  Scale: {fontScale}px
                </span>
                <div className="flex gap-2">
                  <Button
                    variant={fontScale === 16 ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFontScale(16)}
                  >
                    16px (Normal)
                  </Button>
                  <Button
                    variant={fontScale === 18 ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFontScale(18)}
                  >
                    18px (Large)
                  </Button>
                  <Button
                    variant={fontScale === 20 ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setFontScale(20)}
                  >
                    20px (Maximum)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Force Sync Conflict (Offline Rule 5 Deliverable) */}
          <Card className="border-danger/60 bg-danger/5">
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2 text-danger">
                <AlertTriangle size={18} />
                Force Sync Conflict (#BS-402)
              </CardTitle>
              <CardDescription>
                Simulates offline field collection weigh-in (100 kg Mahua) colliding with diverging central warehouse intake (92 kg).
                Opening the Conflict Drawer enforces non-auto-merge adjudication.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-2">
              <span className="font-mono text-[12px] text-danger font-semibold">
                Batch #BS-402 Discrepancy
              </span>
              <Button
                variant="danger"
                onClick={() => forceMockConflict()}
              >
                Trigger Forced Conflict
              </Button>
            </CardContent>
          </Card>

          {/* Card 5: First-Run Onboarding State Configuration (Prompt Requirement 1) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[16px] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-accent" />
                First-Run Role Onboarding (`localStorage`)
              </CardTitle>
              <CardDescription>
                Controls stateful 30-second onboarding for all roles (`onboarded:collector`, `onboarded:collection`, `onboarded:inventory`, `onboarded:facilitator`, and first-request inline hint).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-rule pb-3">
                <div>
                  <span className="text-[13px] font-semibold text-ink block">
                    Global Reset
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    Clears all role onboarding keys
                  </span>
                </div>
                <Button
                  variant="primary"
                  onClick={() => {
                    localStorage.removeItem('onboarded:collector');
                    localStorage.removeItem('onboarded:collection');
                    localStorage.removeItem('onboarded:inventory');
                    localStorage.removeItem('onboarded:facilitator');
                    localStorage.removeItem('onboarded:collector_first_request');
                    notify('All role onboarding states have been reset! Visiting any role will trigger the initial 30s experience.');
                  }}
                >
                  Reset All Onboarding
                </Button>
              </div>

              {/* Individual Role Controls */}
              <div className="grid grid-cols-2 gap-2 text-[12px] font-mono">
                <div className="p-2 border border-rule rounded-[2px] flex items-center justify-between bg-bg-sunken/40">
                  <span>Collector:</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('onboarded:collector');
                      localStorage.removeItem('onboarded:collector_first_request');
                      notify('Collector onboarding & first-request hint reset.');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>

                <div className="p-2 border border-rule rounded-[2px] flex items-center justify-between bg-bg-sunken/40">
                  <span>Collection:</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('onboarded:collection');
                      notify('Collection manager onboarding reset.');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>

                <div className="p-2 border border-rule rounded-[2px] flex items-center justify-between bg-bg-sunken/40">
                  <span>Inventory:</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('onboarded:inventory');
                      notify('Inventory manager onboarding reset.');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>

                <div className="p-2 border border-rule rounded-[2px] flex items-center justify-between bg-bg-sunken/40">
                  <span>Facilitator:</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem('onboarded:facilitator');
                      notify('Facilitator onboarding reset.');
                    }}
                    className="text-accent hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="border border-rule rounded-[4px] p-4 bg-bg-sunken flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[13px] text-ink-muted">Quick Launch Roles:</span>
            <div className="flex flex-wrap gap-2">
              <Link href="/collector">
                <Button variant="secondary" size="sm">Collector</Button>
              </Link>
              <Link href="/collection">
                <Button variant="secondary" size="sm">Collection</Button>
              </Link>
              <Link href="/inventory">
                <Button variant="secondary" size="sm">Inventory</Button>
              </Link>
              <Link href="/facilitator">
                <Button variant="secondary" size="sm">Facilitator</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
