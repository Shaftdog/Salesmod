# 🚀 Production Readiness - Quick Start Guide

**⚠️ START HERE if you're ready to begin the production readiness journey**

---

## 📍 Current Status

- ❌ **Production build**: BROKEN (Next.js 15 route params)
- ❌ **TypeScript errors**: 31 errors
- ❌ **Dev server**: Working but with cache errors
- ❌ **Git history**: Contains exposed secrets
- ❓ **RLS policies**: Exist but not tested
- ❓ **Rate limiting**: Not implemented

**YOU ARE HERE**: Need to complete Phase 0 before starting main plan

---

## ⏱️ Today's Goals (Phase 0 - Critical Blockers)

### Task 1: Fix Production Build (2-4 hours)

**Problem**: Next.js 15 changed how params work in API routes

**Fix**:
```bash
cd /Users/sherrardhaugabrooks/Documents/Salesmod

# 1. Find all dynamic route handlers
find src/app/api -name "route.ts" | xargs grep -l "params.*:"

# 2. For each file, change params from object to Promise
# Example: src/app/api/properties/[id]/route.ts
```

**Before (Next.js 14)**:
```typescript
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;  // Direct access
  // ...
}
```

**After (Next.js 15)**:
```typescript
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Await the promise
  // ...
}
```

**Files to fix**:
- `src/app/api/properties/[id]/route.ts`
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/clients/[id]/route.ts`
- Any other `[id]` or `[slug]` routes

**Verify**:
```bash
npm run build
# Must exit with code 0 (no errors)
```

---

### Task 2: Fix TypeScript Errors (4-6 hours)

**Quick wins** (30 minutes):

1. **Fix tool parameters** in `src/lib/agent/tools.ts`:
```typescript
// Around lines 20, 134, 189, 218, 256
// Change from:
execute: async ({ query }) => { ... }

// To:
execute: async ({ query }: { query: string }) => { ... }
```

2. **Fix ValidationStatus** in `src/components/orders/property-chip.tsx`:
```typescript
// Add at top of file
type ValidationStatus = 'pending' | 'verified' | 'partial' | 'unverified';

// Then use:
const status: ValidationStatus | undefined = property.validation_status;
```

3. **Fix onConflict** in `src/app/api/email/webhook/route.ts`:
```typescript
// Replace this pattern:
.insert({ email, reason })
.onConflict('email')

// With:
.upsert({ email, reason, updated_at: new Date().toISOString() }, 
  { onConflict: 'email' })
```

**Verify**:
```bash
npm run typecheck
# Must exit with code 0
```

---

### Task 3: Clear Cache & Test (30 minutes)

```bash
# Stop dev server (Ctrl+C)

# Clear all caches
rm -rf .next
rm -rf .turbopack
rm -rf node_modules/.cache

# Restart dev server
npm run dev

# In another terminal, test production build
npm run build
npm start
# Visit http://localhost:3000

# Test key routes:
# - /
# - /dashboard
# - /orders
# - /properties
# - /contacts
```

**Success criteria**:
- ✅ No build errors
- ✅ All routes load
- ✅ No console errors
- ✅ No ENOENT errors

---

## 📅 Week 1 Roadmap (After Phase 0)

### Monday (8 hours)
- [ ] **9am-11am**: Purge git history with BFG
  ```bash
  brew install bfg
  cat > passwords.txt <<EOF
  sk-proj-
  sk-ant-
  re_
  AIza
  EOF
  bfg --delete-files .env.local
  bfg --replace-text passwords.txt
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  git push origin --force --all
  ```

- [ ] **11am-12pm**: Rotate ALL API keys (after purge!)
  - OpenAI, Anthropic, Resend, Google Maps, Supabase
  
- [ ] **1pm-2pm**: Create .env.example, add secret scanning

- [ ] **2pm-5pm**: Audit tables for org_id
  ```sql
  SELECT table_name, column_name
  FROM information_schema.columns 
  WHERE column_name = 'org_id' 
    AND table_schema = 'public';
  ```

### Tuesday-Wednesday (16 hours)
- [ ] Write RLS policies for all tables
- [ ] Write RLS test suite
- [ ] Implement rate limiting (AI + auth routes)
- [ ] Add correlation IDs to middleware

### Thursday (8 hours)
- [ ] Add error boundaries (3 locations)
- [ ] Set up Sentry
- [ ] Remove dev fallbacks
- [ ] Add env variable validation

### Friday (8 hours)
- [ ] ESLint + Prettier setup
- [ ] Write Architecture ADRs
- [ ] Buffer for issues
- [ ] Weekly review

---

## 🎯 Critical Path (Next 5 Steps)

**These 5 things make the app "safe to ship":**

1. ✅ **Fix build** (Phase 0) - TODAY
2. □ **Purge secrets + rotate keys** (Week 1 Day 1)
3. □ **RLS policies + tests** (Week 1 Day 2-3)
4. □ **Error tracking + rate limits** (Week 1 Day 3-4)
5. □ **Pre-launch checklist** (Week 5)

---

## 🆘 Quick Reference Commands

```bash
# Build & Type Check
npm run build          # Production build
npm run typecheck      # Check TypeScript
npm run lint           # Check linting

# Development
npm run dev            # Dev server on :9002
npm start              # Production server (after build)

# Testing (after setup)
npm test               # Run unit tests
npm run test:e2e       # Run E2E tests
npm run test:rls       # Test RLS policies

# Security
npm audit              # Check vulnerabilities
git log --all -S 'sk-proj-'  # Check for API keys in history

# Database
npx supabase db pull   # Pull latest schema
npx supabase db push   # Push migrations
```

---

## 📞 Getting Help

**If you're stuck on Phase 0**:
1. Read the detailed Phase 0 section in PRODUCTION-READINESS-PLAN.md
2. Check Next.js 15 migration guide: https://nextjs.org/docs/app/building-your-application/upgrading/version-15
3. Search for error messages in GitHub issues

**If you need to skip something temporarily**:
- ✅ Can skip: Documentation, E2E tests, performance optimization
- ❌ Cannot skip: Phase 0, git purge, RLS testing, rate limiting

**Progress tracking**:
- Use checkboxes in PRODUCTION-READINESS-PLAN.md
- Update this file with ✅ when done
- Create BLOCKERS.md if you hit issues

---

## ✅ Today's Success Criteria

By end of today, you should have:
- [x] Read this quick start guide
- [ ] Fixed production build (npm run build works)
- [ ] Fixed TypeScript errors (npm run typecheck passes)
- [ ] Cleared caches and verified dev server works
- [ ] Committed fixes to git
- [ ] Ready to start Week 1 (git purge + key rotation)

**Time estimate**: 6-10 hours for Phase 0

---

## 🚀 After Phase 0

Once Phase 0 is complete:
1. Read Week 1 breakdown in PRODUCTION-READINESS-PLAN.md
2. Start with git history purge (DO NOT skip this!)
3. Follow the daily checklist
4. Track progress with checkboxes
5. Adjust timeline as needed

**You've got this!** 💪

The hard part is starting. Phase 0 will take one good work day. After that, you're on the path to production readiness.

---

**Last Updated**: October 22, 2025  
**Next Review**: After completing Phase 0


