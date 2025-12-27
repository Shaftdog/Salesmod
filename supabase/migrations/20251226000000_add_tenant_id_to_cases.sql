-- =============================================
-- Migration: Add tenant_id to cases and case_comments
-- Date: 2025-12-26
-- Description: Adds tenant isolation to cases system and updates status enum
-- =============================================

-- =============================================
-- STEP 1: Add tenant_id columns
-- =============================================

-- Add tenant_id to cases table (nullable first for backfill)
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Add tenant_id to case_comments table (nullable first for backfill)
ALTER TABLE public.case_comments
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- =============================================
-- STEP 2: Backfill tenant_id from created_by profile
-- =============================================

-- Backfill cases tenant_id from the creator's profile
UPDATE public.cases c
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE c.created_by = p.id
  AND c.tenant_id IS NULL
  AND p.tenant_id IS NOT NULL;

-- For any cases where creator has no tenant_id, use the default tenant
UPDATE public.cases c
SET tenant_id = (SELECT id FROM public.tenants LIMIT 1)
WHERE c.tenant_id IS NULL;

-- Backfill case_comments tenant_id from the parent case
UPDATE public.case_comments cc
SET tenant_id = c.tenant_id
FROM public.cases c
WHERE cc.case_id = c.id
  AND cc.tenant_id IS NULL;

-- =============================================
-- STEP 3: Make tenant_id NOT NULL
-- =============================================

-- Make tenant_id required on cases
ALTER TABLE public.cases
ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id required on case_comments
ALTER TABLE public.case_comments
ALTER COLUMN tenant_id SET NOT NULL;

-- =============================================
-- STEP 4: Add indexes for tenant_id
-- =============================================

CREATE INDEX IF NOT EXISTS idx_cases_tenant_id ON public.cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_comments_tenant_id ON public.case_comments(tenant_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON public.cases(tenant_id, status);

-- =============================================
-- STEP 5: Update status CHECK constraint for Kanban workflow
-- =============================================

-- FIRST: Drop the old constraint to allow migration
ALTER TABLE public.cases DROP CONSTRAINT IF EXISTS cases_status_check;

-- SECOND: Migrate existing statuses to new workflow (BEFORE adding new constraint)
UPDATE public.cases SET status = 'new' WHERE status = 'open';
UPDATE public.cases SET status = 'working' WHERE status = 'pending';
UPDATE public.cases SET status = 'in_production' WHERE status = 'in_progress';
UPDATE public.cases SET status = 'completed' WHERE status = 'resolved';
UPDATE public.cases SET status = 'completed' WHERE status = 'closed';
UPDATE public.cases SET status = 'new' WHERE status = 'reopened';

-- THIRD: Add new constraint with all 10 Kanban statuses (after data is migrated)
ALTER TABLE public.cases ADD CONSTRAINT cases_status_check
CHECK (status IN (
  'new',
  'working',
  'in_production',
  'correction',
  'impeded',
  'workshop_meeting',
  'review',
  'deliver',
  'completed',
  'process_improvement'
));

-- =============================================
-- STEP 6: Drop old permissive RLS policies
-- =============================================

DROP POLICY IF EXISTS "Users can view cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete cases" ON public.cases;
DROP POLICY IF EXISTS "cases_select_policy" ON public.cases;
DROP POLICY IF EXISTS "cases_insert_policy" ON public.cases;
DROP POLICY IF EXISTS "cases_update_policy" ON public.cases;
DROP POLICY IF EXISTS "cases_delete_policy" ON public.cases;

DROP POLICY IF EXISTS "Users can view case comments" ON public.case_comments;
DROP POLICY IF EXISTS "Users can create case comments" ON public.case_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.case_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.case_comments;
DROP POLICY IF EXISTS "case_comments_select_policy" ON public.case_comments;
DROP POLICY IF EXISTS "case_comments_insert_policy" ON public.case_comments;
DROP POLICY IF EXISTS "case_comments_update_policy" ON public.case_comments;
DROP POLICY IF EXISTS "case_comments_delete_policy" ON public.case_comments;

-- =============================================
-- STEP 7: Create tenant-scoped RLS policies
-- =============================================

-- Enable RLS (idempotent)
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_comments ENABLE ROW LEVEL SECURITY;

-- Cases: SELECT - Users can only see cases in their tenant
CREATE POLICY cases_tenant_select ON public.cases
FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Cases: INSERT - Users can only create cases in their tenant
CREATE POLICY cases_tenant_insert ON public.cases
FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Cases: UPDATE - Users can only update cases in their tenant
CREATE POLICY cases_tenant_update ON public.cases
FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Cases: DELETE - Users can only delete cases in their tenant
CREATE POLICY cases_tenant_delete ON public.cases
FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Case Comments: SELECT
CREATE POLICY case_comments_tenant_select ON public.case_comments
FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Case Comments: INSERT
CREATE POLICY case_comments_tenant_insert ON public.case_comments
FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Case Comments: UPDATE - Only own comments
CREATE POLICY case_comments_tenant_update ON public.case_comments
FOR UPDATE
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  AND created_by = auth.uid()
)
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Case Comments: DELETE - Only own comments
CREATE POLICY case_comments_tenant_delete ON public.case_comments
FOR DELETE
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  AND created_by = auth.uid()
);

-- =============================================
-- STEP 8: Create trigger to auto-set tenant_id on insert
-- =============================================

-- Function to auto-set tenant_id from user's profile
CREATE OR REPLACE FUNCTION public.set_case_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  IF NEW.tenant_id IS NULL THEN
    -- Get user's tenant_id from their profile
    SELECT tenant_id INTO user_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();

    -- Validate that user has a tenant_id
    IF user_tenant_id IS NULL THEN
      RAISE EXCEPTION 'User must have a tenant_id to create cases. Please ensure your profile is properly configured.';
    END IF;

    NEW.tenant_id := user_tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for cases
DROP TRIGGER IF EXISTS set_case_tenant_id_trigger ON public.cases;
CREATE TRIGGER set_case_tenant_id_trigger
BEFORE INSERT ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.set_case_tenant_id();

-- Trigger for case_comments
DROP TRIGGER IF EXISTS set_case_comment_tenant_id_trigger ON public.case_comments;
CREATE TRIGGER set_case_comment_tenant_id_trigger
BEFORE INSERT ON public.case_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_case_tenant_id();

-- =============================================
-- VERIFICATION QUERIES (for manual checking)
-- =============================================
-- SELECT COUNT(*) FROM cases WHERE tenant_id IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM case_comments WHERE tenant_id IS NULL; -- Should be 0
-- SELECT DISTINCT status FROM cases; -- Should show new statuses
