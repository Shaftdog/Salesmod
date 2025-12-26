# Revision Task Creation - Migration Summary

**Date**: December 13, 2025
**Status**: ✅ Complete

## Overview

Applied migration to automatically create production tasks when revisions or corrections are created, and manually created a task for the existing revision record.

## Migrations Applied

### 1. Revision Task Creation Function (20251213140000_revision_creates_task.sql)

**Applied**: 2025-12-14 01:21:53

**Changes**:
- Updated `create_revision_from_case()` function to automatically create a production task when a revision is created
- Updated `create_correction_request()` function to automatically create a production task when a correction is created
- Tasks are created with:
  - Title: "REVISION: [case subject]" or "CORRECTION: [description]"
  - Stage: REVISION or CORRECTION
  - Status: pending
  - Assigned to the appropriate researcher/resource
  - Marked as blocking (is_blocking = true)
  - Added to work history for tracking

**Benefits**:
- Revisions and corrections now automatically appear in the production Kanban
- Resources are immediately notified via work history
- No manual task creation needed for future revisions/corrections

### 2. Existing Revision Task Creation (create-existing-revision-task.sql)

**Applied**: 2025-12-14 01:22:36

**Purpose**: Created a task for the existing revision that was created before the automatic task creation was implemented.

**Task Details**:
- Production Card: `5fd7b080-b12d-4259-b44c-2be5e9639bae`
- Revision: `60a43814-adc9-483e-9e0b-66f04280fd1b`
- Title: "REVISION: Issue with Order ORD-202512-1007"
- Description: "There is no location map in the report. Remove the word black throughout the report as it violates housing requirements. Third bedroom photo is missing."
- Assigned to: `bde00714-427d-4024-9fbd-6f895824f733` (Researcher Level 3)
- Stage: REVISION
- Status: pending

## Database Schema Updates

### Production Tasks Table

The migration uses existing columns in `production_tasks`:
- `production_card_id` - Links task to production card
- `title` - Task title (e.g., "REVISION: Issue with Order...")
- `description` - Full revision/correction description
- `stage` - Set to 'REVISION' or 'CORRECTION'
- `status` - Set to 'pending' initially
- `assigned_to` - User ID of assigned resource
- `role` - Required role (e.g., 'researcher_level_3')
- `is_required` - Set to true for blocking tasks
- `sort_order` - Task ordering (0 for first)

## Functions Modified

### `create_revision_from_case()`

**New behavior**:
1. Creates correction_request record
2. Updates production card stage to REVISION
3. **NEW**: Creates production task for the revision
4. **NEW**: Logs to resource_work_history

### `create_correction_request()`

**New behavior**:
1. Creates correction_request record
2. Updates production card stage to CORRECTION
3. **NEW**: Creates production task for the correction
4. **NEW**: Logs to resource_work_history

## Testing Recommendations

1. **Create a new revision from a case**:
   - Verify a task is automatically created in the REVISION stage
   - Verify the task appears in the production Kanban
   - Verify the researcher is notified via work history

2. **Create a new correction from a task**:
   - Verify a task is automatically created in the CORRECTION stage
   - Verify the task appears in the production Kanban
   - Verify the assignee is notified via work history

3. **Verify existing revision task**:
   - Check that the manually created task for revision `60a43814-adc9-483e-9e0b-66f04280fd1b` appears
   - Verify it's assigned to the correct researcher
   - Verify it shows in the REVISION column

## Rollback Plan

If issues occur, the migration can be rolled back by:

1. Removing the task creation logic from the functions:
```sql
CREATE OR REPLACE FUNCTION create_revision_from_case(...)
-- Remove the INSERT INTO production_tasks section
-- Remove the work history logging section
```

2. Deleting the manually created task:
```sql
DELETE FROM production_tasks
WHERE production_card_id = '5fd7b080-b12d-4259-b44c-2be5e9639bae'
  AND stage = 'REVISION'
  AND title LIKE 'REVISION: Issue with Order ORD-202512-1007';
```

## Next Steps

1. Test the automatic task creation with new revisions/corrections
2. Monitor production Kanban for proper task display
3. Verify work history notifications are working
4. Consider adding task completion workflows for revisions/corrections

## Files

- Migration: `/Users/sherrardhaugabrooks/Documents/Salesmod/supabase/migrations/20251213140000_revision_creates_task.sql`
- Manual task creation: `/Users/sherrardhaugabrooks/Documents/Salesmod/scripts/create-existing-revision-task.sql`
- This summary: `/Users/sherrardhaugabrooks/Documents/Salesmod/scripts/REVISION_TASK_CREATION_SUMMARY.md`
