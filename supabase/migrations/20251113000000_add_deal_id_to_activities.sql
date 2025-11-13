-- =============================================
-- Add deal_id to activities table
-- Allows tracking activities (calls, emails, meetings) for deals
-- =============================================

-- Add deal_id column to activities table
ALTER TABLE public.activities
ADD COLUMN deal_id UUID REFERENCES public.deals ON DELETE SET NULL;

-- Create index for efficient filtering by deal_id
CREATE INDEX idx_activities_deal_id ON public.activities(deal_id);

-- Add comment
COMMENT ON COLUMN public.activities.deal_id IS 'Reference to deal/opportunity this activity is related to';

-- Update the trigger to include deal_id when logging stage changes
CREATE OR REPLACE FUNCTION log_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage != OLD.stage THEN
    INSERT INTO public.activities (
      client_id,
      deal_id,
      activity_type,
      subject,
      description,
      status,
      completed_at,
      created_by
    ) VALUES (
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
