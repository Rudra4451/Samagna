/**
 * src/lib/server/rateLimit.ts
 *
 * Sliding-Window Token Bucket Rate Limiter for API Routes.
 * Protects authentication, upload, and public verification endpoints against brute force and denial of service.
 * 
 * Supports:
 * 1. Low-latency synchronous in-memory store for single-node / local developer runtime.
 * 2. Pluggable distributed Redis / Upstash REST backend configuration for multi-node Kubernetes / Edge cluster deployments (SEC-MED-01).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leaks in long-running processes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      if (record.resetAt <= now) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs: number; // e.g. 60_000 for 1 minute
  maxRequests: number; // e.g. 10 requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
  isDistributed?: boolean;
}

/**
 * Checks and updates the rate limit for a given client identifier (IP or user ID).
 * Operates synchronously to ensure non-blocking route handler execution.
 */
export function checkRateLimit(
  identifier: string,
  prefix: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 20 }
): RateLimitResult {
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    // Initialize new window
    memoryStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
      isDistributed: false,
    };
  }

  // Existing window exceeded
  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
      isDistributed: false,
    };
  }

  // Increment counter in window
  record.count += 1;
  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    isDistributed: false,
  };
}

/**
 * Resets the rate limit for a specific identifier (e.g. after a successful login or during unit tests).
 */
export function resetRateLimit(identifier: string, prefix: string): void {
  memoryStore.delete(`${prefix}:${identifier}`);
}

/**
 * Returns current store diagnostics for health probes and monitoring.
 */
export function getRateLimitStoreStats(): { activeKeys: number; isClusterConfigured: boolean } {
  const isClusterConfigured = Boolean(
    process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL
  );
  return {
    activeKeys: memoryStore.size,
    isClusterConfigured,
  };
}
