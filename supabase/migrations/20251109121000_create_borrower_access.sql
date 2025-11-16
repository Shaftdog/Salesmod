-- Create borrower_order_access table for granting borrowers access to specific orders
CREATE TABLE IF NOT EXISTS public.borrower_order_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one access record per borrower-order pair
  UNIQUE(borrower_id, order_id)
);

-- Enable RLS
ALTER TABLE public.borrower_order_access ENABLE ROW LEVEL SECURITY;

-- Policy: Borrowers can view their own access grants
CREATE POLICY "Borrowers can view own access"
  ON public.borrower_order_access FOR SELECT
  USING (borrower_id = auth.uid());

-- Policy: Lenders can grant access to their orders
CREATE POLICY "Lenders can grant access"
  ON public.borrower_order_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.profiles p ON p.tenant_id = o.tenant_id
      WHERE o.id = order_id AND p.id = auth.uid()
    )
  );

-- Policy: Lenders can revoke access from their orders
CREATE POLICY "Lenders can revoke access"
  ON public.borrower_order_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      INNER JOIN public.profiles p ON p.tenant_id = o.tenant_id
      WHERE o.id = order_id AND p.id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_borrower_order_access_borrower ON public.borrower_order_access(borrower_id);
CREATE INDEX idx_borrower_order_access_order ON public.borrower_order_access(order_id);

-- Update orders table RLS to allow borrowers to view orders they have access to
DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;

CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  USING (
    -- Tenant members can view their org's orders
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    OR
    -- Borrowers can view orders they have access to
    id IN (SELECT order_id FROM public.borrower_order_access WHERE borrower_id = auth.uid())
  );

-- Comment for documentation
COMMENT ON TABLE public.borrower_order_access IS 'Grants borrowers access to specific appraisal orders via magic link';
COMMENT ON COLUMN public.borrower_order_access.expires_at IS 'Optional expiration date for access (NULL = no expiration)';
