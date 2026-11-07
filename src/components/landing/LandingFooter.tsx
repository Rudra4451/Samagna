import React from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { ShieldCheck, Phone, Mail, MapPin, ExternalLink, Lock } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-canopy text-cream pt-16 pb-12 border-t border-forest/60 text-left font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Column 1 & 2: Platform Identity */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block" aria-label="Samagna Home">
              <SamagnaLogo variant="dark" size="md" showTagline />
            </Link>
            <p className="text-xs text-cream/80 leading-relaxed max-w-sm font-sans">
              Samagna (BanaSetu) is an institutional digital public infrastructure platform empowering 1.4 million tribal
              primary gatherers across Mayurbhanj through transparent procurement, verifiable custody tracking, and
              enterprise commercial trade.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-terracotta">
              <ShieldCheck size={16} />
              <span>Aligned with Government of Odisha LABHA Scheme</span>
            </div>
            <div className="text-[11px] text-cream/60 font-mono">
              Administered by Tribal Development Cooperative Corporation of Odisha Ltd. (TDCCOL)
            </div>
          </div>

          {/* Column 3: Operational Desks (B2G) */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
              Operational Desks
            </div>
            <ul className="space-y-2 text-xs text-cream/80">
              <li>
                <Link href="/collector" className="hover:text-white transition-colors">
                  Gatherer Voice Desk
                </Link>
              </li>
              <li>
                <Link href="/facilitator" className="hover:text-white transition-colors">
                  SHG Lead Aggregation
                </Link>
              </li>
              <li>
                <Link href="/collection" className="hover:text-white transition-colors">
                  VPC Collection Manager
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-white transition-colors">
                  Depôt Reweigh &amp; Moisture
                </Link>
              </li>
              <li>
                <Link href="/institutional" className="hover:text-white transition-colors">
                  District DPO Administration
                </Link>
              </li>
              <li>
                <Link href="/revenue" className="hover:text-white transition-colors">
                  Treasury Reconciliation
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Commercial & Traceability (B2B) */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
              Trade &amp; Traceability
            </div>
            <ul className="space-y-2 text-xs text-cream/80">
              <li>
                <Link href="/trade" className="hover:text-white transition-colors">
                  Wholesale RFQ Bidding
                </Link>
              </li>
              <li>
                <Link href="/store" className="hover:text-white transition-colors">
                  Retail Forest Store
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors">
                  Batch QR Verification
                </Link>
              </li>
              <li>
                <Link href="/logistics" className="hover:text-white transition-colors">
                  Waybill Fleet Tracking
                </Link>
              </li>
              <li>
                <Link href="/processing" className="hover:text-white transition-colors">
                  Deseeding &amp; Milling
                </Link>
              </li>
              <li>
                <Link href="/distribution" className="hover:text-white transition-colors">
                  Retail Distribution Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Statutory & Support */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-terracotta">
              Statutory &amp; Support
            </div>
            <ul className="space-y-2 text-xs text-cream/80">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  LABHA Scheme Mandate
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Collector Privacy &amp; PII
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Public Access
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-white transition-colors">
                  Audited BI Disclosures
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-1">
                  <Lock size={12} className="text-terracotta" />
                  <span>Persona Login Directory</span>
                </Link>
              </li>
              <li>
                <Link href="/demo?demo=1" className="hover:text-white transition-colors">
                  Stage Demo Orchestrator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Helpline & Disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream/60">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} Government of Odisha. TDCCOL Mayurbhanj.</span>
            <span>·</span>
            <span>Collector Helpline: 1800-345-6789 (Toll Free)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Mayurbhanj District Administration</span>
            <span>·</span>
            <span>Similipal Biosphere Reserve</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
