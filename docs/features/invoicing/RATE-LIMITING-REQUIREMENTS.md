---
status: current
last_verified: 2025-11-16
updated_by: Claude Code
---

# Rate Limiting Requirements for Invoicing API

## Overview

The invoicing API currently **does not implement rate limiting**, which exposes it to abuse and denial-of-service attacks. This document outlines requirements and implementation strategy for production deployment.

## Security Risk

**Severity**: HIGH

Without rate limiting, the API is vulnerable to:
- Brute force attacks on invoice/payment data
- Resource exhaustion from excessive requests
- Cost inflation (database queries, Stripe API calls)
- Denial of service attacks

## Required Implementation

### Priority Endpoints (Highest Risk)

These endpoints MUST have rate limiting before production:

1. **POST /api/invoices** - Invoice creation
   - Recommended limit: 100 requests per hour per org
   - Reason: Prevents bulk invoice spam

2. **POST /api/invoices/batch** - Batch invoice creation
   - Recommended limit: 10 requests per hour per org
   - Reason: Resource-intensive operation

3. **POST /api/invoices/[id]/stripe-link** - Stripe payment link generation
   - Recommended limit: 50 requests per hour per org
   - Reason: External API calls (Stripe) have costs

4. **POST /api/webhooks/stripe** - Stripe webhook receiver
   - Recommended limit: 1000 requests per hour (global)
   - Reason: Critical security endpoint, but high legitimate traffic

5. **POST /api/invoices/[id]/send** - Email sending
   - Recommended limit: 100 requests per hour per org
   - Reason: Prevents email spam

### Standard Endpoints (Medium Risk)

6. **GET /api/invoices** - List invoices
   - Recommended limit: 500 requests per hour per org

7. **GET /api/reports/*** - Reporting endpoints
   - Recommended limit: 200 requests per hour per org
   - Reason: Database-intensive queries

8. **PATCH /api/invoices/[id]** - Invoice updates
   - Recommended limit: 200 requests per hour per org

## Implementation Options

### Option 1: Upstash Redis (Recommended)

```typescript
// lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter instance
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true,
  prefix: '@salesmod/ratelimit',
});

export async function checkRateLimit(
  identifier: string,
  limit?: number
): Promise<{ success: boolean; remaining: number }> {
  const { success, limit: max, remaining } = await ratelimit.limit(identifier);

  if (!success) {
    throw new ApiError(429, 'Too many requests. Please try again later.');
  }

  return { success, remaining };
}
```

**Setup Requirements:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Environment Variables:**
```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Option 2: Vercel Edge Config (Simpler, Less Flexible)

```typescript
import { get } from '@vercel/edge-config';

// Track request counts in Edge Config
// Limited to simple counters, not as robust as Redis
```

### Option 3: Database-Based (Not Recommended)

- Stores rate limit data in PostgreSQL
- Adds database load
- Slower than in-memory solutions
- Only use if no other option available

## Usage Pattern

### In API Routes

```typescript
// Example: POST /api/invoices/route.ts
import { checkRateLimit } from '@/lib/middleware/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const orgId = await getAuthenticatedOrgId(supabase);

    // Check rate limit BEFORE expensive operations
    await checkRateLimit(`invoice_create:${orgId}`, 100); // 100/hour

    // ... rest of invoice creation logic

  } catch (error) {
    return handleApiError(error);
  }
}
```

### For Different Limits per Endpoint

```typescript
// lib/middleware/rate-limit.ts
export const RATE_LIMITS = {
  invoice_create: 100,      // per hour
  invoice_batch: 10,         // per hour
  stripe_link: 50,           // per hour
  invoice_send: 100,         // per hour
  invoice_list: 500,         // per hour
  reports: 200,              // per hour
  webhooks: 1000,            // per hour (global)
} as const;

export async function checkRateLimit(
  endpoint: keyof typeof RATE_LIMITS,
  identifier: string
): Promise<void> {
  const limit = RATE_LIMITS[endpoint];

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, '1 h'),
  });

  const { success } = await ratelimit.limit(`${endpoint}:${identifier}`);

  if (!success) {
    throw new ApiError(
      429,
      `Rate limit exceeded. Maximum ${limit} requests per hour for this operation.`
    );
  }
}
```

## Response Headers

Include rate limit information in response headers:

```typescript
return NextResponse.json(data, {
  status: 200,
  headers: {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  },
});
```

## Monitoring & Alerting

### Metrics to Track

1. **Rate limit hits** - How many requests are being blocked
2. **Top offenders** - Which orgs are hitting limits most
3. **Endpoint distribution** - Which endpoints get most traffic
4. **Failed attempts** - Potential attack indicators

### Alert Thresholds

- Alert if single org hits rate limit > 10 times/hour (potential abuse)
- Alert if webhook rate limit hit (could indicate Stripe issue)
- Alert if total rate limit hits > 100/hour (capacity planning)

## Testing Rate Limits

```typescript
// tests/api/invoices/rate-limit.test.ts
describe('Invoice API Rate Limiting', () => {
  it('should block requests after limit exceeded', async () => {
    const requests = Array(101).fill(null).map(() =>
      fetch('/api/invoices', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(invoiceData),
      })
    );

    const responses = await Promise.all(requests);

    // First 100 should succeed
    expect(responses.slice(0, 100).every(r => r.status === 201)).toBe(true);

    // 101st should fail with 429
    expect(responses[100].status).toBe(429);
  });
});
```

## Bypass for Admin/Support

Consider implementing rate limit bypass for support operations:

```typescript
export async function checkRateLimit(
  endpoint: string,
  identifier: string,
  options?: { bypass?: boolean }
): Promise<void> {
  if (options?.bypass) {
    // Log bypass for audit
    console.warn('Rate limit bypassed', { endpoint, identifier });
    return;
  }

  // Normal rate limit check
  // ...
}
```

## Cost Considerations

### Upstash Pricing (as of 2025)

- Free tier: 10,000 requests/day
- Pro: $0.2 per 100K requests
- Enterprise: Custom pricing

### Estimated Costs

For 1M invoice API requests/month:
- Upstash cost: ~$2/month
- Cost per request: $0.000002

**Recommendation**: Start with free tier, upgrade as needed.

## Migration Strategy

1. **Phase 1 (Week 1)**: Implement rate limiting in development
2. **Phase 2 (Week 2)**: Deploy to staging with generous limits
3. **Phase 3 (Week 3)**: Monitor actual traffic patterns
4. **Phase 4 (Week 4)**: Tune limits based on data
5. **Phase 5 (Week 5)**: Deploy to production with alerts

## Action Items

- [ ] Create Upstash account and provision Redis instance
- [ ] Install @upstash/ratelimit package
- [ ] Implement rate-limit.ts middleware
- [ ] Add rate limiting to all priority endpoints
- [ ] Add response headers
- [ ] Implement monitoring dashboard
- [ ] Create alerts for rate limit violations
- [ ] Write tests for rate limiting
- [ ] Document rate limits in API documentation
- [ ] Add rate limit info to error responses

## References

- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/rate-limiting)
- [Vercel Rate Limiting Guide](https://vercel.com/guides/rate-limiting-api-routes)
- [OWASP Rate Limiting Guide](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
