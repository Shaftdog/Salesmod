/**
 * Rate Limiting Utilities
 * Prevents API quota exhaustion for Gmail and other services
 */

/**
 * Process items in batches with rate limiting
 * @param items Array of items to process
 * @param processFn Function to process each item
 * @param batchSize Number of items to process concurrently
 * @param delayMs Delay between batches in milliseconds
 * @returns Array of results
 */
export async function processWithRateLimit<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options?: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<R[]> {
  const {
    batchSize = 10,
    delayMs = 100,
    onProgress,
  } = options || {};

  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch concurrently
    const batchResults = await Promise.all(
      batch.map(item => processFn(item))
    );

    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }

    // Add delay between batches (except for last batch)
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }

  return results;
}

/**
 * Process items in batches with error handling
 * Uses Promise.allSettled to continue processing even if some items fail
 */
export async function processWithRateLimitAndErrors<T, R>(
  items: T[],
  processFn: (item: T) => Promise<R>,
  options?: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (processed: number, total: number, errors: number) => void;
    onError?: (item: T, error: Error) => void;
  }
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const {
    batchSize = 10,
    delayMs = 100,
    onProgress,
    onError,
  } = options || {};

  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch with error handling
    const batchResults = await Promise.allSettled(
      batch.map(item => processFn(item))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const item = batch[index];
        const error = result.reason instanceof Error
          ? result.reason
          : new Error(String(result.reason));

        errors.push({ item, error });

        if (onError) {
          onError(item, error);
        }
      }
    });

    // Report progress
    if (onProgress) {
      onProgress(
        Math.min(i + batchSize, items.length),
        items.length,
        errors.length
      );
    }

    // Add delay between batches (except for last batch)
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }

  return { results, errors };
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gmail API specific rate limiter
 * Gmail API quota: 250 quota units per user per second
 * - messages.list: 5 quota units
 * - messages.get: 5 quota units
 */
export const GmailRateLimiter = {
  /**
   * Rate limit for fetching individual messages
   * 10 messages per batch, 100ms delay = ~100 messages/second
   */
  fetchMessages: <T, R>(
    items: T[],
    fetchFn: (item: T) => Promise<R>
  ) => processWithRateLimitAndErrors(items, fetchFn, {
    batchSize: 10,
    delayMs: 100,
    onProgress: (processed, total, errors) => {
      if (errors > 0) {
        console.warn(`Gmail fetch progress: ${processed}/${total} (${errors} errors)`);
      }
    },
    onError: (item, error) => {
      console.error('Gmail fetch error:', error.message);
    },
  }),

  /**
   * Rate limit for sending emails
   * More conservative: 5 per batch, 200ms delay
   */
  sendEmails: <T, R>(
    items: T[],
    sendFn: (item: T) => Promise<R>
  ) => processWithRateLimit(items, sendFn, {
    batchSize: 5,
    delayMs: 200,
    onProgress: (processed, total) => {
      console.log(`Email send progress: ${processed}/${total}`);
    },
  }),
};

/**
 * Anthropic API rate limiter
 * More conservative for AI API calls
 */
export const AnthropicRateLimiter = {
  /**
   * Rate limit for Claude API calls
   * 5 concurrent requests, 200ms delay
   */
  classifyEmails: <T, R>(
    items: T[],
    classifyFn: (item: T) => Promise<R>
  ) => processWithRateLimitAndErrors(items, classifyFn, {
    batchSize: 5,
    delayMs: 200,
    onError: (item, error) => {
      console.error('Email classification error:', error.message);
    },
  }),
};
