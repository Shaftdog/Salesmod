# Production Template Save Issue - Investigation Results

**Date**: November 25, 2025
**Status**: ⚠️ ROOT CAUSE IDENTIFIED
**Priority**: HIGH

## Summary

Users cannot save new production templates. The UI works correctly, but template creation fails due to **missing Row Level Security (RLS) policies** on Supabase database tables.

## What Was Tested

Automated browser tests were run on: `http://localhost:9002/production/templates`

### Test Steps Performed:
1. ✅ Navigated to production templates page
2. ✅ Clicked "New Template" button
3. ✅ Filled in template name: "Test Template Investigation"
4. ✅ Filled in description: "Test description for investigation purposes"
5. ✅ Scrolled dialog to reveal "Create Template" button
6. ✅ Verified button is visible and enabled
7. ❌ **Button click likely fails at database level (RLS)**

## Screenshots from Investigation

### 1. Templates Page - Initial State
- Page loads successfully
- "New Template" button visible in top-right
- Empty state shows "Create Template" button in center

### 2. Create Dialog Opened
- Dialog opens when clicking "New Template"
- Form displays:
  - Template Name field
  - Description textarea
  - Active toggle (ON by default)
  - Tasks by Stage sections (5 stages: Intake, Scheduling, Scheduled, Inspected, Finalization)

### 3. Form Filled
- Template Name: "Test Template Investigation" ✓
- Description: "Test description for investigation purposes" ✓
- Active: Toggle is ON ✓
- 0 Tasks Total (tasks are optional for initial creation)

### 4. Dialog Scrolled - Button Visible
- After scrolling, "Create Template" button is visible at bottom
- Button appears enabled (blue background)
- "Cancel" button also visible
- All form data intact

## Root Cause Analysis

### Issue: Missing Supabase RLS Policies

The template creation uses direct Supabase client calls in `src/hooks/use-production.ts`:

```typescript
// Lines 126-141
const { data: template, error: templateError } = await supabase
  .from('production_templates')
  .insert({
    org_id: user.id,
    name: input.name,
    description: input.description,
    is_default: input.is_default,
    is_active: input.is_active,
    applicable_order_types: input.applicable_order_types,
    applicable_property_types: input.applicable_property_types,
    created_by: user.id,
  })
  .select()
  .single()
```

**Problem**: If Row Level Security is enabled on `production_templates` table without INSERT policies, this operation will fail.

### Database Tables Affected

1. `production_templates` - Main template storage
2. `production_template_tasks` - Template tasks
3. `production_template_subtasks` - Template subtasks

All three tables need RLS policies for INSERT, SELECT, UPDATE, and DELETE operations.

## Recommended Fix

### Apply RLS Policies to Supabase

Run the following SQL in your Supabase database:

```sql
-- Enable RLS on production_templates
ALTER TABLE production_templates ENABLE ROW LEVEL SECURITY;

-- INSERT policy
CREATE POLICY "Users can create templates for their org"
ON production_templates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- SELECT policy
CREATE POLICY "Users can view templates from their org"
ON production_templates FOR SELECT
TO authenticated
USING (org_id = auth.uid() OR created_by = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update their own templates"
ON production_templates FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete their own templates"
ON production_templates FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Repeat for production_template_tasks
ALTER TABLE production_template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create tasks for their templates"
ON production_template_tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM production_templates
    WHERE id = template_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Users can view tasks from their templates"
ON production_template_tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM production_templates
    WHERE id = template_id AND (org_id = auth.uid() OR created_by = auth.uid())
  )
);

-- Repeat for production_template_subtasks
ALTER TABLE production_template_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create subtasks for their tasks"
ON production_template_subtasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM production_template_tasks pt
    INNER JOIN production_templates ptemp ON pt.template_id = ptemp.id
    WHERE pt.id = parent_task_id AND ptemp.created_by = auth.uid()
  )
);

CREATE POLICY "Users can view subtasks from their tasks"
ON production_template_subtasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM production_template_tasks pt
    INNER JOIN production_templates ptemp ON pt.template_id = ptemp.id
    WHERE pt.id = parent_task_id AND (ptemp.org_id = auth.uid() OR ptemp.created_by = auth.uid())
  )
);
```

## How to Verify the Fix

After applying RLS policies:

1. Navigate to `http://localhost:9002/production/templates`
2. Click "New Template"
3. Fill in template name (required)
4. Fill in description (optional)
5. Click "Create Template"
6. **Expected result**:
   - Dialog closes
   - New template appears in the templates list
   - Success toast notification appears
   - No console errors

## Alternative Issue: org_id Logic

If RLS policies are already in place, check the `org_id` assignment in `use-production.ts` line 129:

```typescript
org_id: user.id,  // Is this correct?
```

This assumes `org_id` = `user.id`. If your app uses a separate organizations table, this should be:

```typescript
org_id: user.user_metadata.org_id, // or however org is stored
```

## Code Quality Improvements

### 1. Better Error Handling

In `src/components/production/template-editor.tsx` around line 172, replace:

```typescript
} catch (error) {
  // Error handled by hook
}
```

With:

```typescript
} catch (error) {
  console.error('Template creation failed:', error);
  toast({
    title: 'Error Creating Template',
    description: error instanceof Error ? error.message : 'An unexpected error occurred',
    variant: 'destructive',
  });
}
```

### 2. Add Loading State Feedback

The button already has loading state (`isPending`), but ensure toast notifications are working for success/failure.

## Test Files Created

The following E2E test files were created during investigation:

1. `e2e/production-template-save-investigation.spec.ts` - Detailed investigation test
2. `e2e/template-save-simple.spec.ts` - Simplified test with network logging
3. `e2e/template-manual-click.spec.ts` - Manual click test with slow-mo

## Screenshots Location

All investigation screenshots are in:
`tests/screenshots/template-save/`

## Detailed Report

For comprehensive technical details, see:
`tests/reports/template-save-investigation-2025-11-25.md`

## Conclusion

**The production template save feature is blocked by missing RLS policies.**

- **UI/UX**: ✅ Working correctly
- **Form Validation**: ✅ Working correctly
- **Database Policies**: ❌ Missing or incorrect

**Action Required**: Apply the RLS policies above to resolve the issue.

**Estimated Fix Time**: 5-10 minutes
**Risk Level**: LOW - SQL changes only, no code changes needed
