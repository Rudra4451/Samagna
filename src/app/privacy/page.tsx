import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | BanaSetu Forest Produce Ledger',
  description: 'Data privacy practices, offline device storage, and evidence handling policies for BanaSetu.',
};

export default function PrivacyPage() {
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
            <Link href="/terms" className="text-[#5E5245] hover:text-[#1F1A14] transition-colors">
              Terms of Service
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
            Privacy Policy
          </h1>
          <p className="text-sm font-mono text-[#5E5245]">
            Effective Date: October 2024 | Version 1.0 (Field Pilot Protocol)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[#1F1A14]">
          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              1. Information We Collect in the Field
            </h2>
            <p>
              BanaSetu collects operational data strictly necessary to authenticate forest produce intake,
              verify direct payment entitlements to tribal collectors, and maintain custody records:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#5E5245]">
              <li>
                <strong className="text-[#1F1A14]">Procurement Records:</strong> Collector name, village, forest beat,
                produce variety (e.g. Mahua, Sal seed, Harida), net weight, bag count, and calculated support price.
              </li>
              <li>
                <strong className="text-[#1F1A14]">Photographic Evidence:</strong> Bag tare photos, quality inspection
                snapshots, and moisture meter readings captured during collection point intake.
              </li>
              <li>
                <strong className="text-[#1F1A14]">Audio Confirmations:</strong> Optional voice receipts recorded to
                ensure informed consent for non-literate primary gatherers in Odia and Santhali dialects.
              </li>
              <li>
                <strong className="text-[#1F1A14]">Geographic Coordinates:</strong> Timestamped GPS coordinates of
                collection points and transit transfer handoffs to verify provenance within Mayurbhanj forest beats.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              2. Local Device Storage (Offline IndexedDB)
            </h2>
            <p>
              Field weighments and pending queue receipts are stored locally within the browser database
              (Dexie IndexedDB) on the field operator device. This information remains encrypted at rest within
              the device sandboxed storage until cellular connectivity enables sync to the state ledger.
            </p>
            <p>
              Users can inspect, purge, or manually trigger sync of their local queue via the Settings portal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              3. Private Evidence Object Storage
            </h2>
            <p>
              Inspection photographs and audio clips are transmitted over TLS 1.3 to private, authenticated
              storage buckets. Evidence objects are never publicly indexable by commercial search engines. Public
              custody lookups access evidence strictly through short-lived, time-limited cryptographic signed URLs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              4. Zero Commercial Monetization
            </h2>
            <p>
              Under no circumstances is collector personal information, weighment history, or pricing data sold,
              rented, or shared with commercial brokers, advertising networks, or third-party marketing entities.
              All data belongs solely to the participating tribal primary collectors and TDCCOL authorities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-serif font-semibold text-[#1F1A14]">
              5. Contact & Grievance Officer
            </h2>
            <p>
              For privacy inquiries or record rectification, contact the District Procurement Office, TDCCOL
              Branch, Baripada, Mayurbhanj District, Odisha.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-[#E4DBC9] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#5E5245]">
          <span>Tribal Development Co-operative Corporation of Odisha (TDCCOL)</span>
          <Link href="/terms" className="text-[#B24E2E] hover:underline">
            Read Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
