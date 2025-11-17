-- =============================================
-- BOOKINGS <-> PROPERTIES CONNECTION
-- Links bookings to properties table for data consistency
-- =============================================

-- Add property_id foreign key to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Add index for property lookups
CREATE INDEX IF NOT EXISTS idx_bookings_property_id
  ON public.bookings(property_id)
  WHERE property_id IS NOT NULL;

-- Add comment explaining the relationship
COMMENT ON COLUMN public.bookings.property_id IS 'Links booking to master property record. When set, property address fields should be populated from the linked property.';

-- =============================================
-- FUNCTION: Auto-populate property address from property_id
-- =============================================
CREATE OR REPLACE FUNCTION public.populate_booking_property_from_link()
RETURNS TRIGGER AS $$
DECLARE
  prop RECORD;
BEGIN
  -- If property_id is set, populate address fields from properties table
  IF NEW.property_id IS NOT NULL THEN
    SELECT
      address_line1 || COALESCE(' ' || address_line2, '') as full_address,
      city,
      state,
      postal_code,
      latitude,
      longitude
    INTO prop
    FROM public.properties
    WHERE id = NEW.property_id;

    IF FOUND THEN
      NEW.property_address = prop.full_address;
      NEW.property_city = prop.city;
      NEW.property_state = prop.state;
      NEW.property_zip = prop.postal_code;

      -- Also update coordinates if available
      IF prop.latitude IS NOT NULL AND prop.longitude IS NOT NULL THEN
        NEW.property_coordinates = point(prop.longitude, prop.latitude);
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Populate property data on insert/update
-- =============================================
DROP TRIGGER IF EXISTS trigger_populate_booking_property ON public.bookings;
CREATE TRIGGER trigger_populate_booking_property
  BEFORE INSERT OR UPDATE OF property_id
  ON public.bookings
  FOR EACH ROW
  WHEN (NEW.property_id IS NOT NULL)
  EXECUTE FUNCTION public.populate_booking_property_from_link();

-- =============================================
-- FUNCTION: Try to match booking to existing property
-- =============================================
CREATE OR REPLACE FUNCTION public.auto_match_booking_property()
RETURNS TRIGGER AS $$
DECLARE
  matched_property_id UUID;
BEGIN
  -- Only auto-match if property_id is NULL and we have address data
  IF NEW.property_id IS NULL AND NEW.property_address IS NOT NULL AND NEW.property_zip IS NOT NULL THEN

    -- Try to find matching property by address hash
    -- Normalize the address for matching
    SELECT id INTO matched_property_id
    FROM public.properties
    WHERE
      org_id = NEW.org_id
      AND postal_code = NEW.property_zip
      AND LOWER(REGEXP_REPLACE(address_line1, '[^a-zA-Z0-9]', '', 'g'))
        = LOWER(REGEXP_REPLACE(NEW.property_address, '[^a-zA-Z0-9]', '', 'g'))
    LIMIT 1;

    -- Set the matched property
    IF matched_property_id IS NOT NULL THEN
      NEW.property_id = matched_property_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Auto-match property on insert/update
-- =============================================
DROP TRIGGER IF EXISTS trigger_auto_match_booking_property ON public.bookings;
CREATE TRIGGER trigger_auto_match_booking_property
  BEFORE INSERT OR UPDATE OF property_address, property_zip
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_booking_property();

-- =============================================
-- Backfill existing bookings with property links
-- =============================================
-- This will run once to link existing bookings to properties where possible
UPDATE public.bookings b
SET property_id = (
  SELECT p.id
  FROM public.properties p
  WHERE
    p.org_id = b.org_id
    AND p.postal_code = b.property_zip
    AND LOWER(REGEXP_REPLACE(p.address_line1, '[^a-zA-Z0-9]', '', 'g'))
      = LOWER(REGEXP_REPLACE(b.property_address, '[^a-zA-Z0-9]', '', 'g'))
  LIMIT 1
)
WHERE b.property_id IS NULL
  AND b.property_address IS NOT NULL
  AND b.property_zip IS NOT NULL;

-- =============================================
-- DEPRECATION NOTE
-- =============================================
-- The property_address, property_city, property_state, property_zip columns
-- will be kept for backward compatibility and as denormalized cache,
-- but property_id should be the source of truth going forward.
-- Future migrations may make these fields nullable once all code is updated.
