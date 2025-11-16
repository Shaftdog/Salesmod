-- Migration: Add Performance Indexes for Marketing Module
-- Created: 2025-11-16
-- Purpose: Improve query performance for marketing tables

-- =============================================
-- CONTENT SCHEDULE INDEXES
-- =============================================

-- Content schedule queries often filter by org_id + channel
CREATE INDEX IF NOT EXISTS idx_content_schedule_org_channel
  ON public.content_schedule(org_id, channel);

-- Filter by scheduled date for upcoming content
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_date
  ON public.content_schedule(scheduled_for)
  WHERE status IN ('draft', 'scheduled');

-- =============================================
-- LEAD SCORES INDEXES
-- =============================================

-- Lead scores queries often filter by contact_id + label
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact_label
  ON public.lead_scores(contact_id, label);

-- Filter by org for top leads queries
CREATE INDEX IF NOT EXISTS idx_lead_scores_org_total_score
  ON public.lead_scores(org_id, total_score DESC);

-- =============================================
-- EMAIL SENDS INDEXES
-- =============================================

-- Email sends queries often filter by campaign + contact
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_contact
  ON public.email_sends(email_campaign_id, contact_id);

-- Filter by sent_at for tracking sends
CREATE INDEX IF NOT EXISTS idx_email_sends_sent_at
  ON public.email_sends(sent_at DESC)
  WHERE sent_at IS NOT NULL;

-- Filter by bounced status
CREATE INDEX IF NOT EXISTS idx_email_sends_bounced
  ON public.email_sends(bounced)
  WHERE bounced = true;

-- =============================================
-- WEBINAR REGISTRATIONS INDEXES
-- =============================================

-- Webinar registrations filtered by webinar + attended status
CREATE INDEX IF NOT EXISTS idx_webinar_reg_webinar_attended
  ON public.webinar_registrations(webinar_id, attended);

-- Filter by contact for user's registration history
CREATE INDEX IF NOT EXISTS idx_webinar_reg_contact
  ON public.webinar_registrations(contact_id, registered_at DESC);

-- =============================================
-- NEWSLETTER ISSUES INDEXES
-- =============================================

-- Newsletter issues filtered by newsletter + status
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_newsletter_status
  ON public.newsletter_issues(newsletter_id, status);

-- Filter by scheduled date for sending queue
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_scheduled
  ON public.newsletter_issues(scheduled_for)
  WHERE status = 'scheduled';

-- =============================================
-- MARKETING CAMPAIGNS INDEXES
-- =============================================

-- Campaign queries filter by org + status
CREATE INDEX IF NOT EXISTS idx_campaigns_org_status
  ON public.marketing_campaigns(org_id, status);

-- Filter by date range for active campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range
  ON public.marketing_campaigns(start_date, end_date)
  WHERE status IN ('active', 'scheduled');

-- =============================================
-- EMAIL TEMPLATES INDEXES
-- =============================================

-- Template queries filter by org + category
CREATE INDEX IF NOT EXISTS idx_email_templates_org_category
  ON public.email_templates(org_id, category)
  WHERE is_active = true;

-- =============================================
-- NEWSLETTERS INDEXES
-- =============================================

-- Newsletter queries filter by org + is_active
CREATE INDEX IF NOT EXISTS idx_newsletters_org_active
  ON public.marketing_newsletters(org_id, is_active);

-- =============================================
-- WEBINARS INDEXES
-- =============================================

-- Webinar queries filter by org + status
CREATE INDEX IF NOT EXISTS idx_webinars_org_status
  ON public.webinars(org_id, status);

-- Filter by scheduled date for upcoming webinars
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled
  ON public.webinars(scheduled_at)
  WHERE status IN ('draft', 'scheduled');

-- =============================================
-- ANALYTICS COMMENT
-- =============================================

COMMENT ON INDEX idx_content_schedule_org_channel IS 'Improves performance for org-level content queries';
COMMENT ON INDEX idx_lead_scores_contact_label IS 'Optimizes contact lead score lookups';
COMMENT ON INDEX idx_lead_scores_org_total_score IS 'Enables fast top leads queries by organization';
COMMENT ON INDEX idx_email_sends_campaign_contact IS 'Speeds up campaign email tracking';
COMMENT ON INDEX idx_email_sends_sent_at IS 'Optimizes queries for sent email history';
COMMENT ON INDEX idx_webinar_reg_webinar_attended IS 'Improves webinar attendance queries';
COMMENT ON INDEX idx_newsletter_issues_newsletter_status IS 'Optimizes newsletter issue filtering';
