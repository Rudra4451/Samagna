/**
 * src/lib/server/storage.ts
 *
 * Durable Evidence Storage Abstraction Layer for BanaSetu
 * Supports managed Supabase Storage (private bucket) with seamless local fallback
 * for unconfigured / offline development environments.
 */



export interface StorageUploadResult {
  provider: 'supabase' | 'local';
  bucket: string;
  key: string;
  url: string;
  isPrivate: boolean;
}

export interface StorageAdapter {
  upload(params: {
    buffer: Buffer;
    key: string;
    mimeType: string;
    isPrivate?: boolean;
  }): Promise<StorageUploadResult>;

  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  delete(key: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// File Signature / Magic Bytes Validator
// ---------------------------------------------------------------------------
export function validateFileSignature(buffer: Buffer, declaredMime: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG magic bytes: FF D8 FF
  if (declaredMime === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG magic bytes: 89 50 4E 47
  if (declaredMime === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // WebP magic bytes: RIFF .... WEBP
  if (declaredMime === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  // WAV audio: RIFF .... WAVE
  if (declaredMime === 'audio/wav') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WAVE'
    );
  }

  // OGG audio: OggS
  if (declaredMime === 'audio/ogg') {
    return buffer.toString('ascii', 0, 4) === 'OggS';
  }

  // WebM audio: EBML header 1A 45 DF A3
  if (declaredMime === 'audio/webm') {
    return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  }

  // MP3 audio: ID3 header or MPEG sync word (FF FB / FF F3 / FF F2)
  if (declaredMime === 'audio/mpeg' || declaredMime === 'audio/mp3') {
    return (
      (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
    );
  }

  return false;
}

// ---------------------------------------------------------------------------
// Safe Object Key Generator
// ---------------------------------------------------------------------------
export function generateSafeObjectKey(
  category: 'evidence' | 'waybills' | 'audio',
  batchId: string | null,
  attachmentId: string,
  ext: string
): string {
  const sanitizedBatch = batchId
    ? batchId.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
    : 'unassigned';
  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  return `${category}/${sanitizedBatch}/${attachmentId}${cleanExt}`;
}

// ---------------------------------------------------------------------------
// Adapter: Supabase Managed Storage (Private Production Bucket)
// ---------------------------------------------------------------------------
export class SupabaseStorageAdapter implements StorageAdapter {
  private supabaseUrl: string;
  private serviceRoleKey: string;
  private bucketName: string;

  constructor(supabaseUrl: string, serviceRoleKey: string, bucketName = 'banasetu-evidence') {
    this.supabaseUrl = supabaseUrl.replace(/\/+$/, '');
    this.serviceRoleKey = serviceRoleKey;
    this.bucketName = bucketName;
  }

  async upload(params: {
    buffer: Buffer;
    key: string;
    mimeType: string;
    isPrivate?: boolean;
  }): Promise<StorageUploadResult> {
    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${params.key}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': params.mimeType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(params.buffer),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Supabase Storage upload failed with HTTP ${res.status}: ${errText || res.statusText}`
      );
    }

    // In a private bucket, access requires a signed URL
    const signedUrl = await this.getSignedUrl(params.key, 3600);

    return {
      provider: 'supabase',
      bucket: this.bucketName,
      key: params.key,
      url: signedUrl,
      isPrivate: true,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const endpoint = `${this.supabaseUrl}/storage/v1/object/sign/${this.bucketName}/${key}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      throw new Error(`Failed to generate signed URL for key "${key}"`);
    }

    const data = await res.json();
    return `${this.supabaseUrl}/storage/v1${data.signedURL}`;
  }

  async delete(key: string): Promise<boolean> {
    const endpoint = `${this.supabaseUrl}/storage/v1/object/${this.bucketName}`;

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefixes: [key] }),
    });

    return res.ok;
  }
}

// ---------------------------------------------------------------------------
// Storage Provider Factory
// ---------------------------------------------------------------------------
export function isSupabaseStorageConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes('your-project-ref') &&
      !key.includes('your-service-role-key')
  );
}

/**
 * Returns the configured private storage adapter, or null if private storage is not configured.
 * Fail-closed policy: BanaSetu NEVER falls back to writing evidence to public directories or returning unrestricted URLs.
 */
export function getStorageAdapter(): StorageAdapter | null {
  if (isSupabaseStorageConfigured()) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'banasetu-evidence';
    return new SupabaseStorageAdapter(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      bucket
    );
  }

  return null;
}
