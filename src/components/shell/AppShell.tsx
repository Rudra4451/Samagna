'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { ManagerSidebar } from './ManagerSidebar';
import { CollectorTabBar } from './CollectorTabBar';
import { DemoControlPanel } from '../demo/DemoControlPanel';
import { ScriptMarkerOverlay } from '../demo/ScriptMarkerOverlay';
import { OrganisationContextBar } from './OrganisationContextBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  const isCollector = pathname.startsWith('/collector');
  const isCollection = pathname.startsWith('/collection');
  const isInventory = pathname.startsWith('/inventory') || pathname.startsWith('/warehouse');
  const isFacilitator = pathname.startsWith('/facilitator');
  const isInstitutional = pathname.startsWith('/institutional') || pathname.startsWith('/admin');
  const isCommercial =
    pathname.startsWith('/trade') ||
    pathname.startsWith('/processing') ||
    pathname.startsWith('/logistics') ||
    pathname.startsWith('/distribution') ||
    pathname.startsWith('/revenue') ||
    pathname.startsWith('/ecosystem') ||
    pathname.startsWith('/reports');
  const isStore = pathname.startsWith('/store');

  const showOrgContext = isInstitutional || isCommercial || isCollection || isInventory;

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased">
      {/* Optional Script Teleprompter bar for ?demo=1&script=1 */}
      <ScriptMarkerOverlay />

      {/* Top Bar with persistent 32px simulated prototype banner, suite launcher, & notifications */}
      <TopBar />

      {/* Consistent Multi-Experience Organisation Context Bar */}
      {showOrgContext && <OrganisationContextBar collapsible={true} />}

      {/* Audience-Specific Layouts (Do not force every experience into the same layout) */}
      {isCollector ? (
        /* 1. Field Collector: Mobile-first 480px, high contrast, large touch targets, offline ledger */
        <div className="flex-1 flex flex-col pb-[72px]">
          <main className="flex-1 w-full max-w-[480px] mx-auto sm:border-x sm:border-rule bg-bg px-4 py-5">
            {children}
          </main>
          {/* Mobile-first bottom tab bar */}
          <CollectorTabBar />
        </div>
      ) : isCollection || isInventory ? (
        /* 2. Operational Desks: High-density tabular sidebar layout */
        <div className="flex-1 flex flex-col md:flex-row">
          <ManagerSidebar role={isCollection ? 'collection_manager' : 'inventory_manager'} />
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-[1300px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      ) : isFacilitator ? (
        /* 3. Facilitator: Focused group aggregation layout */
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
          <main className="max-w-4xl mx-auto w-full">
            {children}
          </main>
        </div>
      ) : isInstitutional || isCommercial ? (
        /* 4. Commercial & Institutional Enterprise Dashboards: Utilitarian, high information density */
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      ) : (
        /* 5. Public Website & B2C Store: Editorial organic presentation */
        <main className="flex-1 w-full">
          {children}
        </main>
      )}

      {/* Global Stage Demo Control Panel (renders when ?demo=1) */}
      <DemoControlPanel />
    </div>
  );
};
