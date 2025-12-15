-- =============================================
-- ORDERS <-> TERRITORIES CONNECTION
-- Links orders to service territories for logistics routing
-- =============================================

-- Add territory_id foreign key to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES public.service_territories(id) ON DELETE SET NULL;

-- Add index for territory lookups
CREATE INDEX IF NOT EXISTS idx_orders_territory_id
  ON public.orders(territory_id)
  WHERE territory_id IS NOT NULL;

-- Add comment explaining the relationship
COMMENT ON COLUMN public.orders.territory_id IS 'Service territory that covers this order''s property location. Auto-matched based on property zip code, city, or geographic boundaries.';

-- =============================================
-- FUNCTION: Auto-match territory based on order location
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_match_order_territory()
RETURNS TRIGGER AS $$
DECLARE
  matched_territory_id UUID;
BEGIN
  -- Only auto-match if territory_id is NULL and we have property location data
  IF NEW.territory_id IS NULL AND NEW.property_zip IS NOT NULL THEN

    -- Try to find matching territory by zip code (most specific)
    SELECT id INTO matched_territory_id
    FROM public.service_territories
    WHERE
      org_id = NEW.org_id
      AND is_active = true
      AND NEW.property_zip = ANY(zip_codes)
    LIMIT 1;

    -- If no zip match, try city match
    IF matched_territory_id IS NULL AND NEW.property_city IS NOT NULL THEN
      SELECT id INTO matched_territory_id
      FROM public.service_territories
      WHERE
        org_id = NEW.org_id
        AND is_active = true
        AND NEW.property_city ILIKE ANY(cities)
      LIMIT 1;
    END IF;

    -- Set the matched territory
    IF matched_territory_id IS NOT NULL THEN
      NEW.territory_id = matched_territory_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Auto-match territory on insert/update
-- =============================================
DROP TRIGGER IF EXISTS trigger_auto_match_order_territory ON public.orders;
CREATE TRIGGER trigger_auto_match_order_territory
  BEFORE INSERT OR UPDATE OF property_address, property_city, property_state, property_zip
  ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_order_territory();

-- =============================================
-- FUNCTION: Sync territory changes to related bookings
-- =============================================
CREATE OR REPLACE FUNCTION public.sync_order_territory_to_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- When order's territory changes, update all related bookings
  IF NEW.territory_id IS DISTINCT FROM OLD.territory_id THEN
    UPDATE public.bookings
    SET
      territory_id = NEW.territory_id,
      updated_at = NOW()
    WHERE order_id = NEW.id
      AND territory_id IS DISTINCT FROM NEW.territory_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Sync territory to bookings on order update
-- =============================================
DROP TRIGGER IF EXISTS trigger_sync_order_territory_to_bookings ON public.orders;
CREATE TRIGGER trigger_sync_order_territory_to_bookings
  AFTER UPDATE OF territory_id
  ON public.orders
  FOR EACH ROW
  WHEN (NEW.territory_id IS DISTINCT FROM OLD.territory_id)
  EXECUTE FUNCTION public.sync_order_territory_to_bookings();

-- =============================================
-- Backfill existing orders with territories
-- =============================================
-- This will run once to populate territory_id for existing orders
UPDATE public.orders o
SET territory_id = (
  SELECT st.id
  FROM public.service_territories st
  WHERE
    st.org_id = o.org_id
    AND st.is_active = true
    AND (
      -- Match by zip code
      o.property_zip = ANY(st.zip_codes)
      -- Or match by city
      OR o.property_city ILIKE ANY(st.cities)
    )
  ORDER BY
    -- Prefer zip code matches over city matches
    CASE WHEN o.property_zip = ANY(st.zip_codes) THEN 1 ELSE 2 END
  LIMIT 1
)
WHERE o.territory_id IS NULL
  AND o.property_zip IS NOT NULL;
