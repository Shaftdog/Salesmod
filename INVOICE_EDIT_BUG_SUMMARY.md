# Invoice Line Item Edit Bug - Investigation Summary

**Status**: ROOT CAUSE IDENTIFIED
**Date**: 2025-12-16
**Severity**: Medium-High

---

## Problem

When editing invoice line item descriptions, the changes are successfully saved to the database (API returns 200 OK), but the UI immediately shows the old description after the dialog closes.

---

## Root Cause

**Race condition between cache invalidation and dialog close/navigation**

**Location**: `/Users/sherrardhaugabrooks/Documents/Salesmod/src/components/invoicing/edit-invoice-dialog.tsx` lines 169-178

### What Happens:

1. User saves changes
2. API successfully updates database (confirmed by 200 OK response)
3. Code calls `queryClient.invalidateQueries()` to mark cache as stale
4. **Dialog closes IMMEDIATELY** before React Query can refetch
5. Page renders with old cached data
6. React Query refetches in background (we see 2 GET requests)
7. But it's too late - user already sees stale data

### The Problem Code:

```typescript
// Line 169-178 in edit-invoice-dialog.tsx
// Invalidate queries to refresh data
queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] });
queryClient.invalidateQueries({ queryKey: ['invoices'] });
if (orderId) {
  queryClient.invalidateQueries({ queryKey: ['order-invoices', orderId] });
}

toast.success('Invoice updated successfully');
onOpenChange(false);  // ⚠️ CLOSES IMMEDIATELY - doesn't wait for refetch
onSuccess?.();
```

**Key Issue**: `invalidateQueries()` is NOT awaited and does not return a promise for the refetch. It just marks the cache as stale and triggers a background refetch.

---

## The Fix

### Recommended: Option 3 - Optimistic Update (Best UX)

Update the cache immediately with the API response:

```typescript
const response = await fetch(`/api/invoices/${invoice.id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    due_date: data.due_date,
    payment_method: data.payment_method,
    notes: data.notes,
    terms_and_conditions: data.terms_and_conditions,
    line_items: data.line_items.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: (item.tax_rate || 0) / 100,
    })),
  }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'Failed to update invoice');
}

// Parse the response to get updated invoice
const updatedInvoice = await response.json();

// IMMEDIATELY update the cache with the fresh data
queryClient.setQueryData(['invoice', invoice.id], updatedInvoice);

// Still invalidate lists to ensure consistency
queryClient.invalidateQueries({ queryKey: ['invoices'] });
if (orderId) {
  queryClient.invalidateQueries({ queryKey: ['order-invoices', orderId] });
}

toast.success('Invoice updated successfully');
onOpenChange(false);  // Now safe to close - cache is already updated
onSuccess?.();
```

### Why This Works:

1. API returns the complete updated invoice (confirmed in route.ts lines 262-285)
2. We immediately put that fresh data into the cache with `setQueryData()`
3. When dialog closes and page renders, it gets the fresh data
4. No race condition, no delay, instant feedback

### Alternative: Option 2 - Use refetchQueries

```typescript
// Use refetchQueries instead of invalidateQueries
await queryClient.refetchQueries({ queryKey: ['invoice', invoice.id] });
await queryClient.refetchQueries({ queryKey: ['invoices'] });
if (orderId) {
  await queryClient.refetchQueries({ queryKey: ['order-invoices', orderId] });
}

toast.success('Invoice updated successfully');
onOpenChange(false);
onSuccess?.();
```

**Downside**: Makes an extra GET request even though we already have the updated data from the PATCH response. Less efficient.

---

## Files to Modify

### Primary File:
- `/Users/sherrardhaugabrooks/Documents/Salesmod/src/components/invoicing/edit-invoice-dialog.tsx`
  - Modify the `handleSubmit` function (lines 143-185)
  - Specifically lines 169-178

### No Changes Needed:
- API route (`/src/app/api/invoices/[id]/route.ts`) is working correctly
- It already returns the complete updated invoice
- Database updates are working

---

## Test Evidence

Complete test available at:
- `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/invoice-edit-debug.spec.ts`

Run with:
```bash
npx playwright test e2e/invoice-edit-debug.spec.ts --headed
```

Screenshots showing the bug:
- `/Users/sherrardhaugabrooks/Documents/Salesmod/e2e/screenshots/invoice-edit-debug/`

Network evidence:
- PATCH request sent: ✅ Contains "NEW DESCRIPTION TEST"
- API response: ✅ 200 OK
- UI after save: ❌ Shows "Verified Edit - Bug Fix Test" (old value)

---

## Impact

- **Data Integrity**: ✅ Data IS being saved correctly to database
- **User Experience**: ❌ Users see stale data and think save failed
- **User Behavior**: Users may try to save multiple times unnecessarily

---

## Next Steps

1. Apply Option 3 fix (optimistic update) to `edit-invoice-dialog.tsx`
2. Rerun the Playwright test to verify fix
3. Consider applying same pattern to other edit dialogs in the app
4. Add toast message with "refresh" button as backup if needed

---

## Additional Notes

This is a common pattern error with React Query. The fix is straightforward and well-documented in React Query docs under "Optimistic Updates".

Similar pattern should be checked in:
- Other invoice edit operations
- Order edit dialogs
- Client edit forms
- Any other edit dialogs using React Query
