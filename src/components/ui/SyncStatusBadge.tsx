import * as React from 'react';
import { SyncState } from '../../lib/db';
import { cn } from '../../lib/utils';

export interface SyncStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: SyncState;
  syncedTime?: string;
  className?: string;
}

/**
 * 1px-bordered sync status badges per INTERACTION & OFFLINE Rules:
 * - draft: ink-subtle outline, label "Draft"
 * - queued: warning outline, label "Queued to sync"
 * - syncing: warning outline, label "Syncing" with 1px-animated left border
 * - synced: success outline, label "Synced · HH:MM"
 * - conflict: danger outline, label "Needs review"
 * - failed: danger outline, label "Sync failed · retry"
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
          label: 'Draft',
          classes: 'border-ink-subtle/50 text-ink-muted bg-surface',
        };
      case 'queued':
        return {
          label: 'Queued to sync',
          classes: 'border-warning/70 text-warning bg-warning/5',
        };
      case 'syncing':
        return {
          label: 'Syncing',
          classes:
            'border-warning/60 text-warning bg-warning/10 border-l-2 border-l-warning animate-pulse',
        };
      case 'synced':
        return {
          label: syncedTime ? `Synced · ${syncedTime}` : 'Synced',
          classes: 'border-success/60 text-success bg-success/5',
        };
      case 'conflict':
        return {
          label: 'Needs review',
          classes: 'border-danger/70 text-danger bg-danger/5 font-semibold',
        };
      case 'failed':
        return {
          label: 'Sync failed · retry',
          classes: 'border-danger/70 text-danger bg-danger/5 font-semibold',
        };
      default:
        return {
          label: 'Draft',
          classes: 'border-ink-subtle text-ink-muted bg-surface',
        };
    }
  };

  const { label, classes } = getBadgeContent();

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border rounded-[3px] px-2 py-0.5',
        'text-[11px] font-mono leading-none select-none tracking-tight whitespace-nowrap',
        classes,
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
};
