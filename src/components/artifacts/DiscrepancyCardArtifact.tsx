'use client';

import React from 'react';
import { StatusBadge } from '../ui/StatusBadge';
import { cn } from '../../lib/utils';

export interface DiscrepancyCardProps {
  collectionKg: number;
  receivedKg: number;
  productName?: string;
  configuredTolerancePercent?: number; // default 1.5
  supervisorNote?: string;
  onSupervisorNoteChange?: (note: string) => void;
  showSupervisorTextarea?: boolean;
  className?: string;
}

export const DiscrepancyCardArtifact: React.FC<DiscrepancyCardProps> = ({
  collectionKg,
  receivedKg,
  productName = 'Mahua · dried',
  configuredTolerancePercent = 1.5,
  supervisorNote = '',
  onSupervisorNoteChange,
  showSupervisorTextarea = true,
  className,
}) => {
  // Discrepancy computations
  const differenceKg = Number((collectionKg - receivedKg).toFixed(2));
  const acceptableLossKg = Number(
    ((collectionKg * configuredTolerancePercent) / 100).toFixed(2)
  );
  const excessLossKg = Number((differenceKg - acceptableLossKg).toFixed(2));
  const isWithinTolerance = excessLossKg <= 0;

  return (
    <div
      aria-label="Weighment variance analysis card"
      className={cn(
        'border border-rule rounded-[4px] bg-surface p-4 space-y-3.5 shadow-none',
        className
      )}
    >
      {/* Top Header: Badge State & Title */}
      <div className="flex items-center justify-between border-b border-rule pb-2.5">
        <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold">
          Weighment Variance Analysis
        </span>

        {/* Two badges per case: "Natural shrinkage" (success) or "Supervisor review required" (warning). */}
        {isWithinTolerance ? (
          <StatusBadge variant="success">Natural shrinkage</StatusBadge>
        ) : (
          <StatusBadge variant="warning">Supervisor review required</StatusBadge>
        )}
      </div>

      {/* Three Columns: "Recorded at collection" (100 kg), "Received at storage" (95 kg), "Difference" (5 kg, danger tabular) */}
      <div className="grid grid-cols-3 gap-2.5 border border-rule rounded-[2px] p-3 bg-bg-sunken/40 text-center">
        <div className="space-y-0.5">
          <span className="text-[11px] text-ink-muted uppercase block font-semibold">
            Recorded at collection
          </span>
          <div className="font-heading text-[22px] font-bold tabular-nums text-ink leading-tight">
            {collectionKg.toFixed(1)}{' '}
            <span className="text-[12px] font-sans font-normal text-ink-muted">kg</span>
          </div>
        </div>

        <div className="space-y-0.5 border-x border-rule px-1">
          <span className="text-[11px] text-ink-muted uppercase block font-semibold">
            Received at storage
          </span>
          <div className="font-heading text-[22px] font-bold tabular-nums text-ink leading-tight">
            {receivedKg.toFixed(1)}{' '}
            <span className="text-[12px] font-sans font-normal text-ink-muted">kg</span>
          </div>
        </div>

        <div className="space-y-0.5">
          <span className="text-[11px] text-ink-muted uppercase block font-semibold">
            Difference
          </span>
          {/* Difference in danger tabular */}
          <div className="font-heading text-[22px] font-bold tabular-nums text-danger leading-tight">
            {differenceKg > 0 ? `−${differenceKg.toFixed(1)}` : `${Math.abs(differenceKg).toFixed(1)}`}{' '}
            <span className="text-[12px] font-sans font-normal text-danger">kg</span>
          </div>
        </div>
      </div>

      {/* Small Panel with Tolerance and Acceptable vs Excess Loss */}
      <div className="p-3 border border-rule bg-bg-sunken/30 rounded-[2px] space-y-1.5 text-[12px] font-mono">
        <div className="flex justify-between items-baseline text-ink-muted">
          <span>Configured tolerance: {configuredTolerancePercent}% ({productName}) · placeholder value</span>
        </div>
        <div className="flex justify-between items-baseline pt-0.5 border-t border-rule/50">
          <span className="text-ink">
            Acceptable: <strong className="text-ink font-bold tabular-nums">{acceptableLossKg.toFixed(1)} kg</strong>. Excess: <strong className={cn('tabular-nums font-semibold', excessLossKg > 0 ? 'text-danger' : 'text-success')}>{excessLossKg > 0 ? `${excessLossKg.toFixed(1)} kg` : '0.0 kg'}</strong>.
          </span>
        </div>
      </div>

      {/* One line of plain language: "This is a flag, not a finding." */}
      <div className="p-2.5 border border-rule bg-surface rounded-[2px] text-[12px] text-ink-subtle">
        <p className="font-medium text-ink leading-snug">
          This is a flag, not a finding.
        </p>
        <p className="text-[11px] text-ink-muted mt-0.5 leading-normal">
          Forest produce naturally undergoes moisture evaporation during open-air transit across Similipal corridors.
        </p>
      </div>

      {/* Supervisor Note Textarea with 1px border and inline character count */}
      {showSupervisorTextarea && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="supervisor-note-input"
              className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-muted font-bold block select-none"
            >
              Supervisor Adjudication Note
            </label>
            <span className="text-[11px] font-mono text-ink-subtle tabular-nums">
              {supervisorNote.length} / 500 characters
            </span>
          </div>

          <textarea
            id="supervisor-note-input"
            rows={3}
            maxLength={500}
            value={supervisorNote}
            onChange={(e) => onSupervisorNoteChange?.(e.target.value)}
            placeholder="Document route conditions, inspection seal status, or drying equilibrium notes…"
            className="w-full rounded-[2px] border border-rule bg-surface p-2.5 text-[13px] text-ink leading-relaxed font-sans focus:border-accent focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
