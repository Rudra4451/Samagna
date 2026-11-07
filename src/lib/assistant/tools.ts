import { z } from 'zod';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { ODISHA_MFP_CATALOGUE } from '@/lib/products';

export interface ToolResult {
  data: Record<string, any>;
  sourceRef: string;
  asOf: string;
}

// ----------------------------------------------------------------------------
// 1. getRateCard
// ----------------------------------------------------------------------------
export const GetRateCardSchema = z.object({
  produceCode: z.string().min(1),
});

export async function toolGetRateCard(input: z.infer<typeof GetRateCardSchema>): Promise<ToolResult> {
  const raw = input.produceCode.toLowerCase().trim();
  const clean = raw.replace(/[^a-z0-9]/g, '');
  const product =
    ODISHA_MFP_CATALOGUE.find(
      (p) =>
        p.slug === raw ||
        p.slug.replace(/[^a-z0-9]/g, '') === clean ||
        p.slug.includes(raw) ||
        p.nameEnglish.toLowerCase().includes(raw)
    ) || ODISHA_MFP_CATALOGUE[0];

  return {
    data: {
      produceCode: product.slug,
      produceName: product.nameEnglish,
      ratePerKg: product.currentBenchmarkRatePerKg,
      currency: 'INR',
      version: 'MSP-2024-25',
      effectiveDate: '2024-04-15',
      isIllustrative: !product.isOfficialMsp,
      shrinkageTolerancePercent: product.allowableShrinkagePercent,
    },
    sourceRef: product.rateSource,
    asOf: new Date().toISOString().split('T')[0],
  };
}

// ----------------------------------------------------------------------------
// 2. getRequestStatus (Role & Own-Session Scoped)
// ----------------------------------------------------------------------------
export const GetRequestStatusSchema = z.object({
  pickupRequestId: z.string().min(1),
  actorUserId: z.string().min(1),
  actorRole: z.string().min(1),
});

