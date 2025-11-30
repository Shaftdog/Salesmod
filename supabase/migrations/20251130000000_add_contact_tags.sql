-- =============================================
-- CONTACT_TAGS TABLE (Many-to-many relationship)
-- Mirrors client_tags structure for contacts
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
-- =============================================
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view contact tags
CREATE POLICY "Contact tags viewable by authenticated users"
  ON public.contact_tags FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage contact tags
CREATE POLICY "Authenticated users can manage contact tags"
  ON public.contact_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
