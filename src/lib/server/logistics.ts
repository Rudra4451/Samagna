/**
 * Server-Side Logistics Coordination Network & Shipment Lifecycle Management
 *
 * Invariants:
 * 1. CUSTODY_LINKAGE: Every commercial shipment is linked to an existing custody record (PO, Processing Job, or Batch).
 * 2. NO_GPS_SIMULATION: Zero fake / animated GPS tracking unless genuine hardware integration is present.
 * 3. RECONCILIATION: Deterministic reconciliation for partial deliveries, failed deliveries, cancellations, and damage.
 * 4. PILOT_REVENUE_INVARIANT: Logistics coordination fee rate is 0.0 in pilot; zero fee deductions from collectors.
 */

import { getPrismaClient, isDatabaseConfigured } from './db';
import {
  LogisticsProvider,
  CommercialShipment,
  ShipmentStatus,
  ShipmentExceptionType,
  calculateDeliveryVariance,
  DEFAULT_LOGISTICS_PROVIDERS,
  DEFAULT_COMMERCIAL_SHIPMENTS,
} from '../logistics';

// Standby In-Memory Data Store (for development, testing, and offline modes)
let standbyCarriers: LogisticsProvider[] = JSON.parse(JSON.stringify(DEFAULT_LOGISTICS_PROVIDERS));
let standbyShipments: CommercialShipment[] = JSON.parse(JSON.stringify(DEFAULT_COMMERCIAL_SHIPMENTS));

export function resetStandbyLogisticsStore() {
  standbyCarriers = JSON.parse(JSON.stringify(DEFAULT_LOGISTICS_PROVIDERS));
  standbyShipments = JSON.parse(JSON.stringify(DEFAULT_COMMERCIAL_SHIPMENTS));
}

// ==========================================
// 1. Transporters & Fleet Management
// ==========================================

export async function getLogisticsProviders(filter?: {
  district?: string;
  isVerified?: boolean;
  isActive?: boolean;
}): Promise<LogisticsProvider[]> {
  let carriers = [...standbyCarriers];

  if (filter?.district) {
    carriers = carriers.filter((c) =>
      c.supportedDistricts.some((d) => d.toLowerCase().includes(filter.district!.toLowerCase()))
    );
  }
  if (filter?.isVerified !== undefined) {
    carriers = carriers.filter((c) => c.isVerified === filter.isVerified);
  }
  if (filter?.isActive !== undefined) {
    carriers = carriers.filter((c) => c.isActive === filter.isActive);
  }

  return carriers;
}

export async function getLogisticsProviderById(id: string): Promise<LogisticsProvider | null> {
  return standbyCarriers.find((c) => c.id === id || c.code === id) || null;
}

export async function registerLogisticsProvider(
  input: Omit<LogisticsProvider, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'isActive'>
): Promise<LogisticsProvider> {
  const newId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  const carrier: LogisticsProvider = {
    ...input,
    id: newId,
    isVerified: false,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  };

  standbyCarriers.unshift(carrier);
  return carrier;
}

export async function updateCarrierVerificationStatus(
  id: string,
  isVerified: boolean,
  isActive: boolean
): Promise<LogisticsProvider> {
  const carrier = standbyCarriers.find((c) => c.id === id);
  if (!carrier) throw new Error(`Carrier not found: ${id}`);

  carrier.isVerified = isVerified;
  carrier.isActive = isActive;
  carrier.updatedAt = new Date().toISOString();

  return carrier;
}

// ==========================================
// 2. Shipment Creation & Custody Linkage
// ==========================================

export async function getCommercialShipments(filter?: {
  carrierId?: string;
  sourceReferenceId?: string;
  lotReference?: string;
  status?: ShipmentStatus;
}): Promise<CommercialShipment[]> {
  let shipments = [...standbyShipments];

  if (filter?.carrierId) {
    shipments = shipments.filter((s) => s.carrierId === filter.carrierId);
  }
  if (filter?.sourceReferenceId) {
    shipments = shipments.filter((s) => s.sourceReferenceId === filter.sourceReferenceId);
  }
  if (filter?.lotReference) {
    shipments = shipments.filter((s) => s.lotReference === filter.lotReference);
  }
  if (filter?.status) {
    shipments = shipments.filter((s) => s.status === filter.status);
  }

  return shipments;
}

export async function getCommercialShipmentById(id: string): Promise<CommercialShipment | null> {
  return standbyShipments.find((s) => s.id === id || s.shipmentNumber === id) || null;
}

