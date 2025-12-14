-- =============================================
-- CONTACT_TAGS TABLE (Many-to-many relationship)
-- Mirrors client_tags structure for contacts
-- Uses tenant isolation through contact's tenant_id
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id UUID REFERENCES public.contacts ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contact_tags_contact ON public.contact_tags(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(tag_id);

-- =============================================
-- ROW LEVEL SECURITY
-- Uses tenant isolation through the contact's tenant_id
-- =============================================
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- Allow users to view contact tags for contacts in their tenant
CREATE POLICY "contact_tags_tenant_select"
  ON public.contact_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Allow users to insert contact tags for contacts in their tenant
CREATE POLICY "contact_tags_tenant_insert"
  ON public.contact_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Allow users to delete contact tags for contacts in their tenant
CREATE POLICY "contact_tags_tenant_delete"
  ON public.contact_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id
      AND c.tenant_id IN (
        SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.contact_tags IS 'Many-to-many relationship between contacts and tags, with tenant isolation through contacts';
