# Debugger Specialist Handoff: Product Module Testing Blocker

**Status**: Testing Blocked by Authentication
**Urgency**: High - Zero tests can run
**Assigned To**: Debugger Specialist Agent
**Date**: 2025-11-16

---

## Problem Summary

Automated testing of the Product Module is **completely blocked** due to authentication requirements. All 24 Playwright tests fail with `ERR_ABORTED` when trying to navigate to `/sales/products`.

---

## Root Cause

The application enforces authentication, but the test suite lacks auth setup. When Playwright attempts to navigate to `/sales/products`:

1. Middleware calls `updateSession()` from `src/lib/supabase/middleware.ts`
2. No valid Supabase session exists (no auth cookies)
3. The navigation is aborted or redirected
4. Tests cannot reach the product page

---

## Required Fixes

### Fix 1: Implement Playwright Authentication Setup

**Priority**: CRITICAL
**Estimated Effort**: 30-60 minutes

Create authentication setup for Playwright tests.

**Implementation Steps**:

1. **Create auth setup file** (`playwright/auth.setup.ts`):
```typescript
import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Option A: Login via UI
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_USER_EMAIL!);
  await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|sales/);

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
```

2. **Update playwright.config.ts**:
```typescript
export default defineConfig({
  // Add projects section
  projects: [
    // Setup project runs first
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Main tests use authenticated state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

3. **Create test environment variables** (`.env.test`):
```env
PLAYWRIGHT_TEST_USER_EMAIL=test@example.com
PLAYWRIGHT_TEST_USER_PASSWORD=test-password-123
```

4. **Create test user in Supabase**:
```bash
# Via Supabase local instance
npm run db:start

# Then use Supabase Studio or SQL:
# http://localhost:54323
```

Or create via API/SQL:
```sql
-- Create test user
INSERT INTO auth.users (email, encrypted_password)
VALUES ('test@example.com', crypt('test-password-123', gen_salt('bf')));
```

### Fix 2: Alternative - Mock Authentication (Faster, Less Realistic)

**Priority**: MEDIUM (if Fix 1 is too complex)

```typescript
// In products.spec.ts beforeEach
test.beforeEach(async ({ page, context }) => {
  // Mock authentication
  await context.addCookies([
    {
      name: 'sb-access-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Mock API responses
  await page.route('**/auth/v1/user', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
      }),
    });
  });

  await page.goto('/sales/products');
});
```

---

## Fix 3: Ensure Database is Set Up

**Priority**: HIGH
**Blocker**: Requires Docker Desktop

The test environment needs:

1. **Docker Desktop running**
2. **Supabase local instance started**:
   ```bash
   npm run db:start
   ```

3. **Migrations applied**:
   ```bash
   npm run db:push
   ```

4. **Test data seeded**:
   ```bash
   node scripts/seed-initial-products.ts
   ```

**Current Status**:
- Docker Desktop: NOT RUNNING
- Database: UNKNOWN
- Migrations: NOT APPLIED
- Seed Data: NOT PRESENT

**Error Encountered**:
```
failed to inspect service: error during connect:
Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.51/containers/supabase_db_Salesmod/json":
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

**Action Required**:
1. Install Docker Desktop if not installed
2. Start Docker Desktop
3. Run `npm run db:start`
4. Verify database is accessible

---

## Testing Checklist

Once fixes are applied, verify:

- [ ] Docker Desktop is running
- [ ] Supabase local instance is running (`npm run db:start`)
- [ ] Migrations are applied (`npm run db:push`)
- [ ] Test user exists in database
- [ ] Test user credentials in `.env.test`
- [ ] Playwright auth setup file created
- [ ] Playwright config updated to use auth
- [ ] Run test: `npx playwright test e2e/products-debug.spec.ts`
- [ ] Verify test can navigate to `/sales/products`
- [ ] Run full test suite: `npx playwright test e2e/products.spec.ts`
- [ ] All 24 tests should execute (may have some failures, but should not be auth-blocked)

---

## Test Suite Overview

Once authentication is working, the test suite will cover:

### Test Categories
1. **Product List Page** (5 tests)
   - Page load
   - Table display
   - Search functionality
   - Category filtering
   - Status filtering

2. **Product Creation** (5 tests)
   - Form opening
   - Field display
   - Validation
   - Creation success
   - SF pricing fields

3. **Product Editing** (2 tests)
   - Edit form pre-fill
   - Update success

4. **Status Toggle** (1 test)
   - Active/inactive toggle

5. **Price Calculator** (5 tests)
   - Tab navigation
   - Dropdown population
   - Fixed price calculation
   - SF price calculation
   - Loading states

6. **Filter Interactions** (2 tests)
   - Combined filters
   - Filter reset

7. **Edge Cases** (3 tests)
   - Empty state
   - Form cancellation
   - Network errors

