-- Add Service Role Policies for P0 Autonomous Agent System
-- Fixes missing service_role bypass policies needed for cron jobs and API routes

-- ============================================================================
-- Service Role Policies - Allow cron jobs to bypass RLS
-- ============================================================================

-- Agent Autonomous Runs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agent_autonomous_runs'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON agent_autonomous_runs
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Agent Tenant Locks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agent_tenant_locks'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON agent_tenant_locks
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Engagement Clocks
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'engagement_clocks'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON engagement_clocks
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Agent Policy Violations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agent_policy_violations'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON agent_policy_violations
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Order Processing Queue
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'order_processing_queue'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON order_processing_queue
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Order Processing Exceptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'order_processing_exceptions'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON order_processing_exceptions
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Agent Hourly Reflections
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agent_hourly_reflections'
        AND policyname = 'service_role_all'
    ) THEN
        CREATE POLICY service_role_all ON agent_hourly_reflections
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Agent Rate Limits (check if already has service_role_full_access policy)
DO $$
BEGIN
    -- Only add if no service_role policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'agent_rate_limits'
        AND (policyname = 'service_role_all' OR policyname LIKE '%service_role%')
        AND 'service_role' = ANY(roles)
    ) THEN
        CREATE POLICY service_role_all ON agent_rate_limits
            FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- Verification Query (for manual testing)
-- ============================================================================

-- Run this after migration to verify all policies are in place:
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'agent_autonomous_runs', 'agent_tenant_locks', 'engagement_clocks',
--   'agent_policy_violations', 'order_processing_queue', 'order_processing_exceptions',
--   'agent_hourly_reflections', 'agent_rate_limits'
-- )
-- AND 'service_role' = ANY(roles)
-- ORDER BY tablename;
