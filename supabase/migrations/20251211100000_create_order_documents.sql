-- Migration: Create order_documents table for document storage
-- This implements actual document tracking for orders

-- =============================================
-- ORDER DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'appraisal_report',
    'inspection_report',
    'photos',
    'contract',
    'invoice',
    'comparable',
    'other'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Path in Supabase Storage
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_documents_tenant_id ON public.order_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_order_id ON public.order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_document_type ON public.order_documents(document_type);

-- Enable RLS
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant access
CREATE POLICY "Users can view documents in their tenant"
  ON public.order_documents FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents in their tenant"
  ON public.order_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in their tenant"
  ON public.order_documents FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- STORAGE BUCKET SETUP (run in Supabase Dashboard)
-- =============================================
-- Note: Create a storage bucket named 'order-documents' in Supabase Dashboard
-- with the following settings:
-- - Public: false (private bucket)
-- - File size limit: 10MB
-- - Allowed mime types: application/pdf, image/*, application/msword,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--   application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

-- Storage RLS policies (run in Supabase Dashboard SQL Editor):
/*
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-documents');

-- Allow authenticated users to read files in their tenant
CREATE POLICY "Users can view their tenant documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-documents');

-- Allow authenticated users to delete their tenant documents
CREATE POLICY "Users can delete their tenant documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'order-documents');
*/
