-- =====================================================
-- AI AGENT MIGRATION
-- Tables for AI-generated drafts, suggestions, and feedback
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: ai_drafts
-- Stores AI-generated communication drafts
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  draft_type TEXT NOT NULL CHECK (draft_type IN ('email', 'note', 'internal_memo', 'follow_up')),
  subject TEXT,
  content TEXT NOT NULL,
  context_snapshot JSONB, -- Store the context used to generate this draft
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'edited', 'rejected', 'sent')),
  tokens_used INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

-- Indexes for ai_drafts
CREATE INDEX idx_ai_drafts_client ON ai_drafts(client_id);
CREATE INDEX idx_ai_drafts_status ON ai_drafts(status);
CREATE INDEX idx_ai_drafts_created_by ON ai_drafts(created_by);
CREATE INDEX idx_ai_drafts_created_at ON ai_drafts(created_at DESC);

-- =====================================================
-- TABLE: agent_suggestions
-- Stores AI-generated suggestions for actions
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('follow_up', 'deal_action', 'task_create', 'status_check', 'upsell')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  description TEXT,
  reasoning TEXT, -- Why the AI suggested this
  action_data JSONB, -- Structured data for the suggested action
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed', 'snoozed')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ
);

-- Indexes for agent_suggestions
CREATE INDEX idx_agent_suggestions_client ON agent_suggestions(client_id);
CREATE INDEX idx_agent_suggestions_status ON agent_suggestions(status) WHERE status = 'pending';
CREATE INDEX idx_agent_suggestions_priority ON agent_suggestions(priority, created_at DESC);
CREATE INDEX idx_agent_suggestions_created_at ON agent_suggestions(created_at DESC);

-- =====================================================
-- TABLE: ai_feedback
-- Stores user feedback on AI-generated content
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES ai_drafts(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES agent_suggestions(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  feedback_text TEXT,
  user_edits JSONB, -- Store what the user changed
  helpful BOOLEAN, -- Simple thumbs up/down
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT feedback_has_target CHECK (
    (draft_id IS NOT NULL AND suggestion_id IS NULL) OR
    (draft_id IS NULL AND suggestion_id IS NOT NULL)
  )
);

-- Indexes for ai_feedback
CREATE INDEX idx_ai_feedback_draft ON ai_feedback(draft_id) WHERE draft_id IS NOT NULL;
CREATE INDEX idx_ai_feedback_suggestion ON ai_feedback(suggestion_id) WHERE suggestion_id IS NOT NULL;
CREATE INDEX idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_created_at ON ai_feedback(created_at DESC);

-- =====================================================
-- TABLE: ai_usage_logs
-- Track AI API usage for cost monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('draft_generation', 'suggestion_generation', 'other')),
  model_used TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6), -- Cost in dollars
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  draft_id UUID REFERENCES ai_drafts(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_usage_logs
CREATE INDEX idx_ai_usage_logs_user ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_operation ON ai_usage_logs(operation_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE ai_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- ai_drafts policies
CREATE POLICY "Users can view their own drafts"
  ON ai_drafts FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create drafts"
  ON ai_drafts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their pending drafts"
  ON ai_drafts FOR UPDATE
  USING (auth.uid() = created_by AND status IN ('pending', 'edited'));

CREATE POLICY "Users can delete their own drafts"
  ON ai_drafts FOR DELETE
  USING (auth.uid() = created_by);

-- agent_suggestions policies
CREATE POLICY "Users can view all suggestions"
  ON agent_suggestions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update suggestions"
  ON agent_suggestions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ai_feedback policies
CREATE POLICY "Users can view their own feedback"
  ON ai_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ai_usage_logs policies
CREATE POLICY "Users can view their own usage"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for ai_drafts updated_at
DROP TRIGGER IF EXISTS ai_drafts_updated_at ON ai_drafts;
CREATE TRIGGER ai_drafts_updated_at
  BEFORE UPDATE ON ai_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_drafts_updated_at();

-- Function to log draft approval
CREATE OR REPLACE FUNCTION log_draft_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    NEW.approved_at = NOW();
    NEW.approved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for draft approval
DROP TRIGGER IF EXISTS draft_approval_trigger ON ai_drafts;
CREATE TRIGGER draft_approval_trigger
  BEFORE UPDATE ON ai_drafts
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION log_draft_approval();

-- Function to auto-resolve suggestions when accepted
CREATE OR REPLACE FUNCTION resolve_suggestion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('accepted', 'dismissed') AND OLD.status = 'pending' THEN
    NEW.resolved_at = NOW();
    NEW.resolved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for suggestion resolution
DROP TRIGGER IF EXISTS suggestion_resolution_trigger ON agent_suggestions;
CREATE TRIGGER suggestion_resolution_trigger
  BEFORE UPDATE ON agent_suggestions
  FOR EACH ROW
  WHEN (NEW.status IN ('accepted', 'dismissed') AND OLD.status = 'pending')
  EXECUTE FUNCTION resolve_suggestion();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View: Draft performance metrics
CREATE OR REPLACE VIEW ai_draft_performance AS
SELECT
  draft_type,
  status,
  COUNT(*) as total_drafts,
  AVG(tokens_used) as avg_tokens,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) * 100.0 / COUNT(*) as approval_rate,
  AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600) as avg_hours_to_approval
