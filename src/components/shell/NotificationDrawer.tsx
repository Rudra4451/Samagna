'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '../../store/useAppStore';
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Truck,
  Building,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

export interface NotificationItem {
  id: string;
  category: 'action' | 'custody' | 'commercial' | 'system';
  titleEn: string;
  titleOr: string;
  detailEn: string;
  detailOr: string;
  timestamp: string;
  href: string;
  actionTextEn: string;
  actionTextOr: string;
  isRead: boolean;
  priority: 'high' | 'normal' | 'low';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    category: 'action',
    titleEn: 'Institutional Deliverable #DEL-2026-Q1 Pending Approval',
    titleOr: 'ଅନୁଷ୍ଠାନିକ ବିବରଣୀ #DEL-2026-Q1 ଅନୁମୋଦନ ଅପେକ୍ଷାରେ ଅଛି',
    detailEn: 'Q1 2026 Field Procurement Audit requires District Officer signoff.',
    detailOr: 'ପ୍ରଥମ ତ୍ରୈମାସିକ କ୍ଷେତ୍ର କ୍ରୟ ଅଡିଟ୍ ଜିଲ୍ଲା ଅଧିକାରୀଙ୍କ ସ୍ଵାକ୍ଷର ଆବଶ୍ୟକ କରେ।',
    timestamp: '12 min ago',
    href: '/institutional',
    actionTextEn: 'Review Deliverable',
    actionTextOr: 'ସମୀକ୍ଷା କରନ୍ତୁ',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-02',
    category: 'commercial',
    titleEn: 'Quotation Received for RFQ-2026-MBJ-004',
    titleOr: 'RFQ-2026-MBJ-004 ପାଇଁ ଦରପତ୍ର ମିଳିଛି',
    detailEn: 'Tribal Co-op submitted ₹160/kg for 5,000 kg Wild Honey lot.',
    detailOr: 'ଆଦିବାସୀ ସମିତି ୫,୦୦୦ କିଗ୍ରା ଜଙ୍ଗଲୀ ମହୁ ପାଇଁ କିଗ୍ରା ପିଛା ₹୧୬୦ ପ୍ରସ୍ତାବ ଦେଇଛି।',
    timestamp: '45 min ago',
    href: '/trade',
    actionTextEn: 'View Quotations',
    actionTextOr: 'ଦରପତ୍ର ଦେଖନ୍ତୁ',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-03',
    category: 'custody',
    titleEn: 'Milling Recovery Complete: Lot #LOT-HRD-2026-08',
    titleOr: 'ମିଲିଂ ନିଷ୍କାସନ ସମ୍ପୂର୍ଣ୍ଣ: ଲଟ୍ #LOT-HRD-2026-08',
    detailEn: 'Koraput Deseeding logged 78.4% de-seeded yield for Harida batch.',
    detailOr: 'କୋରାପୁଟ ପ୍ରକ୍ରିୟାକରଣ କେନ୍ଦ୍ର ହରିଡ଼ା ଲଟ୍ ପାଇଁ ୭୮.୪% ଅମଳ ଦାଖଲ କରିଛି।',
    timestamp: '2 hours ago',
    href: '/processing',
    actionTextEn: 'Inspect Yield Slip',
    actionTextOr: 'ଉତ୍ପାଦନ ଦେଖନ୍ତୁ',
    isRead: false,
    priority: 'normal',
  },
  {
    id: 'notif-04',
    category: 'custody',
    titleEn: 'Shipment #SHP-2026-042 Dispatched via Utkal Freight',
    titleOr: 'ଉତ୍କଳ ଫ୍ରେଟ୍ ମାଧ୍ୟମରେ ଚାଲାଣ #SHP-2026-042 ପ୍ରେରଣ କରାଯାଇଛି',
    detailEn: 'Custody transfer confirmed for 3,000 kg Sal seed lot to Berhampur plant.',
    detailOr: 'ବ୍ରହ୍ମପୁର ପ୍ଲାଣ୍ଟକୁ ୩,୦୦୦ କିଗ୍ରା ଶାଳ ମଞ୍ଜିର ହସ୍ତାନ୍ତର ନିଶ୍ଚିତ ହୋଇଛି।',
    timestamp: '4 hours ago',
    href: '/logistics',
    actionTextEn: 'Track Custody Chain',
    actionTextOr: 'ହସ୍ତାନ୍ତର ଦେଖନ୍ତୁ',
    isRead: false,
    priority: 'normal',
  },
  {
    id: 'notif-05',
    category: 'system',
    titleEn: 'Offline Local Ledger Synchronised',
    titleOr: 'ଅଫଲାଇନ୍ ଲୋକାଲ ଲେଜର ସିଙ୍କ୍ ହୋଇଛି',
    detailEn: '42 primary collector weighments verified and anchored to cloud store.',
    detailOr: '୪୨ଟି ପ୍ରାଥମିକ ସଂଗ୍ରାହକ ଓଜନ ଯାଞ୍ଚ ହୋଇ ସର୍ଭରରେ ସାଇତା ହୋଇଛି।',
    timestamp: '1 day ago',
    href: '/collection',
    actionTextEn: 'View Weighments',
    actionTextOr: 'ଓଜନ ତାଲିକା',
    isRead: true,
    priority: 'low',
  },
];

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    unreadNotificationCount,
    setUnreadNotificationCount,
    language,
  } = useAppStore();

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'action' | 'custody' | 'commercial'>('all');

  if (!isNotificationDrawerOpen) {
    return null;
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationCount(0);
  };

  const handleItemClick = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    const remaining = notifications.filter((n) => n.id !== id && !n.isRead).length;
    setUnreadNotificationCount(remaining);
    setIsNotificationDrawerOpen(false);
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.category === activeTab;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={language === 'OR' ? 'ସୂଚନା କେନ୍ଦ୍ର' : 'Unified Notification Center'}
      className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[2px] transition-opacity"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={() => setIsNotificationDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-[460px] h-full bg-surface border-l border-rule flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="h-[52px] border-b border-rule flex items-center justify-between px-4 bg-bg-sunken">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <span className="font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-ink">
              {language === 'OR' ? 'ଅଦ୍ୟତନ ଏବଂ ସତର୍କତା' : 'Value-Chain Notifications'}
            </span>
            {unreadNotificationCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent text-white font-mono text-[10px] font-bold">
                {unreadNotificationCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-mono text-accent hover:underline px-2 py-1"
              >
                {language === 'OR' ? 'ସବୁ ପଢ଼ାଗଲା' : 'Mark all read'}
              </button>
            )}
            <button
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="p-1 text-ink-muted hover:text-ink rounded hover:bg-surface transition-colors"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-rule px-4 bg-surface text-[12px] font-mono">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-2 border-b-2 font-medium transition-colors',
              activeTab === 'all'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {language === 'OR' ? 'ସମସ୍ତ' : 'All'} ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={cn(
              'px-3 py-2 border-b-2 font-medium transition-colors',
              activeTab === 'action'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {language === 'OR' ? 'କାର୍ଯ୍ୟାନୁଷ୍ଠାନ' : 'Action'} (
            {notifications.filter((n) => n.category === 'action').length})
          </button>
          <button
            onClick={() => setActiveTab('custody')}
            className={cn(
              'px-3 py-2 border-b-2 font-medium transition-colors',
              activeTab === 'custody'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {language === 'OR' ? 'ହସ୍ତାନ୍ତର / ଲଟ୍' : 'Custody'} (
            {notifications.filter((n) => n.category === 'custody').length})
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={cn(
              'px-3 py-2 border-b-2 font-medium transition-colors',
              activeTab === 'commercial'
                ? 'border-accent text-accent font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            )}
          >
            {language === 'OR' ? 'ବାଣିଜ୍ୟିକ' : 'Commercial'} (
            {notifications.filter((n) => n.category === 'commercial').length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-muted">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-success opacity-80" />
              <p className="font-mono text-[12px] font-bold">
                {language === 'OR' ? 'କୌଣସି ନୂଆ ସୂଚନା ନାହିଁ' : 'All caught up!'}
              </p>
              <p className="text-[12px] mt-1 text-ink-subtle">
                {language === 'OR'
                  ? 'ସମସ୍ତ କାର୍ଯ୍ୟାନୁଷ୍ଠାନ ସମ୍ପନ୍ନ ହୋଇଛି।'
                  : 'No active alerts or approvals in this category.'}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-[4px] border p-3.5 transition-all relative',
                  item.isRead
                    ? 'border-rule bg-surface/60 opacity-80'
                    : 'border-accent/40 bg-accent/[0.03] shadow-sm'
                )}
              >
                {!item.isRead && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0 text-ink-muted">
                    {item.category === 'action' && <ShieldAlert size={16} className="text-warning" />}
                    {item.category === 'custody' && <Layers size={16} className="text-accent" />}
                    {item.category === 'commercial' && <Package size={16} className="text-success" />}
                    {item.category === 'system' && <CheckCircle2 size={16} className="text-ink-muted" />}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
                        {item.category}
                      </span>
                      <span className="text-ink-subtle text-[10px]">·</span>
                      <span className="font-mono text-[10px] text-ink-subtle">
                        {item.timestamp}
                      </span>
                    </div>

                    <h4 className="font-mono text-[12px] font-bold text-ink mt-0.5 leading-snug">
                      {language === 'OR' ? item.titleOr : item.titleEn}
                    </h4>

                    <p className="text-[12px] text-ink-muted mt-1 leading-normal">
                      {language === 'OR' ? item.detailOr : item.detailEn}
                    </p>

                    <div className="mt-2.5">
                      <Link
                        href={item.href}
                        onClick={() => handleItemClick(item.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-accent hover:underline bg-accent/5 px-2.5 py-1 rounded-[3px] border border-accent/20 hover:border-accent"
                      >
                        <span>{language === 'OR' ? item.actionTextOr : item.actionTextEn}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="h-[48px] border-t border-rule px-4 flex items-center justify-between bg-bg-sunken text-[11px] font-mono text-ink-subtle">
          <span>Protected Ledger Audit Stream</span>
          <span className="text-success font-semibold">● Live Sync</span>
        </div>
      </div>
    </div>
  );
};

