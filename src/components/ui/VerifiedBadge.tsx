'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'default';
}

/**
 * Prompt Requirement 5 & Prompt 12:
 * - 1px border, 2px left border in success colour.
 * - 8% success tint, success text, 11px uppercase "Verified".
 * - Preceding shape symbol ● for non-color identification.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className,
  size = 'default',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-bold uppercase tracking-[0.08em] select-none rounded-[2px]',
        'border border-success/40 border-l-2 border-l-success bg-success/8 text-success',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className
      )}
    >
      <span className="text-[9px] leading-none shrink-0" aria-hidden="true">
        ●
      </span>
      <span>Verified</span>
    </span>
  );
};
