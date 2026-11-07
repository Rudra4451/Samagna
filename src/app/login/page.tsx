'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { getSafeRedirectDestination } from '@/lib/authRedirect';


interface TestPersona {
  username: string;
  category: 'operations' | 'marketplace' | 'public';
  role: string;
  roleOdia: string;
  name: string;
  destination: string;
  badge: string;
  description: string;
  isPublic?: boolean;
}

const TEST_PERSONAS: TestPersona[] = [
  // --- Group 1: Field Operations & Governance (B2G) ---
  {
    username: 'sunita.soren',
    category: 'operations',
    role: 'COLLECTOR',
    roleOdia: 'ସଂଗ୍ରାହକ',
    name: 'Sunita Soren',
    badge: 'Gatherer',
    destination: '/collector',
    description: 'Badagaon village · Offline digital scale & voice receipts',
  },
  {
    username: 'sumitra.marndi',
    category: 'operations',
    role: 'SHG_FACILITATOR',
    roleOdia: 'ଦଳ ସଂଯୋଜକ',
    name: 'Sumitra Marndi',
    badge: 'SHG Lead',
    destination: '/facilitator',
    description: 'Maa Mangala SHG · Village aggregations & member ledger',
  },
  {
    username: 'manager.mohanty',
    category: 'operations',
    role: 'COLLECTION_MANAGER',
    roleOdia: 'ସଂଗ୍ରହ ପରିଚାଳକ',
    name: 'R. K. Mohanty',
    badge: 'VPC Desk',
    destination: '/collection',
    description: 'Karanjia Center · Gross-minus-tare scale & waybills',
  },
  {
    username: 'sdas.baripada',
    category: 'operations',
    role: 'WAREHOUSE_MANAGER',
    roleOdia: 'ଗୋଦାମ ପରିଚାଳକ',
    name: 'S. Das',
    badge: 'Depôt Custodian',
    destination: '/inventory',
    description: 'Baripada Central Depôt · Reweighing & moisture loss triage',
  },
  {
    username: 'patnaik.dpo',
    category: 'operations',
    role: 'SUPERVISOR_ADMIN',
    roleOdia: 'ଜିଲ୍ଲା ଅଧିକାରୀ',
    name: 'A. Patnaik (DPO)',
    badge: 'District Admin',
    destination: '/institutional',
    description: 'Mayurbhanj DPO · B2G governance & statutory oversight',
  },
  {
    username: 'finance.comptroller',
    category: 'operations',
    role: 'SUPERVISOR_ADMIN',
    roleOdia: 'ଆର୍ଥିକ ନିୟନ୍ତ୍ରକ',
    name: 'State Treasury Comptroller',
    badge: 'Finance & BI',
    destination: '/revenue',
    description: 'State Treasury · Revenue reconciliation & audit dossiers',
  },

  // --- Group 2: Commercial Value Chain & Marketplace (B2B) ---
  {
    username: 'dabur.buyer',
    category: 'marketplace',
    role: 'SUPERVISOR_ADMIN',
    roleOdia: 'ପାଇକାରୀ କ୍ରେତା',
    name: 'Dabur India Procurement',
    badge: 'B2B Wholesale',
    destination: '/trade',
    description: 'Commercial buyer · Bulk lots, RFQ bidding & purchase orders',
  },
  {
    username: 'koraput.processor',
    category: 'marketplace',
    role: 'WAREHOUSE_MANAGER',
    roleOdia: 'ପ୍ରକ୍ରିୟାକରଣ କେନ୍ଦ୍ର',
    name: 'Koraput Deseeding Facility',
    badge: 'Processor',
    destination: '/processing',
    description: 'Processing complex · Milling jobs & yield reconciliation',
  },
  {
    username: 'utkal.freight',
    category: 'marketplace',
    role: 'COLLECTION_MANAGER',
    roleOdia: 'ପରିବହନକାରୀ',
    name: 'Utkal Freight Carrier',
    badge: 'Logistics',
    destination: '/logistics',
    description: 'Fleet coordinator · Transit manifests & delivery proofs',
  },
  {
    username: 'utkalika.retail',
    category: 'marketplace',
    role: 'SUPERVISOR_ADMIN',
    roleOdia: 'ଖୁଚୁରା ଅଂଶୀଦାର',
    name: 'Utkalika Handloom & Crafts',
    badge: 'Retail Partner',
    destination: '/distribution',
    description: 'Partner network · Packaging distribution & sales channels',
  },

  // --- Group 3: Public Consumer & Verification Surfaces ---
  {
    username: 'store.shopper',
    category: 'public',
    role: 'PUBLIC_SHOPPER',
    roleOdia: 'ସର୍ବସାଧାରଣ ବିପଣୀ',
    name: 'Consumer Storefront',
    badge: 'Forest Store',
    destination: '/store',
    description: 'Retail buyer · Direct orders of wild honey & packaged MFP',
    isPublic: true,
  },
  {
    username: 'public.verifier',
    category: 'public',
    role: 'PUBLIC_VERIFIER',
    roleOdia: 'ସର୍ବସାଧାରଣ ଯାଞ୍ଚ',
    name: 'Public Batch Verifier',
    badge: 'Traceability',
    destination: '/verify',
    description: 'Consumer / Auditor · Cryptographic batch QR verification',
    isPublic: true,
  },
];

