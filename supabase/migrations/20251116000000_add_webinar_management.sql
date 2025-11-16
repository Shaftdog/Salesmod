-- Migration: Add Webinar Management Tables
-- Created: 2025-11-16

-- Webinars table
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns,

  title TEXT NOT NULL,
  description TEXT,
  presenter_name TEXT,
  presenter_title TEXT,

  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT DEFAULT 'UTC',

  webinar_url TEXT, -- Zoom, Google Meet, etc.
  recording_url TEXT,

  max_attendees INTEGER,
  registration_deadline TIMESTAMPTZ,

  status TEXT CHECK (status IN ('draft', 'scheduled', 'live', 'completed', 'cancelled')) DEFAULT 'draft',

  -- Targeting (who should see this webinar)
  target_role_codes TEXT[],
  target_role_categories TEXT[],
  include_tags TEXT[],
  min_lead_score INTEGER,

  -- Email automation settings
  send_confirmation_email BOOLEAN DEFAULT true,
  send_reminder_email BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  send_followup_email BOOLEAN DEFAULT true,

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webinars_org_id ON public.webinars(org_id);
CREATE INDEX idx_webinars_scheduled_at ON public.webinars(scheduled_at);
CREATE INDEX idx_webinars_status ON public.webinars(status);

-- Webinar Registrations table
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id UUID REFERENCES public.webinars ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts ON DELETE CASCADE NOT NULL,

  registered_at TIMESTAMPTZ DEFAULT NOW(),
  registration_source TEXT, -- 'manual', 'email_campaign', 'website', 'api'

  -- Email tracking
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  -- Attendance
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  attendance_duration_minutes INTEGER,

  -- Follow-up
  followup_sent_at TIMESTAMPTZ,

  -- Optional registration fields
  questions_answers JSONB, -- Custom registration questions

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(webinar_id, contact_id)
);

CREATE INDEX idx_webinar_registrations_webinar_id ON public.webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_contact_id ON public.webinar_registrations(contact_id);
CREATE INDEX idx_webinar_registrations_attended ON public.webinar_registrations(attended);

-- Add RLS policies
ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- Webinars policies
CREATE POLICY "Users can view webinars from their org" ON public.webinars
  FOR SELECT USING (org_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert webinars for their org" ON public.webinars
  FOR INSERT WITH CHECK (org_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update webinars from their org" ON public.webinars
  FOR UPDATE USING (org_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete webinars from their org" ON public.webinars
  FOR DELETE USING (org_id = (SELECT id FROM public.profiles WHERE id = auth.uid()));

-- Webinar registrations policies
CREATE POLICY "Users can view registrations for their org webinars" ON public.webinar_registrations
  FOR SELECT USING (
    webinar_id IN (
      SELECT id FROM public.webinars WHERE org_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert registrations for their org webinars" ON public.webinar_registrations
  FOR INSERT WITH CHECK (
    webinar_id IN (
      SELECT id FROM public.webinars WHERE org_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update registrations for their org webinars" ON public.webinar_registrations
  FOR UPDATE USING (
    webinar_id IN (
      SELECT id FROM public.webinars WHERE org_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete registrations for their org webinars" ON public.webinar_registrations
  FOR DELETE USING (
    webinar_id IN (
      SELECT id FROM public.webinars WHERE org_id = (SELECT id FROM public.profiles WHERE id = auth.uid())
    )
  );
