# Next.js 15 Build Fix - Route Handler Type Compatibility

## Problem
Vercel build was failing with a TypeScript error:

```
Failed to compile.

src/app/api/admin-test/route.ts
Type error: Route "src/app/api/admin-test/route.ts" has an invalid "GET" export:
  Type "{ params?: Promise<any> | undefined; } | undefined" is not a valid type for the function's second argument.
    Expected "RouteContext", got "{ params?: Promise<any> | undefined; } | undefined".
```

## Root Cause
Next.js 15 has stricter TypeScript requirements for route handler signatures. The middleware functions (`withAdminAuth`, `withRole`, `withPermission`) were using an outdated type signature for the route context parameter.

The key issue: **The context parameter itself must be required (not optional)**, only the `params` property inside it should be optional.

**Old (incorrect):**
```typescript
routeContext: { params?: Promise<any> } = {}
// or
routeContext?: { params?: Promise<Record<string, string | string[]>> }
```

**New (correct):**
```typescript
context: { params?: Promise<Record<string, string | string[]>> }
```

## Changes Made

### File: `src/lib/admin/api-middleware.ts`

Fixed all three middleware wrapper functions:

1. **withAdminAuth**
2. **withRole** 
3. **withPermission**

Each function now properly types the context parameter as:
- **Required** (not optional) - Next.js always provides this parameter
- Only `params` property inside is optional
- Properly typed params as `Promise<Record<string, string | string[]>>`
- Renamed from `routeContext` to `context` for clarity

## Example of Fix

### Before (Incorrect):
```typescript
export function withAdminAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<any> }) => {
    // ❌ Context parameter is optional - this causes the type error
    return await handler(request, {
      userId,
      supabase,
      params: routeContext?.params
    })
  }
}
```

### After (Correct):
```typescript
export function withAdminAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params?: Promise<Record<string, string | string[]>> }
    // ✅ Context parameter is required, only params inside is optional
  ) => {
    // ...
    return await handler(request, {
      userId,
      supabase,
      params: context.params
    })
  }
}
```

## Impact
This fix affects all routes using the admin middleware:
- `/api/admin-test/route.ts`
- `/api/admin/users/route.ts`
- `/api/admin/settings/route.ts`
- `/api/admin/analytics/route.ts`
- `/api/admin/audit-logs/route.ts`
- `/api/admin/dashboard/route.ts`
- All other routes using `withAdminAuth`, `withRole`, or `withPermission`

## Testing

### Local Testing:
```bash
npm run build
```

Should now complete without TypeScript errors.

### Vercel Testing:
The next push to `main` branch will trigger a new Vercel build that should succeed.

## Commits
- Commit: `730f35f` - Initial attempt (still had issue)
- Commit: `c033edc` - **Final fix**: "Make route context parameter required (not optional) for Next.js 15"

## References
- [Next.js 15 Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)

## Status
✅ Fixed and pushed to remote
✅ Linting passes
✅ Ready for Vercel deployment

