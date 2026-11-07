'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { InstitutionalAdminView } from '@/components/institutional/InstitutionalAdminView';
import { SupervisorDistrictView } from '@/components/institutional/SupervisorDistrictView';
import { CenterManagerView } from '@/components/institutional/CenterManagerView';
import { DepotManagerView } from '@/components/institutional/DepotManagerView';
import { Building2, Layers, ShieldCheck, Scale, Warehouse, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type SupervisorViewTab = 'admin_sla' | 'operational_reports';

export default function InstitutionalOperationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    username: string;
    role: string;
    fullName: string;
    centerId?: string;
    district: string;
    isDemo?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [supervisorTab, setSupervisorTab] = useState<SupervisorViewTab>('admin_sla');

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/institutional');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error('Auth verification error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-ink">
        <p className="text-[13px] font-mono text-ink-muted">Verifying institutional credentials...</p>
      </div>
    );
  }

  const isSupervisor = currentUser.role === 'SUPERVISOR_ADMIN';
  const isCollectionManager = currentUser.role === 'COLLECTION_MANAGER';
  const isWarehouseManager = currentUser.role === 'WAREHOUSE_MANAGER';

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between text-xs font-mono text-ink-muted">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-forest transition-colors">
              Samagna Platform
            </Link>
            <span>/</span>
            <span className="text-forest font-semibold">Institutional Operations & SLA</span>
          </div>
          {isSupervisor && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-forest hover:text-leaf transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Admin Console
            </Link>
          )}
        </div>

        {/* Supervisor Tab Switcher */}
        {isSupervisor && (
          <div className="flex items-center gap-3 border-b border-forest/15 pb-2 text-xs font-mono overflow-x-auto scrollbar-none" role="tablist">
            <button
              role="tab"
              aria-selected={supervisorTab === 'admin_sla'}
              onClick={() => setSupervisorTab('admin_sla')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors ${
                supervisorTab === 'admin_sla'
                  ? 'bg-forest text-cream'
                  : 'text-ink-muted hover:text-forest bg-forest/5'
              }`}
            >
              <Building2 className="w-4 h-4" /> 1. Institutional Governance & Fixed-Fee SLA
            </button>
            <button
              role="tab"
              aria-selected={supervisorTab === 'operational_reports'}
              onClick={() => setSupervisorTab('operational_reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-semibold transition-colors ${
                supervisorTab === 'operational_reports'
                  ? 'bg-forest text-cream'
                  : 'text-ink-muted hover:text-forest bg-forest/5'
              }`}
            >
              <Layers className="w-4 h-4" /> 2. District Operational Intelligence Report
            </button>
          </div>
        )}

        {/* View Routing Based on Role */}
        {isSupervisor && supervisorTab === 'admin_sla' && (
          <InstitutionalAdminView currentUser={currentUser} />
        )}

        {isSupervisor && supervisorTab === 'operational_reports' && (
          <SupervisorDistrictView currentUser={currentUser} />
        )}

        {isCollectionManager && <CenterManagerView currentUser={currentUser} />}

        {isWarehouseManager && <DepotManagerView currentUser={currentUser} />}
      </div>
    </AppShell>
  );
}

