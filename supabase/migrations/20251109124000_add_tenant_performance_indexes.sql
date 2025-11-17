-- =============================================
-- Performance Indexes for Multi-Tenant Queries
-- These indexes are CRITICAL for production performance
-- =============================================

-- 1. Profiles table - for RLS policy optimization
CREATE INDEX IF NOT EXISTS idx_profiles_id_tenant
  ON public.profiles(id, tenant_id);

COMMENT ON INDEX idx_profiles_id_tenant IS
  'Critical for RLS policy performance - prevents N+1 queries';

-- 2. Orders table - tenant dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status
  ON public.orders(tenant_id, status)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_created
  ON public.orders(tenant_id, created_at DESC)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_due
  ON public.orders(tenant_id, due_date)
  WHERE tenant_id IS NOT NULL AND due_date IS NOT NULL;

-- 3. Clients table - client listing queries
CREATE INDEX IF NOT EXISTS idx_clients_tenant_active
  ON public.clients(tenant_id, is_active)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_tenant_name
  ON public.clients(tenant_id, company_name)
  WHERE tenant_id IS NOT NULL;

-- 4. Properties table - property listing queries
CREATE INDEX IF NOT EXISTS idx_properties_tenant_type
  ON public.properties(tenant_id, property_type)
  WHERE tenant_id IS NOT NULL;

-- 5. Borrower access - expiration checks
CREATE INDEX IF NOT EXISTS idx_borrower_access_expires
  ON public.borrower_order_access(borrower_id, expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_borrower_access_active
  ON public.borrower_order_access(borrower_id, order_id)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Performance comments
COMMENT ON INDEX idx_orders_tenant_status IS
  'Optimizes tenant dashboard - order listing by status';

COMMENT ON INDEX idx_orders_tenant_created IS
  'Optimizes tenant dashboard - recent orders view';

COMMENT ON INDEX idx_borrower_access_expires IS
  'Optimizes borrower access validation with expiration';
