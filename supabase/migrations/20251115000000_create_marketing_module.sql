-- =============================================
-- MARKETING MODULE - Phase 1 Foundation
-- =============================================

-- =============================================
-- 1. MARKETING CAMPAIGNS
-- =============================================

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('reactivation', 'nurture', 'acquisition', 'education', 'retention', 'brand_awareness')),
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date DATE NOT NULL,
  end_date DATE,

  -- AUDIENCE TARGETING (using existing party_roles + tags)
  target_role_codes TEXT[], -- e.g., ['mortgage_lender', 'loan_officer']
  target_role_categories TEXT[], -- e.g., ['lender', 'investor']
  exclude_role_codes TEXT[], -- e.g., ['unknown', 'delete_flag']
  include_tags TEXT[], -- e.g., ['VIP', 'High Volume']
  exclude_tags TEXT[], -- e.g., ['At Risk', 'Inactive']
  min_lead_score INTEGER, -- Filter by lead score (0-100)
  additional_filters JSONB, -- { lastActivityDays: 30, hasOrders: true, etc. }

  channels TEXT[], -- ['email', 'linkedin', 'blog', 'newsletter', 'webinar']
  metrics JSONB, -- performance tracking: { impressions, clicks, leads, deals, revenue }

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org_id ON public.marketing_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_start_date ON public.marketing_campaigns(start_date DESC);

-- =============================================
-- 2. MARKETING CONTENT LIBRARY
-- =============================================

