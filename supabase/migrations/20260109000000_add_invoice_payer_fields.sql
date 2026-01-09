-- ==============================================
-- ADD PAYER FIELDS TO INVOICES
-- Supports separate "Ordered By" (client) and "Bill To" (payer) on invoices
-- Common in appraisal workflows where borrower pays but order is from lender
-- ==============================================

-- Add payer fields to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payer_name TEXT,
  ADD COLUMN IF NOT EXISTS payer_company TEXT,
  ADD COLUMN IF NOT EXISTS payer_email TEXT,
  ADD COLUMN IF NOT EXISTS payer_phone TEXT,
  ADD COLUMN IF NOT EXISTS payer_address TEXT;

-- Add index for payer email lookups
CREATE INDEX IF NOT EXISTS idx_invoices_payer_email
  ON public.invoices(payer_email)
  WHERE payer_email IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.invoices.payer_name IS
  'Name of the person/entity paying the invoice (e.g., borrower). When set, displayed as "Bill To" while client shows as "Ordered By".';

COMMENT ON COLUMN public.invoices.payer_company IS
  'Company name of the payer (e.g., borrower''s LLC). Displayed in Bill To section.';

COMMENT ON COLUMN public.invoices.payer_email IS
  'Email address of the payer. Invoice emails can be sent here instead of client email.';

COMMENT ON COLUMN public.invoices.payer_phone IS
  'Phone number of the payer for contact purposes.';

COMMENT ON COLUMN public.invoices.payer_address IS
  'Billing address of the payer for invoice display.';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