FROM ai_drafts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY draft_type, status;

-- View: Suggestion performance metrics
CREATE OR REPLACE VIEW agent_suggestion_performance AS
SELECT
  suggestion_type,
  priority,
  status,
  COUNT(*) as total_suggestions,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) * 100.0 / COUNT(*) as acceptance_rate,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours_to_resolution
FROM agent_suggestions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY suggestion_type, priority, status;

-- View: AI usage costs by user
CREATE OR REPLACE VIEW ai_usage_by_user AS
SELECT
  u.user_id,
  p.name,
  COUNT(*) as total_operations,
  SUM(u.tokens_used) as total_tokens,
  SUM(u.estimated_cost) as total_cost,
  AVG(u.tokens_used) as avg_tokens_per_operation
FROM ai_usage_logs u
JOIN profiles p ON p.id = u.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.user_id, p.name;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE ai_drafts IS 'Stores AI-generated communication drafts awaiting user approval';
COMMENT ON TABLE agent_suggestions IS 'Stores AI-generated suggestions for proactive account management';
COMMENT ON TABLE ai_feedback IS 'Tracks user feedback on AI outputs for continuous improvement';
COMMENT ON TABLE ai_usage_logs IS 'Monitors AI API usage and costs';

COMMENT ON COLUMN ai_drafts.context_snapshot IS 'JSONB snapshot of client context used to generate this draft';
COMMENT ON COLUMN agent_suggestions.action_data IS 'JSONB data structure containing parameters for the suggested action';
COMMENT ON COLUMN ai_feedback.user_edits IS 'JSONB diff showing what the user changed in the draft';

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Note: Sample data should only be inserted in development/testing environments
-- Uncomment the following if you want sample data for testing

/*
-- Insert sample draft (requires existing client and profile)
INSERT INTO ai_drafts (client_id, draft_type, subject, content, status, created_by)
VALUES (
  (SELECT id FROM clients LIMIT 1),
  'email',
  'Following up on our conversation',
  'Hi [Name], I wanted to follow up on our recent discussion about...',
  'pending',
  (SELECT id FROM profiles LIMIT 1)
);

-- Insert sample suggestion
INSERT INTO agent_suggestions (client_id, suggestion_type, priority, title, description, reasoning, status)
VALUES (
  (SELECT id FROM clients LIMIT 1),
  'follow_up',
  'high',
  'Schedule follow-up call',
  'No contact in 12 days. Recommend scheduling a check-in call.',
  'Client engagement has decreased and there is an active deal in the pipeline.',
  'pending'
);
*/

-- =====================================================
-- END OF MIGRATION
-- =====================================================

