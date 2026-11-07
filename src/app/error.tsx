'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { RotateCcw, Home, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected errors for monitoring
    console.error('Unhandled application exception:', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-warm-white flex flex-col justify-between text-ink font-sans selection:bg-cream selection:text-forest">
      {/* Top Header */}
      <header className="border-b border-soft-border py-4 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" aria-label="Samagna Home">
            <SamagnaLogo variant="forest" size="sm" showTagline />
          </Link>
          <span className="text-xs font-mono text-terracotta">System Status: Recovery Mode</span>
        </div>
      </header>

      {/* Main Error Alert */}
      <main className="flex-1 flex items-center justify-center p-6 text-center" role="alert">
        <div className="max-w-md mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-danger/10 border border-danger/20 text-xs font-mono font-bold uppercase tracking-wider text-danger">
            <AlertTriangle size={15} />
            <span>OPERATIONAL RECOVERY REQUIRED</span>
          </div>

          <h1 className="font-serif type-h1 font-normal text-ink tracking-tight">
            Unexpected System Variance
          </h1>

          <div className="font-odia text-sm text-ink-muted" lang="or">
            କ୍ଷମା କରିବେ, ଏକ ଅପ୍ରତ୍ୟାଶିତ ତ୍ରୁଟି ଘଟିଛି। ଦୟାକରି ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ।
          </div>

          <p className="type-body text-ink-muted text-sm leading-relaxed max-w-sm mx-auto">
            A temporary runtime condition prevented this page from rendering cleanly. Your data and offline queue
            remain intact.
          </p>

          {error.digest && (
            <div className="text-xs font-mono text-ink-muted bg-sand/30 p-2.5 rounded-[4px] border border-soft-border max-w-xs mx-auto break-all">
              Diagnostic Digest: {error.digest}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="touch-target px-6 py-3 bg-forest hover:bg-forest-hover text-white text-xs font-sans font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <RotateCcw size={14} />
              <span>Retry Request</span>
            </button>
            <Link
              href="/"
              className="touch-target px-6 py-3 bg-white hover:bg-cream/40 text-ink border border-soft-border text-xs font-sans font-semibold rounded-[6px] transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Home size={14} className="text-forest" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Support Notice */}
      <footer className="border-t border-soft-border py-4 px-6 text-center text-xs text-ink-muted bg-white font-mono">
        <div>TDCCOL Technical Operations Cell · Baripada, Mayurbhanj</div>
      </footer>
    </div>
  );
}
