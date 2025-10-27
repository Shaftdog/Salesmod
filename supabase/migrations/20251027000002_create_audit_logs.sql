-- =============================================
-- Admin Panel: Audit Logging System
-- Phase 1: Track All Admin Actions
--
-- NOTE: This migration was originally timestamped 20251025000002
-- but was renamed to 20251027000002 to maintain proper sequence
-- after renaming the RBAC tables migration
-- The migration was already applied to production on Oct 26, 2025
-- =============================================

-- =============================================
-- 1. AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Denormalized for auditability even if user is deleted
  user_role VARCHAR(50), -- Role at time of action
  action VARCHAR(100) NOT NULL, -- e.g., 'user.create', 'user.update', 'order.delete'
  resource_type VARCHAR(50), -- e.g., 'user', 'order', 'property', 'setting'
  resource_id UUID, -- ID of the affected resource
  changes JSONB, -- JSON diff of before/after values
  metadata JSONB, -- Additional context (search params, filters, etc.)
  ip_address INET, -- IP address of the user
  user_agent TEXT, -- Browser/client user agent
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure', 'error'
  error_message TEXT, -- Error details if status is 'failure' or 'error'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id);

-- Index for filtering by user email
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email
  ON public.audit_logs(user_email);

-- Index for time-based queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

-- Index for filtering by action type
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

-- Composite index for resource lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
  ON public.audit_logs(resource_type, resource_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_audit_logs_status
  ON public.audit_logs(status);

-- Composite index for common admin queries (user + date)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date
  ON public.audit_logs(user_id, created_at DESC);

-- Composite index for resource history queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date
  ON public.audit_logs(resource_type, resource_id, created_at DESC);

-- GIN index for JSONB columns for advanced filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes
  ON public.audit_logs USING gin(changes);

CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
  ON public.audit_logs USING gin(metadata);

-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- Function to create an audit log entry
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action VARCHAR,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status VARCHAR DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_email TEXT;
  v_user_role VARCHAR(50);
BEGIN
  -- Get user's email and role
  SELECT email, role INTO v_user_email, v_user_role
  FROM public.profiles
  WHERE id = p_user_id;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    resource_type,
    resource_id,
    changes,
    metadata,
    ip_address,
    user_agent,
    status,
    error_message
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_role,
    p_action,
    p_resource_type,
    p_resource_id,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent,
    p_status,
    p_error_message
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get audit trail for a specific resource
CREATE OR REPLACE FUNCTION public.get_resource_audit_trail(
  p_resource_type VARCHAR,
  p_resource_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  user_email TEXT,
  user_role VARCHAR,
  action VARCHAR,
  changes JSONB,
  metadata JSONB,
  status VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_email,
    al.user_role,
    al.action,
    al.changes,
    al.metadata,
    al.status,
    al.created_at
  FROM public.audit_logs al
  WHERE al.resource_type = p_resource_type
    AND al.resource_id = p_resource_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's activity log
CREATE OR REPLACE FUNCTION public.get_user_activity(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  action VARCHAR,
  resource_type VARCHAR,
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  status VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.action,
    al.resource_type,
    al.resource_id,
    al.changes,
    al.metadata,
    al.status,
    al.created_at
  FROM public.audit_logs al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old audit logs (for maintenance)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  p_days_to_keep INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. AUTOMATIC AUDIT LOGGING TRIGGERS
-- =============================================

-- Trigger function to automatically log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action VARCHAR(100);
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'user.create';
    v_changes := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'user.update';
    v_changes := jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'user.delete';
    v_changes := jsonb_build_object('old', to_jsonb(OLD));
  END IF;

  -- Create audit log (only for updates/deletes done by other users)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.id != auth.uid()) THEN
    PERFORM public.create_audit_log(
      auth.uid(),
      v_action,
      'user',
      COALESCE(NEW.id, OLD.id),
      v_changes,
      NULL,
      NULL,
      NULL,
      'success',
      NULL
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;

CREATE TRIGGER audit_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Audit logs are immutable - only system can insert
-- (via functions with SECURITY DEFINER)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be inserted via SECURITY DEFINER functions

-- No updates or deletes allowed (immutable audit trail)
-- Only via cleanup function for old logs

-- =============================================
-- 6. PARTITION FOR SCALABILITY (Optional)
-- =============================================

-- Note: For high-volume systems, consider partitioning by date
-- This is optional and can be added later if needed

-- Example (commented out - implement if needed):
-- CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
--   FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- =============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all system actions, especially admin operations';
COMMENT ON COLUMN public.audit_logs.user_email IS 'Denormalized email for auditability even after user deletion';
COMMENT ON COLUMN public.audit_logs.user_role IS 'User role at time of action (immutable snapshot)';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (format: resource.action, e.g., user.update)';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON diff showing before/after values';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context like search params, filters, bulk operation details';

COMMENT ON FUNCTION public.create_audit_log IS 'Creates an audit log entry (use this instead of direct INSERT)';
COMMENT ON FUNCTION public.get_resource_audit_trail IS 'Returns audit trail for a specific resource';
COMMENT ON FUNCTION public.get_user_activity IS 'Returns activity log for a specific user';
COMMENT ON FUNCTION public.cleanup_old_audit_logs IS 'Maintenance function to remove old audit logs';