8. **Console Errors** (1 test)
   - No console errors check

**Total**: 24 tests

---

## Expected Outcomes After Fix

### Scenario 1: All Tests Pass (Ideal)
- Authentication working
- Database seeded with products
- All functionality working as designed
- **Action**: Report success to main agent

### Scenario 2: Auth Works, Some Tests Fail (Likely)
- Authentication successful
- Tests can navigate to product pages
- Some functionality has bugs
- **Action**: Create detailed bug report with:
  - Failed test names
  - Expected vs actual behavior
  - Screenshots from test execution
  - Console errors
  - Network errors
  - Specific file/line recommendations for fixes

### Scenario 3: Auth Works, Database Empty (Possible)
- Authentication successful
- No products in database
- Tests encounter empty state
- **Action**:
  1. Run seed script
  2. Re-run tests
  3. Report results

---

## Files Involved

### Test Files Created
- `e2e/products.spec.ts` - Main test suite (24 tests)
- `e2e/products-debug.spec.ts` - Debug tests
- `tests/products/TEST-REPORT.md` - Detailed test report
- `tests/products/DEBUGGER-HANDOFF.md` - This file

### Files to Create/Modify
- `playwright/auth.setup.ts` - NEW: Auth setup for tests
- `playwright.config.ts` - MODIFY: Add auth project
- `.env.test` - NEW: Test environment variables
- `.gitignore` - MODIFY: Add `playwright/.auth/` and `.env.test`

### Application Files (Reference Only)
- `middleware.ts` - Auth middleware
- `src/lib/supabase/middleware.ts` - Session update logic
- `src/app/(app)/sales/products/page.tsx` - Products page
- `src/hooks/use-products.ts` - Products data hook
- `src/app/api/products/` - API routes
- `supabase/migrations/20251116130000_create_products_system.sql` - DB schema

---

## Environment Requirements

### Required Services
- ✅ Next.js dev server (running on port 9002)
- ❌ Docker Desktop (NOT RUNNING)
- ❌ Supabase local instance (NOT RUNNING)
- ❌ Test database (NOT ACCESSIBLE)

### Required Credentials
- ❌ Test user email (NOT CONFIGURED)
- ❌ Test user password (NOT CONFIGURED)
- ❌ Supabase URL (exists, but not for test)
- ❌ Supabase anon key (exists, but not for test)

---

## Success Criteria

Authentication fix is successful when:

1. ✅ Playwright can navigate to `/sales/products` without `ERR_ABORTED`
2. ✅ Debug test shows products page loaded
3. ✅ Debug test screenshot shows actual page content (not login page)
4. ✅ Full test suite executes all 24 tests (pass or fail, but not auth-blocked)
5. ✅ Test output shows meaningful assertions, not navigation errors

---

## Debugging Commands

```bash
# Check Docker is running
docker ps

# Check Supabase status
npm run db:start

# Test database connection
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run debug test
npx playwright test e2e/products-debug.spec.ts --headed

# Run single test
npx playwright test e2e/products.spec.ts -g "should load without errors" --headed --debug

# Check auth state
cat playwright/.auth/user.json

# View test report
npx playwright show-report
```

---

## Questions for Clarification

If you encounter issues, determine:

1. **Does a test user already exist?**
   - Check profiles table
   - Check auth.users table

2. **What's the intended auth flow?**
   - Login page route?
   - Email/password fields?
   - SSO/OAuth?
   - Magic link?

3. **Can we use a remote database instead of local?**
   - Is there a staging/test environment?
   - Connection string available?

4. **Alternative to Docker?**
   - Can tests run against hosted Supabase?
   - Is local database strictly required?

---

## Timeline Estimate

| Task | Estimated Time |
|------|----------------|
| Install/start Docker Desktop | 10 min |
| Start Supabase local instance | 5 min |
| Apply migrations | 2 min |
| Create test user | 5 min |
| Implement Playwright auth setup | 30 min |
| Test auth setup works | 10 min |
| Run full test suite | 10 min |
| **Total** | **~70 minutes** |

---

## Next Steps

1. **Immediate**: Implement Fix 1 (Playwright Authentication Setup)
2. **Then**: Verify Docker/Supabase setup (Fix 3)
3. **Then**: Run debug tests to confirm auth works
4. **Then**: Run full test suite
5. **Then**: Analyze test results and report back

---

## Contact/Handback

After implementing fixes:

- ✅ All auth blockers resolved → Hand back to Testing Agent
- ⚠ Partial success (some tests work) → Report findings and continue debugging
- ❌ Still blocked → Report detailed findings and request alternative approach

---

**Status**: Ready for debugger specialist to implement auth fixes
**Priority**: HIGH - Blocks all product module testing
**Expected Resolution Time**: 1-2 hours
