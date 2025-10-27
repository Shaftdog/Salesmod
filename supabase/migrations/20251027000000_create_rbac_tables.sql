-- =============================================
-- Admin Panel: Role-Based Access Control (RBAC)
-- Phase 1: Core RBAC Tables
--
-- NOTE: This migration was originally timestamped 20251025000000
-- but was renamed to 20251027000000 to avoid conflict with
-- 20251025000000_add_client_type_field.sql
-- The migration was already applied to production on Oct 26, 2025
-- =============================================

-- =============================================
-- 1. ROLES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PERMISSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- e.g., 'users', 'orders', 'properties', 'settings'
  action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete', 'manage'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. ROLE-PERMISSION JUNCTION TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- =============================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================

-- Unique constraint on role name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_name_lower
  ON public.roles(lower(name));

-- Unique constraint on permission name (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_permissions_name_lower
  ON public.permissions(lower(name));

-- Index for finding permissions by resource
CREATE INDEX IF NOT EXISTS idx_permissions_resource
  ON public.permissions(resource);

-- Index for finding permissions by action
CREATE INDEX IF NOT EXISTS idx_permissions_action
  ON public.permissions(action);

-- Indexes for role_permissions junction table
CREATE INDEX IF NOT EXISTS idx_role_permissions_role
  ON public.role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission
  ON public.role_permissions(permission_id);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to get all permissions for a role
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

-- Function to check if a role has a specific permission
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

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on permissions table
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read roles and permissions
CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view permissions"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view role permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage roles and permissions
CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage permissions"
  ON public.permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 7. TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp on roles
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.roles IS 'System roles for role-based access control (RBAC)';
COMMENT ON TABLE public.permissions IS 'System permissions that can be assigned to roles';
COMMENT ON TABLE public.role_permissions IS 'Junction table mapping roles to permissions';

COMMENT ON FUNCTION public.get_role_permissions IS 'Returns all permissions for a given role';
COMMENT ON FUNCTION public.role_has_permission IS 'Checks if a role has a specific permission';
