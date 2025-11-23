-- =============================================
-- Social Media Agent System Migration
-- Comprehensive AI-powered social media management
-- =============================================

-- =============================================
-- SOCIAL MEDIA ACCOUNTS (OAuth connections)
-- =============================================
CREATE TABLE public.social_media_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'instagram', 'facebook', 'tiktok')),
  account_name TEXT NOT NULL,
  account_handle TEXT,
  account_id TEXT, -- Platform-specific account ID

  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],

  -- Account metadata
  profile_image_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BRAND VOICE PROFILES
-- =============================================
CREATE TABLE public.brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN DEFAULT false,

  -- Voice characteristics
  tone TEXT[] DEFAULT ARRAY['professional', 'approachable'], -- professional, casual, authoritative, friendly, etc.
  personality_traits TEXT[] DEFAULT ARRAY['knowledgeable', 'helpful'],

  -- Content guidelines
  topics_to_cover TEXT[], -- Core topics to post about
  topics_to_avoid TEXT[], -- Topics to never discuss

  -- Writing style
  preferred_formats TEXT[] DEFAULT ARRAY['educational', 'storytelling'], -- listicles, questions, storytelling, educational
  emoji_usage TEXT DEFAULT 'minimal' CHECK (emoji_usage IN ('none', 'minimal', 'moderate', 'frequent')),
  hashtag_strategy TEXT DEFAULT 'moderate' CHECK (hashtag_strategy IN ('none', 'minimal', 'moderate', 'aggressive')),

  -- Platform-specific adjustments
  linkedin_style JSONB DEFAULT '{"formal": true, "cta_style": "professional"}',
  twitter_style JSONB DEFAULT '{"threads": true, "quote_tweets": true}',

  -- Example posts for AI learning
  example_posts JSONB[], -- Array of {"content": "...", "platform": "...", "performance": "high/medium/low"}

  -- Prohibited words/phrases
  prohibited_phrases TEXT[],

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTENT CALENDARS
-- =============================================
CREATE TABLE public.content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Calendar settings
  timezone TEXT DEFAULT 'America/New_York',
  posting_frequency JSONB DEFAULT '{
    "linkedin": {"posts_per_week": 5, "best_times": ["09:00", "12:00", "17:00"]},
    "twitter": {"posts_per_week": 14, "best_times": ["08:00", "12:00", "18:00", "21:00"]}
  }',

  -- Content mix targets (percentages)
  content_mix JSONB DEFAULT '{
    "educational": 40,
    "engagement": 25,
    "promotional": 15,
    "curated": 10,
    "personal": 10
  }',

  -- Themes/pillars
  content_pillars TEXT[] DEFAULT ARRAY['industry_insights', 'how_to', 'case_studies', 'news'],

  brand_voice_id UUID REFERENCES public.brand_voice_profiles,

  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRENDING TOPICS (Strategy Agent tracks)
-- =============================================
CREATE TABLE public.trending_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  topic TEXT NOT NULL,
  category TEXT, -- industry, general, seasonal, news

  -- Trend metrics
  relevance_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1, how relevant to our industry
  momentum_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1, is it growing or declining
  competition_score DECIMAL(3,2) DEFAULT 0.5, -- 0-1, how saturated

  -- Recommended angles
  content_angles JSONB[], -- Array of {"angle": "...", "platform": "...", "format": "..."}

  -- Sources where trend was found
  sources TEXT[],
  source_urls TEXT[],

  -- Status
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'approved', 'used', 'expired', 'rejected')),
  expires_at TIMESTAMPTZ,

  used_in_posts UUID[], -- Post IDs that used this topic

  identified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SOCIAL POSTS (Production Agent creates)
-- =============================================
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  calendar_id UUID REFERENCES public.content_calendars,
  campaign_id UUID, -- Link to marketing campaign if applicable

  -- Content variants for each platform
  content JSONB NOT NULL, -- {"twitter": "...", "linkedin": "...", "both": "..."}

  -- Platform-specific metadata
  twitter_config JSONB DEFAULT '{"is_thread": false, "thread_count": 1}',
  linkedin_config JSONB DEFAULT '{"is_article": false, "document_url": null}',

  -- Media attachments
  media_urls TEXT[],
  media_types TEXT[], -- image, video, document, carousel

  -- Targeting
  target_platforms TEXT[] NOT NULL, -- ['twitter', 'linkedin']
  content_type TEXT DEFAULT 'educational' CHECK (content_type IN ('educational', 'engagement', 'promotional', 'curated', 'personal', 'news')),
  content_pillar TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  optimal_time_calculated BOOLEAN DEFAULT false,

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'archived')),

  -- Publishing results
  twitter_post_id TEXT,
  twitter_url TEXT,
  linkedin_post_id TEXT,
  linkedin_url TEXT,
  published_at TIMESTAMPTZ,

  -- Generation metadata
  generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'strategy_agent', 'production_agent', 'imported')),
  generation_prompt TEXT, -- The prompt used if AI-generated
  trending_topic_id UUID REFERENCES public.trending_topics,

  -- Approval workflow
  approved_by UUID REFERENCES public.profiles,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POST ANALYTICS (Analysis Agent tracks)
