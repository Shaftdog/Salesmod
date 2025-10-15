-- =====================================================
-- ACCOUNT MANAGER AGENT - PHASE 1
-- Tables for agent orchestration, kanban workflow, memory, and email tracking
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: agent_runs
-- Track each 2-hour work cycle execution
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  mode TEXT NOT NULL DEFAULT 'review' CHECK (mode IN ('auto', 'review')),
  goal_pressure DECIMAL(5, 2), -- Percentage behind goal (e.g., 15.5 means 15.5% behind)
  planned_actions INTEGER DEFAULT 0,
  approved INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_runs
CREATE INDEX idx_agent_runs_org_id ON agent_runs(org_id);
CREATE INDEX idx_agent_runs_started_at ON agent_runs(started_at DESC);
CREATE INDEX idx_agent_runs_status ON agent_runs(status) WHERE status = 'running';

-- =====================================================
-- TABLE: kanban_cards
-- Actions proposed/executed by the agent
-- =====================================================
CREATE TABLE IF NOT EXISTS kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('send_email', 'schedule_call', 'research', 'create_task', 'follow_up', 'create_deal')),
  title TEXT NOT NULL,
  description TEXT,
  rationale TEXT NOT NULL, -- Why the agent suggested this action
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  state TEXT NOT NULL DEFAULT 'suggested' CHECK (state IN ('suggested', 'in_review', 'approved', 'executing', 'done', 'blocked', 'rejected')),
  action_payload JSONB NOT NULL DEFAULT '{}'::JSONB, -- Email draft, task details, etc.
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Can be NULL for agent-created
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for kanban_cards
CREATE INDEX idx_kanban_cards_org_state ON kanban_cards(org_id, state);
CREATE INDEX idx_kanban_cards_client ON kanban_cards(client_id);
CREATE INDEX idx_kanban_cards_created_at ON kanban_cards(created_at DESC);
CREATE INDEX idx_kanban_cards_state ON kanban_cards(state) WHERE state IN ('suggested', 'in_review', 'approved');

-- =====================================================
-- TABLE: agent_memories
-- Short-term chat and context memory with TTL
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('chat', 'email', 'session', 'client_context')),
  key TEXT NOT NULL, -- Unique identifier for this memory (e.g., "client_123_last_interaction")
  content JSONB NOT NULL, -- Flexible storage for any memory data
  importance DECIMAL(3, 2) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1), -- 0-1 scale
  expires_at TIMESTAMPTZ, -- NULL = never expires
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, scope, key)
);

-- Indexes for agent_memories
CREATE INDEX idx_agent_memories_org_scope ON agent_memories(org_id, scope);
CREATE INDEX idx_agent_memories_expires ON agent_memories(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_agent_memories_key ON agent_memories(org_id, key);

-- =====================================================
-- TABLE: agent_reflections
-- Post-run learning summaries and adjustments
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  metrics JSONB DEFAULT '{}'::JSONB, -- { "approval_rate": 0.8, "avg_response_time": 2.5 }
  hypotheses TEXT, -- What the agent learned
  next_adjustments JSONB DEFAULT '{}'::JSONB, -- Proposed changes for next run
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_reflections
CREATE INDEX idx_agent_reflections_run ON agent_reflections(run_id);
CREATE INDEX idx_agent_reflections_created_at ON agent_reflections(created_at DESC);

-- =====================================================
-- TABLE: email_suppressions
-- Track unsubscribes, bounces, complaints
-- =====================================================
CREATE TABLE IF NOT EXISTS email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual')),
  details TEXT, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, contact_id)
);

-- Indexes for email_suppressions
CREATE INDEX idx_email_suppressions_org ON email_suppressions(org_id);
CREATE INDEX idx_email_suppressions_contact ON email_suppressions(contact_id);
CREATE INDEX idx_email_suppressions_email ON email_suppressions(email);

-- =====================================================
-- TABLE: oauth_tokens
-- Store encrypted OAuth tokens for integrations
-- =====================================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'slack', 'microsoft')),
  account_email TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Should be encrypted in production
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider, account_email)
);

-- Indexes for oauth_tokens
CREATE INDEX idx_oauth_tokens_org_provider ON oauth_tokens(org_id, provider);
CREATE INDEX idx_oauth_tokens_expires ON oauth_tokens(expires_at);

