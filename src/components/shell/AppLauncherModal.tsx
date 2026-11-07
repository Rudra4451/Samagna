'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../../store/useAppStore';
import {
  X,
  Search,
  Sprout,
  Users,
  Scale,
  Warehouse,
  Briefcase,
  Cog,
  Truck,
  ShoppingBag,
  Store,
  ShieldCheck,
  Building,
  BarChart3,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ExperienceItem {
  id: string;
  suiteId: 'operations' | 'marketplace';
  titleEn: string;
  titleOr: string;
  descEn: string;
  descOr: string;
  href: string;
  icon: LucideIcon;
  clearanceEn: string;
  clearanceOr: string;
  badge?: string;
}

const EXPERIENCES: ExperienceItem[] = [
  // --- SUITE A: SAMAGNA OPERATIONS (B2G & FIELD) ---
  {
    id: 'exp-collector',
    suiteId: 'operations',
    titleEn: 'Tribal Collector App',
    titleOr: 'ଆଦିବାସୀ ସଂଗ୍ରାହକ ଅନୁପ୍ରୟୋଗ',
    descEn: 'Offline mobile ledger with voice input, quick lotting and MSP rate lookup.',
    descOr: 'ମୋବାଇଲ୍ ଅଫଲାଇନ୍ ଲେଜର, ସ୍ୱର ସହାୟତା ଏବଂ ଏମଏସପି ଦର ସୂଚୀ।',
    href: '/collector',
    icon: Sprout,
    clearanceEn: 'Free Gatherer Access',
    clearanceOr: 'ମାଗଣା ସଂଗ୍ରାହକ ଅଭିଗମନ',
    badge: 'Offline IndexedDB',
  },
  {
    id: 'exp-facilitator',
    suiteId: 'operations',
    titleEn: 'SHG Facilitator Portal',
    titleOr: 'ସ୍ୱୟଂ ସହାୟକ ଗୋଷ୍ଠୀ ସଂଯୋଜକ',
    descEn: 'Village SHG aggregations, member passbooks and micro-lot creation.',
    descOr: 'ଗ୍ରାମସ୍ତରୀୟ ଗୋଷ୍ଠୀ ସଂଗ୍ରହ, ପାସବୁକ୍ ପରିଚାଳନା ଏବଂ ମାଇକ୍ରୋ-ଲଟ୍ ପ୍ରସ୍ତୁତି।',
    href: '/facilitator',
    icon: Users,
    clearanceEn: 'SHG Lead',
    clearanceOr: 'ଏସଏଚଜି ମୁଖ୍ୟ',
  },
  {
    id: 'exp-collection',
    suiteId: 'operations',
    titleEn: 'Collection Center Desk',
    titleOr: 'କେନ୍ଦ୍ର ସଂଗ୍ରହ ଡେସ୍କ',
    descEn: 'Weighment intake, moisture grading and instant receipt slip printing.',
    descOr: 'ପ୍ରାଥମିକ ଓଜନ ଗ୍ରହଣ, ଆର୍ଦ୍ରତା ମୂଲ୍ୟାଙ୍କନ ଏବଂ ତୁରନ୍ତ ରସିଦ୍ ପ୍ରଦାନ।',
    href: '/collection',
    icon: Scale,
    clearanceEn: 'Center Operator',
    clearanceOr: 'ସଂଗ୍ରହ ପରିଚାଳକ',
  },
  {
    id: 'exp-warehouse',
    suiteId: 'operations',
    titleEn: 'Warehouse & Inventory Ledger',
    titleOr: 'ଗୋଦାମ ଏବଂ ତାଲିକା ଲେଜର',
    descEn: 'Depôt bays, shrinkage calculation, quality grading and dispatch manifests.',
    descOr: 'ଲଟ୍ ଏକତ୍ରୀକରଣ, ଗୋଦାମ ସ୍ଥାନ ବିଭାଜନ ଏବଂ ପ୍ରେରଣ ଚାଲାଣ।',
    href: '/inventory',
    icon: Warehouse,
    clearanceEn: 'Depôt Custodian',
    clearanceOr: 'ଗୋଦାମ ରକ୍ଷକ',
  },
  {
    id: 'exp-institutional',
    suiteId: 'operations',
    titleEn: 'Institutional Admin & B2G Contracts',
    titleOr: 'ଅନୁଷ୍ଠାନିକ ପ୍ରଶାସନ ଓ ସେବା ଚୁକ୍ତି',
    descEn: 'State government service proposals, deliverable tracking and pilot deployments.',
    descOr: 'ସରକାରୀ ସେବା ପ୍ରସ୍ତାବ, ଚୁକ୍ତି କାର୍ଯ୍ୟ ଏବଂ ପାଇଲଟ୍ ପ୍ରକଳ୍ପ ପରିଚାଳନା।',
    href: '/institutional',
    icon: Building,
    clearanceEn: 'State Officer',
    clearanceOr: 'ଅନୁଷ୍ଠାନିକ ଅଧିକାରୀ',
    badge: 'B2G Governance',
  },
  {
    id: 'exp-revenue-reports',
    suiteId: 'operations',
    titleEn: 'BI Reports & Audit Dossiers',
    titleOr: 'ରାଜସ୍ୱ, ସମାଧାନ ଏବଂ ବ୍ୟବସାୟ ରିପୋର୍ଟ',
    descEn: 'Commercial reconciliations, fee schedules, tenant directory and export dossiers.',
    descOr: 'ଅପରିବର୍ତ୍ତନୀୟ ଆର୍ଥିକ ଲେଜର, ଫି ସମାଧାନ, ସଂସ୍ଥା ତାଲିକା ଏବଂ ଅଡିଟ୍ ଡସିଅର।',
    href: '/reports',
    icon: BarChart3,
    clearanceEn: 'Audit & Finance',
    clearanceOr: 'ଆର୍ଥିକ ଓ ବିଆଇ ପ୍ରାଧିକରଣ',
  },

  // --- SUITE B: SAMAGNA MARKETPLACE (COMMERCIAL & CONSUMER) ---
  {
    id: 'exp-trade',
    suiteId: 'marketplace',
    titleEn: 'B2B Trade & RFQ Platform',
    titleOr: 'ବି୨ବି ବାଣିଜ୍ୟ ଏବଂ ଆରଏଫକ୍ୟୁ',
    descEn: 'Wholesale lot discovery, formal RFQs, counter-offers and purchase orders.',
    descOr: 'ପାଇକାରୀ ଲଟ୍ ଅନୁସନ୍ଧାନ, ଆରଏଫକ୍ୟୁ ନିଲାମ ଏବଂ କ୍ରୟ ଆଦେଶ।',
    href: '/trade',
    icon: Briefcase,
    clearanceEn: 'Verified Enterprise',
    clearanceOr: 'ପ୍ରମାଣିତ ବ୍ୟବସାୟୀ',
    badge: 'B2B Trade',
  },
  {
    id: 'exp-processing',
    suiteId: 'marketplace',
    titleEn: 'Processing & Value Addition',
    titleOr: 'ପ୍ରକ୍ରିୟାକରଣ ଏବଂ ମୂଲ୍ୟଯୁକ୍ତ କେନ୍ଦ୍ର',
    descEn: 'Milling & deseeding scheduling, processing jobs and batch yield reconciliation.',
    descOr: 'ମିଲିଂ, ବିହନ ବାହାର କରିବା ସୁବିଧା ଏବଂ ପ୍ରକ୍ରିୟାକରଣ ଉତ୍ପାଦନ ହିସାବ।',
    href: '/processing',
    icon: Cog,
    clearanceEn: 'Processing Facility',
    clearanceOr: 'ପ୍ରକ୍ରିୟାକରଣ ୟୁନିଟ୍',
  },
  {
    id: 'exp-logistics',
    suiteId: 'marketplace',
    titleEn: 'Logistics & Fulfilment Network',
    titleOr: 'ଲଜିଷ୍ଟିକ୍ସ ଏବଂ ଯୋଗାଣ ନେଟୱର୍କ',
    descEn: 'Multi-leg freight scheduling, custody transfers and proof of delivery.',
    descOr: 'ପରିବହନ ଚାଲାଣ, ହସ୍ତାନ୍ତର ଟ୍ରାକିଂ ଏବଂ ବିତରଣ ପ୍ରମାଣପତ୍ର।',
    href: '/logistics',
    icon: Truck,
    clearanceEn: 'Logistics Carrier',
    clearanceOr: 'ପରିବହନକାରୀ',
  },
  {
    id: 'exp-distribution',
    suiteId: 'marketplace',
    titleEn: 'Partner Distribution Network',
    titleOr: 'ଅଂଶୀଦାର ବିତରଣ ନେଟୱର୍କ',
    descEn: 'Retail-ready catalog management, channel portals and commission records.',
    descOr: 'ଖୁଚୁରା ପ୍ୟାକେଜିଂ ସାମଗ୍ରୀ, ଅଂଶୀଦାର ଚ୍ୟାନେଲ୍ ଏବଂ କମିଶନ ହିସାବ।',
    href: '/distribution',
    icon: ShoppingBag,
    clearanceEn: 'Retail Partner',
    clearanceOr: 'ଖୁଚୁରା ଅଂଶୀଦାର',
  },
  {
    id: 'exp-store',
    suiteId: 'marketplace',
    titleEn: 'Samagna Forest Store (B2C)',
    titleOr: 'ସମଗ୍ରା ବନ ଷ୍ଟୋର୍ (ଖୁଚୁରା)',
    descEn: 'Consumer storefront for wild-harvested honey, resins, herbs and direct orders.',
    descOr: 'ପ୍ରାକୃତିକ ଉତ୍ପାଦ ବିପଣୀ, ସଂଗ୍ରାହକ ଇତିହାସ ଏବଂ ସିଧାସଳଖ ଅର୍ଡର।',
    href: '/store',
    icon: Store,
    clearanceEn: 'Public Store',
    clearanceOr: 'ସର୍ବସାଧାରଣ ବିପଣୀ',
    badge: 'Direct to Consumer',
  },
  {
    id: 'exp-public',
    suiteId: 'marketplace',
    titleEn: 'Public Provenance & Verification',
    titleOr: 'ସର୍ବସାଧାରଣ ଉତ୍ପତ୍ତି ଯାଞ୍ଚ',
    descEn: 'Public lot provenance lookup, QR verification and origin certificates.',
    descOr: 'ଖୋଲା ଲେଜର, କ୍ୟୁଆର କୋଡ୍ ଯାଞ୍ଚ ଏବଂ ଆଇନଗତ ତଥ୍ୟ।',
    href: '/verify',
    icon: ShieldCheck,
    clearanceEn: 'Public Registry',
    clearanceOr: 'ସର୍ବସାଧାରଣ ରେକର୍ଡ',
  },
];

export const AppLauncherModal: React.FC = () => {
  const pathname = usePathname();
  const { isAppLauncherOpen, setIsAppLauncherOpen, language } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'operations' | 'marketplace'>('all');

  if (!isAppLauncherOpen) {
    return null;
  }

  const filtered = EXPERIENCES.filter((item) => {
    if (activeTab !== 'all' && item.suiteId !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.titleEn.toLowerCase().includes(q) ||
      item.titleOr.toLowerCase().includes(q) ||
      item.descEn.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q)
    );
  });

  const operationsItems = filtered.filter((i) => i.suiteId === 'operations');
  const marketplaceItems = filtered.filter((i) => i.suiteId === 'marketplace');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={language === 'OR' ? 'ସମଗ୍ରା ସୁଇଟ୍ ଲଞ୍ଚର୍' : 'Samagna Experience Launcher'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => setIsAppLauncherOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface rounded-[6px] border border-rule shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="h-[56px] border-b border-rule px-6 flex items-center justify-between bg-bg-sunken">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <span className="font-mono font-bold text-[14px]">❖</span>
            </div>
            <div>
              <h2 className="font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-ink">
                {language === 'OR' ? 'ସମଗ୍ରା ପ୍ଲାଟଫର୍ମ ସୁଇଟ୍' : 'Samagna Platform Suite'}
              </h2>
              <p className="text-[11px] text-ink-muted">
                {language === 'OR'
                  ? 'ସରକାରୀ ଅପରେସନ୍ସ ଏବଂ ବ୍ୟବସାୟିକ ବାଣିଜ୍ୟ ମଧ୍ୟରେ ସିଧାସଳଖ ଯାତାୟାତ କରନ୍ତୁ'
                  : 'Switch between Operations (B2G SaaS) and Marketplace (Commercial)'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAppLauncherOpen(false)}
            className="p-1.5 text-ink-muted hover:text-ink rounded-[4px] hover:bg-surface border border-transparent hover:border-rule transition-colors"
            aria-label="Close launcher"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-rule bg-surface flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Tab Filter */}
          <div className="flex items-center gap-1 bg-bg-sunken p-1 rounded-[4px] border border-rule shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-2.5 py-1 rounded-[3px] text-[11px] font-mono font-medium transition-colors',
                activeTab === 'all'
                  ? 'bg-surface text-ink font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {language === 'OR' ? 'ସବୁ (୧୨)' : 'All (12)'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('operations')}
              className={cn(
                'px-2.5 py-1 rounded-[3px] text-[11px] font-mono font-medium transition-colors',
                activeTab === 'operations'
                  ? 'bg-surface text-ink font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {language === 'OR' ? 'ଅପରେସନ୍ସ (୬)' : 'Operations (6)'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={cn(
                'px-2.5 py-1 rounded-[3px] text-[11px] font-mono font-medium transition-colors',
                activeTab === 'marketplace'
                  ? 'bg-surface text-ink font-bold shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {language === 'OR' ? 'ବାଣିଜ୍ୟ (୬)' : 'Marketplace (6)'}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'OR'
                  ? 'ଅନୁଭୂତି କିମ୍ବା ପଥ ଖୋଜନ୍ତୁ...'
                  : 'Filter by name or path (e.g. collector, trade, inventory)...'
              }
              className="w-full h-[34px] pl-9 pr-4 rounded-[4px] border border-rule bg-bg-sunken text-[12px] font-mono text-ink placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Suites Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Suite A: Operations */}
          {operationsItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
                    {language === 'OR' ? 'ଅପରେସନ୍ସ ସୁଇଟ୍ (B2G)' : 'Operations Suite (B2G & Field)'}
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    ({operationsItems.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-ink-muted hidden sm:inline">
                  Procurement · Storage · B2G Contracts · Audit
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {operationsItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsAppLauncherOpen(false)}
                      className={cn(
                        'group p-3 rounded-[4px] border transition-all flex items-start gap-3 relative',
                        isActive
                          ? 'border-accent bg-accent/[0.05] shadow-xs'
                          : 'border-rule bg-surface hover:border-ink-subtle hover:bg-bg-sunken/60'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-[4px] shrink-0 transition-colors',
                          isActive
                            ? 'bg-accent text-white'
                            : 'bg-bg-sunken text-ink group-hover:bg-accent/10 group-hover:text-accent border border-rule'
                        )}
                      >
                        <IconComponent size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold text-ink group-hover:text-accent transition-colors truncate">
                            {language === 'OR' ? item.titleOr : item.titleEn}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-bg-sunken text-ink-muted text-[10px] font-mono border border-rule shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 leading-snug">
                          {language === 'OR' ? item.descOr : item.descEn}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-rule/50 text-[10px] font-mono">
                          <span className="text-ink-subtle">
                            {language === 'OR' ? item.clearanceOr : item.clearanceEn}
                          </span>
                          <span className="text-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                            <span>Open</span>
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suite B: Marketplace */}
          {marketplaceItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-ink">
                    {language === 'OR' ? 'ବାଣିଜ୍ୟ ସୁଇଟ୍ (ବ୍ୟବସାୟ ଓ ଖୁଚୁରା)' : 'Marketplace Suite (Commercial & Public)'}
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    ({marketplaceItems.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-ink-muted hidden sm:inline">
                  Wholesale Trade · Processing · Logistics · Store · Provenance
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {marketplaceItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsAppLauncherOpen(false)}
                      className={cn(
                        'group p-3 rounded-[4px] border transition-all flex items-start gap-3 relative',
                        isActive
                          ? 'border-accent bg-accent/[0.05] shadow-xs'
                          : 'border-rule bg-surface hover:border-ink-subtle hover:bg-bg-sunken/60'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-[4px] shrink-0 transition-colors',
                          isActive
                            ? 'bg-accent text-white'
                            : 'bg-bg-sunken text-ink group-hover:bg-accent/10 group-hover:text-accent border border-rule'
                        )}
                      >
                        <IconComponent size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-bold text-ink group-hover:text-accent transition-colors truncate">
                            {language === 'OR' ? item.titleOr : item.titleEn}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-bg-sunken text-ink-muted text-[10px] font-mono border border-rule shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 leading-snug">
                          {language === 'OR' ? item.descOr : item.descEn}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-rule/50 text-[10px] font-mono">
                          <span className="text-ink-subtle">
                            {language === 'OR' ? item.clearanceOr : item.clearanceEn}
                          </span>
                          <span className="text-accent group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                            <span>Open</span>
                            <ArrowRight size={11} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-ink-muted text-[13px] font-mono">
              No matching module found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Footer Guarantee Bar */}
        <div className="h-[40px] border-t border-rule px-6 bg-bg-sunken flex items-center justify-between text-[11px] font-mono text-ink-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>Statutory Policy: Tribal Gatherer 0% Platform Fee Protected</span>
          </div>
          <span className="hidden sm:inline text-ink-subtle">
            Samagna Architecture · 2 Primary Suites
          </span>
        </div>
      </div>
    </div>
  );
};
