'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { ManagerSidebar } from './ManagerSidebar';
import { CollectorTabBar } from './CollectorTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();

  const isCollector = pathname.startsWith('/collector');
  const isCollection = pathname.startsWith('/collection');
  const isInventory = pathname.startsWith('/inventory');
  const isDesign = pathname.startsWith('/design');

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col antialiased">
      {/* Top Bar with persistent 32px simulated prototype banner */}
      <TopBar />

      {/* Main Shell Layout based on Active View */}
      {isCollector ? (
        <div className="flex-1 flex flex-col pb-[72px]">
          <main className="flex-1 w-full max-w-[480px] mx-auto sm:border-x sm:border-rule bg-bg px-4 py-5">
            {children}
          </main>
          {/* Mobile-first bottom tab bar */}
          <CollectorTabBar />
        </div>
      ) : isCollection || isInventory ? (
        <div className="flex-1 flex flex-row">
          {/* Fixed 240px Manager Sidebar */}
          <ManagerSidebar role={isCollection ? 'collection_manager' : 'inventory_manager'} />
          <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-[1200px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      ) : (
        /* Design System or Fallback view */
        <main className="flex-1 w-full">
          {children}
        </main>
      )}
    </div>
  );
};
