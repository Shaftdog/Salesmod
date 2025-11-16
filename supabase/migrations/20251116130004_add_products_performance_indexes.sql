-- Add Performance Indexes for Products
-- Optimize common query patterns

-- =====================================================
-- Composite Indexes for Common Query Patterns
-- =====================================================

-- Most common query: Get active, non-deleted products for an org, sorted
CREATE INDEX IF NOT EXISTS idx_products_org_active_sorted
  ON public.products(org_id, is_active, sort_order)
  WHERE deleted_at IS NULL;

-- Category filtering with active status
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON public.products(category, is_active)
  WHERE deleted_at IS NULL;

-- SKU lookup and uniqueness (case-insensitive)
-- Using LOWER() for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_org_sku
  ON public.products(org_id, LOWER(sku))
  WHERE sku IS NOT NULL AND deleted_at IS NULL;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON INDEX idx_products_org_active_sorted IS 'Optimizes the most common query pattern: listing active products by sort order';
COMMENT ON INDEX idx_products_category_active IS 'Optimizes category filtering with active status';
COMMENT ON INDEX idx_products_org_sku IS 'Ensures SKU uniqueness per org (case-insensitive) and speeds up SKU lookups';