export default function LoginPage() {
  const router = useRouter();

  // Prototype Evaluation: Demo personas and default credentials are permanently visible
  const [username, setUsername] = useState('patnaik.dpo');
  const [password, setPassword] = useState('Test@Pass123');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const showDemoPersonas = true;
  const [showPersonaDrawer, setShowPersonaDrawer] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'operations' | 'marketplace' | 'public'>('all');

  const filteredPersonas = selectedCategory === 'all'
    ? TEST_PERSONAS
    : TEST_PERSONAS.filter((p) => p.category === selectedCategory);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      if (reason === 'timeout') {
        setInfoMessage('Your session timed out due to inactivity. Please sign in again.');
      } else if (reason === 'loggedout') {
        setInfoMessage('You have successfully logged out of the Samagna ledger.');
      }
    }
  }, []);

  const handleLogin = async (overrideUser?: string, overridePass?: string, overrideDest?: string) => {
    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const userToAuth = (overrideUser || username).trim();
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

      // Navigate with full session cookie propagation
      window.location.href = dest;
    } catch {
      setErrorMessage('Network connection failure. Local offline ledger remains available.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF2] flex flex-col justify-between p-4 sm:p-6 text-ink selection:bg-accent selection:text-white font-sans antialiased">
      {/* Top Ledger Header */}
      <header className="max-w-2xl w-full mx-auto pt-4 flex items-center justify-between border-b border-rule pb-3">
        <Link href="/" className="flex items-center gap-2 focus:outline-2 focus:outline-accent">
          <SamagnaLogo variant="forest" size="md" showTagline />
        </Link>
        <div className="text-right flex items-center gap-2">
          <span className="text-[11px] font-sans font-semibold px-2.5 py-1 rounded-[3px] bg-bg-sunken border border-rule text-ink-muted">
            PORTAL v2.0
          </span>
          <Link
            href="/"
            className="text-[11px] font-sans font-medium text-accent hover:underline hidden sm:inline"
          >
            ← Public Homepage
          </Link>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-2xl w-full mx-auto my-auto py-6 sm:py-8">
        <div className="border border-rule rounded-[6px] bg-surface p-5 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-1.5 text-accent text-[12px] font-sans font-semibold tracking-wide uppercase">
              <ShieldCheck size={16} /> Certified Access Gateway
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-ink mt-1">
              Ledger Sign In
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
              Enter personnel credentials or select any of the 12 authentic platform personas below for 1-click evaluation.
            </p>
          </div>

          {infoMessage && (
            <div className="p-3 border border-accent/30 rounded-[4px] bg-accent/5 flex items-start gap-2.5 text-accent">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-sans leading-tight">{infoMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 border border-danger/30 rounded-[4px] bg-danger/5 flex items-start gap-2.5 text-danger">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-sans leading-tight">{errorMessage}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="login-username" className="text-xs font-semibold text-ink block mb-1">
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
                    className="w-full h-[42px] px-3 pl-9 text-sm font-sans border border-rule rounded-[4px] bg-surface text-ink focus:outline-none focus:border-accent"
                  />
                  <User size={15} className="absolute left-3 top-3 text-ink-muted" />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="text-xs font-semibold text-ink block mb-1">
                  Password / ପାସୱାର୍ଡ
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-[42px] px-3 pl-9 text-sm font-sans border border-rule rounded-[4px] bg-surface text-ink focus:outline-none focus:border-accent"
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-ink-muted" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full h-[44px] text-xs sm:text-sm font-sans font-semibold flex items-center justify-center gap-2 rounded-[4px]"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Ledger'}</span>
              <ArrowRight size={16} />
            </Button>
          </form>

          {/* 12 Platform Personas Demo Selector (All Personas Available with 1-Click Login) */}
          {showDemoPersonas && (
            <div className="pt-5 border-t border-rule space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-sans uppercase font-bold text-ink tracking-wide">
                    1-Click Evaluator Personas (12 Total)
                  </span>
                  <span className="px-2 py-0.5 rounded-[3px] bg-accent/10 text-accent font-sans text-[11px] font-semibold">
                    Test@Pass123
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPersonaDrawer(!showPersonaDrawer)}
                  className="text-xs font-sans text-accent hover:underline font-semibold text-left sm:text-right"
                  aria-expanded={showPersonaDrawer}
                >
                  {showPersonaDrawer ? 'Collapse Personas ↑' : 'Show All 12 Personas ↓'}
                </button>
              </div>

              {showPersonaDrawer && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 rounded-[4px] font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'all'
                          ? 'bg-ink text-white font-semibold'
                          : 'bg-bg-sunken text-ink-muted hover:bg-rule/40 hover:text-ink'
                      }`}
                    >
                      All Roles (12)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('operations')}
                      className={`px-3 py-1 rounded-[4px] font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'operations'
                          ? 'bg-[#2D4F1E] text-white font-semibold'
                          : 'bg-bg-sunken text-ink-muted hover:bg-rule/40 hover:text-ink'
                      }`}
                    >
                      Operations B2G (6)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('marketplace')}
                      className={`px-3 py-1 rounded-[4px] font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'marketplace'
                          ? 'bg-[#E27D60] text-white font-semibold'
                          : 'bg-bg-sunken text-ink-muted hover:bg-rule/40 hover:text-ink'
                      }`}
                    >
                      Marketplace B2B (4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('public')}
                      className={`px-3 py-1 rounded-[4px] font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === 'public'
                          ? 'bg-accent text-white font-semibold'
                          : 'bg-bg-sunken text-ink-muted hover:bg-rule/40 hover:text-ink'
                      }`}
                    >
                      Public Surfaces (2)
                    </button>
                  </div>

                  {/* Responsive Grid of Personas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {filteredPersonas.map((p) => (
                      <button
                        key={p.username}
                        type="button"
                        onClick={() => {
                          if (p.isPublic) {
                            router.push(p.destination);
                          } else {
                            setUsername(p.username);
                            setPassword('Test@Pass123');
                            handleLogin(p.username, 'Test@Pass123', p.destination);
                          }
                        }}
                        className="w-full text-left p-3 rounded-[4px] border border-rule hover:border-accent bg-bg-sunken hover:bg-surface transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs min-h-[72px]"
                      >
                        <div className="flex items-start justify-between gap-1.5 w-full">
                          <div>
                            <div className="text-xs font-semibold text-ink group-hover:text-accent flex items-center gap-1.5">
                              <span>{p.name}</span>
                            </div>
                            <div className="text-[11px] font-sans text-ink-muted mt-0.5">
                              {p.roleOdia} · <span className="font-mono text-[10px] text-ink-subtle">{p.username}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-semibold whitespace-nowrap ${
                            p.category === 'operations'
                              ? 'bg-[#2D4F1E]/10 text-[#2D4F1E]'
                              : p.category === 'marketplace'
                              ? 'bg-[#E27D60]/10 text-[#B84E34]'
                              : 'bg-accent/10 text-accent'
                          }`}>
                            {p.badge}
                          </span>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-rule/50 flex items-center justify-between text-[11px] text-ink-muted w-full">
                          <span className="truncate pr-1">{p.description}</span>
                          <span className="text-accent font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
                            Launch →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer colophon */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 border-t border-rule text-xs font-sans text-ink-muted">
        <p className="font-semibold text-ink">Tribal Development Co-operative Corporation of Odisha (TDCCOL)</p>
        <p className="mt-0.5 text-[11px] text-ink-subtle">
          LABHA Scheme Traceability Infrastructure · Mayurbhanj District
        </p>
      </footer>
    </div>
  );
}
