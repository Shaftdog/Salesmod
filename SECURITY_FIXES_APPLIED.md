# Security and Bug Fixes Applied

**Date**: 2025-12-20
**Scope**: Critical and High severity issues from code review

## Summary

Applied 11 surgical fixes addressing security vulnerabilities, race conditions, and potential failure modes in the agent system.

---

## CRITICAL Fixes

### 1. SQL Query Error Handling (policy-engine.ts:230)
**Issue**: `.single()` doesn't distinguish "no data" from actual errors
**Fix**: Added proper error handling with PGRST116 check, fail closed on errors

```typescript
// Before: Silent error swallowing
const { data: suppression } = await query.single();

// After: Proper error handling
const { data: suppression, error } = await query.single();
if (error && error.code !== 'PGRST116') {
  // Fail closed on error - block the email for safety
  return { allowed: false, reason: 'Email blocked: unable to verify suppression status' };
}
```

**Impact**: Prevents emails from being sent when suppression check fails

---

### 2. CRON_SECRET Validation (cron/agent/route.ts & cron/gmail/route.ts)
**Issue**: Empty CRON_SECRET could accept empty auth headers
**Fix**: Added minimum length validation (32 chars)

```typescript
// Before: No length check
if (!cronSecret) { /* ... */ }

// After: Length validation
if (!cronSecret || cronSecret.length < 32) {
  console.error('CRON_SECRET not configured or too short (min 32 chars)');
  return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
}
```

**Impact**: Prevents authentication bypass with empty secrets

---

### 3. Rate Limiting Race Condition (agent-config.ts:176-218)
**Issue**: Read-then-write pattern has race condition
**Fix**: Fail closed if database function unavailable

```typescript
// Before: Manual read-then-write (race condition)
const { data: existing } = await supabase.from('agent_rate_limits').select('*');
if (existing) {
  await supabase.from('agent_rate_limits').update({ action_count: existing.action_count + 1 });
}

// After: Fail closed if function unavailable
console.warn('[AgentConfig] Rate limit function unavailable, failing closed for safety');
return { allowed: false, currentCount: 0, maxAllowed };
```

**Impact**: Prevents rate limit bypass during concurrent requests

---

## HIGH Priority Fixes

### 4. Missing Tenant Isolation in getAttachment (gmail-service.ts:351)
**Issue**: No verification that attachment belongs to tenant's message
**Fix**: Added tenant verification query before fetching

```typescript
// Added tenant verification
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id')
  .eq('id', this.orgId)
  .single();

const { data: message } = await supabase
  .from('gmail_messages')
  .select('id')
  .eq('gmail_message_id', messageId)
  .eq('tenant_id', profile.tenant_id)
  .single();

if (!message) {
  console.error('Message not found or unauthorized for tenant');
  return null;
}
```

**Impact**: Prevents cross-tenant attachment access

---

### 5. No Timeout on Card Execution (autonomous-cycle.ts:370)
**Issue**: executeCard could hang indefinitely
**Fix**: Added Promise.race with 30-second timeout

```typescript
// Added timeout with Promise.race
const cardResultPromise = executorModule.executeCard(action.data.cardId as string);
const timeoutPromise = new Promise<{ success: false; message: string }>((resolve) =>
  setTimeout(() => resolve({ success: false, message: 'Card execution timeout (30s)' }), 30000)
);

const cardResult = await Promise.race([cardResultPromise, timeoutPromise]);
```

**Impact**: Prevents cycle hangs from stuck card execution

---

### 6. Missing POST Body Validation (admin/agent/route.ts:82)
**Issue**: No validation of action parameter
**Fix**: Added action validation against allowed list

```typescript
// Added validation
const allowedActions = [
  'enable_global',
  'disable_global',
  'enable_tenant',
  'disable_tenant',
  'update_settings',
];

if (!action || !allowedActions.includes(action)) {
  return NextResponse.json({ error: 'Invalid or missing action parameter' }, { status: 400 });
}
```

**Impact**: Prevents invalid action injection

---

### 7. Silent Error Swallowing (agent-config.ts:351-360)
**Issue**: catch block has no logging
**Fix**: Added console.error with the actual error

