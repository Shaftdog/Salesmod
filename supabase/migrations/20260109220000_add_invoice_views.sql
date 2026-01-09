-- ==============================================
-- INVOICE VIEWS - Track who views invoices
-- Captures IP, user agent, and timestamp for each view
-- ==============================================

-- Create invoice_views table
CREATE TABLE IF NOT EXISTS public.invoice_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,

  -- View details
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Parsed user agent info
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,

  -- Location (from IP, if available)
  city TEXT,
  region TEXT,
  country TEXT,

  -- Was this an internal view (from logged-in user)?
  is_internal BOOLEAN DEFAULT false,
  viewer_user_id UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_invoice_views_invoice_id ON public.invoice_views(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_views_tenant_id ON public.invoice_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_views_viewed_at ON public.invoice_views(viewed_at DESC);

-- Enable RLS
ALTER TABLE public.invoice_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view invoice views in their tenant"
  ON public.invoice_views FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Public can insert invoice views"
  ON public.invoice_views FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.invoice_views IS
  'Tracks each time an invoice is viewed, including IP address and user agent for analytics';

COMMENT ON COLUMN public.invoice_views.is_internal IS
  'True if the view was from a logged-in user (internal), false if from public invoice link';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
