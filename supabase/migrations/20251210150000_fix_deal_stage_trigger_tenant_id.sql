-- =============================================
-- Fix deal stage change trigger to include tenant_id
-- Created: 2025-12-10
-- Fix for: "null value in column 'tenant_id' of relation 'activities' violates not-null constraint"
-- This trigger was missing tenant_id when logging deal stage changes
-- =============================================

-- Update the trigger to include tenant_id when logging stage changes
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage != OLD.stage THEN
    INSERT INTO public.activities (
      tenant_id,  -- Required for multi-tenant RLS
      client_id,
      deal_id,
      activity_type,
      subject,
      description,
      status,
      completed_at,
      created_by
    ) VALUES (
      NEW.tenant_id,  -- Get tenant_id from the deal being updated
      NEW.client_id,
      NEW.id,
      'note',
      'Deal stage changed: ' || NEW.title,
      'Deal moved from ' || OLD.stage || ' to ' || NEW.stage,
      'completed',
      NOW(),
      NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the fix
COMMENT ON FUNCTION log_deal_stage_change IS 'Logs an activity note when a deal changes stage. Includes tenant_id for multi-tenant RLS support.';
