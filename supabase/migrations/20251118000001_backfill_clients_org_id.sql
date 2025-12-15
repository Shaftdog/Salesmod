-- Backfill clients org_id
-- This migration was applied via script on 2025-11-18
-- Documenting here for migration history

-- Summary:
-- Fixed 11 clients that had org_id = NULL
-- All assigned to primary organization (rod@myroihome.com)
-- Cascaded to 7 contacts automatically

-- The fix was executed via scripts/fix-clients-org-id.js
-- This file serves as documentation of the migration

-- Verification queries:
-- SELECT COUNT(*) FROM clients WHERE org_id IS NULL; -- Should be 0
-- SELECT COUNT(*) FROM contacts WHERE org_id IS NULL; -- Should be 0

-- Affected clients:
-- 1. Canopy Mortgage, LLC (1bb0a6ef-f9bf-495c-9d67-90d1431ac748)
-- 2. I Fund Cities (cb912b42-fa3b-4e09-8d03-88c4d9a79d66)
-- 3. American Reporting Company (21e60fe6-b992-47a4-bbee-fe24f7332932)
-- 4. Rocket Close (43b79301-cd14-4c2b-a09d-2d3b89249154)
-- 5. Marcus Ellington (029de142-f156-4888-884f-007e9880773e)
-- 6. ZAP Appraisals, LLC (fb4658bd-bc13-440e-a628-399185f46810)
-- 7. MoFin Lending (3f42a1a1-ddd6-4aaf-b2da-fc9a898eae35)
-- 8. KB Home (50215aac-d810-46ac-87bb-cd202a17fda4)
-- 9. Ascribe Valuations, LLC (1d8087cc-ec06-494b-963c-5af5ec0e4e75)
-- 10. Source Appraisal Management, LLC (1820a5cd-d151-4371-a299-ce53ae1543bd)
-- 11. Guardian Asset Management (8196a2a3-8842-4bd4-85e7-494dc4968d4a)

-- All assigned to org_id: bde00714-427d-4024-9fbd-6f895824f733 (rod@myroihome.com)

-- Affected contacts (7 total):
-- 1. adam@sourceam.com
-- 2. appraisals@canopymortgage.com (critical - was causing RLS failures)
-- 3. vendormgmt@ascribeval.com
-- 4. phernandez@ascribeval.com
-- 5. rluis@ascribeval.com
-- 6. orlandoappraisals@kbhome.com
-- 7. cody.kitson@guardianassetmgt.com

-- Results:
-- Clients with org_id: 382/382 (100%)
-- Contacts with org_id: 721/721 (100%)
-- Success rate: 100%

-- This migration is already applied via script
-- No SQL needs to be executed here
-- This file is for documentation purposes only

-- Add comment to document the backfill
COMMENT ON COLUMN clients.org_id IS 'Organization that owns this client. Required for RLS. Backfilled on 2025-11-18 for 11 clients.';
COMMENT ON COLUMN contacts.org_id IS 'Organization that owns this contact. Backfilled from client relationship on 2025-11-18 for 7 contacts.';
