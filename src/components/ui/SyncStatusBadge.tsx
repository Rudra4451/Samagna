import * as React from 'react';
import { SyncState } from '../../lib/db';
import { cn } from '../../lib/utils';

export interface SyncStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: SyncState;
  syncedTime?: string;
  className?: string;
}

/**
 * 2px left border sync status badges per Prompt 12 Colour Independence & Accessibility:
 * - draft: ink-subtle outline, label "Draft", symbol ○
 * - queued: warning outline, label "Queued to sync", symbol ◆
 * - syncing: warning outline, label "Syncing", symbol ↻
 * - synced: success outline, label "Synced · HH:MM", symbol ●
 * - conflict: danger outline, label "Needs review", symbol ▲
 * - failed: danger outline, label "Sync failed · retry", symbol ▲
 * - Announces state changes politely without re-reading the entire table row.
 */
export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  state,
  syncedTime,
  className,
  ...props
}) => {
  const getBadgeContent = () => {
    switch (state) {
      case 'draft':
        return {
          symbol: '○',
          label: 'Draft',
          classes: 'border-rule border-l-2 border-l-ink-muted text-ink-muted bg-surface',
        };
      case 'queued':
        return {
          symbol: '◆',
          label: 'Queued to sync',
          classes: 'border-warning/40 border-l-2 border-l-warning text-warning bg-warning/8',
        };
      case 'syncing':
        return {
          symbol: '↻',
          label: 'Syncing',
          classes:
            'border-warning/40 border-l-2 border-l-warning text-warning bg-warning/10 animate-pulse',
        };
      case 'synced':
        return {
          symbol: '●',
          label: syncedTime ? `Synced · ${syncedTime}` : 'Synced',
          classes: 'border-success/40 border-l-2 border-l-success text-success bg-success/8',
        };
      case 'conflict':
        return {
          symbol: '▲',
          label: 'Needs review',
          classes: 'border-danger/40 border-l-2 border-l-danger text-danger bg-danger/8 font-semibold',
        };
      case 'failed':
        return {
          symbol: '▲',
          label: 'Sync failed · retry',
          classes: 'border-danger/40 border-l-2 border-l-danger text-danger bg-danger/8 font-semibold',
        };
      default:
        return {
          symbol: '○',
          label: 'Draft',
          classes: 'border-rule border-l-2 border-l-ink-muted text-ink-muted bg-surface',
        };
    }
  };

  const { symbol, label, classes } = getBadgeContent();

  return (
    <span
      role="status"
      aria-label={`Sync state: ${label}`}
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-[2px] px-2 py-0.5',
        'text-[11px] font-mono leading-none select-none tracking-tight whitespace-nowrap',
        classes,
        className
      )}
      {...props}
    >
      {/* Screen reader only announces the state change, not the entire row */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {label}
      </span>
      <span className="text-[9px] leading-none shrink-0" aria-hidden="true">
        {symbol}
      </span>
      <span aria-hidden="true">{label}</span>
    </span>
  );
};
