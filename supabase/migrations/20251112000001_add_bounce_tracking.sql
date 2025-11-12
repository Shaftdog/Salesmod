-- =====================================================
-- BOUNCE TRACKING ENHANCEMENT
-- Add fields to track email bounces and tag contacts
-- =====================================================

-- Add tags field to contacts table for flexible tagging
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::JSONB;

-- Create index for tag queries
CREATE INDEX IF NOT EXISTS idx_contacts_tags
  ON public.contacts USING gin(tags);

-- Update email_suppressions reason constraint to include soft_bounce_tracking
ALTER TABLE public.email_suppressions
  DROP CONSTRAINT IF EXISTS email_suppressions_reason_check;

ALTER TABLE public.email_suppressions
  ADD CONSTRAINT email_suppressions_reason_check
  CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual', 'soft_bounce_tracking'));

-- Add bounce tracking fields to email_suppressions
ALTER TABLE public.email_suppressions
  ADD COLUMN IF NOT EXISTS bounce_type TEXT CHECK (bounce_type IN ('Permanent', 'Transient', 'Unknown')),
  ADD COLUMN IF NOT EXISTS bounce_subtype TEXT,
  ADD COLUMN IF NOT EXISTS bounce_message TEXT,
  ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_bounce_at TIMESTAMPTZ DEFAULT NOW();

-- Create email_notifications table for dashboard alerts
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bounce_hard', 'bounce_soft', 'suppression', 'delivery_issue')),
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_org
  ON public.email_notifications(org_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_notifications_contact
  ON public.email_notifications(contact_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_type
  ON public.email_notifications(type, created_at DESC);

-- Enable RLS on email_notifications
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.email_notifications FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "System can create notifications"
  ON public.email_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.email_notifications FOR UPDATE
  USING (auth.uid() = org_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.email_notifications FOR DELETE
  USING (auth.uid() = org_id);

-- Helper function to add tag to contact
CREATE OR REPLACE FUNCTION public.add_contact_tag(
  p_contact_id UUID,
  p_tag TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_tags JSONB;
  v_new_tags JSONB;
BEGIN
  -- Get current tags
  SELECT COALESCE(tags, '[]'::JSONB) INTO v_current_tags
  FROM public.contacts
  WHERE id = p_contact_id;

  -- Check if tag already exists
  IF v_current_tags ? p_tag THEN
    RETURN v_current_tags;
  END IF;

  -- Add new tag
  v_new_tags := v_current_tags || jsonb_build_array(p_tag);

  -- Update contact
  UPDATE public.contacts
  SET tags = v_new_tags, updated_at = NOW()
  WHERE id = p_contact_id;

  RETURN v_new_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to remove tag from contact
CREATE OR REPLACE FUNCTION public.remove_contact_tag(
  p_contact_id UUID,
  p_tag TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_tags JSONB;
  v_new_tags JSONB;
BEGIN
  -- Get current tags
  SELECT COALESCE(tags, '[]'::JSONB) INTO v_current_tags
  FROM public.contacts
  WHERE id = p_contact_id;

  -- Remove tag by filtering
  SELECT jsonb_agg(tag)
  INTO v_new_tags
  FROM jsonb_array_elements_text(v_current_tags) tag
  WHERE tag != p_tag;

  -- Handle case where all tags are removed
  v_new_tags := COALESCE(v_new_tags, '[]'::JSONB);

  -- Update contact
  UPDATE public.contacts
  SET tags = v_new_tags, updated_at = NOW()
  WHERE id = p_contact_id;

  RETURN v_new_tags;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if contact has tag
CREATE OR REPLACE FUNCTION public.contact_has_tag(
  p_contact_id UUID,
  p_tag TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_tag BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.contacts
    WHERE id = p_contact_id
      AND tags ? p_tag
  ) INTO v_has_tag;

  RETURN COALESCE(v_has_tag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for contacts with bounce status
CREATE OR REPLACE VIEW public.contacts_with_bounce_status AS
SELECT
  c.*,
  CASE
    WHEN c.tags ? 'email_bounced_hard' THEN 'hard_bounce'
    WHEN c.tags ? 'email_bounced_soft' THEN 'soft_bounce'
    WHEN es.id IS NOT NULL THEN 'suppressed'
    ELSE 'active'
  END as email_status,
  es.reason as suppression_reason,
  es.bounce_type,
  es.bounce_count,
  es.last_bounce_at
FROM public.contacts c
LEFT JOIN public.email_suppressions es ON es.contact_id = c.id;

-- Comments for documentation
COMMENT ON COLUMN public.contacts.tags IS 'JSONB array of tags for flexible contact categorization (e.g., ["email_bounced_hard", "vip"])';
COMMENT ON COLUMN public.email_suppressions.bounce_type IS 'Type of bounce: Permanent (hard bounce), Transient (soft bounce), or Unknown';
COMMENT ON COLUMN public.email_suppressions.bounce_count IS 'Number of times this email has bounced';
COMMENT ON TABLE public.email_notifications IS 'Dashboard notifications for email delivery issues';
COMMENT ON FUNCTION public.add_contact_tag IS 'Add a tag to a contact (idempotent)';
COMMENT ON FUNCTION public.remove_contact_tag IS 'Remove a tag from a contact';
COMMENT ON FUNCTION public.contact_has_tag IS 'Check if a contact has a specific tag';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