-- =============================================
CREATE TABLE public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.social_posts ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,

  -- Engagement metrics
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,

  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0, -- Retweets for Twitter, shares for LinkedIn
  saves INTEGER DEFAULT 0, -- Bookmarks

  clicks INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  follows INTEGER DEFAULT 0,

  -- Calculated metrics
  engagement_rate DECIMAL(5,4), -- Engagements / Impressions
  virality_rate DECIMAL(5,4), -- Shares / Impressions

  -- Time-series snapshots (for trend analysis)
  hourly_snapshots JSONB[], -- Array of {"hour": 1, "impressions": X, "engagements": Y}

  -- Audience insights
  audience_demographics JSONB, -- Age, location, industry breakdown

  -- Comparison to average
  performance_vs_avg DECIMAL(4,2), -- e.g., 1.25 = 25% above average

  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PERFORMANCE INSIGHTS (Performance Loop)
-- =============================================
CREATE TABLE public.performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'best_posting_time',
    'top_content_type',
    'optimal_post_length',
    'hashtag_performance',
    'topic_performance',
    'format_performance',
    'audience_insight',
    'trend_correlation',
    'weekly_pattern'
  )),

  platform TEXT, -- NULL for cross-platform insights

  -- The insight itself
  insight TEXT NOT NULL,
  recommendation TEXT,

  -- Supporting data
  data_points INTEGER, -- How many posts this is based on
  confidence_score DECIMAL(3,2), -- 0-1

  -- Impact metrics
  potential_improvement DECIMAL(4,2), -- e.g., 1.35 = 35% potential improvement

  -- Specifics
  details JSONB, -- Platform-specific details

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'applied', 'outdated', 'rejected')),
  applied_at TIMESTAMPTZ,

  -- Time range this insight covers
  period_start DATE,
  period_end DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SOCIAL MEDIA AGENT RUNS
-- =============================================
CREATE TABLE public.social_media_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  agent_type TEXT NOT NULL CHECK (agent_type IN ('strategy', 'production', 'analysis', 'full_cycle')),

  -- Run details
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Results summary
  results JSONB, -- Agent-specific results

  -- Strategy agent results
  topics_identified INTEGER DEFAULT 0,
  angles_generated INTEGER DEFAULT 0,
  calendar_items_created INTEGER DEFAULT 0,

  -- Production agent results
  posts_drafted INTEGER DEFAULT 0,
  posts_approved INTEGER DEFAULT 0,

  -- Analysis agent results
  posts_analyzed INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,

  -- Performance loop
  patterns_identified INTEGER DEFAULT 0,
  recommendations_made INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTENT TEMPLATES
-- =============================================
CREATE TABLE public.social_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Template structure
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,

  -- Template with placeholders
  template TEXT NOT NULL, -- "Just learned about {{topic}}. Here's why it matters: {{insight}}"

  -- Variables used
  variables TEXT[], -- ['topic', 'insight', 'cta']

  -- Performance history
  times_used INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(5,4),

  is_active BOOLEAN DEFAULT true,

  created_by UUID REFERENCES public.profiles NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_social_accounts_org ON public.social_media_accounts(org_id);
CREATE INDEX idx_social_accounts_platform ON public.social_media_accounts(platform);

CREATE INDEX idx_brand_voice_org ON public.brand_voice_profiles(org_id);
CREATE INDEX idx_brand_voice_default ON public.brand_voice_profiles(org_id, is_default);

CREATE INDEX idx_calendars_org ON public.content_calendars(org_id);
CREATE INDEX idx_calendars_active ON public.content_calendars(org_id, is_active);

CREATE INDEX idx_trending_topics_org ON public.trending_topics(org_id);
CREATE INDEX idx_trending_topics_status ON public.trending_topics(status);
CREATE INDEX idx_trending_topics_relevance ON public.trending_topics(relevance_score DESC);

