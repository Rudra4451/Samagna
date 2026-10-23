'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSafeRedirectDestination } from '@/lib/authRedirect';


interface TestPersona {
  username: string;
  role: string;
  roleOdia: string;
  name: string;
  destination: string;
}

const TEST_PERSONAS: TestPersona[] = [
  {
    username: 'sunita.soren',
    role: 'COLLECTOR',
    roleOdia: 'ସଂଗ୍ରାହକ',
    name: 'Sunita Soren (Badagaon)',
    destination: '/collector',
  },
  {
    username: 'sumitra.marndi',
    role: 'SHG_FACILITATOR',
    roleOdia: 'ଦଳ ସଂଯୋଜକ',
    name: 'Sumitra Marndi (SHG Lead)',
    destination: '/facilitator',
  },
  {
    username: 'manager.mohanty',
    role: 'COLLECTION_MANAGER',
    roleOdia: 'ସଂଗ୍ରହ ପରିଚାଳକ',
    name: 'A. Mohanty (Karanjia Point)',
    destination: '/collection',
  },
  {
    username: 'sdas.baripada',
    role: 'WAREHOUSE_MANAGER',
    roleOdia: 'ଗୋଦାମ ପରିଚାଳକ',
    name: 'S. Das (Baripada Depôt)',
    destination: '/inventory',
  },
  {
    username: 'patnaik.dpo',
    role: 'SUPERVISOR_ADMIN',
    roleOdia: 'ଜିଲ୍ଲା ଅଧିକାରୀ',
    name: 'R. K. Patnaik (District DPO)',
    destination: '/admin',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('patnaik.dpo');
  const [password, setPassword] = useState('Test@Pass123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (overrideUser?: string, overridePass?: string, overrideDest?: string) => {
    setLoading(true);
    setErrorMessage(null);

    const userToAuth = overrideUser || username;
    const passToAuth = overridePass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToAuth, password: passToAuth }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data?.message || 'Invalid username or password. Check credentials and retry.');
        setLoading(false);
        return;
      }

      // Check for optional safe redirect query parameter
      const searchParams =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search)
          : null;
      const redirectParam = searchParams?.get('redirect');

      // Determine final destination with strict open-redirect and role-boundary validation
      const dest = getSafeRedirectDestination(
        overrideDest || redirectParam,
        data.user.role
      );

      router.push(dest);
    } catch {
      setErrorMessage('Network connection failure. Local offline ledger remains available.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between p-4 sm:p-6 text-ink selection:bg-accent selection:text-white">
      {/* Top Ledger Header */}
      <header className="max-w-[440px] w-full mx-auto pt-4 flex items-center justify-between border-b border-rule pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[3px] bg-sidebar-bg flex items-center justify-center text-white font-heading font-bold text-[16px]">
            BS
          </div>
          <div>
            <h1 className="font-heading font-bold text-[18px] tracking-tight text-ink leading-tight">
              BanaSetu · ବନସେତୁ
            </h1>
            <p className="text-[11px] text-ink-muted font-mono">
              OD-MAYURBHANJ-TDCCOL-LEDGER
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
            AUTH-PORTAL v1.0
          </span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-[440px] w-full mx-auto my-auto py-8">
        <div className="border border-rule rounded-[4px] bg-surface p-6 sm:p-8 shadow-none space-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-accent text-[12px] font-mono uppercase font-semibold">
              <ShieldCheck size={16} /> Certified Access Gateway
            </div>
            <h2 className="text-[22px] font-heading font-bold text-ink mt-1">
              Ledger Sign In
            </h2>
            <p className="text-[13px] text-ink-muted mt-0.5">
              Enter authorized personnel credentials or select an authenticated field persona below.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 border border-danger/30 rounded-[3px] bg-danger/5 flex items-start gap-2.5 text-danger">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[12px] font-mono leading-tight">{errorMessage}</p>
            </div>
          )}

          {/* Standard Login Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="login-username" className="text-[12px] font-semibold text-ink block mb-1">
                Username / କର୍ମଚାରୀ ନାମ
              </label>
              <div className="relative">
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="e.g. patnaik.dpo"
                  className="w-full h-[44px] px-3 pl-9 text-[14px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
                <User size={16} className="absolute left-3 top-3.5 text-ink-muted" />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-[12px] font-semibold text-ink block mb-1">
                Password / ପାସୱାର୍ଡ
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[44px] px-3 pl-9 text-[14px] font-mono border border-rule rounded-[3px] bg-surface text-ink focus:outline-none focus:border-ink"
                />
                <Lock size={16} className="absolute left-3 top-3.5 text-ink-muted" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full h-[46px] text-[14px] font-semibold flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Ledger'}</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* Quick Evaluator / Demo Persona Switcher */}
          <div className="pt-4 border-t border-rule space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-muted">
                1-Click Evaluator Personas
              </span>
              <span className="text-[10px] text-ink-subtle font-mono">
                Pre-seeded · Test@Pass123
              </span>
            </div>

            <div className="space-y-1.5">
              {TEST_PERSONAS.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => {
                    setUsername(p.username);
                    setPassword('Test@Pass123');
                    handleLogin(p.username, 'Test@Pass123', p.destination);
                  }}
                  className="w-full text-left p-2.5 rounded-[3px] border border-rule hover:border-ink bg-bg-sunken hover:bg-surface transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-ink group-hover:text-accent flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-ink-muted">
                      {p.role} · {p.roleOdia}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-ink-subtle group-hover:text-accent">
                    Log in →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer colophon */}
      <footer className="max-w-[440px] w-full mx-auto text-center py-4 border-t border-rule text-[11px] font-mono text-ink-muted">
        <p>Tribal Development Co-operative Corporation of Odisha (TDCCOL)</p>
        <p className="mt-0.5 text-ink-subtle">
          LABHA Scheme Traceability Infrastructure · Mayurbhanj District
        </p>
      </footer>
    </div>
  );
}
