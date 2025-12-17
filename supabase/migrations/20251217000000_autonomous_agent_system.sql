-- vNext Autonomous Agent System
-- This migration adds tables for autonomous agent operation

-- ============================================================================
-- P0.1: Autonomous Scheduler Tables
-- ============================================================================

-- Table for tracking autonomous work block runs
CREATE TABLE IF NOT EXISTS agent_autonomous_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  -- Phase tracking for Plan → Act → React → Reflect
  current_phase TEXT NOT NULL DEFAULT 'plan',
  phase_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'running',
  -- Outputs from each phase
  plan_output JSONB DEFAULT '{}',
  act_output JSONB DEFAULT '{}',
  react_output JSONB DEFAULT '{}',
  reflect_output JSONB DEFAULT '{}',
  -- Metrics and summary
  metrics JSONB DEFAULT '{}',
  work_block JSONB DEFAULT '{}',
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for autonomous runs
CREATE INDEX IF NOT EXISTS idx_autonomous_runs_tenant_status
  ON agent_autonomous_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_autonomous_runs_tenant_started
  ON agent_autonomous_runs(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_autonomous_runs_running
  ON agent_autonomous_runs(status) WHERE status = 'running';

-- Lock table for preventing concurrent runs per tenant
CREATE TABLE IF NOT EXISTS agent_tenant_locks (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  locked_at TIMESTAMPTZ NOT NULL,
  locked_by TEXT NOT NULL, -- Instance ID or hostname
  lock_type TEXT NOT NULL DEFAULT 'autonomous_cycle',
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Index for expired locks cleanup
CREATE INDEX IF NOT EXISTS idx_tenant_locks_expires
  ON agent_tenant_locks(expires_at);

-- ============================================================================
-- P0.4: 21-Day Engagement Engine Tables
-- ============================================================================

-- Engagement clock per contact/account
CREATE TABLE IF NOT EXISTS engagement_clocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'account', 'client')),
  entity_id UUID NOT NULL,
  -- Last touch tracking
  last_touch_at TIMESTAMPTZ,
  last_touch_type TEXT, -- 'email', 'call', 'meeting', 'research', etc.
  last_touch_by TEXT, -- 'agent' or user_id
  last_touch_card_id UUID,
  -- Next touch scheduling
  next_touch_due TIMESTAMPTZ,
  touch_frequency_days INTEGER DEFAULT 21,
  -- Engagement metrics
  touch_count_30d INTEGER DEFAULT 0,
  touch_count_90d INTEGER DEFAULT 0,
  response_rate DECIMAL(5,4) DEFAULT 0,
  -- Priority scoring
  priority_score DECIMAL(8,2) DEFAULT 0,
  priority_factors JSONB DEFAULT '{}',
  -- Compliance tracking
  is_compliant BOOLEAN DEFAULT true,
  days_overdue INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, entity_type, entity_id)
);

-- Indexes for engagement clocks
CREATE INDEX IF NOT EXISTS idx_engagement_clocks_tenant_due
  ON engagement_clocks(tenant_id, next_touch_due);
