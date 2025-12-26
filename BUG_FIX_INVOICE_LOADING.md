# Bug Fix: Invoice List Page Infinite Loading

## Status: FIXED ✅

## Bug Report
**Date**: 2025-12-15
**Reported By**: User
**Fixed By**: debugger-specialist

## Symptoms
- Invoice list page at `/finance/invoicing` stuck showing "Loading invoices..." forever
- API endpoint `/api/invoices` returns data correctly (50 invoices)
- Summary cards show "0 Total Invoices"
- Frontend unable to display invoice data

## Root Cause

### The Problem
When pagination was added to the invoice system, the Zod validation schema was not updated to handle query string parameters correctly.

**Technical Details**:
1. The frontend hook sends pagination params as strings via URLSearchParams:
   ```typescript
   searchParams.append('page', '1');  // String "1"
   searchParams.append('limit', '20'); // String "20"
   ```

2. The validation schema expected numbers:
   ```typescript
   page: z.number().int().positive()  // Expects number 1, not string "1"
   ```

3. When the API received `?page=1&limit=20`, Zod validation failed because:
   - `z.number()` does NOT automatically convert strings to numbers
   - URLSearchParams always sends strings
   - This caused a 400 validation error
   - React Query retried the failed request indefinitely
   - The page showed infinite loading state

## The Fix

### File 1: `/src/lib/validations/invoicing.ts`

**Changed pagination schema to use `z.coerce.number()` instead of `z.number()`:**

```typescript
// BEFORE (Line 258-259)
page: z.number().int().positive().max(MAX_PAGE_NUMBER).optional().default(DEFAULT_PAGE),
limit: z.number().int().positive().max(MAX_PAGE_LIMIT).optional().default(DEFAULT_PAGE_LIMIT),

// AFTER
page: z.coerce.number().int().positive().max(MAX_PAGE_NUMBER).optional().default(DEFAULT_PAGE),
limit: z.coerce.number().int().positive().max(MAX_PAGE_LIMIT).optional().default(DEFAULT_PAGE_LIMIT),
```

**Also fixed `overdue_only` boolean parameter (Line 253):**

```typescript
// BEFORE
overdue_only: z.boolean().optional(),

// AFTER
overdue_only: z.coerce.boolean().optional(),
```

### File 2: `/src/app/(app)/finance/invoicing/page.tsx`

**Added error handling to display validation errors:**

```typescript
// Added `error` to destructured hook result
const { data, isLoading, error } = useInvoices({...});

// Added error display in UI
) : error ? (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <p className="text-destructive font-semibold">Error loading invoices</p>
    <p className="text-muted-foreground text-sm mt-2">
      {error instanceof Error ? error.message : 'Unknown error'}
    </p>
  </div>
) : invoices.length === 0 ? (
```

## Why This Fix Works

1. **`z.coerce.number()`** automatically converts string inputs to numbers
2. **`z.coerce.boolean()`** automatically converts string "true"/"false" to booleans
3. This is the standard approach for validating query parameters in Zod
4. The API validation now passes, returning data correctly
5. Error handling improvement makes future issues easier to diagnose

## Files Modified

1. `/src/lib/validations/invoicing.ts` - Fixed pagination schema
2. `/src/app/(app)/finance/invoicing/page.tsx` - Added error display

## Testing

**Evidence of Fix**:
- Server logs showed 400 errors before fix: `GET /api/invoices?page=1&limit=20 400`
- After fix, validation passes and API returns data correctly
- Invoice list now loads and displays properly with pagination

## Related Documentation

**Zod Coercion**: https://zod.dev/?id=coercion-for-primitives

Query parameters are always strings in HTTP. When validating them with Zod:
- Use `z.coerce.number()` for numeric params
- Use `z.coerce.boolean()` for boolean params
- Use `z.string()` for string params (no coercion needed)

## Prevention

**For Future Development**:
- Always use `z.coerce.*` for query parameter validation schemas
- Test API endpoints with query parameters during development
- Add error state handling to all data-fetching components
- Check browser console for validation errors during testing
