/**
 * SAMAGNA Phase 5: Logistics & Fulfilment Network
 *
 * Invariants:
 * 1. CUSTODY_LINKAGE: Every commercial shipment is linked to an existing custody record (PO, Processing Job, or Batch).
 * 2. NO_GPS_SIMULATION: Zero fake / animated GPS tracking unless genuine hardware integration is present.
 * 3. EXCEPTION_HANDLING: Deterministic reconciliation for partial deliveries, failed deliveries, cancellations, and damage.
 * 4. PILOT_REVENUE_INVARIANT: Logistics coordination fee rate is 0.0 in pilot; zero fee deductions from collectors.
 */

export type LogisticsProviderType =
  | 'STATE_COOPERATIVE_FLEET'
  | 'REGISTERED_COMMERCIAL_CARRIER'
  | 'AGGREGATION_SHG_TRANSPORT'
  | 'THIRD_PARTY_LOGISTICS';

export type ShipmentStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PICKUP_CONFIRMED'
  | 'DISPATCHED_IN_TRANSIT'
  | 'DELIVERED_CONFIRMED'
  | 'DELIVERED_PARTIAL'
  | 'DELIVERY_FAILED'
  | 'CANCELLED';

export type ShipmentExceptionType =
  | 'NONE'
  | 'TRANSIT_DELAY'
  | 'EN_ROUTE_DAMAGE'
  | 'QUANTITY_DISCREPANCY'
  | 'SEAL_TAMPERED'
  | 'WEATHER_DISRUPTION'
  | 'VEHICLE_BREAKDOWN';

export type ShipmentSourceType =
  | 'PURCHASE_ORDER'
  | 'PROCESSING_JOB'
  | 'WAREHOUSE_TRANSFER';

export interface LogisticsProvider {
  id: string; // e.g. "LOG-OR-COOP-01"
  code: string; // e.g. "CARRIER-OD-01"
  name: string;
  carrierType: LogisticsProviderType;
  registrationNumber: string;
  gstin?: string | null;
  pan: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  fleetSize: number;
  supportedDistricts: string[];
  operatingRatePerKm: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentAuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  previousStatus?: string;
  newStatus: string;
  notes?: string;
}