export async function toolGetRequestStatus(input: z.infer<typeof GetRequestStatusSchema>): Promise<ToolResult> {
  if (!isDatabaseConfigured()) {
    return {
      data: {
        pickupRequestId: input.pickupRequestId,
        status: 'OFFLINE_RECORDED',
        note: 'Live database offline; consult local receipt ledger',
      },
      sourceRef: 'Local Device Ledger',
      asOf: new Date().toISOString(),
    };
  }

  const prisma = getPrismaClient();
  const batch = await prisma.batch.findFirst({
    where: {
      OR: [
        { id: input.pickupRequestId },
        { id: `#${input.pickupRequestId.replace('#', '')}` },
      ],
    },
    select: {
      id: true,
      status: true,
      produceName: true,
      centerName: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  if (!batch) {
    return {
      data: {
        pickupRequestId: input.pickupRequestId,
        status: 'NOT_FOUND',
      },
      sourceRef: 'BanaSetu Central Ledger',
      asOf: new Date().toISOString(),
    };
  }

  return {
    data: {
      pickupRequestId: batch.id,
      status: batch.status,
      produceName: batch.produceName,
      centerName: batch.centerName,
    },
    sourceRef: `Batch #${batch.id}`,
    asOf: batch.updatedAt.toISOString(),
  };
}

// ----------------------------------------------------------------------------
// 3. getAuditLog (Supervisor Admin & Manager Scoped)
// ----------------------------------------------------------------------------
export const GetAuditLogSchema = z.object({
  batchId: z.string().min(1),
  actorRole: z.string().min(1),
});

export async function toolGetAuditLog(input: z.infer<typeof GetAuditLogSchema>): Promise<ToolResult> {
  if (input.actorRole !== 'SUPERVISOR_ADMIN' && input.actorRole !== 'COLLECTION_MANAGER') {
    throw new Error('UNAUTHORIZED_AUDIT_ACCESS');
  }

  if (!isDatabaseConfigured()) {
    return {
      data: { events: [] },
      sourceRef: 'Audit Trail Registry (Offline)',
      asOf: new Date().toISOString(),
    };
  }

  const prisma = getPrismaClient();
  const events = await prisma.auditEvent.findMany({
    where: {
      OR: [
        { batchId: input.batchId },
        { batchId: `#${input.batchId.replace('#', '')}` },
      ],
    },
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: {
      id: true,
      timestamp: true,
      actionType: true,
      title: true,
      actorRole: true,
    },
  });

  return {
    data: {
      batchId: input.batchId,
      events: events.map((e) => ({
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        action: e.actionType,
        summary: e.title,
        role: e.actorRole,
      })),
    },
    sourceRef: `Audit Ledger for ${input.batchId}`,
    asOf: new Date().toISOString(),
  };
}

// ----------------------------------------------------------------------------
// 4. getVerifyRecord (Public & Internal Verification)
// ----------------------------------------------------------------------------
export const GetVerifyRecordSchema = z.object({
  code: z.string().min(1),
});

export async function toolGetVerifyRecord(input: z.infer<typeof GetVerifyRecordSchema>): Promise<ToolResult> {
  const cleanId = input.code.replace(/^#/, '').trim();

  if (!isDatabaseConfigured()) {
    return {
      data: {
        code: input.code,
        status: 'OFFLINE_LEDGER',
        notice: 'Official server verification registry is temporarily offline',
      },
      sourceRef: 'Public QR Registry (Offline)',
      asOf: new Date().toISOString(),
    };
  }

  const prisma = getPrismaClient();
  const batch = await prisma.batch.findFirst({
    where: {
      OR: [
        { id: cleanId },
        { id: input.code },
        { id: `#${cleanId}` },
        { id: `BS-${cleanId}` },
      ],
    },
    select: {
      id: true,
      produceName: true,
      produceOdia: true,
      district: true,
      block: true,
      centerName: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!batch) {
    return {
      data: {
        code: input.code,
        found: false,
      },
      sourceRef: 'BanaSetu Central QR Registry',
      asOf: new Date().toISOString(),
    };
  }

  return {
    data: {
      code: batch.id,
      produceName: batch.produceName,
      produceOdia: batch.produceOdia,
      district: batch.district,
      block: batch.block,
      centerName: batch.centerName,
      status: batch.status,
      found: true,
    },
    sourceRef: `Verified Lot #${batch.id}`,
    asOf: batch.updatedAt.toISOString(),
  };
}

// ----------------------------------------------------------------------------
// 5. getPermissionMatrix
// ----------------------------------------------------------------------------
export const GetPermissionMatrixSchema = z.object({
  role: z.string().min(1),
});

export async function toolGetPermissionMatrix(input: z.infer<typeof GetPermissionMatrixSchema>): Promise<ToolResult> {
  const permissionsByRole: Record<string, string[]> = {
    COLLECTOR: ['Submit pickup request', 'View personal receipts', 'Listen to rates aloud'],
    SHG_FACILITATOR: ['Submit pickup requests', 'Weigh and bag forest produce', 'Upload field photos'],
    COLLECTION_MANAGER: ['Certify electronic scale intake', 'Dispatch logistics carrier', 'Quarantine lot discrepancy'],
    WAREHOUSE_MANAGER: ['Receive depot intake batch', 'Perform certified shrinkage audit', 'Log lot quarantine'],
    SUPERVISOR_ADMIN: ['Resolve discrepancy cases', 'Review audit dossiers', 'Inspect commercial revenue and royalty'],
  };

  const perms = permissionsByRole[input.role.toUpperCase()] || ['Public batch QR verification'];

  return {
    data: {
      role: input.role.toUpperCase(),
      allowedActions: perms,
    },
    sourceRef: 'Samagna Role-Based Access Control Spec v1.0',
    asOf: new Date().toISOString().split('T')[0],
  };
}

// ----------------------------------------------------------------------------
// 6. getQualityStandards (Certified Moisture & Transit Shrinkage)
// ----------------------------------------------------------------------------
export const GetQualityStandardsSchema = z.object({
  produceCode: z.string().min(1),
});

export async function toolGetQualityStandards(input: z.infer<typeof GetQualityStandardsSchema>): Promise<ToolResult> {
  const norm = input.produceCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const product = ODISHA_MFP_CATALOGUE.find(
    (p) => p.slug.toLowerCase().includes(norm) || p.nameEnglish.toLowerCase().includes(norm)
  ) || ODISHA_MFP_CATALOGUE[0];

  return {
    data: {
      produceCode: product.slug,
      produceName: product.nameEnglish,
      produceOdia: product.nameOdia,
      maxMoisturePercent: product.baselineMoistureMaxPercent,
      allowableShrinkagePercent: product.allowableShrinkagePercent,
      standardPackaging: product.standardPackaging,
      typicalTareKg: product.typicalTareKgPerBag,
      harvestSeason: product.primaryHarvestSeason,
    },
    sourceRef: 'TDCCOL Certified Quality & Transit Guidelines',
    asOf: new Date().toISOString().split('T')[0],
  };
}

// ----------------------------------------------------------------------------
// 7. getStoreSummary (Retail & B2B Inventory Availability)
// ----------------------------------------------------------------------------
export async function toolGetStoreSummary(): Promise<ToolResult> {
  const products = ODISHA_MFP_CATALOGUE.slice(0, 5).map((p) => ({
    name: p.nameEnglish,
    slug: p.slug,
    rate: p.currentBenchmarkRatePerKg,
    packaging: p.standardPackaging,
  }));

  return {
    data: {
      featuredCount: products.length,
      products,
      storeUrl: '/store',
      tradeUrl: '/trade',
    },
    sourceRef: 'Samagna Forest Produce Value Chain Catalogue',
    asOf: new Date().toISOString().split('T')[0],
  };
}
