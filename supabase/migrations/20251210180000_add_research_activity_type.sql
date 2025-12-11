-- Add 'research' to the activities_activity_type_check constraint
-- This allows the AI agent to save research activities

-- Drop the existing constraint
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

-- Add the updated constraint with 'research' included
ALTER TABLE public.activities
ADD CONSTRAINT activities_activity_type_check
CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'research'));
