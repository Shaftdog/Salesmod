-- =============================================
-- Add Foreign Key Constraints for Tenant System
-- Prevents orphaned records and ensures data integrity
-- =============================================

-- 1. Tenants table - prevent orphaned tenants
ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_owner_id_fkey;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 2. Profiles table - allow tenant deletion to null out references
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 3. Clients table - prevent tenant deletion with active clients
ALTER TABLE public.clients
  ADD CONSTRAINT fk_clients_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- 4. Orders table - prevent tenant deletion with active orders
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- 5. Properties table - prevent tenant deletion with properties
ALTER TABLE public.properties
  ADD CONSTRAINT fk_properties_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;

-- 6. Order status history - null out changed_by on user deletion
ALTER TABLE public.order_status_history
  DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey;

ALTER TABLE public.order_status_history
  ADD CONSTRAINT order_status_history_changed_by_fkey
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Comments
COMMENT ON CONSTRAINT tenants_owner_id_fkey ON public.tenants IS
  'Prevents orphaned tenants by restricting profile deletion';

COMMENT ON CONSTRAINT fk_profiles_tenant ON public.profiles IS
  'Allows tenant deletion to set profile.tenant_id to NULL';

COMMENT ON CONSTRAINT fk_clients_tenant ON public.clients IS
  'Prevents tenant deletion if clients exist - must cleanup first';

COMMENT ON CONSTRAINT fk_orders_tenant ON public.orders IS
  'Prevents tenant deletion if orders exist - must cleanup first';

COMMENT ON CONSTRAINT fk_properties_tenant ON public.properties IS
  'Prevents tenant deletion if properties exist - must cleanup first';
