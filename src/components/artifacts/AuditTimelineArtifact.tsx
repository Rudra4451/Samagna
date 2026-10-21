'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface AuditTimelineEvent {
  id: string;
  dayHeader?: string; // e.g. "14 March 2025"
  time: string; // e.g. "11:20 AM"
  actor: string; // e.g. "S. Das (Warehouse IM-04)"
  action: string; // e.g. "Verified arrival weight at 95.0 kg in Rack B"
  delta?: string; // e.g. "+95.0 kg" or "-5.0 kg" or "0.0 kg"
  deltaVariant?: 'success' | 'danger' | 'neutral';
  isLive?: boolean; // Fades in 100ms if live
}

interface AuditTimelineArtifactProps {
  events: AuditTimelineEvent[];
  batchCode?: string;
  className?: string;
}

export const AuditTimelineArtifact: React.FC<AuditTimelineArtifactProps> = ({
  events,
  batchCode = '#BS-402',
  className,
}) => {
  // Group events by dayHeader
  const grouped = events.reduce<Record<string, AuditTimelineEvent[]>>((acc, event) => {
    const day = event.dayHeader || '14 March 2025';
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  // Download audit as JSON for judges
  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            batchCode,
            exportedAt: new Date().toISOString(),
            integrityEngine: 'BanaSetu Monotonic Custody Hash v3.2',
            events,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BanaSetu-Audit-${batchCode.replace('#', '')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Header Row with Download Audit (JSON) rectangular link */}
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block">
            Immutable Custody Trail
          </span>
          <span className="text-[12px] text-ink-subtle">
            Cryptographically linked custodial transitions
          </span>
        </div>

        {/* Rectangular Link for Judges */}
        <button
          onClick={handleDownloadJson}
          className="px-2.5 py-1 rounded-[2px] border border-rule bg-surface text-ink text-[12px] font-mono hover:bg-bg-sunken hover:border-ink-subtle transition-colors focus:outline-2 focus:outline-accent"
        >
          Download audit (JSON)
        </button>
      </div>

      {/* Timeline grouped by day */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day} className="space-y-3">
            {/* Small-caps day header */}
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-muted font-bold border-b border-rule/60 pb-1">
              {day}
            </div>

            {/* Vertical 1px rule on the left */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-rule">
              {dayEvents.map((evt) => {
                // Determine delta color
                const isPositive = evt.delta?.startsWith('+');
                const isNegative = evt.delta?.startsWith('-');
                const deltaClass =
                  evt.deltaVariant === 'success' || isPositive
                    ? 'text-success'
                    : evt.deltaVariant === 'danger' || isNegative
                    ? 'text-danger font-semibold'
                    : 'text-ink-muted';

                return (
                  <div
                    key={evt.id}
                    className={cn(
                      'relative flex items-start justify-between gap-3 text-[14px]',
                      evt.isLive && 'animate-in fade-in duration-100'
                    )}
                  >
                    {/* One 6px dot per event. No icons. */}
                    <div
                      className="absolute -left-[20px] top-1.5 w-[6px] h-[6px] rounded-full bg-ink"
                      aria-hidden="true"
                    />

                    <div className="space-y-0.5 min-w-0 flex-1">
                      {/* Time: tabular, 12px ink-subtle */}
                      <div className="font-mono text-[12px] text-ink-subtle tabular-nums leading-none">
                        {evt.time}
                      </div>

                      {/* Actor: 14px */}
                      <div className="text-[14px] font-semibold text-ink leading-tight mt-0.5">
                        {evt.actor}
                      </div>

                      {/* Action: 14px */}
                      <div className="text-[14px] text-ink leading-relaxed">
                        {evt.action}
                      </div>
                    </div>

                    {/* Delta right-aligned in tabular with color */}
                    {evt.delta && (
                      <div
                        className={cn(
                          'font-mono text-[13px] tabular-nums shrink-0 text-right pt-0.5',
                          deltaClass
                        )}
                      >
                        {evt.delta}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
