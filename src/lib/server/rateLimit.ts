/**
 * In-memory sliding-window token bucket rate limiter for API routes.
 * Protects authentication and mutating endpoints against brute force and denial of service.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leaks
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
}

/**
 * Checks and updates the rate limit for a given client identifier (IP or user ID).
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
    // New window
    memoryStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  // Existing window
  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

/**
 * Resets the rate limit for a specific identifier (e.g. after a successful login).
 */
export function resetRateLimit(identifier: string, prefix: string): void {
  memoryStore.delete(`${prefix}:${identifier}`);
}
