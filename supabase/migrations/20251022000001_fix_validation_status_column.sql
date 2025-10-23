-- =============================================
-- Fix validation_status column naming
-- The code uses 'validation_status' but the previous migration
-- created 'verification_status'. This adds validation_status.
-- =============================================

-- Add validation_status column (the one the code expects)
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'unverified'
    CHECK (validation_status IN ('verified', 'partial', 'failed', 'unverified', 'pending'));

-- Copy data from verification_status if it exists
UPDATE public.properties 
SET validation_status = verification_status 
WHERE verification_status IS NOT NULL 
  AND validation_status IS NULL;

-- Create index for validation_status
CREATE INDEX IF NOT EXISTS idx_properties_validation_status 
  ON public.properties(validation_status);

-- Create index for filtering verified properties by validation_status
CREATE INDEX IF NOT EXISTS idx_properties_validated 
  ON public.properties(org_id, validation_status) 
  WHERE validation_status = 'verified';

-- Add comment
COMMENT ON COLUMN public.properties.validation_status IS 'Address validation status: verified (high confidence), partial (medium confidence), failed (invalid), unverified (not checked), pending (in progress)';

