-- Fix Products RLS Policies
-- Simplify policies to use direct auth.uid() = org_id check (matching clients pattern)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their org's products" ON public.products;
DROP POLICY IF EXISTS "Users can create products for their org" ON public.products;
DROP POLICY IF EXISTS "Users can update their org's products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their org's products" ON public.products;

-- Recreate with simplified, correct policies
CREATE POLICY "Users can view their org's products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can create products for their org"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = org_id);

CREATE POLICY "Users can update their org's products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (auth.uid() = org_id);

CREATE POLICY "Users can delete their org's products"
  ON public.products FOR DELETE
  TO authenticated
  USING (auth.uid() = org_id);

COMMENT ON POLICY "Users can view their org's products" ON public.products IS 'Allow users to view products owned by their organization';
COMMENT ON POLICY "Users can create products for their org" ON public.products IS 'Allow users to create products for their organization';
COMMENT ON POLICY "Users can update their org's products" ON public.products IS 'Allow users to update products owned by their organization';
COMMENT ON POLICY "Users can delete their org's products" ON public.products IS 'Allow users to delete products owned by their organization';
