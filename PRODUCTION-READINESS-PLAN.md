# 🚀 Production Readiness Plan - AppraiseTrack (Salesmod)

**Current Status**: Development → Production Ready
**Estimated Timeline**: 4-6 weeks
**Priority Level**: High

---

## 🔴 Phase 1: CRITICAL SECURITY FIXES (Week 1 - URGENT)

### 1.1 API Key Rotation & Security
**Priority**: 🔴 CRITICAL - DO IMMEDIATELY

**Current Issue**:
- `.env.local` contains exposed API keys in version control history
- All API keys are compromised and must be rotated

**Action Items**:
- [ ] **Rotate ALL API keys immediately**:
  - OpenAI API key at https://platform.openai.com/api-keys
  - Anthropic API key at https://console.anthropic.com/settings/keys
  - Resend API key at https://resend.com/settings
  - Google Maps API key at https://console.cloud.google.com/apis/credentials
  - Supabase service role key (Project Settings → API)
- [ ] Update `.env.local` with new keys (locally only)
- [ ] Create `.env.example` template without real values
- [ ] Add security scanning to CI/CD (detect-secrets or git-secrets)
- [ ] Review git history for other exposed secrets
- [ ] Consider using secret management service (Vercel Secrets, Doppler, or Vault)

**Verification**:
```bash
# Ensure .env files are gitignored
git check-ignore .env.local
# Should output: .env.local

# Scan for secrets in git history
git log --all -S 'sk-proj-' --source --all
```

### 1.2 Environment Variable Management
**Priority**: 🔴 CRITICAL

**Action Items**:
- [ ] Set up Vercel environment variables for production
- [ ] Separate dev/staging/prod environments
- [ ] Document required environment variables in README
- [ ] Add runtime validation for required env vars

**Implementation**:
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  // ... etc
});

