# Bug Fix: required_role Column Error

## Status: CRITICAL - Feature Blocking

**Bug**: Revision creation fails with database error
**Error**: `column "required_role" of relation "production_tasks" does not exist`
**Impact**: AI task generation feature completely blocked
**Priority**: P0 - Critical

---

## The Problem

When creating a revision from a case with AI-generated tasks, submission fails with:

```
Error: column "required_role" of relation "production_tasks" does not exist
Code: 42703 (PostgreSQL: Undefined Column)
```

**What Works**:
- AI successfully parses description into multiple tasks ✅
- Tasks display correctly in UI ✅
- User can select/deselect tasks ✅

**What Fails**:
- Submitting the revision ❌
- Database function tries to insert with non-existent column

---

## Root Cause

**File**: `supabase/migrations/20251213140000_revision_creates_task.sql`
**Function**: `create_revision_from_case()`
**Line**: 106

The function references `required_role` which was renamed to `role` in an earlier migration.

### Current (Broken) Code:
```sql
INSERT INTO production_tasks (
  tenant_id,
  production_card_id,
  title,
  description,
  stage,
  status,
  assigned_to,
  required_role,  -- ❌ This column doesn't exist!
  is_blocking,
  sort_order
) VALUES (
  v_tenant_id,
  v_card.id,
  'REVISION: ' || COALESCE(v_case.subject, 'Case Revision'),
  p_description,
  'REVISION',
  'pending',
  v_researcher_l3_id,
  'researcher_level_3',
  true,
  0
)
```

---

## The Fix

### Option 1: Create New Migration (Recommended)

Create file: `supabase/migrations/20251213140001_fix_revision_task_role_column.sql`

```sql
-- Fix the create_revision_from_case function to use 'role' instead of 'required_role'

CREATE OR REPLACE FUNCTION create_revision_from_case(
  p_case_id UUID,
  p_description TEXT DEFAULT '',
  p_severity TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_ai_summary TEXT DEFAULT NULL
)
RETURNS correction_requests AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_case RECORD;
  v_card RECORD;
  v_correction correction_requests;
  v_researcher_l3_id UUID;
  v_task_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get tenant_id from user profile
  SELECT tenant_id INTO v_tenant_id
  FROM profiles WHERE id = v_user_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User has no tenant';
  END IF;

  -- Get case with order (cases table doesn't have tenant_id)
  SELECT c.id, c.order_id, c.subject INTO v_case
  FROM cases c WHERE c.id = p_case_id;

  IF v_case.id IS NULL THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  IF v_case.order_id IS NULL THEN
    RAISE EXCEPTION 'Case has no linked order';
  END IF;

  -- Get production card for order - validate tenant via the card
  SELECT pc.id, pc.current_stage, pc.tenant_id, pc.assigned_researcher_level_3_id
  INTO v_card
  FROM production_cards pc WHERE pc.order_id = v_case.order_id;

  IF v_card.id IS NULL THEN
    RAISE EXCEPTION 'No production card found for this order';
  END IF;

  -- SECURITY: Validate production card belongs to user's tenant
  IF v_card.tenant_id != v_tenant_id THEN
    RAISE EXCEPTION 'Access denied: Production card does not belong to your tenant';
  END IF;

  v_researcher_l3_id := v_card.assigned_researcher_level_3_id;

  -- Create the revision request
  INSERT INTO correction_requests (
    tenant_id,
    production_card_id,
    case_id,
    request_type,
    status,
    description,
    severity,
    category,
    previous_stage,
    assigned_to,
    requested_by,
    ai_summary
  ) VALUES (
    v_tenant_id,
    v_card.id,
    p_case_id,
    'revision',
    'pending',
    p_description,
    p_severity,
    p_category,
    v_card.current_stage,
    v_researcher_l3_id,
    v_user_id,
    p_ai_summary
  ) RETURNING * INTO v_correction;

  -- Update production card stage to REVISION
  UPDATE production_cards
  SET current_stage = 'REVISION',
      updated_at = NOW()
  WHERE id = v_card.id;

  -- Create a task for the revision
  INSERT INTO production_tasks (
    tenant_id,
    production_card_id,
    title,
    description,
    stage,
    status,
    assigned_to,
    role,  -- ✅ FIXED: Changed from 'required_role' to 'role'
    is_blocking,
    sort_order
  ) VALUES (
    v_tenant_id,
    v_card.id,
    'REVISION: ' || COALESCE(v_case.subject, 'Case Revision'),
    p_description,
    'REVISION',
    'pending',
    v_researcher_l3_id,
    'researcher_level_3',
    true,
    0
  ) RETURNING id INTO v_task_id;

  -- Log to work history if researcher is assigned
  IF v_researcher_l3_id IS NOT NULL THEN
    INSERT INTO resource_work_history (
      tenant_id,
      user_id,
      correction_request_id,
      production_card_id,
      production_task_id,
      event_type,
      summary
    ) VALUES (
      v_tenant_id,
      v_researcher_l3_id,
      v_correction.id,
      v_card.id,
      v_task_id,
      'revision_received',
      'Revision request received from case: ' || LEFT(p_description, 100)
    );
  END IF;

  RETURN v_correction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Option 2: Quick Fix via Supabase SQL Editor

1. Go to Supabase SQL Editor
2. Run the above CREATE OR REPLACE FUNCTION statement
3. Test immediately

---

## Testing the Fix

After applying the fix, re-run the test:

```bash
node /Users/sherrardhaugabrooks/Documents/Salesmod/test_revision_ai_tasks.js
```

**Expected Results**:
1. ✅ Revision submits successfully
2. ✅ Success toast appears
3. ✅ Production board shows card in REVISION column
4. ✅ Card contains all 3 AI-generated tasks
5. ✅ Tasks are assigned to Level 3 Researcher

---

## Verification Steps

1. Submit the revision (should succeed now)
2. Check production board for REVISION column
3. Click on the revision card
4. Verify tasks show:
   - "REVISION: Verify square footage for comparable property"
   - "REVISION: Correct subject property lot size"
   - "REVISION: Update market conditions adjustment" (or similar)

---

## Files Changed

- `supabase/migrations/20251213140001_fix_revision_task_role_column.sql` (new)

OR

- `supabase/migrations/20251213140000_revision_creates_task.sql` (updated - line 106)

---

## Related Issues

This same pattern may exist in `create_correction_request()` function in the same file, but that function appears to NOT reference `required_role` (it omits the role field entirely in the INSERT).

---

**Created**: 2025-12-13
**Reporter**: Claude Code (Automated Testing Agent)
**Fix Status**: Ready to apply
