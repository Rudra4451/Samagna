'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import {
  Scale,
  Users,
  Truck,
  History,
  Sliders,
} from 'lucide-react';

export interface ManagerSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
  activeTab = 'aggregation',
  onTabChange,
  className,
  ...props
}) => {
  const navItems = [
    { id: 'aggregation', label: 'Field Aggregation', icon: Scale, badge: '100 kg' },
    { id: 'collectors', label: 'Tribal Collectors', icon: Users, count: '3' },
    { id: 'dispatches', label: 'Transit Dispatches', icon: Truck },
    { id: 'audit', label: 'Custody Audit Log', icon: History },
  ];

  return (
    <aside
      className={cn(
        'w-[240px] h-full flex flex-col bg-sidebar-bg text-sidebar-ink select-none shrink-0 border-r border-sidebar-ink/15 shadow-none',
        className
      )}
      {...props}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-sidebar-ink/15">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-subtle mb-1">
          BanaSetu Prototype
        </div>
        <h2 className="font-heading text-[16px] font-medium text-sidebar-ink leading-tight">
          Mayurbhanj Collection
        </h2>
        <div className="text-[12px] text-sidebar-ink/70 mt-0.5">
          Baripada Central Depôt #02
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-1">
        <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-[0.06em] text-sidebar-ink/60 font-semibold">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-[4px] transition-colors',
                isActive
                  ? 'bg-sidebar-ink/10 text-sidebar-ink border-l-2 border-accent'
                  : 'text-sidebar-ink/80 hover:bg-sidebar-ink/5 hover:text-sidebar-ink'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} strokeWidth={1.5} className={cn(isActive ? 'text-accent' : 'text-sidebar-ink/50')} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-[2px]',
                    isActive ? 'bg-accent text-accent-ink' : 'bg-sidebar-ink/15 text-sidebar-ink'
                  )}
                >
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 bg-sidebar-ink/15 text-sidebar-ink rounded-[2px]">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Info */}
      <div className="p-3 border-t border-sidebar-ink/15 text-[12px] text-sidebar-ink/70">
        <div className="font-medium text-sidebar-ink">S. Das (IM-04)</div>
        <div className="text-[11px] text-sidebar-ink/60 tabular-nums font-mono">Terminal ID: BRP-D02-09</div>
      </div>
    </aside>
  );
};
