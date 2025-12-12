-- Migration: Expand Task Library Roles to 8
-- Updates CHECK constraints on task_library and task_library_subtasks tables

-- Drop and recreate CHECK constraint on task_library.default_role
ALTER TABLE task_library
  DROP CONSTRAINT IF EXISTS task_library_default_role_check;

ALTER TABLE task_library
  ADD CONSTRAINT task_library_default_role_check
  CHECK (default_role IN (
    'appraiser', 'reviewer', 'admin', 'trainee',
    'researcher_level_1', 'researcher_level_2', 'researcher_level_3', 'inspector'
  ));

-- Drop and recreate CHECK constraint on task_library_subtasks.default_role
ALTER TABLE task_library_subtasks
  DROP CONSTRAINT IF EXISTS task_library_subtasks_default_role_check;

ALTER TABLE task_library_subtasks
  ADD CONSTRAINT task_library_subtasks_default_role_check
  CHECK (default_role IN (
    'appraiser', 'reviewer', 'admin', 'trainee',
    'researcher_level_1', 'researcher_level_2', 'researcher_level_3', 'inspector'
  ));
