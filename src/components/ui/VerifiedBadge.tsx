'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'default';
}

/**
 * Prompt Requirement 5:
 * The "Verified" badge. One badge style used everywhere stock becomes saleable:
 * 1px success border, 8% success tint, success text, 11px uppercase "Verified".
 * It appears on the batch row, drawer header, and stock tile simultaneously when approval happens.
 * Do not use checkmarks alone — the word matters.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className,
  size = 'default',
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-mono font-bold uppercase tracking-[0.08em] select-none rounded-[2px]',
        'border border-success bg-success/8 text-success',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className
      )}
    >
      Verified
    </span>
  );
};
