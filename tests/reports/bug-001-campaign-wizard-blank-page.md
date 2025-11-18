# Bug Report #001: Campaign Creation Wizard Renders Blank Page

**Bug ID**: CAMPAIGN-001
**Severity**: CRITICAL (Blocker)
**Priority**: P0 (Immediate fix required)
**Status**: NEW
**Reported**: 2025-11-17
**Reporter**: Claude Code Testing Agent
**Assignee**: debugger-specialist

---

## Summary

The campaign creation wizard page at `/sales/campaigns/new` renders completely blank. No content, forms, or UI elements are visible. The page HTML loads (20KB) but React components fail to render.

---

## Impact

- **User Impact**: Complete feature failure - users cannot create campaigns
- **Business Impact**: Core Phase 5 functionality non-operational
- **Blocks**: All campaign creation tests, user acceptance testing, production deployment
- **Severity Justification**: Feature is 100% broken, no workaround available

---

## Environment

- **Application**: Salesmod (AppraiseTrack)
- **Branch**: `claude/campaign-management-system-01SuCBaBM49xH5o5YJEUbWYL`
- **URL**: http://localhost:9002/sales/campaigns/new
- **Server**: Next.js 15.3.3 with Turbopack, port 9002
- **Browser**: Chromium (Playwright) - All browsers affected (assumed)
- **Database**: Supabase local instance

---

## Reproduction Steps

### Method 1: Via Button Click
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:9002/sales/campaigns
3. Click "New Campaign" button (top right, blue button)
4. Observe: Page navigates to `/sales/campaigns/new` but renders blank white page

### Method 2: Direct URL Navigation
1. Navigate directly to http://localhost:9002/sales/campaigns/new
2. Wait for page load
3. Observe: Blank white page

**Reproduction Rate**: 100% (Always reproduces)

---

## Expected Behavior

The page should display:

1. **Header Section**:
   - Back arrow button (links to `/sales/campaigns`)
   - "Create Campaign" heading
   - "Set up a new email re-engagement campaign" description

2. **Progress Bar Card**:
   - Progress indicator (25% for Step 1)
   - 4 step circles: Audience, Email Content, Settings, Review
   - Step 1 highlighted as current

3. **Step Content Card**:
   - "Audience" title
   - "Select your target audience" description
   - Form fields:
     - Campaign Name input (required)
     - Description textarea
     - Client type checkboxes (AMC, Direct Lender, Broker, Attorney, Private)
     - Date range filters
     - Audience preview section

4. **Navigation Buttons**:
   - "Back" button (disabled on Step 1)
   - "Next" button (disabled until campaign name entered)

---

## Actual Behavior

- **Completely blank white page**
- No content visible
- No error message displayed to user
- No loading state shown
- Page appears frozen

---

## Technical Details

### Page Load Analysis

**HTML Content**:
- Page HTML loads successfully (20,022 bytes)
- HTTP 200 response
- No 404 errors for page itself

**DOM Analysis**:
- `document.body` content length: 20,022 characters
- Step-related DOM elements found: 0
- Form input elements found: 0
- Button elements found: 0

**Console Errors** (captured):
```
Auth error: AuthSessionMissingError: Auth session missing!
    at http://localhost:9002/_next/static/chunks/node_modules_d4f382ef._.js:23081:32
```

**API Errors** (may be related):
- `GET /api/campaigns` - 401 Unauthorized
- `GET /api/campaigns/preview-audience` - likely 401 (not captured)

---

## Source Code Analysis

### File: `/src/app/(app)/sales/campaigns/new/page.tsx`

**Page Structure** (appears correct):
```typescript
export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({ /* ... */ });

  // Render logic looks correct
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header, Progress, Content, Navigation */}
    </div>
  );
}
```

**Component Imports**:
- ✅ AudienceStep - `/src/components/sales/campaigns/AudienceStep.tsx`
- ✅ EmailContentStep - `/src/components/sales/campaigns/EmailContentStep.tsx`
- ✅ SettingsStep - `/src/components/sales/campaigns/SettingsStep.tsx`
- ✅ ReviewStep - `/src/components/sales/campaigns/ReviewStep.tsx`

All files exist and have no obvious syntax errors.

---

## Suspected Root Causes

### Hypothesis 1: AudienceStep Component Crash (Most Likely)
**Reasoning**:
- AudienceStep is first component rendered
- Has `useEffect` that makes API call to `/api/campaigns/preview-audience`
- API call may throw unhandled error
- No error boundary to catch rendering errors

**Evidence**:
```typescript
// AudienceStep.tsx line 77-86
useEffect(() => {
  const timer = setTimeout(() => {
    if (Object.keys(filters).length > 0) {
      loadPreview(); // API call that may fail
    }
  }, 500);
  return () => clearTimeout(timer);
}, [filters]);
```

**Fix Suggestion**:
- Add error handling to `loadPreview()` function
- Don't throw on API failure
- Show error state instead of crashing
- Add React Error Boundary

### Hypothesis 2: Missing API Endpoint
**Reasoning**:
- `/api/campaigns/preview-audience` endpoint may not exist
- Component crashes when API returns 404/500
- No error handling for failed requests

**Fix Suggestion**:
- Verify endpoint exists
- Add try-catch in useEffect
- Gracefully handle API failures

### Hypothesis 3: Auth Middleware Blocking Render
**Reasoning**:
- Auth errors in console
- Page may be blocking render due to auth check
- Middleware may be redirecting or blocking

**Fix Suggestion**:
- Check auth middleware configuration
- Allow page to render even without auth (show login prompt)
- Don't block client-side rendering

### Hypothesis 4: TypeScript/Build Error
**Reasoning**:
- Turbopack may have compilation error
- Client bundle may be broken
- No error shown in browser console

