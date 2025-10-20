-- =============================================
-- Property Units System - Fee Simple Units Support
-- Adds property_units table for condos, co-ops, townhouses with normalized deduplication
-- =============================================

-- =============================================
-- 1. Create property_units table
-- =============================================

CREATE TABLE IF NOT EXISTS public.property_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_identifier TEXT NOT NULL, -- User-facing: "Apt 2B", "305", "Unit A"
  unit_norm TEXT, -- Normalized key for dedupe: "2B", "305", "A"
  unit_type TEXT, -- 'condo', 'apartment', 'townhouse', 'office', etc.
  props JSONB DEFAULT '{}'::jsonb, -- bed/bath, sqft, owner, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique on normalized unit (prevents "Apt 2B" vs "#2b" duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS uq_property_units_building_unit 
  ON public.property_units(property_id, unit_norm);

CREATE INDEX IF NOT EXISTS idx_property_units_property 
  ON public.property_units(property_id);

CREATE INDEX IF NOT EXISTS idx_property_units_props 
  ON public.property_units USING gin(props);

CREATE INDEX IF NOT EXISTS idx_property_units_identifier_upper 
  ON public.property_units(UPPER(unit_identifier));

-- =============================================
-- 2. Add property_unit_id to orders
-- =============================================

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS property_unit_id UUID REFERENCES public.property_units(id);

CREATE INDEX IF NOT EXISTS idx_orders_property_unit_id 
  ON public.orders(property_unit_id);

-- =============================================
-- 3. Row Level Security (RLS)
-- =============================================

ALTER TABLE public.property_units ENABLE ROW LEVEL SECURITY;

-- SELECT: view units for properties in your org
DROP POLICY IF EXISTS "units_select_same_org" ON public.property_units;
CREATE POLICY "units_select_same_org" ON public.property_units FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_id AND p.org_id = auth.uid()
  ));

-- INSERT: create units only for your org's properties
DROP POLICY IF EXISTS "units_insert_same_org" ON public.property_units;
CREATE POLICY "units_insert_same_org" ON public.property_units FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_id AND p.org_id = auth.uid()
  ));

-- UPDATE: modify units only in your org
DROP POLICY IF EXISTS "units_update_same_org" ON public.property_units;
CREATE POLICY "units_update_same_org" ON public.property_units FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_id AND p.org_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_id AND p.org_id = auth.uid()
  ));

-- DELETE: remove units only in your org
DROP POLICY IF EXISTS "units_delete_same_org" ON public.property_units;
CREATE POLICY "units_delete_same_org" ON public.property_units FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.properties p 
    WHERE p.id = property_id AND p.org_id = auth.uid()
  ));

-- =============================================
-- 4. Triggers
-- =============================================

-- Auto-update updated_at (matches properties, orders pattern)
DROP TRIGGER IF EXISTS property_units_updated_at ON public.property_units;
CREATE TRIGGER property_units_updated_at
  BEFORE UPDATE ON public.property_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 5. USPAP Compliance Functions
-- =============================================

-- Unit-level prior work count
CREATE OR REPLACE FUNCTION public.property_unit_prior_work_count(_property_unit_id UUID)
RETURNS INTEGER 
LANGUAGE SQL 
STABLE AS $$
  SELECT COUNT(*)::INTEGER FROM public.orders
  WHERE property_unit_id = _property_unit_id
    AND completed_date IS NOT NULL
    AND completed_date >= (NOW() - INTERVAL '3 years');
$$;

-- Building-level prior work count (explicit function)
CREATE OR REPLACE FUNCTION public.property_building_prior_work_count(_property_id UUID)
RETURNS INTEGER 
LANGUAGE SQL 
STABLE AS $$
  SELECT COUNT(*)::INTEGER FROM public.orders
  WHERE property_id = _property_id
    AND completed_date IS NOT NULL
    AND completed_date >= (NOW() - INTERVAL '3 years');
$$;

-- View for unit prior work (useful for reports/analytics)
CREATE OR REPLACE VIEW public.property_unit_prior_work_3y AS
SELECT 
  pu.id as property_unit_id,
  pu.property_id,
  pu.unit_identifier,
  o.id as order_id,
  o.order_number,
  o.completed_date,
  o.status,
  o.fee_amount
FROM public.property_units pu
JOIN public.orders o ON o.property_unit_id = pu.id
WHERE o.completed_date IS NOT NULL
  AND o.completed_date >= (NOW() - INTERVAL '3 years');

-- =============================================
-- 6. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.property_units IS 'Unit-level records for fee simple properties (condos, co-ops, townhouses) with normalized deduplication';
COMMENT ON COLUMN public.property_units.unit_identifier IS 'User-facing unit label as entered: "Apt 2B", "Unit 305", etc.';
COMMENT ON COLUMN public.property_units.unit_norm IS 'Normalized key for deduplication: removes prefixes, special chars, whitespace';
COMMENT ON COLUMN public.property_units.props IS 'Flexible storage for bed/bath count, square footage, owner info, etc.';
COMMENT ON FUNCTION public.property_unit_prior_work_count IS 'Returns count of completed orders for a specific unit in the last 3 years (USPAP compliance)';
COMMENT ON FUNCTION public.property_building_prior_work_count IS 'Returns count of completed orders for an entire building in the last 3 years (USPAP compliance)';
COMMENT ON VIEW public.property_unit_prior_work_3y IS 'Units with their completed orders in the last 3 years (USPAP compliance)';


