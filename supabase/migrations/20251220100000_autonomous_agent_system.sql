-- P0: Autonomous Agent System Migration
-- Creates tables and functions for the Plan → Act → React → Reflect hourly loop

-- ============================================================================
-- Agent Autonomous Runs - Track hourly cycle execution
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_autonomous_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_number INTEGER NOT NULL DEFAULT 1,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    phase TEXT CHECK (phase IN ('plan', 'act', 'react', 'reflect', 'completed', 'failed')),
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),

    -- Metrics
    actions_planned INTEGER DEFAULT 0,
    actions_executed INTEGER DEFAULT 0,
    actions_blocked INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    cards_created INTEGER DEFAULT 0,

    -- Context
    trigger TEXT DEFAULT 'scheduled', -- 'scheduled', 'manual', 'event'
    error_message TEXT,
    duration_ms INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for finding runs by tenant and time
CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_time ON agent_autonomous_runs(tenant_id, started_at DESC);

-- ============================================================================
-- Agent Tenant Locks - Prevent concurrent runs per tenant
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_tenant_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_id UUID REFERENCES agent_autonomous_runs(id) ON DELETE SET NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    lock_holder TEXT, -- Identifier for the process holding the lock
    UNIQUE(tenant_id)
);

-- ============================================================================
-- Engagement Clocks - 21-day compliance tracking per contact/account
-- ============================================================================
CREATE TABLE IF NOT EXISTS engagement_clocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    -- Last touch tracking
    last_touch_at TIMESTAMPTZ,
    last_touch_type TEXT, -- 'email', 'call', 'meeting', 'task'
    last_touch_by UUID REFERENCES profiles(id), -- Who made the touch (user or agent)

    -- Next touch calculation
    next_touch_due TIMESTAMPTZ,
    engagement_interval_days INTEGER DEFAULT 21, -- Customizable per contact

    -- Compliance status
    is_compliant BOOLEAN GENERATED ALWAYS AS (
        next_touch_due IS NULL OR next_touch_due > NOW()
    ) STORED,
    days_overdue INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN next_touch_due IS NULL THEN 0
            WHEN next_touch_due > NOW() THEN 0
            ELSE EXTRACT(DAY FROM (NOW() - next_touch_due))::INTEGER
        END
    ) STORED,

    -- Priority scoring
    priority_score NUMERIC(5,2) DEFAULT 0, -- Higher = more urgent

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT engagement_clock_target CHECK (
        (client_id IS NOT NULL) OR (contact_id IS NOT NULL)
    )
);

-- Index for finding overdue engagements
CREATE INDEX IF NOT EXISTS idx_engagement_clocks_compliance
ON engagement_clocks(tenant_id, is_compliant, next_touch_due);

-- Unique constraint per target
CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_clocks_client
ON engagement_clocks(tenant_id, client_id) WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_clocks_contact
ON engagement_clocks(tenant_id, contact_id) WHERE contact_id IS NOT NULL;

-- ============================================================================
-- Agent Policy Violations - Audit trail for blocked actions
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_id UUID REFERENCES agent_autonomous_runs(id) ON DELETE SET NULL,

    violation_type TEXT NOT NULL, -- 'human_task_no_request', 'research_before_exhaustion', 'rate_limit', 'sensitive_action'
    action_type TEXT, -- The action that was blocked
    action_data JSONB, -- Full action payload
    reason TEXT NOT NULL, -- Human-readable explanation
    blocked BOOLEAN DEFAULT TRUE, -- Was the action actually blocked?

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_violations_tenant
ON agent_policy_violations(tenant_id, created_at DESC);

-- ============================================================================
-- Order Processing Queue - New orders awaiting validation
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'validated', 'exception', 'skipped')),
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Validation results
    pricing_valid BOOLEAN,
    credit_valid BOOLEAN,
    requirements_valid BOOLEAN,

    -- Auto-fix tracking
    auto_fixes JSONB DEFAULT '[]', -- Array of fixes applied

    UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_queue_pending
ON order_processing_queue(tenant_id, status) WHERE status = 'pending';

-- ============================================================================
-- Order Processing Exceptions - Validation failures requiring attention
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_processing_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    queue_id UUID REFERENCES order_processing_queue(id) ON DELETE CASCADE,

    exception_type TEXT NOT NULL, -- 'pricing', 'credit', 'requirements', 'other'
    severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    details JSONB,

    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_exceptions_unresolved
ON order_processing_exceptions(tenant_id, resolved, created_at DESC) WHERE resolved = FALSE;

