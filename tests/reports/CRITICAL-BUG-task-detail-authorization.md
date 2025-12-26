# CRITICAL BUG: Task Detail Authorization Failure

**Status**: 🔴 CRITICAL
**Discovered**: 2025-12-14
**Component**: `/src/app/api/production/tasks/[id]/route.ts`
**Severity**: Blocks all task detail page functionality
**Impact**: Users cannot view any task details

---

## Summary

The task detail API endpoint has an incorrect authorization check that prevents legitimate users from viewing their own tasks. The endpoint returns 403 Forbidden for all requests, causing the detail page to hang in loading state indefinitely.

---

## Root Cause

**File**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/api/production/tasks/[id]/route.ts`
**Lines**: 66-69

### Problematic Code:

```typescript
// Verify user has access
if ((task as any).production_card.org_id !== user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### The Problem:

This line compares `production_card.org_id` (the organization ID) with `user.id` (the individual user's ID). These are completely different types of IDs and will never match, causing all requests to fail with 403 Forbidden.

### What It Should Be:

The authorization check should verify that the user belongs to the organization that owns the task, not that the org_id equals the user_id.

---

## Impact

### User-Facing Impact:
- ❌ Cannot view task details from My Tasks page
- ❌ Cannot start/stop timers on tasks
- ❌ Cannot mark tasks as complete
- ❌ Cannot add notes to tasks
- ❌ Cannot navigate back from detail page (button not rendered due to loading state)
- ❌ All "View Details" buttons are non-functional

### Technical Impact:
- API endpoint returns 403 Forbidden for all requests
- Frontend `useProductionTask` hook never receives data
- React Query keeps retrying, causing infinite loading state
- No error message shown to user (fails silently)

---

## Evidence

### Test Results:
From automated Playwright tests on 2025-12-14:
- Test 3: Navigation to detail page succeeds but page stuck loading
- Test 4: Back button cannot be found (not rendered while loading)
- Detail page elements all return count: 0

### API Request:
```
GET /api/production/tasks/6f439a3b-76cf-4a65-bb46-b6d84a1b93ec
Expected: 200 OK with task data
Actual: 403 Forbidden (authorization check fails)
```

### Browser Observation:
- Page shows loading spinner indefinitely
- "Compiling..." notification appears
- No error shown in UI
- Network tab would show 403 response (if checked)

---

## Recommended Fix

### Option 1: Check User's Organization Membership (Recommended)

Replace the authorization check with proper org membership verification:

```typescript
// Get user's current organization
const { data: userProfile } = await supabase
  .from('profiles')
  .select('current_org_id, user_id')
  .eq('user_id', user.id)
  .single();

if (!userProfile || userProfile.current_org_id !== (task as any).production_card.org_id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### Option 2: Check if User is Assigned or Has Role

```typescript
// Verify user has access (is assigned to task OR is in the organization)
const hasAccess =
  task.assigned_to === user.id ||
  await checkUserOrgMembership(user.id, (task as any).production_card.org_id);

if (!hasAccess) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

### Option 3: Check Production Card Assignment

```typescript
// Fetch task with user check
const { data: task, error: taskError } = await supabase
  .from('production_tasks')
  .select(`
    *,
    production_card:production_cards!inner(
      id, order_id, current_stage, org_id,
      order:orders!inner(
        id, order_number, org_id
      )
    ),
    assigned_user:profiles!production_tasks_assigned_to_fkey(id, name, email)
  `)
  .eq('id', id)
  .single();

// Check against order's org_id if available
const taskOrgId = task.production_card?.order?.org_id;
const { data: userOrg } = await supabase
  .from('organization_members')
  .select('org_id')
  .eq('user_id', user.id)
  .eq('org_id', taskOrgId)
  .single();

if (!userOrg) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

## Same Bug in Other Methods

**CRITICAL**: This same incorrect authorization check appears in:

1. **PUT /api/production/tasks/[id]** (Line 146)
   ```typescript
   if ((existing as any).production_card.org_id !== user.id) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```

2. **POST /api/production/tasks/[id]** (Line 238)
   ```typescript
   if ((existing as any).production_card.org_id !== user.id) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
   }
   ```

**All three methods must be fixed together.**

---

## Immediate Actions Required

### Step 1: Fix Authorization Check
Update all three methods (GET, PUT, POST) in `/src/app/api/production/tasks/[id]/route.ts` with proper organization membership verification.

### Step 2: Test Fix
1. Start development server
2. Navigate to `/production/my-tasks`
3. Click "View Details" on any task
4. Verify task details load correctly
5. Test timer controls, complete button, notes

### Step 3: Re-run Automated Tests
```bash
npx playwright test e2e/my-tasks-test.spec.ts
```

Expected result: All 4 tests should pass

### Step 4: Check Related Endpoints
Search for similar authorization patterns in other API routes:
```bash
grep -r "org_id !== user.id" src/app/api/
```

Fix any other occurrences.

---

## Testing Checklist

After fix is applied:

- [ ] GET /api/production/tasks/[id] returns 200 OK
- [ ] Task detail page loads and displays content
- [ ] Back button is visible and functional
- [ ] Timer controls work (start/stop)
- [ ] Mark complete button works
- [ ] Notes can be saved
- [ ] Subtasks display (if present)
- [ ] Time entries display (if present)
- [ ] All 4 Playwright tests pass
- [ ] No 403 errors in browser console
- [ ] No authorization errors in server logs

---

## Additional Improvements

### 1. Add Better Error Handling in Frontend

In `/src/hooks/use-production.ts`, the `useProductionTask` hook should handle 403 errors more gracefully:

```typescript
export function useProductionTask(taskId: string) {
  return useQuery({
    queryKey: ['production-task', taskId],
    queryFn: async () => {
      const response = await fetch(`/api/production/tasks/${taskId}`)
      if (!response.ok) {
        const error = await response.json()
        // Log for debugging
        console.error('Task fetch failed:', { status: response.status, error })
        throw new Error(error.error || 'Failed to fetch task')
      }
      const data = await response.json()
      return data.task as ProductionTaskWithRelations
    },
    enabled: !!taskId,
    staleTime: 1000 * 30, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 403/404
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        return false
      }
      return failureCount < 3
    }
  })
}
```

### 2. Show Error State in UI

In `/src/app/(app)/production/my-tasks/[taskId]/page.tsx`, improve error display:

```typescript
if (error || !task) {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild>
        <Link href="/production/my-tasks">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tasks
        </Link>
      </Button>
      <div className="flex flex-col items-center justify-center h-64 text-red-500 space-y-4">
        <AlertTriangle className="h-12 w-12" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Failed to load task details</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {error?.message || 'An unknown error occurred'}
          </p>
        </div>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    </div>
  );
}
```

### 3. Add Request Logging

Add logging to track authorization checks:

```typescript
// Log authorization attempt
console.log('Authorization check:', {
  userId: user.id,
  taskId: id,
  cardOrgId: (task as any).production_card.org_id,
  match: (task as any).production_card.org_id === user.id
});
```

---

## Related Files

- `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/api/production/tasks/[id]/route.ts` (PRIMARY)
- `/Users/sherrardhaugabrooks/Documents/Salesmod/src/hooks/use-production.ts`
- `/Users/sherrardhaugabrooks/Documents/Salesmod/src/app/(app)/production/my-tasks/[taskId]/page.tsx`
- `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/my-tasks-test.spec.ts` (test file)

---

## Timeline

- **2025-12-14 22:53**: Bug discovered during automated testing
- **2025-12-14 23:00**: Root cause identified (incorrect authorization check)
- **Next**: Apply fix and verify with tests

---

## Priority: IMMEDIATE

This bug completely blocks the My Tasks detail page functionality. Fix should be applied immediately and tested before any other work on this feature.

---

**Report Generated**: 2025-12-14
**Reported By**: Automated Testing (Playwright)
**Assigned To**: Development Team
**Status**: 🔴 CRITICAL - Requires Immediate Fix
