'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  RoleType,
  BatchRecord,
  AuditEvent,
  DiscrepancyCase,
  WarehouseLedgerCounters,
  Step1FieldVerification,
} from '../lib/types';
import { getDatabase, seedInitialData } from '../lib/db';
import {
  INITIAL_BATCH_BS402,
  INITIAL_AUDIT_TRAIL,
  INITIAL_DISCREPANCY_CASE,
  INITIAL_LEDGER_COUNTERS,
} from '../lib/seed';

interface BanaSetuContextType {
  isMounted: boolean;
  activeRole: RoleType;
  setActiveRole: (role: RoleType) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  queuedSyncCount: number;
  batch: BatchRecord | null;
  auditEvents: AuditEvent[];
  discrepancyCase: DiscrepancyCase | null;
  counters: WarehouseLedgerCounters;
  toast: string | null;
  showToast: (msg: string) => void;
  updateStep1: (
    updates: Partial<Step1FieldVerification>,
    simulateOfflineSubmission?: boolean
  ) => Promise<void>;
  updateStep2: (
    arrivalNetKg: number,
    storageZone: string,
    shrinkagePercent: number
  ) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  resetDemoData: () => Promise<void>;
  resolveDiscrepancyCase: (resolutionNote: string) => Promise<void>;
}

const BanaSetuContext = createContext<BanaSetuContextType | undefined>(undefined);

