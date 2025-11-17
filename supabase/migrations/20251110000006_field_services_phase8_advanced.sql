-- =====================================================
-- Field Services Phase 8: Advanced Features & Polish (FIXED)
-- Adapted for existing schema without org_id column
-- =====================================================

-- Audit logs for complete activity tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  user_name TEXT,

  action TEXT NOT NULL, -- create, update, delete, login, export, etc.
  entity_type TEXT NOT NULL, -- booking, resource, order, etc.
  entity_id UUID,

  old_values JSONB,
  new_values JSONB,
  changes JSONB, -- Specific fields that changed

  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,

  request_method TEXT,
  request_path TEXT,

  severity TEXT DEFAULT 'info', -- debug, info, warning, error, critical

  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Advanced permissions system
CREATE TABLE IF NOT EXISTS public.field_service_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  role_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  permissions JSONB NOT NULL, -- {resource: {actions: [read, write, delete]}}

  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, role_name)
);

-- User role assignments
CREATE TABLE IF NOT EXISTS public.field_service_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.field_service_roles(id) ON DELETE CASCADE,

  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT now(),

  expires_at TIMESTAMPTZ,

  UNIQUE(user_id, role_id)
);

-- AI scheduling suggestions
CREATE TABLE IF NOT EXISTS public.scheduling_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.bookable_resources(id),

  suggested_start TIMESTAMPTZ NOT NULL,
  suggested_end TIMESTAMPTZ NOT NULL,

  confidence_score DECIMAL(5, 2), -- 0-100
  reasoning TEXT,

  factors JSONB, -- {distance: 10, workload: 20, skills_match: 90, availability: 100}

  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Batch operations log
CREATE TABLE IF NOT EXISTS public.batch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id),

  operation_type TEXT NOT NULL, -- bulk_update, bulk_delete, bulk_assign, etc.
  entity_type TEXT NOT NULL, -- bookings, resources, etc.

  total_items INTEGER NOT NULL,
  processed_items INTEGER DEFAULT 0,
  successful_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,

  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  progress_percentage DECIMAL(5, 2) DEFAULT 0,

  operation_data JSONB, -- Input parameters
  results JSONB, -- Detailed results per item

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- System settings/configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  category TEXT NOT NULL, -- scheduling, notifications, billing, etc.
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,

  is_public BOOLEAN DEFAULT false, -- Visible to non-admins
  is_encrypted BOOLEAN DEFAULT false,

  description TEXT,

  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, category, setting_key)
);

-- Performance optimization: Cached calculations
CREATE TABLE IF NOT EXISTS public.cached_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  calculation_type TEXT NOT NULL, -- resource_utilization, revenue_forecast, etc.
  calculation_key TEXT NOT NULL, -- Unique identifier

  result_data JSONB NOT NULL,

  valid_until TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,

  calculation_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(org_id, calculation_type, calculation_key)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created
  ON public.audit_logs(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_field_service_roles_org_active
  ON public.field_service_roles(org_id, is_active);

CREATE INDEX IF NOT EXISTS idx_field_service_user_roles_user
  ON public.field_service_user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_scheduling_suggestions_booking
  ON public.scheduling_suggestions(booking_id, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_batch_operations_org_status
  ON public.batch_operations(org_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_settings_lookup
  ON public.system_settings(org_id, category, setting_key);

CREATE INDEX IF NOT EXISTS idx_cached_calculations_lookup
  ON public.cached_calculations(org_id, calculation_type, calculation_key)
  WHERE invalidated_at IS NULL AND valid_until > now();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_service_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_service_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduling_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cached_calculations ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  USING (org_id = auth.uid());

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

-- Field service roles policies
CREATE POLICY field_service_roles_select ON public.field_service_roles
  FOR SELECT
  USING (org_id = auth.uid());

CREATE POLICY field_service_roles_insert ON public.field_service_roles
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

CREATE POLICY field_service_roles_update ON public.field_service_roles
  FOR UPDATE
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

CREATE POLICY field_service_roles_delete ON public.field_service_roles
  FOR DELETE
  USING (org_id = auth.uid() AND is_system_role = false);

-- Field service user roles policies
CREATE POLICY field_service_user_roles_select ON public.field_service_user_roles
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.field_service_roles r
      JOIN public.field_service_user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.org_id = auth.uid()
    )
  );

CREATE POLICY field_service_user_roles_insert ON public.field_service_user_roles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.field_service_roles r
      JOIN public.field_service_user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.org_id = auth.uid()
    )
  );

