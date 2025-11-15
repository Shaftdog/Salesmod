---
status: legacy
last_verified: 2025-11-15
updated_by: Claude Code
---

# ✅ Phase 1: Critical Security Fixes Checklist

**Goal**: Secure the application foundation before production deployment  
**Time**: 5-7 days (Week 1)  
**Status**: 🔴 Not Started  
**Priority**: 🔴 CRITICAL - URGENT

---

## 📋 Overview

Phase 1 focuses on critical security issues that must be fixed before any production deployment. These are non-negotiable security requirements.

**Prerequisites**:
- ✅ Phase 0 complete (build works, 0 TypeScript errors)

---

## 🔥 Part 1: Git History Purge & API Key Rotation (Day 1 - 3 hours)

### **⚠️ DO THIS FIRST - BLOCKING**

**Current Risk**: Exposed API keys in git history are permanently compromised

### Step 1.1: Purge Git History (1 hour)

- [ ] **Backup current repository**
  ```bash
  cd /Users/sherrardhaugabrooks/Documents/Salesmod
  cd ..
  cp -r Salesmod Salesmod-backup-$(date +%Y%m%d)
  cd Salesmod
  ```

- [ ] **Install BFG Repo-Cleaner**
  ```bash
  brew install bfg
  ```

- [ ] **Create patterns file**
  ```bash
  cat > secrets-to-remove.txt <<EOF
  sk-proj-
  sk-ant-
  re_
  AIza
  EOF
  ```

- [ ] **Run BFG to purge secrets**
  ```bash
  # Preview what will be removed
  git log --all -S 'sk-proj-' --source --all
  
  # Delete .env files from history
  bfg --delete-files .env.local
  
  # Replace API keys with REDACTED
  bfg --replace-text secrets-to-remove.txt
  ```

