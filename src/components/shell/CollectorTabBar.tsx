'use client';

import React from 'react';
import { useAppStore, CollectorTab } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { Home, Tag, FileText, HelpCircle } from 'lucide-react';

export const CollectorTabBar: React.FC = () => {
  const { activeCollectorTab, setActiveCollectorTab, language } = useAppStore();

  const tabs: Array<{ id: CollectorTab; labelEn: string; labelOr: string; icon: React.ComponentType<any> }> = [
    { id: 'home', labelEn: 'Home', labelOr: 'ମୂଳ ପୃଷ୍ଠା', icon: Home },
    { id: 'prices', labelEn: 'Prices', labelOr: 'ଦର ତାଲିକା', icon: Tag },
    { id: 'requests', labelEn: 'Requests', labelOr: 'ଅନୁରୋଧ', icon: FileText },
    { id: 'help', labelEn: 'Help', labelOr: 'ସହାୟତା', icon: HelpCircle },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Collector Navigation Tabs"
      className="fixed bottom-0 inset-x-0 z-40 h-[64px] bg-surface border-t border-rule flex items-center justify-around px-2 select-none shadow-none"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeCollectorTab === tab.id;
        const label = language === 'OR' ? tab.labelOr : tab.labelEn;

        return (
          <button
            key={tab.id}
            id={`collector-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`collector-panel-${tab.id}`}
            tabIndex={0}
            onClick={() => setActiveCollectorTab(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center h-full transition-colors relative focus:outline-2 focus:outline-accent focus:outline-offset-0',
              isActive ? 'text-accent font-semibold' : 'text-ink-muted hover:text-ink'
            )}
            aria-label={label}
          >
            {isActive && (
              <span className="absolute top-0 inset-x-3 h-[2px] bg-accent rounded-full" />
            )}
            <Icon size={20} strokeWidth={1.5} className="mb-0.5 shrink-0" />
            <span
              className={cn(
                'text-[15px] leading-tight font-medium',
                language === 'OR' && 'font-odia text-[16px] leading-[1.6]'
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
