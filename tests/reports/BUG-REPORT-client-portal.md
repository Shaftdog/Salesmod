# Bug Report - Client Portal Authentication & Access Control

**Date:** November 16, 2025
**Severity:** HIGH
**Component:** Client Portal Access Control
**Affected Routes:** `/client-portal/*`
**Status:** CONFIRMED

---

## Bug #1: Unauthenticated Access to Client Portal Routes - HIGH SEVERITY

### Description
Client portal routes (`/client-portal/dashboard`, `/client-portal/settings`, `/client-portal/orders`) are accessible to unauthenticated users, displaying blank pages instead of redirecting to login.

### Steps to Reproduce
1. Open browser in incognito mode (no session)
2. Navigate to `http://localhost:9002/client-portal/dashboard`
3. Observe: Page loads (blank) instead of redirecting to `/login`

### Expected Behavior
- User should be immediately redirected to `/login` page
- No client portal content should be accessible without authentication

### Actual Behavior
- Client portal routes load with blank pages
- No redirect to login occurs
- Layout component renders but shows nothing (returns null while checking auth)

### Root Cause
File: `src/app/client-portal/layout.tsx` (lines 37-74)

The authentication check happens client-side in `useEffect`:
```typescript
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");  // Client-side redirect
      return;
    }

    setUser(session.user);
    // ... load tenant data
  };

  checkAuth();
}, [router]);
```

**Problem:** The page loads before the `useEffect` runs, and while the auth check is happening, the layout returns `null` (line 81-83), resulting in a blank page. The redirect happens after the page has already loaded.

### Impact
- **Security Risk:** Routes are technically accessible (though show no data)
- **User Experience:** Blank pages confuse users
- **SEO:** Search engines may index blank pages

### Recommended Fix

**Option 1: Add Next.js Middleware (RECOMMENDED)**

Create `src/middleware.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect client portal routes
  if (request.nextUrl.pathname.startsWith('/client-portal')) {
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/client-portal/:path*']
}
```

**Option 2: Add Loading State to Layout**

Update `src/app/client-portal/layout.tsx`:
```typescript
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    setUser(session.user);
    // ... load tenant data
    setIsLoading(false); // Set loading to false only after auth check
  };

  checkAuth();
}, [router]);

if (isLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

if (!user) {
  return null; // Redirecting...
}
```

**Option 3: Server Component Auth Check**

Convert layout to async Server Component (may require restructuring).

### Verification Steps
After fix:
1. Clear browser cache and cookies
2. Navigate to `/client-portal/dashboard` without auth
3. Verify immediate redirect to `/login`
4. Verify no blank page flash
5. Run automated test: `npx playwright test e2e/client-portal-comprehensive.spec.ts --grep "Access Control"`

---

## Bug #2: Registration Dropdown Timing Issue - MEDIUM SEVERITY

### Description
The "Company Type" dropdown in the registration form has timing issues that prevent automated clicking of dropdown options.

### Steps to Reproduce
1. Navigate to `/login`
2. Click "Sign Up"
3. Fill in all form fields
4. Click on Company Type dropdown
5. Attempt to click "Mortgage Lender" option
6. Observe: Dropdown intercepts pointer events intermittently

### Expected Behavior
- Dropdown opens smoothly
- Options are immediately clickable
- Selection updates form value

### Actual Behavior
- Dropdown opens but pointer events are intercepted
- Click attempts timeout in automated tests
- Manual clicking works but feels slightly delayed

### Root Cause
File: `src/components/auth/RegisterForm.tsx` (lines 188-203)

Radix UI Select component rendering timing with React Hook Form:
```typescript
<Select
  onValueChange={(value) => form.setValue('tenantType', value as any)}
  defaultValue={form.watch('tenantType')}
  disabled={isLoading}
>
```

The dropdown portal renders outside the main component tree, causing timing issues.

### Impact
- **Automated Testing:** Cannot complete registration tests
- **User Experience:** Minimal (works manually)
- **Flakiness:** Intermittent in high-latency situations

### Recommended Fix

