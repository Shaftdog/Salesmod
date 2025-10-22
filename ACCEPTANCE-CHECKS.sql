-- =============================================
-- Migration Readiness - Acceptance SQL Checks
-- Run these queries to verify system is ready for production imports
-- =============================================

-- =============================================
-- PREFLIGHT CHECKS (Run BEFORE migration)
-- =============================================

-- 1. Check for existing duplicates that would violate new constraint
WITH duplicates AS (
  SELECT 
    org_id, 
    COALESCE(source, 'unknown') AS source, 
    external_id, 
    COUNT(*) AS count,
    STRING_AGG(id::text, ', ') AS order_ids
  FROM orders
  WHERE external_id IS NOT NULL
  GROUP BY 1, 2, 3
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;
-- Expected: 0 rows
-- If any rows returned, resolve duplicates manually before running migration

-- =============================================
-- POST-MIGRATION CHECKS
-- =============================================

-- 2. Verify org_id column exists and is populated
SELECT 
  COUNT(*) AS total_orders,
  COUNT(org_id) AS with_org_id,
  COUNT(*) FILTER (WHERE org_id IS NULL) AS null_org_id,
  ROUND(100.0 * COUNT(org_id) / NULLIF(COUNT(*), 0), 2) AS pct_with_org_id
FROM orders;
-- Expected: null_org_id = 0, pct_with_org_id = 100.00

-- 3. Verify unique constraint indexes exist
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'uq_orders_org_source_external',
  'uq_orders_order_number',
  'uq_contacts_email_lower',
  'uq_clients_domain_lower',
  'uq_properties_org_addrhash'
)
ORDER BY tablename, indexname;
-- Expected: 5 rows (all indexes present)

-- 4. Verify index is actually unique and partial
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname = 'uq_orders_org_source_external';
-- Expected: 1 row with:
-- indexdef LIKE '%UNIQUE%' AND 
-- indexdef LIKE '%COALESCE(source%' AND 
-- indexdef LIKE '%WHERE (external_id IS NOT NULL)%'

-- =============================================
-- DATA QUALITY CHECKS
-- =============================================

-- 5. Companies by role
SELECT 
  COALESCE(primary_role_code, 'unknown') AS role,
  COUNT(*) AS count
FROM clients 
GROUP BY 1 
ORDER BY 2 DESC;
-- Expected: Various roles with counts, no excessive 'unknown' values

-- 6. Contacts health metrics
SELECT 
  ROUND(100.0 * AVG((email IS NOT NULL AND email <> '')::int), 2) AS pct_with_email,
  ROUND(100.0 * AVG((client_id IS NOT NULL)::int), 2) AS pct_linked_company,
  ROUND(100.0 * AVG((primary_role_code IS NOT NULL)::int), 2) AS pct_with_role
FROM contacts;
-- Expected: 
--   pct_with_email >= 80%
--   pct_linked_company >= 70%
--   pct_with_role >= 50%

