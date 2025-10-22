# 🚀 Production Readiness Plan - AppraiseTrack (Salesmod)

**Current Status**: Development → Production Ready  
**Estimated Timeline**: 8-10 weeks (solo), 6-7 weeks (2 devs), 5-6 weeks (3+ devs)  
**Priority Level**: High  
**Last Updated**: October 22, 2025  
**Version**: 2.0

---

## 🔴 Phase 0: PRE-FLIGHT CHECKS (Days 1-3 - BLOCKING)

**⚠️ THESE BLOCK ALL OTHER WORK - FIX FIRST**

### 0.1 Fix Production Build
**Priority**: 🔴 BLOCKING - CANNOT PROCEED WITHOUT THIS  
**Current Status**: ❌ BROKEN - Build fails with type errors

**Current Issues**:
- `npm run build` fails with route type errors in Next.js 15
- Turbopack cache corruption causing ENOENT errors
- API route signature incompatible with Next.js 15

**Action Items**:
- [ ] **Fix Next.js 15 route parameters** (breaking change):
  ```typescript
  // src/app/api/properties/[id]/route.ts
  // ❌ OLD (Next.js 14):
  export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
  ) { ... }
  
  // ✅ NEW (Next.js 15):
  export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    // ... rest of handler
  }
  ```
- [ ] Apply same fix to all dynamic route handlers:
  - `src/app/api/properties/[id]/route.ts`
  - `src/app/api/orders/[id]/route.ts`
  - `src/app/api/clients/[id]/route.ts`
  - Any other `[id]` or `[slug]` routes
- [ ] Clear corrupted Next.js cache:
  ```bash
  rm -rf .next
  rm -rf .turbopack
  ```
- [ ] Test production build:
  ```bash
  npm run build
  # Must complete without errors
  ```
- [ ] Test production server:
  ```bash
  npm run build && npm start
  # Verify all routes load
  ```

**Verification**:
```bash
npm run build  # Exit code must be 0
open http://localhost:3000  # After npm start
# Test: /, /dashboard, /orders, /properties, /contacts
```

### 0.2 Fix TypeScript Errors
**Priority**: 🔴 CRITICAL  
**Current**: 31 errors  
**Target**: 0 errors

**Quick Wins** (30 minutes):
- [ ] Add parameter types to `src/lib/agent/tools.ts`:
  ```typescript
  // Line 20, 134, 189, 218, 256
  execute: async ({ query }: { query: string }) => {
    // Implementation
  }
  ```
- [ ] Fix ValidationStatus type in `src/components/orders/property-chip.tsx`:
  ```typescript
  type ValidationStatus = 'pending' | 'verified' | 'partial' | 'unverified';
  const status: ValidationStatus | undefined = property.validation_status;
  ```
- [ ] Fix `onConflict` → `upsert` in `src/app/api/email/webhook/route.ts`:
  ```typescript
  // Replace .insert().onConflict()
  await supabase.from('email_suppressions').upsert({
    email,
    reason,
    updated_at: new Date().toISOString()
  }, { onConflict: 'email' });
  ```

**Medium Priority** (1 hour):
- [ ] Fix property dialog types in `src/components/properties/add-property-dialog.tsx`
- [ ] Fix street view location type in `src/components/properties/property-street-view.tsx`
- [ ] Fix CSV typing in `src/app/api/migrations/templates/route.ts`

**Verification**:
```bash
npm run typecheck  # Must exit with 0
```

### 0.3 Clean Build Verification
**Priority**: 🔴 CRITICAL

**Checklist**:
- [ ] `npm run build` succeeds (exit code 0)
- [ ] `npm run typecheck` succeeds (0 errors)
- [ ] Production server starts: `npm start`
- [ ] All major routes accessible
- [ ] No runtime errors in browser console
- [ ] No React hydration errors

---

## 🔴 Phase 1: CRITICAL SECURITY FIXES (Week 1 - URGENT)

### 1.1 API Key Rotation & Git History Purge
**Priority**: 🔴 CRITICAL - DO IMMEDIATELY

**Current Issue**:
- `.env.local` exposed in git history
- All API keys are compromised
- Git history contains secrets that scanning detects but doesn't remove

**Action Items**:

#### **Step 1: Purge Git History** (DO FIRST)
- [ ] **Option A: BFG Repo-Cleaner** (recommended - fastest):
  ```bash
  brew install bfg
  
  # Create a file with patterns to redact
  cat > passwords.txt <<EOF
  sk-proj-
  sk-ant-
  re_
  AIza
  EOF
  
  # Purge files and secrets
  bfg --delete-files .env.local
  bfg --replace-text passwords.txt
  
  # Clean up
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```
  
- [ ] **Option B: git-filter-repo** (more thorough):
  ```bash
  pip install git-filter-repo
  
  # Remove .env.local from history
  git filter-repo --path .env.local --invert-paths
  
  # Replace API keys with REDACTED
  git filter-repo --replace-text <(echo "sk-proj-==>REDACTED")
  git filter-repo --replace-text <(echo "sk-ant-==>REDACTED")
  ```
  
- [ ] **Option C: Nuclear** (if repo is new/disposable):
  ```bash
  # Backup current code
  cp -r . ../salesmod-backup
  
  # Delete git history
  rm -rf .git
  git init
  git add .
  git commit -m "Initial commit - clean history"
  ```

#### **Step 2: Force Push Cleaned History**
- [ ] Push cleaned history:
  ```bash
  git push origin --force --all
  git push origin --force --tags
  ```
- [ ] **Notify team** if multiple developers (they must re-clone)

#### **Step 3: Rotate ALL API Keys** (AFTER purge)
- [ ] OpenAI API key: https://platform.openai.com/api-keys
- [ ] Anthropic API key: https://console.anthropic.com/settings/keys
- [ ] Resend API key: https://resend.com/settings
- [ ] Google Maps API key: https://console.cloud.google.com/apis/credentials
- [ ] Supabase service role key: Project Settings → API → Generate new key

#### **Step 4: Secure Environment Variables**
- [ ] Verify `.gitignore` contains:
  ```
  .env
  .env.local
  .env*.local
  *.env.local
  ```
- [ ] Create `.env.example`:
  ```bash
  # Copy structure, replace with placeholders
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  OPENAI_API_KEY=sk-proj-your_key_here
  ANTHROPIC_API_KEY=sk-ant-your_key_here
  RESEND_API_KEY=re_your_key_here
  GOOGLE_MAPS_API_KEY=your_maps_key_here
  ```

