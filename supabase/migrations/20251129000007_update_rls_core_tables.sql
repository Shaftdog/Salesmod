-- =============================================
-- Phase 3.4: Update RLS Policies - Core Tables
-- Updates RLS policies to use tenant_id-based isolation
--
-- Tables: clients, orders, properties, contacts
-- (Note: These tables already have some RLS policies, we're updating them)
-- =============================================

-- =============================================
-- CLIENTS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clients for their org" ON public.clients;
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;
DROP POLICY IF EXISTS clients_tenant_isolation ON public.clients;

-- Create unified tenant-based policy
CREATE POLICY clients_tenant_isolation
  ON public.clients
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY clients_tenant_isolation ON public.clients IS
  'Allow all operations on clients within user''s tenant';

-- =============================================
-- ORDERS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view orders for their org" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update orders" ON public.orders;
DROP POLICY IF EXISTS "Users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Borrowers can view their orders" ON public.orders;
DROP POLICY IF EXISTS orders_tenant_isolation ON public.orders;
DROP POLICY IF EXISTS orders_borrower_access ON public.orders;

-- Create tenant-based policy
CREATE POLICY orders_tenant_isolation
  ON public.orders
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- Create borrower access policy (separate from tenant isolation)
CREATE POLICY orders_borrower_access
  ON public.orders
  FOR SELECT
  USING (
    id IN (
      SELECT order_id
      FROM public.borrower_order_access
      WHERE borrower_id = auth.uid()
    )
  );

COMMENT ON POLICY orders_tenant_isolation ON public.orders IS
  'Allow all operations on orders within user''s tenant';
COMMENT ON POLICY orders_borrower_access ON public.orders IS
  'Allow borrowers to view orders they have been granted access to';

-- =============================================
-- PROPERTIES TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view properties for their org" ON public.properties;
DROP POLICY IF EXISTS "Users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete properties" ON public.properties;
DROP POLICY IF EXISTS properties_tenant_isolation ON public.properties;

-- Create tenant-based policy
CREATE POLICY properties_tenant_isolation
  ON public.properties
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY properties_tenant_isolation ON public.properties IS
  'Allow all operations on properties within user''s tenant';

-- =============================================
-- CONTACTS TABLE
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view contacts for their org" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS contacts_tenant_isolation ON public.contacts;

-- Create tenant-based policy
CREATE POLICY contacts_tenant_isolation
  ON public.contacts
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY contacts_tenant_isolation ON public.contacts IS
  'Allow all operations on contacts within user''s tenant';

-- =============================================
-- ENSURE RLS IS ENABLED
-- =============================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_policy_record RECORD;
  v_table_name TEXT;
  v_tables TEXT[] := ARRAY['clients', 'orders', 'properties', 'contacts'];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CORE TABLES RLS UPDATE SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  FOREACH v_table_name IN ARRAY v_tables LOOP
    RAISE NOTICE 'Table: %', v_table_name;

    FOR v_policy_record IN
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table_name
      ORDER BY policyname
    LOOP
      RAISE NOTICE '  - Policy: % (%)', v_policy_record.policyname, v_policy_record.cmd;
    END LOOP;

    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- ROLLBACK INSTRUCTIONS
-- =============================================

/*
To rollback this migration (restore org_id-based policies):

-- Clients
DROP POLICY IF EXISTS clients_tenant_isolation ON public.clients;
CREATE POLICY "Users can view clients for their org"
  ON public.clients FOR SELECT
  USING (org_id = auth.uid());

-- Orders
DROP POLICY IF EXISTS orders_tenant_isolation ON public.orders;
DROP POLICY IF EXISTS orders_borrower_access ON public.orders;
CREATE POLICY "Users can view orders for their org"
  ON public.orders FOR SELECT
  USING (org_id = auth.uid());

-- Properties
DROP POLICY IF EXISTS properties_tenant_isolation ON public.properties;
CREATE POLICY "Users can view properties for their org"
  ON public.properties FOR SELECT
  USING (org_id = auth.uid());

-- Contacts
DROP POLICY IF EXISTS contacts_tenant_isolation ON public.contacts;
CREATE POLICY "Users can view contacts for their org"
  ON public.contacts FOR SELECT
  USING (org_id = auth.uid());
*/
