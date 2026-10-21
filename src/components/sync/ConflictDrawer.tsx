'use client';

import React, { useState, useEffect } from 'react';
import { SyncRecord } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from '../ui/Drawer';
import { Button } from '../ui/Button';
import { NumberInput, Textarea } from '../ui/Input';
import { SectionLabel } from '../ui/SectionLabel';
import { cn } from '../../lib/utils';
import {
  AlertTriangle,
  Server,
  Smartphone,
  GitCompare,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export interface ConflictDrawerProps {
  conflict: SyncRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeepLocal: (local_id: string) => Promise<void>;
  onKeepServer: (local_id: string) => Promise<void>;
  onMerge: (local_id: string, mergedPayload: any, supervisorNote: string) => Promise<void>;
}

export const ConflictDrawer: React.FC<ConflictDrawerProps> = ({
  conflict,
  open,
  onOpenChange,
  onKeepLocal,
  onKeepServer,
  onMerge,
}) => {
  const { activeRole } = useAppStore();
  const isSupervisor = activeRole === 'collection_manager' || activeRole === 'inventory_manager';

  // Editable local state
  const localPayload = conflict?.payload || {};
  const serverPayload = conflict?.server_payload || {};

  const [editGross, setEditGross] = useState<number>(localPayload.grossWeight || 104.2);
  const [editTare, setEditTare] = useState<number>(localPayload.tareWeight || 4.2);
  const [editGrade, setEditGrade] = useState<'A' | 'B' | 'C'>(localPayload.qualityGrade || 'A');
  const [supervisorNote, setSupervisorNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentForReview, setSentForReview] = useState(false);

  useEffect(() => {
    if (conflict) {
      setEditGross(conflict.payload?.grossWeight || 104.2);
      setEditTare(conflict.payload?.tareWeight || 4.2);
      setEditGrade(conflict.payload?.qualityGrade || 'A');
      setSupervisorNote('');
      setSentForReview(false);
    }
  }, [conflict]);

  if (!conflict) return null;

  const editNet = Number((editGross - editTare).toFixed(2));
  const serverNet = serverPayload.netWeight ?? 92.0;
  const deltaWeight = Number((editNet - serverNet).toFixed(2));

  const handleKeepLocal = async () => {
    setIsSubmitting(true);
    await onKeepLocal(conflict.local_id);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleKeepServer = async () => {
    setIsSubmitting(true);
    await onKeepServer(conflict.local_id);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleMerge = async () => {
    if (!supervisorNote.trim() || supervisorNote.length < 10) return;
    setIsSubmitting(true);
    const merged = {
      ...localPayload,
      grossWeight: editGross,
      tareWeight: editTare,
      netWeight: editNet,
      qualityGrade: editGrade,
    };
    await onMerge(conflict.local_id, merged, supervisorNote);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-2xl">
        <DrawerHeader className="border-b border-rule bg-bg-sunken px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <DrawerTitle className="text-[18px] font-heading font-semibold text-ink">
                  Sync Conflict Resolution · {conflict.batch_code}
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-[12px] font-mono text-ink-muted">
                ULID Local ID: {conflict.local_id} · Entity: {conflict.entity}
              </DrawerDescription>
            </div>
            <DrawerClose className="text-ink-subtle hover:text-ink text-[12px] font-mono">
              [Close]
            </DrawerClose>
          </div>
        </DrawerHeader>

        <DrawerBody className="p-6 space-y-6 text-[14px]">
          {/* Warning Banner */}
          <div className="border border-danger/60 bg-danger/5 rounded-[4px] p-3.5 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-danger text-[13px]">
              <ShieldAlert size={16} strokeWidth={1.5} />
              <span>Non-Auto-Merge Invariant: Data Divergence Detected</span>
            </div>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              Discrepancies in weight, quality grade, or payment reference cannot be auto-merged.
              A deliberate human adjudication is required to preserve ledger integrity.
            </p>
          </div>

          {/* 2-Column Comparison: Left (Local) vs Right (Server) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Local Record (Fields Editable) */}
            <div className="border-2 border-accent/40 rounded-[4px] p-4 bg-surface space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div className="flex items-center gap-1.5 text-accent font-bold text-[12px] uppercase tracking-[0.06em]">
                  <Smartphone size={16} strokeWidth={1.5} />
                  <span>Local Device Record</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-accent/30 text-accent rounded-[2px]">
                  EDITABLE
                </span>
              </div>

              <div className="space-y-2 text-[13px]">
                <div>
                  <label htmlFor="edit-gross-input" className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Gross Weight (kg)
                  </label>
                  <input
                    id="edit-gross-input"
                    type="number"
                    step="0.1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editGross}
                    onChange={(e) => setEditGross(Number(e.target.value) || 0)}
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface font-mono font-bold text-ink"
                  />
                </div>

                <div>
                  <label htmlFor="edit-tare-input" className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Tare Deduction (kg)
                  </label>
                  <input
                    id="edit-tare-input"
                    type="number"
                    step="0.1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editTare}
                    onChange={(e) => setEditTare(Number(e.target.value) || 0)}
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface font-mono font-bold text-ink"
                  />
                </div>

                <div className="pt-1 border-t border-rule flex justify-between items-baseline">
                  <span className="text-[11px] text-ink-muted uppercase font-semibold">Net Weight:</span>
                  <span className="font-heading text-[20px] font-bold text-ink tabular-nums">
                    {editNet.toFixed(2)} kg
                  </span>
                </div>

                <div>
                  <label htmlFor="edit-grade-select" className="text-[11px] font-semibold text-ink-muted uppercase block">
                    Quality Grade
                  </label>
                  <select
                    id="edit-grade-select"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as any)}
                    className="w-full h-[36px] px-2.5 rounded-[2px] border border-rule bg-surface text-ink text-[13px]"
                  >
                    <option value="A">Grade A (Certified Clean)</option>
                    <option value="B">Grade B (Standard Moisture)</option>
                    <option value="C">Grade C (Foreign Matter Flag)</option>
                  </select>
                </div>

                <div className="text-[11px] font-mono text-ink-subtle pt-1">
                  Recorded: {localPayload.updatedAt || 'Local Device Cache'}
                </div>
              </div>
            </div>

            {/* Right Column: Server Record (Read-Only) */}
            <div className="border border-rule rounded-[4px] p-4 bg-bg-sunken/40 space-y-3">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <div className="flex items-center gap-1.5 text-ink-muted font-bold text-[12px] uppercase tracking-[0.06em]">
                  <Server size={16} strokeWidth={1.5} />
                  <span>Central Server Record</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 border border-rule bg-surface text-ink-subtle rounded-[2px]">
                  <Lock size={11} strokeWidth={1.5} />
                  <span>READ-ONLY</span>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between py-1.5 border-b border-rule">
                  <span className="text-ink-muted">Gross Weight:</span>
                  <span className="font-mono tabular-nums text-ink">{serverPayload.grossWeight ?? 96.0} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-rule">
                  <span className="text-ink-muted">Tare Deduction:</span>
                  <span className="font-mono tabular-nums text-ink">{serverPayload.tareWeight ?? 4.0} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-rule font-bold">
                  <span className="text-ink">Net Weight:</span>
                  <span className="font-heading text-[20px] tabular-nums text-ink">
                    {serverNet.toFixed(2)} kg
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-rule">
                  <span className="text-ink-muted">Quality Grade:</span>
                  <span className="font-semibold text-ink">Grade {serverPayload.qualityGrade ?? 'B'}</span>
                </div>
                <div className="text-[11px] font-mono text-ink-subtle pt-1">
                  Recorded: {serverPayload.updatedAt || 'Central Warehouse Intake'}
                </div>
              </div>
            </div>
          </div>

          {/* Field-by-Field Diff Summary */}
          <div className="border border-rule rounded-[4px] p-3.5 bg-surface space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] font-bold text-ink">
              <GitCompare size={14} className="text-warning" />
              <span>Field-by-Field Divergence Diff</span>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-[12px] tabular-nums pt-1 border-t border-rule">
              <div>
                <span className="text-[10px] text-ink-muted block uppercase">Net Δ Variance</span>
                <span className={cn('font-bold', deltaWeight !== 0 ? 'text-danger' : 'text-success')}>
                  {deltaWeight > 0 ? `+${deltaWeight} kg` : `${deltaWeight} kg`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-muted block uppercase">Grade Match</span>
                <span className={cn('font-bold', editGrade !== serverPayload.qualityGrade ? 'text-warning' : 'text-success')}>
                  {editGrade === serverPayload.qualityGrade ? 'Matched (Identical)' : `Local: ${editGrade} / Svr: ${serverPayload.qualityGrade}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-ink-muted block uppercase">Payment Reference</span>
                <span className="text-ink-subtle font-mono truncate block">
                  {serverPayload.paymentRef || 'TXN-998-SIMULATED'}
                </span>
              </div>
            </div>
          </div>

          {/* Supervisor Adjudication Note Input */}
          <div className="space-y-1.5">
            <label htmlFor="conflict-supervisor-note" className="text-[11px] font-semibold uppercase text-ink-muted block select-none">
              Supervisor Adjudication Note (Mandatory for Merge Resolution)
            </label>
            <Textarea
              id="conflict-supervisor-note"
              rows={3}
              value={supervisorNote}
              onChange={(e) => setSupervisorNote(e.target.value)}
              placeholder="Explain tare calibration re-check, scale model, or ambient evaporation observations..."
              disabled={!isSupervisor}
            />
            {!isSupervisor && (
              <p className="text-[11px] text-warning font-mono">
                Only collection or inventory managers can merge with notes. Tribal collectors can send for supervisor review.
              </p>
            )}
          </div>
        </DrawerBody>

        {/* Action Buttons: Keep Local, Keep Server, Merge / Send for review */}
        <DrawerFooter className="flex-col gap-2 bg-bg-sunken border-t border-rule p-4">
          {sentForReview ? (
            <div className="w-full p-2.5 border border-success bg-success/10 rounded-[2px] text-center text-success font-semibold text-[13px]">
              ✓ Discrepancy case dispatched to District Welfare Officer for adjudication.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={handleKeepLocal}
                  className="flex-1 sm:flex-initial text-[13px]"
                >
                  Keep local
                </Button>
                <Button
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={handleKeepServer}
                  className="flex-1 sm:flex-initial text-[13px]"
                >
                  Keep server
                </Button>
              </div>

              {isSupervisor ? (
                <Button
                  variant="primary"
                  disabled={isSubmitting || supervisorNote.trim().length < 10}
                  onClick={handleMerge}
                  className="w-full sm:w-auto text-[13px] font-semibold"
                >
                  Merge with supervisor note
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={() => setSentForReview(true)}
                  className="w-full sm:w-auto text-[13px] font-semibold"
                >
                  Send for review
                </Button>
              )}
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