#### **Step 5: Add Secret Scanning to CI/CD**
- [ ] Install secret detection:
  ```bash
  npm install -D @secretlint/secretlint-rule-preset-recommend
  ```
- [ ] Add to `package.json`:
  ```json
  "scripts": {
    "security:check": "secretlint **/*"
  }
  ```

**Verification**:
```bash
# Confirm secrets removed from history
git log --all --full-history -- .env.local
# Should return empty or only show removals

# Scan for API key patterns
git log --all -S 'sk-proj-' --source --all | grep -i redacted
# Should only show REDACTED

# Verify .env.local is ignored
git check-ignore .env.local
# Should output: .env.local
```

### 1.2 Row Level Security (RLS) Implementation & Testing
**Priority**: 🔴 CRITICAL - NEW SECTION

**Current Issue**:
- RLS policies exist but lack systematic testing
- No verification of org_id isolation
- Risk of cross-tenant data leakage

**Action Items**:

#### **Audit Tables for org_id**
- [ ] Run audit query:
  ```sql
  -- Check which tables have org_id
  SELECT 
    table_name,
    column_name
  FROM information_schema.columns 
  WHERE column_name = 'org_id' 
    AND table_schema = 'public'
  ORDER BY table_name;
  ```

#### **Add org_id to Missing Tables**
- [ ] Identify critical tables needing org_id:
  - Core: `properties`, `orders`, `clients`, `contacts` (check if exist)
  - Activities: `activities`, `tasks`, `deals`, `cases`
  - Features: `migrations`, `kanban_cards`, `goals`
  - AI: `chat_messages`, `embeddings`, `research_results`
  
- [ ] Add migration for missing org_id columns:
  ```sql
  -- supabase/migrations/YYYYMMDDHHMMSS_add_org_id.sql
  ALTER TABLE table_name ADD COLUMN org_id UUID REFERENCES organizations(id);
  
  -- Backfill existing data (if needed)
  UPDATE table_name SET org_id = (SELECT id FROM organizations LIMIT 1)
  WHERE org_id IS NULL;
  
  -- Make NOT NULL after backfill
  ALTER TABLE table_name ALTER COLUMN org_id SET NOT NULL;
  ```

#### **Create Comprehensive RLS Policies**
- [ ] Template for all tables:
  ```sql
  -- Drop existing policies
  DROP POLICY IF EXISTS "org_isolation_select" ON table_name;
  DROP POLICY IF EXISTS "org_isolation_insert" ON table_name;
  DROP POLICY IF EXISTS "org_isolation_update" ON table_name;
  DROP POLICY IF EXISTS "org_isolation_delete" ON table_name;
  
  -- Enable RLS
  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
  
  -- SELECT policy
  CREATE POLICY "org_isolation_select" ON table_name
    FOR SELECT 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- INSERT policy
  CREATE POLICY "org_isolation_insert" ON table_name
    FOR INSERT 
    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- UPDATE policy
  CREATE POLICY "org_isolation_update" ON table_name
    FOR UPDATE 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- DELETE policy
  CREATE POLICY "org_isolation_delete" ON table_name
    FOR DELETE 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  ```

#### **Write RLS Test Suite**
- [ ] Create `tests/rls-policies.test.ts`:
  ```typescript
  import { createClient } from '@/lib/supabase/client';
  
  describe('RLS Policies - Cross-Org Isolation', () => {
    let orgAClient: SupabaseClient;
    let orgBClient: SupabaseClient;
    let orgAProperty: any;
    let orgBProperty: any;
    
    beforeAll(async () => {
      // Setup test orgs and users
      orgAClient = createClientForOrg('org-a');
      orgBClient = createClientForOrg('org-b');
      
      // Create test data
      orgAProperty = await createPropertyInOrg('org-a');
      orgBProperty = await createPropertyInOrg('org-b');
    });
    
    it('prevents Org A from reading Org B properties', async () => {
      const { data, error } = await orgAClient
        .from('properties')
        .select('*')
        .eq('id', orgBProperty.id);
      
      expect(data).toHaveLength(0);
    });
    
    it('prevents Org A from updating Org B orders', async () => {
      const { data, error } = await orgAClient
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orgBOrder.id);
      
      expect(error).toBeDefined();
      expect(error.code).toBe('PGRST116'); // No rows updated
    });
    
    it('prevents Org A from deleting Org B clients', async () => {
      const { error } = await orgAClient
        .from('clients')
        .delete()
        .eq('id', orgBClient.id);
      
      expect(error).toBeDefined();
    });
    
    // Repeat for all critical tables
  });
  ```

#### **Add RLS Test to CI/CD**
- [ ] Add to GitHub Actions:
  ```yaml
  # .github/workflows/test.yml
  - name: Test RLS Policies
    run: npm run test:rls
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_TEST_KEY }}
  ```

**Verification Checklist**:
- [ ] All tables with user data have org_id column
- [ ] All tables have RLS enabled
- [ ] All tables have 4 policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] RLS test suite passes with 100% coverage
- [ ] Manual test: Create 2 test orgs, verify complete data isolation

### 1.3 Rate Limiting (Critical Routes)
**Priority**: 🔴 CRITICAL - MOVED UP FROM PHASE 5

**Why Now**: Auth and AI endpoints are high-risk attack vectors needing immediate protection.

**Action Items**:

#### **Setup Rate Limiting Infrastructure**
- [ ] Install dependencies:
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  # Or if using Vercel: npm install @vercel/kv
  ```

#### **Create Rate Limit Middleware**
- [ ] Create `src/lib/rate-limit.ts`:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';
  
  // Create limiters for different route types
  export const rateLimiters = {
    ai: new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
    }),
    auth: new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
    }),
    migration: new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
    }),
    api: new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
    }),
  };
  
  export async function checkRateLimit(
    identifier: string,
    type: keyof typeof rateLimiters
  ) {
    const { success, limit, reset, remaining } = 
      await rateLimiters[type].limit(identifier);
    
    return {
      success,
      limit,
      remaining,
      reset,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      }
    };
  }
  ```

