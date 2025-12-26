-- Notification Channels table for Slack/Teams push notifications
-- One-way notifications only (no back-and-forth)

CREATE TABLE IF NOT EXISTS notification_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Channel configuration
  channel_type TEXT NOT NULL CHECK (channel_type IN ('slack', 'teams')),
  channel_name TEXT NOT NULL, -- e.g., "#sales-alerts" or "Agent Notifications"
  webhook_url TEXT NOT NULL,

  -- Event subscriptions (which events trigger notifications)
  events TEXT[] NOT NULL DEFAULT ARRAY['run_completed', 'run_failed', 'error']::TEXT[],

  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_notification_at TIMESTAMPTZ,
  last_error TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_notification_channels_tenant ON notification_channels(tenant_id);
CREATE INDEX idx_notification_channels_enabled ON notification_channels(tenant_id, enabled) WHERE enabled = true;

-- RLS Policies
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;

-- Users can only see their tenant's channels
CREATE POLICY notification_channels_select ON notification_channels
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can only insert for their tenant
CREATE POLICY notification_channels_insert ON notification_channels
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can only update their tenant's channels
CREATE POLICY notification_channels_update ON notification_channels
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can only delete their tenant's channels
CREATE POLICY notification_channels_delete ON notification_channels
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_channels_updated_at
  BEFORE UPDATE ON notification_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_channels_updated_at();

-- Comment
COMMENT ON TABLE notification_channels IS 'Stores Slack/Teams webhook configurations for push notifications';
COMMENT ON COLUMN notification_channels.events IS 'Array of event types to notify on: run_started, run_completed, run_failed, cards_created, cards_executed, email_sent, error';
