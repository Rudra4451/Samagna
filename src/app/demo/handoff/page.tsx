'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { AppShell } from '../../../components/shell/AppShell';
import { SectionLabel } from '../../../components/ui/SectionLabel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  FileCheck2,
  Download,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DemoHandoffPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    // Generate QR linking to static repository / presentation deck
    QRCode.toDataURL(
      'https://github.com/banasetu-odisha/integrity-ledger',
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#1F1A14',
          light: '#FAF6EE',
        },
      },
      (err, url) => {
        if (!err && url) setQrCodeUrl(url);
      }
    );
  }, []);

  const mockedList = [
    {
      domain: 'Rates & MSP Schedule',
      status: 'Simulated',
      detail: 'TDCCOL / LABHA Yojana 2024 seasonal minimum support price circular (Ref: TDC/MFP/2024-R4). Real-world implementation would poll state e-Procurement portal APIs.',
    },
    {
      domain: 'Payments & Banking DBT',
      status: 'Simulated',
      detail: 'Direct Benefit Transfer disbursement references (e.g. DBT-OD-2024-8841) are deterministic mock strings. Protects tribal gatherers by verifying amount calculations before PFMS submission.',
    },
    {
      domain: 'Identity & Authentication',
      status: 'Simulated',
      detail: 'Aadhaar / Tribal Gatherer ID tokens (e.g. OR-MAY-KRN-0842) are tokenized locally to maintain evaluator privacy while demonstrating biometric-ready field attribution.',
    },
    {
      domain: 'Network & Cloud Sync',
      status: 'Simulated',
      detail: 'Offline-first sync engine writes durably to Dexie IndexedDB before background sync. On stage, network connectivity is simulated to ensure 100% deterministic demo execution.',
    },
    {
      domain: 'Physical Evidence Photos',
      status: 'Simulated',
      detail: 'Evidence plates (scale readouts, stenciled gunny sacks, tied tarpaulin bed) are high-contrast procedural SVG linework drawings rather than live camera uploads.',
    },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        {/* Header Title */}
        <div className="border-b border-rule pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-ink text-surface px-2 py-0.5 rounded-[2px]">
                Stage Post-Demo Handoff
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                Act 3 Evaluator Dossier
              </span>
            </div>
            <h1 className="font-heading text-[28px] font-bold text-ink">
              BanaSetu Field Dossier &amp; Evaluator Handoff
            </h1>
          </div>
          <Link href="/demo?demo=1">
            <Button variant="secondary" className="gap-1.5 h-[36px]">
              <ArrowLeft size={14} /> Back to Demo Hub
            </Button>
          </Link>
        </div>

        {/* QR Code & Deck Link Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-rule bg-surface p-5 flex flex-col items-center justify-center text-center space-y-3">
            <div className="text-[12px] font-mono font-semibold uppercase text-ink-muted">
              Slide Deck &amp; Source Repository
            </div>
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="BanaSetu Evaluator QR"
                className="w-40 h-40 border border-rule p-1 bg-surface"
              />
            ) : (
              <div className="w-40 h-40 border border-rule bg-bg-sunken flex items-center justify-center text-[12px] font-mono text-ink-muted">
                Generating QR…
              </div>
            )}
            <div className="font-mono text-[11px] text-ink-subtle break-all">
              github.com/banasetu-odisha
            </div>
          </div>

          <div className="md:col-span-2 border border-rule bg-surface p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-accent uppercase">
                Architecture Summary
              </span>
              <h2 className="font-heading text-[20px] font-semibold text-ink">
                Dual-Ledger Minor Forest Produce Integrity System
              </h2>
              <p className="text-[13px] text-ink-muted leading-relaxed">
                BanaSetu bridges tribal primary gathering centers in Mayurbhanj with TDCCOL state warehouses. Built with strict anti-slop rules: zero box-shadows, zero gradients, 1px structural rules, Fraunces headings, IBM Plex Sans body, Noto Sans Oriya bilingual typography, and exactly 4 hardware-accelerated motion patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-rule text-[12px] font-mono">
              <div>
                <span className="text-ink-muted text-[10px] block">AESTHETICS</span>
                <span className="font-semibold text-ink">Matte Warm Paper</span>
              </div>
              <div>
                <span className="text-ink-muted text-[10px] block">OFFLINE STORAGE</span>
                <span className="font-semibold text-ink">Dexie (IndexedDB)</span>
              </div>
              <div>
                <span className="text-ink-muted text-[10px] block">AUDIT HASH</span>
                <span className="font-semibold text-ink">SHA-256 Monotonic</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's Mocked Checklist */}
        <div className="space-y-4">
          <div>
            <SectionLabel as="h2">01 / Full Transparency: What&apos;s Mocked vs What&apos;s Real</SectionLabel>
            <p className="text-[13px] text-ink-muted mt-1">
              To guarantee zero surprises on stage, all third-party integrations are mocked deterministically:
            </p>
          </div>

          <div className="border border-rule bg-surface overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-rule bg-bg-sunken text-[11px] font-mono uppercase text-ink-muted">
                  <th scope="col" className="py-2.5 px-4 font-semibold w-48">System Domain</th>
                  <th scope="col" className="py-2.5 px-4 font-semibold w-28">Status</th>
                  <th scope="col" className="py-2.5 px-4 font-semibold">Implementation Detail in BanaSetu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule text-[12px]">
                {mockedList.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-4 font-mono font-medium text-ink">
                      {item.domain}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] border border-warning bg-warning/10 text-warning">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-ink-muted leading-relaxed font-sans text-[13px]">
                      {item.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact & Team Information */}
        <div className="space-y-4">
          <SectionLabel as="h2">02 / Team &amp; Institutional Governance</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[16px]">Tribal Development Co-operative Corporation of Odisha</CardTitle>
                <CardDescription>
                  TDCCOL MFP Digital Procurement Initiative · Bhubaneswar &amp; Mayurbhanj
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-[13px] text-ink-muted">
                <div>Field Office: Karanjia Primary Procurement Point #04</div>
                <div>Central Depôt: Baripada Central Warehouse #02</div>
                <div className="font-mono text-[11px] text-ink-subtle pt-2">
                  Official Mandate: LABHA Yojana Minimum Support Price Administration
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[16px]">BanaSetu Development &amp; Architecture Team</CardTitle>
                <CardDescription>
                  Product Pair · Offline-First Inclusive Public Systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-[13px] text-ink-muted">
                <div>Lead Architecture: BanaSetu Protocol Group</div>
                <div>Design &amp; Accessibility: WCAG 2.1 AA / ISO/IEC 25010</div>
                <div className="font-mono text-[11px] text-accent pt-2">
                  Contact: team@banasetu.org · Mayurbhanj Pilot
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