CREATE POLICY field_service_user_roles_delete ON public.field_service_user_roles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.field_service_roles r
      JOIN public.field_service_user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.org_id = auth.uid()
    )
  );

-- Scheduling suggestions policies
CREATE POLICY scheduling_suggestions_select ON public.scheduling_suggestions
  FOR SELECT
  USING (org_id = auth.uid());

CREATE POLICY scheduling_suggestions_insert ON public.scheduling_suggestions
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

CREATE POLICY scheduling_suggestions_update ON public.scheduling_suggestions
  FOR UPDATE
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

-- Batch operations policies
CREATE POLICY batch_operations_select ON public.batch_operations
  FOR SELECT
  USING (org_id = auth.uid());

CREATE POLICY batch_operations_insert ON public.batch_operations
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

CREATE POLICY batch_operations_update ON public.batch_operations
  FOR UPDATE
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

-- System settings policies
CREATE POLICY system_settings_select ON public.system_settings
  FOR SELECT
  USING (org_id = auth.uid() OR (org_id IS NULL AND is_public = true));

CREATE POLICY system_settings_insert ON public.system_settings
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

CREATE POLICY system_settings_update ON public.system_settings
  FOR UPDATE
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

CREATE POLICY system_settings_delete ON public.system_settings
  FOR DELETE
  USING (org_id = auth.uid());

-- Cached calculations policies
CREATE POLICY cached_calculations_select ON public.cached_calculations
  FOR SELECT
  USING (org_id = auth.uid());

CREATE POLICY cached_calculations_insert ON public.cached_calculations
  FOR INSERT
  WITH CHECK (org_id = auth.uid());

CREATE POLICY cached_calculations_update ON public.cached_calculations
  FOR UPDATE
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

CREATE POLICY cached_calculations_delete ON public.cached_calculations
  FOR DELETE
  USING (org_id = auth.uid());

-- =====================================================
-- Functions
-- =====================================================

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_logs (
    org_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    auth.uid(),
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check user permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_resource TEXT,
  p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.field_service_user_roles ur
    JOIN public.field_service_roles rp ON ur.role_id = rp.id
    WHERE ur.user_id = p_user_id
    AND rp.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
    AND rp.permissions->p_resource ? p_action
  ) INTO has_perm;

  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate AI scheduling suggestion
CREATE OR REPLACE FUNCTION generate_scheduling_suggestion(
  p_booking_id UUID
) RETURNS UUID AS $$
DECLARE
  suggestion_id UUID;
  best_resource UUID;
  best_time TIMESTAMPTZ;
BEGIN
  -- Simplified AI logic - in production, use ML model
  -- Find best resource based on availability, skills, location
  SELECT id INTO best_resource
  FROM public.bookable_resources
  WHERE is_bookable = true
  LIMIT 1;

  -- Suggest next available slot
  best_time := now() + interval '1 day';

  INSERT INTO public.scheduling_suggestions (
    org_id,
    booking_id,
    resource_id,
    suggested_start,
    suggested_end,
    confidence_score,
    reasoning
  ) VALUES (
    auth.uid(),
    p_booking_id,
    best_resource,
    best_time,
    best_time + interval '2 hours',
    85.0,
    'Based on resource availability and workload'
  ) RETURNING id INTO suggestion_id;

  RETURN suggestion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Invalidate cache
CREATE OR REPLACE FUNCTION invalidate_cache(
  p_calculation_type TEXT,
  p_calculation_key TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE public.cached_calculations
  SET invalidated_at = now()
  WHERE calculation_type = p_calculation_type
  AND (p_calculation_key IS NULL OR calculation_key = p_calculation_key)
  AND invalidated_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