#### **Apply to Critical Routes**
- [ ] **AI routes** (`/api/agent/*` → 5 req/min):
  ```typescript
  // src/app/api/agent/run/route.ts
  import { checkRateLimit } from '@/lib/rate-limit';
  
  export async function POST(req: Request) {
    const userId = await getUserId(req);
    const rateLimit = await checkRateLimit(userId, 'ai');
    
    if (!rateLimit.success) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          ...rateLimit.headers,
          'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        },
      });
    }
    
    // Continue with AI logic...
  }
  ```
  
- [ ] **Auth routes** (`/api/auth/*` → 10 req/min per IP):
  ```typescript
  // Apply to login, signup, password reset
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateLimit = await checkRateLimit(ip, 'auth');
  ```
  
- [ ] **Migration routes** (`/api/migrations/*` → 3 req/hour):
  ```typescript
  const orgId = await getOrgId(req);
  const rateLimit = await checkRateLimit(orgId, 'migration');
  ```
  
- [ ] **General API routes** (100 req/min per user)

#### **Test Rate Limiting**
- [ ] Manual testing:
  ```bash
  # Install autocannon
  npm install -g autocannon
  
  # Test AI endpoint
  autocannon -c 10 -d 5 http://localhost:9002/api/agent/run
  # Should see 429 responses after limit
  ```

**Verification**:
- [ ] AI endpoints reject after 5 requests/min
- [ ] Auth endpoints reject after 10 requests/min per IP
- [ ] Migration endpoints reject after 3 requests/hour
- [ ] 429 responses include Retry-After header
- [ ] Rate limit headers present in all responses

### 1.4 Environment Variable Management
**Priority**: 🔴 CRITICAL

**Action Items**:
- [ ] Set up Vercel environment variables (or hosting provider)
- [ ] Separate dev/staging/prod environments
- [ ] Document all required environment variables in README
- [ ] Add runtime validation:
  ```typescript
  // src/lib/env.ts
  import { z } from 'zod';
  
  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().startsWith('sk-proj-'),
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
    RESEND_API_KEY: z.string().startsWith('re_'),
    GOOGLE_MAPS_API_KEY: z.string().startsWith('AIza'),
  });
  
  export const env = envSchema.parse(process.env);
  ```

---

## 🟠 Phase 2: TYPE SAFETY & CODE QUALITY (Week 1-2)

### 2.1 Resolve Remaining TypeScript Errors
**Status**: ✅ Should be complete from Phase 0.2

### 2.2 Add ESLint & Prettier
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Configure ESLint (Next.js includes it):
  ```bash
  npm run lint  # Should already work
  ```
- [ ] Install Prettier:
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- [ ] Create `.prettierrc.json`:
  ```json
  {
    "semi": true,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100
  }
  ```
- [ ] Add lint-staged and husky:
  ```bash
  npm install -D husky lint-staged
  npx husky init
  ```
- [ ] Configure pre-commit hook:
  ```json
  // package.json
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
  ```
- [ ] Run fixes:
  ```bash
  npm run lint -- --fix
  npx prettier --write .
  ```

---

## 🟡 Phase 3: TESTING INFRASTRUCTURE (Week 2-3)

### 3.0 Architecture Decision Records (ADRs)
**Priority**: 🟡 MEDIUM  
**Timing**: Before writing tests (defines test boundaries)

**Action Items**:
- [ ] Create ADR directory:
  ```bash
  mkdir -p docs/adr
  ```
- [ ] Write key ADRs:
  ```markdown
  # docs/adr/001-agent-architecture.md
  Status: Accepted
  
  ## Decision
  Use planner-executor pattern for AI agent
  
  ## Context
  Need to handle multi-step workflows with context management
  
  ## Consequences
  - Tests mock at executor boundary
  - Planner logic is unit testable
  - Clear separation of concerns
  
  # docs/adr/002-database-architecture.md
  Status: Accepted
  
  ## Decision
  Use Supabase with RLS for multi-tenancy
  
  ## Context
  Need secure org isolation without complex middleware
  
  ## Consequences
  - Database enforces isolation
  - Must test RLS policies thoroughly
  - Simpler application code
  
  # docs/adr/003-migration-system.md
  Status: Accepted
  
  ## Decision
  CSV-based migration with visual mapping UI
  
  ## Context
  Users migrating from various CRMs with different formats
  
  # docs/adr/004-ai-provider-strategy.md
  Status: Accepted
  
  ## Decision
  Multi-provider (OpenAI + Anthropic)
  
  ## Context
  Different providers excel at different tasks
  ```

**Template**:
```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue we're trying to solve?

## Decision
What did we decide?

## Consequences
What becomes easier or more difficult?

## Alternatives Considered
What other options did we evaluate?
```

### 3.1 Unit Testing Setup
**Current**: 0 test files  
**Target**: 70%+ coverage on critical paths  
**Priority**: 🟡 MEDIUM

**Setup**:
- [ ] Install Vitest:
  ```bash
  npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
  ```
- [ ] Create `vitest.config.ts`:
  ```typescript
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';
  import path from 'path';
  
  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './tests/setup.ts',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  });
  ```
- [ ] Add to `package.json`:
  ```json
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:rls": "vitest run tests/rls"
  }
  ```

**Critical Tests to Write**:

1. **Agent System**:
   - [ ] `tests/agent/planner.test.ts` - planning logic
   - [ ] `tests/agent/executor.test.ts` - action execution
   - [ ] `tests/agent/context-builder.test.ts` - context aggregation

2. **Business Logic**:
   - [ ] `tests/lib/address-validation.test.ts` - address parsing
   - [ ] `tests/lib/units.test.ts` - unit detection
   - [ ] `tests/lib/migrations/transforms.test.ts` - data transformation

3. **API Routes** (integration):
   - [ ] `tests/api/agent.test.ts`
   - [ ] `tests/api/migrations.test.ts`
   - [ ] `tests/api/properties.test.ts`

### 3.2 E2E Testing Setup
**Priority**: 🟡 MEDIUM

**Setup**:
- [ ] Install Playwright:
  ```bash
  npm init playwright@latest
  ```
- [ ] Configure for Next.js:
  ```typescript
  // playwright.config.ts
  export default defineConfig({
    testDir: './tests/e2e',
    webServer: {
      command: 'npm run dev',
      port: 9002,
      reuseExistingServer: !process.env.CI,
    },
    use: {
      baseURL: 'http://localhost:9002',
    },
  });
  ```