-- =====================================================
-- TABLE: agent_settings
-- Per-org configuration for the agent
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  mode TEXT NOT NULL DEFAULT 'review' CHECK (mode IN ('auto', 'review')),
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME, -- e.g., '08:00:00'
  timezone TEXT DEFAULT 'America/New_York',
  daily_send_limit INTEGER DEFAULT 50,
  cooldown_days INTEGER DEFAULT 5, -- Days between emails to same contact
  escalation_threshold DECIMAL(3, 2) DEFAULT 0.75, -- Risk score 0-1 that forces review
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent_settings
CREATE INDEX idx_agent_settings_org ON agent_settings(org_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_settings ENABLE ROW LEVEL SECURITY;

-- agent_runs policies
CREATE POLICY "Users can view their own runs"
  ON agent_runs FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create runs"
  ON agent_runs FOR INSERT
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own runs"
  ON agent_runs FOR UPDATE
  USING (auth.uid() = org_id);

-- kanban_cards policies
CREATE POLICY "Users can view their own cards"
  ON kanban_cards FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create cards"
  ON kanban_cards FOR INSERT
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their own cards"
  ON kanban_cards FOR UPDATE
  USING (auth.uid() = org_id);

CREATE POLICY "Users can delete their own cards"
  ON kanban_cards FOR DELETE
  USING (auth.uid() = org_id);

-- agent_memories policies
CREATE POLICY "Users can view their own memories"
  ON agent_memories FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can manage memories"
  ON agent_memories FOR ALL
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- agent_reflections policies
CREATE POLICY "Users can view their own reflections"
  ON agent_reflections FOR SELECT
  USING (auth.uid() IN (SELECT org_id FROM agent_runs WHERE id = run_id));

CREATE POLICY "System can create reflections"
  ON agent_reflections FOR INSERT
  WITH CHECK (true);

-- email_suppressions policies
CREATE POLICY "Users can view their own suppressions"
  ON email_suppressions FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "System can manage suppressions"
  ON email_suppressions FOR ALL
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- oauth_tokens policies
CREATE POLICY "Users can view their own tokens"
  ON oauth_tokens FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can manage their own tokens"
  ON oauth_tokens FOR ALL
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- agent_settings policies
CREATE POLICY "Users can view their own settings"
  ON agent_settings FOR SELECT
  USING (auth.uid() = org_id);

CREATE POLICY "Users can manage their own settings"
  ON agent_settings FOR ALL
  USING (auth.uid() = org_id)
  WITH CHECK (auth.uid() = org_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp for kanban_cards
CREATE OR REPLACE FUNCTION update_kanban_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for kanban_cards updated_at
DROP TRIGGER IF EXISTS kanban_cards_updated_at ON kanban_cards;
CREATE TRIGGER kanban_cards_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_kanban_cards_updated_at();

-- Function to update updated_at timestamp for oauth_tokens
CREATE OR REPLACE FUNCTION update_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for oauth_tokens updated_at
DROP TRIGGER IF EXISTS oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_tokens_updated_at();

-- Function to update updated_at timestamp for agent_settings
CREATE OR REPLACE FUNCTION update_agent_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for agent_settings updated_at
DROP TRIGGER IF EXISTS agent_settings_updated_at ON agent_settings;
CREATE TRIGGER agent_settings_updated_at
  BEFORE UPDATE ON agent_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_settings_updated_at();

-- Function to auto-expire memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_memories
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to log card approval
CREATE OR REPLACE FUNCTION log_card_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'approved' AND OLD.state != 'approved' THEN
    NEW.approved_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for card approval
DROP TRIGGER IF EXISTS card_approval_trigger ON kanban_cards;
CREATE TRIGGER card_approval_trigger
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  WHEN (NEW.state = 'approved' AND OLD.state != 'approved')
  EXECUTE FUNCTION log_card_approval();

-- Function to track card execution
CREATE OR REPLACE FUNCTION log_card_execution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.state = 'done' AND OLD.state != 'done' THEN
    NEW.executed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for card execution
DROP TRIGGER IF EXISTS card_execution_trigger ON kanban_cards;
CREATE TRIGGER card_execution_trigger
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW
  WHEN (NEW.state = 'done' AND OLD.state != 'done')
  EXECUTE FUNCTION log_card_execution();

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View: Agent performance metrics
CREATE OR REPLACE VIEW agent_performance AS
SELECT
  r.org_id,
  COUNT(r.id) as total_runs,
  AVG(r.planned_actions) as avg_planned_actions,
  AVG(r.approved) as avg_approved_actions,
  AVG(r.sent) as avg_sent_emails,
  AVG(r.goal_pressure) as avg_goal_pressure,
  COUNT(CASE WHEN r.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as success_rate,
  AVG(EXTRACT(EPOCH FROM (r.ended_at - r.started_at)) / 60) as avg_duration_minutes
FROM agent_runs r
WHERE r.created_at > NOW() - INTERVAL '30 days'
GROUP BY r.org_id;

-- View: Kanban card metrics
CREATE OR REPLACE VIEW kanban_card_metrics AS
SELECT
  k.org_id,
  k.type,
  k.state,
  k.priority,
  COUNT(*) as total_cards,
  COUNT(CASE WHEN k.state = 'done' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as completion_rate,
  AVG(EXTRACT(EPOCH FROM (k.executed_at - k.created_at)) / 3600) as avg_hours_to_execute
FROM kanban_cards k
WHERE k.created_at > NOW() - INTERVAL '30 days'
GROUP BY k.org_id, k.type, k.state, k.priority;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE agent_runs IS 'Tracks each 2-hour agent work cycle execution';
COMMENT ON TABLE kanban_cards IS 'Action cards proposed and executed by the agent';
COMMENT ON TABLE agent_memories IS 'Short-term memory for agent context and learning';
COMMENT ON TABLE agent_reflections IS 'Post-run reflections and learning summaries';
COMMENT ON TABLE email_suppressions IS 'Email suppression list (bounces, unsubscribes, complaints)';
COMMENT ON TABLE oauth_tokens IS 'OAuth tokens for external integrations (Gmail, Slack)';
COMMENT ON TABLE agent_settings IS 'Per-organization agent configuration';

COMMENT ON COLUMN kanban_cards.rationale IS 'AI-generated explanation for why this action was suggested';
COMMENT ON COLUMN agent_memories.importance IS 'Memory importance score 0-1, higher = keep longer';
COMMENT ON COLUMN agent_settings.escalation_threshold IS 'Risk score threshold that forces review mode';

-- =====================================================
-- END OF MIGRATION
-- =====================================================


