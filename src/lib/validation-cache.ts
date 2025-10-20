/**
 * In-memory cache for address validation results
 * Reduces duplicate API calls and improves performance
 */

import { AddressValidationResult } from './address-validation';

interface CacheEntry {
  result: AddressValidationResult;
  expiresAt: number;
}

// In-memory cache (replace with Redis in production for multi-instance support)
const cache = new Map<string, CacheEntry>();

// Cleanup interval to remove expired entries
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start cache cleanup timer
 */
function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * Get cached validation result
 */
export function getCachedValidation(cacheKey: string): AddressValidationResult | null {
  const entry = cache.get(cacheKey);
  
  if (!entry) return null;
  
  // Check if expired
  if (entry.expiresAt < Date.now()) {
    cache.delete(cacheKey);
    return null;
  }
  
  return entry.result;
}

/**
 * Set cached validation result
 */
export function setCachedValidation(
  cacheKey: string,
  result: AddressValidationResult,
  ttlMinutes: number = 20
): void {
  const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
  
  cache.set(cacheKey, {
    result,
    expiresAt,
  });
  
  // Start cleanup timer if not already running
  startCleanup();
}

/**
 * Clear all cached validations (for testing/admin)
 */
export function clearValidationCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
