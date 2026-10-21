import * as React from 'react';
import { cn } from '../../lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
}

/**
 * Prompt 12 Colour Independence Specification:
 * - A 2px left border in the status colour.
 * - A short shape/symbol preceding the label:
 *   ● for success / available
 *   ◆ for warning / pending / in-review
 *   ▲ for danger / discrepancy / quarantined
 *   ■ for info / collected
 *   ○ for neutral / forecast / simulated
 *   ★ for accent
 * Does not rely on colour alone.
 */
const variantConfig: Record<StatusVariant, { symbol: string; classes: string }> = {
  success: {
    symbol: '●',
    classes: 'border-success/40 border-l-2 border-l-success bg-success/8 text-success',
  },
  warning: {
    symbol: '◆',
    classes: 'border-warning/40 border-l-2 border-l-warning bg-warning/8 text-warning',
  },
  danger: {
    symbol: '▲',
    classes: 'border-danger/40 border-l-2 border-l-danger bg-danger/8 text-danger',
  },
  info: {
    symbol: '■',
    classes: 'border-info/40 border-l-2 border-l-info bg-info/8 text-info',
  },
  neutral: {
    symbol: '○',
    classes: 'border-rule border-l-2 border-l-ink-muted bg-bg-sunken text-ink-muted',
  },
  accent: {
    symbol: '★',
    classes: 'border-accent/40 border-l-2 border-l-accent bg-accent/8 text-accent',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  className,
  children,
  ...props
}) => {
  const config = variantConfig[variant] || variantConfig.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-mono font-semibold uppercase tracking-[0.04em] whitespace-nowrap select-none leading-none motion-badge-crossfade',
        config.classes,
        className
      )}
      {...props}
    >
      <span className="text-[9px] leading-none shrink-0" aria-hidden="true">
        {config.symbol}
      </span>
      <span>{children}</span>
    </span>
  );
};