**Critical E2E Tests**:
- [ ] Authentication (login/logout)
- [ ] Order creation flow
- [ ] Client management
- [ ] Migration wizard (happy path)
- [ ] Agent interaction (with mocked AI)

### 3.3 API Testing
**Priority**: 🟡 MEDIUM

- [ ] Create Postman/Insomnia collection
- [ ] Add MSW (Mock Service Worker) for API mocking
- [ ] Test error scenarios and edge cases

---

## 🟢 Phase 4: ERROR HANDLING & RESILIENCE (Week 2-3)

### 4.1 Add Error Boundaries
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Install error boundary library:
  ```bash
  npm install react-error-boundary
  ```
- [ ] Create `src/components/error-boundary.tsx`:
  ```tsx
  'use client';
  import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
  
  export function ErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
      <ReactErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Something went wrong
              </h2>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {error.message}
              </pre>
              <button 
                onClick={resetErrorBoundary}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}
        onError={(error, info) => {
          // Log to Sentry
          console.error('Error boundary caught:', error, info);
        }}
      >
        {children}
      </ReactErrorBoundary>
    );
  }
  ```
- [ ] Add to key layouts:
  - `src/app/layout.tsx` (root level)
  - `src/app/(app)/layout.tsx` (app level)
  - `src/components/agent/agent-panel.tsx` (AI features)
  - `src/components/migrations/migration-wizard.tsx` (imports)

### 4.2 Production Error Logging
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Set up Sentry:
  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] Configure Sentry:
  ```typescript
  // sentry.client.config.ts
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    beforeSend(event, hint) {
      // Redact PII
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });
  ```
- [ ] Add custom context:
  ```typescript
  Sentry.setContext('organization', { org_id: user.org_id });
  Sentry.setUser({ id: user.id });
  ```
- [ ] Set up error alerts for P0/P1 issues
- [ ] Configure source maps for production

### 4.3 Remove Development Fallbacks
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Find and remove all dev fallbacks:
  ```bash
  grep -r "simulated\|fallback\|TODO.*production" src/
  ```
- [ ] Fix email simulation in `src/lib/agent/executor.ts`:
  ```typescript
  // ❌ REMOVE:
  if (!resendApiKey || resendApiKey === 're_YOUR_API_KEY_HERE') {
    console.log('Email send (simulated):', { to, subject });
    return { success: true, messageId: 'simulated' };
  }
  
  // ✅ REPLACE WITH:
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY is required in production');
  }
  ```
- [ ] Remove any other mock/simulation code
- [ ] Fail fast on missing configuration

### 4.4 Content Security Policy & Isolation Headers
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Add to `next.config.ts`:
  ```typescript
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        // Existing security headers
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        
        // NEW: Content Security Policy
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // TODO: Remove unsafe-* after audit
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://*.supabase.co https://api.openai.com https://api.anthropic.com https://maps.googleapis.com",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; ')
        },
        
        // NEW: Cross-origin isolation
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        
        // NEW: Permissions policy
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      ],
    }];
  }
  ```
- [ ] Test CSP in staging first (use report-only mode):
  ```typescript
  key: 'Content-Security-Policy-Report-Only'  // For testing
  ```
- [ ] Monitor CSP violations in Sentry
- [ ] Gradually tighten policy (remove 'unsafe-inline', 'unsafe-eval')

### 4.5 Cookie Security Hardening
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Verify Supabase SSR cookie settings:
  ```typescript
  // src/lib/supabase/middleware.ts
  const cookieOptions = {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-session' 
      : '__session',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60, // 1 hour
    path: '/',
  };
  ```
- [ ] Add session timeout logic
- [ ] Test CSRF protection with SameSite=strict
- [ ] Verify cookies not accessible via JavaScript:
  ```typescript
  // Should return empty
  console.log(document.cookie);
  ```

### 4.6 File Upload Security
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Add comprehensive file validation:
  ```typescript
  // src/lib/file-validation.ts
  const ALLOWED_TYPES = ['text/csv', 'application/json'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  
  export function validateFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only CSV and JSON allowed.');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('File too large. Maximum 10MB.');
    }
    return true;
  }
  ```
- [ ] Add CSV injection prevention:
  ```typescript
  // Sanitize CSV cells
  function sanitizeCell(value: string): string {
    // Prevent formula injection
    if (/^[=+\-@]/.test(value)) {
      return `'${value}`; // Prefix with single quote
    }
    return value;
  }
  ```
- [ ] Consider malware scanning (optional for v1):
  ```bash
  # Option A: ClamAV (self-hosted)
  npm install clamscan
  
  # Option B: VirusTotal API (cloud)
  npm install virustotal-api
  
  # Option C: AWS S3 + Lambda scanning
  # Or Cloudflare Workers scanning
  ```

---

## 🔵 Phase 5: API SECURITY & VALIDATION (Week 3)

### 5.1 API Route Protection
**Status**: ✅ Rate limiting moved to Phase 1.3

### 5.2 Input Validation
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Create Zod schemas for all API routes:
  ```typescript
  // src/lib/schemas/property.ts
  import { z } from 'zod';
  
  export const propertySchema = z.object({
    addressLine1: z.string().min(1).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    state: z.string().length(2).regex(/^[A-Z]{2}$/),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    // ... other fields
  });
  ```
- [ ] Apply to all API routes:
  ```typescript
  // src/app/api/properties/route.ts
  export async function POST(req: Request) {
    const body = await req.json();
    const validated = propertySchema.parse(body); // Throws ZodError if invalid
    
    // Proceed with validated data
  }
  ```
- [ ] Add XSS sanitization:
  ```bash
  npm install dompurify
  npm install -D @types/dompurify
  ```
- [ ] Implement CSRF protection (SameSite cookies + token)

### 5.3 AI Stack Security & Hygiene
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] **Upgrade embedding models**:
  ```typescript
  // Update to latest model
  const EMBEDDING_MODEL = 'text-embedding-3-small';
  // Cheaper and better than text-embedding-ada-002
  ```
  
- [ ] **Per-org AI spend limits**:
  ```typescript
  // src/lib/ai-usage.ts
  export async function checkOrgAIBudget(
    orgId: string, 
    estimatedCost: number
  ) {
    const monthlySpend = await supabase
      .from('ai_usage')
      .select('cost')
      .eq('org_id', orgId)
      .gte('created_at', startOfMonth())
      .sum('cost');
    
    const limit = await getOrgAILimit(orgId); // From org settings
    
    if (monthlySpend + estimatedCost > limit) {
      throw new AIBudgetExceededError(
        `Monthly AI budget exceeded: $${monthlySpend}/$${limit}`
      );
    }
  }
  ```
  
- [ ] **PII redaction in logs/prompts**:
  ```typescript
  // src/lib/pii-redaction.ts
  export function redactPII(text: string): string {
    return text
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{10,16}\b/g, '[PHONE/CC]')
      .replace(/\b\d{5}(-\d{4})?\b/g, '[ZIP]')
      .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]');
  }
  
  // Use before logging
  logger.info('AI request', { 
    prompt: redactPII(userPrompt),
    org_id,
    user_id 
  });
  ```
  
- [ ] **Add AI request timeout**:
  ```typescript
  const AI_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  const response = await Promise.race([
    openai.chat.completions.create({...}),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI timeout')), AI_TIMEOUT)
    )
  ]);
  ```
  
- [ ] **Track token usage**:
  ```typescript
  await supabase.from('ai_usage').insert({
    org_id,
    model: 'gpt-4',
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    estimated_cost: calculateCost(usage),
    created_at: new Date(),
  });
  ```

### 5.4 Dependency Management & SBOM
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] **Enable Dependabot**:
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
      open-pull-requests-limit: 5
      groups:
        security:
          patterns:
            - "*"
          update-types:
            - "security"
  ```
  
