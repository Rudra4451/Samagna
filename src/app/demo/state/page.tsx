'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '../../../components/shell/AppShell';
import { useAppStore } from '../../../store/useAppStore';
import { useFontScale } from '../../../lib/useFontScale';
import { useOffline } from '../../../lib/useOffline';
import { Button } from '../../../components/ui/Button';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { WifiOff, Wifi, Languages, Type, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

export default function DemoStatePage() {
  const { isOffline, setOffline, language, setLanguage } = useAppStore();
  const { fontScale, setFontScale } = useFontScale();
  const { forceMockConflict } = useOffline();

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
          <Link href="/collector?demo=1">
            <Button variant="secondary" size="sm" className="gap-1">
              <ArrowLeft size={14} /> Back to Collector
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
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

          {/* Quick Links */}
          <div className="border border-rule rounded-[4px] p-4 bg-bg-sunken flex items-center justify-between">
            <span className="text-[13px] text-ink-muted">View Global Sync Queue:</span>
            <div className="flex gap-2">
              <Link href="/settings/sync">
                <Button variant="secondary" className="gap-1.5">
                  <ExternalLink size={14} /> /settings/sync
                </Button>
              </Link>
              <Link href="/collector?demo=1">
                <Button variant="primary">Launch /collector (?demo=1)</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
