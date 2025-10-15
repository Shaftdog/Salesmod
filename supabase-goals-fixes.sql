-- =============================================
-- Goals Tracking Fixes
-- Addresses code review feedback
-- =============================================

-- Fix #1: Add partial unique index for team goals
-- Multiple NULLs aren't considered equal in Postgres,
-- so we need a separate constraint for team goals
CREATE UNIQUE INDEX IF NOT EXISTS uniq_team_goals 
ON public.goals(metric_type, period_start, period_end) 
WHERE assigned_to IS NULL;

-- Fix #2: Add composite index for better performance
-- Optimizes queries filtering by assigned_to and is_active together
CREATE INDEX IF NOT EXISTS idx_goals_assigned_active 
ON public.goals(assigned_to, is_active);

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON INDEX uniq_team_goals IS 'Ensures unique team goals (NULL assigned_to) per metric and period';
COMMENT ON INDEX idx_goals_assigned_active IS 'Optimizes personal dashboard queries filtering by user and active status';


