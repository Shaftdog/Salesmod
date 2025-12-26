-- Slack Integration table for two-way bot communication
-- Stores workspace connections and bot tokens

CREATE TABLE IF NOT EXISTS slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Slack workspace info
  slack_team_id TEXT NOT NULL UNIQUE,
  slack_team_name TEXT,

  -- Bot tokens (encrypted at rest by Supabase)
  bot_token TEXT NOT NULL,
  bot_user_id TEXT,

  -- OAuth metadata
  scope TEXT,
  authed_user_id TEXT,

  -- Configuration
  default_channel_id TEXT,  -- Channel for notifications
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_by UUID REFERENCES auth.users(id)
);

-- Slack user to profile mapping (optional - for user-specific context)
CREATE TABLE IF NOT EXISTS slack_user_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slack_integration_id UUID NOT NULL REFERENCES slack_integrations(id) ON DELETE CASCADE,

  slack_user_id TEXT NOT NULL,
  slack_username TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(slack_integration_id, slack_user_id)
);

-- Indexes
CREATE INDEX idx_slack_integrations_tenant ON slack_integrations(tenant_id);
CREATE INDEX idx_slack_integrations_team ON slack_integrations(slack_team_id);
CREATE INDEX idx_slack_user_mappings_slack_user ON slack_user_mappings(slack_integration_id, slack_user_id);

-- RLS Policies
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_user_mappings ENABLE ROW LEVEL SECURITY;

-- slack_integrations policies
CREATE POLICY slack_integrations_select ON slack_integrations
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY slack_integrations_insert ON slack_integrations
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY slack_integrations_update ON slack_integrations
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY slack_integrations_delete ON slack_integrations
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- slack_user_mappings policies
CREATE POLICY slack_user_mappings_select ON slack_user_mappings
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY slack_user_mappings_insert ON slack_user_mappings
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Updated_at trigger for slack_integrations
CREATE TRIGGER slack_integrations_updated_at
  BEFORE UPDATE ON slack_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_channels_updated_at();

-- Comments
COMMENT ON TABLE slack_integrations IS 'Stores Slack workspace bot installations for two-way chat';
COMMENT ON TABLE slack_user_mappings IS 'Maps Slack users to Salesmod profiles for personalized context';
