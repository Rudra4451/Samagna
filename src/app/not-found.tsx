import React from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { Home, Search, ArrowRight, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-warm-white flex flex-col justify-between text-ink font-sans selection:bg-cream selection:text-forest">
      {/* Top Header Bar */}
      <header className="border-b border-soft-border py-4 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="Samagna Home">
            <SamagnaLogo variant="forest" size="sm" showTagline />
          </Link>
          <Link
            href="/verify"
            className="touch-target text-xs font-mono font-semibold text-forest hover:text-ink transition-colors"
          >
            Verify Custody Batch →
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 text-xs font-mono font-bold uppercase tracking-wider text-terracotta">
            <ShieldAlert size={15} />
            <span>ERROR 404 · RECORD NOT LOCATED</span>
          </div>

          <h1 className="font-serif type-h1 font-normal text-ink tracking-tight">
            Page or Dossier Not Found
          </h1>

          <div className="font-odia text-sm text-ink-muted" lang="or">
            କ୍ଷମା କରିବେ, ଆପଣ ଖୋଜୁଥିବା ପୃଷ୍ଠା ବା ରେକର୍ଡ ଏଠାରେ ଉପଲବ୍ଧ ନାହିଁ।
          </div>

          <p className="type-body text-ink-muted text-sm leading-relaxed max-w-md mx-auto">
            The page, batch dossier, or custody record you requested may have moved, expired, or been archived into
            the Mayurbhanj district ledger.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5">
            <Link
              href="/"
              className="touch-target px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-sans font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Home size={15} />
              <span>Return to Home</span>
            </Link>
            <Link
              href="/verify"
              className="touch-target px-6 py-3 bg-white hover:bg-cream/40 text-ink border border-soft-border text-xs font-sans font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Search size={15} className="text-forest" />
              <span>Lookup Batch Code</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Support Notice */}
      <footer className="border-t border-soft-border py-4 px-6 text-center text-xs text-ink-muted bg-white font-mono">
        <div>TDCCOL Mayurbhanj Institutional Helpdesk: 1800-345-6789 (Toll Free)</div>
      </footer>
    </div>
  );
}