export function BanaSetuProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeRole, setActiveRoleState] = useState<RoleType>('COLLECTOR_SHG');
  const [isOffline, setIsOfflineState] = useState<boolean>(false);
  const [queuedSyncCount, setQueuedSyncCount] = useState<number>(0);
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [discrepancyCase, setDiscrepancyCase] = useState<DiscrepancyCase | null>(null);
  const [counters, setCounters] = useState<WarehouseLedgerCounters>(INITIAL_LEDGER_COUNTERS);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  // Reload all states from Dexie
  const refreshFromDB = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDatabase();
      const b = await db.batches.get('BS-402');
      if (b) setBatch(b);

      const auds = await db.auditEvents.toArray();
      // sort chronologically descending for display or maintain ordered
      setAuditEvents(auds);

      const disc = await db.discrepancyCases.get('DISC-402');
      if (disc) setDiscrepancyCase(disc);
      else setDiscrepancyCase(null);

      const offSetting = await db.appSettings.get('isOffline');
      if (offSetting) setIsOfflineState(offSetting.value);

      const roleSetting = await db.appSettings.get('activeRole');
      if (roleSetting) setActiveRoleState(roleSetting.value);

      const qSetting = await db.appSettings.get('queuedSyncCount');
      if (qSetting) setQueuedSyncCount(qSetting.value);

      const cSetting = await db.appSettings.get('counters');
      if (cSetting) setCounters(cSetting.value);
    } catch (err) {
      console.error('Failed to load from Dexie:', err);
    }
  }, []);

  // Initialize once on client mount
  useEffect(() => {
    setIsMounted(true);
    async function init() {
      await seedInitialData(false);
      await refreshFromDB();
    }
    init();
  }, [refreshFromDB]);

  // Role switcher with Dexie sync
  const setActiveRole = async (role: RoleType) => {
    setActiveRoleState(role);
    try {
      const db = getDatabase();
      await db.appSettings.put({ key: 'activeRole', value: role });
    } catch (e) {
      console.error(e);
    }
  };

  // Offline toggle with Dexie sync
  const setIsOffline = async (offline: boolean) => {
    setIsOfflineState(offline);
    try {
      const db = getDatabase();
      await db.appSettings.put({ key: 'isOffline', value: offline });
      showToast(
        offline
          ? 'Network set to OFFLINE: Submissions will queue locally in IndexedDB'
          : 'Network set to ONLINE: Cloud handshake active'
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Update Step 1 (Field Manager verification)
  const updateStep1 = async (
    updates: Partial<Step1FieldVerification>,
    simulateOfflineSubmission?: boolean
  ) => {
    if (!batch) return;
    const db = getDatabase();
    const effectiveOffline = simulateOfflineSubmission ?? isOffline;

    const net = Number(
      (
        (updates.grossWeightKg ?? batch.step1.grossWeightKg) -
        (updates.tareWeightKg ?? batch.step1.tareWeightKg)
      ).toFixed(2)
    );

    const localRecId =
      batch.step1.localRecordId ||
      `LOC-REC-${Math.floor(1000 + Math.random() * 9000)}-BS402`;

    const newStep1: Step1FieldVerification = {
      ...batch.step1,
      ...updates,
      netAcceptedKg: net,
      localRecordId: localRecId,
      verifiedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    };

    const newStatus = effectiveOffline
      ? 'SAVED_OFFLINE_PENDING_SYNC'
      : 'PENDING_VERIFICATION';

    const updatedBatch: BatchRecord = {
      ...batch,
      status: newStatus,
      step1: newStep1,
      updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const newEvent: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      actorId: 'CM-12',
      actorName: 'R. Mohanty',
      actorRole: 'Field Collection Manager',
      actionType: effectiveOffline ? 'OFFLINE_SAVED' : 'FIELD_WEIGH_COMPLETED',
      title: effectiveOffline
        ? `Step 1 Saved Offline [Local ID: ${localRecId}]`
        : `Step 1 Verified: ${net} kg Net Accepted (#BS-402)`,
      description: effectiveOffline
        ? `Field record queued in local device storage. Awaiting network sync to Baripada central server.`
        : `Gross: ${newStep1.grossWeightKg} kg, Tare: ${newStep1.tareWeightKg} kg, Net: ${net} kg. Grade: ${newStep1.grade}. Vehicle: ${newStep1.vehicleNumber}.`,
      details: {
        gross: newStep1.grossWeightKg,
        tare: newStep1.tareWeightKg,
        netAccepted: net,
        grade: newStep1.grade,
        sealTagId: newStep1.sealTagId,
        vehicleNumber: newStep1.vehicleNumber,
        tarpaulinChecked: newStep1.tarpaulinConfirmed,
        localRecordId: localRecId,
      },
      evidencePhotoPlaceholder: '[Digital Photo Seal: Sack_Weigh_Scale.jpg]',
      evidenceLabel: 'Electronic Scale & Stencil #BS-402 record',
      syncId: effectiveOffline ? undefined : localRecId,
    };

    const newQueuedCount = effectiveOffline ? queuedSyncCount + 1 : queuedSyncCount;

    // Recalculate counters
    const newCounters: WarehouseLedgerCounters = {
      ...counters,
      inTransitPendingVerificationKg: effectiveOffline ? 0 : net,
    };

    await db.batches.put(updatedBatch);
    await db.auditEvents.put(newEvent);
    await db.appSettings.put({ key: 'queuedSyncCount', value: newQueuedCount });
    await db.appSettings.put({ key: 'counters', value: newCounters });

    setBatch(updatedBatch);
    setAuditEvents((prev) => [...prev, newEvent]);
    setQueuedSyncCount(newQueuedCount);
    setCounters(newCounters);

    showToast(
      effectiveOffline
        ? `Saved offline to device ledger (ID: ${localRecId}). Queue count: ${newQueuedCount}`
        : `Step 1 verified successfully! Dispatched 100.0 kg to Baripada Depôt.`
    );
  };

  // Sync Offline Queue
  const syncOfflineQueue = async () => {
    if (!batch) return;
    const db = getDatabase();

    const localRecId = batch.step1.localRecordId || 'LOC-REC-8921-BS402';
    const cloudSyncId = `CLOUD-TX-${Math.floor(5000 + Math.random() * 4000)}`;

    const updatedBatch: BatchRecord = {
      ...batch,
      status: 'PENDING_VERIFICATION',
      updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const syncEvent: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      actorId: 'CM-12',
      actorName: 'R. Mohanty',
      actorRole: 'Field Collection Manager',
      actionType: 'OFFLINE_SYNCED',
      title: `Offline Record Synced to Central Cloud (${cloudSyncId})`,
      description: `Handshake verified. Local batch ${localRecId} promoted to PENDING_VERIFICATION for Warehouse Depôt #02.`,
      details: {
        localId: localRecId,
        cloudSyncId: cloudSyncId,
        netWeightKg: batch.step1.netAcceptedKg,
        checksum: 'SHA256:7a9f...e01d (Verified)',
      },
      syncId: `${localRecId} -> ${cloudSyncId}`,
    };

    const newCounters: WarehouseLedgerCounters = {
      ...counters,
      inTransitPendingVerificationKg: batch.step1.netAcceptedKg,
    };

    await db.batches.put(updatedBatch);
    await db.auditEvents.put(syncEvent);
    await db.appSettings.put({ key: 'queuedSyncCount', value: 0 });
    await db.appSettings.put({ key: 'counters', value: newCounters });

    setBatch(updatedBatch);
    setAuditEvents((prev) => [...prev, syncEvent]);
    setQueuedSyncCount(0);
    setCounters(newCounters);

    showToast(`Synced ${localRecId} to Cloud Ledger (${cloudSyncId}) successfully.`);
  };

  // Update Step 2 (Warehouse Re-weigh & Discrepancy Engine)
  const updateStep2 = async (
    arrivalNetKg: number,
    storageZone: string,
    shrinkagePercent: number
  ) => {
    if (!batch) return;
    const db = getDatabase();

    // Step 1 stays intact
    const villageDispatchedNet = batch.step1.netAcceptedKg; // e.g. 100.0 kg
    const allowedShrinkageKg = Number(
      ((villageDispatchedNet * shrinkagePercent) / 100).toFixed(2)
    ); // e.g. 2.0 kg
    const expectedArrivalAfterShrinkage = Number(
      (villageDispatchedNet - allowedShrinkageKg).toFixed(2)
    ); // 98.0 kg

    // Unexplained variance: arrivalNet - expectedArrivalAfterShrinkage
    // If arrivalNet = 95.0, 95.0 - 98.0 = -3.0 kg
    const unexplainedVariance = Number(
      (arrivalNetKg - expectedArrivalAfterShrinkage).toFixed(2)
    );

    const isDiscrepancy = unexplainedVariance < 0;
    const caseId = isDiscrepancy ? 'DISC-402' : undefined;

    const newStep2 = {
      arrivalGrossWeightKg: arrivalNetKg + 1.5,
      arrivalTareWeightKg: 1.5,
      arrivalNetWeightKg: arrivalNetKg,
      storageZone: storageZone,
      shrinkagePercentAllowed: shrinkagePercent,
      shrinkageKgAllowed: allowedShrinkageKg,
      unexplainedVarianceKg: unexplainedVariance,
      discrepancyTriggered: isDiscrepancy,
      supervisorCaseId: caseId,
      verifiedBy: 'S. Das (ID: IM-04)',
      verifiedByRole: 'Warehouse Inventory Manager',
      verifiedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      notes: isDiscrepancy
        ? `Arrival net ${arrivalNetKg} kg vs village dispatch ${villageDispatchedNet} kg. Allowed natural transit moisture shrinkage: ${allowedShrinkageKg} kg (${shrinkagePercent}%). Unexplained variance: ${unexplainedVariance} kg. Stock quarantined.`
        : `Arrival net ${arrivalNetKg} kg conforms within allowable tolerance. Approved for saleable stock in ${storageZone}.`,
    };

    const newStatus: typeof batch.status = isDiscrepancy
      ? 'QUARANTINED_DISCREPANCY'
      : 'VERIFIED_SALEABLE';

    const updatedBatch: BatchRecord = {
      ...batch,
      status: newStatus,
      step2: newStep2,
      updatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    };

    const timestampStr =
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    const reweighEvent: AuditEvent = {
      id: `AUD-${Date.now()}-1`,
      timestamp: timestampStr,
      actorId: 'IM-04',
      actorName: 'S. Das',
      actorRole: 'Warehouse Inventory Manager',
      actionType: 'WAREHOUSE_REWEIGH_COMPLETED',
      title: `Arrival Re-Weigh Completed: ${arrivalNetKg} kg Net`,
      description: `Arrival re-weigh conducted at Baripada Depôt. Dispatched: ${villageDispatchedNet} kg | Arrived: ${arrivalNetKg} kg. Storage: ${storageZone}.`,
      details: {
        villageDispatchedNet: `${villageDispatchedNet} kg`,
        arrivalNet: `${arrivalNetKg} kg`,
        grossWeight: `${newStep2.arrivalGrossWeightKg} kg`,
        tareWeight: `${newStep2.arrivalTareWeightKg} kg`,
        storageZone,
      },
      evidencePhotoPlaceholder: '[Digital Photo Seal: Platform_Scale_Readout.jpg]',
      evidenceLabel: 'Baripada Central Depôt electronic scale tare & gross readout',
    };

    const shrinkageEvent: AuditEvent = {
      id: `AUD-${Date.now()}-2`,
      timestamp: timestampStr,
      actorId: 'SYSTEM',
      actorName: 'BanaSetu Shrinkage Engine',
      actorRole: 'Automated Discrepancy Protocol',
      actionType: 'SHRINKAGE_APPLIED',
      title: `Moisture Shrinkage Calculated: ${shrinkagePercent}% (-${allowedShrinkageKg} kg)`,
      description: `Formula: Expected Net = ${villageDispatchedNet} kg - (${shrinkagePercent}% = ${allowedShrinkageKg} kg) = ${expectedArrivalAfterShrinkage} kg. Variance: ${unexplainedVariance} kg.`,
      details: {
        allowancePercent: `${shrinkagePercent}%`,
        shrinkageKg: `${allowedShrinkageKg} kg`,
        unexplainedVarianceKg: `${unexplainedVariance} kg`,
      },
      isSimulatedBadge: 'Provisional threshold, requires local validation',
    };

    const newAuditList = [reweighEvent, shrinkageEvent];

    let newCase: DiscrepancyCase | null = null;
    let newCounters: WarehouseLedgerCounters;

    if (isDiscrepancy) {
      newCase = {
        id: 'DISC-402',
        batchId: 'BS-402',
        dispatchedNetKg: villageDispatchedNet,
        arrivalNetKg: arrivalNetKg,
        shrinkageAllowedKg: allowedShrinkageKg,
        unexplainedVarianceKg: unexplainedVariance,
        status: 'OPEN_QUARANTINED',
        currentActionTaken: `Quarantine tag placed on lot; Disputed ${Math.abs(
          unexplainedVariance
        )} kg withheld from saleable ledger. Non-accusatory supervisor case opened.`,
        assignedSupervisor: 'A. K. Patnaik, District Procurement Officer (Mayurbhanj TDCCOL)',
        createdAt: timestampStr,
        notes: `Mahua flowers in transit from Karanjia to Baripada. Unexplained deficit of ${Math.abs(
          unexplainedVariance
        )} kg exceeds ${shrinkagePercent}% moisture tolerance threshold.`,
      };

      const quarantineEvent: AuditEvent = {
        id: `AUD-${Date.now()}-3`,
        timestamp: timestampStr,
        actorId: 'SYSTEM',
        actorName: 'BanaSetu Quarantine Controller',
        actorRole: 'Automated Integrity Guard',
        actionType: 'DISCREPANCY_QUARANTINED',
        title: `Supervisor Review Case #DISC-402 Opened (Quarantined)`,
        description: `Unexplained variance of ${unexplainedVariance} kg logged. Stock segregated in Quarantine Bay. Tribal facilitator payout remains 100% shielded under LABHA safeguard rules.`,
        details: {
          caseId: 'DISC-402',
          quarantinedNetKg: arrivalNetKg,
          unexplainedKg: unexplainedVariance,
          protectionRule: 'LABHA Section 4(b): No unilateral deductions from primary collectors.',
        },
      };
      newAuditList.push(quarantineEvent);

      newCounters = {
        expectedSeasonalForecastKg: 500,
        inTransitPendingVerificationKg: 0,
        verifiedSaleableStockKg: 1200,
        quarantinedDiscrepancyKg: arrivalNetKg,
      };

      await db.discrepancyCases.put(newCase);
    } else {
      newCounters = {
        expectedSeasonalForecastKg: 500,
        inTransitPendingVerificationKg: 0,
        verifiedSaleableStockKg: 1200 + arrivalNetKg,
        quarantinedDiscrepancyKg: 0,
      };
      await db.discrepancyCases.delete('DISC-402');
    }

    await db.batches.put(updatedBatch);
    await db.auditEvents.bulkPut(newAuditList);
    await db.appSettings.put({ key: 'counters', value: newCounters });

    setBatch(updatedBatch);
    setAuditEvents((prev) => [...prev, ...newAuditList]);
    setDiscrepancyCase(newCase);
    setCounters(newCounters);

    showToast(
      isDiscrepancy
        ? `Variance of ${unexplainedVariance} kg logged. Case #DISC-402 opened in quarantine.`
        : `Batch #BS-402 verified into saleable stock (${arrivalNetKg} kg).`
    );
  };

  // Resolve Discrepancy Case
  const resolveDiscrepancyCase = async (resolutionNote: string) => {
    if (!discrepancyCase || !batch) return;
    const db = getDatabase();

    const updatedCase: DiscrepancyCase = {
      ...discrepancyCase,
      status: 'RECONCILED',
      currentActionTaken: resolutionNote,
    };

    const resolveEvent: AuditEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      actorId: 'SUP-01',
      actorName: 'A. K. Patnaik',
      actorRole: 'District Procurement Officer',
      actionType: 'STOCK_SEPARATION_UPDATED',
      title: `Supervisor Review Case #DISC-402 Reconciled`,
      description: resolutionNote,
      details: {
        caseId: 'DISC-402',
        reconciledBy: 'A. K. Patnaik (DPO Mayurbhanj)',
      },
    };

    await db.discrepancyCases.put(updatedCase);
    await db.auditEvents.put(resolveEvent);

    setDiscrepancyCase(updatedCase);
    setAuditEvents((prev) => [...prev, resolveEvent]);
    showToast('Discrepancy Case #DISC-402 updated with joint review notes.');
  };

  // Reset to initial demo state
  const resetDemoData = async () => {
    await seedInitialData(true);
    await refreshFromDB();
    showToast('Demo state reset to pristine field ledger baseline (Batch #BS-402).');
  };

  return (
    <BanaSetuContext.Provider
      value={{
        isMounted,
        activeRole,
        setActiveRole,
        isOffline,
        setIsOffline,
        queuedSyncCount,
        batch,
        auditEvents,
        discrepancyCase,
        counters,
        toast,
        showToast,
        updateStep1,
        updateStep2,
        syncOfflineQueue,
        resetDemoData,
        resolveDiscrepancyCase,
      }}
    >
      {children}
    </BanaSetuContext.Provider>
  );
}

export function useBanaSetu() {
  const context = useContext(BanaSetuContext);
  if (!context) {
    throw new Error('useBanaSetu must be used within a BanaSetuProvider');
  }
  return context;
}