- [ ] **Generate SBOM in CI**:
  ```bash
  npm install -g @cyclonedx/cyclonedx-npm
  
  # Add to package.json
  "scripts": {
    "security:sbom": "cyclonedx-npm --output-file sbom.json",
    "security:audit": "npm audit --audit-level=moderate"
  }
  ```
  
- [ ] **Add to GitHub Actions**:
  ```yaml
  # .github/workflows/security.yml
  name: Security Audit
  on: [push, pull_request]
  
  jobs:
    security:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Setup Node
          uses: actions/setup-node@v3
        - name: Install dependencies
          run: npm ci
        - name: Run audit
          run: npm audit --audit-level=critical
        - name: Generate SBOM
          run: npx @cyclonedx/cyclonedx-npm --output-file sbom.json
        - name: Upload SBOM
          uses: actions/upload-artifact@v3
          with:
            name: sbom
            path: sbom.json
  ```
  
- [ ] **Configure Renovate** (alternative to Dependabot):
  ```json
  // renovate.json
  {
    "extends": ["config:base"],
    "schedule": ["before 5am on monday"],
    "automerge": true,
    "packageRules": [
      {
        "matchUpdateTypes": ["patch", "minor"],
        "matchDepTypes": ["devDependencies"],
        "automerge": true
      }
    ]
  }
  ```

---

## 🟣 Phase 6: PERFORMANCE OPTIMIZATION (Week 3-4)

### 6.1 Database Optimization
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Add database indexes:
  ```sql
  -- Common query patterns
  CREATE INDEX idx_orders_client_id ON orders(client_id);
  CREATE INDEX idx_orders_status ON orders(status);
  CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
  CREATE INDEX idx_activities_client_created ON activities(client_id, created_at DESC);
  CREATE INDEX idx_properties_addr_hash ON properties(addr_hash);
  CREATE INDEX idx_properties_org_id ON properties(org_id);
  
  -- For text search
  CREATE INDEX idx_clients_company_name_trgm ON clients USING gin (company_name gin_trgm_ops);
  ```
- [ ] Analyze slow queries:
  ```sql
  EXPLAIN ANALYZE
  SELECT * FROM orders WHERE client_id = '...' ORDER BY created_at DESC LIMIT 10;
  ```
- [ ] Configure connection pooling (Supabase handles this)
- [ ] Consider query result caching for expensive operations

### 6.2 Frontend Performance
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Run Lighthouse audit (target 90+ score):
  ```bash
  npx lighthouse http://localhost:9002 --view
  ```
- [ ] Code splitting for large components:
  ```typescript
  // Lazy load heavy features
  const AgentPanel = dynamic(() => import('@/components/agent/agent-panel'), {
    loading: () => <LoadingSpinner />,
    ssr: false,
  });
  
  const MigrationWizard = dynamic(() => import('@/components/migrations/wizard'), {
    loading: () => <LoadingSpinner />,
  });
  ```
- [ ] Optimize images (Next.js Image component)
- [ ] Add loading states for better UX
- [ ] Implement virtualization for long lists:
  ```bash
  npm install react-window
  ```
- [ ] Bundle analysis:
  ```bash
  npm install -D @next/bundle-analyzer
  # Set ANALYZE=true npm run build
  ```

### 6.3 Agent System Performance
**Priority**: 🟢 LOW - DEFER TO v1.1

**Note**: Monitor agent performance in production first, then optimize based on real usage patterns.

---

## 🟤 Phase 7: MONITORING & OBSERVABILITY (Week 4)

### 7.1 Application Monitoring
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Enable Vercel Analytics (built-in)
- [ ] Add custom metrics tracking:
  ```typescript
  // src/lib/metrics.ts
  export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
    // Send to monitoring service
  }
  
  // Usage
  trackMetric('api.response_time', duration, { route: '/api/orders' });
  trackMetric('ai.tokens_used', tokens, { model: 'gpt-4' });
  ```

### 7.2 Logging Strategy
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Standardize log format:
  ```typescript
  // src/lib/logger.ts
  export const logger = {
    info: (message: string, context?: object) => {
      const log = {
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...context,
      };
      
      if (process.env.NODE_ENV === 'production') {
        // Send to logging service
      } else {
        console.log(JSON.stringify(log, null, 2));
      }
    },
    error: (message: string, error: Error, context?: object) => {
      // Similar structure
    },
  };
  ```
- [ ] Remove console.logs in production
- [ ] Set up log aggregation (Vercel Logs, Datadog, or LogRocket)

### 7.3 Observability & Distributed Tracing
**Priority**: 🟡 MEDIUM (Defer full OpenTelemetry to v1.1)

**Immediate Action (Low Effort, High Value)**:
- [ ] **Add correlation IDs** (do this now):
  ```typescript
  // middleware.ts
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';
  
  export function middleware(request: NextRequest) {
    const requestId = crypto.randomUUID();
    const headers = new Headers(request.headers);
    headers.set('x-request-id', requestId);
    
    const response = NextResponse.next({
      request: { headers },
    });
    response.headers.set('x-request-id', requestId);
    
    return response;
  }
  ```
  
