-- Fix Products Security Issues
-- Address asymmetric RLS policies and SECURITY DEFINER function vulnerabilities

-- =====================================================
-- Fix RLS Policies: Add deleted_at check to all policies
-- =====================================================

-- UPDATE policy should exclude deleted products
DROP POLICY IF EXISTS "Users can update their org's products" ON public.products;
CREATE POLICY "Users can update their org's products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id AND deleted_at IS NULL);

-- DELETE policy should exclude deleted products
DROP POLICY IF EXISTS "Users can delete their org's products" ON public.products;
CREATE POLICY "Users can delete their org's products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id AND deleted_at IS NULL);

-- =====================================================
-- Fix SECURITY DEFINER Functions: Add org_id validation
-- =====================================================

-- Fix soft_delete_product to validate org ownership
CREATE OR REPLACE FUNCTION public.soft_delete_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.products
  SET
    deleted_at = NOW(),
    is_active = false,
    updated_at = NOW()
  WHERE id = p_product_id
    AND deleted_at IS NULL
    AND org_id = auth.uid(); -- Security fix: validate org ownership

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix restore_product to validate org ownership
CREATE OR REPLACE FUNCTION public.restore_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.products
  SET
    deleted_at = NULL,
    updated_at = NOW()
  WHERE id = p_product_id
    AND deleted_at IS NOT NULL
    AND org_id = auth.uid(); -- Security fix: validate org ownership

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON POLICY "Users can update their org's products" ON public.products IS 'Users can only update active, non-deleted products they own';
COMMENT ON POLICY "Users can delete their org's products" ON public.products IS 'Users can only delete active, non-deleted products they own (trigger converts to soft delete)';
COMMENT ON FUNCTION public.soft_delete_product IS 'Soft deletes a product - validates org ownership for security';
COMMENT ON FUNCTION public.restore_product IS 'Restores a soft-deleted product - validates org ownership for security';
