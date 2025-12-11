-- Add order_id to invoices table for direct order association
-- Migration: 20251211000000_add_order_id_to_invoices.sql

-- Add order_id column to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL;

-- Create index for order lookups
CREATE INDEX IF NOT EXISTS idx_invoices_order_id
ON public.invoices(order_id)
WHERE order_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.invoices.order_id IS 'Optional reference to the order this invoice is for';