**Fix Suggestion**:
- Check terminal for build errors
- Rebuild with `rm -rf .next && npm run dev`
- Check for TypeScript errors

---

## Debugging Steps

### Step 1: Check Browser Console (Manual)
1. Open browser DevTools
2. Navigate to `/sales/campaigns/new`
3. Check Console tab for React errors
4. Check Network tab for failed requests
5. Check React DevTools for component tree

### Step 2: Test Component in Isolation
1. Create test file for AudienceStep
2. Render component with mock props
3. Verify component renders without API calls
4. Identify which prop/state causes crash

### Step 3: Add Error Boundary
1. Wrap NewCampaignPage in Error Boundary
2. Log React rendering errors
3. Show error UI to user instead of blank page

### Step 4: Add Logging
1. Add console.log at start of NewCampaignPage render
2. Add console.log in each step component
3. Identify which component fails to render

### Step 5: Test API Endpoints
1. Test `POST /api/campaigns/preview-audience` via Postman/curl
2. Verify endpoint exists and returns data
3. Test with and without auth

---

## Proposed Fixes

### Fix #1: Add Error Boundary (Immediate)

**File**: `/src/app/(app)/sales/campaigns/new/page.tsx`

```typescript
'use client';

import { Component, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Campaign Wizard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function NewCampaignPage() {
  // ... existing code

  return (
    <ErrorBoundary>
      {/* existing JSX */}
    </ErrorBoundary>
  );
}
```

### Fix #2: Handle API Failures in AudienceStep

**File**: `/src/components/sales/campaigns/AudienceStep.tsx`

```typescript
async function loadPreview() {
  setLoadingPreview(true);
  try {
    const response = await fetch('/api/campaigns/preview-audience', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target_segment: formData.target_segment,
      }),
    });

    if (!response.ok) {
      console.warn('Preview API failed, continuing without preview');
      setAudiencePreview({ count: 0, sample: [] }); // Set empty instead of throw
      return;
    }

    const data = await response.json();
    setAudiencePreview(data);
  } catch (error) {
    console.error('Error loading preview:', error);
    setAudiencePreview({ count: 0, sample: [] }); // Don't crash, just skip preview
  } finally {
    setLoadingPreview(false);
  }
}
```

### Fix #3: Conditional useEffect

**File**: `/src/components/sales/campaigns/AudienceStep.tsx`

```typescript
useEffect(() => {
  // Only load preview if filters are set AND API is available
  const timer = setTimeout(() => {
    if (Object.keys(filters).length > 0) {
      loadPreview().catch(err => {
        console.error('Preview failed:', err);
        // Don't throw - just log and continue
      });
    }
  }, 500);

  return () => clearTimeout(timer);
}, [filters]); // This is fine, but add error handling above
```

---

## Test Plan After Fix

1. **Manual Test**:
   - Navigate to `/sales/campaigns/new`
   - Verify wizard renders
   - Verify Step 1 form appears
   - Enter campaign name
   - Click "Next" to Step 2
   - Complete all 4 steps
   - Submit campaign

2. **Automated Test**:
   - Run `npm run test:e2e -- campaign-system-comprehensive.spec.ts`
   - Verify Tests 2-5 pass (wizard tests)
   - Verify Test 14 passes (campaign creation)

3. **Error Scenario Test**:
   - Disconnect from API
   - Verify error boundary shows message
   - Verify page doesn't crash

---

## Files to Review

### Primary Suspects:
1. `/src/app/(app)/sales/campaigns/new/page.tsx` - Main wizard page
2. `/src/components/sales/campaigns/AudienceStep.tsx` - First rendered step
3. `/src/app/api/campaigns/preview-audience/route.ts` - API endpoint

### Secondary:
4. `/src/components/sales/campaigns/EmailContentStep.tsx`
5. `/src/components/sales/campaigns/SettingsStep.tsx`
6. `/src/components/sales/campaigns/ReviewStep.tsx`
7. `/src/app/api/campaigns/route.ts` - Main campaigns API

---

## Screenshots

**Evidence of Bug**:
![Blank Wizard Page](/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/new-campaign-direct-navigation.png)

**Expected UI** (from campaigns list page):
![Working Campaigns List](/Users/sherrardhaugabrooks/Documents/Salesmod/tests/screenshots/campaign-list-verified.png)

---

## Additional Notes

- Campaign dashboard pages work perfectly (all tabs functional)
- Only the `/new` page is broken
- List page `/sales/campaigns` works fine
- Detail page `/sales/campaigns/[id]` works fine
- Issue is isolated to campaign creation flow

---

## Success Criteria

Fix is complete when:
- ✅ Page renders visible content (not blank)
- ✅ Wizard step 1 form is visible
- ✅ Campaign name input is functional
- ✅ Can progress through all 4 wizard steps
- ✅ Can create a campaign successfully
- ✅ All E2E tests pass
- ✅ Error boundary prevents future blank pages

---

## Related Issues

- Auth errors (401) - Lower priority, doesn't block rendering
- API endpoint testing needed - Should be done post-fix

---

## Assignment

**Assigned To**: debugger-specialist agent
**Expected Resolution**: Within 1-2 iterations
**Blocker For**: Feature launch, user acceptance testing, deployment

**Instructions for Debugger**:
1. Read this bug report completely
2. Open browser DevTools and navigate to `/sales/campaigns/new`
3. Identify the specific React error in console
4. Apply Fix #1 (Error Boundary) first to see the error
5. Apply Fix #2 (API error handling) to resolve root cause
6. Test manually and with Playwright
7. Report back with fix confirmation

---

**Bug Report Prepared By**: Claude Code Testing Agent
**Test Evidence**: See `/tests/reports/campaign-system-test-report-2025-11-17.md`
