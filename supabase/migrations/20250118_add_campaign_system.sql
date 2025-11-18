-- =====================================================
-- CAMPAIGN MANAGEMENT SYSTEM - V1
-- Created: 2025-01-18
-- Description: Email campaign system for re-engagement
-- =====================================================

-- =====================================================
-- CAMPAIGNS TABLE (create before email_suppressions)
-- =====================================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL DEFAULT 'email', -- 'email' only for v1
  status TEXT NOT NULL DEFAULT 'draft',  -- 'draft', 'scheduled', 'active', 'paused', 'completed'

  -- Target audience
  target_segment JSONB,

  -- Email content
  email_subject TEXT,
  email_body TEXT,
  email_template_id UUID, -- FK added later after email_templates created
  used_merge_tokens TEXT[], -- List of tokens used (for validation)

  -- Rate limiting
  send_rate_per_hour INT DEFAULT 75,
  send_batch_size INT DEFAULT 25,

  -- Scheduling
  start_at TIMESTAMPTZ, -- If null, start immediately on launch

  -- Job integration (FK assumes jobs table exists from earlier migration)
  primary_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- N8n list integration (if using existing list)
  n8n_list_id TEXT,

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX campaigns_org_id_idx ON campaigns(org_id);
CREATE INDEX campaigns_status_idx ON campaigns(status);
CREATE INDEX campaigns_created_at_idx ON campaigns(created_at DESC);
CREATE INDEX campaigns_start_at_idx ON campaigns(start_at) WHERE start_at IS NOT NULL;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_org_isolation ON campaigns
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- =====================================================
-- EMAIL SUPPRESSIONS (now campaigns exists for FK)
-- =====================================================
-- Drop and recreate to add campaign_id FK
DROP TABLE IF EXISTS email_suppressions CASCADE;

CREATE TABLE email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  email_address TEXT NOT NULL,
  reason TEXT, -- 'unsubscribed', 'bounced', 'spam_complaint', 'manual'

  -- Optional links (now campaigns exists)
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (org_id, email_address)
);

CREATE INDEX email_suppressions_org_id_idx ON email_suppressions(org_id);
CREATE INDEX email_suppressions_email_idx ON email_suppressions(email_address);

ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_suppressions_org_isolation ON email_suppressions
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- =====================================================
-- EMAIL TEMPLATES
-- =====================================================
-- Drop and recreate to ensure proper schema
DROP TABLE IF EXISTS email_templates CASCADE;

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Merge tokens used (for validation)
  merge_tokens TEXT[], -- ['first_name', 'company_name', 'last_order_date']

  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX email_templates_org_id_idx ON email_templates(org_id);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_org_isolation ON email_templates
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Now add FK to campaigns
ALTER TABLE campaigns ADD CONSTRAINT campaigns_email_template_id_fkey
  FOREIGN KEY (email_template_id) REFERENCES email_templates(id) ON DELETE SET NULL;

-- =====================================================
-- CAMPAIGN RESPONSES (one row per reply)
-- =====================================================
CREATE TABLE campaign_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Who responded
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,

  -- Attribution (first-class columns, not just metadata)
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  job_task_id BIGINT REFERENCES job_tasks(id) ON DELETE SET NULL,
  gmail_message_id TEXT,

  -- Classification
  sentiment TEXT, -- 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  disposition TEXT, -- 'HAS_ACTIVE_PROFILE' | 'NO_ACTIVE_PROFILE' | 'INTERESTED' | 'NEEDS_MORE_INFO' | 'NOT_INTERESTED' | 'OUT_OF_OFFICE' | 'ESCALATE_UNCLEAR'

  -- Content
  response_text TEXT NOT NULL,
  ai_summary TEXT,

  -- Timing
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX campaign_responses_org_id_idx ON campaign_responses(org_id);
CREATE INDEX campaign_responses_campaign_id_idx ON campaign_responses(campaign_id);
CREATE INDEX campaign_responses_job_task_id_idx ON campaign_responses(job_task_id);
CREATE INDEX campaign_responses_disposition_idx ON campaign_responses(disposition);
CREATE INDEX campaign_responses_sentiment_idx ON campaign_responses(sentiment);
CREATE INDEX campaign_responses_received_at_idx ON campaign_responses(received_at DESC);

