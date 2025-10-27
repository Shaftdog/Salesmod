-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL, -- e.g., 'general', 'email', 'integrations', 'features'
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Whether setting can be accessed without admin role
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);

-- RLS Policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read all settings
CREATE POLICY "Admins can read all settings" ON public.settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON public.settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON public.settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete settings
CREATE POLICY "Admins can delete settings" ON public.settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Public settings can be read by authenticated users
CREATE POLICY "Authenticated users can read public settings" ON public.settings
  FOR SELECT USING (
    is_public = true AND auth.uid() IS NOT NULL
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER settings_updated_at_trigger
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Seed default settings
INSERT INTO public.settings (key, value, category, description, is_public) VALUES
  -- General Settings
  ('site_name', '"AppraiseTrack"', 'general', 'Name of the application', true),
  ('timezone', '"America/New_York"', 'general', 'Default timezone for the application', false),
  ('date_format', '"MM/dd/yyyy"', 'general', 'Default date format', false),
  ('time_format', '"12h"', 'general', 'Time format (12h or 24h)', false),

  -- Email Settings
  ('email_from_address', '"noreply@appraisetrack.com"', 'email', 'Default sender email address', false),
  ('email_from_name', '"AppraiseTrack"', 'email', 'Default sender name', false),
  ('smtp_enabled', 'false', 'email', 'Enable SMTP email sending', false),

  -- Feature Flags
  ('feature_user_registration', 'true', 'features', 'Allow new user registration', false),
  ('feature_email_notifications', 'true', 'features', 'Enable email notifications', false),
  ('feature_audit_logging', 'true', 'features', 'Enable audit logging', false),
  ('feature_analytics', 'true', 'features', 'Enable analytics tracking', false),

  -- Integration Settings
  ('hubspot_enabled', 'false', 'integrations', 'Enable HubSpot integration', false),
  ('asana_enabled', 'false', 'integrations', 'Enable Asana integration', false),

  -- AI Settings
  ('ai_model', '"claude-3-5-sonnet-20241022"', 'ai', 'AI model to use for agent processing', false),
  ('ai_temperature', '0.7', 'ai', 'AI model temperature setting', false),
  ('ai_enabled', 'true', 'ai', 'Enable AI features', false)
ON CONFLICT (key) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.settings IS 'System-wide configuration settings for the application';
