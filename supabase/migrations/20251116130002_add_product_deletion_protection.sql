-- Add Product Deletion Protection
-- Prevent deletion of products that are referenced in orders/invoices
-- Use soft delete pattern with deleted_at timestamp

-- Add deleted_at column for soft delete
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for non-deleted products (improves query performance)
CREATE INDEX IF NOT EXISTS idx_products_not_deleted ON public.products(org_id, is_active) WHERE deleted_at IS NULL;

-- Create function to soft delete a product
CREATE OR REPLACE FUNCTION public.soft_delete_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.products
  SET
    deleted_at = NOW(),
    is_active = false,
    updated_at = NOW()
  WHERE id = p_product_id
    AND deleted_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore a soft-deleted product
CREATE OR REPLACE FUNCTION public.restore_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.products
  SET
    deleted_at = NULL,
    updated_at = NOW()
  WHERE id = p_product_id
    AND deleted_at IS NOT NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent hard deletion of products
CREATE OR REPLACE FUNCTION public.prevent_product_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of deleting, soft delete
  UPDATE public.products
  SET
    deleted_at = NOW(),
    is_active = false,
    updated_at = NOW()
  WHERE id = OLD.id;

  -- Prevent the actual deletion
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_prevent_product_hard_delete ON public.products;
CREATE TRIGGER trigger_prevent_product_hard_delete
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_product_hard_delete();

-- Update RLS policies to exclude soft-deleted products
DROP POLICY IF EXISTS "Users can view their org's products" ON public.products;
CREATE POLICY "Users can view their org's products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id AND deleted_at IS NULL);

-- Update price calculation functions to check deleted_at
CREATE OR REPLACE FUNCTION public.calculate_product_price(
  p_product_id UUID,
  p_square_footage INTEGER
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  v_product RECORD;
  v_base_price DECIMAL(12,2);
  v_additional_sqft INTEGER;
  v_additional_charge DECIMAL(12,2);
  v_total_price DECIMAL(12,2);
BEGIN
  -- Get product details
  SELECT
    base_price,
    sf_threshold,
    price_per_sf,
    requires_sf_calculation,
    is_active,
    deleted_at
  INTO v_product
  FROM public.products
  WHERE id = p_product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Check if product is deleted
  IF v_product.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Product has been deleted: %', p_product_id;
  END IF;

  -- Check if product is active
  IF NOT v_product.is_active THEN
    RAISE EXCEPTION 'Product is inactive: %', p_product_id;
  END IF;

  -- If product doesn't require square footage calculation, return base price
  IF NOT v_product.requires_sf_calculation THEN
    RETURN v_product.base_price;
  END IF;

  -- Validate square footage input
  IF p_square_footage IS NULL OR p_square_footage <= 0 THEN
    RAISE EXCEPTION 'Invalid square footage: %', p_square_footage;
  END IF;

  -- Calculate price based on square footage
  v_base_price := v_product.base_price;

  IF p_square_footage <= v_product.sf_threshold THEN
    -- Property is at or below threshold, use base price only
    v_total_price := v_base_price;
  ELSE
    -- Property exceeds threshold, add overage charge
    v_additional_sqft := p_square_footage - v_product.sf_threshold;
    v_additional_charge := v_additional_sqft * v_product.price_per_sf;
    v_total_price := v_base_price + v_additional_charge;
  END IF;

  -- Round to 2 decimal places (cents)
  RETURN ROUND(v_total_price, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- Update price breakdown function to check deleted_at
CREATE OR REPLACE FUNCTION public.get_product_price_breakdown(
  p_product_id UUID,
  p_square_footage INTEGER
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  base_price DECIMAL(12,2),
  square_footage INTEGER,
  sf_threshold INTEGER,
  additional_sqft INTEGER,
  price_per_sf DECIMAL(10,4),
  additional_charge DECIMAL(12,2),
  total_price DECIMAL(12,2),
  calculation_applied BOOLEAN
) AS $$
DECLARE
  v_product RECORD;
  v_additional_sqft INTEGER;
  v_additional_charge DECIMAL(12,2);
  v_total_price DECIMAL(12,2);
BEGIN
  -- Get product details
  SELECT
    p.id,
    p.name,
    p.base_price,
    p.sf_threshold,
    p.price_per_sf,
    p.requires_sf_calculation,
    p.is_active,
    p.deleted_at
  INTO v_product
  FROM public.products p
  WHERE p.id = p_product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Check if product is deleted
  IF v_product.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Product has been deleted: %', p_product_id;
  END IF;

  -- Initialize values
  v_additional_sqft := 0;
  v_additional_charge := 0;
  v_total_price := v_product.base_price;

  -- Calculate if SF calculation is required
  IF v_product.requires_sf_calculation AND p_square_footage > v_product.sf_threshold THEN
    v_additional_sqft := p_square_footage - v_product.sf_threshold;
    v_additional_charge := v_additional_sqft * v_product.price_per_sf;
    v_total_price := v_product.base_price + v_additional_charge;
  END IF;

  -- Return the breakdown
  RETURN QUERY SELECT
    v_product.id,
    v_product.name,
    v_product.base_price,
    p_square_footage,
    v_product.sf_threshold,
    v_additional_sqft,
    v_product.price_per_sf,
    ROUND(v_additional_charge, 2),
    ROUND(v_total_price, 2),
    v_product.requires_sf_calculation;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments
COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete timestamp - products are never hard deleted to preserve historical data';
COMMENT ON FUNCTION public.soft_delete_product IS 'Soft deletes a product by setting deleted_at timestamp';
COMMENT ON FUNCTION public.restore_product IS 'Restores a soft-deleted product by clearing deleted_at timestamp';
COMMENT ON FUNCTION public.prevent_product_hard_delete IS 'Trigger function that prevents hard deletion by converting to soft delete';
