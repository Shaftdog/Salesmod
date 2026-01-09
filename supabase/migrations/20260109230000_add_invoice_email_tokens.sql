-- ==============================================
-- INVOICE EMAIL TOKENS - Track unique links per recipient
-- Enables tracking which email recipient clicked the view link
-- ==============================================

-- Create invoice_email_tokens table
CREATE TABLE IF NOT EXISTS public.invoice_email_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,

  -- Unique token for this recipient's link
  token TEXT NOT NULL UNIQUE,

  -- Recipient info
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_role TEXT, -- 'borrower', 'cc', 'orderer', etc.

  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  first_viewed_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoice_email_tokens_invoice_id ON public.invoice_email_tokens(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_email_tokens_tenant_id ON public.invoice_email_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_email_tokens_token ON public.invoice_email_tokens(token);

-- Enable RLS
ALTER TABLE public.invoice_email_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view email tokens in their tenant"
  ON public.invoice_email_tokens FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert email tokens in their tenant"
  ON public.invoice_email_tokens FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update email tokens in their tenant"
  ON public.invoice_email_tokens FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Add email_token_id to invoice_views to link views to specific recipients
ALTER TABLE public.invoice_views
ADD COLUMN IF NOT EXISTS email_token_id UUID REFERENCES public.invoice_email_tokens(id);

-- Comments for documentation
COMMENT ON TABLE public.invoice_email_tokens IS
  'Stores unique tracking tokens for each invoice email recipient, enabling per-recipient view tracking';

COMMENT ON COLUMN public.invoice_email_tokens.token IS
  'Unique token included in the view link for this specific recipient';

COMMENT ON COLUMN public.invoice_email_tokens.recipient_role IS
  'Role of the recipient: borrower, cc, orderer, loan_officer, etc.';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
