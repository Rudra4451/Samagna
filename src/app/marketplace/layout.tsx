import React from 'react';
import { MarketplaceNav } from '@/components/marketplace/MarketplaceNav';

export const metadata = {
  title: 'SAMAGNA Marketplace · Verified Minor Forest Produce (B2B & B2C)',
  description: 'Direct commercial marketplace connecting certified Minor Forest Produce from Mayurbhanj tribal collection centres to industrial bulk buyers and consumer households.',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased selection:bg-accent-tint selection:text-ink">
      <MarketplaceNav />
      <main className="flex-1 w-full">
        {children}
      </main>
      <footer className="border-t border-rule bg-surface py-8 px-4 sm:px-6 text-center text-ink-muted text-[12px] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink">SAMAGNA COMMERCIAL MARKETPLACE</span>
            <span>·</span>
            <span>Odisha MFP Commercialization Initiative</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Warehouse: Baripada Central Depôt (BRP-01)</span>
            <span>·</span>
            <span>Zero MSP Deductions Policy</span>
            <span>·</span>
            <span>Quality Lab Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

