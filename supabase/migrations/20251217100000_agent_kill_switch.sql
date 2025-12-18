-- Agent Kill Switch & Per-Tenant Disable
-- This migration adds the ability to disable the autonomous agent globally or per-tenant

-- ============================================================================
-- Global Kill Switch Table (system-wide)
-- ============================================================================

-- System configuration table for global settings
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default agent configuration
INSERT INTO system_config (key, value, description)
VALUES (
  'agent_config',
  jsonb_build_object(
    'global_enabled', true,
    'kill_switch_reason', null,
    'kill_switch_activated_at', null,
    'kill_switch_activated_by', null,
    'max_concurrent_tenants', 10,
    'default_tenant_enabled', true
  ),
  'Global configuration for the autonomous agent system'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Per-Tenant Agent Settings
-- ============================================================================

-- Add agent_enabled column to tenants table (defaults to true)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN DEFAULT true;

-- Add agent_settings JSONB column for per-tenant configuration
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS agent_settings JSONB DEFAULT jsonb_build_object(
  'enabled', true,
  'disabled_reason', null,
  'disabled_at', null,
  'disabled_by', null,
  'max_actions_per_cycle', 50,
  'max_emails_per_hour', 20,
  'max_research_per_hour', 5,
  'allowed_action_types', jsonb_build_array('research', 'send_email', 'follow_up', 'create_task')
);

-- Create index for filtering enabled tenants
CREATE INDEX IF NOT EXISTS idx_tenants_agent_enabled
  ON tenants(is_active, agent_enabled) WHERE is_active = true AND agent_enabled = true;

-- ============================================================================
-- Rate Limiting Tables
-- ============================================================================

-- Centralized rate limit tracking
CREATE TABLE IF NOT EXISTS agent_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'email_send', 'research', 'sandbox_run', etc.
  window_start TIMESTAMPTZ NOT NULL,
  window_size_minutes INTEGER NOT NULL DEFAULT 60, -- 1 hour window
  action_count INTEGER NOT NULL DEFAULT 1,
  max_allowed INTEGER NOT NULL,
  last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, action_type, window_start)
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant_type
  ON agent_rate_limits(tenant_id, action_type, window_start DESC);

