-- =============================================
-- Add view token to invoices for public viewing
-- =============================================

-- Add view_token column to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS view_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_invoices_view_token
  ON public.invoices(view_token)
  WHERE view_token IS NOT NULL;

-- Function to generate a secure view token
CREATE OR REPLACE FUNCTION generate_invoice_view_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to mark invoice as viewed (called from public API)
CREATE OR REPLACE FUNCTION public.mark_invoice_viewed(p_view_token TEXT)
RETURNS TABLE(
  id UUID,
  invoice_number TEXT,
  status TEXT,
  total_amount NUMERIC,
  amount_due NUMERIC,
  due_date DATE,
  client_name TEXT,
  client_email TEXT,
  line_items JSONB,
  company_name TEXT,
  notes TEXT,
  terms_and_conditions TEXT,
  payment_method TEXT
) AS $$
DECLARE
  v_invoice_id UUID;
  v_current_status TEXT;
BEGIN
  -- Find the invoice by view token
  SELECT inv.id, inv.status INTO v_invoice_id, v_current_status
  FROM public.invoices inv
  WHERE inv.view_token = p_view_token;

  IF v_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Invoice not found';
  END IF;

  -- Update view tracking
  UPDATE public.invoices inv
  SET
    view_count = COALESCE(view_count, 0) + 1,
    first_viewed_at = COALESCE(first_viewed_at, NOW()),
    last_viewed_at = NOW(),
    viewed_at = COALESCE(viewed_at, NOW()),
    -- Only change status from 'sent' to 'viewed'
    status = CASE
      WHEN v_current_status = 'sent' THEN 'viewed'
      ELSE v_current_status
    END,
    updated_at = NOW()
  WHERE inv.id = v_invoice_id;

  -- Return invoice details for display
  RETURN QUERY
  SELECT
    inv.id,
    inv.invoice_number,
    inv.status,
    inv.total_amount,
    inv.amount_due,
    inv.due_date,
    c.company_name AS client_name,
    c.email AS client_email,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'description', li.description,
          'quantity', li.quantity,
          'unit_price', li.unit_price,
          'amount', li.amount,
          'tax_rate', li.tax_rate
        )
      )
      FROM public.invoice_line_items li
      WHERE li.invoice_id = inv.id
    ) AS line_items,
    p.company_name AS company_name,
    inv.notes,
    inv.terms_and_conditions,
    inv.payment_method
  FROM public.invoices inv
  LEFT JOIN public.clients c ON c.id = inv.client_id
  LEFT JOIN public.profiles p ON p.id = inv.org_id
  WHERE inv.id = v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon role (for public access)
GRANT EXECUTE ON FUNCTION public.mark_invoice_viewed(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_invoice_viewed(TEXT) TO authenticated;

COMMENT ON COLUMN public.invoices.view_token IS 'Unique token for public invoice viewing without authentication';
COMMENT ON COLUMN public.invoices.view_count IS 'Number of times the invoice has been viewed';
COMMENT ON COLUMN public.invoices.first_viewed_at IS 'Timestamp of first view';
COMMENT ON COLUMN public.invoices.last_viewed_at IS 'Timestamp of most recent view';
