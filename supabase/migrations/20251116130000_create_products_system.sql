-- Create Products System for Sales Module
-- Supports residential appraisal products with square footage pricing

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Product Information
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT, -- Optional SKU/product code

  -- Product Category
  -- 'core' = Core Residential Appraisals (Field Inspection, Desktop, Full Appraisal, etc.)
  -- 'addition' = Add-ons to core appraisals (Addition - 3000+ SF, Addition - Acreage, etc.)
  -- 'specialized' = Standalone residential products (Appraisal Update, Operating Income Statement, etc.)
  -- 'other' = Discounts, Sales, or misc items
  category TEXT NOT NULL DEFAULT 'core',

  -- Pricing Configuration
  base_price DECIMAL(12,2) NOT NULL CHECK (base_price >= 0),
  requires_sf_calculation BOOLEAN DEFAULT false,
  sf_threshold INTEGER DEFAULT 3000 CHECK (sf_threshold > 0),
  price_per_sf DECIMAL(10,4) DEFAULT 0.10 CHECK (price_per_sf >= 0),

  -- Status and Display
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Additional Properties (JSONB for flexibility)
  props JSONB DEFAULT '{}'::jsonb,

  -- Audit Fields
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_product_name_per_org UNIQUE (org_id, name),
  CONSTRAINT valid_category CHECK (category IN ('core', 'addition', 'specialized', 'other'))
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_products_org_id ON public.products(org_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_sort_order ON public.products(sort_order);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PRICE CALCULATION FUNCTION
-- =====================================================
-- Calculates the final price for a product based on square footage
-- Returns the total price including base price + any SF overage charges
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
    is_active
  INTO v_product
  FROM public.products
  WHERE id = p_product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
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

-- =====================================================
-- PRICE BREAKDOWN FUNCTION (for transparency)
-- =====================================================
-- Returns a detailed breakdown of the price calculation
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
    p.is_active
  INTO v_product
  FROM public.products p
  WHERE p.id = p_product_id;

  -- Check if product exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their org's products
CREATE POLICY "Users can view their org's products"
  ON public.products FOR SELECT
  TO authenticated
  USING (org_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

-- Policy: Users can create products for their org
CREATE POLICY "Users can create products for their org"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

-- Policy: Users can update their org's products
CREATE POLICY "Users can update their org's products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (org_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

-- Policy: Users can delete their org's products
CREATE POLICY "Users can delete their org's products"
  ON public.products FOR DELETE
  TO authenticated
  USING (org_id IN (
    SELECT id FROM public.profiles WHERE id = auth.uid()
  ));

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.products IS 'Product catalog for appraisal services with square footage pricing support';
COMMENT ON COLUMN public.products.category IS 'Product type: core (main appraisals), addition (add-ons), specialized (standalone), other (misc)';
COMMENT ON COLUMN public.products.requires_sf_calculation IS 'Whether this product uses square footage pricing (base + overage)';
COMMENT ON COLUMN public.products.sf_threshold IS 'Square footage threshold (default 3000 SF) - overage charged above this';
COMMENT ON COLUMN public.products.price_per_sf IS 'Price per square foot for SF above threshold (default $0.10)';
COMMENT ON FUNCTION public.calculate_product_price IS 'Calculates final product price based on square footage';
COMMENT ON FUNCTION public.get_product_price_breakdown IS 'Returns detailed price calculation breakdown for transparency';
