-- =============================================
-- Billing Contact Feature - Database Migration
-- Adds billing contact reference and confirmation flag to clients table
-- =============================================

-- Add billing_contact_id column (references contacts table)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS billing_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Add billing_email_confirmed flag (when true, uses client.email for invoices)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS billing_email_confirmed BOOLEAN DEFAULT false;

-- Index for faster lookups on billing contact
CREATE INDEX IF NOT EXISTS idx_clients_billing_contact_id
ON public.clients(billing_contact_id)
WHERE billing_contact_id IS NOT NULL;

-- Constraint: billing_contact must belong to the same client
-- This prevents assigning a contact from another client
CREATE OR REPLACE FUNCTION public.validate_billing_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- If billing_contact_id is set, verify it belongs to this client
  IF NEW.billing_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contacts
      WHERE id = NEW.billing_contact_id
      AND client_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Billing contact must belong to this client';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_billing_contact_trigger ON public.clients;

CREATE TRIGGER validate_billing_contact_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_billing_contact();

-- Add comments for documentation
COMMENT ON COLUMN public.clients.billing_contact_id IS 'Reference to contact who receives invoices. If NULL, check billing_email_confirmed flag.';
COMMENT ON COLUMN public.clients.billing_email_confirmed IS 'When true, client.email is used as billing email. Required if billing_contact_id is NULL for sending invoices.';
