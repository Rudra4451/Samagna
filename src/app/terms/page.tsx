import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | BanaSetu Forest Produce Ledger',
  description: 'Operating guidelines, custody verification standards, and prototype terms for the BanaSetu Minor Forest Produce Ledger.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#1F1A14] font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      {/* Top Header */}
      <header className="border-b border-[#E4DBC9] bg-[#FAF6EE] sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-[#1F1A14] no-underline focus:outline-none">
            <span className="w-7 h-7 bg-[#1F2A22] text-[#E9E3D3] rounded-[3px] flex items-center justify-center font-serif font-bold text-sm">
              BS
            </span>
            <span className="font-serif font-semibold text-lg tracking-tight">BanaSetu</span>
            <span className="text-[11px] font-mono text-[#5E5245] uppercase tracking-wider ml-1 hidden sm:inline">
              Odisha TDCCOL
            </span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/" className="text-[#5E5245] hover:text-[#1F1A14] transition-colors">
              Back to Home
            </Link>
            <Link href="/privacy" className="text-[#5E5245] hover:text-[#1F1A14] transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 pb-6 border-b border-[#E4DBC9]">
          <span className="inline-block text-[11px] font-mono uppercase tracking-wider text-[#B24E2E] bg-[#F2EBDD] px-2 py-0.5 rounded-[2px] mb-3">
            Draft for Administrative Review
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight text-[#1F1A14] mb-3">
            Terms of Service
          </h1>
          <p className="text-sm font-mono text-[#5E5245]">
            Effective Date: October 2024 | Version 1.0 (Pilot Prototype Edition)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#1F1A14]">
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              1. Prototype System Purpose
            </h2>
            <p>
              BanaSetu is a digital demonstration and field pilot system developed for the Tribal Development
              Co-operative Corporation of Odisha (TDCCOL) under the LABHA (Laghu Bana Jatiya Dradbya Kraya) Scheme.
              The application provides auditable digital weighments, tamper-evident custody tracking, and
              transparent minimum support price calculations for tribal primary collectors across Mayurbhanj District.
            </p>
            <p className="text-xs text-[#5E5245] bg-[#F2EBDD] p-3 rounded-[3px] border border-[#E4DBC9]">
              Notice: Operational data, procurement rate sheets, and batch entries generated during pilot evaluation
              are illustrative simulations designed to test technical resiliency and usability under field conditions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              2. User Personas and Role-Based Access
            </h2>
            <p>
              Access to transactional capabilities is restricted by role. Authorized roles include:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#5E5245]">
              <li>
                <strong className="text-[#1F1A14]">Primary Collector:</strong> Submits produce weighment requests,
                reviews direct receipt breakdowns, and listens to audio rate confirmations in native dialects.
              </li>
              <li>
                <strong className="text-[#1F1A14]">SHG Facilitator:</strong> Assists collection groups, aggregates
                primary intake bags, and records communal batch weights.
              </li>
              <li>
                <strong className="text-[#1F1A14]">Collection Point Manager:</strong> Validates moisture content,
                weighs bag tare, captures photographic evidence, and issues tamper-evident stencils.
              </li>
              <li>
                <strong className="text-[#1F1A14]">Central Depôt Warehouse Manager:</strong> Reweighs transit shipments,
                computes allowable moisture shrinkage, and records intake verification or quarantine notices.
              </li>
              <li>
                <strong className="text-[#1F1A14]">District DPO / Supervisor Admin:</strong> Oversees district totals,
                resolves custody discrepancies, and audits payment disbarments.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              3. Offline Data Integrity and Local-First Queue
            </h2>
            <p>
              Due to intermittent cellular connectivity across Similipal Biosphere Reserve forest fringes,
              BanaSetu operates locally through IndexedDB. Field operators must ensure their client devices
              reconnect to cellular coverage or depot Wi-Fi at designated intervals to synchronize outbox receipts
              with the central PostgreSQL ledger.
            </p>
            <p>
              All offline transactions receive client-generated unique identifiers (ULID) and cryptographic
              verification hashes to prevent duplication or ledger manipulation during delayed synchronization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              4. Public Verification Rights
            </h2>
            <p>
              Any recipient of an official BanaSetu receipt or QR-stenciled gunny bag has the right to verify
              custody records, moisture measurements, and procurement timestamps through the public verification
              gateway at <code className="bg-[#F2EBDD] px-1.5 py-0.5 rounded text-xs font-mono">/verify</code>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              5. Governance and Statutory Oversight
            </h2>
            <p>
              Procurement rules, moisture deduction schedules, and minimum support pricing adhere to official
              notifications issued by TDCCOL and the Department of ST & SC Development, Minorities and Backward
              Classes Welfare, Government of Odisha.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E4DBC9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#5E5245]">
          <span>Mayurbhanj District Administration · Odisha</span>
          <Link href="/privacy" className="text-[#B24E2E] hover:underline">
            Read Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
