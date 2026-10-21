import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface HonestyBadgeProps {
  label?: string;
  variant?: 'subtle' | 'inline' | 'banner';
  className?: string;
}

export function HonestyBadge({
  label = 'Simulated for Prototype / Pending Field Validation',
  variant = 'subtle',
  className = '',
}: HonestyBadgeProps) {
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 bg-bg-sunken border border-rule text-ink text-[12px] rounded-[4px] shadow-none',
          className
        )}
      >
        <ShieldAlert size={16} strokeWidth={1.5} className="text-warning shrink-0" />
        <span>
          <strong className="font-semibold uppercase tracking-[0.06em] text-[11px] text-warning mr-1.5 font-mono">
            Safeguard Protocol:
          </strong>
          {label}
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        title={label}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-sunken border border-rule text-ink-muted text-[11px] font-mono uppercase tracking-[0.04em] rounded-full',
          className
        )}
      >
        <Info size={16} strokeWidth={1.5} className="text-ink-subtle shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 bg-surface border border-rule text-ink-muted text-[12px] font-mono rounded-[4px] shadow-none',
        className
      )}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
