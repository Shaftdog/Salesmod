-- =====================================================
-- Migration: Add Products Integration to Invoices
-- Date: 2025-11-16
-- Description: Add product_id and square_footage to invoice line items
-- =====================================================

-- Add product_id column to invoice_line_items
ALTER TABLE public.invoice_line_items
ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add square_footage column for products that require SF calculation
ALTER TABLE public.invoice_line_items
ADD COLUMN square_footage INTEGER;

-- Create index for faster product lookups
CREATE INDEX idx_invoice_line_items_product_id ON public.invoice_line_items(product_id);

-- Add comments
COMMENT ON COLUMN public.invoice_line_items.product_id IS 'Reference to the product catalog item (optional for custom line items)';
COMMENT ON COLUMN public.invoice_line_items.square_footage IS 'Square footage for products that require SF-based pricing';

-- Note: product_id is nullable to support:
-- 1. Legacy invoices created before this migration
-- 2. Custom line items (discounts, manual entries)
-- 3. Flexibility for special cases
