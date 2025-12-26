-- Create task for existing revision request (id: 60a43814-adc9-483e-9e0b-66f04280fd1b)
INSERT INTO production_tasks (
  production_card_id,
  title,
  description,
  stage,
  status,
  assigned_to,
  role,
  is_required,
  sort_order
) VALUES (
  '5fd7b080-b12d-4259-b44c-2be5e9639bae',
  'REVISION: Issue with Order ORD-202512-1007',
  'There is no location map in the report. Remove the word black throughout the report as it violates housing requirements. Third bedroom photo is missing.',
  'REVISION',
  'pending',
  'bde00714-427d-4024-9fbd-6f895824f733',
  'researcher_level_3',
  true,
  0
);
