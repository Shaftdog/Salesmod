-- ==============================================
-- ORDER CONTACTS - Link multiple contacts to orders
-- Captures all people associated with an order (orderer, CC'd, loan officer, etc.)
-- ==============================================

-- Create order_contacts junction table
CREATE TABLE IF NOT EXISTS public.order_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,

  -- Role of this contact on the order
  role TEXT NOT NULL DEFAULT 'cc',
  -- Common roles: 'orderer', 'cc', 'loan_officer', 'processor', 'borrower', 'realtor', 'title_company'

  -- Optional notes about this contact's involvement
  notes TEXT,

  -- Whether this contact should receive order updates
  notify_on_updates BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate contact-order associations
  UNIQUE(order_id, contact_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_order_contacts_order_id ON public.order_contacts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_contacts_contact_id ON public.order_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_order_contacts_tenant_id ON public.order_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_contacts_role ON public.order_contacts(role);

-- Enable RLS
ALTER TABLE public.order_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view order contacts in their tenant"
  ON public.order_contacts FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert order contacts in their tenant"
  ON public.order_contacts FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update order contacts in their tenant"
  ON public.order_contacts FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete order contacts in their tenant"
  ON public.order_contacts FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Comments for documentation
COMMENT ON TABLE public.order_contacts IS
  'Junction table linking contacts to orders. Captures all people associated with an order (orderer, CC recipients, loan officers, etc.)';

COMMENT ON COLUMN public.order_contacts.role IS
  'Role of this contact on the order: orderer, cc, loan_officer, processor, borrower, realtor, title_company, etc.';

COMMENT ON COLUMN public.order_contacts.notify_on_updates IS
  'Whether this contact should receive email notifications when order status changes';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================
