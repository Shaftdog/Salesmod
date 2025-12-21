/**
 * API Rate Limiter
 *
 * In-memory rate limiting for API endpoints.
 * Uses a sliding window algorithm to track requests per user.
 *
 * Note: This is suitable for single-instance deployments.
 * For multi-instance deployments, consider using Redis.
 */

import { TooManyRequestsError } from '@/lib/errors/api-errors';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limit entries
// Key format: `${endpoint}:${userId}`
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Don't prevent process from exiting
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Optional endpoint identifier for different limits per endpoint */
  endpoint?: string;
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
  /** Standard API endpoint: 60 requests per minute */
  standard: { maxRequests: 60, windowMs: 60 * 1000 },

  /** Write operations: 20 requests per minute */
  write: { maxRequests: 20, windowMs: 60 * 1000 },

  /** Strict limit for sensitive operations: 10 requests per minute */
  strict: { maxRequests: 10, windowMs: 60 * 1000 },

  /** Relaxed limit for read operations: 120 requests per minute */
  relaxed: { maxRequests: 120, windowMs: 60 * 1000 },
} as const;

/**
 * Check rate limit for a user on an endpoint
 *
 * @param userId - The user's ID (from auth)
 * @param config - Rate limit configuration
 * @throws {TooManyRequestsError} If rate limit exceeded
 * @returns Object with remaining requests and reset time
 */
export function checkRateLimit(
  userId: string,
  config: RateLimitConfig
): { remaining: number; resetAt: number } {
  startCleanup();

  const { maxRequests, windowMs, endpoint = 'default' } = config;
  const key = `${endpoint}:${userId}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
    return { remaining: maxRequests - 1, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    throw new TooManyRequestsError(
      `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      retryAfterSeconds
    );
  }

  return { remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit middleware for API routes
 *
 * @example
 * ```typescript
 * import { withRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter';
 *
 * export async function POST(request: NextRequest) {
 *   const supabase = await createClient();
 *   const { orgId } = await getAuthenticatedContext(supabase);
 *
 *   // Check rate limit (throws if exceeded)
 *   withRateLimit(orgId, {
 *     ...RateLimitPresets.write,
 *     endpoint: 'orders/activities/POST',
 *   });
 *
 *   // ... rest of handler
 * }
 * ```
 */
export function withRateLimit(
  userId: string,
  config: RateLimitConfig
): { remaining: number; resetAt: number } {
  return checkRateLimit(userId, config);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  userId: string,
  config: RateLimitConfig
): { count: number; remaining: number; resetAt: number } | null {
  const { endpoint = 'default' } = config;
  const key = `${endpoint}:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < Date.now()) {
    return null;
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a user (useful for testing)
 */
export function resetRateLimit(userId: string, endpoint: string = 'default'): void {
  const key = `${endpoint}:${userId}`;
  rateLimitStore.delete(key);
}
