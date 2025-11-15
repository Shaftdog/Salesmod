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

**Key issues identified:**
1. The context parameter itself must be **required** (not optional)
2. The `params` property inside context must **also be required** (not optional)
3. Next.js 15 always provides `params` even for routes without dynamic segments

**Old (incorrect):**
```typescript
routeContext: { params?: Promise<any> } = {}
// or
routeContext?: { params?: Promise<Record<string, string | string[]>> }
// or
context: { params?: Promise<Record<string, string | string[]>> }
```

**New (correct):**
```typescript
context: { params: Promise<Record<string, string | string[]>> }
```

## Changes Made

### File: `src/lib/admin/api-middleware.ts`

Fixed all three middleware wrapper functions:

1. **withAdminAuth**
2. **withRole** 
3. **withPermission**

Each function now properly types the context parameter as:
- **Context parameter is required** (not optional) - Next.js always provides this
- **Params property is also required** (not optional) - Next.js always provides params even for non-dynamic routes
- Properly typed params as `Promise<Record<string, string | string[]>>`
- Renamed from `routeContext` to `context` for clarity

## Example of Fix

### Before (Incorrect):
```typescript
export function withAdminAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, routeContext?: { params?: Promise<any> }) => {
    // ❌ Both context AND params are optional - causes type error
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
    context: { params: Promise<Record<string, string | string[]>> }
    // ✅ Both context AND params are required - matches Next.js 15 expectations
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
- Commit: `730f35f` - Initial attempt (params was `Promise<any>`)
- Commit: `c033edc` - Made context required (params still optional)
- Commit: `092ee84` - Fixed params type to `Promise<Record<...>>`
- Commit: `b02eb74` - **Final fix**: Made params property required (not optional)

## References
- [Next.js 15 Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)

## Status
✅ Fixed and pushed to remote
✅ Linting passes
✅ Ready for Vercel deployment

