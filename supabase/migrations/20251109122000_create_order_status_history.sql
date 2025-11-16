-- Create order_status_history table for tracking all status changes
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view status history for orders they have access to
CREATE POLICY "Users can view order status history"
  ON public.order_status_history FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
      OR id IN (SELECT order_id FROM public.borrower_order_access WHERE borrower_id = auth.uid())
    )
  );

-- Policy: Users can insert status changes for their tenant's orders
CREATE POLICY "Users can insert status history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_order_status_history_order ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON public.order_status_history(created_at DESC);

-- Comment for documentation
COMMENT ON TABLE public.order_status_history IS 'Tracks all status changes for orders with audit trail';
