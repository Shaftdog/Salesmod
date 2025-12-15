-- Reputation Management System
-- Aggregates reviews from platforms like Google Business Profile
-- Tracks sentiment, responses, and escalations

-- Review Platforms
CREATE TABLE IF NOT EXISTS review_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL, -- 'google', 'yelp', 'facebook', 'zillow', etc.
  platform_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  api_credentials JSONB, -- WARNING: Store encrypted credentials only. Use Supabase Vault or encrypt at application layer before storing.
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, platform_name)
);

-- Reviews from all platforms
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES review_platforms(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Platform's review ID
  author_name TEXT,
  author_avatar_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMPTZ NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2), -- -1.00 to 1.00
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT, -- 'low_rating', 'negative_keywords', 'manual'
  escalated_to TEXT, -- 'account_manager', 'legal', null
  escalated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- Platform-specific data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform_id, external_id)
);

-- Review Response Templates
CREATE TABLE IF NOT EXISTS review_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scenario TEXT NOT NULL, -- 'positive_review', 'neutral_review', 'negative_review_service', 'negative_review_quality', etc.
  template_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- ['customer_name', 'service_type', etc.]
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Review Responses
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  template_id UUID REFERENCES review_response_templates(id),
  response_text TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sentiment Trends (aggregated daily)
CREATE TABLE IF NOT EXISTS sentiment_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform_id UUID REFERENCES review_platforms(id) ON DELETE CASCADE,
  total_reviews INTEGER DEFAULT 0,
  positive_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),
  average_sentiment_score DECIMAL(3,2),
  flagged_count INTEGER DEFAULT 0,
  responded_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, date, platform_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_org_id ON reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform_id ON reviews(platform_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_sentiment ON reviews(sentiment);
CREATE INDEX IF NOT EXISTS idx_reviews_is_flagged ON reviews(is_flagged);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_status ON review_responses(status);
CREATE INDEX IF NOT EXISTS idx_sentiment_trends_org_date ON sentiment_trends(org_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_review_platforms_org_id ON review_platforms(org_id);

-- RLS Policies
ALTER TABLE review_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_response_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_trends ENABLE ROW LEVEL SECURITY;

-- Review Platforms Policies
CREATE POLICY "Users can view their org's review platforms"
  ON review_platforms FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert review platforms"
  ON review_platforms FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update review platforms"
  ON review_platforms FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete review platforms"
  ON review_platforms FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reviews Policies
CREATE POLICY "Users can view their org's reviews"
  ON reviews FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's reviews"
  ON reviews FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Response Templates Policies
CREATE POLICY "Users can view their org's response templates"
  ON review_response_templates FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert response templates"
  ON review_response_templates FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their org's response templates"
  ON review_response_templates FOR UPDATE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their org's response templates"
  ON review_response_templates FOR DELETE
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Review Responses Policies
CREATE POLICY "Users can view their org's review responses"
  ON review_responses FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert review responses"
  ON review_responses FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own review responses"
  ON review_responses FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND sent_by = auth.uid()
  );

-- Sentiment Trends Policies
CREATE POLICY "Users can view their org's sentiment trends"
  ON sentiment_trends FOR SELECT
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "System can insert sentiment trends"
  ON sentiment_trends FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Functions for sentiment analysis
CREATE OR REPLACE FUNCTION calculate_sentiment(review_text TEXT, rating INTEGER)
RETURNS TABLE(sentiment TEXT, sentiment_score DECIMAL(3,2)) AS $$
BEGIN
  -- Simple sentiment calculation based on rating and keywords
  -- In production, this would call an AI service

  IF rating >= 4 THEN
    RETURN QUERY SELECT 'positive'::TEXT, 0.75::DECIMAL(3,2);
  ELSIF rating = 3 THEN
    RETURN QUERY SELECT 'neutral'::TEXT, 0.00::DECIMAL(3,2);
  ELSE
    RETURN QUERY SELECT 'negative'::TEXT, -0.75::DECIMAL(3,2);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-flag low-rated reviews
CREATE OR REPLACE FUNCTION auto_flag_reviews()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating <= 2 THEN
    NEW.is_flagged := true;
    NEW.flag_reason := 'low_rating';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_flag_reviews
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_flag_reviews();

-- Function to update sentiment trends
CREATE OR REPLACE FUNCTION update_sentiment_trends()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO sentiment_trends (
    org_id,
    date,
    platform_id,
    total_reviews,
    positive_count,
    neutral_count,
    negative_count,
    average_rating,
    average_sentiment_score,
    flagged_count
  )
  SELECT
    NEW.org_id,
    DATE(NEW.review_date),
    NEW.platform_id,
    COUNT(*),
    SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END),
    SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END),
    AVG(rating),
    AVG(sentiment_score),
    SUM(CASE WHEN is_flagged THEN 1 ELSE 0 END)
  FROM reviews
  WHERE org_id = NEW.org_id
    AND platform_id = NEW.platform_id
    AND DATE(review_date) = DATE(NEW.review_date)
  GROUP BY org_id, platform_id, DATE(review_date)
  ON CONFLICT (org_id, date, platform_id)
  DO UPDATE SET
    total_reviews = EXCLUDED.total_reviews,
    positive_count = EXCLUDED.positive_count,
    neutral_count = EXCLUDED.neutral_count,
    negative_count = EXCLUDED.negative_count,
    average_rating = EXCLUDED.average_rating,
    average_sentiment_score = EXCLUDED.average_sentiment_score,
    flagged_count = EXCLUDED.flagged_count,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentiment_trends
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_sentiment_trends();

-- Seed default response templates
INSERT INTO review_response_templates (org_id, name, scenario, template_text, variables)
SELECT
  id,
  'Positive Review Response',
  'positive_review',
  'Thank you so much for your wonderful review, {{customer_name}}! We''re thrilled to hear that you had a positive experience with {{service_type}}. Your feedback means the world to us and motivates our team to continue delivering exceptional service. We look forward to working with you again!',
  '["customer_name", "service_type"]'::JSONB
FROM organizations
ON CONFLICT DO NOTHING;

INSERT INTO review_response_templates (org_id, name, scenario, template_text, variables)
SELECT
  id,
  'Negative Review - Service Recovery',
  'negative_review_service',
  'Thank you for taking the time to share your feedback, {{customer_name}}. We sincerely apologize that your experience with {{service_type}} did not meet your expectations. Your concerns are important to us. Please contact us directly at {{contact_email}} or {{contact_phone}} so we can address this matter promptly and make things right.',
  '["customer_name", "service_type", "contact_email", "contact_phone"]'::JSONB
FROM organizations
ON CONFLICT DO NOTHING;

INSERT INTO review_response_templates (org_id, name, scenario, template_text, variables)
SELECT
  id,
  'Neutral Review - Engagement',
  'neutral_review',
  'Thank you for your review, {{customer_name}}. We appreciate your feedback on {{service_type}}. We''re always looking to improve our services. If you have any specific suggestions or concerns, please don''t hesitate to reach out to us at {{contact_email}}. We''d love the opportunity to exceed your expectations next time!',
  '["customer_name", "service_type", "contact_email"]'::JSONB
FROM organizations
ON CONFLICT DO NOTHING;

COMMENT ON TABLE review_platforms IS 'Configured review platforms (Google, Yelp, etc.)';
COMMENT ON TABLE reviews IS 'Aggregated reviews from all platforms';
COMMENT ON TABLE review_response_templates IS 'Pre-written response templates for different scenarios';
COMMENT ON TABLE review_responses IS 'Responses sent to reviews';
COMMENT ON TABLE sentiment_trends IS 'Daily aggregated sentiment analytics';