CREATE INDEX idx_social_posts_org ON public.social_posts(org_id);
CREATE INDEX idx_social_posts_calendar ON public.social_posts(calendar_id);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_posts(scheduled_for);
CREATE INDEX idx_social_posts_platforms ON public.social_posts USING GIN(target_platforms);
CREATE INDEX idx_social_posts_type ON public.social_posts(content_type);

CREATE INDEX idx_post_analytics_post ON public.post_analytics(post_id);
CREATE INDEX idx_post_analytics_platform ON public.post_analytics(platform);
CREATE INDEX idx_post_analytics_engagement ON public.post_analytics(engagement_rate DESC);

CREATE INDEX idx_performance_insights_org ON public.performance_insights(org_id);
CREATE INDEX idx_performance_insights_type ON public.performance_insights(insight_type);
CREATE INDEX idx_performance_insights_platform ON public.performance_insights(platform);
CREATE INDEX idx_performance_insights_confidence ON public.performance_insights(confidence_score DESC);

CREATE INDEX idx_social_agent_runs_org ON public.social_media_agent_runs(org_id);
CREATE INDEX idx_social_agent_runs_type ON public.social_media_agent_runs(agent_type);
CREATE INDEX idx_social_agent_runs_status ON public.social_media_agent_runs(status);

CREATE INDEX idx_social_templates_org ON public.social_content_templates(org_id);
CREATE INDEX idx_social_templates_platform ON public.social_content_templates(platform);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_content_templates ENABLE ROW LEVEL SECURITY;

-- Social Media Accounts
CREATE POLICY "Social accounts viewable by org members"
  ON public.social_media_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage social accounts"
  ON public.social_media_accounts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Brand Voice Profiles
CREATE POLICY "Brand voices viewable by org members"
  ON public.brand_voice_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage brand voices"
  ON public.brand_voice_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content Calendars
CREATE POLICY "Calendars viewable by org members"
  ON public.content_calendars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage calendars"
  ON public.content_calendars FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trending Topics
CREATE POLICY "Topics viewable by org members"
  ON public.trending_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage topics"
  ON public.trending_topics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Social Posts
CREATE POLICY "Posts viewable by org members"
  ON public.social_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage posts"
  ON public.social_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Post Analytics
CREATE POLICY "Analytics viewable by org members"
  ON public.post_analytics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage analytics"
  ON public.post_analytics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Performance Insights
CREATE POLICY "Insights viewable by org members"
  ON public.performance_insights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage insights"
  ON public.performance_insights FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agent Runs
CREATE POLICY "Runs viewable by org members"
  ON public.social_media_agent_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage runs"
  ON public.social_media_agent_runs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content Templates
CREATE POLICY "Templates viewable by org members"
  ON public.social_content_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Org members can manage templates"
  ON public.social_content_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_social_accounts_timestamp
  BEFORE UPDATE ON public.social_media_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_brand_voice_timestamp
  BEFORE UPDATE ON public.brand_voice_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_calendars_timestamp
  BEFORE UPDATE ON public.content_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trending_topics_timestamp
  BEFORE UPDATE ON public.trending_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_posts_timestamp
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_analytics_timestamp
  BEFORE UPDATE ON public.post_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_performance_insights_timestamp
  BEFORE UPDATE ON public.performance_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_agent_runs_timestamp
  BEFORE UPDATE ON public.social_media_agent_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_templates_timestamp
  BEFORE UPDATE ON public.social_content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- VIEWS
-- =============================================

-- Calendar overview with post counts
CREATE OR REPLACE VIEW public.calendar_overview AS
SELECT
  cc.id,
  cc.org_id,
  cc.name,
  cc.is_active,
  COUNT(sp.id) as total_posts,
  COUNT(sp.id) FILTER (WHERE sp.status = 'published') as published_posts,
  COUNT(sp.id) FILTER (WHERE sp.status = 'scheduled') as scheduled_posts,
  COUNT(sp.id) FILTER (WHERE sp.status IN ('draft', 'pending_review')) as draft_posts,
  AVG(pa.engagement_rate) as avg_engagement_rate
FROM public.content_calendars cc
LEFT JOIN public.social_posts sp ON cc.id = sp.calendar_id
LEFT JOIN public.post_analytics pa ON sp.id = pa.post_id
GROUP BY cc.id, cc.org_id, cc.name, cc.is_active;

