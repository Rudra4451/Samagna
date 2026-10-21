import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[4px] border border-rule bg-surface p-8 text-center shadow-none select-none',
        className
      )}
      {...props}
    >
      {/* Small-caps label */}
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-1 block">
        {title}
      </span>
      {/* One-line 14px body */}
      <p className="text-[14px] text-ink max-w-md truncate mb-4 leading-normal">
        {description}
      </p>
      {/* One rectangular action */}
      {actionLabel && (
        <Button variant="secondary" size="sm" onClick={onAction} className="rounded-[4px] h-[36px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
