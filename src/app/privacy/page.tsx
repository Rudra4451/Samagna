import React from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';

export const metadata = {
  title: 'Privacy Policy | Samagna Forest Produce Ledger',
  description: 'Data privacy practices, offline device storage, and evidence handling policies for Samagna.',
};

export default function PrivacyPage() {
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
            <Link href="/terms" className="text-ink-muted hover:text-ink transition-colors">
              Terms of Service
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
            Privacy Policy
          </h1>
          <p className="text-[13px] font-mono text-ink-muted">
            Effective Date: October 2024 · Version 1.0 (Field Pilot Protocol)
          </p>
        </div>

        <div className="space-y-7 text-[14px] leading-relaxed text-ink">
          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              1. Information We Collect in the Field
            </h2>
            <p>
              Samagna collects operational data strictly necessary to authenticate forest produce intake,
              verify direct payment entitlements to tribal collectors, and maintain custody records:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-ink-muted">
              <li>
                <strong className="text-ink">Procurement Records:</strong> Collector name, village, forest beat,
                produce variety (e.g. Mahua, Sal seed, Harida), net weight, bag count, and calculated support price.
              </li>
              <li>
                <strong className="text-ink">Photographic Evidence:</strong> Bag tare photos, quality inspection
                snapshots, and moisture meter readings captured during collection point intake.
              </li>
              <li>
                <strong className="text-ink">Audio Confirmations:</strong> Optional voice receipts recorded to
                ensure informed consent for non-literate primary gatherers in Odia and Santhali dialects.
              </li>
              <li>
                <strong className="text-ink">Geographic Coordinates:</strong> Timestamped GPS coordinates of
                collection points and transit transfer handoffs to verify provenance within Mayurbhanj forest beats.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              2. Local Device Storage (Offline IndexedDB)
            </h2>
            <p>
              Field weighments and pending queue receipts are stored locally within the browser database
              (Dexie IndexedDB) on the field operator device. This information remains encrypted at rest within
              the device sandboxed storage until cellular connectivity enables sync to the state ledger.
            </p>
            <p className="text-ink-muted">
              Users can inspect, purge, or manually trigger sync of their local queue via the Settings portal.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              3. Private Evidence Object Storage
            </h2>
            <p>
              Inspection photographs and audio clips are transmitted over TLS 1.3 to private, authenticated
              storage buckets. Evidence objects are never publicly indexable by commercial search engines. Public
              custody lookups access evidence strictly through short-lived, time-limited cryptographic signed URLs.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              4. Zero Commercial Monetization
            </h2>
            <p>
              Under no circumstances is collector personal information, weighment history, or pricing data sold,
              rented, or shared with commercial brokers, advertising networks, or third-party marketing entities.
              All data belongs solely to the participating tribal primary collectors and TDCCOL authorities.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-base font-heading font-bold text-ink">
              5. Contact & Grievance Officer
            </h2>
            <p>
              For privacy inquiries or record rectification, contact the District Procurement Office, TDCCOL
              Branch, Baripada, Mayurbhanj District, Odisha.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-5 border-t border-rule flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] font-mono text-ink-muted">
          <span>Tribal Development Co-operative Corporation of Odisha (TDCCOL)</span>
          <Link href="/terms" className="text-accent hover:underline">
            Read Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
