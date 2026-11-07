import React from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { CurvedDivider } from '@/components/landing/CurvedDivider';
import { PathwaysSection } from '@/components/landing/PathwaysSection';
import { ValueChainSection } from '@/components/landing/ValueChainSection';
import { ProduceCatalogueSection } from '@/components/landing/ProduceCatalogueSection';
import { TraceabilitySection } from '@/components/landing/TraceabilitySection';
import { GovernanceSection } from '@/components/landing/GovernanceSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export const dynamic = 'force-dynamic';

export default function PublicLandingPage() {
  return (
    <div className="min-h-dvh bg-warm-white text-ink font-sans selection:bg-cream selection:text-forest antialiased overflow-x-clip">
      {/* 1. EDITORIAL HEADER & NAVIGATION */}
      <LandingHeader />

      <main>
        {/* 2. ART-DIRECTED DARK SAL-FOREST CANOPY HERO */}
        <LandingHero />

        {/* 3. ORGANIC CURVED SVG SECTION DIVIDER */}
        <CurvedDivider
          topColor="var(--canopy-deepest)"
          bottomColor="var(--canvas-warm)"
        />

        {/* 4. TWO PATHWAYS: INSTITUTIONAL OPERATIONS (B2G) vs COMMERCIAL MARKETPLACE (B2B) */}
        <PathwaysSection />

        {/* 5. CONNECTED 4-STEP VALUE-CHAIN TIMELINE */}
        <ValueChainSection />

        {/* 6. VERIFIED BOTANICAL PRODUCE CATALOGUE (17 APPROVED SPECIES) */}
        <ProduceCatalogueSection />

        {/* 7. PUBLIC BATCH TRACEABILITY DOSSIER (LIVE BATCH #BS-402 JOURNEY) */}
        <TraceabilitySection />

        {/* 8. STATUTORY ODISHA LABHA GOVERNANCE & AUDIT SAFEGUARDS */}
        <GovernanceSection />
      </main>

      {/* 9. INSTITUTIONAL FOOTER */}
      <LandingFooter />
    </div>
  );
}
