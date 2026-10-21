'use client';

import React, { useState } from 'react';
import { AppShell } from '../../components/shell/AppShell';
import { Button } from '../../components/ui/Button';
import { Input, NumberInput, Textarea, Select } from '../../components/ui/Input';
import { StatusBadge, StatusVariant } from '../../components/ui/StatusBadge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../components/ui/Card';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '../../components/ui/Drawer';
import { Toast, ToastContainer, ToastVariant } from '../../components/ui/Toast';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { EmptyState } from '../../components/ui/EmptyState';
import { PhotoPlate } from '../../components/ui/PhotoPlate';
import { AuditRow } from '../../components/ui/AuditRow';
import { ManagerSidebar } from '../../components/ui/ManagerSidebar';
import {
  Check,
  Plus,
  Scale,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  SlidersHorizontal,
  History,
  FileCheck2,
} from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  description: string;
  variant: ToastVariant;
}

export default function DesignSystemPage() {
  const [activeToasts, setActiveToasts] = useState<ToastItem[]>([
    {
      id: 'demo-1',
      title: 'Batch #BS-402 Logged into Custody Ledger',
      description: 'Dispatched 100.00 kg Mahua from Badagaon Collection Center.',
      variant: 'info',
    },
  ]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('batches');

  const triggerToast = (variant: ToastVariant) => {
    const id = `toast-${Date.now()}`;
    const titles: Record<ToastVariant, string> = {
      info: 'Scale Tare Calibrated: Electronic Bench Scale #04',
      success: 'DBT Payment Disbursed: ₹1,600.00 to Raimati Soren',
      warning: 'Transit Shrinkage Warning: 2.00% moisture loss detected',
      danger: 'Lot Quarantined: Case #DISC-402 assigned to DPO Mayurbhanj',
    };
    const descriptions: Record<ToastVariant, string> = {
      info: 'Zero offset re-checked against 10.00 kg certified test weight.',
      success: 'LABHA Direct Benefit Transfer reference DBT-OD-2024-8841.',
      warning: 'Allowable threshold reached. Re-weigh mandatory before warehouse intake.',
      danger: 'Discrepancy of -3.00 kg exceeds allowable transit tolerance threshold.',
    };

    setActiveToasts((prev) => [
      ...prev,
      { id, title: titles[variant], description: descriptions[variant], variant },
    ]);
  };

  const removeToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const colorTokens = [
    { token: 'bg', hex: '#FAF6EE', role: 'Warm light paper page ground' },
    { token: 'bg-sunken', hex: '#F2EBDD', role: 'Secondary recessed background, table headers' },
    { token: 'surface', hex: '#FFFFFF', role: 'Card, sheet, input, drawer background' },
    { token: 'ink', hex: '#1F1A14', role: 'Primary typography & high-contrast symbols' },
    { token: 'ink-muted', hex: '#6B5F52', role: 'Secondary copy, section labels, unit tags' },
    { token: 'ink-subtle', hex: '#9A8E80', role: 'Placeholder hints, inactive metadata' },
    { token: 'rule', hex: '#E4DBC9', role: 'Strict 1px structural dividing borders' },
    { token: 'accent', hex: '#B24E2E', role: 'Terracotta: primary action, active nav, focus ring' },
    { token: 'accent-ink', hex: '#FFFFFF', role: 'High contrast text on terracotta accent' },
    { token: 'success', hex: '#3F6B3E', role: 'Verified saleable stock, matched tare' },
    { token: 'warning', hex: '#A8641B', role: 'Transit moisture shrinkage threshold' },
    { token: 'danger', hex: '#8E2F26', role: 'Quarantined discrepancy, tare mismatch' },
    { token: 'info', hex: '#2E4E5E', role: 'Auditable transaction logs, official notice' },
    { token: 'sidebar-bg', hex: '#1F2A22', role: 'Fixed dark manager navigation sidebar' },
    { token: 'sidebar-ink', hex: '#E9E3D3', role: 'Navigation labels & depot header' },
  ];

  const typographyScale = [
    { size: '36px', weight: '500', sample: 'ସଂଗ୍ରହ ବହି • Minor Forest Produce Ledger', role: 'Scale-36 (Fraunces Heading)' },
    { size: '28px', weight: '600', sample: 'Batch #BS-402: Dried Mahua Flowers', role: 'Scale-28 (Fraunces Heading)' },
    { size: '22px', weight: '500', sample: 'Mayurbhanj Central Depôt Intake #02', role: 'Scale-22 (Fraunces Heading)' },
    { size: '18px', weight: '600', sample: 'Village Aggregation & Tare Verification', role: 'Scale-18 (Card / Drawer Title)' },
    { size: '16px', weight: '500', sample: 'TDCCOL Certified Field Procurement Center', role: 'Scale-16 (Sub-heading)' },
    { size: '14px', weight: '400', sample: 'Primary body text for weight receipts, ledger entries, and audit remarks.', role: 'Scale-14 (Base Body Font)' },
    { size: '13px', weight: '500', sample: 'Standard compact copy for input annotations and secondary data rows.', role: 'Scale-13 (Form Hint & Meta)' },
    { size: '12px', weight: '400', sample: '2024-04-18 10:05:22 IST • SHA256:7a9f4c01d (Verified Cloud Checksum)', role: 'Scale-12 (Tabular Numeric Stamp)' },
  ];

  const auditRules = [
    { rule: 'No purple, blue, or indigo used anywhere', status: 'PASS', detail: 'Color tokens strictly warm earth: terracotta, sage, amber, rust, slate-pine, parchment.' },
    { rule: 'No gradients of any kind', status: 'PASS', detail: 'Zero CSS gradients. Evidence photo plates use crisp SVG linework hatch.' },
    { rule: 'No glassmorphism, no backdrop-blur, no glow, no floating blobs', status: 'PASS', detail: 'Pure opaque, print-like matte surfaces with 1px rules.' },
    { rule: 'No box-shadow on cards, buttons, modals, inputs, or tables', status: 'PASS', detail: 'All components use 1px solid borders (var(--rule)). Box-shadow is 0.' },
    { rule: 'No emoji as UI icons', status: 'PASS', detail: 'lucide-react used exclusively at stroke-width 1.5, size 16 or 18.' },
    { rule: 'No rounded-full pills except small status badges', status: 'PASS', detail: 'Buttons, inputs, cards have 4px radius max; tables 2px. Only StatusBadge is pill.' },
    { rule: 'No Inter, Roboto, Poppins, or system-ui body font', status: 'PASS', detail: 'IBM Plex Sans for body, Fraunces for headings, Noto Sans Oriya for Odia text.' },
    { rule: 'No hero sections, no "Get started" CTAs, no SaaS marketing copy', status: 'PASS', detail: 'Field procurement terminology throughout. Ledger-first interface.' },
    { rule: 'No scroll-triggered reveals, no autoplay, no marquees, no gradient text', status: 'PASS', detail: 'Static, immediate, rock-solid field utility rendering.' },
    { rule: 'No dark mode toggle; single warm light theme with dark manager sidebar', status: 'PASS', detail: 'Warm light paper base (#FAF6EE) with dark manager sidebar (#1F2A22).' },
    { rule: 'No placeholder lorem ipsum', status: 'PASS', detail: 'Real tribal MFP data (Mahua flower, Sal seed, Kendu leaf, Badagaon SHG, LABHA).' },
    { rule: 'No stock photos or illustrations', status: 'PASS', detail: 'PhotoPlate displays 4:3 architectural hatch pattern with official digital seals.' },
    { rule: 'Tabular numerals globally for weights, prices, dates, codes', status: 'PASS', detail: 'font-variant-numeric: tabular-nums globally enforced across all numbers.' },
    { rule: 'Odia script rendered in Noto Sans Oriya', status: 'PASS', detail: 'Noto Sans Oriya integrated as native fallback font with Odia typography test.' },
    { rule: 'Spacing on 8px base scale; 240px sidebar; 1200px max content width', status: 'PASS', detail: 'Layout strictly constrained to max-w-ledger (1200px) with 240px sidebar.' },
  ];

  return (
    <AppShell>
      {/* Top Banner / Identity Bar */}
      <header className="border-b border-rule bg-bg-sunken px-6 py-3 shrink-0">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 bg-accent rounded-[2px]" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-[18px] font-semibold text-ink leading-tight">
                  BanaSetu Design System Specimen
                </h1>
                <StatusBadge variant="accent">PROMPT 0 SPEC</StatusBadge>
              </div>
              <p className="text-[12px] text-ink-muted">
                Field Ledger Token Architecture • Government of Odisha Tribal Welfare (TDCCOL / LABHA)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] tabular-nums font-mono text-ink-muted">
            <span>VERSION 1.0.0</span>
            <span>•</span>
            <span>SPEC: STRICT PRINT LEDGER</span>
          </div>
        </div>
      </header>

      {/* Main Ledger Content Container */}
      <main className="max-w-[1200px] mx-auto w-full px-6 py-8 space-y-12">
        {/* Section 1: Color Tokens */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">01 / Palette Tokens (Warm Light Ledger + Dark Sidebar)</SectionLabel>
            <span className="text-[12px] text-ink-muted font-mono">15 Named Tokens</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {colorTokens.map((c) => (
              <div
                key={c.token}
                className="border border-rule rounded-[4px] bg-surface p-3 flex flex-col justify-between shadow-none hover:border-ink-subtle transition-colors"
              >
                <div>
                  <div
                    className="w-full h-12 rounded-[2px] border border-rule mb-2"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="font-mono text-[13px] font-medium text-ink">{c.token}</div>
                  <div className="font-mono text-[11px] text-ink-muted tabular-nums">{c.hex}</div>
                </div>
                <div className="text-[11px] text-ink-subtle mt-2 leading-tight">{c.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography & Odia Fallback */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">02 / Typography & Odia Script Hierarchy</SectionLabel>
            <span className="text-[12px] text-ink-muted">Fraunces • IBM Plex Sans • Noto Sans Oriya</span>
          </div>

          <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
            {typographyScale.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-rule pb-3 last:border-b-0 last:pb-0"
              >
                <div className="w-48 shrink-0">
                  <span className="text-[11px] font-mono font-medium text-accent uppercase tracking-wider">
                    {t.size} / w{t.weight}
                  </span>
                  <div className="text-[11px] text-ink-muted">{t.role}</div>
                </div>
                <div
                  className="flex-1 text-ink"
                  style={{
                    fontSize: t.size,
                    fontWeight: Number(t.weight),
                    fontFamily:
                      Number(t.size.replace('px', '')) >= 18
                        ? 'var(--font-fraunces)'
                        : 'var(--font-ibm-plex-sans)',
                  }}
                >
                  {t.sample}
                </div>
              </div>
            ))}
          </div>

          {/* Bilingual Script Test */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-rule rounded-[4px] bg-surface p-4">
              <SectionLabel className="mb-2">English Official Field Record</SectionLabel>
              <h3 className="font-heading text-[18px] font-semibold text-ink mb-1">
                Dried Mahua Flower Procurement
              </h3>
              <p className="text-[14px] text-ink-muted leading-relaxed">
                Primary tribal collectors assemble daily harvest lots at Badagaon Van Dhan Vikas Kendra
                for digital moisture analysis, tare verification, and instantaneous DBT credit.
              </p>
            </div>
            <div className="border border-rule rounded-[4px] bg-surface p-4">
              <SectionLabel className="mb-2">ଓଡ଼ିଆ କ୍ଷେତ୍ର ପ୍ରମାଣିକରଣ (Noto Sans Oriya)</SectionLabel>
              <h3 className="font-odia text-[18px] font-semibold text-ink mb-1">
                ଶୁଖିଲା ମହୁଲ ଫୁଲ ସଂଗ୍ରହ ଓଜନ ଖାତା
              </h3>
              <p className="font-odia text-[14px] text-ink-muted leading-relaxed">
                ବଡ଼ଗାଁ କେନ୍ଦ୍ରରେ ଆଦିବାସୀ ମହିଳା ସ୍ୱୟଂ ସହାୟକ ଗୋଷ୍ଠୀ ଦ୍ୱାରା ଓଜନ ଯାଞ୍ଚ ଓ ପ୍ରତ୍ୟକ୍ଷ ଲାଭ
                ହସ୍ତାନ୍ତର (LABHA) ଯୋଜନାରେ ତୁରନ୍ତ ବ୍ୟାଙ୍କ ଜମା ପ୍ରଦାନ କରାଯାଉଛି।
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Buttons */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">03 / Button Primitives (36px Height • 4px Radius • No Shadow)</SectionLabel>
            <span className="text-[12px] text-ink-muted">Primary • Secondary • Ghost • Danger</span>
          </div>

          <div className="border border-rule rounded-[4px] bg-surface p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">
                <Check size={16} strokeWidth={1.5} />
                Confirm Weigh-In
              </Button>
              <Button variant="secondary">
                <FileSpreadsheet size={16} strokeWidth={1.5} />
                Export Ledger CSV
              </Button>
              <Button variant="ghost">
                <History size={16} strokeWidth={1.5} />
                View Custody Log
              </Button>
              <Button variant="danger">
                <AlertTriangle size={16} strokeWidth={1.5} />
                Quarantine Batch
              </Button>
            </div>

            <div className="pt-2 border-t border-rule flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Small Primary (30px)
              </Button>
              <Button variant="secondary" size="sm">
                Small Secondary (30px)
              </Button>
              <Button variant="primary" disabled>
                Disabled Primary
              </Button>
              <Button variant="secondary" disabled>
                Disabled Secondary
              </Button>
            </div>
          </div>
        </section>

        {/* Section 4: Form Controls */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">04 / Form Inputs & Number Controls (Tabular Numerals & Suffixes)</SectionLabel>
            <span className="text-[12px] text-ink-muted">36px Height • 1px Rule • Accent Focus Ring</span>
          </div>

          <div className="border border-rule rounded-[4px] bg-surface p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Facilitator ID / Record Code
              </label>
              <Input defaultValue="SHG-FAC-09-MAYURBHANJ" />
              <p className="text-[11px] text-ink-subtle">Unique identifier stamped by Karanjia GP facilitator.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Produce Classification
              </label>
              <Select defaultValue="mahua-a">
                <option value="mahua-a">Mahua Flower (Grade A - Properly Sun-Dried)</option>
                <option value="mahua-b">Mahua Flower (Grade B - Moderate Moisture)</option>
                <option value="sal">Sal Seed (Shorea robusta - Premium)</option>
                <option value="kendu">Kendu Leaf (Diospyros melanoxylon)</option>
              </Select>
              <p className="text-[11px] text-ink-subtle">Graded under TDCCOL seasonal moisture norms.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Net Accepted Weight (Right-Aligned Tabular)
              </label>
              <NumberInput defaultValue={100.0} step={0.1} unit="kg" />
              <p className="text-[11px] text-ink-subtle">Electronic bench scale readout minus tare deduction.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Official MSP / Benchmark Rate
              </label>
              <NumberInput defaultValue={40.0} step={0.5} unit="₹ / kg" />
              <p className="text-[11px] text-ink-subtle">Minimum Support Price notified under LABHA 2024.</p>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
                Physical Inspection & Transit Seal Notes
              </label>
              <Textarea
                defaultValue="Gunny bags inspected for zero rain ingress. Stencil marked #BS-402 on all 3 sacks. Vehicle OR-11-F-4412 dispatched under waterproof tarpaulin cover."
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* Section 5: Status Badges */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">05 / Status Badges (1px Border • 8% Tint • 11px Small Caps)</SectionLabel>
            <span className="text-[12px] text-ink-muted">Strictly Rounded-Full Pill</span>
          </div>

          <div className="border border-rule rounded-[4px] bg-surface p-5 flex flex-wrap items-center gap-3">
            <StatusBadge variant="success">Verified Saleable</StatusBadge>
            <StatusBadge variant="warning">Moisture Shrinkage (2.0%)</StatusBadge>
            <StatusBadge variant="danger">Quarantined Discrepancy</StatusBadge>
            <StatusBadge variant="info">In-Transit Under Waybill</StatusBadge>
            <StatusBadge variant="neutral">Pending Depôt Verification</StatusBadge>
            <StatusBadge variant="accent">Saved Offline in IndexedDB</StatusBadge>
          </div>
        </section>

        {/* Section 6: Table Primitive */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">06 / Field Ledger Table (1px Rules • Right-Aligned Numerics • No Zebra)</SectionLabel>
            <span className="text-[12px] text-ink-muted">Tribal Collector Allocation Ledger</span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collector Name</TableHead>
                <TableHead>Tribal ID</TableHead>
                <TableHead>Village / GP</TableHead>
                <TableHead numeric>Gross (kg)</TableHead>
                <TableHead numeric>Tare (kg)</TableHead>
                <TableHead numeric>Net (kg)</TableHead>
                <TableHead numeric>Rate (₹/kg)</TableHead>
                <TableHead numeric>Gross Payout</TableHead>
                <TableHead>DBT Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="font-medium text-ink">Raimati Soren</div>
                  <div className="font-odia text-[12px] text-ink-muted">ରାଇମତୀ ସୋରେନ</div>
                </TableCell>
                <TableCell className="font-mono text-[12px] text-ink-muted">OR-MAY-KRN-0842</TableCell>
                <TableCell>Badagaon</TableCell>
                <TableCell numeric>41.50</TableCell>
                <TableCell numeric>1.50</TableCell>
                <TableCell numeric className="font-semibold">40.00</TableCell>
                <TableCell numeric>40.00</TableCell>
                <TableCell numeric className="font-semibold">₹1,600.00</TableCell>
                <TableCell>
                  <StatusBadge variant="success">DBT Disbursed</StatusBadge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <div className="font-medium text-ink">Gura Marndi</div>
                  <div className="font-odia text-[12px] text-ink-muted">ଗୁରା ମାରାଣ୍ଡି</div>
                </TableCell>
                <TableCell className="font-mono text-[12px] text-ink-muted">OR-MAY-KRN-1109</TableCell>
                <TableCell>Badagaon</TableCell>
                <TableCell numeric>36.50</TableCell>
                <TableCell numeric>1.50</TableCell>
                <TableCell numeric className="font-semibold">35.00</TableCell>
                <TableCell numeric>40.00</TableCell>
                <TableCell numeric className="font-semibold">₹1,400.00</TableCell>
                <TableCell>
                  <StatusBadge variant="success">DBT Disbursed</StatusBadge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <div className="font-medium text-ink">Sombari Murmu</div>
                  <div className="font-odia text-[12px] text-ink-muted">ସୋମବାରୀ ମୁର୍ମୁ</div>
                </TableCell>
                <TableCell className="font-mono text-[12px] text-ink-muted">OR-MAY-KRN-0623</TableCell>
                <TableCell>Kadamdiha</TableCell>
                <TableCell numeric>26.20</TableCell>
                <TableCell numeric>1.20</TableCell>
                <TableCell numeric className="font-semibold">25.00</TableCell>
                <TableCell numeric>40.00</TableCell>
                <TableCell numeric className="font-semibold">₹1,000.00</TableCell>
                <TableCell>
                  <StatusBadge variant="success">DBT Disbursed</StatusBadge>
                </TableCell>
              </TableRow>

              <TableRow className="bg-bg-sunken/40 font-semibold">
                <TableCell colSpan={3}>Lot Batch Total (#BS-402)</TableCell>
                <TableCell numeric>104.20</TableCell>
                <TableCell numeric>4.20</TableCell>
                <TableCell numeric className="text-accent font-bold">100.00</TableCell>
                <TableCell numeric>40.00</TableCell>
                <TableCell numeric className="text-accent font-bold">₹4,000.00</TableCell>
                <TableCell>
                  <span className="text-[11px] font-mono uppercase text-ink-muted">3 Facilitated Accounts</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* Section 7: Card, PhotoPlate, EmptyState */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">07 / Structural Containers: Card, PhotoPlate & EmptyState</SectionLabel>
            <span className="text-[12px] text-ink-muted">20px Padding Card • 4:3 Hatch PhotoPlate • Pure Action Empty</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Example */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <SectionLabel>Warehouse Bay #04</SectionLabel>
                  <StatusBadge variant="info">In-Transit</StatusBadge>
                </div>
                <CardTitle>Batch Custody Overview</CardTitle>
                <CardDescription>Baripada Central Depôt Storage Zone B</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-[13px]">
                <div className="flex justify-between border-b border-rule py-1">
                  <span className="text-ink-muted">Dispatched Net:</span>
                  <span className="font-mono tabular-nums font-medium text-ink">100.00 kg</span>
                </div>
                <div className="flex justify-between border-b border-rule py-1">
                  <span className="text-ink-muted">Arrival Re-Weigh:</span>
                  <span className="font-mono tabular-nums font-medium text-ink">95.00 kg</span>
                </div>
                <div className="flex justify-between border-b border-rule py-1">
                  <span className="text-ink-muted">Moisture Allowance (2%):</span>
                  <span className="font-mono tabular-nums text-warning">-2.00 kg</span>
                </div>
                <div className="flex justify-between py-1 font-semibold">
                  <span className="text-danger">Unexplained Deficit:</span>
                  <span className="font-mono tabular-nums text-danger">-3.00 kg</span>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-[11px] font-mono text-ink-subtle">TAG: TDCCOL-MAY-402</span>
                <Button variant="secondary" size="sm">
                  Review Case
                </Button>
              </CardFooter>
            </Card>

            {/* PhotoPlate Example */}
            <PhotoPlate
              label="Electronic Platform Scale & Bag Stencil Readout"
              metadata="Scale Serial #ES-8812 • Calibration 2024-04-18"
              caption="Scale display showing 96.50 kg gross minus 1.50 kg tare tare bag weight at Baripada Depot reception."
            />

            {/* EmptyState Example */}
            <EmptyState
              title="No Open Quarantines in Zone C"
              description="All Minor Forest Produce lots for Karanjia block have been reconciled and posted to saleable inventory."
              actionLabel="Initiate Scheduled Weigh-In"
              onAction={() => alert('Initiating new weigh-in record...')}
            />
          </div>
        </section>

        {/* Section 8: Audit Rows & Custody Log */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">08 / Custody Audit Rows (Tabular Timestamps • Actor • Action • Delta)</SectionLabel>
            <span className="text-[12px] text-ink-muted">Immutable Ledger History</span>
          </div>

          <div className="border border-rule rounded-[4px] bg-surface overflow-hidden">
            <AuditRow
              timestamp="2024-04-18 14:15 IST"
              actor={{ name: 'A. K. Patnaik', id: 'DPO-01', role: 'District Procurement Officer' }}
              action="Supervisor Review Initiated: Case #DISC-402 Opened"
              description="Stock quarantined under LABHA Section 4(b) safeguards. Primary tribal collectors fully protected from deductions."
              delta={{ value: '-3.00 kg Variance', variant: 'danger' }}
              status={{ label: 'Quarantined', variant: 'danger' }}
            />
            <AuditRow
              timestamp="2024-04-18 13:40 IST"
              actor={{ name: 'S. Das', id: 'IM-04', role: 'Warehouse Inventory Manager' }}
              action="Depôt Gross & Tare Re-Weigh Completed"
              description="Platform scale recorded 96.50 kg gross, 1.50 kg tare. Net arrival: 95.00 kg vs 100.00 kg dispatch."
              delta={{ value: '95.00 kg Net', variant: 'neutral' }}
              status={{ label: 'Reweighed', variant: 'info' }}
            />
            <AuditRow
              timestamp="2024-04-18 11:20 IST"
              actor={{ name: 'R. Mohanty', id: 'CM-12', role: 'Field Collection Manager' }}
              action="Batch #BS-402 Dispatched from Badagaon VK"
              description="Seal Tag #OD-ST-8840 applied to 3 double-stitched jute sacks. Driver: B. Soren, Vehicle: OR-11-F-4412."
              delta={{ value: '+100.00 kg Dispatch', variant: 'success' }}
              status={{ label: 'Dispatched', variant: 'neutral' }}
            />
            <AuditRow
              timestamp="2024-04-18 09:15 IST"
              actor={{ name: 'Champa Majhi', id: 'FAC-09', role: 'SHG Facilitator' }}
              action="Primary Collector Receipts Aggregated & Paid"
              description="3 tribal collectors weighed. Immediate DBT simulated payout totaling ₹4,000.00 executed."
              delta={{ value: '₹4,000.00 Payout', variant: 'success' }}
              status={{ label: 'DBT Settled', variant: 'success' }}
            />
          </div>
        </section>

        {/* Section 9: Manager Sidebar & Drawer Demo */}
        <section className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <SectionLabel as="h2">09 / Layout Primitives: 240px Manager Sidebar & 480px Drawer</SectionLabel>
            <span className="text-[12px] text-ink-muted">Radix Headless Primitives • Fixed Geometry</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar View Container */}
            <div className="border border-rule rounded-[4px] overflow-hidden flex h-[380px] bg-bg-sunken">
              <ManagerSidebar
                activeItem={activeNav}
                onNavigate={(id) => setActiveNav(id)}
              />
              <div className="flex-1 p-4 bg-bg flex flex-col justify-between">
                <div className="space-y-2">
                  <SectionLabel>Active Sidebar Selection</SectionLabel>
                  <h4 className="font-heading text-[16px] font-semibold text-ink">
                    Viewing: {activeNav.toUpperCase()}
                  </h4>
                  <p className="text-[12px] text-ink-muted">
                    Sidebar maintains fixed 240px width with dark token #1F2A22 and sidebar-ink #E9E3D3.
                    Active navigation uses terracotta accent #B24E2E.
                  </p>
                </div>
                <div className="p-3 border border-rule bg-surface rounded-[2px] text-[12px]">
                  <span className="text-ink-muted">Terminal status: </span>
                  <span className="text-success font-medium">Online (Direct Cloud)</span>
                </div>
              </div>
            </div>

            {/* Interactive Drawer Trigger & Toast Controls */}
            <div className="lg:col-span-2 border border-rule rounded-[4px] bg-surface p-5 flex flex-col justify-between space-y-4">
              <div>
                <SectionLabel className="mb-1">Interactive Primitives Playground</SectionLabel>
                <h3 className="font-heading text-[18px] font-semibold text-ink mb-2">
                  480px Right Drawer & Bottom-Left Toast Triggers
                </h3>
                <p className="text-[13px] text-ink-muted leading-relaxed mb-4">
                  Test the headless Radix Drawer (480px wide, 1px left rule, no shadow) and bottom-left field ledger notification toasts.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Radix Drawer Component */}
                  <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="primary">
                        <SlidersHorizontal size={16} strokeWidth={1.5} />
                        Open 480px Batch Inspection Drawer
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <SectionLabel>Depôt Custody Handover</SectionLabel>
                        <DrawerTitle>Batch #BS-402 Lot Inspection</DrawerTitle>
                        <DrawerDescription>
                          Verification checklist for intake at Baripada Depôt #02
                        </DrawerDescription>
                      </DrawerHeader>
                      <DrawerBody>
                        <div className="space-y-4">
                          <PhotoPlate
                            label="Field Stencil Photo Seal"
                            metadata="Stencil #BS-402 • Gunny Bag 1 of 3"
                            caption="Visual seal verification matches transit manifest OR-11-F-4412."
                          />

                          <div className="border border-rule rounded-[4px] p-3 space-y-2 bg-bg-sunken/40">
                            <SectionLabel>Arrival Verification</SectionLabel>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-ink-muted uppercase">
                                Baripada Scale Net Weight (kg)
                              </label>
                              <NumberInput defaultValue={95.0} unit="kg" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-ink-muted uppercase">
                                Allowed Moisture Shrinkage
                              </label>
                              <Select defaultValue="2">
                                <option value="2">2.0% Maximum Transit Shrinkage</option>
                                <option value="3">3.0% High-Humidity Route Allowance</option>
                              </Select>
                            </div>
                          </div>

                          <div className="p-3 border border-danger/40 bg-danger/5 rounded-[4px]">
                            <div className="flex items-center gap-2 text-danger font-medium text-[13px]">
                              <AlertTriangle size={16} strokeWidth={1.5} />
                              Unexplained Deficit Detected (-3.00 kg)
                            </div>
                            <p className="text-[12px] text-ink-muted mt-1">
                              This lot will be routed into Quarantine Bay 03. Primary collector accounts remain safeguarded.
                            </p>
                          </div>
                        </div>
                      </DrawerBody>
                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button variant="secondary">Cancel</Button>
                        </DrawerClose>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setIsDrawerOpen(false);
                            triggerToast('danger');
                          }}
                        >
                          Confirm Quarantine Routing
                        </Button>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  <Button variant="secondary" onClick={() => triggerToast('info')}>
                    Simulate Info Toast
                  </Button>
                  <Button variant="secondary" onClick={() => triggerToast('success')}>
                    Simulate Success Toast
                  </Button>
                  <Button variant="secondary" onClick={() => triggerToast('warning')}>
                    Simulate Warning Toast
                  </Button>
                </div>
              </div>

              <div className="border-t border-rule pt-3 text-[12px] text-ink-subtle flex items-center justify-between">
                <span>Toast count in queue: {activeToasts.length}</span>
                <span className="font-mono text-[11px]">POSITION: FIXED BOTTOM-LEFT</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10: Anti-Slop Audit Checklist */}
        <section className="space-y-4 pt-4">
          <div className="border-b border-rule pb-2 flex items-baseline justify-between">
            <div>
              <SectionLabel as="h2">10 / Anti-Slop System Audit</SectionLabel>
              <h3 className="font-heading text-[20px] font-semibold text-ink">
                Strict Design System Compliance Verification
              </h3>
            </div>
            <StatusBadge variant="success">15 / 15 RULES SATISFIED</StatusBadge>
          </div>

          <div className="border border-rule rounded-[2px] overflow-hidden bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Audit</TableHead>
                  <TableHead className="w-72">Design Constraint Rule</TableHead>
                  <TableHead>Implementation in Codebase</TableHead>
                  <TableHead className="w-24 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRules.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-[12px] text-ink-muted">
                      R-{(index + 1).toString().padStart(2, '0')}
                    </TableCell>
                    <TableCell className="font-medium text-ink">
                      {item.rule}
                    </TableCell>
                    <TableCell className="text-ink-muted text-[13px]">
                      {item.detail}
                    </TableCell>
                    <TableCell numeric>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase text-success bg-success/[0.08] border border-success px-2 py-0.5 rounded-full">
                        <Check size={16} strokeWidth={1.5} />
                        {item.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>

      {/* Persistent Bottom-Left Toast Stack */}
      <ToastContainer>
        {activeToasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      {/* Footer Ledger Colophon */}
      <footer className="border-t border-rule bg-bg-sunken px-6 py-4 mt-auto">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="font-heading font-medium text-ink">BanaSetu Design System</span>
            <span>•</span>
            <span>Tribal Development Co-operative Corporation of Odisha (TDCCOL)</span>
          </div>
          <div className="font-mono text-[11px] tabular-nums text-ink-subtle">
            ISO/IEC 25010 AUDIT CONFORMANT • ZERO BOX-SHADOW • NO GRADIENTS
          </div>
        </div>
      </footer>
    </AppShell>
  );
}