```typescript
// Before: Silent catch
} catch {
  // Table may not exist - just log
}

// After: Error logging
} catch (error) {
  // Table may not exist - log the error
  console.error('[AgentConfig] Failed to record email provider failure:', error);
}
```

**Impact**: Errors are now visible for debugging

---

### 8. No Role Authorization Check (admin/agent/route.ts:22-30)
**Issue**: Any authenticated user can control agent
**Fix**: Added admin role validation (both GET and POST)

```typescript
// Added to both GET and POST handlers
if (profile.role !== 'admin' && profile.role !== 'super_admin') {
  return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
}
```

**Impact**: Prevents non-admin users from controlling agent

---

### 9. N+1 Query Problem (engagement-engine.ts:88-127)
**Issue**: Individual queries per violation in loop
**Fix**: Batch fetch contacts and clients with .in() operator

```typescript
// Before: Loop with individual queries
for (const row of violations) {
  const { data: contact } = await supabase.from('contacts').eq('id', row.contact_id).single();
  // ... process contact
}

// After: Batch fetch with .in()
const contactIds = limitedData.filter(row => row.contact_id).map(row => row.contact_id);
const { data: contacts } = await supabase.from('contacts').select('*').in('id', contactIds);
const contactsMap = new Map(contacts.map(c => [c.id, c]));
// ... use map for lookups
```

**Impact**: Reduces database queries from O(n) to O(1), improves performance

---

### 10. Silent Action Failures (autonomous-cycle.ts:464-469)
**Issue**: Errors logged but cycle appears successful
**Fix**: Track critical errors and fail cycle if too many

```typescript
// Added criticalErrors tracking
const results = {
  executed: 0,
  blocked: 0,
  emailsSent: 0,
  cardsCreated: 0,
  criticalErrors: 0,  // NEW
};

// In catch block
} catch (error) {
  console.error('[AutonomousCycle] Action failed:', error);
  results.criticalErrors++;  // NEW
  logAction(tenantId, runId, action.type, false, { error: (error as Error).message });
}

// After loop
if (results.criticalErrors > 5) {
  throw new Error(`Too many critical errors during act phase: ${results.criticalErrors}`);
}
```

**Impact**: Cycle now fails if too many errors occur

---

### 11. Unverified Dynamic Import (autonomous-cycle.ts:370)
**Issue**: No check that executeCard function exists
**Fix**: Added typeof check after import

```typescript
// Added function existence check
const executorModule = await import('./executor');

if (typeof executorModule.executeCard !== 'function') {
  console.error('[AutonomousCycle] executeCard function not found in executor module');
  logAction(tenantId, runId, action.type, false, {
    cardId: action.data.cardId,
    error: 'executeCard function not available',
  });
  break;
}
```

**Impact**: Prevents runtime errors from missing functions

---

## Files Modified

1. `/src/lib/agent/policy-engine.ts` - Error handling
2. `/src/app/api/cron/agent/route.ts` - CRON_SECRET validation
3. `/src/app/api/cron/gmail/route.ts` - CRON_SECRET validation
4. `/src/lib/agent/agent-config.ts` - Rate limit race condition, error logging
5. `/src/lib/gmail/gmail-service.ts` - Tenant isolation
6. `/src/lib/agent/autonomous-cycle.ts` - Timeout, error tracking, function verification
7. `/src/app/api/admin/agent/route.ts` - Input validation, role authorization
8. `/src/lib/agent/engagement-engine.ts` - N+1 query fix

---

## Verification

TypeScript compilation: **PASSED** ✅

```bash
npx tsc --noEmit
# No errors
```

---

## Next Steps

1. Deploy to staging environment
2. Monitor error logs for new warnings from fail-closed logic
3. Verify CRON_SECRET meets 32-character minimum
4. Ensure database rate limit function exists (`check_and_increment_rate_limit`)
5. Test admin role enforcement
6. Verify tenant isolation in attachment access

---

## Notes

- All fixes are **minimal and surgical** - only changed what's necessary
- No refactoring or style changes
- Maintained existing functionality while fixing security issues
- Added fail-safe defaults (fail closed on errors)
- Improved observability with better error logging