-- 7. Orders linked to properties
SELECT 
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE property_id IS NOT NULL) AS linked,
  COUNT(*) FILTER (WHERE property_id IS NULL) AS unlinked,
  ROUND(100.0 * COUNT(*) FILTER (WHERE property_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS pct_linked
FROM orders;
-- Expected: pct_linked increases after backfill runs

-- 8. Orders with external_id and source
SELECT 
  COUNT(*) AS total_orders,
  COUNT(*) FILTER (WHERE external_id IS NOT NULL) AS with_external_id,
  COUNT(*) FILTER (WHERE source IS NOT NULL) AS with_source,
  ROUND(100.0 * COUNT(*) FILTER (WHERE external_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS pct_with_external_id
FROM orders;
-- Expected: Most orders should have external_id (from imports)

-- 9. Duplicate properties (should be zero)
SELECT 
  org_id, 
  addr_hash, 
  COUNT(*) AS count,
  STRING_AGG(id::text, ', ') AS property_ids
FROM properties 
GROUP BY 1, 2 
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- 10. USPAP spot check (3-year prior work)
SELECT 
  o.id AS order_id,
  o.property_id,
  (o.props->'uspap'->>'prior_work_3y')::int AS cached_count,
  property_prior_work_count(o.property_id) AS dynamic_count,
  CASE 
    WHEN (o.props->'uspap'->>'prior_work_3y')::int = property_prior_work_count(o.property_id) 
    THEN '✓ Match'
    ELSE '✗ Mismatch'
  END AS status
FROM orders o
WHERE o.property_id IS NOT NULL
ORDER BY o.created_at DESC 
LIMIT 10;
-- Expected: All rows show '✓ Match' between cached and dynamic counts

-- =============================================
-- ROLE TAXONOMY CHECKS
-- =============================================

-- 11. Verify party_roles table is seeded
SELECT 
  category,
  COUNT(*) AS role_count,
  STRING_AGG(code, ', ' ORDER BY sort_order) AS sample_roles
FROM party_roles
WHERE is_active = true
GROUP BY category
ORDER BY MIN(sort_order);
-- Expected: 4-5 categories with 40+ total roles

-- 12. Check role distribution in contacts
SELECT 
  COALESCE(pr.label, 'Unknown') AS role_label,
  COUNT(*) AS contact_count
FROM contacts c
LEFT JOIN party_roles pr ON c.primary_role_code = pr.code
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;
-- Expected: Meaningful distribution, not all 'Unknown'

-- 13. Check role distribution in clients
SELECT 
  COALESCE(pr.label, 'Unknown') AS role_label,
  COUNT(*) AS client_count
FROM clients c
LEFT JOIN party_roles pr ON c.primary_role_code = pr.code
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;
-- Expected: Meaningful distribution, not all 'Unknown'

-- =============================================
-- ADDRESS VALIDATION CHECKS
-- =============================================

-- 14. Properties with validation status
SELECT 
  validation_status,
  COUNT(*) AS count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS pct
FROM properties
GROUP BY 1
ORDER BY 2 DESC;
-- Expected: Mix of 'verified', 'partial', NULL

-- 15. Address validation coverage
SELECT 
  COUNT(*) AS total_properties,
  COUNT(*) FILTER (WHERE validation_status IS NOT NULL) AS validated,
  COUNT(*) FILTER (WHERE validation_status = 'verified') AS verified,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS geocoded,
  ROUND(100.0 * COUNT(*) FILTER (WHERE validation_status = 'verified') / NULLIF(COUNT(*), 0), 2) AS pct_verified
FROM properties;
-- Expected: pct_verified increases as imports with validation run

-- =============================================
-- IDEMPOTENCY TEST QUERIES
-- =============================================

-- 16. Test: Find orders that would be duplicates with same (org, source, external_id)
SELECT 
  org_id,
  source,
  external_id,
  COUNT(*) AS count
FROM orders
WHERE external_id IS NOT NULL
GROUP BY 1, 2, 3
HAVING COUNT(*) > 1;
-- Expected: 0 rows after constraint is added

-- 17. Check migration job history
SELECT 
  entity,
  source,
  status,
  (totals->>'total')::int AS total,
  (totals->>'inserted')::int AS inserted,
  (totals->>'updated')::int AS updated,
  (totals->>'skipped')::int AS skipped,
  (totals->>'errors')::int AS errors,
  created_at
FROM migration_jobs
ORDER BY created_at DESC
LIMIT 10;
-- Expected: Recent successful migrations with reasonable totals

-- =============================================
-- PERFORMANCE CHECKS
-- =============================================

-- 18. Index usage stats (after some imports)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname IN (
  'uq_orders_org_source_external',
  'uq_contacts_email_lower',
  'uq_clients_domain_lower',
  'uq_properties_org_addrhash'
)
ORDER BY tablename, indexname;
-- Expected: Non-zero idx_scan values after imports run

-- =============================================
-- SECURITY CHECKS
-- =============================================

-- 19. Verify RLS is enabled on critical tables
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('orders', 'contacts', 'clients', 'properties', 'party_roles')
  AND schemaname = 'public'
ORDER BY tablename;
-- Expected: All tables have rls_enabled = true

-- 20. Check for orphaned records (data integrity)
SELECT 
  'Contacts without clients' AS check_type,
  COUNT(*) AS count
FROM contacts
WHERE client_id IS NULL
UNION ALL
SELECT 
  'Orders without clients' AS check_type,
  COUNT(*) AS count
FROM orders
WHERE client_id IS NULL
UNION ALL
SELECT 
  'Orders with property_id but no property' AS check_type,
  COUNT(*) AS count
FROM orders o
WHERE o.property_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM properties p WHERE p.id = o.property_id);
-- Expected: Counts should be reasonable (some NULL client_id is OK if flagged in props)

-- =============================================
-- SUMMARY STATISTICS
-- =============================================

-- 21. Overall system health
SELECT 
  'Total Clients' AS metric,
  COUNT(*)::text AS value
FROM clients
UNION ALL
SELECT 
  'Total Contacts' AS metric,
  COUNT(*)::text AS value
FROM contacts
UNION ALL
SELECT 
  'Total Orders' AS metric,
  COUNT(*)::text AS value
FROM orders
UNION ALL
SELECT 
  'Total Properties' AS metric,
  COUNT(*)::text AS value
FROM properties
UNION ALL
SELECT 
  'Orders with Properties' AS metric,
  COUNT(*)::text AS value
FROM orders
WHERE property_id IS NOT NULL
UNION ALL
SELECT 
  'Unique Constraints' AS metric,
  COUNT(*)::text AS value
FROM pg_indexes
WHERE indexname LIKE 'uq_%'
  AND tablename IN ('orders', 'contacts', 'clients', 'properties')
UNION ALL
SELECT 
  'Party Roles Defined' AS metric,
  COUNT(*)::text AS value
FROM party_roles
WHERE is_active = true;

-- =============================================
-- END OF ACCEPTANCE CHECKS
-- =============================================

-- Notes:
-- - Run preflight checks BEFORE migration
-- - Run post-migration checks AFTER migration
-- - Run data quality checks periodically
-- - All queries should return expected results for production readiness