**Option 1: Add Better Loading States**
```typescript
<Select
  onValueChange={(value) => form.setValue('tenantType', value as any)}
  defaultValue={form.watch('tenantType')}
  disabled={isLoading}
  // Ensure portal is ready
  onOpenChange={(open) => {
    if (open) {
      // Small delay to ensure portal is rendered
      setTimeout(() => {}, 50);
    }
  }}
>
```

**Option 2: Use data-testid Attributes**
```typescript
<SelectTrigger data-testid="tenant-type-select">
  <SelectValue placeholder="Select your company type" />
</SelectTrigger>
<SelectContent>
  {tenantTypes.map((type) => (
    <SelectItem
      key={type.value}
      value={type.value}
      data-testid={`tenant-type-option-${type.value}`}
    >
      {type.label}
    </SelectItem>
  ))}
</SelectContent>
```

Then in tests:
```typescript
await page.click('[data-testid="tenant-type-select"]');
await page.click('[data-testid="tenant-type-option-lender"]');
```

### Verification Steps
1. Add data-testid attributes
2. Update test selectors
3. Run: `npx playwright test --grep "registration"`
4. Verify all registration tests pass

---

## Bug #3: Password Validation Test Loop Issue - LOW SEVERITY

### Description
The automated test for password requirements validation fails due to test logic, not application logic.

### Root Cause
File: `e2e/client-portal-comprehensive.spec.ts` (lines 389-419)

The test loops through multiple weak passwords but doesn't properly reset the form between attempts:
```typescript
for (const { pwd, name } of weakPasswords) {
  await page.fill('input#name', 'Test User');
  await page.fill('input#email', `test-${Date.now()}@example.com`);
  await page.fill('input#password', pwd);
  await page.fill('input#tenantName', 'Test Company');

  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(1000);

  // Should show validation error
  const hasError = await page.locator('.text-destructive, [role="alert"]').isVisible({ timeout: 1000 }).catch(() => false);
  expect(hasError).toBe(true);

  // Clear for next test
  await page.fill('input#password', ''); // This is insufficient
}
```

### Impact
- **Testing:** Test fails but application validation works correctly
- **User Experience:** No impact (validation is working)

### Recommended Fix
```typescript
for (const { pwd, name } of weakPasswords) {
  // Reload page for fresh form state
  await page.goto(`${BASE_URL}/login`);
  await page.click('text=Sign Up');
  await waitForPageLoad(page);

  // Fill form with weak password
  await page.fill('input#name', 'Test User');
  await page.fill('input#email', `test-${Date.now()}@example.com`);
  await page.fill('input#password', pwd);
  await page.fill('input#tenantName', 'Test Company');

  await page.click('button:has-text("Create Account")');
  await page.waitForTimeout(1000);

  // Check for validation error
  const hasError = await page.locator('.text-destructive').isVisible({ timeout: 1000 }).catch(() => false);
  expect(hasError).toBe(true);

  await takeScreenshot(page, `password-validation-${name}`);
}
```

---

## Summary of Findings

| Bug ID | Component | Severity | Status | Priority |
|--------|-----------|----------|--------|----------|
| #1 | Access Control | HIGH | Confirmed | P1 - Critical |
| #2 | Registration Dropdown | MEDIUM | Confirmed | P2 - High |
| #3 | Test Logic | LOW | Confirmed | P3 - Low |

### Action Items

**Immediate (Before Production):**
1. Implement middleware authentication for `/client-portal/*` routes
2. Add loading states to prevent blank page flash

**Next Sprint:**
3. Improve dropdown interaction reliability
4. Add data-testid attributes for better test stability
5. Refactor test loop logic

**Nice to Have:**
6. Add password strength indicator
7. Add show/hide password toggle
8. Improve error messages with more specific guidance

---

## Test Evidence Files

- **Full Test Report:** `tests/reports/client-portal-test-report-2025-11-16.md`
- **Screenshots:** `tests/screenshots/client-portal/`
- **Failure Videos:** `test-results/client-portal-*/video.webm`
- **HTML Report:** `tests/playwright-report/index.html`

---

**Reported By:** Claude Code - Automated Testing Agent
**Date:** November 16, 2025
**Test Suite:** `e2e/client-portal-comprehensive.spec.ts`
