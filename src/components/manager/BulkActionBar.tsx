'use client';

import React from 'react';
import { Button } from '../ui/Button';
import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  discrepancyCount: number;
  onApproveAll: () => void;
  onHoldAll: () => void;
  onClear: () => void;
  isPending?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  discrepancyCount,
  onApproveAll,
  onHoldAll,
  onClear,
  isPending = false,
}) => {
  if (selectedCount === 0) return null;

  const hasDiscrepancies = discrepancyCount > 0;

  return (
    <aside
      aria-label="Bulk selection action bar"
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'w-[92%] sm:w-auto min-w-[340px] max-w-xl',
        'border border-ink bg-surface text-ink p-3 rounded-[4px] shadow-none',
        'animate-in fade-in slide-in-from-bottom-4 duration-200'
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Count & Status Label */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[13px] font-bold tabular-nums text-ink">
            {selectedCount} selected
          </span>
          {hasDiscrepancies && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-danger font-semibold border-l border-rule pl-2">
              <ShieldAlert size={14} className="shrink-0" />
              <span>
                {discrepancyCount} {discrepancyCount === 1 ? 'row has' : 'rows have'} unresolved discrepancies
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons: Approve all · Hold all · Clear */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Bulk approve is blocked if any selected row has an unresolved discrepancy */}
          <div className="relative group">
            <Button
              variant="primary"
              size="sm"
              onClick={onApproveAll}
              disabled={hasDiscrepancies || isPending}
              className={cn(
                'h-[32px] px-3 text-[12px] font-semibold',
                hasDiscrepancies && 'opacity-40 cursor-not-allowed'
              )}
            >
              Approve all
            </Button>
            {hasDiscrepancies && (
              <div className="hidden group-hover:block absolute bottom-full mb-1 right-0 w-48 p-1.5 bg-bg-sunken border border-rule text-[10px] font-mono text-danger rounded-[2px] z-50">
                Resolve discrepancies before bulk approving.
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={onHoldAll}
            disabled={isPending}
            className="h-[32px] px-3 text-[12px]"
          >
            Hold all
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-[32px] px-2 text-[12px] text-ink-muted hover:text-ink"
            aria-label="Clear selection"
          >
            Clear
          </Button>
        </div>
      </div>
    </aside>
  );
};
