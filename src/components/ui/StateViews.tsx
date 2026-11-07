'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Loader2, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';

export interface LoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
  compact?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading records...',
  message = 'Fetching authenticated state from ledger',
  className,
  compact = false,
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-rule bg-surface p-8 text-center shadow-none select-none',
        compact && 'p-4 border-dashed',
        className
      )}
    >
      <Loader2
        size={compact ? 20 : 28}
        className="animate-spin text-accent mb-3"
        aria-hidden="true"
      />
      <h3 className="font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
        {title}
      </h3>
      {message && (
        <p className="text-[12px] text-ink-muted mt-1 max-w-sm font-sans">
          {message}
        </p>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
  details?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operation Error',
  message,
  retryLabel = 'Retry Request',
  onRetry,
  className,
  details,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-danger/40 bg-danger/5 p-6 text-center shadow-none select-none',
        className
      )}
    >
      <AlertTriangle size={28} className="text-danger mb-2.5" aria-hidden="true" />
      <h3 className="font-mono text-[12px] font-bold uppercase tracking-[0.06em] text-danger">
        {title}
      </h3>
      <p className="text-[13px] text-ink max-w-md mt-1 leading-relaxed">
        {message}
      </p>
      {details && (
        <pre className="mt-2 text-[11px] font-mono text-ink-muted bg-surface/80 border border-rule p-2 rounded max-w-md overflow-x-auto text-left">
          {details}
        </pre>
      )}
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="mt-4 rounded-[4px] border border-danger/50 text-danger hover:bg-danger/10"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export interface SuccessStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) => {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-success/40 bg-success/5 p-8 text-center shadow-none select-none',
        className
      )}
    >
      <CheckCircle2 size={32} className="text-success mb-2.5" aria-hidden="true" />
      <h3 className="font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-success">
        {title}
      </h3>
      <p className="text-[13px] text-ink max-w-md mt-1 leading-relaxed">
        {message}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
        {actionLabel && onAction && (
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            className="rounded-[4px]"
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSecondaryAction}
            className="rounded-[4px]"
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export interface EmptyStateViewProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-rule bg-surface p-8 text-center shadow-none select-none',
        className
      )}
    >
      <div className="text-ink-muted mb-2">
        {icon || <Inbox size={28} className="opacity-60" />}
      </div>
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-1 block">
        {title}
      </span>
      <p className="text-[13px] text-ink max-w-md mb-4 leading-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="rounded-[4px] h-[36px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