- [ ] **Clean up repository**
  ```bash
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [ ] **Force push cleaned history**
  ```bash
  git push origin --force --all
  git push origin --force --tags
  ```

- [ ] **Verify secrets removed**
  ```bash
  # Should return empty or only show REDACTED
  git log --all -S 'sk-proj-' --source --all
  git log --all --full-history -- .env.local
  ```

**Completion Time**: _________

---

### Step 1.2: Rotate ALL API Keys (30 minutes)

**⚠️ IMPORTANT**: Do this AFTER purging git history

- [ ] **OpenAI API Key**
  - Go to: https://platform.openai.com/api-keys
  - Delete old key
  - Create new key
  - Update `.env.local`: `OPENAI_API_KEY=sk-proj-NEW_KEY`

- [ ] **Anthropic API Key**
  - Go to: https://console.anthropic.com/settings/keys
  - Delete old key
  - Create new key
  - Update `.env.local`: `ANTHROPIC_API_KEY=sk-ant-NEW_KEY`

- [ ] **Resend API Key**
  - Go to: https://resend.com/settings
  - Delete old key
  - Create new key
  - Update `.env.local`: `RESEND_API_KEY=re_NEW_KEY`

- [ ] **Google Maps API Key**
  - Go to: https://console.cloud.google.com/apis/credentials
  - Delete old key
  - Create new key with restrictions
  - Update `.env.local`: `GOOGLE_MAPS_API_KEY=AIza_NEW_KEY`

- [ ] **Supabase Service Role Key**
  - Go to: https://zqhenxhgcjxslpfezybm.supabase.co
  - Project Settings → API → Generate new service role key
  - Update `.env.local`: `SUPABASE_SERVICE_ROLE_KEY=NEW_KEY`

**Completion Time**: _________

---

### Step 1.3: Create .env.example (15 minutes)

- [ ] **Create template file**
  ```bash
  cat > .env.example <<'EOF'
  # Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  
  # AI Provider Keys
  OPENAI_API_KEY=sk-proj-your_openai_key_here
  ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
  
  # Email Service
  RESEND_API_KEY=re_your_resend_key_here
  
  # Maps
  GOOGLE_MAPS_API_KEY=your_maps_key_here
  
  # Optional: For rate limiting
  UPSTASH_REDIS_REST_URL=your_redis_url_here
  UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
  EOF
  ```

- [ ] **Verify .gitignore**
  ```bash
  grep -E "\.env$|\.env\.local" .gitignore
  # Should show .env files are ignored
  ```

- [ ] **Test that .env.local is ignored**
  ```bash
  git check-ignore .env.local
  # Should output: .env.local
  ```

- [ ] **Commit .env.example**
  ```bash
  git add .env.example
  git commit -m "docs: add .env.example template"
  git push
  ```

**Completion Time**: _________

---

### Step 1.4: Add Secret Scanning to CI (15 minutes)

- [ ] **Install secretlint**
  ```bash
  npm install -D @secretlint/secretlint-rule-preset-recommend @secretlint/quick-start
  ```

- [ ] **Create .secretlintrc.json**
  ```bash
  npx secretlint --init
  ```

- [ ] **Add to package.json**
  ```json
  "scripts": {
    "security:scan": "secretlint **/*"
  }
  ```

- [ ] **Test it works**
  ```bash
  npm run security:scan
  ```

- [ ] **Add to pre-commit hook** (optional)
  ```bash
  # If using husky
  npx husky add .husky/pre-commit "npm run security:scan"
  ```

**Completion Time**: _________

---

## 🔒 Part 2: Row Level Security (RLS) Implementation (Day 2-3 - 12 hours)

### Step 2.1: Audit Tables for org_id (2 hours)

- [ ] **Check current org_id coverage**
  ```sql
  -- Run in Supabase SQL Editor
  SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns 
  WHERE column_name = 'org_id' 
    AND table_schema = 'public'
  ORDER BY table_name;
  ```

- [ ] **List tables that need org_id**
  - [ ] Core tables:
    - [ ] `properties` ✓ (check if exists)
    - [ ] `orders` ✓ (check if exists)
    - [ ] `clients` ✓ (check if exists)
    - [ ] `contacts` ✓ (check if exists)
  - [ ] Activity tables:
    - [ ] `activities`
    - [ ] `tasks`
    - [ ] `deals`
    - [ ] `cases`
  - [ ] Feature tables:
    - [ ] `migrations`
    - [ ] `kanban_cards`
    - [ ] `goals`
  - [ ] AI tables:
    - [ ] `chat_messages`
    - [ ] `embeddings`
    - [ ] `research_results`

- [ ] **Document tables missing org_id**
  ```
  Tables needing org_id:
  1. _____________________
  2. _____________________
  3. _____________________
  ```

**Completion Time**: _________

---

### Step 2.2: Add org_id to Missing Tables (2 hours)

- [ ] **Create migration file**
  ```bash
  cd /Users/sherrardhaugabrooks/Documents/Salesmod
  # Create new migration
  touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_org_id_columns.sql
  ```

- [ ] **Add org_id columns** (edit the migration file)
  ```sql
  -- Add org_id to tables that need it
  ALTER TABLE activities 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
  
  ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id);
  
  -- Repeat for all tables from Step 2.1
  
  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_activities_org_id ON activities(org_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_org_id ON tasks(org_id);
  ```

- [ ] **Run migration in Supabase Dashboard**
  - Open SQL Editor
  - Paste migration contents
  - Execute

- [ ] **Verify columns added**
  ```sql
  -- Check all tables now have org_id
  SELECT table_name, column_name
  FROM information_schema.columns 
  WHERE column_name = 'org_id' 
    AND table_schema = 'public'
  ORDER BY table_name;
  ```

**Completion Time**: _________

---

### Step 2.3: Create RLS Policies (4 hours)

- [ ] **Enable RLS on all tables**
  ```sql
  -- Run in Supabase SQL Editor
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
  ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
  ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
  ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
  -- Add others as needed
  ```

- [ ] **Create RLS policy template file**
  ```bash
  touch supabase/migrations/$(date +%Y%m%d%H%M%S)_rls_policies.sql
  ```

- [ ] **Add SELECT policies**
  ```sql
  -- For each table, add SELECT policy
  CREATE POLICY "org_isolation_select_properties" ON properties
    FOR SELECT 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  CREATE POLICY "org_isolation_select_orders" ON orders
    FOR SELECT 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- Repeat for all tables
  ```

- [ ] **Add INSERT policies**
  ```sql
  CREATE POLICY "org_isolation_insert_properties" ON properties
    FOR INSERT 
    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  CREATE POLICY "org_isolation_insert_orders" ON orders
    FOR INSERT 
    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- Repeat for all tables
  ```

- [ ] **Add UPDATE policies**
  ```sql
  CREATE POLICY "org_isolation_update_properties" ON properties
    FOR UPDATE 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- Repeat for all tables
  ```

- [ ] **Add DELETE policies**
  ```sql
  CREATE POLICY "org_isolation_delete_properties" ON properties
    FOR DELETE 
    USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
  
  -- Repeat for all tables
  ```

- [ ] **Run RLS policies in Supabase Dashboard**

- [ ] **Verify policies created**
  ```sql
  SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
  FROM pg_policies 
  WHERE schemaname = 'public'
  ORDER BY tablename, cmd;
  ```

**Completion Time**: _________

---

### Step 2.4: Write RLS Test Suite (4 hours)

- [ ] **Create test directory**
  ```bash
  mkdir -p tests/rls
  touch tests/rls/rls-policies.test.ts
  ```

- [ ] **Install test dependencies** (if not already installed)
  ```bash
  npm install -D vitest @vitejs/plugin-react
  ```

- [ ] **Write RLS test framework**
  ```typescript
  // tests/rls/rls-policies.test.ts
  import { describe, it, expect, beforeAll } from 'vitest';
  import { createClient } from '@supabase/supabase-js';
  
  describe('RLS Policies - Cross-Org Isolation', () => {
    let orgAClient: any;
    let orgBClient: any;
    
    beforeAll(async () => {
      // Setup test clients for different orgs
      // TODO: Implement test user creation
    });
    
    it('prevents Org A from reading Org B properties', async () => {
      // TODO: Implement test
    });
    
    it('prevents Org A from updating Org B orders', async () => {
      // TODO: Implement test
    });
    
    it('prevents Org A from deleting Org B clients', async () => {
      // TODO: Implement test
    });
  });
  ```

- [ ] **Write test for each table** (properties, orders, clients, contacts, etc.)

- [ ] **Add test script to package.json**
  ```json
  "scripts": {
    "test:rls": "vitest run tests/rls"
  }
  ```

- [ ] **Run RLS tests**
  ```bash
  npm run test:rls
  ```

- [ ] **Verify all tests pass**

**Completion Time**: _________

---

## ⚡ Part 3: Rate Limiting Implementation (Day 3-4 - 6 hours)

### Step 3.1: Setup Rate Limiting Infrastructure (2 hours)

- [ ] **Choose rate limiting solution**
  - [ ] Option A: Upstash Redis (recommended for Vercel)
  - [ ] Option B: Vercel KV (if using Vercel)
  - [ ] Option C: In-memory (development only)

- [ ] **Install Upstash dependencies**
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```

- [ ] **Create Upstash Redis account**
  - Go to: https://upstash.com/
  - Create database
  - Get credentials

- [ ] **Add to .env.local**
  ```bash
  UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
  UPSTASH_REDIS_REST_TOKEN=your_token_here
  ```

- [ ] **Update .env.example**
  ```bash
  # Add to .env.example
  UPSTASH_REDIS_REST_URL=your_redis_url_here
  UPSTASH_REDIS_REST_TOKEN=your_redis_token_here
  ```

**Completion Time**: _________

---

### Step 3.2: Create Rate Limit Middleware (2 hours)

- [ ] **Create rate limit utility**
  ```bash
  touch src/lib/rate-limit.ts
  ```

- [ ] **Implement rate limiters**
  ```typescript
  // src/lib/rate-limit.ts
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';
  
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
  ```

- [ ] **Create helper function**
  ```typescript
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

**Completion Time**: _________

---

### Step 3.3: Apply Rate Limiting to Routes (2 hours)

- [ ] **Apply to AI routes** (`/api/agent/*`)
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

- [ ] **Apply to auth routes** (`/api/auth/*`)
  - [ ] Login endpoint
  - [ ] Signup endpoint
  - [ ] Password reset endpoint

- [ ] **Apply to migration routes** (`/api/migrations/*`)
  - [ ] Migration run endpoint
  - [ ] Migration upload endpoint

- [ ] **Apply to general API routes** (100 req/min)
  - [ ] Properties CRUD
  - [ ] Orders CRUD
  - [ ] Clients CRUD

- [ ] **Test rate limiting**
  ```bash
  # Install testing tool
  npm install -g autocannon
  
  # Test AI endpoint (should block after 5 requests)
  autocannon -c 10 -d 5 http://localhost:9002/api/agent/run
  ```

**Completion Time**: _________

---

## 🔐 Part 4: Environment Variable Validation (Day 4 - 2 hours)

### Step 4.1: Add Runtime Validation (1 hour)

- [ ] **Create env validation file**
  ```bash
  touch src/lib/env.ts
  ```

- [ ] **Implement Zod schema**
  ```typescript
  import { z } from 'zod';
  
  const envSchema = z.object({
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().startsWith('sk-proj-'),
    ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-'),
    RESEND_API_KEY: z.string().startsWith('re_'),
    GOOGLE_MAPS_API_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  });
  
  export const env = envSchema.parse(process.env);
  ```

- [ ] **Test validation**
  ```bash
  # Should fail if any required env var is missing
  npm run dev
  ```

- [ ] **Import env in key files** (replace process.env usage)

**Completion Time**: _________

---

### Step 4.2: Document Environment Variables (1 hour)

- [ ] **Update README with env var documentation**
  ```markdown
  ## Environment Variables
  
  Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
  - ...
  ```

- [ ] **Create setup instructions**

- [ ] **Test new developer onboarding**
  - [ ] Clone repo
  - [ ] Copy .env.example to .env.local
  - [ ] Fill in values
  - [ ] Run `npm run dev`

**Completion Time**: _________

---

## ✅ Phase 1 Complete!

Once all checkboxes above are checked:

- [ ] **Run security audit**
  ```bash
  npm audit
  npm run security:scan
  ```

- [ ] **Test RLS policies**
  ```bash
  npm run test:rls
  ```

- [ ] **Verify rate limiting works**
  ```bash
  # Test each endpoint with load
  ```

- [ ] **Commit your changes**
  ```bash
  git add .
  git commit -m "feat: Phase 1 - Critical security fixes complete

  - Purged secrets from git history with BFG
  - Rotated all API keys (OpenAI, Anthropic, Resend, Google Maps, Supabase)
  - Implemented RLS policies on all tables with org_id isolation
  - Added comprehensive RLS test suite
  - Implemented rate limiting (5/min AI, 10/min auth, 100/min API)
  - Added environment variable validation with Zod
  - Created .env.example template
  - Added secret scanning to CI
  
  Security improvements:
  ✅ No secrets in git history
  ✅ All API keys fresh and secure
  ✅ Complete tenant isolation via RLS
  ✅ Rate limiting prevents abuse
  ✅ Environment validation prevents misconfig"
  
  git push
  ```

- [ ] **Update status in this file**
  - Change status from "🔴 Not Started" to "✅ Complete"
  - Add completion date below

- [ ] **Move to Phase 2**
  - Open `PRODUCTION-READINESS-PLAN.md`
  - Begin Phase 2: Type Safety & Code Quality

---

## 📊 Progress Tracking

**Started**: ___/___/2025 at ___:___ am/pm  
**Completed**: ___/___/2025 at ___:___ am/pm  
**Total Time**: _____ hours

**Blockers Encountered**:
- [ ] None
- [ ] Git history purge issues (describe: _________________)
- [ ] RLS policy issues (describe: _________________)
- [ ] Rate limiting issues (describe: _________________)
- [ ] Other (describe: _________________)

**Notes**:
```
[Add any notes, learnings, or issues you encountered]
```

---

## 🎉 Success Criteria

After completing Phase 1, you should have:

1. ✅ Clean git history (no secrets)
2. ✅ All API keys rotated and secure
3. ✅ RLS enabled on all tables
4. ✅ RLS tests passing (100% coverage)
5. ✅ Rate limiting active on critical routes
6. ✅ Environment validation working
7. ✅ .env.example documented
8. ✅ Secret scanning in CI

**Next up**: Phase 2 - Type Safety & Code Quality

See `PRODUCTION-READINESS-PLAN.md` for Phase 2 details.

---

**Last Updated**: October 22, 2025  
**Version**: 1.0

