import { PrismaClient } from '@prisma/client';

// Global declaration for PrismaClient singleton in Next.js development
declare global {
  // eslint-disable-next-line no-var
  var __banasetu_prisma: PrismaClient | undefined;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0 && !url.includes('replace_with_secure_password'));
}

export function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not configured. Server persistence requires a configured PostgreSQL database.'
    );
  }

  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }

  if (!global.__banasetu_prisma) {
    global.__banasetu_prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }

  return global.__banasetu_prisma;
}

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
}> {
  if (!isDatabaseConfigured()) {
    return {
      connected: false,
      message: 'DATABASE_URL is unconfigured. Operating in client-side Dexie mode only.',
    };
  }

  const startTime = Date.now();
  try {
    const prisma = getPrismaClient();
    // Lightweight check query
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      message: 'PostgreSQL database connection verified.',
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      connected: false,
      message: `Database connection failed: ${error?.message || 'Unknown database error'}`,
      latencyMs: Date.now() - startTime,
    };
  }
}
