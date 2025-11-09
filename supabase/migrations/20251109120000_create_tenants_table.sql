-- =============================================
-- Client Portal: Multi-Tenant Foundation
-- Creates tenants table with RLS policies
-- Since there are NO existing users, this is a clean start!
-- =============================================

-- =============================================
-- 1. Create Tenants Table
-- =============================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'lender',
    'investor',
    'amc',
    'attorney',
    'accountant',
    'borrower',
    'internal'
  )),
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,

  -- Theme settings for white-label (AMC feature)
  theme_settings JSONB DEFAULT '{
    "primaryColor": "#3b82f6",
    "logo": null,
    "companyName": null
  }'::jsonb,

  -- SLA settings for custom turnaround times
  sla_settings JSONB DEFAULT '{
    "standard_turnaround_days": 7,
    "rush_turnaround_days": 3,
    "notification_before_due_hours": 24
  }'::jsonb,

  -- General settings
  settings JSONB DEFAULT '{
    "notifications": true,
    "allowBorrowerAccess": true
  }'::jsonb,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. Add tenant_id to profiles
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id),
  ADD COLUMN IF NOT EXISTS tenant_type TEXT;

-- =============================================
-- 3. Indexes for Performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_tenants_owner
  ON public.tenants(owner_id);

CREATE INDEX IF NOT EXISTS idx_tenants_type
  ON public.tenants(type) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_profiles_tenant
  ON public.profiles(tenant_id) WHERE tenant_id IS NOT NULL;

-- =============================================
-- 4. Enable RLS
-- =============================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS Policies for Tenants
-- =============================================

-- Users can view their own tenant
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR owner_id = auth.uid()
  );

-- NOTE: INSERT policy NOT needed - tenant creation happens via service-role
-- in the registration API route using executeAsAdmin()

-- Admins (tenant owners) can update their tenant
CREATE POLICY "Tenant owners can update their tenant"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- =============================================
-- 6. Update Profiles RLS to Support Tenants
-- =============================================

-- Drop old policy if exists
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- New policy: Users can view their own profile AND profiles in their tenant
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() -- Own profile
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) -- Team members
  );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =============================================
-- 7. Add Tenant Support to Existing Tables
-- =============================================

-- Add tenant_id to clients (for multi-user orgs)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

CREATE INDEX IF NOT EXISTS idx_clients_tenant
  ON public.clients(tenant_id) WHERE tenant_id IS NOT NULL;

-- Add tenant_id to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

CREATE INDEX IF NOT EXISTS idx_orders_tenant
  ON public.orders(tenant_id) WHERE tenant_id IS NOT NULL;

-- Add tenant_id to properties
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

CREATE INDEX IF NOT EXISTS idx_properties_tenant
  ON public.properties(tenant_id) WHERE tenant_id IS NOT NULL;

-- =============================================
-- 8. Update RLS Policies to Support Tenants
-- =============================================

-- Clients: Support both org_id (old single-user) and tenant_id (new multi-user)
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

CREATE POLICY "Users can view their clients"
  ON public.clients FOR SELECT
  USING (
    org_id = auth.uid() -- Own clients (backward compatible)
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) -- Team clients
  );

CREATE POLICY "Users can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their clients"
  ON public.clients FOR UPDATE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their clients"
  ON public.clients FOR DELETE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Orders: Support both org_id and tenant_id
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;

CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their orders"
  ON public.orders FOR UPDATE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their orders"
  ON public.orders FOR DELETE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Properties: Support both org_id and tenant_id
DROP POLICY IF EXISTS "Authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can manage properties" ON public.properties;

CREATE POLICY "Users can view their properties"
  ON public.properties FOR SELECT
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their properties"
  ON public.properties FOR UPDATE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their properties"
  ON public.properties FOR DELETE
  USING (
    org_id = auth.uid()
    OR
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- =============================================
-- 9. Triggers
-- =============================================

-- Auto-update updated_at on tenants
CREATE OR REPLACE FUNCTION public.update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_updated_at();

-- =============================================
-- 10. Comments
-- =============================================

COMMENT ON TABLE public.tenants IS
  'Multi-tenant organizations. Each tenant represents a company/organization using the system.';

COMMENT ON COLUMN public.tenants.type IS
  'Type of organization: lender, investor, amc, attorney, accountant, borrower, internal';

COMMENT ON COLUMN public.tenants.owner_id IS
  'User who created/owns this tenant (primary admin)';

COMMENT ON COLUMN public.tenants.theme_settings IS
  'White-label theme configuration for AMC portals (logo, colors, company name)';

COMMENT ON COLUMN public.tenants.sla_settings IS
  'Custom SLA configuration (turnaround times, notification timing)';

COMMENT ON COLUMN public.profiles.tenant_id IS
  'Organization this user belongs to (enables team collaboration)';