- [ ] **Pass correlation IDs through stack**:
  ```typescript
  // In all API calls
  const requestId = request.headers.get('x-request-id');
  
  logger.info('Processing request', { requestId, action: 'create_order' });
  
  // In Supabase calls
  await supabase.from('activities').insert({
    ...data,
    trace_id: requestId,
  });
  
  // In AI calls
  const aiResponse = await openai.chat.completions.create({
    messages: [...],
    user: requestId, // OpenAI's user field for tracking
  });
  ```

**Deferred to v1.1 (After production data available)**:
- [ ] OpenTelemetry setup
- [ ] Distributed tracing
- [ ] APM integration

### 7.4 Disaster Recovery & Business Continuity
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] **Document RTO/RPO**:
  ```markdown
  ## Recovery Objectives
  - RTO (Recovery Time Objective): 4 hours
  - RPO (Recovery Point Objective): 24 hours (daily backups)
  
  ## Backup Schedule
  - Database: Daily automatic backups (Supabase)
  - File storage: Continuous replication (if using S3)
  - Code: Git repository (GitHub)
  ```
  
- [ ] **Create disaster recovery runbook**:
  ```markdown
  # DR Runbook
  
  ## Database Failure
  1. Check Supabase status: status.supabase.com
  2. If outage: Enable maintenance mode
  3. Restore from backup:
     - Go to Supabase Dashboard → Database → Backups
     - Select most recent backup
     - Click "Restore"
  4. Verify with test query
  5. Disable maintenance mode
  
  ## Complete Outage
  1. Check Vercel deployment status
  2. Check Sentry for error patterns
  3. Rollback to previous deployment if needed
  4. Contact on-call engineer
  5. Post incident update to status page
  ```
  
- [ ] **Schedule quarterly DR drills** (after GA):
  - Q1: Database restore drill
  - Q2: Full system recovery drill
  - Q3: Backup verification drill
  - Q4: Incident response simulation

### 7.5 Uptime Monitoring
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, or Better Uptime)
- [ ] Monitor critical endpoints every 5 minutes:
  - Main app: https://app.appraisetrack.com
  - API health: https://app.appraisetrack.com/api/health
  - Database connectivity
- [ ] Set up alerts (email, SMS, Slack)
- [ ] Create public status page for users

---

## ⚪ Phase 8: DOCUMENTATION (Week 4-5)

### 8.1 Code Documentation
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Add JSDoc comments to complex functions
- [ ] Document API routes (consider OpenAPI/Swagger)
- [ ] ADRs for key decisions (see Phase 3.0)
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
- [ ] Verify `npm run build` succeeds (✅ from Phase 0)
- [ ] Set up staging environment on Vercel
- [ ] Configure production environment variables
- [ ] Set up custom domain and SSL
- [ ] Configure CORS policies (if needed)
- [ ] CDN automatically handled by Vercel

### 9.2 Database Migration Strategy
**Priority**: 🟠 HIGH

**Action Items**:
- [ ] Backup production database before migrations
- [ ] Test all Supabase migrations on staging
- [ ] Create rollback plan for each migration
- [ ] Document migration procedure:
  ```bash
  # Staging test
  supabase db push --db-url $STAGING_DB_URL
  
  # Production (after verification)
  supabase db push --db-url $PRODUCTION_DB_URL
  ```
- [ ] Consider zero-downtime migration strategy

### 9.3 Pre-Launch Checklist
**Priority**: 🔴 CRITICAL

**Phase 0 - Build & Code Quality**:
- [ ] Production build succeeds (`npm run build`)
- [ ] Zero TypeScript errors (`npm run typecheck`)
- [ ] All routes load in production mode
- [ ] No console errors in browser
- [ ] No React hydration errors

**Phase 1 - Security Foundation**:
- [ ] Git history purged of secrets (BFG/filter-repo)
- [ ] All API keys rotated (2nd rotation after purge)
- [ ] RLS policies on all tables with org_id
- [ ] RLS tests pass (100% coverage)
- [ ] Rate limiting active on auth + AI routes
- [ ] `.env.example` created, `.env.local` gitignored

**Phase 2-4 - Core Security**:
- [ ] Error tracking configured (Sentry with source maps)
- [ ] Error boundaries in place (root + feature level)
- [ ] Input validation (Zod) on all API routes
- [ ] Security headers configured (CSP, COOP, COEP)
- [ ] Cookie flags set (Secure, HttpOnly, SameSite=strict)
- [ ] File upload validation + CSV injection prevention
- [ ] No dev fallbacks in production code

**Phase 5 - API Security**:
- [ ] Rate limiting on all routes
- [ ] CSRF protection verified (SameSite cookies)
- [ ] API key restrictions configured
- [ ] AI spend limits per org
- [ ] PII redaction in logs
- [ ] Dependabot enabled
- [ ] SBOM generated in CI

**Phase 6-7 - Performance & Monitoring**:
- [ ] Database indexes created
- [ ] Lighthouse score >90
- [ ] Sentry configured and tested
- [ ] Correlation IDs in all logs
- [ ] Uptime monitoring active
- [ ] Status page configured

**Phase 8-9 - Documentation & Deployment**:
- [ ] README updated with setup instructions
- [ ] Environment variables documented
- [ ] ADRs written for key decisions
- [ ] Disaster recovery runbook created
- [ ] Incident response playbook ready
- [ ] Staging environment tested end-to-end
- [ ] Database migrations tested on staging
- [ ] Rollback procedure documented

**Compliance & Legal**:
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance reviewed
- [ ] Data retention policy defined
- [ ] Cookie consent (if EU users)

**Final Verification**:
- [ ] Load testing completed (10x expected traffic)
- [ ] Security audit performed (optional but recommended)
- [ ] Penetration testing (optional)
- [ ] Beta user feedback incorporated
- [ ] Backup restore tested successfully

### 9.4 Security Hardening
**Status**: ✅ Covered in Phase 1 & 4

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
- [ ] Plan regular security audits (quarterly)

### 10.3 Scaling Preparation
**Priority**: 🟢 LOW - DEFER TO v1.1

**Note**: Premature optimization. Monitor actual usage first.

