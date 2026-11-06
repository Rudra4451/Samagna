'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SamagnaLogo } from '../ui/SamagnaLogo';
import { useCartStore } from '../../store/useCartStore';
import {
  ShoppingBag,
  ShoppingCart,
  Briefcase,
  Building2,
  Package,
  ShieldCheck,
  FileText,
  Warehouse,
  ArrowLeft,
  ChevronDown,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const MarketplaceNav: React.FC = () => {
  const pathname = usePathname();
  const { getTotalItemsCount, getTotalGross } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalUnits = mounted ? getTotalItemsCount() : 0;
  const totalGross = mounted ? getTotalGross() : 0;

  const navLinks = [
    { href: '/marketplace', label: 'All Products', icon: Layers },
    { href: '/marketplace/b2b', label: 'B2B Bulk Sourcing', icon: Building2, badge: 'Wholesale' },
    { href: '/marketplace/b2c', label: 'B2C Retail Store', icon: ShoppingBag, badge: 'Packaged' },
    { href: '/marketplace/rfq', label: 'Request for Quote (RFQ)', icon: FileText },
    { href: '/marketplace/orders', label: 'Order Tracking', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-rule bg-surface/95 backdrop-blur shadow-none">
      {/* Top Banner Notice */}
      <div className="bg-accent/10 border-b border-accent/20 px-4 py-1.5 text-center text-[11px] font-mono text-accent font-semibold flex items-center justify-between">
        <div className="flex items-center gap-1.5 mx-auto">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
          <span>
            COMMERCIAL MARKETPLACE CHANNEL · DIRECT CONNECTION TO BARIPADA CENTRAL DEPÔT VERIFIED INVENTORY
          </span>
          <span className="text-ink-muted hidden md:inline">|</span>
          <span className="text-ink-muted hidden md:inline">100% MSP Guaranteed to Similipal Tribal Collectors</span>
        </div>
        <Link
          href="/"
          className="text-ink-muted hover:text-ink text-[10px] font-mono hidden lg:flex items-center gap-1 shrink-0"
        >
          <ArrowLeft size={12} />
          <span>Back to Portal Home</span>
        </Link>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-4">
        {/* Brand & Market Switch */}
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="flex items-center gap-2 focus:outline-2 focus:outline-accent">
            <SamagnaLogo variant="light" size="sm" showTagline={false} />
            <div className="flex items-center gap-1.5 pl-2 border-l border-rule">
              <span className="text-[12px] font-mono uppercase tracking-wider font-bold text-accent">
                Marketplace
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
                B2B + B2C
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-1.5 rounded-[3px] text-[13px] font-medium transition-colors flex items-center gap-1.5',
                  isActive
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-bg-sunken'
                )}
              >
                <Icon size={15} />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-mono uppercase px-1 py-0.2 rounded-[2px] border',
                      link.badge === 'Wholesale'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Warehouse Live Status & Cart */}
        <div className="flex items-center gap-3">
          {/* Live Warehouse Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-rule bg-bg-sunken text-[11px] font-mono">
            <Warehouse size={13} className="text-accent" />
            <span className="text-ink-muted">Stock Depot:</span>
            <span className="font-semibold text-ink">BRP-01 (Baripada)</span>
          </div>

          {/* Cart Button */}
          <Link
            href="/marketplace/cart"
            className={cn(
              'relative flex items-center gap-2 px-3 py-1.5 rounded-[3px] border transition-colors',
              totalUnits > 0
                ? 'bg-accent text-white border-accent hover:bg-accent-hover'
                : 'bg-surface border-rule text-ink hover:bg-bg-sunken'
            )}
            title="View Shopping Cart"
          >
            <ShoppingCart size={16} />
            <span className="text-[12px] font-semibold hidden sm:inline">Cart</span>
            {totalUnits > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-mono font-bold rounded-full bg-white text-accent">
                {totalUnits}
              </span>
            )}
            {totalGross > 0 && (
              <span className="text-[11px] font-mono font-bold hidden lg:inline">
                · ₹{totalGross.toLocaleString('en-IN')}
              </span>
            )}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-[3px] border border-rule hover:bg-bg-sunken text-ink"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rule bg-surface p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-[3px] text-[14px]',
                  isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-ink hover:bg-bg-sunken'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-bg-sunken border border-rule text-ink-muted">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-rule flex items-center justify-between text-[12px] font-mono text-ink-muted">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1.5 text-accent hover:underline py-1"
            >
              <ArrowLeft size={14} />
              <span>Exit to Main Government Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

