'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Scale, Lock, FileCheck2, ArrowRight } from 'lucide-react';

export const GovernanceSection: React.FC = () => {
  return (
    <section id="governance" className="scroll-mt-header py-16 sm:py-24 bg-cream/40 border-t border-soft-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest/10 border border-forest/20 text-xs font-mono font-bold uppercase tracking-wider text-forest mb-3">
            <span>STATUTORY LABHA FRAMEWORK</span>
          </div>
          <h2 className="font-serif type-h1 font-normal text-ink tracking-tight text-balance">
            Statutory Protections Under Government of Odisha LABHA Scheme
          </h2>
          <p className="mt-4 type-body-lead text-ink-muted font-sans text-balance">
            Under Odisha’s 100% State-Funded <em>Laghu Bana Jatiya Dradya Kraya</em> (LABHA) statutory mandate, primary
            tribal collectors receive full statutory rights, zero middleman cuts, and automated treasury oversight.
          </p>
        </div>

        {/* 3 Governance Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 rounded-[10px] border border-soft-border bg-white shadow-card space-y-4">
            <div className="w-12 h-12 rounded-[8px] bg-forest/10 text-forest flex items-center justify-center">
              <Scale size={24} />
            </div>
            <h3 className="font-serif type-h3 font-semibold text-ink">Zero Tare Deduction Mandate</h3>
            <p className="type-body text-ink-muted text-sm leading-relaxed font-sans">
              Collection centers cannot arbitrarily cut gross weighment for moisture or gunny tare. Every kilogram of
              accepted harvest is paid at 100% statutory MSP directly to the collector bank account.
            </p>
            <div className="pt-2 text-xs font-mono text-forest font-bold">Odisha LABHA Section 4(b)</div>
          </div>

          <div className="p-6 sm:p-8 rounded-[10px] border border-soft-border bg-white shadow-card space-y-4">
            <div className="w-12 h-12 rounded-[8px] bg-terracotta/10 text-terracotta flex items-center justify-center">
              <Lock size={24} />
            </div>
            <h3 className="font-serif type-h3 font-semibold text-ink">Automated PII Masking</h3>
            <p className="type-body text-ink-muted text-sm leading-relaxed font-sans">
              Public custody dossiers protect vulnerable tribal gatherers by masking Aadhaar numbers, phone digits, and
              exact home locations while preserving cryptographic transaction verifiability.
            </p>
            <div className="pt-2 text-xs font-mono text-terracotta-deep font-bold">Data Privacy Safeguard</div>
          </div>

          <div className="p-6 sm:p-8 rounded-[10px] border border-soft-border bg-white shadow-card space-y-4">
            <div className="w-12 h-12 rounded-[8px] bg-forest/10 text-forest flex items-center justify-center">
              <FileCheck2 size={24} />
            </div>
            <h3 className="font-serif type-h3 font-semibold text-ink">State Treasury Reconciliation</h3>
            <p className="type-body text-ink-muted text-sm leading-relaxed font-sans">
              Every procurement ticket links directly to Odisha State Treasury reconciliation ledgers, preventing double
              claims, phantom weighments, and unverified batch dispatches.
            </p>
            <div className="pt-2 text-xs font-mono text-forest font-bold">Treasury Comptroller Audit</div>
          </div>
        </div>

        {/* Institutional Contact Bar */}
        <div className="mt-12 p-6 rounded-[10px] border border-soft-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-forest shrink-0" />
            <div>
              <div className="font-sans font-semibold text-sm text-ink">
                Tribal Development Cooperative Corporation of Odisha Ltd. (TDCCOL)
              </div>
              <div className="text-xs text-ink-muted font-sans">
                District Office: Baripada, Mayurbhanj · Dedicated Grievance Cell: 1800-345-6789
              </div>
            </div>
          </div>
          <Link
            href="/about"
            className="touch-target px-5 py-2.5 bg-cream hover:bg-forest hover:text-white text-forest text-xs font-sans font-semibold border border-soft-border rounded-[6px] transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Read Statutory Mandate</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
};