CREATE TABLE IF NOT EXISTS public.marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns ON DELETE SET NULL,

  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'social_post', 'email', 'case_study', 'testimonial', 'market_update', 'educational')),

  -- Multi-format content storage
  body JSONB NOT NULL, -- { short: '...', medium: '...', long: '...', html: '...' }

  -- Categorization
  audience_tags TEXT[], -- ['lenders', 'investors', 'realtors']
  theme_tags TEXT[], -- ['203k', 'DSCR', 'valuation', 'market_trends']
  funnel_stage TEXT CHECK (funnel_stage IN ('awareness', 'consideration', 'conversion', 'retention')),

  -- Publishing workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'approved', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Metadata
  featured_image_url TEXT,
  preview_text TEXT,

  created_by UUID REFERENCES public.profiles NOT NULL,
  approved_by UUID REFERENCES public.profiles,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_content_org_id ON public.marketing_content(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON public.marketing_content(status);
CREATE INDEX IF NOT EXISTS idx_marketing_content_type ON public.marketing_content(content_type);
CREATE INDEX IF NOT EXISTS idx_marketing_content_campaign ON public.marketing_content(campaign_id);

-- =============================================
-- 3. CONTENT SCHEDULE (Calendar)
-- =============================================

CREATE TABLE IF NOT EXISTS public.content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  content_id UUID REFERENCES public.marketing_content ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns ON DELETE SET NULL,

  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'substack', 'tiktok', 'instagram', 'facebook', 'pinterest', 'youtube', 'blog', 'newsletter')),

  scheduled_for TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,

  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,

  -- Platform-specific IDs
  platform_post_id TEXT, -- ID from LinkedIn, Instagram, etc.
  platform_url TEXT, -- URL to published content

  -- Engagement metrics
  engagement_metrics JSONB, -- { views, likes, shares, comments, clicks, opens }

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_schedule_org_id ON public.content_schedule(org_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled ON public.content_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_schedule_content ON public.content_schedule(content_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_campaign ON public.content_schedule(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON public.content_schedule(status);

-- =============================================
-- 4. LEAD SCORING
-- =============================================

CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts ON DELETE CASCADE NOT NULL UNIQUE,

  -- Score components (total = fit + engagement + recency + value)
  fit_score INTEGER DEFAULT 0 CHECK (fit_score >= 0 AND fit_score <= 25),
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 50),
  recency_score INTEGER DEFAULT 0 CHECK (recency_score >= 0 AND recency_score <= 15),
  value_score INTEGER DEFAULT 0 CHECK (value_score >= 0 AND value_score <= 10),
  total_score INTEGER DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),

  -- Computed label
  label TEXT DEFAULT 'cold' CHECK (label IN ('cold', 'warm', 'hot')),

  -- Detailed engagement signals
  signals JSONB, -- { emailOpens, emailClicks, websiteVisits, webinarAttendance, socialInteractions, lastEngagement, preferredChannels, topicInterests }

  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_contact ON public.lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_total ON public.lead_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_label ON public.lead_scores(label);

-- =============================================
-- 5. MARKETING AUDIENCES (Saved Segments)
-- =============================================

CREATE TABLE IF NOT EXISTS public.marketing_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Saved filter configuration (same structure as campaigns)
  target_role_codes TEXT[],
  target_role_categories TEXT[],
  exclude_role_codes TEXT[],
  include_tags TEXT[],
  exclude_tags TEXT[],
  min_lead_score INTEGER,
  additional_filters JSONB,

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_audiences_org_id ON public.marketing_audiences(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_audiences_active ON public.marketing_audiences(is_active);

-- =============================================
-- 6. NEWSLETTERS
-- =============================================

CREATE TABLE IF NOT EXISTS public.marketing_newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Target audience (uses role system)
  target_role_codes TEXT[],
  target_role_categories TEXT[],
  include_tags TEXT[],

  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  template_id UUID, -- Reference to email_templates (will create later)

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_newsletters_org_id ON public.marketing_newsletters(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_newsletters_active ON public.marketing_newsletters(is_active);

-- =============================================
-- 7. NEWSLETTER ISSUES
-- =============================================

CREATE TABLE IF NOT EXISTS public.newsletter_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID REFERENCES public.marketing_newsletters ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns ON DELETE SET NULL,

  subject TEXT NOT NULL,
  intro_text TEXT,

  -- Content blocks (array of content references and custom sections)
  content_blocks JSONB, -- [{ type: 'content', contentId: '...', order: 1 }, { type: 'custom', html: '...', order: 2 }]

  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),

  -- Metrics
  metrics JSONB, -- { sent: 1000, delivered: 995, opened: 450, clicked: 120, unsubscribed: 5 }

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_issues_newsletter ON public.newsletter_issues(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_campaign ON public.newsletter_issues(campaign_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_status ON public.newsletter_issues(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_issues_scheduled ON public.newsletter_issues(scheduled_for);

-- =============================================
-- 8. EMAIL TEMPLATES
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('newsletter', 'campaign', 'follow_up', 'announcement', 'transactional')),

  subject_template TEXT NOT NULL, -- Can include {{variables}}
  preview_text TEXT,
  body_template TEXT NOT NULL, -- HTML template with {{variables}}

  -- Available variables for substitution
  variables JSONB, -- { "first_name": "Contact first name", "company_name": "Client company", etc. }

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_org_id ON public.email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON public.email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- =============================================
-- 9. EMAIL CAMPAIGNS (Detailed)
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.marketing_campaigns ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates ON DELETE SET NULL,

  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,

  -- Sender info
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,

  -- Audience
  audience_filter JSONB, -- Same structure as campaign targeting

  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),

  -- Metrics
  metrics JSONB, -- { sent, delivered, opened, clicked, bounced, unsubscribed }

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org_id ON public.email_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign ON public.email_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON public.email_campaigns(scheduled_for);

-- =============================================
-- 10. EMAIL SENDS (Individual tracking)
-- =============================================

CREATE TABLE IF NOT EXISTS public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_campaign_id UUID REFERENCES public.email_campaigns ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts ON DELETE CASCADE NOT NULL,

  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ, -- First open
  first_click_at TIMESTAMPTZ,

  -- Event tracking
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,

  bounced BOOLEAN DEFAULT false,
  bounce_reason TEXT,
  bounce_type TEXT, -- 'hard', 'soft', 'complaint'

  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON public.email_sends(email_campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_contact ON public.email_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_opened ON public.email_sends(opened_at) WHERE opened_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_sends_clicked ON public.email_sends(first_click_at) WHERE first_click_at IS NOT NULL;

-- =============================================
-- 11. CONTACT PREFERENCES (GDPR/CAN-SPAM)
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_preferences (
  contact_id UUID PRIMARY KEY REFERENCES public.contacts ON DELETE CASCADE,

  -- Email preferences
  email_types JSONB, -- { newsletter: true, marketing: true, transactional: true, product_updates: false }

  -- Channel preferences
  channels JSONB, -- { email: true, sms: false, phone: true }

  -- Frequency
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'never')),

  -- Opt-out
  opted_out BOOLEAN DEFAULT false,
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_preferences_opted_out ON public.contact_preferences(opted_out);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Marketing Campaigns
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketing campaigns in their org"
  ON public.marketing_campaigns FOR SELECT
  TO authenticated
  USING (true); -- Will add org_id filtering in app layer

CREATE POLICY "Users can manage marketing campaigns"
  ON public.marketing_campaigns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketing Content
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketing content"
  ON public.marketing_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage marketing content"
  ON public.marketing_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content Schedule
ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content schedule"
  ON public.content_schedule FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage content schedule"
  ON public.content_schedule FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Scores
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead scores"
  ON public.lead_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage lead scores"
  ON public.lead_scores FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Marketing Audiences
ALTER TABLE public.marketing_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view marketing audiences"
  ON public.marketing_audiences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage marketing audiences"
  ON public.marketing_audiences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Newsletters
ALTER TABLE public.marketing_newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view newsletters"
  ON public.marketing_newsletters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage newsletters"
  ON public.marketing_newsletters FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Newsletter Issues
ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view newsletter issues"
  ON public.newsletter_issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage newsletter issues"
  ON public.newsletter_issues FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Email Templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Email Campaigns
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email campaigns"
  ON public.email_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage email campaigns"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Email Sends
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view email sends"
  ON public.email_sends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage email sends"
  ON public.email_sends FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contact Preferences
ALTER TABLE public.contact_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact preferences"
  ON public.contact_preferences FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage contact preferences"
  ON public.contact_preferences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.marketing_campaigns IS 'Marketing campaigns with role-based audience targeting';
COMMENT ON TABLE public.marketing_content IS 'Multi-format content library for all marketing channels';
COMMENT ON TABLE public.content_schedule IS 'Content calendar and publishing schedule';
COMMENT ON TABLE public.lead_scores IS 'Contact engagement scoring (fit + engagement + recency + value)';
COMMENT ON TABLE public.marketing_audiences IS 'Saved audience segments for reuse across campaigns';
COMMENT ON TABLE public.marketing_newsletters IS 'Newsletter definitions with target audiences';
COMMENT ON TABLE public.newsletter_issues IS 'Individual newsletter issues/editions';
COMMENT ON TABLE public.email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE public.email_campaigns IS 'Email campaign execution and tracking';
COMMENT ON TABLE public.email_sends IS 'Individual email send tracking and engagement';
COMMENT ON TABLE public.contact_preferences IS 'Contact communication preferences and opt-outs';