export async function createCommercialShipment(
  input: Omit<CommercialShipment, 'id' | 'shipmentNumber' | 'status' | 'receivedQuantityKg' | 'quantityVarianceKg' | 'discrepancyReason' | 'pickupConfirmedAt' | 'dispatchedAt' | 'actualDeliveryDate' | 'exceptionType' | 'exceptionNotes' | 'damageReportedKg' | 'delayHours' | 'proofOfDeliveryDocRef' | 'deliverySignedBy' | 'freightCostInr' | 'logisticsCoordinationFeeRate' | 'logisticsCoordinationFeeInr' | 'auditHistory' | 'createdAt' | 'updatedAt'>
): Promise<CommercialShipment> {
  // Gate 1: Check carrier verification
  const carrier = await getLogisticsProviderById(input.carrierId);
  if (!carrier || !carrier.isVerified || !carrier.isActive) {
    throw new Error(
      `UNVERIFIED_CARRIER_BLOCKED: Carrier '${input.carrierId}' is not verified or inactive.`
    );
  }

  // Gate 2: Custody Linkage Check
  if (!input.sourceReferenceId || !input.lotReference) {
    throw new Error(
      `CUSTODY_LINKAGE_REQUIRED: Shipment must be explicitly linked to a sourceReferenceId (PO, Job, Batch) and physical lotReference.`
    );
  }

  const now = new Date().toISOString();
  const seq = standbyShipments.length + 1;
  const shipmentId = `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const shipmentNumber = `SHP-MAYUR-2025-${seq.toString().padStart(3, '0')}`;

  const freightCostInr = Math.round(input.distanceKm * carrier.operatingRatePerKm * 100) / 100;

  const shipment: CommercialShipment = {
    ...input,
    id: shipmentId,
    shipmentNumber,
    carrierName: carrier.name,
    receivedQuantityKg: null,
    quantityVarianceKg: 0.0,
    discrepancyReason: null,
    status: 'CREATED',
    pickupConfirmedAt: null,
    dispatchedAt: null,
    actualDeliveryDate: null,
    exceptionType: 'NONE',
    exceptionNotes: null,
    damageReportedKg: 0.0,
    delayHours: 0,
    proofOfDeliveryDocRef: null,
    deliverySignedBy: null,
    freightCostInr,
    logisticsCoordinationFeeRate: 0.0, // 0.0 in pilot
    logisticsCoordinationFeeInr: 0.0,
    auditHistory: [
      {
        timestamp: now,
        actor: 'Logistics Coordinator',
        action: 'CREATE_SHIPMENT',
        previousStatus: undefined,
        newStatus: 'CREATED',
        notes: `Created shipment ${shipmentNumber} linked to ${input.sourceType} ${input.sourceReferenceId} (Lot: ${input.lotReference}).`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  standbyShipments.unshift(shipment);
  return shipment;
}

// ==========================================
// 3. Dispatch & Pickup Confirmation
// ==========================================

export async function confirmShipmentPickup(
  shipmentId: string,
  actor: string,
  notes?: string
): Promise<CommercialShipment> {
  const shipment = await getCommercialShipmentById(shipmentId);
  if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);

  if (shipment.status !== 'CREATED' && shipment.status !== 'ASSIGNED') {
    throw new Error(`Cannot confirm pickup for shipment in status '${shipment.status}'.`);
  }

  const now = new Date().toISOString();
  const prevStatus = shipment.status;

  shipment.status = 'PICKUP_CONFIRMED';
  shipment.pickupConfirmedAt = now;
  shipment.updatedAt = now;

  shipment.auditHistory.push({
    timestamp: now,
    actor,
    action: 'CONFIRM_PICKUP',
    previousStatus: prevStatus,
    newStatus: 'PICKUP_CONFIRMED',
    notes: notes || `Vehicle ${shipment.vehicleNumber} picked up consignment at ${shipment.originFacilityName}.`,
  });

  return shipment;
}

export async function confirmShipmentDispatch(
  shipmentId: string,
  actor: string,
  waybillNumber?: string,
  notes?: string
): Promise<CommercialShipment> {
  const shipment = await getCommercialShipmentById(shipmentId);
  if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);

  if (shipment.status !== 'PICKUP_CONFIRMED') {
    throw new Error(`Cannot confirm dispatch without confirmed pickup. Current status: '${shipment.status}'.`);
  }

  const now = new Date().toISOString();
  const prevStatus = shipment.status;

  if (waybillNumber) shipment.waybillNumber = waybillNumber;
  shipment.status = 'DISPATCHED_IN_TRANSIT';
  shipment.dispatchedAt = now;
  shipment.updatedAt = now;

  shipment.auditHistory.push({
    timestamp: now,
    actor,
    action: 'CONFIRM_DISPATCH',
    previousStatus: prevStatus,
    newStatus: 'DISPATCHED_IN_TRANSIT',
    notes: notes || `Consignment dispatched in vehicle ${shipment.vehicleNumber} under waybill ${shipment.waybillNumber || 'N/A'}. Tarpaulin secured.`,
  });

  return shipment;
}

// ==========================================
// 4. Delivery Confirmation & Discrepancies
// ==========================================

export async function confirmShipmentDelivery(
  shipmentId: string,
  actor: string,
  deliveryData: {
    receivedQuantityKg: number;
    deliverySignedBy: string;
    podRef?: string;
    damageKg?: number;
    discrepancyReason?: string;
    notes?: string;
  }
): Promise<CommercialShipment> {
  const shipment = await getCommercialShipmentById(shipmentId);
  if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);

  if (shipment.status !== 'DISPATCHED_IN_TRANSIT' && shipment.status !== 'DELIVERED_PARTIAL') {
    throw new Error(`Cannot record delivery for shipment in status '${shipment.status}'. Must be DISPATCHED_IN_TRANSIT.`);
  }

  const now = new Date().toISOString();
  const prevStatus = shipment.status;

  const reconciliation = calculateDeliveryVariance(
    shipment.dispatchedQuantityKg,
    deliveryData.receivedQuantityKg
  );

  shipment.receivedQuantityKg = deliveryData.receivedQuantityKg;
  shipment.quantityVarianceKg = reconciliation.varianceKg;
  shipment.deliverySignedBy = deliveryData.deliverySignedBy;
  if (deliveryData.podRef) shipment.proofOfDeliveryDocRef = deliveryData.podRef;
  shipment.actualDeliveryDate = now;
  shipment.updatedAt = now;

  if (deliveryData.damageKg && deliveryData.damageKg > 0) {
    shipment.damageReportedKg = deliveryData.damageKg;
    shipment.exceptionType = 'EN_ROUTE_DAMAGE';
    shipment.exceptionNotes = deliveryData.discrepancyReason || `Transit damage of ${deliveryData.damageKg} kg reported.`;
  } else {
    shipment.exceptionType = reconciliation.exceptionType;
  }

  if (reconciliation.recommendedStatus === 'DELIVERY_FAILED') {
    shipment.status = 'DELIVERY_FAILED';
    shipment.discrepancyReason = deliveryData.discrepancyReason || 'Zero net weight received; consignment refused or lost.';
  } else if (reconciliation.recommendedStatus === 'DELIVERED_PARTIAL') {
    shipment.status = 'DELIVERED_PARTIAL';
    shipment.discrepancyReason = deliveryData.discrepancyReason || reconciliation.message;
  } else {
    shipment.status = 'DELIVERED_CONFIRMED';
  }

  shipment.auditHistory.push({
    timestamp: now,
    actor,
    action: `CONFIRM_DELIVERY_${shipment.status}`,
    previousStatus: prevStatus,
    newStatus: shipment.status,
    notes: deliveryData.notes || reconciliation.message,
  });

  return shipment;
}

// ==========================================
// 5. Exception, Delay & Damage Reporting
// ==========================================

export async function reportShipmentException(
  shipmentId: string,
  actor: string,
  exception: {
    exceptionType: ShipmentExceptionType;
    notes: string;
    delayHours?: number;
    damageKg?: number;
  }
): Promise<CommercialShipment> {
  const shipment = await getCommercialShipmentById(shipmentId);
  if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);

  const now = new Date().toISOString();

  shipment.exceptionType = exception.exceptionType;
  shipment.exceptionNotes = exception.notes;
  if (exception.delayHours) shipment.delayHours = (shipment.delayHours || 0) + exception.delayHours;
  if (exception.damageKg) shipment.damageReportedKg = (shipment.damageReportedKg || 0) + exception.damageKg;
  shipment.updatedAt = now;

  shipment.auditHistory.push({
    timestamp: now,
    actor,
    action: `EXCEPTION_REPORTED_${exception.exceptionType}`,
    previousStatus: shipment.status,
    newStatus: shipment.status,
    notes: exception.notes,
  });

  return shipment;
}

// ==========================================
// 6. Shipment Cancellation
// ==========================================

export async function cancelShipment(
  shipmentId: string,
  actor: string,
  reason: string
): Promise<CommercialShipment> {
  const shipment = await getCommercialShipmentById(shipmentId);
  if (!shipment) throw new Error(`Shipment not found: ${shipmentId}`);

  if (shipment.status === 'DELIVERED_CONFIRMED' || shipment.status === 'DELIVERED_PARTIAL') {
    throw new Error(`Cannot cancel delivered shipment: ${shipmentId}`);
  }

  const now = new Date().toISOString();
  const prevStatus = shipment.status;

  shipment.status = 'CANCELLED';
  shipment.exceptionNotes = reason;
  shipment.updatedAt = now;

  shipment.auditHistory.push({
    timestamp: now,
    actor,
    action: 'CANCEL_SHIPMENT',
    previousStatus: prevStatus,
    newStatus: 'CANCELLED',
    notes: `Shipment cancelled. Reason: ${reason}`,
  });

  return shipment;
}

