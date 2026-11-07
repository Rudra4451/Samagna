'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '../../store/useAppStore';
import { Building2, ShieldCheck, MapPin, Sparkles, ChevronRight, X, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface OrganisationContextBarProps {
  className?: string;
  collapsible?: boolean;
}

export const OrganisationContextBar: React.FC<OrganisationContextBarProps> = ({
  className,
  collapsible = false,
}) => {
  const {
    activeOrganisationId,
    activeOrganisationName,
    activeOrganisationCategory,
    language,
  } = useAppStore();

  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed || !activeOrganisationId) {
    return null;
  }

  // Determine badge styling based on category
  const categoryLabel = activeOrganisationCategory === 'institutional'
    ? 'State Institutional Apex'
    : activeOrganisationCategory === 'buyer'
    ? 'B2B Commercial Buyer'
    : activeOrganisationCategory === 'processor'
    ? 'Primary Processing Facility'
    : activeOrganisationCategory === 'logistics'
    ? 'Verified Freight Transporter'
    : activeOrganisationCategory === 'retail'
    ? 'Retail Distribution Partner'
    : 'Registered Value Chain Organisation';

  return (
    <div
      role="region"
      aria-label="Active Organisation Context"
      className={cn(
        'w-full border-b border-rule bg-surface/90 backdrop-blur-sm px-4 py-1.5 transition-all text-ink select-none',
        className
      )}
    >
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] font-mono">
        {/* Left: Active Entity & Verification Status */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="flex items-center gap-1.5 font-bold text-accent shrink-0">
            <Building2 size={13} className="shrink-0" />
            <span className="uppercase tracking-[0.06em]">
              {language === 'OR' ? 'ସଂସ୍ଥା ପ୍ରସଙ୍ଗ:' : 'Active Tenant:'}
            </span>
          </span>

          <span className="font-semibold text-ink truncate max-w-[150px] xs:max-w-[220px] sm:max-w-[360px]" title={activeOrganisationName || 'State Tribal Apex'}>
            {activeOrganisationName || 'Odisha Tribal Development & Forest Products Federation'}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-accent/10 text-accent font-semibold text-[10px] uppercase tracking-wider">
            {categoryLabel}
          </span>

          <span className="inline-flex items-center gap-1 text-success text-[10px] font-semibold bg-success/10 px-1.5 py-0.5 rounded-[3px]">
            <ShieldCheck size={11} className="shrink-0" />
            <span>{language === 'OR' ? 'ପ୍ରମାଣିତ' : 'Statutory Verification'}</span>
          </span>

          <span className="hidden lg:inline-flex items-center gap-1 text-ink-muted text-[10px]">
            <MapPin size={11} className="shrink-0" />
            <span>Mayurbhanj &amp; Koraput, Odisha</span>
          </span>
        </div>

        {/* Right: Primary Gatherer 0% Fee Rule & Quick Links */}
        <div className="flex items-center gap-3 shrink-0 ml-auto text-[10px]">
          <span className="hidden md:inline-flex items-center gap-1 text-ink-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
            <span>Collector 0% Platform Fee Protected · Statutory MSP Active</span>
          </span>

          <Link
            href="/ecosystem"
            className="text-accent hover:underline flex items-center gap-0.5 font-semibold"
            title="Manage Organisation Profiles & Registrations"
          >
            <span>{language === 'OR' ? 'ପ୍ରୋଫାଇଲ୍ ଦେଖନ୍ତୁ' : 'Org Directory'}</span>
            <ChevronRight size={12} />
          </Link>

          {collapsible && (
            <button
              onClick={() => setIsDismissed(true)}
              className="text-ink-muted hover:text-ink p-0.5 rounded hover:bg-bg-sunken"
              aria-label="Dismiss tenant bar"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

