import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import path from 'path';
import { getPrismaClient, isDatabaseConfigured } from '@/lib/server/db';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { generateULID } from '@/lib/ulid';
import {
  requireServerRole,
  UserRole,
  isCenterAuthorizedExact,
  isAuthorizedDepotCenter,
  resolveCanonicalDepotId,
} from '@/lib/server/auth';
import {
  getStorageAdapter,
  generateSafeObjectKey,
  validateFileSignature,
} from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
]);

const ALLOWED_UPLOAD_ROLES: UserRole[] = [
  'COLLECTOR',
  'SHG_FACILITATOR',
  'COLLECTION_MANAGER',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR_ADMIN',
];

const ALLOWED_EVIDENCE_TYPES = new Set([
  'COLLECTION_PHOTO',
  'VOICE_NOTE',
  'SCALE_READOUT',
  'WAYBILL_SCAN',
  'DISCREPANCY_PHOTO',
]);

export async function POST(req: NextRequest) {
  // Step 1: Server-side Authentication & Role Authorization (P0-C)
  const auth = await requireServerRole(req, ALLOWED_UPLOAD_ROLES);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const actor = auth.actor;

  // Generic upload permission guard:
  // Collectors do not have generic upload access; only permitted for authorized multipart collection photo evidence
  if (actor.role === 'COLLECTOR') {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_ROLE',
          message: 'Collector role forbidden from uploading evidence without authorized collection photo submission.',
        },
        { status: 403 }
      );
    }
  }

  // Rate limiting (20 uploads per minute per client)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-client';
  const rateLimit = checkRateLimit(clientIp, 'uploads', { windowMs: 60_000, maxRequests: 20 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many upload attempts. Please wait ${rateLimit.resetInSeconds} seconds.`,
      },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_FORM_DATA', message: 'Request must be multipart/form-data' },
      { status: 400 }
    );
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json(
      { error: 'FILE_REQUIRED', message: 'No file provided in form-data field "file"' },
      { status: 400 }
    );
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: 'FILE_TOO_LARGE',
        message: `File size exceeds 5MB limit (provided: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
      },
      { status: 413 }
    );
  }

  // Validate declared MIME type
  const mimeType = file.type || 'application/octet-stream';
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      {
        error: 'UNSUPPORTED_MEDIA_TYPE',
        message: `MIME type "${mimeType}" is not permitted. Allowed: JPEG, PNG, WebP, WebM/MP3/WAV/OGG audio.`,
      },
      { status: 415 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate binary file signature (magic bytes) to prevent extension/MIME spoofing
  if (!validateFileSignature(buffer, mimeType)) {
    return NextResponse.json(
      {
        error: 'INVALID_FILE_SIGNATURE',
        message: `File contents do not match declared MIME type "${mimeType}". Tampered or corrupted file rejected.`,
      },
      { status: 400 }
    );
  }

  // Validate evidence type
  const rawEvidenceType = (formData.get('evidenceType') as string) || 'COLLECTION_PHOTO';
  if (!ALLOWED_EVIDENCE_TYPES.has(rawEvidenceType)) {
    return NextResponse.json(
      {
        error: 'INVALID_EVIDENCE_TYPE',
        message: `Evidence type "${rawEvidenceType}" is not permitted.`,
      },
      { status: 422 }
    );
  }
  const evidenceType = rawEvidenceType;

  // Strict role-evidence restriction: Collectors are only authorized for COLLECTION_PHOTO
  if (actor.role === 'COLLECTOR' && evidenceType !== 'COLLECTION_PHOTO') {
    return NextResponse.json(
      {
        error: 'FORBIDDEN_EVIDENCE_TYPE',
        message: `Collector role is only authorized to upload 'COLLECTION_PHOTO' evidence.`,
      },
      { status: 403 }
    );
  }

  // Uploader ID is ALWAYS bound to the authenticated actor, never from client form-data
  const uploaderId = actor.userId;

  // Step 2b: Mandatory Target Batch Validation (SEC-01)
  const rawBatchId = formData.get('batchId');
  if (rawBatchId === null || rawBatchId === undefined) {
    return NextResponse.json(
      {
        error: 'BATCH_ID_REQUIRED',
        message: 'Evidence upload requires an existing, authorized "batchId" in form-data.',
      },
      { status: 422 }
    );
  }

  if (typeof rawBatchId !== 'string' || !rawBatchId.trim()) {
    return NextResponse.json(
      {
        error: 'BATCH_ID_REQUIRED',
        message: 'Field "batchId" cannot be empty or whitespace.',
      },
      { status: 422 }
    );
  }

  const batchId = rawBatchId.trim();

  // Validate batchId format to reject malformed strings
  if (!/^#?[a-zA-Z0-9_-]{3,64}$/.test(batchId)) {
    return NextResponse.json(
      {
        error: 'MALFORMED_BATCH_ID',
        message: `Batch ID "${batchId}" is malformed. Must be 3-64 alphanumeric characters, dashes, or underscores.`,
      },
      { status: 422 }
    );
  }

  // Safe fail-closed private storage check (P0-C)
  const storage = getStorageAdapter();
  if (!storage) {
    return NextResponse.json(
      {
        error: 'STORAGE_UNCONFIGURED',
        message:
          'Private evidence storage service is not configured. Direct file uploads are disabled to prevent public data exposure.',
      },
      { status: 503 }
    );
  }

  // Step 2c: Database verification and scope authorization (SEC-02)
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: 'DATABASE_UNCONFIGURED',
        message:
          'Server PostgreSQL database is unconfigured. Target batch authorization cannot be verified.',
      },
      { status: 503 }
    );
  }

  let batch: any;
  try {
    const prisma = getPrismaClient();
    batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { collectors: true },
    });
    if (!batch && batchId.startsWith('#')) {
      batch = await prisma.batch.findUnique({
        where: { id: batchId.replace(/^#/, '') },
        include: { collectors: true },
      });
    }
  } catch (dbErr) {
    console.warn('Batch ownership lookup error:', dbErr);
    return NextResponse.json(
      {
        error: 'RECORD_VERIFICATION_FAILED',
        message: 'Could not verify target record authorization.',
      },
      { status: 500 }
    );
  }

  if (!batch) {
    return NextResponse.json(
      { error: 'BATCH_NOT_FOUND', message: `Target batch "${batchId}" does not exist.` },
      { status: 404 }
    );
  }

  // Strict role, ownership, and collection-center authorization (No district bypass)
  if (actor.role === 'COLLECTION_MANAGER') {
    if (!actor.centerId) {
      return NextResponse.json(
        {
          error: 'CENTER_REQUIRED',
          message: 'Collection Manager must have an assigned center identifier.',
        },
        { status: 403 }
      );
    }
    const centerMatches = isCenterAuthorizedExact(actor.centerId, batch.centerName);
    if (!centerMatches) {
      return NextResponse.json(
        {
          error: 'CROSS_CENTER_ACCESS_FORBIDDEN',
          message: `Collection Manager is restricted to center '${actor.centerId}'. Access to batch '${batchId}' belonging to center '${batch.centerName}' is forbidden.`,
        },
        { status: 403 }
      );
    }
    if (actor.district && batch.district && batch.district !== actor.district) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Collection Manager is not authorized for district '${batch.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'SHG_FACILITATOR') {
    if (!actor.village || !actor.village.trim()) {
      return NextResponse.json(
        {
          error: 'VILLAGE_REQUIRED',
          message: 'Facilitator must have an assigned village.',
        },
        { status: 403 }
      );
    }

    const cleanActorVillage = actor.village.trim();

    // Authoritative batch village check:
    // 1. Gram Panchayat must exist and exactly equal facilitator's assigned village (trimmed)
    if (!batch.gramPanchayat || !batch.gramPanchayat.trim()) {
      return NextResponse.json(
        {
          error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
          message: `Batch '${batchId}' has no authoritative Gram Panchayat / village recorded. Access denied.`,
        },
        { status: 403 }
      );
    }

    const cleanBatchGp = batch.gramPanchayat.trim();
    if (cleanBatchGp !== cleanActorVillage) {
      return NextResponse.json(
        {
          error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
          message: `Facilitator is restricted to village '${cleanActorVillage}'. Access to batch '${batchId}' in Gram Panchayat '${cleanBatchGp}' is forbidden.`,
        },
        { status: 403 }
      );
    }

    // 2. If collector records exist, EVERY collector must have a valid village matching facilitator's village
    // Rejects mixed-village batches and missing/empty collector village data even if Gram Panchayat matches
    if (Array.isArray(batch.collectors) && batch.collectors.length > 0) {
      const allCollectorsMatch = batch.collectors.every(
        (c: any) =>
          c &&
          typeof c.village === 'string' &&
          c.village.trim().length > 0 &&
          c.village.trim() === cleanActorVillage
      );
      if (!allCollectorsMatch) {
        return NextResponse.json(
          {
            error: 'CROSS_VILLAGE_ACCESS_FORBIDDEN',
            message: `Facilitator is restricted to village '${cleanActorVillage}'. Batch '${batchId}' contains mixed or incomplete collector village records. Access denied.`,
          },
          { status: 403 }
        );
      }
    }

    if (actor.district && batch.district && batch.district.trim() !== actor.district.trim()) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Facilitator is not authorized for district '${batch.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'WAREHOUSE_MANAGER') {
    if (!actor.centerId || !isAuthorizedDepotCenter(actor.centerId)) {
      return NextResponse.json(
        {
          error: 'INVALID_DEPOT_ASSIGNMENT',
          message: 'Warehouse Manager must be assigned to an authorized central warehouse depot.',
        },
        { status: 403 }
      );
    }

    const cleanActorDepot = resolveCanonicalDepotId(actor.centerId);
    if (!cleanActorDepot) {
      return NextResponse.json(
        {
          error: 'INVALID_DEPOT_ASSIGNMENT',
          message: 'Warehouse Manager assigned depot cannot be resolved.',
        },
        { status: 403 }
      );
    }

    if (actor.district && batch.district && batch.district !== actor.district) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Warehouse Manager is not authorized for district '${batch.district}'.`,
        },
        { status: 403 }
      );
    }

    if (!batch.destinationDepotId) {
      return NextResponse.json(
        {
          error: 'DEPOT_ASSIGNMENT_REQUIRED',
          message: `Batch '${batchId}' has no assigned destination depot. Warehouse upload is forbidden.`,
        },
        { status: 403 }
      );
    }

    const cleanBatchDepot = resolveCanonicalDepotId(batch.destinationDepotId) || batch.destinationDepotId.trim();
    if (cleanBatchDepot !== cleanActorDepot) {
      return NextResponse.json(
        {
          error: 'CROSS_DEPOT_ACCESS_FORBIDDEN',
          message: `Warehouse Manager is restricted to depot '${cleanActorDepot}'. Access to batch '${batchId}' destined for '${cleanBatchDepot}' is forbidden.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'SUPERVISOR_ADMIN') {
    if (actor.district && batch.district && batch.district !== actor.district) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Supervisor Admin is not authorized for district '${batch.district}'.`,
        },
        { status: 403 }
      );
    }
  }

  if (actor.role === 'COLLECTOR') {
    // District isolation
    if (actor.district && batch.district && batch.district.trim().toLowerCase() !== actor.district.trim().toLowerCase()) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN_RECORD_ACCESS',
          message: `Collector is not authorized for district '${batch.district}'.`,
        },
        { status: 403 }
      );
    }

    // Contributor and village verification:
    // Collector must either be listed as a contributor on the batch OR belong to the batch Gram Panchayat
    const cleanActorVillage = actor.village?.trim().toLowerCase();
    const cleanBatchGp = batch.gramPanchayat?.trim().toLowerCase();
    const matchesVillage = Boolean(cleanActorVillage && cleanBatchGp && cleanActorVillage === cleanBatchGp);

    const isContributor = Array.isArray(batch.collectors) && batch.collectors.some((c: any) => {
      if (!c) return false;
      const idMatch = c.tribalId && (c.tribalId === actor.userId || c.tribalId === actor.username);
      const nameMatch = c.name && actor.fullName && c.name.trim().toLowerCase() === actor.fullName.trim().toLowerCase();
      return Boolean(idMatch || nameMatch);
    });

    if (!isContributor && !matchesVillage) {
      return NextResponse.json(
        {
          error: 'CROSS_COLLECTOR_ACCESS_FORBIDDEN',
          message: `Collector '${actor.fullName}' is not an authorized contributor for batch '${batchId}'.`,
        },
        { status: 403 }
      );
    }
  }

  const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Generate safe storage filename and object key
  const ext = path.extname(file.name) || (mimeType.startsWith('image/') ? '.jpg' : '.webm');
  const attachmentId = generateULID();
  const safeObjectKey = generateSafeObjectKey(
    mimeType.startsWith('audio/') ? 'audio' : 'evidence',
    batchId,
    attachmentId,
    ext
  );

  let uploadResult;
  try {
    uploadResult = await storage.upload({
      buffer,
      key: safeObjectKey,
      mimeType,
      isPrivate: true,
    });
  } catch (err: any) {
    console.error('Storage adapter upload failure:', err instanceof Error ? err.message : 'Unknown storage error');
    return NextResponse.json(
      {
        error: 'STORAGE_FAILED',
        message: 'Could not write file to private evidence storage',
      },
      { status: 500 }
    );
  }

  // Record evidence metadata in PostgreSQL if database configured
  let databaseSynced = false;
  if (isDatabaseConfigured()) {
    try {
      const prisma = getPrismaClient();
      await prisma.uploadedAttachment.create({
        data: {
          id: attachmentId,
          originalFilename: file.name,
          storagePath: uploadResult.url,
          storageProvider: uploadResult.provider,
          storageKey: uploadResult.key,
          bucketName: uploadResult.bucket,
          isPrivate: true,
          mimeType,
          fileSizeBytes: file.size,
          sha256Hash,
          evidenceType,
          batchId: batchId || undefined,
          uploaderId,
        },
      });
      databaseSynced = true;
    } catch (dbErr) {
      console.warn('Prisma uploadedAttachment create skipped/failed:', dbErr);
    }
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        id: attachmentId,
        url: uploadResult.url,
        key: uploadResult.key,
        storageProvider: uploadResult.provider,
        bucket: uploadResult.bucket,
        isPrivate: true,
        originalFilename: file.name,
        mimeType,
        sizeBytes: file.size,
        sha256Hash,
        evidenceType,
        batchId,
        databaseSynced,
      },
    },
    { status: 201 }
  );
}

