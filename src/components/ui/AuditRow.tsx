import * as React from 'react';
import { cn } from '../../lib/utils';
import { StatusBadge, type StatusVariant } from './StatusBadge';

export interface AuditRowProps extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
  actor: {
    name: string;
    role?: string;
    id?: string;
  };
  action: string;
  description?: string;
  delta?: {
    value: string;
    variant?: StatusVariant;
  };
  status?: {
    label: string;
    variant?: StatusVariant;
  };
}

export const AuditRow: React.FC<AuditRowProps> = ({
  timestamp,
  actor,
  action,
  description,
  delta,
  status,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-rule bg-surface text-[14px]',
        'hover:bg-bg/40 transition-colors px-3',
        className
      )}
      {...props}
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        {/* Tabular Timestamp */}
        <div className="shrink-0 w-36 text-[12px] tabular-nums font-mono text-ink-muted">
          {timestamp}
        </div>

        {/* Action & Actor */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-ink leading-tight">{action}</span>
            <span className="text-[12px] text-ink-muted">
              by <strong className="font-medium text-ink">{actor.name}</strong>
              {actor.id && <span className="tabular-nums font-mono ml-1">({actor.id})</span>}
            </span>
          </div>
          {description && (
            <p className="text-[12px] text-ink-muted mt-0.5 leading-snug line-clamp-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Delta & Status */}
      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
        {delta && (
          <span
            className={cn(
              'font-mono tabular-nums text-[13px] font-medium px-1.5 py-0.5 border border-rule bg-bg-sunken rounded-[2px]',
              delta.variant === 'danger' && 'text-danger border-danger/40',
              delta.variant === 'success' && 'text-success border-success/40',
              delta.variant === 'warning' && 'text-warning border-warning/40'
            )}
          >
            {delta.value}
          </span>
        )}
        {status && (
          <StatusBadge variant={status.variant || 'neutral'}>
            {status.label}
          </StatusBadge>
        )}
      </div>
    </div>
  );
};
