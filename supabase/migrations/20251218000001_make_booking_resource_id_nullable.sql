-- Make resource_id nullable in bookings table
-- This allows scheduling inspections without immediately assigning a resource
-- Resources can be assigned later through the field services interface

ALTER TABLE public.bookings
ALTER COLUMN resource_id DROP NOT NULL;

-- Add comment explaining the nullable resource_id
COMMENT ON COLUMN public.bookings.resource_id IS
'Reference to the assigned bookable resource. Nullable to allow scheduling inspections before resource assignment. Admin can assign resources later through field services interface.';
