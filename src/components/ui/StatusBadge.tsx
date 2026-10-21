import * as React from 'react';
import { cn } from '../../lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'border-success bg-success/10 text-success',
  warning: 'border-warning bg-warning/10 text-warning',
  danger: 'border-danger bg-danger/10 text-danger',
  info: 'border-info bg-info/10 text-info',
  neutral: 'border-ink-muted bg-bg-sunken text-ink-muted',
  accent: 'border-accent bg-accent/10 text-accent',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2 py-0.5 rounded-full border text-[11px] font-medium uppercase tracking-[0.04em] whitespace-nowrap select-none leading-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
