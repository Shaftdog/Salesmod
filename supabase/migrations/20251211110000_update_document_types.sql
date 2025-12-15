-- Update document_type check constraint with appraisal-specific types

ALTER TABLE public.order_documents DROP CONSTRAINT IF EXISTS order_documents_document_type_check;

ALTER TABLE public.order_documents
ADD CONSTRAINT order_documents_document_type_check
CHECK (document_type IN (
  'engagement_letter',
  'order_form',
  'client_instructions',
  'title_report',
  'prior_appraisal',
  'purchase_contract',
  'contract_addenda',
  'flood_certification',
  'plans',
  'building_specs',
  'construction_budget',
  'permits',
  'rental_data',
  'other',
  -- Legacy types for backwards compatibility
  'appraisal_report',
  'inspection_report',
  'photos',
  'contract',
  'invoice',
  'comparable',
  'report',
  'photo'
));
