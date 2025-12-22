-- P0 Schema Fix Migration
-- Reconciles existing P0 tables with the expected schema

-- ============================================================================
-- 1. Fix engagement_clocks - Add client_id/contact_id if missing
-- ============================================================================
DO $$
BEGIN
    -- Add client_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'engagement_clocks' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE engagement_clocks ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

        -- Migrate data from entity_id to client_id where entity_type = 'client'
        UPDATE engagement_clocks
        SET client_id = entity_id
        WHERE entity_type = 'client' OR entity_type = 'account';
    END IF;

    -- Add contact_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'engagement_clocks' AND column_name = 'contact_id'
    ) THEN
        ALTER TABLE engagement_clocks ADD COLUMN contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE;

        -- Migrate data from entity_id to contact_id where entity_type = 'contact'
        UPDATE engagement_clocks
        SET contact_id = entity_id
        WHERE entity_type = 'contact';
    END IF;

    -- Add engagement_interval_days if missing (rename from touch_frequency_days if it exists)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'engagement_clocks' AND column_name = 'engagement_interval_days'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'engagement_clocks' AND column_name = 'touch_frequency_days'
        ) THEN
            ALTER TABLE engagement_clocks RENAME COLUMN touch_frequency_days TO engagement_interval_days;
        ELSE
            ALTER TABLE engagement_clocks ADD COLUMN engagement_interval_days INTEGER DEFAULT 21;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 2. Create missing tables
-- ============================================================================

-- Agent Alerts table
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

-- Email Provider Failures table
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
-- 3. Add missing columns to tenants table
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
-- 4. Ensure system_config has agent_config entry
-- ============================================================================
INSERT INTO system_config (key, value)
VALUES ('agent_config', '{"global_enabled": false, "kill_switch_reason": null}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 5. Create/update unique indexes for engagement_clocks
-- ============================================================================
DROP INDEX IF EXISTS idx_engagement_clocks_client;
DROP INDEX IF EXISTS idx_engagement_clocks_contact;

CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_clocks_client
ON engagement_clocks(tenant_id, client_id) WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_engagement_clocks_contact
ON engagement_clocks(tenant_id, contact_id) WHERE contact_id IS NOT NULL;

-- ============================================================================
-- 6. Update Helper Functions
-- ============================================================================

-- Drop existing functions first to allow signature changes
DROP FUNCTION IF EXISTS acquire_tenant_lock(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS release_tenant_lock(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS extend_tenant_lock(UUID, INTEGER);
DROP FUNCTION IF EXISTS update_engagement_clock(UUID, UUID, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS check_and_increment_rate_limit(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_engagement_violations(UUID);

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

-- Update engagement clock after a touch (updated to use client_id/contact_id)
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
    -- Handle client-level clock
    IF p_client_id IS NOT NULL THEN
        INSERT INTO engagement_clocks (
            tenant_id, client_id, contact_id,
            last_touch_at, last_touch_type, last_touch_by,
            next_touch_due, engagement_interval_days
        )
        VALUES (
            p_tenant_id, p_client_id, NULL,
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
    END IF;

    -- Handle contact-level clock
    IF p_contact_id IS NOT NULL THEN
        INSERT INTO engagement_clocks (
            tenant_id, client_id, contact_id,
            last_touch_at, last_touch_type, last_touch_by,
            next_touch_due, engagement_interval_days
        )
        VALUES (
            p_tenant_id, NULL, p_contact_id,
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

-- Get engagement violations for tenant (updated to use client_id/contact_id)
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
-- 7. RLS Policies for new tables
-- ============================================================================

-- Enable RLS
ALTER TABLE agent_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_provider_failures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS tenant_isolation ON agent_alerts;
DROP POLICY IF EXISTS tenant_isolation ON email_provider_failures;
DROP POLICY IF EXISTS service_role_all ON agent_alerts;
DROP POLICY IF EXISTS service_role_all ON email_provider_failures;

-- Tenant isolation policies
CREATE POLICY tenant_isolation ON agent_alerts
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY tenant_isolation ON email_provider_failures
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    ));

-- Service role policies
CREATE POLICY service_role_all ON agent_alerts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY service_role_all ON email_provider_failures
    FOR ALL TO service_role USING (true) WITH CHECK (true);