-- Index for rate limit lookups (removed WHERE clause with NOW() as it's not immutable)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON agent_rate_limits(window_start);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if agent is globally enabled
CREATE OR REPLACE FUNCTION is_agent_globally_enabled()
RETURNS BOOLEAN AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT value INTO v_config
  FROM system_config
  WHERE key = 'agent_config';

  IF v_config IS NULL THEN
    RETURN true; -- Default to enabled if config missing
  END IF;

  RETURN COALESCE((v_config->>'global_enabled')::BOOLEAN, true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if agent is enabled for a specific tenant
CREATE OR REPLACE FUNCTION is_agent_enabled_for_tenant(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_tenant_enabled BOOLEAN;
BEGIN
  -- Check global kill switch first
  v_global_enabled := is_agent_globally_enabled();
  IF NOT v_global_enabled THEN
    RETURN false;
  END IF;

  -- Check tenant-specific setting
  SELECT agent_enabled INTO v_tenant_enabled
  FROM tenants
  WHERE id = p_tenant_id;

  RETURN COALESCE(v_tenant_enabled, true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to activate global kill switch
CREATE OR REPLACE FUNCTION activate_agent_kill_switch(
  p_reason TEXT,
  p_activated_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE system_config
  SET
    value = value || jsonb_build_object(
      'global_enabled', false,
      'kill_switch_reason', p_reason,
      'kill_switch_activated_at', NOW(),
      'kill_switch_activated_by', p_activated_by
    ),
    updated_by = p_activated_by,
    updated_at = NOW()
  WHERE key = 'agent_config';

  -- Log the event
  INSERT INTO warehouse_events (
    tenant_id, event_type, event_category, event_data, occurred_at
  )
  SELECT
    id, 'agent_kill_switch_activated', 'system',
    jsonb_build_object('reason', p_reason, 'activated_by', p_activated_by),
    NOW()
  FROM tenants WHERE is_active = true;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate global kill switch
CREATE OR REPLACE FUNCTION deactivate_agent_kill_switch(p_deactivated_by TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE system_config
  SET
    value = value || jsonb_build_object(
      'global_enabled', true,
      'kill_switch_reason', null,
      'kill_switch_activated_at', null,
      'kill_switch_activated_by', null
    ),
    updated_by = p_deactivated_by,
    updated_at = NOW()
  WHERE key = 'agent_config';

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to disable agent for a specific tenant
CREATE OR REPLACE FUNCTION disable_agent_for_tenant(
  p_tenant_id UUID,
  p_reason TEXT,
  p_disabled_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenants
  SET
    agent_enabled = false,
    agent_settings = COALESCE(agent_settings, '{}'::JSONB) || jsonb_build_object(
      'enabled', false,
      'disabled_reason', p_reason,
      'disabled_at', NOW(),
      'disabled_by', p_disabled_by
    )
  WHERE id = p_tenant_id;

  -- Log the event
  INSERT INTO warehouse_events (
    tenant_id, event_type, event_category, event_data, occurred_at
  )
  VALUES (
    p_tenant_id, 'agent_disabled', 'system',
    jsonb_build_object('reason', p_reason, 'disabled_by', p_disabled_by),
    NOW()
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to enable agent for a specific tenant
CREATE OR REPLACE FUNCTION enable_agent_for_tenant(
  p_tenant_id UUID,
  p_enabled_by TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tenants
  SET
    agent_enabled = true,
    agent_settings = COALESCE(agent_settings, '{}'::JSONB) || jsonb_build_object(
      'enabled', true,
      'disabled_reason', null,
      'disabled_at', null,
      'disabled_by', null
    )
  WHERE id = p_tenant_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to check and increment rate limit
-- Returns TRUE if action is allowed, FALSE if rate limited
-- IMPORTANT: Checks limit BEFORE incrementing to prevent off-by-one errors
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_tenant_id UUID,
  p_action_type TEXT,
  p_max_allowed INTEGER DEFAULT 50
)
RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Calculate current window start (truncate to hour)
  v_window_start := date_trunc('hour', NOW());

  -- First, get current count (or 0 if no record exists)
  SELECT action_count INTO v_current_count
  FROM agent_rate_limits
  WHERE tenant_id = p_tenant_id
    AND action_type = p_action_type
    AND window_start = v_window_start
  FOR UPDATE; -- Lock the row to prevent race conditions

  -- Default to 0 if no record found
  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;

  -- Check limit BEFORE incrementing
  IF v_current_count >= p_max_allowed THEN
    RETURN false;
  END IF;

  -- Now safe to increment - we're within limits
  INSERT INTO agent_rate_limits (
    tenant_id, action_type, window_start, window_size_minutes,
    action_count, max_allowed, last_action_at
  )
  VALUES (
    p_tenant_id, p_action_type, v_window_start, 60,
    1, p_max_allowed, NOW()
  )
  ON CONFLICT (tenant_id, action_type, window_start) DO UPDATE SET
    action_count = agent_rate_limits.action_count + 1,
    last_action_at = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get current rate limit status for a tenant
CREATE OR REPLACE FUNCTION get_rate_limit_status(p_tenant_id UUID)
RETURNS TABLE (
  action_type TEXT,
  current_count INTEGER,
  max_allowed INTEGER,
  remaining INTEGER,
  window_resets_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.action_type,
    rl.action_count,
    rl.max_allowed,
    GREATEST(0, rl.max_allowed - rl.action_count),
    rl.window_start + (rl.window_size_minutes || ' minutes')::INTERVAL
  FROM agent_rate_limits rl
  WHERE rl.tenant_id = p_tenant_id
    AND rl.window_start = date_trunc('hour', NOW())
  ORDER BY rl.action_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- system_config is not tenant-scoped, so no RLS
-- Only service role should access it

ALTER TABLE agent_rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits should only be accessed by service role (for agent operations)
-- and admins (for monitoring). Regular users should not see or modify rate limits.
CREATE POLICY "service_role_full_access" ON agent_rate_limits
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "admin_read_only" ON agent_rate_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tenant_id = agent_rate_limits.tenant_id
      AND role = 'admin'
    )
  );

-- ============================================================================
-- Cleanup Job Helper
-- ============================================================================

-- Function to clean up old rate limit records (call periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM agent_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE system_config IS 'Global system configuration including agent kill switch';
COMMENT ON TABLE agent_rate_limits IS 'Centralized rate limiting for agent actions';
COMMENT ON COLUMN tenants.agent_enabled IS 'Whether autonomous agent is enabled for this tenant';
COMMENT ON COLUMN tenants.agent_settings IS 'Per-tenant agent configuration (rate limits, allowed actions, etc.)';
COMMENT ON FUNCTION is_agent_globally_enabled() IS 'Check if agent is globally enabled (kill switch not active)';
COMMENT ON FUNCTION is_agent_enabled_for_tenant(UUID) IS 'Check if agent is enabled for a specific tenant';
COMMENT ON FUNCTION activate_agent_kill_switch(TEXT, TEXT) IS 'Activate global kill switch to stop all agent activity';
COMMENT ON FUNCTION deactivate_agent_kill_switch(TEXT) IS 'Deactivate global kill switch to resume agent activity';
COMMENT ON FUNCTION check_and_increment_rate_limit(UUID, TEXT, INTEGER) IS 'Check and increment rate limit, returns TRUE if allowed';