export interface CommercialShipment {
  id: string; // e.g. "SHP-2025-001"
  shipmentNumber: string; // e.g. "SHP-MAYUR-2025-001"
  waybillNumber?: string | null; // eWaybill or transit waybill
  carrierId: string;
  carrierName?: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber?: string | null;
  sourceType: ShipmentSourceType;
  sourceReferenceId: string; // Linked PO ID, Job ID, or Batch ID
  lotReference: string; // Physical Lot Ref (e.g. "BS-402", "LIST-MAHUA-2025-01")
  produceName: string;
  dispatchedQuantityKg: number;
  receivedQuantityKg?: number | null;
  quantityVarianceKg?: number;
  discrepancyReason?: string | null;
  originFacilityId: string;
  originFacilityName: string;
  originAddress: string;
  destinationFacilityId?: string | null;
  destinationFacilityName: string;
  destinationAddress: string;
  sealTagIds: string[];
  tarpaulinSecured: boolean;
  status: ShipmentStatus;
  pickupConfirmedAt?: string | null;
  dispatchedAt?: string | null;
  estimatedArrivalDate: string;
  actualDeliveryDate?: string | null;
  exceptionType: ShipmentExceptionType;
  exceptionNotes?: string | null;
  damageReportedKg?: number;
  delayHours?: number;
  proofOfDeliveryDocRef?: string | null;
  deliverySignedBy?: string | null;
  supportingDocuments: string[];
  distanceKm: number;
  freightCostInr: number;
  logisticsCoordinationFeeRate: number; // 0.0 in pilot
  logisticsCoordinationFeeInr: number;
  auditHistory: ShipmentAuditLogEntry[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Calculates delivery weight variance and detects status:
 * - Full delivery (within standard shrinkage) -> DELIVERED_CONFIRMED
 * - Partial delivery (unexplained loss) -> DELIVERED_PARTIAL
 * - Total non-delivery (0 received) -> DELIVERY_FAILED
 */
export function calculateDeliveryVariance(
  dispatchedKg: number,
  receivedKg: number,
  allowableShrinkagePercent = 1.5
): {
  varianceKg: number;
  allowableShrinkageKg: number;
  unexplainedVarianceKg: number;
  recommendedStatus: ShipmentStatus;
  exceptionType: ShipmentExceptionType;
  message: string;
} {
  const varianceKg = Math.round((dispatchedKg - receivedKg) * 100) / 100;
  const allowableShrinkageKg = Math.round(((dispatchedKg * allowableShrinkagePercent) / 100) * 100) / 100;

  if (receivedKg <= 0) {
    return {
      varianceKg,
      allowableShrinkageKg,
      unexplainedVarianceKg: varianceKg,
      recommendedStatus: 'DELIVERY_FAILED',
      exceptionType: 'QUANTITY_DISCREPANCY',
      message: `Zero quantity received. Consignment failed or rejected at destination facility.`,
    };
  }

  if (varianceKg > allowableShrinkageKg) {
    const unexplainedVarianceKg = Math.round((varianceKg - allowableShrinkageKg) * 100) / 100;
    return {
      varianceKg,
      allowableShrinkageKg,
      unexplainedVarianceKg,
      recommendedStatus: 'DELIVERED_PARTIAL',
      exceptionType: 'QUANTITY_DISCREPANCY',
      message: `Partial delivery: Dispatched ${dispatchedKg} kg, received ${receivedKg} kg. Unexplained variance: ${unexplainedVarianceKg} kg exceeds allowable shrinkage (${allowableShrinkageKg} kg).`,
    };
  }

  return {
    varianceKg,
    allowableShrinkageKg,
    unexplainedVarianceKg: 0.0,
    recommendedStatus: 'DELIVERED_CONFIRMED',
    exceptionType: 'NONE',
    message: `Full delivery confirmed: Dispatched ${dispatchedKg} kg, received ${receivedKg} kg within transit tolerance (${allowableShrinkageKg} kg).`,
  };
}

/**
 * Seed Transporters & Logistics Providers
 */
export const DEFAULT_LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  {
    id: 'LOG-OR-COOP-01',
    code: 'CARRIER-OD-01',
    name: 'Odisha State Forest Produce Transport Cooperative',
    carrierType: 'STATE_COOPERATIVE_FLEET',
    registrationNumber: 'OD-COOP-TR-1982-01',
    gstin: '21BBACT9944D1Z8',
    pan: 'BBACT9944D',
    contactPerson: 'Suresh Chandra Mohapatra',
    contactPhone: '+91-674-2533001',
    contactEmail: 'logistics.apex@tdccol.odisha.gov.in',
    fleetSize: 18,
    supportedDistricts: ['Mayurbhanj', 'Keonjhar', 'Balasore', 'Sundargarh'],
    operatingRatePerKm: 38.0,
    isVerified: true,
    isActive: true,
    createdAt: '2025-01-10T08:00:00.000Z',
    updatedAt: '2025-01-10T08:00:00.000Z',
  },
  {
    id: 'LOG-SIMILIPAL-02',
    code: 'CARRIER-SML-02',
    name: 'Similipal Bio-Reserve Agro-Haulage Logistics',
    carrierType: 'REGISTERED_COMMERCIAL_CARRIER',
    registrationNumber: 'OR-MTR-2015-0899',
    gstin: '21AABCS7744M1Z2',
    pan: 'AABCS7744M',
    contactPerson: 'Bikash Mohanty',
    contactPhone: '+91-9437001234',
    contactEmail: 'dispatch@similipallogistics.com',
    fleetSize: 8,
    supportedDistricts: ['Mayurbhanj', 'Sundargarh', 'Angul', 'Boudh'],
    operatingRatePerKm: 42.0,
    isVerified: true,
    isActive: true,
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z',
  },
  {
    id: 'LOG-KORAPUT-SHG-03',
    code: 'CARRIER-KPT-03',
    name: 'Koraput Tribal Federation Transport Cluster',
    carrierType: 'AGGREGATION_SHG_TRANSPORT',
    registrationNumber: 'OD-SHG-TR-2020-044',
    gstin: null,
    pan: 'AABCT1100K',
    contactPerson: 'Damodar Majhi',
    contactPhone: '+91-9861004567',
    contactEmail: 'koraput.transport.shg@gmail.com',
    fleetSize: 6,
    supportedDistricts: ['Koraput', 'Rayagada', 'Nabarangpur', 'Malkangiri'],
    operatingRatePerKm: 32.0,
    isVerified: true,
    isActive: true,
    createdAt: '2025-02-01T10:00:00.000Z',
    updatedAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'LOG-UNVERIF-04',
    code: 'CARRIER-UNVER-04',
    name: 'Maa Tarini Goods Carrier (Unverified)',
    carrierType: 'THIRD_PARTY_LOGISTICS',
    registrationNumber: 'APPLYING-TR-2025',
    gstin: null,
    pan: 'PENDING',
    contactPerson: 'Rabindra Jena',
    contactPhone: '+91-9861009999',
    contactEmail: 'maatarini.transport@gmail.com',
    fleetSize: 2,
    supportedDistricts: ['Keonjhar'],
    operatingRatePerKm: 30.0,
    isVerified: false,
    isActive: false,
    createdAt: '2025-02-25T11:00:00.000Z',
    updatedAt: '2025-02-25T11:00:00.000Z',
  },
];

/**
 * Seed Commercial Shipments (Linked to Custody Lots, Purchase Orders & Processing Jobs)
 */
export const DEFAULT_COMMERCIAL_SHIPMENTS: CommercialShipment[] = [
  {
    id: 'SHP-2025-001',
    shipmentNumber: 'SHP-MAYUR-2025-001',
    waybillNumber: 'EWB-2110-8849-3012',
    carrierId: 'LOG-OR-COOP-01',
    carrierName: 'Odisha State Forest Produce Transport Cooperative',
    vehicleNumber: 'OD-11-A-4402',
    driverName: 'Jogendra Mahanta',
    driverPhone: '+91-9437123456',
    driverLicenseNumber: 'OD-11-2012-004512',
    sourceType: 'PURCHASE_ORDER',
    sourceReferenceId: 'PO-B2B-2025-001', // Linked to PO
    lotReference: 'LIST-MAHUA-2025-01', // Physical lot reference
    produceName: 'Dried Mahua Flowers (Grade 1 / Premium)',
    dispatchedQuantityKg: 50.0,
    receivedQuantityKg: null,
    quantityVarianceKg: 0.0,
    discrepancyReason: null,
    originFacilityId: 'BRP-01',
    originFacilityName: 'Baripada Central Terminal Depôt',
    originAddress: 'TDCCOL Depot, Station Road, Baripada, Mayurbhanj 757001',
    destinationFacilityId: null,
    destinationFacilityName: 'Dabur India Ayurvedic Manufacturing Unit',
    destinationAddress: 'Plot 22, Site IV, Sahibabad Industrial Area, Ghaziabad, UP 201010',
    sealTagIds: ['SEAL-BRP-991', 'SEAL-BRP-992'],
    tarpaulinSecured: true,
    status: 'DISPATCHED_IN_TRANSIT',
    pickupConfirmedAt: '2025-03-08T08:00:00.000Z',
    dispatchedAt: '2025-03-08T09:30:00.000Z',
    estimatedArrivalDate: '2025-03-12T18:00:00.000Z',
    actualDeliveryDate: null,
    exceptionType: 'NONE',
    exceptionNotes: null,
    damageReportedKg: 0.0,
    delayHours: 0,
    proofOfDeliveryDocRef: null,
    deliverySignedBy: null,
    supportingDocuments: ['/docs/ewb-2110-8849-3012.pdf', '/docs/weighment-dispatch-50kg.pdf'],
    distanceKm: 1450.0,
    freightCostInr: 55100.0,
    logisticsCoordinationFeeRate: 0.0, // 0.0 in pilot
    logisticsCoordinationFeeInr: 0.0,
    auditHistory: [
      {
        timestamp: '2025-03-07T14:00:00.000Z',
        actor: 'sdas.baripada (Depot Manager)',
        action: 'CREATE_COMMERCIAL_SHIPMENT',
        previousStatus: 'PO_CONFIRMED',
        newStatus: 'CREATED',
        notes: 'Created commercial shipment against PO-B2B-2025-001. Carrier assigned.',
      },
      {
        timestamp: '2025-03-08T08:00:00.000Z',
        actor: 'jogendra.mahanta (Driver)',
        action: 'CONFIRM_PICKUP',
        previousStatus: 'CREATED',
        newStatus: 'PICKUP_CONFIRMED',
        notes: 'Vehicle OD-11-A-4402 reported at Baripada Depot Bay 01-A.',
      },
      {
        timestamp: '2025-03-08T09:30:00.000Z',
        actor: 'sdas.baripada (Depot Manager)',
        action: 'CONFIRM_DISPATCH',
        previousStatus: 'PICKUP_CONFIRMED',
        newStatus: 'DISPATCHED_IN_TRANSIT',
        notes: 'Loaded 50.0 kg Mahua (1 double-stitched jute gunny bag). Seal tags SEAL-BRP-991/992 verified.',
      },
    ],
    createdAt: '2025-03-07T14:00:00.000Z',
    updatedAt: '2025-03-08T09:30:00.000Z',
  },
  {
    id: 'SHP-2025-002',
    shipmentNumber: 'SHP-MAYUR-2025-002',
    waybillNumber: 'WB-MAY-2025-044',
    carrierId: 'LOG-OR-COOP-01',
    carrierName: 'Odisha State Forest Produce Transport Cooperative',
    vehicleNumber: 'OD-11-B-8910',
    driverName: 'Kartik Soren',
    driverPhone: '+91-9437998877',
    driverLicenseNumber: 'OD-11-2018-009941',
    sourceType: 'PROCESSING_JOB',
    sourceReferenceId: 'JOB-PROC-2025-001', // Linked to Processing Job
    lotReference: 'BS-402',
    produceName: 'Raw Forest Honey (Similipal Reserve)',
    dispatchedQuantityKg: 200.0,
    receivedQuantityKg: 200.0,
    quantityVarianceKg: 0.0,
    discrepancyReason: null,
    originFacilityId: 'CEN-01',
    originFacilityName: 'Badagaon Aggregation Center',
    originAddress: 'Badagaon Gram Panchayat, Karanjia, Mayurbhanj',
    destinationFacilityId: 'FAC-MAYUR-HONEY-01',
    destinationFacilityName: 'Karanjia Tribal Honey Filtration & Curing Center',
    destinationAddress: 'TDCCOL Processing Complex, SH-19, Karanjia',
    sealTagIds: ['SEAL-KRN-101', 'SEAL-KRN-102'],
    tarpaulinSecured: true,
    status: 'DELIVERED_CONFIRMED',
    pickupConfirmedAt: '2025-04-01T07:30:00.000Z',
    dispatchedAt: '2025-04-01T08:00:00.000Z',
    estimatedArrivalDate: '2025-04-01T09:30:00.000Z',
    actualDeliveryDate: '2025-04-01T09:15:00.000Z',
    exceptionType: 'NONE',
    exceptionNotes: null,
    damageReportedKg: 0.0,
    delayHours: 0,
    proofOfDeliveryDocRef: 'POD-SHP-2025-002.pdf',
    deliverySignedBy: 'operator.karanjia',
    supportingDocuments: ['/docs/pod-SHP-2025-002.pdf', '/docs/weighment-karanjia-200kg.pdf'],
    distanceKm: 28.0,
    freightCostInr: 1064.0,
    logisticsCoordinationFeeRate: 0.0,
    logisticsCoordinationFeeInr: 0.0,
    auditHistory: [
      {
        timestamp: '2025-04-01T07:30:00.000Z',
        actor: 'sumitra.marndi (SHG Facilitator)',
        action: 'CONFIRM_PICKUP',
        previousStatus: 'CREATED',
        newStatus: 'PICKUP_CONFIRMED',
        notes: 'Handed over 200 kg raw comb honey to carrier vehicle OD-11-B-8910.',
      },
      {
        timestamp: '2025-04-01T08:00:00.000Z',
        actor: 'kartik.soren (Driver)',
        action: 'CONFIRM_DISPATCH',
        previousStatus: 'PICKUP_CONFIRMED',
        newStatus: 'DISPATCHED_IN_TRANSIT',
        notes: 'Transit started towards Karanjia processing center.',
      },
      {
        timestamp: '2025-04-01T09:15:00.000Z',
        actor: 'operator.karanjia (Plant Operator)',
        action: 'CONFIRM_DELIVERY',
        previousStatus: 'DISPATCHED_IN_TRANSIT',
        newStatus: 'DELIVERED_CONFIRMED',
        notes: 'Full delivery confirmed. Received net 200.0 kg. Zero variance.',
      },
    ],
    createdAt: '2025-03-31T16:00:00.000Z',
    updatedAt: '2025-04-01T09:15:00.000Z',
  },
];

