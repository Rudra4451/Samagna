'use client';

import React from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { ShieldCheck, AlertCircle, ArrowLeft, Info, CheckCircle2, Lock } from 'lucide-react';

export default function AboutPilotPage() {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-rule bg-surface px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SamagnaLogo variant="forest" size="sm" showTagline />
        </Link>
        <Link
          href="/"
          className="text-xs font-mono font-medium text-ink-muted hover:text-ink flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-warning/10 border border-warning text-warning text-xs font-mono font-semibold mb-3">
            <AlertCircle size={14} />
            <span>Pilot System Disclaimer · Version 0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-ink mb-2">
            About Samagna & Pilot Status
          </h1>
          <p className="text-sm font-mono text-ink-muted">
            Independent Digital Infrastructure Demonstration · Non-Affiliation Declaration
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-ink/90">
          <section className="bg-surface border border-rule rounded-[6px] p-5 shadow-none space-y-3">
            <h2 className="text-base font-serif font-semibold text-ink flex items-center gap-2">
              <Info size={16} className="text-accent" />
              <span>Project Mission & Purpose</span>
            </h2>
            <p>
              <strong>Samagna</strong> (also referencing the <em>BanaSetu</em> ledger architecture) is an automated digital procurement and traceability demonstrator designed for minor forest produce (MFP) value chains in tribal forest corridors such as Mayurbhanj, Odisha.
            </p>
            <p className="text-xs text-ink-muted">
              Its purpose is to demonstrate transparent weighment, digital scale integration, fair Minimum Support Price (MSP) entitlement calculation, and verifiable batch custody from primary forest collectors to regional warehouses and enterprise buyers.
            </p>
          </section>

          <section className="bg-surface border border-warning/40 rounded-[6px] p-5 shadow-none space-y-3">
            <h2 className="text-base font-serif font-semibold text-warning flex items-center gap-2">
              <AlertCircle size={16} />
              <span>Official Status & Government Non-Affiliation</span>
            </h2>
            <p>
              Samagna is an independent technology demonstrator. Unless explicitly governed by a formally executed institutional agreement with the relevant state departments or tribal welfare development agencies (e.g., TDCCOL / Tribal Development Cooperative Corporation of Odisha), this platform is <strong>not</strong> an official government agency and does not represent an endorsement by the Government of Odisha or the Government of India.
            </p>
            <p className="text-xs text-ink-muted">
              All financial calculations, simulated DBT disbursements, and royalty metrics displayed within the demonstration environment are educational simulations operating on test records.
            </p>
          </section>

          <section className="bg-surface border border-rule rounded-[6px] p-5 shadow-none space-y-3">
            <h2 className="text-base font-serif font-semibold text-ink flex items-center gap-2">
              <ShieldCheck size={16} className="text-success" />
              <span>Collector Entitlement & MSP Non-Deduction Invariant</span>
            </h2>
            <p>
              A core structural rule of the Samagna architecture is that primary tribal gatherers are legally and contractually entitled to <strong>100% of their statutory Minimum Support Price (MSP)</strong> payout.
            </p>
            <p className="text-xs text-ink-muted">
              Any proposed platform licensing fees, technology maintenance charges, government service royalties, or commercial buyer margins are strictly separate institutional fees. Platform revenue is never deducted or clawed back from forest collectors&apos; statutory entitlements.
            </p>
          </section>

          <section className="bg-surface border border-rule rounded-[6px] p-5 shadow-none space-y-3">
            <h2 className="text-base font-serif font-semibold text-ink flex items-center gap-2">
              <Lock size={16} className="text-accent" />
              <span>Privacy & Data Protection Principles</span>
            </h2>
            <p>
              In accordance with statutory tribal welfare guidelines and data minimisation principles under the Digital Personal Data Protection (DPDP) Act 2023:
            </p>
            <ul className="list-disc pl-5 text-xs text-ink-muted space-y-1.5">
              <li>Individual collector identity numbers, Aadhaar details, and bank account numbers are redacted in all public QR traceability links and commercial export files.</li>
              <li>Public verification portals display only aggregated batch provenance, botanical specifications, moisture certification, and custody transit logs.</li>
              <li>The automated in-app assistant (<em>Maitriyam</em>) operates strictly read-only and never transmits private collector data to third-party language models.</li>
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono text-ink-subtle">
            Demonstration Version: 0.1.0 · Build Target: Odisha Pilot Corridor
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/privacy" className="text-ink-muted hover:text-ink hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-ink-muted hover:text-ink hover:underline">
              Terms of Use
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-rule bg-surface/50 py-4 px-4 text-center text-xs font-mono text-ink-muted">
        Samagna / BanaSetu Open Ledger Framework · Experimental Demonstration
      </footer>
    </div>
  );
}
