'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { SamagnaLogo } from '../ui/SamagnaLogo';
import {
  Scale,
  Users,
  Truck,
  History,
  Warehouse,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Sliders,
  Wifi,
  WifiOff,
  LogOut,
} from 'lucide-react';

interface ManagerSidebarProps {
  role: 'collection_manager' | 'inventory_manager';
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string;
  count?: string;
  alert?: boolean;
}

export const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ role }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isOffline, toggleOffline } = useAppStore();
  const [currentHash, setCurrentHash] = useState<string>('');

  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        setCurrentHash(window.location.hash || '');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const isCollection = role === 'collection_manager';

  const navItems: NavItem[] = isCollection
    ? [
        { href: '/collection', label: 'Field Aggregation', icon: Scale, badge: '100 kg' },
        { href: '/collection#collectors', label: 'Tribal Collectors', icon: Users, count: '3' },
        { href: '/collection#dispatches', label: 'Transit Dispatches', icon: Truck },
        { href: '/collection#audit', label: 'Custody Audit Log', icon: History },
      ]
    : [
        { href: '/inventory', label: 'Depôt Re-Weigh', icon: Warehouse, badge: 'Lot #BS-402' },
        { href: '/inventory#shrinkage', label: 'Moisture Protocols', icon: FileSpreadsheet },
        { href: '/inventory#quarantine', label: 'Quarantine Review', icon: ShieldAlert, alert: true },
        { href: '/inventory#ledger', label: 'Stock Ledgers', icon: FileText },
      ];

  const managerProfile = isCollection
    ? { name: 'R. Mohanty', id: 'CM-12', role: 'Field Collection Manager', center: 'Karanjia Point #01' }
    : { name: 'S. Das', id: 'IM-04', role: 'Warehouse Inventory Manager', center: 'Baripada Depôt #02' };

  const isDesignActive = pathname === '/design';

  return (
    <aside className="w-[240px] shrink-0 min-h-[calc(100vh-80px)] flex flex-col bg-sidebar-bg text-sidebar-ink select-none border-r border-sidebar-ink/15 shadow-none">
      {/* Top of Sidebar: Samagna Logo */}
      <div className="p-4 border-b border-sidebar-ink/15">
        <Link href="/" className="block focus:outline-2 focus:outline-accent focus:outline-offset-0">
          <SamagnaLogo variant="dark" size="sm" showTagline />
        </Link>
        <div className="mt-2.5 inline-block text-[10px] font-mono uppercase tracking-wider text-accent-tint bg-sidebar-ink/10 border border-sidebar-ink/20 px-1.5 py-0.5 rounded-[2px]">
          {isCollection ? 'Mayurbhanj Collection' : 'Central Depôt Terminal'}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 space-y-1">
        <div className="px-4 pb-1 text-[10px] font-mono uppercase tracking-[0.06em] text-sidebar-ink/60">
          {isCollection ? 'Field Operations' : 'Depôt Operations'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const itemHash = item.href.includes('#') ? `#${item.href.split('#')[1]}` : '';
          const itemPath = item.href.split('#')[0];
          const isPathMatch = pathname === itemPath;

          const isItemActive = () => {
            if (!isPathMatch) return false;
            if (itemHash) {
              if (itemHash === '#shrinkage') {
                return currentHash === '#shrinkage' || currentHash === '#moisture';
              }
              return currentHash === itemHash;
            }
            if (isCollection) {
              return currentHash === '' || currentHash === '#aggregation';
            } else {
              return currentHash === '' || currentHash === '#reweigh';
            }
          };

          const isActive = isItemActive();

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (itemHash) {
                  setCurrentHash(itemHash);
                } else {
                  setCurrentHash('');
                }
              }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors border-l-2 focus:outline-2 focus:outline-accent',
                isActive
                  ? 'border-accent bg-sidebar-ink/10 text-sidebar-ink font-semibold'
                  : 'border-transparent text-sidebar-ink/80 hover:bg-sidebar-ink/5 hover:text-sidebar-ink'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={16} strokeWidth={1.5} className={cn(isActive ? 'text-accent' : 'text-sidebar-ink/50')} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 bg-sidebar-ink/15 text-sidebar-ink rounded-[2px]">
                  {item.badge}
                </span>
              )}
              {item.count && (
                <span className="text-[10px] tabular-nums font-mono px-1.5 py-0.5 bg-sidebar-ink/15 text-sidebar-ink rounded-[2px]">
                  {item.count}
                </span>
              )}
              {item.alert && (
                <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
              )}
            </Link>
          );
        })}

        <div className="pt-3 px-4 pb-1 text-[10px] font-mono uppercase tracking-[0.06em] text-sidebar-ink/60">
          System
        </div>
        <Link
          href="/design"
          aria-current={isDesignActive ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-colors border-l-2 focus:outline-2 focus:outline-accent',
            isDesignActive
              ? 'border-accent bg-sidebar-ink/10 text-sidebar-ink font-semibold'
              : 'border-transparent text-sidebar-ink/80 hover:bg-sidebar-ink/5 hover:text-sidebar-ink'
          )}
        >
          <Sliders size={16} strokeWidth={1.5} className="text-sidebar-ink/50" />
          <span>Design Tokens</span>
        </Link>
      </nav>

      {/* Footer: Demo Offline Switch & Manager Profile */}
      <div className="p-3.5 border-t border-sidebar-ink/15 bg-sidebar-bg space-y-3">
        {/* Offline Switch for Demo */}
        <div className="flex items-center justify-between p-2 rounded-[4px] border border-sidebar-ink/15 bg-sidebar-bg">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sidebar-ink">
            {isOffline ? (
              <WifiOff size={16} strokeWidth={1.5} className="text-warning" />
            ) : (
              <Wifi size={16} strokeWidth={1.5} className="text-success" />
            )}
            <span>Network Link</span>
          </div>
          <button
            onClick={toggleOffline}
            aria-label="Toggle demo offline simulation"
            className={cn(
              'h-[24px] px-2 rounded-[3px] border text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors',
              isOffline
                ? 'bg-warning/20 border-warning text-warning'
                : 'bg-sidebar-ink/10 border-sidebar-ink/20 text-sidebar-ink/70 hover:text-sidebar-ink'
            )}
          >
            {isOffline ? 'Offline' : 'Online'}
          </button>
        </div>

        {/* Manager User Stamp & Logout */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] leading-snug">
            <div className="font-medium text-sidebar-ink">{managerProfile.name}</div>
            <div className="text-[10px] text-sidebar-ink/60 font-mono">
              {managerProfile.id} • {managerProfile.center}
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch {}
              window.location.href = '/login?reason=loggedout';
            }}
            title="Log out"
            aria-label="Log out of manager session"
            className="p-1.5 rounded-[3px] text-sidebar-ink/60 hover:text-danger hover:bg-sidebar-ink/10 transition-colors"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
};
