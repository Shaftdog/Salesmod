-- =====================================================
-- P1.1: DOCUMENTS LIBRARY
-- Central document storage with RAG integration
-- =====================================================

-- Document source types
DO $$ BEGIN
  CREATE TYPE document_source_type AS ENUM (
    'order_document',     -- Linked to order_documents table
    'gmail_attachment',   -- From Gmail ingestion
    'manual_upload',      -- User uploaded directly
    'generated'           -- System-generated (reports, exports)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Document categories (business-level classification)
DO $$ BEGIN
  CREATE TYPE document_category AS ENUM (
    'contract',
    'invoice',
    'sop',
    'bid_template',
    'email_attachment',
    'appraisal_report',
    'client_document',
    'internal',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extraction status for text processing
DO $$ BEGIN
  CREATE TYPE extraction_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'skipped'      -- For non-text files (images, etc.)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABLE: documents
-- Central document registry with text extraction
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- File metadata (mirrors order_documents for consistency)
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- Path in Supabase Storage
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Business metadata
  title TEXT,                         -- Human-readable title (defaults to file_name)
  description TEXT,
  category document_category NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',           -- User-defined tags for filtering

  -- Source tracking (where this document came from)
  source_type document_source_type NOT NULL,
  order_document_id UUID REFERENCES public.order_documents(id) ON DELETE SET NULL,
  gmail_message_id UUID,              -- Reference to gmail_messages (soft ref, may not have FK)
  gmail_attachment_id TEXT,           -- Gmail API attachment ID

  -- Text extraction
  extracted_text TEXT,                -- Full text content
  extraction_status extraction_status NOT NULL DEFAULT 'pending',
  extraction_error TEXT,              -- Error message if extraction failed
  extraction_attempted_at TIMESTAMPTZ,

  -- Embedding status (tracks if indexed in embeddings_index)
  is_indexed BOOLEAN DEFAULT false,
  indexed_at TIMESTAMPTZ,

  -- Audit fields
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON public.documents(tenant_id, source_type);
CREATE INDEX IF NOT EXISTS idx_documents_extraction_pending ON public.documents(extraction_status)
  WHERE extraction_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_documents_not_indexed ON public.documents(tenant_id, is_indexed)
  WHERE is_indexed = false AND extraction_status = 'completed';
CREATE INDEX IF NOT EXISTS idx_documents_order_document ON public.documents(order_document_id)
  WHERE order_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_gmail_message ON public.documents(gmail_message_id)
  WHERE gmail_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_tags ON public.documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(tenant_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
DROP POLICY IF EXISTS documents_tenant_isolation ON public.documents;
CREATE POLICY documents_tenant_isolation
  ON public.documents
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- TABLE: document_extraction_queue
-- Queue for async text extraction (MVP before Sandbox)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_extraction_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,

  -- Queue management
  priority INTEGER DEFAULT 0,         -- Higher = process first
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  -- Status tracking
  status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
  error_message TEXT,

  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(document_id)
);

CREATE INDEX IF NOT EXISTS idx_extraction_queue_pending ON public.document_extraction_queue(priority DESC, queued_at)
  WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_extraction_queue_tenant ON public.document_extraction_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extraction_queue_status ON public.document_extraction_queue(status);

ALTER TABLE public.document_extraction_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS extraction_queue_tenant_isolation ON public.document_extraction_queue;
CREATE POLICY extraction_queue_tenant_isolation
  ON public.document_extraction_queue
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to queue a document for extraction
CREATE OR REPLACE FUNCTION queue_document_extraction(
  p_document_id UUID,
  p_priority INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_queue_id UUID;
BEGIN
  -- Get tenant_id from document
  SELECT tenant_id INTO v_tenant_id FROM public.documents WHERE id = p_document_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Document not found: %', p_document_id;
  END IF;

  -- Insert into queue (upsert to handle re-queuing)
  INSERT INTO public.document_extraction_queue (tenant_id, document_id, priority)
  VALUES (v_tenant_id, p_document_id, p_priority)
  ON CONFLICT (document_id) DO UPDATE SET
    status = 'queued',
    priority = EXCLUDED.priority,
    attempts = 0,
    error_message = NULL,
    queued_at = NOW(),
    started_at = NULL,
    completed_at = NULL
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$;

-- Function to claim next document for extraction (for workers)
CREATE OR REPLACE FUNCTION claim_next_extraction()
RETURNS TABLE(
  queue_id UUID,
  document_id UUID,
  tenant_id UUID,
  file_path TEXT,
  mime_type TEXT,
  file_size BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    UPDATE public.document_extraction_queue q
    SET
      status = 'processing',
      started_at = NOW(),
      attempts = attempts + 1
    WHERE q.id = (
      SELECT q2.id
      FROM public.document_extraction_queue q2
      WHERE q2.status = 'queued'
        AND q2.attempts < q2.max_attempts
      ORDER BY q2.priority DESC, q2.queued_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING q.id, q.document_id, q.tenant_id
  )
  SELECT
    c.id as queue_id,
    c.document_id,
    c.tenant_id,
    d.file_path,
    d.mime_type,
    d.file_size
  FROM claimed c
  JOIN public.documents d ON d.id = c.document_id;
END;
$$;

-- Function to complete extraction
CREATE OR REPLACE FUNCTION complete_extraction(
  p_queue_id UUID,
  p_extracted_text TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document_id UUID;
BEGIN
  -- Get document_id from queue
  SELECT document_id INTO v_document_id
  FROM public.document_extraction_queue
  WHERE id = p_queue_id;

  IF v_document_id IS NULL THEN
    RAISE EXCEPTION 'Queue item not found: %', p_queue_id;
  END IF;

  -- Update queue status
  UPDATE public.document_extraction_queue
  SET
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    error_message = p_error_message
  WHERE id = p_queue_id;

  -- Update document
  UPDATE public.documents
  SET
    extracted_text = p_extracted_text,
    extraction_status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    extraction_error = p_error_message,
    extraction_attempted_at = NOW(),
    updated_at = NOW()
  WHERE id = v_document_id;
END;
$$;

-- Function to get documents pending embedding
CREATE OR REPLACE FUNCTION get_documents_pending_embedding(
  p_tenant_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  tenant_id UUID,
  title TEXT,
  file_name TEXT,
  extracted_text TEXT,
  category document_category,
  source_type document_source_type,
  tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.tenant_id,
    d.title,
    d.file_name,
    d.extracted_text,
    d.category,
    d.source_type,
    d.tags
  FROM public.documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.extraction_status = 'completed'
    AND d.is_indexed = false
    AND d.extracted_text IS NOT NULL
    AND LENGTH(d.extracted_text) > 0
  ORDER BY d.created_at ASC
  LIMIT p_limit;
END;
$$;

-- Function to mark document as indexed
CREATE OR REPLACE FUNCTION mark_document_indexed(
  p_document_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents
  SET
    is_indexed = true,
    indexed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_document_id;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.documents IS 'Central document registry for Documents Library (P1.1)';
COMMENT ON TABLE public.document_extraction_queue IS 'Async queue for text extraction processing';
COMMENT ON COLUMN public.documents.extracted_text IS 'Full text content extracted from document';
COMMENT ON COLUMN public.documents.is_indexed IS 'True if document has been indexed in embeddings_index for RAG';
COMMENT ON COLUMN public.documents.source_type IS 'Where this document originated: order_document, gmail_attachment, manual_upload, or generated';
COMMENT ON COLUMN public.documents.category IS 'Business classification: contract, invoice, sop, bid_template, etc.';
