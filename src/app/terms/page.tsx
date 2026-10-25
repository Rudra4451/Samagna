import React from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';

export const metadata = {
  title: 'Terms of Service | Samagna Forest Produce Ledger',
  description: 'Operating guidelines, custody verification standards, and prototype terms for the Samagna Minor Forest Produce Ledger.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent-tint selection:text-ink">
      {/* Top Header */}
      <header className="border-b border-rule bg-surface sticky top-0 z-30 shadow-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-2 focus:outline-accent">
            <SamagnaLogo variant="light" size="sm" showTagline />
          </Link>
          <div className="flex items-center gap-4 text-[12px] font-mono">
            <Link href="/" className="text-ink-muted hover:text-ink transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="text-ink-muted hover:text-ink transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 pb-5 border-b border-rule">
          <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-accent bg-accent-tint border border-accent/20 px-2 py-0.5 rounded-[2px] mb-2.5">
            Draft for Administrative Review
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-ink mb-2">
            Terms of Service
          </h1>
          <p className="text-[13px] font-mono text-ink-muted">
            Effective Date: October 2024 · Version 1.0 (Field Pilot Protocol)
          </p>
        </div>

        <div className="space-y-7 text-[14px] leading-relaxed text-ink">
          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              1. Prototype System Purpose
            </h2>
            <p>
              Samagna is an auditable Minor Forest Produce (MFP) procurement and custody ledger developed for the
              Tribal Development Co-operative Corporation of Odisha (TDCCOL) under the LABHA (Laghu Bana Jatiya Dradbya Kraya)
              Scheme. The application provides auditable digital weighments, tamper-evident custody tracking, and
              transparent minimum support price calculations for tribal primary collectors across Mayurbhanj District.
            </p>
            <p className="text-[12px] text-ink-muted bg-bg-sunken p-3 rounded-[3px] border border-rule font-mono">
              Notice: Operational data, procurement rate sheets, and batch entries generated during pilot evaluation
              are illustrative simulations designed to test technical resiliency and usability under field conditions.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              2. User Personas and Role-Based Access
            </h2>
            <p>
              Access to transactional capabilities is restricted by verified administrative role. Authorized roles include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-ink-muted">
              <li>
                <strong className="text-ink">Primary Collector:</strong> Submits produce weighment requests,
                reviews direct receipt breakdowns, and listens to audio rate confirmations in native dialects.
              </li>
              <li>
                <strong className="text-ink">SHG Facilitator:</strong> Assists collection groups, aggregates
                primary intake bags, and records communal batch weights.
              </li>
              <li>
                <strong className="text-ink">Collection Point Manager:</strong> Validates moisture content,
                weighs bag tare, captures photographic evidence, and issues tamper-evident stencils.
              </li>
              <li>
                <strong className="text-ink">Central Depôt Warehouse Manager:</strong> Reweighs transit shipments,
                computes allowable moisture shrinkage, and records intake verification or quarantine notices.
              </li>
              <li>
                <strong className="text-ink">District DPO / Supervisor Admin:</strong> Oversees district totals,
                resolves custody discrepancies, and audits payment disbarments.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              3. Offline Data Integrity and Local-First Queue
            </h2>
            <p>
              Due to intermittent cellular connectivity across Similipal Biosphere Reserve forest fringes,
              Samagna operates locally through IndexedDB. Field operators must ensure their client devices
              reconnect to cellular coverage or depot Wi-Fi at designated intervals to synchronize outbox receipts
              with the central PostgreSQL ledger.
            </p>
            <p className="text-ink-muted">
              All offline transactions receive client-generated unique identifiers (ULID) and cryptographic
              verification hashes to prevent duplication or ledger manipulation during delayed synchronization.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              4. Public Verification Rights
            </h2>
            <p>
              Any recipient of an official Samagna receipt or QR-stenciled gunny bag has the right to verify
              custody records, moisture measurements, and procurement timestamps through the public verification
              gateway at <code className="bg-bg-sunken border border-rule px-1.5 py-0.5 rounded text-[12px] font-mono">/verify</code>.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              5. Governance and Statutory Oversight
            </h2>
            <p>
              Procurement rules, moisture deduction schedules, and minimum support pricing adhere to official
              notifications issued by TDCCOL and the Department of ST & SC Development, Minorities and Backward
              Classes Welfare, Government of Odisha.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-5 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-mono text-ink-muted">
          <span>Mayurbhanj District Administration · Odisha</span>
          <Link href="/privacy" className="text-accent hover:underline">
            Read Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
