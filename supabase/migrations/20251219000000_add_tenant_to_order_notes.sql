-- Migration: Add Tenant Isolation to Order Notes
-- Purpose: Fix multi-tenant security vulnerability in order_notes table
-- Critical: This migration adds tenant_id and proper RLS policies

-- ============================================================================
-- STEP 1: ADD COLUMNS
-- ============================================================================

-- Add tenant_id column (nullable initially for backfill)
ALTER TABLE public.order_notes
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Add note_type column for categorization
ALTER TABLE public.order_notes
  ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'general'
  CHECK (note_type IN ('general', 'phone', 'email', 'meeting', 'issue'));

-- ============================================================================
-- STEP 2: BACKFILL tenant_id FROM ORDERS
-- ============================================================================

-- Populate tenant_id from parent order
UPDATE public.order_notes
SET tenant_id = orders.tenant_id
FROM public.orders
WHERE order_notes.order_id = orders.id
  AND order_notes.tenant_id IS NULL;

-- ============================================================================
-- STEP 3: MAKE tenant_id NOT NULL
-- ============================================================================

-- Only make NOT NULL after backfill completes
ALTER TABLE public.order_notes
  ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================================
-- STEP 4: DROP INSECURE RLS POLICIES
-- ============================================================================

-- These policies allowed any authenticated user to access any note
DROP POLICY IF EXISTS "Order notes are viewable by authenticated users" ON public.order_notes;
DROP POLICY IF EXISTS "Authenticated users can create order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Authenticated users can update order notes" ON public.order_notes;
DROP POLICY IF EXISTS "Authenticated users can delete order notes" ON public.order_notes;

-- ============================================================================
-- STEP 5: CREATE TENANT-ISOLATED RLS POLICIES
-- ============================================================================

-- Single policy for all operations with tenant isolation
CREATE POLICY order_notes_tenant_isolation
  ON public.order_notes
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_order_notes_tenant_id
  ON public.order_notes(tenant_id);

-- Index for note_type filtering (if needed later)
CREATE INDEX IF NOT EXISTS idx_order_notes_note_type
  ON public.order_notes(note_type);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_order_notes_order_tenant
  ON public.order_notes(order_id, tenant_id);
