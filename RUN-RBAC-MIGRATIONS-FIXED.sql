-- =============================================
-- CONSOLIDATED RBAC MIGRATIONS (FIXED ORDER)
-- Run this file in Supabase or via pg
-- =============================================

-- =============================================
-- STEP 1: Add Role Column to Profiles FIRST
-- (Before any RLS policies reference it)
-- =============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_role_created ON public.profiles(role, created_at DESC);

-- =============================================
-- STEP 2: Create RBAC Tables
-- =============================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Indexes for RBAC tables
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_name_lower ON public.roles(lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_permissions_name_lower ON public.permissions(lower(name));
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON public.permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);

-- =============================================
-- STEP 3: Create Audit Logs Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON public.audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_date ON public.audit_logs(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes ON public.audit_logs USING gin(changes);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING gin(metadata);

-- =============================================
-- STEP 4: Create Helper Functions
-- =============================================

-- RBAC Functions
CREATE OR REPLACE FUNCTION public.get_role_permissions(role_name VARCHAR)
RETURNS TABLE (
  permission_name VARCHAR,
  permission_description TEXT,
  resource VARCHAR,
  action VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name::VARCHAR,
    p.description,
    p.resource::VARCHAR,
    p.action::VARCHAR
  FROM public.permissions p
  INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.role_has_permission(
  role_name VARCHAR,
  permission_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.permissions p
    INNER JOIN public.role_permissions rp ON p.id = rp.permission_id
    INNER JOIN public.roles r ON rp.role_id = r.id
    WHERE r.name = role_name
      AND p.name = permission_name
  ) INTO has_perm;

  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profile/User Functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, role_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_role BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = user_id AND role = role_name) INTO has_role;
  RETURN has_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_has_role(role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_role(auth.uid(), role_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_has_permission(user_id UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.role_has_permission(user_role, permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_has_permission(permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.user_has_permission(auth.uid(), permission_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit Log Functions
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
  SELECT email, role INTO v_user_email, v_user_role FROM public.profiles WHERE id = p_user_id;
  
  INSERT INTO public.audit_logs (
    user_id, user_email, user_role, action, resource_type, resource_id,
    changes, metadata, ip_address, user_agent, status, error_message
  ) VALUES (
    p_user_id, v_user_email, v_user_role, p_action, p_resource_type, p_resource_id,
    p_changes, p_metadata, p_ip_address, p_user_agent, p_status, p_error_message
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  SELECT al.id, al.user_email, al.user_role, al.action, al.changes, al.metadata, al.status, al.created_at
  FROM public.audit_logs al
  WHERE al.resource_type = p_resource_type AND al.resource_id = p_resource_id
  ORDER BY al.created_at DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  SELECT al.id, al.action, al.resource_type, al.resource_id, al.changes, al.metadata, al.status, al.created_at
  FROM public.audit_logs al
  WHERE al.user_id = p_user_id
  ORDER BY al.created_at DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_logs WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Functions
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
  v_action VARCHAR(100);
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'user.create';
    v_changes := jsonb_build_object('new', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'user.update';
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'user.delete';
    v_changes := jsonb_build_object('old', to_jsonb(OLD));
  END IF;

  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.id != auth.uid()) THEN
    PERFORM public.create_audit_log(
      auth.uid(), v_action, 'user', COALESCE(NEW.id, OLD.id),
      v_changes, NULL, NULL, NULL, 'success', NULL
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 5: Create Triggers
-- =============================================

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();

-- =============================================
-- STEP 6: Enable RLS and Create Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Roles table policies
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Permissions table policies
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Role permissions table policies
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Profiles table policies (updated with role awareness)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR
      EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Audit logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- STEP 7: Seed Default Roles & Permissions
-- =============================================

-- Insert Default Roles
INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Full system access - can manage users, settings, and all resources'),
  ('manager', 'Can manage orders, properties, and clients but cannot manage users or system settings'),
  ('user', 'Standard user - can view and manage their own assigned work')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW();

-- Insert Default Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_users', 'Create, edit, and delete user accounts', 'users', 'manage'),
  ('view_users', 'View user accounts and profiles', 'users', 'read'),
  ('assign_roles', 'Change user roles and permissions', 'users', 'assign_role'),
  ('impersonate_users', 'View the app as another user (for support)', 'users', 'impersonate'),
  ('manage_orders', 'Full order management (create, edit, delete, assign)', 'orders', 'manage'),
  ('create_orders', 'Create new orders', 'orders', 'create'),
  ('edit_orders', 'Edit existing orders', 'orders', 'update'),
  ('delete_orders', 'Delete orders', 'orders', 'delete'),
  ('view_orders', 'View orders', 'orders', 'read'),
  ('assign_orders', 'Assign orders to appraisers', 'orders', 'assign'),
  ('manage_properties', 'Full property management', 'properties', 'manage'),
  ('create_properties', 'Create new properties', 'properties', 'create'),
  ('edit_properties', 'Edit property details', 'properties', 'update'),
  ('delete_properties', 'Delete properties', 'properties', 'delete'),
  ('view_properties', 'View property information', 'properties', 'read'),
  ('manage_clients', 'Full client management', 'clients', 'manage'),
  ('create_clients', 'Create new clients', 'clients', 'create'),
  ('edit_clients', 'Edit client information', 'clients', 'update'),
  ('delete_clients', 'Delete clients', 'clients', 'delete'),
  ('view_clients', 'View client information', 'clients', 'read'),
  ('view_analytics', 'Access analytics dashboard and reports', 'analytics', 'read'),
  ('export_data', 'Export data to CSV/Excel', 'analytics', 'export'),
  ('view_reports', 'View system reports', 'reports', 'read'),
  ('view_audit_logs', 'View system audit logs', 'audit_logs', 'read'),
  ('export_audit_logs', 'Export audit logs for compliance', 'audit_logs', 'export'),
  ('manage_settings', 'Edit system settings and configuration', 'settings', 'manage'),
  ('view_settings', 'View system settings', 'settings', 'read'),
  ('manage_integrations', 'Configure third-party integrations', 'integrations', 'manage'),
  ('manage_agents', 'Configure AI agents and automation', 'agents', 'manage'),
  ('view_agents', 'View AI agent runs and results', 'agents', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Helper function for assigning permissions
CREATE OR REPLACE FUNCTION assign_permission_to_role(role_name VARCHAR, permission_name VARCHAR)
RETURNS VOID AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  SELECT id INTO v_role_id FROM public.roles WHERE name = role_name;
  SELECT id INTO v_permission_id FROM public.permissions WHERE name = permission_name;
  
  IF v_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Assign permissions to Admin role
SELECT assign_permission_to_role('admin', 'manage_users');
SELECT assign_permission_to_role('admin', 'view_users');
SELECT assign_permission_to_role('admin', 'assign_roles');
SELECT assign_permission_to_role('admin', 'impersonate_users');
SELECT assign_permission_to_role('admin', 'manage_orders');
SELECT assign_permission_to_role('admin', 'manage_properties');
SELECT assign_permission_to_role('admin', 'manage_clients');
SELECT assign_permission_to_role('admin', 'view_analytics');
SELECT assign_permission_to_role('admin', 'export_data');
SELECT assign_permission_to_role('admin', 'view_reports');
SELECT assign_permission_to_role('admin', 'view_audit_logs');
SELECT assign_permission_to_role('admin', 'export_audit_logs');
SELECT assign_permission_to_role('admin', 'manage_settings');
SELECT assign_permission_to_role('admin', 'manage_integrations');
SELECT assign_permission_to_role('admin', 'manage_agents');

-- Assign permissions to Manager role
SELECT assign_permission_to_role('manager', 'view_users');
SELECT assign_permission_to_role('manager', 'manage_orders');
SELECT assign_permission_to_role('manager', 'manage_properties');
SELECT assign_permission_to_role('manager', 'manage_clients');
SELECT assign_permission_to_role('manager', 'view_analytics');
SELECT assign_permission_to_role('manager', 'export_data');
SELECT assign_permission_to_role('manager', 'view_reports');
SELECT assign_permission_to_role('manager', 'view_settings');
SELECT assign_permission_to_role('manager', 'view_agents');

-- Assign permissions to User role
SELECT assign_permission_to_role('user', 'view_orders');
SELECT assign_permission_to_role('user', 'edit_orders');
SELECT assign_permission_to_role('user', 'view_properties');
SELECT assign_permission_to_role('user', 'edit_properties');
SELECT assign_permission_to_role('user', 'view_clients');

-- Add constraint to profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'user'));

-- Drop temporary helper function
DROP FUNCTION IF EXISTS assign_permission_to_role(VARCHAR, VARCHAR);

-- Verification function
CREATE OR REPLACE FUNCTION public.verify_rbac_setup()
RETURNS TABLE (component VARCHAR, count BIGINT, status VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Roles'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'ERROR' END::VARCHAR
  FROM public.roles
  UNION ALL
  SELECT 'Permissions'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 20 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.permissions
  UNION ALL
  SELECT 'Admin Permissions'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'admin'
  UNION ALL
  SELECT 'Manager Permissions'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'manager'
  UNION ALL
  SELECT 'User Permissions'::VARCHAR, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STEP 8: Run Verification
-- =============================================

SELECT * FROM public.verify_rbac_setup();

