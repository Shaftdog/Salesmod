-- Migration: Add researcher and inspector roles to task library
-- Purpose: Allow task templates to use all production roles including researcher_level_1/2/3 and inspector

-- ============================================================================
-- 1. UPDATE TASK_LIBRARY DEFAULT_ROLE CHECK CONSTRAINT
-- ============================================================================

-- Drop old constraint
ALTER TABLE task_library DROP CONSTRAINT IF EXISTS task_library_default_role_check;

-- Add new constraint with all roles
ALTER TABLE task_library ADD CONSTRAINT task_library_default_role_check
  CHECK (default_role IN (
    'appraiser',
    'reviewer',
    'admin',
    'trainee',
    'researcher_level_1',
    'researcher_level_2',
    'researcher_level_3',
    'inspector'
  ));

-- ============================================================================
-- 2. UPDATE TASK_LIBRARY_SUBTASKS DEFAULT_ROLE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE task_library_subtasks DROP CONSTRAINT IF EXISTS task_library_subtasks_default_role_check;

ALTER TABLE task_library_subtasks ADD CONSTRAINT task_library_subtasks_default_role_check
  CHECK (default_role IN (
    'appraiser',
    'reviewer',
    'admin',
    'trainee',
    'researcher_level_1',
    'researcher_level_2',
    'researcher_level_3',
    'inspector'
  ));

-- ============================================================================
-- 3. UPDATE PRODUCTION_TEMPLATE_TASKS DEFAULT_ROLE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE production_template_tasks DROP CONSTRAINT IF EXISTS production_template_tasks_default_role_check;

ALTER TABLE production_template_tasks ADD CONSTRAINT production_template_tasks_default_role_check
  CHECK (default_role IN (
    'appraiser',
    'reviewer',
    'admin',
    'trainee',
    'researcher_level_1',
    'researcher_level_2',
    'researcher_level_3',
    'inspector'
  ));

-- ============================================================================
-- 4. UPDATE PRODUCTION_TEMPLATE_SUBTASKS DEFAULT_ROLE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE production_template_subtasks DROP CONSTRAINT IF EXISTS production_template_subtasks_default_role_check;

ALTER TABLE production_template_subtasks ADD CONSTRAINT production_template_subtasks_default_role_check
  CHECK (default_role IN (
    'appraiser',
    'reviewer',
    'admin',
    'trainee',
    'researcher_level_1',
    'researcher_level_2',
    'researcher_level_3',
    'inspector'
  ));

-- ============================================================================
-- 5. UPDATE PRODUCTION_TASKS ROLE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE production_tasks DROP CONSTRAINT IF EXISTS production_tasks_role_check;

ALTER TABLE production_tasks ADD CONSTRAINT production_tasks_role_check
  CHECK (role IN (
    'appraiser',
    'reviewer',
    'admin',
    'trainee',
    'researcher_level_1',
    'researcher_level_2',
    'researcher_level_3',
    'inspector'
  ));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN task_library.default_role IS
  'Default role for this task: appraiser, reviewer, admin, trainee, researcher_level_1/2/3, or inspector';

COMMENT ON COLUMN production_template_tasks.default_role IS
  'Default role for this template task: appraiser, reviewer, admin, trainee, researcher_level_1/2/3, or inspector';
