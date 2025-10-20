-- =============================================
-- Properties System - Building-Level Properties with USPAP Compliance
-- Creates canonical properties table, links orders, adds USPAP helpers
-- =============================================

-- =============================================
-- 1. Properties Table (Building-Level)
-- =============================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  property_type TEXT NOT NULL DEFAULT 'single_family' CHECK (property_type IN ('single_family', 'condo', 'multi_family', 'commercial', 'land', 'manufactured')),
  apn TEXT, -- assessor parcel number
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  gla NUMERIC, -- gross living area
  lot_size NUMERIC,
  year_built INT,
  addr_hash TEXT NOT NULL, -- normalized key: STREET|CITY|STATE|ZIP5 (NO UNIT)
  props JSONB DEFAULT '{}'::jsonb,
  search TSVECTOR, -- full-text search vector
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_state_format CHECK (state ~ '^[A-Z]{2}$'),
  CONSTRAINT chk_postal_format CHECK (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  CONSTRAINT chk_latitude CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
  CONSTRAINT chk_longitude CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180))
);

-- =============================================
-- 2. Indexes for Performance
-- =============================================

-- Unique constraint: one property per normalized address per org
CREATE UNIQUE INDEX IF NOT EXISTS uq_properties_org_addrhash 
  ON public.properties(org_id, addr_hash);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_properties_org 
  ON public.properties(org_id);

CREATE INDEX IF NOT EXISTS idx_properties_city_state_zip 
  ON public.properties(city, state, postal_code);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_search 
  ON public.properties USING gin(search);

-- =============================================
-- 3. Link Orders to Properties
-- =============================================

-- Add property_id column to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id);

-- Index for property lookups
CREATE INDEX IF NOT EXISTS idx_orders_property_id 
  ON public.orders(property_id);

-- =============================================
-- 4. USPAP Compliance Helpers
-- =============================================

-- View: Properties with their prior work in last 3 years
CREATE OR REPLACE VIEW public.property_prior_work_3y AS
SELECT 
  p.id as property_id,
  o.id as order_id,
  o.completed_date,
  o.status,
  o.fee_amount,
  o.order_number
FROM public.properties p
JOIN public.orders o ON o.property_id = p.id
WHERE o.completed_date IS NOT NULL
  AND o.completed_date >= (NOW() - INTERVAL '3 years');

-- Function: Count prior work for a property in last 3 years
CREATE OR REPLACE FUNCTION public.property_prior_work_count(_property_id UUID)
RETURNS INTEGER 
LANGUAGE SQL 
STABLE AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.orders
  WHERE property_id = _property_id
    AND completed_date IS NOT NULL
    AND completed_date >= (NOW() - INTERVAL '3 years');
$$;

-- =============================================
-- 5. Triggers for Auto-Update
-- =============================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION public.update_property_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search := 
    setweight(to_tsvector('english', COALESCE(NEW.address_line1, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.address_line2, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.postal_code, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search vector
DROP TRIGGER IF EXISTS properties_search_update ON public.properties;
CREATE TRIGGER properties_search_update
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_search();

-- Trigger for updated_at
DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 6. Row Level Security (RLS)
-- =============================================

-- Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Users can view properties for their org
CREATE POLICY "Users can view properties for their org"
  ON public.properties FOR SELECT
  TO authenticated
  USING (org_id = auth.uid());

-- Users can insert properties for their org
CREATE POLICY "Users can insert properties for their org"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (org_id = auth.uid());

-- Users can update properties for their org
CREATE POLICY "Users can update properties for their org"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (org_id = auth.uid())
  WITH CHECK (org_id = auth.uid());

-- Users can delete properties for their org
CREATE POLICY "Users can delete properties for their org"
  ON public.properties FOR DELETE
  TO authenticated
  USING (org_id = auth.uid());

-- =============================================
-- 7. Backfill Existing Orders (Optional SQL Script)
-- =============================================

-- Emergency backfill script (run in Supabase SQL editor if API unavailable)
-- Prefer /api/admin/properties/backfill for production use
/*
-- This script backfills properties from existing orders
-- Run with caution in production - use the API endpoint instead

DO $$
DECLARE
  order_record RECORD;
  property_id_val UUID;
  addr_hash_val TEXT;
  street_no_unit TEXT;
  unit_val TEXT;
BEGIN
  -- Loop through orders without property_id but with complete address
  FOR order_record IN 
    SELECT id, org_id, property_address, property_city, property_state, property_zip, property_type
    FROM public.orders 
    WHERE property_id IS NULL 
      AND property_address IS NOT NULL 
      AND property_city IS NOT NULL 
      AND property_state IS NOT NULL 
      AND property_zip IS NOT NULL
  LOOP
    -- Extract unit from address (basic regex)
    IF order_record.property_address ~* '\s+(apt|unit|ste|suite|#)\s+[a-z0-9\-]+$' THEN
      street_no_unit := regexp_replace(order_record.property_address, '\s+(apt|unit|ste|suite|#)\s+[a-z0-9\-]+$', '', 'i');
      unit_val := regexp_replace(order_record.property_address, '.*\s+(apt|unit|ste|suite|#)\s+([a-z0-9\-]+)$', '\2', 'i');
    ELSE
      street_no_unit := order_record.property_address;
      unit_val := NULL;
    END IF;
    
    -- Create normalized address hash (STREET|CITY|STATE|ZIP5)
    addr_hash_val := UPPER(TRIM(street_no_unit)) || '|' || 
                     UPPER(TRIM(order_record.property_city)) || '|' || 
                     UPPER(TRIM(order_record.property_state)) || '|' || 
                     SUBSTRING(order_record.property_zip, 1, 5);
    
    -- Upsert property
    INSERT INTO public.properties (
      org_id, address_line1, city, state, postal_code, property_type, addr_hash
    ) VALUES (
      order_record.org_id,
      street_no_unit,
      order_record.property_city,
      UPPER(order_record.property_state),
      SUBSTRING(order_record.property_zip, 1, 5),
      COALESCE(order_record.property_type, 'single_family'),
      addr_hash_val
    )
    ON CONFLICT (org_id, addr_hash) 
    DO UPDATE SET updated_at = NOW()
    RETURNING id INTO property_id_val;
    
    -- Update order with property_id
    UPDATE public.orders 
    SET property_id = property_id_val,
        props = COALESCE(props, '{}'::jsonb) || 
                CASE WHEN unit_val IS NOT NULL 
                     THEN jsonb_build_object('unit', unit_val)
                     ELSE '{}'::jsonb
                END
    WHERE id = order_record.id;
    
  END LOOP;
END $$;
*/

-- =============================================
-- 8. Comments for Documentation
-- =============================================

COMMENT ON TABLE public.properties IS 'Canonical building-level properties table with USPAP compliance support';
COMMENT ON COLUMN public.properties.addr_hash IS 'Normalized address key for deduplication: STREET|CITY|STATE|ZIP5 (excludes unit)';
COMMENT ON COLUMN public.properties.search IS 'Full-text search vector for address fields';
COMMENT ON VIEW public.property_prior_work_3y IS 'Properties with their completed orders in the last 3 years (USPAP compliance)';
COMMENT ON FUNCTION public.property_prior_work_count IS 'Returns count of completed orders for a property in the last 3 years';

