'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';

export default function VerifyIndexPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().replace('#', '').toUpperCase();
    if (clean) {
      router.push(`/verify/${clean}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 text-ink selection:bg-accent-tint selection:text-ink">
      <header className="max-w-[440px] w-full mx-auto pt-4 flex items-center justify-between border-b border-rule pb-3">
        <Link href="/" className="flex items-center gap-2 focus:outline-2 focus:outline-accent">
          <SamagnaLogo variant="light" size="sm" showTagline />
        </Link>
        <div className="text-right">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
            PUBLIC VERIFY
          </span>
        </div>
      </header>

      <main className="max-w-[440px] w-full mx-auto my-auto py-8">
        <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 shadow-none">
          <div>
            <div className="flex items-center gap-1.5 text-accent text-[12px] font-mono uppercase font-semibold">
              <ShieldCheck size={16} /> Authentic Ledger Verification
            </div>
            <h2 className="text-[22px] font-heading font-bold text-ink mt-1">
              Verify Batch Custody
            </h2>
            <p className="text-[13px] text-ink-muted mt-0.5">
              Enter the batch identifier from your collection receipt or bag stencil tag (e.g. BS-402, BS-400).
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label htmlFor="verify-code" className="text-[12px] font-semibold text-ink block mb-1">
                Batch Code / ବ୍ୟାଚ୍ କୋଡ୍
              </label>
              <div className="relative">
                <input
                  id="verify-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="BS-402"
                  required
                  className="w-full h-[44px] px-3 pl-9 text-[15px] font-mono border border-rule rounded-[3px] bg-surface uppercase font-bold text-ink focus:outline-none focus:border-ink"
                />
                <Search size={16} className="absolute left-3 top-3.5 text-ink-muted" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-[46px] text-[14px] font-semibold flex items-center justify-center gap-2"
            >
              <span>Verify Official Status</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          <div className="pt-4 border-t border-rule space-y-2 text-[12px] text-ink-muted font-mono">
            <span className="text-[10px] uppercase text-ink-subtle block">Sample Specimen Batches:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push('/verify/BS-402')}
                className="px-2.5 py-1 rounded-[2px] border border-rule bg-bg-sunken hover:bg-surface text-ink font-semibold"
              >
                #BS-402 (Quarantined)
              </button>
              <button
                type="button"
                onClick={() => router.push('/verify/BS-400')}
                className="px-2.5 py-1 rounded-[2px] border border-rule bg-bg-sunken hover:bg-surface text-ink font-semibold"
              >
                #BS-400 (Saleable)
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-[440px] w-full mx-auto text-center py-4 border-t border-rule text-[11px] font-mono text-ink-muted">
        <p>Tribal Development Co-operative Corporation of Odisha (TDCCOL)</p>
      </footer>
    </div>
  );
}