-- ============================================================================
-- Agent Hourly Reflections - Detailed cycle reflections
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_hourly_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    run_id UUID REFERENCES agent_autonomous_runs(id) ON DELETE CASCADE,

    -- What happened
    summary TEXT, -- AI-generated summary
    changes JSONB DEFAULT '[]', -- Array of changes made
    metrics_delta JSONB DEFAULT '{}', -- What metrics moved

    -- Blockers and insights
    blockers JSONB DEFAULT '[]', -- What prevented action
    insights JSONB DEFAULT '[]', -- Patterns detected

    -- Next hour hints
    next_hour_priorities JSONB DEFAULT '[]', -- What to focus on next

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Agent Rate Limits - Centralized rate limiting
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'email_send', 'research', 'sandbox', etc.
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    action_count INTEGER NOT NULL DEFAULT 0,

    UNIQUE(tenant_id, action_type, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON agent_rate_limits(tenant_id, action_type, window_start DESC);

-- ============================================================================
-- Agent Alerts - Monitoring and notification records
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    alert_type TEXT NOT NULL, -- 'email_volume_spike', 'provider_failure', 'policy_block_spike', etc.
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',

    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_alerts_unacked
ON agent_alerts(tenant_id, acknowledged, created_at DESC) WHERE acknowledged = FALSE;

-- ============================================================================
-- Email Provider Failures - Track email sending issues
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_provider_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    error_type TEXT NOT NULL, -- 'auth', 'rate_limit', '5xx', 'timeout', etc.
    error_message TEXT,
    provider TEXT DEFAULT 'resend',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_failures_recent
ON email_provider_failures(tenant_id, created_at DESC);

-- ============================================================================
-- System Config - Global configuration (no RLS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default agent config
INSERT INTO system_config (key, value)
VALUES ('agent_config', '{"global_enabled": false, "kill_switch_reason": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Add agent_enabled column to tenants if not exists
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'agent_enabled'
    ) THEN
        ALTER TABLE tenants ADD COLUMN agent_enabled BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'agent_settings'
    ) THEN
        ALTER TABLE tenants ADD COLUMN agent_settings JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Acquire tenant lock (atomic, race-safe)
CREATE OR REPLACE FUNCTION acquire_tenant_lock(
    p_tenant_id UUID,
    p_lock_holder TEXT,
    p_duration_minutes INTEGER DEFAULT 60
) RETURNS UUID AS $$
DECLARE
    v_run_id UUID;
    v_lock_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_expires_at TIMESTAMPTZ := v_now + (p_duration_minutes || ' minutes')::INTERVAL;
BEGIN
    -- Clean up expired locks first
    DELETE FROM agent_tenant_locks WHERE expires_at < v_now;

    -- Try to insert new lock (will fail if already locked)
    INSERT INTO agent_tenant_locks (tenant_id, lock_holder, locked_at, expires_at)
    VALUES (p_tenant_id, p_lock_holder, v_now, v_expires_at)
    ON CONFLICT (tenant_id) DO NOTHING
    RETURNING id INTO v_lock_id;

    -- Check if we got the lock using ROW_COUNT pattern
    IF v_lock_id IS NULL THEN
        RETURN NULL; -- Lock not acquired
    END IF;

    -- Create autonomous run record
    INSERT INTO agent_autonomous_runs (tenant_id, started_at)
    VALUES (p_tenant_id, v_now)
    RETURNING id INTO v_run_id;

    -- Update lock with run_id
    UPDATE agent_tenant_locks SET run_id = v_run_id WHERE id = v_lock_id;

    RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- Release tenant lock
CREATE OR REPLACE FUNCTION release_tenant_lock(
    p_tenant_id UUID,
    p_run_id UUID,
    p_status TEXT DEFAULT 'completed'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update run status
    UPDATE agent_autonomous_runs
    SET
        status = p_status,
        completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
    WHERE id = p_run_id;

    -- Delete the lock
    DELETE FROM agent_tenant_locks WHERE tenant_id = p_tenant_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Extend lock duration
CREATE OR REPLACE FUNCTION extend_tenant_lock(
    p_tenant_id UUID,
    p_additional_minutes INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE agent_tenant_locks
    SET expires_at = expires_at + (p_additional_minutes || ' minutes')::INTERVAL
    WHERE tenant_id = p_tenant_id AND expires_at > NOW();

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Update engagement clock after a touch
CREATE OR REPLACE FUNCTION update_engagement_clock(
    p_tenant_id UUID,
    p_client_id UUID,
    p_contact_id UUID,
    p_touch_type TEXT,
    p_touched_by UUID
) RETURNS UUID AS $$
DECLARE
    v_clock_id UUID;
    v_interval INTEGER := 21; -- Default 21 days
BEGIN
    -- Upsert engagement clock
    INSERT INTO engagement_clocks (
        tenant_id, client_id, contact_id,
        last_touch_at, last_touch_type, last_touch_by,
        next_touch_due, engagement_interval_days
    )
    VALUES (
        p_tenant_id, p_client_id, p_contact_id,
        NOW(), p_touch_type, p_touched_by,
        NOW() + (v_interval || ' days')::INTERVAL, v_interval
    )
    ON CONFLICT (tenant_id, client_id) WHERE client_id IS NOT NULL
    DO UPDATE SET
        last_touch_at = NOW(),
        last_touch_type = p_touch_type,
        last_touch_by = p_touched_by,
        next_touch_due = NOW() + (engagement_clocks.engagement_interval_days || ' days')::INTERVAL,
        updated_at = NOW()
    RETURNING id INTO v_clock_id;

    -- Handle contact-level clock separately
    IF v_clock_id IS NULL AND p_contact_id IS NOT NULL THEN
        INSERT INTO engagement_clocks (
            tenant_id, client_id, contact_id,
            last_touch_at, last_touch_type, last_touch_by,
            next_touch_due, engagement_interval_days
        )
        VALUES (
            p_tenant_id, p_client_id, p_contact_id,
            NOW(), p_touch_type, p_touched_by,
            NOW() + (v_interval || ' days')::INTERVAL, v_interval
        )
        ON CONFLICT (tenant_id, contact_id) WHERE contact_id IS NOT NULL
        DO UPDATE SET
            last_touch_at = NOW(),
            last_touch_type = p_touch_type,
            last_touch_by = p_touched_by,
            next_touch_due = NOW() + (engagement_clocks.engagement_interval_days || ' days')::INTERVAL,
            updated_at = NOW()
        RETURNING id INTO v_clock_id;
    END IF;

    RETURN v_clock_id;
END;
$$ LANGUAGE plpgsql;

-- Check and increment rate limit (atomic)
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
    p_tenant_id UUID,
    p_action_type TEXT,
    p_max_allowed INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_window_start TIMESTAMPTZ := date_trunc('hour', v_now);
    v_window_end TIMESTAMPTZ := v_window_start + INTERVAL '1 hour';
    v_current_count INTEGER;
BEGIN
    -- Try to insert or update
    INSERT INTO agent_rate_limits (tenant_id, action_type, window_start, window_end, action_count)
    VALUES (p_tenant_id, p_action_type, v_window_start, v_window_end, 1)
    ON CONFLICT (tenant_id, action_type, window_start)
    DO UPDATE SET action_count = agent_rate_limits.action_count + 1
    RETURNING action_count INTO v_current_count;

    -- Check if over limit (after increment)
    RETURN v_current_count <= p_max_allowed;
END;
$$ LANGUAGE plpgsql;

-- Get engagement violations for tenant
CREATE OR REPLACE FUNCTION get_engagement_violations(p_tenant_id UUID)
RETURNS TABLE (
    clock_id UUID,
    client_id UUID,
    contact_id UUID,
    days_overdue INTEGER,
    last_touch_at TIMESTAMPTZ,
    next_touch_due TIMESTAMPTZ,
    priority_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id as clock_id,
        e.client_id,
        e.contact_id,
        e.days_overdue,
        e.last_touch_at,
        e.next_touch_due,
        e.priority_score
    FROM engagement_clocks e
    WHERE e.tenant_id = p_tenant_id
      AND e.is_compliant = FALSE
    ORDER BY e.days_overdue DESC, e.priority_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE agent_autonomous_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tenant_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_clocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_processing_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_hourly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_provider_failures ENABLE ROW LEVEL SECURITY;
-- system_config is global, no RLS

-- Create tenant isolation policies
CREATE POLICY tenant_isolation ON agent_autonomous_runs
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON agent_tenant_locks
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON engagement_clocks
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON agent_policy_violations
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON order_processing_queue
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON order_processing_exceptions
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON agent_hourly_reflections
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON agent_rate_limits
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON agent_alerts
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON email_provider_failures
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Service role policies for cron jobs
CREATE POLICY service_role_all ON agent_autonomous_runs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_tenant_locks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON engagement_clocks
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_policy_violations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON order_processing_queue
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON order_processing_exceptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_hourly_reflections
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_rate_limits
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON agent_alerts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON email_provider_failures
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON system_config
    FOR ALL TO service_role USING (true) WITH CHECK (true);