-- Platform performance summary
CREATE OR REPLACE VIEW public.platform_performance AS
SELECT
  sp.org_id,
  pa.platform,
  COUNT(*) as post_count,
  SUM(pa.impressions) as total_impressions,
  SUM(pa.engagements) as total_engagements,
  AVG(pa.engagement_rate) as avg_engagement_rate,
  AVG(pa.virality_rate) as avg_virality_rate,
  SUM(pa.clicks) as total_clicks,
  SUM(pa.follows) as total_follows
FROM public.social_posts sp
JOIN public.post_analytics pa ON sp.id = pa.post_id
WHERE sp.status = 'published'
GROUP BY sp.org_id, pa.platform;

-- Content type performance
CREATE OR REPLACE VIEW public.content_type_performance AS
SELECT
  sp.org_id,
  sp.content_type,
  pa.platform,
  COUNT(*) as post_count,
  AVG(pa.engagement_rate) as avg_engagement_rate,
  AVG(pa.impressions) as avg_impressions,
  AVG(pa.performance_vs_avg) as avg_performance_vs_avg
FROM public.social_posts sp
JOIN public.post_analytics pa ON sp.id = pa.post_id
WHERE sp.status = 'published'
GROUP BY sp.org_id, sp.content_type, pa.platform;

-- Weekly posting schedule view
CREATE OR REPLACE VIEW public.weekly_schedule AS
SELECT
  sp.org_id,
  sp.calendar_id,
  DATE_TRUNC('week', sp.scheduled_for) as week_start,
  EXTRACT(DOW FROM sp.scheduled_for) as day_of_week,
  COUNT(*) as posts_scheduled,
  array_agg(sp.id) as post_ids
FROM public.social_posts sp
WHERE sp.status = 'scheduled'
  AND sp.scheduled_for >= NOW()
GROUP BY sp.org_id, sp.calendar_id, DATE_TRUNC('week', sp.scheduled_for), EXTRACT(DOW FROM sp.scheduled_for);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Calculate optimal posting time based on historical data
CREATE OR REPLACE FUNCTION calculate_optimal_posting_time(
  p_org_id UUID,
  p_platform TEXT,
  p_day_of_week INTEGER -- 0=Sunday, 6=Saturday
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  optimal_hour INTEGER;
  result_time TIMESTAMPTZ;
BEGIN
  -- Find the hour with best average engagement for this day of week
  SELECT EXTRACT(HOUR FROM sp.published_at)::INTEGER INTO optimal_hour
  FROM public.social_posts sp
  JOIN public.post_analytics pa ON sp.id = pa.post_id
  WHERE sp.org_id = p_org_id
    AND pa.platform = p_platform
    AND sp.status = 'published'
    AND EXTRACT(DOW FROM sp.published_at) = p_day_of_week
  GROUP BY EXTRACT(HOUR FROM sp.published_at)
  ORDER BY AVG(pa.engagement_rate) DESC
  LIMIT 1;

  -- Default to 9 AM if no data
  IF optimal_hour IS NULL THEN
    optimal_hour := 9;
  END IF;

  -- Calculate next occurrence of this day/hour
  result_time := DATE_TRUNC('day', NOW()) + make_interval(hours => optimal_hour);

  -- Adjust to next occurrence of the target day
  WHILE EXTRACT(DOW FROM result_time) != p_day_of_week LOOP
    result_time := result_time + INTERVAL '1 day';
  END LOOP;

  RETURN result_time;
END;
$$ LANGUAGE plpgsql;

-- Get content recommendations based on performance
CREATE OR REPLACE FUNCTION get_content_recommendations(
  p_org_id UUID,
  p_platform TEXT DEFAULT NULL
)
RETURNS TABLE (
  recommendation_type TEXT,
  recommendation TEXT,
  supporting_data JSONB
) AS $$
BEGIN
  RETURN QUERY

  -- Best performing content type
  SELECT
    'top_content_type'::TEXT,
    ('Your best performing content type on ' || COALESCE(p_platform, 'all platforms') || ' is ' || ctp.content_type)::TEXT,
    jsonb_build_object(
      'content_type', ctp.content_type,
      'avg_engagement', ctp.avg_engagement_rate,
      'post_count', ctp.post_count
    )
  FROM public.content_type_performance ctp
  WHERE ctp.org_id = p_org_id
    AND (p_platform IS NULL OR ctp.platform = p_platform)
  ORDER BY ctp.avg_engagement_rate DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