CREATE INDEX IF NOT EXISTS idx_engagement_clocks_tenant_overdue
  ON engagement_clocks(tenant_id, is_compliant, days_overdue DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_clocks_entity
  ON engagement_clocks(entity_type, entity_id);

-- ============================================================================
-- P0.3: Policy Enforcement Tables
-- ============================================================================

-- Table for tracking policy violations
CREATE TABLE IF NOT EXISTS agent_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID REFERENCES agent_autonomous_runs(id) ON DELETE SET NULL,
  policy_id TEXT NOT NULL,
  policy_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  violation_reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  was_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_violations_tenant
  ON agent_policy_violations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_policy_violations_policy
  ON agent_policy_violations(policy_id, created_at DESC);

-- ============================================================================
-- P0.5: Order Processing Tables
-- ============================================================================

-- Order processing queue
CREATE TABLE IF NOT EXISTS order_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  priority INTEGER DEFAULT 0,
  -- Validation results
  pricing_valid BOOLEAN,
  pricing_errors JSONB DEFAULT '[]',
  credit_approved BOOLEAN,
  credit_details JSONB DEFAULT '{}',
  requirements_met BOOLEAN,
  missing_requirements JSONB DEFAULT '[]',
  -- Processing details
  processed_by TEXT, -- 'agent' or user_id
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  -- Auto-fix attempts
  auto_fix_attempted BOOLEAN DEFAULT false,
  auto_fix_successful BOOLEAN,
  auto_fix_details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_processing_pending
  ON order_processing_queue(tenant_id, status, priority DESC)
  WHERE status = 'pending';

-- Order processing exceptions
CREATE TABLE IF NOT EXISTS order_processing_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL,
  exception_data JSONB NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error',
  resolved BOOLEAN DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_exceptions_unresolved
  ON order_processing_exceptions(tenant_id, resolved, created_at DESC)
  WHERE resolved = false;

-- ============================================================================
-- P2.1: Data Warehouse Tables (Placeholder for future)
-- ============================================================================

-- Warehouse events for pattern detection
CREATE TABLE IF NOT EXISTS warehouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  event_data JSONB NOT NULL,
  metrics JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioning hint: Consider partitioning by occurred_at for large datasets
CREATE INDEX IF NOT EXISTS idx_warehouse_events_tenant_type
  ON warehouse_events(tenant_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_events_occurred
  ON warehouse_events(occurred_at DESC);

-- Client patterns discovered by insights engine
CREATE TABLE IF NOT EXISTS client_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pattern_type TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  evidence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_patterns_tenant
  ON client_patterns(tenant_id, pattern_type, is_active);

-- Success strategies recommended by insights engine
CREATE TABLE IF NOT EXISTS success_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  description TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '[]',
  evidence JSONB NOT NULL,
  effectiveness_score DECIMAL(5,4),
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_success_strategies_tenant
  ON success_strategies(tenant_id, strategy_type, is_active);

-- ============================================================================
-- Hourly Reflection Records
-- ============================================================================

-- Enhanced reflection records for hourly cycles
CREATE TABLE IF NOT EXISTS agent_hourly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID REFERENCES agent_autonomous_runs(id) ON DELETE SET NULL,
  cycle_hour TIMESTAMPTZ NOT NULL,
  -- What happened
  what_we_did TEXT NOT NULL,
  actions_taken JSONB DEFAULT '[]',
  -- Impact
  what_moved_metrics JSONB DEFAULT '{}',
  goal_progress JSONB DEFAULT '{}',
  -- Blockers
  what_got_blocked JSONB DEFAULT '[]',
  blocker_reasons JSONB DEFAULT '[]',
  -- Next steps
  what_we_will_try_next JSONB DEFAULT '[]',
  deferred_actions JSONB DEFAULT '[]',
  -- Insights
  hypotheses JSONB DEFAULT '[]',
  insights JSONB DEFAULT '[]',
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hourly_reflections_tenant
  ON agent_hourly_reflections(tenant_id, cycle_hour DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE agent_autonomous_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tenant_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_processing_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_hourly_reflections ENABLE ROW LEVEL SECURITY;

-- RLS policies using tenant_id
CREATE POLICY "tenant_isolation" ON agent_autonomous_runs
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON agent_tenant_locks
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON engagement_clocks
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON agent_policy_violations
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON order_processing_queue
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON order_processing_exceptions
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON warehouse_events
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON client_patterns
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON success_strategies
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "tenant_isolation" ON agent_hourly_reflections
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to acquire tenant lock
CREATE OR REPLACE FUNCTION acquire_tenant_lock(
  p_tenant_id UUID,
  p_locked_by TEXT,
  p_lock_type TEXT DEFAULT 'autonomous_cycle',
  p_lock_duration_minutes INTEGER DEFAULT 30
)
RETURNS BOOLEAN AS $$
DECLARE
  v_acquired BOOLEAN := false;
BEGIN
  -- First, clean up expired locks
  DELETE FROM agent_tenant_locks WHERE expires_at < NOW();

  -- Try to insert a new lock
  INSERT INTO agent_tenant_locks (tenant_id, locked_at, locked_by, lock_type, expires_at)
  VALUES (
    p_tenant_id,
    NOW(),
    p_locked_by,
    p_lock_type,
    NOW() + (p_lock_duration_minutes || ' minutes')::INTERVAL
  )
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Check if we got the lock
  SELECT EXISTS(
    SELECT 1 FROM agent_tenant_locks
    WHERE tenant_id = p_tenant_id
    AND locked_by = p_locked_by
    AND lock_type = p_lock_type
  ) INTO v_acquired;

  RETURN v_acquired;
END;
$$ LANGUAGE plpgsql;

-- Function to release tenant lock
CREATE OR REPLACE FUNCTION release_tenant_lock(
  p_tenant_id UUID,
  p_locked_by TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_row_count INTEGER;
  v_released BOOLEAN := false;
BEGIN
  DELETE FROM agent_tenant_locks
  WHERE tenant_id = p_tenant_id
  AND locked_by = p_locked_by;

  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  v_released := v_row_count > 0;
  RETURN v_released;
END;
$$ LANGUAGE plpgsql;

-- Function to update engagement clock after touch
CREATE OR REPLACE FUNCTION update_engagement_clock(
  p_tenant_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_touch_type TEXT,
  p_touch_by TEXT DEFAULT 'agent',
  p_card_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_clock_id UUID;
  v_frequency INTEGER := 21;
BEGIN
  -- Upsert the engagement clock
  INSERT INTO engagement_clocks (
    tenant_id, entity_type, entity_id,
    last_touch_at, last_touch_type, last_touch_by, last_touch_card_id,
    next_touch_due, touch_count_30d, is_compliant, days_overdue
  )
  VALUES (
    p_tenant_id, p_entity_type, p_entity_id,
    NOW(), p_touch_type, p_touch_by, p_card_id,
    NOW() + (v_frequency || ' days')::INTERVAL,
    1, true, 0
  )
  ON CONFLICT (tenant_id, entity_type, entity_id) DO UPDATE SET
    last_touch_at = NOW(),
    last_touch_type = p_touch_type,
    last_touch_by = p_touch_by,
    last_touch_card_id = COALESCE(p_card_id, engagement_clocks.last_touch_card_id),
    next_touch_due = NOW() + (engagement_clocks.touch_frequency_days || ' days')::INTERVAL,
    touch_count_30d = engagement_clocks.touch_count_30d + 1,
    is_compliant = true,
    days_overdue = 0,
    updated_at = NOW()
  RETURNING id INTO v_clock_id;

  RETURN v_clock_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and update engagement compliance
CREATE OR REPLACE FUNCTION refresh_engagement_compliance(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  UPDATE engagement_clocks
  SET
    is_compliant = (next_touch_due >= NOW()),
    days_overdue = GREATEST(0, EXTRACT(DAY FROM NOW() - next_touch_due)::INTEGER),
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
  AND (
    is_compliant != (next_touch_due >= NOW())
    OR days_overdue != GREATEST(0, EXTRACT(DAY FROM NOW() - next_touch_due)::INTEGER)
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE agent_autonomous_runs IS 'Tracks each hourly autonomous agent cycle with Plan→Act→React→Reflect phases';
COMMENT ON TABLE agent_tenant_locks IS 'Prevents concurrent autonomous cycles for the same tenant';
COMMENT ON TABLE engagement_clocks IS 'Tracks 21-day engagement compliance per contact/account';
COMMENT ON TABLE agent_policy_violations IS 'Logs policy violations and blocked actions';
COMMENT ON TABLE order_processing_queue IS 'Queue for automated order validation and processing';
COMMENT ON TABLE warehouse_events IS 'Event store for pattern detection and insights';
COMMENT ON TABLE client_patterns IS 'Discovered patterns in client behavior';
COMMENT ON TABLE success_strategies IS 'AI-recommended strategies based on historical success';
COMMENT ON TABLE agent_hourly_reflections IS 'Detailed reflections from each autonomous cycle';
