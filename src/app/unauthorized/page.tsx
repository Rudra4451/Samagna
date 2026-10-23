'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center items-center p-6 text-ink">
      <div className="max-w-[440px] w-full border border-rule rounded-[4px] bg-surface p-6 sm:p-8 space-y-6 text-center">
        <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/30 text-danger flex items-center justify-center mx-auto">
          <ShieldAlert size={24} />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-danger font-semibold">
            HTTP 403 · Access Denied
          </span>
          <h1 className="text-[22px] font-heading font-bold text-ink">
            Restricted Clearance Level
          </h1>
          <p className="text-[13px] text-ink-muted">
            Your current session role lacks the administrative authority required to access this ledger route.
          </p>
        </div>

        <div className="p-3 border border-rule rounded-[3px] bg-bg-sunken text-left text-[12px] font-mono space-y-1 text-ink-subtle">
          <div><span className="text-ink-muted">Policy:</span> Least-Privilege Role Separation</div>
          <div><span className="text-ink-muted">Jurisdiction:</span> TDCCOL Mayurbhanj Ledger Desk</div>
          <div><span className="text-ink-muted">Requirement:</span> SUPERVISOR_ADMIN or Certified Role</div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link href="/login" className="w-full">
            <Button variant="primary" className="w-full h-[44px] flex items-center justify-center gap-2">
              <LogIn size={16} />
              <span>Switch to Authorized Account</span>
            </Button>
          </Link>

          <Link href="/collector" className="w-full">
            <Button variant="secondary" className="w-full h-[44px] flex items-center justify-center gap-2">
              <ArrowLeft size={16} />
              <span>Return to Collector Workspace</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
