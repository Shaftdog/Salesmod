-- ============================================================================
-- P0.7 Email Alerting Tables
-- ============================================================================
-- Creates tables for email alert tracking and provider failure monitoring

-- ============================================================================
-- Agent Alerts Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_alerts_tenant_created
  ON agent_alerts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_type_severity
  ON agent_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_unacknowledged
  ON agent_alerts(tenant_id, acknowledged) WHERE acknowledged = FALSE;

-- RLS Policy
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_alerts_tenant_isolation" ON agent_alerts
  FOR ALL
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- Email Provider Failures Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_provider_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  error_type VARCHAR(50) NOT NULL,
  error_message TEXT,
  provider VARCHAR(50) DEFAULT 'resend',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for failure spike detection
CREATE INDEX IF NOT EXISTS idx_email_provider_failures_tenant_created
  ON email_provider_failures(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_provider_failures_type
  ON email_provider_failures(error_type, created_at DESC);

-- RLS Policy
ALTER TABLE email_provider_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_provider_failures_tenant_isolation" ON email_provider_failures
  FOR ALL
  USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- Add agent_alerts column to tenants if not exists
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'alert_settings'
  ) THEN
    ALTER TABLE tenants ADD COLUMN alert_settings JSONB DEFAULT '{
      "email_enabled": true,
      "webhook_enabled": false,
      "alert_email": null,
      "webhook_url": null
    }'::JSONB;
  END IF;
END $$;

-- ============================================================================
-- Helper function to get alert counts by type
-- ============================================================================
CREATE OR REPLACE FUNCTION get_alert_summary(
  p_tenant_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  alert_type VARCHAR,
  severity VARCHAR,
  count BIGINT,
  latest_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    aa.alert_type,
    aa.severity,
    COUNT(*)::BIGINT,
    MAX(aa.created_at)
  FROM agent_alerts aa
  WHERE aa.tenant_id = p_tenant_id
    AND aa.created_at > NOW() - (p_hours || ' hours')::INTERVAL
  GROUP BY aa.alert_type, aa.severity
  ORDER BY COUNT(*) DESC;
END;
$$;

-- ============================================================================
-- Function to check provider health
-- ============================================================================
CREATE OR REPLACE FUNCTION check_email_provider_health(
  p_tenant_id UUID,
  p_minutes INTEGER DEFAULT 15
)
RETURNS TABLE (
  error_type VARCHAR,
  failure_count BIGINT,
  is_healthy BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  failure_threshold INTEGER := 5;
BEGIN
  RETURN QUERY
  SELECT
    epf.error_type,
    COUNT(*)::BIGINT AS failure_count,
    (COUNT(*) < failure_threshold) AS is_healthy
  FROM email_provider_failures epf
  WHERE epf.tenant_id = p_tenant_id
    AND epf.created_at > NOW() - (p_minutes || ' minutes')::INTERVAL
  GROUP BY epf.error_type;
END;
$$;

-- ============================================================================
-- Cleanup old alerts (keep 30 days)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM agent_alerts
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM email_provider_failures
  WHERE created_at < NOW() - INTERVAL '7 days';

  RETURN deleted_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_alert_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_email_provider_health(UUID, INTEGER) TO authenticated;
