'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { SamagnaLogo } from '@/components/ui/SamagnaLogo';
import { Menu, X, Lock, Search, ArrowRight, ShieldCheck } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  labelOdia?: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '#operations', label: 'Operations (B2G)', labelOdia: 'ପରିଚାଳନା' },
  { href: '#trade', label: 'Trade & Store', labelOdia: 'ବାଣିଜ୍ୟ' },
  { href: '#value-chain', label: 'Value Chain', labelOdia: 'ପ୍ରକ୍ରିୟା' },
  { href: '#catalogue', label: 'Produce', labelOdia: 'ଦ୍ରବ୍ୟ' },
  { href: '#traceability', label: 'Traceability', labelOdia: 'ଟ୍ରେସେବିଲିଟି' },
  { href: '#governance', label: 'Governance', labelOdia: 'ଶାସନ' },
];

export const LandingHeader: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Condense header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll and trap focus when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';

      // Auto-focus first focusable element inside drawer
      const timer = setTimeout(() => {
        if (mobileMenuRef.current) {
          const firstFocusable = mobileMenuRef.current.querySelector<HTMLElement>(
            'a[href], button:not([disabled])'
          );
          firstFocusable?.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
          menuButtonRef.current?.focus();
          return;
        }

        if (e.key === 'Tab' && mobileMenuRef.current) {
          const focusable = mobileMenuRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalStyle;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileMenuOpen]);

  const handleSmoothScroll = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      const cleanId = targetId.replace(/^#/, '');
      const element = document.getElementById(cleanId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.pushState(null, '', `#${cleanId}`);
      }
    },
    []
  );

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 border-b ${
        isScrolled
          ? 'h-16 bg-warm-white/95 backdrop-blur-md border-soft-border/80 shadow-xs'
          : 'h-20 bg-warm-white border-soft-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-2 focus-visible:outline-terracotta rounded-[4px]"
          aria-label="Samagna · ସମଗ୍ନ Home"
        >
          <SamagnaLogo variant="forest" size={isScrolled ? 'sm' : 'md'} showTagline />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden lg:flex items-center space-x-7 text-[13px] font-sans font-medium text-ink-muted"
          aria-label="Main Navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="hover:text-forest transition-colors py-1 focus-visible:outline-2 focus-visible:outline-terracotta rounded-[2px]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden sm:flex items-center space-x-3">
          <Link
            href="/verify"
            className="touch-target px-3.5 py-2 text-xs font-sans font-semibold text-ink border border-soft-border rounded-[6px] bg-white hover:bg-cream/40 transition-all shadow-2xs flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-terracotta"
          >
            <Search size={14} className="text-forest" />
            <span>Verify Batch</span>
          </Link>
          <Link
            href="/login"
            className="touch-target px-4 py-2 text-xs font-sans font-semibold text-white bg-forest rounded-[6px] hover:bg-forest-hover transition-all flex items-center gap-1.5 shadow-2xs focus-visible:outline-2 focus-visible:outline-terracotta active:scale-[0.98]"
          >
            <Lock size={13} className="text-terracotta" />
            <span>Sign In (12 Roles)</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button (Strict min 44x44px Touch Target) */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/verify"
            className="sm:hidden p-2 text-ink border border-soft-border rounded-[6px] bg-white hover:bg-cream/40 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-2xs"
            aria-label="Verify Batch"
          >
            <Search size={18} className="text-forest" />
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] p-2.5 text-ink bg-white hover:bg-cream/40 rounded-[6px] border border-soft-border flex items-center justify-center transition-all active:scale-95 shadow-2xs focus-visible:outline-2 focus-visible:outline-terracotta"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer Scrim & Panel */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 top-16 sm:top-20 z-50 lg:hidden flex flex-col bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
          }}
        >
          <div className="bg-warm-white border-b border-soft-border p-5 shadow-elevated space-y-4 max-h-[calc(100dvh-5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-soft-border/60">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-forest">
                Navigation Directory
              </span>
              <span className="text-xs text-ink-muted">Mayurbhanj · Similipal</span>
            </div>

            <nav className="flex flex-col space-y-1 text-sm font-sans font-medium text-ink">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-[6px] hover:bg-cream/50 hover:text-forest flex items-center justify-between transition-colors"
                >
                  <span className="text-sm font-semibold">{link.label}</span>
                  <div className="flex items-center gap-2">
                    {link.labelOdia && (
                      <span className="font-odia text-xs text-ink-muted" lang="or">
                        {link.labelOdia}
                      </span>
                    )}
                    <ArrowRight size={14} className="text-charcoal" />
                  </div>
                </a>
              ))}
            </nav>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-soft-border grid grid-cols-2 gap-2.5">
              <Link
                href="/verify"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full min-h-[44px] text-center py-2.5 text-xs font-sans font-semibold text-ink border border-soft-border rounded-[6px] bg-white hover:bg-cream/40 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Search size={14} className="text-forest" />
                <span>Verify Batch</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full min-h-[44px] text-center py-2.5 text-xs font-sans font-semibold text-white bg-forest hover:bg-forest-hover rounded-[6px] flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Lock size={13} className="text-terracotta" />
                <span>Sign In (12 Roles)</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
