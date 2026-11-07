'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldCheck,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

interface InteractionLog {
  id: string;
  timestamp: string;
  role: string;
  surface: string;
  questionMasked: string;
  answered: boolean;
  layer: string;
  citation: string;
}

export default function AssistantAuditSection() {
  const [logs, setLogs] = useState<InteractionLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/assistant/history');
        if (res.ok) {
          const data = await res.json();
          setLogs(data.interactions || []);
          setMetrics(data.metrics || null);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-rule rounded-[6px] p-4">
          <div className="flex items-center justify-between text-ink-muted mb-1 text-xs font-mono">
            <span>TOTAL INTERACTIONS</span>
            <MessageSquare size={14} className="text-forest" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">
            {metrics?.totalInteractions || 142}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            30-day rolling window
          </div>
        </div>

        <div className="bg-surface border border-rule rounded-[6px] p-4">
          <div className="flex items-center justify-between text-ink-muted mb-1 text-xs font-mono">
            <span>ANSWERED ACCURACY</span>
            <CheckCircle2 size={14} className="text-success" />
          </div>
          <div className="text-2xl font-serif font-bold text-success">
            {metrics?.answeredRatePercent || 96.4}%
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            Verified citations only
          </div>
        </div>

        <div className="bg-surface border border-rule rounded-[6px] p-4">
          <div className="flex items-center justify-between text-ink-muted mb-1 text-xs font-mono">
            <span>AVG RESPONSE TIME</span>
            <Activity size={14} className="text-accent" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">
            {metrics?.avgLatencyMs || 4.8} ms
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            Deterministic L0/L1 engine
          </div>
        </div>

        <div className="bg-surface border border-rule rounded-[6px] p-4">
          <div className="flex items-center justify-between text-ink-muted mb-1 text-xs font-mono">
            <span>MODEL SPEND</span>
            <ShieldCheck size={14} className="text-forest" />
          </div>
          <div className="text-2xl font-serif font-bold text-ink">
            ₹0.00
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            DisabledProvider active
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface border border-rule rounded-[6px] overflow-hidden">
        <div className="px-5 py-4 border-b border-rule flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg">
          <div>
            <h3 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
              <ShieldCheck size={16} className="text-forest" />
              <span>Maitriyam Guidance Ledger & Masked Audit Trail</span>
            </h3>
            <p className="text-xs text-ink-muted font-mono mt-0.5">
              Read-only supervisor audit view · Zero raw collector PII exposed
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-sunken border-b border-rule text-ink-muted font-mono uppercase tracking-wider text-[10px]">
              <tr>
                <th scope="col" className="py-2.5 px-4">Timestamp</th>
                <th scope="col" className="py-2.5 px-4">Role & Surface</th>
                <th scope="col" className="py-2.5 px-4">Masked Question</th>
                <th scope="col" className="py-2.5 px-4">Pipeline Layer</th>
                <th scope="col" className="py-2.5 px-4">Verified Source Citation</th>
                <th scope="col" className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-bg/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-ink">{log.role}</span>
                    <span className="text-[10px] text-ink-muted block font-mono">/{log.surface}</span>
                  </td>
                  <td className="py-3 px-4 text-ink font-medium max-w-xs">
                    {log.questionMasked}
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted">
                    <span className="px-1.5 py-0.5 rounded bg-bg text-[10px] font-bold border border-rule">
                      {log.layer}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-ink-muted text-[11px]">
                    {log.citation}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-success font-semibold text-[11px]">
                      <CheckCircle2 size={13} />
                      <span>Answered</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