export const env = envSchema.parse(process.env);
```

---

## 🟠 Phase 2: TYPE SAFETY & CODE QUALITY (Week 1-2)

### 2.1 Resolve Remaining TypeScript Errors
**Current**: 31 errors remaining
**Target**: 0 errors
**Priority**: 🟠 HIGH

**Quick Wins** (5-10 min):
- [ ] Add type annotations to `src/lib/agent/tools.ts` parameters (8 errors)
- [ ] Define `ValidationStatus` enum type for property-chip.tsx (2 errors)
  ```typescript
  export type ValidationStatus = 'pending' | 'verified' | 'partial' | 'unverified';
  ```

**Medium Priority** (15-20 min):
- [ ] Replace `onConflict` with upsert pattern in email webhook (2 errors)
- [ ] Fix property dialog validation types (4 errors)
- [ ] Fix street view location type (1 error)

**Low Priority** (30+ min):
- [ ] Fix migration templates CSV typing (1 error)
- [ ] Fix backfill script types (1 error - scripts directory)
- [ ] Review agent tool definition overloads (remaining errors)

### 2.2 Add ESLint & Prettier
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Install and configure ESLint
  ```bash
  npm install -D eslint-config-next
  ```
- [ ] Install Prettier
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] Create `.prettierrc.json`
- [ ] Add lint-staged and husky for pre-commit hooks
- [ ] Run `npm run lint -- --fix` to auto-fix issues

---

## 🟡 Phase 3: TESTING INFRASTRUCTURE (Week 2-3)

### 3.1 Unit Testing Setup
**Current**: 0 test files
**Target**: 70%+ coverage on critical paths
**Priority**: 🟡 MEDIUM

**Setup**:
- [ ] Install Vitest (faster than Jest for Vite/Next.js)
  ```bash
  npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
  ```
- [ ] Create `vitest.config.ts`
- [ ] Add test script to package.json: `"test": "vitest"`

**Critical Tests to Write**:
1. **Agent System** (highest complexity):
   - [ ] `src/lib/agent/planner.ts` - test planning logic
   - [ ] `src/lib/agent/executor.ts` - test action execution
   - [ ] `src/lib/agent/context-builder.ts` - test context aggregation

2. **Business Logic**:
   - [ ] `src/lib/address-validation.ts` - address parsing
   - [ ] `src/lib/units.ts` - unit detection and normalization
   - [ ] `src/lib/migrations/transforms.ts` - data transformation

3. **API Routes** (integration tests):
   - [ ] `/api/agent/run` - agent execution
   - [ ] `/api/migrations/run` - migration processing
   - [ ] `/api/properties/*` - property CRUD

### 3.2 E2E Testing Setup
**Priority**: 🟡 MEDIUM

**Setup**:
- [ ] Install Playwright
  ```bash
  npm init playwright@latest
  ```
- [ ] Create test scenarios:
  - User login flow
  - Create order flow
  - Agent interaction flow
  - Migration import flow

**Critical E2E Tests**:
- [ ] Authentication (login/logout)
- [ ] Order creation and assignment
- [ ] Client management
- [ ] Migration wizard (happy path)

### 3.3 API Testing
**Priority**: 🟡 MEDIUM

- [ ] Create Postman/Insomnia collection for API endpoints
- [ ] Add API integration tests with MSW (Mock Service Worker)
- [ ] Test error scenarios and edge cases

---

## 🟢 Phase 4: ERROR HANDLING & RESILIENCE (Week 2-3)

### 4.1 Add Error Boundaries
**Priority**: 🟠 HIGH

**Current Issue**: No error boundaries - app crashes on uncaught errors

**Action Items**:
- [ ] Create root error boundary in `src/app/layout.tsx`
- [ ] Add feature-level error boundaries:
  - `src/app/(app)/layout.tsx` - catches app-level errors
  - `src/components/agent/agent-panel.tsx` - catches AI errors
  - `src/components/migrations/migration-wizard.tsx` - catches import errors

**Implementation**:
```tsx
// src/components/error-boundary.tsx
'use client';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

export function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
      onError={(error, info) => {
        // Log to monitoring service
        console.error('Error boundary caught:', error, info);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
```

### 4.2 Production Error Logging
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Set up Sentry or similar (https://sentry.io)
  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] Configure error tracking:
  - Client-side errors
  - Server-side errors
  - API route errors
  - Unhandled promise rejections
- [ ] Add custom context to errors (user ID, org ID, etc.)
- [ ] Set up error alerts for critical failures

### 4.3 Remove Development Fallbacks
**Priority**: 🟠 HIGH

**Current Issue**: Production code contains dev fallbacks

**Fix**:
```typescript
// src/lib/agent/executor.ts:187-189
// ❌ REMOVE THIS:
if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
  console.log('Email send (simulated):', { to, subject });
  return { success: true, messageId: 'simulated' };
}

// ✅ REPLACE WITH:
if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is required in production');
}
```

- [ ] Remove all simulated/fallback behavior in production
- [ ] Add proper feature flags if needed
- [ ] Fail fast on missing configuration

---

## 🔵 Phase 5: API SECURITY & RATE LIMITING (Week 3)

### 5.1 API Route Protection
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Add rate limiting to all API routes
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```
- [ ] Implement per-user rate limits:
  - AI endpoints: 10 req/min
  - CRUD endpoints: 100 req/min
  - Migration endpoints: 5 req/hour

**Implementation**:
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});
```

### 5.2 Input Validation
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Add Zod validation to all API routes
- [ ] Validate file uploads (size, type, malware scan)
- [ ] Sanitize user inputs (XSS prevention)
- [ ] Add CSRF protection

**Example**:
```typescript
// src/app/api/properties/route.ts
const propertySchema = z.object({
  addressLine1: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(),
  // ...
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = propertySchema.parse(body); // Throws if invalid
  // ... proceed with validated data
}
```

### 5.3 AI Cost Controls
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Add AI usage tracking per organization
- [ ] Implement spending limits
- [ ] Add cost alerts
- [ ] Cache AI responses where appropriate
- [ ] Add retry logic with exponential backoff

**Implementation**:
```typescript
// src/lib/ai-usage-tracker.ts
export async function trackAIUsage(orgId: string, cost: number) {
  const usage = await getMonthlyUsage(orgId);
  if (usage + cost > MONTHLY_LIMIT) {
    throw new Error('Monthly AI budget exceeded');
  }
  await recordUsage(orgId, cost);
}
```

---

## 🟣 Phase 6: PERFORMANCE OPTIMIZATION (Week 3-4)

### 6.1 Database Optimization
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Add database indexes for frequent queries:
  ```sql
  CREATE INDEX idx_orders_client_id ON orders(client_id);
  CREATE INDEX idx_orders_status ON orders(status);
  CREATE INDEX idx_activities_client_created ON activities(client_id, created_at DESC);
  CREATE INDEX idx_properties_addr_hash ON properties(addr_hash);
  ```
- [ ] Analyze slow queries with `EXPLAIN ANALYZE`
- [ ] Add connection pooling configuration
- [ ] Implement query result caching (Redis)

### 6.2 Frontend Performance
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Run Lighthouse audit, aim for 90+ score
- [ ] Implement code splitting for large components
- [ ] Add React.lazy() for heavy features (agent panel, migrations)
- [ ] Optimize images with next/image
- [ ] Add loading states for better UX
- [ ] Implement virtualization for long lists (react-window)

**Bundle Analysis**:
```bash
npm install -D @next/bundle-analyzer
# Add to next.config.ts
ANALYZE=true npm run build
```

### 6.3 Agent System Performance
**Priority**: 🟡 MEDIUM

**Current Issue**: Sequential card execution with 1s delays

**Optimize**:
- [ ] Implement parallel execution with concurrency limit
- [ ] Remove artificial delays
- [ ] Add progress streaming for long operations
- [ ] Implement background job queue (BullMQ or similar)

---

## 🟤 Phase 7: MONITORING & OBSERVABILITY (Week 4)

### 7.1 Application Monitoring
**Priority**: 🟠 HIGH

**Setup**:
- [ ] Vercel Analytics (built-in)
- [ ] Add custom metrics tracking:
  - API response times
  - AI request latency
  - Database query performance
  - User actions (analytics)

### 7.2 Logging Strategy
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Standardize log format (structured JSON logs)
- [ ] Add correlation IDs for request tracing
- [ ] Set up log aggregation (Datadog, LogRocket, or Vercel logs)
- [ ] Add different log levels (debug, info, warn, error)
- [ ] Remove console.logs in production

**Implementation**:
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, context?: object) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
    } else {
      console.log(message, context);
    }
  },
  // ... error, warn, debug
};
```

### 7.3 Uptime Monitoring
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, or Better Uptime)
- [ ] Monitor critical endpoints every 5 minutes
- [ ] Set up alerts for downtime
- [ ] Create status page for users

---

## ⚪ Phase 8: DOCUMENTATION (Week 4-5)

### 8.1 Code Documentation
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Add JSDoc comments to complex functions
- [ ] Document API routes (consider OpenAPI/Swagger)
- [ ] Create architecture decision records (ADRs)
- [ ] Document environment variables in README
- [ ] Add inline comments for non-obvious logic

### 8.2 User Documentation
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] User guide for main features
- [ ] Admin documentation for setup
- [ ] Migration guide (CSV import instructions)
- [ ] Troubleshooting guide
- [ ] Video tutorials (optional)

### 8.3 Developer Documentation
**Priority**: 🟢 LOW

**Action Items**:
- [ ] Update README with:
  - Architecture overview
  - Local development setup
  - Testing instructions
  - Deployment guide
  - Contributing guidelines
- [ ] Create CONTRIBUTING.md
- [ ] Document database schema (ER diagram)

---

## 🟠 Phase 9: DEPLOYMENT PREPARATION (Week 5)

### 9.1 Build & Deploy Pipeline
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Verify `npm run build` succeeds without errors
- [ ] Set up staging environment on Vercel
- [ ] Configure production environment variables
- [ ] Set up custom domain and SSL
- [ ] Configure CORS policies
- [ ] Set up CDN for static assets

### 9.2 Database Migration Strategy
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Backup production database before migrations
- [ ] Test all Supabase migrations on staging
- [ ] Create rollback plan for each migration
- [ ] Document migration procedure
- [ ] Consider zero-downtime migration strategy

### 9.3 Pre-Launch Checklist
**Priority**: 🔴 CRITICAL

**Checklist**:
- [ ] All TypeScript errors resolved (0 errors)
- [ ] Test coverage >70% on critical paths
- [ ] All API keys rotated and secured
- [ ] Error tracking configured (Sentry)
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Database backups automated
- [ ] Monitoring and alerts active
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] GDPR/privacy compliance reviewed
- [ ] Terms of service and privacy policy published

### 9.4 Security Hardening
**Priority**: 🔴 CRITICAL

**Action Items**:
- [ ] Run security audit with `npm audit`
- [ ] Fix all critical/high vulnerabilities
- [ ] Add security headers in next.config.ts:
  ```typescript
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      ],
    }];
  }
  ```
- [ ] Enable Supabase Row Level Security policies
- [ ] Review and test all RLS policies
- [ ] Add API key restrictions (IP whitelist, referrer restrictions)

---

## 🟢 Phase 10: POST-LAUNCH (Week 6+)

### 10.1 Monitoring & Maintenance
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Daily monitoring of error rates
- [ ] Weekly review of performance metrics
- [ ] Monthly security updates
- [ ] Regular database maintenance
- [ ] Review and optimize AI costs

### 10.2 Continuous Improvement
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Collect user feedback
- [ ] A/B test new features
- [ ] Optimize based on real usage patterns
- [ ] Add feature flags for gradual rollouts
- [ ] Plan regular security audits

### 10.3 Scaling Preparation
**Priority**: 🟢 LOW

**Action Items**:
- [ ] Load test at 10x expected traffic
- [ ] Plan database sharding if needed
- [ ] Consider edge caching (Vercel Edge, Cloudflare)
- [ ] Optimize expensive operations
- [ ] Plan for multi-region deployment if needed

---

## 📋 PRIORITIZED ACTION PLAN

### **WEEK 1 (CRITICAL)**
1. ✅ Rotate ALL API keys (Day 1)
2. ✅ Fix remaining 31 TypeScript errors (Days 1-2)
3. ✅ Add error boundaries (Days 2-3)
4. ✅ Set up Sentry error tracking (Day 3)
5. ✅ Add ESLint and Prettier (Day 4)
6. ✅ Remove dev fallbacks from production code (Day 5)

### **WEEK 2 (HIGH PRIORITY)**
1. ✅ Set up testing infrastructure (Vitest + Playwright)
2. ✅ Write critical unit tests (agent system, migrations)
3. ✅ Add rate limiting to API routes
4. ✅ Add input validation (Zod schemas)
5. ✅ Database indexing optimization

### **WEEK 3 (MEDIUM PRIORITY)**
1. ✅ Performance optimization (bundle analysis, code splitting)
2. ✅ Add monitoring and logging
3. ✅ Write E2E tests
4. ✅ Security hardening
5. ✅ AI cost controls

### **WEEK 4 (MEDIUM PRIORITY)**
1. ✅ Complete documentation
2. ✅ Set up staging environment
3. ✅ Load testing
4. ✅ Security audit
5. ✅ Create runbooks

### **WEEK 5-6 (DEPLOYMENT)**
1. ✅ Final pre-launch checklist
2. ✅ Deploy to production
3. ✅ Monitor closely for first week
4. ✅ Gradual rollout to users
5. ✅ Post-launch optimizations

---

## 🎯 SUCCESS METRICS

**Before Production**:
- ✅ 0 TypeScript errors
- ✅ 70%+ test coverage on critical paths
- ✅ Lighthouse score 90+
- ✅ 0 high/critical npm vulnerabilities
- ✅ <500ms average API response time
- ✅ Error rate <0.1%

**Post-Launch (Month 1)**:
- ✅ 99.9% uptime
- ✅ <50ms average page load time
- ✅ 0 critical production bugs
- ✅ <$500/month AI costs (adjust based on usage)
- ✅ Positive user feedback

---

## 📞 SUPPORT & ESCALATION

**Critical Issues (P0)**:
- Database down
- Security breach
- Complete service outage
- **Response Time**: Immediate

**High Priority (P1)**:
- API errors affecting >10% of users
- Data loss or corruption
- AI service failures
- **Response Time**: <2 hours

**Medium Priority (P2)**:
- Feature bugs affecting some users
- Performance degradation
- **Response Time**: <24 hours

**Low Priority (P3)**:
- UI issues
- Enhancement requests
- **Response Time**: <1 week

---

## 💰 ESTIMATED COSTS

**Monthly Operational Costs**:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Sentry (10k events): $26/month
- AI APIs (estimated): $200-500/month (varies by usage)
- Uptime monitoring: $10/month
- **Total**: ~$280-580/month

**One-Time Setup**:
- Security audit: $2,000-5,000 (optional, recommended)
- Load testing service: $100-500 (optional)

---

## 📚 REFERENCES & RESOURCES

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)

### Monitoring
- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

This plan will take your application from its current state to production-ready in 4-6 weeks with proper execution. Start with Phase 1 (security) immediately, then work through phases sequentially.

**Last Updated**: October 21, 2025
**Version**: 1.0
