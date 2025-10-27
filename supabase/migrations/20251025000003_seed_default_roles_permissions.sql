-- =============================================
-- Admin Panel: Seed Default Roles and Permissions
-- Phase 1: Default RBAC Data
-- =============================================

-- =============================================
-- 1. INSERT DEFAULT ROLES
-- =============================================

INSERT INTO public.roles (name, description) VALUES
  ('admin', 'Full system access - can manage users, settings, and all resources'),
  ('manager', 'Can manage orders, properties, and clients but cannot manage users or system settings'),
  ('user', 'Standard user - can view and manage their own assigned work')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = NOW();

-- =============================================
-- 2. INSERT DEFAULT PERMISSIONS
-- =============================================

-- User Management Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_users', 'Create, edit, and delete user accounts', 'users', 'manage'),
  ('view_users', 'View user accounts and profiles', 'users', 'read'),
  ('assign_roles', 'Change user roles and permissions', 'users', 'assign_role'),
  ('impersonate_users', 'View the app as another user (for support)', 'users', 'impersonate')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Order Management Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_orders', 'Full order management (create, edit, delete, assign)', 'orders', 'manage'),
  ('create_orders', 'Create new orders', 'orders', 'create'),
  ('edit_orders', 'Edit existing orders', 'orders', 'update'),
  ('delete_orders', 'Delete orders', 'orders', 'delete'),
  ('view_orders', 'View orders', 'orders', 'read'),
  ('assign_orders', 'Assign orders to appraisers', 'orders', 'assign')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Property Management Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_properties', 'Full property management', 'properties', 'manage'),
  ('create_properties', 'Create new properties', 'properties', 'create'),
  ('edit_properties', 'Edit property details', 'properties', 'update'),
  ('delete_properties', 'Delete properties', 'properties', 'delete'),
  ('view_properties', 'View property information', 'properties', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Client Management Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_clients', 'Full client management', 'clients', 'manage'),
  ('create_clients', 'Create new clients', 'clients', 'create'),
  ('edit_clients', 'Edit client information', 'clients', 'update'),
  ('delete_clients', 'Delete clients', 'clients', 'delete'),
  ('view_clients', 'View client information', 'clients', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Analytics Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('view_analytics', 'Access analytics dashboard and reports', 'analytics', 'read'),
  ('export_data', 'Export data to CSV/Excel', 'analytics', 'export'),
  ('view_reports', 'View system reports', 'reports', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Audit Log Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('view_audit_logs', 'View system audit logs', 'audit_logs', 'read'),
  ('export_audit_logs', 'Export audit logs for compliance', 'audit_logs', 'export')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Settings Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_settings', 'Edit system settings and configuration', 'settings', 'manage'),
  ('view_settings', 'View system settings', 'settings', 'read'),
  ('manage_integrations', 'Configure third-party integrations', 'integrations', 'manage')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- Agent/AI Permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('manage_agents', 'Configure AI agents and automation', 'agents', 'manage'),
  ('view_agents', 'View AI agent runs and results', 'agents', 'read')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  resource = EXCLUDED.resource,
  action = EXCLUDED.action;

-- =============================================
-- 3. ASSIGN PERMISSIONS TO ROLES
-- =============================================

-- Helper function to assign permission to role
CREATE OR REPLACE FUNCTION assign_permission_to_role(role_name VARCHAR, permission_name VARCHAR)
RETURNS VOID AS $$
DECLARE
  v_role_id UUID;
  v_permission_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id FROM public.roles WHERE name = role_name;

  -- Get permission ID
  SELECT id INTO v_permission_id FROM public.permissions WHERE name = permission_name;

  -- Insert if both exist
  IF v_role_id IS NOT NULL AND v_permission_id IS NOT NULL THEN
    INSERT INTO public.role_permissions (role_id, permission_id)
    VALUES (v_role_id, v_permission_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ADMIN ROLE: Full Access to Everything
-- =============================================

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

-- =============================================
-- MANAGER ROLE: Business Operations Management
-- =============================================

SELECT assign_permission_to_role('manager', 'view_users'); -- Can view users but not manage
SELECT assign_permission_to_role('manager', 'manage_orders'); -- Full order management
SELECT assign_permission_to_role('manager', 'manage_properties');
SELECT assign_permission_to_role('manager', 'manage_clients');
SELECT assign_permission_to_role('manager', 'view_analytics');
SELECT assign_permission_to_role('manager', 'export_data');
SELECT assign_permission_to_role('manager', 'view_reports');
SELECT assign_permission_to_role('manager', 'view_settings'); -- Can view but not edit settings
SELECT assign_permission_to_role('manager', 'view_agents');

-- =============================================
-- USER ROLE: Standard User Permissions
-- =============================================

SELECT assign_permission_to_role('user', 'view_orders'); -- Can view their assigned orders
SELECT assign_permission_to_role('user', 'edit_orders'); -- Can edit their orders
SELECT assign_permission_to_role('user', 'view_properties'); -- Can view properties
SELECT assign_permission_to_role('user', 'edit_properties'); -- Can edit properties they're working on
SELECT assign_permission_to_role('user', 'view_clients'); -- Can view client info

-- =============================================
-- 4. ADD FOREIGN KEY CONSTRAINT TO PROFILES
-- =============================================

-- Now that we have default roles, we can add the foreign key constraint
-- Note: We use a CHECK constraint instead of FK to allow flexibility
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'manager', 'user'));

-- =============================================
-- 5. CLEAN UP HELPER FUNCTION
-- =============================================

-- Drop the temporary helper function
DROP FUNCTION IF EXISTS assign_permission_to_role(VARCHAR, VARCHAR);

-- =============================================
-- 6. VERIFY SEEDED DATA
-- =============================================

-- Function to verify RBAC setup
CREATE OR REPLACE FUNCTION public.verify_rbac_setup()
RETURNS TABLE (
  component VARCHAR,
  count BIGINT,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Roles'::VARCHAR,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 3 THEN 'OK' ELSE 'ERROR' END::VARCHAR
  FROM public.roles
  UNION ALL
  SELECT
    'Permissions'::VARCHAR,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 20 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.permissions
  UNION ALL
  SELECT
    'Admin Permissions'::VARCHAR,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 15 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'admin'
  UNION ALL
  SELECT
    'Manager Permissions'::VARCHAR,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'manager'
  UNION ALL
  SELECT
    'User Permissions'::VARCHAR,
    COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 4 THEN 'OK' ELSE 'WARNING' END::VARCHAR
  FROM public.role_permissions rp
  INNER JOIN public.roles r ON rp.role_id = r.id
  WHERE r.name = 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 7. COMMENTS
-- =============================================

COMMENT ON FUNCTION public.verify_rbac_setup IS 'Verifies that RBAC system is properly seeded with roles and permissions';

-- =============================================
-- Run verification
-- =============================================

-- Uncomment to see verification results:
-- SELECT * FROM public.verify_rbac_setup();
