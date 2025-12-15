-- =============================================
-- Enhanced RBAC: Area-Based Access Control System
--
-- This migration adds:
-- 1. Super Admin role and new business roles
-- 2. Area/module-level access control
-- 3. Configurable role templates
-- 4. User-level overrides (tweak or custom)
-- =============================================

-- =============================================
-- 1. AREAS TABLE - Define controllable areas
-- =============================================

CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_areas_code ON public.areas(code);
CREATE INDEX IF NOT EXISTS idx_areas_display_order ON public.areas(display_order);
CREATE INDEX IF NOT EXISTS idx_areas_active ON public.areas(is_active);

-- =============================================
-- 2. SUB_MODULES TABLE - Sub-modules within areas
-- =============================================

CREATE TABLE IF NOT EXISTS public.sub_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  route_pattern VARCHAR(200),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(area_id, code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_modules_area ON public.sub_modules(area_id);
CREATE INDEX IF NOT EXISTS idx_sub_modules_code ON public.sub_modules(code);
CREATE INDEX IF NOT EXISTS idx_sub_modules_route ON public.sub_modules(route_pattern);

-- =============================================
-- 3. ROLE_AREA_TEMPLATES - Default areas per role
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_area_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  include_all_submodules BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_name, area_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_area_templates_role ON public.role_area_templates(role_name);
CREATE INDEX IF NOT EXISTS idx_role_area_templates_area ON public.role_area_templates(area_id);

-- =============================================
-- 4. ROLE_SUBMODULE_TEMPLATES - Specific sub-modules per role
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_submodule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL,
  sub_module_id UUID NOT NULL REFERENCES public.sub_modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_name, sub_module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_submodule_templates_role ON public.role_submodule_templates(role_name);
CREATE INDEX IF NOT EXISTS idx_role_submodule_templates_submodule ON public.role_submodule_templates(sub_module_id);

-- =============================================
-- 5. USER_AREA_OVERRIDES - User-specific override mode
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_area_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  override_mode VARCHAR(20) NOT NULL CHECK (override_mode IN ('tweak', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_area_overrides_user ON public.user_area_overrides(user_id);

-- =============================================
-- 6. USER_AREA_ACCESS - User's area access (tweaks or custom)
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_area_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  access_type VARCHAR(10) NOT NULL CHECK (access_type IN ('grant', 'revoke')),
  include_all_submodules BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_area_access_user ON public.user_area_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_area_access_area ON public.user_area_access(area_id);
CREATE INDEX IF NOT EXISTS idx_user_area_access_type ON public.user_area_access(access_type);

-- =============================================
-- 7. USER_SUBMODULE_ACCESS - User's sub-module access
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_submodule_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_module_id UUID NOT NULL REFERENCES public.sub_modules(id) ON DELETE CASCADE,
  access_type VARCHAR(10) NOT NULL CHECK (access_type IN ('grant', 'revoke')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sub_module_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_submodule_access_user ON public.user_submodule_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submodule_access_submodule ON public.user_submodule_access(sub_module_id);

-- =============================================
-- 8. UPDATE PROFILES ROLE CONSTRAINT
-- =============================================

-- Drop existing constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with all roles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN (
  'super_admin',
  'admin',
  'manager',
  'user',
  'researcher',
  'reviewer',
  'appraiser',
  'software_developer',
  'accounting_clerk'
));

-- =============================================
-- 9. SEED NEW ROLES
-- =============================================

INSERT INTO public.roles (name, description) VALUES
  ('super_admin', 'Full system access - can manage all roles, areas, and configurations'),
  ('researcher', 'Research and production focus - access to production workflows'),
  ('reviewer', 'Quality control focus - access to review and QC workflows'),
  ('appraiser', 'Core appraisal workflow - access to production and property data'),
  ('software_developer', 'System development and maintenance - admin and AI access'),
  ('accounting_clerk', 'Financial operations - access to finance module')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================
-- 10. SEED AREAS
-- =============================================

INSERT INTO public.areas (code, name, description, icon, display_order) VALUES
  ('sales', 'Sales', 'Sales operations including orders, clients, and deals', 'TrendingUp', 1),
  ('marketing', 'Marketing', 'Marketing campaigns, content, and analytics', 'Megaphone', 2),
  ('production', 'Production', 'Production workflows, appraisals, and quality control', 'Factory', 3),
  ('operations', 'Operations', 'Tasks, workflows, and resource management', 'Cog', 4),
  ('logistics', 'Logistics', 'Field resources, equipment, and scheduling', 'Truck', 5),
  ('finance', 'Finance', 'Invoicing, payments, and financial reports', 'DollarSign', 6),
  ('ai_automation', 'AI & Automation', 'AI agents, jobs, and automation tools', 'Brain', 7),
  ('admin', 'Admin', 'User management, settings, and system configuration', 'Shield', 8)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- =============================================
-- 11. SEED SUB-MODULES
-- =============================================

-- Sales sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/sales', 1),
    ('orders', 'Orders', '/orders*', 2),
    ('clients', 'Clients', '/clients*', 3),
    ('contacts', 'Contacts', '/contacts*', 4),
    ('deals', 'Deals', '/deals*', 5),
    ('cases', 'Cases', '/cases*', 6),
    ('properties', 'Properties', '/properties*', 7),
    ('campaigns', 'Campaigns', '/sales/campaigns*', 8),
    ('products', 'Products', '/sales/products*', 9)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'sales'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Marketing sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/marketing', 1),
    ('campaigns', 'Campaigns', '/marketing/campaigns*', 2),
    ('content', 'Content Library', '/marketing/content*', 3),
    ('audiences', 'Lead Scoring', '/marketing/audiences*', 4),
    ('newsletters', 'Newsletters', '/marketing/newsletters*', 5),
    ('email_templates', 'Email Templates', '/marketing/email-templates*', 6),
    ('webinars', 'Webinars', '/marketing/webinars*', 7),
    ('reputation', 'Reputation', '/marketing/reputation*', 8),
    ('analytics', 'Analytics', '/marketing/analytics*', 9),
    ('calendar', 'Calendar', '/marketing/calendar*', 10)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'marketing'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Production sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/production', 1),
    ('board', 'Kanban Board', '/production/board*', 2),
    ('my_tasks', 'My Tasks', '/production/my-tasks*', 3),
    ('active_appraisals', 'Active Appraisals', '/production/active-appraisals*', 4),
    ('quality_control', 'Quality Control', '/production/quality-control*', 5),
    ('templates', 'Templates', '/production/templates*', 6),
    ('task_library', 'Task Library', '/production/library*', 7)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'production'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Operations sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/operations', 1),
    ('tasks', 'Tasks', '/tasks*', 2),
    ('workflows', 'Workflows', '/operations/workflows*', 3),
    ('resources', 'Resources', '/operations/resources*', 4)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'operations'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Logistics sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/logistics', 1),
    ('resources', 'Resources', '/logistics/resources*', 2),
    ('equipment', 'Equipment', '/logistics/equipment*', 3),
    ('territories', 'Territories', '/logistics/territories*', 4),
    ('availability', 'Availability', '/logistics/availability*', 5),
    ('bookings', 'Bookings', '/logistics/bookings*', 6),
    ('scheduling', 'Scheduling', '/logistics/scheduling*', 7),
    ('daily_schedule', 'Daily View', '/logistics/daily-schedule*', 8),
    ('inspections', 'Inspections', '/logistics/inspections*', 9)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'logistics'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Finance sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/finance', 1),
    ('invoicing', 'Invoicing', '/finance/invoicing*', 2),
    ('payments', 'Payments', '/finance/payments*', 3),
    ('reports', 'Reports', '/finance/reports*', 4)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'finance'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- AI & Automation sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('agent', 'AI Agent', '/agent', 1),
    ('jobs', 'Jobs', '/agent/jobs*', 2),
    ('ai_analytics', 'AI Analytics', '/ai-analytics*', 3)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'ai_automation'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- Admin sub-modules
INSERT INTO public.sub_modules (area_id, code, name, route_pattern, display_order)
SELECT a.id, sm.code, sm.name, sm.route_pattern, sm.display_order
FROM public.areas a
CROSS JOIN (
  VALUES
    ('dashboard', 'Dashboard', '/admin', 1),
    ('users', 'Users', '/admin/users*', 2),
    ('roles', 'Roles', '/admin/roles*', 3),
    ('analytics', 'Analytics', '/admin/analytics*', 4),
    ('audit_logs', 'Audit Logs', '/admin/audit-logs*', 5),
    ('settings', 'Settings', '/admin/settings*', 6)
) AS sm(code, name, route_pattern, display_order)
WHERE a.code = 'admin'
ON CONFLICT (area_id, code) DO UPDATE SET
  name = EXCLUDED.name,
  route_pattern = EXCLUDED.route_pattern,
  display_order = EXCLUDED.display_order;

-- =============================================
-- 12. SEED DEFAULT ROLE AREA TEMPLATES
-- =============================================

-- Helper function to assign area to role
CREATE OR REPLACE FUNCTION assign_area_to_role(p_role_name VARCHAR, p_area_code VARCHAR, p_include_all BOOLEAN DEFAULT true)
RETURNS VOID AS $$
DECLARE
  v_area_id UUID;
BEGIN
  SELECT id INTO v_area_id FROM public.areas WHERE code = p_area_code;

  IF v_area_id IS NOT NULL THEN
    INSERT INTO public.role_area_templates (role_name, area_id, include_all_submodules)
    VALUES (p_role_name, v_area_id, p_include_all)
    ON CONFLICT (role_name, area_id) DO UPDATE SET
      include_all_submodules = EXCLUDED.include_all_submodules,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Super Admin: All areas (though code will bypass checks)
SELECT assign_area_to_role('super_admin', 'sales');
SELECT assign_area_to_role('super_admin', 'marketing');
SELECT assign_area_to_role('super_admin', 'production');
SELECT assign_area_to_role('super_admin', 'operations');
SELECT assign_area_to_role('super_admin', 'logistics');
SELECT assign_area_to_role('super_admin', 'finance');
SELECT assign_area_to_role('super_admin', 'ai_automation');
SELECT assign_area_to_role('super_admin', 'admin');

-- Admin: All except Finance (business separation)
SELECT assign_area_to_role('admin', 'sales');
SELECT assign_area_to_role('admin', 'marketing');
SELECT assign_area_to_role('admin', 'production');
SELECT assign_area_to_role('admin', 'operations');
SELECT assign_area_to_role('admin', 'logistics');
SELECT assign_area_to_role('admin', 'ai_automation');
SELECT assign_area_to_role('admin', 'admin');

-- Manager: Business operations
SELECT assign_area_to_role('manager', 'sales');
SELECT assign_area_to_role('manager', 'marketing');
SELECT assign_area_to_role('manager', 'production');
SELECT assign_area_to_role('manager', 'operations');

-- User: Limited access
SELECT assign_area_to_role('user', 'sales');
SELECT assign_area_to_role('user', 'production');

-- Researcher: Production focus
SELECT assign_area_to_role('researcher', 'production');

-- Reviewer: Production (Quality Control focus)
SELECT assign_area_to_role('reviewer', 'production');

-- Appraiser: Production and Sales (Properties)
SELECT assign_area_to_role('appraiser', 'production');
SELECT assign_area_to_role('appraiser', 'sales');

-- Software Developer: Admin (except Users) and AI
SELECT assign_area_to_role('software_developer', 'admin');
SELECT assign_area_to_role('software_developer', 'ai_automation');

-- Accounting Clerk: Finance only
SELECT assign_area_to_role('accounting_clerk', 'finance');

-- Drop helper function
DROP FUNCTION IF EXISTS assign_area_to_role(VARCHAR, VARCHAR, BOOLEAN);

-- =============================================
-- 13. DATABASE FUNCTIONS FOR AREA ACCESS
-- =============================================

-- Drop existing functions to avoid parameter name conflicts
DROP FUNCTION IF EXISTS public.is_super_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_areas(UUID);
DROP FUNCTION IF EXISTS public.user_has_area_access(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.user_has_route_access(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.get_all_areas_with_submodules();
DROP FUNCTION IF EXISTS public.get_role_area_templates(VARCHAR);
DROP FUNCTION IF EXISTS public.verify_area_access_setup();

-- Check if user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN v_role = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's effective areas (combines role template + overrides)
CREATE OR REPLACE FUNCTION public.get_user_areas(p_user_id UUID)
RETURNS TABLE (
  area_code VARCHAR,
  area_name VARCHAR,
  area_icon VARCHAR,
  access_source VARCHAR
) AS $$
DECLARE
  v_role VARCHAR;
  v_override_mode VARCHAR;
BEGIN
  -- Get user's role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  -- Super Admin gets all areas
  IF v_role = 'super_admin' THEN
    RETURN QUERY
    SELECT
      a.code::VARCHAR,
      a.name::VARCHAR,
      a.icon::VARCHAR,
      'super_admin'::VARCHAR
    FROM public.areas a
    WHERE a.is_active = true
    ORDER BY a.display_order;
    RETURN;
  END IF;

  -- Check if user has overrides
  SELECT override_mode INTO v_override_mode
  FROM public.user_area_overrides
  WHERE user_id = p_user_id;

  IF v_override_mode = 'custom' THEN
    -- Custom mode: Only user's granted areas
    RETURN QUERY
    SELECT
      a.code::VARCHAR,
      a.name::VARCHAR,
      a.icon::VARCHAR,
      'custom'::VARCHAR
    FROM public.areas a
    INNER JOIN public.user_area_access uaa ON a.id = uaa.area_id
    WHERE uaa.user_id = p_user_id
      AND uaa.access_type = 'grant'
      AND a.is_active = true
    ORDER BY a.display_order;

  ELSIF v_override_mode = 'tweak' THEN
    -- Tweak mode: Role defaults + grants - revokes
    RETURN QUERY
    SELECT
      a.code::VARCHAR,
      a.name::VARCHAR,
      a.icon::VARCHAR,
      CASE
        WHEN uaa.access_type = 'grant' THEN 'granted'
        ELSE 'role_default'
      END::VARCHAR
    FROM public.areas a
    LEFT JOIN public.role_area_templates rat ON a.id = rat.area_id AND rat.role_name = v_role
    LEFT JOIN public.user_area_access uaa ON a.id = uaa.area_id AND uaa.user_id = p_user_id
    WHERE a.is_active = true
      AND (
        -- Has role default and not revoked
        (rat.id IS NOT NULL AND (uaa.access_type IS NULL OR uaa.access_type != 'revoke'))
        OR
        -- Or has explicit grant
        uaa.access_type = 'grant'
      )
    ORDER BY a.display_order;

  ELSE
    -- No overrides: Use role defaults
    RETURN QUERY
    SELECT
      a.code::VARCHAR,
      a.name::VARCHAR,
      a.icon::VARCHAR,
      'role_default'::VARCHAR
    FROM public.areas a
    INNER JOIN public.role_area_templates rat ON a.id = rat.area_id
    WHERE rat.role_name = v_role
      AND a.is_active = true
    ORDER BY a.display_order;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to specific area
CREATE OR REPLACE FUNCTION public.user_has_area_access(p_user_id UUID, p_area_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.get_user_areas(p_user_id) ua
    WHERE ua.area_code = p_area_code
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to route (matches route patterns)
CREATE OR REPLACE FUNCTION public.user_has_route_access(p_user_id UUID, p_pathname VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
  v_has_access BOOLEAN := false;
BEGIN
  -- Get user role
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  -- Super Admin has access to everything
  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Check if pathname matches any accessible sub-module
  SELECT EXISTS(
    SELECT 1
    FROM public.get_user_areas(p_user_id) ua
    INNER JOIN public.areas a ON ua.area_code = a.code
    INNER JOIN public.sub_modules sm ON a.id = sm.area_id
    WHERE sm.is_active = true
      AND (
        -- Exact match
        p_pathname = REPLACE(sm.route_pattern, '*', '')
        OR
        -- Wildcard match (route starts with pattern minus *)
        (sm.route_pattern LIKE '%*' AND p_pathname LIKE REPLACE(sm.route_pattern, '*', '') || '%')
      )
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all areas with their sub-modules (for admin UI)
CREATE OR REPLACE FUNCTION public.get_all_areas_with_submodules()
RETURNS TABLE (
  area_id UUID,
  area_code VARCHAR,
  area_name VARCHAR,
  area_icon VARCHAR,
  area_display_order INT,
  submodule_id UUID,
  submodule_code VARCHAR,
  submodule_name VARCHAR,
  submodule_route VARCHAR,
  submodule_display_order INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.code::VARCHAR,
    a.name::VARCHAR,
    a.icon::VARCHAR,
    a.display_order,
    sm.id,
    sm.code::VARCHAR,
    sm.name::VARCHAR,
    sm.route_pattern::VARCHAR,
    sm.display_order
  FROM public.areas a
  LEFT JOIN public.sub_modules sm ON a.id = sm.area_id AND sm.is_active = true
  WHERE a.is_active = true
  ORDER BY a.display_order, sm.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get role area templates (for admin UI)
CREATE OR REPLACE FUNCTION public.get_role_area_templates(p_role_name VARCHAR)
RETURNS TABLE (
  area_code VARCHAR,
  area_name VARCHAR,
  include_all_submodules BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.code::VARCHAR,
    a.name::VARCHAR,
    rat.include_all_submodules
  FROM public.role_area_templates rat
  INNER JOIN public.areas a ON rat.area_id = a.id
  WHERE rat.role_name = p_role_name
    AND a.is_active = true
  ORDER BY a.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 14. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_area_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_submodule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_area_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_area_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_submodule_access ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view areas and sub-modules
CREATE POLICY "Authenticated users can view areas"
  ON public.areas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view sub-modules"
  ON public.sub_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view role templates"
  ON public.role_area_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view role submodule templates"
  ON public.role_submodule_templates FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own overrides
CREATE POLICY "Users can view own area overrides"
  ON public.user_area_overrides FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own area access"
  ON public.user_area_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own submodule access"
  ON public.user_submodule_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super Admin and Admin can manage everything
CREATE POLICY "Super Admin can manage areas"
  ON public.areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Super Admin can manage sub-modules"
  ON public.sub_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Only Super Admin can manage role templates
CREATE POLICY "Super Admin can manage role templates"
  ON public.role_area_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can manage role submodule templates"
  ON public.role_submodule_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super Admin can manage user overrides
CREATE POLICY "Super Admin can manage user area overrides"
  ON public.user_area_overrides FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can manage user area access"
  ON public.user_area_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super Admin can manage user submodule access"
  ON public.user_submodule_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- =============================================
-- 15. TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_role_area_templates_updated_at
  BEFORE UPDATE ON public.role_area_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_area_overrides_updated_at
  BEFORE UPDATE ON public.user_area_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 16. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.areas IS 'Controllable functional areas in the application';
COMMENT ON TABLE public.sub_modules IS 'Sub-modules within each area for granular access control';
COMMENT ON TABLE public.role_area_templates IS 'Default area assignments per role (configurable by Super Admin)';
COMMENT ON TABLE public.role_submodule_templates IS 'Specific sub-module assignments when not all sub-modules are included';
COMMENT ON TABLE public.user_area_overrides IS 'User-specific override mode (tweak or custom)';
COMMENT ON TABLE public.user_area_access IS 'User-specific area grants or revokes';
COMMENT ON TABLE public.user_submodule_access IS 'User-specific sub-module grants or revokes';

COMMENT ON FUNCTION public.is_super_admin IS 'Check if user has Super Admin role';
COMMENT ON FUNCTION public.get_user_areas IS 'Get all areas accessible to a user (combining role defaults and overrides)';
COMMENT ON FUNCTION public.user_has_area_access IS 'Check if user has access to a specific area';
COMMENT ON FUNCTION public.user_has_route_access IS 'Check if user can access a specific route';
COMMENT ON FUNCTION public.get_all_areas_with_submodules IS 'Get all areas with their sub-modules for admin UI';
COMMENT ON FUNCTION public.get_role_area_templates IS 'Get area templates for a specific role';

-- =============================================
-- 17. VERIFICATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.verify_area_access_setup()
RETURNS TABLE (
  component VARCHAR,
  count BIGINT,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Areas'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'ERROR' END::VARCHAR
  FROM public.areas
  UNION ALL
  SELECT 'Sub-modules'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 40 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.sub_modules
  UNION ALL
  SELECT 'Role Templates'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 20 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_area_templates
  UNION ALL
  SELECT 'New Roles'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 9 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.roles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.verify_area_access_setup IS 'Verify that area access system is properly configured';

-- Run verification (uncomment to see results)
-- SELECT * FROM public.verify_area_access_setup();