ALTER TABLE campaign_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_responses_org_isolation ON campaign_responses
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- =====================================================
-- CAMPAIGN CONTACT STATUS (latest state per recipient)
-- =====================================================
CREATE TABLE campaign_contact_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Recipient
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,

  -- Current state
  last_event TEXT NOT NULL, -- 'pending' | 'sent' | 'replied' | 'bounced' | 'failed' | 'unsubscribed'
  last_sentiment TEXT, -- 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  last_disposition TEXT, -- 'HAS_ACTIVE_PROFILE' | 'NO_ACTIVE_PROFILE' | etc.

  -- Tracking
  sent_at TIMESTAMPTZ,
  last_reply_at TIMESTAMPTZ,
  last_reply_summary TEXT,
  reply_count INT DEFAULT 0,

  -- Task tracking
  open_tasks_count INT DEFAULT 0,

  -- Attribution
  job_task_id BIGINT REFERENCES job_tasks(id) ON DELETE SET NULL,
  latest_response_id UUID REFERENCES campaign_responses(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One status row per contact per campaign
  UNIQUE(campaign_id, email_address)
);

CREATE INDEX campaign_contact_status_org_id_idx ON campaign_contact_status(org_id);
CREATE INDEX campaign_contact_status_campaign_id_idx ON campaign_contact_status(campaign_id);
CREATE INDEX campaign_contact_status_last_event_idx ON campaign_contact_status(last_event);
CREATE INDEX campaign_contact_status_last_disposition_idx ON campaign_contact_status(last_disposition);
CREATE INDEX campaign_contact_status_email_idx ON campaign_contact_status(email_address);

ALTER TABLE campaign_contact_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaign_contact_status_org_isolation ON campaign_contact_status
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- =====================================================
-- HELPER FUNCTIONS FOR INCREMENTS
-- =====================================================

-- Increment reply_count
CREATE OR REPLACE FUNCTION increment_reply_count(
  p_campaign_id UUID,
  p_email_address TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaign_contact_status
  SET reply_count = reply_count + 1,
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND email_address = p_email_address;
END;
$$;

-- Increment open_tasks_count
CREATE OR REPLACE FUNCTION increment_open_tasks_count(
  p_campaign_id UUID,
  p_email_address TEXT,
  p_increment INT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaign_contact_status
  SET open_tasks_count = open_tasks_count + p_increment,
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND email_address = p_email_address;
END;
$$;

-- Decrement open_tasks_count (when task completed)
CREATE OR REPLACE FUNCTION decrement_open_tasks_count(
  p_campaign_id UUID,
  p_email_address TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE campaign_contact_status
  SET open_tasks_count = GREATEST(0, open_tasks_count - 1),
      updated_at = NOW()
  WHERE campaign_id = p_campaign_id
    AND email_address = p_email_address;
END;
$$;

-- =====================================================
-- EXTEND EXISTING TABLES (first-class campaign_id columns)
-- =====================================================

-- Add campaign_id to jobs (NOT just in metadata)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS jobs_campaign_id_idx ON jobs(campaign_id);

-- Add campaign_id to job_tasks (NOT just in metadata)
ALTER TABLE job_tasks ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS job_tasks_campaign_id_idx ON job_tasks(campaign_id);

-- Add campaign tracking to kanban_cards
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS campaign_response_id UUID REFERENCES campaign_responses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS kanban_cards_campaign_id_idx ON kanban_cards(campaign_id);
CREATE INDEX IF NOT EXISTS kanban_cards_campaign_response_id_idx ON kanban_cards(campaign_response_id);