**Action Items** (when needed):
- [ ] Load test at 10x expected traffic
- [ ] Plan database sharding if needed
- [ ] Consider edge caching
- [ ] Optimize expensive operations
- [ ] Plan for multi-region deployment

---

## 🟣 Phase 11: INCIDENT RESPONSE PREPARATION

### 11.1 Incident Response Playbook
**Priority**: 🟠 HIGH  
**Timing**: Before GA launch

**Severity Matrix**:
- [ ] Document incident severity levels:

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| P0 (Critical) | Complete outage, data loss, security breach | Immediate | Database down, data breach |
| P1 (High) | Major feature broken, >10% users affected | <2 hours | AI agent failures, auth issues |
| P2 (Medium) | Feature degraded, some users affected | <24 hours | Slow queries, UI bugs |
| P3 (Low) | Minor issues, workaround available | <1 week | Visual bugs, feature requests |

**Runbooks**:
- [ ] **Create runbooks for common scenarios**:
  
  ```markdown
  ## Runbook: Database Connection Loss
  1. Check Supabase status: status.supabase.com
  2. Verify connection string in environment variables
  3. Check connection pool exhaustion
  4. Restart application if needed
  5. Monitor recovery
  
  ## Runbook: AI API Outage
  1. Check OpenAI/Anthropic status pages
  2. Enable circuit breaker (feature flag)
  3. Display maintenance message to users
  4. Queue requests for retry
  5. Monitor for service restoration
  
  ## Runbook: High Error Rate (>1%)
  1. Check Sentry dashboard
  2. Identify error pattern
  3. Check recent deployments
  4. Rollback if recent deployment caused it
  5. Apply hotfix if needed
  6. Post-mortem after resolution
  
  ## Runbook: Performance Degradation
  1. Check Vercel Analytics
  2. Check database query performance
  3. Check AI API latency
  4. Scale resources if needed
  5. Identify and optimize slow queries
  ```

**On-Call Setup** (if team >1 person):
- [ ] Set up PagerDuty, OpsGenie, or similar
- [ ] Define on-call rotation schedule
- [ ] Document escalation procedures

**Post-Mortem Template**:
- [ ] Create template:
  ```markdown
  # Incident Post-Mortem: [Title]
  
  **Date**: YYYY-MM-DD
  **Severity**: P0/P1/P2/P3
  **Duration**: X hours
  **Impact**: X users affected
  **Reporter**: [Name]
  
  ## Timeline
  - HH:MM - Incident detected
  - HH:MM - Response initiated
  - HH:MM - Root cause identified
  - HH:MM - Fix deployed
  - HH:MM - Incident resolved
  - HH:MM - Post-mortem completed
  
  ## Root Cause
  What went wrong?
  
  ## Resolution
  How was it fixed?
  
  ## Action Items
  - [ ] Prevent recurrence (add monitoring, fix bug, etc.)
  - [ ] Improve detection (add alerts)
  - [ ] Update runbook
  - [ ] Add tests
  
  ## Lessons Learned
  What did we learn? What would we do differently?
  ```

**Communication Plan**:
- [ ] Define communication channels:
  ```markdown
  ## Incident Communication
  - Internal: Slack #incidents channel
  - Users: Status page + email (for P0/P1)
  - Stakeholders: Email update every 2 hours for P0/P1
  - Public: Status page updates
  ```

### 11.2 Status Page
**Priority**: 🟡 MEDIUM

**Action Items**:
- [ ] Set up status page (Statuspage.io, Better Uptime, or self-hosted)
- [ ] Monitor critical services:
  - Web application (uptime check)
  - API endpoints
  - Database connectivity
  - AI services
- [ ] Configure automated updates from monitoring
- [ ] Add subscriber notifications
- [ ] Test incident workflow

---

## 📋 UPDATED PRIORITIZED ACTION PLAN

### **WEEK 0 (PRE-FLIGHT - DO BEFORE ANYTHING ELSE)**
**Critical Blockers** (2-3 days):
1. □ Fix production build errors (2-4 hours)
2. □ Fix all TypeScript errors (4-6 hours)
3. □ Clear Next.js cache issues (10 minutes)
4. □ Test production mode works (30 minutes)

### **WEEK 1 (CRITICAL SECURITY)**
**Day 1** (8 hours):
1. □ Purge secrets from git history (BFG/filter-repo) - 2 hours
2. □ Force push cleaned history - 30 min
3. □ Rotate ALL API keys (2nd rotation) - 1 hour
4. □ Create .env.example - 15 min
5. □ Add secret scanning to CI - 30 min
6. □ Audit tables for org_id - 2 hours
7. □ Start RLS policy implementation - 2 hours

**Day 2-3** (16 hours):
8. □ Complete RLS policies for all tables - 4 hours
9. □ Write comprehensive RLS test suite - 6 hours
10. □ Implement rate limiting (auth + AI routes) - 3 hours
11. □ Add cookie security settings - 1 hour
12. □ Add correlation IDs to middleware - 2 hours

**Day 4** (8 hours):
13. □ Add error boundaries (root + feature level) - 2 hours
14. □ Set up Sentry with source maps - 2 hours
15. □ Remove dev fallbacks from code - 2 hours
16. □ Add environment variable validation - 1 hour
17. □ Test everything works end-to-end - 1 hour

**Day 5** (8 hours):
18. □ ESLint + Prettier setup - 1 hour
19. □ Fix linting issues - 2 hours
20. □ Write Architecture ADRs - 2 hours
21. □ Buffer for issues - 3 hours

### **WEEK 2 (SECURITY HARDENING)**
1. □ CSP + isolation headers - 4 hours
2. □ Input validation (Zod) on all routes - 8 hours
3. □ File upload validation + CSV injection prevention - 4 hours
4. □ Enable Dependabot + SBOM generation - 2 hours
5. □ AI PII redaction implementation - 4 hours
6. □ Database indexes - 2 hours
7. □ Rate limiting on remaining routes - 4 hours
8. □ Testing and verification - 12 hours

### **WEEK 3 (TESTING & MONITORING)**
1. □ Set up Vitest + React Testing Library - 4 hours
2. □ Write critical unit tests - 12 hours
   - Agent system tests - 6 hours
   - Business logic tests - 4 hours
   - Utility tests - 2 hours
3. □ Set up Playwright for E2E - 2 hours
4. □ Write E2E tests (auth, orders, migration) - 8 hours
5. □ Verify monitoring (Sentry, Vercel) - 2 hours
6. □ Set up uptime monitoring - 2 hours
7. □ Buffer for issues - 10 hours

### **WEEK 4 (PERFORMANCE & DOCUMENTATION)**
1. □ Bundle analysis and optimization - 6 hours
2. □ Lighthouse audit (target 90+) - 4 hours
3. □ Code splitting for heavy features - 4 hours
4. □ Write user documentation - 6 hours
5. □ Create incident response playbook - 4 hours
6. □ Write DR runbook - 2 hours
7. □ Document RTO/RPO - 1 hour
8. □ Developer documentation - 6 hours
9. □ Buffer for issues - 7 hours

### **WEEK 5 (STAGING & FINAL PREP)**
1. □ Set up staging environment - 4 hours
2. □ Test all migrations on staging - 6 hours
3. □ Run complete pre-launch checklist - 8 hours
4. □ Load testing - 6 hours
5. □ Security audit (if budget allows) - 8-16 hours
6. □ Beta user testing - ongoing
7. □ Fix issues found in testing - 8 hours

### **WEEK 6 (LAUNCH)**
1. □ Final security review - 4 hours
2. □ Deploy to production - 2 hours
3. □ Monitor closely for first 48 hours - ongoing
4. □ Gradual rollout (10% → 50% → 100%) - 1 week
5. □ Post-launch optimizations - ongoing

### **TIMELINE ADJUSTMENT**
**Realistic estimates**:
- **Solo developer**: 8-10 weeks (40-50 hours/week)
- **2 developers**: 6-7 weeks (can parallelize work)
- **3+ developers**: 5-6 weeks (as originally estimated)

---

## 🎯 UPDATED SUCCESS METRICS

### **Before Production (Must-Have)**
- □ Production build succeeds (`npm run build`)
- □ 0 TypeScript errors (`npm run typecheck`)
- □ Git history clean (no secrets)
- □ RLS tests pass (100% cross-org isolation verified)
- □ Rate limiting active on critical routes (5/min AI, 10/min auth)
- □ 70%+ test coverage on critical paths
- □ Lighthouse score 90+
- □ 0 high/critical npm vulnerabilities
- □ <500ms average API response time (in staging)
- □ Error rate <0.1% in staging
- □ CSP configured and tested
- □ Correlation IDs in all logs
- □ Sentry capturing errors correctly

### **Post-Launch (Month 1)**
- □ 99.9% uptime
- □ <2s average page load time
- □ 0 critical production bugs
- □ <$500/month AI costs (adjust based on usage)
- □ Positive user feedback (NPS >50)
- □ No security incidents
- □ No cross-org data leakage incidents
- □ Rate limits preventing abuse (0 DDoS attempts successful)
- □ <1% error rate
- □ No P0 incidents >4 hours

### **Post-Launch (Month 3)**
- □ All ADRs documented
- □ DR drill completed successfully
- □ Backup restore verified (test restore in <1 hour)
- □ Incident response tested (mock P0 incident)
- □ Documentation complete and up-to-date
- □ Test coverage >80%
- □ All dependencies up-to-date
- □ No outstanding security vulnerabilities

---

## 📞 SUPPORT & ESCALATION

**Critical Issues (P0)**:
- Database down
- Security breach / data leak
- Complete service outage
- **Response Time**: Immediate (< 15 minutes)
- **Notification**: PagerDuty alert, SMS, phone call

**High Priority (P1)**:
- API errors affecting >10% of users
- Data loss or corruption
- AI service complete failures
- Authentication broken
- **Response Time**: <2 hours
- **Notification**: PagerDuty alert, email

**Medium Priority (P2)**:
- Feature bugs affecting some users
- Performance degradation
- Intermittent errors
- **Response Time**: <24 hours
- **Notification**: Email, Slack

**Low Priority (P3)**:
- UI issues
- Enhancement requests
- Documentation issues
- **Response Time**: <1 week
- **Notification**: Ticket system

---

## 💰 ESTIMATED COSTS

### **Monthly Operational Costs**
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Sentry (10k events): $26/month
- Upstash Redis (rate limiting): $10/month
- AI APIs (estimated): $200-500/month (varies by usage)
- Uptime monitoring: $10/month
- Status page: $15/month
- **Total**: ~$305-605/month

### **One-Time Setup**
- Security audit: $2,000-5,000 (optional, recommended)
- Penetration testing: $1,500-3,000 (optional)
- Load testing service: $100-500 (optional)
- **Total**: $3,600-8,500 (if doing all audits)

### **Cost Optimization Tips**
- Start with Supabase Free tier if < 500MB DB
- Use Vercel Hobby tier for staging ($0)
- OpenAI gpt-3.5-turbo for less critical tasks
- Enable AI response caching
- Set per-org spend limits

---

## 📚 REFERENCES & RESOURCES

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Content Security Policy Reference](https://content-security-policy.com/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW (Mock Service Worker)](https://mswjs.io/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

### Monitoring & Observability
- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [OpenTelemetry](https://opentelemetry.io/)
- [Better Uptime](https://betteruptime.com/)

### Dependency Management
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Renovate Documentation](https://docs.renovatebot.com/)
- [CycloneDX](https://cyclonedx.org/)

### Best Practices
- [12-Factor App](https://12factor.net/)
- [Google SRE Book](https://sre.google/books/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 🎉 CONCLUSION

This plan will take your application from its current state (broken build) to production-ready in **8-10 weeks** with proper execution as a solo developer, or **5-6 weeks** with a team.

**Critical Path**:
1. **Week 0**: Fix build → Fix TypeScript → Verify works
2. **Week 1**: Security foundation (secrets, RLS, rate limiting)
3. **Week 2-3**: Testing + hardening
4. **Week 4-5**: Performance + staging
5. **Week 6**: Launch 🚀

**Next Steps**:
1. Review and accept this plan
2. Begin with Phase 0 (fix build errors)
3. Work sequentially through phases
4. Track progress with checkboxes
5. Adjust timeline as needed

**Success Criteria**:
- All checkboxes in Pre-Launch Checklist completed
- All Success Metrics achieved
- Beta users successfully testing
- Team confident in production readiness

---

**Last Updated**: October 22, 2025  
**Version**: 2.0  
**Status**: Ready for Execution

Good luck! 🚀
